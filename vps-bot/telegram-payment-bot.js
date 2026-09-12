import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// KONFIGURASI BOT & SERVICE VPS
// ==============================================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8946135531:AAF7XxekBfzesHM5RxAOgP_EgotKSOFXh_s';
const ADMIN_CHAT_ID = parseInt(process.env.ADMIN_CHAT_ID || '8971674377', 10);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://api.ujianpintar.online';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODc5MTY0MjQsImV4cCI6MjEwMzI3NjQyNH0.-Zu1ZjsJ4wDzMVh00MunYCVwPaVnwbOJdLe58NSmpQg';

// WAHA (Otomatis mendeteksi jika dijalankan di Laptop Windows atau di VPS Linux)
const WAHA_BASE_URL = process.env.WAHA_BASE_URL || (process.platform === 'win32' ? 'http://103.150.226.233:3080' : 'http://localhost:3080');
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'WahaUjianPintar2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

let offset = 0;

console.log('🤖 Telegram Admin Bot Service running for UjianPintar / Guru Hebat...');
console.log(`📡 Listening for admin commands from Chat ID: ${ADMIN_CHAT_ID}`);
console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
console.log(`📱 WAHA URL: ${WAHA_BASE_URL}`);

// ==============================================================================
// TELEGRAM API HELPERS
// ==============================================================================
async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) payload.reply_markup = replyMarkup;

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending Telegram message:', err.message);
  }
}

async function answerCallbackQuery(callbackQueryId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: true
      })
    });
  } catch (err) {
    console.error('Error answering callback query:', err.message);
  }
}

async function editTelegramMessageText(chatId, messageId, newText, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'HTML'
    };
    if (replyMarkup !== null) {
      payload.reply_markup = replyMarkup;
    }
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Error editing message text:', err.message);
  }
}

// ==============================================================================
// WAHA WHATSAPP NOTIFICATION HELPER (FAIL-SAFE)
// ==============================================================================
async function sendWhatsAppNotification(rawPhone, messageText) {
  if (!rawPhone) return { success: false, reason: 'No phone number provided' };

  try {
    // Normalisasi format nomor: 08... -> 628...
    let clean = rawPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const chatId = `${clean}@c.us`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

    const res = await fetch(`${WAHA_BASE_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        chatId: chatId,
        text: messageText,
        session: 'default'
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));
    console.log(`📲 WAHA WhatsApp sent to ${chatId}:`, data);
    return { success: true, data };
  } catch (err) {
    console.warn(`⚠️ WAHA Send skipped/offline (${rawPhone}):`, err.message);
    // Return graceful failure so activation in Supabase is NEVER blocked
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// SUBSCRIPTION ACTIVATION LOGIC
// ==============================================================================
async function activateTransaction(transactionId, daysToAdd = 365) {
  const now = new Date();
  const newExpiry = new Date();
  newExpiry.setDate(now.getDate() + daysToAdd);

  // 1. Ambil data transaksi dari Supabase
  const { data: trx, error: fetchErr } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (fetchErr || !trx) {
    console.error(`Transaction ${transactionId} not found:`, fetchErr);
    return { success: false, error: fetchErr || new Error('Transaksi tidak ditemukan') };
  }

  const cleanEmail = (trx.customer_email || '').toLowerCase().trim();
  const tier = trx.tier || 'pro';

  // 2. Update status pembayaran menjadi 'paid'
  const { error: updateTrxErr } = await supabase
    .from('payment_transactions')
    .update({
      status: 'paid',
      paid_at: now.toISOString(),
      approved_by: 'Telegram Admin Bot'
    })
    .eq('id', transactionId);

  if (updateTrxErr) {
    console.error('Failed to update transaction status:', updateTrxErr);
  }

  // 3. Update profil guru di tabel profiles
  if (cleanEmail) {
    try {
      let profileId = trx.teacher_id;
      if (!profileId) {
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const found = usersData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (found) profileId = found.id;
      }

      if (profileId) {
        await supabase.from('profiles').update({
          role: 'pro',
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_expires_at: newExpiry.toISOString(),
          subscription_started_at: now.toISOString(),
          updated_at: now.toISOString()
        }).eq('id', profileId);
        console.log(`✅ Profile ${profileId} (${cleanEmail}) updated to PRO in database`);
      }
    } catch (e) {
      console.warn('Profile table update warning:', e.message);
    }
  }

  // 4. Kirim Pesan Konfirmasi Otomatis via WAHA ke WhatsApp Guru
  if (trx.customer_whatsapp) {
    const expiryFormatted = newExpiry.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const totalRupiah = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(trx.total_amount || trx.base_amount);

    const waMsg = `🎉 *PEMBAYARAN DITERIMA & AKUN DIAKTIFKAN!*
━━━━━━━━━━━━━━━━━━━
Halo Bapak/Ibu *${trx.customer_name || 'Guru Hebat'}*,

Pembayaran untuk lisensi *${trx.plan_name}* telah berhasil kami verifikasi. Akun Anda kini telah aktif resmi!

📋 *No. Invoice:* ${trx.invoice_number}
✨ *Status:* *AKTIF (${tier.toUpperCase()})*
📅 *Masa Berlaku:* s/d *${expiryFormatted}* (${daysToAdd} Hari)
💰 *Total Dibayar:* ${totalRupiah}

Sekarang Anda dapat menikmati seluruh fitur unggulan UjianPintar tanpa batas:
✅ Ujian & Siswa Tanpa Batas (Unlimited)
✅ Pengawasan Anti-Curang (Fullscreen Lock)
✅ Ekspor Rekap Nilai Raport Excel (.xlsx) & CSV
✅ Editor Rumus Matematika LaTeX tak terbatas

Buka Portal Ujian: https://ujianpintar.online

_Terima kasih telah mempercayai UjianPintar sebagai solusi asesmen digital sekolah Anda. Selamat mengajar!_`;

    sendWhatsAppNotification(trx.customer_whatsapp, waMsg).catch((e) => {
      console.warn('WAHA Notification background error:', e);
    });
  }

  return { 
    success: true, 
    newExpiry, 
    trx, 
    daysToAdd 
  };
}

async function rejectTransaction(transactionId) {
  const now = new Date();
  const { error } = await supabase
    .from('payment_transactions')
    .update({
      status: 'rejected',
      notes: `Ditolak oleh Admin Bot pada ${now.toISOString()}`
    })
    .eq('id', transactionId);

  return { success: !error, error };
}

// ==============================================================================
// COMMAND HANDLER
// ==============================================================================
async function handleCommand(chatId, text) {
  const parts = text.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const arg1 = parts[1];
  const arg2 = parts[2];

  if (command === '/start' || command === '/help') {
    const helpMsg = `🤖 <b>ADMIN BOT UJIANPINTAR / GURU HEBAT</b>
━━━━━━━━━━━━━━━━━━━
Selamat datang Admin! Bot ini mengelola verifikasi transfer DANA dan aktivasi lisensi guru secara otomatis.

⚡ <b>Perintah Tersedia:</b>
• <code>/pending</code> - Lihat transaksi menunggu konfirmasi
• <code>/status [email]</code> - Cek status lisensi guru
• <code>/aktifkan [email] [hari]</code> - Aktivasi manual akun guru
  <i>Contoh: <code>/aktifkan guru@sekolah.sch.id 365</code></i>
• <code>/nonaktifkan [email]</code> - Nonaktifkan lisensi guru

💡 <i>Notifikasi pesanan baru dari website akan otomatis masuk ke sini lengkap dengan tombol persetujuan 1-klik!</i>`;
    await sendTelegramMessage(chatId, helpMsg);
    return;
  }

  if (command === '/pending') {
    const { data: list, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !list || list.length === 0) {
      await sendTelegramMessage(chatId, 'ℹ️ Tidak ada transaksi pending transfer saat ini.');
      return;
    }

    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      const nominal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.total_amount);
      const days = t.billing_cycle === 'yearly' ? 365 : 30;

      const singleMsg = `📋 <b>${i + 1}. ${t.customer_name}</b>\n• Inv: <code>${t.invoice_number}</code>\n• Paket: <b>${t.plan_name}</b>\n• Nominal: <b>${nominal}</b> (Kode: ${t.unique_code})\n• Email: <code>${t.customer_email}</code>\n• WA: ${t.customer_whatsapp || '-'}`;

      await sendTelegramMessage(chatId, singleMsg, {
        inline_keyboard: [
          [
            { text: `✅ Setujui (${days} Hari)`, callback_data: `approve_${days}_${t.id}` },
            { text: '❌ Tolak', callback_data: `reject_${t.id}` }
          ]
        ]
      });
    }
    return;
  }

  if (command === '/status') {
    if (!arg1) {
      await sendTelegramMessage(chatId, '⚠️ Gunakan format: <code>/status [email_guru]</code>');
      return;
    }
    const cleanEmail = arg1.toLowerCase().trim();
    const { data: trxList } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('customer_email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!trxList || trxList.length === 0) {
      await sendTelegramMessage(chatId, `ℹ️ Belum ada riwayat transaksi untuk <code>${cleanEmail}</code>.`);
      return;
    }

    let msg = `ℹ️ <b>RIWAYAT TRANSAKSI GURU</b>\n━━━━━━━━━━━━━━━━━━━\n👤 Email: <code>${cleanEmail}</code>\n\n`;
    trxList.forEach((t, idx) => {
      msg += `<b>${idx + 1}. ${t.plan_name}</b> - Status: <b>${t.status.toUpperCase()}</b>\n   • Inv: <code>${t.invoice_number}</code>\n   • Nominal: Rp ${t.total_amount?.toLocaleString('id-ID')}\n   • Waktu: ${new Date(t.created_at).toLocaleDateString('id-ID')}\n\n`;
    });
    await sendTelegramMessage(chatId, msg);
    return;
  }

  if (command === '/aktifkan') {
    if (!arg1) {
      await sendTelegramMessage(chatId, '⚠️ Format salah. Gunakan: <code>/aktifkan [email] [jumlah_hari]</code>');
      return;
    }
    const days = parseInt(arg2, 10) || 365;
    const cleanEmail = arg1.toLowerCase().trim();
    const now = new Date();
    const newExpiry = new Date();
    newExpiry.setDate(now.getDate() + days);

    await supabase.from('payment_transactions').insert({
      id: `trx-manual-${Date.now()}`,
      invoice_number: `INV-MANUAL-${Date.now().toString().slice(-6)}`,
      customer_name: cleanEmail.split('@')[0],
      customer_email: cleanEmail,
      plan_id: 'pro',
      plan_name: 'Guru PRO (Manual Admin)',
      tier: 'pro',
      billing_cycle: days >= 300 ? 'yearly' : 'monthly',
      base_amount: 180000,
      total_amount: 180000,
      status: 'paid',
      paid_at: now.toISOString(),
      approved_by: 'Manual Telegram Command'
    });

    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const found = usersData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (found?.id) {
        await supabase.from('profiles').update({
          role: 'pro',
          subscription_tier: 'pro',
          subscription_status: 'active',
          subscription_expires_at: newExpiry.toISOString(),
          subscription_started_at: now.toISOString(),
          updated_at: now.toISOString()
        }).eq('id', found.id);
        console.log(`✅ Profile ${found.id} (${cleanEmail}) updated to PRO via /aktifkan`);
      }
    } catch (err) {
      console.warn('Manual activation profile update warning:', err.message);
    }

    const expStr = newExpiry.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    await sendTelegramMessage(chatId, `🎉 <b>AKTIVASI MANUAL BERHASIL!</b>\n━━━━━━━━━━━━━━━━━━━\n👤 <b>Email:</b> <code>${cleanEmail}</code>\n📅 <b>Aktif s/d:</b> ${expStr} (${days} Hari)\n✨ <b>Status:</b> <b>ACTIVE PRO</b>`);
    return;
  }

  await sendTelegramMessage(chatId, '❓ Perintah tidak dikenali. Ketik <code>/help</code> untuk melihat panduan.');
}

// ==============================================================================
// CALLBACK QUERY HANDLER (TOMBOL INLINE DI TELEGRAM)
// ==============================================================================
async function handleCallbackQuery(cb) {
  try {
    const cbId = cb.id;
    const data = cb.data;
    const message = cb.message;
    const chatId = message?.chat?.id;
    const messageId = message?.message_id;

    if (!data || !chatId || !messageId) return;

    if (data.startsWith('approve_') || data.startsWith('reject_')) {
      const isApprove = data.startsWith('approve_');
      const parts = data.split('_');
      const days = isApprove ? (parseInt(parts[1], 10) || 365) : 0;
      const trxId = isApprove ? parts.slice(2).join('_') : data.replace('reject_', '');

      // 1. Cek apakah transaksi sudah pernah disetujui sebelumnya
      const { data: existingTrx } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', trxId)
        .maybeSingle();

      if (existingTrx && (existingTrx.status === 'paid' || existingTrx.status === 'rejected')) {
        await answerCallbackQuery(cbId, `⚠️ Transaksi ini sudah diproses sebelumnya (${existingTrx.status.toUpperCase()})`);
        const statusText = `📋 <b>INVOICE: ${existingTrx.invoice_number}</b>\n👤 <b>Guru:</b> ${existingTrx.customer_name}\n📦 <b>Paket:</b> ${existingTrx.plan_name}\n━━━━━━━━━━━━━━━━━━━\n⚠️ <i>(Transaksi ini sudah diproses sebelumnya: <b>${existingTrx.status.toUpperCase()}</b>)</i>`;
        await editTelegramMessageText(chatId, messageId, statusText, { inline_keyboard: [] });
        return;
      }

      if (isApprove) {
        await answerCallbackQuery(cbId, `Memproses aktivasi ${days} hari...`);
        const res = await activateTransaction(trxId, days);

        if (res.success && res.trx) {
          const expStr = res.newExpiry.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
          const nominalStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(res.trx.total_amount || res.trx.base_amount);

          const updatedText = `📋 <b>INVOICE: ${res.trx.invoice_number}</b>
👤 <b>Guru:</b> ${res.trx.customer_name}
📧 <b>Email:</b> <code>${res.trx.customer_email}</code>
🏫 <b>Sekolah:</b> ${res.trx.customer_school || '-'}
📱 <b>WhatsApp:</b> ${res.trx.customer_whatsapp || '-'}
📦 <b>Paket:</b> <b>${res.trx.plan_name}</b>
💰 <b>Total:</b> <b>${nominalStr}</b>
━━━━━━━━━━━━━━━━━━━
✅ <b>TELAH DISETUJUI & AKTIF PRO!</b>
📅 <b>Masa Aktif s/d:</b> <b>${expStr} (${days} Hari)</b>
⏰ <b>Waktu Persetujuan:</b> ${new Date().toLocaleTimeString('id-ID')}`;

          await editTelegramMessageText(chatId, messageId, updatedText, { inline_keyboard: [] });
          await sendTelegramMessage(chatId, `🎉 <b>Aktivasi Sukses!</b> Akun <code>${res.trx.customer_email}</code> telah resmi menjadi PRO hingga ${expStr}. Browser guru otomatis aktif realtime!`);
        } else {
          await sendTelegramMessage(chatId, `❌ Gagal memproses transaksi: ${res.error?.message || 'Error tidak diketahui'}`);
        }
      } else {
        await answerCallbackQuery(cbId, 'Transaksi Dibatalkan');
        await rejectTransaction(trxId);
        const updatedText = `❌ <b>TRANSAKSI DITOLAK / DIBATALKAN</b>\nID: <code>${trxId}</code>\n⏰ Waktu: ${new Date().toLocaleTimeString('id-ID')}`;
        await editTelegramMessageText(chatId, messageId, updatedText, { inline_keyboard: [] });
      }
    }
  } catch (err) {
    console.error('Error handling callback query:', err);
    try {
      await answerCallbackQuery(cb.id, `Terjadi kesalahan: ${err.message}`);
    } catch {}
  }
}

// ==============================================================================
// LONG POLLING LOOP
// ==============================================================================
async function pollTelegramUpdates() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`);
    const json = await res.json();

    if (json.ok && json.result && json.result.length > 0) {
      for (const update of json.result) {
        offset = update.update_id + 1;

        if (update.message && update.message.chat && update.message.chat.id === ADMIN_CHAT_ID) {
          if (update.message.text) {
            await handleCommand(update.message.chat.id, update.message.text);
          }
        }

        if (update.callback_query && update.callback_query.message && update.callback_query.message.chat && update.callback_query.message.chat.id === ADMIN_CHAT_ID) {
          await handleCallbackQuery(update.callback_query);
        }
      }
    }
  } catch (err) {
    console.error('Error in polling loop:', err.message);
  }

  setTimeout(pollTelegramUpdates, 1500);
}

// Start bot
pollTelegramUpdates();

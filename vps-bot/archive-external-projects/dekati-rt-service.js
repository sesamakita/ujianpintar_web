// dekati-rt-service.js
/**
 * Modul Integrasi Dua Arah Rekomendasi / Pengantar RT Sistem DEKATI
 * Memproses balasan WhatsApp dari Ketua RT (Ketik "1" = Setuju, "2" = Tolak)
 * dan otomatis memperbarui status permohonan surat warga di database Supabase DEKATI.
 */

import { createClient } from '@supabase/supabase-js';

const DEKATI_SUPABASE_URL = process.env.DEKATI_SUPABASE_URL || 'https://jaqvxcnrqodumydeqlao.supabase.co';
const DEKATI_SUPABASE_KEY = process.env.DEKATI_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXZ4Y25ycW9kdW15ZGVxbGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDQ2ODUsImV4cCI6MjEwNTQyMDY4NX0.mwQ82XT2oz4NQAld6RuXaOBiePydEFaooOq8s7_ZMEo';

let dekatiClient = null;
try {
  dekatiClient = createClient(DEKATI_SUPABASE_URL, DEKATI_SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  console.log('[DEKATI-RT] 🔗 Supabase Client DEKATI siap terhubung.');
} catch (err) {
  console.warn('[DEKATI-RT] Inisialisasi Supabase DEKATI dilewati:', err.message);
}

/**
 * Memeriksa dan memproses apakah pesan masuk adalah konfirmasi rekomendasi RT
 * @param {string} from - WhatsApp ID pengirim (contoh: 6281234567890@c.us)
 * @param {string} rawText - Isi teks pesan masuk
 * @param {Function} sendReplyFn - Fungsi pengirim pesan balasan WAHA
 * @returns {Promise<boolean>} true jika ditangani oleh DEKATI, false jika bukan
 */
export async function handleDekatiRtReply(from, rawText, sendReplyFn) {
  if (!rawText || !dekatiClient) return false;

  const text = rawText.trim();
  const cleanPhone = from.replace(/[^0-9]/g, '');

  // Cek apakah pesan diawali angka 1 atau 2, atau kata setuju / tolak
  const isApprove = /^(1\b|1[\s.:,-]|setuju|rekomendasi)/i.test(text);
  const isReject = /^(2\b|2[\s.:,-]|tolak|batalkan)/i.test(text);

  if (!isApprove && !isReject) {
    return false; // Bukan format balasan RT, biarkan bot UjianPintar memproses jika ada
  }

  // Variasi nomor HP untuk pencocokan (08... vs 628...)
  const phoneVariants = [
    cleanPhone,
    cleanPhone.startsWith('62') ? '0' + cleanPhone.slice(2) : cleanPhone,
    cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone,
  ];

  try {
    // 1. Ambil permohonan surat yang sedang menunggu konfirmasi RT
    const { data: letters, error } = await dekatiClient
      .from('letter_requests')
      .select('*')
      .eq('status', 'pending_rt')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DEKATI-RT] Query pending_rt Supabase:', error.message);
      return false;
    }

    if (!letters || letters.length === 0) {
      return false;
    }

    // 2. Cocokkan surat berdasarkan nomor HP Ketua RT pengirim
    let matchedLetter = letters.find((l) => {
      const lPhone = (l.rt_leader_phone || '').replace(/[^0-9]/g, '');
      return lPhone && phoneVariants.some((p) => p === lPhone);
    });

    // Fallback: Jika hanya ada 1 surat pending_rt di desa, cocokkan langsung
    if (!matchedLetter && letters.length === 1) {
      matchedLetter = letters[0];
    }

    if (!matchedLetter) {
      return false;
    }

    const nowIso = new Date().toISOString();
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const extraNote = text.replace(/^[12][\s.:,-]*/, '').trim();

    // Olah timeline
    let existingTimeline = Array.isArray(matchedLetter.timeline) ? [...matchedLetter.timeline] : [];

    if (isApprove) {
      existingTimeline = existingTimeline.map((step) => {
        if (step.title.toLowerCase().includes('rt') || step.title.toLowerCase().includes('rekomendasi')) {
          return {
            ...step,
            title: `Disetujui & Direkomendasikan Ketua RT ${matchedLetter.rt_number || ''}`,
            time: nowTimeStr,
            done: true,
            actor: matchedLetter.rt_leader_name || `Ketua RT ${matchedLetter.rt_number || ''}`
          };
        }
        return step;
      });

      // Update Supabase DEKATI
      const { error: updErr } = await dekatiClient
        .from('letter_requests')
        .update({
          status: 'submitted',
          rt_status: 'approved_by_rt',
          rt_approved_at: nowIso,
          rt_notes: extraNote || 'Disetujui via WhatsApp',
          timeline: existingTimeline,
          updated_at: nowIso
        })
        .eq('id', matchedLetter.id);

      if (updErr) {
        console.error('[DEKATI-RT] Gagal update approve ke Supabase:', updErr.message);
      }

      // Kirim pesan balasan konfirmasi ke Ketua RT
      await sendReplyFn(from, 
`✅ *REKOMENDASI RT DITERIMA*

Terima kasih Bapak/Ibu *${matchedLetter.rt_leader_name || 'Ketua RT'}*.
Rekomendasi Anda untuk permohonan surat warga telah dicatat:
• No. Registrasi: *${matchedLetter.tracking_number}*
• Nama Pemohon: *${matchedLetter.citizen_name}*
• Jenis Surat: *${matchedLetter.letter_name}*
${extraNote ? `• Catatan Anda: "${extraNote}"\n` : ''}
Status: *TELAH DISETUJUI & DIREKOMENDASIKAN*.
Permohonan kini otomatis diteruskan ke Petugas Kantor Desa untuk pemeriksaan syarat dan penerbitan surat resmi. Terima kasih atas kerjasamanya.`);

      console.log(`[DEKATI-RT] ✅ Surat ${matchedLetter.tracking_number} disetujui Ketua RT (${cleanPhone})`);
      return true;

    } else if (isReject) {
      existingTimeline = existingTimeline.map((step) => {
        if (step.title.toLowerCase().includes('rt') || step.title.toLowerCase().includes('rekomendasi')) {
          return {
            ...step,
            title: `Ditolak oleh Ketua RT ${matchedLetter.rt_number || ''}`,
            time: nowTimeStr,
            done: true,
            actor: matchedLetter.rt_leader_name || `Ketua RT ${matchedLetter.rt_number || ''}`
          };
        }
        return step;
      });

      // Update Supabase DEKATI
      const rejectionReason = extraNote || 'Permohonan tidak direkomendasikan / ditolak oleh Ketua RT setempat.';
      const { error: updErr } = await dekatiClient
        .from('letter_requests')
        .update({
          status: 'rejected',
          rt_status: 'rejected_by_rt',
          rejection_reason: rejectionReason,
          timeline: existingTimeline,
          updated_at: nowIso
        })
        .eq('id', matchedLetter.id);

      if (updErr) {
        console.error('[DEKATI-RT] Gagal update reject ke Supabase:', updErr.message);
      }

      // Kirim pesan balasan konfirmasi ke Ketua RT
      await sendReplyFn(from, 
`❌ *PENOLAKAN REKOMENDASI RT DICATAT*

Konfirmasi penolakan Anda telah dicatat:
• No. Registrasi: *${matchedLetter.tracking_number}*
• Nama Pemohon: *${matchedLetter.citizen_name}*
• Alasan: ${rejectionReason}

Permohonan surat telah dihentikan/ditolak di sistem kantor desa sesuai arahan Bapak/Ibu Ketua RT. Terima kasih.`);

      console.log(`[DEKATI-RT] ❌ Surat ${matchedLetter.tracking_number} ditolak Ketua RT (${cleanPhone})`);
      return true;
    }
  } catch (err) {
    console.error('[DEKATI-RT] Error memproses balasan RT:', err.message);
  }

  return false;
}

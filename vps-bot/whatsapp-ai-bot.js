/**
 * WhatsApp AI Bot Service untuk UjianPintar
 * 
 * Bot ini mendengarkan webhook pesan masuk dari WAHA (WhatsApp HTTP API) di VPS,
 * memproses pertanyaan pengunjung/guru menggunakan AI (Google Gemini / Groq / DeepSeek / Fallback KB),
 * dan membalas otomatis di chat WhatsApp dalam hitungan detik.
 * 
 * Terintegrasi langsung dengan Dashboard Super Admin (bisa dikontrol dari portal Super Admin).
 * Dilengkapi fitur:
 * - Dynamic Settings (bot-settings.json & .env sync)
 * - Auto-reply Master Switch (Bisa dinyalakan/dimatikan dari Super Admin)
 * - Human Handover (Jika Anda membalas manual dari HP Anda, bot otomatis jeda)
 * - Cooldown Anti-Spam
 * - API Simulator & Healthcheck
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Helper Membaca .env secara Mandiri
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch (e) {
      console.warn('Gagal membaca .env:', e.message);
    }
  }
}
loadEnv();

// 2. Default Knowledge Base & System Prompt (Disinkronkan 100% dengan Buku Induk: PANDUAN_LENGKAP_UJIAN_PINTAR.md)
const DEFAULT_SYSTEM_PROMPT = `Anda adalah "Tim Layanan & Konsultan Pendidikan Resmi UjianPintar" (https://ujianpintar.online).
Tugas utama Anda adalah melayani dan menjawab pertanyaan guru, kepala sekolah, proktor, pengawas, maupun siswa dengan gaya bahasa yang SANGAT RAMAH, HANGAT, SANTUN, SOLUTIF, dan HUMANIS layaknya staf konsultan pendidikan manusia asli (bukan robot).

PEDOMAN UTAMA KOMUNIKASI HUMANIS & MANUSIAWI:
1. Sapaan & Sikap yang Bersahabat:
   - Selalu sapa pengguna dengan hangat: "Halo Bapak/Ibu Guru!", "Selamat pagi/siang Bapak/Ibu!", atau "Halo Adik!" (jika siswa).
   - Gunakan bahasa percakapan sehari-hari yang santun, luwes, dan bersahabat. Hindari bahasa yang kaku, dingin, atau mekanis.
   - Bersikaplah empatik, menghargai dedikasi bapak/ibu guru, dan berikan solusi praktis dengan penuh semangat.

2. PANTANGAN MUTLAK (DILARANG KERAS MENAMPILKAN KODE / TEKNIKAL):
   - JANGAN PERNAH menampilkan potongan kode pemrograman (seperti JavaScript, TypeScript, Rust, SQL, HTML, Python, dsb.).
   - JANGAN PERNAH menyebutkan nama berkas koding internal (seperti file berakhiran .ts, .tsx, .js, .rs), path folder (seperti D:\\..., src/..., /var/...), ataupun nama tabel database (seperti auth.users, profiles, exams, dsb.).
   - Pengguna Anda adalah Pendidik (Guru & Kepala Sekolah) dan Siswa — mereka BUKAN programmer.
   - Terjemahkan setiap informasi teknis dari Buku Induk menjadi penjelasan manfaat praktis dan langkah penggunaan yang mudah dipahami orang awam.
   - Contoh:
     * Jangan sebut: "expo-screen-capture pada useAntiCheat.ts"
       Katakan: "Aplikasi UjianPintar secara otomatis mengunci layar HP siswa, sehingga siswa tidak dapat melakukan tangkapan layar (screenshot), merekam layar, ataupun berpindah ke aplikasi lain selama ujian berlangsung."
     * Jangan sebut: "import parser XLSX SheetJS"
       Katakan: "Bapak/Ibu cukup unggah file soal dalam format Microsoft Word (.docx) atau Excel (.xlsx), dan sistem kami akan langsung membaca soal serta kunci jawabannya secara otomatis."

3. Struktur Balasan WhatsApp yang Nyaman Dibaca di HP:
   - Buka dengan salam dan sapaan yang ramah.
   - Sajikan poin-poin penjelasan penting secara ringkas, padat, dan jelas (gunakan tanda bintang *tebal* dan emoji secukupnya agar rapi).
   - Tutup pesan dengan santun, hangat, dan siap membantu jika ada pertanyaan lebih lanjut.

4. PRIVASI MUTLAK PEMILIK PLATFORM (DILARANG KERAS MENYEBUT SUPER ADMIN):
   - Ruang dan panel "Super Admin" (/super-admin) adalah RUANG PRIVASI TERTUTUP PEMILIK PLATFORM (untuk manajemen internal server, setelan token AI, chatbot, dan database).
   - JANGAN PERNAH menyebut istilah "Super Admin", rute "/super-admin", ataupun panel internal pemilik platform kepada pengguna luar dalam situasi dan jawaban APA PUN!
   - Pengguna luar (Guru, Kepala Sekolah, Siswa, dsb) hanya mengenal:
     * Web Portal Guru (https://ujianpintar.online/portal)
     * Aplikasi Mobile APK Android UjianPintar (untuk Siswa & Pengawas)
     * Tim Layanan & Hotline Admin UjianPintar ({ADMIN_NAME} - {ADMIN_PHONE})
   - Jika pengguna luar bertanya tentang bantuan teknis khusus, lisensi sekolah, MoU dinas, atau aktivasi paket, arahkan mereka dengan ramah ke Tim Layanan & Hotline Admin resmi.

BUKU INDUK & REFERENSI TUNGGAL PLATFORM UJIANPINTAR:
1. Tentang Platform & Pembagian Peran Pengguna:
   - Platform CBT Asesmen Sekolah Modern Berbasis HP (Aplikasi Mobile APK Android "Ujian Pintar") & Komputer/Laptop (Web Portal Guru di https://ujianpintar.online/portal).
   - Guru: Mengakses Web Portal untuk membuat bank soal, menjadwalkan ujian, membagikan Token 6-digit & PIN Pengawas 6-digit, memantau pengawasan live (Live Proctoring), penilaian esai AI, dan mengunduh rekap nilai (Excel/CSV).
   - Siswa: Mengakses Aplikasi Mobile APK Android "Ujian Pintar" memakai Token Ujian 6 digit + NISN untuk mengerjakan ujian dalam kondisi layar terkunci anti-curang.
   - Pengawas / Proktor: Mengakses Aplikasi Mobile APK Android mode pengawas memakai PIN Pengawas 6 digit untuk memantau telemetri seluruh siswa secara live, mengirim teguran ke layar siswa, menambah durasi ujian, atau submit paksa jika ada yang curang.

2. Fitur Keamanan Anti-Curang (Anti-Cheat & Proctoring):
   - Kunci Layar Penuh (Fullscreen Lock) & Anti-Screenshot: Layar aplikasi HP siswa otomatis terkunci penuh; siswa tidak bisa keluar, browsing, screenshot, atau rekam layar.
   - Deteksi Beralih Aplikasi / Pindah Tab: Sistem otomatis mencatat setiap kali siswa mencoba membuka aplikasi lain atau fitur split-screen (catatan pelanggaran).
   - Acak Soal & Opsi Jawaban Otomatis: Urutan nomor soal dan pilihan jawaban (A sampai E) diacak secara otomatis untuk setiap siswa sehingga tidak bisa saling contek.
   - Live Proctoring Realtime: Guru & Pengawas memantau kepatuhan seluruh siswa secara langsung (status Aman / Waspada / Curang) langsung dari HP atau laptop.
   - Stempel Integritas SHA-256: Keaslian berkas jawaban dan nilai akhir siswa dilindungi segel kriptografi untuk menjamin nilai murni dan anti-manipulasi.
   - Offline-First Resilience (Tahan Putus Koneksi): Jika internet atau WiFi sekolah tiba-tiba terputus saat ujian berlangsung, siswa tetap bisa tenang melanjutkan mengerjakan soal di HP mereka, dan jawaban akan otomatis tersinkronisasi ke server begitu internet kembali normal.

3. Fitur Pembuat Soal & Penilaian:
   - 3 Cara Menambah Soal: Manual (Pilihan Ganda, Benar/Salah, Isian Singkat, Esai/Uraian), Impor Berkas Kilat (Word .docx dan Excel .xlsx), atau Pembuat Soal AI (membuat butir soal HOTS/standar otomatis sesuai kisi-kisi dan mata pelajaran).
   - Koreksi Esai Otomatis dengan AI (AI Essay Grader): Menilai jawaban esai siswa berdasarkan rubrik dan kunci secara objektif dalam hitungan detik, lengkap dengan saran perbaikan untuk siswa.
   - Mendukung rumus matematika/sains (LaTeX), gambar diagram, dan audio listening bahasa.

4. Paket Layanan & Harga Resmi (Sesuai Buku Induk):
   - Guru Basic (Gratis): Kuota 3 sesi ujian/bulan (kelas >10 siswa), maks 40 siswa/sesi, tipe soal lengkap, preview mobile, ekspor CSV.
   - Guru PRO: Rp 20.000 / bulan atau Rp 180.000 / tahun (Rp 15.000/bln hemat 25%). Sesi ujian & jumlah siswa tanpa batas (unlimited), fullscreen lock & anti-cheat penuh, koreksi esai AI, rumus matematika tak terbatas, ekspor Excel (.xlsx), dan stempel integritas SHA-256.
   - Lisensi Sekolah: Rp 1.500.000 / tahun per NPSN sekolah. Akses PRO tanpa batas untuk SELURUH guru dalam satu NPSN sekolah, kop surat resmi dinas & logo sekolah pada lembar ujian, bank soal kolektif sekolah, analitik per tingkat kelas, dan jalur dukungan teknis prioritas.
   - Metode Pembayaran: Instan via DANA / QRIS. Transaksi dikonfirmasi otomatis dan langsung aktif seketika (realtime).

5. Kontak Pemilik & Hotline Resmi:
   - Tim Layanan & Hotline Admin: {ADMIN_NAME} ({ADMIN_PHONE}).
   - Web Resmi: https://ujianpintar.online

Ingat: Selalu gunakan nada bicara yang hangat, ramah, dan manusiawi. JANGAN PERNAH menampilkan kode pemrograman atau istilah koding kepada pengguna!`;

let latestDbSettings = {};
const defaultSettingsPath = path.join(__dirname, 'bot-settings.json');

// Inisialisasi koneksi Supabase untuk sinkronisasi otomatis dari dashboard Super Admin
let supabaseClient = null;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://api.ujianpintar.online';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    console.log('[WA-AI] 🔗 Supabase Client siap untuk sinkronisasi otomatis dengan Super Admin.');
  } catch (err) {
    console.warn('[WA-AI] Inisialisasi Supabase Client dilewati:', err.message);
  }
}

let lastSupabaseSync = 0;
async function syncSettingsFromSupabase() {
  if (!supabaseClient) return;
  const now = Date.now();
  if (now - lastSupabaseSync < 5000) return; // Debounce 5 detik
  lastSupabaseSync = now;

  try {
    const { data, error } = await supabaseClient
      .from('bot_settings')
      .select('value')
      .eq('key', 'whatsapp_ai_bot')
      .maybeSingle();

    if (!error && data && data.value) {
      latestDbSettings = data.value;
      botConfig = loadDynamicSettings();
      console.log('[WA-AI] ⚡ Berhasil sinkronisasi otak AI & harga terbaru langsung dari database Super Admin!');
      try {
        fs.writeFileSync(defaultSettingsPath, JSON.stringify(botConfig, null, 2), 'utf8');
      } catch (_) {}
    }
  } catch (_) {
    // Tabel belum ada atau koneksi gagal, fallback ke file bot-settings.json
  }
}

// 3. Konfigurasi Dinamis Bot (Mendukung sinkronisasi dari bot-settings.json & Supabase)
function loadDynamicSettings() {
  let fileSettings = {};
  const possiblePaths = [
    path.join(__dirname, 'bot-settings.json'),
    '/root/bot-settings.json',
    '/var/www/vps-bot/bot-settings.json',
    path.join(process.cwd(), 'bot-settings.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
        fileSettings = { ...fileSettings, ...parsed };
      } catch (e) {
        console.warn(`[WA-AI] Gagal membaca ${p}:`, e.message);
      }
    }
  }

  // Gabungkan fileSettings dengan latestDbSettings dari database Supabase jika ada
  const merged = { ...fileSettings, ...latestDbSettings };

  return {
    botPort: parseInt(process.env.BOT_PORT || merged.botPort || '3099', 10),
    wahaBaseUrl: (merged.wahaBaseUrl || process.env.WAHA_BASE_URL || 'https://api.ujianpintar.online/waha').trim(),
    wahaApiKey: (merged.wahaApiKey || process.env.WAHA_API_KEY || 'WahaUjianPintar2026').trim(),
    activeProvider: merged.activeProvider || 'gemini',
    geminiApiKey: (merged.geminiApiKey || process.env.GEMINI_API_KEY || '').trim(),
    geminiModel: merged.geminiModel || 'gemini-2.0-flash',
    groqApiKey: (merged.groqApiKey || process.env.GROQ_API_KEY || '').trim(),
    groqModel: merged.groqModel || 'llama-3.3-70b-versatile',
    deepseekApiKey: (merged.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '').trim(),
    deepseekModel: merged.deepseekModel || 'deepseek-chat',
    customBaseUrl: merged.customBaseUrl || 'https://api.groq.com/openai/v1',
    customApiKey: merged.customApiKey || '',
    customModel: merged.customModel || 'llama-3.3-70b-versatile',
    adminName: merged.adminName || process.env.ADMIN_NAME || 'Deni Indrayana',
    adminPhone: merged.adminPhone || process.env.ADMIN_PHONE || '0821-9692-9193',
    systemPrompt: merged.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    isAutoReplyEnabled: merged.isAutoReplyEnabled !== false,
    cooldownSeconds: merged.cooldownSeconds || 3,
    humanHandoverMinutes: merged.humanHandoverMinutes || 30,
  };
}

let botConfig = loadDynamicSettings();

// Helper untuk memperbarui settings ke disk dan memory
function updateBotConfig(newSettings) {
  botConfig = {
    ...botConfig,
    ...newSettings,
  };
  try {
    fs.writeFileSync(defaultSettingsPath, JSON.stringify(botConfig, null, 2), 'utf8');
    console.log('[WA-AI] ✅ Pengaturan bot berhasil diperbarui secara dinamis.');
    return true;
  } catch (err) {
    console.error('[WA-AI] Gagal menulis bot-settings.json:', err.message);
    return false;
  }
}

// Jalankan sync database di awal dan berkala setiap 25 detik
syncSettingsFromSupabase().catch(() => {});
setInterval(() => {
  syncSettingsFromSupabase().catch(() => {});
}, 25000);

// Memory Store untuk Human Handover & Cooldown (Menghindari spam bot)
const adminActiveSessions = new Map(); // phone -> timestamp
const userCooldowns = new Map(); // phone -> timestamp
const userHistories = new Map(); // phone -> array of { role, content }
const activeBotSessions = new Map(); // phone -> timestamp (sesi chat bot aktif)
const botRecentReplies = new Map(); // phone -> timestamp (cegah self-echo memicu handover)
const botSentMessageIds = new Set(); // ID pesan yang dikirim bot sendiri



// 4. Template Menu Interaktif WhatsApp UjianPintar
const MAIN_MENU_TEXT = `👋 *Selamat Datang di WhatsApp Resmi UjianPintar!*
_Platform CBT Asesmen Sekolah Modern Anti-Curang Berbasis HP & Laptop._
🌐 https://ujianpintar.online

Halo Bapak/Ibu Guru & Rekan Pendidik! Terima kasih telah menghubungi kami. Kami siap membantu Anda.

Silakan pilih topik informasi yang ingin Anda ketahui dengan membalas angka *(1 - 6)*:

━━━━━━━━━━━━━━━━━━━━━
📋 *MENU INFORMASI & FITUR:*
━━━━━━━━━━━━━━━━━━━━━
1️⃣ *Fitur Keamanan Anti-Curang*
   _(Kunci Layar Penuh, Deteksi Pindah Tab/Split, Acak Soal, Live Proctoring)_

2️⃣ *Bank Soal & Impor Kilat*
   _(Impor otomatis dari Word .docx & Excel .xlsx, Pembuat Soal AI)_

3️⃣ *Koreksi Esai Otomatis dengan AI*
   _(Koreksi jawaban uraian/esai siswa otomatis berbasis rubrik & AI)_

4️⃣ *Paket Layanan & Biaya*
   _(Guru Basic Gratis, Guru PRO Unlimited, & Lisensi Sekolah)_

5️⃣ *Panduan Singkat Memulai*
   _(Langkah cepat guru membuat ujian & cara siswa join asesmen)_

6️⃣ *Hubungi Admin Langsung*
   _(Konsultasi teknis, MoU Sekolah, faktur dinas, & transfer manual)_
━━━━━━━━━━━━━━━━━━━━━

💡 *Cara Memilih:*
Cukup balas chat ini dengan mengetik angka *1*, *2*, *3*, *4*, *5*, atau *6*.
Atau Anda juga bisa langsung mengetik pertanyaan bebas.`;

const MENU_DETAILS = {
  1: `🔒 *Fitur Keamanan Anti-Curang di UjianPintar:*

UjianPintar dirancang dengan proteksi ketat untuk menjaga kejujuran ujian:

1. *Kunci Layar Penuh (Fullscreen Lock):*
   Siswa tidak dapat keluar ke aplikasi lain atau browsing Google selama ujian.

2. *Deteksi Pindah Tab & Beralih Aplikasi:*
   Sistem mencatat waktu dan frekuensi pelanggaran jika siswa mencoba membuka aplikasi lain atau fitur split-screen.

3. *Acak Soal & Opsi Jawaban Otomatis:*
   Urutan nomor soal dan pilihan opsi (A-E) diacak otomatis untuk setiap siswa sehingga tidak bisa saling contek.

4. *Live Proctoring (Pemantauan Realtime):*
   Guru dapat memantau kepatuhan seluruh siswa secara live (Aman/Waspada/Curang) dan dapat mengirim pesan peringatan langsung ke layar HP siswa.

━━━━━━━━━━━━━━━━━━━━━
Ketik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`,

  2: `📝 *Bank Soal & Impor Otomatis UjianPintar:*

Membuat soal di UjianPintar sangat praktis dan hemat waktu:

1. *Impor Dokumen Word (.docx):*
   Cukup gunakan format standar nomor 1, 2, 3 dengan opsi A, B, C, D, E. Tandai kunci jawaban dengan tanda bintang (*) atau tulisan 'Kunci: A'. Sistem langsung mendeteksi soal, teks, dan gambar.

2. *Impor Tabel Excel (.xlsx):*
   Tersedia template Excel resmi yang bisa diunduh langsung untuk memasukkan puluhan soal sekaligus.

3. *Pembuat Soal Berbantuan AI:*
   Cukup masukkan mata pelajaran, topik materi, dan jumlah soal. AI UjianPintar akan menyusun paket soal standar atau HOTS lengkap beserta kunci dalam hitungan detik.

4. *Dukungan Rumus & Gambar:*
   Mendukung simbol matematika (LaTeX), tabel perbandingan, gambar ilustrasi, dan audio listening bahasa.

━━━━━━━━━━━━━━━━━━━━━
Ketik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`,

  3: `🤖 *Koreksi Esai Otomatis dengan AI:*

Fitur unggulan untuk meringankan beban koreksi guru:

1. *Penilaian Berbasis Rubrik & Kunci:*
   AI membandingkan esai siswa dengan kata kunci jawaban dan rubrik penilaian yang ditentukan guru.

2. *Koreksi Cepat & Nilai Objektif:*
   Nilai esai dihitung secara otomatis dan konsisten untuk seluruh siswa dalam hitungan detik.

3. *Umpan Balik (Feedback) Siswa:*
   AI memberikan catatan saran perbaikan yang membantu siswa memahami kekurangannya.

4. *Kontrol Penuh di Tangan Guru:*
   Guru tetap dapat meninjau, menyetujui, atau mengedit nilai koreksi AI sebelum nilai difinalisasi.

━━━━━━━━━━━━━━━━━━━━━
Ketik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`,

  4: `💎 *Paket Layanan & Biaya Resmi UjianPintar (Sesuai Buku Induk):*

1. *Guru Basic (Gratis):*
   • Kuota 3 sesi ujian / bulan (kelas >10 siswa)
   • Maksimal 40 siswa per sesi
   • Tipe soal PG, Benar/Salah, Isian Singkat
   • Ekspor rekap nilai format CSV

2. *Guru PRO (Pilihan Terbaik Guru Mandiri):*
   • *Rp 20.000* / bulan atau *Rp 180.000* / tahun (Rp 15.000/bln hemat 25%)
   • Sesi ujian & jumlah siswa tanpa batas (Unlimited)
   • Fitur keamanan Fullscreen Lock & anti-cheat penuh
   • Koreksi esai otomatis dengan AI (AI Essay Grader)
   • Formula matematika & sains (LaTeX KaTeX) tak terbatas
   • Ekspor rekap nilai format Excel (.xlsx) & CSV
   • Stempel integritas nilai SHA-256 (anti-manipulasi nilai)

3. *Lisensi Resmi Sekolah:*
   • *Rp 1.500.000* / tahun per NPSN sekolah
   • Akses PRO tanpa batas untuk SELURUH guru dalam satu NPSN sekolah
   • Kop surat resmi dinas & logo sekolah pada lembar ujian
   • Bank soal kolektif tingkat sekolah
   • Analitik & rekap nilai per jenjang tingkat kelas
   • Jalur dukungan teknis prioritas

💳 *Metode Pembayaran:*
Pembayaran instan via *DANA / QRIS*. Transaksi diverifikasi secara otomatis dan aktif seketika (realtime).

━━━━━━━━━━━━━━━━━━━━━
Ketik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`,

  5: `🚀 *Panduan Singkat Memulai UjianPintar (Sesuai Buku Induk):*

*A. Bagi Guru (Web Portal - Laptop/PC/HP):*
1. Buka *https://ujianpintar.online* lalu masuk ke akun guru.
2. Buka menu *Bank Soal & Jadwal* ➔ klik *+ Buat Ujian*.
3. Masukkan soal (ketik manual, impor dari Word .docx / Excel .xlsx, atau buat instan dengan AI Generator).
4. Dapatkan *Token Ujian (6 digit)* dan *PIN Pengawas (6 digit)*.
5. Bagikan Token 6 digit kepada siswa dan aktifkan status ujian saat waktu ujian tiba.
6. Pantau siswa secara langsung lewat menu *Live Proctoring*.

*B. Bagi Siswa (Aplikasi Mobile APK Android "Ujian Pintar"):*
1. Pasang aplikasi APK UjianPintar di HP Android (tautan diberikan oleh guru atau dari web).
2. Buka aplikasi, masukkan *Token Ujian 6 digit* dari guru.
3. Masukkan data diri: *NIS/NISN, Nama Lengkap, dan Kelas*.
4. Klik *Mulai Ujian*. Layar HP otomatis terkunci anti-curang (fullscreen & anti-screenshot).
5. Jika koneksi WiFi/data terputus di tengah ujian, siswa tetap bisa mengerjakan (offline-first) dan otomatis tersinkronisasi saat koneksi pulih kembali.

*C. Bagi Pengawas / Proktor (Aplikasi Mobile APK Android):*
1. Masuk ke aplikasi APK UjianPintar dalam mode pengawas menggunakan *PIN Pengawas (6 digit)*.
2. Pantau telemetri seluruh siswa secara live (status Aman / Waspada / Curang).
3. Pengawas bisa mengirim teguran langsung ke layar siswa, menambah waktu ujian, atau submit paksa.

━━━━━━━━━━━━━━━━━━━━━
Ketik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`,

  6: `👤 *Hotline Resmi & Bantuan Khusus UjianPintar:*

Untuk kebutuhan:
• Konsultasi pelaksanaan Asesmen Bersama Sekolah
• Pembuatan MoU / Surat Penawaran / Faktur Resmi Sekolah
• Aktivasi paket PRO via transfer bank manual
• Pendampingan kendala teknis

Silakan hubungi:
• *Admin & Pengembang:* {ADMIN_NAME}
• *WhatsApp:* {ADMIN_PHONE}
• *Website:* https://ujianpintar.online

Admin kami akan segera membalas pesan Anda langsung di room chat ini. Terima kasih!`
};

// 5. Filter Super Ketat (Opsi 1): Memisahkan Chat Pribadi vs Chat Terkait Platform UjianPintar
// Bot HANYA BOLEH merespons jika:
// 1. Pesan diawali dari tombol web resmi (ada kalimat default: "halo admin ujianpintar", "seputar platform ujianpintar")
// 2. ATAU pesan secara eksplisit menyebut merek/nama platform: "ujianpintar", "ujian pintar", "guruhebat", "guru hebat", "ujianpintar.online"
// 3. ATAU kontak tersebut SEDANG BERADA DALAM SESI AKTIF (sudah lolos verifikasi nomor 1 / 2 dalam 30 menit terakhir)
function isPlatformRelatedMessage(rawText, senderPhone) {
  if (!rawText) return false;

  // Normalisasi teks
  const clean = rawText
    .toLowerCase()
    .replace(/1️⃣|1\uFE0F\u20E3/g, '1')
    .replace(/2️⃣|2\uFE0F\u20E3/g, '2')
    .replace(/3️⃣|3\uFE0F\u20E3/g, '3')
    .replace(/4️⃣|4\uFE0F\u20E3/g, '4')
    .replace(/5️⃣|5\uFE0F\u20E3/g, '5')
    .replace(/6️⃣|6\uFE0F\u20E3/g, '6')
    .trim();

  // A. Pintu Masuk Resmi 1: Teks pembuka resmi dari tombol WhatsApp di website
  const isWebButtonTrigger = 
    clean.includes('halo admin ujianpintar') ||
    clean.includes('seputar platform ujianpintar');

  // B. Pintu Masuk Resmi 2: Eksplisit menyebutkan nama platform / website / aplikasi
  const isExplicitBrandMention = 
    clean.includes('ujianpintar') ||
    clean.includes('ujian pintar') ||
    clean.includes('guruhebat') ||
    clean.includes('guru hebat') ||
    clean.includes('ujianpintar.online');

  // Jika pesan mengandung salah satu Pintu Masuk Resmi -> 100% Valid pesan UjianPintar!
  if (isWebButtonTrigger || isExplicitBrandMention) {
    return true;
  }

  // C. Jika TIDAK menyebut nama UjianPintar, periksa apakah kontak ini sedang dalam Sesi Aktif Sah
  const sessionExpire = activeBotSessions.get(senderPhone);
  const isSessionActive = sessionExpire && Date.now() < sessionExpire;

  if (isSessionActive) {
    // Pengguna sedang dalam sesi tanya-jawab aktif yang sah.
    // Jika pengguna pamit / mengucapkan terima kasih, akhiri sesi setelah ini:
    const isClosingWord = /(terima\s*kasih|makasih|terimakasih|makasi|cukup\s*jelas|cukup\s*paham|thank\s*you|thanks)/i.test(clean);
    if (isClosingWord) {
      activeBotSessions.delete(senderPhone);
      return true; // Tetap izinkan diproses agar bot bisa membalas salam penutup dengan ramah
    }

    // Izinkan navigasi menu 1-6 atau pertanyaan lanjutan selama sesi masih aktif
    return true;
  }

  // D. Jika BUKAN dari tombol web, TIDAK menyebut "UjianPintar", dan TIDAK ada sesi aktif:
  // INI ADALAH CHAT PRIBADI! Bot DIHARUSKAN DIAM SERIBU BAHASA (tidak ikut campur urusan pribadi).
  return false;
}

// ==============================================================================
// 6. MESIN BASIS PENGETAHUAN FISIK (PHYSICAL KNOWLEDGE BASE ENGINE - OPSI 3)
// Membaca file berkas panduan/FAQ/materi di folder knowledge/ (*.md, *.txt)
// ==============================================================================
let cachedKnowledgeSections = [];
let lastKnowledgeLoadTime = 0;
let lastKnownFilesState = '';

function getKnowledgeDirectories() {
  return [
    path.join(__dirname, 'knowledge'),
    '/var/www/vps-bot/knowledge',
    path.join(process.cwd(), 'knowledge'),
    path.join(__dirname, '..'),
    process.cwd(),
    __dirname,
    '/var/www/vps-bot'
  ];
}

function extractKeywordsFromText(str) {
  if (!str) return [];
  const stopWords = new Set([
    'dan', 'yang', 'untuk', 'dari', 'pada', 'dengan', 'atau', 'ini', 'itu',
    'adalah', 'akan', 'bisa', 'dapat', 'oleh', 'ke', 'di', 'saat', 'agar',
    'karena', 'jika', 'tetapi', 'namun', 'saya', 'kamu', 'anda', 'kami', 'kita',
    'apakah', 'bagaimana', 'gimana', 'berapa', 'kenapa', 'mengapa', 'kapan', 'siapa', 'apa'
  ]);
  return Array.from(new Set(
    str.toLowerCase()
      .replace(/[^a-z0-9\s-]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopWords.has(w))
  ));
}

// Cek apakah bab adalah metadata navigasi internal (seperti Daftar Isi) yang tidak boleh disajikan ke chat
function isMetadataSection(title, text) {
  const cleanTitle = (title || '').toLowerCase().trim();
  if (
    cleanTitle === 'daftar isi' ||
    cleanTitle === 'table of contents' ||
    cleanTitle.includes('daftar isi') ||
    cleanTitle.includes('table of content') ||
    cleanTitle.includes('super admin') ||
    cleanTitle.includes('super-admin')
  ) {
    return true; // Bagian internal / navigasi, tidak boleh masuk memori chat publik
  }
  // Jika lebih dari 35% baris adalah anchor link markdown [Bab](#anchor), ini adalah daftar isi
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  const linkLines = lines.filter(l => /^\d*[\.\-\*]?\s*\[.*?\]\(#.*?\)/.test(l));
  if (lines.length > 0 && linkLines.length / lines.length > 0.35) return true;
  return false;
}

// Helper sanitasi teks dari buku panduan agar bebas dari kode, path, & istilah koding sebelum masuk memori AI
function sanitizeKnowledgeText(raw) {
  if (!raw) return '';
  return raw
    // Hapus blok kode ```...```
    .replace(/```[\s\S]*?```/g, '')
    // Hapus baris yang berisi path repo, path file lokal, atau file source code
    .replace(/^[^\n]*[a-zA-Z]:\\[^\n]*$/gm, '')
    .replace(/^[^\n]*\/var\/www\/[^\n]*$/gm, '')
    .replace(/^[^\n]*src\/[^\n]*$/gm, '')
    // Hapus referensi file koding / internal docs dalam tanda kurung / backticks
    .replace(/\s*\(`?[a-zA-Z0-9_.-]+\.(ts|tsx|js|jsx|rs|cjs|mjs|sql|md|txt|json)`?\)/gi, '')
    .replace(/\b[a-zA-Z0-9_.-]+\.(ts|tsx|js|jsx|rs|cjs|mjs|sql|md|txt|json)\b/gi, '')
    // Hapus path folder tersisa
    .replace(/[a-zA-Z]:\\[^\s]+/g, '')
    .replace(/\/var\/www\/[^\s]+/g, '')
    // Terjemahkan istilah developer ke bahasa awam pendidik
    .replace(/expo-screen-capture/gi, 'fitur kunci layar & anti-screenshot')
    .replace(/expo-keep-awake/gi, 'fitur layar selalu aktif')
    .replace(/detectTabSwitch/gi, 'fitur deteksi perpindahan aplikasi')
    .replace(/fullScreenLock/gi, 'fitur kunci layar penuh')
    .replace(/shuffleQuestions/gi, 'fitur acak urutan soal')
    .replace(/shuffleOptions/gi, 'fitur acak pilihan jawaban')
    .replace(/tab_violations/gi, 'catatan pelanggaran keluar aplikasi')
    .replace(/AppState\.addEventListener[^\n]*/gi, 'deteksi saat siswa beralih aplikasi')
    .replace(/AppState/gi, 'deteksi sistem aplikasi')
    .replace(/AsyncStorage/gi, 'memori HP siswa')
    .replace(/Crate Rust[^\n]*/gi, 'mesin komputasi modern')
    .replace(/Supabase self-hosted[^\n]*/gi, 'server cloud aman UjianPintar')
    .replace(/Expo SDK[^\n]*/gi, 'aplikasi mobile Android modern')
    .replace(/React 19[^\n]*/gi, 'portal web')
    // Privasi Ruang Pemilik: Bersihkan sebutan Super Admin dari pengetahuan
    .replace(/\/super-admin[^\s)\]]*/gi, 'portal guru')
    .replace(/\bsuper[\s_-]?admin\b/gi, 'pengelola resmi')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`+/g, '')
    // Rapikan tanda kurung kosong yang tersisa
    .replace(/\(\s*(dari)?\s*\)/gi, '')
    // Rapikan baris tabel markdown
    .replace(/\|[-:\s|]+\|/g, '')
    .replace(/^\|(.*)\|$/gm, (match, p1) => {
      const cells = p1.split('|').map(c => c.trim()).filter(Boolean);
      return cells.length > 1 ? `• ${cells[0]}: ${cells.slice(1).join(' - ')}` : `• ${cells[0] || ''}`;
    })
    // Bersihkan baris kosong berlebih
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sanitizeTitle(raw) {
  if (!raw) return '';
  return raw
    .replace(/^#+\s*/, '')
    .replace(/\s*\(`?[a-zA-Z0-9_.-]+\.(ts|tsx|js|jsx|rs|cjs|mjs|sql|md|txt|json)`?\)/gi, '')
    .replace(/\b[a-zA-Z0-9_.-]+\.(ts|tsx|js|jsx|rs|cjs|mjs|sql|md|txt|json)\b/gi, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`+/g, '')
    .replace(/\(\s*\)/g, '')
    .trim();
}

function parseMarkdownSections(content, filename) {
  const lines = content.split('\n');
  const sections = [];
  let currentTitle = sanitizeTitle(path.basename(filename, path.extname(filename)));
  let currentLines = [];

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentLines.length > 0) {
        const rawText = currentLines.join('\n');
        const text = sanitizeKnowledgeText(rawText);
        if (text.length > 30 && !isMetadataSection(currentTitle, text)) {
          sections.push({
            filename,
            title: currentTitle,
            content: text,
            keywords: extractKeywordsFromText(`${currentTitle} ${text}`),
          });
        }
      }
      currentTitle = sanitizeTitle(line);
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const rawText = currentLines.join('\n');
    const text = sanitizeKnowledgeText(rawText);
    if (text.length > 30 && !isMetadataSection(currentTitle, text)) {
      sections.push({
        filename,
        title: currentTitle,
        content: text,
        keywords: extractKeywordsFromText(`${currentTitle} ${text}`),
      });
    }
  }

  return sections;
}

function loadKnowledgeBase(forceReload = false) {
  const now = Date.now();
  // Throttle reload check ke 15 detik jika tidak di-force
  if (!forceReload && now - lastKnowledgeLoadTime < 15000 && cachedKnowledgeSections.length > 0) {
    return cachedKnowledgeSections;
  }

  const dirs = getKnowledgeDirectories();
  const foundFiles = new Map(); // filename -> fullPath

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      try {
        const stat = fs.statSync(dir);
        if (stat.isDirectory()) {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            if ((f.endsWith('.md') || f.endsWith('.txt')) && !f.startsWith('.')) {
              const fullPath = path.join(dir, f);
              if (!foundFiles.has(f)) {
                foundFiles.set(f, fullPath);
              }
            }
          }
        }
      } catch (_) {}
    }
  }

  // Cek apakah ada perubahan file (mtime)
  let currentState = '';
  for (const [f, fullPath] of foundFiles.entries()) {
    try {
      const st = fs.statSync(fullPath);
      currentState += `${f}:${st.mtimeMs}|`;
    } catch (_) {}
  }

  if (!forceReload && currentState === lastKnownFilesState && cachedKnowledgeSections.length > 0) {
    lastKnowledgeLoadTime = now;
    return cachedKnowledgeSections;
  }

  // Load dan parse seluruh berkas
  const sections = [];
  for (const [f, fullPath] of foundFiles.entries()) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const parsed = parseMarkdownSections(content, f);
      sections.push(...parsed);
    } catch (e) {
      console.warn(`[WA-AI] Gagal membaca berkas knowledge ${f}:`, e.message);
    }
  }

  cachedKnowledgeSections = sections;
  lastKnowledgeLoadTime = now;
  lastKnownFilesState = currentState;

  if (sections.length > 0) {
    console.log(`[WA-AI] 📚 Basis Pengetahuan Fisik aktif: ${foundFiles.size} berkas dimuat (${sections.length} bab materi).`);
  }

  return cachedKnowledgeSections;
}

function findRelevantKnowledge(query, limit = 2) {
  const sections = loadKnowledgeBase();
  if (sections.length === 0) return [];

  const queryWords = extractKeywordsFromText(query);
  if (queryWords.length === 0) return [];

  const scored = sections.map(sec => {
    let score = 0;
    const titleLower = sec.title.toLowerCase();

    for (const qw of queryWords) {
      if (titleLower.includes(qw)) score += 15;
      if (sec.keywords.includes(qw)) score += 2;
    }

    return { section: sec, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, limit);
}

function getKnowledgeContextForAI(query) {
  const matches = findRelevantKnowledge(query, 2);
  if (matches.length === 0) return '';

  return matches.map((m, idx) => {
    // Batasi per section maks 1500 karakter agar token tetap hemat dan responsif
    const snippet = m.section.content.length > 1500
      ? m.section.content.slice(0, 1500) + '\n...(dan seterusnya)'
      : m.section.content;
    return `[BAB REFERENSI ${idx + 1}: ${m.section.title}]\n${snippet}`;
  }).join('\n\n');
}

// Inisialisasi awal saat bot start
loadKnowledgeBase(true);

// 7. Helper mengekstrak bagian topik dari Otak AI (System Prompt) secara dinamis agar 100% sinkron dengan Super Admin
function getDynamicTopicSection(topicNumber) {
  const prompt = botConfig.systemPrompt || '';

  // Menu 4: Paket Layanan & Harga
  if (topicNumber === 4) {
    const regex = /(?:4\.\s*)?Paket\s*Layanan[\s\S]*?(?=(?:\n\s*[5-9]\.|\n\s*Kontak|\n\s*Pedoman|$))/i;
    const match = prompt.match(regex);
    if (match && match[0].trim().length > 25) {
      let cleanSection = match[0].trim()
        .replace(/{ADMIN_NAME}/g, botConfig.adminName)
        .replace(/{ADMIN_PHONE}/g, botConfig.adminPhone);

      if (!cleanSection.startsWith('💎')) {
        cleanSection = `💎 *INFORMASI RESMI PAKET & BIAYA (SESUAI DATA OTAK):*\n\n${cleanSection}`;
      }
      return `${cleanSection}\n\n━━━━━━━━━━━━━━━━━━━━━\nKetik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`;
    }
  }

  // Menu 1: Fitur Keamanan Anti-Curang
  if (topicNumber === 1) {
    const regex = /(?:2\.\s*)?Fitur\s*Keamanan[\s\S]*?(?=(?:\n\s*[3-9]\.|\n\s*Fitur\s*Pembuat|\n\s*Paket|\n\s*Kontak|$))/i;
    const match = prompt.match(regex);
    if (match && match[0].trim().length > 25) {
      let cleanSection = match[0].trim()
        .replace(/{ADMIN_NAME}/g, botConfig.adminName)
        .replace(/{ADMIN_PHONE}/g, botConfig.adminPhone);
      if (!cleanSection.startsWith('🔒')) {
        cleanSection = `🔒 *FITUR KEAMANAN ANTI-CURANG (SESUAI DATA OTAK):*\n\n${cleanSection}`;
      }
      return `${cleanSection}\n\n━━━━━━━━━━━━━━━━━━━━━\nKetik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`;
    }
  }

  // Menu 2: Bank Soal & Impor
  if (topicNumber === 2) {
    const regex = /(?:3\.\s*)?Fitur\s*Pembuat\s*Soal[\s\S]*?(?=(?:\n\s*[4-9]\.|\n\s*Paket|\n\s*Kontak|$))/i;
    const match = prompt.match(regex);
    if (match && match[0].trim().length > 25) {
      let cleanSection = match[0].trim()
        .replace(/{ADMIN_NAME}/g, botConfig.adminName)
        .replace(/{ADMIN_PHONE}/g, botConfig.adminPhone);
      if (!cleanSection.startsWith('📝')) {
        cleanSection = `📝 *BANK SOAL & FITUR PEMBUAT SOAL (SESUAI DATA OTAK):*\n\n${cleanSection}`;
      }
      return `${cleanSection}\n\n━━━━━━━━━━━━━━━━━━━━━\nKetik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`;
    }
  }

  // Menu 6: Hotline Admin
  if (topicNumber === 6) {
    const regex = /(?:5\.\s*)?Kontak[\s\S]*?(?=(?:\n\s*Pedoman|$))/i;
    const match = prompt.match(regex);
    if (match && match[0].trim().length > 25) {
      let cleanSection = match[0].trim()
        .replace(/{ADMIN_NAME}/g, botConfig.adminName)
        .replace(/{ADMIN_PHONE}/g, botConfig.adminPhone);
      if (!cleanSection.startsWith('👤')) {
        cleanSection = `👤 *HOTLINE & KONTAK RESMI (SESUAI DATA OTAK):*\n\n${cleanSection}`;
      }
      return `${cleanSection}\n\n━━━━━━━━━━━━━━━━━━━━━\nKetik *MENU* untuk kembali ke daftar pilihan, atau ketik pertanyaan Anda.`;
    }
  }

  // Fallback ke MENU_DETAILS bawaan
  return (MENU_DETAILS[topicNumber] || MAIN_MENU_TEXT)
    .replace(/{ADMIN_NAME}/g, botConfig.adminName)
    .replace(/{ADMIN_PHONE}/g, botConfig.adminPhone);
}

// 7. Handler Menu & Cepat Respons (Tanpa Menunggu AI)
function resolveQuickResponse(userQuery) {
  if (!userQuery) return null;
  const clean = userQuery
    .toLowerCase()
    .replace(/1️⃣|1\uFE0F\u20E3/g, '1')
    .replace(/2️⃣|2\uFE0F\u20E3/g, '2')
    .replace(/3️⃣|3\uFE0F\u20E3/g, '3')
    .replace(/4️⃣|4\uFE0F\u20E3/g, '4')
    .replace(/5️⃣|5\uFE0F\u20E3/g, '5')
    .replace(/6️⃣|6\uFE0F\u20E3/g, '6')
    .trim();

  // A. Pesan default floating button ATAU permintaan Menu
  if (
    clean.includes('halo admin ujianpintar') ||
    clean.includes('seputar platform ujianpintar') ||
    /^(menu|bantuan|help|fitur|pilihan|daftar)(\s+menu)?$/i.test(clean) ||
    clean === 'info' || clean === 'info ujianpintar'
  ) {
    return MAIN_MENU_TEXT
      .replace(/{ADMIN_NAME}/g, botConfig.adminName)
      .replace(/{ADMIN_PHONE}/g, botConfig.adminPhone);
  }

  // B. Pilihan Angka Menu 1 s/d 6 (Dinutrisi langsung dari Otak AI / System Prompt)
  if (/^(1|1\.|no(mor)?\s*1|pilih\s*1|menu\s*1)(\b|$)/i.test(clean)) {
    return getDynamicTopicSection(1);
  }
  if (/^(2|2\.|no(mor)?\s*2|pilih\s*2|menu\s*2)(\b|$)/i.test(clean)) {
    return getDynamicTopicSection(2);
  }
  if (/^(3|3\.|no(mor)?\s*3|pilih\s*3|menu\s*3)(\b|$)/i.test(clean)) {
    return getDynamicTopicSection(3);
  }
  if (/^(4|4\.|no(mor)?\s*4|pilih\s*4|menu\s*4)(\b|$)/i.test(clean)) {
    return getDynamicTopicSection(4);
  }
  if (/^(5|5\.|no(mor)?\s*5|pilih\s*5|menu\s*5)(\b|$)/i.test(clean)) {
    return getDynamicTopicSection(5);
  }
  if (/^(6|6\.|no(mor)?\s*6|pilih\s*6|menu\s*6)(\b|$)/i.test(clean)) {
    return getDynamicTopicSection(6);
  }

  // C. Ucapan Terima Kasih / Penutup Percakapan
  if (/(terima\s*kasih|makasih|terimakasih|makasi|cukup\s*jelas|cukup\s*paham|thank\s*you|thanks)/i.test(clean)) {
    return `Sama-sama Bapak/Ibu! Senang bisa membantu Anda. 🙏😊\n\nJika nantinya Anda atau pihak sekolah membutuhkan informasi tambahan atau bantuan teknis seputar *UjianPintar*, jangan ragu untuk menghubungi kami kembali.\n\nSelamat beraktivitas dan sukses selalu! ✨`;
  }

  return null;
}

// Helper pembersih respon AI agar 100% humanis & bebas kode/path teknis sebelum terkirim ke WhatsApp
function postProcessHumanistReply(raw) {
  if (!raw) return '';
  let cleaned = raw
    // Hapus blok kode ```...```
    .replace(/```[\s\S]*?```/g, '')
    // Hapus baris yang berisi path repo atau file source code
    .replace(/^[^\n]*[a-zA-Z]:\\[^\n]*$/gm, '')
    .replace(/^[^\n]*\/var\/www\/[^\n]*$/gm, '')
    .replace(/^[^\n]*src\/[^\n]*$/gm, '')
    // Hapus referensi file koding: (`useAntiCheat.ts`), scoringEngine.ts, etc.
    .replace(/\s*\(`?[a-zA-Z0-9_.-]+\.(ts|tsx|js|jsx|rs|cjs|mjs|sql|md|txt|json)`?\)/gi, '')
    .replace(/\b[a-zA-Z0-9_.-]+\.(ts|tsx|js|jsx|rs|cjs|mjs|sql|md|txt|json)\b/gi, '')
    // Hapus path folder tersisa
    .replace(/[a-zA-Z]:\\[^\s]+/g, '')
    .replace(/\/var\/www\/[^\s]+/g, '')
    // Terjemahkan istilah developer sisa
    .replace(/expo-screen-capture/gi, 'fitur kunci layar & anti-screenshot')
    .replace(/expo-keep-awake/gi, 'fitur layar selalu aktif')
    .replace(/detectTabSwitch/gi, 'fitur deteksi perpindahan aplikasi')
    .replace(/fullScreenLock/gi, 'fitur kunci layar penuh')
    .replace(/shuffleQuestions/gi, 'fitur acak urutan soal')
    .replace(/shuffleOptions/gi, 'fitur acak pilihan jawaban')
    .replace(/AppState\.addEventListener[^\n]*/gi, 'deteksi saat siswa beralih aplikasi')
    .replace(/AppState/gi, 'deteksi sistem aplikasi')
    .replace(/AsyncStorage/gi, 'memori HP')
    // Privasi Ruang Pemilik: Hapus setiap rute dan sebutan Super Admin
    .replace(/\/super-admin[^\s)\]]*/gi, 'portal guru')
    .replace(/\bsuper[\s_-]?admin\b/gi, 'Tim Layanan Admin')
    // Rapikan tanda kurung kosong
    .replace(/\(\s*(dari)?\s*\)/gi, '')
    .replace(/\(\s*\)/g, '')
    // Rapikan baris kosong
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}

// 8. Fallback Knowledge Base jika AI API Key kosong
function getLocalFallbackAnswer(query) {
  const clean = query.toLowerCase().trim();

  // Cek menu langsung
  const quick = resolveQuickResponse(clean);
  if (quick) return quick;

  // 1. Cek pertanyaan spesifik terkait biaya / pendaftaran tingkat SEKOLAH (Lisensi Sekolah)
  const isAskingSekolah = (
    clean.includes('sekolah') &&
    ['biaya', 'harga', 'tarif', 'daftar', 'mendaftar', 'bayar', 'paket', 'lisensi', 'berapa'].some(kw => clean.includes(kw))
  );
  if (isAskingSekolah) {
    return `Halo Bapak/Ibu! Untuk *pendaftaran akun tingkat Sekolah (Lisensi Resmi Sekolah)*, biayanya adalah:\n\n🏫 *Rp 1.500.000 / tahun per NPSN Sekolah*\n\nKeuntungan Lisensi Sekolah Resmi:\n• Akses Guru PRO *tanpa batas (unlimited)* untuk SELURUH guru dalam satu NPSN sekolah\n• Lembar ujian ber-kop surat dinas resmi & logo sekolah otomatis\n• Bank soal kolektif tingkat sekolah (guru bisa saling berbagi bank soal)\n• Analisis & rekap nilai terpadu per jenjang tingkat kelas\n• Jalur pendampingan teknis prioritas dari tim kami\n\nUntuk pembuatan MoU, Surat Penawaran Resmi Sekolah, atau Faktur Dinas, silakan hubungi Admin kami:\n• Admin: *${botConfig.adminName}* (${botConfig.adminPhone})\n\n━━━━━━━━━━━━━━━━━━━━━\nKetik *MENU* untuk melihat daftar topik bantuan lainnya. 😊`;
  }

  // 2. Cek pertanyaan spesifik terkait pendaftaran akun Guru perorangan gratis
  const isAskingDaftarGratis = (
    !clean.includes('sekolah') &&
    ['daftar', 'registrasi', 'buat akun', 'bikin akun', 'mendaftar'].some(kw => clean.includes(kw)) &&
    ['gratis', 'bayar', 'biaya', 'tarif', 'berbayar', 'free'].some(kw => clean.includes(kw))
  );
  if (isAskingDaftarGratis) {
    return `Halo Bapak/Ibu! Ya, *pendaftaran akun di platform UjianPintar 100% GRATIS!* 🎉\n\nBapak/Ibu Guru langsung mendapatkan paket *Guru Basic (Gratis)* tanpa dipungut biaya apa pun. Fasilitas yang didapatkan:\n• Kuota 3 sesi ujian per bulan (untuk kelas >10 siswa)\n• Hingga 40 siswa per sesi ujian\n• Tipe soal lengkap (Pilihan Ganda, Benar/Salah, Isian Singkat)\n• Pratinjau tampilan HP & ekspor rekap nilai format CSV\n\nJika nantinya membutuhkan sesi ujian tanpa batas (unlimited), fitur kunci layar penuh anti-curang, dan koreksi esai otomatis dengan AI, Bapak/Ibu dapat meng-upgrade ke *Guru PRO* hanya seharga *Rp 20.000 / bulan* (atau Rp 180.000 / tahun).\n\n━━━━━━━━━━━━━━━━━━━━━\nKetik *MENU* untuk melihat daftar topik bantuan lainnya, atau tanyakan jika ada hal lain yang ingin diketahui. 😊`;
  }

  // 2. Cek kata kunci topik spesifik bisnis (diambil langsung dari Otak AI)
  if (['harga', 'biaya', 'bayar', 'tarif', 'pro', 'gratis', 'paket', 'lisensi'].some(kw => clean.includes(kw))) {
    return getDynamicTopicSection(4);
  }
  if (['curang', 'aman', 'kunci', 'keamanan', 'anti', 'pindah', 'layar', 'proctoring', 'contek'].some(kw => clean.includes(kw))) {
    return getDynamicTopicSection(1);
  }
  if (['import', 'impor', 'word', 'docx', 'excel', 'xlsx', 'buat soal', 'bank soal'].some(kw => clean.includes(kw))) {
    return getDynamicTopicSection(2);
  }
  if (['esai', 'essay', 'koreksi', 'rubrik', 'nilai esai', 'uraian'].some(kw => clean.includes(kw))) {
    return getDynamicTopicSection(3);
  }
  if (['panduan', 'mulai', 'cara pakai', 'tutorial', 'join', 'gabung', 'kode ujian', 'token'].some(kw => clean.includes(kw))) {
    return getDynamicTopicSection(5);
  }
  if (['kontak', 'admin', 'bantuan', 'hotline', 'hubungi', 'nomor', 'telepon', 'mou', 'dinas'].some(kw => clean.includes(kw))) {
    return getDynamicTopicSection(6);
  }

  // 3. Cek pencarian di Basis Pengetahuan Fisik (Opsi 3: PANDUAN_LENGKAP_UJIAN_PINTAR.md dsb) dengan ambang batas tinggi
  const matches = findRelevantKnowledge(clean, 1);
  if (matches.length > 0 && matches[0].score >= 20) {
    const sec = matches[0].section;
    let snippet = sec.content;
    if (snippet.length > 800) {
      snippet = snippet.slice(0, 800) + '...';
    }
    return `Halo Bapak/Ibu! Mengenai pertanyaan Anda terkait *${sec.title}*, berikut ringkasan informasi resmi dari panduan UjianPintar:\n\n${snippet}\n\n━━━━━━━━━━━━━━━━━━━━━\nSemoga membantu ya Bapak/Ibu! Jika ada hal lain yang ingin ditanyakan, silakan balas pesan ini atau ketik *MENU* untuk melihat topik bantuan lainnya. 😊`;
  }

  // Jika tidak cocok topik spesifik tapi pesan platform -> Tampilkan Menu Utama
  return MAIN_MENU_TEXT.replace(/{ADMIN_NAME}/g, botConfig.adminName).replace(/{ADMIN_PHONE}/g, botConfig.adminPhone);
}

// 8. Query ke AI Engine (Didahului Pengecekan Menu Cepat & Pengayaan Dokumen Pengetahuan)
async function generateAIAnswer(userQuery, phone) {
  // Cek apakah pesan adalah menu / nomor menu (1-6) untuk respon instan tanpa tunggu AI
  const quick = resolveQuickResponse(userQuery);
  if (quick) return quick;

  const history = userHistories.get(phone) || [];

  // Ambil referensi relevan dari Basis Pengetahuan Fisik (*.md / *.txt)
  const knowledgeSnippet = getKnowledgeContextForAI(userQuery);

  const resolvedSystemPrompt = botConfig.systemPrompt
    .replace(/{ADMIN_NAME}/g, botConfig.adminName)
    .replace(/{ADMIN_PHONE}/g, botConfig.adminPhone);

  const enrichedPrompt = knowledgeSnippet
    ? `${resolvedSystemPrompt}\n\n[DOKUMEN PANDUAN INDUK RESMI UJIANPINTAR]:\n${knowledgeSnippet}\n\nPETUNJUK ANALISIS & CARA MENJAWAB:\n1. Analisis maksud dan konteks dari pertanyaan bebas pengguna secara cermat.\n2. Carilah jawaban faktualnya berdasarkan Buku Panduan Induk di atas (peran guru/siswa, fitur anti-curang, bank soal, harga paket resmi, dsb).\n3. Rangkum dan susun jawaban dalam Bahasa Indonesia yang SANGAT RAMAH, HANGAT, SANTUN, dan HUMANIS layaknya staf konsultan pendidikan manusia asli.\n4. Buatlah jawaban yang padat, ringkas, to the point (maksimal 2-3 paragraf atau poin-poin jelas) agar nyaman dibaca di layar HP WhatsApp.\n5. DILARANG KERAS menampilkan potongan kode pemrograman, nama berkas koding internal (.ts/.js/.rs), ataupun path folder!`
    : `${resolvedSystemPrompt}\n\nPETUNJUK ANALISIS & CARA MENJAWAB:\n1. Jawablah dengan ramah, hangat, dan santun.\n2. Buatlah jawaban yang padat, ringkas, to the point (maksimal 2-3 paragraf atau poin-poin jelas) agar nyaman dibaca di layar HP WhatsApp.\n3. DILARANG KERAS menampilkan potongan kode pemrograman atau istilah koding internal!`;

  // Opsi A: Google Gemini
  if (botConfig.activeProvider === 'gemini' && botConfig.geminiApiKey) {
    const candidateModels = [
      botConfig.geminiModel,
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
    ].filter(Boolean);
    const uniqueCandidates = Array.from(new Set(candidateModels));

    let geminiAnswer = null;
    for (const candModel of uniqueCandidates) {
      if (geminiAnswer) break;
      for (const ver of ['v1beta', 'v1']) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${candModel}:generateContent?key=${encodeURIComponent(botConfig.geminiApiKey)}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${enrichedPrompt}\n\n[Pertanyaan Pengguna WhatsApp]:\n${userQuery}` }]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 600,
              }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              geminiAnswer = text.trim();
              if (botConfig.geminiModel !== candModel) {
                botConfig.geminiModel = candModel;
                updateBotConfig({ geminiModel: candModel });
              }
              break;
            }
          } else if (res.status === 403 || res.status === 400) {
            console.warn(`[WA-AI] ⚠️ Google Gemini API Key ditolak (${res.status}). Beralih ke fallback otomatis.`);
            break;
          }
        } catch (e) {
          // Lanjut coba kandidat atau versi endpoint berikutnya
        }
      }
      if (geminiAnswer) break;
    }

    if (geminiAnswer) return postProcessHumanistReply(geminiAnswer);
  }

  // Opsi B: Groq API
  if (botConfig.activeProvider === 'groq' && botConfig.groqApiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const messages = [
        { role: 'system', content: enrichedPrompt },
        ...history.slice(-4),
        { role: 'user', content: userQuery }
      ];

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${botConfig.groqApiKey}`
        },
        body: JSON.stringify({
          model: botConfig.groqModel || 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.5,
          max_tokens: 600
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return postProcessHumanistReply(text.trim());
      }
    } catch (e) {
      console.warn('[WA-AI] Groq query error:', e.message);
    }
  }

  // Opsi C: DeepSeek API
  if (botConfig.activeProvider === 'deepseek' && botConfig.deepseekApiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const messages = [
        { role: 'system', content: enrichedPrompt },
        ...history.slice(-4),
        { role: 'user', content: userQuery }
      ];

      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${botConfig.deepseekApiKey}`
        },
        body: JSON.stringify({
          model: botConfig.deepseekModel || 'deepseek-chat',
          messages,
          temperature: 0.5,
          max_tokens: 600
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return postProcessHumanistReply(text.trim());
      }
    } catch (e) {
      console.warn('[WA-AI] DeepSeek query error:', e.message);
    }
  }

  // Opsi D: Custom OpenAI-compatible API (Base URL & Key, termasuk Qodeer, OpenRouter, DeepSeek custom, dsb)
  const normProvider = (botConfig.activeProvider || '').toLowerCase().trim();
  const isCustomMatch = [
    'custom_openai',
    'custom',
    'qodeer',
    'qodeer-github',
    'vpsmurah',
    'openrouter',
    'openai',
    'ollama'
  ].includes(normProvider) ||
  (normProvider === 'deepseek' && !botConfig.deepseekApiKey) ||
  (Boolean(botConfig.customBaseUrl && botConfig.customApiKey) && !['gemini', 'groq'].includes(normProvider));

  if (isCustomMatch && botConfig.customBaseUrl && botConfig.customApiKey) {
    const aiCallStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // Beri waktu hingga 50 detik untuk server proxy AI

      const baseUrl = botConfig.customBaseUrl.replace(/\/+$/, '');
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const modelName = botConfig.customModel || 'gpt-4o-mini';

      console.log(`[WA-AI] 🤖 Menghubungi Custom AI (${modelName}) via ${endpoint}...`);

      const messages = [
        { role: 'system', content: enrichedPrompt },
        ...history.slice(-4),
        { role: 'user', content: userQuery }
      ];

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${botConfig.customApiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.5,
          max_tokens: 1500
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const aiDuration = Date.now() - aiCallStart;
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) {
          console.log(`[WA-AI] ✨ Berhasil mendapatkan respon dari Custom AI (${modelName}) dalam ${aiDuration}ms.`);
          return postProcessHumanistReply(text.trim());
        } else {
          console.warn(`[WA-AI] ⚠️ Custom AI 200 OK tetapi teks kosong (finish_reason: ${data?.choices?.[0]?.finish_reason}, tokens: ${data?.usage?.completion_tokens}).`);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[WA-AI] ⚠️ Custom AI HTTP error (${aiDuration}ms):`, res.status, errData?.error?.message || res.statusText);
      }
    } catch (e) {
      const aiDuration = Date.now() - aiCallStart;
      console.warn(`[WA-AI] ⚠️ Custom AI query error (${aiDuration}ms):`, e.message);
    }
  }

  // Fallback: Jawaban Lokal Cerdas
  return postProcessHumanistReply(getLocalFallbackAnswer(userQuery));
}

// 6. Mengirim Balasan via WAHA (WhatsApp HTTP API)
async function sendWhatsAppReply(chatId, text) {
  try {
    const cleanPhone = chatId.replace(/[^0-9]/g, '');
    botRecentReplies.set(cleanPhone, Date.now());

    const sanitizedText = postProcessHumanistReply(text);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${botConfig.wahaBaseUrl}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': botConfig.wahaApiKey
      },
      body: JSON.stringify({
        chatId: chatId,
        text: sanitizedText,
        session: 'default'
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));
    const msgId = data?.id || data?._data?.id?._serialized || data?.key?.id;
    if (msgId) {
      botSentMessageIds.add(msgId);
      setTimeout(() => botSentMessageIds.delete(msgId), 120000);
    }

    return { success: res.ok, data };
  } catch (err) {
    console.error(`[WA-AI] Gagal mengirim balasan ke ${chatId}:`, err.message);
    return { success: false, error: err.message };
  }
}

// 7. Pemrosesan Pesan Masuk (Digunakan oleh Webhook & WebSocket)
async function processIncomingPayload(payload) {
  if (!payload) return;

  const rawFrom = payload.from || payload._data?.from || '';
  const from = typeof rawFrom === 'string' ? rawFrom : (rawFrom?._serialized || rawFrom?.id || String(rawFrom));
  const rawTo = payload.to || payload._data?.to || '';
  const to = typeof rawTo === 'string' ? rawTo : (rawTo?._serialized || rawTo?.id || String(rawTo));
  const fromMe = Boolean(payload.fromMe !== undefined ? payload.fromMe : payload._data?.fromMe);
  const text = (payload.body || payload.text || payload._data?.body || '').trim();

  // Reload setelan dinamis dari bot-settings.json & Supabase agar update dari Super Admin langsung aktif
  syncSettingsFromSupabase().catch(() => {});
  botConfig = loadDynamicSettings();

  // 1. Abaikan jika pesan berasal dari Grup (@g.us) atau Status (@broadcast)
  if (from.includes('@g.us') || from.includes('@broadcast') || to.includes('@g.us')) {
    return;
  }

  // 2. Deteksi Pesan dari Nomor Sendiri / Human Handover
  if (fromMe) {
    const recipientPhone = to.replace(/[^0-9]/g, '');
    const msgId = payload.id || payload._data?.id?._serialized || payload?.key?.id;

    // Cek apakah ini gema event dari balasan yang baru saja dikirim oleh bot sendiri
    const isBotEcho = (msgId && botSentMessageIds.has(msgId)) ||
      (Date.now() - (botRecentReplies.get(recipientPhone) || 0) < 15000);

    if (isBotEcho) {
      // Ini balasan bot sendiri yang sukses terkirim, abaikan agar tidak menjeda bot
      return;
    }

    if (recipientPhone && botConfig.humanHandoverMinutes > 0) {
      const handoverMs = botConfig.humanHandoverMinutes * 60 * 1000;
      adminActiveSessions.set(recipientPhone, Date.now() + handoverMs);
      console.log(`[WA-AI] 👤 Admin membalas manual dari HP ke ${recipientPhone}. Bot dijeda ${botConfig.humanHandoverMinutes} menit untuk kontak ini.`);
    }
    return;
  }

  // 3. Cek apakah Master Switch Auto-Reply diaktifkan
  if (!botConfig.isAutoReplyEnabled) {
    console.log(`[WA-AI] ⏸️ Auto-reply dinonaktifkan dari Super Admin. Mengabaikan pesan.`);
    return;
  }

  // 4. Cek apakah kontak ini sedang dalam jeda Human Handover
  const senderPhone = from.replace(/[^0-9]/g, '');
  const pauseUntil = adminActiveSessions.get(senderPhone);

  // Jika pengguna memilih angka menu (1-6) atau kata 'menu', batalkan jeda agar dilayani langsung
  const isMenuChoice = /^[1-6]$/.test(text.trim()) ||
    /^[1-6][\.\)\s]/.test(text.trim()) ||
    /^(no|nomor|pilih|menu)?\s*[1-6](\b|$)/i.test(text.trim()) ||
    /^(menu|bantuan|help|fitur|pilihan|daftar)(\s+menu)?$/i.test(text.trim()) ||
    text.toLowerCase().includes('halo admin ujianpintar');

  if (isMenuChoice) {
    adminActiveSessions.delete(senderPhone);
  } else if (pauseUntil && Date.now() < pauseUntil) {
    console.log(`[WA-AI] ⏸️ Mengabaikan pesan dari ${senderPhone} (sedang dilayani manual oleh admin).`);
    return;
  }

  // 5. Abaikan pesan kosong atau non-teks
  if (!text || text.trim().length === 0) return;

  // 6. Filter Pesan Pribadi vs Pesan Terkait Platform UjianPintar
  if (!isPlatformRelatedMessage(text, senderPhone)) {
    console.log(`[WA-AI] ⏭️ Pesan dari ${senderPhone} diabaikan (terdeteksi sebagai chat pribadi, tidak mengandung kata kunci UjianPintar). Bot diam.`);
    return;
  }

  // 7. Kelola masa aktif sesi bot:
  // Jika pesan adalah ucapan terima kasih / pamit, hapus sesi agar chat pribadi setelah ini tidak disambar bot.
  // Jika bukan pamit, perpanjang sesi 30 menit untuk memberi waktu guru membaca dan bertanya lanjutan.
  const isClosing = /(terima\s*kasih|makasih|terimakasih|makasi|cukup\s*jelas|cukup\s*paham|thank\s*you|thanks)/i.test(text.toLowerCase());
  if (isClosing) {
    activeBotSessions.delete(senderPhone);
  } else {
    activeBotSessions.set(senderPhone, Date.now() + 30 * 60 * 1000);
  }

  // 8. Anti-Spam Cooldown
  const cooldownMs = (botConfig.cooldownSeconds || 3) * 1000;
  const lastChatTime = userCooldowns.get(senderPhone) || 0;
  if (Date.now() - lastChatTime < cooldownMs) {
    console.log(`[WA-AI] ⏳ Cooldown aktif untuk ${senderPhone}, mengabaikan spam.`);
    return;
  }
  userCooldowns.set(senderPhone, Date.now());

  console.log(`\n[WA-AI] 📩 Pesan Masuk (Platform) dari ${senderPhone}: "${text}"`);

  // 7. Dapatkan Jawaban Cerdas dari AI / Knowledge Base
  const startTime = Date.now();
  const aiAnswer = await generateAIAnswer(text, senderPhone);
  const durationMs = Date.now() - startTime;

  // Simpan riwayat percakapan (maksimal 6 riwayat terakhir)
  const history = userHistories.get(senderPhone) || [];
  history.push({ role: 'user', content: text });
  history.push({ role: 'assistant', content: aiAnswer });
  if (history.length > 6) history.splice(0, history.length - 6);
  userHistories.set(senderPhone, history);

  // 8. Kirim Jawaban ke WhatsApp Pengguna via WAHA
  const sendResult = await sendWhatsAppReply(from, aiAnswer);
  if (sendResult.success) {
    console.log(`[WA-AI] ✅ Berhasil membalas ke ${senderPhone} dalam ${durationMs}ms:`);
    console.log(`----------------------------------------\n${aiAnswer}\n----------------------------------------`);
  }
}

// 8. HTTP Webhook Server & Control API
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Healthcheck
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'active',
      service: 'UjianPintar WhatsApp AI Bot',
      wahaUrl: botConfig.wahaBaseUrl,
      activeProvider: botConfig.activeProvider,
      isAutoReplyEnabled: botConfig.isAutoReplyEnabled,
      hasGemini: Boolean(botConfig.geminiApiKey),
      hasGroq: Boolean(botConfig.groqApiKey),
      hasDeepseek: Boolean(botConfig.deepseekApiKey),
      port: botConfig.botPort,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // GET Settings API (Untuk Super Admin)
  if (req.method === 'GET' && req.url === '/api/settings') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(botConfig));
    return;
  }

  // POST Settings API (Untuk Super Admin Update)
  if (req.method === 'POST' && req.url === '/api/settings') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const ok = updateBotConfig(parsed);
        res.writeHead(ok ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: ok, config: botConfig }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Webhook WAHA Pesan Masuk (HTTP Channel)
  if (req.method === 'POST') {
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));

      try {
        const eventData = JSON.parse(rawBody || '{}');
        const payload = eventData?.payload || eventData?.data || eventData;
        await processIncomingPayload(payload);
      } catch (err) {
        console.error('[WA-AI] Webhook parsing error:', err.message);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

// 8. WebSocket Receiver (Koneksi Langsung Real-time ke WAHA)
function startWahaWebSocket() {
  const wahaBase = (botConfig.wahaBaseUrl || 'https://api.ujianpintar.online/waha').replace(/\/+$/, '');
  const wsUrl = wahaBase.replace(/^http/, 'ws') + `/ws?x-api-key=${encodeURIComponent(botConfig.wahaApiKey)}&session=default&events=message&events=message.any`;

  console.log(`[WA-WS] 🔌 Menghubungkan WebSocket ke WAHA: ${wsUrl}`);
  
  let ws;
  try {
    ws = new WebSocket(wsUrl);
  } catch (err) {
    console.error('[WA-WS] Gagal inisialisasi WebSocket:', err.message);
    setTimeout(startWahaWebSocket, 5000);
    return;
  }

  ws.onopen = () => {
    console.log('[WA-WS] ⚡ Terhubung langsung ke WAHA via WebSocket! Siap menerima chat realtime tanpa kendala port/docker.');
  };

  ws.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`[WA-WS] 📩 Event WebSocket diterima: ${data.event}`);
      if (data.event && (data.event === 'message' || data.event.startsWith('message'))) {
        const payload = data.payload || data.data || data;
        if (payload) {
          await processIncomingPayload(payload);
        }
      }
    } catch (err) {
      console.error('[WA-WS] Error memproses event WebSocket:', err.message);
    }
  };

  ws.onerror = (err) => {
    console.warn('[WA-WS] WebSocket error:', err.message || err);
  };

  ws.onclose = () => {
    console.warn('[WA-WS] ⚠️ WebSocket terputus. Mencoba reconnect otomatis dalam 5 detik...');
    setTimeout(startWahaWebSocket, 5000);
  };
}

server.listen(botConfig.botPort, '0.0.0.0', () => {
  console.log('================================================================');
  console.log(`🤖 UjianPintar WhatsApp AI Bot Service Running on Port ${botConfig.botPort}`);
  console.log(`📡 WAHA URL: ${botConfig.wahaBaseUrl}`);
  console.log(`🧠 Provider Utama: ${botConfig.activeProvider.toUpperCase()}`);
  console.log(`🔑 Gemini AI: ${botConfig.geminiApiKey ? '✅ Terkonfigurasi' : '⚠️ Nonaktif'}`);
  console.log(`🔑 Groq AI: ${botConfig.groqApiKey ? '✅ Terkonfigurasi' : '⚠️ Nonaktif'}`);
  console.log(`🔑 DeepSeek AI: ${botConfig.deepseekApiKey ? '✅ Terkonfigurasi' : '⚠️ Nonaktif'}`);
  console.log(`🔑 Custom AI: ${botConfig.customBaseUrl && botConfig.customApiKey ? `✅ Terkonfigurasi (${botConfig.customModel || 'gpt-4o-mini'})` : '⚠️ Nonaktif'}`);
  console.log(`👤 Admin Hotline: ${botConfig.adminName} (${botConfig.adminPhone})`);
  console.log(`⚡ Auto-Reply: ${botConfig.isAutoReplyEnabled ? 'AKTIF' : 'NONAKTIF'}`);
  console.log(`🌐 Webhook Listener: http://localhost:${botConfig.botPort}/webhook`);
  console.log('================================================================');

  // Mulai koneksi WebSocket real-time ke WAHA
  startWahaWebSocket();
});

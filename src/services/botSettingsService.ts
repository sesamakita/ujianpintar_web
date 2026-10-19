import { supabaseAdmin } from './superAdminService';

export type BotAIProvider = 'gemini' | 'groq' | 'deepseek' | 'custom_openai' | 'fallback_local';

export interface WhatsAppBotSettings {
  activeProvider: BotAIProvider;
  geminiApiKey: string;
  geminiModel: string;
  groqApiKey: string;
  groqModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
  customBaseUrl: string;
  customApiKey: string;
  customModel: string;
  systemPrompt: string;
  adminName: string;
  adminPhone: string;
  isAutoReplyEnabled: boolean;
  cooldownSeconds: number;
  humanHandoverMinutes: number;
  wahaBaseUrl: string;
  wahaApiKey: string;
  updatedAt?: string;
}

export interface AITestResult {
  success: boolean;
  answer: string;
  latencyMs: number;
  provider: string;
  model: string;
  error?: string;
}

export interface ConnectionTestResult {
  valid: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  availableModels?: string[];
  message: string;
  error?: string;
}

export interface WahaSessionInfo {
  name: string;
  status: 'WORKING' | 'SCAN_QR_CODE' | 'STARTING' | 'STOPPED' | 'FAILED' | 'UNKNOWN';
  me?: {
    id: string;
    pushName?: string;
  } | null;
  engine?: {
    engine?: string;
    state?: string;
    WWebVersion?: string;
  };
  error?: string;
}

export interface WahaQrResult {
  success: boolean;
  qrDataUrl?: string;
  error?: string;
}

export const GEMINI_CANDIDATE_MODELS = [
  { ver: 'v1beta', name: 'gemini-2.0-flash' },
  { ver: 'v1beta', name: 'gemini-1.5-flash-latest' },
  { ver: 'v1beta', name: 'gemini-2.5-flash' },
  { ver: 'v1beta', name: 'gemini-2.0-flash-lite' },
  { ver: 'v1beta', name: 'gemini-1.5-flash' },
  { ver: 'v1beta', name: 'gemini-1.5-flash-001' },
  { ver: 'v1beta', name: 'gemini-1.5-flash-002' },
  { ver: 'v1', name: 'gemini-2.0-flash' },
  { ver: 'v1', name: 'gemini-1.5-flash' },
  { ver: 'v1beta', name: 'gemini-1.5-pro' },
];

/**
 * Menganalisis respon error dari Google AI Studio dan menerjemahkannya ke panduan solutif
 */
export const parseGeminiError = (errData: any, status: number): { isFatal: boolean; message: string } => {
  const reason = errData?.error?.details?.[0]?.reason || '';
  const rawMsg = errData?.error?.message || `HTTP ${status}`;

  if (reason === 'API_KEY_SERVICE_BLOCKED' || rawMsg.includes('API_KEY_SERVICE_BLOCKED') || rawMsg.includes('are blocked')) {
    return {
      isFatal: true,
      message: 'API Key diblokir oleh Google (API_KEY_SERVICE_BLOCKED). Kunci ini memiliki batasan API (API restrictions) di Google Cloud Console dan belum mengizinkan "Generative Language API". Buka Google Cloud Console > Credentials > Edit API Key lalu pilih "Don\'t restrict key" atau centang "Generative Language API", ATAU buat API Key baru yang bebas batasan di Google AI Studio (https://aistudio.google.com/app/apikey).',
    };
  }

  if (reason === 'SERVICE_DISABLED' || rawMsg.includes('SERVICE_DISABLED') || rawMsg.includes('has not been used in project') || rawMsg.includes('is disabled')) {
    const projectMatch = rawMsg.match(/project[ =](\d+)/i);
    const projectId = projectMatch ? projectMatch[1] : '';
    const link = projectId 
      ? `https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=${projectId}`
      : 'https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview';
    return {
      isFatal: true,
      message: `Layanan Generative Language API belum diaktifkan pada Google Cloud Project ${projectId ? '(' + projectId + ')' : ''}. Klik link ini untuk mengaktifkannya: ${link} lalu klik tombol "Enable", ATAU buat API Key baru langsung di Google AI Studio (https://aistudio.google.com/app/apikey).`,
    };
  }

  if (reason === 'API_KEY_INVALID' || rawMsg.includes('API key not valid')) {
    return {
      isFatal: true,
      message: 'API Key Google Gemini tidak valid. Harap periksa kembali karakter kunci API Anda di https://aistudio.google.com/app/apikey.',
    };
  }

  if (status === 429 || rawMsg.includes('Resource has been exhausted') || rawMsg.includes('Quota exceeded')) {
    return {
      isFatal: true,
      message: 'Batas kuota gratis (Rate Limit) Google Gemini telah tercapai untuk saat ini (HTTP 429). Harap tunggu 1-2 menit sebelum mencoba kembali.',
    };
  }

  return {
    isFatal: false,
    message: rawMsg,
  };
};

/**
 * Mendeteksi daftar model yang aktif dan didukung oleh API Key Google Gemini
 */
export const discoverAvailableGeminiModels = async (apiKey: string): Promise<{
  success: boolean;
  models: string[];
  bestModel?: string;
  bestVer?: string;
  error?: string;
}> => {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, models: [], error: 'API Key belum diisi.' };
  }

  let fatalErrMessage = '';

  for (const ver of ['v1beta', 'v1']) {
    try {
      const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(cleanKey)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data?.models) ? data.models : [];
        const supported: string[] = rawList
          .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => (m.name || '').replace(/^models\//, ''))
          .filter(Boolean);

        if (supported.length > 0) {
          const priority = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
          let best = supported.find((m: string) => priority.includes(m)) || supported[0];

          return {
            success: true,
            models: supported,
            bestModel: best,
            bestVer: ver,
          };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const parsed = parseGeminiError(errData, res.status);
        if (parsed.isFatal) {
          fatalErrMessage = parsed.message;
          return {
            success: false,
            models: [],
            error: parsed.message,
          };
        }
      }
    } catch {
      // lanjut coba endpoint berikutnya
    }
  }

  return {
    success: false,
    models: GEMINI_CANDIDATE_MODELS.map(c => c.name),
    bestModel: 'gemini-2.0-flash',
    bestVer: 'v1beta',
    error: fatalErrMessage || 'Tidak dapat mengambil daftar model langsung, menggunakan kandidat standar.',
  };
};

export const STORAGE_KEY_BOT_SETTINGS = 'ujianpintar_whatsapp_bot_settings';

export const DEFAULT_BOT_SYSTEM_PROMPT = `Anda adalah "Tim Layanan & Konsultan Pendidikan Resmi UjianPintar" (https://ujianpintar.online).
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

export const DEFAULT_BOT_SETTINGS: WhatsAppBotSettings = {
  activeProvider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  groqApiKey: '',
  groqModel: 'llama-3.3-70b-versatile',
  deepseekApiKey: '',
  deepseekModel: 'deepseek-chat',
  customBaseUrl: 'https://api.groq.com/openai/v1',
  customApiKey: '',
  customModel: 'llama-3.3-70b-versatile',
  systemPrompt: DEFAULT_BOT_SYSTEM_PROMPT,
  adminName: 'Deni Indrayana',
  adminPhone: '0821-9692-9193',
  isAutoReplyEnabled: true,
  cooldownSeconds: 3,
  humanHandoverMinutes: 30,
  wahaBaseUrl: (import.meta.env.VITE_WAHA_BASE_URL || 'https://api.ujianpintar.online/waha').trim(),
  wahaApiKey: (import.meta.env.VITE_WAHA_API_KEY || 'WahaUjianPintar2026').trim(),
};

// Fallback Offline Knowledge Base jika tanpa API Key
const FALLBACK_KNOWLEDGE_BASE = [
  {
    keywords: ['harga', 'biaya', 'bayar', 'tarif', 'pro', 'gratis', 'paket', 'lisensi'],
    answer: `Halo! Berikut informasi pilihan paket layanan resmi UjianPintar (Sesuai Buku Induk):

1. *Guru Basic (Gratis):*
• Kuota 3 sesi ujian/bulan (kelas >10 siswa)
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

Untuk pembayaran dan aktivasi instan, silakan buka menu Langganan di aplikasi atau hubungi Admin {ADMIN_NAME} ({ADMIN_PHONE}).`,
  },
  {
    keywords: ['curang', 'aman', 'kunci', 'keamanan', 'anti', 'pindah', 'layar', 'proctoring'],
    answer: `Fitur Keamanan Anti-Curang di UjianPintar:
1. *Kunci Layar Penuh (Fullscreen Lock):* Siswa terkunci di layar ujian.
2. *Deteksi Beralih Aplikasi / Tab:* Mencatat setiap kali siswa mencoba keluar layar.
3. *Acak Soal & Opsi Otomatis:* Nomor dan pilihan A-E diacak per siswa.
4. *Live Proctoring Real-Time:* Guru memantau telemetri siswa (Aman/Waspada/Curang) langsung dari HP guru.`,
  },
  {
    keywords: ['word', 'excel', 'impor', 'upload', 'file', 'bank soal'],
    answer: `Cara Impor Soal dari Word/Excel ke UjianPintar:
1. Buka UjianPintar > Masuk ke Paket Ujian.
2. Klik tombol *"Impor Word (.docx)"* atau *"Impor Excel (.xlsx)"*.
3. Sistem secara otomatis mendeteksi teks soal, opsi A sampai E, dan kunci jawaban.
4. Bank soal langsung siap digunakan untuk ujian siswa.`,
  },
  {
    keywords: ['kontak', 'admin', 'hotline', 'wa', 'nomor', 'telepon', 'pemilik', 'deni'],
    answer: `Hotline Resmi UjianPintar:
• Admin & Pengembang: {ADMIN_NAME}
• Nomor WhatsApp: {ADMIN_PHONE}
• Website Resmi: https://ujianpintar.online

Admin kami akan segera membalas pesan Anda jika Anda membutuhkan asistensi khusus atau penawaran resmi.`,
  },
];

export const botSettingsService = {
  /**
   * Mengambil pengaturan bot saat ini (dari Supabase atau LocalStorage)
   */
  getSettings(): WhatsAppBotSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BOT_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_BOT_SETTINGS,
          ...parsed,
        };
      }
    } catch (e) {
      console.warn('Gagal membaca bot settings dari localStorage:', e);
    }

    // Auto-detect Gemini key dari pengaturan Guru jika bot key masih kosong
    const detectedGeminiKey = 
      localStorage.getItem('ujianpintar_gemini_api_key') || 
      ((): string => {
        try {
          const ai = localStorage.getItem('ujianpintar_ai_settings');
          return ai ? JSON.parse(ai).geminiApiKey || '' : '';
        } catch {
          return '';
        }
      })();

    return {
      ...DEFAULT_BOT_SETTINGS,
      geminiApiKey: detectedGeminiKey || '',
    };
  },

  /**
   * Menyimpan pengaturan bot ke LocalStorage dan mencoba sync ke Supabase VPS
   */
  async saveSettings(settings: WhatsAppBotSettings): Promise<{ success: boolean; message: string; supabaseSynced: boolean }> {
    const updated: WhatsAppBotSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    // 1. Simpan ke LocalStorage
    localStorage.setItem(STORAGE_KEY_BOT_SETTINGS, JSON.stringify(updated));

    // 2. Coba simpan ke Supabase VPS tabel 'bot_settings' atau 'system_settings'
    let supabaseSynced = false;
    try {
      const { error } = await supabaseAdmin
        .from('bot_settings')
        .upsert(
          {
            key: 'whatsapp_ai_bot',
            value: updated,
            updated_at: updated.updatedAt,
          },
          { onConflict: 'key' }
        );

      if (!error) {
        supabaseSynced = true;
      }
    } catch {
      // Tabel mungkin belum dibuat di database, lanjutkan dengan safe fallback
    }

    return {
      success: true,
      supabaseSynced,
      message: supabaseSynced
        ? 'Pengaturan Otak Bot AI berhasil disimpan dan tersinkronisasi ke database VPS!'
        : 'Pengaturan Otak Bot AI berhasil disimpan di browser (Siap diekspor ke VPS bot-settings.json).',
    };
  },

  /**
   * Reset prompt dan konfigurasi ke setelan awal resmi UjianPintar
   */
  resetToDefault(): WhatsAppBotSettings {
    const current = this.getSettings();
    return {
      ...DEFAULT_BOT_SETTINGS,
      geminiApiKey: current.geminiApiKey,
      groqApiKey: current.groqApiKey,
      deepseekApiKey: current.deepseekApiKey,
    };
  },

  /**
   * Uji Respon AI Langsung di Panel Super Admin (Simulator Chatbot)
   */
  async testBotAIResponse(settings: WhatsAppBotSettings, testPrompt: string): Promise<AITestResult> {
    const startTime = performance.now();
    const prompt = testPrompt.trim();
    if (!prompt) {
      return {
        success: false,
        answer: 'Pertanyaan uji tidak boleh kosong.',
        latencyMs: 0,
        provider: settings.activeProvider,
        model: '-',
        error: 'Pertanyaan kosong',
      };
    }

    // Ganti placeholder {ADMIN_NAME} dan {ADMIN_PHONE}
    const resolvedPrompt = settings.systemPrompt
      .replace(/{ADMIN_NAME}/g, settings.adminName || 'Deni Indrayana')
      .replace(/{ADMIN_PHONE}/g, settings.adminPhone || '0821-9692-9193');

    // 1. Mode Fallback Local KB
    if (settings.activeProvider === 'fallback_local') {
      const lower = prompt.toLowerCase();
      let matched = FALLBACK_KNOWLEDGE_BASE.find(item =>
        item.keywords.some(kw => lower.includes(kw))
      );

      const latencyMs = Math.round(performance.now() - startTime);
      const answer = (matched ? matched.answer : `Halo! Saya Asisten WhatsApp Resmi UjianPintar (https://ujianpintar.online). Ada yang bisa kami bantu seputar asesmen sekolah anti-curang, paket PRO, atau lisensi sekolah?`)
        .replace(/{ADMIN_NAME}/g, settings.adminName)
        .replace(/{ADMIN_PHONE}/g, settings.adminPhone);

      return {
        success: true,
        answer,
        latencyMs,
        provider: 'Fallback Knowledge Base (Offline)',
        model: 'Keyword Regex Engine',
      };
    }

    // 2. Google Gemini AI Studio
    if (settings.activeProvider === 'gemini') {
      const apiKey = settings.geminiApiKey.trim();
      if (!apiKey) {
        return {
          success: false,
          answer: 'API Key Google Gemini belum diisi. Masukkan API Key Anda atau gunakan Fallback Knowledge Base.',
          latencyMs: 0,
          provider: 'Google Gemini',
          model: settings.geminiModel || 'gemini-2.0-flash',
          error: 'Missing Gemini API Key',
        };
      }

      // Daftar kandidat model otomatis untuk mencegah error 404 jika model tertentu dinonaktifkan oleh Google
      const candidates = [
        { ver: 'v1beta', name: settings.geminiModel || 'gemini-2.0-flash' },
        { ver: 'v1beta', name: 'gemini-2.0-flash' },
        { ver: 'v1beta', name: 'gemini-1.5-flash-latest' },
        { ver: 'v1beta', name: 'gemini-2.5-flash' },
        { ver: 'v1', name: 'gemini-2.0-flash' },
        { ver: 'v1beta', name: 'gemini-2.0-flash-lite' },
        { ver: 'v1beta', name: 'gemini-1.5-flash' },
        { ver: 'v1', name: 'gemini-1.5-flash' },
      ];

      const seen = new Set();
      const uniqueCandidates = candidates.filter(c => {
        const k = `${c.ver}:${c.name}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      let lastError = '';
      for (const cand of uniqueCandidates) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/${cand.ver}/models/${cand.name}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${resolvedPrompt}\n\nPertanyaan Pengguna WhatsApp: "${prompt}"\nBalas dengan singkat, jelas, ramah, dan solutif:` }],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 600,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (answer) {
              const latencyMs = Math.round(performance.now() - startTime);
              // Otomatis simpan model yang terbukti berhasil
              if (settings.geminiModel !== cand.name) {
                settings.geminiModel = cand.name;
                localStorage.setItem(STORAGE_KEY_BOT_SETTINGS, JSON.stringify(settings));
              }
              return {
                success: true,
                answer,
                latencyMs,
                provider: 'Google Gemini',
                model: cand.name,
              };
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            const parsed = parseGeminiError(errData, res.status);
            lastError = parsed.message;
            if (parsed.isFatal) {
              break;
            }
          }
        } catch (err: any) {
          lastError = err.message;
        }
      }

      return {
        success: false,
        answer: `Gagal memanggil Google Gemini: ${lastError}`,
        latencyMs: Math.round(performance.now() - startTime),
        provider: 'Google Gemini',
        model: settings.geminiModel || 'gemini-2.0-flash',
        error: lastError,
      };
    }

    // 3. Groq (Llama 3.3 / Llama 3.1)
    if (settings.activeProvider === 'groq') {
      const apiKey = settings.groqApiKey.trim();
      if (!apiKey) {
        return {
          success: false,
          answer: 'API Key Groq belum diisi. Dapatkan API Key gratis di https://console.groq.com',
          latencyMs: 0,
          provider: 'Groq Cloud',
          model: settings.groqModel || 'llama-3.3-70b-versatile',
          error: 'Missing Groq API Key',
        };
      }

      const model = settings.groqModel || 'llama-3.3-70b-versatile';
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: resolvedPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 600,
          }),
        });

        const latencyMs = Math.round(performance.now() - startTime);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const answer = data.choices?.[0]?.message?.content?.trim() || 'Tidak ada balasan dari Groq AI.';

        return {
          success: true,
          answer,
          latencyMs,
          provider: 'Groq Cloud (Ultra Fast)',
          model,
        };
      } catch (err: any) {
        return {
          success: false,
          answer: `Gagal memanggil Groq: ${err.message}`,
          latencyMs: Math.round(performance.now() - startTime),
          provider: 'Groq Cloud',
          model,
          error: err.message,
        };
      }
    }

    // 4. DeepSeek
    if (settings.activeProvider === 'deepseek') {
      const apiKey = settings.deepseekApiKey.trim();
      if (!apiKey) {
        return {
          success: false,
          answer: 'API Key DeepSeek belum diisi. Dapatkan di https://platform.deepseek.com',
          latencyMs: 0,
          provider: 'DeepSeek AI',
          model: settings.deepseekModel || 'deepseek-chat',
          error: 'Missing DeepSeek API Key',
        };
      }

      const model = settings.deepseekModel || 'deepseek-chat';
      try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: resolvedPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 600,
          }),
        });

        const latencyMs = Math.round(performance.now() - startTime);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const answer = data.choices?.[0]?.message?.content?.trim() || 'Tidak ada balasan dari DeepSeek.';

        return {
          success: true,
          answer,
          latencyMs,
          provider: 'DeepSeek AI',
          model,
        };
      } catch (err: any) {
        return {
          success: false,
          answer: `Gagal memanggil DeepSeek: ${err.message}`,
          latencyMs: Math.round(performance.now() - startTime),
          provider: 'DeepSeek AI',
          model,
          error: err.message,
        };
      }
    }

    // 5. Custom OpenAI-Compatible
    if (settings.activeProvider === 'custom_openai') {
      const baseUrl = settings.customBaseUrl.replace(/\/+$/, '');
      const apiKey = settings.customApiKey.trim();
      const model = settings.customModel.trim() || 'gpt-4o-mini';

      if (!baseUrl) {
        return {
          success: false,
          answer: 'Base URL penyedia AI kustom belum diisi.',
          latencyMs: 0,
          provider: 'Custom OpenAI',
          model,
          error: 'Missing Base URL',
        };
      }

      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: resolvedPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 600,
          }),
        });

        const latencyMs = Math.round(performance.now() - startTime);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const answer = data.choices?.[0]?.message?.content?.trim() || 'Tidak ada balasan dari Custom AI.';

        return {
          success: true,
          answer,
          latencyMs,
          provider: 'Custom OpenAI Compatible',
          model,
        };
      } catch (err: any) {
        return {
          success: false,
          answer: `Gagal memanggil Custom AI: ${err.message}`,
          latencyMs: Math.round(performance.now() - startTime),
          provider: 'Custom OpenAI Compatible',
          model,
          error: err.message,
        };
      }
    }

    return {
      success: false,
      answer: 'Provider AI tidak dikenali.',
      latencyMs: 0,
      provider: 'Unknown',
      model: '-',
    };
  },

  /**
   * Cek Sambungan & Validasi Koneksi API secara Eksplisit Sebelum Digunakan
   */
  async testProviderConnection(settings: WhatsAppBotSettings, providerOverride?: BotAIProvider): Promise<ConnectionTestResult> {
    const provider = providerOverride || settings.activeProvider;
    const startTime = performance.now();

    // 1. Fallback Local KB
    if (provider === 'fallback_local') {
      return {
        valid: true,
        provider: 'Fallback Knowledge Base (Offline)',
        model: 'Keyword Regex Engine',
        latencyMs: 1,
        message: '✓ Basis pengetahuan lokal offline aktif dan siap digunakan (100% gratis tanpa API key).',
      };
    }

    // 2. Google Gemini
    if (provider === 'gemini') {
      const apiKey = settings.geminiApiKey.trim();
      if (!apiKey) {
        return {
          valid: false,
          provider: 'Google Gemini',
          model: '-',
          latencyMs: 0,
          message: 'API Key Google Gemini belum diisi. Masukkan kunci API dari Google AI Studio terlebih dahulu.',
          error: 'API Key kosong',
        };
      }

      // Ambil daftar model yang didukung dari ListModels Google
      const discovery = await discoverAvailableGeminiModels(apiKey);
      if (!discovery.success && discovery.error && (discovery.error.includes('diblokir') || discovery.error.includes('belum diaktifkan') || discovery.error.includes('tidak valid'))) {
        return {
          valid: false,
          provider: 'Google Gemini',
          model: '-',
          latencyMs: Math.round(performance.now() - startTime),
          availableModels: [],
          message: discovery.error,
          error: discovery.error,
        };
      }

      const candidates = [
        { ver: discovery.bestVer || 'v1beta', name: discovery.bestModel || settings.geminiModel || 'gemini-2.0-flash' },
        { ver: 'v1beta', name: 'gemini-2.0-flash' },
        { ver: 'v1beta', name: 'gemini-1.5-flash-latest' },
        { ver: 'v1beta', name: 'gemini-2.5-flash' },
        { ver: 'v1', name: 'gemini-2.0-flash' },
        { ver: 'v1beta', name: 'gemini-2.0-flash-lite' },
        { ver: 'v1beta', name: 'gemini-1.5-flash' },
      ];

      const seen = new Set();
      const uniqueCandidates = candidates.filter(c => {
        const k = `${c.ver}:${c.name}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      let lastErr = discovery.error || '';
      for (const cand of uniqueCandidates) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/${cand.ver}/models/${cand.name}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Tes koneksi sistem UjianPintar. Balas satu kata "ONLINE".' }] }],
              generationConfig: { maxOutputTokens: 10, temperature: 0.1 },
            }),
          });

          if (res.ok) {
            const latencyMs = Math.round(performance.now() - startTime);
            settings.geminiModel = cand.name;
            localStorage.setItem(STORAGE_KEY_BOT_SETTINGS, JSON.stringify(settings));

            return {
              valid: true,
              provider: 'Google Gemini',
              model: cand.name,
              latencyMs,
              availableModels: discovery.models.length > 0 ? discovery.models : [cand.name],
              message: `✓ Sambungan Google Gemini Berhasil! Model terverifikasi: ${cand.name} (${latencyMs}ms). Siap digunakan.`,
            };
          } else {
            const errData = await res.json().catch(() => ({}));
            const parsed = parseGeminiError(errData, res.status);
            lastErr = parsed.message;
            if (parsed.isFatal) {
              break; // Fatal API key restriction or disabled service, stop candidate loop
            }
          }
        } catch (e: any) {
          lastErr = e.message;
        }
      }

      return {
        valid: false,
        provider: 'Google Gemini',
        model: settings.geminiModel || 'gemini-2.0-flash',
        latencyMs: Math.round(performance.now() - startTime),
        availableModels: discovery.models,
        message: lastErr.includes('diblokir') || lastErr.includes('belum diaktifkan') || lastErr.includes('tidak valid')
          ? lastErr
          : `Gagal memverifikasi API Key Google Gemini: ${lastErr}. Pastikan kunci API aktif di Google AI Studio.`,
        error: lastErr,
      };
    }

    // 3. Groq Cloud
    if (provider === 'groq') {
      const apiKey = settings.groqApiKey.trim();
      if (!apiKey) {
        return {
          valid: false,
          provider: 'Groq Cloud',
          model: '-',
          latencyMs: 0,
          message: 'API Key Groq belum diisi.',
          error: 'API Key kosong',
        };
      }

      const model = settings.groqModel || 'llama-3.3-70b-versatile';
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Ping test' }],
            max_tokens: 10,
          }),
        });

        const latencyMs = Math.round(performance.now() - startTime);
        if (res.ok) {
          return {
            valid: true,
            provider: 'Groq Cloud',
            model,
            latencyMs,
            message: `✓ Sambungan Groq Cloud Berhasil! Model: ${model} (${latencyMs}ms). Respon kilat siap digunakan.`,
          };
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${res.status}`;
        return {
          valid: false,
          provider: 'Groq Cloud',
          model,
          latencyMs,
          message: `Gagal terhubung ke Groq: ${errMsg}`,
          error: errMsg,
        };
      } catch (err: any) {
        return {
          valid: false,
          provider: 'Groq Cloud',
          model,
          latencyMs: Math.round(performance.now() - startTime),
          message: `Kesalahan jaringan: ${err.message}`,
          error: err.message,
        };
      }
    }

    // 4. DeepSeek
    if (provider === 'deepseek') {
      const apiKey = settings.deepseekApiKey.trim();
      if (!apiKey) {
        return {
          valid: false,
          provider: 'DeepSeek AI',
          model: '-',
          latencyMs: 0,
          message: 'API Key DeepSeek belum diisi.',
          error: 'API Key kosong',
        };
      }

      const model = settings.deepseekModel || 'deepseek-chat';
      try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Ping test' }],
            max_tokens: 10,
          }),
        });

        const latencyMs = Math.round(performance.now() - startTime);
        if (res.ok) {
          return {
            valid: true,
            provider: 'DeepSeek AI',
            model,
            latencyMs,
            message: `✓ Sambungan DeepSeek AI Berhasil! Model: ${model} (${latencyMs}ms).`,
          };
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${res.status}`;
        return {
          valid: false,
          provider: 'DeepSeek AI',
          model,
          latencyMs,
          message: `Gagal terhubung ke DeepSeek: ${errMsg}`,
          error: errMsg,
        };
      } catch (err: any) {
        return {
          valid: false,
          provider: 'DeepSeek AI',
          model,
          latencyMs: Math.round(performance.now() - startTime),
          message: `Kesalahan jaringan: ${err.message}`,
          error: err.message,
        };
      }
    }

    // 5. Custom OpenAI
    if (provider === 'custom_openai') {
      const baseUrl = settings.customBaseUrl.replace(/\/+$/, '');
      const apiKey = settings.customApiKey.trim();
      const model = settings.customModel || 'gpt-4o-mini';
      if (!baseUrl || !apiKey) {
        return {
          valid: false,
          provider: 'Custom AI',
          model,
          latencyMs: 0,
          message: 'Base URL atau API Key AI kustom belum lengkap.',
          error: 'Missing config',
        };
      }

      try {
        const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Ping test' }],
            max_tokens: 10,
          }),
        });

        const latencyMs = Math.round(performance.now() - startTime);
        if (res.ok) {
          return {
            valid: true,
            provider: 'Custom AI',
            model,
            latencyMs,
            message: `✓ Sambungan AI Kustom Berhasil! Model: ${model} (${latencyMs}ms).`,
          };
        }
        const errData = await res.json().catch(() => ({}));
        return {
          valid: false,
          provider: 'Custom AI',
          model,
          latencyMs,
          message: `Gagal terhubung (${res.status}): ${errData?.error?.message || res.statusText}`,
        };
      } catch (e: any) {
        return {
          valid: false,
          provider: 'Custom AI',
          model,
          latencyMs: Math.round(performance.now() - startTime),
          message: `Kesalahan jaringan atau CORS: ${e.message}`,
        };
      }
    }

    return {
      valid: false,
      provider: 'Unknown',
      model: '-',
      latencyMs: 0,
      message: 'Provider tidak dikenali.',
    };
  },

  /**
   * Menghasilkan teks JSON konfigurasi untuk vps-bot/bot-settings.json
   */
  generateBotSettingsJson(settings: WhatsAppBotSettings): string {
    return JSON.stringify(settings, null, 2);
  },

  /**
   * Menghasilkan format .env untuk vps-bot/.env
   */
  generateEnvSnippet(settings: WhatsAppBotSettings): string {
    return `# ==============================================================
# KONFIGURASI WHATSAPP AI BOT (UJIANPINTAR)
# Terakhir diperbarui dari Super Admin: ${new Date().toLocaleString('id-ID')}
# ==============================================================
BOT_PORT=3099
WAHA_BASE_URL=${settings.wahaBaseUrl || 'https://api.ujianpintar.online/waha'}
WAHA_API_KEY=${settings.wahaApiKey || 'WahaUjianPintar2026'}

# Kunci API AI
GEMINI_API_KEY=${settings.geminiApiKey}
GROQ_API_KEY=${settings.groqApiKey}
DEEPSEEK_API_KEY=${settings.deepseekApiKey}

# Kontak Admin & Hotline
ADMIN_NAME="${settings.adminName}"
ADMIN_PHONE="${settings.adminPhone}"

# Mode Otomatis
BOT_AUTO_REPLY=${settings.isAutoReplyEnabled ? 'true' : 'false'}
BOT_COOLDOWN_SECONDS=${settings.cooldownSeconds}
BOT_HANDOVER_MINUTES=${settings.humanHandoverMinutes}
`;
  },

  /**
   * Menghasilkan query SQL untuk membuat tabel bot_settings di Supabase VPS jika diperlukan
   */
  generateSqlSnippet(): string {
    return `-- Buat tabel bot_settings di Supabase VPS (Jalankan sekali di SQL Editor Supabase):
CREATE TABLE IF NOT EXISTS public.bot_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Berikan hak akses kepada service_role
GRANT ALL ON public.bot_settings TO service_role;
GRANT SELECT ON public.bot_settings TO anon, authenticated;
`;
  },

  /**
   * Mengambil status sesi WAHA (WhatsApp Gateway) di VPS
   */
  async getWahaSession(sessionName = 'default'): Promise<WahaSessionInfo> {
    const settings = this.getSettings();
    const baseUrl = (settings.wahaBaseUrl || 'https://api.ujianpintar.online/waha').replace(/\/+$/, '');
    const apiKey = (settings.wahaApiKey || 'WahaUjianPintar2026').trim();

    try {
      const res = await fetch(`${baseUrl}/api/sessions/${sessionName}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          return {
            name: sessionName,
            status: 'STOPPED',
            error: 'Sesi belum dibuat di server WAHA.',
          };
        }
        return {
          name: sessionName,
          status: 'UNKNOWN',
          error: `HTTP ${res.status}: Gagal memuat info sesi.`,
        };
      }

      const data = await res.json();
      return {
        name: data.name || sessionName,
        status: data.status || 'UNKNOWN',
        me: data.me || null,
        engine: data.engine || {},
      };
    } catch (err: any) {
      return {
        name: sessionName,
        status: 'UNKNOWN',
        error: err.message || 'Tidak dapat terhubung ke endpoint WAHA.',
      };
    }
  },

  /**
   * Mengambil gambar QR Code terkini untuk dipindai WhatsApp
   */
  async getWahaQr(sessionName = 'default'): Promise<WahaQrResult> {
    const settings = this.getSettings();
    const baseUrl = (settings.wahaBaseUrl || 'https://api.ujianpintar.online/waha').replace(/\/+$/, '');
    const apiKey = (settings.wahaApiKey || 'WahaUjianPintar2026').trim();

    try {
      const res = await fetch(`${baseUrl}/api/${sessionName}/auth/qr`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      if (!res.ok) {
        return {
          success: false,
          error: `HTTP ${res.status}: QR Code belum siap atau sesi sudah terhubung.`,
        };
      }

      const data = await res.json();
      if (data?.data) {
        const mime = data.mimetype || 'image/png';
        const dataUrl = data.data.startsWith('data:') ? data.data : `data:${mime};base64,${data.data}`;
        return {
          success: true,
          qrDataUrl: dataUrl,
        };
      }

      return {
        success: false,
        error: 'Data gambar QR Code kosong.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Gagal memuat QR Code dari WAHA.',
      };
    }
  },

  /**
   * Memulai sesi WAHA (Start Session)
   */
  async startWahaSession(sessionName = 'default'): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    const baseUrl = (settings.wahaBaseUrl || 'https://api.ujianpintar.online/waha').replace(/\/+$/, '');
    const apiKey = (settings.wahaApiKey || 'WahaUjianPintar2026').trim();

    try {
      let res = await fetch(`${baseUrl}/api/sessions/${sessionName}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      // Jika 404 (sesi belum ada), buat sesi terlebih dahulu
      if (res.status === 404) {
        const createRes = await fetch(`${baseUrl}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
          body: JSON.stringify({ name: sessionName }),
        });
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          return { success: false, message: err?.message || `Gagal membuat sesi (HTTP ${createRes.status})` };
        }
        res = await fetch(`${baseUrl}/api/sessions/${sessionName}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
        });
      }

      if (res.ok) {
        return { success: true, message: 'Sesi WhatsApp berhasil dijalankan. Silakan scan QR code jika belum terhubung.' };
      }

      const errJson = await res.json().catch(() => ({}));
      return { success: false, message: errJson?.message || `Gagal memulai sesi (HTTP ${res.status})` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server WAHA.' };
    }
  },

  /**
   * Restart sesi WAHA (Stop kemudian Start untuk pemulihan dari status FAILED)
   */
  async restartWahaSession(sessionName = 'default'): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    const baseUrl = (settings.wahaBaseUrl || 'https://api.ujianpintar.online/waha').replace(/\/+$/, '');
    const apiKey = (settings.wahaApiKey || 'WahaUjianPintar2026').trim();

    try {
      // 1. Coba hentikan sesi terlebih dahulu
      await fetch(`${baseUrl}/api/sessions/${sessionName}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
      }).catch(() => {});

      // Tunggu 1.5 detik agar Chromium/WEBJS tertutup bersih
      await new Promise(r => setTimeout(r, 1500));

      // 2. Jalankan kembali sesi
      const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      if (res.ok) {
        return { success: true, message: 'Sesi WhatsApp berhasil dipulihkan & dijalankan ulang. QR Code baru telah aktif.' };
      }
      return { success: false, message: `Gagal menjalankan ulang sesi (HTTP ${res.status})` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server WAHA.' };
    }
  },

  /**
   * Meminta Kode Pairing 8 Karakter (Tautkan WhatsApp dengan nomor telepon di HP)
   */
  async requestWahaPairingCode(phone: string, sessionName = 'default'): Promise<{ success: boolean; code?: string; error?: string }> {
    const settings = this.getSettings();
    const baseUrl = (settings.wahaBaseUrl || 'https://api.ujianpintar.online/waha').replace(/\/+$/, '');
    const apiKey = (settings.wahaApiKey || 'WahaUjianPintar2026').trim();

    // Standardisasi nomor ke 628...
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean.startsWith('62')) clean = '62' + clean;

    try {
      // Pastikan sesi aktif (jika STOPPED atau FAILED, restart dulu)
      const session = await this.getWahaSession(sessionName);
      if (session.status === 'STOPPED' || session.status === 'FAILED') {
        await this.restartWahaSession(sessionName);
        await new Promise(r => setTimeout(r, 3000));
      }

      const res = await fetch(`${baseUrl}/api/${sessionName}/auth/request-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ phoneNumber: clean }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.code) {
        return {
          success: true,
          code: data.code,
        };
      }

      return {
        success: false,
        error: data?.error || data?.message || `Gagal meminta kode pairing (HTTP ${res.status})`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Gagal menghubungi server WAHA.',
      };
    }
  },

  /**
   * Logout sesi WhatsApp dari WAHA
   */
  async logoutWahaSession(sessionName = 'default'): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    const baseUrl = (settings.wahaBaseUrl || 'https://api.ujianpintar.online/waha').replace(/\/+$/, '');
    const apiKey = (settings.wahaApiKey || 'WahaUjianPintar2026').trim();

    try {
      const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      if (res.ok) {
        return { success: true, message: 'Berhasil keluar dari akun WhatsApp. Anda dapat memindai QR code atau menggunakan kode pairing baru.' };
      }
      return { success: false, message: `Gagal logout sesi (HTTP ${res.status})` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server WAHA.' };
    }
  },
};

import React from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Camera, 
  Database, 
  FileCheck2, 
  Trash2, 
  Mail, 
  Phone, 
  CheckCircle2,
  Server
} from 'lucide-react';
import { AppLogoBadge } from '../common/AppLogo';

interface PrivacyPolicyPageProps {
  onBackToHome: () => void;
  isDarkMode?: boolean;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBackToHome, isDarkMode = false }) => {
  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Navigation Header */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                isDarkMode 
                  ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200' 
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <AppLogoBadge size="sm" />
            <span className={`font-bold font-display text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              UjianPintar
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Title Banner */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Dokumen Resmi Privasi & Perlindungan Data</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900 dark:text-white mb-3">
            Kebijakan Privasi (Privacy Policy)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Terakhir diperbarui: <strong>13 November 2026</strong> • Berlaku untuk Platform Web & Aplikasi Android UjianPintar (<code>com.ujianpintar.student</code>).
          </p>
        </div>

        <div className={`p-6 sm:p-8 rounded-2xl border space-y-8 text-sm leading-relaxed ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>1. Pendahuluan & Identitas Pengembang</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Selamat datang di <strong>UjianPintar</strong> (https://ujianpintar.online), platform asesmen dan ujian digital berbasis sekolah yang dikembangkan oleh <strong>PT Berdikari Bangun Bangsa (DN Apps)</strong>.
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Kebijakan Privasi ini menerangkan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi pengguna saat mengakses platform web maupun menggunakan aplikasi mobile Android <strong>UjianPintar Siswa</strong> (ID Paket: <code>com.ujianpintar.student</code>).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>2. Informasi yang Kami Kumpulkan</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Untuk menyelenggarakan ujian yang tertib, adil, dan akurat, sistem mengumpulkan data terbatas berikut:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 pl-1">
              <li>
                <strong>Data Peserta Ujian (Siswa):</strong> Nama lengkap, Nomor Induk Siswa Nasional (NISN), kelas/rombel, dan nama sekolah yang dimasukkan saat memulai sesi ujian.
              </li>
              <li>
                <strong>Data Jawaban & Penilaian:</strong> Pilihan jawaban ujian, esai, waktu mulai mengerjakan, durasi pengerjaan, dan rekap skor kelulusan siswa.
              </li>
              <li>
                <strong>Log Integritas & Pengawasan (Anti-Curang):</strong> Deteksi peristiwa saat siswa meninggalkan jendela ujian atau berpindah aplikasi (tab-switch/exit) untuk dilaporkan secara langsung ke dashboard guru pengawas resmi sekolah.
              </li>
              <li>
                <strong>Data Akun Guru/Sekolah:</strong> Nama guru, alamat email terdaftar, nama instansi sekolah, mata pelajaran, dan nomor WhatsApp untuk pengiriman token sesi dan rekap hasil ujian.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>3. Penggunaan Izin Khusus Perangkat (Google Play Permissions)</span>
            </h2>
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Izin Akses Kamera (<code>android.permission.CAMERA</code>)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Izin kamera pada aplikasi Android <strong>HANYA</strong> digunakan untuk memindai (scan) kode QR sesi ujian yang ditampilkan oleh guru pengawas. Aplikasi <strong>TIDAK PERNAH</strong> mengambil foto, merekam video wajah siswa secara diam-diam, atau mengunggah rekaman visual ke server.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shrink-0 mt-0.5">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Akses Jaringan Internet (<code>INTERNET</code> & <code>ACCESS_NETWORK_STATE</code>)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Digunakan untuk mengunduh butir soal terenkripsi dan mengirimkan lembar jawaban siswa langsung ke server basis data sekolah secara waktu-nyata (realtime).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>4. Keamanan & Kerahasiaan Data (Data Security)</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Keamanan data pribadi dan integritas akademik Anda adalah prioritas utama kami. Kami menerapkan standar perlindungan berikut:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300 pl-1">
              <li>Seluruh transmisi data antara aplikasi mobile, web browser, dan basis data dienkripsi dengan protokol <strong>HTTPS / TLS 1.3</strong>.</li>
              <li>Sistem basis data PostgreSQL dilindungi dengan <strong>Row Level Security (RLS)</strong> ketat, memastikan hanya guru pemilik kelas yang dapat melihat rekap nilai siswanya.</li>
              <li>Kami <strong>TIDAK PERNAH</strong> menjual, memperdagangkan, atau membagikan data siswa/guru kepada pihak ketiga pengiklan atau pialang data manapun.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span>5. Masa Retensi & Hak Penghapusan Data (Data Deletion)</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Sesuai kebijakan kepatuhan Google Play dan regulasi perlindungan data pribadi:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300 pl-1">
              <li>Data sesi telemetri live dan jawaban siswa dibersihkan secara otomatis sesuai masa retensi paket akun sekolah.</li>
              <li>Guru atau pengelola sekolah dapat menghapus riwayat sesi, rekap nilai siswa, maupun seluruh akun guru kapan saja melalui menu pengaturan platform.</li>
              <li>Untuk permintaan penghapusan data secara manual, Anda dapat menghubungi narahubung kami melalui email atau WhatsApp resmi di bawah ini.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 border-t pt-6 border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>6. Kontak Resmi & Pengembang</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Jika Anda memiliki pertanyaan, klarifikasi, atau permintaan terkait kebijakan privasi ini, silakan hubungi kami melalui saluran resmi berikut:
            </p>
            <div className={`p-4 rounded-xl border space-y-2 text-xs sm:text-sm ${
              isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-blue-50/50 border-blue-100'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span><strong>Pengembang:</strong> PT Berdikari Bangun Bangsa (DN Apps)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span><strong>Email Dukungan:</strong> <code>cs@ujianpintar.online</code> / <code>deni.apps.official@gmail.com</code></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span><strong>WhatsApp Resmi:</strong> +62 821-9692-9193</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span><strong>Situs Web Resmi:</strong> <a href="https://ujianpintar.online" className="text-blue-600 hover:underline">https://ujianpintar.online</a></span>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <p>© 2026 UjianPintar by DN Apps. Hak Cipta Dilindungi Undang-Undang.</p>
      </footer>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Smartphone, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { 
  whatsappVerificationService, 
  type WhatsAppCheckStatus 
} from '../../services/whatsappVerificationService';
import { supabase } from '../../lib/supabase';

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

const DEFAULT_APK_URL = 'https://api.ujianpintar.online/storage/v1/object/public/Mobile%20Apk%20UjianPintar/UjianPintar-v1.0-Android.apk';

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cleanPhone, setCleanPhone] = useState('');
  const [waStatus, setWaStatus] = useState<WhatsAppCheckStatus>('idle');
  const [waMessage, setWaMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setIsDownloaded(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Validasi Email sederhana
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Handle Perubahan Input WhatsApp dengan Debounce Level 1 & Level 2
  const handleWhatsappChange = (value: string) => {
    setWhatsapp(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setWaStatus('idle');
      setWaMessage('');
      setCleanPhone('');
      return;
    }

    // Cek awal Level 1 langsung saat mengetik
    const quickCheck = whatsappVerificationService.formatAndValidatePhone(value);
    if (!quickCheck.isValidFormat) {
      setWaStatus('invalid');
      setWaMessage(quickCheck.errorMessage || 'Nomor tidak valid');
      setCleanPhone(quickCheck.formattedPhone);
      return;
    }

    // Jika format valid, set status checking dan tunggu debounce untuk panggil WAHA (Level 2)
    setWaStatus('checking');
    setWaMessage('Memverifikasi status nomor WhatsApp...');
    setCleanPhone(quickCheck.formattedPhone);

    debounceTimerRef.current = setTimeout(async () => {
      const result = await whatsappVerificationService.verifyNumber(value);
      setWaStatus(result.status);
      setWaMessage(result.message);
      setCleanPhone(result.formattedPhone);
    }, 450);
  };

  const handleStartDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || waStatus !== 'valid' || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const downloadPayload = {
        email: email.trim().toLowerCase(),
        whatsapp: cleanPhone || whatsapp.trim(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        created_at: new Date().toISOString(),
      };

      // 1. Simpan ke database Supabase (tabel apk_downloads) jika ada
      try {
        await supabase.from('apk_downloads').insert([downloadPayload]);
      } catch (dbErr) {
        console.warn('Catatan: Tabel apk_downloads belum ada di Supabase VPS atau RLS blocked:', dbErr);
      }

      // 2. Simpan cadangan ke localStorage agar data tidak hilang
      try {
        const existingLeads = JSON.parse(localStorage.getItem('ujianpintar_apk_downloads') || '[]');
        existingLeads.push(downloadPayload);
        localStorage.setItem('ujianpintar_apk_downloads', JSON.stringify(existingLeads));
      } catch (lsErr) {
        console.warn('Gagal menyimpan ke localStorage:', lsErr);
      }

      // 3. Pemicu Unduh File APK Otomatis di Browser
      const downloadLink = document.createElement('a');
      downloadLink.href = DEFAULT_APK_URL;
      downloadLink.download = 'UjianPintar-v1.0-Android.apk';
      downloadLink.target = '_blank';
      downloadLink.rel = 'noopener noreferrer';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // 4. Ubah status modal menjadi Berhasil
      setIsDownloaded(true);
    } catch (err) {
      console.error('Download error:', err);
      // Tetap trigger unduhan langsung jika ada kendala script
      window.open(DEFAULT_APK_URL, '_blank');
      setIsDownloaded(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-md rounded-3xl shadow-2xl border transition-all overflow-hidden ${
          isDarkMode 
            ? 'bg-slate-900 border-white/10 text-white' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer z-10 ${
            isDarkMode 
              ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className={`p-6 pb-4 border-b ${isDarkMode ? 'border-white/10 bg-slate-800/40' : 'border-slate-100 bg-slate-50/70'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Unduh APK Ujian Siswa
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Android
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Versi 1.0 • Ukuran 15 MB • Sistem Kiosk Anti-Curang
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!isDownloaded ? (
            <form onSubmit={handleStartDownload} className="space-y-4">
              <div className={`text-xs leading-relaxed p-3 rounded-xl border flex items-start gap-2.5 ${
                isDarkMode 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' 
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}>
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <span>
                  Isi data di bawah ini untuk mendapatkan tautan unduhan resmi dan notifikasi pembaruan aplikasi ujian.
                </span>
              </div>

              {/* Input Email */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Alamat Email (Siswa / Guru)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border transition-all outline-none ${
                      isDarkMode 
                        ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {email && !isEmailValid && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Format email belum tepat
                  </p>
                )}
              </div>

              {/* Input WhatsApp dengan Verifikasi Real-time */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nomor WhatsApp Aktif
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border transition-all outline-none ${
                      waStatus === 'valid'
                        ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 dark:text-emerald-300 focus:border-emerald-500'
                        : waStatus === 'invalid'
                        ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-300 focus:border-rose-500'
                        : isDarkMode
                        ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                  />

                  {/* Status Indicator Icon di Kanan Input */}
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                    {waStatus === 'checking' && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {waStatus === 'valid' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {waStatus === 'invalid' && (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Status Message Text */}
                {waMessage && (
                  <p className={`text-[11px] mt-1.5 flex items-center gap-1 font-medium ${
                    waStatus === 'valid' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : waStatus === 'invalid'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {waMessage}
                  </p>
                )}
                <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  *Awalan 08 otomatis dikonversi ke kode negara +62.
                </p>
              </div>

              {/* Tombol Unduh: Hanya aktif saat WA valid dan Email terisi */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isEmailValid || waStatus !== 'valid' || isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isEmailValid && waStatus === 'valid' && !isSubmitting
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25 scale-100 hover:scale-[1.01]'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyiapkan File APK...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>
                        {waStatus === 'valid' && isEmailValid
                          ? 'Unduh APK Sekarang (15 MB)'
                          : 'Lengkapi Email & Nomor WA Aktif'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Tampilan Berhasil Setelah Klik Unduh */
            <div className="text-center py-2 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Unduhan Sedang Berlangsung!
                </h4>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  File <strong>UjianPintar-v1.0-Android.apk</strong> otomatis terunduh ke perangkat Anda.
                </p>
              </div>

              {/* Langkah Instalasi di Android */}
              <div className={`p-4 rounded-2xl text-left text-xs space-y-2.5 border ${
                isDarkMode ? 'bg-slate-800/60 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>Petunjuk Pemasangan di HP Android:</span>
                </div>
                <ol className={`list-decimal list-inside space-y-1 text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <li>Buka file <strong>UjianPintar-v1.0-Android.apk</strong> dari notifikasi atau folder <em>Download</em> HP Anda.</li>
                  <li>Jika muncul pemberitahuan keamanan, pilih <strong>"Tetap Download"</strong> atau <strong>"Izinkan dari Sumber Ini"</strong>.</li>
                  <li>Tekan <strong>Install / Pasang</strong> dan tunggu hingga selesai.</li>
                  <li>Buka aplikasi, lalu masukkan <strong>Token Ujian</strong> yang diberikan oleh Guru.</li>
                </ol>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  Selesai & Tutup
                </button>

                <a
                  href={DEFAULT_APK_URL}
                  download="UjianPintar-v1.0-Android.apk"
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 ${
                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <span>File tidak terunduh otomatis? Klik di sini untuk mengunduh ulang</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

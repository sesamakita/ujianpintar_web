import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  MessageCircle, 
  KeyRound, 
  X, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Server
} from 'lucide-react';
import { AppLogoIcon } from './AppLogo';
import { maintenanceService } from '../../services/maintenanceService';
import type { MaintenanceConfig } from '../../types/maintenance';

interface MaintenanceScreenProps {
  config: MaintenanceConfig;
  onBypassSuccess?: () => void;
  onRefreshCheck?: () => Promise<boolean>;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  config,
  onBypassSuccess,
  onRefreshCheck,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  // Perhitungan Countdown Timer Realtime
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isOver: false });

  useEffect(() => {
    if (!config.estimatedEndTime) return;

    const calculateTime = () => {
      const target = new Date(config.estimatedEndTime!).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config.estimatedEndTime]);

  // Handle Manual Refresh Check
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshCheck) {
      const isStillMaintenance = await onRefreshCheck();
      if (!isStillMaintenance) {
        window.location.reload();
        return;
      }
    } else {
      const latest = await maintenanceService.checkMaintenanceStatus();
      if (!latest || !latest.isMaintenance) {
        window.location.reload();
        return;
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  // Handle Admin Passkey Submission
  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError('');

    if (!passkeyInput.trim()) {
      setPasskeyError('Masukkan kode bypass');
      return;
    }

    const success = maintenanceService.setBypass(passkeyInput.trim(), config.bypassSecret);
    if (success) {
      setIsPasskeyModalOpen(false);
      if (onBypassSuccess) {
        onBypassSuccess();
      } else {
        window.location.reload();
      }
    } else {
      setPasskeyError('Kode bypass salah. Silakan coba lagi.');
    }
  };

  // Format WhatsApp Support Link
  const waNumber = (config.whatsappSupport || '6282196929193').replace(/[^0-9]/g, '');
  const cleanWaNumber = waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber;
  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    'Halo Tim Helpdesk UjianPintar, saya ingin menanyakan perkembangan pemeliharaan sistem...'
  )}`;

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between"
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-3xl w-full mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center p-1.5 shadow-sm">
              <AppLogoIcon className="w-full h-auto" color="white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight block">UjianPintar Status</span>
              <span className="text-[11px] text-slate-500 hidden sm:block">Pusat Informasi & Pemeliharaan Sistem</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Pemeliharaan Terjadwal</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8 sm:py-10 my-auto">
        
        {/* Main Incident Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {config.title || 'Pemeliharaan Berkala Server & Basis Data'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Jadwal: Minggu, 18 Oktober 2026 • Pukul 06:00 – 09:00 WIB
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                Status: <span className="text-blue-700">Dalam Pengerjaan</span>
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {config.message ||
              'Saat ini platform UjianPintar sedang menjalani optimalisasi infrastruktur cloud untuk meningkatkan kecepatan akses ujian dan stabilitas koneksi ribuan siswa secara serentak. Selama periode ini, portal ujian dan dashboard guru untuk sementara tidak dapat diakses.'}
          </p>

          {/* Jaminan Keamanan Data */}
          <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="font-semibold text-slate-800">Keamanan Data Dijamin Penuh:</strong>
              {' '}Seluruh bank soal, konfigurasi ujian, data siswa, dan nilai telah dibackup sebelum proses pemeliharaan dimulai dan tersimpan aman di server.
            </div>
          </div>

          {/* Countdown Timer */}
          {config.showCountdown !== false && config.estimatedEndTime && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Perkiraan Selesai:</span>
                <strong className="text-slate-800">Hari ini, Pukul 09:00 WIB</strong>
              </div>

              {!timeLeft.isOver ? (
                <div className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
                  <span>Sisa waktu:</span>
                  <strong className="text-blue-700">
                    {String(timeLeft.hours).padStart(2, '0')}j : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}d
                  </strong>
                </div>
              ) : (
                <span className="text-emerald-700 font-semibold">Tahap finalisasi server...</span>
              )}
            </div>
          )}
        </div>

        {/* System Services Checklist Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="px-5 py-3.5 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Kondisi Komponen Layanan
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Pembaruan tiap 30 dtk</span>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            {/* Service 1: Siswa CBT */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800 block">Sistem Ujian Siswa (Web & APK Android)</span>
                <span className="text-xs text-slate-400">Pengerjaan ujian CBT dan portal cek nilai NISN</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Pemeliharaan
              </span>
            </div>

            {/* Service 2: Portal Guru */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800 block">Portal Guru & Generator Soal AI</span>
                <span className="text-xs text-slate-400">Pembuatan soal, live proctoring, & ekspor nilai</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Pemeliharaan
              </span>
            </div>

            {/* Service 3: Database & Cloud Storage */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800 block">Basis Data Nilai & Cloud Storage</span>
                <span className="text-xs text-slate-400">Penyimpanan bank soal, gambar, dan rekam riwayat</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aman (Tercadangkan)
              </span>
            </div>

            {/* Service 4: Layanan WhatsApp Bot */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800 block">Layanan WhatsApp Bot & Hotline Bantuan</span>
                <span className="text-xs text-slate-400">Pengiriman notifikasi OTP dan bantuan darurat</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Beroperasi Normal
              </span>
            </div>
          </div>
        </div>

        {/* Progress Timeline Logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3.5">
            <Server className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Catatan Progres Pembaruan
            </h3>
          </div>

          <div className="space-y-4 border-l-2 border-slate-200 pl-4 ml-1">
            <div className="relative">
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
              <div className="text-xs text-slate-400 font-mono">06:30 WIB</div>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">Optimasi indeks tabel & sinkronisasi cluster server</p>
              <p className="text-xs text-slate-500 mt-0.5">Pencadangan database 100% selesai. Saat ini sedang pengujian beban latensi pengerjaan ujian.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
              <div className="text-xs text-slate-400 font-mono">06:00 WIB</div>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">Pemeliharaan dimulai sesuai jadwal</p>
              <p className="text-xs text-slate-500 mt-0.5">Akses publik dinonaktifkan sementara dan cadangan sistem berhasil dibuat.</p>
            </div>
          </div>
        </div>

        {/* Actions & Helpdesk */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memeriksa...' : 'Muat Ulang Halaman'}</span>
          </button>

          <a 
            href={waUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bantuan Helpdesk WhatsApp</span>
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto px-4 py-6 border-t border-slate-200 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} UjianPintar • Seluruh hak cipta dilindungi.</p>
        
        {config.allowAdminBypass !== false && (
          <button
            onClick={() => setIsPasskeyModalOpen(true)}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors underline decoration-slate-300 underline-offset-4 cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Akses Khusus Pengelola</span>
          </button>
        )}
      </footer>

      {/* Admin Bypass Passkey Modal (Clean Modern Light Theme) */}
      {isPasskeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl relative">
            <button
              onClick={() => {
                setIsPasskeyModalOpen(false);
                setPasskeyError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">Akses Pengelola Ujian</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Masukkan kode rahasia bypass untuk memverifikasi fitur sistem saat mode pemeliharaan aktif.
            </p>

            <form onSubmit={handlePasskeySubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Masukkan kode rahasia..."
                  autoFocus
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                />
                {passkeyError && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passkeyError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasskeyModalOpen(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Buka Akses</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

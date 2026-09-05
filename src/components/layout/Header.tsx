import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock,
  Building2
} from 'lucide-react';
import type { ExamSettings } from '../../types/exam';
import type { TeacherSubscription } from '../../types/subscription';
import { schoolLicenseService } from '../../services/schoolLicenseService';

interface HeaderProps {
  activeTab: string;
  examSettings: ExamSettings;
  violationCount: number;
  subscription?: TeacherSubscription;
  onOpenUpgradeModal?: () => void;
  onNavigateTab?: (tab: 'builder' | 'proctoring' | 'analytics' | 'settings' | 'subscription') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  violationCount,
  onNavigateTab,
}) => {
  const [time, setTime] = useState<string>('');
  const schoolAccess = schoolLicenseService.checkAccess();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateStr = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
      setTime(`${dateStr} • ${timeStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'builder':
        return 'Question Builder & Jadwal Ujian';
      case 'proctoring':
        return 'Real-Time Live Proctoring';
      case 'analytics':
        return 'Rekapitulasi Nilai & Evaluasi';
      case 'subscription':
        return 'Paket Layanan & Info Aplikasi';
      default:
        return 'Pengaturan Sekolah & Profil Guru';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs">
      {/* Left Side: Clean Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="font-display font-bold text-slate-900 text-base tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right Side: School Status, Clock & Notification */}
      <div className="flex items-center gap-2.5">
        {/* School Subscription Active Badge */}
        {schoolAccess.isSchoolActive && (
          <button
            type="button"
            onClick={() => onNavigateTab?.('subscription')}
            title="Lihat Detail Lisensi Sekolah & Info Paket"
            className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-xs shadow-2xs transition-colors cursor-pointer text-left"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <Building2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span className="font-display font-bold text-emerald-950 truncate max-w-[180px]">{schoolAccess.schoolName}</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded">
              {schoolAccess.daysRemaining}h
            </span>
          </button>
        )}

        {/* Clock Pill */}
        <div className="hidden md:inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs shadow-xs whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="font-sans font-semibold text-slate-500">Waktu:</span>
          <span className="font-mono font-bold text-slate-800">{time || 'Memuat...'}</span>
        </div>

        {/* Notification Button */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => onNavigateTab?.('proctoring')}
            className={`w-9 h-9 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              violationCount > 0 
                ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100' 
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
            title={violationCount > 0 ? `${violationCount} Peringatan Pelanggaran: Buka Live Proctoring` : 'Notifikasi & Live Proctoring'}
          >
            <Bell className="w-4 h-4" />
            {violationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {violationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

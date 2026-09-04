import React from 'react';
import { 
  FileEdit, 
  Activity, 
  BarChart3, 
  Settings, 
  GraduationCap, 
  LogOut,
  Sparkles,
  Award,
  Globe
} from 'lucide-react';
import type { ExamSettings } from '../../types/exam';
import type { TeacherSubscription } from '../../types/subscription';

interface SidebarProps {
  activeTab: 'builder' | 'proctoring' | 'analytics' | 'settings' | 'subscription';
  setActiveTab: (tab: 'builder' | 'proctoring' | 'analytics' | 'settings' | 'subscription') => void;
  examSettings?: ExamSettings;
  activeStudentCount?: number;
  onLogout?: () => void;
  onNavigateToLanding?: () => void;
  teacherName?: string;
  schoolName?: string;
  subjectName?: string;
  subscription?: TeacherSubscription;
  onOpenSubscription?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  onNavigateToLanding,
  teacherName = 'Bpk. Rahmat, S.Pd.',
  schoolName = 'SMA Negeri 1 Indonesia',
  subjectName = 'Matematika Wajib',
  subscription,
  onOpenSubscription,
}) => {
  const isPro = subscription?.tier === 'pro';
  const isSchool = subscription?.tier === 'school';

  const navItems = [
    {
      id: 'builder' as const,
      label: 'Bank Soal & Jadwal',
      sublabel: 'Editor soal & anti-cheat',
      icon: FileEdit,
      badge: null,
    },
    {
      id: 'proctoring' as const,
      label: 'Pengawasan Live',
      sublabel: 'Monitoring siswa & layar',
      icon: Activity,
      badge: 'Live',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'analytics' as const,
      label: 'Rekap Nilai & Hasil',
      sublabel: 'Auto-grading & ekspor',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'subscription' as const,
      label: 'Paket & Info Aplikasi',
      sublabel: isPro ? 'Akun PRO • Info Platform' : isSchool ? 'Lisensi Sekolah' : 'Upgrade & Info Web',
      icon: Award,
      badge: isPro ? 'PRO' : isSchool ? 'SCH' : null,
      badgeColor: isPro ? 'bg-blue-600 text-white font-mono' : isSchool ? 'bg-emerald-600 text-white font-mono' : undefined,
    },
    {
      id: 'settings' as const,
      label: 'Pengaturan Sekolah',
      sublabel: 'Profil guru & database',
      icon: Settings,
      badge: null,
    },
  ];

  const getInitials = (name: string) => {
    const parts = name.replace(/Bpk\.|Ibu|Dr\.|S\.Pd\.|M\.Pd\./g, '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.substring(0, 2) || 'GU').toUpperCase();
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-30 shadow-xs">
      {/* 1. Brand Header (Fixed Top) */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-black text-slate-900 text-lg tracking-tight leading-none">UjianPintar</h1>
              {isPro ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded-md shadow-2xs font-mono">
                  PRO
                </span>
              ) : isSchool ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded-md shadow-2xs font-mono">
                  SEKOLAH
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 font-mono">
                  FREE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">Portal Guru & Pengawas</p>
          </div>
        </div>

        {onNavigateToLanding && (
          <button
            type="button"
            onClick={onNavigateToLanding}
            title="Lihat Website Produk / Landing Page"
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Middle Area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3.5 py-3 space-y-3 scrollbar-hover">
        {/* School Badge Pill */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-xs font-display flex-shrink-0">
              SCH
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-display font-bold text-slate-800 truncate">{schoolName}</h4>
              <p className="text-[11px] text-slate-500 font-sans truncate">{subjectName}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                      isActive ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="text-sm font-display font-bold tracking-tight truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-400 font-normal font-sans leading-none mt-0.5 truncate">{item.sublabel}</div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs flex-shrink-0 ${item.badgeColor}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Upgrade PRO Promo Card for Free Tier */}
        {!isPro && !isSchool && (
          <div className="p-3.5 bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl text-white shadow-md border border-blue-700/40 space-y-2 relative overflow-hidden">
            <div className="flex items-center gap-1.5 text-blue-300 text-xs font-display font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Tingkatkan ke PRO</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-tight">
              Buka kuota unlimited ujian & kapasitas kelas hanya <strong>Rp 20.000/bln</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                if (onOpenSubscription) onOpenSubscription();
              }}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-display font-bold shadow-xs transition-colors cursor-pointer text-center block"
            >
              Lihat Paket PRO
            </button>
          </div>
        )}
      </div>

      {/* 3. User Footer with Logout (Fixed Bottom) */}
      <div className="p-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50/80 flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-display font-black flex items-center justify-center text-xs shadow-sm ring-2 ring-blue-100 flex-shrink-0">
            {getInitials(teacherName)}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-display font-bold text-slate-900 truncate">{teacherName}</div>
            <div className="text-[11px] text-slate-500 font-medium font-sans truncate">{subjectName}</div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Keluar dari Akun Guru"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

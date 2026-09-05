import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
  Eye,
  AlertTriangle,
  Lock,
  ChevronDown,
  Award,
  Check,
  Play,
  FileSpreadsheet,
  Cpu,
  GraduationCap,
  Sun,
  Moon,
  User
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToAuth: (mode: 'login' | 'signup') => void;
  onNavigateToPortal: () => void;
  onOpenMobileSimulation: () => void;
  isAuthenticated: boolean;
  currentUser?: {
    name: string;
    school: string;
  };
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToAuth,
  onNavigateToPortal,
  onOpenMobileSimulation,
  isAuthenticated,
  currentUser,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  // Default to Light Mode (Mode Cerah)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 overflow-x-hidden ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white' 
        : 'bg-slate-50 text-slate-800 selection:bg-blue-600 selection:text-white'
    }`}>
      {/* Top Banner Notice */}
      <div className={`text-xs py-2.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b transition-colors ${
        isDarkMode 
          ? 'bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-blue-900/60 text-blue-200 border-blue-800/40' 
          : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 text-blue-900 border-blue-200/80 shadow-xs'
      }`}>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
        </span>
        <span>Platform Ujian & Asesmen Sekolah Digital Terpadu 2026 • Versi 2.4 Siap Digunakan</span>
      </div>

      {/* Navigation Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
        isDarkMode 
          ? 'bg-slate-950/85 border-slate-800/80' 
          : 'bg-white/90 border-slate-200/80 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/25 border border-blue-400/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center">
              <span className={`text-2xl sm:text-[26px] font-black font-display tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Ujian<span className="text-blue-600">Pintar</span>
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className={`hidden md:flex items-center gap-7 text-sm font-semibold transition-colors ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <a href="#ekosistem" className="hover:text-blue-600 transition-colors">Ekosistem</a>
            <a href="#fitur" className="hover:text-blue-600 transition-colors">Fitur Guru & Siswa</a>
            <a href="#keamanan" className="hover:text-blue-600 transition-colors">Anti-Curang</a>
            <a href="#harga" className="hover:text-blue-600 transition-colors">Paket & Harga</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>

          {/* CTA Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDarkMode ? 'Beralih ke Mode Cerah (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                {/* Person Icon Button */}
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center relative ${
                    isUserMenuOpen
                      ? 'bg-blue-50 border-blue-300 text-blue-600 ring-2 ring-blue-500/20'
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Profil & Masuk Dashboard"
                >
                  <User className="w-4 h-4" />
                  {/* Active Green Dot Badge */}
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
                </button>

                {/* Vertical Dropdown Card */}
                {isUserMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2.5 w-56 rounded-2xl shadow-xl border p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white shadow-slate-950/70'
                        : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/90'
                    }`}
                  >
                    {/* User Info (Minimalist) */}
                    <div className="px-1 pt-0.5 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                      <div className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {currentUser?.name || 'Bpk. Guru'}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        <span>Sesi Aktif</span>
                      </div>
                    </div>

                    {/* Button Masuk Dashboard */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigateToPortal();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Masuk Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigateToAuth('login')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
                  }`}
                >
                  Masuk Portal
                </button>
                <button
                  onClick={() => onNavigateToAuth('signup')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Daftar Gratis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-18 md:pb-28 overflow-hidden">
        {/* Decorative soft gradients */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[140px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-blue-600/15' : 'bg-blue-200/50'
        }`} />
        <div className={`absolute top-1/4 left-1/4 w-[350px] h-[350px] blur-[120px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-100/60'
        }`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Top Pill Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border transition-colors ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-blue-400' 
                : 'bg-white border-blue-200 text-blue-700 shadow-sm'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Satu Platform Terintegrasi: Web Portal Guru + Mobile App Siswa</span>
            </div>

            {/* Main Headline */}
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight leading-tight mb-6 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Revolusi Ujian Sekolah <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
                Bebas Curang & Otomatis
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-base sm:text-lg font-normal leading-relaxed mb-8 max-w-2xl mx-auto ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Tinggalkan cara lama yang merepotkan. Guru membuat soal & memantau ujian via <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Web Portal</strong>, sementara siswa mengerjakan dengan aman melalui <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Mobile App Anti-Curang</strong>.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <button
                onClick={() => onNavigateToAuth('signup')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Mulai Buat Ujian (Gratis)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenMobileSimulation}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Lihat Simulasi Mobile Siswa</span>
              </button>
            </div>

            {/* Trust points */}
            <div className={`flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Anti Buka Tab & Split-Screen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Formula Rumus KaTeX & Gambar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Koreksi Instan & Ekspor Excel</span>
              </div>
            </div>
          </div>

          {/* DUAL PRODUCT SHOWCASE PREVIEW */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className={`rounded-3xl p-5 sm:p-8 border shadow-xl transition-colors ${
              isDarkMode 
                ? 'bg-slate-900/90 border-slate-800' 
                : 'bg-white border-slate-200/90'
            }`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* 1. Web Portal Mockup (7 Cols) */}
                <div className={`lg:col-span-7 rounded-2xl border overflow-hidden shadow-lg ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  {/* Browser Bar */}
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100/90 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className={`text-[11px] ml-2 font-mono flex items-center gap-1.5 font-medium ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <Lock className="w-3 h-3 text-emerald-600" />
                        portal.ujianpintar.online/proctoring
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold">
                      PORTAL GURU (WEB)
                    </span>
                  </div>

                  {/* Browser Body */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className={`flex items-center justify-between pb-3 border-b ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <div>
                        <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          Live Proctoring • Penilaian Akhir Semester
                        </div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Kelas XII MIPA 1 (36 Siswa Online)
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        LIVE AKTIF
                      </span>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                      }`}>
                        <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selesai</div>
                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">28 Siswa</div>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                      }`}>
                        <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mengerjakan</div>
                        <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">8 Siswa</div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/30">
                        <div className="text-[10px] text-rose-700 dark:text-rose-400 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Pelanggaran
                        </div>
                        <div className="text-base font-extrabold text-rose-600 dark:text-rose-400">1 Terdeteksi</div>
                      </div>
                    </div>

                    {/* Violation Alert Box */}
                    <div className={`rounded-xl p-3 border text-[11px] space-y-1.5 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          Log Deteksi Pelanggaran:
                        </span>
                        <span className="text-[10px] text-slate-400">Real-Time Update</span>
                      </div>
                      <div className="flex items-center gap-2 text-rose-700 bg-rose-100/70 dark:text-rose-300 dark:bg-rose-950/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900/40">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>08:14:22 • <strong>Ahmad Fauzi</strong> keluar aplikasi (Tab Switch Terdeteksi)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Mobile App Mockup (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-[280px] sm:w-[300px] bg-slate-900 rounded-[38px] p-3.5 border-4 border-slate-800 shadow-2xl relative text-white">
                    {/* Phone Notch */}
                    <div className="w-24 h-4 bg-slate-800 rounded-b-xl mx-auto mb-3 flex items-center justify-center">
                      <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                    </div>

                    {/* App Header */}
                    <div className="bg-blue-600 rounded-2xl p-3 text-white mb-3 shadow-sm">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold">Ujian Siswa Terkunci</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-700 text-[9px] font-mono flex items-center gap-1 font-bold">
                          <Lock className="w-2.5 h-2.5" /> KIOSK
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">Soal No. 12 / 30</span>
                        <span className="text-blue-100 font-mono flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" /> 42:15
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700 text-xs space-y-2 mb-3">
                      <p className="text-slate-100 font-medium text-[11px] leading-relaxed">
                        Jika matriks A ordo 2x2 memiliki elemen baris pertama [2, 3] dan baris kedua [1, 4], berapakah nilai determinan dari matriks A?
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-between">
                          <span>A. 5</span>
                          <Check className="w-3 h-3" />
                        </div>
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[10px]">
                          B. 6
                        </div>
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[10px]">
                          C. 8
                        </div>
                      </div>
                    </div>

                    {/* Brand Footer in phone */}
                    <div className="text-center pb-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        📱 Aplikasi Mobile Siswa UjianPintar
                      </span>
                    </div>

                    {/* Home Indicator */}
                    <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-1"></div>
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      onClick={onOpenMobileSimulation}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4 flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Klik untuk membuka simulasi ujian interaktif
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DUAL ECOSYSTEM SECTION */}
      <section id="ekosistem" className={`py-20 border-t transition-colors ${
        isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Sinergi Dua Perangkat</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold font-display mt-2 mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Dua Sisi Solusi: Web untuk Guru, Mobile untuk Siswa
            </h2>
            <p className={`text-sm sm:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Tidak ada lagi kompromi. Kami merancang arsitektur khusus yang memberikan kenyamanan maksimal bagi guru pembuat soal dan keamanan absolut bagi peserta ujian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* CARD 1: PORTAL GURU (WEB) */}
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-blue-500/20 hover:border-blue-500/40' 
                : 'bg-gradient-to-b from-white to-blue-50/30 border-blue-200 shadow-blue-500/5 hover:border-blue-400'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center mb-6">
                <Laptop className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Web Portal Guru & Pengawas
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  DESKTOP / LAPTOP
                </span>
              </div>
              <p className={`text-xs sm:text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Pusat kendali ujian berbasis web yang fleksibel. Dapat diakses dari browser mana saja tanpa perlu instalasi aplikasi tambahan di komputer sekolah.
              </p>

              <div className={`space-y-3.5 text-xs mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Editor Soal Canggih:</strong> Mendukung formula matematika KaTeX, tabel, gambar, serta pilihan ganda hingga esai otomatis.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Live Proctoring Dashboard:</strong> Pantau progres pengerjaan semua siswa secara serentak dalam satu layar.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Ekspor Nilai & Analisis Butir:</strong> Sekali klik untuk mengunduh rekap nilai lengkap dalam format file Excel (.xlsx).
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Manajemen Token & Jadwal:</strong> Atur tanggal pelaksanaan, durasi pengerjaan, dan token dinamis yang aman.
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToAuth('signup')}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Buka Akun Guru Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CARD 2: MOBILE APP SISWA */}
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-indigo-500/20 hover:border-indigo-500/40' 
                : 'bg-gradient-to-b from-white to-indigo-50/30 border-indigo-200 shadow-indigo-500/5 hover:border-indigo-400'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Aplikasi Mobile Siswa
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  ANDROID & IOS
                </span>
              </div>
              <p className={`text-xs sm:text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Aplikasi ujian khusus peserta didik yang ringan, berlayar penuh, dan dilengkapi sistem penguncian keamanan tingkat tinggi.
              </p>

              <div className={`space-y-3.5 text-xs mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Anti-Cheating Kiosk Mode:</strong> Mengunci layar penuh, mematikan recent apps, dan mencegah fitur split-screen.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Deteksi Keluar Aplikasi:</strong> Peringatan otomatis seketika dan pencatatan log jika siswa mencoba membuka Google/AI/kalkulator.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Hemat Kuota & Ringan:</strong> Ukuran paket aplikasi di bawah 15 MB sehingga sangat lancar di smartphone spesifikasi siswa.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Ketahanan Offline:</strong> Jawaban tersimpan di memori perangkat sehingga aman jika Wi-Fi sekolah sempat terputus sementara.
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenMobileSimulation}
                className={`w-full py-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-500/30' 
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Coba Tampilan Ujian Siswa</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="fitur" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Teknologi Terkini</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold font-display mt-2 mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Fitur Lengkap untuk Ujian Harian hingga Ujian Akhir
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Semua kebutuhan sekolah modern dalam menyelenggarakan asesmen terstandar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className={`p-6 rounded-2xl border transition-all ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Live Proctoring Radar
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Pantau seluruh peserta secara live. Ketahui siapa yang sedang menjawab nomor berapa, sisa waktu, dan siswa yang terindikasi melanggar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`p-6 rounded-2xl border transition-all ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Koreksi Instan & Ekspor Excel
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Begitu siswa menekan tombol selesai, nilai langsung terhitung otomatis. Rekap nilai siap cetak atau ekspor ke file Excel.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`p-6 rounded-2xl border transition-all ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Dukungan Rumus Eksakta (KaTeX)
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Mengetik soal matematika, fisika, kimia, atau bahasa Arab tidak lagi rumit. Rumus pecahan, integral, dan akar tampil jernih di semua gawai.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`p-6 rounded-2xl border transition-all ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Token Ujian Dinamis
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Cegah kebocoran soal dengan kode token unik yang bisa diubah oleh pengawas setiap saat atau diset kedaluwarsa secara otomatis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`p-6 rounded-2xl border transition-all ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Acak Soal & Opsi Jawaban
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Tiap siswa menerima urutan butir soal dan opsi jawaban yang berbeda, sehingga siswa yang duduk berdampingan tidak bisa saling contek huruf opsi.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`p-6 rounded-2xl border transition-all ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Analisis Daya Serap & Remedial
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Ketahui butir soal mana yang paling banyak dijawab salah oleh siswa untuk evaluasi pembelajaran tuntas dan bahan tindak lanjut remedial.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ANTI-CHEAT DEEP DIVE */}
      <section id="keamanan" className={`py-20 border-t transition-colors ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl p-8 sm:p-12 border shadow-lg transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <span className="text-rose-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Sistem Keamanan Berlapis
                </span>
                <h2 className={`text-2xl sm:text-3xl font-extrabold font-display mt-2 mb-4 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Bagaimana UjianPintar Menghentikan Kecurangan di Smartphone?
                </h2>
                <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Siswa zaman sekarang terbiasa memanfaatkan split-screen, floating browser, atau berpindah aplikasi ke bot AI. UjianPintar dirancang dengan proteksi aktif:
                </p>

                <div className="space-y-3 text-xs">
                  <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    <span><strong>Sensor Fokus Jendela:</strong> Seketika layar kehilangan fokus, timer dijeda dan tercatat sebagai pelanggaran.</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    <span><strong>Batas Toleransi (Strike Limit):</strong> Pengawas bisa mengatur batas toleransi (misal maksimal 3x keluar aplikasi sebelum ujian otomatis disubmit).</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                    <span><strong>Bukti Log Detik Demi Detik:</strong> Guru memiliki rekaman akurat yang bisa ditunjukkan sebagai bukti kepada orang tua siswa.</span>
                  </div>
                </div>
              </div>

              <div className={`lg:col-span-5 rounded-2xl p-6 border text-center ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Hasil Evaluasi Lebih Murni
                </div>
                <p className={`text-xs mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ujian yang adil menghasilkan pemetaan kompetensi belajar siswa yang sesungguhnya.
                </p>
                <button
                  onClick={() => onNavigateToAuth('signup')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all w-full cursor-pointer shadow-sm"
                >
                  Coba Gratis di Kelas Anda
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="harga" className={`py-20 border-t transition-colors ${
        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Pilihan Paket</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold font-display mt-2 mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Mulai Gratis, Tingkatkan Sesuai Kebutuhan
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Tersedia paket gratis untuk guru mandiri dan paket lengkap untuk skala sekolah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Plan 1: Free */}
            <div className={`rounded-2xl p-6 border flex flex-col justify-between ${
              isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paket Guru Basic</div>
                <div className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Gratis</div>
                <p className={`text-xs mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cocok untuk ujian harian kelas mandiri.</p>

                <div className={`space-y-2.5 text-xs border-t pt-4 ${
                  isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Hingga 3 sesi ujian per bulan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Maksimal 40 siswa per ujian</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Live proctoring standar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ekspor rekap nilai</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToAuth('signup')}
                className={`mt-8 w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs'
                }`}
              >
                Daftar Gratis
              </button>
            </div>

            {/* Plan 2: Pro Guru */}
            <div className={`rounded-2xl p-6 border-2 border-blue-600 shadow-xl shadow-blue-500/10 flex flex-col justify-between relative ${
              isDarkMode ? 'bg-slate-900' : 'bg-white'
            }`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
                Paling Populer
              </div>

              <div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Paket Guru Pro</div>
                <div className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Rp 39.000 <span className="text-xs font-normal text-slate-400">/ bulan</span>
                </div>
                <p className={`text-xs mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ujian tanpa batas untuk guru aktif.</p>

                <div className={`space-y-2.5 text-xs border-t pt-4 ${
                  isDarkMode ? 'border-slate-800 text-slate-200' : 'border-slate-100 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span><strong>Ujian tanpa batas</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hingga 120 siswa per ujian</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fitur anti-curang lanjutan (Kiosk)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Analisis butir soal & daya serap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dukungan prioritas via WhatsApp</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToAuth('signup')}
                className="mt-8 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                Pilih Paket Pro
              </button>
            </div>

            {/* Plan 3: Sekolah */}
            <div className={`rounded-2xl p-6 border flex flex-col justify-between ${
              isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paket Sekolah / Instansi</div>
                <div className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Kustom</div>
                <p className={`text-xs mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Untuk Asesmen Bersama, PTS, dan PAS sekolah.</p>

                <div className={`space-y-2.5 text-xs border-t pt-4 ${
                  isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Multi-akun guru & wali kelas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Kustom logo & kop surat sekolah</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Server khusus & bandwidth tinggi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Pelatihan teknis untuk proktor</span>
                  </div>
                </div>
              </div>

              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20UjianPintar,%20kami%20tertarik%20menerapkan%20UjianPintar%20di%20sekolah"
                target="_blank"
                rel="noreferrer"
                className={`mt-8 w-full py-2.5 rounded-xl font-bold text-xs text-center transition-all block cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs'
                }`}
              >
                Hubungi Kami
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className={`py-20 border-t transition-colors ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Tanya Jawab</span>
            <h2 className={`text-3xl font-extrabold font-display mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Bagaimana cara siswa mengunduh aplikasi mobile?",
                a: "Siswa dapat mengunduh file APK resmi yang disediakan oleh sekolah atau melalui tautan instalasi di halaman ujian. Ukuran aplikasinya sangat ringan (kurang dari 15MB) dan tidak membutuhkan gawai berspesifikasi tinggi."
              },
              {
                q: "Apakah guru harus menginstal aplikasi di laptop?",
                a: "Tidak perlu. Guru dan panitia ujian cukup membuka peramban web (seperti Google Chrome atau Edge) di laptop/komputer untuk membuat soal, memantau pengawasan live, dan mengunduh rekap nilai."
              },
              {
                q: "Apa yang terjadi jika jaringan internet siswa terputus saat ujian?",
                a: "Aplikasi mobile UjianPintar dilengkapi fitur ketahanan offline. Jawaban yang sudah dipilih siswa tersimpan di memori perangkat dan akan langsung disinkronkan kembali saat koneksi internet terhubung kembali tanpa menghilangkan progres jawaban."
              },
              {
                q: "Apakah UjianPintar mendukung rumus matematika dan gambar?",
                a: "Ya! UjianPintar mendukung sintaks KaTeX untuk rumus matematika (akar, pecahan, matriks, limit, integral) serta upload gambar untuk soal sains atau geografi."
              },
              {
                q: "Bolehkah saya mencoba secara gratis terlebih dahulu?",
                a: "Tentu! Anda bisa langsung mendaftar dengan akun Guru Basic gratis untuk mencoba membuat soal dan menguji jalannya ujian di kelas Anda."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border overflow-hidden transition-colors ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className={`px-5 pb-4 text-xs leading-relaxed border-t pt-3 ${
                    isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 text-white mb-4 border border-white/20">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-display text-white mb-4">
            Siap Menggelar Ujian Digital yang Tertib & Modern?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto mb-8">
            Daftarkan diri Anda hari ini. Nikmati kemudahan membuat soal, otomatisasi penilaian, dan ketenangan pengawasan ujian bebas curang.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigateToAuth('signup')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Daftar Sekarang (Gratis)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToAuth('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-sm border border-blue-400/40 transition-all cursor-pointer"
            >
              Masuk ke Portal Guru
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`border-t py-12 text-xs transition-colors ${
        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className={`font-bold font-display text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>UjianPintar</span>
              <span className="text-slate-400">• Portal Asesmen & Ujian Digital</span>
            </div>

            <div className="flex items-center gap-6 font-medium">
              <a href="#ekosistem" className="hover:text-blue-600 transition-colors">Ekosistem</a>
              <a href="#fitur" className="hover:text-blue-600 transition-colors">Fitur</a>
              <a href="#harga" className="hover:text-blue-600 transition-colors">Paket</a>
              <a href="#faq" className="hover:text-blue-600 transition-colors">Bantuan</a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 UjianPintar. Hak Cipta Dilindungi Undang-Undang.</p>
            <p className="text-[11px] text-slate-400">
              Dirancang untuk kemajuan pendidikan Indonesia • Guru Hebat, Siswa Berintegritas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

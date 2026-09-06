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
  User,
  Download,
  X,
  Radio,
  Users,
  Wifi,
  Battery,
  ChevronRight,
  PlusCircle,
  Bookmark,
  Building2,
  Zap
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';
import { DownloadApkModal } from './DownloadApkModal';

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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [isMobileBarDismissed, setIsMobileBarDismissed] = useState<boolean>(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [activeSection, setActiveSection] = useState<string>('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  useEffect(() => {
    const sections = ['ekosistem', 'fitur', 'keamanan', 'harga', 'faq'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      let current = '';
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          current = sections[i];
          break;
        }
      }
      setActiveSection(current);
    };

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (sections.includes(hash)) {
        setActiveSection(hash);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHashChange);
    handleScroll();
    handleHashChange();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 overflow-x-clip ${
      isDarkMode 
        ? 'bg-[#080C14] text-slate-100 selection:bg-blue-500 selection:text-white' 
        : 'bg-gradient-to-b from-slate-100 via-sky-50/50 to-indigo-50/40 text-slate-800 selection:bg-blue-600 selection:text-white'
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

      {/* Navigation Header - Diam di Atas Layar (Sticky/Fixed) & Style Glass Panel */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isDarkMode 
          ? 'glass-panel-dark bg-slate-900/75 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]' 
          : 'glass-panel-light bg-white/75 backdrop-blur-2xl border-b border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)]'
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
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-semibold transition-colors">
            {[
              { id: 'ekosistem', label: 'Ekosistem' },
              { id: 'fitur', label: 'Fitur Guru & Siswa' },
              { id: 'keamanan', label: 'Anti-Curang' },
              { id: 'harga', label: 'Paket & Harga' },
              { id: 'faq', label: 'FAQ' },
            ].map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={() => setActiveSection(link.id)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'text-white bg-white/10 shadow-xs font-bold'
                        : 'text-blue-600 bg-blue-50/80 shadow-xs font-bold'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-white hover:bg-white/10 active:text-white active:bg-white/15'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-white/60 active:text-blue-700'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* CTA Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isDarkMode ? 'glass-pill-dark text-amber-300 hover:bg-slate-800' : 'glass-pill-light text-slate-700 hover:bg-white'
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
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
                    isUserMenuOpen
                      ? 'bg-blue-500/20 border-blue-400 text-blue-600 ring-2 ring-blue-500/20'
                      : isDarkMode
                      ? 'glass-pill-dark text-slate-200 hover:bg-slate-800'
                      : 'glass-pill-light text-slate-700 hover:bg-white'
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
                    className={`absolute right-0 mt-2.5 w-56 rounded-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3 ${
                      isDarkMode ? 'glass-panel-dark text-white' : 'glass-panel-light text-slate-800'
                    }`}
                  >
                    {/* User Info (Minimalist) */}
                    <div className="px-1 pt-0.5 border-b border-slate-100 dark:border-white/10 pb-2.5">
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
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/80' 
                      : 'text-slate-700 hover:text-blue-600 hover:bg-white/80'
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
        {/* Highly Visible Vibrant Ambient Glass Refraction Orbs */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] blur-[80px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-tr from-blue-600/25 via-indigo-500/20 to-teal-500/20' : 'bg-gradient-to-tr from-blue-400/40 via-indigo-300/35 to-teal-300/30'
        }`} />
        <div className={`absolute top-1/4 left-5 w-[450px] h-[450px] blur-[70px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-br from-indigo-600/25 to-purple-600/20' : 'bg-gradient-to-br from-indigo-400/35 to-purple-300/30'
        }`} />
        <div className={`absolute top-1/3 right-5 w-[450px] h-[450px] blur-[70px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-bl from-teal-500/20 to-blue-600/25' : 'bg-gradient-to-bl from-teal-300/40 to-blue-400/30'
        }`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Top Pill Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 transition-all ${
              isDarkMode ? 'glass-pill-dark text-blue-400' : 'glass-pill-light text-blue-700'
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
                className={`liquid-btn group relative w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer select-none overflow-hidden scale-100 hover:scale-[1.02] active:scale-[0.98] ${
                  isDarkMode
                    ? 'bg-slate-900/85 text-blue-200 hover:text-white border-2 border-blue-500/80 hover:border-cyan-300 shadow-blue-950/40 hover:shadow-2xl hover:shadow-cyan-500/30'
                    : 'bg-blue-50/70 text-blue-700 hover:text-white border-2 border-blue-600 hover:border-blue-500 shadow-blue-600/15 hover:shadow-2xl hover:shadow-blue-600/30'
                }`}
              >
                {/* The Rising Fluid Chamber */}
                <div className="liquid-fluid pointer-events-none">
                  {/* Undulating Wave Crest at the liquid surface */}
                  <div className="liquid-wave-wrapper">
                    {/* Back Wave (cyan tint) */}
                    <svg className="liquid-wave-svg wave-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
                      <path d="M 0 35 C 150 10, 150 10, 300 35 C 450 60, 450 60, 600 35 C 750 10, 750 10, 900 35 C 1050 60, 1050 60, 1200 35 L 1200 120 L 0 120 Z" fill="#38bdf8" fillOpacity="0.6" />
                    </svg>
                    {/* Front Wave (rich sky blue) */}
                    <svg className="liquid-wave-svg wave-front" viewBox="0 0 1200 120" preserveAspectRatio="none">
                      <path d="M 0 30 C 150 55, 150 55, 300 30 C 450 5, 450 5, 600 30 C 750 55, 750 55, 900 30 C 1050 5, 1050 5, 1200 30 L 1200 120 L 0 120 Z" fill="#0284c7" />
                    </svg>
                  </div>

                  {/* Deep Liquid Core Body */}
                  <div className="liquid-body" />

                  {/* Effervescent Rising Bubbles */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
                    <span className="liquid-bubble w-2 h-2 bg-white/80 blur-[0.5px] left-[20%] bottom-2" style={{ animationDelay: '0.1s' }} />
                    <span className="liquid-bubble w-1.5 h-1.5 bg-cyan-200/90 blur-[0.5px] left-[45%] bottom-4" style={{ animationDelay: '0.5s' }} />
                    <span className="liquid-bubble w-2.5 h-2.5 bg-white/70 blur-[0.5px] left-[70%] bottom-1" style={{ animationDelay: '0.9s' }} />
                    <span className="liquid-bubble w-1.5 h-1.5 bg-cyan-100/80 blur-[0.5px] left-[85%] bottom-3" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>

                {/* Glossy Surface Reflection (only visible when liquid fills) */}
                <span className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none z-[4] rounded-t-xl opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300" />

                {/* Label & Arrow */}
                <span className="relative z-10 font-bold tracking-wide drop-shadow-sm group-hover:drop-shadow-md transition-colors duration-300">
                  Mulai Buat Ujian (Gratis)
                </span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1.5 transition-all duration-300 stroke-[2.5]" />
              </button>

              <button
                onClick={onOpenMobileSimulation}
                className={`liquid-btn liquid-theme-indigo group relative w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer select-none overflow-hidden scale-100 hover:scale-[1.02] active:scale-[0.98] ${
                  isDarkMode
                    ? 'bg-slate-900/85 text-slate-200 hover:text-white border-2 border-indigo-500/70 hover:border-indigo-400 shadow-indigo-950/40 hover:shadow-2xl hover:shadow-indigo-500/30'
                    : 'bg-indigo-50/70 text-indigo-900 hover:text-white border-2 border-indigo-400/80 hover:border-indigo-500 shadow-indigo-600/15 hover:shadow-2xl hover:shadow-indigo-600/30'
                }`}
              >
                {/* The Rising Fluid Chamber */}
                <div className="liquid-fluid pointer-events-none">
                  {/* Undulating Wave Crest at the liquid surface */}
                  <div className="liquid-wave-wrapper">
                    {/* Back Wave (lavender tint) */}
                    <svg className="liquid-wave-svg wave-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
                      <path d="M 0 35 C 150 10, 150 10, 300 35 C 450 60, 450 60, 600 35 C 750 10, 750 10, 900 35 C 1050 60, 1050 60, 1200 35 L 1200 120 L 0 120 Z" fill="#a5b4fc" fillOpacity="0.6" />
                    </svg>
                    {/* Front Wave (indigo blue) */}
                    <svg className="liquid-wave-svg wave-front" viewBox="0 0 1200 120" preserveAspectRatio="none">
                      <path d="M 0 30 C 150 55, 150 55, 300 30 C 450 5, 450 5, 600 30 C 750 55, 750 55, 900 30 C 1050 5, 1050 5, 1200 30 L 1200 120 L 0 120 Z" fill="#6366f1" />
                    </svg>
                  </div>

                  {/* Deep Liquid Core Body */}
                  <div className="liquid-body" />

                  {/* Effervescent Rising Bubbles */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
                    <span className="liquid-bubble w-2 h-2 bg-white/80 blur-[0.5px] left-[22%] bottom-2" style={{ animationDelay: '0.15s' }} />
                    <span className="liquid-bubble w-1.5 h-1.5 bg-indigo-200/90 blur-[0.5px] left-[48%] bottom-4" style={{ animationDelay: '0.55s' }} />
                    <span className="liquid-bubble w-2.5 h-2.5 bg-white/70 blur-[0.5px] left-[68%] bottom-1" style={{ animationDelay: '0.85s' }} />
                    <span className="liquid-bubble w-1.5 h-1.5 bg-indigo-100/80 blur-[0.5px] left-[82%] bottom-3" style={{ animationDelay: '0.35s' }} />
                  </div>
                </div>

                {/* Glossy Surface Reflection (only visible when liquid fills) */}
                <span className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none z-[4] rounded-t-xl opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-300 relative z-10" />
                <span className="relative z-10 font-bold tracking-wide drop-shadow-sm group-hover:drop-shadow-md transition-colors duration-300">
                  Lihat Simulasi Mobile Siswa
                </span>
              </button>
            </div>

            {/* Trust points */}
            <div className={`flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${isDarkMode ? 'glass-pill-dark' : 'glass-pill-light'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Anti Buka Tab & Split-Screen</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${isDarkMode ? 'glass-pill-dark' : 'glass-pill-light'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Formula Rumus KaTeX & Gambar</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${isDarkMode ? 'glass-pill-dark' : 'glass-pill-light'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Koreksi Instan & Ekspor Excel</span>
              </div>
            </div>
          </div>

          {/* DUAL PRODUCT SHOWCASE PREVIEW */}
          <div className="mt-14 max-w-5xl mx-auto relative">
            {/* Ambient Refraction Glow Directly Behind Showcase */}
            <div className={`absolute -inset-4 blur-3xl rounded-[40px] pointer-events-none -z-10 ${
              isDarkMode ? 'bg-gradient-to-r from-blue-600/30 via-indigo-600/25 to-teal-500/25' : 'bg-gradient-to-r from-blue-400/40 via-indigo-300/40 to-teal-300/35'
            }`} />

            <div className={`rounded-3xl p-5 sm:p-8 transition-all duration-300 ${
              isDarkMode ? 'glass-panel-dark' : 'glass-panel-light'
            }`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* 1. Web Portal Mockup (7 Cols) */}
                <div className={`lg:col-span-7 rounded-3xl overflow-hidden shadow-2xl border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900/90 border-white/10 shadow-blue-500/5' 
                    : 'bg-white/95 border-slate-200/80 shadow-slate-300/50'
                }`}>
                  {/* Browser Bar */}
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/60 border-white/10' : 'bg-slate-100/80 border-slate-200/80'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500 shadow-xs"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400 shadow-xs"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs"></div>
                      <span className={`text-[11px] ml-2 font-mono flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-md border ${
                        isDarkMode ? 'bg-slate-900/80 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <Lock className="w-3 h-3 text-emerald-600" />
                        portal.ujianpintar.online/proctoring
                      </span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold border border-blue-400/30 tracking-tight">
                      PORTAL GURU (WEB)
                    </span>
                  </div>

                  {/* Browser Body / Live Proctoring Real Interface */}
                  <div className="p-4 sm:p-5 space-y-3.5">
                    
                    {/* Top Status & Controls Banner (matching ProctoringKPIHeader.tsx) */}
                    <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 ${
                      isDarkMode ? 'bg-slate-800/60 border-white/10' : 'bg-slate-50/90 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center justify-center relative shrink-0">
                          <Radio className="w-4 h-4 animate-pulse" />
                          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold font-display ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              Monitoring Live Ujian
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded-md text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              TELEMETRI AKTIF
                            </span>
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Penilaian Akhir Semester • XII MIPA 1 (36 Siswa Online)
                          </div>
                        </div>
                      </div>

                      {/* Token Chip & Guru Quick Action Controls */}
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono font-bold text-[10px] border border-blue-500/20">
                          TOKEN: SMART-X
                        </span>
                        <div className="hidden sm:flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                            isDarkMode ? 'bg-slate-700/60 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                            <PlusCircle className="w-3 h-3 text-blue-600" /> +5 Menit
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                            isDarkMode ? 'bg-slate-700/60 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                            <Lock className="w-3 h-3 text-rose-500" /> Kunci Sesi
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* KPI Cards Grid (4 Real metrics matching ProctoringKPIHeader.tsx) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                      {/* Total */}
                      <div className={`p-2.5 rounded-xl border ${
                        isDarkMode ? 'bg-slate-800/40 border-white/10' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Total Peserta</span>
                          <Users className="w-3 h-3 text-blue-500" />
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-white">
                          36 <span className="text-[10px] font-normal text-slate-400">Siswa</span>
                        </div>
                        <span className="text-[9px] text-slate-400">Sesi terhubung</span>
                      </div>

                      {/* Mengerjakan */}
                      <div className={`p-2.5 rounded-xl border ${
                        isDarkMode ? 'bg-blue-950/30 border-blue-800/40' : 'bg-blue-50/80 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 mb-0.5">
                          <span className="font-bold">Mengerjakan</span>
                          <Clock className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="text-base font-black text-blue-700 dark:text-blue-300">
                          7 <span className="text-[10px] font-normal text-blue-400">Siswa</span>
                        </div>
                        <span className="text-[9px] text-blue-600 dark:text-blue-400">Layar terkunci</span>
                      </div>

                      {/* Selesai */}
                      <div className={`p-2.5 rounded-xl border ${
                        isDarkMode ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-emerald-50/80 border-emerald-200'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 mb-0.5">
                          <span className="font-bold">Selesai</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                        <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                          28 <span className="text-[10px] font-normal text-emerald-400">Siswa</span>
                        </div>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400">Tersimpan DB</span>
                      </div>

                      {/* Pelanggaran */}
                      <div className="p-2.5 rounded-xl border border-rose-300/80 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                          <span>Pelanggaran Tab</span>
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                        </div>
                        <div className="text-base font-black text-rose-600 dark:text-rose-400">
                          1 <span className="text-[10px] font-normal text-rose-500">Siswa</span>
                        </div>
                        <span className="text-[9px] font-semibold text-rose-600 dark:text-rose-400">Tab Switch Terdeteksi</span>
                      </div>
                    </div>

                    {/* Realistic Student Monitoring Table (matching StudentMonitoringTable.tsx) */}
                    <div className={`rounded-xl border overflow-hidden ${
                      isDarkMode ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-white'
                    }`}>
                      <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-b ${
                        isDarkMode ? 'bg-slate-800/50 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <span className="w-40 sm:w-48">Siswa & NISN</span>
                        <span className="w-24 sm:w-32 hidden xs:block">Progres Soal</span>
                        <span className="w-16">Sisa</span>
                        <span className="w-28 text-right sm:text-left">Status & Integritas</span>
                      </div>

                      <div className="divide-y divide-slate-200/60 dark:divide-white/5 text-xs">
                        {/* Row 1: Ahmad Fauzi (Violation Detected) */}
                        <div className="p-2.5 sm:px-3 sm:py-2.5 flex items-center justify-between gap-2 bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                          <div className="w-40 sm:w-48 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 font-black text-[11px] flex items-center justify-center shrink-0">
                              AF
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                                Ahmad Fauzi
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                00812934 • XII MIPA 1
                              </div>
                            </div>
                          </div>

                          <div className="w-24 sm:w-32 hidden xs:block">
                            <div className="flex justify-between text-[10px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                              <span>28/30 Soal</span>
                              <span className="font-mono text-slate-400">93%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: '93%' }} />
                            </div>
                          </div>

                          <div className="w-16 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> 14:20
                          </div>

                          <div className="w-28 text-right sm:text-left flex items-center justify-end sm:justify-between gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-md text-[10px] font-bold">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> 1x Keluar Layar
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                          </div>
                        </div>

                        {/* Row 2: Siti Rahmawati (Submitted - Top Score) */}
                        <div className="p-2.5 sm:px-3 sm:py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="w-40 sm:w-48 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-black text-[11px] flex items-center justify-center shrink-0">
                              SR
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                                Siti Rahmawati
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                00814912 • XII MIPA 1
                              </div>
                            </div>
                          </div>

                          <div className="w-24 sm:w-32 hidden xs:block">
                            <div className="flex justify-between text-[10px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                              <span>30/30 Soal</span>
                              <span className="font-mono text-emerald-500">100%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                            </div>
                          </div>

                          <div className="w-16 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </div>

                          <div className="w-28 text-right sm:text-left flex items-center justify-end sm:justify-between gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-[10px] font-bold">
                              Tertib (Nilai: 96)
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                          </div>
                        </div>

                        {/* Row 3: Budi Santoso (Active Working) */}
                        <div className="p-2.5 sm:px-3 sm:py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="w-40 sm:w-48 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-black text-[11px] flex items-center justify-center shrink-0">
                              BS
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                                Budi Santoso
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                00823910 • XII MIPA 1
                              </div>
                            </div>
                          </div>

                          <div className="w-24 sm:w-32 hidden xs:block">
                            <div className="flex justify-between text-[10px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                              <span>24/30 Soal</span>
                              <span className="font-mono text-blue-500">80%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: '80%' }} />
                            </div>
                          </div>

                          <div className="w-16 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> 18:45
                          </div>

                          <div className="w-28 text-right sm:text-left flex items-center justify-end sm:justify-between gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Layar Terkunci
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time Violation Feed Ticker (matching ViolationFeed.tsx) */}
                    <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                        <span className="font-bold text-rose-700 dark:text-rose-400 shrink-0 font-display text-[10px] uppercase tracking-wide">
                          Live Violation:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate font-sans text-[11px]">
                          <strong>08:14:22</strong> • <strong>Ahmad Fauzi</strong> keluar aplikasi (Tab Switch Terdeteksi - Sesi Terkunci)
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 shrink-0">
                        DANGER
                      </span>
                    </div>

                  </div>
                </div>

                {/* 2. Mobile App Mockup (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="relative group">
                    {/* Ambient Glow behind phone */}
                    <div className="absolute -inset-3 bg-gradient-to-r from-blue-600/35 to-indigo-600/35 rounded-[48px] blur-xl opacity-85 group-hover:opacity-100 transition duration-500 pointer-events-none" />
                    
                    <div className="w-[285px] sm:w-[315px] bg-slate-950 rounded-[46px] p-2.5 sm:p-3 border-4 border-slate-800 shadow-2xl relative text-white ring-1 ring-white/10 flex flex-col">
                      
                      {/* Top Phone Status Bar */}
                      <div className="px-4 pt-1.5 pb-2 flex items-center justify-between text-[11px] font-bold text-slate-300 select-none z-20">
                        {/* Clock */}
                        <span className="w-10 font-medium">09:41</span>

                        {/* Dynamic Island */}
                        <div className="w-20 sm:w-24 h-4.5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md border border-slate-800">
                          <div className="w-2 h-2 rounded-full bg-slate-800 ring-1 ring-slate-700" />
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>

                        {/* Right: Signal, Wifi, Battery */}
                        <div className="w-12 flex items-center justify-end gap-1.5 text-slate-300">
                          <span className="text-[9px] font-mono font-bold">4G</span>
                          <Wifi className="w-3 h-3" />
                          <Battery className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Screen Content Wrapper */}
                      <div className="bg-slate-900 rounded-[34px] overflow-hidden flex flex-col border border-slate-800">
                        
                        {/* Anti-cheat Kiosk Security Header Bar */}
                        <div className="bg-emerald-600 text-white px-3 py-1 text-[10px] font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> KIOSK MODE AKTIF
                          </span>
                          <span className="font-mono text-[9px] bg-emerald-700/80 px-1.5 py-0.2 rounded">
                            Layar Terkunci
                          </span>
                        </div>

                        {/* Exam Title & Live Timer Bar */}
                        <div className="px-3 py-2 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
                          <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              Soal No. 12 dari 30
                            </div>
                            <div className="text-[11px] font-black text-blue-400">
                              Matematika Wajib XII
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-mono font-black flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-400" /> 42:15
                          </span>
                        </div>

                        {/* Question Body */}
                        <div className="p-3 space-y-2.5 text-left">
                          <p className="text-slate-100 font-medium text-[11px] leading-relaxed">
                            Tentukan himpunan penyelesaian dari persamaan kuadrat berikut untuk nilai $x$ yang memenuhi:
                          </p>

                          {/* Authentic Math Formula Box with MathRenderer */}
                          <div className="p-2 bg-slate-800/90 rounded-xl border border-blue-500/30 flex items-center justify-center shadow-xs">
                            <MathRenderer math="x^2 - 7x + 12 = 0" block />
                          </div>

                          {/* Interactive Radio Options */}
                          <div className="space-y-1.5 pt-0.5">
                            {/* Option A (Selected) */}
                            <div className="px-2.5 py-2 rounded-xl bg-blue-600/30 border-2 border-blue-500 text-white font-medium text-[11px] flex items-center justify-between shadow-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                  A
                                </span>
                                <span>$x = 3$ atau $x = 4$</span>
                              </div>
                              <Check className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                            </div>

                            {/* Option B */}
                            <div className="px-2.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-black text-[10px] flex items-center justify-center shrink-0">
                                B
                              </span>
                              <span>$x = -3$ atau $x = -4$</span>
                            </div>

                            {/* Option C */}
                            <div className="px-2.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-black text-[10px] flex items-center justify-center shrink-0">
                                C
                              </span>
                              <span>$x = 2$ atau $x = 6$</span>
                            </div>
                          </div>

                          {/* Authentic In-App Navigation Buttons */}
                          <div className="pt-1.5 flex items-center justify-between gap-1.5 text-[10px] font-bold">
                            <button
                              type="button"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 cursor-default"
                            >
                              ◀ Sblm
                            </button>
                            <button
                              type="button"
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-default"
                            >
                              <Bookmark className="w-2.5 h-2.5" /> Ragu
                            </button>
                            <button
                              type="button"
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white flex items-center gap-1 cursor-default"
                            >
                              Lanjut ▶
                            </button>
                          </div>
                        </div>

                        {/* Home Bar Gesture Indicator */}
                        <div className="py-2 flex justify-center">
                          <div className="w-28 h-1 bg-slate-600 rounded-full" />
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="mt-4 text-center space-y-2.5 w-full max-w-[285px] sm:max-w-[315px]">
                    {/* Tombol Unduh APK Android (Titik B) */}
                    <button
                      type="button"
                      onClick={() => setIsDownloadModalOpen(true)}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer scale-100 hover:scale-[1.02] active:scale-95"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Unduh APK Siswa Android (15 MB)</span>
                    </button>

                    {/* Teks Pemicu Simulasi di Browser */}
                    <button
                      type="button"
                      onClick={onOpenMobileSimulation}
                      className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold underline underline-offset-4 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Atau coba simulasi interaktif di browser</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DUAL ECOSYSTEM SECTION */}
      <section id="ekosistem" className={`relative py-24 border-t transition-colors overflow-hidden ${
        isDarkMode ? 'border-white/10' : 'border-slate-200/80'
      }`}>
        {/* Vibrant Ambient Glow Orbs */}
        <div className={`absolute top-10 left-5 w-[500px] h-[400px] blur-[80px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-br from-blue-600/30 to-indigo-600/25' : 'bg-gradient-to-br from-blue-400/40 to-indigo-300/35'
        }`} />
        <div className={`absolute bottom-10 right-5 w-[500px] h-[400px] blur-[80px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-tl from-purple-600/30 to-teal-500/25' : 'bg-gradient-to-tl from-purple-300/40 to-teal-300/35'
        }`} />

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
            <div className={`rounded-3xl p-6 sm:p-8 ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-400/30 flex items-center justify-center mb-6 shadow-sm">
                <Laptop className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Web Portal Guru & Pengawas
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/20">
                  DESKTOP / LAPTOP
                </span>
              </div>
              <p className={`text-xs sm:text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Pusat kendali ujian berbasis web yang fleksibel. Dapat diakses dari browser mana saja tanpa perlu instalasi aplikasi tambahan di komputer sekolah.
              </p>

              <div className={`space-y-3.5 text-xs mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Editor Soal Canggih:</strong> Mendukung formula matematika KaTeX, tabel, gambar, serta pilihan ganda hingga esai otomatis.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Live Proctoring Dashboard:</strong> Pantau progres pengerjaan semua siswa secara serentak dalam satu layar.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Ekspor Nilai & Analisis Butir:</strong> Sekali klik untuk mengunduh rekap nilai lengkap dalam format file Excel (.xlsx).
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Manajemen Token & Jadwal:</strong> Atur tanggal pelaksanaan, durasi pengerjaan, dan token dinamis yang aman.
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToAuth('signup')}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25"
              >
                <span>Buka Akun Guru Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CARD 2: MOBILE APP SISWA */}
            <div className={`rounded-3xl p-6 sm:p-8 ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-400/30 flex items-center justify-center mb-6 shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Aplikasi Mobile Siswa
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-400/20">
                  ANDROID & IOS
                </span>
              </div>
              <p className={`text-xs sm:text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Aplikasi ujian khusus peserta didik yang ringan, berlayar penuh, dan dilengkapi sistem penguncian keamanan tingkat tinggi.
              </p>

              <div className={`space-y-3.5 text-xs mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-400/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Anti-Cheating Kiosk Mode:</strong> Mengunci layar penuh, mematikan recent apps, dan mencegah fitur split-screen.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-400/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Deteksi Keluar Aplikasi:</strong> Peringatan otomatis seketika dan pencatatan log jika siswa mencoba membuka Google/AI/kalkulator.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-400/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Hemat Kuota & Ringan:</strong> Ukuran paket aplikasi di bawah 15 MB sehingga sangat lancar di smartphone spesifikasi siswa.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-400/30">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Ketahanan Offline:</strong> Jawaban tersimpan di memori perangkat sehingga aman jika Wi-Fi sekolah sempat terputus sementara.
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 scale-100 hover:scale-[1.01] active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh APK Siswa Android (v1.0)</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenMobileSimulation}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDarkMode ? 'glass-pill-dark text-indigo-300 hover:bg-slate-800' : 'glass-pill-light text-indigo-700 hover:bg-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Coba Tampilan Ujian Siswa</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="fitur" className="relative py-24 overflow-hidden">
        {/* Vibrant Ambient Glows for Frosted Glass */}
        <div className={`absolute top-1/4 left-1/4 w-[600px] h-[450px] blur-[80px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-r from-teal-500/25 via-blue-500/25 to-indigo-500/25' : 'bg-gradient-to-r from-teal-300/40 via-blue-300/40 to-indigo-300/35'
        }`} />
        <div className={`absolute bottom-10 right-1/4 w-[600px] h-[450px] blur-[80px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-l from-rose-500/25 via-amber-500/25 to-purple-500/25' : 'bg-gradient-to-l from-rose-300/35 via-amber-300/35 to-purple-300/35'
        }`} />

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
            <div className={`p-6 rounded-2xl ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-400/30 flex items-center justify-center mb-4 shadow-sm">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Live Proctoring Radar
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Pantau seluruh peserta secara live. Ketahui siapa yang sedang menjawab nomor berapa, sisa waktu, dan siswa yang terindikasi melanggar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`p-6 rounded-2xl ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30 flex items-center justify-center mb-4 shadow-sm">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Koreksi Instan & Ekspor Excel
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Begitu siswa menekan tombol selesai, nilai langsung terhitung otomatis. Rekap nilai siap cetak atau ekspor ke file Excel.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`p-6 rounded-2xl ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-400/30 flex items-center justify-center mb-4 shadow-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Dukungan Rumus Eksakta (KaTeX)
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Mengetik soal matematika, fisika, kimia, atau bahasa Arab tidak lagi rumit. Rumus pecahan, integral, dan akar tampil jernih di semua gawai.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`p-6 rounded-2xl ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center mb-4 shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Token Ujian Dinamis
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Cegah kebocoran soal dengan kode token unik yang bisa diubah oleh pengawas setiap saat atau diset kedaluwarsa secara otomatis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`p-6 rounded-2xl ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-400/30 flex items-center justify-center mb-4 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Acak Soal & Opsi Jawaban
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Tiap siswa menerima urutan butir soal dan opsi jawaban yang berbeda, sehingga siswa yang duduk berdampingan tidak bisa saling contek huruf opsi.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`p-6 rounded-2xl ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-400/30 flex items-center justify-center mb-4 shadow-sm">
                <BarChart3 className="w-6 h-6" />
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
      <section id="keamanan" className={`relative py-24 border-t transition-colors overflow-hidden ${
        isDarkMode ? 'border-white/10' : 'border-slate-200/80'
      }`}>
        {/* Ambient Glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] blur-[80px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-r from-rose-600/30 via-amber-600/25 to-purple-600/25' : 'bg-gradient-to-r from-rose-400/40 via-amber-300/35 to-purple-300/35'
        }`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl p-8 sm:p-12 ${
            isDarkMode ? 'glass-panel-dark' : 'glass-panel-light'
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
                  <div className={`p-3.5 rounded-xl flex items-center gap-3 transition-colors ${
                    isDarkMode ? 'glass-pill-dark text-slate-300' : 'glass-pill-light text-slate-700'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-400/30">1</span>
                    <span><strong>Sensor Fokus Jendela:</strong> Seketika layar kehilangan fokus, timer dijeda dan tercatat sebagai pelanggaran.</span>
                  </div>
                  <div className={`p-3.5 rounded-xl flex items-center gap-3 transition-colors ${
                    isDarkMode ? 'glass-pill-dark text-slate-300' : 'glass-pill-light text-slate-700'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-400/30">2</span>
                    <span><strong>Batas Toleransi (Strike Limit):</strong> Pengawas bisa mengatur batas toleransi (misal maksimal 3x keluar aplikasi sebelum ujian otomatis disubmit).</span>
                  </div>
                  <div className={`p-3.5 rounded-xl flex items-center gap-3 transition-colors ${
                    isDarkMode ? 'glass-pill-dark text-slate-300' : 'glass-pill-light text-slate-700'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/30">3</span>
                    <span><strong>Bukti Log Detik Demi Detik:</strong> Guru memiliki rekaman akurat yang bisa ditunjukkan sebagai bukti kepada orang tua siswa.</span>
                  </div>
                </div>
              </div>

              <div className={`lg:col-span-5 rounded-2xl p-6 text-center shadow-lg transition-all ${
                isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
              }`}>
                <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-400/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all w-full cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Coba Gratis di Kelas Anda
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING & INFO APLIKASI SECTION */}
      <section id="harga" className={`relative py-24 border-t transition-colors overflow-hidden ${
        isDarkMode ? 'border-white/10' : 'border-slate-200/80'
      }`}>
        {/* Ambient Glow */}
        <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[500px] blur-[80px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-teal-500/25' : 'bg-gradient-to-r from-blue-400/40 via-indigo-300/40 to-teal-300/35'
        }`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
              <Award className="w-3.5 h-3.5" />
              <span>Paket & Harga Berlangganan</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold font-display mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Pilihan Paket Guru & Lisensi Sekolah
            </h2>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Harga transparan dan ramah pendidik. Mulai gratis selamanya untuk guru mandiri, nikmati fitur tanpa batas di Paket PRO, atau daftarkan lisensi resmi satu sekolah via NPSN.
            </p>

            {/* Monthly / Yearly Billing Switcher */}
            <div className={`mt-8 inline-flex items-center p-1 rounded-2xl border select-none transition-all shadow-xs ${
              isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tagihan Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Tagihan Tahunan</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-black">
                  Hemat 25%
                </span>
              </button>
            </div>
          </div>

          {/* 3 Subscription Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            
            {/* Card 1: Paket Guru Basic (Gratis) */}
            <div className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-500/15 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-display font-black text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Paket Guru Basic
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.2">
                        Gratis Selamanya
                      </span>
                    </div>
                  </div>
                </div>

                <p className={`text-xs mb-5 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Cocok untuk guru yang baru memulai ujian digital berbasis kelas mandiri.
                </p>

                {/* Price Display */}
                <div className={`p-4 rounded-2xl mb-6 border flex flex-col items-center justify-center text-center ${
                  isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200/80'
                }`}>
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className={`text-3xl font-display font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Gratis
                    </span>
                    <span className="text-xs font-semibold text-slate-400">selamanya</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 text-center">
                    Tanpa perlu kartu kredit & bebas biaya pendaftaran
                  </div>
                </div>

                {/* Features List */}
                <div className={`space-y-2.5 text-xs border-t pt-4 ${
                  isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Fitur yang Didapatkan:
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Maksimal 3 sesi ujian aktif per bulan</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Kapasitas hingga 40 siswa per ujian (1 Kelas)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Bank soal pilihan ganda, B/S, & isian</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Simulasi pengerjaan smartphone siswa</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Ekspor rekap nilai standar (.csv)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToAuth('signup')}
                className={`mt-8 w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isDarkMode ? 'glass-pill-dark text-white hover:bg-slate-800' : 'glass-pill-light text-slate-800 hover:bg-white'
                }`}
              >
                Daftar Akun Basic Gratis
              </button>
            </div>

            {/* Card 2: Paket Guru PRO (Paling Populer) */}
            <div className={`rounded-3xl p-6 sm:p-8 border-2 border-blue-500 flex flex-col justify-between relative md:-translate-y-2 transition-all duration-300 hover:-translate-y-3 ${
              isDarkMode 
                ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] ring-4 ring-blue-500/20' 
                : 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white shadow-[0_20px_50px_rgba(37,99,235,0.25)] ring-4 ring-blue-500/25'
            }`}>
              {/* Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-display font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 ring-2 ring-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Paling Populer
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-lg text-white leading-tight">
                        Paket Guru PRO
                      </h3>
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block -mt-0.2">
                        Guru Mandiri
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs mb-5 text-slate-300 leading-relaxed">
                  Solusi lengkap untuk guru mandiri dengan ujian tanpa batas dan pengawasan ketat.
                </p>

                {/* Price Display with dynamic billing cycle */}
                <div className="p-4 rounded-2xl mb-6 bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center text-center">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-3xl font-display font-black text-white">
                      {billingCycle === 'yearly' ? 'Rp 180.000' : 'Rp 20.000'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {billingCycle === 'yearly' ? '/ tahun' : '/ bulan'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' ? (
                    <div className="mt-1.5 flex items-center justify-center gap-1.5">
                      <span className="text-[11px] font-medium text-emerald-400">
                        ⚡ Setara Rp 15.000/bln
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                        Hemat 25%
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[11px] text-slate-400 text-center">
                      Bayar bulanan fleksibel tanpa komitmen panjang
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 text-xs border-t border-slate-700/80 pt-4 text-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Fitur Unggulan PRO:
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>Unlimited (Tanpa Batas)</strong> sesi ujian aktif</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>Unlimited (Tanpa Batas)</strong> kapasitas siswa</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Penguncian layar penuh (*Fullscreen Lock*) & deteksi tab ketat</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Editor rumus matematika LaTeX KaTeX tak terbatas</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Ekspor nilai lengkap format Excel (.xlsx) & CSV</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Lencana akun PRO resmi & prioritas grading</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Stempel integritas anti-manipulasi SHA-256</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigateToAuth('signup')}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer scale-100 hover:scale-[1.02] active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Coba 14 Hari PRO Gratis</span>
                </button>
                <div className="text-center text-[10px] text-slate-400">
                  ⚡ Tanpa pungutan biaya saat pendaftaran awal
                </div>
              </div>
            </div>

            {/* Card 3: Paket Lisensi Sekolah */}
            <div className={`rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 dark:border-emerald-500/40 flex flex-col justify-between relative transition-all ${
              isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
            }`}>
              {/* Institution Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-display font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 ring-2 ring-white">
                <Building2 className="w-3.5 h-3.5" /> Lisensi Sekolah
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-display font-black text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Paket Lisensi Sekolah
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block -mt-0.2">
                        Institusi (NPSN)
                      </span>
                    </div>
                  </div>
                </div>

                <p className={`text-xs mb-5 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Lisensi resmi untuk seluruh dewan guru dalam satu satuan pendidikan (NPSN).
                </p>

                {/* Price Display */}
                <div className={`p-4 rounded-2xl mb-6 border flex flex-col items-center justify-center text-center ${
                  isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-emerald-50/60 border-emerald-200'
                }`}>
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className={`text-3xl font-display font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Rp 1.500.000
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/ tahun</span>
                  </div>
                  <div className="mt-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 text-center">
                    ⚡ Setara Rp 125.000/bln
                  </div>
                </div>

                {/* Features List */}
                <div className={`space-y-2.5 text-xs border-t pt-4 ${
                  isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Fasilitas Lisensi Sekolah:
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Semua akun guru dalam 1 NPSN</strong> otomatis berstatus PRO</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Unlimited siswa, kelas, dan ujian</strong> seluruh sekolah</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Kustom logo resmi & kop surat sekolah pada ujian siswa</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Bank soal kolektif antar guru satu sekolah</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Rekap analitik kelulusan per tingkat kelas & mata pelajaran</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Dukungan teknis prioritas via WhatsApp Hotline</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20UjianPintar,%20sekolah%20kami%20ingin%20mengaktifkan%20Paket%20Lisensi%20Sekolah%20(NPSN)"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Daftarkan Lisensi Sekolah</span>
                </a>
                <div className="text-center text-[10px] text-slate-400">
                  🔑 Atau aktivasi via Kode Voucher di Dashboard Guru
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className={`relative py-24 border-t transition-colors overflow-hidden ${
        isDarkMode ? 'border-white/10' : 'border-slate-200/80'
      }`}>
        {/* Ambient Glow */}
        <div className={`absolute bottom-10 right-1/4 w-[600px] h-[400px] blur-[80px] rounded-full pointer-events-none -z-10 ${
          isDarkMode ? 'bg-blue-600/20' : 'bg-blue-400/25'
        }`} />

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
                className={`rounded-2xl overflow-hidden transition-all duration-200 ${
                  isDarkMode ? 'glass-panel-interactive-dark' : 'glass-panel-interactive-light'
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
                    isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-600'
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
      <section className="relative py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white overflow-hidden">
        {/* Ambient Glows inside CTA */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-900/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex p-3.5 rounded-2xl bg-white/15 backdrop-blur-md text-white mb-4 border border-white/25 shadow-xl">
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
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/30 backdrop-blur-md transition-all cursor-pointer shadow-sm"
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
              <a href="#harga" className="hover:text-blue-600 transition-colors">Paket & Harga</a>
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

      {/* POSISI 4: FLOATING BOTTOM STICKY BAR (KHUSUS PENGUNJUNG HP / MOBILE) */}
      {!isMobileBarDismissed && (
        <aside 
          aria-label="Unduh Aplikasi Siswa"
          className="sm:hidden fixed bottom-3 left-3 right-3 z-40 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className={`p-3 rounded-2xl shadow-2xl border flex items-center justify-between gap-2.5 backdrop-blur-xl transition-colors ${
            isDarkMode 
              ? 'bg-slate-900/95 border-emerald-500/30 text-white shadow-emerald-950/50 ring-1 ring-emerald-500/20' 
              : 'bg-white/95 border-emerald-400/50 text-slate-800 shadow-emerald-600/15 ring-1 ring-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span className="truncate">Aplikasi Ujian Siswa</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold shrink-0">
                    APK
                  </span>
                </div>
                <div className={`text-[10px] truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ujian bebas curang di HP Anda
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobileBarDismissed(true)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Tutup pemberitahuan"
                aria-label="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* MODAL VERIFIKASI EMAIL & WHATSAPP SEBELUM UNDUH APK */}
      <DownloadApkModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

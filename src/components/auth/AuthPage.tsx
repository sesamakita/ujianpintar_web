import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  BookOpen, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles,
  Zap,
  AlertCircle,
  Phone,
  CheckCircle2,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { authService } from '../../services/authService';

interface AuthPageProps {
  onLoginSuccess: (userData: { name: string; email: string; school: string; subject: string }) => void;
  onBackToLanding?: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export const AuthPage: React.FC<AuthPageProps> = ({ 
  onLoginSuccess,
  onBackToLanding,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  
  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [subject, setSubject] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Forgot password 2-step state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    // 1. FORGOT PASSWORD STEP 1: Verifikasi Email & Nomor WhatsApp
    if (mode === 'forgot' && forgotStep === 1) {
      const verifyRes = await authService.verifyTeacherIdentity(email, whatsapp);
      setIsLoading(false);

      if (!verifyRes.success) {
        setNotification(verifyRes.error || 'Data Email dan Nomor WhatsApp tidak sesuai dengan akun terdaftar.');
        return;
      }

      setVerifiedName(verifyRes.profile?.name || '');
      setForgotStep(2);
      setNotification(null);
      return;
    }

    // 2. FORGOT PASSWORD STEP 2: Ganti Password Baru
    if (mode === 'forgot' && forgotStep === 2) {
      if (!newPassword || newPassword.length < 6) {
        setIsLoading(false);
        setNotification('Kata sandi baru minimal 6 karakter.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setIsLoading(false);
        setNotification('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
        return;
      }

      const resetRes = await authService.resetPassword(email, newPassword);
      setIsLoading(false);

      if (!resetRes.success) {
        setNotification(resetRes.error || 'Gagal mengubah kata sandi.');
        return;
      }

      setNotification('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.');
      setMode('login');
      setForgotStep(1);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      return;
    }

    // 3. DAFTAR AKUN BARU
    if (mode === 'signup') {
      const res = await authService.signUpTeacher(email, password, {
        name: fullName || 'Bpk. Rahmat, S.Pd.',
        school: schoolName || 'SMA Negeri 1 Indonesia',
        subject: subject || 'Matematika Wajib',
        whatsapp: whatsapp || '081234567890',
      });
      setIsLoading(false);
      if (res.error) {
        setNotification(`Gagal mendaftar: ${res.error}`);
        return; // ← STOP jika error
      }
      onLoginSuccess({
        name: res.profile?.name || fullName || 'Bpk. Rahmat, S.Pd.',
        email: email || 'rahmat.guru@belajar.id',
        school: res.profile?.school || schoolName || 'SMA Negeri 1 Indonesia',
        subject: res.profile?.subject || subject || 'Matematika Wajib',
      });
    } else {
      // 4. LOGIN AKUN
      const res = await authService.signInTeacher(email, password);
      setIsLoading(false);
      // Blokir login jika ada error atau user null (password salah, dll)
      if (res.error || !res.user) {
        setNotification(
          res.error
            ? `Login gagal: ${res.error}`
            : 'Email atau kata sandi tidak valid.'
        );
        return; // ← STOP — jangan izinkan masuk
      }
      onLoginSuccess({
        name: res.profile?.name || 'Bpk. Rahmat, S.Pd.',
        email: email || 'rahmat.guru@belajar.id',
        school: res.profile?.school || 'SMA Negeri 1 Indonesia',
        subject: res.profile?.subject || 'Matematika Wajib',
      });
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await authService.signInWithGoogle();
    const user = await authService.getCurrentUser();
    setIsLoading(false);
    onLoginSuccess({
      name: user?.name || 'Bpk. Rahmat, S.Pd.',
      email: user?.email || 'rahmat@guru.sma.belajar.id',
      school: user?.school || 'SMA Negeri 1 Indonesia',
      subject: user?.subject || 'Matematika Wajib',
    });
  };

  const clearAllFields = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setSchoolName('');
    setSubject('');
    setWhatsapp('');
    setNewPassword('');
    setConfirmPassword('');
    setVerifiedName('');
    setNotification(null);
  };

  const handleSwitchToForgot = () => {
    clearAllFields();
    setMode('forgot');
    setForgotStep(1);
  };

  const handleSwitchToLogin = () => {
    clearAllFields();
    setMode('login');
    setForgotStep(1);
  };

  const handleSwitchToSignup = () => {
    clearAllFields();
    setMode('signup');
    setForgotStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-100/90 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans select-none">
      {/* Main Split Container */}
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left Side: Brand Showcase (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 lg:p-9 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-xl tracking-tight leading-none text-white">
                    UjianPintar
                  </span>
                  <span className="text-[10px] uppercase font-mono font-black tracking-wider px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md border border-blue-400/30">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Portal Guru & Ujian Sekolah</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs font-display font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Platform Asesmen Berintegritas
              </span>
              <h2 className="text-xl lg:text-2xl font-display font-extrabold text-white leading-tight tracking-tight">
                Ujian Online Mudah Seperti Google Form, Sekuat CBT Profesional.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Dilengkapi live proctoring deteksi keluar layar, formula rumus LaTeX, dan koreksi otomatis instan berbasis mesin Rust.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 space-y-2.5 my-6">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-display font-bold text-slate-200">Anti-Cheat & Fullscreen Lock</div>
                <div className="text-[11px] text-slate-400 font-sans">Deteksi perpindahan tab & aplikasi lain secara instan</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-display font-bold text-slate-200">Token 6-Digit & Bebas Login Siswa</div>
                <div className="text-[11px] text-slate-400 font-sans">Siswa langsung masuk dengan NISN & PIN Token</div>
              </div>
            </div>
          </div>

          {/* Security Bottom Pill */}
          <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>🔐 Supabase Cloud Protected</span>
            <span>Rust Engine v2.4</span>
          </div>
        </div>

        {/* Right Side: Auth Form (7 Cols) */}
        <div className="lg:col-span-7 p-7 lg:p-10 flex flex-col justify-between bg-white">
          
          <div>
            {/* Back to Landing Page Link */}
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="mb-5 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium group cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span>Kembali ke Website Utama</span>
              </button>
            )}

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-xl font-display font-extrabold text-slate-900 tracking-tight">
                  {mode === 'login' && 'Masuk ke Portal Guru'}
                  {mode === 'signup' && 'Daftar Akun Guru Baru'}
                  {mode === 'forgot' && forgotStep === 1 && 'Autentikasi & Verifikasi Akun'}
                  {mode === 'forgot' && forgotStep === 2 && 'Ganti Kata Sandi Baru'}
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  {mode === 'login' && 'Kelola bank soal dan pantau ujian siswa secara real-time'}
                  {mode === 'signup' && 'Buat akun gratis dan mulai terbitkan ujian sekolah Anda'}
                  {mode === 'forgot' && forgotStep === 1 && 'Lampirkan Email & No. WhatsApp terdaftar untuk autentikasi'}
                  {mode === 'forgot' && forgotStep === 2 && 'Masukkan kata sandi baru untuk akun guru Anda'}
                </p>
              </div>

              {mode !== 'forgot' && (
                <div className="flex bg-slate-100 p-1 rounded-xl flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleSwitchToLogin}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToSignup}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Daftar
                  </button>
                </div>
              )}
            </div>

            {/* Notification Banner */}
            {notification && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{notification}</span>
              </div>
            )}

            {/* Google / belajar.id SSO Button */}
            {mode === 'login' && (
              <div className="mt-5 space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-11 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2.5 text-slate-800 font-display font-bold text-xs transition-all shadow-xs cursor-pointer group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Lanjutkan dengan Akun Google / belajar.id</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider">
                    atau gunakan email & kata sandi
                  </span>
                </div>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="mt-4 space-y-3.5">
              
              {/* Extra Fields for Sign Up Mode */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap & Gelar Guru
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Bpk. Rahmat, S.Pd."
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nama Sekolah / Instansi
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          placeholder="SMA Negeri 1 Indonesia"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Mata Pelajaran Utama
                      </label>
                      <div className="relative">
                        <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          placeholder="Contoh: Matematika, Fisika, dll"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Field for Sign Up */}
                  <div>
                    <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor WhatsApp Guru
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        autoComplete="off"
                        placeholder="Contoh: 081234567890"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-sans mt-1 block">
                      Nomor ini akan digunakan sebagai verifikasi keamanan saat pemulihan kata sandi.
                    </span>
                  </div>
                </>
              )}

              {/* Email Field (for login, signup, and forgot step 1) */}
              {((mode === 'login' || mode === 'signup') || (mode === 'forgot' && forgotStep === 1)) && (
                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {mode === 'forgot' ? 'Alamat Email Terdaftar' : 'Alamat Email Guru'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="nama.guru@belajar.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* FORGOT PASSWORD: STEP 1 (WhatsApp Input) */}
              {mode === 'forgot' && forgotStep === 1 && (
                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp Terdaftar
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      autoComplete="off"
                      placeholder="Contoh: 081234567890"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans mt-1 block">
                    Sistem akan memverifikasi kecocokan Email & No. WhatsApp untuk mengaktifkan sesi ganti kata sandi.
                  </span>
                </div>
              )}

              {/* FORGOT PASSWORD: STEP 2 (Ganti Password Baru) */}
              {mode === 'forgot' && forgotStep === 2 && (
                <>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 animate-in fade-in">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-display font-bold">Identitas Terverifikasi</div>
                      <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                        {verifiedName || email} • {whatsapp}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="Ketik ulang kata sandi baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Password Field (only for login & signup) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={handleSwitchToForgot}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                      >
                        Lupa Sandi?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me Toggle */}
              {mode === 'login' && (
                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 font-sans">Ingat sesi saya di komputer ini</span>
                </label>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === 'login' && 'Masuk ke Dashboard Guru'}
                        {mode === 'signup' && 'Daftar & Terbitkan Ujian'}
                        {mode === 'forgot' && forgotStep === 1 && 'Autentikasi Email & WhatsApp'}
                        {mode === 'forgot' && forgotStep === 2 && 'Simpan Kata Sandi Baru'}
                      </span>
                      {mode === 'forgot' && forgotStep === 2 ? (
                        <KeyRound className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Back to Login if on forgot mode */}
              {mode === 'forgot' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="text-xs text-slate-500 hover:text-slate-800 font-display font-bold cursor-pointer"
                  >
                    ← Kembali ke Halaman Masuk
                  </button>
                </div>
              )}

            </form>
          </div>

          {/* Footer Note */}
          <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-sans gap-2">
            <span>Siswa tidak memerlukan akun guru. Siswa masuk via NISN & PIN.</span>
            <a
              href="/super-admin"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, '', '/super-admin');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-slate-400 hover:text-indigo-600 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Portal Super Admin →</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AuthPage;


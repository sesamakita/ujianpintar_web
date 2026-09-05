import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  ArrowLeft
} from 'lucide-react';

interface SuperAdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToTeacherApp: () => void;
}

export const SuperAdminLoginPage: React.FC<SuperAdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToTeacherApp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      // Super Admin credentials check
      if (
        (cleanEmail === 'admin@ujianpintar.id' || cleanEmail === 'superadmin@guruhebat.com' || cleanEmail === 'admin') &&
        (cleanPass === 'superadmin2026' || cleanPass === 'admin123' || cleanPass === 'admin')
      ) {
        localStorage.setItem('ujianpintar_super_admin_session', JSON.stringify({
          email: cleanEmail,
          loggedInAt: new Date().toISOString(),
        }));
        onLoginSuccess();
      } else {
        setErrorMsg('Email Super Admin atau Kunci Keamanan salah. Silakan periksa kembali.');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background Glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-lg tracking-tight text-white flex items-center gap-2">
              <span>UjianPintar</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
                ROOT SAAS
              </span>
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToTeacherApp}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Portal Guru</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center my-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-display font-black text-white tracking-tight">
              Login Super Admin
            </h2>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Super Admin
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ujianpintar.id"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Kunci Keamanan / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memverifikasi Akses...</span>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

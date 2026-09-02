import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LogOut, 
  ArrowLeft
} from 'lucide-react';
import { SuperAdminLoginPage } from './SuperAdminLoginPage';
import { SuperAdminDashboard } from './SuperAdminDashboard';

interface SuperAdminPortalProps {
  onExit: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('admin@ujianpintar.id');

  useEffect(() => {
    const raw = localStorage.getItem('ujianpintar_super_admin_session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.email) {
          setIsAuthenticated(true);
          setAdminEmail(parsed.email);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ujianpintar_super_admin_session');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <SuperAdminLoginPage
        onLoginSuccess={() => {
          const raw = localStorage.getItem('ujianpintar_super_admin_session');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              setAdminEmail(parsed.email || 'admin@ujianpintar.id');
            } catch {
              // ignore
            }
          }
          setIsAuthenticated(true);
        }}
        onBackToTeacherApp={onExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Super Admin Navigation Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg tracking-tight text-white leading-none">
                UjianPintar
              </h1>
              <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 rounded-md font-mono text-[10px] font-bold">
                ROOT SUPER ADMIN
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
              Login as: {adminEmail}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Portal Guru</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Admin</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 py-4">
        <SuperAdminDashboard />
      </main>
    </div>
  );
};

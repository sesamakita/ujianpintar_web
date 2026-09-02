import React from 'react';
import { X, Sparkles, Check, ArrowRight, Zap } from 'lucide-react';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlans: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  isOpen,
  onClose,
  onOpenPlans,
  featureTitle = 'Buka Kapasitas & Fitur Lengkap UjianPintar PRO',
  featureDescription = 'Tingkatkan akun Anda ke paket PRO untuk menikmati ujian tanpa batas, pengawasan layar penuh ketat, dan ekspor raport otomatis.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-700 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-600/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-6 h-6 fill-white" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-mono font-bold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> UjianPintar PRO
            </span>
            <h3 className="font-display font-black text-xl text-white mt-2 leading-snug">
              {featureTitle}
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
              {featureDescription}
            </p>
          </div>

          {/* Quick Perks */}
          <div className="space-y-2 p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Unlimited (Tanpa Batas) Sesi Ujian & Siswa</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Penguncian Layar Penuh (Fullscreen Lock) Anti-Curang</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Ekspor Raport Lengkap format Excel (.xlsx) & CSV</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Hanya <strong>Rp 20.000 / bulan</strong> (atau Rp 15.000/bln tahunan)</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPlans();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
            >
              <span>Lihat Pilihan Paket & Upgrade</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 font-sans cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UpgradePromptModal;

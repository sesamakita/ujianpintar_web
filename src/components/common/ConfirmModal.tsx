import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  X,
  HelpCircle,
  Loader2
} from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  iconType?: 'trash' | 'warning' | 'lock' | 'check' | 'question';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger',
  iconType,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    if (variant === 'danger' || iconType === 'trash') {
      return (
        <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-xs border border-rose-200">
          {iconType === 'trash' ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
      );
    }
    if (variant === 'warning' || iconType === 'lock') {
      return (
        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-xs border border-amber-200">
          {iconType === 'lock' ? <Lock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-200">
        {iconType === 'check' ? <CheckCircle2 className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </div>
    );
  };

  const getConfirmButtonClasses = () => {
    if (variant === 'danger') {
      return 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25';
    }
    if (variant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X button */}
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-4 pr-6">
          {renderIcon()}
          <div className="space-y-1.5 min-w-0">
            <h3 className="font-display font-bold text-slate-900 text-base leading-snug tracking-tight">
              {title}
            </h3>
            <div className="text-xs text-slate-600 font-sans leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-display font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

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
  flat?: boolean;
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
  flat = false,
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
    const iconContainerClass = flat
      ? variant === 'danger' || iconType === 'trash'
        ? 'w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0 border border-rose-200'
        : variant === 'warning' || iconType === 'lock'
        ? 'w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-200'
        : 'w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 border border-blue-200'
      : variant === 'danger' || iconType === 'trash'
      ? 'w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-xs border border-rose-200'
      : variant === 'warning' || iconType === 'lock'
      ? 'w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-xs border border-amber-200'
      : 'w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-200';

    const iconContent =
      iconType === 'trash' ? (
        <Trash2 className="w-5 h-5" />
      ) : iconType === 'lock' ? (
        <Lock className="w-5 h-5" />
      ) : iconType === 'check' ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : variant === 'danger' || variant === 'warning' ? (
        <AlertTriangle className="w-5 h-5" />
      ) : (
        <HelpCircle className="w-5 h-5" />
      );

    return <div className={iconContainerClass}>{iconContent}</div>;
  };

  const getConfirmButtonClasses = () => {
    if (flat) {
      if (variant === 'danger') return 'bg-rose-600 hover:bg-rose-700 text-white rounded-lg';
      if (variant === 'warning') return 'bg-amber-600 hover:bg-amber-700 text-white rounded-lg';
      return 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg';
    }
    if (variant === 'danger') {
      return 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25';
    }
    if (variant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25';
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150 ${
        flat ? 'bg-slate-900/60' : 'bg-slate-950/70 backdrop-blur-xs'
      }`}
    >
      <div
        className={`bg-white w-full space-y-5 animate-in zoom-in-95 duration-200 relative ${
          flat
            ? 'rounded-xl p-6 max-w-md border-2 border-slate-200 shadow-sm'
            : 'rounded-3xl p-6 max-w-md shadow-2xl border border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X button */}
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 right-4 flex items-center justify-center transition-colors cursor-pointer ${
              flat
                ? 'w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
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

        <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className={`px-4 py-2.5 text-xs font-display font-bold transition-colors cursor-pointer disabled:opacity-50 ${
              flat
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl'
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2.5 text-xs font-display font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              flat ? 'rounded-lg' : 'rounded-xl'
            } ${getConfirmButtonClasses()}`}
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

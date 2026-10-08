import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { aiQuestionService } from '../../services/aiQuestionService';

interface GeminiApiKeySettingsProps {
  /** Current stored key value (sync from parent so status reflects reality). */
  currentKey: string;
  /** Callback when a key is successfully saved/tested. */
  onKeySaved: (key: string) => void;
  /** Callback when the key is removed. */
  onKeyRemoved: () => void;
  /** Visual variant: 'dark' (indigo drawer used in EssayGradingModal) or 'light' (white card used in AIGeneratorModal). */
  variant?: 'dark' | 'light';
  /** Show the "Dapatkan Key Gratis" guidance block (AIGenerator uses a richer onboarding). */
  showGuide?: boolean;
}

/**
 * Shared "Bring Your Own Key" settings for Gemini AI.
 * Replaces the duplicated API key input/test UI in AIGeneratorModal & EssayGradingModal.
 * Writes ONLY to the primary storage key (see aiQuestionService).
 */
export const GeminiApiKeySettings: React.FC<GeminiApiKeySettingsProps> = ({
  currentKey,
  onKeySaved,
  onKeyRemoved,
  variant = 'dark',
  showGuide = true,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(currentKey);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConfirmRemove, setIsConfirmRemove] = useState(false);

  useEffect(() => {
    setApiKeyInput(currentKey);
  }, [currentKey]);

  const handleSaveAndTest = useCallback(async () => {
    const clean = apiKeyInput.trim();
    if (!clean) {
      setResult({ success: false, message: 'Harap masukkan API Key Google Gemini Anda.' });
      return;
    }
    setIsTesting(true);
    setResult(null);
    try {
      const test = await aiQuestionService.testApiKey(clean);
      if (test.valid) {
        aiQuestionService.setStoredApiKey(clean);
        onKeySaved(clean);
        setResult({ success: true, message: `API Key Valid & Aktif! Terhubung ke model ${test.model || 'Gemini'}.` });
      } else {
        setResult({ success: false, message: test.error || 'API Key tidak valid. Periksa kembali kunci dari Google AI Studio.' });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Gagal menguji API Key Gemini.' });
    } finally {
      setIsTesting(false);
    }
  }, [apiKeyInput, onKeySaved]);

  const handleRemove = () => {
    if (!isConfirmRemove) {
      setIsConfirmRemove(true);
      return;
    }
    aiQuestionService.setStoredApiKey('');
    setApiKeyInput('');
    setResult(null);
    setIsConfirmRemove(false);
    onKeyRemoved();
  };

  const inputCls =
    variant === 'dark'
      ? 'flex-1 h-9 px-3 text-xs bg-slate-900 border border-indigo-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400'
      : 'flex-1 px-3 py-2.5 text-xs font-mono bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 shadow-2xs';

  const btnCls =
    variant === 'dark'
      ? 'h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap'
      : 'px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-display font-bold shadow-xs cursor-pointer flex items-center gap-1.5 flex-shrink-0';

  return (
    <div className={variant === 'dark' ? 'space-y-2' : 'space-y-2 pt-1'}>
      {showGuide && (
        <div className={variant === 'dark' ? 'flex items-center justify-between' : ''}>
          <div className="flex items-center gap-1.5 text-xs font-display font-bold text-amber-300">
            <Key className="w-4 h-4" />
            <span>Pengaturan API Key Google Gemini Pribadi</span>
          </div>
          {variant === 'dark' && (
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 underline"
            >
              <span>Dapatkan Key Gratis di Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder={variant === 'dark' ? 'Tempel API Key Gemini Anda di sini (AIzaSy...)' : 'Tempelkan API Key (AIzaSy...)'}
          className={inputCls}
        />
        <button type="button" onClick={handleSaveAndTest} disabled={isTesting} className={btnCls}>
          {isTesting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{variant === 'dark' ? 'Menguji...' : 'Memverifikasi...'}</span>
            </>
          ) : (
            <>
              {variant === 'dark' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{variant === 'dark' ? 'Simpan & Verifikasi' : 'Simpan & Verifikasi'}</span>
            </>
          )}
        </button>
        {currentKey && (
          <button
            type="button"
            onClick={handleRemove}
            className={variant === 'dark'
              ? 'h-9 px-3 text-rose-300 hover:text-rose-200 text-[11px] font-semibold cursor-pointer flex items-center gap-1'
              : 'text-xs text-rose-600 hover:underline font-semibold cursor-pointer flex items-center gap-1'}
            title="Hapus Key"
          >
            <Trash2 className="w-3 h-3" />
            {isConfirmRemove ? 'Yakin?' : 'Hapus'}
          </button>
        )}
      </div>

      {result && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            result.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      {variant === 'light' && showGuide && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-1 gap-1">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1"
          >
            <span>🔗 Buka Google AI Studio untuk Dapatkan Key Gratis</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-amber-600 font-medium text-[10.5px]">
            *Gunakan Gmail pribadi (@gmail.com), akun belajar.id dibatasi
          </span>
        </div>
      )}
    </div>
  );
};

export default GeminiApiKeySettings;
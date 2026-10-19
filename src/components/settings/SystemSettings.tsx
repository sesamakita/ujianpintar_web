import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  User, 
  Save, 
  CheckCircle2, 
  Phone, 
  AlertCircle,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  BookOpen,
  Camera,
  Trash2,
  Database,
  HardDrive,
  Clock,
  Sparkles,
  Search,
  Cpu,
  Zap,
  ExternalLink,
  Key,
  RefreshCw,
  Bot
} from 'lucide-react';
import { authService } from '../../services/authService';
import { examService } from '../../services/examService';
import { 
  aiQuestionService, 
  getStoredAISettings, 
  setStoredAISettings, 
  testCustomOpenAIConnection,
  getChatbotAISummary,
  syncAISettingsFromChatbot,
  type AIProviderType,
  type ChatbotAISummary
} from '../../services/aiQuestionService';
import { SchoolDirectoryModal } from '../common/SchoolDirectoryModal';
import type { DataRetentionStats } from '../../types/exam';
import type { TeacherSubscription } from '../../types/subscription';

interface SystemSettingsProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    school: string;
    subject: string;
    whatsapp?: string;
    nip?: string;
    npsn?: string;
    avatarUrl?: string;
  };
  subscription?: TeacherSubscription;
  onOpenUpgradeModal?: (title?: string, description?: string) => void;
  onProfileUpdated?: (updated: {
    name: string;
    school: string;
    whatsapp: string;
    nip?: string;
    npsn?: string;
    subject?: string;
    avatarUrl?: string;
  }) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  currentUser,
  subscription,
  onOpenUpgradeModal,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [nip, setNip] = useState(currentUser.nip || '');
  const [whatsapp, setWhatsapp] = useState(currentUser.whatsapp || '');
  const [school, setSchool] = useState(currentUser.school || '');
  const [npsn, setNpsn] = useState(currentUser.npsn || '');
  const [subject, setSubject] = useState(currentUser.subject || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security & Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Data Retention & Storage state
  const [retentionStats, setRetentionStats] = useState<DataRetentionStats | null>(null);
  const [isLoadingRetention, setIsLoadingRetention] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const isPro = Boolean(subscription?.tier === 'pro' || subscription?.tier === 'school' || retentionStats?.isPro);

  // AI Engine & BYOK Integration state
  const [aiActiveProvider, setAiActiveProvider] = useState<AIProviderType>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://api.groq.com/openai/v1');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('llama-3.3-70b-versatile');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [activeAITab, setActiveAITab] = useState<'gemini' | 'custom_openai'>('gemini');

  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [customTestResult, setCustomTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [aiSavedSuccess, setAiSavedSuccess] = useState(false);
  const [chatbotSummary, setChatbotSummary] = useState<ChatbotAISummary>(() => getChatbotAISummary());
  const [useChatbotAI, setUseChatbotAI] = useState<boolean>(true);
  const [isInheritedFromChatbot, setIsInheritedFromChatbot] = useState<boolean>(false);

  useEffect(() => {
    const config = getStoredAISettings();
    setAiActiveProvider(config.activeProvider);
    setActiveAITab(config.activeProvider);
    setGeminiApiKey(config.geminiApiKey);
    setCustomBaseUrl(config.customBaseUrl);
    setCustomApiKey(config.customApiKey);
    setCustomModel(config.customModel);
    setUseChatbotAI(config.useChatbotAI !== false);
    setIsInheritedFromChatbot(Boolean(config.isInheritedFromChatbot));
    setChatbotSummary(getChatbotAISummary());
  }, []);

  useEffect(() => {
    if (currentUser.id) {
      setIsLoadingRetention(true);
      examService.getDataRetentionStats(currentUser.id).then((stats) => {
        setRetentionStats(stats);
      }).finally(() => {
        setIsLoadingRetention(false);
      });
    }
  }, [currentUser.id]);

  const handleManualCleanup = async () => {
    if (!currentUser.id || isCleaning) return;
    const confirmClean = window.confirm(
      'Apakah Anda yakin ingin memeriksa dan membersihkan riwayat sesi lama (>30 hari) serta rekap nilai (>90 hari)? Data yang dihapus tidak dapat dipulihkan kembali. Pastikan Anda telah mengunduh rekap nilai (.csv) jika masih diperlukan.'
    );
    if (!confirmClean) return;

    setIsCleaning(true);
    setCleanupMessage(null);
    try {
      const res = await examService.cleanupExpiredData(currentUser.id);
      setCleanupMessage(res.message);
      const updated = await examService.getDataRetentionStats(currentUser.id);
      setRetentionStats(updated);
    } catch (err: any) {
      setCleanupMessage(`Gagal membersihkan data: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  // Compress image to lightweight base64
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Gagal memproses gambar foto.'));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format file tidak didukung. Harap gunakan format gambar (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file foto maksimal 5 MB.');
      return;
    }

    try {
      const base64 = await compressImage(file);
      setAvatarUrl(base64);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah foto.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Sync state when currentUser prop changes
  useEffect(() => {
    setName(currentUser.name || '');
    setNip(currentUser.nip || '');
    setWhatsapp(currentUser.whatsapp || '');
    setSchool(currentUser.school || '');
    setNpsn(currentUser.npsn || '');
    setSubject(currentUser.subject || '');
    setAvatarUrl(currentUser.avatarUrl || '');
  }, [currentUser]);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
      return;
    }

    setIsSavingPassword(true);
    const res = await authService.updatePassword(newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } else {
      setPasswordError(res.error || 'Gagal menyimpan kata sandi.');
    }
  };

  const handleTestGemini = async () => {
    const cleanKey = geminiApiKey.trim();
    if (!cleanKey) {
      setGeminiTestResult({ success: false, message: 'Harap masukkan API Key Google Gemini terlebih dahulu.' });
      return;
    }
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await aiQuestionService.testApiKey(cleanKey);
      if (res.valid) {
        setGeminiTestResult({
          success: true,
          message: `Berhasil terhubung ke Google AI Studio! Model aktif: ${res.model || 'Gemini Flash'}.`,
        });
      } else {
        setGeminiTestResult({
          success: false,
          message: res.error || 'Gagal memvalidasi API Key Gemini.',
        });
      }
    } catch (err: any) {
      setGeminiTestResult({
        success: false,
        message: err.message || 'Kesalahan jaringan saat menguji koneksi.',
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestCustom = async () => {
    if (!customBaseUrl.trim()) {
      setCustomTestResult({ success: false, message: 'Harap masukkan Base URL penyedia AI.' });
      return;
    }
    if (!customApiKey.trim()) {
      setCustomTestResult({ success: false, message: 'Harap masukkan API Key / Token penyedia AI.' });
      return;
    }
    setIsTestingCustom(true);
    setCustomTestResult(null);
    try {
      const res = await testCustomOpenAIConnection({
        baseUrl: customBaseUrl,
        apiKey: customApiKey,
        model: customModel,
      });
      if (res.valid) {
        setCustomTestResult({
          success: true,
          message: `Berhasil terhubung ke penyedia AI kustom! Model aktif: ${res.model || customModel}.`,
        });
      } else {
        setCustomTestResult({
          success: false,
          message: res.error || 'Gagal memvalidasi endpoint AI kustom.',
        });
      }
    } catch (err: any) {
      setCustomTestResult({
        success: false,
        message: err.message || 'Kesalahan jaringan atau diblokir CORS.',
      });
    } finally {
      setIsTestingCustom(false);
    }
  };

  const handleSyncWithChatbot = () => {
    const res = syncAISettingsFromChatbot();
    if (res.success && res.settings) {
      setAiActiveProvider(res.settings.activeProvider);
      setActiveAITab(res.settings.activeProvider);
      setGeminiApiKey(res.settings.geminiApiKey);
      setCustomBaseUrl(res.settings.customBaseUrl);
      setCustomApiKey(res.settings.customApiKey);
      setCustomModel(res.settings.customModel);
      setUseChatbotAI(true);
      setIsInheritedFromChatbot(false);
      setChatbotSummary(getChatbotAISummary());
      setAiSavedSuccess(true);
      setTimeout(() => setAiSavedSuccess(false), 3500);
    } else {
      alert(res.message);
    }
  };

  const handleSaveAISettings = () => {
    setStoredAISettings({
      activeProvider: aiActiveProvider,
      geminiApiKey: geminiApiKey.trim(),
      customBaseUrl: customBaseUrl.trim(),
      customApiKey: customApiKey.trim(),
      customModel: customModel.trim(),
      useChatbotAI,
    });
    const refreshed = getStoredAISettings();
    setIsInheritedFromChatbot(Boolean(refreshed.isInheritedFromChatbot));
    setAiSavedSuccess(true);
    setTimeout(() => setAiSavedSuccess(false), 3500);
  };

  const handleClearGeminiKey = () => {
    setGeminiApiKey('');
    setStoredAISettings({ geminiApiKey: '' });
    setGeminiTestResult(null);
  };

  const applyCustomPreset = (preset: 'groq' | 'deepseek' | 'openrouter' | 'openai' | 'ollama' | 'qodeer' | 'vpsmurah') => {
    if (preset === 'qodeer') {
      setCustomBaseUrl('https://organization.api-github.com/v1');
      setCustomModel('gpt-4o');
    } else if (preset === 'vpsmurah') {
      setCustomBaseUrl('https://my.vpsmurah.co.id/api/v1');
      setCustomModel('gpt-4o-mini');
    } else if (preset === 'groq') {
      setCustomBaseUrl('https://api.groq.com/openai/v1');
      setCustomModel('llama-3.3-70b-versatile');
    } else if (preset === 'deepseek') {
      setCustomBaseUrl('https://api.deepseek.com/v1');
      setCustomModel('deepseek-chat');
    } else if (preset === 'openrouter') {
      setCustomBaseUrl('https://openrouter.ai/api/v1');
      setCustomModel('google/gemini-2.0-flash-001');
    } else if (preset === 'openai') {
      setCustomBaseUrl('https://api.openai.com/v1');
      setCustomModel('gpt-4o-mini');
    } else if (preset === 'ollama') {
      setCustomBaseUrl('http://localhost:11434/v1');
      setCustomModel('llama3');
    }
    setCustomTestResult(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    // Save AI configuration in sync
    handleSaveAISettings();

    const updatedProfile = {
      name: name.trim(),
      school: school.trim(),
      whatsapp: whatsapp.trim(),
      nip: nip.trim(),
      npsn: npsn.trim(),
      subject: subject.trim(),
      avatarUrl: avatarUrl.trim(),
    };

    const res = await authService.updateTeacherProfile(updatedProfile);
    await authService.updateAvatarUrl(avatarUrl.trim());

    if (res.success) {
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan profil.');
    }
    setIsSaving(false);
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight">
            Pengaturan Sekolah & Profil Guru
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Konfigurasi identitas penguji dan satuan pendidikan sekolah
          </p>
        </div>
        {saved && (
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-display font-bold border border-emerald-200 flex items-center gap-1.5 animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Profil Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-sans font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}


      {/* Peringatan Lengkapi Biodata jika belum terisi */}
      {(() => {
        const missing: { field: string; label: string }[] = [];
        const isSchoolEmpty = !school || school.trim() === '' || school === 'Satuan Pendidikan' || school === 'SMA Negeri 1 Indonesia' || school === 'Sekolah';
        if (isSchoolEmpty) missing.push({ field: 'school', label: 'Nama Sekolah' });

        const isNipEmpty = !nip || nip.trim() === '' || nip === '-' || nip === '19850412 200902 1 004';
        if (isNipEmpty) missing.push({ field: 'nip', label: 'NIP Guru' });

        const isNpsnEmpty = !npsn || npsn.trim() === '' || npsn === '-' || npsn === '20104829';
        if (isNpsnEmpty) missing.push({ field: 'npsn', label: 'NPSN Sekolah' });

        if (missing.length === 0) return null;
        return (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 animate-in fade-in flex items-start gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-display font-bold text-amber-900 uppercase tracking-wide">
                Data Profil Belum Lengkap — {missing.length} Field Wajib Belum Sesuai
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Field berikut masih kosong atau belum disesuaikan:{' '}
                {missing.map((m, i) => (
                  <span key={m.field}>
                    <strong>{m.label}</strong>{i < missing.length - 1 ? ', ' : '.'}
                  </span>
                ))}
                {' '}Data ini digunakan untuk mengisi <strong>kop surat</strong> dan <strong>SKHU / Rapor PDF</strong> siswa secara otomatis. Harap lengkapi sebelum mencetak laporan.
              </p>
            </div>
          </div>
        );
      })()}



      <form onSubmit={handleSave} className="space-y-4">
        {/* Card 1: Profil Guru Penguji */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                Identitas Guru Penguji
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Data identitas yang tersimpan pada akun guru dan dicetak pada lembar rekapitulasi nilai
              </p>
            </div>
          </div>

          {/* Fitur Foto Profil Guru Penguji */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <div className="relative group flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Guru'}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs border border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-display font-black text-xl flex items-center justify-center shadow-xs ring-2 ring-blue-500/20">
                  {name ? name.replace(/Bpk\.|Ibu|Dr\.|S\.Pd\.|M\.Pd\./g, '').trim().substring(0, 2).toUpperCase() : <User className="w-7 h-7" />}
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-display font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>{avatarUrl ? 'Ganti Foto Profil' : 'Tambah Foto Profil'}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-display font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-tight">
                Format yang didukung: JPG, PNG, atau WEBP. Jika tidak diisi, sistem otomatis menampilkan inisial bawaan.
              </p>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="set-1" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Nama Lengkap & Gelar
              </label>
              <input id="set-1"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rahmat, S.Pd."
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="set-2" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Mata Pelajaran (Mapel)
              </label>
              <div className="relative">
                <input id="set-2"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Matematika Wajib, Biologi, dll."
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="set-3" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                NIP / NUPTK Guru
                {(!nip || nip.trim() === '' || nip === '-' || nip === '19850412 200902 1 004') && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold normal-case tracking-normal">Belum diisi</span>
                )}
              </label>
              <input id="set-3"
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="19850412 200902 1 004"
                className={`w-full h-10 bg-slate-50 border rounded-xl px-3.5 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${!nip || nip.trim() === '' || nip === '-' || nip === '19850412 200902 1 004' ? 'border-amber-300' : 'border-slate-200'}`}
              />
            </div>


            <div>
              <label htmlFor="set-4" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                No. WhatsApp Guru
              </label>
              <div className="relative">
                <input id="set-4"
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Satuan Pendidikan & Mapel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                  Satuan Pendidikan / Sekolah
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Data institusi sekolah penyelenggara asesmen
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSchoolModalOpen(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Sekolah &amp; NPSN Resmi</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="set-5" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                Nama Sekolah
                {(!school || school.trim() === '' || school === 'Satuan Pendidikan' || school === 'SMA Negeri 1 Indonesia' || school === 'Sekolah') && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold normal-case tracking-normal">Belum diisi</span>
                )}
              </label>
              <input id="set-5"
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Contoh: SMA Negeri 1 Indonesia"
                className={`w-full h-10 bg-slate-50 border rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${!school || school.trim() === '' || school === 'Satuan Pendidikan' || school === 'SMA Negeri 1 Indonesia' || school === 'Sekolah' ? 'border-amber-300' : 'border-slate-200'}`}
              />
            </div>

            <div>
              <label htmlFor="set-6" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                NPSN Sekolah
                {(!npsn || npsn.trim() === '' || npsn === '-' || npsn === '20104829') && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold normal-case tracking-normal">Belum diisi</span>
                )}
              </label>
              <input id="set-6"
                type="text"
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="Contoh: 20104829"
                className={`w-full h-10 bg-slate-50 border rounded-xl px-3.5 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${!npsn || npsn.trim() === '' || npsn === '-' || npsn === '20104829' ? 'border-amber-300' : 'border-slate-200'}`}
              />
            </div>

          </div>
        </div>

        {/* Card 3: Keamanan Akun & Kredensial Login (Email & Password) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                  Kredensial & Keamanan Akun
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Username/email akun login dan pengaturan kata sandi untuk akses manual
                </p>
              </div>
            </div>
            {passwordSuccess && (
              <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-display font-bold border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kata Sandi Berhasil Disimpan!</span>
              </div>
            )}
          </div>

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-sans font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Email / Username Information */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-2xs">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Email / Username Login
                </div>
                <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">
                  {currentUser.email || 'Email belum terpasang'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/80 self-start sm:self-center">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>ID Akun Terdaftar</span>
            </div>
          </div>

          {/* Buat / Ubah Password Form */}
          <div className="pt-1">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Buat / Atur Kata Sandi</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Jika Anda mendaftar melalui Akun Google, Anda dapat membuat kata sandi di sini agar akun Anda dapat login menggunakan Email &amp; Kata Sandi manual selain tombol Google.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <label htmlFor="set-7" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input id="set-7"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-10 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="set-8" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Ulangi Kata Sandi
                </label>
                <input id="set-8"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSavePassword}
              disabled={isSavingPassword || !newPassword}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSavingPassword ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Akun'}</span>
            </button>
          </div>
        </div>

        {/* Integrasi Kecerdasan Buatan (AI Engine & BYOK) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <span>Integrasi Kecerdasan Buatan (AI Engine &amp; BYOK)</span>
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Konfigurasi kunci API terpusat untuk generator soal CBT dan koreksi esai otomatis tanpa perlu input berulang
                </p>
              </div>
            </div>

            {/* Active Provider Badge */}
            <div className="flex items-center gap-2">
              {aiActiveProvider === 'gemini' ? (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                  geminiApiKey
                    ? isInheritedFromChatbot
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    geminiApiKey 
                      ? isInheritedFromChatbot ? 'bg-emerald-500' : 'bg-blue-600' 
                      : 'bg-amber-500 animate-pulse'
                  }`} />
                  <span>
                    Google Gemini {geminiApiKey ? (isInheritedFromChatbot ? '(Tersinkron dari Chatbot)' : '(Aktif & Terpasang)') : '(Aktif - Kunci Belum Diisi)'}
                  </span>
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                  customApiKey && customBaseUrl
                    ? isInheritedFromChatbot
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    customApiKey && customBaseUrl 
                      ? isInheritedFromChatbot ? 'bg-emerald-500' : 'bg-purple-600' 
                      : 'bg-amber-500 animate-pulse'
                  }`} />
                  <span>
                    AI Kustom {customApiKey && customBaseUrl ? (isInheritedFromChatbot ? '(Tersinkron dari Chatbot)' : '(Aktif & Terpasang)') : '(Aktif - Token Belum Diisi)'}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* SINKRONISASI DENGAN OTAK CHATBOT SUPER ADMIN */}
          <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-blue-50/80 rounded-xl border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display font-bold text-xs text-slate-900">
                    Sinkronisasi Layanan AI Terpusat (Otak Chatbot)
                  </h4>
                  {chatbotSummary.hasConfig ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Tersedia: {chatbotSummary.providerLabel}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-200 text-slate-700">
                      Kunci Chatbot Kosong
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {chatbotSummary.hasConfig
                    ? `Setelan aktif di Chatbot: ${chatbotSummary.providerLabel} (${chatbotSummary.model}). Anda dapat menarik kunci ini langsung ke pengaturan sekolah ini.`
                    : 'Belum ada kunci API di setelan Chatbot Super Admin. Anda dapat mengisinya di portal Super Admin > Otak Chatbot WA.'}
                </p>
                <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700 cursor-pointer pt-1.5">
                  <input
                    type="checkbox"
                    checked={useChatbotAI}
                    onChange={(e) => {
                      setUseChatbotAI(e.target.checked);
                      setStoredAISettings({ useChatbotAI: e.target.checked });
                      const refreshed = getStoredAISettings();
                      setIsInheritedFromChatbot(Boolean(refreshed.isInheritedFromChatbot));
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Otomatis warisi layanan AI Chatbot jika kunci sekolah ini belum diisi</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {chatbotSummary.hasConfig && (
                <button
                  type="button"
                  onClick={handleSyncWithChatbot}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Salin dan terapkan kunci API dari Chatbot ke setelan sekolah ini"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Tarik Kunci dari Chatbot</span>
                </button>
              )}
            </div>
          </div>

          {/* Selector Tab: Google Studio vs Custom AI Provider */}
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-display font-bold">
            <button
              type="button"
              onClick={() => setActiveAITab('gemini')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeAITab === 'gemini'
                  ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Gemini AI Studio (Gratis)</span>
              {aiActiveProvider === 'gemini' && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full">Mesin Utama</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveAITab('custom_openai')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeAITab === 'custom_openai'
                  ? 'bg-white text-purple-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Penyedia AI Kustom / OpenAI (Groq, DeepSeek, dll.)</span>
              {aiActiveProvider === 'custom_openai' && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full">Mesin Utama</span>
              )}
            </button>
          </div>

          {/* TAB 1: GOOGLE GEMINI AI STUDIO */}
          {activeAITab === 'gemini' && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="gemini-key-input" className="text-xs font-display font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Gemini API Key</span>
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>Dapatkan Kunci Gratis di Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="gemini-key-input"
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => {
                      setGeminiApiKey(e.target.value);
                      setGeminiTestResult(null);
                    }}
                    placeholder="Contoh: AIzaSyD..."
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-10 font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gemini Test Result Alert */}
              {geminiTestResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
                  geminiTestResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {geminiTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{geminiTestResult.message}</span>
                </div>
              )}

              {/* Action buttons for Gemini */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={isTestingGemini || !geminiApiKey.trim()}
                  className="h-9 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingGemini ? 'animate-spin' : ''}`} />
                  <span>{isTestingGemini ? 'Menguji ke Google Studio...' : 'Uji Koneksi Gemini'}</span>
                </button>
                {geminiApiKey && (
                  <button
                    type="button"
                    onClick={handleClearGeminiKey}
                    className="h-9 px-3 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kunci</span>
                  </button>
                )}
              </div>

              {/* Guidance Box */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-blue-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tentang Google AI Studio:</span>
                </p>
                <p className="text-[11.5px] leading-relaxed text-slate-600">
                  Google AI Studio menyediakan kuota gratis untuk pembuatan soal dan analisis nilai esai dengan model Gemini Flash. Cukup buat API Key gratis sekali di Google AI Studio, maka seluruh fitur AI di aplikasi siap digunakan selamanya tanpa biaya server.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM OPENAI-COMPATIBLE PROVIDER */}
          {activeAITab === 'custom_openai' && (
            <div className="space-y-3 pt-1">
              {/* Presets Bar */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Template Cepat Provider Populer:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyCustomPreset('qodeer')}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                  >
                    Qodeer / GitHub API (gpt-4o)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomPreset('vpsmurah')}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                  >
                    VPS Murah (gpt-4o-mini)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomPreset('groq')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    Groq (LLaMA 3.3)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomPreset('deepseek')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    DeepSeek (V3/Chat)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomPreset('openrouter')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    OpenRouter
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomPreset('openai')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    OpenAI (GPT-4o-mini)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomPreset('ollama')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    Ollama (Lokal)
                  </button>
                </div>
              </div>

              {/* Grid 3 Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label htmlFor="custom-base-url" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    Base URL API
                  </label>
                  <input
                    id="custom-base-url"
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => {
                      setCustomBaseUrl(e.target.value);
                      setCustomTestResult(null);
                    }}
                    placeholder="https://api.groq.com/openai/v1"
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Endpoint berakhiran /v1</span>
                </div>

                <div className="md:col-span-1">
                  <label htmlFor="custom-api-key" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    API Key / Token Bearer
                  </label>
                  <div className="relative">
                    <input
                      id="custom-api-key"
                      type={showCustomKey ? 'text' : 'password'}
                      value={customApiKey}
                      onChange={(e) => {
                        setCustomApiKey(e.target.value);
                        setCustomTestResult(null);
                      }}
                      placeholder="gsk_... / sk-..."
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 pr-9 font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomKey(!showCustomKey)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCustomKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Token dari konsol penyedia AI</span>
                </div>

                <div className="md:col-span-1">
                  <label htmlFor="custom-model" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    Nama Model (Model ID)
                  </label>
                  <input
                    id="custom-model"
                    type="text"
                    value={customModel}
                    onChange={(e) => {
                      setCustomModel(e.target.value);
                      setCustomTestResult(null);
                    }}
                    placeholder="llama-3.3-70b-versatile"
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">ID model sesuai dokumentasi</span>
                </div>
              </div>

              {/* Custom Test Result Alert */}
              {customTestResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
                  customTestResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {customTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{customTestResult.message}</span>
                </div>
              )}

              {/* Action button for Custom Provider */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTestCustom}
                  disabled={isTestingCustom || !customBaseUrl.trim() || !customApiKey.trim()}
                  className="h-9 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingCustom ? 'animate-spin' : ''}`} />
                  <span>{isTestingCustom ? 'Menguji Endpoint Kustom...' : 'Uji Koneksi Provider Kustom'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE PROVIDER SWITCH (PILIH MESIN UTAMA) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Pilih Mesin AI Utama untuk CBT &amp; Koreksi Esai:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  aiActiveProvider === 'gemini'
                    ? 'bg-white border-blue-500 shadow-2xs text-blue-900'
                    : 'bg-transparent border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="active_ai_provider"
                  value="gemini"
                  checked={aiActiveProvider === 'gemini'}
                  onChange={() => setAiActiveProvider('gemini')}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold">Google Gemini AI Studio</div>
                  <div className="text-[11px] text-slate-500">Gratis, cepat, dan rekomendasi standar</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  aiActiveProvider === 'custom_openai'
                    ? 'bg-white border-purple-500 shadow-2xs text-purple-900'
                    : 'bg-transparent border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="active_ai_provider"
                  value="custom_openai"
                  checked={aiActiveProvider === 'custom_openai'}
                  onChange={() => setAiActiveProvider('custom_openai')}
                  className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                />
                <div>
                  <div className="text-xs font-bold">Penyedia Kustom (OpenAI-Compatible)</div>
                  <div className="text-[11px] text-slate-500">Groq, DeepSeek, OpenRouter, Mistral, dll.</div>
                </div>
              </label>
            </div>
          </div>

          {/* AI Save feedback alert */}
          {aiSavedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Konfigurasi AI Berhasil Disimpan! Kunci ini langsung aktif di Buat Soal AI dan Koreksi Uraian AI.</span>
            </div>
          )}

          {/* Quick Save AI Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveAISettings}
              className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Konfigurasi AI</span>
            </button>
            <p className="text-[11px] text-slate-500 italic">
              *Tersimpan langsung di peramban Anda. Anda tidak perlu memasukkan kunci lagi di menu lain.
            </p>
          </div>
        </div>

        {/* Manajemen Penyimpanan & Retensi Riwayat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-200 shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <span>Manajemen Penyimpanan &amp; Retensi Riwayat</span>
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Pemantauan kapasitas data riwayat sesi ujian, log pengawasan, dan rekap nilai siswa
                </p>
              </div>
            </div>

            {isPro ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Penyimpanan Permanen (PRO)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Retensi Otomatis (Guru Basic)</span>
              </span>
            )}
          </div>

          {/* Statistik Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Sesi Ujian Siswa
              </span>
              <div className="text-lg font-black text-slate-900 font-display">
                {isLoadingRetention ? '...' : retentionStats?.sessionCount || 0}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isPro ? 'Tersimpan permanen' : 'Batas retensi 30 hari'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Rekap Nilai
              </span>
              <div className="text-lg font-black text-slate-900 font-display">
                {isLoadingRetention ? '...' : retentionStats?.gradeCount || 0}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isPro ? 'Tersimpan permanen' : 'Batas retensi 90 hari'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Jawaban Soal
              </span>
              <div className="text-lg font-black text-slate-900 font-display">
                {isLoadingRetention ? '...' : retentionStats?.answerCount || 0}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Mengikuti siklus sesi
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Log Pengawasan
              </span>
              <div className="text-lg font-black text-slate-900 font-display">
                {isLoadingRetention ? '...' : retentionStats?.violationCount || 0}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isPro ? 'Tersimpan permanen' : 'Batas retensi 14 hari'}
              </span>
            </div>
          </div>

          {/* Policy Information Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>Kebijakan Penyimpanan Data:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11.5px]">
              <li>
                <strong>Akun Guru Basic (Gratis):</strong> Sesi telemetri live disimpan selama <strong>30 hari</strong>, rekap nilai kelulusan disimpan <strong>90 hari</strong>, dan log pengawasan <strong>14 hari</strong>. Setelah melewati masa retensi, data lama dibersihkan secara otomatis.
              </li>
              <li>
                <strong>Fitur Ekspor:</strong> Pastikan Anda telah mengunduh rekap nilai ke format <strong>.CSV</strong> (tersedia gratis di menu Rekap Nilai) sebelum masa simpan berakhir.
              </li>
              <li>
                <strong>Akun Guru PRO &amp; Lisensi Sekolah:</strong> Seluruh riwayat ujian, butir soal, jawaban esai, dan rekap raport Excel (.xlsx) disimpan <strong>permanen tanpa batas waktu</strong>.
              </li>
            </ul>
          </div>

          {cleanupMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{cleanupMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleManualCleanup}
              disabled={isCleaning || isLoadingRetention}
              className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isCleaning ? 'Memeriksa & Membersihkan...' : 'Bersihkan Sesi & Data Kadaluarsa'}</span>
            </button>

            {!isPro && onOpenUpgradeModal && (
              <button
                type="button"
                onClick={() => onOpenUpgradeModal(
                  'Buka Penyimpanan Data Permanen',
                  'Tingkatkan ke Guru PRO untuk menyimpan seluruh riwayat ujian, jawaban uraian, dan rekap nilai siswa secara permanen tanpa batas masa retensi.'
                )}
                className="h-9 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                <span>Upgrade ke PRO (Simpan Permanen)</span>
              </button>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* School Directory Modal */}
      <SchoolDirectoryModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        currentSchoolName={school}
        onSelectSchool={(s) => {
          setSchool(s.schoolName);
          setNpsn(s.npsn);
        }}
      />
    </div>
  );
};

export default SystemSettings;

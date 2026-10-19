import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Key,
  ShieldCheck,
  Send,
  RefreshCw,
  Save,
  Copy,
  Check,
  Phone,
  User,
  Sliders,
  Database,
  ExternalLink,
  Info,
  Clock,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Code2,
  Server,
  Wifi,
  LogOut,
  Play,
  Radio,
  Smartphone,
  Download,
  BookOpen,
  FileText,
  FolderOpen,
} from 'lucide-react';
import {
  botSettingsService,
  DEFAULT_BOT_SYSTEM_PROMPT,
} from '../../services/botSettingsService';
import type {
  WhatsAppBotSettings,
  AITestResult,
  ConnectionTestResult,
  BotAIProvider,
  WahaSessionInfo,
} from '../../services/botSettingsService';

interface WhatsAppBotSettingsTabProps {
  onNotify?: (msg: { success: boolean; message: string }) => void;
}

export const WhatsAppBotSettingsTab: React.FC<WhatsAppBotSettingsTabProps> = ({ onNotify }) => {
  const [settings, setSettings] = useState<WhatsAppBotSettings>(botSettingsService.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Password visibility toggles
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [showCustomKey, setShowCustomKey] = useState(false);

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Connection Check State
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);

  // Live Test State
  const [testQuestion, setTestQuestion] = useState('Berapa biaya lisensi sekolah dan apa saja fitur keamanannya?');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<AITestResult | null>(null);

  // Modal for SQL snippet
  const [showSqlModal, setShowSqlModal] = useState(false);

  // WAHA Session, QR & Pairing Code State
  const [wahaSession, setWahaSession] = useState<WahaSessionInfo | null>(null);
  const [wahaQrUrl, setWahaQrUrl] = useState<string | null>(null);
  const [isLoadingWaha, setIsLoadingWaha] = useState(false);
  const [wahaFeedback, setWahaFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [pairingMethod, setPairingMethod] = useState<'code' | 'qr'>('code');
  const [pairingPhone, setPairingPhone] = useState(settings.adminPhone || '0821-9692-9193');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);

  const fetchWahaStatus = async (showLoading = false) => {
    if (showLoading) setIsLoadingWaha(true);
    try {
      const session = await botSettingsService.getWahaSession('default');
      setWahaSession(session);
      if (session.status === 'SCAN_QR_CODE') {
        const qrRes = await botSettingsService.getWahaQr('default');
        if (qrRes.success && qrRes.qrDataUrl) {
          setWahaQrUrl(qrRes.qrDataUrl);
        }
      } else {
        setWahaQrUrl(null);
      }
    } catch (e: any) {
      console.error('Error fetching WAHA status:', e);
    } finally {
      if (showLoading) setIsLoadingWaha(false);
    }
  };

  useEffect(() => {
    const loaded = botSettingsService.getSettings();
    setSettings(loaded);
    if (loaded.adminPhone) setPairingPhone(loaded.adminPhone);
    fetchWahaStatus(true);
  }, []);

  useEffect(() => {
    if (wahaSession?.status === 'SCAN_QR_CODE' || wahaSession?.status === 'STARTING') {
      const interval = setInterval(() => {
        fetchWahaStatus(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [wahaSession?.status]);

  const handleStartWaha = async () => {
    setIsLoadingWaha(true);
    setWahaFeedback(null);
    const res = await botSettingsService.startWahaSession('default');
    setWahaFeedback(res);
    await fetchWahaStatus(false);
    setIsLoadingWaha(false);
  };

  const handleRestartWaha = async () => {
    setIsLoadingWaha(true);
    setWahaFeedback(null);
    const res = await botSettingsService.restartWahaSession('default');
    setWahaFeedback(res);
    await fetchWahaStatus(false);
    setIsLoadingWaha(false);
  };

  const handleLogoutWaha = async () => {
    if (!window.confirm('Apakah Anda yakin ingin keluar dari akun WhatsApp ini di WAHA? Anda harus memindai ulang QR Code untuk menghubungkan kembali.')) return;
    setIsLoadingWaha(true);
    setWahaFeedback(null);
    const res = await botSettingsService.logoutWahaSession('default');
    setWahaFeedback(res);
    await fetchWahaStatus(false);
    setIsLoadingWaha(false);
  };

  const handleRequestPairingCode = async () => {
    if (!pairingPhone.trim()) {
      alert('Silakan masukkan nomor WhatsApp Anda terlebih dahulu.');
      return;
    }
    setIsRequestingCode(true);
    setWahaFeedback(null);
    try {
      const res = await botSettingsService.requestWahaPairingCode(pairingPhone, 'default');
      if (res.success && res.code) {
        setPairingCode(res.code);
        setWahaFeedback({
          success: true,
          message: `Kode pairing WhatsApp berhasil dibuat: ${res.code}. Masukkan kode ini pada menu Perangkat Tertaut di HP Anda.`,
        });
      } else {
        setWahaFeedback({
          success: false,
          message: res.error || 'Gagal meminta kode pairing. Silakan coba kembali atau gunakan scan QR Code.',
        });
      }
      await fetchWahaStatus(false);
    } catch (e: any) {
      setWahaFeedback({ success: false, message: e.message || 'Terjadi kesalahan saat meminta kode pairing.' });
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadBotSettingsJson = () => {
    const jsonStr = botSettingsService.generateBotSettingsJson(settings);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bot-settings.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const res = await botSettingsService.saveSettings(settings);
      setSaveFeedback({ 
        success: res.success, 
        message: 'Pengaturan Otak Bot AI berhasil disimpan di browser! Untuk mengaktifkannya di bot WhatsApp VPS, klik tombol "Unduh Berkas bot-settings.json" di panel kanan lalu upload ke WinSCP (/var/www/vps-bot/).' 
      });
      if (onNotify) {
        onNotify({ success: res.success, message: res.message });
      }
    } catch (err: any) {
      setSaveFeedback({ success: false, message: `Gagal menyimpan: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const applyCustomPreset = (preset: 'qodeer' | 'vpsmurah' | 'groq' | 'deepseek' | 'openrouter' | 'openai' | 'ollama') => {
    if (preset === 'qodeer') {
      setSettings(prev => ({
        ...prev,
        activeProvider: 'custom_openai',
        customBaseUrl: 'https://organization.api-github.com/v1',
        customModel: 'gpt-4o',
      }));
    } else if (preset === 'vpsmurah') {
      setSettings(prev => ({
        ...prev,
        activeProvider: 'custom_openai',
        customBaseUrl: 'https://my.vpsmurah.co.id/api/v1',
        customModel: 'gpt-4o-mini',
      }));
    } else if (preset === 'openrouter') {
      setSettings(prev => ({
        ...prev,
        activeProvider: 'custom_openai',
        customBaseUrl: 'https://openrouter.ai/api/v1',
        customModel: 'google/gemini-2.0-flash-001',
      }));
    } else if (preset === 'groq') {
      setSettings(prev => ({
        ...prev,
        activeProvider: 'custom_openai',
        customBaseUrl: 'https://api.groq.com/openai/v1',
        customModel: 'llama-3.3-70b-versatile',
      }));
    } else if (preset === 'deepseek') {
      setSettings(prev => ({
        ...prev,
        activeProvider: 'custom_openai',
        customBaseUrl: 'https://api.deepseek.com/v1',
        customModel: 'deepseek-chat',
      }));
    } else if (preset === 'openai') {
      setSettings(prev => ({
        ...prev,
        activeProvider: 'custom_openai',
        customBaseUrl: 'https://api.openai.com/v1',
        customModel: 'gpt-4o-mini',
      }));
    } else if (preset === 'ollama') {
      setSettings(prev => ({
        ...prev,
        activeProvider: 'custom_openai',
        customBaseUrl: 'http://localhost:11434/v1',
        customModel: 'llama3',
      }));
    }
  };

  const handlePullCustomFromSchool = () => {
    try {
      const raw = localStorage.getItem('ujianpintar_ai_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.customBaseUrl || parsed.customApiKey) {
          setSettings(prev => ({
            ...prev,
            activeProvider: 'custom_openai',
            customBaseUrl: parsed.customBaseUrl || prev.customBaseUrl,
            customApiKey: parsed.customApiKey || prev.customApiKey,
            customModel: parsed.customModel || prev.customModel,
          }));
          return;
        }
      }
      alert('Belum ada setelan AI kustom tersimpan di Pengaturan Sekolah.');
    } catch {
      alert('Gagal membaca setelan dari Pengaturan Sekolah.');
    }
  };

  const handleResetPrompt = () => {
    if (window.confirm('Kembalikan instruksi & knowledge base otak bot ke draf resmi bawaan UjianPintar?')) {
      setSettings(prev => ({
        ...prev,
        systemPrompt: DEFAULT_BOT_SYSTEM_PROMPT,
      }));
    }
  };

  const handleRunAITest = async () => {
    if (!testQuestion.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await botSettingsService.testBotAIResponse(settings, testQuestion);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        answer: `Error: ${err.message}`,
        latencyMs: 0,
        provider: settings.activeProvider,
        model: '-',
        error: err.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCheckConnection = async (providerOverride?: BotAIProvider) => {
    setIsCheckingConnection(true);
    setConnectionResult(null);
    try {
      const result = await botSettingsService.testProviderConnection(settings, providerOverride);
      setConnectionResult(result);
      if (result.valid && result.model && (providerOverride || settings.activeProvider) === 'gemini') {
        setSettings(prev => ({ ...prev, geminiModel: result.model }));
      }
    } catch (err: any) {
      setConnectionResult({
        valid: false,
        provider: providerOverride || settings.activeProvider,
        model: '-',
        latencyMs: 0,
        message: `Koneksi gagal: ${err.message}`,
        error: err.message,
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP STATUS & QUICK ACTIONS BANNER */}
      <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-bold text-xl text-slate-900 tracking-tight">
                Pusat Otak & Setelan Chatbot WhatsApp AI
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                settings.isAutoReplyEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}>
                {settings.isAutoReplyEnabled ? '● AUTO-REPLY AKTIF' : '○ BOT NONAKTIF'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Kelola kecerdasan buatan, basis pengetahuan resmi, kontak hotline, dan parameter auto-responder WhatsApp UjianPintar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Auto Reply Switch */}
          <button
            type="button"
            onClick={() => {
              setSettings(prev => ({ ...prev, isAutoReplyEnabled: !prev.isAutoReplyEnabled }));
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
              settings.isAutoReplyEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{settings.isAutoReplyEnabled ? 'Auto-Reply: Aktif' : 'Auto-Reply: Dimatikan'}</span>
          </button>

          {/* Unduh JSON untuk VPS */}
          <button
            type="button"
            onClick={handleDownloadBotSettingsJson}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Unduh file bot-settings.json untuk disalin ke folder /var/www/vps-bot/ di VPS"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Unduh bot-settings.json</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Save Feedback Banner */}
      {saveFeedback && (
        <div
          className={`p-3.5 rounded-lg border-2 text-xs flex items-center gap-2.5 animate-in fade-in leading-relaxed ${
            saveFeedback.success
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {saveFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <div className="flex-1 font-semibold">{saveFeedback.message}</div>
          <button
            type="button"
            onClick={() => setSaveFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* WAHA Action Feedback Banner */}
      {wahaFeedback && (
        <div
          className={`p-3.5 rounded-lg border-2 text-xs flex items-center gap-2.5 animate-in fade-in leading-relaxed ${
            wahaFeedback.success
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {wahaFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <div className="flex-1 font-semibold">{wahaFeedback.message}</div>
          <button
            type="button"
            onClick={() => setWahaFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* WAHA GATEWAY STATUS & LIVE QR CODE SECTION */}
      <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              wahaSession?.status === 'WORKING'
                ? 'bg-emerald-100 text-emerald-600'
                : wahaSession?.status === 'SCAN_QR_CODE'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-slate-100 text-slate-600'
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-extrabold text-sm text-slate-900">
                  Status Server WhatsApp Gateway (WAHA)
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono border ${
                  wahaSession?.status === 'WORKING'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : wahaSession?.status === 'SCAN_QR_CODE'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                    : wahaSession?.status === 'STARTING'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse'
                    : 'bg-rose-50 text-rose-700 border-rose-300'
                }`}>
                  {wahaSession?.status === 'WORKING' && '● TERHUBUNG (WORKING)'}
                  {wahaSession?.status === 'SCAN_QR_CODE' && '● MENUNGGU SCAN QR'}
                  {wahaSession?.status === 'STARTING' && '● MEMULAI SESI...'}
                  {wahaSession?.status === 'STOPPED' && '○ SESI BERHENTI'}
                  {(!wahaSession || wahaSession?.status === 'UNKNOWN') && '○ MEMERIKSA STATUS...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Endpoint: <span className="text-indigo-600">{settings.wahaBaseUrl || 'https://api.ujianpintar.online/waha'}</span> • Sesi: <span className="font-bold text-slate-700">default</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchWahaStatus(true)}
              disabled={isLoadingWaha}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWaha ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Periksa Status</span>
            </button>
          </div>
        </div>

        {/* STATUS: WORKING (Connected & Active) */}
        {wahaSession?.status === 'WORKING' && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <span>WhatsApp Pengirim Aktif:</span>
                  <span className="font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-bold">
                    +{wahaSession.me?.id ? wahaSession.me.id.replace('@c.us', '') : settings.adminPhone}
                  </span>
                  {wahaSession.me?.pushName && (
                    <span className="text-[11px] text-slate-500 font-sans font-normal">({wahaSession.me.pushName})</span>
                  )}
                </div>
                <p className="text-[11.5px] text-emerald-800 mt-1 leading-relaxed">
                  ✓ Server WhatsApp Gateway terhubung. Sistem siap mengirim token OTP verifikasi akun dan membalas pesan pengunjung otomatis via AI.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleRestartWaha}
                disabled={isLoadingWaha}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
              >
                Restart Sesi
              </button>
              <button
                type="button"
                onClick={handleLogoutWaha}
                disabled={isLoadingWaha}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Ganti Nomor)</span>
              </button>
            </div>
          </div>
        )}

        {/* STATUS: SCAN_QR_CODE or STARTING */}
        {(wahaSession?.status === 'SCAN_QR_CODE' || wahaSession?.status === 'STARTING') && (
          <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/60 via-white to-indigo-50/30 border-2 border-amber-300 rounded-2xl space-y-4">
            {/* Method Switcher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
              <div>
                <h5 className="font-display font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>Tautkan Nomor WhatsApp Pengirim</span>
                  <span className="text-[10px] font-mono uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    Pilih Cara
                  </span>
                </h5>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan <strong>Kode Pairing 8-Karakter</strong> (lebih cepat & tanpa kamera) atau <strong>Scan QR Code</strong> biasa.
                </p>
              </div>

              <div className="flex bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPairingMethod('code')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pairingMethod === 'code'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔑 Kode Pairing (Rekomendasi)
                </button>
                <button
                  type="button"
                  onClick={() => setPairingMethod('qr')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pairingMethod === 'qr'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📷 Scan QR Code
                </button>
              </div>
            </div>

            {/* TAB 1: PAIRING CODE (Tautkan dengan nomor telepon) */}
            {pairingMethod === 'code' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Nomor WhatsApp yang Ingin Digunakan sebagai Pengirim:</span>
                      </label>
                      <input
                        type="text"
                        value={pairingPhone}
                        onChange={(e) => setPairingPhone(e.target.value)}
                        placeholder="Contoh: 082196929193"
                        className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono font-bold text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestPairingCode}
                      disabled={isRequestingCode}
                      className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 flex-shrink-0 shadow-xs"
                    >
                      {isRequestingCode ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menghubungkan ke WAHA...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Dapatkan Kode Pairing (8 Karakter)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {pairingCode && (
                    <div className="p-4 bg-indigo-50/90 border-2 border-indigo-300 rounded-xl space-y-2 animate-in zoom-in-95">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Kode Tautan WhatsApp Anda:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(pairingCode, 'pairing-code')}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-indigo-200 shadow-2xs"
                        >
                          {copiedKey === 'pairing-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'pairing-code' ? 'Tersalin!' : 'Salin Kode'}</span>
                        </button>
                      </div>

                      <div className="py-2.5 text-center bg-white border-2 border-indigo-300 rounded-xl shadow-2xs">
                        <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-indigo-700 select-all">
                          {pairingCode}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-indigo-900 leading-relaxed">
                        👉 Di WhatsApp HP Anda: Buka <strong>Perangkat Tertaut</strong> &gt; ketuk <strong>Tautkan Perangkat</strong> &gt; pilih tulisan kecil <strong>"Tautkan dengan nomor telepon saja" (Link with phone number instead)</strong> di bagian bawah &gt; masukkan 8 kode di atas.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Buka WhatsApp di HP Anda &gt; <strong>Perangkat Tertaut</strong>.</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Ketuk <strong>Tautkan Perangkat</strong>, lalu ketuk tulisan <strong>"Tautkan dengan nomor telepon saja"</strong> di bagian bawah layar HP.</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Masukkan kode 8 digit di atas. Sistem otomatis terhubung!</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QR CODE */}
            {pairingMethod === 'qr' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center animate-in fade-in">
                {/* Left Column: QR Code Image Display */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  {wahaQrUrl ? (
                    <div className="relative group text-center">
                      <img
                        src={wahaQrUrl}
                        alt="WAHA WhatsApp QR Code"
                        className="w-56 h-56 rounded-lg object-contain mx-auto"
                      />
                      <div className="mt-2 text-center">
                        <span className="text-[11px] font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Scan QR Code Sekarang
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-300 rounded-lg">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                      <span className="text-xs font-medium">Memuat QR Code...</span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => fetchWahaStatus(true)}
                      disabled={isLoadingWaha}
                      className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWaha ? 'animate-spin' : ''}`} />
                      <span>Perbarui QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRestartWaha}
                      disabled={isLoadingWaha}
                      className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-300"
                    >
                      Mulai Ulang Sesi
                    </button>
                  </div>
                </div>

                {/* Right Column: Step by Step Guide */}
                <div className="md:col-span-7 space-y-3.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                    <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Langkah Scan QR Code</span>
                  </div>

                  <h5 className="font-display font-extrabold text-base text-slate-900 leading-snug">
                    Pindai QR Code untuk Menghubungkan WhatsApp Pengirim
                  </h5>

                  <ol className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Buka aplikasi <strong>WhatsApp</strong> di smartphone Anda.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Ketuk <strong>Menu Titik Tiga (⋮)</strong> di kanan atas (Android) atau menu <strong>Pengaturan / Settings</strong> (iPhone).</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Pilih menu <strong>Perangkat Tertaut (Linked Devices)</strong>, lalu ketuk tombol <strong>Tautkan Perangkat (Link a Device)</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        4
                      </span>
                      <span>Arahkan kamera smartphone Anda ke <strong>QR Code</strong> di samping ini.</span>
                    </li>
                  </ol>

                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
                    <span>Sistem secara otomatis mendeteksi saat Anda berhasil memindai QR code dan status akan langsung berubah menjadi <strong>Terhubung (WORKING)</strong>.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATUS: FAILED (Recovery Mode) */}
        {wahaSession?.status === 'FAILED' && (
          <div className="p-4 sm:p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-rose-950">
                  Status Sesi: FAILED (Login Perangkat Sebelumnya Gagal / QR Code Kedaluwarsa)
                </div>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  Sesi WhatsApp di server mengalami kegagalan saat proses pairing atau QR code kedaluwarsa. Klik tombol di samping untuk memulihkan sesi dan mengaktifkan QR Code / Kode Pairing baru secara bersih.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRestartWaha}
              disabled={isLoadingWaha}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-60 shadow-xs"
            >
              <RotateCcw className={`w-4 h-4 ${isLoadingWaha ? 'animate-spin' : ''}`} />
              <span>{isLoadingWaha ? 'Memulihkan Sesi...' : 'Pulihkan & Muat Ulang Sesi Sekarang'}</span>
            </button>
          </div>
        )}

        {/* STATUS: STOPPED or OTHER */}
        {wahaSession && wahaSession.status !== 'WORKING' && wahaSession.status !== 'SCAN_QR_CODE' && wahaSession.status !== 'STARTING' && wahaSession.status !== 'FAILED' && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Sesi WhatsApp Belum Berjalan (Status: {wahaSession.status})
                </div>
                <p className="text-[11.5px] text-slate-600 mt-0.5">
                  {wahaSession.error || 'Sesi WhatsApp gateway belum aktif di server. Klik tombol di samping untuk menjalankan sesi dan memunculkan QR Code / Kode Pairing.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartWaha}
              disabled={isLoadingWaha}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-60 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Jalankan Sesi WhatsApp (Start)</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN GRID: LEFT (CONFIG) & RIGHT (LIVE SIMULATOR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PROVIDER, KEYS, KNOWLEDGE BASE, CONTACTS (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION A: PEMILIHAN ENGINE PROVIDER AI */}
          <div className="bg-white p-5 rounded-xl border-2 border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Penyedia Layanan AI (Otak Utama Bot)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Pilih mesin pemikir bot
              </span>
            </div>

            {/* Provider Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              
              {/* 1. Google Gemini */}
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                settings.activeProvider === 'gemini'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="activeProvider"
                  value="gemini"
                  checked={settings.activeProvider === 'gemini'}
                  onChange={() => setSettings(prev => ({ ...prev, activeProvider: 'gemini' }))}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>Google Gemini AI</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono">Google AI</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gemini 2.0 / 1.5 Flash. Sangat cerdas, konteks panjang, resmi dari Google AI Studio.
                  </p>
                </div>
              </label>

              {/* 2. Groq Cloud */}
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                settings.activeProvider === 'groq'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="activeProvider"
                  value="groq"
                  checked={settings.activeProvider === 'groq'}
                  onChange={() => setSettings(prev => ({ ...prev, activeProvider: 'groq' }))}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>Groq (Llama 3.3 70B)</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-mono">Super Cepat</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kecepatan inferensi tinggi (~300ms). Jawaban langsung muncul instan di WhatsApp.
                  </p>
                </div>
              </label>

              {/* 3. DeepSeek */}
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                settings.activeProvider === 'deepseek'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="activeProvider"
                  value="deepseek"
                  checked={settings.activeProvider === 'deepseek'}
                  onChange={() => setSettings(prev => ({ ...prev, activeProvider: 'deepseek' }))}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900">DeepSeek AI</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Model DeepSeek Chat v3. Penalaran mantap dengan biaya API sangat hemat.
                  </p>
                </div>
              </label>

              {/* 4. Custom AI (Base URL & Key) */}
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                settings.activeProvider === 'custom_openai'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="activeProvider"
                  value="custom_openai"
                  checked={settings.activeProvider === 'custom_openai'}
                  onChange={() => setSettings(prev => ({ ...prev, activeProvider: 'custom_openai' }))}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>AI Kustom (Base URL & Key)</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-mono">Fleksibel</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gunakan penyedia apa pun (Qodeer, VPSMurah, OpenRouter, OpenAI, Ollama, dll.) dengan Base URL & Key.
                  </p>
                </div>
              </label>

              {/* 5. Fallback Local KB */}
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                settings.activeProvider === 'fallback_local'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="activeProvider"
                  value="fallback_local"
                  checked={settings.activeProvider === 'fallback_local'}
                  onChange={() => setSettings(prev => ({ ...prev, activeProvider: 'fallback_local' }))}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>Fallback KB (Offline)</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono">100% Gratis</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pencocokan kata kunci cepat tanpa perlu koneksi atau kunci API AI eksternal.
                  </p>
                </div>
              </label>
            </div>

            {/* API KEY INPUT ACCORDING TO SELECTED PROVIDER */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              {settings.activeProvider === 'gemini' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Google Gemini API Key</span>
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Dapatkan Key AI Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={settings.geminiApiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                      placeholder="AIzaSy..."
                      className="w-full h-10 pl-3 pr-10 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-lg text-xs font-mono text-slate-900 transition-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span>Pilih Model Gemini:</span>
                      <select
                        value={settings.geminiModel || 'gemini-2.0-flash'}
                        onChange={(e) => setSettings(prev => ({ ...prev, geminiModel: e.target.value }))}
                        className="h-7 px-2 bg-white border border-slate-300 rounded text-xs font-mono text-indigo-700 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Rekomendasi Cepat & Cerdas)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Generasi Terbaru)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Ringan & Cepat)</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash (Stabil)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro (Penalaran Mendalam)</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const key = localStorage.getItem('ujianpintar_gemini_api_key');
                        if (key) {
                          setSettings(prev => ({ ...prev, geminiApiKey: key }));
                        }
                      }}
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      Pakai Key dari Akun Guru
                    </button>
                  </div>
                </div>
              )}

              {settings.activeProvider === 'groq' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Groq Cloud API Key</span>
                    </label>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Dapatkan Key Groq</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showGroqKey ? 'text' : 'password'}
                      value={settings.groqApiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, groqApiKey: e.target.value }))}
                      placeholder="gsk_..."
                      className="w-full h-10 pl-3 pr-10 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-lg text-xs font-mono text-slate-900 transition-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <span>Pilih Model Groq:</span>
                    <select
                      value={settings.groqModel || 'llama-3.3-70b-versatile'}
                      onChange={(e) => setSettings(prev => ({ ...prev, groqModel: e.target.value }))}
                      className="h-7 px-2 bg-white border border-slate-300 rounded text-xs font-mono text-amber-700 font-bold focus:outline-none focus:border-amber-600 cursor-pointer"
                    >
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Rekomendasi 70B Cerdas)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Super Cepat ~200ms)</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>
                </div>
              )}

              {settings.activeProvider === 'deepseek' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      <span>DeepSeek API Key</span>
                    </label>
                    <a
                      href="https://platform.deepseek.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Platform DeepSeek</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showDeepseekKey ? 'text' : 'password'}
                      value={settings.deepseekApiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, deepseekApiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="w-full h-10 pl-3 pr-10 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-lg text-xs font-mono text-slate-900 transition-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <span>Pilih Model DeepSeek:</span>
                    <select
                      value={settings.deepseekModel || 'deepseek-chat'}
                      onChange={(e) => setSettings(prev => ({ ...prev, deepseekModel: e.target.value }))}
                      className="h-7 px-2 bg-white border border-slate-300 rounded text-xs font-mono text-blue-700 font-bold focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="deepseek-chat">deepseek-chat (DeepSeek-V3 Cepat & Cerdas)</option>
                      <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1 Penalaran)</option>
                    </select>
                  </div>
                </div>
              )}

              {settings.activeProvider === 'custom_openai' && (
                <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                    <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Konfigurasi AI Kustom (OpenAI-Compatible)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handlePullCustomFromSchool}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Database className="w-3 h-3" />
                      <span>Tarik dari Pengaturan Sekolah</span>
                    </button>
                  </div>

                  {/* Preset Pills */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                      Preset Cepat (Klik untuk isi Base URL & Model otomatis):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'qodeer', label: 'Qodeer (GitHub gpt-4o)', color: 'bg-slate-800 text-white hover:bg-slate-700' },
                        { id: 'vpsmurah', label: 'VPSMurah (gpt-4o-mini)', color: 'bg-emerald-700 text-white hover:bg-emerald-600' },
                        { id: 'openrouter', label: 'OpenRouter (Gemini 2.0)', color: 'bg-violet-700 text-white hover:bg-violet-600' },
                        { id: 'groq', label: 'Groq Cloud (Llama 3.3)', color: 'bg-amber-600 text-white hover:bg-amber-500' },
                        { id: 'openai', label: 'OpenAI Resmi (gpt-4o-mini)', color: 'bg-teal-700 text-white hover:bg-teal-600' },
                        { id: 'deepseek', label: 'DeepSeek Platform', color: 'bg-blue-700 text-white hover:bg-blue-600' },
                        { id: 'ollama', label: 'Ollama (Localhost)', color: 'bg-slate-600 text-white hover:bg-slate-500' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => applyCustomPreset(item.id as any)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono transition-transform active:scale-95 cursor-pointer shadow-xs ${item.color}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Base URL */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Base URL Endpoint:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Harus mendukung endpoint /chat/completions</span>
                    </label>
                    <input
                      type="text"
                      value={settings.customBaseUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, customBaseUrl: e.target.value }))}
                      placeholder="Contoh: https://organization.api-github.com/v1 atau https://openrouter.ai/api/v1"
                      className="w-full h-9 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs font-mono text-slate-900"
                    />
                  </div>

                  {/* API Key */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      API Key / Bearer Token:
                    </label>
                    <div className="relative">
                      <input
                        type={showCustomKey ? 'text' : 'password'}
                        value={settings.customApiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, customApiKey: e.target.value }))}
                        placeholder="sk-... atau token dari penyedia AI Anda"
                        className="w-full h-9 pl-3 pr-10 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs font-mono text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomKey(!showCustomKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCustomKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Model Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Model ID:
                    </label>
                    <input
                      type="text"
                      value={settings.customModel}
                      onChange={(e) => setSettings(prev => ({ ...prev, customModel: e.target.value }))}
                      placeholder="gpt-4o, gpt-4o-mini, llama-3.3-70b-versatile, deepseek-chat, dll."
                      className="w-full h-9 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              )}

              {settings.activeProvider === 'fallback_local' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mode Fallback Siap Digunakan Tanpa Biaya.</span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Sistem akan menjawab pertanyaan seputar harga lisensi, fitur anti-curang, impor soal Word, dan kontak admin secara instan dengan mesin pencocok kata kunci lokal.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Cek Koneksi & Verifikasi Model */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCheckConnection()}
                    disabled={isCheckingConnection}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <Wifi className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-pulse text-amber-300' : 'text-emerald-400'}`} />
                    <span>{isCheckingConnection ? 'Sedang Memeriksa Sambungan...' : 'Cek Koneksi API & Validasi Model'}</span>
                  </button>

                  <span className="text-[11px] text-slate-500 font-sans">
                    Uji kuota, latensi, dan model aktif sebelum bot menjawab pengguna.
                  </span>
                </div>

                {connectionResult && (
                  <div className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 animate-in fade-in duration-150 ${
                    connectionResult.valid 
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                      : 'bg-rose-50/80 border-rose-300 text-rose-950'
                  }`}>
                    {connectionResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>
                          {connectionResult.valid ? '✓ Sambungan Berhasil Terhubung!' : '✗ Sambungan Gagal'}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                          {connectionResult.latencyMs}ms
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {connectionResult.message}
                      </p>
                      {connectionResult.model && connectionResult.model !== '-' && (
                        <div className="text-[11px] font-mono mt-1 pt-1 border-t border-slate-200/60">
                          Model Aktif: <span className="font-bold text-indigo-700">{connectionResult.model}</span>
                        </div>
                      )}
                      {connectionResult.availableModels && connectionResult.availableModels.length > 0 && (
                        <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                          Model lain yang didukung API Key: {connectionResult.availableModels.slice(0, 5).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION B: KNOWLEDGE BASE & SYSTEM PROMPT EDITOR */}
          <div className="bg-white p-5 rounded-xl border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Otak & Knowledge Base (System Prompt)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetPrompt}
                  className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold cursor-pointer"
                  title="Reset ke template resmi UjianPintar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Bawaan</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                <span>Instruksi resmi yang dibaca oleh AI sebelum membalas pesan WhatsApp pengunjung:</span>
                <span className="font-mono">{settings.systemPrompt.length} karakter</span>
              </div>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                rows={12}
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-lg text-xs font-mono text-slate-800 leading-relaxed transition-none"
                placeholder="Tuliskan pengetahuan resmi platform..."
              />
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                <span className="font-bold">Variabel dinamis:</span>
                <code className="px-1.5 py-0.5 bg-slate-100 text-indigo-700 rounded border border-slate-200 font-mono">
                  {'{ADMIN_NAME}'}
                </code>
                <code className="px-1.5 py-0.5 bg-slate-100 text-indigo-700 rounded border border-slate-200 font-mono">
                  {'{ADMIN_PHONE}'}
                </code>
                <span>(Akan otomatis diganti sesuai kontak hotline di bawah).</span>
              </div>
            </div>
          </div>

          {/* SECTION B.2: BASIS PENGETAHUAN FISIK (KNOWLEDGE BASE DOKUMEN / OPSI 3) */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 p-5 rounded-xl border-2 border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Basis Pengetahuan Fisik (Knowledge Base - Opsi 3)
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Hot-Reload Aktif
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bot WhatsApp di VPS membaca berkas dokumen resmi platform secara langsung dari folder VPS untuk menjawab pertanyaan guru & siswa dengan akurasi 100% tanpa halusinasi.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-lg border border-indigo-100 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dokumen Utama Terpasang:</span>
                </div>
                <div className="font-mono text-[11px] text-indigo-900 font-semibold bg-indigo-50/70 px-2 py-1 rounded border border-indigo-100 flex items-center justify-between">
                  <span>PANDUAN_LENGKAP_UJIAN_PINTAR.md</span>
                  <span className="text-[10px] text-slate-500 font-normal">~52 KB (87 Bab)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Mencakup: Teori CBT, fitur anti-cheat, scoring engine, tata cara ujian siswa & pengawas, dan paket harga.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-indigo-100 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Lokasi Folder di Server VPS:</span>
                </div>
                <div className="font-mono text-[11px] text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                  /var/www/vps-bot/knowledge/
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Anda bisa drag & drop file <code className="font-mono text-[10px] bg-slate-100 px-1 rounded">.md</code> atau <code className="font-mono text-[10px] bg-slate-100 px-1 rounded">.txt</code> baru lewat WinSCP ke folder ini kapan saja.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION C: KONTAK HOTLINE, HUMAN HANDOVER & KEAMANAN */}
          <div className="bg-white p-5 rounded-xl border-2 border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Kontak Hotline & Human Handover (Jeda Manual)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Nama Admin Hotline</span>
                </label>
                <input
                  type="text"
                  value={settings.adminName}
                  onChange={(e) => setSettings(prev => ({ ...prev, adminName: e.target.value }))}
                  placeholder="Deni Indrayana"
                  className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Nomor WhatsApp Hotline</span>
                </label>
                <input
                  type="text"
                  value={settings.adminPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, adminPhone: e.target.value }))}
                  placeholder="0821-9692-9193"
                  className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs font-mono text-slate-900 transition-none font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Jeda Human Handover (Menit)</span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={settings.humanHandoverMinutes}
                  onChange={(e) => setSettings(prev => ({ ...prev, humanHandoverMinutes: parseInt(e.target.value, 10) || 30 }))}
                  className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs font-mono text-slate-900 transition-none"
                />
                <span className="text-[10px] text-slate-500">
                  Saat Anda membalas manual dari HP Anda, bot otomatis diam selama durasi ini untuk kontak tersebut.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Jeda Anti-Spam (Detik)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.cooldownSeconds}
                  onChange={(e) => setSettings(prev => ({ ...prev, cooldownSeconds: parseInt(e.target.value, 10) || 3 }))}
                  className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs font-mono text-slate-900 transition-none"
                />
                <span className="text-[10px] text-slate-500">
                  Mencegah spam pesan beruntun dari nomor yang sama.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CHATBOT SIMULATOR & VPS TOOLS (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SIMULATOR CHATBOT (LIVE TEST BOX) */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border-2 border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="font-display font-bold text-sm text-white">
                  Simulator Respons Bot WhatsApp
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Live Test
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Uji langsung bagaimana AI menjawab pertanyaan pengunjung dengan setelan dan knowledge base saat ini:
            </p>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Berapa harga lisensi sekolah?',
                'Bagaimana kunci layar anti-curang bekerja?',
                'Cara impor bank soal dari Word?',
                'Bisa minta nomor rekening pembayaran?',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTestQuestion(chip)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] font-sans transition-colors cursor-pointer border border-slate-700 text-left"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Pertanyaan */}
            <div className="space-y-2">
              <textarea
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                rows={3}
                placeholder="Ketik pertanyaan untuk menguji respons AI..."
                className="w-full p-3 bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg text-xs text-slate-100 placeholder:text-slate-500 font-sans"
              />

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCheckConnection()}
                  disabled={isCheckingConnection}
                  title="Cek ketersediaan kuota, responsivitas API, dan deteksi model"
                  className="w-full sm:w-auto px-4 h-10 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
                >
                  <Wifi className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-pulse text-amber-400' : 'text-emerald-400'}`} />
                  <span>{isCheckingConnection ? 'Memeriksa...' : 'Cek Koneksi'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunAITest}
                  disabled={isTesting || !testQuestion.trim()}
                  className="flex-1 w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AI sedang berpikir & menyusun balasan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Uji Jawaban AI Bot</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Hasil Jawaban Preview (Mirip Bubble Chat WhatsApp) */}
            {testResult && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓ Respon:</span>
                    <span>{testResult.provider}</span>
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                    {testResult.latencyMs}ms
                  </span>
                </div>

                <div className={`p-4 rounded-xl text-xs leading-relaxed font-sans ${
                  testResult.success 
                    ? 'bg-slate-800 text-slate-100 border border-slate-700' 
                    : 'bg-rose-950/70 text-rose-200 border border-rose-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-700/50 text-[11px] font-bold text-emerald-400">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Pratinjau Pesan yang Diterima Pengguna WhatsApp:</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-slate-200">
                    {testResult.answer}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* VPS SYNC & EXPORT TOOLS */}
          <div className="bg-white p-5 rounded-xl border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Sinkronisasi Layanan Bot VPS
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bot WhatsApp berjalan di VPS via file skrip <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-700">vps-bot/whatsapp-ai-bot.js</code> yang terhubung ke WAHA.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(botSettingsService.generateEnvSnippet(settings), 'env')}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-between px-3 border border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Salin Format .env untuk VPS</span>
                </div>
                {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(botSettingsService.generateBotSettingsJson(settings), 'json')}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-between px-3 border border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Salin bot-settings.json</span>
                </div>
                {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              <button
                type="button"
                onClick={handleDownloadBotSettingsJson}
                className="w-full h-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center justify-between px-3 border border-indigo-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Unduh File bot-settings.json</span>
                </div>
                <span className="text-[10px] bg-white text-indigo-700 px-2 py-0.5 rounded font-mono border border-indigo-200">
                  Untuk VPS
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-between px-3 border border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lihat Skrip SQL Tabel Supabase</span>
                </div>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SQL SUPABASE */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Skrip Tabel Supabase bot_settings
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Jalankan sekali saja di Supabase SQL Editor agar setelan tersimpan di database VPS.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 font-mono text-xs">
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
                {botSettingsService.generateSqlSnippet()}
              </pre>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(botSettingsService.generateSqlSnippet(), 'sql')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sql' ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs border border-slate-300 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Key, 
  ExternalLink, 
  BookOpen, 
  GraduationCap, 
  Flame, 
  Layers, 
  FileText, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  ListChecks,
  ShieldCheck,
  Zap,
  Trash2
} from 'lucide-react';
import type { Question } from '../../types/exam';
import { aiQuestionService, type AIGenerateParams } from '../../services/aiQuestionService';
import { MathRenderer } from '../common/MathRenderer';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertQuestions: (newQuestions: Question[]) => void;
  defaultSubject?: string;
  defaultGradeLevel?: string;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onInsertQuestions,
  defaultSubject = 'Matematika Wajib',
  defaultGradeLevel = 'Kelas X (Fase E)',
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [gradeLevel, setGradeLevel] = useState(defaultGradeLevel);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'hots'>('medium');
  const [count, setCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'essay'>('multiple_choice');
  const [referenceMaterial, setReferenceMaterial] = useState('');
  
  // API Key BYOK state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [storedApiKey, setStoredApiKey] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // States for generation lifecycle
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [step, setStep] = useState<'form' | 'preview'>('form');

  // Load stored API key on modal open
  useEffect(() => {
    if (isOpen) {
      const stored = aiQuestionService.getStoredApiKey();
      setStoredApiKey(stored);
      setApiKeyInput(stored);
      setIsApiKeySaved(Boolean(stored));
      setShowApiKeySettings(!stored); // If no key, automatically expand setup
      setSubject(defaultSubject);
      setGradeLevel(defaultGradeLevel);
      setTestResult(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultSubject, defaultGradeLevel]);

  if (!isOpen) return null;

  const handleSaveAndTestApiKey = async () => {
    const cleanKey = apiKeyInput.trim();
    if (!cleanKey) {
      setErrorMessage('Harap masukkan API Key Google Gemini Anda.');
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);
    setErrorMessage(null);

    const test = await aiQuestionService.testApiKey(cleanKey);
    setIsTestingKey(false);

    if (test.valid) {
      aiQuestionService.setStoredApiKey(cleanKey);
      setStoredApiKey(cleanKey);
      setIsApiKeySaved(true);
      setTestResult({
        success: true,
        message: `API Key Valid & Aktif! Terhubung ke model ${test.model || 'Gemini 3.6 Flash'}.`,
      });
      setTimeout(() => {
        setShowApiKeySettings(false);
      }, 1500);
    } else {
      setTestResult({
        success: false,
        message: test.error || 'API Key tidak valid. Periksa kembali kunci dari Google AI Studio.',
      });
    }
  };

  const handleRemoveApiKey = () => {
    if (confirm('Hapus API Key pribadi dari browser ini? Anda perlu memasukkannya kembali untuk menggunakan AI Generator.')) {
      aiQuestionService.setStoredApiKey('');
      setStoredApiKey('');
      setApiKeyInput('');
      setIsApiKeySaved(false);
      setShowApiKeySettings(true);
      setTestResult(null);
    }
  };

  const handleStartGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage('Harap masukkan topik / materi kisi-kisi soal yang ingin dibuat.');
      return;
    }

    if (!isApiKeySaved && !apiKeyInput.trim()) {
      setShowApiKeySettings(true);
      setErrorMessage('Harap masukkan dan simpan API Key Google Gemini pribadi Anda terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    const params: AIGenerateParams = {
      subject: subject.trim() || 'Mata Pelajaran',
      gradeLevel: gradeLevel.trim() || 'Kelas X',
      topic: topic.trim(),
      difficulty,
      count,
      questionType,
      referenceMaterial: referenceMaterial.trim() || undefined,
      apiKey: storedApiKey || apiKeyInput.trim(),
    };

    const res = await aiQuestionService.generateQuestions(params);
    setIsGenerating(false);

    if (res.success && res.questions.length > 0) {
      setGeneratedQuestions(res.questions);
      setSelectedIndices(res.questions.map((_, idx) => idx));
      setStep('preview');
    } else {
      setErrorMessage(res.error || 'Gagal menghasilkan butir soal dari AI.');
    }
  };

  const handleToggleSelectQuestion = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAll = () => {
    if (selectedIndices.length === generatedQuestions.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(generatedQuestions.map((_, idx) => idx));
    }
  };

  const handleConfirmInsert = () => {
    const chosen = generatedQuestions.filter((_, idx) => selectedIndices.includes(idx));
    if (chosen.length === 0) {
      setErrorMessage('Pilih minimal 1 butir soal untuk dimasukkan ke bank soal.');
      return;
    }

    onInsertQuestions(chosen);
    onClose();
    setStep('form');
    setGeneratedQuestions([]);
  };

  // Masked API key helper (e.g. AIzaSy...4xAb)
  const maskedKey = storedApiKey
    ? `${storedApiKey.slice(0, 7)}...${storedApiKey.slice(-4)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">
        {/* 1. Gradient Header Banner */}
        <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 p-5 text-white flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-lg tracking-tight text-white leading-none">
                  AI Question Generator
                </h3>
                <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-300/30 text-amber-200 rounded-md text-[10px] font-mono font-bold">
                  GEMINI AI
                </span>
                {isApiKeySaved ? (
                  <span className="px-2 py-0.5 bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 rounded-md text-[10px] font-sans font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Key Pribadi Aktif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-400/20 border border-rose-300/30 text-rose-200 rounded-md text-[10px] font-sans font-bold">
                    Key Belum Diisi
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-100 font-sans mt-1">
                Buat butir soal otomatis & berbobot menggunakan Google Gemini API pribadi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hover">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleStartGenerate} className="space-y-4">
              
              {/* BYOK: Mandatory Personal API Key Card (If Not Configured) */}
              {!isApiKeySaved ? (
                <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-blue-50/50 border-2 border-dashed border-indigo-300 rounded-3xl space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <Key className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-sm text-indigo-950">
                        Aktivasi API Key Gemini Pribadi (100% Gratis)
                      </h4>
                      <p className="text-xs text-slate-600 font-sans mt-0.5 leading-relaxed">
                        Aplikasi ini menggunakan arsitektur mandiri (*Bring Your Own Key*). Kunci Anda tersimpan aman di browser Anda dan memiliki kuota gratis <strong>1.500 soal/hari</strong> dari Google.
                      </p>
                    </div>
                  </div>

                  {/* 3 Quick Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-700">
                    <div className="p-2.5 bg-white rounded-xl border border-indigo-100/80 space-y-0.5">
                      <span className="font-bold text-indigo-600">1. Buka AI Studio</span>
                      <p className="text-[10px] text-slate-500">Login dengan akun Google pribadi</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-indigo-100/80 space-y-0.5">
                      <span className="font-bold text-indigo-600">2. Buat API Key</span>
                      <p className="text-[10px] text-slate-500">Klik "Create API key" & Salin</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-indigo-100/80 space-y-0.5">
                      <span className="font-bold text-indigo-600">3. Tempel & Simpan</span>
                      <p className="text-[10px] text-slate-500">Kunci siap dipakai kapan saja</p>
                    </div>
                  </div>

                  {/* Input and Test Button */}
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Tempelkan API Key (AIzaSy...)"
                        className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAndTestApiKey}
                        disabled={isTestingKey}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-display font-bold shadow-xs cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                      >
                        {isTestingKey ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Memverifikasi...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Simpan & Verifikasi</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Test result message */}
                    {testResult && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          testResult.success
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                        <span>{testResult.message}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <span>🔗 Buka Google AI Studio untuk Dapatkan Key Gratis</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Topik / Kisi-kisi Utama */}
              <div>
                <label className="block text-xs font-display font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Topik / Kisi-Kisi Materi Ujian *</span>
                  <span className="text-[11px] text-indigo-600 font-sans normal-case font-normal">Wajib diisi</span>
                </label>
                <textarea
                  rows={2}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Persamaan Kuadrat, Teori Relativitas Khusus, Teks Prosedur Kompleks, Tata Surya & Planet..."
                  className="w-full p-3 text-xs font-sans bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-colors"
                  required
                />
              </div>

              {/* Mapel & Jenjang Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Matematika Wajib"
                    className="w-full px-3.5 py-2.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Jenjang / Tingkat Kelas
                  </label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="Contoh: Kelas X (Fase E)"
                    className="w-full px-3.5 py-2.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Tipe Soal & Tingkat Kesulitan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-slate-400" /> Tipe Soal
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuestionType('multiple_choice')}
                      className={`py-2 px-2 rounded-xl text-xs font-display font-bold transition-all border cursor-pointer text-center ${
                        questionType === 'multiple_choice'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Pilihan Ganda
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionType('essay')}
                      className={`py-2 px-2 rounded-xl text-xs font-display font-bold transition-all border cursor-pointer text-center ${
                        questionType === 'essay'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Uraian
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-slate-400" /> Tingkat Kesulitan
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'easy', label: 'Mudah' },
                      { id: 'medium', label: 'Sedang' },
                      { id: 'hard', label: 'Sulit' },
                      { id: 'hots', label: 'HOTS 🔥' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDifficulty(item.id as any)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-display font-bold transition-all border cursor-pointer text-center ${
                          difficulty === item.id
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Jumlah Butir Soal */}
              <div>
                <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> Jumlah Butir Soal
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`py-2 rounded-xl text-xs font-display font-bold transition-all border cursor-pointer text-center ${
                        count === num
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num} Soal
                    </button>
                  ))}
                </div>
              </div>

              {/* Accordion: Stimulus / Bahan Ajar Acuan */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <details className="group">
                  <summary className="p-3 text-xs font-display font-bold text-slate-700 flex items-center justify-between cursor-pointer list-none select-none">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Stimulus / Bahan Bacaan Tambahan (Opsional)
                    </span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform text-xs">▼</span>
                  </summary>
                  <div className="p-3 pt-0">
                    <textarea
                      rows={3}
                      value={referenceMaterial}
                      onChange={(e) => setReferenceMaterial(e.target.value)}
                      placeholder="Tempelkan paragraf bacaan, kutipan artikel, atau rangkuman materi dari buku ajar di sini jika ingin soal berbasis teks tersebut..."
                      className="w-full p-2.5 text-xs font-sans bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                    />
                  </div>
                </details>
              </div>

              {/* Status / Pengaturan API Key Tersimpan (Jika Sudah Ada) */}
              {isApiKeySaved ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-display font-bold text-slate-800">
                        API Key Pribadi: <code className="font-mono text-indigo-700">{maskedKey}</code>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                        className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        {showApiKeySettings ? 'Tutup' : 'Ubah Key'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveApiKey}
                        className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                        title="Hapus Key"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {showApiKeySettings && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="Ganti dengan API Key baru (AIzaSy...)"
                          className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={handleSaveAndTestApiKey}
                          disabled={isTestingKey}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-display font-bold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          {isTestingKey ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          <span>Simpan & Tes</span>
                        </button>
                      </div>
                      {testResult && (
                        <p className={`text-[11px] ${testResult.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {testResult.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || !isApiKeySaved}
                  className={`w-full h-12 rounded-2xl text-xs font-display font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                    !isApiKeySaved
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-indigo-500/25 cursor-pointer'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Gemini AI Sedang Menulis Soal & Kunci Jawaban...</span>
                    </>
                  ) : !isApiKeySaved ? (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Masukkan & Simpan API Key Pribadi Di Atas Terlebih Dahulu</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Generate {count} Butir Soal Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* 3. Preview Generated Questions Screen */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-display font-bold text-slate-800 text-xs">
                    Berhasil Membuat {generatedQuestions.length} Butir Soal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                >
                  {selectedIndices.length === generatedQuestions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-hover">
                {generatedQuestions.map((q, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleToggleSelectQuestion(idx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-400/20'
                          : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectQuestion(idx)}
                          className="mt-1 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md font-mono font-bold text-[10px]">
                              Soal #{idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-500 font-sans">
                              {q.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Uraian'} • {q.points} Poin
                            </span>
                          </div>

                          <div className="text-xs font-sans text-slate-900 font-medium leading-relaxed">
                            <MathRenderer text={q.questionText} />
                          </div>
                          {q.latexFormula && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center">
                              <MathRenderer math={q.latexFormula} block />
                            </div>
                          )}

                          {/* Options */}
                          {q.type === 'multiple_choice' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {q.options.map((opt) => {
                                const isCorrect = opt.id === q.correctOptionId;
                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                                      isCorrect
                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {opt.label}
                                    </span>
                                    <span className="truncate flex-1">
                                      <MathRenderer text={opt.text} />
                                    </span>
                                    {isCorrect && (
                                      <span className="ml-auto text-[9px] uppercase font-mono px-1.5 py-0.5 bg-emerald-200/80 text-emerald-800 rounded font-bold">
                                        Kunci
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="p-2.5 bg-amber-50/80 border border-amber-200/70 rounded-xl text-[11px] text-amber-950 font-sans leading-relaxed">
                              <span className="font-bold text-amber-900 mr-1.5">💡 Pembahasan:</span>
                              <MathRenderer text={q.explanation} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: 50% - 50% Balanced Grid */}
              <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-full h-11 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-display font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Ubah / Generate Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmInsert}
                  disabled={selectedIndices.length === 0}
                  className="w-full h-11 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-display font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>Tambahkan ({selectedIndices.length}) Soal ke Bank Soal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

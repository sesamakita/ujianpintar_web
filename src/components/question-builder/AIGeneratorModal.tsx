import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Key, 
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
  Trash2,
  SlidersHorizontal,
  Scale,
  Calculator,
  Plus,
  Minus
} from 'lucide-react';
import type { Question, QuestionType } from '../../types/exam';
import { 
  aiQuestionService, 
  type AIGenerateParams,
  type QuestionComposition,
  type TypePointsConfig
} from '../../services/aiQuestionService';
import { MathRenderer } from '../common/MathRenderer';
import { ConfirmModal } from '../common/ConfirmModal';
import { GeminiApiKeySettings } from '../common/GeminiApiKeySettings';
import { formatClassName } from '../../utils/formatters';

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
  const [referenceMaterial, setReferenceMaterial] = useState('');

  // Mode: Single vs Mixed
  const [genMode, setGenMode] = useState<'single' | 'mixed'>('mixed');

  // Single Mode State
  const [singleType, setSingleType] = useState<QuestionType>('multiple_choice');
  const [singleCount, setSingleCount] = useState<number>(5);
  const [singlePoints, setSinglePoints] = useState<number>(10);

  // Mixed Mode State (Default matching user example: 20 PG, 2 B/S, 3 Isian Singkat, 5 Uraian = 30 soal, 100 poin!)
  const [composition, setComposition] = useState<QuestionComposition>({
    multiple_choice: 20,
    true_false: 2,
    short_answer: 3,
    essay: 5,
  });

  const [typePoints, setTypePoints] = useState<TypePointsConfig>({
    multiple_choice: 2,
    true_false: 5,
    short_answer: 10,
    essay: 4,
  });
  
  // API Key BYOK state (shared component handles input/test; parent tracks saved state)
  const [storedApiKey, setStoredApiKey] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [isConfirmRemoveKeyOpen, setIsConfirmRemoveKeyOpen] = useState(false);

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
      const hasConfig = aiQuestionService.hasActiveConfig();
      setStoredApiKey(stored);
      setIsApiKeySaved(hasConfig);
      setShowApiKeySettings(!hasConfig);
      setSubject(defaultSubject);
      setGradeLevel(defaultGradeLevel);
      setErrorMessage(null);
    }
  }, [isOpen, defaultSubject, defaultGradeLevel]);

  if (!isOpen) return null;

  // Mixed mode calculated total questions & total points
  const mixedTotalQuestions = 
    (composition.multiple_choice || 0) +
    (composition.true_false || 0) +
    (composition.short_answer || 0) +
    (composition.essay || 0);

  const mixedTotalPoints = 
    ((composition.multiple_choice || 0) * (typePoints.multiple_choice || 0)) +
    ((composition.true_false || 0) * (typePoints.true_false || 0)) +
    ((composition.short_answer || 0) * (typePoints.short_answer || 0)) +
    ((composition.essay || 0) * (typePoints.essay || 0));

  // Presets applicator for Mixed Mode
  const applyPreset = (presetName: 'user_30' | 'ph_20' | 'quiz_10' | 'sumatif_25') => {
    if (presetName === 'user_30') {
      setComposition({ multiple_choice: 20, true_false: 2, short_answer: 3, essay: 5 });
      setTypePoints({ multiple_choice: 2, true_false: 5, short_answer: 10, essay: 4 });
    } else if (presetName === 'ph_20') {
      setComposition({ multiple_choice: 14, true_false: 4, short_answer: 2, essay: 0 });
      setTypePoints({ multiple_choice: 4, true_false: 4, short_answer: 14, essay: 0 });
    } else if (presetName === 'quiz_10') {
      setComposition({ multiple_choice: 6, true_false: 2, short_answer: 2, essay: 0 });
      setTypePoints({ multiple_choice: 10, true_false: 10, short_answer: 10, essay: 0 });
    } else if (presetName === 'sumatif_25') {
      setComposition({ multiple_choice: 15, true_false: 5, short_answer: 3, essay: 2 });
      setTypePoints({ multiple_choice: 3, true_false: 3, short_answer: 5, essay: 12 });
    }
  };

  const handleKeySaved = (key: string) => {
    setStoredApiKey(key);
    aiQuestionService.setAISettings({ activeProvider: 'gemini', geminiApiKey: key });
    setIsApiKeySaved(true);
    setShowApiKeySettings(false);
  };

  const handleRemoveApiKey = () => {
    setIsConfirmRemoveKeyOpen(true);
  };

  const handleExecuteRemoveApiKey = () => {
    aiQuestionService.setAISettings({ geminiApiKey: '' });
    setStoredApiKey('');
    const hasConfig = aiQuestionService.hasActiveConfig();
    setIsApiKeySaved(hasConfig);
    setShowApiKeySettings(!hasConfig);
    setIsConfirmRemoveKeyOpen(false);
  };

  const handleStartGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage('Harap masukkan topik / materi kisi-kisi soal yang ingin dibuat.');
      return;
    }

    const hasConfig = aiQuestionService.hasActiveConfig();
    if (!hasConfig && !storedApiKey.trim()) {
      setShowApiKeySettings(true);
      setErrorMessage('Harap atur API Key Google Gemini atau Token AI Kustom di Pengaturan Sekolah terlebih dahulu.');
      return;
    }

    if (genMode === 'mixed' && mixedTotalQuestions === 0) {
      setErrorMessage('Total butir soal pada mode campuran minimal 1 butir.');
      return;
    }

    if (genMode === 'single' && singleCount <= 0) {
      setErrorMessage('Jumlah butir soal minimal 1 butir.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    const currentSettings = aiQuestionService.getAISettings();
    const params: AIGenerateParams = {
      subject: subject.trim() || 'Mata Pelajaran',
      gradeLevel: formatClassName(gradeLevel, false).trim() || 'Kelas X',
      topic: topic.trim(),
      difficulty,
      mode: genMode,
      ...(genMode === 'single'
        ? {
            questionType: singleType,
            count: singleCount,
            defaultPoints: singlePoints,
          }
        : {
            composition,
            pointsPerType: typePoints,
          }),
      referenceMaterial: referenceMaterial.trim() || undefined,
      apiKey: currentSettings.activeProvider === 'gemini' ? storedApiKey.trim() : undefined,
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

  return (
    <div role="dialog" aria-modal="true" aria-label="Generator Soal AI" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">
        
        {/* 1. Header Banner */}
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
                  {aiQuestionService.getActiveProviderInfo().provider === 'gemini' ? 'GOOGLE GEMINI' : 'CUSTOM AI'}
                </span>
                {isApiKeySaved ? (
                  <span className="px-2 py-0.5 bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 rounded-md text-[10px] font-sans font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {aiQuestionService.getActiveProviderInfo().providerName}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-400/20 border border-rose-300/30 text-rose-200 rounded-md text-[10px] font-sans font-bold">
                    Kunci AI Belum Diatur
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-100 font-sans mt-1">
                Generate butir soal PG, Benar/Salah, Isian Singkat, & Uraian otomatis dengan bobot poin presisi
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

                  {/* Shared Input and Test Button */}
                  <GeminiApiKeySettings
                    variant="light"
                    currentKey={storedApiKey}
                    onKeySaved={handleKeySaved}
                    onKeyRemoved={() => handleExecuteRemoveApiKey()}
                  />
                </div>
              ) : null}

              {/* Mode Switcher: Mode Campuran (Mixed) vs Mode Tunggal (Single) */}
              <div className="space-y-1.5">
                <label id="aig-g1" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider">
                  Model Pembuatan Soal:
                </label>
                <div role="group" aria-labelledby="aig-g1" className="bg-slate-100 p-1 rounded-2xl grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGenMode('mixed')}
                    className={`py-2 px-3 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      genMode === 'mixed'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Komposisi Campuran (Mix 4 Tipe)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenMode('single')}
                    className={`py-2 px-3 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      genMode === 'single'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5 text-slate-600" />
                    <span>Mode Tunggal (1 Tipe Soal)</span>
                  </button>
                </div>
              </div>

              {/* Topik / Kisi-kisi Utama */}
              <div>
                <label htmlFor="aigene-1" className="block text-xs font-display font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Topik / Kisi-Kisi Materi Ujian *</span>
                  <span className="text-[11px] text-indigo-600 font-sans normal-case font-normal">Wajib diisi</span>
                </label>
                <textarea id="aigene-1"
                  rows={2}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Persamaan Kuadrat & Fungsi, Dinamika Partikel & Hukum Newton, Teks Eksplanasi Fenomena Alam..."
                  className="w-full p-3 text-xs font-sans bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-colors"
                  required
                />
              </div>

              {/* Mapel & Jenjang Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="aigene-1" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Mata Pelajaran
                  </label>
                  <input id="aigene-1"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Matematika Wajib"
                    className="w-full px-3.5 py-2.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="aigene-2" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Jenjang / Tingkat Kelas
                  </label>
                  <input id="aigene-2"
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(formatClassName(e.target.value, true))}
                    onBlur={() => setGradeLevel(formatClassName(gradeLevel, false))}
                    placeholder="Contoh: XI Ips 1 atau X-A"
                    className="w-full px-3.5 py-2.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* SECTION: SINGLE MODE INPUTS */}
              {genMode === 'single' && (
                <div className="space-y-3.5 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
                  {/* Tipe Soal (4 Jenis) */}
                  <div>
                    <label id="aig-g3" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-slate-400" /> Tipe Soal
                    </label>
                    <div role="group" aria-labelledby="aig-g3" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'multiple_choice', label: 'Pilihan Ganda' },
                        { id: 'true_false', label: 'Benar / Salah' },
                        { id: 'short_answer', label: 'Isian Singkat' },
                        { id: 'essay', label: 'Uraian' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSingleType(item.id as QuestionType)}
                          className={`py-2 px-2 rounded-xl text-xs font-display font-bold transition-all border cursor-pointer text-center ${
                            singleType === item.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jumlah Soal & Poin per Soal Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="aigene-3" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" /> Jumlah Butir Soal
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[3, 5, 10, 20].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSingleCount(num)}
                            className={`flex-1 py-2 rounded-xl text-xs font-display font-bold transition-all border cursor-pointer text-center ${
                              singleCount === num
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                        <input id="aigene-3"
                          type="number"
                          min="1"
                          max="50"
                          value={singleCount}
                          onChange={(e) => setSingleCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 bg-white border border-slate-200 py-2 rounded-xl text-center text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Jumlah butir kustom"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="aigene-4" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400" /> Bobot Poin per Butir
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[2, 5, 10, 20].map((pt) => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => setSinglePoints(pt)}
                            className={`flex-1 py-2 rounded-xl text-xs font-display font-bold transition-all border cursor-pointer text-center ${
                              singlePoints === pt
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {pt} pt
                          </button>
                        ))}
                        <input id="aigene-4"
                          type="number"
                          min="1"
                          max="100"
                          value={singlePoints}
                          onChange={(e) => setSinglePoints(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 bg-white border border-slate-200 py-2 rounded-xl text-center text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Poin kustom"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                    <span>Estimasi Akumulasi: <strong>{singleCount} Soal × {singlePoints} Poin</strong></span>
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {singleCount * singlePoints} Poin Total
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION: MIXED MODE (KOMPOSISI CAMPURAN) */}
              {genMode === 'mixed' && (
                <div className="space-y-3.5 p-4 bg-gradient-to-br from-indigo-50/60 via-violet-50/40 to-blue-50/50 border border-indigo-100 rounded-2xl">
                  
                  {/* Presets Row */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="aigene-5" className="block text-xs font-display font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Pilihan Preset Komposisi Cepat:
                      </label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPreset('user_30')}
                        className="p-2 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-xl text-[11px] font-display font-bold transition-all text-left shadow-2xs cursor-pointer"
                      >
                        <span className="block text-indigo-700 font-extrabold">30 Soal (Campuran)</span>
                        <span className="text-[10px] text-slate-500 font-sans block">20 PG, 2 B/S, 3 Isian, 5 Uraian</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset('ph_20')}
                        className="p-2 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-xl text-[11px] font-display font-bold transition-all text-left shadow-2xs cursor-pointer"
                      >
                        <span className="block text-indigo-700 font-extrabold">PH 20 Soal</span>
                        <span className="text-[10px] text-slate-500 font-sans block">14 PG, 4 B/S, 2 Isian Singkat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset('sumatif_25')}
                        className="p-2 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-xl text-[11px] font-display font-bold transition-all text-left shadow-2xs cursor-pointer"
                      >
                        <span className="block text-indigo-700 font-extrabold">Sumatif 25 Soal</span>
                        <span className="text-[10px] text-slate-500 font-sans block">15 PG, 5 B/S, 3 Isian, 2 Uraian</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset('quiz_10')}
                        className="p-2 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-xl text-[11px] font-display font-bold transition-all text-left shadow-2xs cursor-pointer"
                      >
                        <span className="block text-indigo-700 font-extrabold">Kuis 10 Soal</span>
                        <span className="text-[10px] text-slate-500 font-sans block">6 PG, 2 B/S, 2 Isian Singkat</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Type Rows Configuration */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-display font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between px-1">
                      <span>Jenis Soal Ujian</span>
                      <div className="flex items-center gap-6">
                        <span className="w-20 text-center">Jumlah Soal</span>
                        <span className="w-16 text-center">Poin/Soal</span>
                        <span className="w-16 text-right">Subtotal</span>
                      </div>
                    </div>

                    {/* 1. Pilihan Ganda */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-display font-bold text-slate-800 block">Pilihan Ganda</span>
                          <span className="text-[10px] text-slate-400">Opsi A-D / A-E</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Count counter */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => setComposition({ ...composition, multiple_choice: Math.max(0, composition.multiple_choice - 1) })}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input id="aigene-5"
                            type="number"
                            min="0"
                            max="50"
                            value={composition.multiple_choice}
                            onChange={(e) => setComposition({ ...composition, multiple_choice: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setComposition({ ...composition, multiple_choice: composition.multiple_choice + 1 })}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Points input */}
                        <div className="w-16 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={typePoints.multiple_choice || 2}
                            onChange={(e) => setTypePoints({ ...typePoints, multiple_choice: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-full bg-slate-50 border border-slate-200 py-1 text-center font-mono font-bold text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-[10px] text-slate-500">pt</span>
                        </div>

                        {/* Subtotal */}
                        <span className="w-16 text-right font-mono font-bold text-xs text-blue-700">
                          {(composition.multiple_choice || 0) * (typePoints.multiple_choice || 0)} Pts
                        </span>
                      </div>
                    </div>

                    {/* 2. Benar / Salah */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-display font-bold text-slate-800 block">Benar / Salah</span>
                          <span className="text-[10px] text-slate-400">Pernyataan True/False</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Count counter */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => setComposition({ ...composition, true_false: Math.max(0, composition.true_false - 1) })}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={composition.true_false}
                            onChange={(e) => setComposition({ ...composition, true_false: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setComposition({ ...composition, true_false: composition.true_false + 1 })}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Points input */}
                        <div className="w-16 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={typePoints.true_false || 5}
                            onChange={(e) => setTypePoints({ ...typePoints, true_false: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-full bg-slate-50 border border-slate-200 py-1 text-center font-mono font-bold text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-[10px] text-slate-500">pt</span>
                        </div>

                        {/* Subtotal */}
                        <span className="w-16 text-right font-mono font-bold text-xs text-amber-700">
                          {(composition.true_false || 0) * (typePoints.true_false || 0)} Pts
                        </span>
                      </div>
                    </div>

                    {/* 3. Isian Singkat */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-display font-bold text-slate-800 block">Isian Singkat</span>
                          <span className="text-[10px] text-slate-400">Kata kunci / Angka eksak</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Count counter */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => setComposition({ ...composition, short_answer: Math.max(0, composition.short_answer - 1) })}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={composition.short_answer}
                            onChange={(e) => setComposition({ ...composition, short_answer: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setComposition({ ...composition, short_answer: composition.short_answer + 1 })}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Points input */}
                        <div className="w-16 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={typePoints.short_answer || 10}
                            onChange={(e) => setTypePoints({ ...typePoints, short_answer: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-full bg-slate-50 border border-slate-200 py-1 text-center font-mono font-bold text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-[10px] text-slate-500">pt</span>
                        </div>

                        {/* Subtotal */}
                        <span className="w-16 text-right font-mono font-bold text-xs text-emerald-700">
                          {(composition.short_answer || 0) * (typePoints.short_answer || 0)} Pts
                        </span>
                      </div>
                    </div>

                    {/* 4. Uraian */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-display font-bold text-slate-800 block">Uraian / Esai</span>
                          <span className="text-[10px] text-slate-400">Penjelasan & Pembahasan</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Count counter */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => setComposition({ ...composition, essay: Math.max(0, composition.essay - 1) })}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={composition.essay}
                            onChange={(e) => setComposition({ ...composition, essay: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setComposition({ ...composition, essay: composition.essay + 1 })}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Points input */}
                        <div className="w-16 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={typePoints.essay || 4}
                            onChange={(e) => setTypePoints({ ...typePoints, essay: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-full bg-slate-50 border border-slate-200 py-1 text-center font-mono font-bold text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-[10px] text-slate-500">pt</span>
                        </div>

                        {/* Subtotal */}
                        <span className="w-16 text-right font-mono font-bold text-xs text-violet-700">
                          {(composition.essay || 0) * (typePoints.essay || 0)} Pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar for Mixed Mode */}
                  <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-sans text-slate-200">
                        Total Gabungan: <strong>{mixedTotalQuestions} Butir Soal</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300">Total Akumulasi:</span>
                      <span className={`px-2.5 py-0.5 rounded-lg font-mono font-black text-xs ${
                        mixedTotalPoints === 100
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-400 text-slate-950'
                      }`}>
                        {mixedTotalPoints} Poin {mixedTotalPoints === 100 ? '✓ (Pas 100)' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tingkat Kesulitan */}
              <div>
                <label htmlFor="aigene-2" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-slate-400" /> Tingkat Kesulitan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                    <textarea id="aigene-2"
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
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs font-display font-bold text-slate-800">
                        Mesin AI Aktif:{' '}
                        <span className="text-indigo-700 font-extrabold">
                          {aiQuestionService.getActiveProviderInfo().providerName}
                        </span>{' '}
                        <span className="text-slate-500 font-mono text-[11px]">
                          ({aiQuestionService.getActiveProviderInfo().modelName})
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                        className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        {showApiKeySettings ? 'Tutup' : 'Ubah / Atur Key'}
                      </button>
                      {aiQuestionService.getActiveProviderInfo().provider === 'gemini' && storedApiKey && (
                        <button
                          type="button"
                          onClick={handleRemoveApiKey}
                          className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                          title="Hapus Key"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {showApiKeySettings && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Untuk mengubah penyedia AI kustom (Groq, DeepSeek, OpenRouter), silakan buka menu <strong>Pengaturan Sekolah</strong>. Di sini Anda juga dapat mengatur kunci Google Gemini langsung:
                      </p>
                      <GeminiApiKeySettings
                        variant="light"
                        currentKey={storedApiKey}
                        onKeySaved={handleKeySaved}
                        onKeyRemoved={() => handleExecuteRemoveApiKey()}
                        showGuide={false}
                      />
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
                      <span>{aiQuestionService.getActiveProviderInfo().providerName} Sedang Menyusun {genMode === 'mixed' ? mixedTotalQuestions : singleCount} Butir Soal & Kunci Jawaban...</span>
                    </>
                  ) : !isApiKeySaved ? (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Masukkan & Simpan API Key Pribadi Di Atas Terlebih Dahulu</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>
                        Generate {genMode === 'mixed' ? mixedTotalQuestions : singleCount} Butir Soal Sekarang ({genMode === 'mixed' ? `${mixedTotalPoints} Poin` : `${singleCount * singlePoints} Poin`})
                      </span>
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
                          
                          {/* Type Badge & Points */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md font-mono font-bold text-[10px]">
                              Soal #{idx + 1}
                            </span>
                            <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-md border ${
                              q.type === 'multiple_choice'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : q.type === 'true_false'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : q.type === 'short_answer'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-violet-50 text-violet-700 border-violet-200'
                            }`}>
                              {q.type === 'multiple_choice' ? 'Pilihan Ganda' :
                               q.type === 'true_false' ? 'Benar / Salah' :
                               q.type === 'short_answer' ? 'Isian Singkat' : 'Uraian'}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {q.points} Poin
                            </span>
                          </div>

                          {/* Question Text */}
                          <div className="text-xs font-sans text-slate-900 font-medium leading-relaxed">
                            <MathRenderer text={q.questionText} />
                          </div>
                          {q.latexFormula && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center">
                              <MathRenderer math={q.latexFormula} block />
                            </div>
                          )}

                          {/* 1. Multiple Choice Options */}
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

                          {/* 2. True / False Options */}
                          {q.type === 'true_false' && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt) => {
                                const isCorrect = opt.id === q.correctOptionId;
                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                                      isCorrect
                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <span className="font-display font-bold">{opt.label}</span>
                                    {isCorrect && (
                                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded font-bold">
                                        Kunci Jawaban
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 3. Short Answer Key */}
                          {q.type === 'short_answer' && (
                            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs flex items-center gap-2">
                              <span className="font-bold text-emerald-800 text-[11px] flex-shrink-0">Kunci Jawaban:</span>
                              <span className="font-mono font-bold text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-xs">
                                {q.correctAnswerText || '-'}
                              </span>
                            </div>
                          )}

                          {/* 4. Essay Guidance */}
                          {q.type === 'essay' && q.correctAnswerText && (
                            <div className="p-2.5 bg-violet-50/80 border border-violet-200/80 rounded-xl text-xs space-y-1">
                              <span className="font-bold text-violet-900 text-[11px] block">Rubrik / Model Jawaban Ideal:</span>
                              <p className="text-slate-800 font-sans leading-relaxed text-[11px]">
                                <MathRenderer text={q.correctAnswerText} />
                              </p>
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

      {/* Modern API Key Removal Confirmation */}
      <ConfirmModal
        isOpen={isConfirmRemoveKeyOpen}
        onClose={() => setIsConfirmRemoveKeyOpen(false)}
        onConfirm={handleExecuteRemoveApiKey}
        title="Hapus API Key Gemini Pribadi?"
        message="API Key pribadi Anda akan dihapus dari memori browser lokal ini. Anda perlu memasukkannya kembali jika ingin menggunakan fitur AI Generator di masa mendatang."
        confirmText="Ya, Hapus Key"
        cancelText="Batal"
        variant="danger"
        iconType="trash"
      />
    </div>
  );
};

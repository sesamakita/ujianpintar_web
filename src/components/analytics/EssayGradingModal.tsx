import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Search, 
  Save, 
  Clock, 
  Layers, 
  Award, 
  ChevronDown, 
  ChevronUp,
  Key
} from 'lucide-react';
import type { EssayGradingItem, GradeRecord } from '../../types/exam';
import { examService } from '../../services/examService';
import { aiEssayGradingService } from '../../services/aiEssayGradingService';
import { MathRenderer } from '../common/MathRenderer';
import { GeminiApiKeySettings } from '../common/GeminiApiKeySettings';

interface EssayGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examTitle: string;
  onGradesUpdated: () => Promise<void>;
  fallbackQuestions?: any[];
  grades?: GradeRecord[];
}

export const EssayGradingModal: React.FC<EssayGradingModalProps> = ({
  isOpen,
  onClose,
  examId,
  examTitle,
  onGradesUpdated,
  fallbackQuestions,
  grades,
}) => {
  const [items, setItems] = useState<EssayGradingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // API Key Management State (shared component handles input/test; parent tracks saved state)
  const [storedApiKey, setStoredApiKey] = useState<string>('');
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);

  // AI analysis state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [analyzingCardId, setAnalyzingCardId] = useState<string | null>(null);

  // Filters
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGradedStatus, setFilterGradedStatus] = useState<'all' | 'graded' | 'pending'>('all');
  const [expandedRubrics, setExpandedRubrics] = useState<Record<string, boolean>>({});

  // Sync stored API key on open
  useEffect(() => {
    if (isOpen) {
      const key = aiEssayGradingService.getStoredApiKey();
      setStoredApiKey(key);
      setShowApiKeySettings(false);
    }
  }, [isOpen]);

  // Fetch submissions on open
  useEffect(() => {
    if (isOpen) {
      loadSubmissions();
    }
  }, [isOpen, examId]);

  const handleKeySaved = (key: string) => {
    setStoredApiKey(key);
    setShowApiKeySettings(false);
  };

  const handleKeyRemoved = () => {
    setStoredApiKey('');
    setShowApiKeySettings(true);
  };

  const loadSubmissions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await examService.getPendingEssayAnswers(examId, undefined, fallbackQuestions, grades);
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat jawaban esai siswa.');
    } finally {
      setIsLoading(false);
    }
  };

  // List of distinct essay questions
  const distinctQuestions = useMemo(() => {
    const map = new Map<string, { id: string; number: number; text: string; maxPoints: number }>();
    items.forEach((item) => {
      if (!map.has(item.questionId)) {
        map.set(item.questionId, {
          id: item.questionId,
          number: item.questionNumber,
          text: item.questionText,
          maxPoints: item.maxPoints,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.number - b.number);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Question filter
      if (selectedQuestionFilter !== 'all' && item.questionId !== selectedQuestionFilter) {
        return false;
      }

      // 2. Graded status filter
      if (filterGradedStatus === 'graded' && !item.isGraded) {
        return false;
      }
      if (filterGradedStatus === 'pending' && item.isGraded) {
        return false;
      }

      // 3. Search query (name or NISN)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.studentName.toLowerCase().includes(q);
        const matchNisn = item.nisn.toLowerCase().includes(q);
        const matchClass = (item.className || '').toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchClass) return false;
      }

      return true;
    });
  }, [items, selectedQuestionFilter, filterGradedStatus, searchQuery]);

  const totalCount = items.length;
  const gradedCount = items.filter((i) => i.isGraded).length;
  const pendingCount = totalCount - gradedCount;

  // Toggle rubric accordion
  const toggleRubric = (questionId: string) => {
    setExpandedRubrics((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Individual point change by teacher
  const handleScoreChange = (indexInAll: number, score: number) => {
    setItems((prev) => {
      const next = [...prev];
      const target = next[indexInAll];
      if (target) {
        const clamped = Math.max(0, Math.min(target.maxPoints, score));
        next[indexInAll] = {
          ...target,
          scoreEarned: clamped,
          isGraded: true,
        };
      }
      return next;
    });
  };

  // Teacher feedback change
  const handleFeedbackChange = (indexInAll: number, text: string) => {
    setItems((prev) => {
      const next = [...prev];
      const target = next[indexInAll];
      if (target) {
        next[indexInAll] = { ...target, teacherFeedback: text };
      }
      return next;
    });
  };

  // 1-Click Batch AI Evaluation
  const handleStartAIEvaluation = async () => {
    const key = (storedApiKey || aiEssayGradingService.getStoredApiKey()).trim();
    if (!key) {
      setErrorMessage('Harap atur dan simpan API Key Google Gemini pribadi Anda terlebih dahulu.');
      setShowApiKeySettings(true);
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Belum ada data lembar jawaban siswa yang dapat dianalisis.');
      return;
    }

    setIsAnalyzingAI(true);
    setErrorMessage(null);
    setAiProgress({ current: 0, total: items.length });

    try {
      const evalRequests = items.map((item) => ({
        id: `${item.sessionId}_${item.questionId}`,
        studentName: item.studentName,
        questionText: item.questionText,
        rubricOrModelAnswer: item.rubricOrModelAnswer,
        maxPoints: item.maxPoints,
        studentAnswer: item.studentAnswer,
      }));

      const results = await aiEssayGradingService.batchEvaluateEssays(
        evalRequests,
        key,
        (current, total) => setAiProgress({ current, total })
      );

      const successCount = results.filter((r) => r.success).length;
      if (successCount === 0 && results.length > 0) {
        const firstErr = results.find((r) => r.error)?.error || 'Gagal memproses penilaian AI.';
        setErrorMessage(`Evaluasi AI tidak berhasil: ${firstErr}`);
        setShowApiKeySettings(true);
        return;
      }

      const resultMap = new Map<string, { suggestedScore: number; feedback: string }>();
      results.forEach((r) => {
        if (r.success) {
          resultMap.set(r.id, { suggestedScore: r.suggestedScore, feedback: r.feedback });
        }
      });

      // Update state with AI suggestions and auto-fill scoreEarned
      setItems((prev) =>
        prev.map((item) => {
          const key = `${item.sessionId}_${item.questionId}`;
          const aiRes = resultMap.get(key);
          if (aiRes) {
            return {
              ...item,
              aiSuggestedScore: aiRes.suggestedScore,
              aiFeedback: aiRes.feedback,
              scoreEarned: aiRes.suggestedScore,
              isGraded: true,
            };
          }
          return item;
        })
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menjalankan analisis AI.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Evaluate single student answer
  const handleEvaluateSingleStudent = async (indexInAll: number) => {
    const target = items[indexInAll];
    if (!target) return;

    const key = (storedApiKey || aiEssayGradingService.getStoredApiKey()).trim();
    if (!key) {
      setErrorMessage('Harap atur dan simpan API Key Google Gemini pribadi Anda terlebih dahulu.');
      setShowApiKeySettings(true);
      return;
    }

    const cardId = `${target.sessionId}_${target.questionId}`;
    setAnalyzingCardId(cardId);
    setErrorMessage(null);

    try {
      const res = await aiEssayGradingService.evaluateSingleEssay(
        {
          id: cardId,
          studentName: target.studentName,
          questionText: target.questionText,
          rubricOrModelAnswer: target.rubricOrModelAnswer,
          maxPoints: target.maxPoints,
          studentAnswer: target.studentAnswer,
        },
        key
      );

      if (res.success) {
        setItems((prev) => {
          const next = [...prev];
          if (next[indexInAll]) {
            next[indexInAll] = {
              ...next[indexInAll],
              aiSuggestedScore: res.suggestedScore,
              aiFeedback: res.feedback,
              scoreEarned: res.suggestedScore,
              isGraded: true,
            };
          }
          return next;
        });
      } else {
        setErrorMessage(`Evaluasi AI untuk ${target.studentName} gagal: ${res.error || 'Terjadi kesalahan sistem.'}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengevaluasi jawaban esai siswa.');
    } finally {
      setAnalyzingCardId(null);
    }
  };

  // Batch apply all AI suggested scores
  const handleApplyAllAIScores = () => {
    setItems((prev) =>
      prev.map((item) => {
        if (typeof item.aiSuggestedScore === 'number') {
          return {
            ...item,
            scoreEarned: item.aiSuggestedScore,
            isGraded: true,
          };
        }
        return item;
      })
    );
  };

  // Save all evaluations to Supabase
  const handleSaveGrades = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const evaluations = items
        .filter((item) => item.scoreEarned !== null)
        .map((item) => ({
          answerId: item.answerId,
          sessionId: item.sessionId,
          questionId: item.questionId,
          scoreEarned: item.scoreEarned || 0,
          feedback: item.teacherFeedback,
          aiFeedback: item.aiFeedback,
          aiSuggestedScore: item.aiSuggestedScore,
          nisn: item.nisn,
        }));

      const res = await examService.saveBatchEssayGrading(examId, evaluations);

      if (res.success) {
        setSaveSuccess(true);
        await onGradesUpdated();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan penilaian ke database.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Penilaian Soal Uraian" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-5xl flex flex-col max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden font-sans relative"
      >
        
        {/* 1. Header Banner */}
        <div className="bg-gradient-to-r from-violet-800 via-indigo-800 to-blue-800 p-5 text-white flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-lg tracking-tight text-white leading-none">
                  Ruang Koreksi Soal Uraian (Esai)
                </h3>
                <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-300/30 text-amber-200 rounded-md text-[11px] font-mono font-bold">
                  HUMAN-IN-THE-LOOP
                </span>
                {storedApiKey ? (
                  <span className="px-2 py-0.5 bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 rounded-md text-[11px] font-sans font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Gemini AI: {storedApiKey.slice(0, 6)}...{storedApiKey.slice(-4)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-400/20 border border-rose-300/30 text-rose-200 rounded-md text-[11px] font-sans font-bold">
                    Key AI Belum Diatur
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-100 font-sans mt-1">
                {examTitle} • {distinctQuestions.length} Butir Soal Uraian
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowApiKeySettings(!showApiKeySettings)}
              className="h-8 px-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[11px] font-display font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title="Pengaturan API Key Google Gemini"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>{showApiKeySettings ? 'Tutup Key' : storedApiKey ? 'Ubah Key' : 'Atur Key AI'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Key Inline Drawer */}
        {showApiKeySettings && (
          <div className="bg-indigo-950 border-b border-indigo-800 p-4 text-white animate-in slide-in-from-top duration-200">
            <div className="max-w-xl space-y-2">
              <GeminiApiKeySettings
                variant="dark"
                currentKey={storedApiKey}
                onKeySaved={handleKeySaved}
                onKeyRemoved={handleKeyRemoved}
              />
            </div>
          </div>
        )}

        {/* 2. Sub-Header: Progress Stats & 1-Click AI Actions Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          
          {/* Left: Progress Counters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="h-8 px-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-sans text-slate-600">Total Jawaban:</span>
              <span className="font-mono font-bold text-slate-900">{totalCount}</span>
            </div>

            <div className="h-8 px-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-sans text-emerald-800">Selesai Dinilai:</span>
              <span className="font-mono font-bold text-emerald-950">{gradedCount}</span>
            </div>

            {pendingCount > 0 && (
              <div className="h-8 px-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-sans text-amber-800">Belum Dinilai:</span>
                <span className="font-mono font-bold text-amber-950">{pendingCount}</span>
              </div>
            )}
          </div>

          {/* Right: AI Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {items.some((i) => typeof i.aiSuggestedScore === 'number') && (
              <button
                type="button"
                onClick={handleApplyAllAIScores}
                className="h-8 px-3 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-display font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                title="Terapkan seluruh rekomendasi nilai AI ke kolom penilaian guru"
              >
                <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />
                <span>Setujui Semua Usulan AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartAIEvaluation}
              disabled={isAnalyzingAI || totalCount === 0}
              className="h-8 px-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-display font-bold transition-all shadow-xs shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
            >
              {isAnalyzingAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Menganalisis ({aiProgress.current}/{aiProgress.total})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                  <span>Koreksi Semua dengan AI (1-Klik)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Alerts */}
        {errorMessage && (
          <div className="p-3 mx-5 mt-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 mx-5 mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="flex-1 font-bold">Penilaian berhasil disimpan! Rekapitulasi nilai akhir siswa telah otomatis diperbarui.</span>
          </div>
        )}

        {/* 4. Filters Bar */}
        <div className="p-3.5 px-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          {/* Question Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hover py-0.5">
            <button
              type="button"
              onClick={() => setSelectedQuestionFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold border transition-colors cursor-pointer flex-shrink-0 ${
                selectedQuestionFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Soal Uraian ({distinctQuestions.length})
            </button>
            {distinctQuestions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelectedQuestionFilter(q.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold border transition-colors cursor-pointer flex-shrink-0 ${
                  selectedQuestionFilter === q.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Soal #{q.number} ({q.maxPoints} pt)
              </button>
            ))}
          </div>

          {/* Right: Search & Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            <select
              value={filterGradedStatus}
              onChange={(e) => setFilterGradedStatus(e.target.value as any)}
              className="h-8 px-2.5 text-xs font-display font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Belum Dinilai</option>
              <option value="graded">Sudah Dinilai</option>
            </select>
          </div>
        </div>

        {/* 5. Scrollable Submissions List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hover">
          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500">Memuat berkas jawaban esai siswa...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Tidak ada jawaban esai yang cocok</p>
              <p className="text-xs text-slate-400">
                {items.length === 0
                  ? 'Paket ujian ini belum memiliki butir soal uraian atau siswa belum mengumpulkan ujian.'
                  : 'Coba ubah kriteria pencarian atau filter status di atas.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              // Find real index in entire items array
              const originalIndex = items.findIndex(
                (i) => i.sessionId === item.sessionId && i.questionId === item.questionId
              );
              const isRubricExpanded = expandedRubrics[item.questionId] ?? false;

              return (
                <div
                  key={`${item.sessionId}_${item.questionId}`}
                  className={`bg-white rounded-2xl border transition-all space-y-3.5 p-4 shadow-2xs ${
                    item.isGraded
                      ? 'border-slate-200'
                      : 'border-amber-300/80 bg-amber-50/20'
                  }`}
                >
                  {/* Top: Student & Question Number Info */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        {item.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-slate-900 text-xs">
                            {item.studentName}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {item.nisn} • {item.className}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-700 block">
                          Soal Uraian #{item.questionNumber} (Maks. {item.maxPoints} Poin)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEvaluateSingleStudent(originalIndex)}
                        disabled={analyzingCardId === `${item.sessionId}_${item.questionId}` || !item.studentAnswer?.trim()}
                        className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-display font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        title="Analisis jawaban butir ini dengan Google Gemini AI"
                      >
                        {analyzingCardId === `${item.sessionId}_${item.questionId}` ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                            <span>Menganalisis...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>Analisis AI</span>
                          </>
                        )}
                      </button>

                      {item.isGraded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-display font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Nilai: {item.scoreEarned} / {item.maxPoints} Poin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-display font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Menunggu Penilaian
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Box & Rubric Accordion */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase text-slate-500 block">
                        Pertanyaan Soal:
                      </span>
                      {item.rubricOrModelAnswer && (
                        <button
                          type="button"
                          onClick={() => toggleRubric(item.questionId)}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Kunci / Rubrik Guru</span>
                          {isRubricExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <div className="text-slate-800 font-medium leading-relaxed">
                      <MathRenderer text={item.questionText} />
                    </div>

                    {isRubricExpanded && item.rubricOrModelAnswer && (
                      <div className="pt-2 border-t border-slate-200/80 mt-2 space-y-1 text-slate-700 bg-white p-2.5 rounded-lg border">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Model Jawaban Acuan:
                        </span>
                        <div className="text-[11px] leading-relaxed font-sans">
                          <MathRenderer text={item.rubricOrModelAnswer} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Student Answer Box */}
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200/70 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold uppercase text-blue-900 tracking-wider block">
                      Teks Jawaban Siswa:
                    </span>
                    <p className="text-xs text-slate-900 font-sans leading-relaxed whitespace-pre-wrap">
                      {item.studentAnswer ? (
                        item.studentAnswer
                      ) : (
                        <span className="italic text-slate-400">Siswa tidak menuliskan jawaban (kosong).</span>
                      )}
                    </p>
                  </div>

                  {/* AI Recommendation Banner (If available) */}
                  {item.aiFeedback && (
                    <div className="p-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-indigo-950 text-[11px]">
                            Rekomendasi Analisis AI:
                          </span>
                          <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                            {item.aiSuggestedScore} / {item.maxPoints} Poin
                          </span>
                        </div>

                        {item.scoreEarned !== item.aiSuggestedScore && (
                          <button
                            type="button"
                            onClick={() => handleScoreChange(originalIndex, item.aiSuggestedScore || 0)}
                            className="text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-100/70 border border-indigo-300 px-2 py-0.5 rounded cursor-pointer"
                          >
                            Gunakan Skor Ini
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                        {item.aiFeedback}
                      </p>
                    </div>
                  )}

                  {/* Teacher Grading & Feedback Inputs */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    
                    {/* Score input & Presets */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-display font-bold text-slate-700">
                        Skor Guru:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={item.maxPoints}
                          value={item.scoreEarned !== null ? item.scoreEarned : ''}
                          placeholder="0"
                          onChange={(e) => handleScoreChange(originalIndex, parseInt(e.target.value) || 0)}
                          className="w-14 h-8 text-center font-mono font-black text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-blue-900"
                        />
                        <span className="text-xs text-slate-400 font-mono">/ {item.maxPoints} pt</span>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleScoreChange(originalIndex, 0)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer"
                          title="Beri skor 0"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(originalIndex, Math.round(item.maxPoints / 2))}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer"
                          title="Beri skor 50%"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(originalIndex, item.maxPoints)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer"
                          title="Beri skor penuh"
                        >
                          Maks
                        </button>
                      </div>
                    </div>

                    {/* Teacher Notes Input */}
                    <div className="flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Catatan / masukan evaluasi untuk siswa (opsional)..."
                        value={item.teacherFeedback || ''}
                        onChange={(e) => handleFeedbackChange(originalIndex, e.target.value)}
                        className="w-full h-8 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 6. Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 font-sans">
            Penilaian yang Anda simpan akan otomatis memperbarui nilai total rapor siswa di database.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleSaveGrades}
              disabled={isSaving || items.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-display font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Nilai...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan & Perbarui Nilai Siswa</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

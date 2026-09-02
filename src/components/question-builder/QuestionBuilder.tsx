import React, { useState } from 'react';
import { 
  Plus, 
  UploadCloud, 
  Save, 
  Check, 
  Smartphone, 
  FileText, 
  Target, 
  Trash2, 
  ArrowLeft, 
  KeyRound, 
  Copy, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { ExamSettings, Question } from '../../types/exam';
import { ExamSettingsPanel } from './ExamSettingsPanel';
import { QuestionCard } from './QuestionCard';
import { ImportModal } from './ImportModal';
import { MobilePreviewModal } from './MobilePreviewModal';
import { ExamBankList } from './ExamBankList';
import { AIGeneratorModal } from './AIGeneratorModal';
import { examService } from '../../services/examService';

import { generateUUID } from '../../services/examService';

interface QuestionBuilderProps {
  examSettings: ExamSettings;
  setExamSettings: React.Dispatch<React.SetStateAction<ExamSettings>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  allExams: ExamSettings[];
  onRefreshExams: () => Promise<void>;
  onSelectExamForEdit: (exam: ExamSettings) => void;
  onSetActiveExamForProctoring: (exam: ExamSettings) => void;
  onCreateNewExam: (newExam: ExamSettings) => void;
  onDeleteExam: (examId: string) => Promise<void>;
  builderView: 'list' | 'editor';
  setBuilderView: (view: 'list' | 'editor') => void;
  onOpenMobilePreview: () => void;
  isMobilePreviewOpen: boolean;
  setIsMobilePreviewOpen: (open: boolean) => void;
  onStudentSubmit?: (student: any, grade: any, logs: any[]) => void;
}

interface DeleteConfirmModalState {
  isOpen: boolean;
  type: 'single' | 'selected' | 'all';
  targetId?: string;
  count?: number;
}

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({
  examSettings,
  setExamSettings,
  questions,
  setQuestions,
  allExams,
  onRefreshExams,
  onSelectExamForEdit,
  onSetActiveExamForProctoring,
  onCreateNewExam,
  onDeleteExam,
  builderView,
  setBuilderView,
  onOpenMobilePreview,
  isMobilePreviewOpen,
  setIsMobilePreviewOpen,
  onStudentSubmit,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<DeleteConfirmModalState>({
    isOpen: false,
    type: 'selected',
  });

  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);

  const isAllSelected = questions.length > 0 && selectedQuestionIds.length === questions.length;
  const isSomeSelected = selectedQuestionIds.length > 0 && selectedQuestionIds.length < questions.length;

  const handleToggleSelect = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map((q) => q.id));
    }
  };

  const handleGenerateNewToken = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setExamSettings({ ...examSettings, token: randomPin });
  };

  const handleAddNewQuestion = () => {
    const newQuestion: Question = {
      id: generateUUID(),
      number: questions.length + 1,
      type: 'multiple_choice',
      questionText: '',
      options: [
        { id: generateUUID(), label: 'A', text: '' },
        { id: generateUUID(), label: 'B', text: '' },
        { id: generateUUID(), label: 'C', text: '' },
        { id: generateUUID(), label: 'D', text: '' },
      ],
      correctOptionId: undefined,
      points: 10,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (updated: Question) => {
    setQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
  };

  const handleRequestDeleteSingle = (id: string) => {
    const target = questions.find((q) => q.id === id);
    setDeleteConfirmModal({
      isOpen: true,
      type: 'single',
      targetId: id,
      count: target?.number || 1,
    });
  };

  const handleRequestDeleteSelected = () => {
    if (selectedQuestionIds.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      type: 'selected',
      count: selectedQuestionIds.length,
    });
  };

  const handleRequestDeleteAll = () => {
    if (questions.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      type: 'all',
      count: questions.length,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmModal.type === 'single' && deleteConfirmModal.targetId) {
      const filtered = questions.filter((q) => q.id !== deleteConfirmModal.targetId);
      const renumbered = filtered.map((q, idx) => ({ ...q, number: idx + 1 }));
      setQuestions(renumbered);
      setSelectedQuestionIds((prev) => prev.filter((id) => id !== deleteConfirmModal.targetId));
    } else if (deleteConfirmModal.type === 'selected') {
      const selectedSet = new Set(selectedQuestionIds);
      const filtered = questions.filter((q) => !selectedSet.has(q.id));
      const renumbered = filtered.map((q, idx) => ({ ...q, number: idx + 1 }));
      setQuestions(renumbered);
      setSelectedQuestionIds([]);
    } else if (deleteConfirmModal.type === 'all') {
      setQuestions([]);
      setSelectedQuestionIds([]);
    }
    setDeleteConfirmModal({ isOpen: false, type: 'selected' });
  };

  const handleDuplicateQuestion = (question: Question) => {
    const duplicated: Question = {
      ...question,
      id: generateUUID(),
      number: questions.length + 1,
      options: question.options.map((opt) => ({
        ...opt,
        id: generateUUID(),
      })),
    };
    setQuestions([...questions, duplicated]);
  };

  const handleImportSuccess = (imported: Question[]) => {
    const startIndex = questions.length;
    const renumbered = imported.map((q, idx) => ({
      ...q,
      id: generateUUID(),
      number: startIndex + idx + 1,
    }));
    setQuestions([...questions, ...renumbered]);
  };

  const handleAIInsertQuestions = (newQuestions: Question[]) => {
    const startIndex = questions.length;
    const renumbered = newQuestions.map((q, idx) => ({
      ...q,
      id: generateUUID(),
      number: startIndex + idx + 1,
    }));
    setQuestions([...questions, ...renumbered]);
  };

  const handleSaveExam = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await examService.saveExam(examSettings, questions);
      if (res.success && res.examId) {
        setExamSettings((prev) => ({ ...prev, id: res.examId, token: res.token || prev.token }));
        setIsSaved(true);
        await onRefreshExams();
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        setSaveError(res.error || 'Gagal menyimpan ke database Supabase.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPinInEditor = () => {
    navigator.clipboard.writeText(examSettings.token);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // If in Catalog List Mode, show ExamBankList component
  if (builderView === 'list') {
    return (
      <ExamBankList
        exams={allExams}
        activeExamId={examSettings.id}
        onSelectExamForEdit={(selected) => {
          onSelectExamForEdit(selected);
          setBuilderView('editor');
        }}
        onSetActiveExamForProctoring={onSetActiveExamForProctoring}
        onRefreshExams={onRefreshExams}
        onCreateNewExam={(newExam) => {
          onCreateNewExam(newExam);
          setBuilderView('editor');
        }}
        onDeleteExam={onDeleteExam}
      />
    );
  }

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto font-sans">
      {/* Top Header Card (Single Parent Card Container with p-3.5 Padding) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Left Side: Info, Title, PIN & Stats (Stacked Vertically in 3 Tiers) */}
        <div className="flex-1 flex flex-col justify-center gap-2.5 min-w-0">
          {/* Tier 1: Back Button */}
          <div>
            <button
              type="button"
              onClick={() => setBuilderView('list')}
              className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer inline-flex items-center gap-2 shadow-2xs"
              title="Kembali ke Katalog Bank Soal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Katalog Bank Soal</span>
            </button>
          </div>

          {/* Tier 2: Nama Bank Soal & Mapel */}
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-slate-900 text-base tracking-tight truncate max-w-xs sm:max-w-xl" title={examSettings.title}>
              {examSettings.title}
            </h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-sans font-medium flex-shrink-0">
              {examSettings.subject || 'Mata Pelajaran'} • {examSettings.gradeLevel || 'Kelas'}
            </span>
          </div>

          {/* Tier 3: 3 Stat Badges + AI Generator Button (Horizontal) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Active PIN Pill */}
            <button
              type="button"
              onClick={handleCopyPinInEditor}
              className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-blue-400 rounded-xl text-xs font-mono font-bold border border-slate-800 shadow-inner transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0"
              title="Klik untuk salin PIN"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span>PIN: {examSettings.token}</span>
              {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
            </button>
            
            {/* Jumlah Soal */}
            <div className="h-8 px-3 bg-blue-50 border border-blue-200/80 rounded-xl text-xs flex items-center gap-2 flex-shrink-0 shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span className="font-sans text-slate-500 font-medium">Jumlah Soal:</span>
              <span className="font-mono font-bold text-blue-900">{questions.length} Butir</span>
            </div>

            {/* Total Skor */}
            <div className="h-8 px-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs flex items-center gap-2 flex-shrink-0 shadow-2xs">
              <Target className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="font-sans text-slate-500 font-medium">Total Skor:</span>
              <span className="font-mono font-bold text-emerald-900">{totalPoints} Poin</span>
            </div>

            {/* AI Generator Button (Horizontal with 3 cards) */}
            <button
              type="button"
              onClick={() => setIsAIGeneratorOpen(true)}
              className="h-8 px-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-display font-bold transition-all shadow-xs shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
              title="Buat butir soal otomatis dengan bantuan AI Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" />
              <span>Buat Soal dengan AI</span>
            </button>
          </div>
        </div>

        {/* Divider Desktop */}
        <div className="hidden lg:block w-px self-stretch bg-slate-100 mx-1" />

        {/* Right Side: 3 Action Buttons */}
        <div className="flex flex-col justify-center gap-1.5 w-full lg:w-48 flex-shrink-0 border-t lg:border-t-0 border-slate-100 pt-2.5 lg:pt-0">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="w-full h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <span>Import File</span>
          </button>

          <button
            type="button"
            onClick={onOpenMobilePreview}
            className="w-full h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <span>Preview HP Siswa</span>
          </button>

          <button
            type="button"
            onClick={handleSaveExam}
            disabled={isSaving}
            className="w-full h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
          >
            {isSaving ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : isSaved ? (
              <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3] flex-shrink-0" />
            ) : (
              <Save className="w-3.5 h-3.5 text-white flex-shrink-0" />
            )}
            <span>{isSaving ? 'Menyimpan...' : isSaved ? 'Tersimpan!' : 'Simpan & Terbitkan'}</span>
          </button>
        </div>
      </div>

      {/* Save Error Alert Banner */}
      {saveError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-sans font-medium flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="flex-1">{saveError}</span>
        </div>
      )}

      {/* 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settings Panel (30% / 4 cols) */}
        <div className="lg:col-span-4 sticky top-20">
          <ExamSettingsPanel
            settings={examSettings}
            onChange={setExamSettings}
            onGenerateNewToken={handleGenerateNewToken}
          />
        </div>

        {/* Right Column: Question Cards List (70% / 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Question List Header Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-display font-bold text-slate-800 flex items-center gap-2">
                Daftar Butir Soal Ujian
                <span className="text-xs text-slate-400 font-normal">({questions.length} Butir)</span>
              </h4>

              {/* Select All Checkbox Button */}
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-display font-bold transition-all cursor-pointer ${
                    isAllSelected
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                      : isSomeSelected
                      ? 'bg-blue-50/50 border-blue-200 text-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={isAllSelected ? 'Batalkan pilihan semua soal' : 'Pilih semua butir soal'}
                >
                  <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    isAllSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isSomeSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300'
                  }`}>
                    {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {isSomeSelected && <span className="w-2 h-0.5 bg-white rounded-full"></span>}
                  </span>
                  <span>{isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
                </button>
              )}

              {selectedQuestionIds.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-display font-bold rounded-lg animate-in fade-in">
                  {selectedQuestionIds.length} Soal Dipilih
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Hapus Terpilih Button */}
              {selectedQuestionIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleRequestDeleteSelected}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-display font-bold transition-all shadow-xs cursor-pointer animate-in fade-in"
                  title="Hapus butir soal yang dicentang"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Terpilih ({selectedQuestionIds.length})</span>
                </button>
              )}

              {/* Hapus Semua Button */}
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleRequestDeleteAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-display font-bold transition-all shadow-xs cursor-pointer"
                  title="Hapus seluruh butir soal ujian"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              )}

              {/* Tambah Soal Button */}
              <button
                onClick={handleAddNewQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-display font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Soal</span>
              </button>
            </div>
          </div>

          {/* Question Cards List or Empty State */}
          {questions.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-display font-bold text-slate-900">Belum Ada Butir Soal Ujian</h4>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Bank butir soal untuk ujian ini masih kosong. Silakan tambahkan butir soal baru atau import file soal dari Excel/Word.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <UploadCloud className="w-4 h-4 text-slate-600" />
                  <span>Import File Soal</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddNewQuestion}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-display font-bold transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Soal Pertama</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  isSelected={selectedQuestionIds.includes(question.id)}
                  onToggleSelect={handleToggleSelect}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleRequestDeleteSingle}
                  onDuplicate={handleDuplicateQuestion}
                />
              ))}
            </div>
          )}

          {/* Bottom Add Question Banner (only when questions exist) */}
          {questions.length > 0 && (
            <button
              onClick={handleAddNewQuestion}
              className="w-full py-4 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 rounded-2xl flex items-center justify-center gap-2 text-blue-700 font-display font-bold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Butir Soal Baru (# {questions.length + 1})
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-xs border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                  {deleteConfirmModal.type === 'single' && `Hapus Butir Soal #${deleteConfirmModal.count}?`}
                  {deleteConfirmModal.type === 'selected' && `Hapus ${deleteConfirmModal.count} Butir Soal Terpilih?`}
                  {deleteConfirmModal.type === 'all' && `Hapus Semua Butir Soal (${deleteConfirmModal.count} Butir)?`}
                </h3>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  {deleteConfirmModal.type === 'single' && 'Butir soal ini akan dihapus dari daftar soal ujian.'}
                  {deleteConfirmModal.type === 'selected' && `Seluruh (${deleteConfirmModal.count}) butir soal yang dicentang akan dihapus dari daftar soal ujian.`}
                  {deleteConfirmModal.type === 'all' && 'Seluruh butir soal dalam ujian ini akan dihapus bersih. Tindakan ini tidak dapat dibatalkan.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: 'selected' })}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-display font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteConfirmModal.type === 'all' ? 'Ya, Hapus Semua' : 'Ya, Hapus'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onInsertQuestions={handleAIInsertQuestions}
        defaultSubject={examSettings.subject}
        defaultGradeLevel={examSettings.gradeLevel}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <MobilePreviewModal
        isOpen={isMobilePreviewOpen}
        onClose={() => setIsMobilePreviewOpen(false)}
        examSettings={examSettings}
        questions={questions}
        onStudentSubmit={onStudentSubmit}
      />
    </div>
  );
};

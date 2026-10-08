import React, { useState } from 'react';
import {
  X,
  Search,
  Award,
  AlertTriangle,
  Clock,
  Printer,
  ChevronRight,
  BookOpen,
  Sparkles,
  School,
  User,
  GraduationCap,
  MessageSquare,
  FileText,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { examService } from '../../services/examService';
import type { StudentPublicExamSummary, StudentAnswerDetailItem } from '../../types/exam';
import { MathRenderer } from '../common/MathRenderer';
import { PrintableStudentResultCard } from './PrintableStudentResultCard';

interface StudentResultPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNisn?: string;
  initialToken?: string;
}

export const StudentResultPortalModal: React.FC<StudentResultPortalModalProps> = ({
  isOpen,
  onClose,
  initialNisn = '',
  initialToken = '',
}) => {
  const [nisn, setNisn] = useState<string>(initialNisn);
  const [token, setToken] = useState<string>(initialToken);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [examResults, setExamResults] = useState<StudentPublicExamSummary[]>([]);
  const [selectedExam, setSelectedExam] = useState<StudentPublicExamSummary | null>(null);

  // Full detailed answers sheet states
  const [isAnswersOpen, setIsAnswersOpen] = useState<boolean>(false);
  const [answersDetail, setAnswersDetail] = useState<{
    studentInfo: { name: string; nisn: string; className: string; score?: number };
    items: StudentAnswerDetailItem[];
    summary: { totalQuestions: number; answeredCount: number; correctCount: number; wrongCount: number; doubtCount: number };
  } | null>(null);
  const [isAnswersLoading, setIsAnswersLoading] = useState<boolean>(false);

  // Printable SKHU card modal
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSearch = async (searchNisn?: string, searchToken?: string) => {
    const targetNisn = (searchNisn !== undefined ? searchNisn : nisn).trim();
    const targetToken = (searchToken !== undefined ? searchToken : token).trim();

    if (!targetNisn) return;

    setIsLoading(true);
    setHasSearched(true);
    setSelectedExam(null);
    setIsAnswersOpen(false);

    try {
      const results = await examService.lookupStudentExamHistory(targetNisn, targetToken || undefined);
      setExamResults(results);
      if (results.length > 0) {
        setSelectedExam(results[0]);
      }
    } catch (err) {
      console.warn('Student portal search error:', err);
      setExamResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setNisn('0081234567');
    setToken('');
    handleSearch('0081234567', '');
  };

  const handleLoadAnswersDetail = async (exam: StudentPublicExamSummary) => {
    setIsAnswersLoading(true);
    setIsAnswersOpen(true);
    try {
      const details = await examService.getStudentAnswersDetail(exam.examId, exam.nisn, exam.sessionId);
      setAnswersDetail(details);
    } catch (err) {
      console.warn('Load answers detail error:', err);
    } finally {
      setIsAnswersLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Portal Cek Hasil Ujian Siswa"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Portal Cek Hasil Ujian Mandiri</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Siswa & Orang Tua
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Periksa nilai resmi, rincian skor objektif vs uraian, dan evaluasi guru
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup portal cek hasil"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Search Box Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-inner">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* NIS / NISN Input */}
                <div className="sm:col-span-6 space-y-1.5">
                  <label htmlFor="portal-nisn" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Nomor Induk Siswa Nasional (NISN / NIS)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="portal-nisn"
                      type="text"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      placeholder="Masukkan 10 digit NISN siswa..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-mono font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Token Ujian (Optional) */}
                <div className="sm:col-span-3 space-y-1.5">
                  <label htmlFor="portal-token" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Token Ujian (Opsional)</span>
                  </label>
                  <input
                    id="portal-token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="Contoh: 489210"
                    maxLength={10}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-mono font-bold tracking-wider uppercase"
                  />
                </div>

                {/* Search Button */}
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={isLoading || !nisn.trim()}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Mencari Data...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Periksa Nilai</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Demo Shortcut & Tips */}
              <div className="flex flex-wrap items-center justify-between pt-1 text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Masukkan NISN yang terdaftar saat Anda mengerjakan ujian di kelas.</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 font-medium text-[11px] transition flex items-center gap-1 cursor-pointer border border-blue-500/20"
                >
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Coba Demo Siswa (NISN: 0081234567)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Results State */}
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Menghubungkan ke Pusat Rekap Asesmen Sekolah...</p>
              <p className="text-xs text-slate-500">Mencocokkan NISN dan mengumpulkan data koreksi guru...</p>
            </div>
          ) : hasSearched && examResults.length === 0 ? (
            <div className="py-12 text-center space-y-4 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 p-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">Data Hasil Ujian Tidak Ditemukan</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tidak ditemukan rekaman ujian untuk NISN <span className="font-mono text-amber-400 font-bold">"{nisn}"</span>{token ? <span> dengan PIN Token Modul <span className="font-mono text-amber-400 font-bold">"{token}"</span></span> : ''}. Pastikan nomor NISN dan PIN Token Modul ujian sudah sesuai atau tanyakan kepada guru pengawas apakah sesi ujian Anda sudah selesai dikumpulkan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <span>Lihat Contoh Simulasi Nilai Siswa</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : hasSearched && selectedExam ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* If multiple exams found, show tabs */}
              {examResults.length > 1 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    Pilih Mata Pelajaran / Asesmen ({examResults.length} Ujian Ditemukan):
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {examResults.map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedExam(ex);
                          setIsAnswersOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
                          selectedExam.sessionId === ex.sessionId
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700'
                        }`}
                      >
                        <span>{ex.subject}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/25">
                          {ex.percentage}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Identity Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
                    {selectedExam.studentName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{selectedExam.studentName}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-blue-300 font-semibold">NISN: {selectedExam.nisn}</span>
                      <span>•</span>
                      <span className="text-slate-300">{selectedExam.className}</span>
                      <span>•</span>
                      <span className="text-slate-400">{selectedExam.schoolName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsPrinting(true)}
                    className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cetak Rapor / SKHU</span>
                  </button>
                </div>
              </div>

              {/* Main Score & Metrics Hero Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Total Score Circle / Card */}
                <div className="md:col-span-5 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {selectedExam.subject}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        selectedExam.percentage >= 75
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {selectedExam.percentage >= 75 ? 'LULUS (TUNTAS)' : 'REMEDIAL'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 mt-1">{selectedExam.examTitle}</h4>
                  </div>

                  <div className="my-5 flex items-center gap-4">
                    <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg font-mono font-black ${
                      selectedExam.percentage >= 75
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-900/40'
                        : 'bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-amber-900/40'
                    }`}>
                      <span className="text-3xl leading-none">{selectedExam.percentage}</span>
                      <span className="text-[10px] text-emerald-100 font-sans font-medium mt-0.5">/ 100</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Skor Total: <strong>{selectedExam.score}</strong> / {selectedExam.maxScore} Poin</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Dikumpulkan: {selectedExam.submittedAt}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <School className="w-3.5 h-3.5 text-slate-500" />
                        <span>Guru: {selectedExam.teacherName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Standar Ketuntasan (KKM):</span>
                    <span className="font-bold text-slate-200 font-mono">75.00</span>
                  </div>
                </div>

                {/* Score Breakdown (3 Pillars) */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Objektif (PG & B/S) */}
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black">
                        PG
                      </div>
                      <h5 className="text-xs font-bold text-slate-300">Pilihan Ganda & B/S</h5>
                      <p className="text-[10px] text-slate-500 leading-tight">Penilaian Otomatis Sistem</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-700/40">
                      <div className="text-lg font-black text-blue-400 font-mono">
                        {selectedExam.breakdown.objectiveScore}
                        <span className="text-xs text-slate-500 font-normal"> / {selectedExam.breakdown.objectiveMax}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">✓ Selesai Dinilai</span>
                    </div>
                  </div>

                  {/* 2. Isian Singkat */}
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black">
                        IS
                      </div>
                      <h5 className="text-xs font-bold text-slate-300">Isian Singkat</h5>
                      <p className="text-[10px] text-slate-500 leading-tight">Pencocokan Kata Kunci</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-700/40">
                      <div className="text-lg font-black text-indigo-400 font-mono">
                        {selectedExam.breakdown.shortAnswerScore}
                        <span className="text-xs text-slate-500 font-normal"> / {selectedExam.breakdown.shortAnswerMax}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">✓ Selesai Dinilai</span>
                    </div>
                  </div>

                  {/* 3. Soal Uraian / Esai */}
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">
                        ES
                      </div>
                      <h5 className="text-xs font-bold text-slate-300">Uraian / Esai</h5>
                      <p className="text-[10px] text-slate-500 leading-tight">Analisis AI & Koreksi Guru</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-700/40">
                      <div className="text-lg font-black text-purple-400 font-mono">
                        {selectedExam.breakdown.essayScore}
                        <span className="text-xs text-slate-500 font-normal"> / {selectedExam.breakdown.essayMax}</span>
                      </div>
                      {selectedExam.breakdown.hasPendingEssays ? (
                        <span className="text-[10px] text-amber-400 font-medium animate-pulse">⏳ Menunggu Guru</span>
                      ) : (
                        <span className="text-[10px] text-purple-400 font-medium">✓ Dinilai Guru</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Teacher Essay Feedback Callout */}
              {selectedExam.hasEssayFeedback && selectedExam.essayFeedbacks && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Catatan & Masukan Guru untuk Jawaban Uraian Anda:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {selectedExam.essayFeedbacks.map((fb, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-purple-200 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span>Soal Uraian Nomor {fb.questionNumber}</span>
                          </span>
                          <span className="font-mono text-purple-300 text-[11px] bg-purple-500/20 px-2 py-0.5 rounded-md">
                            Skor: {fb.scoreEarned} / {fb.maxPoints} Poin
                          </span>
                        </div>
                        <p className="text-slate-300 italic pl-5 leading-relaxed">"{fb.feedback}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Open Full Questions Review */}
              <div className="pt-2">
                {!isAnswersOpen ? (
                  <button
                    type="button"
                    onClick={() => handleLoadAnswersDetail(selectedExam)}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                  >
                    <BookOpen className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                    <span>Buka Rincian Lembar Jawaban & Pembahasan Lengkap</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
                  </button>
                ) : (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <h4 className="text-sm font-bold text-white">Lembar Jawaban Lengkap Per Butir Soal</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAnswersOpen(false)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Sembunyikan
                      </button>
                    </div>

                    {isAnswersLoading ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Memuat rincian butir soal...</span>
                      </div>
                    ) : answersDetail ? (
                      <div className="space-y-3">
                        {answersDetail.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
                              item.isCorrect
                                ? 'bg-emerald-950/15 border-emerald-500/25 text-slate-200'
                                : item.type === 'essay' && !item.isGraded
                                ? 'bg-amber-950/15 border-amber-500/25 text-slate-200'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono">
                                  {item.number}
                                </span>
                                <span className="capitalize text-[11px] text-slate-400">
                                  Tipe: {item.type.replace('_', ' ')}
                                </span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                  {item.pointsEarned} / {item.maxPoints} Poin
                                </span>
                                {item.isCorrect ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Benar
                                  </span>
                                ) : item.type === 'essay' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    {item.isGraded ? 'Dinilai' : 'Menunggu Koreksi'}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    Salah
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Question Text */}
                            <div className="text-slate-200 leading-relaxed">
                              <MathRenderer text={item.questionText} />
                              {item.latexFormula && (
                                <div className="mt-1 p-2 bg-slate-900 rounded-lg">
                                  <MathRenderer math={item.latexFormula} block />
                                </div>
                              )}
                            </div>

                            {/* Student Answer */}
                            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/50 space-y-1">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Jawaban Siswa:
                              </span>
                              <div className="font-medium text-slate-200">
                                {item.type === 'multiple_choice' || item.type === 'true_false' ? (
                                  <span>{item.selectedOptionLabel ? `(${item.selectedOptionLabel}) ${item.selectedOptionText || ''}` : '(Tidak Dijawab)'}</span>
                                ) : (
                                  <span>{item.answerText || '(Tidak Dijawab)'}</span>
                                )}
                              </div>
                            </div>

                            {/* Teacher Feedback on Essay */}
                            {item.teacherFeedback && (
                              <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-200 text-[11px] italic">
                                <strong>Feedback Guru:</strong> "{item.teacherFeedback}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Initial Guide Banner */
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <Search className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-white">Masukkan NISN Siswa untuk Memulai</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gunakan portal ini untuk melihat rekapitulasi nilai akhir, perolehan nilai tiap butir soal, status kelulusan, dan masukan dari guru pengampu mata pelajaran.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sistem Asesmen Sekolah Mandiri UjianPintar Cloud</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Printable SKHU Digital Modal */}
      {isPrinting && selectedExam && (
        <PrintableStudentResultCard
          summary={selectedExam}
          onClose={() => setIsPrinting(false)}
        />
      )}
    </div>
  );
};

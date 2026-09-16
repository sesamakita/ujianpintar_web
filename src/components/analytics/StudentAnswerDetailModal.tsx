import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Award,
  User,
  BookOpen,
  Printer,
  Loader2,
  Filter,
} from 'lucide-react';
import { examService } from '../../services/examService';
import type { GradeRecord, StudentAnswerDetailItem } from '../../types/exam';
import { MathRenderer } from '../common/MathRenderer';

interface StudentAnswerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: GradeRecord | null;
  examTitle?: string;
  examId?: string;
}

type FilterType = 'all' | 'correct' | 'wrong' | 'doubt' | 'unanswered';

export const StudentAnswerDetailModal: React.FC<StudentAnswerDetailModalProps> = ({
  isOpen,
  onClose,
  grade,
  examTitle,
  examId,
}) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StudentAnswerDetailItem[]>([]);
  const [summary, setSummary] = useState({
    totalQuestions: 0,
    answeredCount: 0,
    correctCount: 0,
    wrongCount: 0,
    doubtCount: 0,
  });
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!isOpen || !grade) {
      setItems([]);
      setLoading(true);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const targetExamId = grade.examId || examId;
    const targetSessionId = grade.sessionId;

    examService
      .getStudentAnswersDetail(targetExamId, grade.nisn, targetSessionId)
      .then((res) => {
        if (isMounted) {
          setItems(res.items);
          setSummary(res.summary);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading student answers:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, grade, examId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const isAnswered = !!(item.selectedOptionId || (item.answerText && item.answerText.trim().length > 0));
      if (activeFilter === 'correct') return item.isCorrect;
      if (activeFilter === 'wrong') return isAnswered && !item.isCorrect;
      if (activeFilter === 'doubt') return item.isDoubt;
      if (activeFilter === 'unanswered') return !isAnswered;
      return true;
    });
  }, [items, activeFilter]);

  const unansweredCount = Math.max(0, summary.totalQuestions - summary.answeredCount);

  if (!isOpen || !grade) return null;

  const isPassed = grade.status === 'Lulus';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white tracking-tight flex items-center gap-2">
                <span>Lembar Hasil & Jawaban Siswa</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  NISN: {grade.nisn}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {examTitle || 'Paket Ujian'} • {grade.className || 'Kelas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-display font-medium border border-slate-700 transition-colors cursor-pointer print:hidden"
              title="Cetak Lembar Jawaban"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Student Profile & Score KPI Banner */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Student Info */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-display font-semibold text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Nama Peserta
              </span>
              <p className="font-display font-bold text-slate-900 text-sm truncate mt-0.5" title={grade.name}>
                {grade.name}
              </p>
              <span className="text-[11px] text-slate-500 font-mono">{grade.className}</span>
            </div>

            {/* Final Score */}
            <div className={`p-3 rounded-xl border shadow-2xs ${
              isPassed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <span className="text-[11px] font-display font-semibold text-slate-600 flex items-center gap-1">
                <Award className={`w-3 h-3 ${isPassed ? 'text-emerald-600' : 'text-amber-600'}`} />
                Nilai Akhir
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`font-mono font-black text-xl ${isPassed ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {grade.score}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ {grade.maxScore}</span>
                <span className={`ml-auto text-[10px] font-display font-bold px-1.5 py-0.5 rounded ${
                  isPassed ? 'bg-emerald-200/60 text-emerald-800' : 'bg-amber-200/60 text-amber-800'
                }`}>
                  {grade.status}
                </span>
              </div>
            </div>

            {/* Time Spent */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-display font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Waktu Pengerjaan
              </span>
              <p className="font-display font-bold text-slate-900 text-sm mt-0.5">
                {grade.timeSpentMinutes} Menit
              </p>
              <span className="text-[10px] text-slate-400">Selesai: {grade.submittedAt}</span>
            </div>

            {/* Violations */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-display font-semibold text-slate-500 flex items-center gap-1">
                <AlertTriangle className={`w-3 h-3 ${grade.tabViolations > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
                Integritas Layar
              </span>
              <p className={`font-display font-bold text-sm mt-0.5 ${
                grade.tabViolations > 0 ? `${grade.tabViolations}x Pelanggaran` : 'Tertib (0)'
              }`}>
                {grade.tabViolations > 0 ? `${grade.tabViolations}x Pelanggaran` : 'Tertib (0)'}
              </p>
              <span className="text-[10px] text-slate-400">Peralihan aplikasi</span>
            </div>
          </div>

          {/* Filter Pills & Summary Breakdown */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-display font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('correct')}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Benar ({summary.correctCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('wrong')}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'wrong'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <XCircle className="w-3 h-3" />
                Salah ({summary.wrongCount})
              </button>
              {summary.doubtCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('doubt')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'doubt'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Ragu ({summary.doubtCount})
                </button>
              )}
              {unansweredCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('unanswered')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'unanswered'
                      ? 'bg-slate-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <HelpCircle className="w-3 h-3" />
                  Kosong ({unansweredCount})
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-display">
              Menampilkan <span className="font-bold text-slate-800">{filteredItems.length}</span> dari {items.length} butir soal
            </div>
          </div>
        </div>

        {/* Content Body: Question List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100/50">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-display font-semibold text-slate-700">Memuat rincian lembar jawaban...</p>
              <p className="text-xs text-slate-400 mt-1">Mengambil respon dari database ujian</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-display font-bold text-slate-800 text-base">Belum Ada Lembar Jawaban Terdata</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Siswa belum memiliki rekaman jawaban di database untuk ujian ini atau sesi pengerjaan belum tersinkronisasi.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-display font-semibold text-slate-700">Tidak ada butir soal pada filter ini</p>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="mt-2 text-xs font-display font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Tampilkan semua soal
              </button>
            </div>
          ) : (
            filteredItems.map((q) => {
              const isAnswered = !!(q.selectedOptionId || (q.answerText && q.answerText.trim().length > 0));

              return (
                <div
                  key={q.questionId}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all ${
                    !isAnswered
                      ? 'border-slate-200'
                      : q.isCorrect
                      ? 'border-emerald-200/90 shadow-emerald-50/50'
                      : 'border-rose-200/90 shadow-rose-50/50'
                  }`}
                >
                  {/* Question Header Status */}
                  <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                        {q.number}
                      </span>
                      <span className="text-xs font-display font-bold text-slate-700">
                        {q.type === 'short_answer' ? 'Isian Singkat' : 'Pilihan Ganda'}
                      </span>
                      {q.isDoubt && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Ragu-Ragu
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isAnswered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-display font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          Tidak Dijawab
                        </span>
                      ) : q.isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-display font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Jawaban Benar (+{q.pointsEarned} Poin)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-display font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Jawaban Salah (0/{q.maxPoints} Poin)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text & Math */}
                  <div className="text-slate-900 text-sm font-sans leading-relaxed mb-4">
                    <MathRenderer text={q.questionText} />
                    {q.latexFormula && (
                      <div className="my-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto">
                        <MathRenderer math={q.latexFormula} block />
                      </div>
                    )}
                    {q.imageUrl && (
                      <div className="my-2.5">
                        <img
                          src={q.imageUrl}
                          alt="Lampiran Soal"
                          className="max-h-60 rounded-xl border border-slate-200 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Multiple Choice Options List */}
                  {q.type !== 'short_answer' && q.options && q.options.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {q.options.map((opt) => {
                        const isStudentChoice = q.selectedOptionId === opt.id;
                        const isCorrectKey = q.correctOptionId === opt.id;

                        let cardStyle = 'bg-slate-50/80 border-slate-200 text-slate-700';
                        let badge = null;

                        if (isStudentChoice && isCorrectKey) {
                          cardStyle = 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-medium shadow-2xs';
                          badge = (
                            <span className="inline-flex items-center gap-1 text-[11px] font-display font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Pilihan Siswa (Benar)
                            </span>
                          );
                        } else if (isStudentChoice && !isCorrectKey) {
                          cardStyle = 'bg-rose-50/90 border-rose-300 text-rose-950 font-medium shadow-2xs';
                          badge = (
                            <span className="inline-flex items-center gap-1 text-[11px] font-display font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              Pilihan Siswa (Salah)
                            </span>
                          );
                        } else if (isCorrectKey) {
                          cardStyle = 'bg-emerald-50/40 border-emerald-300/70 text-emerald-900 border-dashed';
                          badge = (
                            <span className="inline-flex items-center gap-1 text-[11px] font-display font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Kunci Jawaban Benar
                            </span>
                          );
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs sm:text-sm transition-colors ${cardStyle}`}
                          >
                            <div className="flex items-start gap-2.5 flex-1">
                              <span
                                className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                                  isStudentChoice
                                    ? isCorrectKey
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-rose-600 text-white'
                                    : isCorrectKey
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <div className="pt-0.5 flex-1 leading-snug">
                                <MathRenderer text={opt.text} />
                              </div>
                            </div>
                            {badge && <div className="shrink-0 pt-0.5">{badge}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer Input Comparison */}
                  {q.type === 'short_answer' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className={`p-3.5 rounded-xl border ${
                        !isAnswered
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : q.isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}>
                        <div className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                          <span>Jawaban Siswa:</span>
                          {isAnswered && (
                            q.isCorrect ? (
                              <span className="text-emerald-700 flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Benar
                              </span>
                            ) : (
                              <span className="text-rose-700 flex items-center gap-1 font-bold">
                                <XCircle className="w-3 h-3" /> Salah
                              </span>
                            )
                          )}
                        </div>
                        <p className="font-mono text-sm font-bold">
                          {q.answerText || <span className="italic font-normal text-slate-400">Tidak ada jawaban</span>}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/50 text-emerald-950">
                        <div className="text-[11px] font-display font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Kunci Jawaban Resmi:</span>
                        </div>
                        <p className="font-mono text-sm font-bold text-emerald-900">
                          {q.correctAnswerText || '-'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Nilai dihitung otomatis berdasarkan kunci jawaban sistem CBT
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-display font-bold transition-colors cursor-pointer"
          >
            Tutup Lembar Jawaban
          </button>
        </div>
      </div>
    </div>
  );
};

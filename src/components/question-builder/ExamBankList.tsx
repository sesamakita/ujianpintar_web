import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Plus,
  Copy,
  Check,
  Tv,
  RefreshCw,
  Trash2,
  CopyPlus,
  BookOpen,
  Clock,
  Search,
  Activity,
  Layers,
  FileText,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  Calendar,
  Info,
  X
} from 'lucide-react';
import type { ExamSettings } from '../../types/exam';
import type { TeacherSubscription, MonthlySessionUsage } from '../../types/subscription';
import { examService, generateUUID } from '../../services/examService';
import { subscriptionService } from '../../services/subscriptionService';
import { supabase } from '../../lib/supabase';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatClassName } from '../../utils/formatters';

interface ExamBankListProps {
  exams: ExamSettings[];
  activeExamId: string;
  subscription?: TeacherSubscription;
  isLoading?: boolean;
  onOpenUpgradeModal?: (title?: string, desc?: string) => void;
  onSelectExamForEdit: (exam: ExamSettings) => void;
  onSetActiveExamForProctoring: (exam: ExamSettings) => void;
  onRefreshExams: () => Promise<void>;
  onCreateNewExam: (newExam: ExamSettings) => void;
  onDeleteExam: (examId: string) => Promise<void>;
  onToggleExamAccess?: (examId: string, newStatus: 'published' | 'closed') => Promise<void>;
  onRequireCompleteProfile?: (action: () => void, promptReason?: { title?: string; description?: string }) => void;
}

export const ExamBankList: React.FC<ExamBankListProps> = ({
  exams,
  activeExamId,
  subscription,
  isLoading = false,
  onOpenUpgradeModal,
  onSelectExamForEdit,
  onSetActiveExamForProctoring,
  onRefreshExams,
  onCreateNewExam,
  onDeleteExam,
  onToggleExamAccess,
  onRequireCompleteProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [copiedProctorPinId, setCopiedProctorPinId] = useState<string | null>(null);
  const [projectorExam, setProjectorExam] = useState<ExamSettings | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isRegeneratingId, setIsRegeneratingId] = useState<string | null>(null);
  const [isRegeneratingProctorPinId, setIsRegeneratingProctorPinId] = useState<string | null>(null);

  // New Exam Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('Kelas X (Fase E)');
  const [newDuration, setNewDuration] = useState('60');
  const [newPin, setNewPin] = useState(examService.generateRandomToken());
  const [newProctorPin, setNewProctorPin] = useState(examService.generateRandomToken());

  // Duplicate for specific class modal state
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateTargetExam, setDuplicateTargetExam] = useState<ExamSettings | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState('');
  const [duplicateGradeLevel, setDuplicateGradeLevel] = useState('Kelas X (Fase E)');
  const [duplicatePin, setDuplicatePin] = useState('');
  const [duplicateProctorPin, setDuplicateProctorPin] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Modern UI Delete Confirmation State
  const [deleteTargetExam, setDeleteTargetExam] = useState<ExamSettings | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Monthly Session Quota Usage State (>10 students per class & date)
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlySessionUsage | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [showUsageDetailModal, setShowUsageDetailModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      try {
        setIsUsageLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const usage = await subscriptionService.getTeacherMonthlySessionUsage(user.id);
          if (isMounted) {
            setMonthlyUsage(usage);
          }
        }
      } catch (err) {
        console.warn('Failed to load monthly session usage:', err);
      } finally {
        if (isMounted) {
          setIsUsageLoading(false);
        }
      }
    };

    fetchUsage();
    return () => {
      isMounted = false;
    };
  }, [exams]);

  const handleCopyPin = (token: string, examId: string) => {
    const doCopy = () => {
      navigator.clipboard.writeText(token);
      setCopiedTokenId(examId);
      setTimeout(() => setCopiedTokenId(null), 2000);
    };

    if (onRequireCompleteProfile) {
      onRequireCompleteProfile(doCopy, {
        title: 'Lengkapi Data Sekolah & WhatsApp',
        description: 'Sebelum membagikan token ujian ke siswa, mohon lengkapi nama sekolah dan nomor WhatsApp Anda agar kop ujian resmi dan identitas pengajar tercantum valid.',
      });
    } else {
      doCopy();
    }
  };

  const handleCopyProctorPin = (proctorPin: string, examId: string) => {
    const doCopy = () => {
      navigator.clipboard.writeText(proctorPin);
      setCopiedProctorPinId(examId);
      setTimeout(() => setCopiedProctorPinId(null), 2000);
    };

    if (onRequireCompleteProfile) {
      onRequireCompleteProfile(doCopy, {
        title: 'Lengkapi Data Sekolah & WhatsApp',
        description: 'Sebelum membagikan PIN pengawas ruang, mohon lengkapi nama sekolah dan nomor WhatsApp Anda.',
      });
    } else {
      doCopy();
    }
  };

  const [regenerateTarget, setRegenerateTarget] = useState<{
    exam: ExamSettings;
    type: 'student_token' | 'proctor_pin';
  } | null>(null);
  const [isRegeneratingLoading, setIsRegeneratingLoading] = useState(false);

  const handleOpenRegenerateModal = (e: React.MouseEvent, exam: ExamSettings, type: 'student_token' | 'proctor_pin') => {
    e.stopPropagation();
    setRegenerateTarget({ exam, type });
  };

  const handleConfirmRegenerate = async () => {
    if (!regenerateTarget) return;
    setIsRegeneratingLoading(true);
    if (regenerateTarget.type === 'student_token') {
      setIsRegeneratingId(regenerateTarget.exam.id);
      await examService.regenerateExamToken(regenerateTarget.exam.id);
      await onRefreshExams();
      setIsRegeneratingId(null);
    } else {
      setIsRegeneratingProctorPinId(regenerateTarget.exam.id);
      await examService.regenerateProctorPin(regenerateTarget.exam.id);
      await onRefreshExams();
      setIsRegeneratingProctorPinId(null);
    }
    setIsRegeneratingLoading(false);
    setRegenerateTarget(null);
  };

  const handleOpenDuplicateModal = (e: React.MouseEvent, exam: ExamSettings) => {
    e.stopPropagation();
    const isFree = subscription?.tier === 'free';
    const isPro = subscription?.tier === 'pro';
    const maxExams = subscription?.maxExamsPerMonth ?? (isFree ? 10 : isPro ? 20 : -1);
    if (maxExams > 0 && exams.length >= maxExams) {
      if (onOpenUpgradeModal) {
        if (isFree) {
          onOpenUpgradeModal(
            'Batas 10 Paket Soal Tercapai',
            `Akun Guru Basic dibatasi maksimal ${maxExams} paket soal aktif. Tingkatkan ke Guru PRO untuk kapasitas hingga 20 modul atau Lisensi Sekolah tanpa batas.`
          );
        } else {
          onOpenUpgradeModal(
            'Batas 20 Modul PRO Tercapai',
            `Akun Guru PRO Anda telah mencapai batas maksimal ${maxExams} modul soal aktif. Hapus beberapa paket lama atau tingkatkan ke Lisensi Sekolah untuk kapasitas tanpa batas.`
          );
        }
      }
      return;
    }
    setDuplicateTargetExam(exam);
    setDuplicateTitle(`${exam.title} (Kelas Baru)`);
    setDuplicateGradeLevel(exam.gradeLevel || 'Kelas X (Fase E)');
    setDuplicatePin(examService.generateRandomToken());
    setDuplicateProctorPin(examService.generateRandomToken());
    setDuplicateError(null);
    setIsDuplicateModalOpen(true);
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateTargetExam) return;
    if (!duplicateTitle.trim()) {
      setDuplicateError('Harap isi judul paket ujian duplikasi.');
      return;
    }
    setIsDuplicating(true);
    setDuplicateError(null);
    const cleanGrade = formatClassName(duplicateGradeLevel, false).trim() || 'X';
    const res = await examService.duplicateExam(
      duplicateTargetExam.id,
      duplicateTitle.trim(),
      cleanGrade,
      duplicatePin.trim(),
      duplicateProctorPin.trim()
    );
    setIsDuplicating(false);
    if (res.success) {
      await onRefreshExams();
      setIsDuplicateModalOpen(false);
      setDuplicateTargetExam(null);
    } else {
      setDuplicateError(res.error || 'Gagal menduplikasi paket ujian.');
    }
  };

  const handleDelete = (e: React.MouseEvent, exam: ExamSettings) => {
    e.stopPropagation();
    setDeleteTargetExam(exam);
  };

  const handleConfirmDeleteTarget = async () => {
    if (!deleteTargetExam) return;
    setIsDeletingId(deleteTargetExam.id);
    await onDeleteExam(deleteTargetExam.id);
    setIsDeletingId(null);
    setDeleteTargetExam(null);
  };

  const [togglingAccessId, setTogglingAccessId] = useState<string | null>(null);

  const handleToggleAccess = async (e: React.MouseEvent, exam: ExamSettings) => {
    e.stopPropagation();
    const currentIsAccessible = exam.status !== 'closed';
    const newStatus: 'published' | 'closed' = currentIsAccessible ? 'closed' : 'published';
    setTogglingAccessId(exam.id);
    try {
      if (onToggleExamAccess) {
        await onToggleExamAccess(exam.id, newStatus);
      } else {
        await examService.updateExamStatus(exam.id, newStatus);
        await onRefreshExams();
      }
    } catch (err) {
      console.warn('handleToggleAccess error:', err);
    } finally {
      setTogglingAccessId(null);
    }
  };

  const handleOpenCreateModal = () => {
    const isFree = subscription?.tier === 'free';
    const isPro = subscription?.tier === 'pro';
    const maxExams = subscription?.maxExamsPerMonth ?? (isFree ? 10 : isPro ? 20 : -1);
    if (maxExams > 0 && exams.length >= maxExams) {
      if (onOpenUpgradeModal) {
        if (isFree) {
          onOpenUpgradeModal(
            'Batas 10 Paket Soal Tercapai',
            `Akun Guru Basic dibatasi maksimal ${maxExams} paket soal aktif. Tingkatkan ke Guru PRO untuk kapasitas hingga 20 modul atau Lisensi Sekolah tanpa batas.`
          );
        } else {
          onOpenUpgradeModal(
            'Batas 20 Modul PRO Tercapai',
            `Akun Guru PRO Anda telah mencapai batas maksimal ${maxExams} modul soal aktif. Hapus beberapa paket lama atau tingkatkan ke Lisensi Sekolah untuk kapasitas tanpa batas.`
          );
        }
      }
      return;
    }
    setNewTitle('');
    setNewSubject('');
    setNewGradeLevel('Kelas X (Fase E)');
    setNewDuration('60');
    setNewPin(examService.generateRandomToken());
    setNewProctorPin(examService.generateRandomToken());
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = () => {
    if (!newTitle.trim()) {
      setCreateError('Harap isi judul bank soal.');
      return;
    }

    const created: ExamSettings = {
      id: generateUUID(),
      title: newTitle.trim(),
      subject: newSubject.trim() || 'Mata Pelajaran',
      gradeLevel: formatClassName(newGradeLevel, false).trim() || 'X',
      durationMinutes: parseInt(newDuration, 10) || 60,
      scheduleDate: new Date().toISOString().split('T')[0],
      scheduleTime: '08:00',
      token: newPin || examService.generateRandomToken(),
      proctorPin: newProctorPin || examService.generateRandomToken(),
      status: 'published',
      questionCount: 0,
      totalPoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      antiCheat: {
        detectTabSwitch: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        fullScreenLock: true,
        proctorPin: newProctorPin || examService.generateRandomToken(),
      },
    };

    onCreateNewExam(created);
    setIsCreateModalOpen(false);
  };

  // Filter exams
  const filteredExams = exams.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.subject || '').toLowerCase().includes(q) ||
      (e.gradeLevel || '').toLowerCase().includes(q) ||
      (e.token || '').includes(q)
    );
  });

  const totalQuestionsSum = exams.reduce((sum, e) => sum + (e.questionCount || 0), 0);

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto font-sans">
      {/* Top Banner & Stats Overview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 text-base tracking-tight">
                Katalog Bank Soal & PIN Akses
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Kelola paket asesmen, distribusikan PIN ujian ke siswa, dan pantau sesi pengerjaan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quota Badge Indicator */}
          {subscription?.tier === 'free' ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUsageDetailModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl text-xs transition-colors cursor-pointer group"
                title="Klik untuk melihat rincian sesi ujian bulan ini"
              >
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-semibold text-amber-900">
                  {monthlyUsage?.usedSessions ?? 0}/3 Sesi Ujian Bulan Ini
                </span>
                <span className="text-[10px] text-amber-700 underline font-bold ml-0.5 group-hover:text-amber-900">
                  (Rincian)
                </span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-700">
                  {exams.length}/10 Paket Soal
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenUpgradeModal?.('Upgrade ke Guru PRO', 'Buka kapasitas hingga 20 modul, kapasitas siswa tak terhingga, dan fitur raport otomatis.')}
                className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5 text-xs ml-1"
              >
                <span>Upgrade PRO</span>
                <span>→</span>
              </button>
            </div>
          ) : subscription?.tier === 'pro' ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-blue-800">
                  {exams.length}/20 Modul PRO
                </span>
              </div>
              <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold font-mono text-amber-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>GURU PRO</span>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold font-mono text-indigo-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>LISENSI SEKOLAH (UNLIMITED)</span>
            </div>
          )}

          <button type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-display font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Bank Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Monthly Session Quota Limit Alert Banner for Free Tier */}
      {subscription?.tier === 'free' && monthlyUsage && monthlyUsage.usedSessions >= 3 && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-amber-900">Batas Kuota Sesi Ujian Bulan Ini Telah Tercapai (3/3 Sesi): </span>
              <span className="text-amber-800 font-sans">
                Akun Guru Basic telah menyelenggarakan 3 sesi ujian resmi (&gt;10 siswa) bulan ini. Sesi kelas baru berikutnya dibatasi maksimal 10 siswa untuk simulasi/remedial. Tingkatkan ke <strong>Guru PRO</strong> untuk menyelenggarakan ujian tanpa batas sesi dan siswa unlimited.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenUpgradeModal?.('Upgrade ke Guru PRO', 'Buka kuota sesi ujian tanpa batas, kapasitas siswa tak terhingga, dan fitur analisis nilai otomatis.')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold font-display flex-shrink-0 cursor-pointer shadow-xs transition-colors whitespace-nowrap"
          >
            Upgrade PRO
          </button>
        </div>
      )}

      {/* Main Bank Soal List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading && exams.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-slate-800 text-sm">
                Memuat Katalog Bank Soal & PIN Akses...
              </h3>
              <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
                Sinkronisasi modul ujian dan butir soal dari database sekolah.
              </p>
            </div>
            {/* Shimmer skeleton bars */}
            <div className="max-w-md mx-auto space-y-2.5 pt-2">
              <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-3/4 mx-auto" />
              <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-1/2 mx-auto" />
            </div>
          </div>
        ) : filteredExams.length === 0 && !searchQuery ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-slate-800 text-base">
              Belum Ada Bank Soal
            </h3>
            <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
              Mulai dengan membuat paket bank soal pertama Anda untuk menghasilkan PIN token dan memasukkan butir soal.
            </p>
            <button type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-display font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Bank Soal Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 space-y-3.5">
            {/* 1. Multi-Class Access Control Banner (Full Width) */}
            <div className="p-3 bg-blue-50/90 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 text-blue-950 text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-display font-bold text-blue-900">Kontrol Akses Pengerjaan Mandiri per Paket: </span>
                <span className="text-blue-800 font-sans">
                  Gunakan switch <strong>toggle akses</strong> di bawah ikon aksi kelola untuk membuka atau menutup akses ujian tiap paket. Ketika akses <strong>ditutup</strong>, siswa tidak dapat mengakses paket soal di luar jam ujian walaupun telah memiliki Token PIN.
                </span>
              </div>
            </div>

            {/* 2. Search Input (Left) & 2 Stats Badges (Right) Row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              {/* Search Input Bar */}
              <div className="relative flex-1 min-w-[260px] flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none select-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan judul bank soal, mapel, atau PIN..."
                  className="w-full h-10 pl-10 pr-9 text-xs font-sans bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                    title="Hapus pencarian"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Stats Badges beside Search (Exact matching height h-10 & balanced alignment) */}
              <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap sm:flex-nowrap">
                <div className="h-10 px-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center gap-2.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium whitespace-nowrap">Total Bank Soal:</span>
                    <span className="font-display font-bold text-blue-900 whitespace-nowrap">
                      {exams.length} Paket
                    </span>
                  </div>
                </div>

                <div className="h-10 px-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center gap-2.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium whitespace-nowrap">Total Butir Soal:</span>
                    <span className="font-display font-bold text-indigo-950 whitespace-nowrap">
                      {totalQuestionsSum} Butir
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty Search Result State */}
            {filteredExams.length === 0 && searchQuery ? (
              <div className="p-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <h3 className="font-display font-bold text-slate-700 text-sm">
                  Tidak Ada Bank Soal yang Cocok
                </h3>
                <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
                  Tidak ditemukan paket bank soal dengan kata kunci "{searchQuery}". Coba kata kunci lain atau bersihkan pencarian.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-display font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Bank Soal & Mapel</th>
                  <th className="py-3 px-4">Jenjang & Waktu</th>
                  <th className="py-3 px-4">Soal & Skor</th>
                  <th className="py-3 px-4 min-w-[280px]">Kode Akses Siswa & PIN Pengawas</th>
                  <th className="py-3 px-4 text-center">Status Akses</th>
                  <th className="py-3 px-4 text-right min-w-[160px]">Aksi & Kontrol Akses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans">
                {filteredExams.map((exam) => {
                  const isActiveProctoring = exam.id === activeExamId;
                  const isAccessible = exam.status !== 'closed';
                  const isTogglingAccess = togglingAccessId === exam.id;
                  const isCopied = copiedTokenId === exam.id;
                  const isProctorCopied = copiedProctorPinId === exam.id;
                  const isRegenerating = isRegeneratingId === exam.id;
                  const isRegeneratingProctor = isRegeneratingProctorPinId === exam.id;
                  const isDeleting = isDeletingId === exam.id;
                  const proctorPinDisplay = exam.proctorPin || exam.antiCheat?.proctorPin || '-';

                  return (
                    <tr
                      key={exam.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isActiveProctoring ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* 1. Title & Subject */}
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="font-display font-bold text-slate-900 text-sm tracking-tight truncate" title={exam.title}>
                          {exam.title}
                        </div>
                        <div className="flex flex-col items-start gap-0.5 mt-1">
                          <span className="text-xs font-medium text-slate-900 font-sans">
                            {exam.subject || 'Mapel Umum'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {exam.scheduleDate || 'Hari ini'}
                          </span>
                        </div>
                      </td>

                      {/* 2. Grade & Duration */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 text-xs">
                          {exam.gradeLevel || 'Kelas X'}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-sans">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{exam.durationMinutes} Menit</span>
                        </div>
                      </td>

                      {/* 3. Questions & Points */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-mono font-bold text-xs border border-slate-200">
                            {exam.questionCount || 0} Soal
                          </span>
                          <span className="text-[11px] text-slate-500 font-sans">
                            ({exam.totalPoints || 0} Poin)
                          </span>
                        </div>
                      </td>

                      {/* 4. DUAL TOKEN & PIN COLUMN */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {/* Token Siswa */}
                          <div className="flex items-center justify-between gap-2 p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-500 px-1">
                                Siswa:
                              </span>
                              <span className="px-2 py-0.5 bg-slate-900 text-blue-400 rounded-lg font-mono font-black text-xs tracking-widest border border-slate-800">
                                {isRegenerating ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : exam.token}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyPin(exam.token, exam.id)}
                                className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                  isCopied
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                                title="Salin Token Siswa (6 Digit)"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setProjectorExam(exam)}
                                className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                                title="Tampilkan Token Siswa di Proyektor"
                              >
                                <Tv className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleOpenRegenerateModal(e, exam, 'student_token')}
                                className="p-1 rounded-md hover:bg-blue-100 text-slate-400 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
                                title="Acak Ulang Token Siswa"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* PIN Pengawas */}
                          <div className="flex items-center justify-between gap-2 p-1.5 bg-amber-50/50 rounded-xl border border-amber-200/70 shadow-2xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-amber-800 px-1 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" /> Pengawas:
                              </span>
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded-lg font-mono font-black text-xs tracking-widest border border-amber-800">
                                {isRegeneratingProctor ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : proctorPinDisplay}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyProctorPin(proctorPinDisplay, exam.id)}
                                className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                  isProctorCopied
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-white hover:bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                                title="Salin PIN Pengawas Ruang (6 Digit)"
                              >
                                {isProctorCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleOpenRegenerateModal(e, exam, 'proctor_pin')}
                                className="p-1 rounded-md bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                                title="Acak Ulang PIN Pengawas Ruang"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 5. Status Akses */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAccessible ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-display font-bold shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Akses Dibuka
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-display font-bold shadow-2xs">
                            <Lock className="w-3.5 h-3.5 text-rose-500" />
                            Akses Ditutup
                          </span>
                        )}
                        {isActiveProctoring && (
                          <span className="block text-[10px] text-blue-600 font-display font-semibold mt-1">
                            👁️ Sedang Dimonitor
                          </span>
                        )}
                      </td>

                      {/* 6. Action Buttons & Access Toggle Per Item */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {/* Baris Atas: Icon Aksi Kelola */}
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Questions */}
                          <button
                            type="button"
                            onClick={() => onSelectExamForEdit(exam)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                            title="Edit Butir Soal"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>

                          {/* Pantau Kelas Live Proctoring */}
                          <button
                            type="button"
                            onClick={() => onSetActiveExamForProctoring(exam)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                              isActiveProctoring
                                ? 'text-blue-600 bg-blue-50 border-blue-300 ring-2 ring-blue-400/50 shadow-xs'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-transparent hover:border-blue-200'
                            }`}
                            title={isActiveProctoring ? 'Sedang Dipantau (Klik untuk membuka Live Proctoring)' : 'Pantau Kelas Ini di Live Proctoring'}
                          >
                            <Activity className={`w-4 h-4 ${isActiveProctoring ? 'animate-pulse text-blue-600' : ''}`} />
                          </button>

                          {/* Duplicate for Class */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenDuplicateModal(e, exam)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                            title="Duplikasi Paket Soal untuk Kelas Lain"
                          >
                            <CopyPlus className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={(e) => handleDelete(e, exam)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            title="Hapus Bank Soal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Baris Bawah: Toggle Akses Per Item Bank Soal */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-end gap-2">
                          <span className={`text-[10px] font-display font-semibold transition-colors ${
                            isAccessible ? 'text-emerald-700 font-bold' : 'text-slate-400'
                          }`}>
                            {isAccessible ? 'Buka Akses' : 'Tutup Akses'}
                          </span>
                          <button
                            type="button"
                            disabled={isTogglingAccess}
                            onClick={(e) => handleToggleAccess(e, exam)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isAccessible ? 'bg-emerald-500' : 'bg-slate-300 hover:bg-slate-400'
                            } ${isTogglingAccess ? 'opacity-60 cursor-wait' : ''}`}
                            title={isAccessible ? 'Akses Ujian Terbuka (Klik untuk Menutup Akses)' : 'Akses Ujian Tertutup (Klik untuk Membuka Akses)'}
                          >
                            <span
                              className={`pointer-events-none inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isAccessible ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            >
                              {isTogglingAccess ? (
                                <Loader2 className="w-2.5 h-2.5 text-slate-500 animate-spin" />
                              ) : isAccessible ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              ) : (
                                <Lock className="w-2 h-2 text-slate-400" />
                              )}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Modal Buat Bank Soal Baru */}
      {isCreateModalOpen && (
        <div role="dialog" aria-modal="true" aria-label="Bank Soal" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base">Buat Bank Soal Baru</h3>
                  <p className="text-xs text-slate-500 font-sans">Setiap bank soal akan memiliki PIN Token unik otomatis</p>
                </div>
              </div>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label htmlFor="ebl-1" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Bank Soal / Nama Ujian *
                </label>
                <input id="ebl-1"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Penilaian Harian Matematika Wajib Bab 2"
                  className="w-full px-3.5 py-2 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ebl-2" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mata Pelajaran
                  </label>
                  <input id="ebl-2"
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Contoh: Matematika Wajib"
                    className="w-full px-3.5 py-2 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="ebl-3" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenjang / Kelas
                  </label>
                  <input id="ebl-3"
                    type="text"
                    value={newGradeLevel}
                    onChange={(e) => setNewGradeLevel(formatClassName(e.target.value, true))}
                    onBlur={() => setNewGradeLevel(formatClassName(newGradeLevel, false))}
                    placeholder="Contoh: XI Ips 1 atau X-A"
                    className="w-full px-3.5 py-2 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ebl-4" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Durasi Pengerjaan (Menit)
                  </label>
                  <input id="ebl-4"
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    min="5"
                    max="300"
                    className="w-full px-3.5 py-2 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="ebl-5" className="text-xs font-display font-bold text-slate-700 uppercase tracking-wider">
                      Token Siswa (6 Digit)
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPin(examService.generateRandomToken())}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Acak
                    </button>
                  </div>
                  <input id="ebl-5"
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={6}
                    className="w-full px-3.5 py-2 text-xs font-mono font-black text-center tracking-widest bg-slate-900 text-blue-400 border border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="ebl-6" className="text-xs font-display font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" /> PIN Guru Pengawas Ruang (6 Digit)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewProctorPin(examService.generateRandomToken())}
                    className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Acak PIN
                  </button>
                </div>
                <input id="ebl-6"
                  type="text"
                  value={newProctorPin}
                  onChange={(e) => setNewProctorPin(e.target.value)}
                  maxLength={6}
                  className="w-full px-3.5 py-2 text-xs font-mono font-black text-center tracking-widest bg-amber-950 text-amber-300 border border-amber-800 rounded-xl focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 font-sans mt-1">
                  PIN ini diberikan kepada Guru Pengawas Ruang agar bisa langsung memantau kelas ini di HP.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-display font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Buat & Buka Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Duplikasi Paket Soal per Kelas */}
      {isDuplicateModalOpen && duplicateTargetExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-100">
                <CopyPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base tracking-tight">
                  Duplikasi Paket Soal untuk Kelas Lain
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Seluruh butir soal ({duplicateTargetExam.questionCount || 0} butir) akan diduplikasi dengan Token Siswa dan PIN Pengawas baru khusus kelas ini.
                </p>
              </div>
            </div>

            {duplicateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{duplicateError}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div>
                <label htmlFor="ebl-7" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Paket Ujian / Kelas Target
                </label>
                <input id="ebl-7"
                  type="text"
                  value={duplicateTitle}
                  onChange={(e) => setDuplicateTitle(e.target.value)}
                  placeholder="Contoh: Matematika Wajib (Kelas X-B)"
                  className="w-full px-3.5 py-2.5 text-xs font-sans font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="ebl-8" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tingkat / Rombel Kelas
                </label>
                <input id="ebl-8"
                  type="text"
                  value={duplicateGradeLevel}
                  onChange={(e) => setDuplicateGradeLevel(formatClassName(e.target.value, true))}
                  onBlur={() => setDuplicateGradeLevel(formatClassName(duplicateGradeLevel, false))}
                  placeholder="Contoh: X-A, 7B, XII MIPA 1"
                  className="w-full px-3.5 py-2.5 text-xs font-sans font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="ebl-9" className="text-xs font-display font-bold text-slate-700 uppercase tracking-wider">
                      Token Siswa Baru
                    </label>
                    <button
                      type="button"
                      onClick={() => setDuplicatePin(examService.generateRandomToken())}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Acak
                    </button>
                  </div>
                  <input id="ebl-9"
                    type="text"
                    value={duplicatePin}
                    onChange={(e) => setDuplicatePin(e.target.value)}
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-black text-center tracking-widest bg-slate-900 text-blue-400 border border-slate-700 rounded-xl focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 block mt-0.5">Untuk pengerjaan siswa</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="ebl-10" className="text-xs font-display font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" /> PIN Pengawas Baru
                    </label>
                    <button
                      type="button"
                      onClick={() => setDuplicateProctorPin(examService.generateRandomToken())}
                      className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Acak
                    </button>
                  </div>
                  <input id="ebl-10"
                    type="text"
                    value={duplicateProctorPin}
                    onChange={(e) => setDuplicateProctorPin(e.target.value)}
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-black text-center tracking-widest bg-amber-950 text-amber-300 border border-amber-800 rounded-xl focus:outline-none"
                  />
                  <span className="text-[11px] text-amber-700 block mt-0.5">Untuk pengawas ruang HP</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-sans leading-relaxed">
                🛡️ <strong>Alur Pengawas:</strong> Berikan PIN Pengawas <span className="font-mono font-bold text-amber-800">{duplicateProctorPin}</span> kepada Guru Pengawas Ruang. Pengawas cukup menginput PIN ini di aplikasi HP untuk langsung memantau kelas ini.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDuplicating}
                onClick={() => setIsDuplicateModalOpen(false)}
                className="px-4 py-2 text-xs font-display font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDuplicating}
                onClick={handleConfirmDuplicate}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isDuplicating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CopyPlus className="w-4 h-4" />
                )}
                <span>{isDuplicating ? 'Menduplikasi...' : 'Duplikasi & Simpan ke Cloud'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proyektor PIN Kelas */}
      {projectorExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-xs">
              <Tv className="w-6 h-6" />
            </div>

            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-display font-bold uppercase tracking-wider">
              Mode Layar Proyektor Kelas
            </span>

            <h3 className="text-base font-display font-bold text-slate-900 mt-2 tracking-tight">
              {projectorExam.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Instruksikan siswa untuk memasukkan 6 digit Token PIN ini di aplikasi CBT.
            </p>

            {/* Display Big Token */}
            <div className="my-4 p-5 bg-slate-900 rounded-2xl text-white shadow-inner flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-display font-bold mb-1">
                TOKEN AKSES SISWA
              </span>
              <div className="text-4xl font-mono font-black tracking-widest text-blue-400">
                {projectorExam.token}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => handleCopyPin(projectorExam.token, projectorExam.id)}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {copiedTokenId === projectorExam.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedTokenId === projectorExam.id ? 'Tersalin!' : 'Salin Token PIN'}
              </button>
              <button
                type="button"
                onClick={() => setProjectorExam(null)}
                className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-display font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Acak Ulang Token / PIN */}
      {regenerateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 space-y-4 text-center">
            {/* Top Icon Badge */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs border ${
              regenerateTarget.type === 'student_token'
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <RefreshCw className="w-7 h-7" />
            </div>

            <div>
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-display font-bold uppercase tracking-wider ${
                regenerateTarget.type === 'student_token'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {regenerateTarget.type === 'student_token' ? 'Acak Ulang Token Siswa' : 'Acak Ulang PIN Pengawas'}
              </span>

              <h3 className="text-base font-display font-bold text-slate-900 mt-2 tracking-tight">
                {regenerateTarget.type === 'student_token'
                  ? 'Perbarui 6 Digit Token Akses Siswa?'
                  : 'Perbarui 6 Digit PIN Pengawas Ruang?'}
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Paket Soal: <strong className="text-slate-700">{regenerateTarget.exam.title}</strong>
              </p>
            </div>

            {/* Preview Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-slate-500 font-medium">
                  {regenerateTarget.type === 'student_token' ? 'Token Siswa Saat Ini:' : 'PIN Pengawas Saat Ini:'}
                </span>
                <span className="font-mono font-black text-slate-800 px-2 py-0.5 bg-slate-200/80 rounded-md tracking-wider">
                  {regenerateTarget.type === 'student_token'
                    ? regenerateTarget.exam.token
                    : (regenerateTarget.exam.proctorPin || regenerateTarget.exam.antiCheat?.proctorPin || '-')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans border-t border-slate-200/70 pt-2">
                {regenerateTarget.type === 'student_token'
                  ? '⚠️ Token lama akan hangus dan tidak dapat digunakan lagi. Siswa yang baru akan masuk harus menggunakan token baru yang dihasilkan sistem.'
                  : '⚠️ PIN Pengawas lama akan hangus. Guru pengawas ruang pada kelas ini harus memasukkan 6 digit PIN baru untuk membuka sesi live monitoring.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={isRegeneratingLoading}
                onClick={() => setRegenerateTarget(null)}
                className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-display font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRegeneratingLoading}
                onClick={handleConfirmRegenerate}
                className={`flex-1 h-10 text-white rounded-xl font-display font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                  regenerateTarget.type === 'student_token'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                } disabled:opacity-50`}
              >
                {isRegeneratingLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memperbarui...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ya, Acak Baru</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Session Quota Usage Detail Modal */}
      {showUsageDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm">
                    Rincian Kuota Sesi Ujian Bulan Ini
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Dihitung otomatis per kombinasi Modul, Kelas, &amp; Tanggal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUsageDetailModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                  <span className="text-[11px] text-amber-800 font-medium block">Sesi Resmi Digunakan</span>
                  <span className="text-xl font-bold font-display text-amber-950 mt-0.5 block">
                    {monthlyUsage?.usedSessions ?? 0} / 3 <span className="text-xs font-normal text-amber-800">Sesi</span>
                  </span>
                  <span className="text-[11px] text-amber-700 block mt-1">
                    Peserta &gt; 10 siswa per kelas
                  </span>
                </div>
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                  <span className="text-[11px] text-blue-800 font-medium block">Sisa Kuota Sesi</span>
                  <span className="text-xl font-bold font-display text-blue-950 mt-0.5 block">
                    {monthlyUsage?.remainingSessions ?? 3} <span className="text-xs font-normal text-blue-800">Sesi</span>
                  </span>
                  <span className="text-[11px] text-blue-700 block mt-1">
                    Reset otomatis awal bulan
                  </span>
                </div>
              </div>

              {/* Policy Explainer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong>Aturan Perhitungan Kuota:</strong> 1 sesi ujian resmi sah dihitung jika jumlah siswa dalam 1 kelas dan tanggal pelaksanaan mencapai <strong>lebih dari 10 siswa (&gt;10)</strong>. Sesi uji coba atau remedial kecil (≤10 siswa) <strong>bebas tanpa mengurangi kuota</strong>.
                </div>
              </div>

              {/* Session History List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Riwayat Pelaksanaan Sesi Bulan Ini:
                </span>

                {isUsageLoading ? (
                  <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Memeriksa riwayat sesi...</span>
                  </div>
                ) : !monthlyUsage?.sessionGroups || monthlyUsage.sessionGroups.length === 0 ? (
                  <div className="py-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    Belum ada sesi ujian yang diselenggarakan pada bulan ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {monthlyUsage.sessionGroups.map((group, idx) => (
                      <div
                        key={group.key || idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          group.isQualifying
                            ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{group.className}</span>
                            <span className="text-slate-400 font-normal">•</span>
                            <span className="font-medium text-slate-600 truncate max-w-[160px]">{group.examTitle}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {group.dateStr}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              {group.studentCount} Siswa
                            </span>
                          </div>
                        </div>

                        <div>
                          {group.isQualifying ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px] whitespace-nowrap">
                              ✓ Sesi Resmi (&gt;10 Siswa)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-200 text-slate-600 font-medium rounded-lg text-[11px] whitespace-nowrap">
                              Simulasi (≤10 Siswa, Bebas Kuota)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowUsageDetailModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold font-display cursor-pointer transition-colors"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUsageDetailModal(false);
                  onOpenUpgradeModal?.('Upgrade ke Guru PRO', 'Buka kuota sesi ujian tanpa batas, kapasitas siswa tak terhingga, dan fitur raport otomatis.');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-display shadow-md shadow-blue-500/20 cursor-pointer transition-all"
              >
                Tingkatkan ke Guru PRO →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!deleteTargetExam}
        onClose={() => setDeleteTargetExam(null)}
        onConfirm={handleConfirmDeleteTarget}
        title="Hapus Bank Soal?"
        message={
          <span>
            Bank soal <strong className="font-bold text-slate-900">&quot;{deleteTargetExam?.title}&quot;</strong> dan seluruh butir soal di dalamnya akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Ya, Hapus Bank Soal"
        cancelText="Batal"
        variant="danger"
        iconType="trash"
        isLoading={!!isDeletingId}
      />
    </div>
  );
};

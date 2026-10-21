import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Copy, 
  Check, 
  ChevronDown, 
  Tv, 
  BookOpen,
  Lock
} from 'lucide-react';
import { ProctoringKPIHeader } from './ProctoringKPIHeader';
import { StudentMonitoringTable } from './StudentMonitoringTable';
import { ViolationFeed } from './ViolationFeed';
import { StudentActionModal } from './StudentActionModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ExamQrProjectorModal } from '../common/ExamQrProjectorModal';
import { examService } from '../../services/examService';
import { isAppExitViolation } from '../../utils/formatters';
import type { StudentProctoring, ViolationLogItem, ExamSettings } from '../../types/exam';
import type { TeacherSubscription } from '../../types/subscription';

interface LiveProctoringDashboardProps {
  students: StudentProctoring[];
  setStudents: React.Dispatch<React.SetStateAction<StudentProctoring[]>>;
  violationLogs: ViolationLogItem[];
  setViolationLogs: React.Dispatch<React.SetStateAction<ViolationLogItem[]>>;
  activeTotalQuestions?: number;
  allExams?: ExamSettings[];
  activeExam?: ExamSettings;
  subscription?: TeacherSubscription;
  realtimeMode?: 'live' | 'fallback';
  onOpenUpgradeModal?: (title?: string, description?: string) => void;
  onSelectExam?: (exam: ExamSettings) => void;
  onToggleExamAccess?: (examId: string, newStatus: 'published' | 'closed') => Promise<void>;
}

export const LiveProctoringDashboard: React.FC<LiveProctoringDashboardProps> = ({
  students,
  setStudents,
  violationLogs,
  setViolationLogs,
  activeTotalQuestions = 5,
  allExams = [],
  activeExam,
  subscription,
  realtimeMode = 'live',
  onOpenUpgradeModal,
  onSelectExam,
  onToggleExamAccess,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentProctoring | null>(null);
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedProctorPin, setCopiedProctorPin] = useState(false);
  const [showProjectorModal, setShowProjectorModal] = useState(false);
  const [isLockAllConfirmOpen, setIsLockAllConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<'none' | 'addTime' | 'lock' | 'reset' | 'force'>('none');

  // Live Timer Countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.status === 'submitted' || s.status === 'ready') return s;
          if (!s.startedAt) return s; // Do not count down if student has not started yet
          if (s.remainingSeconds === undefined || s.remainingSeconds === null || s.remainingSeconds <= 0) return s;
          const newSec = Math.max(0, s.remainingSeconds - 1);
          return {
            ...s,
            remainingSeconds: newSec,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [setStudents]);

  // Global Time Extension
  const handleAddGlobalTime = async (minutes: number) => {
    if (actionBusy !== 'none') return;
    setActionError(null);
    setActionBusy('addTime');
    try {
      const result = await examService.addGlobalTime(minutes, activeExam?.id);
      if (!result.success) {
        setActionError(result.error || 'Gagal menambah waktu serentak.');
        return;
      }
      // Only apply locally & log once the server confirmed
      const addedSec = minutes * 60;
      setStudents((prev) =>
        prev.map((s) => ({
          ...s,
          remainingSeconds: s.status !== 'submitted' ? (s.remainingSeconds || 0) + addedSec : s.remainingSeconds,
        }))
      );

      const newLog: ViolationLogItem = {
        id: `ext-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: 'Semua Siswa',
        studentNisn: '-',
        message: `Guru menambahkan waktu ujian serentak (+${minutes} menit)`,
        severity: 'info',
      };
      setViolationLogs([newLog, ...violationLogs]);
    } catch (e: any) {
      setActionError(e?.message || 'Gagal menambah waktu serentak.');
    } finally {
      setActionBusy('none');
    }
  };

  // Global Lock/Close All Exams
  const handleLockAllExams = () => {
    setActionError(null);
    setIsLockAllConfirmOpen(true);
  };

  const handleExecuteLockAllExams = async () => {
    if (actionBusy !== 'none') return;
    setActionError(null);
    setActionBusy('lock');
    try {
      const result = await examService.lockAllExams(activeExam?.id);
      if (!result.success) {
        setActionError(result.error || 'Gagal mengunci seluruh ujian.');
        return; // keep modal open so teacher sees the failure
      }
      setStudents((prev) =>
        prev.map((s) => ({
          ...s,
          remainingSeconds: 0,
          status: 'submitted',
        }))
      );

      const newLog: ViolationLogItem = {
        id: `lock-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: 'Sistem Pengawas',
        studentNisn: '-',
        message: 'Ujian telah dikunci dan ditutup serentak oleh guru.',
        severity: 'danger',
      };
      setViolationLogs([newLog, ...violationLogs]);
      setIsLockAllConfirmOpen(false);
    } catch (e: any) {
      setActionError(e?.message || 'Gagal mengunci seluruh ujian.');
    } finally {
      setActionBusy('none');
    }
  };

  // Reset Individual Student Session
  const handleResetSession = async (studentId: string): Promise<{ success: boolean; error?: string }> => {
    if (actionBusy !== 'none') return { success: false, error: 'Aksi lain sedang berjalan. Tunggu sebentar.' };
    setActionError(null);
    const stu = students.find((s) => s.id === studentId);
    if (!stu) return { success: false, error: 'Data siswa tidak ditemukan.' };
    setActionBusy('reset');
    try {
      const targetExamId = stu.examId || (activeExam?.id !== 'all' ? activeExam?.id : undefined);
      const result = await examService.resetStudentSession(stu.nisn, targetExamId, stu.name);
      if (!result.success) {
        setActionError(result.error || 'Gagal reset sesi siswa.');
        return { success: false, error: result.error || 'Gagal reset sesi siswa.' };
      }
      const matchedExam = (stu.examId ? allExams.find((e) => e.id === stu.examId) : null) || (activeExam?.id !== 'all' ? activeExam : null);
      const examDurationSec = ((matchedExam?.durationMinutes || activeExam?.durationMinutes || 60) * 60);

      // 1. Purge this student's old violation logs from local UI state
      setViolationLogs((prev) =>
        prev.filter((l) => {
          const matchNisn = l.studentNisn && l.studentNisn.trim() === stu.nisn.trim();
          const matchName =
            (l.studentName && l.studentName.trim().toLowerCase() === stu.name.trim().toLowerCase()) ||
            (l.studentName && l.studentName.trim() === stu.nisn.trim());
          return !matchNisn && !matchName;
        })
      );

      // 2. Reset student state in UI (violations back to 0, away metrics cleared)
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                status: 'ready',
                connectionStatus: 'offline',
                violationCount: 0,
                progressCount: 0,
                startedAt: undefined,
                remainingSeconds: examDurationSec,
                isAway: false,
                leftAt: undefined,
                lastAwaySeconds: 0,
                totalAwaySeconds: 0,
              }
            : s
        )
      );

      const newLog: ViolationLogItem = {
        id: `reset-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: stu.name,
        studentNisn: stu.nisn,
        message: `Sesi ujian direset oleh guru. Siswa dapat login kembali.`,
        severity: 'info',
      };
      setViolationLogs((prev) => [newLog, ...prev]);
      return { success: true };
    } catch (e: any) {
      setActionError(e?.message || 'Gagal reset sesi siswa.');
      return { success: false, error: e?.message || 'Gagal reset sesi siswa.' };
    } finally {
      setActionBusy('none');
    }
  };

  // Clear All Violation Logs from Supabase and UI
  const handleClearLogs = async () => {
    setViolationLogs([]);
    await examService.clearViolationLogs(activeExam?.id);
  };

  // Send Warning
  const handleSendWarning = async (studentId: string, message: string) => {
    const stu = students.find((s) => s.id === studentId);
    if (stu) {
      const targetExamId = stu.examId || (activeExam?.id !== 'all' ? activeExam?.id : undefined);
      await examService.sendWarningToStudent(stu.nisn, stu.name, message, targetExamId);
      const newLog: ViolationLogItem = {
        id: `warn-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: stu.name,
        studentNisn: stu.nisn,
        message: `Peringatan dikirim: "${message}"`,
        severity: 'warning',
      };
      setViolationLogs((prev) => [newLog, ...prev]);
    }
  };

  // Force Submit Single Student
  const handleForceSubmit = async (studentId: string): Promise<{ success: boolean; error?: string }> => {
    if (actionBusy !== 'none') return { success: false, error: 'Aksi lain sedang berjalan. Tunggu sebentar.' };
    setActionError(null);
    const stu = students.find((s) => s.id === studentId);
    if (!stu) return { success: false, error: 'Data siswa tidak ditemukan.' };
    setActionBusy('force');
    try {
      const targetExamId = stu.examId || (activeExam?.id !== 'all' ? activeExam?.id : undefined);
      const result = await examService.forceSubmitStudent(stu.nisn, targetExamId, stu.name);
      if (!result.success) {
        setActionError(result.error || 'Gagal submit paksa siswa.');
        return { success: false, error: result.error || 'Gagal submit paksa siswa.' };
      }
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                remainingSeconds: 0,
                status: 'submitted',
              }
            : s
        )
      );

      const newLog: ViolationLogItem = {
        id: `force-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: stu.name,
        studentNisn: stu.nisn,
        message: `Pengerjaan ujian siswa disubmit paksa oleh guru.`,
        severity: 'danger',
      };
      setViolationLogs([newLog, ...violationLogs]);
      return { success: true };
    } catch (e: any) {
      setActionError(e?.message || 'Gagal submit paksa siswa.');
      return { success: false, error: e?.message || 'Gagal submit paksa siswa.' };
    } finally {
      setActionBusy('none');
    }
  };

  const handleCopyToken = () => {
    if (activeExam?.token) {
      navigator.clipboard.writeText(activeExam.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleCopyProctorPin = () => {
    const pin = activeExam?.proctorPin || activeExam?.antiCheat?.proctorPin;
    if (pin) {
      navigator.clipboard.writeText(pin);
      setCopiedProctorPin(true);
      setTimeout(() => setCopiedProctorPin(false), 2000);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start justify-between gap-2.5 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium animate-in fade-in"
        >
          <span className="leading-relaxed">
            <strong>Gagal menjalankan aksi: </strong>
            {actionError}
          </span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Tutup pesan peringatan"
            className="flex-shrink-0 px-2 py-1 text-rose-500 hover:text-rose-800 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Realtime Connection Health Banner */}
      {realtimeMode === 'fallback' && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium animate-in fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-1 flex-shrink-0" />
          <div className="leading-relaxed">
            <strong>Mode cadangan aktif:</strong> koneksi real-time (WebSocket) belum tersambung, jadi data siswa
            diperbarui lewat penyegaran berkala (~5 detik). Pelanggaran dan nilai tetap terpantau — hanya tidak
            se-instannya koneksi langsung.
            {' '}
            <span className="text-amber-700/80">Jika ini berlanjut, hubungi admin untuk mengaktifkan Realtime di server.</span>
          </div>
        </div>
      )}

      {/* Active Exam Class Session Banner & Switcher */}
      {activeExam && (
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                  {activeExam.id === 'all' ? '🌐 Pemantauan Serentak (Semua Kelas)' : activeExam.title}
                </h3>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md text-[11px] font-display font-semibold">
                  {activeExam.id === 'all' ? `${allExams.length} Kelas Berlangsung` : `${activeExam.subject} • ${activeExam.gradeLevel}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                {activeExam.id === 'all' 
                  ? 'Menampilkan telemetri seluruh siswa lintas kelas yang sedang ujian bersamaan' 
                  : `Pengawasan sesi aktif • Durasi: ${activeExam.durationMinutes} menit`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Student Exam Token Pill (Only if specific exam) */}
            {activeExam.id !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-inner">
                <span className="text-[11px] uppercase font-display font-bold text-slate-400">Token Siswa:</span>
                <span className="font-mono font-black text-sm tracking-widest text-blue-400">
                  {activeExam.token}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Salin Token Siswa (6 Digit)"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Teacher Proctor PIN Pill (Only if specific exam) */}
            {activeExam.id !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-950 text-white rounded-xl border border-amber-800 shadow-inner">
                <span className="text-[11px] uppercase font-display font-bold text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" /> PIN Pengawas:
                </span>
                <span className="font-mono font-black text-sm tracking-widest text-amber-300">
                  {activeExam.proctorPin || activeExam.antiCheat?.proctorPin || '-'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyProctorPin}
                  className="p-1 hover:bg-amber-900 text-amber-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Salin PIN Pengawas Ruang (6 Digit)"
                >
                  {copiedProctorPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Access Toggle Button in Proctoring */}
            {activeExam.id !== 'all' && (
              <button
                type="button"
                onClick={async () => {
                  const nextStatus = activeExam.status === 'closed' ? 'published' : 'closed';
                  if (onToggleExamAccess) {
                    await onToggleExamAccess(activeExam.id, nextStatus);
                  } else {
                    await examService.updateExamStatus(activeExam.id, nextStatus);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-bold border transition-colors cursor-pointer shadow-xs ${
                  activeExam.status === 'closed'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
                title={activeExam.status === 'closed' ? 'Akses ujian ditutup. Klik untuk membuka.' : 'Akses ujian dibuka. Klik untuk menutup.'}
              >
                {activeExam.status === 'closed' ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Akses Ditutup</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Akses Dibuka</span>
                  </>
                )}
              </button>
            )}

            {/* Projector Mode Button */}
            {activeExam.id !== 'all' && (
              <button
                type="button"
                onClick={() => setShowProjectorModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer border border-slate-200 shadow-xs"
                title="Tampilkan QR Code & Token di Layar Proyektor Kelas"
              >
                <Tv className="w-3.5 h-3.5 text-blue-600" />
                <span>Proyektor QR &amp; Token</span>
              </button>
            )}

            {/* Switch Class / Exam Dropdown Button */}
            {allExams && allExams.length > 0 && onSelectExam && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-display font-bold transition-colors cursor-pointer shadow-xs shadow-blue-500/20"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {activeExam.id === 'all' ? 'Filter Kelas (Semua)' : `Ganti Kelas (${allExams.length})`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isExamDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                    <span className="block px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wider text-slate-400">
                      Pilih Filter Sesi Pemantauan:
                    </span>
                    <div className="max-h-72 overflow-y-auto space-y-1 mt-1">
                      {/* Option 1: View All Classes Simultaneously */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectExam({
                            id: 'all',
                            title: 'Pemantauan Serentak (Semua Kelas)',
                            subject: 'Semua Mata Pelajaran',
                            gradeLevel: 'Lintas Kelas',
                            durationMinutes: 60,
                            scheduleDate: new Date().toISOString().split('T')[0],
                            scheduleTime: '08:00',
                            token: 'MULTI',
                            status: 'published',
                            antiCheat: {
                              detectTabSwitch: true,
                              shuffleQuestions: true,
                              shuffleOptions: true,
                              fullScreenLock: true,
                            },
                          });
                          setIsExamDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between border-b border-slate-100 ${
                          activeExam.id === 'all'
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div>
                            <div className="font-bold">🌐 Semua Kelas (Lintas Kelas)</div>
                            <div className="text-[11px] text-slate-400 font-sans font-normal">
                              Pantau seluruh siswa ({allExams.length} kelas) serentak
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-display font-bold text-[11px] rounded-md flex-shrink-0">
                          SEMUA
                        </span>
                      </button>

                      {/* Individual Classes */}
                      {allExams.map((ex) => {
                        const isCurrent = ex.id === activeExam.id;
                        return (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => {
                              onSelectExam(ex);
                              setIsExamDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between ${
                              isCurrent
                                ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="truncate mr-2">
                              <div className="truncate font-semibold">{ex.title}</div>
                              <div className="text-[11px] text-slate-400 font-sans font-normal mt-0.5">
                                {ex.gradeLevel || 'Kelas X'} • PIN: {ex.proctorPin || ex.antiCheat?.proctorPin || '-'}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-900 text-blue-400 font-mono font-bold text-[11px] rounded-md tracking-wider flex-shrink-0">
                              {ex.token}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top KPI & Global Controls */}
      <ProctoringKPIHeader
        students={students}
        onAddGlobalTime={handleAddGlobalTime}
        onLockAllExams={handleLockAllExams}
        subscription={subscription}
        onOpenUpgradeModal={onOpenUpgradeModal}
      />

      {/* Main Grid: Student Table & Live Violation Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table: 8 cols */}
        <div className="lg:col-span-8">
          <StudentMonitoringTable
            students={students}
            violationLogs={violationLogs}
            onSelectStudent={(stu) => setSelectedStudent(stu)}
            activeTotalQuestions={activeTotalQuestions}
          />
        </div>

        {/* Live Violation Feed: 4 cols */}
        <div className="lg:col-span-4 sticky top-20">
          <ViolationFeed
            logs={violationLogs}
            students={students}
            onClearLogs={handleClearLogs}
          />
        </div>
      </div>

      {/* Student Management Action Modal */}
      {selectedStudent && (
        <StudentActionModal
          student={{
            ...selectedStudent,
            violationLogs: (selectedStudent.violationLogs && selectedStudent.violationLogs.length > 0)
              ? selectedStudent.violationLogs.filter((l: any) => isAppExitViolation({ message: l.reason }))
              : (violationLogs || [])
                  .filter(
                    (l) =>
                      isAppExitViolation(l) &&
                      ((l.studentNisn && l.studentNisn.trim() === selectedStudent.nisn.trim()) ||
                      (l.studentName && (l.studentName.trim() === selectedStudent.nisn.trim() || l.studentName.trim().toLowerCase() === selectedStudent.name.trim().toLowerCase())))
                  )
                  .map((l) => ({ timestamp: l.timestamp, reason: l.message })),
            violationCount: Math.max(
              selectedStudent.violationCount || 0,
              (violationLogs || []).filter(
                (l) =>
                  isAppExitViolation(l) &&
                  ((l.studentNisn && l.studentNisn.trim() === selectedStudent.nisn.trim()) ||
                  (l.studentName && (l.studentName.trim() === selectedStudent.nisn.trim() || l.studentName.trim().toLowerCase() === selectedStudent.name.trim().toLowerCase())))
              ).length
            ),
          }}
          onClose={() => setSelectedStudent(null)}
          onResetSession={handleResetSession}
          onSendWarning={handleSendWarning}
          onForceSubmit={handleForceSubmit}
        />
      )}

      {/* Classroom High-Contrast QR Code & Token Projector Modal */}
      {activeExam && activeExam.id !== 'all' && (
        <ExamQrProjectorModal
          isOpen={showProjectorModal}
          onClose={() => setShowProjectorModal(false)}
          exam={activeExam}
        />
      )}

      {/* Modern Confirm Lock All Modal */}
      <ConfirmModal
        isOpen={isLockAllConfirmOpen}
        onClose={() => {
          setIsLockAllConfirmOpen(false);
          setActionError(null);
        }}
        onConfirm={handleExecuteLockAllExams}
        title="Kunci & Selesaikan Seluruh Ujian?"
        message={
          actionError
            ? `Gagal mengunci: ${actionError}`
            : 'Seluruh pengerjaan ujian siswa yang sedang berlangsung akan otomatis disubmit dan diselesaikan saat ini juga. Sesi pengerjaan siswa akan ditutup secara serentak.'
        }
        confirmText="Ya, Kunci Ujian Sekarang"
        cancelText="Batal"
        variant="warning"
        iconType="lock"
        isLoading={actionBusy === 'lock'}
      />
    </div>
  );
};

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
import { examService } from '../../services/examService';
import type { StudentProctoring, ViolationLogItem, ExamSettings } from '../../types/exam';

interface LiveProctoringDashboardProps {
  students: StudentProctoring[];
  setStudents: React.Dispatch<React.SetStateAction<StudentProctoring[]>>;
  violationLogs: ViolationLogItem[];
  setViolationLogs: React.Dispatch<React.SetStateAction<ViolationLogItem[]>>;
  activeTotalQuestions?: number;
  allExams?: ExamSettings[];
  activeExam?: ExamSettings;
  onSelectExam?: (exam: ExamSettings) => void;
}

export const LiveProctoringDashboard: React.FC<LiveProctoringDashboardProps> = ({
  students,
  setStudents,
  violationLogs,
  setViolationLogs,
  activeTotalQuestions = 5,
  allExams = [],
  activeExam,
  onSelectExam,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentProctoring | null>(null);
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedProctorPin, setCopiedProctorPin] = useState(false);
  const [showProjectorModal, setShowProjectorModal] = useState(false);
  const [isLockAllConfirmOpen, setIsLockAllConfirmOpen] = useState(false);

  // Live Timer Countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.status === 'submitted') return s;
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
  const handleAddGlobalTime = (minutes: number) => {
    const addedSec = minutes * 60;
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        remainingSeconds: s.status !== 'submitted' ? s.remainingSeconds + addedSec : s.remainingSeconds,
      }))
    );

    examService.addGlobalTime(minutes, activeExam?.id);

    const newLog: ViolationLogItem = {
      id: `ext-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      studentName: 'Semua Siswa',
      studentNisn: '-',
      message: `Guru menambahkan waktu ujian serentak (+${minutes} menit)`,
      severity: 'info',
    };
    setViolationLogs([newLog, ...violationLogs]);
  };

  // Global Lock/Close All Exams
  const handleLockAllExams = () => {
    setIsLockAllConfirmOpen(true);
  };

  const handleExecuteLockAllExams = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        remainingSeconds: 0,
        status: 'submitted',
      }))
    );

    examService.lockAllExams(activeExam?.id);

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
  };

  // Reset Individual Student Session
  const handleResetSession = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              status: 'working',
              connectionStatus: 'online',
              violationCount: 0,
            }
          : s
      )
    );

    const stu = students.find((s) => s.id === studentId);
    if (stu) {
      examService.resetStudentSession(stu.nisn);
      const newLog: ViolationLogItem = {
        id: `reset-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: stu.name,
        studentNisn: stu.nisn,
        message: `Sesi ujian direset oleh guru. Siswa dapat login kembali.`,
        severity: 'info',
      };
      setViolationLogs([newLog, ...violationLogs]);
    }
  };

  // Send Warning
  const handleSendWarning = (studentId: string, message: string) => {
    const stu = students.find((s) => s.id === studentId);
    if (stu) {
      examService.sendWarningToStudent(stu.nisn, stu.name, message, activeExam?.id);
      const newLog: ViolationLogItem = {
        id: `warn-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: stu.name,
        studentNisn: stu.nisn,
        message: `Peringatan dikirim: "${message}"`,
        severity: 'warning',
      };
      setViolationLogs([newLog, ...violationLogs]);
    }
  };

  // Force Submit Single Student
  const handleForceSubmit = (studentId: string) => {
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

    const stu = students.find((s) => s.id === studentId);
    if (stu) {
      examService.forceSubmitStudent(stu.nisn, activeExam?.id);
      const newLog: ViolationLogItem = {
        id: `force-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: stu.name,
        studentNisn: stu.nisn,
        message: `Pengerjaan ujian siswa disubmit paksa oleh guru.`,
        severity: 'danger',
      };
      setViolationLogs([newLog, ...violationLogs]);
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
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md text-[10px] font-display font-semibold">
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
                <span className="text-[10px] uppercase font-display font-bold text-slate-400">Token Siswa:</span>
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
                <span className="text-[10px] uppercase font-display font-bold text-amber-400 flex items-center gap-1">
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

            {/* Projector Mode Button */}
            {activeExam.id !== 'all' && (
              <button
                type="button"
                onClick={() => setShowProjectorModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer border border-slate-200 shadow-xs"
                title="Tampilkan Token di Layar Proyektor"
              >
                <Tv className="w-3.5 h-3.5 text-blue-600" />
                <span>Proyektor Token</span>
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
                    <span className="block px-2.5 py-1 text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">
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
                            <div className="text-[10px] text-slate-400 font-sans font-normal">
                              Pantau seluruh siswa ({allExams.length} kelas) serentak
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-display font-bold text-[10px] rounded-md flex-shrink-0">
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
                              <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
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
      />

      {/* Main Grid: Student Table & Live Violation Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table: 8 cols */}
        <div className="lg:col-span-8">
          <StudentMonitoringTable
            students={students}
            onSelectStudent={(stu) => setSelectedStudent(stu)}
            activeTotalQuestions={activeTotalQuestions}
          />
        </div>

        {/* Live Violation Feed: 4 cols */}
        <div className="lg:col-span-4 sticky top-20">
          <ViolationFeed
            logs={violationLogs}
            onClearLogs={() => setViolationLogs([])}
          />
        </div>
      </div>

      {/* Student Management Action Modal */}
      <StudentActionModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onResetSession={handleResetSession}
        onSendWarning={handleSendWarning}
        onForceSubmit={handleForceSubmit}
      />

      {/* Modal Proyektor Token Ujian Siswa */}
      {showProjectorModal && activeExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-xs">
              <Tv className="w-6 h-6" />
            </div>

            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-display font-bold uppercase tracking-wider">
              Mode Proyektor Token Ujian
            </span>

            <h3 className="text-base font-display font-bold text-slate-900 mt-2.5 tracking-tight">
              {activeExam.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Instruksikan siswa di ruang kelas untuk memasukkan 6 digit Token PIN ini.
            </p>

            {/* Display Big Token */}
            <div className="my-5 p-6 bg-slate-900 rounded-2xl text-white shadow-inner flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-display font-bold mb-1">
                TOKEN UJIAN SISWA
              </span>
              <div className="text-5xl font-mono font-black tracking-widest text-blue-400 my-1">
                {activeExam.token}
              </div>
              <span className="text-[11px] text-slate-400 font-sans mt-1">
                {activeExam.subject} • {activeExam.gradeLevel}
              </span>
            </div>

            <div className="flex gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleCopyToken}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-xs transition-colors flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToken ? 'Token Tersalin!' : 'Salin Token Siswa'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowProjectorModal(false)}
                className="h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-display font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Confirm Lock All Modal */}
      <ConfirmModal
        isOpen={isLockAllConfirmOpen}
        onClose={() => setIsLockAllConfirmOpen(false)}
        onConfirm={handleExecuteLockAllExams}
        title="Kunci & Selesaikan Seluruh Ujian?"
        message="Seluruh pengerjaan ujian siswa yang sedang berlangsung akan otomatis disubmit dan diselesaikan saat ini juga. Sesi pengerjaan siswa akan ditutup secara serentak."
        confirmText="Ya, Kunci Ujian Sekarang"
        cancelText="Batal"
        variant="warning"
        iconType="lock"
      />
    </div>
  );
};

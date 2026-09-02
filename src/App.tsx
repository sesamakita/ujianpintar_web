import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { QuestionBuilder } from './components/question-builder/QuestionBuilder';
import { LiveProctoringDashboard } from './components/live-proctoring/LiveProctoringDashboard';
import { GradeAnalytics } from './components/analytics/GradeAnalytics';
import { SystemSettings } from './components/settings/SystemSettings';
import { SubscriptionAndAboutPage } from './components/subscription/SubscriptionAndAboutPage';
import { SuperAdminPortal } from './components/super-admin/SuperAdminPortal';
import { MobilePreviewModal } from './components/question-builder/MobilePreviewModal';
import { UpgradePromptModal } from './components/subscription/UpgradePromptModal';
import { AuthPage } from './components/auth/AuthPage';
import { authService } from './services/authService';
import { examService, generateUUID } from './services/examService';
import { subscriptionService } from './services/subscriptionService';
import { 
  initialExamSettings, 
  initialQuestions, 
  initialStudents, 
  initialViolationLogs, 
  initialGradeRecords 
} from './data/mockData';
import type { ExamSettings, Question, StudentProctoring, ViolationLogItem, GradeRecord } from './types/exam';
import type { TeacherSubscription } from './types/subscription';

export function App() {
  // Super Admin Dedicated URL Route Detection (/super-admin or /admin or #/super-admin)
  const [isSuperAdminRoute, setIsSuperAdminRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path.startsWith('/super-admin') ||
      path.startsWith('/admin') ||
      hash.includes('super-admin') ||
      hash.includes('admin')
    );
  });

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      setIsSuperAdminRoute(
        path.startsWith('/super-admin') ||
        path.startsWith('/admin') ||
        hash.includes('super-admin') ||
        hash.includes('admin')
      );
    };

    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    school: string;
    subject: string;
    whatsapp?: string;
    nip?: string;
    npsn?: string;
  }>({
    name: 'Bpk. Rahmat, S.Pd.',
    email: 'rahmat.guru@belajar.id',
    school: 'SMA Negeri 1 Indonesia',
    subject: 'Matematika Wajib',
    whatsapp: '081234567890',
    nip: '19850412 200902 1 004',
    npsn: '20104829',
  });
  const [activeTab, setActiveTab] = useState<'builder' | 'proctoring' | 'analytics' | 'settings' | 'subscription'>('builder');
  const [builderView, setBuilderView] = useState<'list' | 'editor'>('list');
  const [allExams, setAllExams] = useState<ExamSettings[]>([]);
  const [examSettings, setExamSettings] = useState<ExamSettings>(initialExamSettings);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [students, setStudents] = useState<StudentProctoring[]>(initialStudents);
  const [violationLogs, setViolationLogs] = useState<ViolationLogItem[]>(initialViolationLogs);
  const [grades, setGrades] = useState<GradeRecord[]>(initialGradeRecords);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [subscription, setSubscription] = useState<TeacherSubscription>({
    tier: 'free',
    status: 'free',
    planName: 'Paket Guru Basic',
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 30,
    isTrial: false,
    maxExamsPerMonth: 3,
    maxStudentsPerExam: 40,
    canUseCustomLogo: false,
    canExportAdvanced: false,
    canUseFullscreenLock: false,
  });

  const refreshTeacherExams = async (email?: string) => {
    try {
      const list = await examService.getAllTeacherExams(email || currentUser.email);
      setAllExams(list);
      return list;
    } catch (err) {
      console.warn('refreshTeacherExams error:', err);
      return [];
    }
  };

  // Restore authenticated session, user profile & all exam sessions on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [user, userSub] = await Promise.all([
          authService.getCurrentUser(),
          subscriptionService.getTeacherSubscription(),
        ]);

        if (user) {
          setCurrentUser({
            name: user.name,
            email: user.email,
            school: user.school,
            subject: user.subject,
            whatsapp: user.whatsapp || '',
            nip: user.nip || '',
            npsn: user.npsn || '',
          });
          if (userSub) {
            setSubscription(userSub);
          }
          setIsAuthenticated(true);

          // Fetch all exams for this teacher
          const teacherExams = await examService.getAllTeacherExams(user.email);
          setAllExams(teacherExams);

          if (teacherExams && teacherExams.length > 0) {
            const firstExam = teacherExams[0];
            const examData = await examService.getExamById(firstExam.id);
            if (examData.exam) {
              setExamSettings(examData.exam);
            }
            if (examData.questions) {
              setQuestions(examData.questions);
            }
          } else {
            const latestExamData = await examService.getLatestExam(user.email);
            if (latestExamData.exam) {
              setExamSettings(latestExamData.exam);
              setQuestions(latestExamData.questions || []);
              setAllExams([latestExamData.exam]);
            } else {
              setExamSettings({
                ...initialExamSettings,
                id: generateUUID(),
                subject: user?.subject || 'Matematika Wajib',
                token: examService.generateRandomToken(),
              });
              setQuestions([]);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('Session & exam restore warning:', err);
      } finally {
        setIsSessionLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Fetch initial telemetry from Supabase & Subscribe to Real-Time Proctoring updates with polling heartbeat
  useEffect(() => {
    if (!isAuthenticated || !examSettings?.id) return;

    let unsubscribe: (() => void) | undefined;
    let pollInterval: any;
    const targetExamId = examSettings.id === 'all' ? undefined : examSettings.id;

    const fetchLatestData = async () => {
      try {
        const [remoteStudents, remoteGrades, remoteLogs] = await Promise.all([
          examService.getLiveStudents(targetExamId),
          examService.getGradeRecords(targetExamId),
          examService.getViolationLogs(targetExamId),
        ]);

        if (remoteStudents && remoteStudents.length > 0) {
          setStudents((prev) => {
            return remoteStudents.map((rs) => {
              const existing = prev.find((p) => p.nisn === rs.nisn);
              if (existing) {
                return {
                  ...rs,
                  remainingSeconds: rs.status === 'submitted' 
                    ? 0 
                    : (existing.remainingSeconds > 0 ? existing.remainingSeconds : rs.remainingSeconds),
                };
              }
              return rs;
            });
          });
        }

        if (remoteGrades && remoteGrades.length > 0) {
          setGrades(remoteGrades);
        }

        if (remoteLogs && remoteLogs.length > 0) {
          setViolationLogs(remoteLogs);
        }
      } catch (err) {
        console.warn('Live polling heartbeat check:', err);
      }
    };

    const initRealtimeSync = async () => {
      // 1. Initial immediate fetch for this exam
      await fetchLatestData();

      // 2. Setup 2.5 second polling fallback
      pollInterval = setInterval(fetchLatestData, 2500);

      // 3. Realtime WebSockets listener for instant updates strictly for this exam (or all exams)
      unsubscribe = examService.subscribeToLiveProctoring(
        targetExamId,
        (updatedStudent) => {
          setStudents((prev) => {
            const exists = prev.find((s) => s.nisn === updatedStudent.nisn);
            if (exists) {
              return prev.map((s) => (s.nisn === updatedStudent.nisn ? {
                ...s,
                ...updatedStudent,
                remainingSeconds: updatedStudent.status === 'submitted'
                  ? 0
                  : (s.remainingSeconds > 0 ? s.remainingSeconds : updatedStudent.remainingSeconds)
              } : s));
            }
            return [updatedStudent, ...prev];
          });
        },
        (newLog) => {
          setViolationLogs((prev) => [newLog, ...prev]);
        },
        (newGrade) => {
          setGrades((prev) => {
            const exists = prev.find((g) => g.nisn === newGrade.nisn);
            if (exists) {
              return prev.map((g) => (g.nisn === newGrade.nisn ? { ...g, ...newGrade } : g));
            }
            return [newGrade, ...prev];
          });
        }
      );
    };

    initRealtimeSync();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, examSettings.id]);

  const activeStudentsCount = students.filter((s) => s.status === 'working' || s.status === 'violation_flagged').length;
  const violationCount = students.reduce((sum, s) => sum + s.violationCount, 0);

  const handleSelectExamForEdit = async (selectedExam: ExamSettings) => {
    try {
      const data = await examService.getExamById(selectedExam.id);
      if (data.exam) {
        setExamSettings(data.exam);
      } else {
        setExamSettings(selectedExam);
      }
      setQuestions(data.questions || []);
      setBuilderView('editor');
      setActiveTab('builder');
    } catch (err) {
      console.warn('handleSelectExamForEdit error:', err);
    }
  };

  const handleSetActiveExamForProctoring = async (selectedExam: ExamSettings) => {
    try {
      const data = await examService.getExamById(selectedExam.id);
      if (data.exam) {
        setExamSettings(data.exam);
      } else {
        setExamSettings(selectedExam);
      }
      setQuestions(data.questions || []);
      setStudents([]);
      setGrades([]);
      setViolationLogs([]);
      setActiveTab('proctoring');
    } catch (err) {
      console.warn('handleSetActiveExamForProctoring error:', err);
    }
  };

  const handleCreateNewExam = async (newExam: ExamSettings) => {
    try {
      await examService.saveExam(newExam, []);
      setExamSettings(newExam);
      setQuestions([]);
      setBuilderView('editor');
      await refreshTeacherExams();
    } catch (err) {
      console.warn('handleCreateNewExam error:', err);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await examService.deleteExam(examId, currentUser.email);
      const updatedList = await refreshTeacherExams();
      if (examSettings.id === examId) {
        if (updatedList.length > 0) {
          const next = updatedList[0];
          const nextData = await examService.getExamById(next.id);
          setExamSettings(nextData.exam || next);
          setQuestions(nextData.questions || []);
        } else {
          setExamSettings({
            ...initialExamSettings,
            id: generateUUID(),
            subject: currentUser.subject || 'Matematika Wajib',
            token: examService.generateRandomToken(),
          });
          setQuestions([]);
        }
      }
    } catch (err) {
      console.warn('handleDeleteExam error:', err);
    }
  };

  const handleLoginSuccess = async (userData: { name: string; email: string; school: string; subject: string }) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    // Clear previous memory telemetry
    setStudents([]);
    setGrades([]);
    setViolationLogs([]);

    try {
      const teacherExams = await examService.getAllTeacherExams(userData.email);
      setAllExams(teacherExams);

      if (teacherExams && teacherExams.length > 0) {
        const firstExam = teacherExams[0];
        const examData = await examService.getExamById(firstExam.id);
        if (examData.exam) {
          setExamSettings(examData.exam);
        }
        if (examData.questions) {
          setQuestions(examData.questions);
        }
      } else {
        const latestExamData = await examService.getLatestExam(userData.email);
        if (latestExamData.exam) {
          setExamSettings(latestExamData.exam);
          setQuestions(latestExamData.questions || []);
          setAllExams([latestExamData.exam]);
        } else {
          setExamSettings({
            ...initialExamSettings,
            id: generateUUID(),
            subject: userData.subject || 'Matematika Wajib',
            token: examService.generateRandomToken(),
          });
          setQuestions([]);
        }
      }
    } catch (err) {
      console.warn('Load exam on login error:', err);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setIsAuthenticated(false);
    // Reset state completely to prevent any memory leaking between accounts
    setAllExams([]);
    setQuestions([]);
    setStudents([]);
    setGrades([]);
    setViolationLogs([]);
    setExamSettings(initialExamSettings);
    setBuilderView('list');
  };

  const handleStudentSubmit = (newStudent: StudentProctoring, newGrade: GradeRecord, newLogs: ViolationLogItem[]) => {
    setStudents((prev) => [newStudent, ...prev.filter((s) => s.nisn !== newStudent.nisn)]);
    setGrades((prev) => [newGrade, ...prev.filter((g) => g.nisn !== newGrade.nisn)]);
    if (newLogs && newLogs.length > 0) {
      setViolationLogs((prev) => [...newLogs, ...prev]);
    }
    examService.recordStudentSubmission(newStudent, newGrade);
  };

  // Super Admin Dedicated Standalone Route & Portal
  if (isSuperAdminRoute) {
    return (
      <SuperAdminPortal
        onExit={() => {
          window.history.pushState(null, '', '/');
          setIsSuperAdminRoute(false);
        }}
      />
    );
  }

  // Tampilkan layar loading saat cek sesi Supabase (mencegah flash ke login page)
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-sans font-medium">Memverifikasi sesi...</span>
        </div>
      </div>
    );
  }

  // If not logged in, render the AuthPage (Login / Signup)
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  const handleSelectExamForProctoring = async (selected: ExamSettings) => {
    try {
      if (selected.id === 'all') {
        setExamSettings({
          id: 'all',
          title: 'Pemantauan Serentak (Semua Kelas)',
          subject: currentUser.subject || 'Semua Mata Pelajaran',
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
        setStudents([]);
        setGrades([]);
        setViolationLogs([]);
        return;
      }

      const examData = await examService.getExamById(selected.id);
      if (examData.exam) {
        setExamSettings(examData.exam);
      } else {
        setExamSettings(selected);
      }
      if (examData.questions) {
        setQuestions(examData.questions);
      }
      setStudents([]);
      setGrades([]);
      setViolationLogs([]);
    } catch (err) {
      console.warn('handleSelectExamForProctoring error:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100/75 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        examSettings={examSettings}
        activeStudentCount={activeStudentsCount}
        onLogout={handleLogout}
        teacherName={currentUser.name}
        schoolName={currentUser.school}
        subjectName={currentUser.subject}
        subscription={subscription}
        onOpenSubscription={() => setActiveTab('subscription')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          examSettings={examSettings}
          violationCount={violationCount}
          subscription={subscription}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'builder' && (
            <QuestionBuilder
              examSettings={examSettings}
              setExamSettings={setExamSettings}
              questions={questions}
              setQuestions={setQuestions}
              allExams={allExams}
              onRefreshExams={async () => {
                await refreshTeacherExams();
              }}
              onSelectExamForEdit={handleSelectExamForEdit}
              onSetActiveExamForProctoring={handleSetActiveExamForProctoring}
              onCreateNewExam={handleCreateNewExam}
              onDeleteExam={handleDeleteExam}
              builderView={builderView}
              setBuilderView={setBuilderView}
              onOpenMobilePreview={() => setIsMobilePreviewOpen(true)}
              isMobilePreviewOpen={isMobilePreviewOpen}
              setIsMobilePreviewOpen={setIsMobilePreviewOpen}
              onStudentSubmit={handleStudentSubmit}
            />
          )}

          {activeTab === 'proctoring' && (
            <LiveProctoringDashboard
              students={students}
              setStudents={setStudents}
              violationLogs={violationLogs}
              setViolationLogs={setViolationLogs}
              activeTotalQuestions={questions.length}
              allExams={allExams}
              activeExam={examSettings}
              onSelectExam={handleSelectExamForProctoring}
            />
          )}

          {activeTab === 'analytics' && (
            <GradeAnalytics
              grades={grades}
              examSettings={examSettings}
            />
          )}

          {activeTab === 'subscription' && (
            <SubscriptionAndAboutPage
              currentUser={currentUser}
              subscription={subscription}
              onSubscriptionUpdated={(updatedSub) => {
                setSubscription(updatedSub);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SystemSettings
              currentUser={currentUser}
              onProfileUpdated={(updated) => {
                setCurrentUser((prev) => ({ ...prev, ...updated }));
              }}
            />
          )}
        </main>
      </div>

      {/* Global Mobile Preview Modal accessible from anywhere */}
      <MobilePreviewModal
        isOpen={isMobilePreviewOpen}
        onClose={() => setIsMobilePreviewOpen(false)}
        examSettings={examSettings}
        questions={questions}
        onStudentSubmit={handleStudentSubmit}
      />

      {/* Global Upgrade to PRO Modal */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onOpenPlans={() => setActiveTab('subscription')}
      />
    </div>
  );
}

export default App;

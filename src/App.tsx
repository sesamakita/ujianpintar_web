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
import { LandingPage } from './components/landing/LandingPage';
import { AppLogoIcon } from './components/common/AppLogo';
import { authService } from './services/authService';
import { examService, generateUUID } from './services/examService';
import { subscriptionService } from './services/subscriptionService';
import { supabase } from './lib/supabase';
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

  // Top-level Navigation View ('landing' | 'auth' | 'portal')
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'portal'>(() => {
    if (typeof window === 'undefined') return 'landing';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (hash.includes('access_token') || search.includes('code')) {
      return 'portal';
    }
    if (path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/register') || path.startsWith('/signup') || hash.includes('login') || hash.includes('auth')) {
      return 'auth';
    }
    if (path.startsWith('/portal') || path.startsWith('/dashboard') || path.startsWith('/app') || hash.includes('portal') || hash.includes('dashboard')) {
      return 'portal';
    }
    return 'landing';
  });

  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

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

      if (path.startsWith('/login') || path.startsWith('/auth') || hash.includes('login') || hash.includes('auth')) {
        setCurrentView('auth');
        setAuthInitialMode('login');
      } else if (path.startsWith('/register') || path.startsWith('/signup') || hash.includes('register') || hash.includes('signup')) {
        setCurrentView('auth');
        setAuthInitialMode('signup');
      } else if (path.startsWith('/portal') || path.startsWith('/dashboard') || path.startsWith('/app') || hash.includes('portal') || hash.includes('dashboard')) {
        setCurrentView('portal');
      } else if (path === '/' || path === '') {
        if (!hash || hash === '#home' || hash === '#ekosistem' || hash === '#fitur' || hash === '#keamanan' || hash === '#harga' || hash === '#faq') {
          setCurrentView('landing');
        }
      }
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
    avatarUrl?: string;
  }>({
    name: 'Rahmat, S.Pd.',
    email: 'rahmat.guru@gmail.com',
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
  const [upgradeModalConfig, setUpgradeModalConfig] = useState<{
    isOpen: boolean;
    title?: string;
    description?: string;
  }>({
    isOpen: false,
  });

  const handleOpenUpgradeModal = (title?: string, description?: string) => {
    setUpgradeModalConfig({
      isOpen: true,
      title,
      description,
    });
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [subscription, setSubscription] = useState<TeacherSubscription>({
    tier: 'free',
    status: 'free',
    planName: 'Guru Basic',
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
    let isMounted = true;

    const restoreSession = async () => {
      const splashStartTime = Date.now();
      const MIN_SPLASH_DURATION_MS = 2000; // Tampilkan splash screen minimal 2 detik

      try {
        const [user, userSub] = await Promise.all([
          authService.getCurrentUser(),
          subscriptionService.getTeacherSubscription(),
        ]);

        if (!isMounted) return;

        if (user) {
          setCurrentUser({
            name: user.name,
            email: user.email,
            school: user.school,
            subject: user.subject,
            whatsapp: user.whatsapp || '',
            nip: user.nip || '',
            npsn: user.npsn || '',
            avatarUrl: user.avatarUrl || '',
          });
          if (userSub) {
            setSubscription(userSub);
          }
          setIsAuthenticated(true);

          // Jika kembali dari redirect Google OAuth (ada access_token di hash atau code di search)
          const isOAuthCallback = typeof window !== 'undefined' && (
            window.location.hash.includes('access_token') || 
            window.location.search.includes('code')
          );
          if (isOAuthCallback) {
            setCurrentView('portal');
            window.history.replaceState(null, '', '/portal');
          }

          // Jika biodata sekolah belum lengkap, otomatis arahkan ke Pengaturan Sekolah
          if (!user.school || user.school.trim() === '') {
            setActiveTab('settings');
          }

          // Fetch all exams for this teacher
          const teacherExams = await examService.getAllTeacherExams(user.email);
          if (!isMounted) return;
          setAllExams(teacherExams);

          if (teacherExams && teacherExams.length > 0) {
            const firstExam = teacherExams[0];
            const examData = await examService.getExamById(firstExam.id);
            if (!isMounted) return;
            if (examData.exam) {
              setExamSettings(examData.exam);
            }
            if (examData.questions) {
              setQuestions(examData.questions);
            }
          } else {
            const latestExamData = await examService.getLatestExam(user.email);
            if (!isMounted) return;
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
        const elapsedTime = Date.now() - splashStartTime;
        const remainingDelay = Math.max(0, MIN_SPLASH_DURATION_MS - elapsedTime);

        setTimeout(() => {
          if (isMounted) {
            setIsSessionLoading(false);
          }
        }, remainingDelay);
      }
    };

    restoreSession();

    // Listen for Supabase OAuth login events (e.g. after selecting Google account)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        restoreSession();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentView('landing');
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Fetch initial telemetry from Supabase & Subscribe to Real-Time Proctoring updates with polling heartbeat
  useEffect(() => {
    if (!isAuthenticated || !examSettings?.id) return;

    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;
    let pollInterval: any = null;
    const targetExamId = examSettings.id === 'all' ? undefined : examSettings.id;

    const fetchLatestData = async () => {
      try {
        const [remoteStudents, remoteGrades, remoteLogs] = await Promise.all([
          examService.getLiveStudents(targetExamId),
          examService.getGradeRecords(targetExamId),
          examService.getViolationLogs(targetExamId),
        ]);

        if (isCancelled) return;

        if (remoteStudents) {
          setStudents((prev) => {
            if (remoteStudents.length === 0) return [];
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

        if (remoteGrades && !isCancelled) {
          setGrades(remoteGrades);
        }

        if (remoteLogs && !isCancelled) {
          setViolationLogs(remoteLogs);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Live polling heartbeat check:', err);
        }
      }
    };

    // 1. Initial immediate fetch for this exam
    fetchLatestData();

    // 2. Setup 2.5 second polling fallback immediately so it is tracked synchronously
    pollInterval = setInterval(() => {
      if (!isCancelled) {
        fetchLatestData();
      }
    }, 2500);

    // 3. Realtime WebSockets listener for instant updates strictly for this exam (or all exams)
    unsubscribe = examService.subscribeToLiveProctoring(
      targetExamId,
      (updatedStudent) => {
        if (isCancelled) return;
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
        if (isCancelled) return;
        setViolationLogs((prev) => [newLog, ...prev]);
      },
      (newGrade) => {
        if (isCancelled) return;
        setGrades((prev) => {
          const exists = prev.find((g) => g.nisn === newGrade.nisn);
          if (exists) {
            return prev.map((g) => (g.nisn === newGrade.nisn ? { ...g, ...newGrade } : g));
          }
          return [newGrade, ...prev];
        });
      }
    );

    return () => {
      isCancelled = true;
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
      setExamSettings(selectedExam);
      setStudents([]);
      setGrades([]);
      setViolationLogs([]);
      setActiveTab('proctoring');

      const data = await examService.getExamById(selectedExam.id);
      if (data.exam) {
        setExamSettings((prev) => (prev.id === selectedExam.id ? { ...prev, ...data.exam } : prev));
      }
      if (data.questions) {
        setQuestions(data.questions);
      }
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

  const handleToggleExamAccess = async (examId: string, newStatus: 'published' | 'closed') => {
    try {
      setAllExams((prev) => prev.map((e) => (e.id === examId ? { ...e, status: newStatus } : e)));
      if (examSettings.id === examId) {
        setExamSettings((prev) => ({ ...prev, status: newStatus }));
      }
      await examService.updateExamStatus(examId, newStatus);
    } catch (err) {
      console.warn('handleToggleExamAccess error:', err);
      await refreshTeacherExams();
    }
  };

  const handleLoginSuccess = async (userData: { name: string; email: string; school: string; subject: string }) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setCurrentView('portal');
    window.history.pushState(null, '', '/portal');

    // Jika biodata sekolah belum diisi, otomatis buka tab settings
    if (!userData.school || userData.school.trim() === '') {
      setActiveTab('settings');
    }
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
    setCurrentView('landing');
    window.history.pushState(null, '', '/');
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
    examService.recordStudentSubmission(newStudent, newGrade, examSettings.id);
  };

  // Super Admin Dedicated Standalone Route & Portal
  if (isSuperAdminRoute) {
    return (
      <SuperAdminPortal
        onExit={() => {
          window.history.pushState(null, '', '/');
          setIsSuperAdminRoute(false);
          setCurrentView('landing');
        }}
      />
    );
  }

  // Tampilkan Splash Screen Minimalis Resmi UjianPintar (Hanya Logo/Icon Berdenyut)
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Ambient Background Glow */}
        <div className="absolute w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Pulsing Logo / Icon */}
        <div className="relative z-10 flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-1 shadow-2xl shadow-blue-500/40 flex items-center justify-center border border-blue-400/40 animate-pulse">
              <AppLogoIcon className="w-14 sm:w-16 h-auto" color="white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. Landing Page View (Default untuk domain utama https://ujianpintar.online)
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateToAuth={(mode) => {
            setAuthInitialMode(mode);
            setCurrentView('auth');
            window.history.pushState(null, '', mode === 'signup' ? '/register' : '/login');
          }}
          onNavigateToPortal={() => {
            if (isAuthenticated) {
              setCurrentView('portal');
              window.history.pushState(null, '', '/portal');
            } else {
              setAuthInitialMode('login');
              setCurrentView('auth');
              window.history.pushState(null, '', '/login');
            }
          }}
          onOpenMobileSimulation={() => {
            setIsMobilePreviewOpen(true);
          }}
        />

        {/* Modal Simulasi Ujian Mobile Siswa yang bisa diakses langsung dari Landing Page */}
        <MobilePreviewModal
          isOpen={isMobilePreviewOpen}
          onClose={() => setIsMobilePreviewOpen(false)}
          examSettings={examSettings}
          questions={questions}
          onStudentSubmit={handleStudentSubmit}
        />
      </>
    );
  }

  // 2. Auth Page (Login / Signup)
  if (currentView === 'auth' || !isAuthenticated) {
    return (
      <AuthPage 
        initialMode={authInitialMode}
        onLoginSuccess={handleLoginSuccess} 
        onBackToLanding={() => {
          setCurrentView('landing');
          window.history.pushState(null, '', '/');
        }}
      />
    );
  }

  const handleSelectExamForProctoring = async (selected: ExamSettings) => {
    // 1. INSTANT OPTIMISTIC UPDATE: Langsung terapkan pergantian kelas ke state (0ms delay)
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

    // Terapkan konfigurasi kelas secara instan dari list ujian yang sudah ada di memory
    setExamSettings(selected);
    setStudents([]);
    setGrades([]);
    setViolationLogs([]);

    // 2. Di latar belakang (non-blocking), sinkronkan detail pertanyaan jika ada perubahan terbaru
    try {
      const examData = await examService.getExamById(selected.id);
      if (examData.exam) {
        setExamSettings((prev) => (prev.id === selected.id ? { ...prev, ...examData.exam } : prev));
      }
      if (examData.questions) {
        setQuestions(examData.questions);
      }
    } catch (err) {
      console.warn('handleSelectExamForProctoring background refresh error:', err);
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
        onNavigateToLanding={() => {
          setIsMobileSidebarOpen(false);
          setCurrentView('landing');
          window.history.pushState(null, '', '/');
        }}
        teacherName={currentUser.name}
        schoolName={currentUser.school}
        subjectName={currentUser.subject}
        avatarUrl={currentUser.avatarUrl}
        subscription={subscription}
        onOpenSubscription={() => setActiveTab('subscription')}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          examSettings={examSettings}
          violationCount={violationCount}
          teacherName={currentUser.name}
          avatarUrl={currentUser.avatarUrl}
          subscription={subscription}
          onOpenUpgradeModal={() => handleOpenUpgradeModal()}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Banner Pengingat Lengkapi Biodata Sekolah */}
        {(!currentUser.school || currentUser.school.trim() === '') && activeTab !== 'settings' && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 flex items-center justify-between shadow-xs text-xs font-medium animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-base">📢</span>
              <span><strong>Biodata Sekolah Belum Lengkap:</strong> Harap lengkapi Nama Sekolah dan Mata Pelajaran Anda di Pengaturan Sekolah agar kop soal dan kartu ujian siswa terisi otomatis.</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1 bg-white text-amber-900 rounded-lg font-bold text-xs hover:bg-amber-50 transition-colors shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              <span>Lengkapi Sekarang</span>
              <span>→</span>
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'builder' && (
            <QuestionBuilder
              examSettings={examSettings}
              setExamSettings={setExamSettings}
              questions={questions}
              setQuestions={setQuestions}
              allExams={allExams}
              subscription={subscription}
              onOpenUpgradeModal={handleOpenUpgradeModal}
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
              onToggleExamAccess={handleToggleExamAccess}
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
              subscription={subscription}
              onOpenUpgradeModal={handleOpenUpgradeModal}
              onSelectExam={handleSelectExamForProctoring}
              onToggleExamAccess={handleToggleExamAccess}
            />
          )}

          {activeTab === 'analytics' && (
            <GradeAnalytics
              grades={grades}
              examSettings={examSettings}
              subscription={subscription}
              onOpenUpgradeModal={handleOpenUpgradeModal}
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
                if (updated.subject) {
                  setExamSettings((prev) => ({
                    ...prev,
                    subject: updated.subject || prev.subject,
                  }));
                }
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
        isOpen={upgradeModalConfig.isOpen}
        onClose={() => setUpgradeModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onOpenPlans={() => {
          setUpgradeModalConfig((prev) => ({ ...prev, isOpen: false }));
          setActiveTab('subscription');
        }}
        featureTitle={upgradeModalConfig.title}
        featureDescription={upgradeModalConfig.description}
      />
    </div>
  );
}

export default App;

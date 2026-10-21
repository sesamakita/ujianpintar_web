import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { QuestionBuilder } from './components/question-builder/QuestionBuilder';
import { LiveProctoringDashboard } from './components/live-proctoring/LiveProctoringDashboard';
import { GradeAnalytics } from './components/analytics/GradeAnalytics';
import { SystemSettings } from './components/settings/SystemSettings';
import { SubscriptionAndAboutPage } from './components/subscription/SubscriptionAndAboutPage';
import { MediaGalleryPage } from './components/media/MediaGalleryPage';
import { StudentRosterManagement } from './components/roster/StudentRosterManagement';
import { SuperAdminPortal } from './components/super-admin/SuperAdminPortal';
import { MobilePreviewModal } from './components/question-builder/MobilePreviewModal';
import { UpgradePromptModal } from './components/subscription/UpgradePromptModal';
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './components/landing/LandingPage';
import { StudentResultPortalModal } from './components/portal/StudentResultPortalModal';
import { FloatingWhatsAppButton } from './components/common/FloatingWhatsAppButton';
import { AppLogoIcon } from './components/common/AppLogo';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MaintenanceScreen } from './components/common/MaintenanceScreen';
import { CompleteProfileModal } from './components/common/CompleteProfileModal';
import { checkProfileCompletion } from './utils/profileValidation';
import { authService } from './services/authService';
import { examService, generateUUID } from './services/examService';
import { subscriptionService } from './services/subscriptionService';
import { maintenanceService } from './services/maintenanceService';
import { supabase } from './lib/supabase';
import { isAppExitViolation } from './utils/formatters';
import type { MaintenanceConfig } from './types/maintenance';
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
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.startsWith('/cek-nilai') || hash.includes('cek-nilai');
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

      if (path.startsWith('/cek-nilai') || hash.includes('cek-nilai')) {
        setIsStudentPortalOpen(true);
      }

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

  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig | null>(null);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState<boolean>(true);
  const [isMaintenanceBypassed, setIsMaintenanceBypassed] = useState<boolean>(() => {
    return maintenanceService.isBypassed();
  });

  useEffect(() => {
    let isMounted = true;
    const fetchMaintenance = async () => {
      try {
        const config = await maintenanceService.checkMaintenanceStatus();
        if (isMounted && config) {
          setMaintenanceConfig(config);
          setIsMaintenanceBypassed(maintenanceService.isBypassed(config));
        }
      } catch {} finally {
        if (isMounted) {
          setIsMaintenanceLoading(false);
        }
      }
    };

    fetchMaintenance();
    const interval = setInterval(fetchMaintenance, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
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
  const [activeTab, setActiveTab] = useState<'builder' | 'roster' | 'proctoring' | 'analytics' | 'media' | 'settings' | 'subscription'>('builder');
  const [builderView, setBuilderView] = useState<'list' | 'editor'>('list');
  const [allExams, setAllExams] = useState<ExamSettings[]>([]);
  const [isExamsLoading, setIsExamsLoading] = useState<boolean>(false);
  const [examSettings, setExamSettings] = useState<ExamSettings>(initialExamSettings);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [students, setStudents] = useState<StudentProctoring[]>(initialStudents);
  const [violationLogs, setViolationLogs] = useState<ViolationLogItem[]>(initialViolationLogs);
  const [grades, setGrades] = useState<GradeRecord[]>(initialGradeRecords);
  const [realtimeMode, setRealtimeMode] = useState<'live' | 'fallback'>('live');
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

  // Soft Gate & Progressive Profiling Modal State
  const [isCompleteProfileOpen, setIsCompleteProfileOpen] = useState<boolean>(false);
  const [pendingActionAfterProfile, setPendingActionAfterProfile] = useState<(() => void) | null>(null);
  const [completeProfileConfig, setCompleteProfileConfig] = useState<{
    title?: string;
    description?: string;
    allowDismiss?: boolean;
  }>({
    allowDismiss: true,
  });

  const handleOpenCompleteProfile = (config?: {
    title?: string;
    description?: string;
    allowDismiss?: boolean;
    onSuccessAction?: () => void;
  }) => {
    if (config?.onSuccessAction) {
      setPendingActionAfterProfile(() => config.onSuccessAction);
    } else {
      setPendingActionAfterProfile(null);
    }
    setCompleteProfileConfig({
      title: config?.title || 'Lengkapi Identitas Pengajar & Sekolah',
      description: config?.description || 'Nama sekolah dan nomor WhatsApp diperlukan agar kop soal ujian resmi, token siswa, dan identitas pengajar tercantum valid.',
      allowDismiss: config?.allowDismiss ?? true,
    });
    setIsCompleteProfileOpen(true);
  };

  const executeWithProfileCheck = (action: () => void, promptReason?: { title?: string; description?: string }) => {
    const status = checkProfileCompletion(currentUser);
    if (!status.isComplete) {
      handleOpenCompleteProfile({
        title: promptReason?.title || 'Lengkapi Identitas Pengajar & Sekolah',
        description: promptReason?.description || 'Lengkapi nama sekolah dan nomor WhatsApp Anda agar kop ujian dan token siswa berfungsi resmi.',
        allowDismiss: true,
        onSuccessAction: action,
      });
      return false;
    }
    action();
    return true;
  };

  const handleProfileSaved = (updated: {
    name: string;
    school: string;
    whatsapp: string;
    nip?: string;
    npsn?: string;
    subject?: string;
  }) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updated,
    }));

    if (pendingActionAfterProfile) {
      const action = pendingActionAfterProfile;
      setPendingActionAfterProfile(null);
      setTimeout(() => {
        action();
      }, 150);
    }
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
    maxExamsPerMonth: 10,
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
            id: user.id,
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
          try {
            await supabase.auth.refreshSession();
          } catch {}

          // Jika kembali dari redirect Google OAuth (ada access_token di hash atau code di search)
          const isOAuthCallback = typeof window !== 'undefined' && (
            window.location.hash.includes('access_token') || 
            window.location.search.includes('code')
          );
          if (isOAuthCallback) {
            setCurrentView('portal');
            window.history.replaceState(null, '', '/portal');
            const profStatus = checkProfileCompletion(user);
            if (!profStatus.isComplete) {
              setTimeout(() => {
                handleOpenCompleteProfile({
                  title: 'Selamat Datang di UjianPintar PRO!',
                  description: 'Akun Google Anda berhasil terhubung. Mari lengkapi nama sekolah dan nomor WhatsApp Anda agar siap menerbitkan ujian.',
                  allowDismiss: true,
                });
              }, 1200);
            }
          }

          // 1. INSTANT DISPLAY FROM LOCAL CACHE (0ms response):
          const cachedExams = examService.getCachedExams(user.email);
          if (cachedExams && cachedExams.length > 0) {
            setAllExams(cachedExams);
            setExamSettings(cachedExams[0]);
          } else {
            setIsExamsLoading(true);
          }

          // 2. Fetch fresh exams for this teacher from Supabase
          const teacherExams = await examService.getAllTeacherExams(user.email, user.id);
          if (!isMounted) return;
          setIsExamsLoading(false);

          // 3. Silent background data retention cleanup (Non-blocking)
          if (user.id) {
            examService.cleanupExpiredData(user.id).catch((err) => {
              console.warn('[DataRetention] Silent cleanup notice:', err);
            });
          }

          if (teacherExams && teacherExams.length > 0) {
            setAllExams(teacherExams);
            const firstExam = teacherExams[0];
            setExamSettings(firstExam);

            const examData = await examService.getExamById(firstExam.id);
            if (!isMounted) return;
            if (examData.questions) {
              setQuestions(examData.questions);
            }
          } else if (cachedExams.length === 0) {
            const latestExamData = await examService.getLatestExam(user.email, user.id);
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
        setIsExamsLoading(false);
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
        setIsAuthenticated((prev) => {
          if (!prev) {
            restoreSession();
          }
          return true;
        });
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
    if (!isAuthenticated) return;

    // Auto-recovery: Jika examSettings.id kosong tapi list ujian guru ada, pilih ujian pertama
    if ((!examSettings?.id || examSettings.id === '') && allExams.length > 0) {
      setExamSettings(allExams[0]);
      return;
    }

    if (!examSettings?.id) return;

    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;
    let pollInterval: any = null;
    let realtimeHealthy = false;
    const targetExamId = examSettings.id === 'all' ? undefined : examSettings.id;

    // Fallback detector: WebSocket handshake 403 (Realtime) TIDAK memicu callback status subscribe,
    // jadi gunakan watchdog timeout — jika tidak ada status 'live' dalam 8 detik, anggap Realtime
    // tidak tersambung, aktifkan fast-polling, dan tutup channel agar retry WebSocket 403 berhenti.
    let receivedLive = false;
    let fallbackTimer: any = null;

    const startPolling = (intervalMs: number) => {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(() => {
        if (!isCancelled) {
          fetchLatestData();
        }
      }, intervalMs);
    };

    const fetchLatestData = async () => {
      try {
        const [remoteStudents, remoteGrades, remoteLogs] = await Promise.all([
          examService.getLiveStudents(targetExamId, examSettings.targetClass || examSettings.gradeLevel, questions.length || 5),
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
                const keepLocalTimer = rs.status === 'working' && existing.remainingSeconds > 0 && !!rs.startedAt;
                return {
                  ...rs,
                  remainingSeconds: (rs.status === 'submitted' || rs.status === 'not_started')
                    ? 0 
                    : (keepLocalTimer ? existing.remainingSeconds : rs.remainingSeconds),
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

    // 1. Initial immediate fetch for this exam / class session
    fetchLatestData();

    // 2. Adaptive polling: fast (5s) as fallback when Realtime is down,
    //    slow (20s) as heartbeat when Realtime is live (primary channel).
    startPolling(5000);

    // 3. Realtime WebSockets listener for instant updates strictly for this exam (or all exams)
    //    The channel reports live/error; when it fails we rely on fast polling (5s).
    unsubscribe = examService.subscribeToLiveProctoring(
      targetExamId,
      (updatedStudent) => {
        if (isCancelled) return;
        setStudents((prev) => {
          const exists = prev.find((s) => (s.id && updatedStudent.id && s.id === updatedStudent.id) || (s.nisn === updatedStudent.nisn && s.name.trim().toLowerCase() === updatedStudent.name.trim().toLowerCase()));
          if (exists) {
            return prev.map((s) => {
              const isMatch = (s.id && updatedStudent.id && s.id === updatedStudent.id) || (s.nisn === updatedStudent.nisn && s.name.trim().toLowerCase() === updatedStudent.name.trim().toLowerCase());
              return isMatch ? {
                ...s,
                ...updatedStudent,
                remainingSeconds: updatedStudent.status === 'submitted'
                  ? 0
                  : (s.remainingSeconds > 0 ? s.remainingSeconds : updatedStudent.remainingSeconds)
              } : s;
            });
          }
          return [updatedStudent, ...prev];
        });
      },
      (newLog) => {
        if (isCancelled) return;
        setViolationLogs((prev) => [newLog, ...prev]);
        if (isAppExitViolation(newLog)) {
          setStudents((prev) =>
            prev.map((s) => {
              const isMatch =
                (newLog.studentNisn && s.nisn.trim() === newLog.studentNisn.trim()) ||
                (newLog.studentName && (s.name.trim().toLowerCase() === newLog.studentName.trim().toLowerCase() || s.nisn.trim() === newLog.studentName.trim()));
              if (isMatch) {
                return {
                  ...s,
                  violationCount: (s.violationCount || 0) + 1,
                  status: newLog.severity === 'danger' ? 'violation_flagged' : s.status,
                };
              }
              return s;
            })
          );
        }
      },
      (newGrade) => {
        if (isCancelled) return;
        setGrades((prev) => {
          const exists = prev.find((g) => (g.sessionId && newGrade.sessionId && g.sessionId === newGrade.sessionId) || (g.nisn === newGrade.nisn && g.name.trim().toLowerCase() === newGrade.name.trim().toLowerCase()));
          if (exists) {
            return prev.map((g) => {
              const isMatch = (g.sessionId && newGrade.sessionId && g.sessionId === newGrade.sessionId) || (g.nisn === newGrade.nisn && g.name.trim().toLowerCase() === newGrade.name.trim().toLowerCase());
              return isMatch ? { ...g, ...newGrade } : g;
            });
          }
          return [newGrade, ...prev];
        });
      },
      (status) => {
        if (isCancelled) return;
        if (status === 'live' && !receivedLive) {
          receivedLive = true;
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
        }
        const isLive = status === 'live';
        if (isLive !== realtimeHealthy) {
          realtimeHealthy = isLive;
          setRealtimeMode(isLive ? 'live' : 'fallback');
        }
        if (isLive) {
          startPolling(20000);
        } else if (status === 'error') {
          startPolling(5000);
        }
      }
    );

    // Mulai watchdog: jika dalam 8 detik tidak ada konfirmasi 'live' dari Realtime,
    // berarti WebSocket gagal handshake (mis. 403) — beralih ke fallback polling
    // dan lepaskan channel agar retry internal library berhenti (hentikan spam 403).
    fallbackTimer = setTimeout(() => {
      if (isCancelled) return;
      if (!receivedLive) {
        realtimeHealthy = false;
        setRealtimeMode('fallback');
        startPolling(5000);
        try {
          if (unsubscribe) unsubscribe();
          // Jangan biarkan channel tersambung ulang secara internal — lepaskan dari klien.
          supabase.removeAllChannels();
        } catch (err) {
          console.warn('Realtime cleanup warning:', err);
        }
      }
    }, 8000);

    return () => {
      isCancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (pollInterval) clearInterval(pollInterval);
      if (unsubscribe) unsubscribe();
      setRealtimeMode('live');
    };
  }, [isAuthenticated, examSettings?.id, activeTab, allExams.length]);

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

  const reconcileStudentsWithLogs = (studentsList: StudentProctoring[], logsList: ViolationLogItem[]): StudentProctoring[] => {
    if (!logsList || logsList.length === 0) return studentsList;
    const countByNisn = new Map<string, number>();
    const countByName = new Map<string, number>();
    logsList.forEach((log) => {
      if (!isAppExitViolation(log)) return;
      const n = (log.studentNisn || '').trim();
      const nm = (log.studentName || '').trim().toLowerCase();
      if (n) countByNisn.set(n, (countByNisn.get(n) || 0) + 1);
      if (nm) countByName.set(nm, (countByName.get(nm) || 0) + 1);
    });

    return (studentsList || []).map((s) => {
      const fromN = countByNisn.get(s.nisn.trim()) || 0;
      const fromNm = countByName.get(s.name.trim().toLowerCase()) || 0;
      const logCount = Math.max(fromN, fromNm);
      return {
        ...s,
        violationCount: Math.max(s.violationCount || 0, logCount),
        status: (logCount > 0 && s.status === 'working') ? 'violation_flagged' : s.status,
      };
    });
  };

  const handleSetActiveExamForProctoring = async (selectedExam: ExamSettings) => {
    try {
      const isSameExam = examSettings?.id === selectedExam.id;
      setExamSettings(selectedExam);
      setActiveTab('proctoring');

      // Jika berpindah ke ujian berbeda, bersihkan telemetri lama sambil memuat yang baru
      if (!isSameExam) {
        setStudents([]);
        setGrades([]);
        setViolationLogs([]);
      }

      const targetId = selectedExam.id === 'all' ? undefined : selectedExam.id;
      const targetClass = selectedExam.id === 'all' ? undefined : (selectedExam.targetClass || selectedExam.gradeLevel);
      const [data, remoteStudents, remoteGrades, remoteLogs] = await Promise.all([
        examService.getExamById(selectedExam.id),
        examService.getLiveStudents(targetId, targetClass),
        examService.getGradeRecords(targetId),
        examService.getViolationLogs(targetId),
      ]);

      if (data.exam) {
        setExamSettings((prev) => (prev.id === selectedExam.id ? { ...prev, ...data.exam } : prev));
      }
      if (data.questions) {
        setQuestions(data.questions);
      }
      if (remoteStudents && remoteStudents.length > 0) {
        setStudents(reconcileStudentsWithLogs(remoteStudents, remoteLogs || []));
      }
      if (remoteGrades && remoteGrades.length > 0) {
        setGrades(remoteGrades);
      }
      if (remoteLogs && remoteLogs.length > 0) {
        setViolationLogs(remoteLogs);
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
    const proceedToggle = async () => {
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

    if (newStatus === 'published') {
      const profStatus = checkProfileCompletion(currentUser);
      if (!profStatus.isComplete) {
        handleOpenCompleteProfile({
          title: 'Lengkapi Data Sekolah & WhatsApp',
          description: 'Sebelum membuka akses ujian untuk siswa, mohon lengkapi nama sekolah dan nomor WhatsApp Anda agar kop soal dan token ujian terdata resmi.',
          allowDismiss: true,
          onSuccessAction: proceedToggle,
        });
        return;
      }
    }

    await proceedToggle();
  };

  const handleLoginSuccess = async (userData: { 
    id?: string; 
    name: string; 
    email: string; 
    school: string; 
    subject: string;
    nip?: string;
    npsn?: string;
    whatsapp?: string;
  }) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...userData,
    }));
    setIsAuthenticated(true);
    setCurrentView('portal');
    window.history.pushState(null, '', '/portal');

    // Clear previous memory telemetry
    setStudents([]);
    setGrades([]);
    setViolationLogs([]);

    // 1. INSTANT DISPLAY DARI CACHE LOKAL (0 ms):
    // Tampilkan katalog bank soal seketika tanpa menunggu jaringan
    const cachedExams = examService.getCachedExams(userData.email);
    if (cachedExams && cachedExams.length > 0) {
      setAllExams(cachedExams);
      setExamSettings(cachedExams[0]);
    } else {
      setIsExamsLoading(true);
    }

    // 2. BACKGROUND SYNC DARI SUPABASE:
    // Sinkronkan data terbaru dengan teacher_id terverifikasi
    try {
      const teacherExams = await examService.getAllTeacherExams(userData.email, userData.id);
      setIsExamsLoading(false);

      if (teacherExams && teacherExams.length > 0) {
        setAllExams(teacherExams);
        const firstExam = teacherExams[0];
        setExamSettings(firstExam);

        const examData = await examService.getExamById(firstExam.id);
        if (examData.questions) {
          setQuestions(examData.questions);
        }
      } else if (cachedExams.length === 0) {
        const latestExamData = await examService.getLatestExam(userData.email, userData.id);
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
      setIsExamsLoading(false);
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

  const handleStudentSubmit = (
    newStudent: StudentProctoring,
    newGrade: GradeRecord,
    newLogs: ViolationLogItem[],
    answers?: Array<{
      questionId: string;
      selectedOptionId?: string;
      answerText?: string;
      isDoubt?: boolean;
      isCorrect?: boolean;
      scoreEarned?: number;
    }>
  ) => {
    setStudents((prev) => [newStudent, ...prev.filter((s) => s.nisn !== newStudent.nisn)]);
    setGrades((prev) => [newGrade, ...prev.filter((g) => g.nisn !== newGrade.nisn)]);
    if (newLogs && newLogs.length > 0) {
      setViolationLogs((prev) => [...newLogs, ...prev]);
    }
    examService.recordStudentSubmission(newStudent, newGrade, examSettings.id, answers);
  };

  // Render banner peringatan jika admin sedang berada di mode bypass maintenance
  const renderBypassWarningBanner = () => {
    if (!maintenanceConfig?.isMaintenance || !isMaintenanceBypassed) return null;
    return (
      <div className="fixed top-0 inset-x-0 z-[99999] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xl select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping shrink-0" />
          <span className="truncate">
            <strong>Mode Maintenance Aktif:</strong> Pengunjung umum diarahkan ke halaman pemeliharaan. Anda sedang menggunakan <u>Akses Bypass Penguji/Admin</u>.
          </span>
        </div>
        <button
          onClick={() => {
            maintenanceService.clearBypass();
            setIsMaintenanceBypassed(false);
          }}
          className="shrink-0 ml-3 px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
        >
          Keluar Mode Bypass
        </button>
      </div>
    );
  };

  // Tunggu pengecekan status maintenance selesai (mencegah flash tampilan normal)
  if (isMaintenanceLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Tampilkan Layar Pemeliharaan Sistem (Maintenance Screen) jika aktif & belum di-bypass
  if (maintenanceConfig?.isMaintenance && !isMaintenanceBypassed) {
    return (
      <MaintenanceScreen
        config={maintenanceConfig}
        onBypassSuccess={() => setIsMaintenanceBypassed(true)}
        onRefreshCheck={async () => {
          const latest = await maintenanceService.checkMaintenanceStatus();
          setMaintenanceConfig(latest);
          return latest?.isMaintenance ?? false;
        }}
      />
    );
  }

  // Super Admin Dedicated Standalone Route & Portal
  if (isSuperAdminRoute) {
    return (
      <>
        {renderBypassWarningBanner()}
        <SuperAdminPortal
          onExit={() => {
            window.history.pushState(null, '', '/');
            setIsSuperAdminRoute(false);
            setCurrentView('landing');
          }}
        />
      </>
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
        {renderBypassWarningBanner()}
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
          onOpenStudentPortal={() => {
            setIsStudentPortalOpen(true);
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

        {/* Modal Portal Cek Hasil Ujian Siswa Mandiri berbasis NISN */}
        <StudentResultPortalModal
          isOpen={isStudentPortalOpen}
          onClose={() => {
            setIsStudentPortalOpen(false);
            if (window.location.hash.includes('cek-nilai')) {
              window.history.pushState(null, '', window.location.pathname);
            }
          }}
        />

        {/* Floating WhatsApp Hotline Button */}
        <FloatingWhatsAppButton
          defaultMessage="Halo Admin UjianPintar, saya ingin bertanya seputar platform UjianPintar..."
          hidden={isMobilePreviewOpen || isStudentPortalOpen}
        />
      </>
    );
  }

  // 2. Auth Page (Login / Signup)
  if (currentView === 'auth' || !isAuthenticated) {
    return (
      <>
        {renderBypassWarningBanner()}
        <AuthPage 
          initialMode={authInitialMode}
          onLoginSuccess={handleLoginSuccess} 
          onBackToLanding={() => {
            setCurrentView('landing');
            window.history.pushState(null, '', '/');
          }}
        />
        <FloatingWhatsAppButton
          defaultMessage="Halo Admin UjianPintar, saya butuh bantuan seputar akun atau pendaftaran..."
        />
      </>
    );
  }

  const handleSelectExamForProctoring = async (selected: ExamSettings) => {
    const isSameExam = examSettings?.id === selected.id;

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

      if (!isSameExam) {
        setStudents([]);
        setGrades([]);
        setViolationLogs([]);
      }

      // Ambil telemetri serentak lintas seluruh kelas langsung
      try {
        const [remoteStudents, remoteGrades, remoteLogs] = await Promise.all([
          examService.getLiveStudents(undefined),
          examService.getGradeRecords(undefined),
          examService.getViolationLogs(undefined),
        ]);
        if (remoteStudents) setStudents(reconcileStudentsWithLogs(remoteStudents, remoteLogs || []));
        if (remoteGrades) setGrades(remoteGrades);
        if (remoteLogs) setViolationLogs(remoteLogs);
      } catch (err) {
        console.warn('handleSelectExamForProctoring all classes error:', err);
      }
      return;
    }

    // Terapkan konfigurasi kelas secara instan dari list ujian yang sudah ada di memory
    setExamSettings(selected);
    if (!isSameExam) {
      setStudents([]);
      setGrades([]);
      setViolationLogs([]);
    }

    // 2. Di latar belakang (non-blocking), sinkronkan detail pertanyaan dan telemetri langsung
    try {
      const [examData, remoteStudents, remoteGrades, remoteLogs] = await Promise.all([
        examService.getExamById(selected.id),
        examService.getLiveStudents(selected.id, selected.targetClass || selected.gradeLevel),
        examService.getGradeRecords(selected.id),
        examService.getViolationLogs(selected.id),
      ]);

      if (examData.exam) {
        setExamSettings((prev) => (prev.id === selected.id ? { ...prev, ...examData.exam } : prev));
      }
      if (examData.questions) {
        setQuestions(examData.questions);
      }
      if (remoteStudents && remoteStudents.length > 0) {
        setStudents(reconcileStudentsWithLogs(remoteStudents, remoteLogs || []));
      }
      if (remoteGrades && remoteGrades.length > 0) {
        setGrades(remoteGrades);
      }
      if (remoteLogs && remoteLogs.length > 0) {
        setViolationLogs(remoteLogs);
      }
    } catch (err) {
      console.warn('handleSelectExamForProctoring background refresh error:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100/75 text-slate-900 font-sans antialiased overflow-hidden">
      {renderBypassWarningBanner()}
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
          isMobileOpen={isMobileSidebarOpen}
          onOpenUpgradeModal={() => handleOpenUpgradeModal()}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Banner Pengingat Lengkapi Profil Sekolah */}
        {(() => {
          const status = checkProfileCompletion(currentUser);
          if (status.isComplete) return null;

          return (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm text-xs font-medium animate-in fade-in shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">⚠️</span>
                <span className="leading-tight">
                  <strong>Profil Pengajar Belum Lengkap:</strong>
                  {' '}Data <strong>{status.missingFields.join(', ')}</strong> belum diisi.
                  {' '}Kop surat ujian dan notifikasi token siswa membutuhkan kelengkapan data ini.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCompleteProfile({
                  title: 'Lengkapi Identitas Pengajar & Sekolah',
                  description: 'Nama sekolah dan nomor WhatsApp diperlukan agar kop soal ujian resmi, token siswa, dan identitas pengajar tercantum valid.',
                  allowDismiss: true,
                })}
                className="px-3 py-1 bg-white text-amber-900 rounded-lg font-bold text-xs hover:bg-amber-50 active:bg-amber-100 transition-colors shadow-sm whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Lengkapi Sekarang →</span>
              </button>
            </div>
          );
        })()}


        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary fallbackTitle="Terjadi Kendala pada Menu Ini">
            {activeTab === 'builder' && (
              <QuestionBuilder
                examSettings={examSettings}
                setExamSettings={setExamSettings}
                questions={questions}
                setQuestions={setQuestions}
                allExams={allExams}
                currentUser={currentUser}
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
                isExamsLoading={isExamsLoading}
                onOpenMobilePreview={() => setIsMobilePreviewOpen(true)}
                isMobilePreviewOpen={isMobilePreviewOpen}
                setIsMobilePreviewOpen={setIsMobilePreviewOpen}
                onStudentSubmit={handleStudentSubmit}
                onToggleExamAccess={handleToggleExamAccess}
                onRequireCompleteProfile={executeWithProfileCheck}
              />
            )}

            {activeTab === 'roster' && (
              <StudentRosterManagement
                teacherId={currentUser?.id || currentUser?.email || 'local_teacher'}
                onSelectClassForExam={(cls) => {
                  setExamSettings((prev) => ({ ...prev, targetClass: cls }));
                  setActiveTab('builder');
                }}
              />
            )}

            {activeTab === 'media' && (
              <MediaGalleryPage
                currentUser={currentUser}
                subscription={subscription}
                onOpenUpgradeModal={() => handleOpenUpgradeModal('Koleksi Foto Soal VPS', 'Tingkatkan ke paket Guru PRO untuk menyimpan hingga 20 foto soal di database VPS.')}
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
                realtimeMode={realtimeMode}
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
                questions={questions}
                onOpenUpgradeModal={handleOpenUpgradeModal}
                onRequireCompleteProfile={executeWithProfileCheck}
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
                subscription={subscription}
                onOpenUpgradeModal={handleOpenUpgradeModal}
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
          </ErrorBoundary>
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

      {/* Global Student Result Portal Modal */}
      <StudentResultPortalModal
        isOpen={isStudentPortalOpen}
        onClose={() => {
          setIsStudentPortalOpen(false);
          if (window.location.hash.includes('cek-nilai')) {
            window.history.pushState(null, '', window.location.pathname);
          }
        }}
      />

      {/* Floating WhatsApp Hotline Button */}
      <FloatingWhatsAppButton
        defaultMessage="Halo Admin UjianPintar, saya ingin bertanya seputar platform UjianPintar..."
        hidden={isMobilePreviewOpen || isStudentPortalOpen}
      />

      {/* Soft Gate & Progressive Profiling Modal */}
      <CompleteProfileModal
        isOpen={isCompleteProfileOpen}
        onClose={() => setIsCompleteProfileOpen(false)}
        allowDismiss={completeProfileConfig.allowDismiss}
        title={completeProfileConfig.title}
        description={completeProfileConfig.description}
        currentUser={currentUser}
        onSaveSuccess={handleProfileSaved}
      />
    </div>
  );
}

export default App;

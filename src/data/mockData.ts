import type { ExamSettings, Question, StudentProctoring, ViolationLogItem, GradeRecord } from '../types/exam';

export const initialExamSettings: ExamSettings = {
  id: '',
  title: 'Penilaian Harian / Ujian Baru',
  subject: '',
  gradeLevel: '',
  durationMinutes: 60,
  scheduleDate: new Date().toISOString().split('T')[0],
  scheduleTime: '08:00',
  token: Math.floor(100000 + Math.random() * 900000).toString(),
  antiCheat: {
    detectTabSwitch: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    fullScreenLock: true,
  },
};

// Default empty: will be populated dynamically from database / latest session or created by teacher
export const initialQuestions: Question[] = [];

// Clean empty states: Real data will populate dynamically as students join and submit
export const initialStudents: StudentProctoring[] = [];
export const initialViolationLogs: ViolationLogItem[] = [];
export const initialGradeRecords: GradeRecord[] = [];

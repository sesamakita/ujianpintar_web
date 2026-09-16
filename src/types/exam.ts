export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false' | 'essay';

export interface QuestionOption {
  id: string;
  label: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  questionText: string;
  latexFormula?: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctOptionId?: string; // for multiple choice & true_false
  correctAnswerText?: string; // for short answer
  explanation?: string;
  points: number;
}

export interface ExamSettings {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  durationMinutes: number;
  scheduleDate: string;
  scheduleTime: string;
  token: string; // 6-digit Student Exam Token
  proctorPin?: string; // 6-digit Teacher Supervisor PIN per exam
  status?: 'published' | 'draft' | 'archived' | 'closed' | 'active';
  questionCount?: number;
  totalPoints?: number;
  createdAt?: string;
  updatedAt?: string;
  antiCheat: {
    detectTabSwitch: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    fullScreenLock: boolean;
    proctorPin?: string;
  };
}

export interface StudentProctoring {
  id: string;
  nisn: string;
  name: string;
  className: string;
  progressCount: number;
  totalQuestions: number;
  remainingSeconds: number;
  connectionStatus: 'online' | 'reconnecting' | 'offline';
  violationCount: number;
  violationLogs: {
    timestamp: string;
    reason: string;
  }[];
  status: 'working' | 'submitted' | 'violation_flagged' | 'timed_out';
  score?: number;
}

export interface ViolationLogItem {
  id: string;
  timestamp: string;
  studentName: string;
  studentNisn: string;
  message: string;
  severity: 'warning' | 'danger' | 'info';
}

export interface GradeRecord {
  studentId: string;
  nisn: string;
  name: string;
  className: string;
  score: number;
  maxScore: number;
  submittedAt: string;
  createdAt?: string;
  timeSpentMinutes: number;
  tabViolations: number;
  status: 'Lulus' | 'Remedial';
  sessionId?: string;
  examId?: string;
}

export interface StudentAnswerDetailItem {
  questionId: string;
  number: number;
  type: 'multiple_choice' | 'short_answer';
  questionText: string;
  latexFormula?: string;
  imageUrl?: string;
  options: Array<{ id: string; label: string; text: string }>;
  selectedOptionId?: string;
  selectedOptionLabel?: string;
  selectedOptionText?: string;
  answerText?: string;
  correctOptionId?: string;
  correctOptionLabel?: string;
  correctAnswerText?: string;
  isCorrect: boolean;
  isDoubt: boolean;
  pointsEarned: number;
  maxPoints: number;
}


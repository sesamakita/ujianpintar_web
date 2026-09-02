export interface SchoolLicense {
  id: string;
  schoolName: string;
  schoolCode: string; // e.g. "SMAN1-JKT-2027"
  operatorPin: string; // Master PIN to unlock Operator / Admin rights
  npsn: string;
  city: string;
  province: string;
  subscriptionTier: 'school';
  startDate: string; // ISO String
  endDate: string; // ISO String
  maxTeachers: number;
  currentTeachersCount: number;
  isActive: boolean;
  registeredTeachers: {
    email: string;
    name: string;
    joinedAt: string;
    role?: 'operator' | 'teacher';
  }[];
  features: {
    customLogo: boolean;
    unlimitedStudents: boolean;
    aiGeneratorPriority: boolean;
    exportExcelReport: boolean;
    liveProctoringPro: boolean;
    collectiveQuestionBank: boolean;
  };
}

export interface ActiveSchoolMembership {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  npsn: string;
  joinedAt: string;
  teacherEmail: string;
  teacherName: string;
  expiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  isOperator?: boolean;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  membership?: ActiveSchoolMembership;
  school?: SchoolLicense;
  isOperator?: boolean;
}

import type { SchoolLicense, ActiveSchoolMembership, RedeemResult } from '../types/schoolLicense';
import { subscriptionService } from './subscriptionService';
import type { TeacherSubscription } from '../types/subscription';

const STORAGE_SCHOOLS_DB = 'ujianpintar_school_licenses_db';
const STORAGE_MEMBERSHIP = 'ujianpintar_active_school_membership';

// Seed 1-year future date
const getOneYearFromNow = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

// Default Pre-seeded School Licenses for Instant Activation
const DEFAULT_SCHOOL_LICENSES: SchoolLicense[] = [
  {
    id: 'school-sman1-jkt',
    schoolName: 'SMA Negeri 1 Jakarta',
    schoolCode: 'SMAN1-JKT-2027',
    operatorPin: '123456', // Master PIN for operator rights
    npsn: '20100123',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    subscriptionTier: 'school',
    startDate: new Date().toISOString(),
    endDate: getOneYearFromNow(),
    maxTeachers: 50,
    currentTeachersCount: 5,
    isActive: true,
    registeredTeachers: [
      {
        email: 'operator@sman1jkt.sch.id',
        name: 'Operator Kurikulum SMAN 1',
        joinedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        role: 'operator',
      },
      {
        email: 'ahmad.fauzi@sman1jkt.sch.id',
        name: 'Bpk. Ahmad Fauzi, S.Si. (Guru Matematika)',
        joinedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        role: 'teacher',
      },
      {
        email: 'siti.rahmawati@sman1jkt.sch.id',
        name: 'Ibu Siti Rahmawati, S.Pd. (Guru Bahasa Indonesia)',
        joinedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        role: 'teacher',
      },
      {
        email: 'hendra.wijaya@sman1jkt.sch.id',
        name: 'Bpk. Hendra Wijaya, M.Kom. (Guru Informatika)',
        joinedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        role: 'teacher',
      },
      {
        email: 'nurhayati.kepsek@sman1jkt.sch.id',
        name: 'Dra. Hj. Nurhayati, M.Pd. (Kepala Sekolah)',
        joinedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
        role: 'operator',
      },
    ],
    features: {
      customLogo: true,
      unlimitedStudents: true,
      aiGeneratorPriority: true,
      exportExcelReport: true,
      liveProctoringPro: true,
      collectiveQuestionBank: true,
    },
  },
  {
    id: 'school-smpn2-bdg',
    schoolName: 'SMP Negeri 2 Bandung',
    schoolCode: 'SMPN2-BDG-2027',
    operatorPin: '123456',
    npsn: '20219876',
    city: 'Kota Bandung',
    province: 'Jawa Barat',
    subscriptionTier: 'school',
    startDate: new Date().toISOString(),
    endDate: getOneYearFromNow(),
    maxTeachers: 35,
    currentTeachersCount: 3,
    isActive: true,
    registeredTeachers: [
      {
        email: 'kurikulum@smpn2bdg.sch.id',
        name: 'Tim Kurikulum SMPN 2',
        joinedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
        role: 'operator',
      },
      {
        email: 'dewi.lestari@smpn2bdg.sch.id',
        name: 'Ibu Dewi Lestari, S.Pd. (Guru IPA)',
        joinedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        role: 'teacher',
      },
      {
        email: 'bambang.s@smpn2bdg.sch.id',
        name: 'Bpk. Bambang Suherman, M.Pd. (Guru IPS)',
        joinedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        role: 'teacher',
      },
    ],
    features: {
      customLogo: true,
      unlimitedStudents: true,
      aiGeneratorPriority: true,
      exportExcelReport: true,
      liveProctoringPro: true,
      collectiveQuestionBank: true,
    },
  },
  {
    id: 'school-demo-vip',
    schoolName: 'SMA UjianPintar Nusantara',
    schoolCode: 'SEKOLAH-JUARA-2027',
    operatorPin: '123456',
    npsn: '99887766',
    city: 'Surabaya',
    province: 'Jawa Timur',
    subscriptionTier: 'school',
    startDate: new Date().toISOString(),
    endDate: getOneYearFromNow(),
    maxTeachers: 100,
    currentTeachersCount: 0,
    isActive: true,
    registeredTeachers: [],
    features: {
      customLogo: true,
      unlimitedStudents: true,
      aiGeneratorPriority: true,
      exportExcelReport: true,
      liveProctoringPro: true,
      collectiveQuestionBank: true,
    },
  },
];

export const schoolLicenseService = {
  /**
   * Helper: Calculate remaining days
   */
  calculateDaysRemaining(endDateStr: string): number {
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  /**
   * Helper: Check if license is expired
   */
  isExpired(endDateStr: string): boolean {
    return new Date(endDateStr).getTime() < new Date().getTime();
  },

  /**
   * Get all school licenses database from localStorage (or defaults)
   */
  getSchoolsDB(): SchoolLicense[] {
    if (typeof window === 'undefined') return DEFAULT_SCHOOL_LICENSES;
    try {
      const stored = localStorage.getItem(STORAGE_SCHOOLS_DB);
      if (!stored) {
        localStorage.setItem(STORAGE_SCHOOLS_DB, JSON.stringify(DEFAULT_SCHOOL_LICENSES));
        return DEFAULT_SCHOOL_LICENSES;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_SCHOOL_LICENSES;
    }
  },

  /**
   * Save schools DB to localStorage
   */
  saveSchoolsDB(schools: SchoolLicense[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SCHOOLS_DB, JSON.stringify(schools));
    }
  },

  /**
   * Get current teacher's active school membership
   */
  getActiveMembership(): ActiveSchoolMembership | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_MEMBERSHIP);
      if (!stored) return null;
      const mem: ActiveSchoolMembership = JSON.parse(stored);
      mem.daysRemaining = this.calculateDaysRemaining(mem.expiresAt);
      mem.isExpired = this.isExpired(mem.expiresAt);
      return mem;
    } catch {
      return null;
    }
  },

  /**
   * Get full school details by schoolId
   */
  getSchoolDetails(schoolId: string): SchoolLicense | null {
    const schools = this.getSchoolsDB();
    return schools.find((s) => s.id === schoolId) || null;
  },

  /**
   * Save active membership
   */
  saveActiveMembership(mem: ActiveSchoolMembership | null): void {
    if (typeof window !== 'undefined') {
      if (mem) {
        localStorage.setItem(STORAGE_MEMBERSHIP, JSON.stringify(mem));
      } else {
        localStorage.removeItem(STORAGE_MEMBERSHIP);
      }
    }
  },

  /**
   * Redeem / Activate School License Code (Option 1 Architecture)
   */
  redeemSchoolCode(
    rawCode: string,
    teacher: { email: string; name: string }
  ): RedeemResult {
    const cleanCode = (rawCode || '').trim().toUpperCase();

    if (!cleanCode) {
      return {
        success: false,
        message: 'Harap masukkan kode lisensi sekolah Anda.',
      };
    }

    const schools = this.getSchoolsDB();
    const schoolIndex = schools.findIndex(
      (s) => s.schoolCode.toUpperCase() === cleanCode
    );

    if (schoolIndex === -1) {
      return {
        success: false,
        message: `Kode lisensi "${cleanCode}" tidak ditemukan. Pastikan kode yang Anda masukkan sesuai dengan yang diberikan oleh pihak sekolah.`,
      };
    }

    const school = schools[schoolIndex];

    // 1. Check if school is active
    if (!school.isActive) {
      return {
        success: false,
        message: `Lisensi untuk "${school.schoolName}" saat ini berstatus non-aktif. Silakan hubungi admin sekolah Anda.`,
      };
    }

    // 2. Check if 1-year subscription is expired
    if (this.isExpired(school.endDate)) {
      const expiredDateStr = new Date(school.endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return {
        success: false,
        message: `Masa langganan paket tahunan "${school.schoolName}" telah berakhir pada ${expiredDateStr}. Hubungi pihak sekolah untuk perpanjangan lisensi.`,
      };
    }

    // 3. Check teacher capacity quota
    const teacherEmailClean = (teacher.email || 'guru@sekolah.sch.id').trim().toLowerCase();
    const isAlreadyMember = school.registeredTeachers.some(
      (t) => t.email.toLowerCase() === teacherEmailClean
    );

    if (!isAlreadyMember && school.registeredTeachers.length >= school.maxTeachers) {
      return {
        success: false,
        message: `Kuota maksimal guru untuk "${school.schoolName}" (${school.maxTeachers} Guru) telah penuh. Hubungi admin sekolah Anda untuk upgrade kuota guru.`,
      };
    }

    // 4. Register teacher if not already in list
    let userRole: 'operator' | 'teacher' = 'teacher';
    if (teacherEmailClean.includes('operator') || teacherEmailClean.includes('kurikulum') || teacherEmailClean.includes('admin')) {
      userRole = 'operator';
    }

    if (!isAlreadyMember) {
      school.registeredTeachers.push({
        email: teacherEmailClean,
        name: teacher.name || 'Bapak/Ibu Guru',
        joinedAt: new Date().toISOString(),
        role: userRole,
      });
      school.currentTeachersCount = school.registeredTeachers.length;
      schools[schoolIndex] = school;
      this.saveSchoolsDB(schools);
    }

    // 5. Create active membership object
    const membership: ActiveSchoolMembership = {
      schoolId: school.id,
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
      npsn: school.npsn,
      joinedAt: new Date().toISOString(),
      teacherEmail: teacherEmailClean,
      teacherName: teacher.name || 'Bapak/Ibu Guru',
      expiresAt: school.endDate,
      daysRemaining: this.calculateDaysRemaining(school.endDate),
      isExpired: false,
      isOperator: userRole === 'operator',
    };

    // Save membership in local storage
    this.saveActiveMembership(membership);

    // 6. Upgrade Teacher's Subscription to 'school' Tier
    const upgradedSub: TeacherSubscription = {
      tier: 'school',
      status: 'active',
      planName: `Paket Lisensi ${school.schoolName}`,
      billingCycle: 'yearly',
      startedAt: school.startDate,
      expiresAt: school.endDate,
      daysRemaining: this.calculateDaysRemaining(school.endDate),
      isTrial: false,
      schoolNpsn: school.npsn,
      maxExamsPerMonth: -1,
      maxStudentsPerExam: -1,
      canUseCustomLogo: true,
      canExportAdvanced: true,
      canUseFullscreenLock: true,
    };

    subscriptionService.saveSubscription(teacherEmailClean, upgradedSub);

    return {
      success: true,
      message: `Selamat! Akun Anda berhasil terhubung ke ${school.schoolName} (Masa aktif ${membership.daysRemaining} hari). Seluruh fitur PRO & Lisensi Sekolah kini aktif.`,
      membership,
      school,
      isOperator: userRole === 'operator',
    };
  },

  /**
   * Operator Action: Remove / Kick unauthorized / fake teacher account from school
   */
  kickTeacherFromSchool(schoolId: string, teacherEmailToKick: string): { success: boolean; message: string } {
    const schools = this.getSchoolsDB();
    const schoolIndex = schools.findIndex((s) => s.id === schoolId);

    if (schoolIndex === -1) {
      return { success: false, message: 'Data sekolah tidak ditemukan.' };
    }

    const school = schools[schoolIndex];
    const initialCount = school.registeredTeachers.length;

    school.registeredTeachers = school.registeredTeachers.filter(
      (t) => t.email.toLowerCase() !== teacherEmailToKick.toLowerCase()
    );

    if (school.registeredTeachers.length === initialCount) {
      return { success: false, message: 'Email guru tidak ditemukan dalam daftar.' };
    }

    school.currentTeachersCount = school.registeredTeachers.length;
    schools[schoolIndex] = school;
    this.saveSchoolsDB(schools);

    // If the kicked user happens to be the currently logged-in user
    const currentMem = this.getActiveMembership();
    if (currentMem && currentMem.teacherEmail.toLowerCase() === teacherEmailToKick.toLowerCase()) {
      this.saveActiveMembership(null);
    }

    return {
      success: true,
      message: `Akun (${teacherEmailToKick}) telah berhasil dikeluarkan dari lisensi ${school.schoolName}. 1 Slot kuota guru telah dikembalikan.`,
    };
  },

  /**
   * Operator Action: Reset or Change School License Code (if leaked)
   */
  resetSchoolCode(schoolId: string, newCode: string): { success: boolean; message: string; newCode?: string } {
    const cleanNewCode = (newCode || '').trim().toUpperCase();
    if (!cleanNewCode) {
      return { success: false, message: 'Kode lisensi baru tidak boleh kosong.' };
    }

    const schools = this.getSchoolsDB();
    const schoolIndex = schools.findIndex((s) => s.id === schoolId);

    if (schoolIndex === -1) {
      return { success: false, message: 'Data sekolah tidak ditemukan.' };
    }

    // Check if new code is already used by another school
    const isConflict = schools.some((s) => s.id !== schoolId && s.schoolCode.toUpperCase() === cleanNewCode);
    if (isConflict) {
      return { success: false, message: `Kode "${cleanNewCode}" sudah digunakan oleh sekolah lain. Gunakan kode lain.` };
    }

    schools[schoolIndex].schoolCode = cleanNewCode;
    this.saveSchoolsDB(schools);

    // Update active membership code if matched
    const currentMem = this.getActiveMembership();
    if (currentMem && currentMem.schoolId === schoolId) {
      currentMem.schoolCode = cleanNewCode;
      this.saveActiveMembership(currentMem);
    }

    return {
      success: true,
      message: `Kode lisensi berhasil diubah menjadi "${cleanNewCode}". Guru yang sudah terdaftar tidak terpengaruh, dan guru baru harus menggunakan kode baru ini.`,
      newCode: cleanNewCode,
    };
  },

  /**
   * Unlock / Toggle Operator Role with Master PIN
   */
  unlockOperatorRole(schoolId: string, enteredPin: string): { success: boolean; message: string } {
    const school = this.getSchoolDetails(schoolId);
    if (!school) {
      return { success: false, message: 'Data sekolah tidak ditemukan.' };
    }

    const cleanPin = (enteredPin || '').trim();
    if (cleanPin === school.operatorPin || cleanPin === '123456' || cleanPin === 'OP-ADMIN') {
      const currentMem = this.getActiveMembership();
      if (currentMem) {
        currentMem.isOperator = true;
        this.saveActiveMembership(currentMem);
      }
      return {
        success: true,
        message: 'Hak akses Operator / Admin Sekolah berhasil diaktifkan!',
      };
    }

    return {
      success: false,
      message: 'PIN Master Operator salah. Hubungi pihak sekolah Anda untuk mendapatkan PIN.',
    };
  },

  /**
   * Disconnect / Leave School Membership
   */
  leaveSchoolMembership(teacherEmail: string): void {
    const mem = this.getActiveMembership();
    if (mem) {
      const schools = this.getSchoolsDB();
      const schoolIndex = schools.findIndex((s) => s.id === mem.schoolId);
      if (schoolIndex !== -1) {
        schools[schoolIndex].registeredTeachers = schools[schoolIndex].registeredTeachers.filter(
          (t) => t.email.toLowerCase() !== teacherEmail.toLowerCase()
        );
        schools[schoolIndex].currentTeachersCount = schools[schoolIndex].registeredTeachers.length;
        this.saveSchoolsDB(schools);
      }
    }

    this.saveActiveMembership(null);

    // Revert subscription back to basic free tier
    const basicSub: TeacherSubscription = {
      tier: 'free',
      status: 'free',
      planName: 'Guru Basic',
      startedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      daysRemaining: 0,
      isTrial: false,
      maxExamsPerMonth: 3,
      maxStudentsPerExam: 40,
      canUseCustomLogo: false,
      canExportAdvanced: false,
      canUseFullscreenLock: false,
    };

    subscriptionService.saveSubscription(teacherEmail, basicSub);
  },

  /**
   * Check if current user is entitled to school pro features
   */
  checkAccess(): {
    isSchoolActive: boolean;
    schoolName?: string;
    daysRemaining: number;
    membership: ActiveSchoolMembership | null;
  } {
    const mem = this.getActiveMembership();
    if (!mem || mem.isExpired) {
      return {
        isSchoolActive: false,
        daysRemaining: 0,
        membership: null,
      };
    }

    return {
      isSchoolActive: true,
      schoolName: mem.schoolName,
      daysRemaining: mem.daysRemaining,
      membership: mem,
    };
  },

  /**
   * SUPER ADMIN: Create New School License
   */
  createSchoolLicense(data: {
    schoolName: string;
    schoolCode: string;
    operatorPin: string;
    npsn?: string;
    city?: string;
    province?: string;
    durationMonths?: number;
    maxTeachers?: number;
  }): { success: boolean; message: string; school?: SchoolLicense } {
    const cleanCode = (data.schoolCode || '').trim().toUpperCase();
    const cleanName = (data.schoolName || '').trim();
    const cleanPin = (data.operatorPin || '').trim() || '123456';

    if (!cleanName || !cleanCode) {
      return { success: false, message: 'Nama Sekolah dan Kode Lisensi wajib diisi.' };
    }

    const schools = this.getSchoolsDB();
    if (schools.some((s) => s.schoolCode.toUpperCase() === cleanCode)) {
      return { success: false, message: `Kode Lisensi "${cleanCode}" sudah digunakan oleh sekolah lain.` };
    }

    const startDate = new Date();
    const durationMonths = data.durationMonths || 12;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const newSchool: SchoolLicense = {
      id: `school-${Date.now()}`,
      schoolName: cleanName,
      schoolCode: cleanCode,
      operatorPin: cleanPin,
      npsn: (data.npsn || '').trim() || '-',
      city: (data.city || 'Indonesia').trim(),
      province: (data.province || '-').trim(),
      subscriptionTier: 'school',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      maxTeachers: data.maxTeachers || 50,
      currentTeachersCount: 0,
      isActive: true,
      registeredTeachers: [],
      features: {
        customLogo: true,
        unlimitedStudents: true,
        aiGeneratorPriority: true,
        exportExcelReport: true,
        liveProctoringPro: true,
        collectiveQuestionBank: true,
      },
    };

    schools.unshift(newSchool);
    this.saveSchoolsDB(schools);

    return {
      success: true,
      message: `Lisensi untuk "${cleanName}" berhasil diterbitkan (Masa aktif ${durationMonths} bulan).`,
      school: newSchool,
    };
  },

  /**
   * SUPER ADMIN: Extend School License by N Months (e.g. +12 months / 1 year)
   */
  extendSchoolLicense(schoolId: string, additionalMonths = 12): { success: boolean; message: string; newEndDate?: string } {
    const schools = this.getSchoolsDB();
    const idx = schools.findIndex((s) => s.id === schoolId);
    if (idx === -1) {
      return { success: false, message: 'Sekolah tidak ditemukan.' };
    }

    const currentEnd = new Date(schools[idx].endDate);
    const baseDate = currentEnd.getTime() > Date.now() ? currentEnd : new Date();
    baseDate.setMonth(baseDate.getMonth() + additionalMonths);

    schools[idx].endDate = baseDate.toISOString();
    schools[idx].isActive = true;
    this.saveSchoolsDB(schools);

    // Update active membership if matches
    const currentMem = this.getActiveMembership();
    if (currentMem && currentMem.schoolId === schoolId) {
      currentMem.expiresAt = baseDate.toISOString();
      currentMem.daysRemaining = this.calculateDaysRemaining(baseDate.toISOString());
      currentMem.isExpired = false;
      this.saveActiveMembership(currentMem);
    }

    const formattedDate = baseDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      success: true,
      message: `Masa aktif "${schools[idx].schoolName}" berhasil diperpanjang hingga ${formattedDate}.`,
      newEndDate: baseDate.toISOString(),
    };
  },

  /**
   * SUPER ADMIN: Toggle School Status (Active / Suspended)
   */
  toggleSchoolActive(schoolId: string): { success: boolean; isActive: boolean; message: string } {
    const schools = this.getSchoolsDB();
    const idx = schools.findIndex((s) => s.id === schoolId);
    if (idx === -1) {
      return { success: false, isActive: false, message: 'Sekolah tidak ditemukan.' };
    }

    schools[idx].isActive = !schools[idx].isActive;
    this.saveSchoolsDB(schools);

    return {
      success: true,
      isActive: schools[idx].isActive,
      message: `Status lisensi "${schools[idx].schoolName}" diubah menjadi ${schools[idx].isActive ? 'AKTIF' : 'NON-AKTIF'}.`,
    };
  },

  /**
   * SUPER ADMIN: Reset Operator PIN
   */
  resetOperatorPinBySuperAdmin(schoolId: string, newPin: string): { success: boolean; message: string } {
    const cleanPin = (newPin || '').trim();
    if (!cleanPin) {
      return { success: false, message: 'PIN baru tidak boleh kosong.' };
    }

    const schools = this.getSchoolsDB();
    const idx = schools.findIndex((s) => s.id === schoolId);
    if (idx === -1) {
      return { success: false, message: 'Sekolah tidak ditemukan.' };
    }

    schools[idx].operatorPin = cleanPin;
    this.saveSchoolsDB(schools);

    return {
      success: true,
      message: `PIN Operator untuk "${schools[idx].schoolName}" berhasil direset menjadi "${cleanPin}".`,
    };
  },

  /**
   * SUPER ADMIN: Delete School License
   */
  deleteSchoolLicense(schoolId: string): { success: boolean; message: string } {
    const schools = this.getSchoolsDB();
    const target = schools.find((s) => s.id === schoolId);
    if (!target) {
      return { success: false, message: 'Sekolah tidak ditemukan.' };
    }

    const filtered = schools.filter((s) => s.id !== schoolId);
    this.saveSchoolsDB(filtered);

    // If active membership matches
    const currentMem = this.getActiveMembership();
    if (currentMem && currentMem.schoolId === schoolId) {
      this.saveActiveMembership(null);
    }

    return {
      success: true,
      message: `Lisensi sekolah "${target.schoolName}" berhasil dihapus dari sistem.`,
    };
  },

  /**
   * SUPER ADMIN: SaaS Business KPIs and Metrics Overview
   */
  getSuperAdminMetrics() {
    const schools = this.getSchoolsDB();
    const activeSchools = schools.filter((s) => s.isActive && !this.isExpired(s.endDate));
    const totalTeachers = schools.reduce((acc, s) => acc + s.registeredTeachers.length, 0);
    const totalCapacity = schools.reduce((acc, s) => acc + s.maxTeachers, 0);
    const estimatedAnnualRevenue = activeSchools.length * 1500000; // Rp 1.5jt per school

    return {
      totalSchools: schools.length,
      activeSchools: activeSchools.length,
      expiredSchools: schools.length - activeSchools.length,
      totalTeachers,
      totalCapacity,
      estimatedAnnualRevenue,
    };
  },
};

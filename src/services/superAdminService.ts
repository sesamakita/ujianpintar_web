import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { schoolLicenseService } from './schoolLicenseService';

export interface VpsTeacherUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'other';
  schoolName: string;
  npsn?: string;
  nip?: string;
  subject: string;
  whatsappNumber?: string;
  role: string;
  createdAt: string;
  lastSignInAt?: string;
  examCount: number;
  exams: {
    id: string;
    title: string;
    subject: string;
    token: string;
    status: string;
    createdAt: string;
  }[];
  subscriptionTier: 'free' | 'pro' | 'school';
  isSchoolAffiliated: boolean;
  affiliatedSchoolName?: string;
  subscriptionExpiresAt?: string;
  subscriptionStartedAt?: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.ujianpintar.online';
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storageKey: 'sb-admin-service-token',
  },
});

export const superAdminService = {
  /**
   * Test latency and connectivity to VPS Supabase
   */
  async testVpsConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      const { error } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });
      const latencyMs = Math.round(performance.now() - start);
      if (error) throw error;
      return { connected: true, latencyMs };
    } catch (err: any) {
      return {
        connected: false,
        latencyMs: Math.round(performance.now() - start),
        error: err.message || 'Koneksi ke VPS gagal',
      };
    }
  },

  /**
   * Fetch all teachers from VPS Supabase (combining auth.users, profiles, and exams)
   */
  async fetchVpsTeachers(): Promise<{ teachers: VpsTeacherUser[]; error?: string }> {
    try {
      // 1. Fetch auth users from VPS via Admin API
      const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
      if (usersErr) {
        console.warn('SuperAdmin: listUsers warning:', usersErr.message);
      }

      const rawUsers = usersData?.users || [];

      // 2. Fetch all rows from profiles table in VPS
      const { data: profiles, error: profErr } = await supabaseAdmin
        .from('profiles')
        .select('*');

      if (profErr) {
        console.warn('SuperAdmin: profiles select warning:', profErr.message);
      }

      const profileMap = new Map<string, any>();
      (profiles || []).forEach((p: any) => {
        if (p.id) profileMap.set(p.id, p);
      });

      // 3. Fetch all exams from VPS
      const { data: exams, error: examsErr } = await supabaseAdmin
        .from('exams')
        .select('id, teacher_id, title, subject, token, status, created_at');

      if (examsErr) {
        console.warn('SuperAdmin: exams select warning:', examsErr.message);
      }

      const examsByTeacher = new Map<string, any[]>();
      (exams || []).forEach((ex: any) => {
        if (ex.teacher_id) {
          const list = examsByTeacher.get(ex.teacher_id) || [];
          list.push({
            id: ex.id,
            title: ex.title,
            subject: ex.subject,
            token: ex.token,
            status: ex.status || 'published',
            createdAt: ex.created_at,
          });
          examsByTeacher.set(ex.teacher_id, list);
        }
      });

      // 4. Get all school licenses to check affiliation
      const schools = schoolLicenseService.getSchoolsDB();

      // 4b. Fetch paid transactions from payment_transactions table
      const paidEmails = new Set<string>();
      const paidTeacherIds = new Set<string>();
      try {
        const { data: paidTrx } = await supabaseAdmin
          .from('payment_transactions')
          .select('customer_email, teacher_id, tier, status')
          .eq('status', 'paid');

        (paidTrx || []).forEach((pt: any) => {
          if (pt.customer_email) paidEmails.add(pt.customer_email.toLowerCase().trim());
          if (pt.teacher_id) paidTeacherIds.add(pt.teacher_id);
        });
      } catch (err) {
        console.warn('SuperAdmin: payment_transactions query warning:', err);
      }

      // 5. Build merged teacher list
      const teachers: VpsTeacherUser[] = [];
      const processedEmails = new Set<string>();

      for (const u of rawUsers) {
        const email = (u.email || '').toLowerCase().trim();
        if (!email) continue;
        processedEmails.add(email);

        const prof = profileMap.get(u.id);
        const meta = u.user_metadata || {};
        const appMeta = u.app_metadata || {};

        // Provider detection
        let provider: 'google' | 'email' | 'other' = 'email';
        if (appMeta.provider === 'google' || (appMeta.providers && appMeta.providers.includes('google')) || meta.iss?.includes('google')) {
          provider = 'google';
        }

        // Full name
        const fullName = prof?.full_name || meta.full_name || meta.name || email.split('@')[0];

        // School and NPSN
        const schoolName = prof?.school_name || meta.school_name || '';
        const npsn = prof?.npsn || meta.npsn || '';
        const nip = prof?.nip || meta.nip || '';
        const subject = prof?.subject || meta.subject || 'Guru Pengajar';
        const whatsappNumber = meta.whatsapp_number || prof?.whatsapp_number || '';
        const role = prof?.role || 'teacher';
        const avatarUrl = meta.avatar_url || meta.picture || undefined;

        // Check school affiliation
        let isSchoolAffiliated = false;
        let affiliatedSchoolName: string | undefined = undefined;

        for (const s of schools) {
          if (!s.isActive) continue;
          const found = s.registeredTeachers.some(t => t.email.toLowerCase() === email);
          if (found || (npsn && s.npsn === npsn) || (schoolName && s.schoolName.toLowerCase() === schoolName.toLowerCase())) {
            isSchoolAffiliated = true;
            affiliatedSchoolName = s.schoolName;
            break;
          }
        }

        // Check subscription tier from database (profiles table & payment_transactions)
        let subscriptionTier: 'free' | 'pro' | 'school' = isSchoolAffiliated ? 'school' : 'free';
        const dbTier = String(prof?.subscription_tier || '').toLowerCase().trim();
        const roleLower = String(role || '').toLowerCase().trim();
        const expiresAt = prof?.subscription_expires_at;
        const isNotExpired = !expiresAt || new Date(expiresAt).getTime() > Date.now();

        if ((dbTier === 'pro' || roleLower === 'pro' || roleLower === 'premium' || paidEmails.has(email) || paidTeacherIds.has(u.id)) && isNotExpired) {
          subscriptionTier = 'pro';
        } else if (dbTier === 'school' || roleLower === 'school' || isSchoolAffiliated) {
          subscriptionTier = 'school';
        } else {
          // LocalStorage fallback
          const cachedSub = localStorage.getItem(`ujianpintar_sub_${email}`) || localStorage.getItem(`smartexam_sub_${email}`);
          if (cachedSub) {
            try {
              const parsed = JSON.parse(cachedSub);
              if (parsed.tier === 'pro') subscriptionTier = 'pro';
              else if (parsed.tier === 'school') subscriptionTier = 'school';
            } catch {
              // ignore
            }
          }
        }

        const teacherExams = examsByTeacher.get(u.id) || [];

        teachers.push({
          id: u.id,
          email,
          fullName,
          avatarUrl,
          provider,
          schoolName,
          npsn,
          nip,
          subject,
          whatsappNumber,
          role,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at,
          examCount: teacherExams.length,
          exams: teacherExams,
          subscriptionTier,
          isSchoolAffiliated,
          affiliatedSchoolName,
          subscriptionExpiresAt: prof?.subscription_expires_at || undefined,
          subscriptionStartedAt: prof?.subscription_started_at || undefined,
        });
      }

      // 6. Include any profile from profiles table that might not be in listUsers (safety)
      for (const [profId, prof] of profileMap.entries()) {
        if (!teachers.some(t => t.id === profId)) {
          const teacherExams = examsByTeacher.get(profId) || [];
          const pEmail = (prof.email || 'guru@vps.internal').toLowerCase().trim();
          const pDbTier = String(prof?.subscription_tier || '').toLowerCase().trim();
          const pRole = String(prof?.role || '').toLowerCase().trim();
          const isNotExpired = !prof?.subscription_expires_at || new Date(prof.subscription_expires_at).getTime() > Date.now();

          let sTier: 'free' | 'pro' | 'school' = 'free';
          if ((pDbTier === 'pro' || pRole === 'pro' || paidEmails.has(pEmail) || paidTeacherIds.has(profId)) && isNotExpired) {
            sTier = 'pro';
          } else if (pDbTier === 'school' || pRole === 'school') {
            sTier = 'school';
          }

          teachers.push({
            id: profId,
            email: pEmail,
            fullName: prof.full_name || 'Guru VPS',
            provider: 'email',
            schoolName: prof.school_name || '',
            npsn: prof.npsn || '',
            nip: prof.nip || '',
            subject: prof.subject || 'Pengajar',
            role: prof.role || (sTier === 'pro' ? 'pro' : 'teacher'),
            createdAt: prof.created_at || new Date().toISOString(),
            examCount: teacherExams.length,
            exams: teacherExams,
            subscriptionTier: sTier,
            isSchoolAffiliated: sTier === 'school',
            subscriptionExpiresAt: prof?.subscription_expires_at || undefined,
            subscriptionStartedAt: prof?.subscription_started_at || undefined,
          });
        }
      }

      // Sort by newest registration date
      teachers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return { teachers, error: undefined };
    } catch (err: any) {
      console.error('SuperAdmin fetchVpsTeachers failed:', err);
      return { teachers: [], error: err.message || 'Gagal memuat data dari database VPS' };
    }
  },

  /**
   * Upgrade or change a teacher's subscription status
   */
  async updateTeacherStatus(
    teacherId: string, 
    email: string, 
    tier: 'free' | 'pro' | 'school'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const newRole = tier === 'pro' ? 'pro' : tier === 'school' ? 'school' : 'teacher';
      const now = new Date();
      const expiresAt = tier === 'pro' 
        ? new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString() 
        : null;

      // 1. Update in profiles table on VPS with complete subscription metadata
      await supabaseAdmin
        .from('profiles')
        .update({ 
          role: newRole, 
          subscription_tier: tier,
          subscription_status: tier === 'pro' ? 'active' : tier === 'school' ? 'school' : 'free',
          subscription_expires_at: expiresAt,
          subscription_started_at: tier === 'pro' ? now.toISOString() : null,
          updated_at: now.toISOString() 
        })
        .eq('id', teacherId);

      // 2. Set subscription cache in localStorage
      if (tier === 'pro') {
        const subData = {
          tier: 'pro',
          status: 'active',
          planName: 'Guru Mandiri PRO (Akses Super Admin)',
          startedAt: now.toISOString(),
          expiresAt: expiresAt,
          daysRemaining: 365,
          isTrial: false,
          maxExamsPerMonth: -1,
          maxStudentsPerExam: -1,
          canUseCustomLogo: true,
          canExportAdvanced: true,
          canUseFullscreenLock: true,
        };
        localStorage.setItem(`ujianpintar_sub_${cleanEmail}`, JSON.stringify(subData));
      } else if (tier === 'free') {
        localStorage.removeItem(`ujianpintar_sub_${cleanEmail}`);
        localStorage.removeItem(`smartexam_sub_${cleanEmail}`);
      }

      return {
        success: true,
        message: `Status lisensi ${cleanEmail} berhasil diubah menjadi ${tier.toUpperCase()}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal memperbarui status lisensi: ${err.message}`,
      };
    }
  },

  /**
   * Assign a teacher to an active school license
   */
  async assignTeacherToSchool(
    teacherId: string, 
    teacherEmail: string, 
    teacherName: string, 
    schoolCode: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cleanEmail = teacherEmail.toLowerCase().trim();
      const schools = schoolLicenseService.getSchoolsDB();
      const targetSchool = schools.find(s => s.schoolCode.toUpperCase() === schoolCode.toUpperCase());

      if (!targetSchool) {
        return { success: false, message: `Sekolah dengan kode "${schoolCode}" tidak ditemukan.` };
      }

      // Add to school registered teachers list
      const alreadyIn = targetSchool.registeredTeachers.some(t => t.email.toLowerCase() === cleanEmail);
      if (!alreadyIn) {
        targetSchool.registeredTeachers.push({
          email: cleanEmail,
          name: teacherName,
          joinedAt: new Date().toISOString(),
          role: 'teacher',
        });
        targetSchool.currentTeachersCount = targetSchool.registeredTeachers.length;
        schoolLicenseService.saveSchoolsDB(schools);
      }

      // Update in VPS profiles
      await supabaseAdmin
        .from('profiles')
        .update({
          school_name: targetSchool.schoolName,
          npsn: targetSchool.npsn,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teacherId);

      // Update user_metadata in auth.users
      try {
        await supabaseAdmin.auth.admin.updateUserById(teacherId, {
          user_metadata: {
            school_name: targetSchool.schoolName,
            npsn: targetSchool.npsn,
          },
        });
      } catch {
        // ignore
      }

      // Save school membership in localStorage
      const membership = {
        schoolId: targetSchool.id,
        schoolName: targetSchool.schoolName,
        schoolCode: targetSchool.schoolCode,
        npsn: targetSchool.npsn,
        joinedAt: new Date().toISOString(),
        teacherEmail: cleanEmail,
        teacherName,
        expiresAt: targetSchool.endDate,
        daysRemaining: Math.max(0, Math.ceil((new Date(targetSchool.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        isExpired: false,
        isOperator: false,
      };
      localStorage.setItem(`ujianpintar_membership_${cleanEmail}`, JSON.stringify(membership));

      return {
        success: true,
        message: `Guru ${teacherName} berhasil ditautkan ke ${targetSchool.schoolName}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menautkan guru ke sekolah: ${err.message}`,
      };
    }
  },

  /**
   * Update teacher biodata in VPS Supabase (profiles & auth metadata)
   */
  async updateTeacherProfile(
    teacherId: string,
    updates: {
      fullName?: string;
      schoolName?: string;
      npsn?: string;
      nip?: string;
      subject?: string;
      whatsappNumber?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Update profiles table
      const profileUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.fullName !== undefined) profileUpdates.full_name = updates.fullName;
      if (updates.schoolName !== undefined) profileUpdates.school_name = updates.schoolName;
      if (updates.npsn !== undefined) profileUpdates.npsn = updates.npsn;
      if (updates.nip !== undefined) profileUpdates.nip = updates.nip;
      if (updates.subject !== undefined) profileUpdates.subject = updates.subject;

      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', teacherId);

      if (profErr) throw profErr;

      // 2. Update user metadata in auth.users
      try {
        const metaUpdates: any = {};
        if (updates.fullName !== undefined) metaUpdates.full_name = updates.fullName;
        if (updates.schoolName !== undefined) metaUpdates.school_name = updates.schoolName;
        if (updates.npsn !== undefined) metaUpdates.npsn = updates.npsn;
        if (updates.nip !== undefined) metaUpdates.nip = updates.nip;
        if (updates.subject !== undefined) metaUpdates.subject = updates.subject;
        if (updates.whatsappNumber !== undefined) metaUpdates.whatsapp_number = updates.whatsappNumber;

        await supabaseAdmin.auth.admin.updateUserById(teacherId, {
          user_metadata: metaUpdates,
        });
      } catch (authErr) {
        console.warn('SuperAdmin updateUserById metadata warning:', authErr);
      }

      return {
        success: true,
        message: 'Profil guru berhasil diperbarui di database VPS.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal memperbarui profil di VPS: ${err.message}`,
      };
    }
  },

  /**
   * Permanently delete a teacher account from VPS Supabase
   */
  async deleteTeacherAccount(
    teacherId: string, 
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cleanEmail = email.toLowerCase().trim();

      // 1. Temukan dan hapus seluruh paket ujian, butir soal, dan sesi siswa milik guru ini
      try {
        const { data: teacherExams } = await supabaseAdmin
          .from('exams')
          .select('id')
          .eq('teacher_id', teacherId);

        const examIds = (teacherExams || []).map((e: any) => e.id).filter(Boolean);

        if (examIds.length > 0) {
          for (const examId of examIds) {
            try { await supabaseAdmin.from('student_answers').delete().eq('session_id', examId); } catch {}
            try { await supabaseAdmin.from('questions').delete().eq('exam_id', examId); } catch {}
            try { await supabaseAdmin.from('student_sessions').delete().eq('exam_id', examId); } catch {}
            try { await supabaseAdmin.from('grade_records').delete().eq('exam_id', examId); } catch {}
            try { await supabaseAdmin.from('violation_logs').delete().eq('exam_id', examId); } catch {}
          }
          try { await supabaseAdmin.from('exams').delete().eq('teacher_id', teacherId); } catch {}
        }
      } catch (examErr) {
        console.warn('SuperAdmin cleanup exams warning:', examErr);
      }

      // 2. Hapus data langganan & relasi lisensi sekolah jika ada
      try {
        await supabaseAdmin.from('subscriptions').delete().eq('teacher_id', teacherId);
      } catch {}
      try {
        await supabaseAdmin.from('school_teachers').delete().eq('teacher_id', teacherId);
      } catch {}

      // 3. Hapus profil dari tabel profiles
      await supabaseAdmin.from('profiles').delete().eq('id', teacherId);

      // 4. Hapus akun login dari auth.users
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(teacherId);
      if (authErr) {
        console.warn('SuperAdmin deleteUser auth warning:', authErr);
      }

      // 5. Bersihkan SELURUH data cache di localStorage yang terkait dengan email guru ini
      if (typeof window !== 'undefined') {
        const keysToDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes(cleanEmail) || key.endsWith(cleanEmail))) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach((key) => localStorage.removeItem(key));
      }

      return {
        success: true,
        message: `Akun guru (${cleanEmail}) beserta seluruh bank soal, paket ujian, dan riwayat siswa berhasil dihapus tuntas.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menghapus akun guru: ${err.message}`,
      };
    }
  },

  /**
   * Fetch all APK download leads from VPS Supabase
   */
  async fetchApkDownloads(): Promise<{ downloads: ApkDownloadLead[]; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('apk_downloads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { downloads: data || [] };
    } catch (err: any) {
      console.warn('SuperAdmin fetchApkDownloads error:', err.message);
      return { downloads: [], error: err.message };
    }
  },

  /**
   * Delete an APK download lead entry
   */
  async deleteApkDownload(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('apk_downloads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Data unduhan berhasil dihapus.' };
    } catch (err: any) {
      return { success: false, message: `Gagal menghapus data: ${err.message}` };
    }
  },
};

export interface ApkDownloadLead {
  id: string;
  email: string;
  whatsapp: string;
  user_agent?: string;
  created_at: string;
}


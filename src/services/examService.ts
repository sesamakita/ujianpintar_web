import { supabase } from '../lib/supabase';
import type { ExamSettings, Question, StudentProctoring, ViolationLogItem, GradeRecord } from '../types/exam';

export const isValidUUID = (str?: string): boolean => {
  return Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
};

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const formatScheduleTime = (timeStr?: string): string => {
  if (!timeStr) return '08:00';
  const clean = timeStr.trim();
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return clean;
};

export const examService = {
  /**
   * Helper to format time into HH:mm (removing seconds)
   */
  formatScheduleTime(timeStr?: string): string {
    return formatScheduleTime(timeStr);
  },

  /**
   * Helper to generate a clean 6-digit PIN Token
   */
  generateRandomToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Save or Update a specific Exam and all its Questions in Supabase
   */
  async saveExam(exam: ExamSettings, questions: Question[]): Promise<{ success: boolean; examId: string; token: string; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          examId: exam.id,
          token: exam.token,
          error: 'Sesi login guru tidak aktif di Supabase. Silakan login kembali ke akun guru Anda.',
        };
      }

      const cleanToken = (exam.token || this.generateRandomToken()).trim();
      const cleanProctorPin = (exam.proctorPin || exam.antiCheat?.proctorPin || this.generateRandomToken()).trim();
      const examId = isValidUUID(exam.id) ? exam.id : generateUUID();

      const antiCheatConfig = {
        detectTabSwitch: exam.antiCheat?.detectTabSwitch ?? true,
        shuffleQuestions: exam.antiCheat?.shuffleQuestions ?? true,
        shuffleOptions: exam.antiCheat?.shuffleOptions ?? true,
        fullScreenLock: exam.antiCheat?.fullScreenLock ?? true,
        proctor_pin: cleanProctorPin,
        proctorPin: cleanProctorPin,
      };

      const examPayload: any = {
        id: examId,
        teacher_id: user.id,
        title: exam.title || 'Penilaian Harian / Ujian Baru',
        subject: exam.subject || 'Matematika Wajib',
        grade_level: exam.gradeLevel || 'Kelas X (Fase E)',
        duration_minutes: exam.durationMinutes || 60,
        token: cleanToken,
        schedule_date: exam.scheduleDate || new Date().toISOString().split('T')[0],
        schedule_time: formatScheduleTime(exam.scheduleTime),
        anti_cheat: antiCheatConfig,
        status: exam.status || 'published',
        updated_at: new Date().toISOString(),
      };

      // 1. Upsert Exam in Supabase
      const { data: savedExam, error: examError } = await supabase
        .from('exams')
        .upsert(examPayload)
        .select()
        .single();

      if (examError || !savedExam) {
        console.error('Supabase saveExam error:', examError);
        return {
          success: false,
          examId,
          token: cleanToken,
          error: `Gagal menyimpan ujian ke database Supabase: ${examError?.message || 'Database error'}`,
        };
      }

      const finalExamId = savedExam.id;

      // 2. Format Questions for Supabase
      const questionsPayload = questions.map((q, idx) => ({
        id: isValidUUID(q.id) ? q.id : generateUUID(),
        exam_id: finalExamId,
        number_order: idx + 1,
        type: q.type || 'multiple_choice',
        question_text: q.questionText || '',
        latex_formula: q.latexFormula || null,
        image_url: q.imageUrl || null,
        options: Array.isArray(q.options) ? q.options : [],
        correct_option_id: q.correctOptionId || null,
        correct_answer_text: q.correctAnswerText || null,
        points: q.points || 10,
      }));

      // Delete old questions for THIS exam only and insert updated ones
      await supabase.from('questions').delete().eq('exam_id', finalExamId);
      if (questionsPayload.length > 0) {
        const { error: qError } = await supabase.from('questions').insert(questionsPayload);
        if (qError) {
          console.error('Supabase saveQuestions error:', qError);
          return {
            success: false,
            examId: finalExamId,
            token: cleanToken,
            error: `Paket ujian tersimpan, tapi butir soal gagal disimpan: ${qError.message}`,
          };
        }
      }

      // 3. Update teacher-scoped local cache
      const cleanEmail = (user.email || '').toLowerCase().trim();
      const updatedExam: ExamSettings = {
        ...exam,
        id: finalExamId,
        token: cleanToken,
        questionCount: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 0), 0),
        updatedAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined' && cleanEmail) {
        localStorage.setItem(`ujianpintar_published_exam_${cleanEmail}`, JSON.stringify(updatedExam));
        localStorage.setItem(`ujianpintar_published_questions_${cleanEmail}`, JSON.stringify(questions));

        const listRaw = localStorage.getItem(`ujianpintar_all_exams_${cleanEmail}`);
        let currentList: ExamSettings[] = listRaw ? JSON.parse(listRaw) : [];
        const existingIdx = currentList.findIndex((e) => e.id === finalExamId);
        if (existingIdx >= 0) {
          currentList[existingIdx] = updatedExam;
        } else {
          currentList.unshift(updatedExam);
        }
        localStorage.setItem(`ujianpintar_all_exams_${cleanEmail}`, JSON.stringify(currentList));
      }

      return { success: true, examId: finalExamId, token: cleanToken, error: null };
    } catch (err: any) {
      console.error('Supabase saveExam exception:', err);
      return { success: false, examId: exam.id, token: exam.token, error: err.message || 'Terjadi kesalahan sistem saat menyimpan.' };
    }
  },

  /**
   * Fetch All Exams created by the authenticated Teacher
   */
  async getAllTeacherExams(teacherEmail?: string): Promise<ExamSettings[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const activeTeacherId = user?.id;
      const cleanEmail = (user?.email || teacherEmail || '').toLowerCase().trim();

      let query = supabase.from('exams').select('*, questions(id, points)');
      if (activeTeacherId) {
        query = query.eq('teacher_id', activeTeacherId);
      } else if (cleanEmail) {
        const { data: prof } = await supabase.from('profiles').select('id').eq('email', cleanEmail).maybeSingle();
        if (prof?.id) {
          query = query.eq('teacher_id', prof.id);
        }
      }

      const { data: exams, error } = await query.order('created_at', { ascending: false });

      if (!error && exams && exams.length > 0) {
        const formatted: ExamSettings[] = exams.map((row: any) => {
          const qList = Array.isArray(row.questions) ? row.questions : [];
          const totalPoints = qList.reduce((sum: number, q: any) => sum + (q.points || 0), 0);

          return {
            id: row.id,
            title: row.title || 'Bank Soal Tanpa Judul',
            subject: row.subject || 'Mata Pelajaran',
            gradeLevel: row.grade_level || 'Kelas X',
            durationMinutes: row.duration_minutes || 60,
            scheduleDate: row.schedule_date || new Date().toISOString().split('T')[0],
            scheduleTime: formatScheduleTime(row.schedule_time),
            token: row.token || '123456',
            proctorPin: row.anti_cheat?.proctor_pin || row.anti_cheat?.proctorPin || '',
            status: row.status || 'published',
            questionCount: qList.length,
            totalPoints: totalPoints,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            antiCheat: row.anti_cheat || {
              detectTabSwitch: true,
              shuffleQuestions: true,
              shuffleOptions: true,
              fullScreenLock: true,
              proctorPin: row.anti_cheat?.proctor_pin || row.anti_cheat?.proctorPin || '',
            },
          };
        });

        if (typeof window !== 'undefined' && cleanEmail) {
          localStorage.setItem(`ujianpintar_all_exams_${cleanEmail}`, JSON.stringify(formatted));
        }

        return formatted;
      }

      // Fallback to local storage
      if (typeof window !== 'undefined' && cleanEmail) {
        const cached = localStorage.getItem(`ujianpintar_all_exams_${cleanEmail}`);
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch {}
        }
      }

      return [];
    } catch (err: any) {
      console.warn('getAllTeacherExams exception:', err.message);
      return [];
    }
  },

  /**
   * Fetch specific Exam & Questions by Exam ID
   */
  async getExamById(examId: string): Promise<{ exam: ExamSettings | null; questions: Question[] }> {
    try {
      if (!isValidUUID(examId)) {
        return { exam: null, questions: [] };
      }

      const { data: examRow, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .maybeSingle();

      if (examError || !examRow) {
        return { exam: null, questions: [] };
      }

      const examSettings: ExamSettings = {
        id: examRow.id,
        title: examRow.title || 'Penilaian Harian',
        subject: examRow.subject || 'Matematika Wajib',
        gradeLevel: examRow.grade_level || 'Kelas X',
        durationMinutes: examRow.duration_minutes || 60,
        scheduleDate: examRow.schedule_date || new Date().toISOString().split('T')[0],
        scheduleTime: examRow.schedule_time || '08:00',
        token: examRow.token || '123456',
        proctorPin: examRow.anti_cheat?.proctor_pin || examRow.anti_cheat?.proctorPin || '',
        status: examRow.status || 'published',
        createdAt: examRow.created_at,
        updatedAt: examRow.updated_at,
        antiCheat: examRow.anti_cheat || {
          detectTabSwitch: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          fullScreenLock: true,
          proctorPin: examRow.anti_cheat?.proctor_pin || examRow.anti_cheat?.proctorPin || '',
        },
      };

      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('number_order', { ascending: true });

      let loadedQuestions: Question[] = [];
      if (qData && qData.length > 0) {
        loadedQuestions = qData.map((q: any, idx: number) => ({
          id: q.id || generateUUID(),
          number: q.number_order || idx + 1,
          type: q.type || 'multiple_choice',
          questionText: q.question_text || '',
          latexFormula: q.latex_formula || '',
          imageUrl: q.image_url || '',
          options: Array.isArray(q.options) ? q.options : [],
          correctOptionId: q.correct_option_id || undefined,
          correctAnswerText: q.correct_answer_text || undefined,
          points: q.points || 10,
        }));
      }

      return { exam: examSettings, questions: loadedQuestions };
    } catch (err: any) {
      console.warn('getExamById exception:', err.message);
      return { exam: null, questions: [] };
    }
  },

  /**
   * Delete an Exam and its associated questions & sessions
   */
  async deleteExam(examId: string, teacherEmail?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (isValidUUID(examId)) {
        await supabase.from('questions').delete().eq('exam_id', examId);
        await supabase.from('student_sessions').delete().eq('exam_id', examId);
        await supabase.from('grade_records').delete().eq('exam_id', examId);
        await supabase.from('violation_logs').delete().eq('exam_id', examId);
        await supabase.from('exams').delete().eq('id', examId);
      }

      const cleanEmail = teacherEmail?.toLowerCase().trim();
      if (typeof window !== 'undefined' && cleanEmail) {
        const listRaw = localStorage.getItem(`ujianpintar_all_exams_${cleanEmail}`);
        if (listRaw) {
          const list: ExamSettings[] = JSON.parse(listRaw);
          const filtered = list.filter((e) => e.id !== examId);
          localStorage.setItem(`ujianpintar_all_exams_${cleanEmail}`, JSON.stringify(filtered));
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Duplicate an Exam with fresh Student Token & Supervisor Proctor PIN
   */
  async duplicateExam(
    examId: string,
    newTitle?: string,
    newGradeLevel?: string,
    customToken?: string,
    customProctorPin?: string
  ): Promise<{ success: boolean; newExam?: ExamSettings; error?: string }> {
    try {
      const { exam, questions } = await this.getExamById(examId);
      if (!exam) return { success: false, error: 'Paket ujian sumber tidak ditemukan.' };

      const newToken = (customToken || this.generateRandomToken()).trim();
      const newProctorPin = (customProctorPin || this.generateRandomToken()).trim();
      const duplicatedExam: ExamSettings = {
        ...exam,
        id: generateUUID(),
        title: newTitle || `${exam.title} (Salinan)`,
        gradeLevel: newGradeLevel || exam.gradeLevel,
        token: newToken,
        proctorPin: newProctorPin,
        antiCheat: {
          ...(exam.antiCheat || {
            detectTabSwitch: true,
            shuffleQuestions: true,
            shuffleOptions: true,
            fullScreenLock: true,
          }),
          proctorPin: newProctorPin,
        },
        status: 'published',
      };

      const duplicatedQuestions: Question[] = questions.map((q, idx) => ({
        ...q,
        id: generateUUID(),
        number: idx + 1,
      }));

      const res = await this.saveExam(duplicatedExam, duplicatedQuestions);
      if (!res.success) {
        return { success: false, error: res.error || 'Gagal menyimpan duplikat ujian ke database.' };
      }
      return { success: true, newExam: { ...duplicatedExam, id: res.examId } };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menduplikasi ujian.' };
    }
  },

  /**
   * Regenerate 6-digit Student Token for an Exam
   */
  async regenerateExamToken(examId: string): Promise<{ success: boolean; newToken: string }> {
    const newToken = this.generateRandomToken();
    try {
      await supabase
        .from('exams')
        .update({ token: newToken, updated_at: new Date().toISOString() })
        .eq('id', examId);

      return { success: true, newToken };
    } catch {
      return { success: true, newToken };
    }
  },

  /**
   * Regenerate 6-digit Supervisor Proctor PIN for an Exam
   */
  async regenerateProctorPin(examId: string): Promise<{ success: boolean; newProctorPin: string }> {
    const newProctorPin = this.generateRandomToken();
    try {
      const { data: examRow } = await supabase.from('exams').select('anti_cheat').eq('id', examId).maybeSingle();
      const currentAntiCheat = examRow?.anti_cheat || {};
      const updatedAntiCheat = {
        ...currentAntiCheat,
        proctor_pin: newProctorPin,
        proctorPin: newProctorPin,
      };
      await supabase
        .from('exams')
        .update({ anti_cheat: updatedAntiCheat, updated_at: new Date().toISOString() })
        .eq('id', examId);

      return { success: true, newProctorPin };
    } catch {
      return { success: true, newProctorPin };
    }
  },

  /**
   * Fetch the latest published Exam session and its questions strictly for the CURRENT teacher
   */
  async getLatestExam(teacherEmail?: string): Promise<{ exam: ExamSettings | null; questions: Question[] }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const activeTeacherId = user?.id;
      const cleanEmail = (user?.email || teacherEmail || '').toLowerCase().trim();

      // 1. Fetch latest exam from Supabase strictly for this teacher account
      let examQuery = supabase.from('exams').select('*');
      if (activeTeacherId) {
        examQuery = examQuery.eq('teacher_id', activeTeacherId);
      } else if (cleanEmail) {
        const { data: prof } = await supabase.from('profiles').select('id').eq('email', cleanEmail).maybeSingle();
        if (prof?.id) {
          examQuery = examQuery.eq('teacher_id', prof.id);
        }
      }

      const { data: exams, error: examError } = await examQuery
        .order('created_at', { ascending: false })
        .limit(1);

      if (!examError && exams && exams.length > 0) {
        const examRow = exams[0];
        const examSettings: ExamSettings = {
          id: examRow.id,
          title: examRow.title || 'Penilaian Harian / Ujian Baru',
          subject: examRow.subject || 'Matematika Wajib',
          gradeLevel: examRow.grade_level || 'Kelas X (Fase E)',
          durationMinutes: examRow.duration_minutes || 60,
          scheduleDate: examRow.schedule_date || new Date().toISOString().split('T')[0],
          scheduleTime: examRow.schedule_time || '08:00',
          token: examRow.token || Math.floor(100000 + Math.random() * 900000).toString(),
          proctorPin: examRow.anti_cheat?.proctor_pin || examRow.anti_cheat?.proctorPin || '',
          status: examRow.status || 'published',
          createdAt: examRow.created_at,
          updatedAt: examRow.updated_at,
          antiCheat: examRow.anti_cheat || {
            detectTabSwitch: true,
            shuffleQuestions: true,
            shuffleOptions: true,
            fullScreenLock: true,
            proctorPin: examRow.anti_cheat?.proctor_pin || examRow.anti_cheat?.proctorPin || '',
          },
        };

        // Fetch questions for this specific exam
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examRow.id)
          .order('number_order', { ascending: true });

        let loadedQuestions: Question[] = [];
        if (!qError && qData && qData.length > 0) {
          loadedQuestions = qData.map((q: any, idx: number) => ({
            id: q.id || `q-${idx + 1}`,
            number: q.number_order || idx + 1,
            type: q.type || 'multiple_choice',
            questionText: q.question_text || '',
            latexFormula: q.latex_formula || '',
            imageUrl: q.image_url || '',
            options: Array.isArray(q.options) ? q.options : [],
            correctOptionId: q.correct_option_id || undefined,
            correctAnswerText: q.correct_answer_text || undefined,
            points: q.points || 10,
          }));
        }

        // Cache locally strictly per teacher
        if (typeof window !== 'undefined' && cleanEmail) {
          localStorage.setItem(`ujianpintar_published_exam_${cleanEmail}`, JSON.stringify(examSettings));
          localStorage.setItem(`ujianpintar_published_questions_${cleanEmail}`, JSON.stringify(loadedQuestions));
        }

        return { exam: examSettings, questions: loadedQuestions };
      }

      // 2. Fallback to teacher-scoped localStorage
      if (cleanEmail && typeof window !== 'undefined') {
        const cachedExamRaw = localStorage.getItem(`ujianpintar_published_exam_${cleanEmail}`) || localStorage.getItem(`smartexam_published_exam_${cleanEmail}`);
        const cachedQuestionsRaw = localStorage.getItem(`ujianpintar_published_questions_${cleanEmail}`) || localStorage.getItem(`smartexam_published_questions_${cleanEmail}`);

        if (cachedExamRaw) {
          try {
            const cachedExam = JSON.parse(cachedExamRaw);
            const cachedQuestions = cachedQuestionsRaw ? JSON.parse(cachedQuestionsRaw) : [];
            return { exam: cachedExam, questions: cachedQuestions };
          } catch {
            // ignore cache error
          }
        }
      }

      return { exam: null, questions: [] };
    } catch (err: any) {
      console.warn('getLatestExam exception:', err.message);
      return { exam: null, questions: [] };
    }
  },

  /**
   * Fetch Exam & Questions by 6-digit Token PIN (For Student Portal & Mobile App)
   */
  async getExamByToken(token: string) {
    try {
      const cleanToken = token.trim();
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('token', cleanToken)
        .in('status', ['published', 'active'])
        .single();

      if (examError || !exam) {
        return { 
          exam: null, 
          questions: [], 
          error: 'Token PIN tidak ditemukan atau sudah kedaluwarsa/dinonaktifkan oleh guru.' 
        };
      }

      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('id, number_order, type, question_text, latex_formula, image_url, options, points')
        .eq('exam_id', exam.id)
        .order('number_order', { ascending: true });

      if (!qError && questions && questions.length > 0) {
        return { exam, questions, error: null };
      }

      return { exam, questions: [], error: 'Soal ujian belum tersedia.' };
    } catch (err: any) {
      const cachedExamRaw = typeof window !== 'undefined' 
        ? localStorage.getItem('ujianpintar_published_exam') || localStorage.getItem('smartexam_published_exam') 
        : null;
      const cachedQuestionsRaw = typeof window !== 'undefined' 
        ? localStorage.getItem('ujianpintar_published_questions') || localStorage.getItem('smartexam_published_questions') 
        : null;

      if (cachedExamRaw && cachedQuestionsRaw) {
        try {
          const cachedExam = JSON.parse(cachedExamRaw);
          if (cachedExam && cachedExam.token === token) {
            const cachedQuestions = JSON.parse(cachedQuestionsRaw);
            return { exam: cachedExam, questions: cachedQuestions, error: null };
          }
        } catch {
          // ignore cache parse error
        }
      }

      return { exam: null, questions: [], error: err.message || 'Gagal memuat ujian.' };
    }
  },

  /**
   * Fetch Live Students from Supabase
   */
  async getLiveStudents(examId?: string): Promise<StudentProctoring[]> {
    try {
      let query = supabase.from('student_sessions').select('*').order('started_at', { ascending: false });
      if (examId) query = query.eq('exam_id', examId);

      const { data, error } = await query;
      if (error || !data) return [];

      // Deduplicate by NISN to ensure each student only appears once
      const uniqueStudents = new Map<string, StudentProctoring>();
      data.forEach((row: any) => {
        const cleanNisn = (row.nisn || '').trim();
        if (cleanNisn && !uniqueStudents.has(cleanNisn)) {
          uniqueStudents.set(cleanNisn, {
            id: row.id,
            nisn: cleanNisn,
            name: row.student_name,
            className: row.class_name,
            status: row.status,
            remainingSeconds: row.remaining_seconds,
            totalQuestions: row.total_questions || 5,
            progressCount: row.progress_count || 0,
            violationCount: row.violation_count || 0,
            connectionStatus: row.connection_status || 'online',
            violationLogs: [],
          });
        }
      });

      return Array.from(uniqueStudents.values());
    } catch {
      return [];
    }
  },

  /**
   * Fetch All Grades for Analytics
   */
  async getGradeRecords(examId?: string): Promise<GradeRecord[]> {
    try {
      let query = supabase.from('grade_records').select('*').order('created_at', { ascending: false });
      if (examId) query = query.eq('exam_id', examId);

      const { data, error } = await query;
      if (error || !data) return [];

      // Deduplicate by NISN
      const uniqueGrades = new Map<string, GradeRecord>();
      data.forEach((d: any) => {
        const cleanNisn = (d.nisn || '').trim();
        if (cleanNisn && !uniqueGrades.has(cleanNisn)) {
          uniqueGrades.set(cleanNisn, {
            studentId: d.student_id,
            name: d.name,
            nisn: cleanNisn,
            className: d.class_name,
            score: d.score,
            maxScore: d.max_score || 100,
            submittedAt: d.submitted_at,
            timeSpentMinutes: d.time_spent_minutes || 1,
            tabViolations: d.tab_violations || 0,
            status: d.status || 'Lulus',
          });
        }
      });

      return Array.from(uniqueGrades.values());
    } catch {
      return [];
    }
  },

  /**
   * Fetch Violation Logs from Supabase
   */
  async getViolationLogs(examId?: string): Promise<ViolationLogItem[]> {
    try {
      let query = supabase.from('violation_logs').select('*').order('created_at', { ascending: false });
      if (examId) query = query.eq('exam_id', examId);

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((d: any) => ({
        id: d.id,
        timestamp: d.timestamp,
        studentName: d.student_name,
        studentNisn: d.student_nisn,
        message: d.message,
        severity: d.severity || 'warning',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Real-Time Proctoring: Subscribe to live student session updates, violations, and grade submissions
   * Isolated to the specific exam session
   */
  subscribeToLiveProctoring(
    examId: string | undefined,
    onStudentUpdate: (student: StudentProctoring) => void,
    onViolationLog: (log: ViolationLogItem) => void,
    onGradeUpdate?: (grade: GradeRecord) => void
  ) {
    const channel = supabase
      .channel(`proctoring-live-${examId || 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_sessions' },
        (payload: any) => {
          if (payload.new) {
            const row = payload.new;
            if (examId && row.exam_id && row.exam_id !== examId) {
              return; // Ignore other exams' telemetry
            }
            const updatedStudent: StudentProctoring = {
              id: row.id,
              name: row.student_name,
              nisn: row.nisn,
              className: row.class_name,
              status: row.status,
              remainingSeconds: row.remaining_seconds,
              totalQuestions: row.total_questions || 5,
              progressCount: row.progress_count || 0,
              violationCount: row.violation_count || 0,
              connectionStatus: row.connection_status || 'online',
              violationLogs: [],
            };
            onStudentUpdate(updatedStudent);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'violation_logs' },
        (payload: any) => {
          if (payload.new) {
            const row = payload.new;
            if (examId && row.exam_id && row.exam_id !== examId) {
              return; // Ignore other exams' violation logs
            }
            const newLog: ViolationLogItem = {
              id: row.id,
              timestamp: row.timestamp,
              studentName: row.student_name,
              studentNisn: row.student_nisn,
              message: row.message,
              severity: row.severity || 'warning',
            };
            onViolationLog(newLog);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grade_records' },
        (payload: any) => {
          if (payload.new && onGradeUpdate) {
            const d = payload.new;
            if (examId && d.exam_id && d.exam_id !== examId) {
              return; // Ignore other exams' grades
            }
            const newGrade: GradeRecord = {
              studentId: d.student_id,
              name: d.name,
              nisn: d.nisn,
              className: d.class_name,
              score: d.score,
              maxScore: d.max_score || 100,
              submittedAt: d.submitted_at,
              timeSpentMinutes: d.time_spent_minutes || 1,
              tabViolations: d.tab_violations || 0,
              status: d.status || 'Lulus',
            };
            onGradeUpdate(newGrade);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Record Student Submission into Supabase student_sessions & grade_records
   */
  async recordStudentSubmission(
    student: StudentProctoring,
    grade: GradeRecord
  ) {
    try {
      const cleanNisn = student.nisn.trim();

      // 1. Update or Insert student session
      const { data: existingSessions } = await supabase
        .from('student_sessions')
        .select('id')
        .eq('nisn', cleanNisn);

      const sessionPayload = {
        nisn: cleanNisn,
        student_name: student.name.trim(),
        class_name: student.className.trim(),
        status: 'submitted',
        connection_status: student.connectionStatus || 'online',
        remaining_seconds: student.remainingSeconds || 0,
        total_questions: student.totalQuestions || 5,
        progress_count: student.progressCount || 5,
        violation_count: student.violationCount || 0,
        submitted_at: new Date().toISOString(),
      };

      if (existingSessions && existingSessions.length > 0) {
        await supabase
          .from('student_sessions')
          .update(sessionPayload)
          .eq('nisn', cleanNisn);
      } else {
        await supabase
          .from('student_sessions')
          .insert(sessionPayload);
      }

      // 2. Update or Insert Grade Record
      const gradePayload = {
        student_id: student.id || `stu-${cleanNisn}`,
        nisn: cleanNisn,
        name: grade.name.trim(),
        class_name: grade.className.trim(),
        score: grade.score,
        max_score: grade.maxScore,
        submitted_at: grade.submittedAt,
        time_spent_minutes: grade.timeSpentMinutes,
        tab_violations: grade.tabViolations || 0,
        status: grade.status,
      };

      const { data: existingGrades } = await supabase
        .from('grade_records')
        .select('id')
        .eq('nisn', cleanNisn);

      if (existingGrades && existingGrades.length > 0) {
        await supabase
          .from('grade_records')
          .update(gradePayload)
          .eq('nisn', cleanNisn);
      } else {
        await supabase
          .from('grade_records')
          .insert(gradePayload);
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Supabase recordStudentSubmission warning:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send live warning to student in Supabase & Broadcast Real-Time
   */
  async sendWarningToStudent(studentNisn: string, studentName: string, message: string, examId?: string) {
    try {
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const warningText = message.trim();

      // 1. Insert into violation_logs for persistent audit trail
      await supabase.from('violation_logs').insert({
        exam_id: (examId && examId !== 'all') ? examId : null,
        student_name: studentName,
        student_nisn: studentNisn,
        timestamp: nowStr,
        message: `Peringatan Pengawas: "${warningText}"`,
        severity: 'warning',
      });

      // 2. Broadcast instant real-time event to student's device
      const alertChannel = supabase.channel(`student-alerts-${studentNisn}`);
      await alertChannel.send({
        type: 'broadcast',
        event: 'teacher_warning',
        payload: {
          studentNisn,
          studentName,
          message: warningText,
          timestamp: nowStr,
          examId: examId || null,
        },
      });

      // Also broadcast to class-wide channel
      if (examId && examId !== 'all') {
        const classChannel = supabase.channel(`exam-alerts-${examId}`);
        await classChannel.send({
          type: 'broadcast',
          event: 'teacher_warning',
          payload: {
            studentNisn,
            studentName,
            message: warningText,
            timestamp: nowStr,
            examId,
          },
        });
      }
    } catch (err: any) {
      console.warn('sendWarningToStudent warning:', err.message);
    }
  },

  /**
   * Reset student session in Supabase
   */
  async resetStudentSession(studentNisn: string) {
    try {
      await supabase
        .from('student_sessions')
        .update({
          status: 'working',
          connection_status: 'online',
          violation_count: 0,
        })
        .eq('nisn', studentNisn);

      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      await supabase.from('violation_logs').insert({
        student_name: studentNisn,
        student_nisn: studentNisn,
        timestamp: nowStr,
        message: 'Sesi ujian direset oleh guru pengawas.',
        severity: 'info',
      });
    } catch (err: any) {
      console.warn('resetStudentSession warning:', err.message);
    }
  },

  /**
   * Force submit student in Supabase & Broadcast
   */
  async forceSubmitStudent(studentNisn: string, examId?: string) {
    try {
      await supabase
        .from('student_sessions')
        .update({
          status: 'submitted',
          remaining_seconds: 0,
          submitted_at: new Date().toISOString(),
        })
        .eq('nisn', studentNisn);

      // Broadcast force submit command to student
      const alertChannel = supabase.channel(`student-alerts-${studentNisn}`);
      await alertChannel.send({
        type: 'broadcast',
        event: 'force_submit',
        payload: {
          studentNisn,
          examId: examId || null,
        },
      });
    } catch (err: any) {
      console.warn('forceSubmitStudent warning:', err.message);
    }
  },

  /**
   * Add global time to all active students in Supabase & Broadcast
   */
  async addGlobalTime(addedMinutes: number, examId?: string) {
    try {
      const addedSec = addedMinutes * 60;
      let query = supabase
        .from('student_sessions')
        .select('id, remaining_seconds')
        .neq('status', 'submitted');
      
      if (examId && examId !== 'all') {
        query = query.eq('exam_id', examId);
      }

      const { data: activeSessions } = await query;

      if (activeSessions) {
        for (const s of activeSessions) {
          await supabase
            .from('student_sessions')
            .update({ remaining_seconds: (s.remaining_seconds || 0) + addedSec })
            .eq('id', s.id);
        }
      }

      // Broadcast time extension event
      const channelName = (examId && examId !== 'all') ? `exam-alerts-${examId}` : 'exam-alerts-global';
      const classChannel = supabase.channel(channelName);
      await classChannel.send({
        type: 'broadcast',
        event: 'add_time',
        payload: {
          addedMinutes,
          examId: examId || null,
        },
      });
    } catch (err: any) {
      console.warn('addGlobalTime warning:', err.message);
    }
  },

  /**
   * Lock all active exams in Supabase & Broadcast
   */
  async lockAllExams(examId?: string) {
    try {
      let query = supabase
        .from('student_sessions')
        .update({
          status: 'submitted',
          remaining_seconds: 0,
          submitted_at: new Date().toISOString(),
        })
        .neq('status', 'submitted');

      if (examId && examId !== 'all') {
        query = query.eq('exam_id', examId);
      }

      await query;

      // Broadcast lock event
      const channelName = (examId && examId !== 'all') ? `exam-alerts-${examId}` : 'exam-alerts-global';
      const classChannel = supabase.channel(channelName);
      await classChannel.send({
        type: 'broadcast',
        event: 'lock_exam',
        payload: {
          examId: examId || null,
        },
      });
    } catch (err: any) {
      console.warn('lockAllExams warning:', err.message);
    }
  }
};

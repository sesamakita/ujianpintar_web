import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import type { StudentRosterItem, ExamSettings, QRExamSyncPayload } from '../types/exam';

const STORAGE_KEY_PREFIX = 'ujianpintar_roster_';

/**
 * Helper to get current authenticated user ID
 */
async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || user?.email || 'local_teacher';
  } catch {
    return 'local_teacher';
  }
}

/**
 * Helper to read from LocalStorage fallback
 */
function getLocalRoster(teacherId: string): StudentRosterItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${teacherId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return getAllLocalRoster();
}

/**
 * Helper to scan all roster keys across any teacher in LocalStorage
 */
function getAllLocalRoster(): StudentRosterItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const results: StudentRosterItem[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              arr.forEach((it) => {
                const uid = `${it.nisn || ''}_${(it.className || '').toLowerCase()}_${(it.studentName || '').toLowerCase()}`;
                if (!seen.has(uid)) {
                  seen.add(uid);
                  results.push(it);
                }
              });
            }
          } catch {}
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Helper to save to LocalStorage fallback
 */
function saveLocalRoster(teacherId: string, items: StudentRosterItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${teacherId}`, JSON.stringify(items));
  } catch (e) {
    console.warn('Gagal menyimpan roster ke LocalStorage:', e);
  }
}

export const rosterService = {
  /**
   * Mengambil semua daftar siswa milik guru tertentu
   */
  async getRoster(teacherId?: string): Promise<StudentRosterItem[]> {
    const effectiveTeacherId = teacherId || (await getCurrentUserId());

    try {
      // 1. Coba ambil dari Supabase
      let query = supabase.from('teacher_student_rosters').select('*');
      if (effectiveTeacherId && effectiveTeacherId !== 'all') {
        query = query.or(`teacher_id.eq.${effectiveTeacherId},teacher_id.eq.local_teacher`);
      }

      const { data, error } = await query
        .order('class_name', { ascending: true })
        .order('student_name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const formatted: StudentRosterItem[] = data.map((d: any) => ({
          id: d.id,
          teacherId: d.teacher_id,
          nisn: d.nisn,
          studentName: d.student_name,
          className: d.class_name,
          gender: d.gender || 'L',
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));

        // Sinkronkan cache lokal
        saveLocalRoster(effectiveTeacherId, formatted);
        return formatted;
      }
    } catch {
      // Supabase table belum ada / offline -> gunakan fallback LocalStorage
    }

    // Fallback ke LocalStorage
    return getLocalRoster(effectiveTeacherId);
  },

  /**
   * Menyinkronkan semua data siswa dari LocalStorage browser guru ke Supabase Cloud
   */
  async syncLocalToSupabase(teacherId?: string): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    const effectiveTeacherId = teacherId || (await getCurrentUserId());
    const local = getLocalRoster(effectiveTeacherId);
    if (!local || local.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    try {
      const payload = local.map((s) => ({
        teacher_id: effectiveTeacherId,
        nisn: s.nisn,
        student_name: s.studentName,
        class_name: s.className,
        gender: s.gender || 'L',
      }));

      const { error } = await supabase
        .from('teacher_student_rosters')
        .upsert(payload, { onConflict: 'teacher_id,nisn,class_name' });

      if (error) {
        return { success: false, syncedCount: 0, error: error.message };
      }
      return { success: true, syncedCount: local.length };
    } catch (err: any) {
      return { success: false, syncedCount: 0, error: err?.message || 'Gagal sinkron ke database cloud.' };
    }
  },

  /**
   * Mengambil daftar kelas unik yang diampu oleh guru
   */
  async getDistinctClasses(teacherId?: string): Promise<string[]> {
    const list = await this.getRoster(teacherId);
    const set = new Set<string>();
    list.forEach((item) => {
      const c = (item.className || '').trim();
      if (c && c !== '-') set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  },

  /**
   * Mengambil siswa pada kelas tertentu
   */
  async getRosterByClass(className: string, teacherId?: string): Promise<StudentRosterItem[]> {
    const list = await this.getRoster(teacherId);
    const cleanClass = className.trim().toLowerCase();
    return list.filter((item) => (item.className || '').trim().toLowerCase() === cleanClass);
  },

  /**
   * Menambah satu siswa baru ke database
   */
  async addStudent(item: Omit<StudentRosterItem, 'id'>): Promise<{ success: boolean; data?: StudentRosterItem; error?: string }> {
    const effectiveTeacherId = item.teacherId || (await getCurrentUserId());
    const newStudent: StudentRosterItem = {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      teacherId: effectiveTeacherId,
      nisn: item.nisn.trim(),
      studentName: item.studentName.trim(),
      className: item.className.trim(),
      gender: item.gender || 'L',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Simpan ke Supabase jika tabel tersedia
    try {
      const { data, error } = await supabase
        .from('teacher_student_rosters')
        .insert({
          teacher_id: effectiveTeacherId,
          nisn: newStudent.nisn,
          student_name: newStudent.studentName,
          class_name: newStudent.className,
          gender: newStudent.gender,
        })
        .select()
        .single();

      if (!error && data) {
        newStudent.id = data.id;
      }
    } catch {
      // ignore, fallback saves to local
    }

    // 2. Simpan ke LocalStorage
    const local = getLocalRoster(effectiveTeacherId);
    // Cek duplikasi NISN di kelas yang sama
    const existingIdx = local.findIndex(
      (s) => s.nisn === newStudent.nisn && s.className.toLowerCase() === newStudent.className.toLowerCase()
    );
    if (existingIdx >= 0) {
      local[existingIdx] = newStudent;
    } else {
      local.push(newStudent);
    }
    saveLocalRoster(effectiveTeacherId, local);

    return { success: true, data: newStudent };
  },

  /**
   * Memperbarui data siswa
   */
  async updateStudent(id: string, updates: Partial<StudentRosterItem>): Promise<{ success: boolean; error?: string }> {
    const teacherId = updates.teacherId || (await getCurrentUserId());

    try {
      await supabase
        .from('teacher_student_rosters')
        .update({
          nisn: updates.nisn,
          student_name: updates.studentName,
          class_name: updates.className,
          gender: updates.gender,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch {
      // ignore
    }

    // Update LocalStorage
    const local = getLocalRoster(teacherId);
    const idx = local.findIndex((s) => s.id === id);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() };
      saveLocalRoster(teacherId, local);
    }

    return { success: true };
  },

  /**
   * Menghapus siswa berdasarkan ID
   */
  async deleteStudent(id: string, teacherId?: string): Promise<{ success: boolean; error?: string }> {
    const effectiveTeacherId = teacherId || (await getCurrentUserId());

    try {
      await supabase
        .from('teacher_student_rosters')
        .delete()
        .eq('id', id);
    } catch {
      // ignore
    }

    const local = getLocalRoster(effectiveTeacherId);
    const filtered = local.filter((s) => s.id !== id);
    saveLocalRoster(effectiveTeacherId, filtered);

    return { success: true };
  },

  /**
   * Menghapus seluruh siswa dalam satu kelas tertentu
   */
  async deleteClass(className: string, teacherId?: string): Promise<{ success: boolean; error?: string }> {
    const effectiveTeacherId = teacherId || (await getCurrentUserId());

    try {
      await supabase
        .from('teacher_student_rosters')
        .delete()
        .eq('teacher_id', effectiveTeacherId)
        .eq('class_name', className);
    } catch {
      // ignore
    }

    const local = getLocalRoster(effectiveTeacherId);
    const filtered = local.filter((s) => s.className.toLowerCase() !== className.toLowerCase());
    saveLocalRoster(effectiveTeacherId, filtered);

    return { success: true };
  },

  /**
   * Mengimpor data siswa dari berkas Excel (.xlsx) atau CSV
   */
  async importRosterFromExcelOrCSV(
    file: File,
    teacherId?: string,
    defaultClass?: string
  ): Promise<{ success: boolean; importedCount: number; error?: string }> {
    const effectiveTeacherId = teacherId || (await getCurrentUserId());

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            return resolve({ success: false, importedCount: 0, error: 'Berkas kosong atau tidak terbaca.' });
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            return resolve({ success: false, importedCount: 0, error: 'Lembar kerja (Sheet) tidak ditemukan.' });
          }

          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (!rawRows || rawRows.length < 2) {
            return resolve({ success: false, importedCount: 0, error: 'Berkas tidak memiliki baris data siswa (minimal 2 baris termasuk header).' });
          }

          // Cari baris header
          let headerIdx = -1;
          let colNisn = -1;
          let colName = -1;
          let colClass = -1;
          let colGender = -1;

          for (let r = 0; r < Math.min(10, rawRows.length); r++) {
            const row = (rawRows[r] || []).map((cell: any) => String(cell || '').trim().toLowerCase());
            const nIdx = row.findIndex((c: string) => c.includes('nisn') || c.includes('no induk') || c.includes('nis'));
            const nameIdx = row.findIndex((c: string) => c.includes('nama') || c.includes('peserta') || c.includes('siswa'));

            if (nIdx >= 0 || nameIdx >= 0) {
              headerIdx = r;
              colNisn = nIdx;
              colName = nameIdx;
              colClass = row.findIndex((c: string) => c.includes('kelas') || c.includes('rombel'));
              colGender = row.findIndex((c: string) => c.includes('gender') || c.includes('jk') || c.includes('jenis kelamin'));
              break;
            }
          }

          // Jika header tidak eksplisit, gunakan index default 0 = NISN, 1 = Nama, 2 = Kelas
          if (headerIdx === -1) {
            headerIdx = 0;
            colNisn = 0;
            colName = 1;
            colClass = 2;
          }

          const validStudents: StudentRosterItem[] = [];

          for (let r = headerIdx + 1; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || row.length === 0) continue;

            const rawNisn = String(colNisn >= 0 ? row[colNisn] ?? '' : row[0] ?? '').trim().replace(/[^0-9]/g, '');
            const rawName = String(colName >= 0 ? row[colName] ?? '' : row[1] ?? '').trim();
            const rawClass = String(
              colClass >= 0 && row[colClass] ? row[colClass] : defaultClass || 'Kelas Utama'
            ).trim();

            let rawGender: 'L' | 'P' = 'L';
            if (colGender >= 0 && row[colGender]) {
              const gStr = String(row[colGender]).trim().toUpperCase();
              if (gStr.startsWith('P') || gStr.includes('PEREMPUAN')) rawGender = 'P';
            }

            if (rawName && rawName.length >= 2) {
              validStudents.push({
                id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                teacherId: effectiveTeacherId,
                nisn: rawNisn || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
                studentName: rawName,
                className: rawClass,
                gender: rawGender,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }

          if (validStudents.length === 0) {
            return resolve({
              success: false,
              importedCount: 0,
              error: 'Tidak ada baris data siswa yang valid ditemukan dalam file. Pastikan kolom nama siswa terisi.',
            });
          }

          // 1. Simpan massal ke Supabase jika memungkinkan
          try {
            await supabase.from('teacher_student_rosters').upsert(
              validStudents.map((s) => ({
                teacher_id: effectiveTeacherId,
                nisn: s.nisn,
                student_name: s.studentName,
                class_name: s.className,
                gender: s.gender,
              })),
              { onConflict: 'teacher_id,nisn,class_name' }
            );
          } catch {
            // fallback lokal
          }

          // 2. Gabungkan ke LocalStorage
          const currentLocal = getLocalRoster(effectiveTeacherId);
          const studentMap = new Map<string, StudentRosterItem>();
          currentLocal.forEach((s) => studentMap.set(`${s.className.toLowerCase()}_${s.nisn}`, s));
          validStudents.forEach((s) => studentMap.set(`${s.className.toLowerCase()}_${s.nisn}`, s));

          const merged = Array.from(studentMap.values());
          saveLocalRoster(effectiveTeacherId, merged);

          resolve({
            success: true,
            importedCount: validStudents.length,
          });
        } catch (err: any) {
          resolve({
            success: false,
            importedCount: 0,
            error: err.message || 'Gagal membaca isi berkas Excel/CSV.',
          });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, importedCount: 0, error: 'Gagal membuka berkas.' });
      };

      reader.readAsBinaryString(file);
    });
  },

  /**
   * Mengunduh Template Excel (.xlsx) Resmi untuk diisi guru
   */
  downloadExcelTemplate(): void {
    const sampleData = [
      ['NISN', 'Nama Lengkap Siswa', 'Kelas / Rombel', 'Jenis Kelamin (L/P)'],
      ['0081234567', 'Ahmad Fauzi Pratama', 'X 1', 'L'],
      ['0082345678', 'Anisa Rahmawati', 'X 1', 'P'],
      ['0083456789', 'Budi Santoso', 'X 1', 'L'],
      ['0084567890', 'Citra Dewi Lestari', 'X 2', 'P'],
      ['0085678901', 'Deni Indrayana', 'X 2', 'L'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

    // Atur lebar kolom agar rapi
    worksheet['!cols'] = [
      { wch: 18 }, // NISN
      { wch: 32 }, // Nama
      { wch: 16 }, // Kelas
      { wch: 22 }, // JK
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    XLSX.writeFile(workbook, 'Template_Database_Siswa_UjianPintar.xlsx');
  },

  /**
   * Menghasilkan teks Payload QR Code ujian ringkas
   */
  generateQrPayload(exam: ExamSettings): string {
    const payload: QRExamSyncPayload = {
      type: 'UP_EXAM_SYNC',
      v: 1,
      examId: exam.id,
      examTitle: exam.title,
      targetClass: exam.targetClass || '',
      token: '', // Token PIN tidak disertakan dalam QR Code; siswa wajib input manual saat pengawas mengumumkan PIN ujian
    };
    return JSON.stringify(payload);
  },

  /**
   * Parser teks QR Code yang dipindai kamera APK siswa
   */
  parseQrPayload(rawQrText: string): QRExamSyncPayload | null {
    if (!rawQrText) return null;
    try {
      const parsed = JSON.parse(rawQrText.trim());
      if (parsed.type === 'UP_EXAM_SYNC' && parsed.examId) {
        return {
          ...parsed,
          token: '', // PIN ujian selalu dikosongkan agar diinput manual
        } as QRExamSyncPayload;
      }
    } catch {
      // Bukan JSON terstruktur, periksa format URL atau token langsung
      if (rawQrText.startsWith('http')) {
        try {
          const url = new URL(rawQrText);
          const examId = url.searchParams.get('examId') || url.searchParams.get('id');
          const targetClass = url.searchParams.get('class') || '';
          if (examId) {
            return {
              type: 'UP_EXAM_SYNC',
              v: 1,
              examId,
              examTitle: 'Ujian Sekolah',
              targetClass,
              token: '', // PIN ujian selalu dikosongkan agar diinput manual
            };
          }
        } catch {}
      }
    }
    return null;
  },

  /**
   * Endpoint publik yang dipanggil APK siswa saat QR di-scan
   * untuk mengunduh daftar nama siswa kelas target (Autocomplete)
   */
  async getPublicClassRoster(examId: string, className?: string): Promise<StudentRosterItem[]> {
    try {
      // 1. Dapatkan info exam untuk mengetahui targetClass jika tidak diberikan
      let targetClass = className?.trim();
      let teacherId = '';

      if (!targetClass && examId) {
        const { data: exData } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .maybeSingle();

        if (exData) {
          targetClass = (exData as any).target_class || (exData as any).grade_level || '';
          teacherId = (exData as any).teacher_id || '';
        }
      }

      if (targetClass && targetClass !== 'Semua Kelas') {
        // Cari siswa dari database
        const clean = targetClass.replace(/^kelas\s*/i, '').trim();
        let query = supabase
          .from('teacher_student_rosters')
          .select('id, teacher_id, nisn, student_name, class_name, gender')
          .or(`class_name.ilike.%${clean}%,class_name.ilike.%${targetClass}%`);

        if (teacherId) {
          query = query.or(`teacher_id.eq.${teacherId},teacher_id.eq.local_teacher`);
        }

        const { data: students } = await query.order('student_name', { ascending: true });

        if (students && students.length > 0) {
          return students.map((s: any) => ({
            id: s.id,
            teacherId: s.teacher_id,
            nisn: s.nisn,
            studentName: s.student_name,
            className: s.class_name,
            gender: s.gender,
          }));
        }
      }
    } catch {
      // fallback
    }

    // Jika Supabase kosong/offline, periksa apakah ada di LocalStorage
    const allLocal = getAllLocalRoster();
    const effectiveClass = (className || '').trim().toLowerCase();
    if (effectiveClass) {
      return allLocal.filter((s) => (s.className || '').trim().toLowerCase() === effectiveClass);
    }
    return allLocal;
  },
};

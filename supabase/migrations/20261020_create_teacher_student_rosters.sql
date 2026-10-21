-- ==============================================================================
-- MIGRASI DATABASE: ROSTER SISWA & SINKRONISASI KELAS (QR INSTANT SYNC)
-- Platform: UjianPintar PRO / Guru Hebat
-- Target Host: https://api.ujianpintar.online
-- ==============================================================================

-- 1. Buat Tabel teacher_student_rosters
CREATE TABLE IF NOT EXISTS public.teacher_student_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id VARCHAR(100) NOT NULL,
    nisn VARCHAR(20) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10) DEFAULT 'L',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Mencegah entri ganda untuk siswa dan kelas yang sama pada satu guru
    CONSTRAINT unique_teacher_student_class UNIQUE(teacher_id, nisn, class_name)
);

-- Indeks performa untuk autocomplete dan pencarian per rombel
CREATE INDEX IF NOT EXISTS idx_rosters_teacher_class ON public.teacher_student_rosters(teacher_id, class_name);
CREATE INDEX IF NOT EXISTS idx_rosters_search_name ON public.teacher_student_rosters(class_name, student_name);
CREATE INDEX IF NOT EXISTS idx_rosters_nisn ON public.teacher_student_rosters(nisn);

-- 2. Tambahkan kolom target_class pada tabel exams jika belum ada
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS target_class VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS qr_sync_code VARCHAR(20) DEFAULT NULL;

-- 3. Tambahkan kolom roster_student_id pada student_sessions jika belum ada
ALTER TABLE public.student_sessions
ADD COLUMN IF NOT EXISTS roster_student_id UUID REFERENCES public.teacher_student_rosters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(100) DEFAULT NULL;

-- 4. Kebijakan Keamanan Row Level Security (RLS)
ALTER TABLE public.teacher_student_rosters ENABLE ROW LEVEL SECURITY;

-- Izinkan guru mengelola dan menyinkronkan data siswa dari dashboard web
DROP POLICY IF EXISTS "Guru can manage own students" ON public.teacher_student_rosters;
CREATE POLICY "Guru can manage own students" 
ON public.teacher_student_rosters
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Izinkan APK siswa (pengguna anonim / publik) membaca daftar nama siswa untuk autocomplete
DROP POLICY IF EXISTS "Public can view students for exam autocomplete" ON public.teacher_student_rosters;
CREATE POLICY "Public can view students for exam autocomplete"
ON public.teacher_student_rosters
FOR SELECT 
TO anon, authenticated 
USING (true);

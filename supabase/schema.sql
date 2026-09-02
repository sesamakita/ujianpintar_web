-- ==============================================================================
-- SMARTEXAM DATABASE SCHEMA (PostgreSQL / Supabase DDL)
-- Portal Guru & Asesmen Ujian Berintegritas Multi-Sekolah
-- ==============================================================================

-- 1. Enable Extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. TABLE: profiles (Data Profil Guru & Satuan Pendidikan)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  nip text,
  school_name text not null,
  npsn text,
  subject text default 'Matematika Wajib',
  role text default 'teacher',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==============================================================================
-- 3. TABLE: exams (Paket Sesi Ujian & Aturan Anti-Cheat)
-- ==============================================================================
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade,
  title text not null,
  subject text not null,
  grade_level text not null,
  duration_minutes integer default 60,
  token char(6) unique not null,
  schedule_date date default current_date,
  schedule_time time default current_time,
  anti_cheat jsonb default '{
    "detectTabSwitch": true,
    "fullScreenLock": true,
    "shuffleQuestions": true,
    "shuffleOptions": true
  }'::jsonb,
  status text default 'published', -- 'draft', 'published', 'active', 'closed'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_exams_token on public.exams(token);
create index if not exists idx_exams_teacher on public.exams(teacher_id);

-- ==============================================================================
-- 4. TABLE: questions (Butir Soal, LaTeX, Opsi JSONB, & Kunci Jawaban)
-- ==============================================================================
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete cascade,
  number_order integer not null,
  type text not null default 'multiple_choice', -- 'multiple_choice', 'short_answer', 'true_false', 'essay'
  question_text text not null,
  latex_formula text,
  image_url text,
  options jsonb default '[]'::jsonb,
  correct_option_id text,
  correct_answer_text text,
  points integer default 10,
  created_at timestamptz default now()
);

create index if not exists idx_questions_exam on public.questions(exam_id);

-- ==============================================================================
-- 5. TABLE: student_sessions (Sesi Pengerjaan Siswa & Telemetri Live)
-- ==============================================================================
create table if not exists public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete cascade,
  nisn text not null,
  student_name text not null,
  class_name text not null,
  status text default 'working', -- 'working', 'submitted', 'violation_flagged'
  connection_status text default 'online', -- 'online', 'offline', 'reconnecting'
  remaining_seconds integer not null,
  total_questions integer default 0,
  progress_count integer default 0,
  violation_count integer default 0,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_sessions_exam on public.student_sessions(exam_id);
create index if not exists idx_sessions_nisn on public.student_sessions(nisn);

-- ==============================================================================
-- 6. TABLE: student_answers (Jawaban Tiap Nomor & Riwayat Ragu)
-- ==============================================================================
create table if not exists public.student_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.student_sessions(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  selected_option_id text,
  answer_text text,
  is_doubt boolean default false,
  is_correct boolean,
  score_earned integer default 0,
  answered_at timestamptz default now()
);

create index if not exists idx_answers_session on public.student_answers(session_id);

-- ==============================================================================
-- 7. TABLE: violation_logs (Log Pelanggaran Tab Switch Real-Time)
-- ==============================================================================
create table if not exists public.violation_logs (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete cascade,
  session_id uuid references public.student_sessions(id) on delete cascade,
  student_name text not null,
  student_nisn text not null,
  timestamp text not null,
  message text not null,
  severity text default 'warning', -- 'info', 'warning', 'danger'
  created_at timestamptz default now()
);

create index if not exists idx_violations_exam on public.violation_logs(exam_id);

-- ==============================================================================
-- 8. TABLE: grade_records (Rekapitulasi Nilai Akhir & Hasil Kelulusan KKM)
-- ==============================================================================
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete cascade,
  session_id uuid references public.student_sessions(id) on delete cascade,
  student_id text not null,
  name text not null,
  nisn text not null,
  class_name text not null,
  score integer not null,
  max_score integer default 100,
  submitted_at text not null,
  time_spent_minutes integer default 0,
  tab_violations integer default 0,
  status text default 'Lulus', -- 'Lulus', 'Remedial'
  created_at timestamptz default now()
);

create index if not exists idx_grades_exam on public.grade_records(exam_id);

-- ==============================================================================
-- 9. ENABLE REALTIME REPLICATION (Supabase Realtime WebSockets)
-- ==============================================================================
alter publication supabase_realtime add table public.student_sessions;
alter publication supabase_realtime add table public.violation_logs;
alter publication supabase_realtime add table public.student_answers;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.student_sessions enable row level security;
alter table public.student_answers enable row level security;
alter table public.violation_logs enable row level security;
alter table public.grade_records enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Exams Policies
create policy "Teachers can manage own exams" on public.exams
  for all using (auth.uid() = teacher_id);

create policy "Public can read active exam by token" on public.exams
  for select using (status in ('published', 'active'));

-- Questions Policies
create policy "Teachers can manage questions of own exams" on public.questions
  for all using (
    exists (
      select 1 from public.exams
      where exams.id = questions.exam_id and exams.teacher_id = auth.uid()
    )
  );

create policy "Public can read questions for exam" on public.questions
  for select using (
    exists (
      select 1 from public.exams
      where exams.id = questions.exam_id and exams.status in ('published', 'active')
    )
  );

-- Student Sessions Policies (Allow Students & Teachers)
create policy "Anyone can insert/read student sessions" on public.student_sessions
  for all using (true) with check (true);

-- Student Answers Policies
create policy "Anyone can manage student answers" on public.student_answers
  for all using (true) with check (true);

-- Violation Logs Policies
create policy "Anyone can insert and view violation logs" on public.violation_logs
  for all using (true) with check (true);

-- Grade Records Policies
create policy "Anyone can view and insert grade records" on public.grade_records
  for all using (true) with check (true);

-- ==============================================================================
-- 11. TRIGGER: Auto-create Profile on Sign Up
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, school_name, subject)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Guru Penguji'),
    coalesce(new.raw_user_meta_data->>'school_name', 'Satuan Pendidikan'),
    coalesce(new.raw_user_meta_data->>'subject', 'Matematika')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

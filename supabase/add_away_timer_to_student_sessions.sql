-- ==============================================================================
-- Migration: Add Away Timer & Screen Blur Telemetry to student_sessions
-- ==============================================================================

-- 1. Add away tracking columns to student_sessions
alter table public.student_sessions 
  add column if not exists is_away boolean default false,
  add column if not exists left_at timestamptz default null,
  add column if not exists last_away_seconds integer default 0,
  add column if not exists total_away_seconds integer default 0;

-- 2. Create index for fast filtering of students currently away
create index if not exists idx_sessions_is_away on public.student_sessions(is_away);

-- 3. Ensure realtime publication covers these columns
alter publication supabase_realtime add table public.student_sessions;

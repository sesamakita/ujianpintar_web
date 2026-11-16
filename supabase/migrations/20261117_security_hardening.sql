-- ==============================================================================
-- MIGRATION: 20261117_security_hardening.sql
-- UjianPintar Row Level Security (RLS) Hardening & Prerequisite Schema Fix
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PREREQUISITE TABLE: public.bot_settings
-- Pengaturan Bot WhatsApp AI, Prompt System & WAHA Gateway
-- ------------------------------------------------------------------------------
create table if not exists public.bot_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Grant privileges
grant all on public.bot_settings to service_role;
grant select on public.bot_settings to anon, authenticated;

-- Hardening RLS bot_settings
alter table public.bot_settings enable row level security;

drop policy if exists "Anyone can view and manage bot settings" on public.bot_settings;
drop policy if exists "Anyone can view bot settings" on public.bot_settings;
drop policy if exists "Only service role can manage bot settings" on public.bot_settings;

create policy "Anyone can view bot settings"
  on public.bot_settings
  for select
  using (true);

create policy "Only service role can manage bot settings"
  on public.bot_settings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ------------------------------------------------------------------------------
-- 2. PREREQUISITE TABLE: public.payment_transactions
-- Transaksi Pembayaran DANA / QRIS & Sinkronisasi Langganan Guru
-- ------------------------------------------------------------------------------
create table if not exists public.payment_transactions (
  id text primary key,
  invoice_number text unique not null,
  teacher_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_whatsapp text,
  customer_school text,
  plan_id text not null,
  plan_name text not null,
  tier text not null default 'pro',
  billing_cycle text not null default 'yearly',
  base_amount numeric not null default 0,
  unique_code integer default 0,
  total_amount numeric not null default 0,
  payment_channel text default 'dana',
  status text not null default 'pending', -- 'pending', 'paid', 'rejected', 'expired'
  created_at timestamptz default now(),
  paid_at timestamptz,
  approved_by text,
  notes text
);

-- Indexing untuk query cepat
create index if not exists idx_payment_transactions_email on public.payment_transactions(customer_email);
create index if not exists idx_payment_transactions_status on public.payment_transactions(status);
create index if not exists idx_payment_transactions_invoice on public.payment_transactions(invoice_number);

-- Pastikan kolom subscription_* dan whatsapp_number tersedia di tabel profiles
alter table public.profiles add column if not exists subscription_tier text default 'free';
alter table public.profiles add column if not exists subscription_expires_at timestamptz;
alter table public.profiles add column if not exists subscription_started_at timestamptz;
alter table public.profiles add column if not exists whatsapp_number text;

-- Tambahkan ke Realtime Publication (idempotent / aman jika sudah terdaftar)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payment_transactions'
  ) then
    alter publication supabase_realtime add table public.payment_transactions;
  end if;
exception when others then
  null;
end $$;

-- Grant privileges
grant all on public.payment_transactions to service_role;
grant select, insert on public.payment_transactions to anon, authenticated;

-- Hardening RLS payment_transactions
alter table public.payment_transactions enable row level security;

drop policy if exists "Allow insert payment transaction" on public.payment_transactions;
drop policy if exists "Allow read payment transactions" on public.payment_transactions;
drop policy if exists "Allow update payment transactions" on public.payment_transactions;
drop policy if exists "Only service role can update payment transactions" on public.payment_transactions;

-- Publik & Guru dapat membuat transaksi saat checkout
create policy "Allow insert payment transaction"
  on public.payment_transactions
  for insert
  with check (true);

-- Publik dapat membaca transaksi untuk realtime subscription polling / invoice display
create policy "Allow read payment transactions"
  on public.payment_transactions
  for select
  using (true);

-- KRITIKAL: Hanya service_role (Bot Telegram / Admin Endpoint) yang dapat mengubah status transaksi menjadi 'paid'
create policy "Only service role can update payment transactions"
  on public.payment_transactions
  for update
  using (auth.role() = 'service_role');


-- ------------------------------------------------------------------------------
-- 3. PERFORMA & INTEGRITAS: Indexing Soal & Ujian
-- ------------------------------------------------------------------------------
create index if not exists idx_questions_exam_id on public.questions(exam_id);
create index if not exists idx_exams_token_status on public.exams(token, status);
create index if not exists idx_student_sessions_exam_student on public.student_sessions(exam_id, student_name);
create index if not exists idx_grade_records_exam_id on public.grade_records(exam_id);

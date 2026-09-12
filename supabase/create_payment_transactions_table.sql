-- ==============================================================================
-- SMARTEXAM / GURU HEBAT: TABLE PAYMENT_TRANSACTIONS & SUBSCRIPTION SCHEMA
-- Menangani Transaksi Pembayaran DANA / QRIS & Sinkronisasi Bot Telegram
-- ==============================================================================

-- 1. Buat Tabel payment_transactions
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

-- 2. Buat Index untuk Performa Query
create index if not exists idx_payment_transactions_email on public.payment_transactions(customer_email);
create index if not exists idx_payment_transactions_status on public.payment_transactions(status);
create index if not exists idx_payment_transactions_invoice on public.payment_transactions(invoice_number);

-- 3. Pastikan Kolom subscription_* dan whatsapp_number Tersedia di Tabel profiles
alter table public.profiles add column if not exists subscription_tier text default 'free';
alter table public.profiles add column if not exists subscription_expires_at timestamptz;
alter table public.profiles add column if not exists subscription_started_at timestamptz;
alter table public.profiles add column if not exists whatsapp_number text;

-- 4. Aktifkan Supabase Realtime untuk Sinkronisasi Instan ke Browser Guru
alter publication supabase_realtime add table public.payment_transactions;

-- 5. Kebijakan Keamanan RLS (Row Level Security)
alter table public.payment_transactions enable row level security;

-- Izinkan publik / user membuat data transaksi checkout
create policy "Allow insert payment transaction" on public.payment_transactions
  for insert with check (true);

-- Izinkan pembacaan data transaksi (agar realtime update & riwayat terbaca)
create policy "Allow read payment transactions" on public.payment_transactions
  for select using (true);

-- Izinkan pembaruan status transaksi (oleh bot telegram atau admin)
create policy "Allow update payment transactions" on public.payment_transactions
  for update using (true);

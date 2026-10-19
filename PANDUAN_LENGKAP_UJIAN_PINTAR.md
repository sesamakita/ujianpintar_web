# 📘 PANDUAN LENGKAP PLATFORM UJIAN PINTAR
### Platform Asesmen Digital & Pengawasan Ujian Online (Teori + Tutorial)

> **Disusun dari studi dua repositori sumber:**
> - `D:\AllDataVsCode\guru_hebat` — **Web Portal Guru / Dashboard** (React + Vite + TypeScript + Supabase)
> - `D:\AllDataVsCode\guru_hebat_2` — **Aplikasi Mobile (APK)** siswa & pengawas (Expo / React Native)
>
> Dokumen ini merangkum **teori** (konsep, arsitektur, model data, alur kerja, mesin inti) sekaligus
> **praktik/tutorial** (cara menjalankan, penggunaan peran-peran pengguna, deploy, dan pemecahan masalah).

---

## Daftar Isi

1. [Ringkasan Platform](#1-ringkasan-platform)
2. [Teori: Apa Itu Ujian Pintar](#2-teori-apa-itu-ujian-pintar)
3. [Teori: Arsitektur & Teknologi](#3-teori-arsitektur-teknologi)
4. [Teori: Struktur Repositori](#4-teori-struktur-repositori)
5. [Teori: Model Data (Database Supabase)](#5-teori-model-data-database-supabase)
6. [Teori: Alur Kerja Inti](#6-teori-alur-kerja-inti)
7. [Teori: Mesin Penilaian & Integritas (Scoring Engine)](#7-teori-mesin-penilaian-integritas-scoring-engine)
8. [Teori: Sistem Anti-Cheat & Live Proctoring](#8-teori-sistem-anti-cheat-live-proctoring)
9. [Teori: Berlangganan, Lisensi Sekolah & Pembayaran](#9-teori-berlangganan-lisensi-sekolah-pembayaran)
10. [Tutorial: Menjalankan Proyek](#10-tutorial-menjalankan-proyek)
11. [Tutorial: Panduan Guru — Portal Web](#11-tutorial-panduan-guru-portal-web)
12. [Tutorial: Panduan Siswa — Aplikasi Mobile](#12-tutorial-panduan-siswa-aplikasi-mobile)
13. [Tutorial: Panduan Pengawas — Aplikasi Mobile](#13-tutorial-panduan-pengawas-aplikasi-mobile)
14. [Tutorial: Super Admin](#14-tutorial-super-admin)
15. [Tutorial: Bot VPS (Telegram & WhatsApp AI)](#15-tutorial-bot-vps-telegram-whatsapp-ai)
16. [Tutorial: Build & Deploy](#16-tutorial-build-deploy)
17. [Troubleshooting & Catatan Teknis](#17-troubleshooting-catatan-teknis)
18. [Kesimpulan & Peta Belajar Lanjutan](#18-kesimpulan-peta-belajar-lanjutan)

---

## 1. Ringkasan Platform

| Item | Nilai |
|---|---|
| **Nama Produk** | **UjianPintar** — Platform Asesmen Digital & Pengawasan Ujian Online |
| **Website** | `https://ujianpintar.online` |
| **Backend / API** | Supabase **self-hosted** di `https://api.ujianpintar.online` |
| **Repositori Web** | `D:\AllDataVsCode\guru_hebat` (repo `sesamakita/ujianpintar_web`, branch `main`) |
| **Repositori Mobile** | `D:\AllDataVsCode\guru_hebat_2` (APK `UjianPintar-Siswa`) |
| **Web Stack** | React 19 + TypeScript + Vite, Tailwind CSS, Supabase JS v2, lucide-react, KaTeX, SheetJS (xlsx) |
| **Mobile Stack** | Expo SDK 57 / React Native 0.86, AsyncStorage, expo-crypto, expo-print/sharing, lucide-react-native, KaTeX |
| **Mesin inti (opsional)** | Crate Rust `smartexam-core` (WASM) di `crates/smartexam-core` |
| **Bot VPS** | `vps-bot/` — Bot Telegram pembayaran + Bot WhatsApp AI |
| **Peran pengguna** | Guru (web), Siswa (APK), Pengawas/Proktor (APK), Operator/Super Admin (web) |

**Tujuan produk:** memungkinkan sekolah/guru menjalankan **ujian berbasis komputer (CBT)** melalui
**HP siswa** secara online, dengan **pengawasan live**, **anti-curang**, **penilaian otomatis**,
**koreksi esai berbantuan AI**, dan **rekap nilai** — lengkap dengan model **berlangganan** dan
**lisensi sekolah**.

---

## 2. Teori: Apa Itu Ujian Pintar

### 2.1 Konsep Inti

Ujian Pintar adalah **platform asesmen digital** yang memisahkan tiga sisi pengguna:

1. **Guru** (via **Web Portal** di `/portal`) — membuat & mengelola bank soal, menjadwalkan ujian,
   membagikan **Token 6-digit**, memantau siswa secara langsung (**live proctoring**), menilai esai,
   dan mengekspor rekap nilai.
2. **Siswa** (via **APK Android "Ujian Pintar"**) — memasukkan Token + NISN, mengerjakan soal dengan
   layar terkunci & terdeteksi anti-curang, lalu melihat hasil nilai secara instan.
3. **Pengawas / Proktor** (via **APK** yang sama dengan mode Guru) — masuk dengan **PIN Pengawas**,
   memantau telemetri siswa, mengirim peringatan, menambah waktu, men-submit paksa, atau mengunci ujian.

Ada pula **Super Admin** (via web di `/super-admin`) untuk mengelola lisensi sekolah, akun guru,
statistik unduhan APK, dan pengaturan bot WhatsApp AI.

### 2.2 Istilah-Istilah Penting

| Istilah | Arti |
|---|---|
| **Token Ujian** | Kode 6 digit unik per paket ujian; siswa memakainya untuk bergabung. |
| **PIN Pengawas (Proctor PIN)** | Kode 6 digit opsional per ujian untuk login mode pengawas di APK. |
| **KKM** | Kriteria Ketuntasan Minimal (default 75). Menentukan status **Lulus / Remedial**. |
| **Status Ujian** | `draft` → `published` → `active` → `closed` (diakses lewat toggle buka/tutup). |
| **Status Sesi Siswa** | `ready` / `working` / `submitted` / `violation_flagged` / `timed_out`. |
| **Anti-Cheat** | Deteksi pindah tab, kunci layar penuh, acak soal/opsi, larangan screenshot, deteksi keluar aplikasi. |
| **Stempel Integritas** | Hash SHA-256 dari isi jawaban + metadata (anti-manipulasi nilai). |
| **Live Proctoring** | Dasbor pemantauan real-time siswa: sisa waktu, progres, status koneksi, jumlah pelanggaran. |
| **Grade Record** | Rekapitulasi nilai akhir (score, maxScore, status, tabViolations, dsb). |

### 2.3 Model Bisnis

- **Guru Basic (Gratis)** — kuota 3 sesi ujian/bulan (kelas >10 siswa), maks 40 siswa/sesi, tanpa
  logo kustom, ekspor hanya CSV.
- **Guru PRO (Rp 20.000/bulan atau Rp 180.000/tahun)** — unlimited sesi & siswa, fullscreen lock,
  LaTeX tak terbatas, ekspor Excel, stempel SHA-256, prioritas grading.
- **Lisensi Sekolah (Rp 1.500.000/tahun per NPSN)** — semua guru di satu NPSN jadi PRO, logo/kop
  surat sekolah, bank soal kolektif, analitik per tingkat, dukungan prioritas.

Pembayaran via **DANA / QRIS**; verifikasi pembayaran dilakukan oleh **bot Telegram admin**
yang menandai transaksi `paid` secara real-time.

---

## 3. Teori: Arsitektur & Teknologi

### 3.1 Gambaran Arsitektur

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  WEB PORTAL GURU (React+Vite)│        │  APK SISWA & PENGAWAS (Expo) │
│  / (landing)                 │        │  - StudentQuickEntry (token) │
│  /portal (dashboard guru)    │        │  - StudentLobby → ExamSheet   │
│  /cek-nilai (portal siswa)   │        │  - TeacherProctoringView      │
│  /super-admin                │        └──────────────┬───────────────┘
└──────────────┬───────────────┘                       │
               │ REST + Realtime (WebSocket)            │ REST polling (5 s) + Realtime
               ▼                                        ▼
        ┌─────────────────────────────────────────────────────────┐
        │          SUPABASE SELF-HOSTED (api.ujianpintar.online)   │
        │  Auth (GoTrue) • Postgres • Realtime • Storage • RPC     │
        │  Tabel: profiles, exams, questions, student_sessions,    │
        │  student_answers, violation_logs, grade_records,         │
        │  teacher_media, payment_transactions, app_versions       │
        └───────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────────────┐
        │                       ▼                               │
        │   VPS BOT (vps-bot/)          Rust WASM (crates/)     │
        │   - telegram-payment-bot.js   smartexam-core:         │
        │   - whatsapp-ai-bot.js        scoring + integrity seal │
        └────────────────────────────────────────────────────────┘
```

### 3.2 Komponen Teknologi per Sisi

**Web (`guru_hebat`)**
- **Framework**: React 19 + TypeScript ~6.0 + Vite 8
- **UI/Styling**: Tailwind CSS 3.4 + tailwind-merge + clsx; ikon `lucide-react`
- **Rendering Matematika**: KaTeX (LaTeX/rumus di soal)
- **Import soal**: SheetJS (`xlsx`) untuk .xlsx/.csv; parser teks untuk .txt
- **Backend**: `@supabase/supabase-js` v2.112 — Auth, database, Realtime, Storage
- **Lint/Build**: oxlint + `tsc -b` + `vite build`; CI GitHub Actions (Node 22)

**Mobile (`guru_hebat_2`)**
- **Framework**: Expo SDK 57 / React Native 0.86, entry `index.ts` → `App.tsx`
- **Font**: Plus Jakarta Sans (via `@expo-google-fonts`)
- **Storage lokal**: `@react-native-async-storage/async-storage` (offline-first caching)
- **Kriptografi**: `expo-crypto` untuk stempel SHA-256
- **Anti-screenshot**: `expo-screen-capture`; **jaga layar**: `expo-keep-awake`
- **Cetak/PDF**: `expo-print` + `expo-sharing` (hasil SKHU/rapor)
- **WebView**: `react-native-webview`; **SVG**: `react-native-svg`
- **Desain**: design token `src/theme` (Claymorphism — kartu 3D "lembut")

**Mesin inti Rust (`crates/smartexam-core`)**
- Crate `cdylib + rlib`; WASM via `wasm-bindgen`; serde + serde_json + sha2
- Ekspor fungsi: `grade_exam_wasm(questions, answers, kkm)` dan `generate_integrity_seal(...)`
- **Catatan**: kode TypeScript (`src/wasm/rustEngine.ts` di web dan `scoringEngine.ts` di mobile)
  adalah **"mirror"** dari logika Rust ini, jadi scoring konsisten di ketiga platform.

**Bot VPS (`vps-bot`)**
- Node.js (ESM). Dua bot: `telegram-payment-bot.js` & `whatsapp-ai-bot.js`
- Terhubung ke Supabase (service role) dan **WAHA** (WhatsApp HTTP API) di VPS
- Dijalankan dengan PM2 di VPS.

---

## 4. Teori: Struktur Repositori

### 4.1 `guru_hebat` (Web)

```
guru_hebat/
├─ index.html, vite.config.ts, tailwind.config.js, postcss.config.js
├─ package.json, tsconfig*.json, .oxlintrc.json
├─ AI_CONTEXT.md            ← konteks teknis & riwayat audit proyek (sangat berguna)
├─ README.md                ← template bawaan Vite
├─ .github/workflows/ci.yml ← CI: lint + tsc + build
├─ public/                  ← aset statis, favicon, robots.txt, sitemap, version.json, APK download
│  └─ templates/Template_Soal_SmartExam.csv
├─ src/
│  ├─ main.tsx, App.tsx     ← routing/state top-level (landing | auth | portal + super-admin route)
│  ├─ index.css
│  ├─ components/
│  │  ├─ landing/LandingPage.tsx          ← halaman depan (SEO, pricing, FAQ)
│  │  ├─ auth/AuthPage.tsx                ← login/register guru
│  │  ├─ layout/{Header,Sidebar}.tsx      ← kerangka dashboard
│  │  ├─ question-builder/                ← bank soal & editor (QuestionBuilder, ExamBankList,
│  │  │                                     QuestionCard, ExamSettingsPanel, ImportModal,
│  │  │                                     AIGeneratorModal, BulkPointsModal, MobilePreviewModal, TimePickerModal)
│  │  ├─ live-proctoring/                 ← pengawasan live (LiveProctoringDashboard,
│  │  │                                     ProctoringKPIHeader, StudentMonitoringTable,
│  │  │                                     ViolationFeed, StudentActionModal)
│  │  ├─ analytics/                       ← rekap nilai (GradeAnalytics, EssayGradingModal,
│  │  │                                     StudentAnswerDetailModal, PrintableStudentExamSheet)
│  │  ├─ media/MediaGalleryPage.tsx       ← koleksi foto soal (VPS)
│  │  ├─ settings/SystemSettings.tsx      ← profil sekolah & pengaturan
│  │  ├─ subscription/                    ← paket & pembayaran (SubscriptionAndAboutPage, PaymentCheckoutModal,
│  │  │                                     SchoolLicenseRedeemCard, UpgradePromptModal, dsb.)
│  │  ├─ super-admin/                     ← SuperAdminDashboard, SuperAdminLoginPage, WhatsAppBotSettingsTab
│  │  ├─ portal/                          ← cek-nilai siswa & cetak (StudentResultPortalModal, PrintableStudentResultCard)
│  │  └─ common/                          ← MathRenderer, ConfirmModal, ErrorBoundary, AppLogo, dsb.
│  ├─ services/            ← lapisan data (authService, examService, subscriptionService,
│  │                         schoolLicenseService, superAdminService, aiQuestionService,
│  │                         aiEssayGradingService, teacherMediaService, whatsappOtpService,
│  │                         whatsappVerificationService, botSettingsService, indonesiaRegionService)
│  ├─ types/               ← tipe TypeScript (exam, subscription, schoolLicense, media)
│  ├─ utils/               ← formatters, fileParser, templateGenerator
│  ├─ wasm/rustEngine.ts   ← mirror scoring + SHA-256 seal
│  └─ data/mockData.ts     ← data contoh (bawaan)
├─ crates/smartexam-core/  ← mesin Rust (scoring + anti-cheat) → WASM
├─ supabase/               ← schema.sql + migrasi SQL tambahan
├─ vps-bot/                ← bot Telegram & WhatsApp AI
└─ dist/, dist.zip         ← hasil build produksi
```

### 4.2 `guru_hebat_2` (Mobile)

```
guru_hebat_2/
├─ index.ts, App.tsx          ← entry & navigasi state utama (siswa/guru, langkah 1-4)
├─ app.json                   ← konfigurasi Expo (nama "Ujian Pintar", android package com.ujianpintar.student)
├─ eas.json                   ← konfigurasi EAS Build (production/preview/development)
├─ package.json, tsconfig.json
├─ AGENTS.md / CLAUDE.md      ← catatan untuk agent AI
├─ CATATAN_SELESAI_KELOLA_SESI.md ← catatan debugging fitur Kelola Sesi (berguna!)
├─ android/                   ← proyek native Android (untuk build APK lokal)
├─ assets/                    ← ikon & splash
├─ UjianPintar-*.apk / *.aab  ← artefak build rilis
└─ src/
   ├─ components/
   │  ├─ auth/                ← RoleSelectorModal, TeacherAuthModal, StudentQuickEntry
   │  ├─ student/             ← StudentLobby, StudentExamSheet, StudentResultModal, StudentResultView, QuestionGridModal
   │  ├─ teacher/             ← TeacherProctoringView, TeacherStudentActionModal, LiveViolationTicker, TeacherGradeReportView
   │  ├─ common/              ← CustomModal, HeaderBar, MathRenderer, StatusBadge, UpdateAppModal, UjianPintarLogo, katexEmbeddedCss
   │  └─ welcome/WelcomeScreen.tsx
   ├─ hooks/                  ← useAntiCheat, useCountdown, useExamHeartbeat, useLiveProctoring
   ├─ lib/                    ← supabase.ts, storage.ts (AsyncStorage), pdfGenerator.ts (SKHU HTML), formatters.ts
   ├─ services/               ← authService, examService, scoringEngine, updateService
   ├─ theme/                  ← index.ts (design tokens) + clay.ts (Claymorphism)
   └─ types/exam.ts
```

---

## 5. Teori: Model Data (Database Supabase)

Semua data disimpan di **PostgreSQL / Supabase** (`api.ujianpintar.online`). Skema utama ada di
`supabase/schema.sql`; tabel tambahan ada di file SQL migrasi terpisah. Berikut ringkasannya.

### 5.1 Tabel-Tabel

| Tabel | Fungsi | Kolom kunci |
|---|---|---|
| `profiles` | Profil guru/sekolah (satu baris per `auth.users.id`) | `full_name`, `nip`, `school_name`, `npsn`, `subject`, `role`, `whatsapp_number`, `subscription_tier`, `subscription_expires_at`, `supervisor_pin` |
| `exams` | Paket ujian & aturan anti-cheat | `teacher_id`, `title`, `subject`, `grade_level`, `duration_minutes`, `token` (6 digit, unique), `anti_cheat` (jsonb), `status` |
| `questions` | Butir soal | `exam_id`, `number_order`, `type` (multiple_choice/short_answer/true_false/essay), `question_text`, `latex_formula`, `image_url`, `options` (jsonb), `correct_option_id`, `correct_answer_text`, `points` |
| `student_sessions` | Sesi pengerjaan siswa + telemetri live | `exam_id`, `nisn`, `student_name`, `class_name`, `status`, `connection_status`, `remaining_seconds`, `total_questions`, `progress_count`, `violation_count`, `started_at`, `submitted_at`, `is_away`, `left_at`, `last_away_seconds`, `total_away_seconds` |
| `student_answers` | Jawaban per butir + riwayat ragu | `session_id`, `question_id`, `selected_option_id`, `answer_text`, `is_doubt`, `is_correct`, `score_earned`, `answered_at` |
| `violation_logs` | Log pelanggaran / aksi pengawas | `exam_id`, `session_id`, `student_name`, `student_nisn`, `timestamp`, `message`, `severity` (info/warning/danger) |
| `grade_records` | Rekap nilai akhir | `exam_id`, `session_id`, `student_id`, `name`, `nisn`, `class_name`, `score`, `max_score`, `submitted_at`, `time_spent_minutes`, `tab_violations`, `status` |
| `teacher_media` | Koleksi foto soal guru (VPS) | `user_id`, `user_email`, `file_name`, `file_size`, `mime_type`, `file_url` |
| `payment_transactions` | Transaksi pembayaran langganan | `invoice_number`, `teacher_id`, `customer_name/email/whatsapp/school`, `plan_id`, `tier`, `billing_cycle`, `base_amount`, `unique_code`, `total_amount`, `payment_channel`, `status` (pending/paid/rejected/expired) |
| `app_versions` | Manajemen versi APK (in-app update) | `platform`, `version_name`, `version_code`, `min_version_code`, `title`, `release_notes` (array), `apk_url`, `is_force`, `is_active` |

### 5.2 Keamanan (RLS) & Realtime

- **RLS diaktifkan** pada semua tabel. Aturan inti:
  - `profiles`: hanya pemilik (`auth.uid() = id`) yang bisa select/insert/update.
  - `exams` / `questions`: guru hanya bisa mengelola miliknya (`auth.uid() = teacher_id`);
    **publik boleh membaca** ujian yang `published`/`active` (dipakai siswa via Token).
  - `student_sessions`, `student_answers`, `violation_logs`, `grade_records`: **`for all using (true)`**
    (dipermudah agar siswa anonim & guru bisa baca/tulis lintas role).
  - `teacher_media`: guru mengelola miliknya, **publik boleh baca** (untuk render gambar soal).
  - `app_versions`: publik hanya baca versi `is_active = true`.
- **Realtime publication** `supabase_realtime` mencakup `student_sessions`, `violation_logs`,
  `student_answers`, dan `payment_transactions` → dipakai untuk live proctoring & sinkronisasi status bayar.
- **Trigger**: `handle_new_user()` membuat baris `profiles` otomatis saat user baru sign up.

### 5.3 Pola Penyimpanan Offline-First

Kedua aplikasi memakai **cache lokal** agar tetap berfungsi saat koneksi bermasalah:

- **Web**: `localStorage` — kunci seperti `ujianpintar_all_exams_{email}`,
  `ujianpintar_profile_{email}`, `ujianpintar_subscription_{email}`,
  `ujianpintar_teacher_media_{email}`, `ujianpintar_gemini_api_key`, `ujianpintar_ai_settings`.
- **Mobile**: `AsyncStorage` dengan prefix `@ujianpintar_` — kunci seperti `cbt_active_session_id`,
  `cbt_active_exam`, `cbt_active_questions`, `cbt_student_info`, `cbt_student_step`,
  `cbt_exam_end_time_{examId}_{nisn}`, `ans_sel_{examId}_{nisn}`, `ans_short_...`, `ans_doubt_...`,
  `cbt_final_grade`, `cbt_integrity_seal`, `cbt_sync_status`, `cbt_away_left_{examId}_{nisn}`.

---

## 6. Teori: Alur Kerja Inti

### 6.1 Alur Guru Membuat & Menjalankan Ujian (Web)

```
Login/Registrasi (email + password, opsional verifikasi WhatsApp OTP)
   → Portal Guru (/portal)
   → Tab "Bank Soal & Jadwal" (builder):
      1. Buat paket ujian baru (judul, mapel, kelas, durasi, jadwal, Token & PIN Pengawas)
      2. Tambah soal: manual (QuestionCard), import .xlsx/.csv/.txt, atau AI Generator
      3. Atur anti-cheat (deteksi tab, acak soal/opsi, fullscreen lock) + bobot poin
      4. Simpan → status 'published'
      5. Bagikan Token 6 digit ke siswa (dan PIN Pengawas ke pengawas)
   → Tab "Pengawasan Live" (proctoring): pantau siswa real-time
   → Tab "Rekap Nilai & Analisis" (analytics): lihat nilai, koreksi esai, ekspor CSV/Excel
```

### 6.2 Alur Siswa Mengerjakan (APK)

```
Buka APK "Ujian Pintar" → pilih mode SISWA
   → masukkan Token 6 digit + NISN + Nama + Kelas (validasi otomatis format nama/kelas)
   → Lobby "SESI UJIAN SIAP" (durasi, jumlah soal, identitas terverifikasi)
   → Konfirmasi Game Mode / mode jangan terganggu → "Mulai Mengerjakan"
   → Lembar ujian (per nomor, navigasi, ragu-ragu, grid soal, LaTeX)
       * layar terkunci (fullscreen), anti-screenshot, keep-awake, back-guard
       * countdown persisten (selamat dari crash/reload)
   → Selesai Ujian → submit:
       * auto-grade lokal instan (ScoringEngine), simpan jawaban & stempel SHA-256
       * sinkronkan ke Supabase (offline-first: jika gagal, simpan antrian & sync ulang)
   → Layar Hasil (nilai, status Lulus/Remedial/Menunggu Koreksi, stempel integritas)
```

### 6.3 Alur Pengawasan Live (Web + APK Pengawas)

- **Jalur data ganda** ke siswa:
  1. **Realtime broadcast / postgres_changes** (WebSocket) — cepat bila aktif.
  2. **Polling REST** (query `student_sessions` & `violation_logs`, ~5 detik) — **jaring pengaman utama**
     karena di environment `api.ujianpintar.online` Realtime sering `CLOSED`.
- Aksi pengawas: kirim peringatan, **reset sesi**, **+5/+10 menit** (add time), **submit paksa**,
  **kunci semua** — semuanya ditulis ke DB lalu disampaikan ke HP siswa (melalui heartbeat/RPC
  `student_heartbeat` atau polling).

### 6.4 Alur Penilaian & Kelulusan

1. Jawaban siswa dihitung oleh **ScoringEngine** (lokal di APK) dan direplikasi di web/Rust.
2. Tipe soal:
   - **Pilihan ganda / B-S**: benar jika `selected_option_id === correct_option_id` (atau label/teks sama).
   - **Isian singkat**: perbandingan teks di-normalisasi (lowercase, trim, `,`→`.`).
   - **Esai**: tidak dinilai otomatis; menunggu koreksi guru atau AI (status awal 0 poin).
3. `percentage = totalScore / maxScore * 100`.
4. Status:
   - `percentage >= KKM (75)` → **Lulus**
   - ada esai yang belum dikoreksi & belum lulus → **Menunggu Koreksi**
   - selainnya → **Remedial**
5. Hasil disimpan ke `grade_records`; siswa bisa cek di APK atau di web `cek-nilai`.

### 6.5 Alur Pembayaran Langganan

```
Guru checkout (DANA/QRIS) → transaksi dibuat di payment_transactions (status pending)
   → Bot Telegram admin menerima notifikasi + tombol [✅ Setujui] / [❌ Tolak]
   → Bot update status → 'paid' (via service role, realtime publish)
   → Browser guru menerima realtime → tier menjadi PRO langsung
   → WAHA mengirim invoice/konfirmasi WhatsApp ke guru
```

---

## 7. Teori: Mesin Penilaian & Integritas (Scoring Engine)

### 7.1 Tiga Implementasi yang Konsisten

Logika scoring & stempel integritas diimplementasikan **tiga kali** dengan hasil identik:

| Implementasi | Lokasi | Catatan |
|---|---|---|
| **Rust (kanonik)** | `crates/smartexam-core/src/scoring.rs`, `anti_cheat.rs` | ekspor WASM via `lib.rs` |
| **Web (TypeScript)** | `guru_hebat/src/wasm/rustEngine.ts` | `RustEngineBridge.gradeExam()` + `generateSubmissionSeal()` |
| **Mobile (TypeScript)** | `guru_hebat_2/src/services/scoringEngine.ts` | `ScoringEngine.gradeExam()` + `generateSubmissionSeal()` |

Fungsi WASM yang diekspor dari Rust: `grade_exam_wasm(questions_json, answers_json, kkm)`
dan `generate_integrity_seal(exam_id, nisn, answers_json, violations)`.

### 7.2 Aturan Skor

- **Max score** = jumlah `points` semua soal.
- **Pilihan ganda / Benar-Salah**: benar jika opsi terpilih sama dengan kunci (perbandingan id, dan
  di mobile juga label/teks sebagai toleransi pengacakan opsi).
- **Isian singkat**: normalisasi `trim().toLowerCase().replace(/,/g,'.')` lalu dibandingkan sama persis.
- **Esai**: selalu `0` poin pada auto-grade dan menandai `hasPendingEssays = true`.

### 7.3 Status Kelulusan

```
percentage = totalScore / maxScore * 100
if percentage >= KKM (default 75)      → "Lulus"
else if hasPendingEssays               → "Menunggu Koreksi"
else                                   → "Remedial"
```

### 7.4 Stempel Integritas (SHA-256 Seal)

Digunakan untuk memverifikasi bahwa payload jawaban tidak dimanipulasi.

```
raw = "EXAM:{examId}:NISN:{nisn}:VIOL:{violations}:DATA:{answersPayload}:KEY:UJIANPINTAR_SALT_2026"
seal = SHA256(raw) → hex string
```

- Web memakai `crypto.subtle.digest('SHA-256', ...)`.
- Mobile memakai `Crypto.digestStringAsync(SHA256)` dari `expo-crypto` (dengan fallback string acak
  bila gagal).
- Rust memakai crate `sha2`.

### 7.5 Peringkat / Rincian Hasil

Hasil akhir disajikan sebagai `StudentPublicExamSummary` yang memuat: skor total, skor per kategori
(objektif / isian / esai), persentase, status, jumlah pelanggaran tab, feedback esai, dll. — dipakai
untuk portal `cek-nilai` dan cetak **SKHU/lembar jawaban** (HTML/PDF via `expo-print` / KaTeX).

---

## 8. Teori: Sistem Anti-Cheat & Live Proctoring

### 8.1 Lapisan Anti-Cheat di APK (`useAntiCheat.ts`)

Saat ujian dimulai (jika `detectTabSwitch` aktif), APK mengaktifkan:

1. **`expo-screen-capture`** — blokir screenshot & screen recording.
2. **`expo-keep-awake`** — layar tidak pernah tidur/menjadi gelap.
3. **`AppState` listener** — deteksi pindah/menutup aplikasi:
   - Saat meninggalkan app: catat `leftAt` (ke AsyncStorage) & set `is_away = true` di DB.
   - Saat kembali: hitung durasi keluar, tambah `totalAwaySeconds`, getar, catat **violation**
     (`severity: warning` bila < 5 detik, `danger` bila >= 5 detik atau > 2 pelanggaran).
   - **Self-healing**: bila app dimatikan paksa saat keluar, timestamp tersimpan; saat dibuka
     kembali, pelanggaran tetap dihitung (tidak bisa "kabur" dari deteksi).
4. **Back-Handler guard** di `StudentExamSheet` — tombol back Android diblokir (muncul alert).
5. **Anti screenshot** & layar terkunci juga didukung `fullScreenLock`.

### 8.2 Deteksi di Web (Browser)

- `detectTabSwitch` untuk versi web; `fullScreenLock` untuk mengunci layar penuh.
- `shuffleQuestions` & `shuffleOptions` menghasilkan urutan soal/opsi berbeda per siswa.

### 8.3 Live Proctoring Dashboard (Web)

Di tab **Pengawasan Live** guru melihat:

- **KPI Header**: jumlah siswa online/offline, total pelanggaran, siswa berisiko.
- **Tabel Monitoring**: nama, kelas, NISN, progres soal, sisa waktu, status koneksi
  (`online`/`reconnecting`/`offline`), jumlah pelanggaran, status sesi.
- **ViolationFeed** (`role="log"` + `aria-live`): aliran log pelanggaran real-time.
- **Aksi per siswa** (StudentActionModal): kirim peringatan, reset sesi, submit paksa, +waktu.
- **Aksi global**: +5/+10 menit, kunci semua, buka/tutup akses ujian.

### 8.4 Sinkronisasi Web → APK (Command Bus)

- APK menjalankan **heartbeat** periodik ke RPC `student_heartbeat(p_exam_id, p_nisn, p_progress, p_last_command_id)`.
- RPC mengembalikan daftar **perintah terurut** (`FORCE_SUBMIT`, `LOCK_ALL`, `RESET_SESSION`,
  `WARNING`, `ADD_TIME`) dengan **net-state reduction** (mis. warning lalu reset → warning dibatalkan).
- APK menerapkan perintah secara idempotent (ada `lastCommandIdRef` & guard `submittedSessionsRef`)
  sehingga aksi guru tidak dijalankan dua kali.

---

## 9. Teori: Berlangganan, Lisensi Sekolah & Pembayaran

### 9.1 Paket Langganan (`subscriptionService.ts`)

| Paket | Tier | Harga | Fitur unggulan |
|---|---|---|---|
| **Guru Basic** | `free` | Gratis | 3 sesi/bulan (>10 siswa), maks 40 siswa/sesi, PG/B-S/isian, preview mobile, ekspor CSV |
| **Guru PRO** | `pro` | Rp 20.000/bln atau Rp 180.000/thn | Unlimited sesi & siswa, fullscreen lock, LaTeX, ekspor Excel, stempel SHA-256, prioritas grading |
| **Lisensi Sekolah** | `school` | Rp 1.500.000/tahun per NPSN | Semua guru 1 NPSN PRO, logo/kop sekolah, bank soal kolektif, analitik per tingkat, dukungan prioritas |

Status langganan dibaca dari `user_metadata`, tabel `profiles` (`subscription_tier`,
`subscription_expires_at`), dan fallback `localStorage`. Bila masa berlaku habis → otomatis
kembali ke `free`.

### 9.2 Pembayaran

- **Metode**: Transfer DANA `0821-9692-9193` a.n. Deni Indrayana, atau **QRIS DANA** (semua bank/ewallet).
- **Alur**: checkout → `payment_transactions` (status `pending`) → bot Telegram admin menyetujui/menolak
  → status `paid` (realtime) → tier aktif.
- Nomor unik transaksi & invoice memudahkan verifikasi manual oleh admin.

### 9.3 Lisensi Sekolah

- Dikelola di **Super Admin** (`SuperAdminDashboard`, tab "Sekolah").
- Sekolah punya `schoolCode`, `operatorPin`, `npsn`, `maxTeachers`, daftar `registeredTeachers`,
  dan `features` (customLogo, unlimitedStudents, aiGeneratorPriority, exportExcelReport, dsb).
- Guru melakukan **redeem kode sekolah** (`SchoolLicenseRedeemCard`) untuk bergabung; bila
  emailnya terdaftar → otomatis ber-status `school`/PRO.
- Ada data sekolah contoh (seed) di `schoolLicenseService.ts`.

### 9.4 Kuota Penggunaan Bulanan (Free)

- `getTeacherMonthlySessionUsage()` menghitung jumlah sesi ujian (>10 siswa) per bulan.
- Paket Basic dibatasi 3 sesi/bulan; PRO unlimited.

---

## 10. Tutorial: Menjalankan Proyek

### 10.1 Web (`guru_hebat`)

```bash
cd D:\AllDataVsCode\guru_hebat
npm install            # jika node_modules belum ada
npm run dev            # dev server Vite (default http://localhost:5173)
npm run build          # type-check (tsc -b) + build produksi (harus exit 0)
npm run preview -- --port 4173   # pratinjau build produksi → http://localhost:4173
npm run lint           # oxlint (harus 0 error)
npm run bot            # node vps-bot/telegram-payment-bot.js (opsional, butuh .env)
```

> **Catatan penting (Windows/PowerShell):** jangan pakai `&&`/`||`/`??`/`?.` — gunakan `;`.
> Periksa keberhasilan build lewat **exit code**, bukan stderr (ada noise `node.exe
> NativeCommandError` non-error di stderr).

### 10.2 Mobile (`guru_hebat_2`)

```bash
cd D:\AllDataVsCode\guru_hebat_2
npm install
npm start              # expo start (QR / dev server)
npm run android        # expo run:android (butuh Android SDK)
npm run web            # expo start --web
npx tsc --noEmit       # type-check
```

> Konfigurasi aplikasi ada di `app.json`: nama "Ujian Pintar", slug `guru_hebat_2`,
> android package `com.ujianpintar.student`, orientasi portrait, ikon & splash.
> Dokumentasi Expo yang digunakan versi **SDK 57** (lihat `AGENTS.md`).

### 10.3 Env yang Dibutuhkan

Salin `.env.example` → `.env`:

```
VITE_SUPABASE_URL=https://api.ujianpintar.online
VITE_SUPABASE_ANON_KEY=<anon-key>
# Opsional untuk Super Admin & WAHA:
# VITE_SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   (RAHASIA — jangan di-commit)
# VITE_WAHA_BASE_URL=https://api.ujianpintar.online/waha
# VITE_WAHA_API_KEY=...
# VITE_TELEGRAM_BOT_TOKEN=...
# VITE_TELEGRAM_CHAT_ID=...
```

> ⚠️ Jangan pernah commit `.env` (terdapat `VITE_SUPABASE_SERVICE_ROLE_KEY`).

---

## 11. Tutorial: Panduan Guru — Portal Web

### 11.1 Mendaftar & Masuk

1. Buka `https://ujianpintar.online` → klik **Masuk / Daftar**.
2. Registrasi: isi **email, password, nama lengkap, nama sekolah, mata pelajaran, WhatsApp, NPSN/NIP**
   (opsional verifikasi OTP WhatsApp). Profil sekolah akan dipakai untuk **kop surat & SKHU**.
3. Login dengan email + password → masuk ke **Portal Guru** (`/portal`).

### 11.2 Membuat Ujian Baru (Bank Soal & Jadwal)

1. Tab **"Bank Soal & Jadwal"** → **+ Buat Ujian**.
2. Isi: **Judul, Mata Pelajaran, Kelas, Durasi (menit), Jadwal (tanggal & jam)**.
   - **Token Siswa (6 digit)** — dibagikan ke siswa untuk masuk APK.
   - **PIN Pengawas (6 digit)** — untuk login mode pengawas di APK.
3. Simpan → paket muncul di **Daftar Bank Soal** dengan status, jumlah soal, total poin,
   tombol aksi (Edit, Duplikat, Hapus, Salin Token/PIN, Aktifkan untuk Pengawasan).

### 11.3 Menambah Soal (3 Cara)

**a) Manual (QuestionCard)**
- Klik **+ Tambah Soal** → pilih tipe: **Pilihan Ganda (PG)**, **Benar/Salah (BS)**, **Isian Singkat**,
  atau **Uraian/Esai**.
- Tulis teks soal; rumus matematika memakai **LaTeX/KaTeX** (kolom Rumus).
- Isi opsi (A–E) & kunci jawaban, serta **bobot poin** (default 10).
- Opsi lanjutan: lampirkan **URL gambar** (dari Koleksi Foto Soal), beri penjelasan kunci.

**b) Impor Massal (ImportModal)**
- Unduh template: **Excel (.xlsx)**, **CSV**, atau **Teks/Aiken (.txt)**.
- Kolom template Excel: `NO, TIPE_SOAL, PERTANYAAN, RUMUS_LATEX, OPSI_A..E, KUNCI_JAWABAN, BOBOT_POIN, URL_GAMBAR`.
  Tipe soal: `PG`, `BS`, `ISIAN` (dan `ESAI`).
- Format teks/Aiken: nomor soal, baris opsi `A. ...`, `ANSWER: <kunci>`, opsional `LATEX:`,
  `POINTS:`, `TYPE: BS|ISIAN`.
- Unggah file → sistem menampilkan jumlah berhasil + peringatan/error → konfirmasi tambahkan.

**c) AI Generator (AIGeneratorModal)**
- Atur API key AI di **Pengaturan** (Google Gemini / Groq / DeepSeek / Custom OpenAI), atau
  pakai setelan **Otak Chatbot Super Admin** (klik "Sinkronkan dari Chatbot").
- Masukkan: **mapel, kelas, topik, tingkat kesulitan** (easy/medium/hard/HOTS).
- Pilih **mode single** (jumlah & tipe) atau **mixed** (komposisi PG/BS/Isian/Esai) + poin per tipe.
- AI menghasilkan soal → review → tambahkan ke bank.

### 11.4 Mengatur Anti-Cheat & Publikasi

- Panel pengaturan ujian menyediakan toggle:
  - **Deteksi Pindah Tab**
  - **Acak Soal** / **Acak Opsi**
  - **Kunci Layar Penuh (Fullscreen Lock)** *(PRO)*
  - **PIN Pengawas**
- **Preview di HP** (MobilePreviewModal) — lihat bagaimana soal tampil di smartphone siswa.
- Saat siap → **Publikasikan** (status `published`). Untuk memulai sesi pengawasan, klik
  **"Aktifkan untuk Pengawasan"** dari daftar bank soal.

### 11.5 Pengawasan Live (Live Proctoring)

1. Tab **"Pengawasan Live"** → pilih ujian aktif.
2. Salin **Token** & **PIN Pengawas** → bagikan ke siswa/pengawas.
3. Dashboard menampilkan siswa yang masuk (real-time/polling):
   - **Status koneksi**: online / reconnecting / offline.
   - **Progres** (jumlah terjawab), **sisa waktu**, **jumlah pelanggaran**, **status sesi**.
4. **Klik siswa** → modal aksi:
   - Kirim **peringatan** (tampil sebagai modal di HP siswa).
   - **Reset sesi** (izinkan siswa masuk lagi / mulai ulang).
   - **+5 / +10 menit** (tambah waktu).
   - **Submit Paksa** (kumpulkan paksa → HP pindah ke hasil).
5. Aksi global: **+waktu serentak**, **Kunci Semua** (lock & submit semua).
6. **Violation Feed** menampilkan aliran log pelanggaran (pindah tab, keluar aplikasi, dsb.)
   dengan severity warning/danger/info.
7. Jika Realtime (WebSocket) tidak tersambung, muncul banner **"Mode cadangan aktif"** —
   data tetap diperbarui lewat polling ~5 detik.

### 11.6 Rekap Nilai & Analisis (Analytics)

- Tab **"Rekap Nilai & Analisis"**: tabel nilai (nama, NISN, kelas, skor, max, status, waktu,
  pelanggaran tab, tanggal). Filter: pencarian, kelas, tanggal, status (**Semua / Lulus KKM / Remedial**).
- **Detail jawaban siswa** (`StudentAnswerDetailModal`): rincian per butir — jawaban siswa,
  kunci, benar/salah, poin, status ragu.
- **Koreksi esai** (`EssayGradingModal`): buka soal uraian → lihat jawaban + kunci/rubrik →
  minta **skor AI** (Gemini/OpenAI) atau beri skor & umpan balik manual.
- **Ekspor**: CSV (semua) / **Excel .xlsx** (PRO) — rekap nilai siap input rapor.
- **Cetak lembar jawaban/SKHU**: lembar A4 dengan kop surat, KaTeX, dan nomor dokumen
  (tersedia juga dari portal siswa `cek-nilai`).

### 11.7 Koleksi Foto Soal (Media)

- Tab **"Koleksi Foto Soal"**: galeri gambar/diagram untuk dipakai di soal (`imageUrl`).
- Kuota: **3 foto** (free) / **20 foto** (PRO) — disimpan di database VPS.
- Unggah → otomatis dikompresi (Canvas, max 1200px, JPEG 0.82) → salin URL ke soal.

### 11.8 Pengaturan Sekolah (Settings)

- Profil guru: nama, NIP, WhatsApp, sekolah, NPSN, mapel; kustom **logo sekolah** (PRO/Sekolah).
- Setelan **AI** (Gemini key / custom OpenAI) — dipakai generator soal & penilai esai.
- Direktori sekolah (`SchoolDirectoryModal`) — cari NPSN/alamat.
- **Pembersihan data (retensi)**: hapus sesi/log lama sesuai kuota paket.

### 11.9 Paket & Pembayaran (Subscription)

- Lihat paket saat ini & masa berlaku di tab **"Paket & Info Aplikasi"**.
- **Upgrade PRO**: checkout DANA/QRIS → transaksi dibuat → konfirmasi via bot Telegram admin →
  aktif seketika (realtime).
- **Redeem kode Lisensi Sekolah** (`SchoolLicenseRedeemCard`) bila sekolah Anda berlangganan.
- Unduh **APK siswa** dari halaman ini (`DownloadApkModal`) untuk disebar ke siswa.

---

## 12. Tutorial: Panduan Siswa — Aplikasi Mobile

### 12.1 Persiapan

1. Pastikan HP Android terhubung internet, dan **mode "Jangan Ganggu" / Game Mode** aktif
   (disarankan, agar notifikasi tidak mengganggu ujian).
2. Unduh & pasang APK **Ujian Pintar** (nama tampilan "Ujian Pintar", versi 1.0.1).
   APK tersedia di website (tombol unduh) atau file `UjianPintar-*.apk` di folder proyek.
3. Buka aplikasi → halaman selamat datang → pilih **SISWA**.

### 12.2 Masuk Ujian (Quick Entry)

1. Masukkan **Token Ujian 6 digit** (dari guru) → sistem memuat paket ujian.
2. Isi data diri: **NIS/NISN, Nama Lengkap, Kelas**. Nama & kelas di-format otomatis
   (Title Case; "Kelas XI Ips 1" → "XI Ips 1").
3. Klik lanjut → layar **"SESI UJIAN SIAP"** menampilkan: judul, mapel, kelas, durasi,
   jumlah soal, dan identitas terverifikasi.

> **Gate kunci sesi:** bila Anda sudah pernah submit / sesi dikunci oleh guru, aplikasi
> menolak masuk ("Akses Terkunci") sampai guru **reset sesi** Anda.

### 12.3 Mengerjakan Ujian

1. Tap **"Mulai Mengerjakan Ujian"** → konfirmasi **Game Mode aktif** → ujian dimulai.
2. Lembar ujian menampilkan soal satu per satu:
   - **PG/B-S**: tap pilihan A–E / Benar-Salah.
   - **Isian**: ketik jawaban pada kolom.
   - **Esai**: tulis jawaban uraian.
   - Tombol **Ragu** untuk menandai soal yang belum yakin.
   - **Grid soal** (ikon kotak) untuk melompat antar nomor; soal terjawab diberi tanda.
   - Rumus matematika dirender dengan **KaTeX**.
3. **Timer** berjalan mundur (persisten — tetap bertahan meski aplikasi sempat tertutup).
   Waktu < 5 menit → indikator urgensi.
4. Selama ujian, anti-cheat aktif: layar dikunci, screenshot diblokir, tombol **back**
   Android ditolak, dan meninggalkan aplikasi akan tercatat sebagai **pelanggaran**.

### 12.4 Mengumpulkan & Melihat Hasil

1. Selesai semua → **Selesai Ujian** → konfirmasi.
2. Jawaban dihitung **langsung di HP** (ScoringEngine) → status **Lulus / Remedial /
   Menunggu Koreksi**.
3. Hasil & stempel integritas **SHA-256** ditampilkan; jika offline, jawaban diantrekan
   dan disinkronkan saat koneksi kembali (ada tombol **Coba Lagi Sinkron**).
4. Nilai juga bisa dicek di web **`/cek-nilai`** (masukkan NISN) dan dicetak sebagai
   **SKHU / lembar hasil**.

---

## 13. Tutorial: Panduan Pengawas — Aplikasi Mobile

### 13.1 Masuk Mode Pengawas

1. Buka APK → pilih **GURU / PENGAWAS**.
2. Masukkan **PIN Pengawas 6 digit** — bisa berupa:
   - **PIN per-ujian** (`anti_cheat.proctor_pin`), atau
   - **PIN master** (`123456`, `998877`, `654321`, `888888`) atau PIN supervisor dari profil guru.
3. Setelah cocok → aplikasi memuat **mode pengawas** untuk ujian terkait (atau ujian terbaru).

### 13.2 Proctoring (TeacherProctoringView)

- Tampilkan **tabel siswa live**: status, sisa waktu, progres, pelanggaran, koneksi.
- **LiveViolationTicker** — aliran pelanggaran secara berjalan.
- Klik siswa → **aksi** (TeacherStudentActionModal):
  - **Kirim pesan/peringatan** → muncul modal di HP siswa.
  - **Reset sesi** → siswa bisa masuk ulang.
  - **+5 / +10 menit**.
  - **Submit paksa** → HP siswa langsung pindah ke hasil.
- Aksi global: **+waktu serentak**, **kunci semua**.
- Buka **Rekap Nilai** (`TeacherGradeReportView`) untuk melihat hasil siswa.

### 13.3 Cara Kerja Aksi (agar paham kalau lambat)

Aksi guru ditulis ke database, lalu diambil siswa lewat **heartbeat** (RPC `student_heartbeat`)
atau **polling ~5 detik**. Jika Realtime WebSocket mati, respons tetap datang (maks ~5 detik)
selama internet aktif — ini normal di environment dengan Realtime nonaktif.

---

## 14. Tutorial: Super Admin

Akses melalui URL khusus `/super-admin` (atau `/admin`) → halaman login Super Admin.

### 14.1 Tab Sekolah (Lisensi)

- Daftar **lisensi sekolah**: nama, NPSN, kode sekolah, operator PIN, masa berlaku,
  jumlah guru, status aktif.
- Buat sekolah baru, **reset PIN operator**, lihat detail (guru terdaftar & fitur),
  aktifkan/nonaktifkan lisensi.

### 14.2 Tab Guru (Akun VPS)

- Gabungan data `auth.users` + `profiles` + `exams` + `payment_transactions` (via
  **service role**). Menampilkan: nama, email, provider (Google/email), sekolah/NPSN/NIP,
  mapel, WhatsApp, jumlah ujian, tier langganan, status afiliasi sekolah.
- Aksi: lihat detail & daftar ujian, **edit profil**, **tetapkan ke sekolah**,
  **ubah tier** (PRO), hapus akun.
- **Tes koneksi VPS** (latency) — tombol cek koneksi ke Supabase.

### 14.3 Tab Unduhan (Leads APK)

- Statistik **unduhan APK siswa** (lead: nama, WhatsApp, sekolah) — dipakai follow-up penjualan.
- Pencarian & hapus data lead.

### 14.4 Tab Otak Chatbot WA (AI Settings)

- Atur penyedia AI untuk **WhatsApp Bot**: Google Gemini / Groq / DeepSeek / Custom OpenAI.
- Setel **master switch auto-reply**, cooldown anti-spam, pesan sapaan, dan tombol **human handover**.
- Setelan ini bisa **disinkronkan ke portal guru** (AI generator soal & penilai esai).

---

## 15. Tutorial: Bot VPS (Telegram & WhatsApp AI)

Lokasi: `guru_hebat/vps-bot/` — dijalankan di VPS (Node.js ESM).

### 15.1 Telegram Payment Bot (`telegram-payment-bot.js`)

- **Tujuan**: menerima notifikasi transaksi langganan & menyetujui/menolak via Telegram.
- **Cara jalan**:
  1. Salin `.env.example` → `.env`, isi `TELEGRAM_BOT_TOKEN`, `ADMIN_CHAT_ID`,
     `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WAHA_BASE_URL`, `WAHA_API_KEY`.
  2. Jalankan: `npm install` lalu `node telegram-payment-bot.js` (atau `npm start`).
  3. Di VPS pakai **PM2**: `pm2 start telegram-payment-bot.js --name "payment-bot"`.
- **Alur**: guru checkout → bot terima notifikasi → tombol [✅ Setujui & Aktifkan] / [❌ Tolak]
  → update `payment_transactions` ke `paid` → browser guru langsung PRO (realtime) →
  WAHA kirim invoice WhatsApp.
- Bot mengambil transaksi **status `pending`** dari Supabase (subscribe realtime/query),
  menampilkan detail (nama, email, WhatsApp, sekolah, paket, nominal) di chat admin.

### 15.2 WhatsApp AI Bot (`whatsapp-ai-bot.js`)

- HTTP server yang mendengarkan **webhook WAHA** (WhatsApp HTTP API di VPS).
- **Tujuan**: membalas otomatis pertanyaan guru/pengunjung tentang UjianPintar (info platform,
  fitur anti-curang, paket harga, kontak admin) memakai AI (Gemini/Groq/DeepSeek) atau
  **fallback knowledge base**.
- Fitur: master switch auto-reply, **human handover** (kalau admin balas manual, bot jeda),
  **cooldown anti-spam**, API simulator & healthcheck, pengaturan dinamis dari
  `bot-settings.json` / `.env` / dashboard Super Admin.
- Jalankan: `node whatsapp-ai-bot.js` (atau `npm run ai-bot`).

### 15.3 Env Bot yang Diperlukan

| Variabel | Keterangan |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram (dari @BotFather) |
| `ADMIN_CHAT_ID` | ID chat Telegram admin |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Koneksi admin ke Supabase |
| `WAHA_BASE_URL` / `WAHA_API_KEY` | Endpoint & kunci WAHA |

---

## 16. Tutorial: Build & Deploy

### 16.1 Deploy Web (Vite)

```bash
cd D:\AllDataVsCode\guru_hebat
npm install
npm run build            # menghasilkan folder dist/ (tsc + vite)
# lalu unggah isi dist/ ke hosting (mis. VPS/nginx). Ada .htaccess di public/ untuk Apache.
```

- CI sudah disiapkan di `.github/workflows/ci.yml`: lint → tsc → vite build (Node 22),
  dengan env `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` dari GitHub Secrets.
- SEO sudah dilengkapi: sitemap.xml, robots.txt, OG tags, favicon multi-resolusi,
  webmanifest, Google site verification.

### 16.2 Build APK Mobile (Android)

**Opsi A — EAS Build (direkomendasikan):**
```bash
cd D:\AllDataVsCode\guru_hebat_2
npm install -g eas-cli        # sekali
eas login
eas build --platform android --profile production   # atau --profile preview
```
- Konfigurasi ada di `eas.json` (production/preview/development) & `app.json`
  (package `com.ujianpintar.student`, versionCode, icons, permissions INTERNET/ACCESS_NETWORK_STATE/WAKE_LOCK/VIBRATE).
- Hasil berupa `.aab` (Play Store) atau `.apk` (sideload).

**Opsi B — Build Lokal (Android SDK/Gradle):**
```bash
cd D:\AllDataVsCode\guru_hebat_2
npm install
npx expo prebuild --platform android   # siapkan folder android/
cd android && ./gradlew assembleRelease   # hasil di app/build/outputs/apk/release/
```
> ⚠️ Build lokal memerlukan akses ke repositori Maven/Google (download dependency);
> bila jaringan/proxy terbatas bisa gagal (lihat Troubleshooting).

### 16.3 Menyebarkan Update APK (In-App Update)

1. Naikkan `versionCode` di `app.json` dan `CURRENT_APP_VERSION` di
   `src/services/updateService.ts`.
2. Unggah APK baru ke VPS/Storage, lalu perbarui **`public/version.json`**
   (di web) dan/atau tabel **`app_versions`** di Supabase (platform=android, is_active=true).
3. Siswa yang membuka APK akan melihat modal **"Pembaruan Tersedia!"** (force update
   bila `is_force` / di bawah `min_version_code`).

### 16.4 Menyiapkan Supabase dari Nol

1. Buat proyek Supabase (atau self-host). Catat URL + anon key → isi `.env` web & mobile.
2. Jalankan `supabase/schema.sql` di SQL Editor (buat tabel, index, RLS, realtime, trigger).
3. Jalankan migrasi tambahan sesuai fitur:
   - `create_payment_transactions_table.sql` (pembayaran)
   - `create_teacher_media_table.sql` (koleksi foto)
   - `create_app_versions_table.sql` (in-app update)
   - `add_away_timer_to_student_sessions.sql` (telemetri keluar aplikasi)
4. Buat fungsi RPC **`student_heartbeat`** (command bus) — dipakai APK untuk menerima
   perintah pengawas (FORCE_SUBMIT, WARNING, ADD_TIME, RESET_SESSION, LOCK_ALL).

---

## 17. Troubleshooting & Catatan Teknis

### 17.1 Realtime WebSocket selalu CLOSED / 403

- **Gejala**: channel `student-alerts-*` / `exam-alerts-*` selalu `CLOSED`/`CHANNEL_ERROR`,
  banner "Mode cadangan aktif" muncul di dashboard.
- **Penyebab**: domain `api.ujianpintar.online` tidak meneruskan WebSocket
  `/realtime/v1/websocket` dengan benar, atau publikasi realtime belum aktif penuh.
- **Solusi (sudah diterapkan di kode)**: polling REST ~5 detik sebagai jaring pengaman;
  watchdog web memperlambat polling ke 20 s bila realtime kembali `live`.
- **Solusi permanen (server)**: aktifkan Realtime/publication di Supabase, pastikan
  proxy WebSocket di nginx/domain meneruskan endpoint realtime.

### 17.2 "Submit Paksa / Kirim Pesan tidak bereaksi" di HP siswa

- Penyebab inti (dari `CATATAN_SELESAI_KELOLA_SESI.md`):
  1. **APK tidak memuat kode terbaru** — pastikan build ulang APK dengan source terbaru
     (log Metro menampilkan `[Poll]` jika polling 5 detik aktif).
  2. Realtime mati → hanya polling yang bekerja (respons ≤ 5 detik bila APK baru).
  3. Bug lama (query warning salah, polling 20s, silent-fail service, tanpa idempotency)
     — **sudah diperbaiki** di source.
- **Cek**: pastikan `student_sessions.status` & `violation_logs` ter-update oleh web,
  dan APK benar-benar menjalankan bundle baru.

### 17.3 Build Web exit code 0 tapi ada noise di stderr

- Normal: `node.exe ... NativeCommandError` di stderr bukan kegagalan. Ukur keberhasilan
  lewat **exit code** (di PowerShell: `$LASTEXITCODE`).

### 17.4 Gradle build APK gagal download dependency

- Gejala: `react-android-0.86.2-debug.aar` tidak terunduh dari repositori.
- Solusi: pastikan akses ke `repo.maven.apache.org` / `dl.google.com` (periksa proxy/network),
  atau gunakan **EAS Build** (build di cloud).

### 17.5 Siswa berbagi NISN / tabrakan sesi

- Sudah ada proteksi: `checkStudentSessionAccess` memblokir NISN yang dipakai nama lain
  (`conflict`), dan web menduplikasi student per `session_id`/NISN+nama agar tidak hilang.
- Siswa yang sudah submit tidak bisa masuk kembali sampai **reset sesi** oleh guru.

### 17.6 Terjemahan/Pengaturan waktu

- Semua waktu memakai **WIB (Asia/Jakarta)** (fungsi `getWibDateString`).
- `schedule_time` diformat `HH:mm` (detik dihapus).

### 17.7 Kredensial & Keamanan (JANGAN dibagikan)

- Jangan commit `.env` (`VITE_SUPABASE_SERVICE_ROLE_KEY` rahasia).
- Kredensial preview dashboard bersifat internal — jangan simpan di kode.
- Stempel integritas memakai salt `UJIANPINTAR_SALT_2026` — rahasia implementasi.

---

## 18. Kesimpulan & Peta Belajar Lanjutan

### 18.1 Kesimpulan

**UjianPintar** adalah platform asesmen CBT yang **lengkap & siap produksi**, terdiri dari:

1. **Web Portal Guru** (`guru_hebat`) — React/Vite/Tailwind + Supabase: bank soal (manual/import/AI),
   live proctoring, rekap nilai & koreksi esai AI, media foto, langganan & pembayaran, dan super admin.
2. **APK Siswa & Pengawas** (`guru_hebat_2`) — Expo/React Native: quick entry via token,
   lembar ujian dengan anti-cheat multi-lapis, auto-grading instan, hasil & SKHU,
   plus mode pengawas dengan command bus.
3. **Mesin inti Rust/WASM** (`crates/smartexam-core`) — scoring & stempel SHA-256 yang
   konsisten dengan implementasi TypeScript di web dan mobile.
4. **Backend Supabase self-hosted** — auth, Postgres, RLS, Realtime, Storage, RPC heartbeat.
5. **Bot VPS** — otomasi pembayaran (Telegram) & layanan informasi (WhatsApp AI).

Kekuatan utamanya: **anti-curang berlapis**, **penilaian konsisten lintas platform**,
**offline-first resilience** (polling cadangan + cache lokal), dan **model bisnis** yang
jelas (Basic/PRO/Lisensi Sekolah).

### 18.2 Peta Belajar Lanjutan (untuk memperdalam)

| Topik | Mulai dari | Berlanjut ke |
|---|---|---|
| Memahami alur data | `AI_CONTEXT.md`, `CATATAN_SELESAI_KELOLA_SESI.md` | `src/App.tsx` (web & mobile) |
| Membuat soal & ujian | `QuestionBuilder`, `ExamBankList` | `src/services/examService.ts` |
| Anti-cheat | `guru_hebat_2/src/hooks/useAntiCheat.ts` | `StudentExamSheet.tsx`, `useExamHeartbeat.ts` |
| Live proctoring | `LiveProctoringDashboard.tsx` (web) | `TeacherProctoringView.tsx` (mobile), `useLiveProctoring.ts` |
| Mesin scoring | `crates/smartexam-core/src/scoring.rs` | `rustEngine.ts` & `scoringEngine.ts` (cocokkan logika) |
| Database & RLS | `supabase/schema.sql` | file migrasi SQL lainnya |
| Pembayaran | `PaymentCheckoutModal.tsx` | `telegram-payment-bot.js` |
| Build & rilis | `package.json` (web) & `app.json`/`eas.json` (mobile) | GitHub Actions `ci.yml` |
| Aksesibilitas & SEO | `LandingPage.tsx`, audit di `AI_CONTEXT.md` | komponen modal & form lainnya |

### 18.3 Latihan Praktis yang Disarankan

1. **Jalankan web** (`npm run dev`) → daftar akun → buat 1 ujian → impor template Excel.
2. **Jalankan APK** (Expo Go / build) → masuk mode siswa dengan Token → kerjakan → lihat hasil.
3. **Simulasikan live proctoring**: aktifkan ujian di web, kerjakan dari APK, kirim peringatan
   dan submit paksa dari web → amati respons di HP (≤ 5 detik via polling).
4. **Uji anti-cheat**: di tengah ujian, pindah ke aplikasi lain → lihat pelanggaran tercatat
   di dashboard web & feed pelanggaran.
5. **Koreksi esai AI**: buat soal esai, jawab dari APK, buka Rekap Nilai → minta skor AI.
6. **Bangun APK rilis** lewat EAS Build, unggah, dan perbarui `version.json`/`app_versions`
   → verifikasi modal "Pembaruan Tersedia!" di APK lama.

---

*Dokumen ini disusun dari hasil pembelajaran menyeluruh terhadap kedua repositori
(`guru_hebat` & `guru_hebat_2`). Untuk informasi teknis paling mutakhir, selalu cek
`AI_CONTEXT.md` dan `CATATAN_SELESAI_KELOLA_SESI.md` di masing-masing repositori.*




















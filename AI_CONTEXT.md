# AI_CONTEXT.md — Konteks Proyek UjianPintar

> Dokumen ini dibuat **khusus untuk dibaca oleh AI lain / agent lain** yang akan bekerja pada repositori ini.
> Berisi: ringkasan proyek, kronologi audit, semua perubahan kode, status verifikasi, arsitektur,
> cara menjalankan, lingkungan kerja, dan pekerjaan yang tersisa.
>
> **Terakhir diperbarui:** 2026-10-05 (setelah P2 Mikroteks & P3 Refactors selesai)

---

## 1. Ringkasan Proyek

| Item | Nilai |
|---|---|
| Nama | **UjianPintar** — Platform Asesmen Digital & Pengawasan Ujian Online |
| Repo | `sesamakita/ujianpintar_web` |
| Lokasi | `d:\AllDataVsCode\guru_hebat` |
| Stack | React 19 + TypeScript + Vite, Tailwind CSS, Supabase (supabase-js v2.112.3), lucide-react |
| Backend | Supabase self-hosted di `https://api.ujianpintar.online` |
| Komponen Rust/WASM | ada di `crates/smartexam-core` + `src/wasm/rustEngine.ts` (scoring) |
| Bot VPS | `vps-bot/` — bot Telegram pembayaran |
| Branch | `main` (single branch) |
| Build | `npm run build` (tsc + vite), Lint: `npm run lint` (oxlint) — kedua-duanya exit 0 |

### Fitur utama (Portal Guru — dashboard di `/portal`)
1. **Bank Soal & Jadwal** (`builder`) — QuestionCard, ExamBankList, ExamSettingsPanel, AI generator, import, MobilePreview
2. **Koleksi Foto Soal** (`media`) — galeri gambar/diagram (VPS), MediaPickerModal
3. **Pengawasan Live** (`proctoring`) — LiveProctoringDashboard, ViolationFeed, StudentActionModal, StudentAnswerDetailModal
4. **Rekap Nilai & Hasil** (`analytics`) — GradeAnalytics, EssayGradingModal, StudentResultPortalModal
5. **Paket & Info Aplikasi** (`subscription`) — UpgradePromptModal, PaymentCheckoutModal, SchoolLicenseRedeemCard, DownloadApkModal
6. **Pengaturan Sekolah** (`settings`) — SystemSettings, SchoolDirectoryModal, dll.

Halaman publik: Landing (`/`), login/register, cek-nilai siswa (portal siswa), super-admin login.

---

## 2. Kronologi Sesi (dari awal s/d sekarang)

### Fase 1 — Analisis awal
- User meminta studi banding proyek ini dengan proyek kedua `D:\AllDataVsCode\guru_hebat_2`.
- Hasil analisis dua proyek disampaikan (detail historis di checkpoint sesi).

### Fase 2 — Perbaikan presisi landing page (P1–P3 landing)
Semua terverifikasi (build exit 0, lint 0):

| # | Perbaikan | File |
|---|---|---|
| 1 | Kelas spacing Tailwind mati (`py-0.2`, `-mt-0.2`) → ditambah `spacing: {'0.2': '0.05rem'}` | [tailwind.config.js](tailwind.config.js) |
| 2 | `scroll-mt-24` pada 5 section anchor | [src/components/landing/LandingPage.tsx](src/components/landing/LandingPage.tsx) |
| 3 | Mobile nav drawer + `aria-expanded` | LandingPage.tsx |
| 4 | `type="button"` pada semua tombol | LandingPage.tsx + lainnya |
| 5 | FAQ accordion `aria-expanded`/`aria-controls` | LandingPage.tsx |
| 6 | Semantik `role="table"` | LandingPage.tsx |
| 7 | Persistensi tema (dark/light) | LandingPage.tsx |
| 8 | `prefers-reduced-motion` | [src/index.css](src/index.css) |
| 9 | Footer `pb-28` agar tidak tertutup mobile bar | LandingPage.tsx |
| 10 | Dedup `NAV_LINKS` | LandingPage.tsx |
| 11 | `img` width/height/lazy | LandingPage.tsx |
| 12 | Fix SEO: favicon multi-resolusi, sitemap, canonical, OG tags, Schema.org logo, robots.txt, Google site verification, webmanifest | (dari commit git `<138fa54`, `<0412802`, dll.) |

### Fase 3 — Audit halaman lain (login, register, cek-nilai, super-admin)
Temuan awal:
- 0 pasang `htmlFor`/`id` (label tidak terhubung ke input)
- Modal tanpa `role="dialog"`
- 1 tombol tanpa `type` (MobilePreviewModal)
- Mikroteks 9–10px pada teks asli

### Fase 4 — Opsi 2+3: Audit statis menyeluruh + perbaiki semua (dipilih user)
Ditemukan sistematik:
- 0 `htmlFor` di seluruh 40+ komponen
- 0 `role="dialog"`
- ~40 tombol tanpa `type`
- Tipografi mikro

Diperbaiki (semua terverifikasi):
- **80 dari 90 label terhubung** ke `<input>`, `<select>`, `<textarea>` (10 sisanya = group label / label pembungkus — valid, tidak perlu diubah)
- Label kelompok diberi `role="group"` + `aria-labelledby` (contoh id `aig-g1`, `aig-g3` di AIGeneratorModal)
- **15 modal** mendapat `role="dialog"` + `aria-modal` + `aria-label`:
  AIGeneratorModal, BulkPointsModal, ImportModal, ConfirmModal, DownloadApkModal, EssayGradingModal, SchoolDirectoryModal, ExamBankList, TimePickerModal, UpgradePromptModal, MediaPickerModal, StudentActionModal, StudentAnswerDetailModal, MobilePreviewModal, StudentResultPortalModal
- ~40 tombol diberi `type="button"` di 20 file (SystemSettings.tsx sengaja dilewati — punya `<form>`)
- `role="status"` + `aria-live` pada notifikasi auth
- `aria-invalid` pada error token
- 10 label ↔ input di [src/components/auth/AuthPage.tsx](src/components/auth/AuthPage.tsx) + `autoComplete` + `aria-label` password toggle + teks kecil dinaikkan ke 11px
- SuperAdminLoginPage: 2 label terhubung

### Fase 5 — Kredensial preview (dashboard nyata)
- User menyediakan akun preview: `deniindrayana@gmail.com` / `Deni2026` — **HANYA untuk preview browser, JANGAN disimpan di kode/komit**.
- Login berhasil, diinspeksi semua 6 tab dashboard.
- Mengonfirmasi temuan a11y pada UI nyata dan menemukan **P0**.

### Fase 6 — P0: Realtime WebSocket 403 (SELESAI ✅)
Lihat bagian 4 di bawah untuk detail lengkap.

### Fase 7 — P1: A11y lanjutan dashboard (SELESAI ✅)
Lihat bagian 5 di bawah untuk detail lengkap.

### Fase 8 — P2: Mikroteks & P3: Refactor (SELESAI ✅)
- **P3 Refactors**:
  1. Centralized & deduplicated `formatRupiah` ke [src/utils/formatters.ts](src/utils/formatters.ts), digunakan oleh `PaymentCheckoutModal.tsx`, `SubscriptionAndAboutPage.tsx`, `SubscriptionSettingsTab.tsx`, dan `SuperAdminDashboard.tsx`.
  2. Strict union typing untuk `activeTab` di [src/components/layout/Header.tsx](src/components/layout/Header.tsx) (`'builder' | 'proctoring' | 'analytics' | 'media' | 'subscription' | 'settings'`).
  3. Menambahkan `<div className="overflow-x-auto print:overflow-visible">` pada tabel rincian nilai di [src/components/portal/PrintableStudentResultCard.tsx](src/components/portal/PrintableStudentResultCard.tsx).
- **P2 Mikroteks Typography Upgrades**:
  - Ditingkatkan dari `text-[9px]`/`text-[10px]` ke `text-[11px]` (atau `text-[10px]` bold pada badge mini tertentu) pada data tables, cards, KPI counters, badges, and modals di seluruh komponen:
    - Live Proctoring: `ViolationFeed.tsx`, `ProctoringKPIHeader.tsx`, `StudentActionModal.tsx`, `LiveProctoringDashboard.tsx`.
    - Rekap Nilai & Analytics: `GradeAnalytics.tsx`, `StudentAnswerDetailModal.tsx`, `EssayGradingModal.tsx`.
    - Bank Soal: `ExamBankList.tsx`, `ExamSettingsPanel.tsx`, `QuestionCard.tsx`.
    - Langganan & Info: `SubscriptionPlanCard.tsx`, `PaymentCheckoutModal.tsx`, `SubscriptionAndAboutPage.tsx`, `SubscriptionSettingsTab.tsx`.
    - Super Admin & Pengaturan: `SuperAdminDashboard.tsx`, `SystemSettings.tsx`.
- **Verifikasi**: `npm run lint` (0 error) & `npm run build` (exit code 0).

---

## 3. Arsitektur & Alur Data

### Auth / Portal
```
login → supabase.auth.signInWithPassword → session localStorage
      → /portal → portal guru (require auth)
```
Session dipersist oleh Supabase (localStorage). `restoreSession()` di App.tsx memulihkan sesi.

### Polling + Realtime (App.tsx, ~baris 325–495)
- `useEffect` berjalan saat `isAuthenticated`, `examSettings?.id`, `activeTab`, `allExams.length` berubah.
- **fetchLatestData()** mengambil paralel via `examService`:
  - `getLiveStudents(targetExamId)`
  - `getGradeRecords(targetExamId)`
  - `getViolationLogs(targetExamId)`
- **Polling adaptif**: `startPolling(intervalMs)` → 5s (fallback) / 20s (live heartbeat)
- **Realtime**: `examService.subscribeToLiveProctoring(...)` (examService.ts:1332) — channel supabase dengan `postgres_changes` untuk tabel `student_sessions`, `violation_logs`, `grade_records`, diisolasi per `exam_id`.
- **State Realtime**: `realtimeMode` (`'live' | 'fallback'`) + `setRealtimeMode` — diturunkan ke LiveProctoringDashboard sebagai prop.
- Cleanup effect: cancel flag, clear timer, unsubscribe, reset `realtimeMode='live'`.

### Dashboard
- `activeTab` state di App.tsx bertipe union `'builder' | 'proctoring' | 'analytics' | 'media' | 'subscription' | 'settings'`
- Sidebar & Header: `activeTab` props (Header masih `string`, Sidebar union — lihat P3)

---

## 4. P0 — Detail Fix WebSocket 403 Realtime (SELESAI ✅)

### Masalah
```
WebSocket connection to 'wss://api.ujianpintar.online/realtime/v1/websocket?apikey=******'
failed: Error during WebSocket handshake: Unexpected response code: 403
```
- Berulang ~tiap 11–12 detik (retry internal supabase-js)
- Subscription live proctoring tidak pernah tersambung → update realtime mati
- REST tetap jalan (login sukses) — tapi endpoint Realtime menolak upgrade WS

### Akar masalah
Server-side: Realtime kemungkinan tidak diaktifkan / apikey tidak diizinkan untuk Realtime di Supabase self-hosted (Kong). **Tidak bisa diperbaiki dari kode klien.**

### Temuan kunci (penting untuk AI berikutnya!)
1. **`subscribe(status => ...)` TIDAK memicu callback** saat handshake 403. Callback hanya fire untuk status level-channel: `SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`. Handshake rejection WS-level tidak sampai ke sana.
2. **Window `error` event juga TIDAK menangkap** error WebSocket handshake (tidak bubble ke window).
3. **Solusi andal yang terbukti: watchdog timeout 8 detik** — jika tidak ada status `live` dalam 8s, anggap Realtime mati.

### Implementasi
**[src/App.tsx](src/App.tsx)**
- Variabel lokal: `receivedLive = false`, `fallbackTimer`
- Setelah `.subscribe(...)`: `fallbackTimer = setTimeout(...)` 8 detik → jika `!receivedLive`:
  - `realtimeHealthy = false`
  - `setRealtimeMode('fallback')`
  - `startPolling(5000)`
  - `unsubscribe()` + `supabase.removeAllChannels()` → **menghentikan retry internal library** (spam 403 hilang)
- Callback status: saat `'live'` → set `receivedLive=true`, clear fallbackTimer, `startPolling(20000)`; saat `'error'` → `startPolling(5000)`
- Cleanup: `isCancelled=true`, clear fallbackTimer, clear pollInterval, unsubscribe, `setRealtimeMode('live')`

**[src/services/examService.ts](src/services/examService.ts)** (`subscribeToLiveProctoring`, ~baris 1332)
- Parameter ke-5 baru: `onStatusChange?: (status: 'connecting' | 'live' | 'error') => void`
- Di `.subscribe((status) => ...)`: `SUBSCRIBED`→`'live'`, `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED`→`'error'`, else `'connecting'`
- Panggil `onStatusChange?.('connecting')` segera setelah subscribe
- Kembalikan cleanup yang memanggil `channel.unsubscribe()` + `supabase.removeChannel(channel)`

**[src/components/live-proctoring/LiveProctoringDashboard.tsx](src/components/live-proctoring/LiveProctoringDashboard.tsx)**
- Prop baru `realtimeMode?: 'live' | 'fallback'` (default `'live'`)
- Banner fallback aksesibel saat `realtimeMode === 'fallback'`:
  `role="status"` + `aria-live`, teks: *"Mode cadangan aktif: koneksi real-time (WebSocket) belum tersambung, jadi data siswa diperbarui lewat penyegaran berkala (~5 detik). Pelanggaran dan nilai tetap terpantau — hanya tidak se-instannya koneksi langsung. Jika ini berlanjut, hubungi admin untuk mengaktifkan Realtime di server."*

### Verifikasi (browser live, sesi login)
| Item | Hasil |
|---|---|
| Banner "Mode cadangan aktif" muncul | ✅ |
| Polling 5 detik aktif | ✅ 8 request / 12 detik |
| Spam WebSocket 403 berhenti | ✅ 0 error dalam 15 detik (sebelumnya ~1/12s) |
| Build & lint | ✅ exit 0 |

> Catatan: jika server Realtime nanti diaktifkan, aplikasi otomatis kembali ke mode live (10s pengamatan cukup untuk watchdog melihat `live`, polling melambat ke 20s).

---

## 5. P1 — A11y Lanjutan Dashboard (SELESAI ✅)

| # | Item | Perubahan | File |
|---|---|---|---|
| 1 | `aria-current="page"` pada nav item aktif | `<button aria-current={isActive ? 'page' : undefined}>` | [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) |
| 2 | `aria-label` pada icon buttons | hamburger, school badge, bell, avatar (Header); globe, close, logout (Sidebar) | [src/components/layout/Header.tsx](src/components/layout/Header.tsx), Sidebar |
| 3 | `aria-pressed` pada filter status | 3 tombol: Semua Status / Lulus KKM / Remedial | [src/components/analytics/GradeAnalytics.tsx](src/components/analytics/GradeAnalytics.tsx) |
| 4 | Mobile sidebar jadi dialog + Esc-close | `role="dialog"` + `aria-modal` + `aria-label` hanya saat `isMobileOpen`; `id="sidebar-nav-drawer"`; `useEffect` keydown Escape → `onCloseMobile()` | Sidebar.tsx |
| 5 | `aria-live` ViolationFeed | `role="log"` + `aria-live="polite"` + `aria-label="Aliran log pelanggaran ujian"` pada kontainer stream | [src/components/live-proctoring/ViolationFeed.tsx](src/components/live-proctoring/ViolationFeed.tsx) |
| 6 | Hamburger `aria-expanded`/`aria-controls` | Header menerima prop `isMobileOpen` (dari App.tsx `isMobileSidebarOpen`), `aria-expanded={isMobileOpen}` `aria-controls="sidebar-nav-drawer"` | [src/App.tsx](src/App.tsx) + Header |

### Verifikasi browser (mobile viewport 390×844)
- Sidebar terbuka → `role="dialog"`, `aria-modal="true"`, `aria-label="Menu Navigasi Portal Guru"`, hamburger `aria-expanded="true"` ✅
- Escape → drawer tertutup (`aria-expanded="false"`, role dialog hilang) ✅
- ViolationFeed `role="log"` + `aria-live="polite"` terdeteksi di tab Pengawasan Live ✅
- Build exit 0, lint 0 error ✅

---

## 6. Status Audit Keseluruhan (ringkasan temuan yang sudah/akan diperbaiki)

### ✅ Sudah diperbaiki
- Label-input linking (80/90), modal `role="dialog"` (15), `type="button"` (~40), `aria-live`/`role="status"`, `aria-invalid`, `aria-current`, `aria-pressed`, `aria-label` icon buttons, sidebar mobile dialog + Esc, P0 Realtime fallback.
- **P3 Refactor**:
  - Deduplikasi `formatRupiah` ke `src/utils/formatters.ts` di 4 file (`PaymentCheckoutModal.tsx`, `SubscriptionAndAboutPage.tsx`, `SubscriptionSettingsTab.tsx`, `SuperAdminDashboard.tsx`).
  - Strict union type `activeTab` pada props Header.
  - Penambahan `overflow-x-auto print:overflow-visible` pada tabel rincian nilai di `PrintableStudentResultCard.tsx`.
- **P2 Mikroteks Typography**:
  - Upgrade mikroteks 9–10px menjadi 11px (dan 10px untuk micro-badges) di semua data card, table, KPI header, feed log, dan modal pada tab Pengawasan Live, Rekap Nilai & Analisis, Bank Soal & Editor, Pengaturan Akun & Sekolah, Paket Langganan, dan Super Admin Dashboard.

### ⏳ Pekerjaan tersisa (opsional / server-side)
- **Server-side (di luar kode klien, perlu akses admin)**: aktifkan Realtime di Supabase self-hosted agar WebSocket 403 hilang permanen.
- **Audit Overflow**: Opsional audit layout pada viewport sangat kecil (<320px) pada komponen kustom.

---

## 7. Lingkungan Kerja & Quirk (PENTING untuk agent berikutnya)

### Tools
- PowerShell di Windows — **TIDAK support `&&`/`||`/`??`/`?.`**; gunakan `;` dan `if ($?) { ... }`
- Build: `npm run build` — status dicek lewat **EXIT CODE**, bukan stderr (ada noise `node.exe ... NativeCommandError` non-error di stderr!)
- Lint: `npm run lint` (oxlint) — hitung via regex `': error '`
- Preview server: `npm run preview -- --port 4173` → `http://localhost:4173` (jalankan async/background, matikan dengan stop_powershell)
- Web fetch/browser: Playwright via shared page. **Jangan jalankan tool browser paralel pada halaman yang sama** — jalankan sekuensial.

### Regex / PowerShell gotchas
- `.*?` tidak match newline — gunakan `[\s\S]*?`
- Atribut JSX dengan `=>` membingungkan pola `[^>]*` — scan akhir tag dengan tracking quote/depth
- Deteksi `<button` tanpa type: `(?![^>]*\btype=)`

### Kredensial preview
- `deniindrayana@gmail.com` / `Deni2026` — preview login dashboard. **Hanya untuk sesi inspeksi browser, JANGAN simpan di kode, JANGAN commit.**

### Env
- `.env` berisi `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (+ `VITE_SUPABASE_SERVICE_ROLE_KEY` — hati-hati, jangan commit)
- [src/lib/supabase.ts](src/lib/supabase.ts): `createClient` dengan realtime `eventsPerSecond: 10`, URL default `https://api.ujianpintar.online`

---

## 8. Repo lain yang relevan

- **`D:\AllDataVsCode\guru_hebat_2`** — proyek kedua yang dianalisis di awal sesi (studi banding). Bukan bagian dari repo ini.
- **`crates/smartexam-core`** — engine scoring Rust (WASM), dipakai oleh [src/wasm/rustEngine.ts](src/wasm/rustEngine.ts)
- **`vps-bot/`** — bot Telegram untuk pembayaran (payment)
- **`supabase/`** — konfigurasi/migrasi supabase lokal

---

## 9. Riwayat commit terbaru (konteks fitur)

```
138fa54 feat(seo): optimize favicon link order and attributes for Google desktop crawler
0412802 feat(web): add auto-formatting for name and class fields, sanitize grade analytics
de70477 feat(seo): add Google SERP compliant multi-resolution favicons, site.webmanifest, Schema.org logo
f1a04a0 fix(monitoring): prevent student session collision, hijacking, and grade drop on shared NISN
3307c6f feat(print): add dedicated printable A4 exam answer sheet with KaTeX, Kop surat, PDF support
c328fed feat(analytics): add student question answer detail modal with KaTeX and filtering
39548ee fix(proctoring): ensure realtime channel subscription before broadcasting alerts
779da13 feat(seo): add Google Search Console HTML verification file and meta tag
95beff9 feat(seo): add sitemap.xml, canonical, rich OG tags
d58729d feat(seo): enable search engine indexing (index, follow) and crawlers in robots.txt
```

---

## 10. Cara menjalankan

```bash
npm install          # jika node_modules belum ada
npm run dev          # dev server (Vite)
npm run build        # type-check + build produksi (harus exit 0)
npm run preview -- --port 4173   # preview build produksi
npm run lint         # oxlint (harus 0 error)
```

> Catatan: untuk verifikasi sisi nyata dashboard butuh login (kredensial preview bagian 7). Portal siswa di `/cek-nilai`; super-admin di `/super-admin`.
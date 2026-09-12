# Panduan Menjalankan Bot Telegram Pembayaran di VPS

Bot ini berfungsi untuk:
1. Menerima notifikasi seketika di Telegram saat guru checkout langganan di UjianPintar.
2. Menyediakan tombol **[✅ Setujui & Aktifkan]** dan **[❌ Tolak]** langsung di Telegram.
3. Mengupdate status di database Supabase menjadi `paid` sehingga browser guru yang sedang membuka modal checkout langsung aktif menjadi **PRO** seketika secara realtime!
4. Mengirimkan pesan konfirmasi/invoice WhatsApp otomatis ke nomor guru melalui **WAHA** yang sudah berjalan di VPS (`http://103.150.226.233:3000`).

---

## 1. Persiapan di Supabase SQL Editor
Jalankan file SQL `supabase/create_payment_transactions_table.sql` di SQL Editor Supabase Anda:
- Membuka tabel `payment_transactions`
- Mengaktifkan Supabase Realtime agar pembaruan status dapat terdeteksi langsung oleh browser guru tanpa reload halaman.

---

## 2. Cara Menjalankan di VPS

### Opsi A: Menggunakan PM2 (Sangat Direkomendasikan)
1. Upload folder `vps-bot` ke VPS Anda (misal di `/var/www/vps-bot` atau `~/vps-bot`).
2. Masuk ke folder tersebut di terminal SSH:
   ```bash
   cd ~/vps-bot
   npm install
   ```
3. Jalankan bot di latar belakang menggunakan PM2:
   ```bash
   pm2 start telegram-payment-bot.js --name "payment-bot"
   pm2 save
   ```
4. Untuk melihat log aktivitas bot secara langsung:
   ```bash
   pm2 logs payment-bot
   ```

### Opsi B: Menguji Coba Langsung di Komputer Lokal
Anda juga dapat langsung mengetes bot ini di komputer lokal sebelum ditaruh di VPS:
```powershell
cd d:\AllDataVsCode\guru_hebat\vps-bot
npm install
node telegram-payment-bot.js
```

---

## 3. Konfigurasi Bot Token & Chat ID
- Nomor DANA: `0821-9692-9193` (a.n. Deni Indrayana)
- Nomor WhatsApp Hotline: `0821-9692-9193`
- Default Bot Token: `8985971390:AAEaHQtLFM08EVh5MIAMKlbfPrGIdgraku0`
- Default Admin Chat ID: `8971674377`

*Catatan: Jika Anda membuat bot Telegram baru di @BotFather, Anda cukup mengganti token & chat ID di file `telegram-payment-bot.js` dan di `src/services/subscriptionService.ts` (`DANA_CONFIG`).*

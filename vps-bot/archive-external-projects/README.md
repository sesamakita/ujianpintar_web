# Arsip Projek Eksternal: DEKATI (Rekomendasi RT)

File `dekati-rt-service.js` ini adalah modul terpisah untuk sistem persuratan warga RT (DEKATI).
File ini dipisahkan dari bot WhatsApp utama UjianPintar (`whatsapp-ai-bot.js`) agar kedua sistem tidak saling tumpang tindih dan UjianPintar dapat berjalan mandiri 100%.

Jika di kemudian hari sistem DEKATI ingin diaktifkan di VPS, jalankan secara terpisah (misalnya menggunakan sesi WAHA yang berbeda atau bot daemon PM2 terpisah: `pm2 start dekati-bot.js --name "dekati-bot"`).

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      const val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://api.ujianpintar.online';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'Mobile Apk UjianPintar';

const sourceApkPath = 'D:\\AllDataVsCode\\guru_hebat_2\\UjianPintar-v1.0-Android.apk';

async function main() {
  console.log('🚀 Memulai proses unggah APK rilis v1.0.1 ke VPS Storage...');
  
  if (!fs.existsSync(sourceApkPath)) {
    console.error('❌ Berkas APK lokal tidak ditemukan:', sourceApkPath);
    process.exit(1);
  }

  const fileStats = fs.statSync(sourceApkPath);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`📦 Berkas lokal: ${path.basename(sourceApkPath)} (${fileSizeMB} MB / ${fileStats.size} bytes)`);

  const fileBuffer = fs.readFileSync(sourceApkPath);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Unggah sebagai UjianPintar-v1.0-Android.apk (Menimpa file lama di landing page)
  console.log(`\n⏳ Mengunggah ke bucket "${BUCKET_NAME}" sebagai "UjianPintar-v1.0-Android.apk"...`);
  const uploadResult1 = await supabase.storage
    .from(BUCKET_NAME)
    .upload('UjianPintar-v1.0-Android.apk', fileBuffer, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true,
    });

  if (uploadResult1.error) {
    console.error('❌ Gagal mengunggah UjianPintar-v1.0-Android.apk:', uploadResult1.error);
    process.exit(1);
  }
  console.log('✅ Berhasil mengunggah UjianPintar-v1.0-Android.apk!', uploadResult1.data);

  // 2. Unggah juga sebagai UjianPintar-Siswa-Release-v1.0.1-arm64.apk untuk tautan eksplisit
  console.log(`\n⏳ Mengunggah ke bucket "${BUCKET_NAME}" sebagai "UjianPintar-Siswa-Release-v1.0.1-arm64.apk"...`);
  const uploadResult2 = await supabase.storage
    .from(BUCKET_NAME)
    .upload('UjianPintar-Siswa-Release-v1.0.1-arm64.apk', fileBuffer, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true,
    });

  if (uploadResult2.error) {
    console.warn('⚠️ Catatan upload file kedua:', uploadResult2.error.message);
  } else {
    console.log('✅ Berhasil mengunggah UjianPintar-Siswa-Release-v1.0.1-arm64.apk!', uploadResult2.data);
  }

  // 3. Verifikasi daftar berkas di bucket
  console.log('\n🔍 Memverifikasi berkas di storage bucket...');
  const { data: fileList, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list();

  if (listError) {
    console.error('❌ Gagal memeriksa list berkas:', listError);
  } else {
    console.log('📋 Berkas aktif di bucket:', BUCKET_NAME);
    fileList.forEach(file => {
      const sizeMB = file.metadata?.size ? (file.metadata.size / (1024 * 1024)).toFixed(2) + ' MB' : '-';
      console.log(` - ${file.name} | Ukuran: ${sizeMB} (${file.metadata?.size || 0} B) | Diperbarui: ${file.updated_at || file.metadata?.lastModified}`);
    });
  }

  console.log('\n🎉 Selesai! Berkas APK terbaru v1.0.1 telah terpasang di VPS Storage.');
}

main().catch(err => {
  console.error('❌ Terjadi kesalahan:', err);
  process.exit(1);
});

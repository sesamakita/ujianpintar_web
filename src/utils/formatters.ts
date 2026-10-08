/**
 * Utilitas pemformat teks otomatis untuk input data Siswa dan Guru Pengawas.
 * Menjamin keseragaman format data baik saat mengetik (real-time) maupun saat disimpan ke database.
 */

const ROMAN_NUMERALS = new Set([
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'
]);

/**
 * Mengubah nama (siswa atau guru) agar huruf awal setiap kata selalu kapital (Title Case),
 * baik diketik huruf kecil semua ("budi santoso") maupun huruf kapital semua ("BUDI SANTOSO").
 * 
 * Mendukung format gelar (misal: "Bpk. Rahmat, S.Pd."), nama dengan tanda hubung ("Al-Faruq"),
 * dan mempertahankan spasi di akhir agar tidak mengganggu pengetikan kata selanjutnya.
 */
export function formatPersonName(raw: string): string {
  if (!raw) return '';

  return raw
    .toLowerCase()
    .replace(/(?:^|[\s\-\.,/'])([a-z\u00C0-\u024F])/g, (match) => match.toUpperCase());
}

/**
 * Membersihkan kata "Kelas" pada kolom kelas/rombel dan memformat
 * angka romawi (XI, XII, X, dll.) menjadi kapital, serta kata berikutnya berawalan kapital.
 * 
 * @param raw Teks input kelas
 * @param isTyping True saat dipanggil di event onChange (saat mengetik real-time)
 * 
 * Contoh:
 * - "Kelas XI Ips 1" -> "XI Ips 1"
 * - "kelas xi ips 1" -> "XI Ips 1"
 * - "KELAS 10 IPA 2" -> "10 Ipa 2"
 * - "kelas x-1" -> "X-1"
 * - "Kelas 7B" -> "7B"
 */
export function formatClassName(raw: string, isTyping = false): string {
  if (!raw) return '';

  let text = raw;

  if (isTyping) {
    // Jika ada kata "kelas" diikuti spasi/simbol DAN ada karakter setelahnya (misal "Kelas X" atau paste "Kelas XI Ips 1"),
    // langsung bersihkan awalan kata "Kelas" tersebut.
    if (/^\s*kelas\s*[:\-\.]?\s+\S+/i.test(text)) {
      text = text.replace(/^\s*kelas\s*[:\-\.]?\s*/i, '');
    }
  } else {
    // Saat blur atau submit: bersihkan kata "kelas" di mana saja atau di awal
    text = text.replace(/\bkelas\b\s*[:\-\.]?\s*/gi, '').trim();
  }

  if (!text) return '';

  // Format token kata:
  // - Angka romawi (i, ii, iii, iv, v, vi, vii, viii, ix, x, xi, xii) -> UPPERCASE (misal: "xi" -> "XI")
  // - Pola angka diikuti huruf (misal: "7b" -> "7B", "10a" -> "10A")
  // - Angka murni -> biarkan
  // - Kata umum lainnya -> Huruf awal kapital, sisanya huruf kecil (misal: "ips" -> "Ips", "mipa" -> "Mipa")
  return text.replace(/([a-zA-Z0-9]+)/g, (word) => {
    const lower = word.toLowerCase();
    if (ROMAN_NUMERALS.has(lower)) {
      return lower.toUpperCase();
    }
    const digitLetterMatch = word.match(/^(\d+)([a-zA-Z]+)$/);
    if (digitLetterMatch) {
      return digitLetterMatch[1] + digitLetterMatch[2].toUpperCase();
    }
    if (/^\d+$/.test(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Memformat angka nominal mata uang Rupiah (IDR) standar Indonesia tanpa desimal.
 * Contoh: 50000 -> "Rp 50.000"
 */
export function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
}

/**
 * Memeriksa apakah suatu log pelanggaran merupakan kejadian siswa keluar/meninggalkan aplikasi ujian.
 * Mengembalikan false untuk seluruh aksi pengawas (kirim peringatan, reset sesi, submit paksa, tambah waktu)
 * sehingga pesan peringatan tidak terhitung sebagai pelanggaran keluar siswa.
 */
export function isAppExitViolation(log?: { message?: string; severity?: string } | null): boolean {
  if (!log || !log.message) return false;
  const msg = log.message.toLowerCase().trim();

  // 1. Abaikan seluruh pesan / tindakan pengawas dan audit sistem
  if (
    msg.startsWith('peringatan pengawas') ||
    msg.startsWith('peringatan dikirim') ||
    msg.includes('pesan peringatan') ||
    msg.includes('direset oleh') ||
    msg.includes('disubmit paksa') ||
    msg.includes('menambahkan waktu') ||
    msg.includes('telah dikunci') ||
    msg.includes('sesi ujian direset')
  ) {
    return false;
  }

  // 2. Deteksi kejadian siswa keluar dari aplikasi
  if (
    msg.includes('keluar') ||
    msg.includes('tertutup') ||
    msg.includes('meninggalkan aplikasi') ||
    msg.includes('beralih') ||
    msg.includes('layar split') ||
    msg.includes('floating')
  ) {
    return true;
  }

  // 3. Fallback jika log bertipe danger dan bukan submit paksa
  return log.severity === 'danger' && !msg.includes('submit paksa');
}


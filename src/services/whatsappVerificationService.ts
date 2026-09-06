/**
 * WhatsApp Verification Service
 * Mendukung kombinasi:
 * - Level 1: Normalisasi otomatis format HP Indonesia (08... -> 628...), cek operator, dan panjang digit (10-15 digit).
 * - Level 2: Verifikasi apakah nomor terdaftar & aktif di WhatsApp via WAHA (WhatsApp HTTP API) di VPS Anda.
 * - Fail-Safe: Jika server WAHA sedang offline/sesi belum scan QR, sistem otomatis meloloskan nomor yang valid secara format
 *   sehingga siswa tidak pernah terhalang mengunduh aplikasi ujian.
 */

export interface PhoneValidationResult {
  isValidFormat: boolean;
  formattedPhone: string;
  displayPhone: string;
  operator?: string;
  errorMessage?: string;
}

export type WhatsAppCheckStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export interface WhatsAppVerificationResponse {
  status: WhatsAppCheckStatus;
  message: string;
  formattedPhone: string;
  isRegisteredOnWA: boolean;
  checkedViaWAHA: boolean;
}

// Konfigurasi endpoint WAHA di VPS
// Bisa dikustomisasi melalui .env VITE_WAHA_BASE_URL (misal: https://api.ujianpintar.online/waha atau http://103.150.226.233:3000)
const WAHA_BASE_URL = (import.meta.env.VITE_WAHA_BASE_URL || '').replace(/\/$/, '');
const WAHA_API_KEY = import.meta.env.VITE_WAHA_API_KEY || '';

class WhatsAppVerificationService {
  /**
   * LEVEL 1: Validasi Format & Deteksi Operator Seluler Indonesia
   */
  formatAndValidatePhone(rawInput: string): PhoneValidationResult {
    if (!rawInput) {
      return {
        isValidFormat: false,
        formattedPhone: '',
        displayPhone: '',
        errorMessage: 'Nomor WhatsApp wajib diisi',
      };
    }

    // Hilangkan semua karakter non-angka kecuali tanda '+' di depan
    let cleaned = rawInput.trim().replace(/[^0-9+]/g, '');

    // Standarisasi awalan nomor:
    // Contoh: "+62812" -> "62812", "0812" -> "62812", "812" -> "62812"
    if (cleaned.startsWith('+62')) {
      cleaned = cleaned.substring(1); // jadi "62..."
    } else if (cleaned.startsWith('08')) {
      cleaned = '62' + cleaned.substring(1); // jadi "628..."
    } else if (cleaned.startsWith('8') && cleaned.length >= 9) {
      cleaned = '62' + cleaned; // jadi "628..."
    }

    // Pastikan nomor diawali '628'
    if (!cleaned.startsWith('628')) {
      return {
        isValidFormat: false,
        formattedPhone: cleaned,
        displayPhone: rawInput,
        errorMessage: 'Gunakan nomor seluler Indonesia yang valid (contoh: 0812...)',
      };
    }

    // Cek panjang digit nomor seluler Indonesia standar (antara 10 s.d. 14 digit)
    // Awalan '62' (2 digit) + 8-12 digit = 10 s.d. 14 digit
    if (cleaned.length < 11 || cleaned.length > 15) {
      return {
        isValidFormat: false,
        formattedPhone: cleaned,
        displayPhone: rawInput,
        errorMessage: cleaned.length < 11 ? 'Nomor terlalu pendek (minimal 10 digit)' : 'Nomor terlalu panjang',
      };
    }

    // Deteksi Operator Seluler Indonesia
    let operator = 'Operator Indonesia';
    const prefix4 = cleaned.substring(0, 5); // 628xx
    if (['62811', '62812', '62813', '62821', '62822', '62823', '62851', '62852', '62853'].includes(prefix4)) {
      operator = 'Telkomsel';
    } else if (['62814', '62815', '62816', '62855', '62856', '62857', '62858'].includes(prefix4)) {
      operator = 'Indosat Ooredoo';
    } else if (['62817', '62818', '62819', '62859', '62877', '62878'].includes(prefix4)) {
      operator = 'XL Axiata';
    } else if (['62831', '62832', '62833', '62838'].includes(prefix4)) {
      operator = 'Axis';
    } else if (['62895', '62896', '62897', '62898', '62899'].includes(prefix4)) {
      operator = 'Tri (3)';
    } else if (['62881', '62882', '62883', '62884', '62885', '62886', '62887', '62888', '62889'].includes(prefix4)) {
      operator = 'Smartfren';
    }

    return {
      isValidFormat: true,
      formattedPhone: cleaned,
      displayPhone: cleaned,
      operator,
    };
  }

  /**
   * LEVEL 2: Verifikasi Akun WhatsApp Aktif via WAHA (WhatsApp HTTP API VPS)
   * Dengan Fail-Safe: Jika endpoint WAHA belum dikonfigurasi atau tidak dapat dijangkau,
   * otomatis fallback ke Level 1 agar proses unduh siswa tidak terhambat.
   */
  async verifyNumber(rawPhone: string): Promise<WhatsAppVerificationResponse> {
    // 1. Eksekusi Level 1 terlebih dahulu
    const formatCheck = this.formatAndValidatePhone(rawPhone);
    if (!formatCheck.isValidFormat) {
      return {
        status: 'invalid',
        message: formatCheck.errorMessage || 'Nomor WhatsApp tidak valid',
        formattedPhone: formatCheck.formattedPhone,
        isRegisteredOnWA: false,
        checkedViaWAHA: false,
      };
    }

    // 2. Jika endpoint WAHA belum dikonfigurasi, loloskan langsung berdasarkan Level 1
    if (!WAHA_BASE_URL) {
      return {
        status: 'valid',
        message: `✓ Format nomor ${formatCheck.operator || 'seluler'} valid`,
        formattedPhone: formatCheck.formattedPhone,
        isRegisteredOnWA: true,
        checkedViaWAHA: false,
      };
    }

    // 3. Eksekusi Level 2: Hubungi WAHA di VPS
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500); // Batas tunggu maksimal 4.5 detik

      // Format endpoint WAHA untuk cek kontak terdaftar:
      // Standar: GET /api/contacts/check-exists?phone=628xxxxxx&session=default
      // Alternatif: GET /api/default/contacts/check-exists?phone=628xxxxxx
      let checkUrl = `${WAHA_BASE_URL}/api/contacts/check-exists?phone=${formatCheck.formattedPhone}&session=default`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (WAHA_API_KEY) {
        headers['X-Api-Key'] = WAHA_API_KEY;
      }

      let response = await fetch(checkUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      // Jika endpoint pertama 404, coba format rute alternatif
      if (response.status === 404) {
        checkUrl = `${WAHA_BASE_URL}/api/default/contacts/check-exists?phone=${formatCheck.formattedPhone}`;
        response = await fetch(checkUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Standar respons WAHA: { numberExists: true/false } atau { exists: true/false }
        const exists = data.numberExists !== undefined
          ? Boolean(data.numberExists)
          : data.exists !== undefined
          ? Boolean(data.exists)
          : data.status === 'valid';

        if (exists) {
          return {
            status: 'valid',
            message: `✓ Nomor terverifikasi aktif di WhatsApp (${formatCheck.operator})`,
            formattedPhone: formatCheck.formattedPhone,
            isRegisteredOnWA: true,
            checkedViaWAHA: true,
          };
        } else {
          return {
            status: 'invalid',
            message: 'Nomor tidak terdaftar di server WhatsApp. Pastikan nomor sudah aktif.',
            formattedPhone: formatCheck.formattedPhone,
            isRegisteredOnWA: false,
            checkedViaWAHA: true,
          };
        }
      }

      // Jika response non-200 (misal session WAHA belum distart), gunakan fallback Level 1
      console.warn('WAHA response non-200, mengaktifkan fail-safe fallback Level 1');
      return {
        status: 'valid',
        message: `✓ Format nomor ${formatCheck.operator} valid`,
        formattedPhone: formatCheck.formattedPhone,
        isRegisteredOnWA: true,
        checkedViaWAHA: false,
      };
    } catch (err) {
      // Fail-Safe: Jangan pernah memblokir siswa jika jaringan ke WAHA timeout/gagal
      console.warn('Gagal menghubungi WAHA VPS (fail-safe aktif):', err);
      return {
        status: 'valid',
        message: `✓ Format nomor ${formatCheck.operator} valid`,
        formattedPhone: formatCheck.formattedPhone,
        isRegisteredOnWA: true,
        checkedViaWAHA: false,
      };
    }
  }
}

export const whatsappVerificationService = new WhatsAppVerificationService();

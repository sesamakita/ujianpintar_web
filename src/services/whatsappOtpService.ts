import { botSettingsService } from './botSettingsService';

export interface OtpRecord {
  email: string;
  phone: string;
  name: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export interface SendOtpResult {
  success: boolean;
  message: string;
  error?: string;
  maskedPhone?: string;
  cleanPhone?: string;
  expiresInSeconds?: number;
  devCode?: string; // Untuk mempermudah pengujian jika WAHA offline
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  error?: string;
  remainingAttempts?: number;
}

const OTP_STORAGE_PREFIX = 'ujianpintar_otp_session_';
const RESEND_COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

class WhatsAppOtpService {
  /**
   * Sensor nomor telepon untuk tampilan UI yang aman (contoh: 0821-••••-9193)
   */
  maskPhoneNumber(phone: string): string {
    const clean = phone.replace(/[^0-9]/g, '');
    if (!clean) return 'Nomor tidak diketahui';

    // Standardisasi awalan lokal
    let local = clean;
    if (local.startsWith('62')) {
      local = '0' + local.slice(2);
    }

    if (local.length < 8) return local;

    const start = local.slice(0, 4); // 0821
    const end = local.slice(-4);     // 9193
    return `${start}-••••-${end}`;
  }

  /**
   * Standardisasi nomor ke format internasional WhatsApp (628xxxxxxxx)
   */
  formatToWhatsAppNumber(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '628' + clean.slice(1);
    }
    return clean;
  }

  /**
   * Mengambil konfigurasi aktif WAHA
   */
  private getWahaConfig(): { baseUrl: string; apiKey: string } {
    let baseUrl = import.meta.env.VITE_WAHA_BASE_URL || '';
    let apiKey = import.meta.env.VITE_WAHA_API_KEY || '';

    try {
      const botSettings = botSettingsService.getSettings();
      if (botSettings.wahaBaseUrl) baseUrl = botSettings.wahaBaseUrl;
      if (botSettings.wahaApiKey) apiKey = botSettings.wahaApiKey;
    } catch {}

    if (!baseUrl) baseUrl = 'https://api.ujianpintar.online/waha';
    if (!apiKey) apiKey = 'WahaUjianPintar2026';

    return {
      baseUrl: baseUrl.replace(/\/+$/, ''),
      apiKey: apiKey.trim(),
    };
  }

  /**
   * Generate token unik 6-digit & kirim via WAHA ke nomor WhatsApp akun
   */
  async sendVerificationOtp(
    email: string, 
    phone: string, 
    teacherName: string
  ): Promise<SendOtpResult> {
    const cleanEmail = email.toLowerCase().trim();
    const formattedPhone = this.formatToWhatsAppNumber(phone);
    const masked = this.maskPhoneNumber(formattedPhone);

    if (!cleanEmail || !formattedPhone) {
      return {
        success: false,
        message: 'Alamat email atau nomor WhatsApp tidak valid.',
        error: 'Alamat email atau nomor WhatsApp tidak valid.',
      };
    }

    // Cek cooldown pengiriman ulang
    const existing = this.getOtpSession(cleanEmail);
    if (existing) {
      const elapsedSeconds = Math.floor((Date.now() - existing.createdAt) / 1000);
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const waitTime = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        const msg = `Harap tunggu ${waitTime} detik lagi sebelum meminta kode baru.`;
        return {
          success: false,
          message: msg,
          error: msg,
          maskedPhone: masked,
        };
      }
    }

    // Buat 6 digit angka acak (100000 s/d 999999)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000;

    const record: OtpRecord = {
      email: cleanEmail,
      phone: formattedPhone,
      name: teacherName || 'Bpk/Ibu Guru',
      code,
      createdAt: now,
      expiresAt,
      attempts: 0,
    };

    // Simpan token ke localStorage session
    this.saveOtpSession(cleanEmail, record);

    // Draf pesan resmi WhatsApp
    const messageText = `*🔒 KODE VERIFIKASI UJIANPINTAR*

Yth. Bpk/Ibu *${record.name}*,

Kami menerima permintaan untuk menyetel ulang kata sandi akun UjianPintar Anda (*${cleanEmail}*).

Berikut adalah kode verifikasi unik Anda:
👉 *${code}* 👈

⚠️ *PENTING:*
• Kode ini hanya berlaku selama *${OTP_EXPIRY_MINUTES} menit*.
• JANGAN membagikan kode ini kepada siapa pun, termasuk pihak yang mengaku sebagai tim UjianPintar.

Jika Anda tidak merasa meminta kode ini, silakan abaikan pesan ini. Akun Anda tetap aman.
_____________________________
_Pesan otomatis • Sistem Keamanan UjianPintar_`;

    // Kirim via server WAHA
    const { baseUrl, apiKey } = this.getWahaConfig();
    const chatId = `${formattedPhone}@c.us`;

    let wahaSuccess = false;
    let wahaError = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      let res = await fetch(`${baseUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          chatId,
          text: messageText,
          session: 'default',
        }),
        signal: controller.signal,
      });

      // Rute alternatif jika /api/sendText 404
      if (res.status === 404) {
        res = await fetch(`${baseUrl}/api/default/sendText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
          body: JSON.stringify({
            chatId,
            text: messageText,
          }),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (res.ok) {
        wahaSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        wahaError = errJson?.message || errJson?.error || errJson?.description || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      wahaError = err.message || 'Koneksi ke WAHA timeout';
    }

    if (wahaSuccess) {
      return {
        success: true,
        message: `Kode verifikasi 6 digit telah dikirimkan ke WhatsApp ${masked}.`,
        maskedPhone: masked,
        cleanPhone: formattedPhone,
        expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      };
    }

    // Jika WAHA gagal mengirim (belum login / sesi unlinked / server offline)
    console.error(`[WA-OTP] Gagal mengirim pesan ke ${formattedPhone} via WAHA:`, wahaError);

    let userFriendlyError = `Gagal mengirim token ke WhatsApp (${wahaError}). Pastikan server WhatsApp Gateway (WAHA) online dan sesi QR sudah ditautkan di Super Admin.`;
    const errLower = wahaError.toLowerCase();
    if (errLower.includes('does not exist') || errLower.includes('unpaired') || errLower.includes('scan_qr_code') || errLower.includes('422')) {
      userFriendlyError = 'Nomor WhatsApp pengirim belum ditautkan ke sistem (status: Menunggu Scan QR). Silakan buka menu Super Admin > WhatsApp Bot dan pindai QR Code terlebih dahulu.';
    } else if (errLower.includes('timeout') || errLower.includes('failed to fetch')) {
      userFriendlyError = 'Koneksi ke server WhatsApp Gateway (WAHA) terputus atau timeout. Silakan periksa jaringan server VPS.';
    }

    return {
      success: false,
      message: userFriendlyError,
      error: userFriendlyError,
      maskedPhone: masked,
      cleanPhone: formattedPhone,
    };
  }

  /**
   * Verifikasi token OTP yang diinput oleh guru
   */
  verifyOtp(email: string, inputCode: string): VerifyOtpResult {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = inputCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      return {
        success: false,
        message: 'Kode verifikasi harus terdiri dari 6 digit angka.',
        error: 'Kode verifikasi harus terdiri dari 6 digit angka.',
      };
    }

    const session = this.getOtpSession(cleanEmail);
    if (!session) {
      return {
        success: false,
        message: 'Kode verifikasi tidak ditemukan atau belum pernah diminta. Silakan minta kode baru.',
        error: 'Kode verifikasi tidak ditemukan atau belum pernah diminta. Silakan minta kode baru.',
      };
    }

    // Cek kedaluwarsa
    if (Date.now() > session.expiresAt) {
      this.clearOtpSession(cleanEmail);
      return {
        success: false,
        message: 'Kode verifikasi telah kedaluwarsa (lebih dari 10 menit). Silakan minta kode baru.',
        error: 'Kode verifikasi telah kedaluwarsa (lebih dari 10 menit). Silakan minta kode baru.',
      };
    }

    // Cek batas percobaan salah
    if (session.attempts >= MAX_OTP_ATTEMPTS) {
      this.clearOtpSession(cleanEmail);
      return {
        success: false,
        message: 'Batas percobaan salah telah terlampaui. Silakan minta kode verifikasi baru.',
        error: 'Batas percobaan salah telah terlampaui. Silakan minta kode verifikasi baru.',
      };
    }

    // Cek kecocokan kode
    if (session.code !== cleanCode) {
      session.attempts += 1;
      this.saveOtpSession(cleanEmail, session);
      const remaining = MAX_OTP_ATTEMPTS - session.attempts;
      const errMsg = remaining > 0 
        ? `Kode verifikasi salah. Sisa kesempatan: ${remaining} kali.`
        : 'Kode verifikasi salah. Batas percobaan habis, silakan kirim ulang kode baru.';
      return {
        success: false,
        message: errMsg,
        error: errMsg,
        remainingAttempts: remaining,
      };
    }

    // Sukses: Bersihkan token agar tidak bisa digunakan dua kali
    this.clearOtpSession(cleanEmail);
    return {
      success: true,
      message: '✓ Kode verifikasi valid! Silakan buat kata sandi baru Anda.',
    };
  }

  private getOtpSession(email: string): OtpRecord | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${OTP_STORAGE_PREFIX}${email}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveOtpSession(email: string, record: OtpRecord): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${OTP_STORAGE_PREFIX}${email}`, JSON.stringify(record));
    } catch {}
  }

  clearOtpSession(email: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${OTP_STORAGE_PREFIX}${email}`);
    } catch {}
  }
}

export const whatsappOtpService = new WhatsAppOtpService();

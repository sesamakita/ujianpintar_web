import type { MaintenanceConfig } from '../types/maintenance';

const STORAGE_KEY = 'ujianpintar_maintenance_bypass';

export const maintenanceService = {
  /**
   * Mengambil status konfigurasi maintenance terkini dari /maintenance.json
   */
  async checkMaintenanceStatus(): Promise<MaintenanceConfig | null> {
    try {
      const response = await fetch(`/maintenance.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as MaintenanceConfig;
      return data;
    } catch {
      // Jika file tidak dapat dibaca, anggap aplikasi berjalan normal
      return null;
    }
  },

  /**
   * Mengecek apakah pengguna memiliki hak akses bypass (Admin / Pengelola)
   */
  isBypassed(config?: MaintenanceConfig | null): boolean {
    if (typeof window === 'undefined') return false;

    // 1. Cek parameter URL: ?bypass=... atau ?maintenance_bypass=...
    const urlParams = new URLSearchParams(window.location.search);
    const urlSecret = urlParams.get('bypass') || urlParams.get('maintenance_bypass');

    if (urlSecret) {
      if (!config?.bypassSecret || urlSecret === config.bypassSecret) {
        try {
          localStorage.setItem(STORAGE_KEY, urlSecret);
        } catch {}
        return true;
      }
    }

    // 2. Cek localStorage yang tersimpan sebelumnya
    try {
      const storedSecret = localStorage.getItem(STORAGE_KEY);
      if (storedSecret && (!config?.bypassSecret || storedSecret === config.bypassSecret)) {
        return true;
      }
    } catch {}

    return false;
  },

  /**
   * Menyimpan kode bypass ke localStorage
   */
  setBypass(secret: string, validSecret?: string): boolean {
    if (!validSecret || secret === validSecret) {
      try {
        localStorage.setItem(STORAGE_KEY, secret);
        return true;
      } catch {}
    }
    return false;
  },

  /**
   * Menghapus sesi bypass (kembali melihat tampilan maintenance seperti pengguna umum)
   */
  clearBypass(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      const url = new URL(window.location.href);
      url.searchParams.delete('bypass');
      url.searchParams.delete('maintenance_bypass');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
    } catch {}
  },
};

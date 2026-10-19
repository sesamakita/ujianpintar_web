export interface MaintenanceConfig {
  isMaintenance: boolean;
  title?: string;
  message?: string;
  estimatedEndTime?: string; // ISO String or human readable (e.g. "2026-10-18T08:00:00+07:00")
  allowAdminBypass?: boolean;
  bypassSecret?: string;
  whatsappSupport?: string;
  progressPercent?: number;
  progressStatus?: string;
  showCountdown?: boolean;
}

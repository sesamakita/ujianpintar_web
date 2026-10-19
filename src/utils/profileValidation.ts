/**
 * Utility untuk memeriksa status kelengkapan profil guru (Soft Gate & Progressive Profiling)
 */

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  isMissingSchool: boolean;
  isMissingWhatsapp: boolean;
  isMissingSubject: boolean;
  isMissingName: boolean;
}

export const DEFAULT_PLACEHOLDER_SCHOOLS = [
  'Satuan Pendidikan',
  'SMA Negeri 1 Indonesia',
  'Sekolah',
  '-',
];

export const DEFAULT_PLACEHOLDER_WHATSAPPS = [
  '081234567890',
  '6281234567890',
  '+6281234567890',
  '-',
];

export function checkProfileCompletion(user?: {
  name?: string;
  school?: string;
  whatsapp?: string;
  subject?: string;
  nip?: string;
  npsn?: string;
} | null): ProfileCompletionStatus {
  const missingFields: string[] = [];

  if (!user) {
    return {
      isComplete: false,
      missingFields: ['Nama Lengkap', 'Nama Sekolah', 'Nomor WhatsApp', 'Mata Pelajaran'],
      isMissingSchool: true,
      isMissingWhatsapp: true,
      isMissingSubject: true,
      isMissingName: true,
    };
  }

  const schoolVal = (user.school || '').trim();
  const isMissingSchool = !schoolVal || DEFAULT_PLACEHOLDER_SCHOOLS.includes(schoolVal);
  if (isMissingSchool) {
    missingFields.push('Nama Sekolah');
  }

  const waVal = (user.whatsapp || '').trim();
  const isMissingWhatsapp = !waVal || DEFAULT_PLACEHOLDER_WHATSAPPS.includes(waVal);
  if (isMissingWhatsapp) {
    missingFields.push('Nomor WhatsApp');
  }

  const subjectVal = (user.subject || '').trim();
  const isMissingSubject = !subjectVal || subjectVal === '-';
  if (isMissingSubject) {
    missingFields.push('Mata Pelajaran Utama');
  }

  const nameVal = (user.name || '').trim();
  const isMissingName = !nameVal || nameVal === 'Guru';
  if (isMissingName) {
    missingFields.push('Nama Guru');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    isMissingSchool,
    isMissingWhatsapp,
    isMissingSubject,
    isMissingName,
  };
}

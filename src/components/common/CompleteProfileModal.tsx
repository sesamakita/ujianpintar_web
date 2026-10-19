import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  BookOpen, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ShieldCheck,
  Save,
  GraduationCap
} from 'lucide-react';
import { SchoolDirectoryModal } from './SchoolDirectoryModal';
import { whatsappVerificationService } from '../../services/whatsappVerificationService';
import { authService } from '../../services/authService';

export interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose?: () => void;
  allowDismiss?: boolean;
  title?: string;
  description?: string;
  currentUser: {
    id?: string;
    name: string;
    email: string;
    school: string;
    subject: string;
    whatsapp?: string;
    nip?: string;
    npsn?: string;
    avatarUrl?: string;
  };
  onSaveSuccess: (updatedProfile: {
    name: string;
    school: string;
    whatsapp: string;
    nip?: string;
    npsn?: string;
    subject?: string;
  }) => void;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  isOpen,
  onClose,
  allowDismiss = true,
  title = 'Lengkapi Identitas Pengajar & Sekolah',
  description = 'Nama sekolah dan nomor WhatsApp diperlukan agar kop soal ujian resmi, token siswa, dan identitas pengajar tercantum valid.',
  currentUser,
  onSaveSuccess,
}) => {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [npsn, setNpsn] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [subject, setSubject] = useState('');
  const [nip, setNip] = useState('');
  
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state with currentUser when opened
  useEffect(() => {
    if (isOpen && currentUser) {
      const isDefaultSchool = ['Satuan Pendidikan', 'SMA Negeri 1 Indonesia', 'Sekolah'].includes((currentUser.school || '').trim());
      const isDefaultWhatsapp = ['081234567890', '6281234567890'].includes((currentUser.whatsapp || '').trim());

      setName(currentUser.name || '');
      setSchool(isDefaultSchool ? '' : (currentUser.school || ''));
      setNpsn(currentUser.npsn && currentUser.npsn !== '20104829' ? currentUser.npsn : '');
      setWhatsapp(isDefaultWhatsapp ? '' : (currentUser.whatsapp || ''));
      setSubject(currentUser.subject || '');
      setNip(currentUser.nip && currentUser.nip !== '19850412 200902 1 004' ? currentUser.nip : '');
      setErrorMessage(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanSchool = school.trim();
    const cleanSubject = subject.trim();
    const cleanWhatsapp = whatsapp.trim();

    if (!cleanName) {
      setErrorMessage('Nama lengkap pengajar wajib diisi.');
      return;
    }

    if (!cleanSchool) {
      setErrorMessage('Nama sekolah / instansi wajib diisi untuk kop soal ujian.');
      return;
    }

    if (!cleanSubject) {
      setErrorMessage('Mata pelajaran utama wajib diisi.');
      return;
    }

    // Validasi nomor WhatsApp format Indonesia
    const phoneCheck = whatsappVerificationService.formatAndValidatePhone(cleanWhatsapp);
    if (!phoneCheck.isValidFormat) {
      setErrorMessage(phoneCheck.errorMessage || 'Nomor WhatsApp tidak valid. Gunakan format nomor seluler Indonesia (contoh: 0812...).');
      return;
    }

    setIsSaving(true);
    try {
      const finalPayload = {
        name: cleanName,
        school: cleanSchool,
        whatsapp: phoneCheck.formattedPhone || cleanWhatsapp,
        nip: nip.trim() || '',
        npsn: npsn.trim() || '',
        subject: cleanSubject,
      };

      const res = await authService.updateTeacherProfile(finalPayload);
      if (!res.success) {
        setErrorMessage(res.error || 'Gagal menyimpan profil. Silakan coba kembali.');
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      onSaveSuccess(finalPayload);
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-profile-title"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-start justify-between relative shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-100 text-[10.5px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Progressive Profiling
              </div>
              <h3 id="complete-profile-title" className="text-base sm:text-lg font-display font-extrabold text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {allowDismiss && onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
              title="Tutup & Lengkapi Nanti"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Email Info (Read-only) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Akun Google Terhubung</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{currentUser?.email}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
            </span>
          </div>

          {/* Nama Lengkap & Gelar */}
          <div>
            <label htmlFor="complete-name" className="block font-display font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Nama Lengkap & Gelar Guru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="complete-name"
                type="text"
                required
                placeholder="Contoh: Rahmat Hidayat, S.Pd."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sekolah & NPSN */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="complete-school" className="font-display font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Nama Sekolah / Instansi <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsSchoolModalOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-3 h-3" />
                <span>Cari dari Direktori Resmi</span>
              </button>
            </div>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="complete-school"
                type="text"
                required
                placeholder="Contoh: SMA Negeri 1 Banggai"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            {npsn && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span>NPSN Terdata: <strong className="font-mono">{npsn}</strong></span>
                <button
                  type="button"
                  onClick={() => setNpsn('')}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                  title="Hapus NPSN"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Grid: Nomor WhatsApp & Mapel Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="complete-whatsapp" className="block font-display font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="complete-whatsapp"
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
                Untuk pemulihan sandi via token WAHA.
              </span>
            </div>

            <div>
              <label htmlFor="complete-subject" className="block font-display font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Mata Pelajaran Utama <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="complete-subject"
                  type="text"
                  required
                  placeholder="Contoh: Matematika"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* NIP Guru (Opsional) */}
          <div>
            <label htmlFor="complete-nip" className="block font-display font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              NIP Guru <span className="text-slate-400 font-normal lowercase">(opsional / untuk PNS / PPPK)</span>
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="complete-nip"
                type="text"
                placeholder="Contoh: 19850412 200902 1 004"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            {allowDismiss && onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-display font-bold text-xs transition-colors cursor-pointer"
              >
                Lengkapi Nanti
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan & Lanjutkan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Direktori Sekolah Modal */}
      <SchoolDirectoryModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        currentSchoolName={school}
        onSelectSchool={(s) => {
          setSchool(s.schoolName);
          setNpsn(s.npsn);
        }}
      />
    </div>
  );
};

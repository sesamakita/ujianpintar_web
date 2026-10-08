import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  User, 
  Save, 
  CheckCircle2, 
  Phone, 
  AlertCircle,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  BookOpen,
  Camera,
  Trash2,
  Database,
  HardDrive,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';
import { authService } from '../../services/authService';
import { examService } from '../../services/examService';
import { SchoolDirectoryModal } from '../common/SchoolDirectoryModal';
import type { DataRetentionStats } from '../../types/exam';
import type { TeacherSubscription } from '../../types/subscription';

interface SystemSettingsProps {
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
  subscription?: TeacherSubscription;
  onOpenUpgradeModal?: (title?: string, description?: string) => void;
  onProfileUpdated?: (updated: {
    name: string;
    school: string;
    whatsapp: string;
    nip?: string;
    npsn?: string;
    subject?: string;
    avatarUrl?: string;
  }) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  currentUser,
  subscription,
  onOpenUpgradeModal,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [nip, setNip] = useState(currentUser.nip || '');
  const [whatsapp, setWhatsapp] = useState(currentUser.whatsapp || '');
  const [school, setSchool] = useState(currentUser.school || '');
  const [npsn, setNpsn] = useState(currentUser.npsn || '');
  const [subject, setSubject] = useState(currentUser.subject || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security & Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Data Retention & Storage state
  const [retentionStats, setRetentionStats] = useState<DataRetentionStats | null>(null);
  const [isLoadingRetention, setIsLoadingRetention] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const isPro = Boolean(subscription?.tier === 'pro' || subscription?.tier === 'school' || retentionStats?.isPro);

  useEffect(() => {
    if (currentUser.id) {
      setIsLoadingRetention(true);
      examService.getDataRetentionStats(currentUser.id).then((stats) => {
        setRetentionStats(stats);
      }).finally(() => {
        setIsLoadingRetention(false);
      });
    }
  }, [currentUser.id]);

  const handleManualCleanup = async () => {
    if (!currentUser.id || isCleaning) return;
    const confirmClean = window.confirm(
      'Apakah Anda yakin ingin memeriksa dan membersihkan riwayat sesi lama (>30 hari) serta rekap nilai (>90 hari)? Data yang dihapus tidak dapat dipulihkan kembali. Pastikan Anda telah mengunduh rekap nilai (.csv) jika masih diperlukan.'
    );
    if (!confirmClean) return;

    setIsCleaning(true);
    setCleanupMessage(null);
    try {
      const res = await examService.cleanupExpiredData(currentUser.id);
      setCleanupMessage(res.message);
      const updated = await examService.getDataRetentionStats(currentUser.id);
      setRetentionStats(updated);
    } catch (err: any) {
      setCleanupMessage(`Gagal membersihkan data: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  // Compress image to lightweight base64
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Gagal memproses gambar foto.'));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format file tidak didukung. Harap gunakan format gambar (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file foto maksimal 5 MB.');
      return;
    }

    try {
      const base64 = await compressImage(file);
      setAvatarUrl(base64);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah foto.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Sync state when currentUser prop changes
  useEffect(() => {
    setName(currentUser.name || '');
    setNip(currentUser.nip || '');
    setWhatsapp(currentUser.whatsapp || '');
    setSchool(currentUser.school || '');
    setNpsn(currentUser.npsn || '');
    setSubject(currentUser.subject || '');
    setAvatarUrl(currentUser.avatarUrl || '');
  }, [currentUser]);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
      return;
    }

    setIsSavingPassword(true);
    const res = await authService.updatePassword(newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } else {
      setPasswordError(res.error || 'Gagal menyimpan kata sandi.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const updatedProfile = {
      name: name.trim(),
      school: school.trim(),
      whatsapp: whatsapp.trim(),
      nip: nip.trim(),
      npsn: npsn.trim(),
      subject: subject.trim(),
      avatarUrl: avatarUrl.trim(),
    };

    const res = await authService.updateTeacherProfile(updatedProfile);
    await authService.updateAvatarUrl(avatarUrl.trim());

    if (res.success) {
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan profil.');
    }
    setIsSaving(false);
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight">
            Pengaturan Sekolah & Profil Guru
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Konfigurasi identitas penguji dan satuan pendidikan sekolah
          </p>
        </div>
        {saved && (
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-display font-bold border border-emerald-200 flex items-center gap-1.5 animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Profil Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-sans font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}


      {/* Peringatan Lengkapi Biodata jika belum terisi */}
      {(() => {
        const missing: { field: string; label: string }[] = [];
        if (!school || school.trim() === '' || school === 'Satuan Pendidikan') missing.push({ field: 'school', label: 'Nama Sekolah' });
        if (!nip || nip.trim() === '') missing.push({ field: 'nip', label: 'NIP Guru' });
        if (!npsn || npsn.trim() === '') missing.push({ field: 'npsn', label: 'NPSN Sekolah' });
        if (missing.length === 0) return null;
        return (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 animate-in fade-in flex items-start gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-display font-bold text-amber-900 uppercase tracking-wide">
                Data Profil Belum Lengkap — {missing.length} Field Wajib Kosong
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Field berikut masih kosong:{' '}
                {missing.map((m, i) => (
                  <span key={m.field}>
                    <strong>{m.label}</strong>{i < missing.length - 1 ? ', ' : '.'}
                  </span>
                ))}
                {' '}Data ini digunakan untuk mengisi <strong>kop surat</strong> dan <strong>SKHU / Rapor PDF</strong> siswa secara otomatis. Harap lengkapi sebelum mencetak laporan.
              </p>
            </div>
          </div>
        );
      })()}



      <form onSubmit={handleSave} className="space-y-4">
        {/* Card 1: Profil Guru Penguji */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                Identitas Guru Penguji
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Data identitas yang tersimpan pada akun guru dan dicetak pada lembar rekapitulasi nilai
              </p>
            </div>
          </div>

          {/* Fitur Foto Profil Guru Penguji */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <div className="relative group flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Guru'}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs border border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-display font-black text-xl flex items-center justify-center shadow-xs ring-2 ring-blue-500/20">
                  {name ? name.replace(/Bpk\.|Ibu|Dr\.|S\.Pd\.|M\.Pd\./g, '').trim().substring(0, 2).toUpperCase() : <User className="w-7 h-7" />}
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-display font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>{avatarUrl ? 'Ganti Foto Profil' : 'Tambah Foto Profil'}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-display font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-tight">
                Format yang didukung: JPG, PNG, atau WEBP. Jika tidak diisi, sistem otomatis menampilkan inisial bawaan.
              </p>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="set-1" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Nama Lengkap & Gelar
              </label>
              <input id="set-1"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rahmat, S.Pd."
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="set-2" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Mata Pelajaran (Mapel)
              </label>
              <div className="relative">
                <input id="set-2"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Matematika Wajib, Biologi, dll."
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="set-3" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                NIP / NUPTK Guru
                {(!nip || nip.trim() === '') && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold normal-case tracking-normal">Belum diisi</span>
                )}
              </label>
              <input id="set-3"
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="19850412 200902 1 004"
                className={`w-full h-10 bg-slate-50 border rounded-xl px-3.5 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${!nip || nip.trim() === '' ? 'border-amber-300' : 'border-slate-200'}`}
              />
            </div>


            <div>
              <label htmlFor="set-4" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                No. WhatsApp Guru
              </label>
              <div className="relative">
                <input id="set-4"
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Satuan Pendidikan & Mapel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                  Satuan Pendidikan / Sekolah
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Data institusi sekolah penyelenggara asesmen
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSchoolModalOpen(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Sekolah &amp; NPSN Resmi</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="set-5" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                Nama Sekolah
                {(!school || school.trim() === '' || school === 'Satuan Pendidikan') && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold normal-case tracking-normal">Belum diisi</span>
                )}
              </label>
              <input id="set-5"
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Contoh: SMA Negeri 1 Indonesia"
                className={`w-full h-10 bg-slate-50 border rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${!school || school.trim() === '' ? 'border-amber-300' : 'border-slate-200'}`}
              />
            </div>

            <div>
              <label htmlFor="set-6" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                NPSN Sekolah
                {(!npsn || npsn.trim() === '') && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold normal-case tracking-normal">Belum diisi</span>
                )}
              </label>
              <input id="set-6"
                type="text"
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="Contoh: 20104829"
                className={`w-full h-10 bg-slate-50 border rounded-xl px-3.5 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${!npsn || npsn.trim() === '' ? 'border-amber-300' : 'border-slate-200'}`}
              />
            </div>

          </div>
        </div>

        {/* Card 3: Keamanan Akun & Kredensial Login (Email & Password) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                  Kredensial & Keamanan Akun
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Username/email akun login dan pengaturan kata sandi untuk akses manual
                </p>
              </div>
            </div>
            {passwordSuccess && (
              <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-display font-bold border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kata Sandi Berhasil Disimpan!</span>
              </div>
            )}
          </div>

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-sans font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Email / Username Information */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-2xs">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Email / Username Login
                </div>
                <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">
                  {currentUser.email || 'Email belum terpasang'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/80 self-start sm:self-center">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>ID Akun Terdaftar</span>
            </div>
          </div>

          {/* Buat / Ubah Password Form */}
          <div className="pt-1">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Buat / Atur Kata Sandi</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Jika Anda mendaftar melalui Akun Google, Anda dapat membuat kata sandi di sini agar akun Anda dapat login menggunakan Email &amp; Kata Sandi manual selain tombol Google.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <label htmlFor="set-7" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input id="set-7"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-10 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="set-8" className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Ulangi Kata Sandi
                </label>
                <input id="set-8"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSavePassword}
              disabled={isSavingPassword || !newPassword}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSavingPassword ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Akun'}</span>
            </button>
          </div>
        </div>

        {/* Manajemen Penyimpanan & Retensi Riwayat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-200 shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <span>Manajemen Penyimpanan &amp; Retensi Riwayat</span>
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Pemantauan kapasitas data riwayat sesi ujian, log pengawasan, dan rekap nilai siswa
                </p>
              </div>
            </div>

            {isPro ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Penyimpanan Permanen (PRO)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Retensi Otomatis (Guru Basic)</span>
              </span>
            )}
          </div>

          {/* Statistik Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Sesi Ujian Siswa
              </span>
              <div className="text-lg font-black text-slate-900 font-display">
                {isLoadingRetention ? '...' : retentionStats?.sessionCount || 0}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isPro ? 'Tersimpan permanen' : 'Batas retensi 30 hari'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Rekap Nilai
              </span>
              <div className="text-lg font-black text-slate-900 font-display">
                {isLoadingRetention ? '...' : retentionStats?.gradeCount || 0}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isPro ? 'Tersimpan permanen' : 'Batas retensi 90 hari'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Jawaban Soal
              </span>
              <div className="text-lg font-black text-slate-900 font-display">
                {isLoadingRetention ? '...' : retentionStats?.answerCount || 0}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Mengikuti siklus sesi
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Log Pengawasan
              </span>
              <div className="text-lg font-black text-slate-900 font-display">
                {isLoadingRetention ? '...' : retentionStats?.violationCount || 0}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isPro ? 'Tersimpan permanen' : 'Batas retensi 14 hari'}
              </span>
            </div>
          </div>

          {/* Policy Information Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>Kebijakan Penyimpanan Data:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11.5px]">
              <li>
                <strong>Akun Guru Basic (Gratis):</strong> Sesi telemetri live disimpan selama <strong>30 hari</strong>, rekap nilai kelulusan disimpan <strong>90 hari</strong>, dan log pengawasan <strong>14 hari</strong>. Setelah melewati masa retensi, data lama dibersihkan secara otomatis.
              </li>
              <li>
                <strong>Fitur Ekspor:</strong> Pastikan Anda telah mengunduh rekap nilai ke format <strong>.CSV</strong> (tersedia gratis di menu Rekap Nilai) sebelum masa simpan berakhir.
              </li>
              <li>
                <strong>Akun Guru PRO &amp; Lisensi Sekolah:</strong> Seluruh riwayat ujian, butir soal, jawaban esai, dan rekap raport Excel (.xlsx) disimpan <strong>permanen tanpa batas waktu</strong>.
              </li>
            </ul>
          </div>

          {cleanupMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{cleanupMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleManualCleanup}
              disabled={isCleaning || isLoadingRetention}
              className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isCleaning ? 'Memeriksa & Membersihkan...' : 'Bersihkan Sesi & Data Kadaluarsa'}</span>
            </button>

            {!isPro && onOpenUpgradeModal && (
              <button
                type="button"
                onClick={() => onOpenUpgradeModal(
                  'Buka Penyimpanan Data Permanen',
                  'Tingkatkan ke Guru PRO untuk menyimpan seluruh riwayat ujian, jawaban uraian, dan rekap nilai siswa secara permanen tanpa batas masa retensi.'
                )}
                className="h-9 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                <span>Upgrade ke PRO (Simpan Permanen)</span>
              </button>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* School Directory Modal */}
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

export default SystemSettings;

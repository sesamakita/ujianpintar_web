import React, { useState, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';
import { authService } from '../../services/authService';

interface SystemSettingsProps {
  currentUser: {
    name: string;
    email: string;
    school: string;
    subject: string;
    whatsapp?: string;
    nip?: string;
    npsn?: string;
  };
  onProfileUpdated?: (updated: {
    name: string;
    school: string;
    whatsapp: string;
    nip?: string;
    npsn?: string;
    subject?: string;
  }) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  currentUser,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [nip, setNip] = useState(currentUser.nip || '');
  const [whatsapp, setWhatsapp] = useState(currentUser.whatsapp || '');
  const [school, setSchool] = useState(currentUser.school || '');
  const [npsn, setNpsn] = useState(currentUser.npsn || '');
  const [subject, setSubject] = useState(currentUser.subject || '');

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

  // Sync state when currentUser prop changes
  useEffect(() => {
    setName(currentUser.name || '');
    setNip(currentUser.nip || '');
    setWhatsapp(currentUser.whatsapp || '');
    setSchool(currentUser.school || '');
    setNpsn(currentUser.npsn || '');
    setSubject(currentUser.subject || '');
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
    };

    const res = await authService.updateTeacherProfile(updatedProfile);

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
      {(!school || school.trim() === '') && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 animate-in fade-in flex items-start gap-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-display font-bold text-amber-900 uppercase tracking-wide">
              Lengkapi Biodata Sekolah & Guru
            </h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Selamat datang! Akun Google Anda telah terhubung. Silakan lengkapi <strong>Nama Sekolah</strong>, <strong>Mata Pelajaran</strong>, dan nomor kontak Anda di bawah ini agar kop naskah ujian dan kartu peserta ujian siswa dapat terisi secara otomatis.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Card 1: Profil Guru Penguji */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rahmat, S.Pd."
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Mata Pelajaran (Mapel)
              </label>
              <div className="relative">
                <input
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
              <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                NIP / NUPTK Guru
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="19850412 200902 1 004"
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                No. WhatsApp Guru
              </label>
              <div className="relative">
                <input
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
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Nama Sekolah
              </label>
              <input
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Contoh: SMA Negeri 1 Indonesia"
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                NPSN Sekolah
              </label>
              <input
                type="text"
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="Contoh: 20104829"
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
                <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
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
                <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Ulangi Kata Sandi
                </label>
                <input
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
    </div>
  );
};

export default SystemSettings;

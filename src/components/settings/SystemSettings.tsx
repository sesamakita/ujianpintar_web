import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Save, 
  CheckCircle2, 
  Phone, 
  AlertCircle
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

  // Sync state when currentUser prop changes
  useEffect(() => {
    setName(currentUser.name || '');
    setNip(currentUser.nip || '');
    setWhatsapp(currentUser.whatsapp || '');
    setSchool(currentUser.school || '');
    setNpsn(currentUser.npsn || '');
    setSubject(currentUser.subject || '');
  }, [currentUser]);

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bpk. Rahmat, S.Pd."
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
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

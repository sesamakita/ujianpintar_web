import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Users, 
  ShieldCheck, 
  DollarSign, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Edit3, 
  Eye
} from 'lucide-react';
import { schoolLicenseService } from '../../services/schoolLicenseService';
import type { SchoolLicense } from '../../types/schoolLicense';

export const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<SchoolLicense[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedSchoolForDetails, setSelectedSchoolForDetails] = useState<SchoolLicense | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState<SchoolLicense | null>(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form State for New License
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formNpsn, setFormNpsn] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formProvince, setFormProvince] = useState('');
  const [formSchoolCode, setFormSchoolCode] = useState('');
  const [formOperatorPin, setFormOperatorPin] = useState('');
  const [formDurationMonths, setFormDurationMonths] = useState<number>(12);
  const [formMaxTeachers, setFormMaxTeachers] = useState<number>(50);

  const loadData = () => {
    const list = schoolLicenseService.getSchoolsDB();
    setSchools(list);
    const m = schoolLicenseService.getSuperAdminMetrics();
    setMetrics(m);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAutoGenerateCode = () => {
    const clean = formSchoolName
      .replace(/SMA|SMP|SD|SMK|Negeri|Swasta|Kabupaten|Kota|1|2|3|4|5|6|7|8|9|0/gi, '')
      .trim()
      .slice(0, 4)
      .toUpperCase();
    const prefix = formSchoolName.includes('SMP') ? 'SMPN' : formSchoolName.includes('SD') ? 'SDN' : 'SMAN';
    const year = new Date().getFullYear() + 1;
    const generated = `${prefix}-${clean || 'SEKOLAH'}-${year}`;
    setFormSchoolCode(generated);
    setFormOperatorPin(String(Math.floor(100000 + Math.random() * 900000)));
  };

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchoolName.trim() || !formSchoolCode.trim()) {
      setFeedback({ success: false, message: 'Harap isi Nama Sekolah dan Kode Lisensi.' });
      return;
    }

    const res = schoolLicenseService.createSchoolLicense({
      schoolName: formSchoolName,
      schoolCode: formSchoolCode,
      operatorPin: formOperatorPin || '123456',
      npsn: formNpsn,
      city: formCity,
      province: formProvince,
      durationMonths: formDurationMonths,
      maxTeachers: formMaxTeachers,
    });

    if (res.success) {
      setShowCreateModal(false);
      setFormSchoolName('');
      setFormNpsn('');
      setFormCity('');
      setFormProvince('');
      setFormSchoolCode('');
      setFormOperatorPin('');
      setFeedback({ success: true, message: res.message });
      loadData();
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  const handleExtend = (school: SchoolLicense) => {
    if (confirm(`Perpanjang lisensi untuk "${school.schoolName}" selama +1 Tahun (12 Bulan)?`)) {
      const res = schoolLicenseService.extendSchoolLicense(school.id, 12);
      setFeedback({ success: res.success, message: res.message });
      loadData();
    }
  };

  const handleToggleActive = (school: SchoolLicense) => {
    const res = schoolLicenseService.toggleSchoolActive(school.id);
    setFeedback({ success: res.success, message: res.message });
    loadData();
  };

  const handleDelete = (school: SchoolLicense) => {
    if (confirm(`HAPUS PERMANEN lisensi "${school.schoolName}" dari sistem? Data dewan guru terdaftar akan terputus.`)) {
      const res = schoolLicenseService.deleteSchoolLicense(school.id);
      setFeedback({ success: res.success, message: res.message });
      loadData();
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPinModal) return;

    const res = schoolLicenseService.resetOperatorPinBySuperAdmin(showResetPinModal.id, newPinInput);
    if (res.success) {
      setShowResetPinModal(null);
      setNewPinInput('');
      setFeedback({ success: true, message: res.message });
      loadData();
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  const filteredSchools = schools.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.schoolName.toLowerCase().includes(q) ||
      s.schoolCode.toLowerCase().includes(q) ||
      s.npsn.includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  });

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="p-6 space-y-7 max-w-6xl mx-auto font-sans select-none animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0 border border-white/20">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-2xl text-white tracking-tight leading-none">
                Platform Super Admin
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-full font-mono text-[10px] font-bold">
                ROOT SAAS
              </span>
            </div>
            <p className="text-xs text-indigo-200 font-sans mt-1.5 leading-relaxed">
              Pusat penerbitan lisensi tahunan sekolah, kontrol kode dewan guru, dan pengelolaan master PIN operator.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateModal(true);
            setFeedback(null);
          }}
          className="relative z-10 px-5 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-2xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Terbitkan Lisensi Sekolah Baru</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in leading-relaxed ${
            feedback.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
          <div className="flex-1">{feedback.message}</div>
        </div>
      )}

      {/* 2. KPI METRICS CARDS */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Sekolah Mitra</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-display font-black text-slate-900">
              {metrics.totalSchools} <span className="text-xs font-semibold text-slate-400 font-sans">Satuan Pendidikan</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block">
              🟢 {metrics.activeSchools} Sekolah Aktif Berlangganan
            </span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Dewan Guru Terhubung</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-display font-black text-slate-900">
              {metrics.totalTeachers} <span className="text-xs font-semibold text-slate-400 font-sans">/ {metrics.totalCapacity} Slot</span>
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold block">
              📊 {Math.round((metrics.totalTeachers / (metrics.totalCapacity || 1)) * 100)}% Utilisasi Kuota Guru
            </span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Estimasi Nilai Kontrak</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-display font-black text-emerald-700">
              {formatRupiah(metrics.estimatedAnnualRevenue)}
            </div>
            <span className="text-[11px] text-slate-500 font-sans block">
              Perhitungan Rp 1.5Jt / Sekolah / Thn
            </span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Status Server & Lisensi</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-display font-black text-slate-900">
              100% <span className="text-xs font-semibold text-slate-400 font-sans">Operational</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block">
              ✨ Database Sinkronisasi Aktif
            </span>
          </div>
        </div>
      )}

      {/* 3. TABLE OF SCHOOL LICENSES */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-black text-slate-900 text-lg tracking-tight">
              Daftar Lisensi Sekolah & Kunci Akses
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Kelola tanggal expired 1 tahun, salin kode dewan guru, dan kontrol PIN master operator.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sekolah, NPSN, kode lisensi..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-display font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Satuan Pendidikan</th>
                <th className="py-3 px-3">Kode Lisensi Guru</th>
                <th className="py-3 px-3">PIN Operator</th>
                <th className="py-3 px-3">Masa Berlaku</th>
                <th className="py-3 px-3">Dewan Guru</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchools.map((s) => {
                const daysRemaining = schoolLicenseService.calculateDaysRemaining(s.endDate);
                const isExp = schoolLicenseService.isExpired(s.endDate);
                const isCopiedCode = copiedKey === `code-${s.id}`;
                const isCopiedPin = copiedKey === `pin-${s.id}`;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* School Name & NPSN */}
                    <td className="py-3.5 px-3">
                      <div className="font-display font-bold text-slate-900 text-xs">
                        {s.schoolName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        NPSN: {s.npsn} • {s.city}
                      </div>
                    </td>

                    {/* Teacher License Code */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <code className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded font-mono font-bold text-[11px]">
                          {s.schoolCode}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(s.schoolCode, `code-${s.id}`)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                          title="Salin Kode Guru"
                        >
                          {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Operator Master PIN */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <code className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded font-mono font-bold text-[11px]">
                          {s.operatorPin}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(s.operatorPin, `pin-${s.id}`)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                          title="Salin PIN Operator"
                        >
                          {isCopiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewPinInput(s.operatorPin);
                            setShowResetPinModal(s);
                          }}
                          className="p-1 hover:bg-amber-100 rounded text-amber-700 cursor-pointer"
                          title="Reset PIN Operator"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Duration / Expiration */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isExp || !s.isActive
                            ? 'bg-rose-100 text-rose-800'
                            : daysRemaining < 30
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isExp ? 'Kedaluwarsa' : `${daysRemaining} Hari`}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                        s/d {new Date(s.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Registered Teachers */}
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => setSelectedSchoolForDetails(s)}
                        className="font-mono font-bold text-slate-800 hover:text-indigo-600 underline flex items-center gap-1 cursor-pointer"
                        title="Klik untuk melihat nama-nama guru"
                      >
                        <span>{s.registeredTeachers.length} / {s.maxTeachers}</span>
                        <Eye className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(s)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          s.isActive && !isExp
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {s.isActive && !isExp ? '● Aktif' : '● Non-Aktif'}
                      </button>
                    </td>

                    {/* Super Admin Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleExtend(s)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Tambah masa aktif 1 tahun"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+1 Thn</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Lisensi Sekolah"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TERBITKAN LISENSI SEKOLAH BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-black text-base text-slate-900">
                    Terbitkan Lisensi Sekolah Baru
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Buat kode lisensi guru dan PIN operator untuk sekolah mitra
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-display font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Nama Satuan Pendidikan *
                </label>
                <input
                  type="text"
                  value={formSchoolName}
                  onChange={(e) => setFormSchoolName(e.target.value)}
                  placeholder="Contoh: SMA Negeri 3 Surabaya"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NPSN (Nomor Pokok)
                  </label>
                  <input
                    type="text"
                    value={formNpsn}
                    onChange={(e) => setFormNpsn(e.target.value)}
                    placeholder="Contoh: 20109988"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kota / Wilayah
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Contoh: Kota Surabaya"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Generated License Code & PIN */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-indigo-950 uppercase tracking-wider">
                    Kunci Akses Sekolah
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Auto-Generate</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-600 font-semibold block mb-0.5">Kode Dewan Guru:</span>
                    <input
                      type="text"
                      value={formSchoolCode}
                      onChange={(e) => setFormSchoolCode(e.target.value.toUpperCase())}
                      placeholder="SMAN3-SBY-2027"
                      className="w-full h-10 px-3 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold uppercase text-indigo-950"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-semibold block mb-0.5">PIN Master Operator:</span>
                    <input
                      type="text"
                      value={formOperatorPin}
                      onChange={(e) => setFormOperatorPin(e.target.value)}
                      placeholder="Contoh: 123456"
                      className="w-full h-10 px-3 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-amber-900"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Durasi Langganan
                  </label>
                  <select
                    value={formDurationMonths}
                    onChange={(e) => setFormDurationMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                  >
                    <option value={12}>1 Tahun (12 Bulan)</option>
                    <option value={24}>2 Tahun (24 Bulan)</option>
                    <option value={6}>6 Bulan (Semester)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Kuota Guru
                  </label>
                  <select
                    value={formMaxTeachers}
                    onChange={(e) => setFormMaxTeachers(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                  >
                    <option value={35}>35 Guru (Paket Standar)</option>
                    <option value={50}>50 Guru (Paket Populer)</option>
                    <option value={100}>100 Guru (Paket Besar)</option>
                    <option value={200}>200 Guru (Enterprise)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20"
                >
                  Terbitkan Lisensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PIN OPERATOR */}
      {showResetPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-black text-sm text-slate-900">
              Reset PIN Operator: {showResetPinModal.schoolName}
            </h4>
            <form onSubmit={handleSaveNewPin} className="space-y-3">
              <input
                type="text"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="Masukkan PIN baru (contoh: 889900)"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetPinModal(null)}
                  className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-amber-600 text-white rounded-xl font-bold text-xs"
                >
                  Simpan PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW REGISTERED TEACHERS ROSTER */}
      {selectedSchoolForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-display font-black text-base text-slate-900">
                  {selectedSchoolForDetails.schoolName}
                </h4>
                <p className="text-xs text-slate-500 font-sans">
                  Dewan Guru Terdaftar ({selectedSchoolForDetails.registeredTeachers.length} / {selectedSchoolForDetails.maxTeachers} Guru)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchoolForDetails(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {selectedSchoolForDetails.registeredTeachers.length > 0 ? (
                selectedSchoolForDetails.registeredTeachers.map((t, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.email}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {new Date(t.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Belum ada guru yang mengaktivasi kode lisensi ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

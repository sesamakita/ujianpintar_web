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
  Eye,
  RefreshCw,
  GraduationCap,
  Phone,
  FileText,
  Crown,
  Database,
  Link as LinkIcon
} from 'lucide-react';
import { schoolLicenseService } from '../../services/schoolLicenseService';
import { superAdminService } from '../../services/superAdminService';
import type { VpsTeacherUser } from '../../services/superAdminService';
import { ConfirmModal } from '../common/ConfirmModal';
import type { SchoolLicense } from '../../types/schoolLicense';

export const SuperAdminDashboard: React.FC = () => {
  // Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<'schools' | 'teachers'>('schools');

  // School Licenses State
  const [schools, setSchools] = useState<SchoolLicense[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedSchoolForDetails, setSelectedSchoolForDetails] = useState<SchoolLicense | null>(null);

  // VPS Teachers State
  const [teachers, setTeachers] = useState<VpsTeacherUser[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<'all' | 'independent' | 'school' | 'pro' | 'google'>('all');
  const [vpsStatus, setVpsStatus] = useState<{ connected: boolean; latencyMs: number; error?: string } | null>(null);

  // Teacher Modals State
  const [selectedTeacherForDetails, setSelectedTeacherForDetails] = useState<VpsTeacherUser | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<VpsTeacherUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    schoolName: '',
    npsn: '',
    nip: '',
    subject: '',
    whatsappNumber: '',
  });
  const [assigningTeacher, setAssigningTeacher] = useState<VpsTeacherUser | null>(null);
  const [assignTargetSchoolCode, setAssignTargetSchoolCode] = useState('');
  const [tierTargetTeacher, setTierTargetTeacher] = useState<VpsTeacherUser | null>(null);
  const [deleteTargetTeacher, setDeleteTargetTeacher] = useState<VpsTeacherUser | null>(null);

  // School Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState<SchoolLicense | null>(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [extendTargetSchool, setExtendTargetSchool] = useState<SchoolLicense | null>(null);
  const [deleteTargetSchool, setDeleteTargetSchool] = useState<SchoolLicense | null>(null);

  // Form State for New School License
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formNpsn, setFormNpsn] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formProvince, setFormProvince] = useState('');
  const [formSchoolCode, setFormSchoolCode] = useState('');
  const [formOperatorPin, setFormOperatorPin] = useState('');
  const [formDurationMonths, setFormDurationMonths] = useState<number>(12);
  const [formMaxTeachers, setFormMaxTeachers] = useState<number>(50);

  const loadSchoolsData = () => {
    const list = schoolLicenseService.getSchoolsDB();
    setSchools(list);
    const m = schoolLicenseService.getSuperAdminMetrics();
    setMetrics(m);
  };

  const loadTeachersData = async () => {
    setIsLoadingTeachers(true);
    try {
      const status = await superAdminService.testVpsConnection();
      setVpsStatus(status);
      const res = await superAdminService.fetchVpsTeachers();
      setTeachers(res.teachers);
      if (res.error) {
        setFeedback({ success: false, message: `Catatan VPS: ${res.error}` });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: `Gagal sinkronisasi VPS: ${err.message}` });
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  useEffect(() => {
    loadSchoolsData();
    loadTeachersData();
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
      loadSchoolsData();
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  const handleExtend = (school: SchoolLicense) => {
    setExtendTargetSchool(school);
  };

  const handleExecuteExtend = () => {
    if (!extendTargetSchool) return;
    const res = schoolLicenseService.extendSchoolLicense(extendTargetSchool.id, 12);
    setFeedback({ success: res.success, message: res.message });
    loadSchoolsData();
    setExtendTargetSchool(null);
  };

  const handleToggleActive = (school: SchoolLicense) => {
    const res = schoolLicenseService.toggleSchoolActive(school.id);
    setFeedback({ success: res.success, message: res.message });
    loadSchoolsData();
  };

  const handleDelete = (school: SchoolLicense) => {
    setDeleteTargetSchool(school);
  };

  const handleExecuteDelete = () => {
    if (!deleteTargetSchool) return;
    const res = schoolLicenseService.deleteSchoolLicense(deleteTargetSchool.id);
    setFeedback({ success: res.success, message: res.message });
    loadSchoolsData();
    setDeleteTargetSchool(null);
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPinModal) return;

    const res = schoolLicenseService.resetOperatorPinBySuperAdmin(showResetPinModal.id, newPinInput);
    if (res.success) {
      setShowResetPinModal(null);
      setNewPinInput('');
      setFeedback({ success: true, message: res.message });
      loadSchoolsData();
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  // --- TEACHER ACTIONS ---
  const handleOpenEditTeacher = (teacher: VpsTeacherUser) => {
    setEditingTeacher(teacher);
    setEditForm({
      fullName: teacher.fullName,
      schoolName: teacher.schoolName,
      npsn: teacher.npsn || '',
      nip: teacher.nip || '',
      subject: teacher.subject,
      whatsappNumber: teacher.whatsappNumber || '',
    });
  };

  const handleSaveEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const res = await superAdminService.updateTeacherProfile(editingTeacher.id, {
      fullName: editForm.fullName,
      schoolName: editForm.schoolName,
      npsn: editForm.npsn,
      nip: editForm.nip,
      subject: editForm.subject,
      whatsappNumber: editForm.whatsappNumber,
    });

    setFeedback({ success: res.success, message: res.message });
    if (res.success) {
      setEditingTeacher(null);
      loadTeachersData();
    }
  };

  const handleExecuteChangeTier = async (newTier: 'free' | 'pro' | 'school') => {
    if (!tierTargetTeacher) return;
    const res = await superAdminService.updateTeacherStatus(tierTargetTeacher.id, tierTargetTeacher.email, newTier);
    setFeedback({ success: res.success, message: res.message });
    setTierTargetTeacher(null);
    loadTeachersData();
  };

  const handleExecuteAssignSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTeacher || !assignTargetSchoolCode) return;

    const res = await superAdminService.assignTeacherToSchool(
      assigningTeacher.id,
      assigningTeacher.email,
      assigningTeacher.fullName,
      assignTargetSchoolCode
    );

    setFeedback({ success: res.success, message: res.message });
    setAssigningTeacher(null);
    setAssignTargetSchoolCode('');
    loadTeachersData();
    loadSchoolsData();
  };

  const handleExecuteDeleteTeacher = async () => {
    if (!deleteTargetTeacher) return;
    const res = await superAdminService.deleteTeacherAccount(deleteTargetTeacher.id, deleteTargetTeacher.email);
    setFeedback({ success: res.success, message: res.message });
    setDeleteTargetTeacher(null);
    loadTeachersData();
  };

  // Filtered Schools
  const filteredSchools = schools.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.schoolName.toLowerCase().includes(q) ||
      s.schoolCode.toLowerCase().includes(q) ||
      s.npsn.includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  });

  // Filtered Teachers
  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      t.fullName.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.schoolName.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      (t.whatsappNumber && t.whatsappNumber.includes(q));

    if (!matchSearch) return false;

    if (teacherFilter === 'independent') return !t.isSchoolAffiliated;
    if (teacherFilter === 'school') return t.isSchoolAffiliated;
    if (teacherFilter === 'pro') return t.subscriptionTier === 'pro';
    if (teacherFilter === 'google') return t.provider === 'google';

    return true;
  });

  // Teacher Counts
  const totalIndependent = teachers.filter(t => !t.isSchoolAffiliated).length;
  const totalAffiliated = teachers.filter(t => t.isSchoolAffiliated).length;
  const totalExamsCreated = teachers.reduce((acc, t) => acc + t.examCount, 0);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const formatWhatsAppLink = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const intl = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
    return `https://wa.me/${intl}`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans select-none animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0 border border-white/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display font-black text-2xl text-white tracking-tight leading-none">
                Platform Super Admin
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-full font-mono text-[10px] font-bold">
                ROOT SAAS
              </span>
              {/* VPS Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>VPS Live {vpsStatus ? `(${vpsStatus.latencyMs}ms)` : ''}</span>
              </div>
            </div>
            <p className="text-xs text-indigo-200 font-sans mt-1.5 leading-relaxed max-w-xl">
              Kontrol penuh lisensi tahunan satuan pendidikan (B2B) dan database seluruh guru pendaftar mandiri dari Supabase VPS.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              loadSchoolsData();
              loadTeachersData();
            }}
            disabled={isLoadingTeachers}
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-semibold text-xs flex items-center gap-2 border border-slate-700/60 transition-all cursor-pointer"
            title="Segarkan data dari database VPS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTeachers ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isLoadingTeachers ? 'Menyinkronkan...' : 'Sinkronkan VPS'}</span>
          </button>

          {activeTab === 'schools' && (
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
                setFeedback(null);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Terbitkan Lisensi Sekolah</span>
            </button>
          )}
        </div>
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
          {feedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. DUAL NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('schools')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'schools'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Lisensi Satuan Pendidikan</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'schools' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300 text-slate-700'
            }`}>
              {schools.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Guru & Pengguna Terdaftar</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'teachers' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300 text-slate-700'
            }`}>
              {teachers.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>Host: api.ujianpintar.online</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SEKOLAH MITRA & LISENSI B2B */}
      {/* ========================================================================= */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          {/* KPI METRICS CARDS */}
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
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Status Server VPS</span>
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-display font-black text-slate-900">
                  100% <span className="text-xs font-semibold text-slate-400 font-sans">Operational</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold block">
                  ✨ Realtime Supabase Sync
                </span>
              </div>
            </div>
          )}

          {/* TABLE OF SCHOOL LICENSES */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
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
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Satuan Pendidikan</th>
                    <th className="px-4 py-3">Kunci Akses / Kode Guru</th>
                    <th className="px-4 py-3">PIN Operator</th>
                    <th className="px-4 py-3">Dewan Guru</th>
                    <th className="px-4 py-3">Masa Aktif (1 Thn)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Tindakan Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchools.map((school) => {
                    const daysRemaining = Math.max(
                      0,
                      Math.ceil((new Date(school.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    );
                    const isExpiringSoon = daysRemaining < 30;

                    return (
                      <tr key={school.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{school.schoolName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            NPSN: {school.npsn || '-'} • {school.city}, {school.province}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg border border-indigo-200/60">
                              {school.schoolCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(school.schoolCode, school.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Salin Kode Lisensi"
                            >
                              {copiedKey === school.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                              {school.operatorPin}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowResetPinModal(school);
                                setNewPinInput(school.operatorPin);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"
                              title="Reset PIN Operator"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {school.registeredTeachers.length} / {school.maxTeachers}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedSchoolForDetails(school)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded text-[10px] font-semibold flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </button>
                          </div>
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (school.registeredTeachers.length / school.maxTeachers) * 100)}%`,
                              }}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900">
                            {new Date(school.endDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <span
                            className={`text-[10px] font-semibold block ${
                              daysRemaining === 0
                                ? 'text-rose-600'
                                : isExpiringSoon
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {daysRemaining === 0 ? 'Kedaluwarsa' : `Sisa ${daysRemaining} Hari`}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(school)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              school.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {school.isActive ? '● Aktif' : '○ Non-Aktif'}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleExtend(school)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            title="Perpanjang Lisensi +1 Tahun"
                          >
                            +1 Tahun
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(school)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Lisensi Sekolah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSchools.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                        Tidak ada lisensi sekolah yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GURU & PENGGUNA TERDAFTAR (LIVE VPS DATABASE) */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {/* KPI METRICS FOR TEACHERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Guru di VPS</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-display font-black text-slate-900">
                {teachers.length} <span className="text-xs font-semibold text-slate-400 font-sans">Pengguna Auth</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block">
                🟢 Terverifikasi di Auth & Profiles VPS
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Guru Mandiri</span>
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-display font-black text-purple-900">
                {totalIndependent} <span className="text-xs font-semibold text-slate-400 font-sans">Akun Individu</span>
              </div>
              <span className="text-[11px] text-purple-600 font-semibold block">
                ⭐ Belum terhubung lisensi B2B
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Terafiliasi Sekolah</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-display font-black text-blue-900">
                {totalAffiliated} <span className="text-xs font-semibold text-slate-400 font-sans">Guru Satuan Pend.</span>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold block">
                🏫 Terhubung lisensi institusi
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Paket Ujian</span>
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-display font-black text-emerald-700">
                {totalExamsCreated} <span className="text-xs font-semibold text-slate-400 font-sans">Ujian Dibuat</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block">
                📑 Tersimpan di database VPS
              </span>
            </div>
          </div>

          {/* TABLE OF REGISTERED TEACHERS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display font-black text-slate-900 text-lg tracking-tight flex items-center gap-2">
                  <span>Data Guru & Pengguna Terdaftar di VPS</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono font-bold">
                    LIVE SUPABASE
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Termasuk pendaftar mandiri via Google / Email, guru terafiliasi sekolah mitra, dan paket ujian aktif.
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Filter Pills */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => setTeacherFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      teacherFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Semua ({teachers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherFilter('independent')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      teacherFilter === 'independent' ? 'bg-white text-purple-700 font-bold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Mandiri ({totalIndependent})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherFilter('school')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      teacherFilter === 'school' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Sekolah ({totalAffiliated})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherFilter('google')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      teacherFilter === 'google' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Google
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    placeholder="Cari nama, email, sekolah..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Nama & Akun Guru</th>
                    <th className="px-4 py-3">Satuan Pendidikan & Mapel</th>
                    <th className="px-4 py-3">Tipe Pendaftaran</th>
                    <th className="px-4 py-3">Status Lisensi</th>
                    <th className="px-4 py-3 text-center">Paket Ujian</th>
                    <th className="px-4 py-3">Waktu Terdaftar</th>
                    <th className="px-4 py-3 text-right">Eksekusi Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Teacher Profile */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {teacher.avatarUrl ? (
                            <img
                              src={teacher.avatarUrl}
                              alt={teacher.fullName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                              {teacher.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{teacher.fullName}</span>
                              {teacher.provider === 'google' && (
                                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-mono font-bold" title="Login dengan Google">
                                  G
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                              <span>{teacher.email}</span>
                              {teacher.whatsappNumber && (
                                <a
                                  href={formatWhatsAppLink(teacher.whatsappNumber)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:underline flex items-center gap-0.5 font-sans"
                                  title="Chat via WhatsApp"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{teacher.whatsappNumber}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* School & Subject */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900">
                          {teacher.schoolName || <span className="text-slate-400 italic">Belum mengisi sekolah</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                          {teacher.subject} {teacher.npsn ? `• NPSN: ${teacher.npsn}` : ''}
                        </div>
                      </td>

                      {/* Registration Type */}
                      <td className="px-4 py-3.5">
                        {teacher.isSchoolAffiliated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Building2 className="w-3 h-3" />
                            <span>Terafiliasi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            <GraduationCap className="w-3 h-3" />
                            <span>Guru Mandiri</span>
                          </span>
                        )}
                      </td>

                      {/* License Tier */}
                      <td className="px-4 py-3.5">
                        {teacher.subscriptionTier === 'pro' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>PRO Mandiri</span>
                          </span>
                        ) : teacher.subscriptionTier === 'school' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <Building2 className="w-3 h-3 text-indigo-600" />
                            <span>Lisensi Sekolah</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Basic (Gratis)</span>
                          </span>
                        )}
                      </td>

                      {/* Exams Count */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg font-mono font-bold text-xs ${
                          teacher.examCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-400 bg-slate-100'
                        }`}>
                          {teacher.examCount} Ujian
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-medium">
                          {new Date(teacher.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {teacher.lastSignInAt && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Login: {new Date(teacher.lastSignInAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </td>

                      {/* Admin Actions */}
                      <td className="px-4 py-3.5 text-right space-x-1">
                        {/* Detail Modal Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherForDetails(teacher)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                          title="Lihat Biodata & Ujian Guru"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Assign School Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningTeacher(teacher);
                            setAssignTargetSchoolCode(schools[0]?.schoolCode || '');
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Tautkan Guru ke Sekolah Mitra"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Set Tier Button */}
                        <button
                          type="button"
                          onClick={() => setTierTargetTeacher(teacher)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          title="Ubah Lisensi Guru (PRO / Basic)"
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Biodata Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeacher(teacher)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Biodata Guru di VPS"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Teacher Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteTargetTeacher(teacher)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Akun dari VPS"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                        {isLoadingTeachers
                          ? 'Sedang memuat data guru dari Supabase VPS...'
                          : 'Tidak ada guru yang cocok dengan pencarian / filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* MODAL 1: TERBITKAN LISENSI SEKOLAH BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-black text-base text-slate-900">
                    Terbitkan Lisensi Sekolah Baru
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Buat kode lisensi 1 tahun untuk satuan pendidikan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Sekolah</label>
                <input
                  type="text"
                  value={formSchoolName}
                  onChange={(e) => setFormSchoolName(e.target.value)}
                  placeholder="Contoh: SMA Negeri 3 Surabaya"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">NPSN</label>
                  <input
                    type="text"
                    value={formNpsn}
                    onChange={(e) => setFormNpsn(e.target.value)}
                    placeholder="8 Digit NPSN"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kota / Kab</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Contoh: Surabaya"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Provinsi</label>
                  <input
                    type="text"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    placeholder="Contoh: Jawa Timur"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kuota Guru</label>
                  <input
                    type="number"
                    value={formMaxTeachers}
                    onChange={(e) => setFormMaxTeachers(Number(e.target.value))}
                    min={1}
                    max={500}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Kunci Akses / Kode Lisensi Dewan Guru</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    ⚡ Generate Otomatis
                  </button>
                </div>
                <input
                  type="text"
                  value={formSchoolCode}
                  onChange={(e) => setFormSchoolCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: SMAN3-SBY-2027"
                  className="w-full h-10 px-3 bg-indigo-50/60 border border-indigo-200 font-mono font-bold text-xs text-indigo-900 rounded-xl uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Master PIN Operator</label>
                  <input
                    type="text"
                    value={formOperatorPin}
                    onChange={(e) => setFormOperatorPin(e.target.value)}
                    placeholder="6 Angka PIN"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-900 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Masa Berlaku</label>
                  <select
                    value={formDurationMonths}
                    onChange={(e) => setFormDurationMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value={12}>1 Tahun (12 Bulan)</option>
                    <option value={24}>2 Tahun (24 Bulan)</option>
                    <option value={6}>6 Bulan (Semester)</option>
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

      {/* MODAL 2: RESET PIN OPERATOR SEKOLAH */}
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

      {/* MODAL 3: VIEW REGISTERED TEACHERS IN SCHOOL */}
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

      {/* MODAL 4: DETAIL PROFIL & UJIAN GURU DARI VPS */}
      {selectedTeacherForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedTeacherForDetails.avatarUrl ? (
                  <img
                    src={selectedTeacherForDetails.avatarUrl}
                    alt={selectedTeacherForDetails.fullName}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {selectedTeacherForDetails.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-display font-black text-base text-slate-900">
                    {selectedTeacherForDetails.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedTeacherForDetails.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeacherForDetails(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Biodata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Satuan Pendidikan</span>
                <span className="font-bold text-slate-800">{selectedTeacherForDetails.schoolName || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Mata Pelajaran</span>
                <span className="font-bold text-slate-800">{selectedTeacherForDetails.subject || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">NPSN / NIP</span>
                <span className="font-mono text-slate-700">{selectedTeacherForDetails.npsn || '-'} / {selectedTeacherForDetails.nip || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Kontak WhatsApp</span>
                {selectedTeacherForDetails.whatsappNumber ? (
                  <a
                    href={formatWhatsAppLink(selectedTeacherForDetails.whatsappNumber)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{selectedTeacherForDetails.whatsappNumber}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Tidak terdata</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Metode Login</span>
                <span className="font-semibold text-slate-700 capitalize">{selectedTeacherForDetails.provider}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Status Lisensi</span>
                <span className="font-bold text-indigo-700 uppercase">{selectedTeacherForDetails.subscriptionTier}</span>
              </div>
            </div>

            {/* Exams list created by this teacher */}
            <div className="space-y-2">
              <h5 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Paket Ujian di Database VPS ({selectedTeacherForDetails.exams.length})</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">Table: public.exams</span>
              </h5>

              {selectedTeacherForDetails.exams.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTeacherForDetails.exams.map((ex) => (
                    <div key={ex.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{ex.title}</div>
                        <div className="text-[11px] text-slate-500 font-sans">
                          {ex.subject} • Token: <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{ex.token}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ex.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400 italic">
                  Belum ada paket ujian yang dibuat oleh guru ini di database VPS.
                </div>
              )}
            </div>

            {/* Action buttons inside modal */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeacherForDetails(null);
                  handleOpenEditTeacher(selectedTeacherForDetails);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                ✏️ Edit Biodata
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeacherForDetails(null);
                  setTierTargetTeacher(selectedTeacherForDetails);
                }}
                className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
              >
                ⭐ Atur Lisensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT BIODATA GURU DI VPS */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-display font-black text-base text-slate-900">
                Edit Biodata Guru di VPS
              </h4>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="space-y-3 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Satuan Pendidikan / Sekolah</label>
                <input
                  type="text"
                  value={editForm.schoolName}
                  onChange={(e) => setEditForm({ ...editForm, schoolName: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">NPSN</label>
                  <input
                    type="text"
                    value={editForm.npsn}
                    onChange={(e) => setEditForm({ ...editForm, npsn: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">NIP</label>
                  <input
                    type="text"
                    value={editForm.nip}
                    onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">No. WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.whatsappNumber}
                    onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20"
                >
                  Simpan ke VPS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: TAUTKAN GURU KE SEKOLAH MITRA */}
      {assigningTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-black text-base text-slate-900">
              Tautkan Guru ke Lisensi Sekolah
            </h4>
            <p className="text-xs text-slate-500 font-sans">
              Hubungkan akun <strong className="text-slate-800">{assigningTeacher.fullName}</strong> ({assigningTeacher.email}) ke salah satu sekolah mitra berlisensi aktif.
            </p>

            <form onSubmit={handleExecuteAssignSchool} className="space-y-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-700">Pilih Sekolah Mitra</label>
                <select
                  value={assignTargetSchoolCode}
                  onChange={(e) => setAssignTargetSchoolCode(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  required
                >
                  {schools.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.schoolCode}>
                      {s.schoolName} ({s.schoolCode}) — {s.registeredTeachers.length}/{s.maxTeachers} Guru
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningTeacher(null)}
                  className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Tautkan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: UBAH STATUS LISENSI GURU (UPGRADE / DOWNGRADE) */}
      {tierTargetTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-black text-base text-slate-900">
              Atur Lisensi Akun Guru
            </h4>
            <p className="text-xs text-slate-500 font-sans">
              Pilih tingkat lisensi untuk <strong className="text-slate-800">{tierTargetTeacher.fullName}</strong>:
            </p>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => handleExecuteChangeTier('pro')}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-colors ${
                  tierTargetTeacher.subscriptionTier === 'pro'
                    ? 'border-amber-400 bg-amber-50/60'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Guru Mandiri PRO</div>
                  <div className="text-[11px] text-slate-500">Akses tanpa batas paket ujian, pembuatan soal AI prioritas, proctoring pro.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteChangeTier('free')}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-colors ${
                  tierTargetTeacher.subscriptionTier === 'free'
                    ? 'border-slate-400 bg-slate-100'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-slate-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Akun Standar / Basic</div>
                  <div className="text-[11px] text-slate-500">Kuota standar gratis pendaftar mandiri.</div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setTierTargetTeacher(null)}
              className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: PERPANJANG LISENSI SEKOLAH */}
      <ConfirmModal
        isOpen={!!extendTargetSchool}
        onClose={() => setExtendTargetSchool(null)}
        onConfirm={handleExecuteExtend}
        title="Perpanjang Lisensi Sekolah?"
        message={
          <span>
            Perpanjang lisensi untuk <strong className="font-bold text-slate-900">&quot;{extendTargetSchool?.schoolName}&quot;</strong> selama <strong>+1 Tahun (12 Bulan)</strong> ke depan? Tanggal kedaluwarsa akan otomatis diperbarui.
          </span>
        }
        confirmText="Ya, Perpanjang +1 Tahun"
        cancelText="Batal"
        variant="primary"
        iconType="check"
      />

      {/* CONFIRM MODAL: HAPUS LISENSI SEKOLAH */}
      <ConfirmModal
        isOpen={!!deleteTargetSchool}
        onClose={() => setDeleteTargetSchool(null)}
        onConfirm={handleExecuteDelete}
        title="Hapus Permanen Lisensi Sekolah?"
        message={
          <span>
            Hapus permanen lisensi <strong className="font-bold text-slate-900">&quot;{deleteTargetSchool?.schoolName}&quot;</strong> dari database? Hubungan akun seluruh dewan guru terdaftar akan terputus dan dikembalikan ke akun Basic. Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Ya, Hapus Permanen"
        cancelText="Batal"
        variant="danger"
        iconType="trash"
      />

      {/* CONFIRM MODAL: HAPUS AKUN GURU DARI VPS */}
      <ConfirmModal
        isOpen={!!deleteTargetTeacher}
        onClose={() => setDeleteTargetTeacher(null)}
        onConfirm={handleExecuteDeleteTeacher}
        title="Hapus Akun Guru dari Supabase VPS?"
        message={
          <span>
            Hapus akun <strong className="font-bold text-slate-900">&quot;{deleteTargetTeacher?.fullName}&quot;</strong> ({deleteTargetTeacher?.email}) secara permanen dari Supabase VPS? Seluruh data profil dan auth akan dihapus.
          </span>
        }
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        variant="danger"
        iconType="trash"
      />
    </div>
  );
};

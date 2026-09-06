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
  Link as LinkIcon,
  Key,
  Download,
  Smartphone,
  MessageCircle
} from 'lucide-react';
import { schoolLicenseService } from '../../services/schoolLicenseService';
import { superAdminService } from '../../services/superAdminService';
import type { VpsTeacherUser, ApkDownloadLead } from '../../services/superAdminService';
import { ConfirmModal } from '../common/ConfirmModal';
import type { SchoolLicense } from '../../types/schoolLicense';

export const SuperAdminDashboard: React.FC = () => {
  // Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<'schools' | 'teachers' | 'downloads'>('schools');

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

  // APK Downloads State
  const [apkDownloads, setApkDownloads] = useState<ApkDownloadLead[]>([]);
  const [isLoadingDownloads, setIsLoadingDownloads] = useState(false);
  const [downloadSearchQuery, setDownloadSearchQuery] = useState('');
  const [deleteTargetDownload, setDeleteTargetDownload] = useState<ApkDownloadLead | null>(null);

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

  const loadDownloadsData = async () => {
    setIsLoadingDownloads(true);
    try {
      const res = await superAdminService.fetchApkDownloads();
      setApkDownloads(res.downloads);
    } catch (err: any) {
      console.warn('Gagal memuat unduhan APK:', err);
    } finally {
      setIsLoadingDownloads(false);
    }
  };

  const handleDeleteDownload = async () => {
    if (!deleteTargetDownload) return;
    try {
      const res = await superAdminService.deleteApkDownload(deleteTargetDownload.id);
      if (res.success) {
        setApkDownloads(prev => prev.filter(d => d.id !== deleteTargetDownload.id));
        setFeedback({ success: true, message: 'Data unduhan berhasil dihapus.' });
      } else {
        setFeedback({ success: false, message: res.message });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: `Gagal menghapus: ${err.message}` });
    } finally {
      setDeleteTargetDownload(null);
    }
  };

  useEffect(() => {
    loadSchoolsData();
    loadTeachersData();
    loadDownloadsData();
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

  const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') return 'GU';
    // Remove degrees and titles like S.Kom, S.Pd, M.Pd, M.Kom, etc. after comma
    const baseName = name.split(',')[0].trim();
    // Remove common prefixes: Bpk, Ibu, Dra, Drs, Dr, H, Hj, Prof
    const cleanName = baseName.replace(/^(?:(?:Bpk|Ibu|Dra|Drs|Dr|H|Hj|Prof)\.?\s+)+/i, '').trim();
    const words = cleanName.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    if (words.length === 1 && words[0].length >= 2) {
      return words[0].slice(0, 2).toUpperCase();
    }
    if (words.length === 1 && words[0].length === 1) {
      return words[0].toUpperCase();
    }
    return (name.slice(0, 2) || 'GU').toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-indigo-600',
      'bg-blue-600',
      'bg-violet-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-teal-600',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans select-none animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER (FLAT DESIGN) */}
      <div className="bg-slate-900 p-6 sm:p-7 rounded-xl text-white border-2 border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 border border-indigo-500">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display font-bold text-2xl text-white tracking-tight leading-none">
                Platform Super Admin
              </h2>
              <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-mono text-[10px] font-bold">
                ROOT SAAS
              </span>
              {/* VPS Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>VPS Live {vpsStatus ? `(${vpsStatus.latencyMs}ms)` : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              loadSchoolsData();
              loadTeachersData();
            }}
            disabled={isLoadingTeachers}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
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
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-none"
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
          className={`p-3.5 rounded-lg border-2 text-xs flex items-center gap-2.5 animate-in fade-in leading-relaxed ${
            feedback.success
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <div className="flex-1 font-semibold">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. DUAL NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('schools')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'schools'
                ? 'bg-white text-indigo-950 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Lisensi Satuan Pendidikan</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
              activeTab === 'schools' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {schools.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-white text-indigo-950 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Guru & Pengguna Terdaftar</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
              activeTab === 'teachers' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {teachers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'downloads'
                ? 'bg-white text-emerald-950 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduhan APK Siswa (Leads)</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
              activeTab === 'downloads' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {apkDownloads.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-600 font-mono flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span>Host: api.ujianpintar.online</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SEKOLAH MITRA & LISENSI B2B */}
      {/* ========================================================================= */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          {/* KPI METRICS CARDS (FLAT DESIGN) */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Total Sekolah Mitra</span>
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-display font-black text-slate-900">
                  {metrics.totalSchools} <span className="text-xs font-semibold text-slate-400 font-sans">Satuan Pendidikan</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block">
                  🟢 {metrics.activeSchools} Sekolah Aktif Berlangganan
                </span>
              </div>

              <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Dewan Guru Terhubung</span>
                  <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-display font-black text-slate-900">
                  {metrics.totalTeachers} <span className="text-xs font-semibold text-slate-400 font-sans">/ {metrics.totalCapacity} Slot</span>
                </div>
                <span className="text-[11px] text-indigo-700 font-bold block">
                  📊 {Math.round((metrics.totalTeachers / (metrics.totalCapacity || 1)) * 100)}% Utilisasi Kuota Guru
                </span>
              </div>

              <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Estimasi Nilai Kontrak</span>
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-display font-black text-emerald-800">
                  {formatRupiah(metrics.estimatedAnnualRevenue)}
                </div>
                <span className="text-[11px] text-slate-500 font-sans block">
                  Perhitungan Rp 1.5Jt / Sekolah / Thn
                </span>
              </div>

              <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Status Server VPS</span>
                  <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-display font-black text-slate-900">
                  100% <span className="text-xs font-semibold text-slate-400 font-sans">Operational</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block">
                  ✨ Realtime Supabase Sync
                </span>
              </div>
            </div>
          )}

          {/* TABLE OF SCHOOL LICENSES (FLAT DESIGN) */}
          <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg tracking-tight">
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
                  className="w-full pl-9 pr-3.5 py-2 bg-white border-2 border-slate-200 rounded-lg text-xs font-sans text-slate-900 focus:outline-none focus:border-indigo-600 transition-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border-2 border-slate-200 rounded-lg">
              <table className="w-full min-w-[980px] text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-mono text-[10px] font-bold border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap min-w-[220px]">Satuan Pendidikan</th>
                    <th className="px-5 py-3 whitespace-nowrap min-w-[250px]">Kunci Akses / Kode Guru</th>
                    <th className="px-4 py-3 whitespace-nowrap min-w-[130px]">PIN Operator</th>
                    <th className="px-4 py-3 whitespace-nowrap min-w-[140px]">Dewan Guru</th>
                    <th className="px-4 py-3 whitespace-nowrap min-w-[140px]">Masa Aktif (1 Thn)</th>
                    <th className="px-4 py-3 whitespace-nowrap min-w-[100px]">Status</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap min-w-[140px]">Tindakan Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSchools.map((school) => {
                    const daysRemaining = Math.max(
                      0,
                      Math.ceil((new Date(school.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    );
                    const isExpiringSoon = daysRemaining < 30;

                    return (
                      <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{school.schoolName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            NPSN: {school.npsn || '-'} • {school.city}, {school.province}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 font-mono font-bold text-xs rounded-md border border-indigo-200 tracking-wide select-all whitespace-nowrap inline-block">
                              {school.schoolCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(school.schoolCode, school.id)}
                              className="flex-shrink-0 p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
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
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                              {school.operatorPin}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowResetPinModal(school);
                                setNewPinInput(school.operatorPin);
                              }}
                              className="p-1 text-slate-500 hover:text-amber-600 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
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
                              className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-md border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </button>
                          </div>
                          <div className="w-24 bg-slate-200 h-1.5 rounded-none overflow-hidden mt-1.5 border border-slate-300">
                            <div
                              className="bg-indigo-600 h-full"
                              style={{
                                width: `${Math.min(100, (school.registeredTeachers.length / school.maxTeachers) * 100)}%`,
                              }}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {new Date(school.endDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <span
                            className={`text-[10px] font-bold block ${
                              daysRemaining === 0
                                ? 'text-rose-700'
                                : isExpiringSoon
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {daysRemaining === 0 ? 'Kedaluwarsa' : `Sisa ${daysRemaining} Hari`}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(school)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border transition-colors ${
                              school.isActive
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {school.isActive ? '● Aktif' : '○ Non-Aktif'}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleExtend(school)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-bold transition-colors cursor-pointer"
                            title="Perpanjang Lisensi +1 Tahun"
                          >
                            +1 Tahun
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(school)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-colors cursor-pointer"
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
          {/* KPI METRICS FOR TEACHERS (FLAT DESIGN) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Total Guru di VPS</span>
                <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-black text-slate-900">
                {teachers.length} <span className="text-xs font-semibold text-slate-400 font-sans">Pengguna Auth</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold block">
                🟢 Terverifikasi di Auth & Profiles VPS
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Guru Mandiri</span>
                <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-black text-purple-900">
                {totalIndependent} <span className="text-xs font-semibold text-slate-400 font-sans">Akun Individu</span>
              </div>
              <span className="text-[11px] text-purple-700 font-bold block">
                ⭐ Belum terhubung lisensi B2B
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Terafiliasi Sekolah</span>
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-black text-blue-900">
                {totalAffiliated} <span className="text-xs font-semibold text-slate-400 font-sans">Guru Satuan Pend.</span>
              </div>
              <span className="text-[11px] text-blue-700 font-bold block">
                🏫 Terhubung lisensi institusi
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Total Paket Ujian</span>
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-black text-emerald-800">
                {totalExamsCreated} <span className="text-xs font-semibold text-slate-400 font-sans">Ujian Dibuat</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold block">
                📑 Tersimpan di database VPS
              </span>
            </div>
          </div>

          {/* TABLE OF REGISTERED TEACHERS (FLAT DESIGN) */}
          <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg tracking-tight flex items-center gap-2">
                  <span>Data Guru & Pengguna Terdaftar di VPS</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-mono text-[10px] font-bold">
                    LIVE SUPABASE
                  </span>
                </h3>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Filter Pills */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => setTeacherFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      teacherFilter === 'all' ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-xs' : 'hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    Semua ({teachers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherFilter('independent')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      teacherFilter === 'independent' ? 'bg-white text-purple-800 font-bold border border-slate-300 shadow-xs' : 'hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    Mandiri ({totalIndependent})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherFilter('school')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      teacherFilter === 'school' ? 'bg-white text-blue-800 font-bold border border-slate-300 shadow-xs' : 'hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    Sekolah ({totalAffiliated})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherFilter('google')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      teacherFilter === 'google' ? 'bg-white text-emerald-800 font-bold border border-slate-300 shadow-xs' : 'hover:text-slate-900 hover:bg-slate-200/50'
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
                    className="w-full pl-9 pr-3.5 py-2 bg-white border-2 border-slate-200 rounded-lg text-xs font-sans text-slate-900 focus:outline-none focus:border-indigo-600 transition-none"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border-2 border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-mono text-[10px] font-bold border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Nama & Akun Guru</th>
                    <th className="px-4 py-3">Satuan Pendidikan & Mapel</th>
                    <th className="px-4 py-3">Tipe Pendaftaran</th>
                    <th className="px-4 py-3">Status Lisensi</th>
                    <th className="px-4 py-3 text-center">Paket Ujian</th>
                    <th className="px-4 py-3">Waktu Terdaftar</th>
                    <th className="px-4 py-3 text-center">Eksekusi Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                      {/* Teacher Profile */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Card Inisial Nama (Flat Color) */}
                          <div
                            className={`w-9 h-9 rounded-lg ${getAvatarColor(teacher.fullName)} text-white font-bold flex items-center justify-center text-xs flex-shrink-0 tracking-wider border border-black/10 select-none`}
                            title={teacher.fullName}
                          >
                            {getInitials(teacher.fullName || teacher.email)}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {/* Nama Guru (size text-xs sama dengan nama sekolah) */}
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 leading-tight">
                              <span>{teacher.fullName}</span>
                              {teacher.provider === 'google' && (
                                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[9px] font-mono font-bold" title="Login dengan Google">
                                  G
                                </span>
                              )}
                            </div>
                            {/* No WA di bawah nama tersusun vertikal */}
                            {teacher.whatsappNumber ? (
                              <a
                                href={formatWhatsAppLink(teacher.whatsappNumber)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-bold flex items-center gap-1 w-fit mt-0.5"
                                title="Hubungi via WhatsApp"
                              >
                                <Phone className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                                <span className="font-mono">{teacher.whatsappNumber}</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No WA belum terisi</span>
                            )}
                            {/* Email */}
                            <div className="text-[11px] text-slate-500 font-mono leading-tight">
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* School, Subject & NPSN - Vertically Stacked */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="font-bold text-slate-900 text-xs leading-tight">
                            {teacher.schoolName || <span className="text-slate-400 font-normal italic">Belum mengisi sekolah</span>}
                          </div>
                          <div className="text-xs text-indigo-700 font-semibold leading-tight">
                            {teacher.subject || 'Pengajar'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono leading-tight">
                            NPSN: <span className="text-slate-800 font-semibold">{teacher.npsn || '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Registration Type */}
                      <td className="px-4 py-3.5">
                        {teacher.isSchoolAffiliated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
                            <Building2 className="w-3 h-3" />
                            <span>Terafiliasi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-300">
                            <GraduationCap className="w-3 h-3" />
                            <span>Guru Mandiri</span>
                          </span>
                        )}
                      </td>

                      {/* License Tier */}
                      <td className="px-4 py-3.5">
                        {teacher.subscriptionTier === 'pro' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>PRO Mandiri</span>
                          </span>
                        ) : teacher.subscriptionTier === 'school' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-300">
                            <Building2 className="w-3 h-3 text-indigo-600" />
                            <span>Lisensi Sekolah</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            <span>Basic (Gratis)</span>
                          </span>
                        )}
                      </td>

                      {/* Exams Count */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                          teacher.examCount > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'text-slate-400 bg-slate-100 border border-slate-200'
                        }`}>
                          {teacher.examCount} Ujian
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-900 font-semibold">
                          {new Date(teacher.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {teacher.lastSignInAt && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Login: {new Date(teacher.lastSignInAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </td>

                      {/* Admin Actions - 2 Susun & Alignment Center */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {/* Baris 1: Detail, Tautkan Sekolah, Atur Lisensi */}
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedTeacherForDetails(teacher)}
                              className="w-7 h-7 flex items-center justify-center text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                              title="Lihat Biodata & Ujian Guru"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAssigningTeacher(teacher);
                                setAssignTargetSchoolCode(schools[0]?.schoolCode || '');
                              }}
                              className="w-7 h-7 flex items-center justify-center text-blue-700 hover:text-blue-900 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                              title="Tautkan Guru ke Sekolah Mitra"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setTierTargetTeacher(teacher)}
                              className="w-7 h-7 flex items-center justify-center text-amber-700 hover:text-amber-900 bg-amber-50/70 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors cursor-pointer"
                              title="Ubah Lisensi Guru (PRO / Basic)"
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Baris 2: Edit Biodata, Hapus Akun */}
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTeacher(teacher)}
                              className="w-7 h-7 flex items-center justify-center text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors cursor-pointer"
                              title="Edit Biodata Guru di VPS"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTargetTeacher(teacher)}
                              className="w-7 h-7 flex items-center justify-center text-rose-700 hover:text-rose-900 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                              title="Hapus Akun dari VPS"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
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
      {/* TAB 3: UNDUHAN APK SISWA & LEADS (LIVE VPS DATABASE) */}
      {/* ========================================================================= */}
      {activeTab === 'downloads' && (
        <div className="space-y-6">
          {/* KPI METRICS FOR DOWNLOADS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Total Unduhan APK</span>
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Download className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-slate-900">{apkDownloads.length}</span>
                <span className="text-xs text-slate-500 font-sans">Siswa/Guru</span>
              </div>
              <p className="text-[11px] text-slate-500">Total data pendaftar unduhan di Supabase VPS.</p>
            </div>

            <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Kontak WhatsApp Terdata</span>
                <div className="w-7 h-7 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <MessageCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-teal-700">
                  {apkDownloads.filter(d => d.whatsapp && d.whatsapp.length >= 10).length}
                </span>
                <span className="text-xs text-teal-600 font-sans">Nomor Aktif</span>
              </div>
              <p className="text-[11px] text-slate-500">Siap dihubungi via WA broadcast atau notifikasi ujian.</p>
            </div>

            <div className="p-5 bg-white rounded-xl border-2 border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Unduhan Hari Ini</span>
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-blue-700">
                  {apkDownloads.filter(d => {
                    const today = new Date().toDateString();
                    return new Date(d.created_at).toDateString() === today;
                  }).length}
                </span>
                <span className="text-xs text-blue-600 font-sans">Hari Ini</span>
              </div>
              <p className="text-[11px] text-slate-500">Aktivitas instalasi APK tanggal {new Date().toLocaleDateString('id-ID')}.</p>
            </div>
          </div>

          {/* SEARCH & ACTIONS BAR */}
          <div className="bg-white p-4 rounded-xl border-2 border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={downloadSearchQuery}
                  onChange={(e) => setDownloadSearchQuery(e.target.value)}
                  placeholder="Cari email siswa atau nomor WhatsApp..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={loadDownloadsData}
                  disabled={isLoadingDownloads}
                  className="h-9 px-3.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDownloads ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </button>
              </div>
            </div>

            {/* DOWNLOADS TABLE */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3">Email Pengunduh</th>
                    <th className="px-4 py-3">Nomor WhatsApp</th>
                    <th className="px-4 py-3">Waktu Unduh</th>
                    <th className="px-4 py-3">Informasi Perangkat</th>
                    <th className="px-4 py-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {apkDownloads
                    .filter(d => 
                      d.email.toLowerCase().includes(downloadSearchQuery.toLowerCase()) || 
                      d.whatsapp.includes(downloadSearchQuery)
                    )
                    .map((item, index) => {
                      const cleanWa = item.whatsapp.replace(/[^0-9]/g, '');
                      const waLink = `https://wa.me/${cleanWa}?text=${encodeURIComponent('Halo, terima kasih sudah mengunduh aplikasi UjianPintar Android. Apakah ada kendala saat instalasi atau login token ujian?')}`;
                      
                      let dateStr = '-';
                      try {
                        dateStr = new Date(item.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        });
                      } catch (_) {}

                      // Sederhanakan User-Agent
                      let deviceSummary = item.user_agent || 'Perangkat Android';
                      if (deviceSummary.includes('Android')) {
                        deviceSummary = '📱 Android Device';
                      } else if (deviceSummary.includes('iPhone') || deviceSummary.includes('iPad')) {
                        deviceSummary = '🍎 iOS / Safari';
                      } else if (deviceSummary.includes('Windows')) {
                        deviceSummary = '💻 Windows PC';
                      }

                      return (
                        <tr key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-center text-slate-400 font-mono text-[11px]">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.email}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {item.whatsapp}
                              </span>
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Kirim Pesan WhatsApp ke Nomor Ini"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Chat WA</span>
                              </a>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[11px] truncate max-w-xs" title={item.user_agent}>
                            {deviceSummary}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setDeleteTargetDownload(item)}
                              className="w-7 h-7 inline-flex items-center justify-center text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                              title="Hapus Data Unduhan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                  {apkDownloads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                        {isLoadingDownloads
                          ? 'Sedang memuat data unduhan dari VPS...'
                          : 'Belum ada data unduhan APK tercatat di database VPS.'}
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
      {/* MODALS SECTION (FLAT DESIGN) */}
      {/* ========================================================================= */}

      {/* MODAL 1: TERBITKAN LISENSI SEKOLAH BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-slate-900">
                    Terbitkan Lisensi Sekolah Baru
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Buat kode lisensi tahunan untuk satuan pendidikan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="p-6 space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nama Sekolah</label>
                <input
                  type="text"
                  value={formSchoolName}
                  onChange={(e) => setFormSchoolName(e.target.value)}
                  placeholder="Contoh: SMA Negeri 3 Surabaya"
                  className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">NPSN</label>
                  <input
                    type="text"
                    value={formNpsn}
                    onChange={(e) => setFormNpsn(e.target.value)}
                    placeholder="8 Digit NPSN"
                    className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Kota / Kab</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Contoh: Surabaya"
                    className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Provinsi</label>
                  <input
                    type="text"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    placeholder="Contoh: Jawa Timur"
                    className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Kuota Guru</label>
                  <input
                    type="number"
                    value={formMaxTeachers}
                    onChange={(e) => setFormMaxTeachers(Number(e.target.value))}
                    min={1}
                    max={500}
                    className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Kunci Akses / Kode Lisensi Dewan Guru</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    ⚡ Generate Otomatis
                  </button>
                </div>
                <input
                  type="text"
                  value={formSchoolCode}
                  onChange={(e) => setFormSchoolCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: SMAN3-SBY-2027"
                  className="w-full h-10 px-3 bg-indigo-50/70 border-2 border-indigo-200 focus:border-indigo-600 focus:outline-none font-mono font-bold text-xs text-indigo-900 rounded-lg uppercase transition-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Master PIN Operator</label>
                  <input
                    type="text"
                    value={formOperatorPin}
                    onChange={(e) => setFormOperatorPin(e.target.value)}
                    placeholder="6 Angka PIN"
                    className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none font-mono font-bold text-xs text-slate-900 rounded-lg transition-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Masa Berlaku</label>
                  <select
                    value={formDurationMonths}
                    onChange={(e) => setFormDurationMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  >
                    <option value={12}>1 Tahun (12 Bulan)</option>
                    <option value={24}>2 Tahun (24 Bulan)</option>
                    <option value={6}>6 Bulan (Semester)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">
                    Reset PIN Operator
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans truncate">
                    {showResetPinModal.schoolName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPinModal(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewPin} className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                PIN ini digunakan oleh operator sekolah untuk mengakses dashboard manajemen dewan guru.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Master PIN Baru</label>
                <input
                  type="text"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Masukkan 6 angka PIN baru (contoh: 889900)"
                  className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-amber-600 focus:outline-none rounded-lg text-xs font-mono font-bold text-slate-900 transition-none"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowResetPinModal(null)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-base text-slate-900 truncate">
                    {selectedSchoolForDetails.schoolName}
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Dewan Guru Terdaftar ({selectedSchoolForDetails.registeredTeachers.length} / {selectedSchoolForDetails.maxTeachers} Guru)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchoolForDetails(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-2.5 flex-1 font-sans">
              {selectedSchoolForDetails.registeredTeachers.length > 0 ? (
                selectedSchoolForDetails.registeredTeachers.map((t, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-none">
                    <div>
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.email}</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {new Date(t.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
                  Belum ada guru yang mengaktivasi kode lisensi sekolah ini.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSchoolForDetails(null)}
                className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DETAIL PROFIL & UJIAN GURU DARI VPS */}
      {selectedTeacherForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm tracking-wider select-none flex-shrink-0">
                  {getInitials(selectedTeacherForDetails.fullName || selectedTeacherForDetails.email)}
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-slate-900">
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
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 font-sans">
              {/* Biodata Grid - Flat Style */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Satuan Pendidikan</span>
                  <span className="font-bold text-slate-900">{selectedTeacherForDetails.schoolName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Mata Pelajaran</span>
                  <span className="font-bold text-slate-900">{selectedTeacherForDetails.subject || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">NPSN / NIP</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedTeacherForDetails.npsn || '-'} / {selectedTeacherForDetails.nip || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Kontak WhatsApp</span>
                  {selectedTeacherForDetails.whatsappNumber ? (
                    <a
                      href={formatWhatsAppLink(selectedTeacherForDetails.whatsappNumber)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{selectedTeacherForDetails.whatsappNumber}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Tidak terdata</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Metode Login</span>
                  <span className="font-bold text-slate-800 capitalize">{selectedTeacherForDetails.provider}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Status Lisensi</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold uppercase text-[10px]">
                    {selectedTeacherForDetails.subscriptionTier}
                  </span>
                </div>
              </div>

              {/* Exams list created by this teacher */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Paket Ujian di Database VPS ({selectedTeacherForDetails.exams.length})
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">public.exams</span>
                </div>

                {selectedTeacherForDetails.exams.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedTeacherForDetails.exams.map((ex) => (
                      <div key={ex.id} className="p-3 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{ex.title}</div>
                          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                            {ex.subject} • Token: <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{ex.token}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {ex.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-center text-xs text-slate-500">
                    Belum ada paket ujian yang dibuat oleh guru ini di database VPS.
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons inside modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeacherForDetails(null);
                  handleOpenEditTeacher(selectedTeacherForDetails);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                ✏️ Edit Biodata
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeacherForDetails(null);
                  setTierTargetTeacher(selectedTeacherForDetails);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                ⭐ Atur Lisensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT BIODATA GURU DI VPS */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-slate-900">
                    Edit Biodata Guru di VPS
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Perbarui profil guru langsung pada database server.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="p-6 space-y-3.5 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full h-9 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Satuan Pendidikan / Sekolah</label>
                <input
                  type="text"
                  value={editForm.schoolName}
                  onChange={(e) => setEditForm({ ...editForm, schoolName: e.target.value })}
                  className="w-full h-9 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">NPSN</label>
                  <input
                    type="text"
                    value={editForm.npsn}
                    onChange={(e) => setEditForm({ ...editForm, npsn: e.target.value })}
                    className="w-full h-9 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">NIP</label>
                  <input
                    type="text"
                    value={editForm.nip}
                    onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                    className="w-full h-9 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full h-9 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">No. WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.whatsappNumber}
                    onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-9 px-3 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-slate-900">
                    Tautkan Guru ke Lisensi Sekolah
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Hubungkan akun ke sekolah mitra berlisensi aktif.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTeacher(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAssignSchool} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                Menghubungkan akun <strong className="font-bold text-slate-900">{assigningTeacher.fullName}</strong> ({assigningTeacher.email}) ke sekolah mitra.
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700">Pilih Sekolah Mitra</label>
                <select
                  value={assignTargetSchoolCode}
                  onChange={(e) => setAssignTargetSchoolCode(e.target.value)}
                  className="w-full h-10 px-3 bg-white border-2 border-slate-200 focus:border-blue-600 focus:outline-none rounded-lg text-xs text-slate-900 transition-none"
                  required
                >
                  {schools.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.schoolCode}>
                      {s.schoolName} ({s.schoolCode}) — {s.registeredTeachers.length}/{s.maxTeachers} Guru
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAssigningTeacher(null)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Atur Lisensi Akun Guru
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans truncate">
                    {tierTargetTeacher.fullName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTierTargetTeacher(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 font-sans">
                Pilih tingkat lisensi yang ingin diterapkan:
              </p>

              <div className="space-y-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleExecuteChangeTier('pro')}
                  className={`w-full p-3.5 rounded-lg border-2 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    tierTargetTeacher.subscriptionTier === 'pro'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-950'
                      : 'border-slate-200 hover:border-amber-400 bg-white text-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Guru Mandiri PRO</span>
                      {tierTargetTeacher.subscriptionTier === 'pro' && (
                        <span className="text-[9px] font-bold uppercase bg-amber-600 text-white px-1.5 py-0.5 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Akses tanpa batas paket ujian, pembuatan soal AI prioritas, proctoring pro.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteChangeTier('free')}
                  className={`w-full p-3.5 rounded-lg border-2 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    tierTargetTeacher.subscriptionTier === 'free'
                      ? 'border-slate-600 bg-slate-100 text-slate-900'
                      : 'border-slate-200 hover:border-slate-400 bg-white text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Akun Standar / Basic</span>
                      {tierTargetTeacher.subscriptionTier === 'free' && (
                        <span className="text-[9px] font-bold uppercase bg-slate-700 text-white px-1.5 py-0.5 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Kuota standar gratis untuk guru mandiri.
                    </div>
                  </div>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTierTargetTeacher(null)}
                  className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
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
        flat={true}
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
        flat={true}
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
        flat={true}
      />

      {/* CONFIRM MODAL: HAPUS DATA UNDUHAN APK */}
      <ConfirmModal
        isOpen={!!deleteTargetDownload}
        onClose={() => setDeleteTargetDownload(null)}
        onConfirm={handleDeleteDownload}
        title="Hapus Data Unduhan APK?"
        message={
          <span>
            Hapus data unduhan untuk <strong className="font-bold text-slate-900">&quot;{deleteTargetDownload?.email}&quot;</strong> ({deleteTargetDownload?.whatsapp}) dari log database Supabase VPS?
          </span>
        }
        confirmText="Ya, Hapus Data"
        cancelText="Batal"
        variant="danger"
        iconType="trash"
        flat={true}
      />
    </div>
  );
};

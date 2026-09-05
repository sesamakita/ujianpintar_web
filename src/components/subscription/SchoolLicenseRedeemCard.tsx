import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  LogOut, 
  Check,
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { schoolLicenseService } from '../../services/schoolLicenseService';
import { ConfirmModal } from '../common/ConfirmModal';
import type { ActiveSchoolMembership, SchoolLicense } from '../../types/schoolLicense';
import type { TeacherSubscription } from '../../types/subscription';

interface SchoolLicenseRedeemCardProps {
  currentUser: {
    name: string;
    email: string;
    school: string;
  };
  onSubscriptionUpdated: (updatedSub: TeacherSubscription) => void;
}

export const SchoolLicenseRedeemCard: React.FC<SchoolLicenseRedeemCardProps> = ({
  currentUser,
  onSubscriptionUpdated,
}) => {
  const [licenseCode, setLicenseCode] = useState('');
  const [membership, setMembership] = useState<ActiveSchoolMembership | null>(null);
  const [schoolDetails, setSchoolDetails] = useState<SchoolLicense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');

  // Operator State & Modals
  const [isOperatorMode, setIsOperatorMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [operatorPinInput, setOperatorPinInput] = useState('');
  const [showResetCodeModal, setShowResetCodeModal] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [kickTeacherTarget, setKickTeacherTarget] = useState<{ email: string; name: string } | null>(null);
  const [isLeaveSchoolConfirmOpen, setIsLeaveSchoolConfirmOpen] = useState(false);

  const loadMembershipData = () => {
    const active = schoolLicenseService.getActiveMembership();
    setMembership(active);
    if (active) {
      const details = schoolLicenseService.getSchoolDetails(active.schoolId);
      setSchoolDetails(details);
      setIsOperatorMode(Boolean(active.isOperator));
    } else {
      setSchoolDetails(null);
      setIsOperatorMode(false);
    }
  };

  useEffect(() => {
    loadMembershipData();
  }, []);

  const handleRedeem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!licenseCode.trim()) {
      setFeedback({
        success: false,
        message: 'Harap masukkan kode lisensi sekolah.',
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    const result = schoolLicenseService.redeemSchoolCode(licenseCode, {
      email: currentUser.email,
      name: currentUser.name,
    });

    setIsLoading(false);

    if (result.success && result.membership) {
      setMembership(result.membership);
      setIsOperatorMode(Boolean(result.isOperator));
      if (result.school) {
        setSchoolDetails(result.school);
      } else {
        loadMembershipData();
      }

      setFeedback({
        success: true,
        message: result.message,
      });
      setLicenseCode('');

      // Reload updated subscription to parent
      const updatedSub: TeacherSubscription = {
        tier: 'school',
        status: 'active',
        planName: `Paket Lisensi ${result.membership.schoolName}`,
        billingCycle: 'yearly',
        startedAt: new Date().toISOString(),
        expiresAt: result.membership.expiresAt,
        daysRemaining: result.membership.daysRemaining,
        isTrial: false,
        schoolNpsn: result.membership.npsn,
        maxExamsPerMonth: -1,
        maxStudentsPerExam: -1,
        canUseCustomLogo: true,
        canExportAdvanced: true,
        canUseFullscreenLock: true,
      };
      onSubscriptionUpdated(updatedSub);
    } else {
      setFeedback({
        success: false,
        message: result.message,
      });
    }
  };

  const handleUnlockOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership) return;

    const res = schoolLicenseService.unlockOperatorRole(membership.schoolId, operatorPinInput);
    if (res.success) {
      setIsOperatorMode(true);
      setShowPinModal(false);
      setOperatorPinInput('');
      setFeedback({
        success: true,
        message: 'Mode Operator Aktif! Anda kini memiliki hak untuk mengeluarkan akun bodong dan mereset kode lisensi.',
      });
      loadMembershipData();
    } else {
      setFeedback({
        success: false,
        message: res.message,
      });
    }
  };

  const handleKickTeacher = (teacherEmailToKick: string, teacherNameToKick: string) => {
    setKickTeacherTarget({ email: teacherEmailToKick, name: teacherNameToKick });
  };

  const handleExecuteKickTeacher = () => {
    if (!membership || !kickTeacherTarget) return;
    const res = schoolLicenseService.kickTeacherFromSchool(membership.schoolId, kickTeacherTarget.email);
    setFeedback({
      success: res.success,
      message: res.message,
    });
    if (res.success) {
      loadMembershipData();
    }
    setKickTeacherTarget(null);
  };

  const handleResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership) return;

    const res = schoolLicenseService.resetSchoolCode(membership.schoolId, newCodeInput);
    if (res.success) {
      setShowResetCodeModal(false);
      setNewCodeInput('');
      setFeedback({
        success: true,
        message: res.message,
      });
      loadMembershipData();
    } else {
      setFeedback({
        success: false,
        message: res.message,
      });
    }
  };

  const handleLeaveSchool = () => {
    setIsLeaveSchoolConfirmOpen(true);
  };

  const handleExecuteLeaveSchool = () => {
    schoolLicenseService.leaveSchoolMembership(currentUser.email);
    setMembership(null);
    setSchoolDetails(null);
    setIsOperatorMode(false);
    setFeedback({
      success: true,
      message: 'Akun berhasil dilepas dari lisensi sekolah. Status kembali ke paket Basic.',
    });

    const basicSub: TeacherSubscription = {
      tier: 'free',
      status: 'free',
      planName: 'Paket Guru Basic',
      startedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      daysRemaining: 0,
      isTrial: false,
      maxExamsPerMonth: 3,
      maxStudentsPerExam: 40,
      canUseCustomLogo: false,
      canExportAdvanced: false,
      canUseFullscreenLock: false,
    };
    onSubscriptionUpdated(basicSub);
    setIsLeaveSchoolConfirmOpen(false);
  };

  const demoCodes = ['SMAN1-JKT-2027', 'SMPN2-BDG-2027', 'SEKOLAH-JUARA-2027'];

  // Filter registered teachers by search query
  const registeredTeachers = schoolDetails?.registeredTeachers || [];
  const maxTeachers = schoolDetails?.maxTeachers || 50;
  const filteredTeachers = registeredTeachers.filter((t) => {
    const q = teacherSearch.toLowerCase().trim();
    return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
  });

  const getInitials = (name: string) => {
    const parts = name.replace(/Bpk\.|Ibu|Dr\.|Dra\.|Drs\.|Hj\.|H\.|S\.Pd\.|M\.Pd\.|S\.Si\.|M\.Kom\./g, '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.substring(0, 2) || 'GU').toUpperCase();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans relative">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
            <Building2 className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-black text-base text-white tracking-tight">
                Aktivasi Lisensi Sekolah (Paket 1 Tahun)
              </h4>
              <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 rounded-md text-[10px] font-mono font-bold">
                OPSI KODE LISENSI
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 font-sans mt-0.5">
              Hubungkan akun guru Anda dengan langganan tahunan resmi yang telah dibayar oleh sekolah
            </p>
          </div>
        </div>

        {membership && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              TERHUBUNG KE SEKOLAH
            </span>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
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
            <div className="flex-1">{feedback.message}</div>
          </div>
        )}

        {/* State A: Currently Linked to an Active School */}
        {membership ? (
          <div className="space-y-5">
            {/* 1. Main School Summary Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-slate-50 border border-emerald-200 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
                <div>
                  <span className="text-[10px] font-display font-bold text-emerald-700 uppercase tracking-wider block">
                    Satuan Pendidikan Resmi:
                  </span>
                  <h3 className="text-lg font-display font-black text-slate-900 tracking-tight">
                    {membership.schoolName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                    <span>NPSN: <strong>{membership.npsn || '-'}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <span>Kode Lisensi:</span>
                      <code className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold text-emerald-800">{membership.schoolCode}</code>
                      {isOperatorMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewCodeInput(membership.schoolCode);
                            setShowResetCodeModal(true);
                          }}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Ganti kode lisensi jika bocor"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Ganti Kode
                        </button>
                      )}
                    </span>
                  </div>
                </div>

                {/* Right Side: Days Remaining & Operator Mode Switcher */}
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <div className="bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-2xs text-left sm:text-right space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sisa Masa Berlaku</span>
                    <div className="text-sm font-display font-black text-emerald-700 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{membership.daysRemaining} Hari Lagi</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-sans block">
                      Hingga {new Date(membership.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Operator Role Pill / Unlock Button */}
                  {isOperatorMode ? (
                    <div className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>Mode Operator Aktif (Bisa Kick Akun)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPinModal(true)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Buka hak akses Operator dengan PIN Master"
                    >
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Masuk Mode Operator</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Unlocked School Features List */}
              <div className="space-y-2">
                <span className="text-xs font-display font-bold text-slate-800 uppercase tracking-wider block">
                  ✨ Hak Akses & Fasilitas Sekolah yang Aktif:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-emerald-100/80">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3] flex-shrink-0" />
                    <span>Semua Akun Guru Berstatus PRO</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-emerald-100/80">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3] flex-shrink-0" />
                    <span>Unlimited Kapasitas Siswa & Sesi Ujian</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-emerald-100/80">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3] flex-shrink-0" />
                    <span>Kop Surat & Logo Resmi di Lembar Ujian</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-emerald-100/80">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3] flex-shrink-0" />
                    <span>Ekspor Raport Nilai Excel (.xlsx) Lengkap</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TRANSPARENCY ROSTER & OPERATOR KICK MANAGEMENT */}
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                      <span>Daftar Guru Terdaftar dengan Lisensi Ini</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-mono text-[10px]">
                        {registeredTeachers.length} / {maxTeachers} Guru
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      {isOperatorMode
                        ? 'Sebagai Operator, Anda dapat mengeluarkan akun bodong atau yang bukan berasal dari sekolah Anda.'
                        : `Seluruh dewan guru ${membership.schoolName} dapat memantau daftar ini untuk transparansi lisensi.`}
                    </p>
                  </div>
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Cari nama atau email guru..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Progress bar quota */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Slot Kuota Dewan Guru:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {registeredTeachers.length} dari {maxTeachers} Guru ({Math.round((registeredTeachers.length / maxTeachers) * 100)}% Terpakai)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (registeredTeachers.length / maxTeachers) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Teachers Roster List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-hover">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher, idx) => {
                    const isSelf = teacher.email.toLowerCase() === currentUser.email.toLowerCase();
                    const isTeacherOp = teacher.role === 'operator';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isSelf
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/30'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display flex-shrink-0 ${
                            isSelf ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {getInitials(teacher.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-xs text-slate-900 truncate">
                                {teacher.name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded text-[9px] font-bold font-mono flex items-center gap-0.5">
                                  <UserCheck className="w-2.5 h-2.5" /> Akun Anda
                                </span>
                              )}
                              {isTeacherOp && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-bold font-mono">
                                  Operator
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono truncate block">
                              {teacher.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] text-slate-400 font-sans block">Terdaftar:</span>
                            <span className="text-[11px] font-mono text-slate-700 font-semibold">
                              {new Date(teacher.joinedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          {/* Operator Action: Kick Button */}
                          {isOperatorMode && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleKickTeacher(teacher.email, teacher.name)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title={`Keluarkan ${teacher.name} dari lisensi sekolah`}
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Keluarkan</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                    Tidak ada guru yang cocok dengan pencarian "{teacherSearch}".
                  </div>
                )}
              </div>

              {/* Security & Verification Guarantee Banner */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Jaminan Keamanan & Pengawasan Mandiri:</strong> Seluruh dewan guru di <strong>{membership.schoolName}</strong> dapat memantau daftar ini secara terbuka untuk memastikan lisensi hanya digunakan oleh guru resmi sekolah dan mencegah akun bodong dari luar.
                </div>
              </div>
            </div>

            {/* Leave School Button */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleLeaveSchool}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti / Lepas Akun dari Sekolah Ini</span>
              </button>
            </div>
          </div>
        ) : (
          /* State B: Not Linked - Input Form */
          <div className="space-y-4">
            <form onSubmit={handleRedeem} className="space-y-3">
              <div>
                <label className="block text-xs font-display font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Masukkan Kode Lisensi Sekolah Anda:
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={licenseCode}
                      onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: SMAN1-JKT-2027"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors tracking-wider"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !licenseCode.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex-shrink-0"
                  >
                    {isLoading ? (
                      <span>Memverifikasi...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Aktivasi Lisensi Sekolah</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Helper chips */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-700 block text-[11px]">
                  💡 Contoh Kode Lisensi Demo untuk Uji Coba:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {demoCodes.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setLicenseCode(code);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-mono font-bold text-emerald-800 transition-colors cursor-pointer"
                      title="Klik untuk mencoba kode ini"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* POPUP MODAL 1: UNLOCK OPERATOR ROLE VIA PIN MASTER */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Buka Hak Akses Operator
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans">
                    {membership?.schoolName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUnlockOperator} className="space-y-3">
              <div>
                <label className="block text-xs font-display font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Masukkan PIN Master Operator:
                </label>
                <input
                  type="password"
                  value={operatorPinInput}
                  onChange={(e) => setOperatorPinInput(e.target.value)}
                  placeholder="PIN Master (Demo: 123456)"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  autoFocus
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  💡 PIN Demo untuk pengujian: <code className="font-mono font-bold text-amber-800">123456</code>
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Verifikasi PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: RESET / GANTI KODE LISENSI SEKOLAH */}
      {showResetCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Ganti Kode Lisensi Sekolah
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Gunakan jika kode lama bocor ke pihak luar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetCodeModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetCode} className="space-y-3">
              <div>
                <label className="block text-xs font-display font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Kode Lisensi Baru:
                </label>
                <input
                  type="text"
                  value={newCodeInput}
                  onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: SMAN1-JKT-V2"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  autoFocus
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Guru yang sudah terdaftar tidak akan dikeluarkan. Hanya pendaftar baru yang wajib menggunakan kode baru ini.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetCodeModal(false)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Kode Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Kick Teacher Confirm Dialog */}
      <ConfirmModal
        isOpen={!!kickTeacherTarget}
        onClose={() => setKickTeacherTarget(null)}
        onConfirm={handleExecuteKickTeacher}
        title="Keluarkan Guru dari Lisensi Sekolah?"
        message={
          <span>
            Keluarkan <strong className="font-bold text-slate-900">&quot;{kickTeacherTarget?.name}&quot;</strong> ({kickTeacherTarget?.email}) dari lisensi {membership?.schoolName}? Akun ini tidak akan lagi memiliki hak akses PRO dan 1 slot kuota guru akan kembali kosong.
          </span>
        }
        confirmText="Ya, Keluarkan Guru"
        cancelText="Batal"
        variant="danger"
        iconType="trash"
      />

      {/* Modern Leave School Confirm Dialog */}
      <ConfirmModal
        isOpen={isLeaveSchoolConfirmOpen}
        onClose={() => setIsLeaveSchoolConfirmOpen(false)}
        onConfirm={handleExecuteLeaveSchool}
        title="Lepas Akun dari Lisensi Sekolah?"
        message={
          <span>
            Apakah Anda yakin ingin melepas akun Anda dari lisensi <strong className="font-bold text-slate-900">&quot;{membership?.schoolName}&quot;</strong>? Akun Anda akan kembali ke Paket Guru Basic.
          </span>
        }
        confirmText="Ya, Lepas Akun"
        cancelText="Batal"
        variant="warning"
        iconType="warning"
      />
    </div>
  );
};

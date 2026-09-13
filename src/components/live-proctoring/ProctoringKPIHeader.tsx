import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  Lock,
  Radio,
  Zap
} from 'lucide-react';
import type { StudentProctoring } from '../../types/exam';
import type { TeacherSubscription } from '../../types/subscription';

interface ProctoringKPIHeaderProps {
  students: StudentProctoring[];
  onAddGlobalTime: (minutes: number) => void;
  onLockAllExams: () => void;
  subscription?: TeacherSubscription;
  onOpenUpgradeModal?: (title?: string, description?: string) => void;
}

export const ProctoringKPIHeader: React.FC<ProctoringKPIHeaderProps> = ({
  students,
  onAddGlobalTime,
  onLockAllExams,
  subscription,
  onOpenUpgradeModal,
}) => {
  const total = students.length;
  const submitted = students.filter((s) => s.status === 'submitted').length;
  const inProgress = students.filter((s) => s.status === 'working' || s.status === 'violation_flagged').length;
  const violations = students.reduce((sum, s) => sum + s.violationCount, 0);
  const studentsWithViolation = students.filter((s) => s.violationCount > 0).length;

  const isFree = !subscription || subscription.tier === 'free';
  const isCapacityFull = isFree && total >= 40;

  return (
    <div className="space-y-3.5">
      {/* Top Status Banner */}
      <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center relative flex-shrink-0 shadow-xs">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
          </div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight leading-none">
              Monitoring Live Ujian
            </h3>
            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-sans font-semibold text-emerald-700 text-[11px]">Sesi:</span>
              <span className="font-mono font-bold text-emerald-900 text-[11px]">TELEMETRI AKTIF</span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onAddGlobalTime(5)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <span>5 Menit Serentak</span>
          </button>

          <button
            onClick={onLockAllExams}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <span>Kunci Sesi Ujian</span>
          </button>
        </div>
      </div>

      {/* Warning Banner Jika Kuota Siswa Free Tier Penuh */}
      {isCapacityFull && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold flex-shrink-0 text-base shadow-2xs">
              ⚠️
            </div>
            <div>
              <p className="font-display font-bold text-xs text-amber-950">
                Kapasitas Maksimal 40 Siswa Tercapai (Paket Guru Basic)
              </p>
              <p className="text-[11px] text-amber-800 font-sans mt-0.5 leading-relaxed">
                Siswa baru yang mencoba login ujian akan ditolak oleh sistem. Upgrade ke <strong>Guru PRO</strong> untuk kapasitas peserta tanpa batas (Unlimited).
              </p>
            </div>
          </div>
          {onOpenUpgradeModal && (
            <button
              type="button"
              onClick={() =>
                onOpenUpgradeModal(
                  'Buka Kapasitas Siswa Tanpa Batas',
                  'Sesi ujian Anda telah mencapai batas kuota maksimal 40 siswa (Paket Guru Basic). Tingkatkan ke Guru PRO untuk kuota siswa tanpa batas (Unlimited) dan pemantauan lintas kelas yang leluasa.'
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-display font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
              <span>Upgrade ke PRO</span>
            </button>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Siswa */}
        <div className={`p-3.5 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
          isCapacityFull ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block">
                Total Peserta
              </span>
              {isFree ? (
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
                  Max 40
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                  Unlimited
                </span>
              )}
            </div>
            <div className="text-xl font-display font-black text-slate-900 tracking-tight leading-tight">
              {total}
              {isFree && <span className="text-xs font-semibold text-slate-400 font-sans"> / 40</span>}{' '}
              <span className="text-xs font-display font-semibold text-slate-400">Siswa</span>
            </div>
            <span className={`text-[11px] font-sans block ${isCapacityFull ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
              {isCapacityFull
                ? 'Kuota penuh (Basic)'
                : isFree
                ? `Sisa kuota: ${Math.max(0, 40 - total)} siswa`
                : 'Sesi terhubung (PRO)'}
            </span>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCapacityFull ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'
          }`}>
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Sedang Mengerjakan */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-display font-bold text-blue-600 uppercase tracking-wider block">
              Mengerjakan
            </span>
            <div className="text-xl font-display font-black text-blue-700 tracking-tight leading-tight">
              {inProgress} <span className="text-xs font-display font-semibold text-blue-400">Siswa</span>
            </div>
            <span className="text-[11px] text-blue-500 font-sans block">Layar terkunci</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Sudah Selesai */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-display font-bold text-emerald-600 uppercase tracking-wider block">
              Sudah Selesai
            </span>
            <div className="text-xl font-display font-black text-emerald-700 tracking-tight leading-tight">
              {submitted} <span className="text-xs font-display font-semibold text-emerald-400">Siswa</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-sans block">Disimpan database</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Pelanggaran Pindah Tab */}
        <div className={`p-3.5 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
          violations > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <div className="space-y-0.5">
            <span className="text-[10px] font-display font-bold text-rose-600 uppercase tracking-wider block">
              Pelanggaran Tab
            </span>
            <div className="text-xl font-display font-black text-rose-700 tracking-tight leading-tight">
              {violations} <span className="text-xs font-display font-semibold text-rose-500">kali</span>
            </div>
            <span className="text-[11px] text-rose-600 font-sans font-semibold block">{studentsWithViolation} Siswa Melanggar</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringKPIHeader;

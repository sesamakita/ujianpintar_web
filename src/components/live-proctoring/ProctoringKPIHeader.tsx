import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  Lock,
  Radio
} from 'lucide-react';
import type { StudentProctoring } from '../../types/exam';

interface ProctoringKPIHeaderProps {
  students: StudentProctoring[];
  onAddGlobalTime: (minutes: number) => void;
  onLockAllExams: () => void;
}

export const ProctoringKPIHeader: React.FC<ProctoringKPIHeaderProps> = ({
  students,
  onAddGlobalTime,
  onLockAllExams,
}) => {
  const total = students.length;
  const submitted = students.filter((s) => s.status === 'submitted').length;
  const inProgress = students.filter((s) => s.status === 'working' || s.status === 'violation_flagged').length;
  const violations = students.reduce((sum, s) => sum + s.violationCount, 0);
  const studentsWithViolation = students.filter((s) => s.violationCount > 0).length;

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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Siswa */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block">
              Total Peserta
            </span>
            <div className="text-xl font-display font-black text-slate-900 tracking-tight leading-tight">
              {total} <span className="text-xs font-display font-semibold text-slate-400">Siswa</span>
            </div>
            <span className="text-[11px] text-slate-500 font-sans block">Sesi terhubung</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
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

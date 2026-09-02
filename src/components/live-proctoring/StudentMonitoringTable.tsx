import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight 
} from 'lucide-react';
import type { StudentProctoring } from '../../types/exam';

interface StudentMonitoringTableProps {
  students: StudentProctoring[];
  onSelectStudent: (student: StudentProctoring) => void;
  activeTotalQuestions?: number;
}

export const StudentMonitoringTable: React.FC<StudentMonitoringTableProps> = ({
  students,
  onSelectStudent,
  activeTotalQuestions = 5,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'submitted' | 'violation'>('all');

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery);
    
    if (!matchSearch) return false;

    if (statusFilter === 'working') return s.status === 'working';
    if (statusFilter === 'submitted') return s.status === 'submitted';
    if (statusFilter === 'violation') return s.violationCount > 0;
    return true;
  });

  const formatSeconds = (totalSec?: number) => {
    if (totalSec === undefined || totalSec === null || isNaN(totalSec) || totalSec <= 0) {
      return '00:00';
    }
    const safeSec = Math.max(0, Math.floor(totalSec));
    const hours = Math.floor(safeSec / 3600);
    const minutes = Math.floor((safeSec % 3600) / 60);
    const seconds = safeSec % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari siswa atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm font-sans font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({students.length})
          </button>

          <button
            onClick={() => setStatusFilter('working')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
              statusFilter === 'working'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mengerjakan ({students.filter((s) => s.status === 'working' || s.status === 'violation_flagged').length})
          </button>

          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
              statusFilter === 'submitted'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Selesai ({students.filter((s) => s.status === 'submitted').length})
          </button>

          <button
            onClick={() => setStatusFilter('violation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
              statusFilter === 'violation'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Pelanggaran ({students.filter((s) => s.violationCount > 0).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-display font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <th className="py-3 px-4">Nama Siswa & NISN</th>
              <th className="py-3 px-4">Progres Pengerjaan</th>
              <th className="py-3 px-4">Sisa Waktu</th>
              <th className="py-3 px-4">Koneksi</th>
              <th className="py-3 px-4">Indikator Pelanggaran</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400">
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-1.5">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <p className="text-xs font-display font-bold text-slate-700">
                      {students.length === 0 ? 'Menunggu Siswa Memasukkan Token PIN' : 'Tidak ada data siswa yang cocok dengan filter'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-sans">
                      {students.length === 0 ? 'Begitu siswa memasukkan 6 digit Token PIN di HP, status live pengerjaan dan deteksi layar akan langsung tampil otomatis di sini.' : 'Coba ubah kata kunci pencarian atau reset filter di atas.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const isSubmitted = student.status === 'submitted';
                const totalQ = Math.max(1, (student.totalQuestions && student.totalQuestions > 1) ? student.totalQuestions : (activeTotalQuestions || 5));
                const currentProg = Math.min(totalQ, Math.max(0, Number(student.progressCount) || 0));
                const progressPct = Math.min(100, Math.round((currentProg / totalQ) * 100));
                const hasViolation = student.violationCount > 0;

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      hasViolation ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* Student Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-xs flex-shrink-0 ${
                            isSubmitted
                              ? 'bg-emerald-100 text-emerald-800'
                              : hasViolation
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-display font-bold text-slate-900 text-sm">{student.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {student.nisn} • {student.className}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3 px-4">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-800">{currentProg}/{totalQ} Soal</span>
                          <span className="text-slate-500 font-mono">{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isSubmitted
                                ? 'bg-emerald-500'
                                : progressPct > 70
                                ? 'bg-blue-600'
                                : 'bg-blue-400'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Remaining Time */}
                    <td className="py-3 px-4">
                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-display font-bold text-xs">
                          <CheckCircle className="w-3.5 h-3.5" /> Selesai
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatSeconds(student.remainingSeconds)}
                        </span>
                      )}
                    </td>

                    {/* Connection */}
                    <td className="py-3 px-4">
                      {student.connectionStatus === 'online' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-semibold border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : student.connectionStatus === 'reconnecting' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-semibold border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Reconnecting
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold">
                          Offline
                        </span>
                      )}
                    </td>

                    {/* Violation Badge */}
                    <td className="py-3 px-4">
                      {hasViolation ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-lg text-xs font-display font-bold border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{student.violationCount}x Keluar Layar</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-sans">
                          Tertib (0)
                        </span>
                      )}
                    </td>

                    {/* Actions Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectStudent(student)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        <span>Kelola Sesi</span>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentMonitoringTable;

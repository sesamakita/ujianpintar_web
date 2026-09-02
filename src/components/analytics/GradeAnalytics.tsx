import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  Award, 
  AlertOctagon, 
  Search, 
  FileCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { GradeRecord, ExamSettings } from '../../types/exam';

interface GradeAnalyticsProps {
  grades: GradeRecord[];
  examSettings: ExamSettings;
}

export const GradeAnalytics: React.FC<GradeAnalyticsProps> = ({ grades, examSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Lulus' | 'Remedial'>('all');

  const totalStudents = grades.length;
  const avgScore = totalStudents > 0 
    ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / totalStudents) 
    : 0;
  const maxScore = totalStudents > 0 ? Math.max(...grades.map((g) => g.score)) : 0;
  const minScore = totalStudents > 0 ? Math.min(...grades.map((g) => g.score)) : 0;
  const passedCount = grades.filter((g) => g.status === 'Lulus').length;
  const remedialCount = grades.filter((g) => g.status === 'Remedial').length;
  const passingRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;

  const filteredGrades = grades.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.nisn.includes(searchQuery);
    if (!matchSearch) return false;
    if (filterStatus !== 'all' && g.status !== filterStatus) return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['NISN', 'Nama Siswa', 'Kelas', 'Nilai', 'Waktu Submit', 'Durasi (Menit)', 'Pelanggaran Tab', 'Status'];
    const rows = grades.map((g) => [
      g.nisn,
      `"${g.name}"`,
      g.className,
      g.score,
      g.submittedAt,
      g.timeSpentMinutes,
      g.tabViolations,
      g.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Nilai_${examSettings.subject.replace(/\s+/g, '_')}_${examSettings.scheduleDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      {/* Top Banner & Export Action */}
      <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight">
            Rekapitulasi Nilai Siswa
          </h3>
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs shadow-xs">
            <Award className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="font-sans font-semibold text-amber-700">Batas KKM:</span>
            <span className="font-mono font-bold text-amber-900">75 Poin</span>
          </div>
          <span className="text-xs text-slate-500 font-sans hidden sm:inline">
            {examSettings.title}
          </span>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-600 flex-shrink-0" />
          <span>Ekspor ke Excel (.csv)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Rata-rata */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block">
              Rata-rata Nilai
            </span>
            <div className="text-xl font-display font-black text-slate-900 tracking-tight leading-tight">
              {avgScore} <span className="text-xs font-display font-semibold text-slate-400">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-500 font-sans block">{totalStudents} Total Siswa</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Nilai Tertinggi */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block">
              Nilai Tertinggi
            </span>
            <div className="text-xl font-display font-black text-emerald-700 tracking-tight leading-tight">
              {maxScore} <span className="text-xs font-display font-semibold text-emerald-400">Poin</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-sans block">Skor Maksimal</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Nilai Terendah */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block">
              Nilai Terendah
            </span>
            <div className="text-xl font-display font-black text-amber-700 tracking-tight leading-tight">
              {minScore} <span className="text-xs font-display font-semibold text-amber-400">Poin</span>
            </div>
            <span className="text-[11px] text-amber-600 font-sans block">{remedialCount} Siswa Remedial</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertOctagon className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Tingkat Kelulusan */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block">
              Tingkat Kelulusan
            </span>
            <div className="text-xl font-display font-black text-blue-700 tracking-tight leading-tight">
              {passingRate}%
            </div>
            <span className="text-[11px] text-slate-500 font-sans block">{passedCount} dari {totalStudents} Lulus KKM</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({grades.length})
            </button>

            <button
              onClick={() => setFilterStatus('Lulus')}
              className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                filterStatus === 'Lulus'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Lulus KKM ({grades.filter((g) => g.status === 'Lulus').length})
            </button>

            <button
              onClick={() => setFilterStatus('Remedial')}
              className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                filterStatus === 'Remedial'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Remedial ({grades.filter((g) => g.status === 'Remedial').length})
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-display font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Nama Siswa & NISN</th>
                <th className="py-3 px-4">Nilai Akhir</th>
                <th className="py-3 px-4">Waktu Selesai</th>
                <th className="py-3 px-4">Durasi Pengerjaan</th>
                <th className="py-3 px-4">Riwayat Pelanggaran</th>
                <th className="py-3 px-4 text-right">Status Kelulusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
                        <Award className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-display font-bold text-slate-700">
                        {grades.length === 0 ? 'Belum Ada Hasil Ujian yang Disubmit' : 'Tidak ada data nilai yang cocok'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-sans">
                        {grades.length === 0 ? 'Begitu siswa menyelesaikan pengerjaan dan mengumpulkan lembar jawaban, sistem auto-grading Rust akan langsung merekap nilai di sini.' : 'Coba ubah kata kunci pencarian atau filter status.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGrades.map((grade) => {
                  const isPassed = grade.status === 'Lulus';

                  return (
                    <tr key={grade.studentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-display font-bold text-slate-900 text-sm">{grade.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {grade.nisn} • {grade.className}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-mono font-black text-sm ${
                          isPassed ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {grade.score}
                        </span>
                        <span className="text-slate-400 text-xs font-mono font-medium"> / {grade.maxScore}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                        {grade.submittedAt}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {grade.timeSpentMinutes} Menit
                      </td>

                      <td className="py-3 px-4">
                        {grade.tabViolations > 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-display font-bold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {grade.tabViolations}x Pindah Tab
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Tertib (0)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-display font-bold border ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <AlertOctagon className="w-3 h-3" />}
                          {grade.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GradeAnalytics;

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  Award, 
  AlertOctagon, 
  Search, 
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  Filter,
  RotateCcw,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import type { GradeRecord, ExamSettings } from '../../types/exam';
import type { TeacherSubscription } from '../../types/subscription';

interface GradeAnalyticsProps {
  grades: GradeRecord[];
  examSettings: ExamSettings;
  subscription?: TeacherSubscription;
  onOpenUpgradeModal?: (title?: string, desc?: string) => void;
}

// Helper to extract date key (YYYY-MM-DD) and human label for filtering
const getDateInfo = (g: GradeRecord): { key: string; label: string } => {
  if (g.createdAt) {
    try {
      const d = new Date(g.createdAt);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        const label = d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        return { key, label };
      }
    } catch {
      // fallback
    }
  }

  // Fallback parsing from submittedAt (e.g. "14 Sep 2026, 10:30" or "14 Sep 2026")
  if (g.submittedAt) {
    const rawDate = g.submittedAt.split(',')[0].trim();
    if (rawDate) {
      return { key: rawDate, label: rawDate };
    }
  }

  return { key: 'unknown', label: 'Lainnya' };
};

export const GradeAnalytics: React.FC<GradeAnalyticsProps> = ({
  grades,
  examSettings,
  subscription,
  onOpenUpgradeModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Lulus' | 'Remedial'>('all');

  // Extract unique classes sorted naturally
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    grades.forEach((g) => {
      if (g.className && g.className.trim()) {
        set.add(g.className.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [grades]);

  // Extract unique dates sorted descending (newest first)
  const availableDates = useMemo(() => {
    const map = new Map<string, string>();
    grades.forEach((g) => {
      const { key, label } = getDateInfo(g);
      if (key && key !== 'unknown') {
        map.set(key, label);
      }
    });
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [grades]);

  // Filtered dataset according to all active criteria
  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      // 1. Search query (name, NISN, or class)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = g.name.toLowerCase().includes(q);
        const matchNisn = g.nisn.toLowerCase().includes(q);
        const matchClass = (g.className || '').toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchClass) return false;
      }

      // 2. Class filter
      if (selectedClass !== 'all' && g.className !== selectedClass) {
        return false;
      }

      // 3. Date filter
      if (selectedDate !== 'all') {
        const { key } = getDateInfo(g);
        if (key !== selectedDate) return false;
      }

      // 4. Status filter
      if (filterStatus !== 'all' && g.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [grades, searchQuery, selectedClass, selectedDate, filterStatus]);

  // Dynamic KPI calculations based on filtered dataset
  const totalFiltered = filteredGrades.length;
  const totalAll = grades.length;
  const avgScore = totalFiltered > 0 
    ? Math.round(filteredGrades.reduce((sum, g) => sum + g.score, 0) / totalFiltered) 
    : 0;
  const maxScore = totalFiltered > 0 ? Math.max(...filteredGrades.map((g) => g.score)) : 0;
  const minScore = totalFiltered > 0 ? Math.min(...filteredGrades.map((g) => g.score)) : 0;
  const passedCount = filteredGrades.filter((g) => g.status === 'Lulus').length;
  const remedialCount = filteredGrades.filter((g) => g.status === 'Remedial').length;
  const passingRate = totalFiltered > 0 ? Math.round((passedCount / totalFiltered) * 100) : 0;

  const hasActiveFilter = searchQuery.trim() !== '' || selectedClass !== 'all' || selectedDate !== 'all' || filterStatus !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedClass('all');
    setSelectedDate('all');
    setFilterStatus('all');
  };

  const handleExportCSV = () => {
    if (filteredGrades.length === 0) {
      alert('Tidak ada data nilai yang sesuai dengan filter saat ini untuk diekspor.');
      return;
    }

    const headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Nilai Akhir', 'Batas KKM', 'Status Kelulusan', 'Waktu Selesai', 'Durasi (Menit)', 'Pelanggaran Tab'];
    const rows = filteredGrades.map((g, idx) => [
      idx + 1,
      `="${g.nisn}"`, // Preserve leading zeros in Excel
      `"${g.name.replace(/"/g, '""')}"`,
      `"${(g.className || '-').replace(/"/g, '""')}"`,
      g.score,
      75,
      `"${g.status}"`,
      `"${g.submittedAt}"`,
      g.timeSpentMinutes,
      g.tabViolations,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const filterSuffix = selectedClass !== 'all' ? `_${selectedClass.replace(/\s+/g, '_')}` : '';
    const cleanSubject = examSettings.subject.replace(/\s+/g, '_') || 'Ujian';
    link.setAttribute('download', `Rekap_Nilai_${cleanSubject}${filterSuffix}_${examSettings.scheduleDate || 'Export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    if (subscription?.tier === 'free') {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal(
          'Buka Format Raport Excel (.xlsx)',
          'Ekspor format raport Excel (.xlsx) dengan lembar nilai resmi, analisis butir soal, dan rekap rombel tersedia khusus untuk akun Guru PRO & Lisensi Sekolah.'
        );
      }
      return;
    }

    if (filteredGrades.length === 0) {
      alert('Tidak ada data nilai yang sesuai dengan filter saat ini untuk diekspor.');
      return;
    }

    // Official school-ready Excel worksheet
    const classLabel = selectedClass === 'all' ? 'Semua Kelas' : selectedClass;
    const dateLabel = selectedDate === 'all' ? 'Semua Tanggal' : (availableDates.find(d => d.key === selectedDate)?.label || selectedDate);

    const sheetData: (string | number)[][] = [
      ['LAPORAN REKAPITULASI HASIL UJIAN SISWA'],
      ['Sistem Asesmen Terintegrasi UjianPintar - Guru Hebat'],
      [],
      ['Mata Pelajaran', examSettings.subject, '', 'Kelas / Rombel', classLabel],
      ['Judul Modul', examSettings.title, '', 'Tanggal Sesi', dateLabel],
      ['Standar KKM', 75, '', 'Total Siswa', filteredGrades.length],
      ['Rata-rata Nilai', avgScore, '', 'Tingkat Kelulusan', `${passingRate}% (${passedCount} Lulus, ${remedialCount} Remedial)`],
      ['Nilai Tertinggi', maxScore, '', 'Nilai Terendah', minScore],
      [],
      ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Nilai', 'Batas KKM', 'Status', 'Waktu Submit', 'Durasi (Menit)', 'Pelanggaran Tab']
    ];

    filteredGrades.forEach((g, idx) => {
      sheetData.push([
        idx + 1,
        g.nisn,
        g.name,
        g.className || '-',
        g.score,
        75,
        g.status,
        g.submittedAt,
        g.timeSpentMinutes,
        g.tabViolations
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Column width configurations
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // NISN
      { wch: 32 }, // Nama Siswa
      { wch: 16 }, // Kelas
      { wch: 10 }, // Nilai
      { wch: 12 }, // Batas KKM
      { wch: 14 }, // Status
      { wch: 22 }, // Waktu Submit
      { wch: 16 }, // Durasi
      { wch: 18 }  // Pelanggaran Tab
    ];

    const wb = XLSX.utils.book_new();
    const cleanSheetName = (selectedClass !== 'all' ? selectedClass : 'Rekap Nilai').substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

    const filterSuffix = selectedClass !== 'all' ? `_${selectedClass.replace(/\s+/g, '_')}` : '';
    const cleanSubject = examSettings.subject.replace(/\s+/g, '_') || 'Ujian';
    XLSX.writeFile(wb, `Rekap_Nilai_${cleanSubject}${filterSuffix}_${examSettings.scheduleDate || 'Export'}.xlsx`);
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      {/* Top Banner & Export Action */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight">
            Rekapitulasi Nilai Siswa
          </h3>
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-xs shadow-xs">
            <Award className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="font-sans font-semibold text-amber-700">Batas KKM:</span>
            <span className="font-mono font-bold text-amber-900">75 Poin</span>
          </div>
          {hasActiveFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-xl text-[11px] font-display font-bold text-blue-700">
              <Filter className="w-3 h-3 text-blue-600" />
              Filter Aktif ({totalFiltered} dari {totalAll} siswa)
            </span>
          )}
          <span className="text-xs text-slate-500 font-sans hidden md:inline">
            {examSettings.title}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Ekspor CSV Standar (Gratis untuk semua, mengikuti filter aktif) */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            title={`Ekspor ${totalFiltered} data nilai terpilih ke format .CSV`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <span>Ekspor Standar (.CSV)</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold">
              {totalFiltered}
            </span>
          </button>

          {/* Ekspor Raport Excel Lengkap (PRO / School Feature, mengikuti filter aktif) */}
          <button
            type="button"
            onClick={handleExportXLSX}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              subscription?.tier === 'free'
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
            title={subscription?.tier === 'free' ? 'Fitur Guru PRO: Buka Ekspor Raport Excel (.xlsx)' : `Ekspor ${totalFiltered} data nilai terpilih ke format Excel (.XLSX)`}
          >
            {subscription?.tier === 'free' ? (
              <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-100 flex-shrink-0" />
            )}
            <span>Raport Excel (.XLSX)</span>
            {subscription?.tier === 'free' ? (
              <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded text-[9px] font-mono font-black">
                PRO
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-emerald-500/80 text-white rounded text-[10px] font-mono font-bold">
                {totalFiltered}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Mengikuti Hasil Filter */}
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
            <span className="text-[11px] text-slate-500 font-sans block">
              {totalFiltered} Siswa {hasActiveFilter ? `(dari ${totalAll})` : ''}
            </span>
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
            <span className="text-[11px] text-slate-500 font-sans block">{passedCount} dari {totalFiltered} Lulus KKM</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Grade Table & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          {/* Row 1: Search, Class Filter, Date Filter, Reset */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 text-sm font-sans font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Kelas */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[150px]">
              <Layers className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-transparent text-xs font-display font-semibold text-slate-700 focus:outline-none cursor-pointer"
                aria-label="Filter berdasarkan Kelas"
              >
                <option value="all">Semua Kelas ({availableClasses.length})</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tanggal Ujian */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[160px]">
              <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-transparent text-xs font-display font-semibold text-slate-700 focus:outline-none cursor-pointer"
                aria-label="Filter berdasarkan Tanggal Ujian"
              >
                <option value="all">Semua Tanggal ({availableDates.length})</option>
                {availableDates.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-display font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer whitespace-nowrap"
                title="Reset semua filter ke tampilan semula"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Row 2: Status Pills & Result Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Status ({totalAll})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('Lulus')}
                className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                  filterStatus === 'Lulus'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Lulus KKM ({grades.filter((g) => g.status === 'Lulus').length})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('Remedial')}
                className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                  filterStatus === 'Remedial'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Remedial ({grades.filter((g) => g.status === 'Remedial').length})
              </button>
            </div>

            <div className="text-[11px] font-sans text-slate-500">
              Menampilkan <span className="font-mono font-bold text-slate-800">{totalFiltered}</span> dari <span className="font-mono font-bold text-slate-800">{totalAll}</span> siswa
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-display font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Nama Siswa & NISN</th>
                <th className="py-3 px-4">Kelas</th>
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
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
                        <Award className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-display font-bold text-slate-700">
                        {grades.length === 0 ? 'Belum Ada Hasil Ujian yang Disubmit' : 'Tidak ada data nilai yang cocok'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-sans">
                        {grades.length === 0 
                          ? 'Begitu siswa menyelesaikan pengerjaan dan mengumpulkan lembar jawaban, sistem auto-grading Rust akan langsung merekap nilai di sini.' 
                          : 'Coba ubah kata kunci pencarian atau sesuaikan pilihan filter kelas/tanggal/status.'}
                      </p>
                      {hasActiveFilter && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Bersihkan Semua Filter</span>
                        </button>
                      )}
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
                          NISN: {grade.nisn}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-display font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {grade.className || '-'}
                        </span>
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

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  FileSpreadsheet, 
  RefreshCw,
  CloudUpload
} from 'lucide-react';
import type { StudentRosterItem } from '../../types/exam';
import { rosterService } from '../../services/rosterService';

interface StudentRosterManagementProps {
  teacherId?: string;
  onSelectClassForExam?: (className: string) => void;
}

export const StudentRosterManagement: React.FC<StudentRosterManagementProps> = ({
  teacherId,
  onSelectClassForExam,
}) => {
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'L' | 'P'>('all');
  
  // Feedback alerts
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRosterItem | null>(null);
  const [formData, setFormData] = useState({
    nisn: '',
    studentName: '',
    className: '',
    gender: 'L' as 'L' | 'P',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  useEffect(() => {
    loadRoster();
  }, [teacherId]);

  const loadRoster = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await rosterService.getRoster(teacherId);
      setStudents(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat data siswa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncCloud = async () => {
    setIsSyncingCloud(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await rosterService.syncLocalToSupabase(teacherId);
      if (res.success) {
        setSuccessMessage(`Berhasil menyinkronkan ${res.syncedCount} siswa ke database cloud! Data siswa kini langsung aktif dan terbaca oleh APK mobile.`);
        loadRoster();
      } else {
        setErrorMessage(res.error || 'Gagal sinkron ke database cloud. Pastikan migrasi tabel database sudah dijalankan.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Gagal menyinkronkan data.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Distinct classes list
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      const c = (s.className || '').trim();
      if (c && c !== '-') set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Class filter
      if (selectedClass !== 'all' && (s.className || '').toLowerCase() !== selectedClass.toLowerCase()) {
        return false;
      }

      // 2. Gender filter
      if (filterGender !== 'all' && s.gender !== filterGender) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.studentName.toLowerCase().includes(q);
        const matchNisn = s.nisn.toLowerCase().includes(q);
        const matchClass = s.className.toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchClass) return false;
      }

      return true;
    });
  }, [students, selectedClass, filterGender, searchQuery]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      nisn: '',
      studentName: '',
      className: selectedClass !== 'all' ? selectedClass : availableClasses[0] || 'X 1',
      gender: 'L',
    });
    setIsFormModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (std: StudentRosterItem) => {
    setEditingStudent(std);
    setFormData({
      nisn: std.nisn,
      studentName: std.studentName,
      className: std.className,
      gender: std.gender || 'L',
    });
    setIsFormModalOpen(true);
  };

  // Save student (Add / Edit)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.className.trim()) {
      setErrorMessage('Nama siswa dan kelas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingStudent) {
        // Update
        await rosterService.updateStudent(editingStudent.id, {
          nisn: formData.nisn.trim() || editingStudent.nisn,
          studentName: formData.studentName.trim(),
          className: formData.className.trim(),
          gender: formData.gender,
          teacherId,
        });
        setSuccessMessage(`Data siswa "${formData.studentName}" berhasil diperbarui.`);
      } else {
        // Add
        await rosterService.addStudent({
          nisn: formData.nisn.trim() || `00${Date.now().toString().slice(-8)}`,
          studentName: formData.studentName.trim(),
          className: formData.className.trim(),
          gender: formData.gender,
          teacherId,
        });
        setSuccessMessage(`Siswa baru "${formData.studentName}" berhasil ditambahkan.`);
      }

      setIsFormModalOpen(false);
      await loadRoster();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data siswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete student
  const handleDeleteStudent = async (std: StudentRosterItem) => {
    if (!window.confirm(`Yakin ingin menghapus siswa "${std.studentName}" (${std.nisn})?`)) return;

    try {
      await rosterService.deleteStudent(std.id, teacherId);
      setSuccessMessage(`Siswa "${std.studentName}" berhasil dihapus.`);
      await loadRoster();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus siswa.');
    }
  };

  // Delete entire class
  const handleDeleteClass = async (className: string) => {
    if (!window.confirm(`PERINGATAN: Yakin ingin menghapus seluruh siswa di kelas "${className}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      await rosterService.deleteClass(className, teacherId);
      setSuccessMessage(`Seluruh data siswa kelas "${className}" berhasil dihapus.`);
      setSelectedClass('all');
      await loadRoster();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus kelas.');
    }
  };

  // File import handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const defaultCls = selectedClass !== 'all' ? selectedClass : undefined;
      const res = await rosterService.importRosterFromExcelOrCSV(file, teacherId, defaultCls);

      if (res.success) {
        setSuccessMessage(`Berhasil mengimpor ${res.importedCount} data siswa dari berkas.`);
        await loadRoster();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.error || 'Gagal mengimpor berkas Excel.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan membaca file Excel.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl text-slate-900 tracking-tight">
              Database Siswa &amp; Kelas
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Kelola daftar nama siswa per rombel untuk sinkronisasi otomatis QR Code ujian dan presensi live.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => rosterService.downloadExcelTemplate()}
            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-display font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Unduh contoh template Excel resmi (.xlsx)"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Unduh Template</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="h-9 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-display font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Impor daftar siswa dari file Excel / CSV"
          >
            {isImporting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            )}
            <span>{isImporting ? 'Mengimpor...' : 'Impor Excel / CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncCloud}
            disabled={isSyncingCloud}
            className="h-9 px-3.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-display font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Sinkronkan seluruh siswa dari browser ke database cloud Supabase"
          >
            {isSyncingCloud ? (
              <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            ) : (
              <CloudUpload className="w-4 h-4 text-sky-600" />
            )}
            <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkron ke Cloud'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-display font-bold transition-all shadow-xs shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* 2. Feedback Alerts */}
      {successMessage && (
        <div className="p-3.5 px-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="flex-1 font-bold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 px-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Class Navigation Tabs & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-4">
        
        {/* Row 1: Class Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hover py-0.5">
            <button
              type="button"
              onClick={() => setSelectedClass('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold border transition-colors cursor-pointer flex-shrink-0 ${
                selectedClass === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Siswa ({students.length})
            </button>

            {availableClasses.map((cls) => {
              const countInClass = students.filter((s) => s.className.toLowerCase() === cls.toLowerCase()).length;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold border transition-colors cursor-pointer flex-shrink-0 ${
                    selectedClass === cls
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Kelas {cls.replace(/^kelas\s*/i, '')} ({countInClass})
                </button>
              );
            })}
          </div>

          {/* Actions for specific class */}
          {selectedClass !== 'all' && (
            <div className="flex items-center gap-2">
              {onSelectClassForExam && (
                <button
                  type="button"
                  onClick={() => onSelectClassForExam(selectedClass)}
                  className="text-xs font-display font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title={`Buat paket ujian khusus untuk kelas ${selectedClass}`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Buat Ujian Kelas {selectedClass}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteClass(selectedClass)}
                className="text-xs font-display font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                title={`Hapus seluruh siswa di kelas ${selectedClass}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Kelas</span>
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Search & Filter Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap flex-1 max-w-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama lengkap, NISN, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value as any)}
              className="h-9 px-3 text-xs font-display font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Gender</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-sans">
            Menampilkan <span className="font-bold text-slate-800">{filteredStudents.length}</span> dari {students.length} siswa
          </div>
        </div>

      </div>

      {/* 4. Table of Students */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500">Memuat database siswa...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-display font-bold text-slate-800 text-sm">
                Belum ada data siswa
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {students.length === 0
                  ? 'Klik tombol "Impor Excel / CSV" untuk mengunggah legger absen sekolah atau "Tambah Siswa" untuk input manual.'
                  : 'Tidak ada siswa yang cocok dengan kriteria pencarian di atas.'}
              </p>
            </div>
            {students.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-display font-bold cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Pilih Berkas Excel Siswa</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-display font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-4">Kelas / Rombel</th>
                  <th className="py-3 px-4 text-center">JK</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {std.nisn}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {std.studentName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-display font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {std.className}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          std.gender === 'P'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {std.gender || 'L'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(std)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data Siswa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(std)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal Tambah / Edit Siswa */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="font-display font-bold text-sm">
                  {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-display font-bold text-slate-700 block">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi Pratama"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-display font-bold text-slate-700 block">
                    NISN (10 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="Contoh: 0081234567"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Opsional (auto-generate bila kosong)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-display font-bold text-slate-700 block">
                    Kelas / Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: X 1 atau VII-A"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-display font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-display font-bold text-slate-700 block">
                  Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'L' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      formData.gender === 'L'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Laki-laki (L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'P' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      formData.gender === 'P'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Perempuan (P)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-display font-bold transition-all shadow-xs shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

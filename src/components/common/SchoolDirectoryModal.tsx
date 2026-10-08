import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  School,
  GraduationCap
} from 'lucide-react';
import { indonesiaRegionService, INDONESIA_PROVINCES } from '../../services/indonesiaRegionService';
import type { 
  ProvinceItem, 
  RegencyItem, 
  DistrictItem, 
  SchoolItem 
} from '../../services/indonesiaRegionService';

interface SchoolDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchool: (school: {
    schoolName: string;
    npsn: string;
    province?: string;
    regency?: string;
    district?: string;
  }) => void;
  currentSchoolName?: string;
}

export const SchoolDirectoryModal: React.FC<SchoolDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSchool,
  currentSchoolName,
}) => {
  // Region hierarchy state - Pre-populated with official Indonesian provinces
  const [provinces, setProvinces] = useState<ProvinceItem[]>(INDONESIA_PROVINCES);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>('');

  const [regencies, setRegencies] = useState<RegencyItem[]>([]);
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>('');
  const [selectedRegencyName, setSelectedRegencyName] = useState<string>('');

  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');

  // Search keyword & filters
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // School results
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState<boolean>(false);
  const [isSearchingSchools, setIsSearchingSchools] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Load provinces on open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingRegions(true);
      indonesiaRegionService.getProvinces().then((data) => {
        setProvinces(data);
        setIsLoadingRegions(false);
      });
    }
  }, [isOpen]);

  // Handle Province Change
  const handleProvinceChange = async (provId: string) => {
    setSelectedProvinceId(provId);
    const provObj = provinces.find((p) => p.id === provId);
    setSelectedProvinceName(provObj?.name || '');

    // Reset children
    setSelectedRegencyId('');
    setSelectedRegencyName('');
    setRegencies([]);
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setDistricts([]);
    setSchools([]);
    setHasSearched(false);

    if (provId) {
      setIsLoadingRegions(true);
      const data = await indonesiaRegionService.getRegencies(provId);
      setRegencies(data);
      setIsLoadingRegions(false);
    }
  };

  // Handle Regency Change
  const handleRegencyChange = async (regId: string) => {
    setSelectedRegencyId(regId);
    const regObj = regencies.find((r) => r.id === regId);
    setSelectedRegencyName(regObj?.name || '');

    // Reset district
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setDistricts([]);
    setSchools([]);
    setHasSearched(false);

    if (regId) {
      setIsLoadingRegions(true);
      const data = await indonesiaRegionService.getDistricts(regId);
      setDistricts(data);
      setIsLoadingRegions(false);

      // Auto load schools in regency
      triggerSearch('', regObj?.name, '');
    }
  };

  // Handle District Change
  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    const distObj = districts.find((d) => d.id === distId);
    setSelectedDistrictName(distObj?.name || '');

    if (distObj?.name) {
      triggerSearch(searchKeyword, selectedRegencyName, distObj.name);
    }
  };

  // Execute School Search
  const triggerSearch = async (kw?: string, regName?: string, distName?: string) => {
    const activeKw = kw !== undefined ? kw : searchKeyword;
    const activeReg = regName !== undefined ? regName : selectedRegencyName;
    const activeDist = distName !== undefined ? distName : selectedDistrictName;

    setIsSearchingSchools(true);
    setHasSearched(true);

    try {
      const results = await indonesiaRegionService.searchSchools({
        keyword: activeKw,
        provinceName: selectedProvinceName,
        regencyName: activeReg,
        districtName: activeDist,
      });
      setSchools(results);
    } catch {
      setSchools([]);
    } finally {
      setIsSearchingSchools(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch();
  };

  // Filtered by Level (SD, SMP, SMA, SMK, etc)
  const filteredSchools = schools.filter((s) => {
    if (levelFilter === 'all') return true;
    const lvl = (s.level || '').toUpperCase();
    return lvl.includes(levelFilter.toUpperCase());
  });

  const handlePickSchool = (s: SchoolItem) => {
    onSelectSchool({
      schoolName: s.name,
      npsn: s.npsn,
      province: s.province,
      regency: s.regency,
      district: s.district,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Direktori Sekolah" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base tracking-tight text-white flex items-center gap-2">
                <span>Pencarian Sekolah &amp; NPSN Resmi</span>
              </h3>
              <p className="text-xs text-blue-100 font-sans mt-0.5">
                Basis data referensi sekolah Kemendikbud (SD, SMP, SMA, SMK)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls Body */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3.5 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Provinsi */}
            <div>
              <label htmlFor="sdir-1" className="block text-[10px] font-display font-bold uppercase tracking-wider text-slate-500 mb-1">
                1. Pilih Provinsi
              </label>
              <select id="sdir-1"
                value={selectedProvinceId}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-xl px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- Pilih Provinsi ({provinces.length}) --</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Kabupaten / Kota */}
            <div>
              <label htmlFor="sdir-2" className="block text-[10px] font-display font-bold uppercase tracking-wider text-slate-500 mb-1">
                2. Kabupaten / Kota
              </label>
              <select id="sdir-2"
                value={selectedRegencyId}
                onChange={(e) => handleRegencyChange(e.target.value)}
                disabled={!selectedProvinceId || (isLoadingRegions && regencies.length === 0)}
                className="w-full h-9 bg-white border border-slate-200 rounded-xl px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedProvinceId 
                    ? 'Pilih provinsi dahulu' 
                    : isLoadingRegions && regencies.length === 0 
                      ? 'Memuat daftar kab/kota...' 
                      : `-- Pilih Kab/Kota (${regencies.length}) --`}
                </option>
                {regencies.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Kecamatan */}
            <div>
              <label htmlFor="school-1" className="block text-[10px] font-display font-bold uppercase tracking-wider text-slate-500 mb-1">
                3. Kecamatan
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedRegencyId || (isLoadingRegions && districts.length === 0)}
                className="w-full h-9 bg-white border border-slate-200 rounded-xl px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedRegencyId 
                    ? 'Pilih kab/kota dahulu' 
                    : isLoadingRegions && districts.length === 0 
                      ? 'Memuat daftar kecamatan...' 
                      : `-- Semua Kecamatan (${districts.length}) --`}
                </option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box & Jenjang Pills */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input id="school-1"
                type="text"
                placeholder="Ketik nama sekolah atau 8 digit NPSN (Contoh: SMAN 1, SMKN 1, 20104653)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingSchools}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap disabled:opacity-50"
            >
              {isSearchingSchools ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mencari...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Cari</span>
                </>
              )}
            </button>
          </form>

          {/* Jenjang Filter Badges */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Jenjang:
            </span>
            {['all', 'SMK', 'SMA', 'SMP', 'SD'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-display font-bold transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lvl === 'all' ? 'Semua Jenjang' : lvl}
              </button>
            ))}
          </div>

          {/* Info Notice for Kemenag Madrasah */}
          <div className="p-2.5 bg-blue-50/80 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Info Madrasah Kemenag:</strong> Pencarian otomatis API saat ini mencakup sekolah Kemendikbud (SD, SMP, SMA, SMK). Untuk madrasah Kemenag (MI, MTs, MA), silakan klik <strong>Tutup &amp; Input Manual</strong> untuk mengetik nama madrasah &amp; NPSN Anda.
            </span>
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-100">
          {isSearchingSchools ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-xs font-semibold text-slate-600">
                Menghubungkan ke basis data sekolah resmi...
              </p>
            </div>
          ) : filteredSchools.length > 0 ? (
            filteredSchools.map((s, idx) => {
              const isCurrent = currentSchoolName && s.name.toLowerCase() === currentSchoolName.toLowerCase();
              return (
                <div
                  key={`${s.npsn}-${idx}`}
                  className="pt-2.5 first:pt-0 flex flex-wrap items-center justify-between gap-3 group hover:bg-slate-50 p-2.5 rounded-2xl transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                        {s.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/80">
                        {s.level}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        s.status === 'Negeri'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-purple-50 text-purple-700 border border-purple-200/80'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-sans flex-wrap">
                      <span className="font-mono font-bold text-slate-700">
                        NPSN: {s.npsn}
                      </span>
                      {(s.district || s.regency) && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{[s.district, s.regency, s.province].filter(Boolean).join(', ')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePickSchool(s)}
                    className="h-8 px-3.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-display font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group-hover:bg-blue-600 group-hover:text-white flex-shrink-0"
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                        <span>Sekolah Anda</span>
                      </>
                    ) : (
                      <>
                        <span>Pilih</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : hasSearched ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                Tidak Menemukan Sekolah yang Sesuai
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Pastikan pilihan wilayah atau kata kunci pencarian Anda sudah benar, atau klik tombol di bawah untuk mengetik manual.
              </p>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Pilih Provinsi &amp; Kabupaten, atau ketik kata kunci nama sekolah / NPSN di atas.
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Contoh: Pilih <em>Sulawesi Tengah</em> &rarr; <em>Kabupaten Banggai</em> &rarr; <em>Kecamatan Luwuk</em>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 flex-shrink-0">
          <span className="text-[11px] text-slate-500">
            Sekolah Anda belum terdaftar resmi? Anda dapat mengetik manual di formulir.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-display font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup &amp; Input Manual
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolDirectoryModal;

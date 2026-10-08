/**
 * Service untuk memuat referensi wilayah Indonesia (Provinsi, Kab/Kota, Kecamatan)
 * dan pencarian data sekolah resmi Kemendikbud & Kemenag beserta NPSN.
 */

export interface ProvinceItem {
  id: string;
  name: string;
}

export interface RegencyItem {
  id: string;
  province_id: string;
  name: string;
}

export interface DistrictItem {
  id: string;
  regency_id: string;
  name: string;
}

export interface SchoolItem {
  name: string;
  npsn: string;
  level: string;
  status: 'Negeri' | 'Swasta' | string;
  district?: string;
  regency?: string;
  province?: string;
  address?: string;
}

/**
 * Daftar Resmi Provinsi di Indonesia (Terstandarisasi Nasional)
 * Disimpan secara lokal/statis agar dropdown SELALU muncul instan (0 milidetik)
 * tanpa risiko gagal akibat gangguan koneksi atau blokir jaringan internet/ISP.
 */
export const INDONESIA_PROVINCES: ProvinceItem[] = [
  { id: '11', name: 'ACEH' },
  { id: '12', name: 'SUMATERA UTARA' },
  { id: '13', name: 'SUMATERA BARAT' },
  { id: '14', name: 'RIAU' },
  { id: '15', name: 'JAMBI' },
  { id: '16', name: 'SUMATERA SELATAN' },
  { id: '17', name: 'BENGKULU' },
  { id: '18', name: 'LAMPUNG' },
  { id: '19', name: 'KEPULAUAN BANGKA BELITUNG' },
  { id: '21', name: 'KEPULAUAN RIAU' },
  { id: '31', name: 'DKI JAKARTA' },
  { id: '32', name: 'JAWA BARAT' },
  { id: '33', name: 'JAWA TENGAH' },
  { id: '34', name: 'DI YOGYAKARTA' },
  { id: '35', name: 'JAWA TIMUR' },
  { id: '36', name: 'BANTEN' },
  { id: '51', name: 'BALI' },
  { id: '52', name: 'NUSA TENGGARA BARAT' },
  { id: '53', name: 'NUSA TENGGARA TIMUR' },
  { id: '61', name: 'KALIMANTAN BARAT' },
  { id: '62', name: 'KALIMANTAN TENGAH' },
  { id: '63', name: 'KALIMANTAN SELATAN' },
  { id: '64', name: 'KALIMANTAN TIMUR' },
  { id: '65', name: 'KALIMANTAN UTARA' },
  { id: '71', name: 'SULAWESI UTARA' },
  { id: '72', name: 'SULAWESI TENGAH' },
  { id: '73', name: 'SULAWESI SELATAN' },
  { id: '74', name: 'SULAWESI TENGGARA' },
  { id: '75', name: 'GORONTALO' },
  { id: '76', name: 'SULAWESI BARAT' },
  { id: '81', name: 'MALUKU' },
  { id: '82', name: 'MALUKU UTARA' },
  { id: '91', name: 'PAPUA BARAT' },
  { id: '94', name: 'PAPUA' },
];

// In-memory cache to avoid redundant network roundtrips
const regenciesCache = new Map<string, RegencyItem[]>();
const districtsCache = new Map<string, DistrictItem[]>();

/**
 * Multi-CDN Fallback Fetcher:
 * Menjamin data wilayah tetap berhasil ditarik dengan mencoba 3 CDN berbeda:
 * 1. emsifa.github.io
 * 2. cdn.jsdelivr.net (High Speed Global CDN)
 * 3. raw.githubusercontent.com
 */
async function fetchWilayahWithFallback<T>(path: string): Promise<T[]> {
  const sources = [
    `https://cdn.jsdelivr.net/gh/emsifa/api-wilayah-indonesia@gh-pages${path}`,
    `https://emsifa.github.io/api-wilayah-indonesia${path}`,
    `https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/gh-pages${path}`,
  ];

  for (const src of sources) {
    try {
      const res = await fetch(src);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // try next source in loop
    }
  }

  return [];
}

export const indonesiaRegionService = {
  /**
   * Mengambil daftar seluruh Provinsi di Indonesia (Instant 0ms dari memori)
   */
  async getProvinces(): Promise<ProvinceItem[]> {
    return INDONESIA_PROVINCES;
  },

  /**
   * Mengambil daftar Kabupaten/Kota berdasarkan ID Provinsi
   */
  async getRegencies(provinceId: string): Promise<RegencyItem[]> {
    if (!provinceId) return [];
    if (regenciesCache.has(provinceId)) {
      return regenciesCache.get(provinceId)!;
    }

    try {
      const data = await fetchWilayahWithFallback<RegencyItem>(`/api/regencies/${provinceId}.json`);
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      if (sorted.length > 0) {
        regenciesCache.set(provinceId, sorted);
      }
      return sorted;
    } catch (err: any) {
      console.warn('getRegencies error:', err.message);
      return [];
    }
  },

  /**
   * Mengambil daftar Kecamatan berdasarkan ID Kabupaten/Kota
   */
  async getDistricts(regencyId: string): Promise<DistrictItem[]> {
    if (!regencyId) return [];
    if (districtsCache.has(regencyId)) {
      return districtsCache.get(regencyId)!;
    }

    try {
      const data = await fetchWilayahWithFallback<DistrictItem>(`/api/districts/${regencyId}.json`);
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      if (sorted.length > 0) {
        districtsCache.set(regencyId, sorted);
      }
      return sorted;
    } catch (err: any) {
      console.warn('getDistricts error:', err.message);
      return [];
    }
  },

  /**
   * Mencari data sekolah berdasarkan nama, NPSN, atau kombinasi wilayah
   */
  async searchSchools(params: {
    keyword?: string;
    provinceName?: string;
    regencyName?: string;
    districtName?: string;
  }): Promise<SchoolItem[]> {
    const rawKeyword = (params.keyword || '').trim();
    const rawDistrict = (params.districtName || '').trim();
    const rawRegency = (params.regencyName || '').replace(/^(KABUPATEN|KOTA)\s+/i, '').trim();

    // 1. Jika pengguna mengetik 8 digit angka, cari langsung by NPSN
    if (/^\d{8}$/.test(rawKeyword)) {
      try {
        const res = await fetch(`https://api-sekolah-indonesia.vercel.app/sekolah?npsn=${rawKeyword}`);
        if (res.ok) {
          const d = await res.json();
          if (d.dataSekolah && d.dataSekolah.length > 0) {
            return d.dataSekolah.map((s: any) => ({
              name: s.sekolah,
              npsn: s.npsn,
              level: s.bentuk || 'Sekolah',
              status: s.status === 'N' ? 'Negeri' : 'Swasta',
              district: s.kecamatan,
              regency: s.kabupaten_kota,
              province: s.propinsi,
              address: s.alamat_jalan || '',
            }));
          }
        }
      } catch (err) {
        console.warn('searchSchools NPSN error:', err);
      }
    }

    // 2. Tentukan kata kunci query pencarian
    const queryTerm = rawKeyword || rawDistrict || rawRegency;
    if (!queryTerm || queryTerm.length < 2) {
      return [];
    }

    try {
      const url = `https://api-sekolah-indonesia.vercel.app/sekolah/s?sekolah=${encodeURIComponent(queryTerm)}&perPage=50`;
      const res = await fetch(url);
      if (!res.ok) return [];

      const d = await res.json();
      const list: any[] = d.dataSekolah || [];

      // Map raw data ke SchoolItem
      let mapped: SchoolItem[] = list.map((s: any) => ({
        name: (s.sekolah || '').trim(),
        npsn: (s.npsn || '').trim(),
        level: s.bentuk || 'Sekolah',
        status: s.status === 'N' ? 'Negeri' : 'Swasta',
        district: (s.kecamatan || '').trim(),
        regency: (s.kabupaten_kota || '').trim(),
        province: (s.propinsi || '').trim(),
        address: (s.alamat_jalan || '').trim(),
      }));

      // Filter sekunder jika kabupaten dipilih
      if (rawRegency) {
        const filtered = mapped.filter((item) => {
          const itemReg = (item.regency || '').toLowerCase();
          return itemReg.includes(rawRegency.toLowerCase());
        });
        if (filtered.length > 0) {
          mapped = filtered;
        }
      }

      // Filter sekunder jika kecamatan dipilih
      if (rawDistrict) {
        const filteredDist = mapped.filter((item) => {
          const itemDist = (item.district || '').toLowerCase();
          return itemDist.includes(rawDistrict.toLowerCase());
        });
        if (filteredDist.length > 0) {
          mapped = filteredDist;
        }
      }

      return mapped;
    } catch (err: any) {
      console.warn('searchSchools error:', err.message);
      return [];
    }
  },
};

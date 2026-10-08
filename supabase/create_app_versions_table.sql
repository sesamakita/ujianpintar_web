-- ========================================================
-- Tabel Manajemen Versi Aplikasi & Pembaruan (In-App Update)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL DEFAULT 'android',       -- 'android' / 'ios'
    version_name VARCHAR(50) NOT NULL,                     -- Contoh: '1.0.1'
    version_code INT NOT NULL,                             -- Integer: 2, 3, dst.
    min_version_code INT DEFAULT 1,                        -- Versi minimal yang didukung (di bawah ini wajib update)
    title VARCHAR(150) DEFAULT 'Pembaruan Tersedia!',
    release_notes TEXT[] DEFAULT ARRAY[
        'Pembaruan fitur terbaru dan peningkatan kestabilan asesmen'
    ],
    apk_url TEXT NOT NULL,                                 -- URL unduhan APK di VPS / Storage
    is_force BOOLEAN DEFAULT FALSE,                        -- TRUE jika update wajib sebelum ujian
    is_active BOOLEAN DEFAULT TRUE,                        -- Hanya versi aktif yang dibaca
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk query cepat versi terbaru
CREATE INDEX IF NOT EXISTS idx_app_versions_platform_code 
ON public.app_versions(platform, version_code DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Siapapun (anon / siswa) boleh membaca (SELECT) versi aktif
CREATE POLICY "Allow public read active app versions" 
ON public.app_versions 
FOR SELECT 
USING (is_active = true);

-- Contoh Data Versi Awal
INSERT INTO public.app_versions (
    platform,
    version_name,
    version_code,
    min_version_code,
    title,
    release_notes,
    apk_url,
    is_force,
    is_active
) VALUES (
    'android',
    '1.0.1',
    2,
    1,
    'Pembaruan Aplikasi Tersedia!',
    ARRAY[
        'Sistem deteksi & notifikasi pembaruan aplikasi otomatis (In-App Update)',
        'Pemisahan kontainer Cek Hasil Ujian Mandiri dengan tema Indigo Claymorphism',
        'Penyelarasan grid 2 kolom simetris pada seluruh model dan resolusi layar HP',
        'Peningkatan performa rendering formula Matematika (KaTeX/LaTeX)'
    ],
    'https://api.ujianpintar.online/storage/v1/object/public/Mobile%20Apk%20UjianPintar/UjianPintar-v1.0-Android.apk',
    false,
    true
) ON CONFLICT DO NOTHING;

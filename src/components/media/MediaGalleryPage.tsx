import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Copy,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  Search,
  Maximize2,
  Check,
  CheckCircle2,
  X,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { TeacherMediaItem, MediaQuotaInfo } from '../../types/media';
import type { TeacherSubscription } from '../../types/subscription';
import { teacherMediaService, FREE_MEDIA_QUOTA, PRO_MEDIA_QUOTA } from '../../services/teacherMediaService';

interface MediaGalleryPageProps {
  currentUser: {
    email: string;
    id?: string;
    name?: string;
    school?: string;
  };
  subscription?: TeacherSubscription;
  onOpenUpgradeModal?: () => void;
}

export const MediaGalleryPage: React.FC<MediaGalleryPageProps> = ({
  currentUser,
  subscription,
  onOpenUpgradeModal,
}) => {
  const [items, setItems] = useState<TeacherMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<TeacherMediaItem | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [quotaInfo, setQuotaInfo] = useState<MediaQuotaInfo>({
    usedCount: 0,
    maxCount: FREE_MEDIA_QUOTA,
    remainingCount: FREE_MEDIA_QUOTA,
    isLimitReached: false,
    tier: subscription?.tier || 'free',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tier = subscription?.tier || 'free';
  const isPro = tier === 'pro' || tier === 'school';
  const userEmail = currentUser?.email || '';
  const userId = currentUser?.id;

  const filteredItems = items.filter((item) =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const formatFileSize = (bytes: number): string => {
    if (!bytes || isNaN(bytes)) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    loadMedia();
  }, [userEmail, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewItem) return;
      if (e.key === 'Escape') {
        setPreviewItem(null);
        setZoomScale(1);
      } else if (e.key === 'ArrowRight') {
        const currentIndex = filteredItems.findIndex((i) => i.id === previewItem.id);
        if (currentIndex !== -1 && currentIndex < filteredItems.length - 1) {
          setPreviewItem(filteredItems[currentIndex + 1]);
          setZoomScale(1);
        }
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = filteredItems.findIndex((i) => i.id === previewItem.id);
        if (currentIndex > 0) {
          setPreviewItem(filteredItems[currentIndex - 1]);
          setZoomScale(1);
        }
      } else if (e.key === '+' || e.key === '=') {
        setZoomScale((prev) => Math.min(3, prev + 0.25));
      } else if (e.key === '-' || e.key === '_') {
        setZoomScale((prev) => Math.max(0.5, prev - 0.25));
      } else if (e.key === '0') {
        setZoomScale(1);
      }
    };

    if (previewItem) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewItem, filteredItems]);

  const loadMedia = async () => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await teacherMediaService.getTeacherMedia(userEmail, userId);
      setItems(data);
      const quota = teacherMediaService.getQuotaInfo(userEmail, tier, data);
      setQuotaInfo(quota);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat galeri foto.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setErrorMessage('File harus berupa format gambar (PNG, JPG, JPEG, WebP).');
      return;
    }

    if (quotaInfo.isLimitReached) {
      setErrorMessage(
        isPro
          ? `Batas kuota foto Guru PRO (${PRO_MEDIA_QUOTA} foto) telah penuh. Silakan hapus foto yang tidak terpakai.`
          : `Batas kuota foto akun Gratis (${FREE_MEDIA_QUOTA} foto) telah tercapai. Upgrade ke Guru PRO untuk menyimpan hingga ${PRO_MEDIA_QUOTA} foto.`
      );
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await teacherMediaService.uploadMedia({
        file,
        fileName: file.name,
        userEmail: currentUser.email,
        userId: currentUser.id,
        tier,
      });

      if (res.success && res.item) {
        const updated = [res.item, ...items.filter((m) => m.id !== res.item!.id)];
        setItems(updated);
        const quota = teacherMediaService.getQuotaInfo(currentUser.email, tier, updated);
        setQuotaInfo(quota);
        showToast(`Foto "${res.item.fileName}" berhasil diunggah ke koleksi.`);
      } else {
        setErrorMessage(res.error || 'Gagal mengunggah foto.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteItem = async (item: TeacherMediaItem) => {
    if (!window.confirm(`Hapus foto "${item.fileName}" secara permanen dari koleksi?`)) return;

    try {
      const res = await teacherMediaService.deleteMedia(item.id, currentUser.email, currentUser.id);
      if (res.success) {
        const updated = items.filter((m) => m.id !== item.id);
        setItems(updated);
        const quota = teacherMediaService.getQuotaInfo(currentUser.email, tier, updated);
        setQuotaInfo(quota);
        showToast(`Foto "${item.fileName}" berhasil dihapus.`);
      } else {
        setErrorMessage(res.error || 'Gagal menghapus foto.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus foto.');
    }
  };

  const handleCopyUrl = (item: TeacherMediaItem) => {
    navigator.clipboard.writeText(item.fileUrl);
    setCopiedId(item.id);
    showToast('Link gambar berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 border border-white/10">
              <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
              <span>Media & Asset Storage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
              Koleksi Foto & Diagram Soal
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Simpan dan kelola gambar diagram matematika, peta, struktur biologi, atau ilustrasi soal untuk digunakan sewaktu-waktu saat menyusun paket ujian.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-[140px]">
              <span className="text-xs text-slate-300 block font-medium">Foto Tersimpan</span>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {quotaInfo.usedCount} <span className="text-sm text-slate-400 font-normal">/ {quotaInfo.maxCount}</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    quotaInfo.isLimitReached ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (quotaInfo.usedCount / quotaInfo.maxCount) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-[140px]">
              <span className="text-xs text-slate-300 block font-medium">Paket Akun</span>
              <div className="text-lg font-black text-white mt-1 flex items-center gap-1.5">
                <span>{isPro ? 'Guru PRO' : 'Gratis'}</span>
                {isPro && <Sparkles className="w-4 h-4 text-amber-300" />}
              </div>
              <span className="text-[11px] text-blue-200 block mt-1">
                {isPro ? 'Maks. 20 foto diagram' : 'Maks. 3 foto diagram'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Callout for Free Tier */}
      {!isPro && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Perlu Lebih Banyak Ruang untuk Gambar Soal?</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Akun Gratis memiliki batas <strong>{FREE_MEDIA_QUOTA} foto</strong>. Upgrade ke <strong>Guru PRO</strong> untuk menambah kapasitas hingga <strong>{PRO_MEDIA_QUOTA} foto</strong> dan nikmati fitur ekspor rapor Excel!
              </p>
            </div>
          </div>
          {onOpenUpgradeModal && (
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Upgrade ke PRO
            </button>
          )}
        </div>
      )}

      {/* Success & Error Alerts */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container: Controls & Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari foto berdasarkan nama file..."
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Upload Button & Hidden Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploading || quotaInfo.isLimitReached}
              onClick={() => fileInputRef.current?.click()}
              className={`h-10 px-5 rounded-xl text-xs font-display font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                quotaInfo.isLimitReached
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-blue-600/20'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengompres & Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Unggah Foto Baru</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Memuat koleksi foto...</p>
            <p className="text-xs text-slate-400 mt-1">Mengambil data dari server database VPS</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 border-2 border-dashed border-slate-200 rounded-3xl text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3.5 text-blue-600 shadow-2xs">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-slate-800 text-base">Koleksi Foto Masih Kosong</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Unggah file gambar dari komputer atau smartphone Anda. Gambar yang disimpan di sini dapat disisipkan langsung ke soal ujian tanpa perlu upload ulang.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-display font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Pilih Foto dari Perangkat</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Tidak ada foto yang sesuai dengan kata kunci "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Image - Click opens Full Image Zoom Viewer */}
                <div
                  onClick={() => {
                    setPreviewItem(item);
                    setZoomScale(1);
                  }}
                  className="relative aspect-video bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100 cursor-pointer"
                  title="Klik untuk melihat foto ukuran penuh"
                >
                  <img
                    src={item.fileUrl}
                    alt={item.fileName}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />

                  {/* Hover Action Overlay */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                        setZoomScale(1);
                      }}
                      className="w-9 h-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-xs transition-transform hover:scale-110 cursor-pointer"
                      title="Lihat Gambar Penuh (Zoom)"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(item);
                      }}
                      className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110 cursor-pointer"
                      title="Salin Link Gambar"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110 cursor-pointer"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      onClick={() => {
                        setPreviewItem(item);
                        setZoomScale(1);
                      }}
                      className="text-xs font-bold text-slate-900 truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                      title={item.fileName}
                    >
                      {item.fileName}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                      {formatFileSize(item.fileSize)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 font-sans">
                    <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === item.id ? 'Tersalin!' : 'Salin URL'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen High-Resolution Image Viewer Modal */}
      {previewItem && (
        <div
          onClick={() => {
            setPreviewItem(null);
            setZoomScale(1);
          }}
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in select-none"
        >
          {/* Top Bar Header */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between gap-4 bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-3 text-white backdrop-blur-md max-w-5xl w-full mx-auto shadow-2xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-display font-bold text-white truncate max-w-xs sm:max-w-md" title={previewItem.fileName}>
                  {previewItem.fileName}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatFileSize(previewItem.fileSize)} • {new Date(previewItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Toolbar: Zoom Controls, Copy URL, Close */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center bg-slate-800/80 border border-white/10 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Perkecil (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-2 text-slate-300 font-bold min-w-[48px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(3, prev + 0.25))}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Perbesar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Reset Skala (100%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopyUrl(previewItem)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Salin Link URL Foto"
              >
                {copiedId === previewItem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{copiedId === previewItem.id ? 'Tersalin!' : 'Salin URL'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewItem(null);
                  setZoomScale(1);
                }}
                className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer shadow-sm"
                title="Tutup Pratinjau (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Stage: Image + Navigation Arrows */}
          <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden p-2 sm:p-4 my-auto">
            {/* Prev Arrow */}
            {filteredItems.findIndex((i) => i.id === previewItem.id) > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = filteredItems.findIndex((i) => i.id === previewItem.id);
                  if (idx > 0) {
                    setPreviewItem(filteredItems[idx - 1]);
                    setZoomScale(1);
                  }
                }}
                className="absolute left-2 sm:left-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-white/20 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-2xl cursor-pointer"
                title="Foto Sebelumnya (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Main Full Image */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[75vh] flex items-center justify-center transition-transform duration-150 ease-out"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <img
                src={previewItem.fileUrl}
                alt={previewItem.fileName}
                className="max-h-[72vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-white/10 bg-slate-900/40 p-1"
              />
            </div>

            {/* Next Arrow */}
            {filteredItems.findIndex((i) => i.id === previewItem.id) < filteredItems.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = filteredItems.findIndex((i) => i.id === previewItem.id);
                  if (idx < filteredItems.length - 1) {
                    setPreviewItem(filteredItems[idx + 1]);
                    setZoomScale(1);
                  }
                }}
                className="absolute right-2 sm:right-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-white/20 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-2xl cursor-pointer"
                title="Foto Berikutnya (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Bar Hints */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-2.5 max-w-5xl w-full mx-auto backdrop-blur-md"
          >
            <span className="font-mono">
              Foto {filteredItems.findIndex((i) => i.id === previewItem.id) + 1} dari {filteredItems.length}
            </span>

            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300 font-mono">ESC</kbd> Tutup
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300 font-mono">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300 font-mono">→</kbd> Navigasi
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300 font-mono">+</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300 font-mono">-</kbd> Zoom
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setPreviewItem(null);
                setZoomScale(1);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

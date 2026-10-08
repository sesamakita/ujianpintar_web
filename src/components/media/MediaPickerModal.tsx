import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Check,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  Search,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { TeacherMediaItem, MediaQuotaInfo } from '../../types/media';
import type { TeacherSubscription } from '../../types/subscription';
import { teacherMediaService, FREE_MEDIA_QUOTA, PRO_MEDIA_QUOTA } from '../../services/teacherMediaService';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  currentUserEmail?: string;
  currentUserId?: string;
  subscription?: TeacherSubscription;
  onOpenUpgradeModal?: () => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  currentUserEmail = '',
  currentUserId,
  subscription,
  onOpenUpgradeModal,
}) => {
  const [items, setItems] = useState<TeacherMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<TeacherMediaItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const filteredItems = items.filter((item) =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const formatFileSize = (bytes: number): string => {
    if (!bytes || isNaN(bytes)) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const loadMedia = async () => {
    if (!currentUserEmail) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await teacherMediaService.getTeacherMedia(currentUserEmail, currentUserId);
      setItems(data);
      const quota = teacherMediaService.getQuotaInfo(currentUserEmail, tier, data);
      setQuotaInfo(quota);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat galeri foto.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, currentUserEmail]);

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
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewItem, filteredItems]);

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
        userEmail: currentUserEmail,
        userId: currentUserId,
        tier,
      });

      if (res.success && res.item) {
        const updated = [res.item, ...items.filter((m) => m.id !== res.item!.id)];
        setItems(updated);
        setSelectedItem(res.item);
        const quota = teacherMediaService.getQuotaInfo(currentUserEmail, tier, updated);
        setQuotaInfo(quota);
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

  const handleDeleteItem = async (e: React.MouseEvent, item: TeacherMediaItem) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus foto "${item.fileName}" dari koleksi Anda?`)) return;

    try {
      const res = await teacherMediaService.deleteMedia(item.id, currentUserEmail, currentUserId);
      if (res.success) {
        const updated = items.filter((m) => m.id !== item.id);
        setItems(updated);
        if (selectedItem?.id === item.id) {
          setSelectedItem(null);
        }
        const quota = teacherMediaService.getQuotaInfo(currentUserEmail, tier, updated);
        setQuotaInfo(quota);
      } else {
        setErrorMessage(res.error || 'Gagal menghapus foto.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus foto.');
    }
  };

  const handleConfirmSelect = () => {
    if (!selectedItem) return;
    onSelectImage(selectedItem.fileUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Pilih Media" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-display font-black text-base tracking-tight text-white flex items-center gap-2">
                <span>Koleksi Foto Soal</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                  isPro ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-slate-700 text-slate-300'
                }`}>
                  {isPro ? 'Guru PRO' : 'Gratis'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih foto diagram / ilustrasi soal untuk disisipkan ke dalam butir soal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Quota Progress Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari foto berdasarkan nama file..."
              className="w-full h-9 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Right Actions: Quota & Upload Button */}
          <div className="flex items-center gap-3">
            {/* Quota Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-600">
                Kapasitas: <strong className="text-slate-900">{quotaInfo.usedCount} / {quotaInfo.maxCount}</strong> Foto
              </span>
              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    quotaInfo.isLimitReached ? 'bg-rose-500' : quotaInfo.usedCount > 0 ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  style={{ width: `${Math.min(100, (quotaInfo.usedCount / quotaInfo.maxCount) * 100)}%` }}
                />
              </div>
            </div>

            {/* Upload Button */}
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
              className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                quotaInfo.isLimitReached
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-blue-600/20'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Unggah Foto Baru</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upgrade Callout if limit reached on free tier */}
        {!isPro && quotaInfo.isLimitReached && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Batas <strong>{FREE_MEDIA_QUOTA} foto</strong> akun Gratis telah tercapai. Upgrade ke Guru PRO untuk menyimpan hingga <strong>{PRO_MEDIA_QUOTA} foto</strong> diagram soal.
              </span>
            </div>
            {onOpenUpgradeModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpgradeModal();
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex-shrink-0"
              >
                Upgrade PRO
              </button>
            )}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-700">Memuat koleksi foto Anda...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3 text-blue-600">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="font-display font-bold text-slate-800 text-sm">Belum Ada Foto dalam Koleksi</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Unggah gambar diagram matematika, peta, struktur sel, atau ilustrasi soal untuk disimpan di koleksi Anda.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-display font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Pilih Foto dari Perangkat</span>
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada foto yang cocok dengan pencarian "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`group relative rounded-2xl border-2 transition-all p-2.5 flex flex-col justify-between cursor-pointer bg-white ${
                      isSelected
                        ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative aspect-video rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                      <img
                        src={item.fileUrl}
                        alt={item.fileName}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />

                      {/* Selection Checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md animate-in zoom-in-75">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Hover Action Overlay */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(item);
                            setZoomScale(1);
                          }}
                          className="w-8 h-8 rounded-lg bg-white text-slate-800 flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                          title="Perbesar Pratinjau (Zoom)"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(e, item)}
                          className="w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                          title="Hapus dari Koleksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="mt-2.5 pt-1">
                      <p className="text-xs font-bold text-slate-900 truncate" title={item.fileName}>
                        {item.fileName}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{formatFileSize(item.fileSize)}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 truncate">
            {selectedItem ? (
              <span>
                Foto terpilih: <strong className="text-slate-900">{selectedItem.fileName}</strong> ({formatFileSize(selectedItem.fileSize)})
              </span>
            ) : (
              <span>Klik salah satu foto untuk memilih.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleConfirmSelect}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-display font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Gunakan Gambar Ini</span>
            </button>
          </div>
        </div>
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

            {/* Toolbar: Zoom Controls, Close */}
            <div className="flex items-center gap-2 flex-shrink-0">
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

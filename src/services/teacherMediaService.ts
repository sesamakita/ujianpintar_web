import { supabase } from '../lib/supabase';
import type { TeacherMediaItem, MediaQuotaInfo } from '../types/media';
import type { SubscriptionTier } from '../types/subscription';

export const FREE_MEDIA_QUOTA = 3;
export const PRO_MEDIA_QUOTA = 20;

const isValidUUID = (str?: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Compresses an image file on the client using HTML5 Canvas to optimize storage and loading speed.
 */
export const compressImageFile = (
  file: File | Blob,
  maxDimension = 1200,
  quality = 0.82
): Promise<{ dataUrl: string; size: number; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format file gambar tidak didukung atau rusak.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Tidak dapat membuat canvas kompresi gambar.'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with optimal quality
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64Str = dataUrl.split(',')[1] || '';
        const size = Math.round((base64Str.length * 3) / 4);

        resolve({ dataUrl, size, mimeType });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const teacherMediaService = {
  /**
   * Calculate maximum allowed quota based on subscription tier
   */
  getMaxQuota(tier: SubscriptionTier = 'free'): number {
    if (tier === 'pro' || tier === 'school') {
      return PRO_MEDIA_QUOTA;
    }
    return FREE_MEDIA_QUOTA;
  },

  /**
   * Get storage cache key for local fallback
   */
  getStorageKey(userEmail: string): string {
    const clean = (userEmail || 'default').toLowerCase().trim();
    return `ujianpintar_teacher_media_${clean}`;
  },

  /**
   * Get cached media items from localStorage (0ms offline-first)
   */
  getCachedMedia(userEmail: string): TeacherMediaItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.getStorageKey(userEmail));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist media items to localStorage cache
   */
  setCachedMedia(userEmail: string, items: TeacherMediaItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(userEmail), JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to cache teacher media to localStorage:', err);
    }
  },

  /**
   * Calculate quota information
   */
  getQuotaInfo(userEmail: string, tier: SubscriptionTier = 'free', currentItems?: TeacherMediaItem[]): MediaQuotaInfo {
    const items = currentItems || this.getCachedMedia(userEmail);
    const maxCount = this.getMaxQuota(tier);
    const usedCount = items.length;
    const remainingCount = Math.max(0, maxCount - usedCount);

    return {
      usedCount,
      maxCount,
      remainingCount,
      isLimitReached: usedCount >= maxCount,
      tier,
    };
  },

  /**
   * Fetch all media items for the teacher from Supabase (with localStorage fallback)
   */
  async getTeacherMedia(userEmail: string, userId?: string): Promise<TeacherMediaItem[]> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail) return [];

    const cached = this.getCachedMedia(cleanEmail);

    try {
      let query = supabase.from('teacher_media').select('*');

      if (userId && isValidUUID(userId)) {
        query = query.or(`user_id.eq.${userId},user_email.eq.${cleanEmail}`);
      } else {
        query = query.eq('user_email', cleanEmail);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet on VPS or RLS issue; return local cache seamlessly
        if (!error.message?.includes('does not exist')) {
          console.info('Supabase teacher_media notice:', error.message);
        }
        return cached;
      }

      if (Array.isArray(data)) {
        const mapped: TeacherMediaItem[] = data.map((item) => ({
          id: item.id,
          userId: item.user_id,
          userEmail: item.user_email,
          fileName: item.file_name || 'Gambar Soal',
          fileSize: item.file_size || 0,
          mimeType: item.mime_type || 'image/jpeg',
          fileUrl: item.file_url,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at,
        }));

        this.setCachedMedia(cleanEmail, mapped);
        return mapped;
      }

      return cached;
    } catch (err) {
      console.warn('getTeacherMedia network error, using cache:', err);
      return cached;
    }
  },

  /**
   * Upload and save a new photo to the teacher's collection
   */
  async uploadMedia(params: {
    file: File | Blob;
    fileName?: string;
    userEmail: string;
    userId?: string;
    tier?: SubscriptionTier;
  }): Promise<{ success: boolean; item?: TeacherMediaItem; error?: string; isLimitReached?: boolean }> {
    const { file, userEmail, userId, tier = 'free' } = params;
    const cleanEmail = (userEmail || '').toLowerCase().trim();

    if (!cleanEmail) {
      return { success: false, error: 'Email pengguna tidak valid.' };
    }

    // 1. Quota Check
    const currentMedia = await this.getTeacherMedia(cleanEmail, userId);
    const maxQuota = this.getMaxQuota(tier);

    if (currentMedia.length >= maxQuota) {
      const isFree = tier === 'free';
      return {
        success: false,
        isLimitReached: true,
        error: isFree
          ? `Batas kuota akun Gratis (${FREE_MEDIA_QUOTA} foto) telah tercapai. Upgrade ke Guru PRO untuk menyimpan hingga ${PRO_MEDIA_QUOTA} foto koleksi.`
          : `Batas kuota koleksi foto (${PRO_MEDIA_QUOTA} foto) telah tercapai. Hapus beberapa foto lama untuk mengunggah yang baru.`,
      };
    }

    try {
      // 2. Client-side Image Compression
      const { dataUrl, size, mimeType } = await compressImageFile(file);
      const originalName = params.fileName || (file instanceof File ? file.name : `diagram_${Date.now()}.jpg`);
      const mediaId = generateUUID();

      const newItem: TeacherMediaItem = {
        id: mediaId,
        userId: userId && isValidUUID(userId) ? userId : undefined,
        userEmail: cleanEmail,
        fileName: originalName,
        fileSize: size,
        mimeType,
        fileUrl: dataUrl,
        createdAt: new Date().toISOString(),
      };

      // 3. Persist to Supabase teacher_media table
      try {
        const payload: any = {
          id: mediaId,
          user_email: cleanEmail,
          file_name: originalName,
          file_size: size,
          mime_type: mimeType,
          file_url: dataUrl,
          created_at: newItem.createdAt,
        };

        if (userId && isValidUUID(userId)) {
          payload.user_id = userId;
        }

        const { error: dbError } = await supabase.from('teacher_media').insert([payload]);
        if (dbError) {
          console.warn('Supabase insert teacher_media notice:', dbError.message);
        }
      } catch (dbErr) {
        console.warn('Supabase teacher_media offline, saving to local cache:', dbErr);
      }

      // 4. Update Local Cache
      const updatedList = [newItem, ...currentMedia.filter((m) => m.id !== mediaId)];
      this.setCachedMedia(cleanEmail, updatedList);

      return {
        success: true,
        item: newItem,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Gagal memproses dan menyimpan file gambar.',
      };
    }
  },

  /**
   * Delete a photo from the collection
   */
  async deleteMedia(
    id: string,
    userEmail: string,
    _userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();

    try {
      // Delete from Supabase
      try {
        await supabase.from('teacher_media').delete().eq('id', id);
      } catch (dbErr) {
        console.warn('Supabase delete teacher_media notice:', dbErr);
      }

      // Update Local Cache
      const current = this.getCachedMedia(cleanEmail);
      const filtered = current.filter((m) => m.id !== id);
      this.setCachedMedia(cleanEmail, filtered);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Gagal menghapus file gambar dari koleksi.',
      };
    }
  },
};

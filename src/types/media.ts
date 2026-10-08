import type { SubscriptionTier } from './subscription';

export interface TeacherMediaItem {
  id: string;
  userId?: string;
  userEmail: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  fileUrl: string; // optimized Data URI or storage URL
  createdAt: string;
  updatedAt?: string;
}

export interface MediaQuotaInfo {
  usedCount: number;
  maxCount: number;
  remainingCount: number;
  isLimitReached: boolean;
  tier: SubscriptionTier;
}

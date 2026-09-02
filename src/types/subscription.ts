export type SubscriptionTier = 'free' | 'pro' | 'school';

export type BillingCycle = 'monthly' | 'yearly';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'free';

export interface SubscriptionPlan {
  id: string;
  name: string;
  badge?: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  limitations?: string[];
  isPopular?: boolean;
  ctaText: string;
}

export interface TeacherSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  planName: string;
  billingCycle?: BillingCycle;
  startedAt: string;
  expiresAt: string;
  daysRemaining: number;
  isTrial: boolean;
  schoolNpsn?: string;
  maxExamsPerMonth: number; // -1 for unlimited
  maxStudentsPerExam: number; // -1 for unlimited
  canUseCustomLogo: boolean;
  canExportAdvanced: boolean;
  canUseFullscreenLock: boolean;
}

export type PaymentChannel = 'qris' | 'va_bca' | 'va_mandiri' | 'va_bri' | 'va_bni' | 'gopay' | 'ovo' | 'dana';

export interface PaymentMethodOption {
  id: PaymentChannel;
  name: string;
  category: 'qris' | 'va' | 'ewallet';
  iconName: string;
  feePercent: number;
  feeFlat: number;
  instruction: string;
}

export interface TransactionRecord {
  id: string;
  invoiceNumber: string;
  planId: string;
  planName: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  amount: number;
  fee: number;
  totalAmount: number;
  paymentChannel: PaymentChannel;
  paymentChannelName: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  createdAt: string;
  paidAt?: string;
  customerEmail: string;
  customerName: string;
}

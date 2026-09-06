import { supabase } from '../lib/supabase';
import type { 
  SubscriptionPlan, 
  TeacherSubscription, 
  TransactionRecord, 
  PaymentMethodOption, 
  PaymentChannel, 
  BillingCycle,
  SubscriptionTier 
} from '../types/subscription';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Guru Basic',
    badge: 'Gratis',
    tier: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Cocok untuk guru yang baru memulai ujian digital berbasis kelas.',
    features: [
      'Maksimal 3 sesi ujian aktif per bulan',
      'Kapasitas hingga 40 siswa per ujian (1 Kelas)',
      'Bank soal pilihan ganda, B/S, & isian',
      'Simulasi pengerjaan smartphone siswa',
      'Ekspor rekap nilai standar (.csv)',
    ],
    limitations: [
      'Tidak ada kustomisasi logo sekolah di lembar ujian',
      'Belum mendukung ekspor format raport Excel (.xlsx)',
    ],
    ctaText: 'Paket Saat Ini',
  },
  {
    id: 'pro',
    name: 'Guru PRO',
    badge: 'Paling Populer',
    isPopular: true,
    tier: 'pro',
    priceMonthly: 20000,
    priceYearly: 180000, // Rp 15.000 / bulan (Hemat 25%)
    description: 'Solusi lengkap untuk guru mandiri dengan ujian tanpa batas dan pengawasan ketat.',
    features: [
      '**Unlimited (Tanpa Batas)** sesi ujian aktif',
      '**Unlimited (Tanpa Batas)** kapasitas siswa',
      'Penguncian layar penuh (**Fullscreen Lock**) & deteksi tab ketat',
      'Editor rumus matematika LaTeX KaTeX tak terbatas',
      'Ekspor nilai lengkap format Excel (.xlsx) & CSV',
      'Lencana akun PRO resmi & prioritas grading',
      'Stempel integritas anti-manipulasi SHA-256',
    ],
    ctaText: 'Tingkatkan ke PRO',
  },
  {
    id: 'school',
    name: 'Lisensi Sekolah',
    badge: 'Institusi',
    tier: 'school',
    priceMonthly: 0,
    priceYearly: 1500000, // Rp 1.500.000 / tahun per NPSN
    description: 'Lisensi resmi untuk seluruh dewan guru dalam satu satuan pendidikan (NPSN).',
    features: [
      '**Semua akun guru dalam 1 NPSN** otomatis berstatus PRO',
      '**Unlimited** siswa, kelas, dan ujian seluruh sekolah',
      'Kustom logo resmi & kop surat sekolah pada ujian siswa',
      'Bank soal kolektif antar guru satu sekolah',
      'Rekap analitik kelulusan per tingkat kelas & mata pelajaran',
      'Dukungan teknis prioritas via WhatsApp Hotline',
    ],
    ctaText: 'Daftarkan Sekolah',
  },
];

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'qris',
    name: 'QRIS Instan (Semua E-Wallet & Mobile Banking)',
    category: 'qris',
    iconName: 'QrCode',
    feePercent: 0.7,
    feeFlat: 0,
    instruction: 'Pindai kode QR menggunakan GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin, dll.',
  },
  {
    id: 'va_bca',
    name: 'BCA Virtual Account',
    category: 'va',
    iconName: 'CreditCard',
    feePercent: 0,
    feeFlat: 2500,
    instruction: 'Transfer melalui ATM BCA, KlikBCA, atau BCA Mobile.',
  },
  {
    id: 'va_mandiri',
    name: 'Mandiri Virtual Account (Livin)',
    category: 'va',
    iconName: 'CreditCard',
    feePercent: 0,
    feeFlat: 2500,
    instruction: 'Bayar via aplikasi Livin by Mandiri atau ATM Mandiri.',
  },
  {
    id: 'va_bri',
    name: 'BRI Virtual Account (BRIMO)',
    category: 'va',
    iconName: 'CreditCard',
    feePercent: 0,
    feeFlat: 2500,
    instruction: 'Bayar via aplikasi BRImo atau ATM BRI.',
  },
  {
    id: 'gopay',
    name: 'GoPay / GoPay Later',
    category: 'ewallet',
    iconName: 'Smartphone',
    feePercent: 1.5,
    feeFlat: 0,
    instruction: 'Buka notifikasi di aplikasi Gojek / Tokopedia untuk konfirmasi.',
  },
  {
    id: 'dana',
    name: 'DANA E-Wallet',
    category: 'ewallet',
    iconName: 'Smartphone',
    feePercent: 1.5,
    feeFlat: 0,
    instruction: 'Konfirmasi pembayaran instan di aplikasi DANA Anda.',
  },
];

export const subscriptionService = {
  /**
   * Get all available subscription plans
   */
  getAvailablePlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  },

  /**
   * Fetch current teacher's subscription status from Supabase & local cache
   */
  async getTeacherSubscription(teacherEmail?: string): Promise<TeacherSubscription> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const cleanEmail = (user?.email || teacherEmail || '').toLowerCase().trim();

      let tier: SubscriptionTier = 'free';
      let expiresAt = '';
      let startedAt = '';
      let isTrial = false;
      let billingCycle: BillingCycle = 'monthly';

      // 1. Read from Supabase user metadata or profiles table
      const meta = user?.user_metadata || {};
      if (meta.subscription_tier) {
        tier = meta.subscription_tier as SubscriptionTier;
        expiresAt = meta.subscription_expires_at || '';
        startedAt = meta.subscription_started_at || '';
        isTrial = !!meta.is_subscription_trial;
        billingCycle = meta.subscription_billing_cycle || 'monthly';
      }

      // Check profile row in Supabase
      if (user?.id) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (prof?.subscription_tier) {
            tier = prof.subscription_tier as SubscriptionTier;
            expiresAt = prof.subscription_expires_at || expiresAt;
            startedAt = prof.subscription_started_at || startedAt;
          }
        } catch {
          // ignore column missing
        }
      }

      // 2. Local cache fallback
      if (typeof window !== 'undefined' && cleanEmail) {
        const cachedRaw = localStorage.getItem(`ujianpintar_subscription_${cleanEmail}`);
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            tier = tier !== 'free' ? tier : parsed.tier || 'free';
            expiresAt = expiresAt || parsed.expiresAt;
            startedAt = startedAt || parsed.startedAt;
            isTrial = isTrial || !!parsed.isTrial;
            billingCycle = billingCycle || parsed.billingCycle;
          } catch {
            // ignore
          }
        }
      }

      // 3. Compute remaining days
      let daysRemaining = 0;
      let status: 'active' | 'trial' | 'expired' | 'free' = 'free';

      if (expiresAt) {
        const now = new Date().getTime();
        const expiryTime = new Date(expiresAt).getTime();
        const diffMs = expiryTime - now;
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        if (daysRemaining > 0) {
          status = isTrial ? 'trial' : 'active';
        } else if (tier !== 'free') {
          status = 'expired';
          tier = 'free'; // downgraded if expired
        }
      }

      const planMeta = SUBSCRIPTION_PLANS.find((p) => p.tier === tier) || SUBSCRIPTION_PLANS[0];

      const sub: TeacherSubscription = {
        tier,
        status,
        planName: planMeta.name,
        billingCycle,
        startedAt: startedAt || new Date().toISOString(),
        expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining,
        isTrial,
        maxExamsPerMonth: tier === 'free' ? 3 : -1,
        maxStudentsPerExam: tier === 'free' ? 40 : -1,
        canUseCustomLogo: tier === 'school',
        canExportAdvanced: tier !== 'free',
        canUseFullscreenLock: tier !== 'free',
      };

      return sub;
    } catch (err: any) {
      console.warn('getTeacherSubscription exception:', err.message);
      return {
        tier: 'free',
        status: 'free',
        planName: 'Guru Basic',
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 30,
        isTrial: false,
        maxExamsPerMonth: 3,
        maxStudentsPerExam: 40,
        canUseCustomLogo: false,
        canExportAdvanced: false,
        canUseFullscreenLock: false,
      };
    }
  },

  /**
   * Save / Cache Teacher Subscription
   */
  saveSubscription(email: string, sub: TeacherSubscription): void {
    if (typeof window !== 'undefined') {
      const cleanEmail = email.toLowerCase().trim();
      localStorage.setItem(`ujianpintar_subscription_${cleanEmail}`, JSON.stringify(sub));
    }
  },

  /**
   * Activate Free 14-Day PRO Trial for new teachers
   */
  async activateFreeTrial(email: string): Promise<TeacherSubscription> {
    const cleanEmail = email.toLowerCase().trim();
    const started = new Date();
    const expiry = new Date(started.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: {
            subscription_tier: 'pro',
            subscription_started_at: started.toISOString(),
            subscription_expires_at: expiry.toISOString(),
            is_subscription_trial: true,
          },
        });
      }
    } catch {
      // offline fallback
    }

    const sub: TeacherSubscription = {
      tier: 'pro',
      status: 'trial',
      planName: 'Guru PRO (Trial 14 Hari)',
      billingCycle: 'monthly',
      startedAt: started.toISOString(),
      expiresAt: expiry.toISOString(),
      daysRemaining: 14,
      isTrial: true,
      maxExamsPerMonth: -1,
      maxStudentsPerExam: -1,
      canUseCustomLogo: false,
      canExportAdvanced: true,
      canUseFullscreenLock: true,
    };

    if (typeof window !== 'undefined' && cleanEmail) {
      localStorage.setItem(`ujianpintar_subscription_${cleanEmail}`, JSON.stringify(sub));
    }

    return sub;
  },

  /**
   * Create Checkout Transaction
   */
  createCheckoutTransaction(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    paymentChannel: PaymentChannel,
    customer: { email: string; name: string }
  ): TransactionRecord {
    const effectiveCycle: BillingCycle = plan.tier === 'school' ? 'yearly' : billingCycle;
    const isYearly = effectiveCycle === 'yearly';
    const rawPrice = isYearly ? plan.priceYearly : plan.priceMonthly;
    const paymentMeta = PAYMENT_METHODS.find((p) => p.id === paymentChannel) || PAYMENT_METHODS[0];

    const fee = Math.round((rawPrice * paymentMeta.feePercent) / 100) + paymentMeta.feeFlat;
    const totalAmount = rawPrice + fee;
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const transaction: TransactionRecord = {
      id: `trx-${Date.now()}`,
      invoiceNumber: invoiceNum,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      billingCycle: effectiveCycle,
      amount: rawPrice,
      fee,
      totalAmount,
      paymentChannel,
      paymentChannelName: paymentMeta.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
      customerEmail: customer.email,
      customerName: customer.name,
    };

    return transaction;
  },

  /**
   * Process and Simulate Payment Completion (Activates PRO or School Tier)
   */
  async processSimulatedPayment(
    transaction: TransactionRecord
  ): Promise<{ success: boolean; subscription: TeacherSubscription; error?: string }> {
    const cleanEmail = transaction.customerEmail.toLowerCase().trim();
    const started = new Date();
    
    // Add duration: 30 days for monthly, 365 days for yearly
    const durationDays = transaction.billingCycle === 'yearly' ? 365 : 30;
    const expiry = new Date(started.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 1. Update in Supabase Auth user metadata
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: {
            subscription_tier: transaction.tier,
            subscription_billing_cycle: transaction.billingCycle,
            subscription_started_at: started.toISOString(),
            subscription_expires_at: expiry.toISOString(),
            is_subscription_trial: false,
          },
        });

        // Try updating profiles table
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            subscription_tier: transaction.tier,
            subscription_expires_at: expiry.toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch {
          // ignore column missing
        }
      }
    } catch (err: any) {
      console.warn('processSimulatedPayment Supabase update warning:', err.message);
    }

    // 2. Create updated subscription object
    const updatedSub: TeacherSubscription = {
      tier: transaction.tier,
      status: 'active',
      planName: transaction.planName,
      billingCycle: transaction.billingCycle,
      startedAt: started.toISOString(),
      expiresAt: expiry.toISOString(),
      daysRemaining: durationDays,
      isTrial: false,
      maxExamsPerMonth: -1,
      maxStudentsPerExam: -1,
      canUseCustomLogo: transaction.tier === 'school',
      canExportAdvanced: true,
      canUseFullscreenLock: true,
    };

    // 3. Save to localStorage
    if (typeof window !== 'undefined' && cleanEmail) {
      localStorage.setItem(`ujianpintar_subscription_${cleanEmail}`, JSON.stringify(updatedSub));

      // Save transaction to history
      const historyRaw = localStorage.getItem(`ujianpintar_transactions_${cleanEmail}`);
      const history: TransactionRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
      const completedTrx: TransactionRecord = {
        ...transaction,
        status: 'paid',
        paidAt: new Date().toISOString(),
      };
      history.unshift(completedTrx);
      localStorage.setItem(`ujianpintar_transactions_${cleanEmail}`, JSON.stringify(history));
    }

    return {
      success: true,
      subscription: updatedSub,
    };
  },

  /**
   * Get Transaction / Billing History for Current Teacher
   */
  getTransactionHistory(teacherEmail?: string): TransactionRecord[] {
    if (typeof window === 'undefined') return [];
    const cleanEmail = (teacherEmail || '').toLowerCase().trim();
    if (!cleanEmail) return [];

    const historyRaw = localStorage.getItem(`ujianpintar_transactions_${cleanEmail}`);
    if (historyRaw) {
      try {
        return JSON.parse(historyRaw);
      } catch {
        return [];
      }
    }
    return [];
  },
};

export default subscriptionService;

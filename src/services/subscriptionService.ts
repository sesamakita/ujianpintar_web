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

export const DANA_CONFIG = {
  accountNumber: '0821-9692-9193',
  accountNumberRaw: '082196929193',
  accountName: 'Deni Indrayana',
  whatsappHotline: '082196929193',
  telegramBotToken: '8946135531:AAF7XxekBfzesHM5RxAOgP_EgotKSOFXh_s',
  telegramChatId: '8971674377',
  qrisImageUrl: '/qris_dnapps.jpeg',
};

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'dana',
    name: 'Transfer Saldo DANA (Bebas Biaya Admin)',
    category: 'ewallet',
    iconName: 'Smartphone',
    feePercent: 0,
    feeFlat: 0,
    instruction: 'Transfer langsung ke akun DANA 0821-9692-9193 a.n Deni Indrayana.',
  },
  {
    id: 'qris',
    name: 'QRIS DANA (Semua Bank & E-Wallet)',
    category: 'qris',
    iconName: 'QrCode',
    feePercent: 0,
    feeFlat: 0,
    instruction: 'Pindai kode QRIS menggunakan DANA, BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, dll.',
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
   * Create Checkout Transaction with 3-digit Unique Code for DANA Verification
   */
  createCheckoutTransaction(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    paymentChannel: PaymentChannel = 'dana',
    customer: { email: string; name: string; school?: string; whatsapp?: string }
  ): TransactionRecord {
    const effectiveCycle: BillingCycle = plan.tier === 'school' ? 'yearly' : billingCycle;
    const isYearly = effectiveCycle === 'yearly';
    const rawPrice = isYearly ? plan.priceYearly : plan.priceMonthly;
    const paymentMeta = PAYMENT_METHODS.find((p) => p.id === paymentChannel) || PAYMENT_METHODS[0];

    // Generate unique code 3 digits (101 - 899)
    const uniqueCode = Math.floor(100 + Math.random() * 899);
    const fee = Math.round((rawPrice * paymentMeta.feePercent) / 100) + paymentMeta.feeFlat;
    const totalAmount = rawPrice + fee + uniqueCode;
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const transaction: TransactionRecord = {
      id: `trx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      invoiceNumber: invoiceNum,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      billingCycle: effectiveCycle,
      amount: rawPrice,
      fee,
      uniqueCode,
      totalAmount,
      paymentChannel,
      paymentChannelName: paymentMeta.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
      customerEmail: customer.email,
      customerName: customer.name,
      customerSchool: customer.school || '',
      customerWhatsapp: customer.whatsapp || '',
    };

    return transaction;
  },

  /**
   * Save Payment Transaction to Supabase & Local Cache
   */
  async savePaymentTransaction(transaction: TransactionRecord): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('payment_transactions').insert({
        id: transaction.id,
        invoice_number: transaction.invoiceNumber,
        teacher_id: user?.id || null,
        customer_name: transaction.customerName,
        customer_email: transaction.customerEmail,
        customer_whatsapp: transaction.customerWhatsapp || '',
        customer_school: transaction.customerSchool || '',
        plan_id: transaction.planId,
        plan_name: transaction.planName,
        tier: transaction.tier,
        billing_cycle: transaction.billingCycle,
        base_amount: transaction.amount,
        unique_code: transaction.uniqueCode || 0,
        total_amount: transaction.totalAmount,
        payment_channel: transaction.paymentChannel,
        status: 'pending',
        created_at: transaction.createdAt,
      });

      if (error) {
        console.warn('Supabase savePaymentTransaction warning:', error.message);
      }

      // Save to local cache
      if (typeof window !== 'undefined' && transaction.customerEmail) {
        const cleanEmail = transaction.customerEmail.toLowerCase().trim();
        const historyRaw = localStorage.getItem(`ujianpintar_transactions_${cleanEmail}`);
        const history: TransactionRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
        const filtered = history.filter((t) => t.id !== transaction.id);
        filtered.unshift(transaction);
        localStorage.setItem(`ujianpintar_transactions_${cleanEmail}`, JSON.stringify(filtered));
      }

      return true;
    } catch (err: any) {
      console.warn('savePaymentTransaction exception:', err.message);
      return false;
    }
  },

  /**
   * Send Push Notification to Telegram Admin Bot with 1-Click Inline Keyboard Approval
   */
  async sendTelegramOrderNotification(transaction: TransactionRecord): Promise<boolean> {
    try {
      const formatRupiah = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

      const daysToAdd = transaction.billingCycle === 'yearly' ? 365 : 30;
      const cycleText = transaction.billingCycle === 'yearly' ? 'Tahunan (1 Tahun)' : 'Bulanan (1 Bulan)';

      const text = `🛒 <b>ORDER LISENSI BARU DITERIMA!</b>
━━━━━━━━━━━━━━━━━━━
📋 <b>Invoice:</b> <code>${transaction.invoiceNumber}</code>
👤 <b>Nama Guru:</b> <b>${transaction.customerName}</b>
📧 <b>Email:</b> <code>${transaction.customerEmail}</code>
🏫 <b>Sekolah:</b> ${transaction.customerSchool || '-'}
📱 <b>WhatsApp:</b> ${transaction.customerWhatsapp || '-'}

📦 <b>Paket:</b> <b>${transaction.planName}</b> (${cycleText})
💰 <b>Harga Normal:</b> ${formatRupiah(transaction.amount)}
🔢 <b>Kode Unik:</b> +${formatRupiah(transaction.uniqueCode || 0)}
💵 <b>TOTAL TRANSFER:</b> <b>${formatRupiah(transaction.totalAmount)}</b>
💳 <b>Metode:</b> ${transaction.paymentChannelName}
🎯 <b>Tujuan:</b> DANA <code>0821-9692-9193</code> (Deni Indrayana)

⏰ <b>Waktu:</b> ${new Date().toLocaleString('id-ID')}
━━━━━━━━━━━━━━━━━━━
<i>Silakan cek mutasi aplikasi DANA Anda. Jika nominal <b>${formatRupiah(transaction.totalAmount)}</b> sudah masuk, klik tombol di bawah ini:</i>`;

      const payload = {
        chat_id: DANA_CONFIG.telegramChatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `✅ Setujui & Aktifkan (${transaction.billingCycle === 'yearly' ? '1 Thn' : '1 Bln'})`,
                callback_data: `approve_${daysToAdd}_${transaction.id}`,
              },
              {
                text: '❌ Tolak / Batalkan',
                callback_data: `reject_${transaction.id}`,
              },
            ],
          ],
        },
      };

      const res = await fetch(`https://api.telegram.org/bot${DANA_CONFIG.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return !!data.ok;
    } catch (err: any) {
      console.warn('sendTelegramOrderNotification warning:', err.message);
      return false;
    }
  },

  /**
   * Generate Direct WhatsApp CS URL with Formatted Order Confirmation Statement
   */
  generateWhatsAppOrderUrl(transaction: TransactionRecord): string {
    const formatRupiah = (num: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

    const message = `Halo Admin UjianPintar / Guru Hebat, saya telah melakukan pemesanan aktivasi akun:

📋 *No. Invoice:* ${transaction.invoiceNumber}
👤 *Nama Guru:* ${transaction.customerName}
📧 *Email Akun:* ${transaction.customerEmail}
🏫 *Asal Sekolah:* ${transaction.customerSchool || '-'}
📱 *No. WhatsApp:* ${transaction.customerWhatsapp || '-'}
📦 *Paket:* ${transaction.planName} (${transaction.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
💰 *Total Ditransfer:* ${formatRupiah(transaction.totalAmount)}
💳 *Metode:* DANA (0821-9692-9193 a.n Deni Indrayana)

Saya telah mentransfer tepat sejumlah *${formatRupiah(transaction.totalAmount)}*. Mohon konfirmasi dan verifikasi aktivasinya. Terima kasih!`;

    const cleanNumber = DANA_CONFIG.whatsappHotline.replace(/^0/, '62').replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Realtime Listener & Polling Fallback for Payment Approval from Telegram Bot
   */
  subscribeToTransactionStatus(
    transactionId: string,
    onStatusChange: (status: 'paid' | 'rejected' | 'pending', updatedRecord?: any) => void
  ): () => void {
    let isCleanedUp = false;

    // 1. Setup Supabase Realtime channel
    const channel = supabase
      .channel(`trx_${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payment_transactions',
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          if (isCleanedUp) return;
          const newStatus = payload.new?.status;
          if (newStatus === 'paid' || newStatus === 'rejected') {
            onStatusChange(newStatus, payload.new);
          }
        }
      )
      .subscribe();

    // 2. Setup 2.5-second polling fallback
    const pollTimer = setInterval(async () => {
      if (isCleanedUp) return;
      try {
        const { data } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('id', transactionId)
          .maybeSingle();

        if (data && (data.status === 'paid' || data.status === 'rejected')) {
          onStatusChange(data.status, data);
        }
      } catch {
        // ignore polling errors
      }
    }, 2500);

    return () => {
      isCleanedUp = true;
      clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  },

  /**
   * Apply and Save Activated Subscription to Teacher Account
   */
  async applyActivatedSubscription(transaction: TransactionRecord): Promise<TeacherSubscription> {
    const cleanEmail = transaction.customerEmail.toLowerCase().trim();
    const started = new Date();
    const durationDays = transaction.billingCycle === 'yearly' ? 365 : 30;
    const expiry = new Date(started.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Update Supabase Auth user metadata & profiles table
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

        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            subscription_tier: transaction.tier,
            subscription_expires_at: expiry.toISOString(),
            subscription_started_at: started.toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.warn('applyActivatedSubscription metadata error:', err.message);
    }

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

    if (typeof window !== 'undefined' && cleanEmail) {
      localStorage.setItem(`ujianpintar_subscription_${cleanEmail}`, JSON.stringify(updatedSub));

      const historyRaw = localStorage.getItem(`ujianpintar_transactions_${cleanEmail}`);
      const history: TransactionRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
      const completedTrx: TransactionRecord = {
        ...transaction,
        status: 'paid',
        paidAt: new Date().toISOString(),
      };
      const filtered = history.filter((h) => h.id !== transaction.id);
      filtered.unshift(completedTrx);
      localStorage.setItem(`ujianpintar_transactions_${cleanEmail}`, JSON.stringify(filtered));
    }

    return updatedSub;
  },

  /**
   * Process and Simulate Payment Completion (Activates PRO or School Tier)
   */
  async processSimulatedPayment(
    transaction: TransactionRecord
  ): Promise<{ success: boolean; subscription: TeacherSubscription; error?: string }> {
    const updatedSub = await this.applyActivatedSubscription(transaction);

    // Try updating status in Supabase if exists
    try {
      await supabase
        .from('payment_transactions')
        .update({ status: 'paid', paid_at: new Date().toISOString(), approved_by: 'Simulasi Pengguna' })
        .eq('id', transaction.id);
    } catch {
      // ignore
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

    // Auto-reset once for all users to wipe out previous test / demo invoice data
    if (!localStorage.getItem('ujianpintar_invoice_reset_done_v2')) {
      localStorage.removeItem(`ujianpintar_transactions_${cleanEmail}`);
      localStorage.removeItem('ujianpintar_transactions');
      localStorage.setItem('ujianpintar_invoice_reset_done_v2', 'true');
      return [];
    }

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

  /**
   * Clear / Reset Billing & Invoice Transaction History
   */
  async clearTransactionHistory(teacherEmail?: string): Promise<boolean> {
    if (typeof window === 'undefined') return true;
    const cleanEmail = (teacherEmail || '').toLowerCase().trim();
    if (cleanEmail) {
      localStorage.removeItem(`ujianpintar_transactions_${cleanEmail}`);
    }
    localStorage.removeItem('ujianpintar_transactions');
    localStorage.setItem('ujianpintar_invoice_reset_done_v2', 'true');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase.from('payment_transactions').delete().eq('teacher_id', user.id);
      } else if (cleanEmail) {
        await supabase.from('payment_transactions').delete().eq('customer_email', cleanEmail);
      }
    } catch {
      // ignore
    }

    return true;
  },
};

export default subscriptionService;

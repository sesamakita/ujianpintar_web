import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Building2, 
  Calendar, 
  CreditCard, 
  Receipt, 
  CheckCircle2,
  Gift,
  Info,
  Layers,
  Cpu,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Award,
  Key,
  Flame,
  Globe2,
  Lock,
  FileCheck2
} from 'lucide-react';
import type { 
  SubscriptionPlan, 
  BillingCycle, 
  TeacherSubscription, 
  TransactionRecord 
} from '../../types/subscription';
import { subscriptionService, SUBSCRIPTION_PLANS } from '../../services/subscriptionService';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';
import { SchoolLicenseRedeemCard } from './SchoolLicenseRedeemCard';
import { schoolLicenseService } from '../../services/schoolLicenseService';

interface SubscriptionAndAboutPageProps {
  currentUser: {
    name: string;
    email: string;
    school: string;
    subject: string;
    whatsapp?: string;
    nip?: string;
    npsn?: string;
  };
  subscription: TeacherSubscription;
  onSubscriptionUpdated: (updatedSub: TeacherSubscription) => void;
  defaultSubView?: 'pricing' | 'about';
}

export const SubscriptionAndAboutPage: React.FC<SubscriptionAndAboutPageProps> = ({
  currentUser,
  subscription,
  onSubscriptionUpdated,
  defaultSubView = 'pricing',
}) => {
  const [activeView, setActiveView] = useState<'pricing' | 'about'>(defaultSubView);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [isTrialActivating, setIsTrialActivating] = useState(false);
  
  // Voucher code state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherStatus, setVoucherStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const transactions: TransactionRecord[] = subscriptionService.getTransactionHistory(currentUser.email);

  const handleActivateTrial = async () => {
    setIsTrialActivating(true);
    const trialSub = await subscriptionService.activateFreeTrial(currentUser.email);
    setIsTrialActivating(false);
    onSubscriptionUpdated(trialSub);
  };

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = voucherCode.trim().toUpperCase();
    if (!clean) return;

    // 1. Try redeeming as a School License Code first (Option 1)
    const schoolResult = schoolLicenseService.redeemSchoolCode(clean, {
      email: currentUser.email,
      name: currentUser.name,
    });

    if (schoolResult.success && schoolResult.membership) {
      const updatedSub: TeacherSubscription = {
        tier: 'school',
        status: 'active',
        planName: `Paket Lisensi ${schoolResult.membership.schoolName}`,
        billingCycle: 'yearly',
        startedAt: new Date().toISOString(),
        expiresAt: schoolResult.membership.expiresAt,
        daysRemaining: schoolResult.membership.daysRemaining,
        isTrial: false,
        schoolNpsn: schoolResult.membership.npsn,
        maxExamsPerMonth: -1,
        maxStudentsPerExam: -1,
        canUseCustomLogo: true,
        canExportAdvanced: true,
        canUseFullscreenLock: true,
      };
      onSubscriptionUpdated(updatedSub);
      setVoucherStatus({
        type: 'success',
        message: schoolResult.message,
      });
      setVoucherCode('');
      return;
    }

    // 2. Try redeeming as a standard Promo Code
    if (clean === 'GURUPINTAR2026' || clean === 'GURUHEBAT' || clean === 'SEKOLAHJUARA') {
      // Activate 1 Year PRO directly
      const mockTrx: TransactionRecord = {
        id: `trx-voucher-${Date.now()}`,
        invoiceNumber: `VOUCHER-${clean}`,
        planId: 'pro',
        planName: 'Guru PRO (Lisensi Voucher)',
        tier: 'pro',
        billingCycle: 'yearly',
        amount: 180000,
        fee: 0,
        totalAmount: 0,
        paymentChannel: 'qris',
        paymentChannelName: `Voucher Resmi (${clean})`,
        status: 'paid',
        createdAt: new Date().toISOString(),
        customerEmail: currentUser.email,
        customerName: currentUser.name,
      };

      subscriptionService.processSimulatedPayment(mockTrx).then((res) => {
        if (res.success) {
          onSubscriptionUpdated(res.subscription);
          setVoucherStatus({
            type: 'success',
            message: '🎉 Selamat! Kode voucher berhasil diaktivasi. Akun PRO Anda kini aktif selama 1 Tahun.',
          });
          setVoucherCode('');
        }
      });
    } else {
      setVoucherStatus({
        type: 'error',
        message: schoolResult.message || 'Kode lisensi/voucher tidak valid atau sudah kedaluwarsa. Silakan periksa kembali.',
      });
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="p-6 space-y-7 max-w-5xl mx-auto font-sans select-none animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & MAIN TAB SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-slate-900 text-lg tracking-tight">
                Paket Layanan & Info UjianPintar
              </h2>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                v2.4.0 PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Pilihan paket guru, aktivasi lisensi sekolah, serta panduan platform
            </p>
          </div>
        </div>

        {/* Top Tab Pill Buttons */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('pricing')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'pricing'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Paket & Langganan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('about')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'about'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Tentang Aplikasi</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PRICING & SUBSCRIPTION TAB */}
      {activeView === 'pricing' && (
        <div className="space-y-8">
          
          {/* Status Banner */}
          <div className={`rounded-3xl p-6 sm:p-7 border transition-all relative overflow-hidden ${
            subscription.tier === 'pro'
              ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white border-blue-500/40 shadow-xl'
              : subscription.tier === 'school'
                ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white border-emerald-500/40 shadow-xl'
                : 'bg-white text-slate-900 border-slate-200 shadow-sm'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    subscription.tier === 'pro'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : subscription.tier === 'school'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {subscription.tier === 'pro' ? (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        {subscription.isTrial ? 'Trial 14 Hari PRO' : 'Guru PRO Aktif'}
                      </>
                    ) : subscription.tier === 'school' ? (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        Lisensi Sekolah Aktif
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                        Paket Gratis (Basic)
                      </>
                    )}
                  </span>

                  {subscription.tier !== 'free' && (
                    <span className="text-xs text-slate-400 font-sans">
                      • Sisa {subscription.daysRemaining} hari aktif
                    </span>
                  )}
                </div>

                <h3 className={`text-2xl font-display font-black tracking-tight ${
                  subscription.tier !== 'free' ? 'text-white' : 'text-slate-900'
                }`}>
                  {subscription.planName}
                </h3>

                <p className={`text-xs max-w-xl font-sans leading-relaxed ${
                  subscription.tier !== 'free' ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {subscription.tier === 'pro'
                    ? 'Akun Anda memiliki akses tanpa batas untuk membuat bank soal, live monitoring anti-cheat ketat, dan rekap raport siswa.'
                    : subscription.tier === 'school'
                      ? `Lisensi sekolah aktif untuk seluruh guru di ${currentUser.school} (NPSN: ${currentUser.npsn || 'Terdaftar'}).`
                      : 'Anda sedang menggunakan paket dasar dengan kuota 3 sesi ujian per bulan dan maksimal 40 siswa.'}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {subscription.tier === 'free' && !subscription.isTrial && (
                  <button
                    type="button"
                    disabled={isTrialActivating}
                    onClick={handleActivateTrial}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{isTrialActivating ? 'Mengaktifkan...' : 'Coba 14 Hari PRO Gratis'}</span>
                  </button>
                )}

                {subscription.tier === 'free' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const proPlan = SUBSCRIPTION_PLANS.find((p) => p.tier === 'pro');
                      if (proPlan) setSelectedPlanForCheckout(proPlan);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>Upgrade ke PRO</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const proPlan = SUBSCRIPTION_PLANS.find((p) => p.tier === subscription.tier) || SUBSCRIPTION_PLANS[1];
                      setSelectedPlanForCheckout(proPlan);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Perpanjang Langganan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* School License Activation (Option 1) */}
          <SchoolLicenseRedeemCard
            currentUser={currentUser}
            onSubscriptionUpdated={onSubscriptionUpdated}
          />

          {/* Pricing Grid & Billing Switcher */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">
                  Pilihan Paket Berlangganan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Harga ramah guru dengan opsi bulanan fleksibel atau tahunan hemat 25%.
                </p>
              </div>

              {/* Monthly / Yearly Switcher */}
              <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tagihan Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === 'yearly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Tagihan Tahunan</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black ${
                    billingCycle === 'yearly' ? 'bg-blue-800 text-blue-200' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Hemat 25%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  currentTier={subscription.tier}
                  onSelectPlan={(selected) => setSelectedPlanForCheckout(selected)}
                />
              ))}
            </div>
          </div>

          {/* VOUCHER / LICENSE REDEEM BOX (Like Depo Galon activation code) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight">
                  Punya Kode Lisensi atau Voucher Promo?
                </h4>
                <p className="text-[11px] text-slate-500 font-sans">
                  Aktivasi kode voucher promo atau lisensi kemitraan resmi sekolah Anda di sini
                </p>
              </div>
            </div>

            <form onSubmit={handleApplyVoucher} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Masukkan Kode Voucher (contoh: GURUPINTAR2026)"
                className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono font-bold tracking-wider uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 shadow-xs"
              >
                <span>Aktivasi Kode</span>
              </button>
            </form>

            {voucherStatus.type && (
              <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 font-sans font-medium ${
                voucherStatus.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {voucherStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{voucherStatus.message}</span>
              </div>
            )}
          </div>

          {/* Billing & Invoice History */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 text-base tracking-tight">
                  Riwayat Tagihan & Invoice
                </h4>
                <p className="text-xs text-slate-500 font-sans">
                  Daftar transaksi dan tanda terima pembayaran resmi Anda.
                </p>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Belum ada riwayat transaksi pembayaran.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Transaksi yang berhasil akan dicatat secara otomatis di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-display uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">No. Invoice</th>
                      <th className="py-2.5 px-3">Paket</th>
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{trx.invoiceNumber}</td>
                        <td className="py-3 px-3 font-semibold">{trx.planName} ({trx.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})</td>
                        <td className="py-3 px-3">{trx.paymentChannelName}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700">{formatRupiah(trx.totalAmount)}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Lunas
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{new Date(trx.createdAt).toLocaleDateString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: ABOUT APPLICATION & PLATFORM INFO TAB */}
      {activeView === 'about' && (
        <div className="space-y-7">
          
          {/* Brand Hero Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-mono font-bold border border-blue-400/30">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Platform CBT Generasi Baru
              </span>

              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white leading-tight">
                UjianPintar <span className="text-blue-400 font-mono text-xl uppercase px-2 py-0.5 bg-blue-900/60 rounded-md border border-blue-500/40">PRO</span>
              </h1>

              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                Platform Asesmen Digital & Pengawasan Ujian Online Berkinerja Tinggi. Dirancang khusus untuk membantu guru dan sekolah di Indonesia mengadakan Penilaian Harian, Asesmen Sumatif, Ujian Sekolah, hingga Tryout Mandiri secara cepat, akurat, dan bebas manipulasi.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Mesin Scoring Cepat</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>Stempel Integritas SHA-256</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>Siswa 100% Bebas Biaya</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Key Pillar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-display font-black text-slate-900 text-sm">
                Pengawasan Anti-Curang (Live Proctoring)
              </h4>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Mendeteksi perpindahan tab browser siswa secara real-time melalui koneksi WebSockets berlatensi rendah. Dilengkapi mode penguncian layar penuh (*Fullscreen Lock*) agar siswa tetap fokus pada lembar soal.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="font-display font-black text-slate-900 text-sm">
                Auto-Grading & Ekspor Excel Raport
              </h4>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Koreksi jawaban pilihan ganda, benar/salah, dan isian singkat dihitung seketika saat siswa menekan tombol kumpulkan. Guru dapat langsung mengunduh rekap nilai lengkap format `.xlsx` atau `.csv` dengan 1 klik.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-display font-black text-slate-900 text-sm">
                Import Soal Excel, Word, & Rumus LaTeX
              </h4>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Mendukung import puluhan butir soal sekaligus dari template Excel atau file Word Aiken. Dilengkapi perender rumus matematika, fisika, dan kimia berstandar internasional via KaTeX.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Globe2 className="w-5 h-5" />
              </div>
              <h4 className="font-display font-black text-slate-900 text-sm">
                Ringan, Cepat, & Hemat Kuota
              </h4>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Dioptimalkan untuk jaringan internet sekolah di Indonesia. Siswa tidak perlu menginstal aplikasi berat di ponsel; cukup buka browser, masukkan Token PIN, dan langsung mulai ujian.
              </p>
            </div>

          </div>

          {/* Technology & Developer Info Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-display font-black text-slate-900 text-base tracking-tight">
              Informasi Spesifikasi & Bantuan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Versi Rilis:</span>
                <strong className="text-slate-900 font-mono text-sm">v2.4.0 (Build 2026)</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Database Server:</span>
                <strong className="text-slate-900 text-sm">PostgreSQL Supabase Cloud (Jakarta Region)</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Enkripsi Integritas:</span>
                <strong className="text-slate-900 text-sm">SHA-256 Submission Token Seal</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Lisensi Hak Cipta:</span>
                <strong className="text-slate-900 text-sm">© 2026 UjianPintar Indonesia</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block font-medium">Portal Super Admin:</span>
                  <span className="text-slate-600 text-xs font-sans">Akses operator lisensi sekolah</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = 'super-admin';
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Akses Super Admin</span>
                </button>
              </div>
            </div>

            {/* Contact Support Hotline */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-display font-bold text-emerald-950 text-xs">
                    Butuh Bantuan atau Ingin Berlangganan Kolektif Sekolah?
                  </h5>
                  <p className="text-[11px] text-emerald-800 font-sans mt-0.5">
                    Hubungi tim customer care UjianPintar via WhatsApp untuk konsultasi dan penerbitan faktur sekolah (BOS).
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20UjianPintar,%20saya%20tertarik%20dengan%20paket%20langganan%20guru/sekolah"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-display font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Chat WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      )}

      {/* MODAL CHECKOUT */}
      {selectedPlanForCheckout && (
        <PaymentCheckoutModal
          isOpen={!!selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
          plan={selectedPlanForCheckout}
          billingCycle={billingCycle}
          currentUser={currentUser}
          onPaymentSuccess={(updatedSub) => {
            onSubscriptionUpdated(updatedSub);
          }}
        />
      )}

    </div>
  );
};

export default SubscriptionAndAboutPage;

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
  Gift
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

interface SubscriptionSettingsTabProps {
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
}

export const SubscriptionSettingsTab: React.FC<SubscriptionSettingsTabProps> = ({
  currentUser,
  subscription,
  onSubscriptionUpdated,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [isTrialActivating, setIsTrialActivating] = useState(false);

  const transactions: TransactionRecord[] = subscriptionService.getTransactionHistory(currentUser.email);

  const handleActivateTrial = async () => {
    setIsTrialActivating(true);
    const trialSub = await subscriptionService.activateFreeTrial(currentUser.email);
    setIsTrialActivating(false);
    onSubscriptionUpdated(trialSub);
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8 font-sans select-none animate-in fade-in duration-200">
      
      {/* 1. CURRENT SUBSCRIPTION STATUS BANNER */}
      <div className={`rounded-3xl p-6 sm:p-7 border transition-all relative overflow-hidden ${
        subscription.tier === 'pro'
          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white border-blue-500/40 shadow-xl'
          : subscription.tier === 'school'
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white border-emerald-500/40 shadow-xl'
            : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      }`}>
        {/* Glow */}
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
                    {subscription.isTrial ? 'Trial 14 Hari PRO' : 'Paket Guru PRO Aktif'}
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
                ? 'Akun Anda memiliki hak akses tak terbatas untuk membuat ujian, monitoring anti-cheat ketat, dan ekspor raport siswa.'
                : subscription.tier === 'school'
                  ? `Lisensi sekolah aktif untuk seluruh dewan guru di ${currentUser.school} (NPSN: ${currentUser.npsn || 'Terdaftar'}).`
                  : 'Anda sedang menggunakan paket dasar dengan kuota 3 sesi ujian per bulan dan maksimal 40 siswa.'}
            </p>
          </div>

          {/* Quick Action Button on Status Banner */}
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

      {/* 2. AKTIVASI LISENSI SEKOLAH (OPSI 1) */}
      <SchoolLicenseRedeemCard
        currentUser={currentUser}
        onSubscriptionUpdated={onSubscriptionUpdated}
      />

      {/* 3. BILLING CYCLE SWITCHER & PRICING PLANS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">
              Pilihan Paket Berlangganan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih paket yang paling sesuai dengan kebutuhan mengajar Anda atau sekolah Anda.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* 3. TRANSACTION / BILLING HISTORY */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-900 text-base tracking-tight">
                Riwayat Tagihan & Transaksi
              </h4>
              <p className="text-xs text-slate-500 font-sans">
                Daftar invoice dan status pembayaran paket guru Anda.
              </p>
            </div>
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

      {/* 4. MODAL CHECKOUT */}
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

export default SubscriptionSettingsTab;

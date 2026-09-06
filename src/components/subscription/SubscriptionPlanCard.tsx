import React from 'react';
import { Check, Sparkles, Building2, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import type { SubscriptionPlan, BillingCycle, SubscriptionTier } from '../../types/subscription';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  currentTier: SubscriptionTier;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  billingCycle,
  currentTier,
  onSelectPlan,
}) => {
  const isCurrent = currentTier === plan.tier;
  const isPro = plan.tier === 'pro';
  const isSchool = plan.tier === 'school';

  // School license is always an annual package, synchronizing with landing page behavior
  const price = isSchool 
    ? plan.priceYearly 
    : (billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly);

  const formattedPrice = price === 0 
    ? 'Gratis' 
    : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

  const pricePeriod = price === 0 
    ? 'selamanya' 
    : (isSchool || billingCycle === 'yearly') 
      ? '/ th' 
      : '/ bulan';

  // Helper to render bold text within feature strings
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div 
      className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative transition-all select-none ${
        isPro
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white border-2 border-blue-500 shadow-[0_20px_50px_rgba(37,99,235,0.25)] ring-4 ring-blue-500/25 md:-translate-y-2 hover:-translate-y-3 duration-300'
          : isSchool
            ? 'bg-white border-2 border-emerald-300 hover:border-emerald-400 text-slate-900 shadow-md'
            : 'bg-white border border-slate-200/80 hover:border-slate-300 text-slate-900 shadow-md'
      }`}
    >
      {/* Popular or School Badge */}
      {(plan.isPopular || isPro) && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-display font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 ring-2 ring-white whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Paling Populer
        </div>
      )}

      {isSchool && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-display font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 ring-2 ring-white whitespace-nowrap">
          <Building2 className="w-3.5 h-3.5" /> Lisensi Sekolah
        </div>
      )}

      <div>
        {/* Plan Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isPro 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                : isSchool 
                  ? 'bg-emerald-500/15 text-emerald-600' 
                  : 'bg-slate-500/15 text-slate-700'
            }`}>
              {isPro ? <Zap className="w-5 h-5" /> : isSchool ? <Building2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={`font-display font-black text-lg leading-tight ${
                isPro ? 'text-white' : 'text-slate-900'
              }`}>
                {isPro ? 'Guru PRO' : isSchool ? 'Lisensi Sekolah' : plan.name}
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider block -mt-0.2 ${
                isPro ? 'text-blue-300' : isSchool ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {isPro ? 'Guru Mandiri' : isSchool ? 'Institusi (NPSN)' : 'Gratis Selamanya'}
              </span>
            </div>
          </div>
        </div>

        <p className={`text-xs mb-5 leading-relaxed ${isPro ? 'text-slate-300' : 'text-slate-500'}`}>
          {plan.description}
        </p>

        {/* Pricing Box - Centered Horizontally */}
        <div className={`p-4 rounded-2xl mb-6 flex flex-col items-center justify-center text-center ${
          isPro 
            ? 'bg-slate-800/80 border border-slate-700' 
            : isSchool
              ? 'bg-emerald-50/60 border border-emerald-200'
              : 'bg-slate-50 border border-slate-200/80'
        }`}>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className={`text-2xl font-display font-black tracking-tight ${
              isPro ? 'text-white' : 'text-slate-900'
            }`}>
              {formattedPrice}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {pricePeriod}
            </span>
          </div>

          {price === 0 ? (
            <div className="text-[11px] text-slate-400 mt-1 text-center">
              Tanpa perlu kartu kredit & bebas biaya pendaftaran
            </div>
          ) : isPro ? (
            billingCycle === 'yearly' ? (
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <span className="text-[11px] font-medium text-emerald-400">
                  ⚡ Setara Rp 15.000/bln
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  Hemat 25%
                </span>
              </div>
            ) : (
              <div className="mt-1.5 text-[11px] text-slate-400 text-center">
                Bayar bulanan fleksibel tanpa komitmen panjang
              </div>
            )
          ) : (
            <div className="mt-1.5 text-[11px] font-medium text-emerald-600 text-center">
              ⚡ Setara Rp 125.000/bln
            </div>
          )}
        </div>

        {/* Features List */}
        <div className={`space-y-2.5 text-xs border-t pt-4 ${
          isPro 
            ? 'border-slate-700/80 text-slate-200' 
            : 'border-slate-200 text-slate-600'
        }`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {isPro ? 'Fitur Unggulan PRO:' : isSchool ? 'Fitur Khusus Sekolah:' : 'Fitur yang Didapatkan:'}
          </div>

          {plan.features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                isPro ? 'text-blue-400' : 'text-emerald-500'
              }`} />
              <span className="leading-snug">
                {renderFormattedText(feat)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-8 space-y-2">
        <button
          type="button"
          disabled={isCurrent}
          onClick={() => onSelectPlan(plan)}
          className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            isCurrent
              ? isPro
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default shadow-none'
                : 'bg-slate-100 text-slate-500 border border-slate-200 cursor-default shadow-none'
              : isPro
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer scale-100 hover:scale-[1.02] active:scale-95'
                : isSchool
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer scale-100 hover:scale-[1.02] active:scale-95'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer scale-100 hover:scale-[1.02] active:scale-95'
          }`}
        >
          {isCurrent ? (
            <span>{isSchool ? '✓ Lisensi Sekolah Aktif' : '✓ Paket Aktif Anda'}</span>
          ) : isPro ? (
            <>
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Tingkatkan ke Guru PRO</span>
            </>
          ) : isSchool ? (
            <>
              <Building2 className="w-4 h-4" />
              <span>Daftarkan Sekolah</span>
            </>
          ) : (
            <>
              <span>Pilih Paket Basic</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        <div className="text-center text-[10px] text-slate-400">
          {isCurrent
            ? isPro
              ? '⚡ Status langganan aktif'
              : isSchool
                ? 'Terdaftar di bawah NPSN Sekolah'
                : 'Paket dasar tanpa batas waktu'
            : isPro
              ? '⚡ Aktivasi instan via QRIS & Virtual Account'
              : isSchool
                ? 'Diskon khusus untuk yayasan & dinas pendidikan'
                : '⚡ Paket gratis selamanya tanpa biaya'}
        </div>
      </div>
    </div>
  );
};

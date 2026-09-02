import React from 'react';
import { Check, Sparkles, Building2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
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

  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const formattedPrice = price === 0 
    ? 'Gratis' 
    : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

  const pricePeriod = price === 0 
    ? 'selamanya' 
    : billingCycle === 'yearly' 
      ? '/ tahun' 
      : '/ bulan';

  const monthlyEquivalent = billingCycle === 'yearly' && price > 0
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(price / 12))
    : null;

  return (
    <div 
      className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative select-none ${
        isPro
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white border-2 border-blue-500 shadow-2xl shadow-blue-500/15 ring-4 ring-blue-500/20'
          : isSchool
            ? 'bg-white border-2 border-emerald-300 hover:border-emerald-500 text-slate-900 shadow-xl'
            : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-900 shadow-md'
      }`}
    >
      {/* Popular or Category Badge */}
      {plan.isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-display font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 ring-2 ring-white">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Paling Populer
        </div>
      )}

      {isSchool && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-display font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 ring-2 ring-white">
          <Building2 className="w-3.5 h-3.5" /> Lisensi Sekolah
        </div>
      )}

      <div>
        {/* Plan Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isPro 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                : isSchool 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-100 text-slate-700'
            }`}>
              {isPro ? <Zap className="w-5 h-5" /> : isSchool ? <Building2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display font-black text-lg tracking-tight">
                {plan.name}
              </h3>
              <span className={`text-[11px] font-sans font-bold uppercase tracking-wider ${
                isPro ? 'text-blue-400' : isSchool ? 'text-emerald-600' : 'text-slate-500'
              }`}>
                {plan.badge}
              </span>
            </div>
          </div>
        </div>

        <p className={`text-xs font-sans mb-5 leading-relaxed ${isPro ? 'text-slate-300' : 'text-slate-500'}`}>
          {plan.description}
        </p>

        {/* Pricing Display */}
        <div className={`p-4 rounded-2xl mb-6 ${
          isPro ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-50 border border-slate-100'
        }`}>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-display font-black tracking-tight ${
              isPro ? 'text-white' : 'text-slate-900'
            }`}>
              {formattedPrice}
            </span>
            <span className={`text-xs font-sans font-semibold ${isPro ? 'text-slate-400' : 'text-slate-500'}`}>
              {pricePeriod}
            </span>
          </div>

          {monthlyEquivalent && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px] font-sans font-medium text-emerald-400">
                ⚡ Setara {monthlyEquivalent}/bln
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                Hemat 25%
              </span>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-2.5 mb-6">
          <div className={`text-xs font-display font-bold uppercase tracking-wider ${
            isPro ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Fitur yang Didapatkan:
          </div>

          {plan.features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isPro 
                  ? 'bg-blue-500/30 text-blue-300' 
                  : isSchool 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-200 text-slate-700'
              }`}>
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className={`leading-snug font-sans ${isPro ? 'text-slate-200' : 'text-slate-700'}`}>
                {feat}
              </span>
            </div>
          ))}

          {plan.limitations?.map((lim, idx) => (
            <div key={`lim-${idx}`} className="flex items-start gap-2.5 text-xs text-slate-400">
              <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                ✕
              </div>
              <span className="leading-snug font-sans line-through decoration-slate-300">
                {lim}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        disabled={isCurrent}
        onClick={() => onSelectPlan(plan)}
        className={`w-full py-3 px-4 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
          isCurrent
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default shadow-none'
            : isPro
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 hover:scale-[1.02]'
              : isSchool
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 hover:scale-[1.02]'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
        }`}
      >
        <span>{isCurrent ? '✓ Paket Aktif Anda' : plan.ctaText}</span>
        {!isCurrent && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
};

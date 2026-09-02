import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Smartphone, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck,
  Zap,
  Sparkles,
  Timer
} from 'lucide-react';
import type { SubscriptionPlan, BillingCycle, PaymentChannel, TransactionRecord, TeacherSubscription } from '../../types/subscription';
import { subscriptionService, PAYMENT_METHODS } from '../../services/subscriptionService';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  currentUser: {
    name: string;
    email: string;
    school: string;
    whatsapp?: string;
  };
  onPaymentSuccess: (updatedSub: TeacherSubscription) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingCycle,
  currentUser,
  onPaymentSuccess,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<TransactionRecord | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setIsProcessing(false);
      setTimeLeft(900);
      const trx = subscriptionService.createCheckoutTransaction(
        plan,
        billingCycle,
        selectedChannel,
        { email: currentUser.email, name: currentUser.name }
      );
      setActiveTransaction(trx);
    }
  }, [isOpen, plan, billingCycle, selectedChannel, currentUser]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isSuccess || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isSuccess, timeLeft]);

  if (!isOpen || !activeTransaction) return null;

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    // Simulate brief payment gateway verification delay
    setTimeout(async () => {
      const result = await subscriptionService.processSimulatedPayment(activeTransaction);
      setIsProcessing(false);
      if (result.success) {
        setIsSuccess(true);
        onPaymentSuccess(result.subscription);
      }
    }, 1200);
  };

  const mockVaNumber = `8809${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  const handleCopyVa = () => {
    navigator.clipboard.writeText(mockVaNumber);
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans overflow-y-auto select-none">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Zap className="w-5 h-5 fill-blue-600" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-900 text-lg tracking-tight">
                {isSuccess ? 'Pembayaran Berhasil' : 'Checkout & Pembayaran'}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                {isSuccess ? 'Akun Anda telah di-upgrade seketika' : 'Aktivasi Instan Otomatis'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SUCCESS VIEW */}
        {isSuccess ? (
          <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-90 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-mono font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 fill-emerald-500" /> Status: AKTIF RESMI
              </span>
              <h2 className="text-2xl font-display font-black text-slate-900 mt-2">
                Selamat! Akun {plan.name} Aktif
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Terima kasih, <strong>{currentUser.name}</strong>. Anda sekarang memiliki akses penuh tanpa batas ke semua fitur unggulan UjianPintar.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Invoice:</span>
                <strong className="font-mono text-slate-800">{activeTransaction.invoiceNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paket Layanan:</span>
                <strong className="text-slate-900">{plan.name} ({billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Dibayar:</span>
                <strong className="text-emerald-700 font-bold">{formatRupiah(activeTransaction.totalAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Pembayaran:</span>
                <span className="text-slate-700">{new Date().toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              Mulai Gunakan Fitur PRO Sekarang
            </button>
          </div>
        ) : (
          /* CHECKOUT VIEW */
          <div className="space-y-5">
            {/* Order Summary Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold block">
                  Ringkasan Pesanan ({billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                </span>
                <h4 className="text-base font-display font-black text-white mt-0.5">
                  {plan.name}
                </h4>
                <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                  Tagihan untuk akun {currentUser.email}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 font-sans">Total Tagihan:</div>
                <div className="text-xl font-display font-black text-emerald-400">
                  {formatRupiah(activeTransaction.totalAmount)}
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-display font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Pilih Metode Pembayaran:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedChannel === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedChannel(method.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-slate-900'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {method.category === 'qris' ? (
                          <QrCode className="w-4 h-4" />
                        ) : method.category === 'va' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate">{method.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {method.feeFlat === 0 && method.feePercent === 0 
                            ? 'Bebas Biaya Admin' 
                            : `Biaya: ${method.feeFlat ? formatRupiah(method.feeFlat) : `${method.feePercent}%`}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Payment Instructions Display */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-500" /> Waktu Pembayaran:
                </span>
                <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {formatTimer(timeLeft)}
                </span>
              </div>

              {selectedChannel === 'qris' ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <div className="p-2.5 bg-white rounded-2xl border-2 border-slate-300 shadow-md flex items-center justify-center">
                    {/* Simulated QR Pattern */}
                    <div className="w-36 h-36 bg-slate-900 rounded-xl p-2 flex flex-col justify-between text-white relative">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 border-4 border-white bg-slate-900 rounded-sm" />
                        <div className="w-8 h-8 border-4 border-white bg-slate-900 rounded-sm" />
                      </div>
                      <div className="text-center font-mono font-bold text-[9px] tracking-widest text-blue-400">
                        QRIS RESMI
                      </div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 border-4 border-white bg-slate-900 rounded-sm" />
                        <div className="w-6 h-6 bg-blue-500 rounded-sm" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 text-center max-w-xs">
                    Pindai QRIS di atas dengan aplikasi mobile banking atau e-wallet apa saja (GoPay, OVO, Dana, BCA, Livin, dll).
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-1">
                  <div className="text-xs text-slate-500">Nomor Virtual Account:</div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-sm font-black text-slate-900">
                    <span>{mockVaNumber}</span>
                    <button
                      type="button"
                      onClick={handleCopyVa}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-sans font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedVa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedVa ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Transfer tepat sejumlah <strong>{formatRupiah(activeTransaction.totalAmount)}</strong> untuk verifikasi instan.
                  </p>
                </div>
              )}
            </div>

            {/* Action Simulator Button */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSimulatePayment}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-display font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <span>Bayar Sekarang ({formatRupiah(activeTransaction.totalAmount)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Transaksi Aman • Aktivasi Seketika</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentCheckoutModal;

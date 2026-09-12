import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Timer, 
  MessageCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Download
} from 'lucide-react';
import type { SubscriptionPlan, BillingCycle, PaymentChannel, TransactionRecord, TeacherSubscription } from '../../types/subscription';
import { subscriptionService, DANA_CONFIG, PAYMENT_METHODS } from '../../services/subscriptionService';

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
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('dana');
  const [activeTransaction, setActiveTransaction] = useState<TransactionRecord | null>(null);

  // Form states for customer info
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerSchool, setCustomerSchool] = useState('');

  // UI Flow States
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Copy feedback states
  const [copiedDana, setCopiedDana] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // 15-minute expiry countdown
  const [timeLeft, setTimeLeft] = useState(900);

  // Ref to unsubscribe Realtime listener
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize or reset modal when opened
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setIsWaitingApproval(false);
      setIsSendingOrder(false);
      setErrorMessage('');
      setTimeLeft(900);

      // Pre-fill user data
      const initialName = currentUser.name || '';
      const initialWa = currentUser.whatsapp || '';
      const initialSchool = currentUser.school || '';

      setCustomerName(initialName);
      setCustomerWhatsapp(initialWa);
      setCustomerSchool(initialSchool);

      // Create new transaction record with unique 3-digit code
      const trx = subscriptionService.createCheckoutTransaction(
        plan,
        billingCycle,
        selectedChannel,
        {
          email: currentUser.email,
          name: initialName,
          school: initialSchool,
          whatsapp: initialWa,
        }
      );
      setActiveTransaction(trx);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isOpen, plan, billingCycle, currentUser]);

  // Keep transaction payment channel in sync if changed before submitting
  const handleChannelSelect = (channel: PaymentChannel) => {
    setSelectedChannel(channel);
    if (activeTransaction) {
      const paymentMeta = PAYMENT_METHODS.find((p) => p.id === channel) || PAYMENT_METHODS[0];
      setActiveTransaction({
        ...activeTransaction,
        paymentChannel: channel,
        paymentChannelName: paymentMeta.name,
      });
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isSuccess || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isSuccess, timeLeft]);

  // Setup Realtime WebSocket Listener when waiting for approval
  useEffect(() => {
    if (!isWaitingApproval || !activeTransaction) return;

    // Subscribe to status changes (via Supabase Realtime + Polling fallback)
    const unsub = subscriptionService.subscribeToTransactionStatus(
      activeTransaction.id,
      async (status) => {
        if (status === 'paid') {
          // Success! Bot Telegram or Admin approved
          const updatedSub = await subscriptionService.applyActivatedSubscription(activeTransaction);
          setIsWaitingApproval(false);
          setIsSuccess(true);
          onPaymentSuccess(updatedSub);
        } else if (status === 'rejected') {
          setIsWaitingApproval(false);
          setErrorMessage('Transaksi ini telah dibatalkan atau ditolak oleh Admin. Silakan hubungi Hotline CS untuk bantuan.');
        }
      }
    );

    unsubscribeRef.current = unsub;

    return () => {
      if (unsub) unsub();
    };
  }, [isWaitingApproval, activeTransaction, onPaymentSuccess]);

  if (!isOpen || !activeTransaction) return null;

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyDana = () => {
    navigator.clipboard.writeText(DANA_CONFIG.accountNumberRaw);
    setCopiedDana(true);
    setTimeout(() => setCopiedDana(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(activeTransaction.totalAmount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // Submit Order & Open WhatsApp CS + Push Notification to Telegram
  const handleConfirmOrder = async () => {
    const cleanWa = customerWhatsapp.trim().replace(/[^0-9+]/g, '');
    if (!cleanWa || cleanWa.length < 9) {
      setErrorMessage('Harap masukkan nomor WhatsApp aktif Anda untuk pengiriman konfirmasi invoice dan aktivasi.');
      return;
    }

    setErrorMessage('');
    setIsSendingOrder(true);

    const updatedTrx: TransactionRecord = {
      ...activeTransaction,
      customerName: customerName.trim() || activeTransaction.customerName,
      customerWhatsapp: cleanWa,
      customerSchool: customerSchool.trim() || activeTransaction.customerSchool,
    };
    setActiveTransaction(updatedTrx);

    try {
      // 1. Simpan Transaksi ke Database Supabase
      await subscriptionService.savePaymentTransaction(updatedTrx);

      // 2. Kirim Notifikasi Push ke Bot Telegram Admin (dengan Tombol Setujui 1-Klik)
      subscriptionService.sendTelegramOrderNotification(updatedTrx).catch((e) => {
        console.warn('Telegram notification async warning:', e);
      });

      // 3. Format URL WhatsApp dan Buka Chat dengan CS
      const waUrl = subscriptionService.generateWhatsAppOrderUrl(updatedTrx);
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      // 4. Beralih ke Layar Menunggu Verifikasi Realtime
      setIsSendingOrder(false);
      setIsWaitingApproval(true);
    } catch (err: any) {
      setIsSendingOrder(false);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses pesanan.');
    }
  };

  // Manual Check Status Button
  const handleManualCheckStatus = async () => {
    if (!activeTransaction) return;
    setIsCheckingManual(true);
    try {
      const history = subscriptionService.getTransactionHistory(currentUser.email);
      const matched = history.find((t) => t.id === activeTransaction.id);
      if (matched && matched.status === 'paid') {
        const updatedSub = await subscriptionService.applyActivatedSubscription(activeTransaction);
        setIsWaitingApproval(false);
        setIsSuccess(true);
        onPaymentSuccess(updatedSub);
      } else {
        // Quick pause so user feels the check
        await new Promise((r) => setTimeout(r, 800));
      }
    } finally {
      setIsCheckingManual(false);
    }
  };

  // Testing Helper: Simulate Approval for Instant Local Testing
  const handleSimulateInstant = async () => {
    setIsSendingOrder(true);
    const result = await subscriptionService.processSimulatedPayment(activeTransaction);
    setIsSendingOrder(false);
    if (result.success) {
      setIsWaitingApproval(false);
      setIsSuccess(true);
      onPaymentSuccess(result.subscription);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans overflow-y-auto select-none">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Zap className="w-5 h-5 fill-blue-600" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-900 text-lg tracking-tight">
                {isSuccess 
                  ? 'Pembayaran Berhasil' 
                  : isWaitingApproval 
                  ? 'Menunggu Verifikasi Admin' 
                  : 'Checkout Pembayaran DANA'}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                {isSuccess 
                  ? 'Akun Anda telah di-upgrade seketika' 
                  : isWaitingApproval 
                  ? 'Otomatis aktif setelah admin menyetujui di Telegram' 
                  : 'Transfer Langsung DANA / Scan QRIS'}
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

        {/* 1. SUCCESS VIEW */}
        {isSuccess ? (
          <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-90 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg ring-8 ring-emerald-50 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-mono font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 fill-emerald-500" /> Status: AKTIF RESMI
              </span>
              <h2 className="text-2xl font-display font-black text-slate-900 mt-2">
                Selamat! Akun {plan.name} Aktif
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Terima kasih, <strong>{customerName || currentUser.name}</strong>. Pembayaran Anda telah terverifikasi dan akun Anda kini memiliki akses tak terbatas ke seluruh fitur ujian digital.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Invoice:</span>
                <strong className="font-mono text-slate-800">{activeTransaction.invoiceNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paket Layanan:</span>
                <strong className="text-slate-900">{plan.name} ({billingCycle === 'yearly' ? '1 Tahun' : '1 Bulan'})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Dibayar:</span>
                <strong className="text-emerald-700 font-bold">{formatRupiah(activeTransaction.totalAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="text-slate-700 font-medium">DANA ({DANA_CONFIG.accountName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Pembayaran:</span>
                <span className="text-slate-700">{new Date().toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              Mulai Gunakan Fitur PRO Sekarang
            </button>
          </div>
        ) : isWaitingApproval ? (
          /* 2. WAITING APPROVAL VIEW (Realtime Listening) */
          <div className="py-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Animated Status Pulse */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl text-center space-y-3 relative overflow-hidden">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[11px] font-mono font-bold border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  STATUS: MENUNGGU VERIFIKASI ADMIN
                </span>
                <h3 className="font-display font-black text-slate-900 text-lg mt-2">
                  Notifikasi Pembayaran Telah Dikirim!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Data pemesanan telah dikirim ke WhatsApp CS & Bot Telegram Admin. Halaman ini akan <strong>otomatis aktif menjadi PRO</strong> begitu admin menyetujui di Telegram.
                </p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nomor Invoice:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {activeTransaction.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Transfer:</span>
                <strong className="text-blue-700 font-display font-black text-sm">
                  {formatRupiah(activeTransaction.totalAmount)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor WhatsApp Anda:</span>
                <span className="font-medium text-slate-800">{activeTransaction.customerWhatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paket:</span>
                <span className="font-bold text-slate-800">{plan.name}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const waUrl = subscriptionService.generateWhatsAppOrderUrl(activeTransaction);
                  window.open(waUrl, '_blank', 'noopener,noreferrer');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Buka Ulang Chat WhatsApp CS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={isCheckingManual}
                onClick={handleManualCheckStatus}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-display font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isCheckingManual ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memeriksa Status Database...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Periksa Status Pembayaran Sekarang</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsWaitingApproval(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Kembali ke Detail Pembayaran
                </button>

                {/* Dev simulation shortcut */}
                <button
                  type="button"
                  onClick={handleSimulateInstant}
                  className="text-[10px] text-blue-500 hover:text-blue-700 underline cursor-pointer"
                  title="Klik untuk mensimulasikan persetujuan jika menguji coba tanpa Telegram"
                >
                  Simulasi Persetujuan Cepat (Demo)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 3. ORDER / CHECKOUT FORM VIEW */
          <div className="space-y-4">
            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Order Summary Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold block">
                  Paket Langganan ({billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                </span>
                <h4 className="text-base font-display font-black text-white mt-0.5">
                  {plan.name}
                </h4>
                <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                  Akun: <span className="text-white font-mono">{currentUser.email}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-sans">Total Tagihan:</div>
                <div className="text-lg sm:text-xl font-display font-black text-emerald-400 tracking-tight">
                  {formatRupiah(activeTransaction.totalAmount)}
                </div>
                <div className="text-[9px] text-amber-300 font-mono">
                  Termasuk kode unik: +Rp {activeTransaction.uniqueCode}
                </div>
              </div>
            </div>

            {/* Customer Information Inputs */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <label className="text-[11px] font-display font-bold text-slate-700 uppercase tracking-wider block">
                Data Pemesan & Kontak Verifikasi:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium block mb-1">
                    Nama Guru / Pemesan:
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Lengkap Guru"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-medium block mb-1">
                    Nomor WhatsApp Aktif <span className="text-rose-500 font-bold">*</span>:
                  </label>
                  <input
                    type="tel"
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    placeholder="Contoh: 082196929193"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">
                  Asal Satuan Pendidikan / Sekolah:
                </label>
                <input
                  type="text"
                  value={customerSchool}
                  onChange={(e) => setCustomerSchool(e.target.value)}
                  placeholder="Contoh: SMAN 1 Indonesia"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment Method Selector (DANA vs QRIS) */}
            <div>
              <label className="text-[11px] font-display font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Pilih Jalur Pembayaran:
              </label>

              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedChannel === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleChannelSelect(method.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 text-slate-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {method.category === 'qris' ? (
                          <QrCode className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate">
                          {method.id === 'dana' ? 'Transfer DANA' : 'Scan QRIS'}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Bebas Admin
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instruction Card Based on Selected Channel */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-500" /> Batas Waktu Transfer:
                </span>
                <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {formatTimer(timeLeft)}
                </span>
              </div>

              {selectedChannel === 'dana' ? (
                /* DANA DIRECT TRANSFER INSTRUCTION */
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Nomor Akun DANA:</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        Akun Resmi Terverifikasi
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-base font-black text-slate-900 tracking-wider">
                          {DANA_CONFIG.accountNumber}
                        </div>
                        <div className="text-xs font-medium text-slate-600">
                          a.n. <strong>{DANA_CONFIG.accountName}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyDana}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-blue-200"
                      >
                        {copiedDana ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedDana ? 'Tersalin!' : 'Salin Nomor'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Exact Amount to Transfer */}
                  <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-bold">Jumlah Yang Harus Ditransfer:</span>
                      <button
                        type="button"
                        onClick={handleCopyAmount}
                        className="text-[11px] text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedAmount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAmount ? 'Tersalin!' : 'Salin Nominal'}</span>
                      </button>
                    </div>
                    <div className="text-xl font-display font-black text-amber-950 font-mono tracking-tight">
                      {formatRupiah(activeTransaction.totalAmount)}
                    </div>
                    <p className="text-[10px] text-amber-800 leading-tight">
                      ⚠️ <strong>Penting:</strong> Pastikan Anda mentransfer tepat hingga 3 digit terakhir (<strong>{activeTransaction.uniqueCode}</strong>) agar bot verifikasi kami dapat mengenali pembayaran Anda seketika.
                    </p>
                  </div>
                </div>
              ) : (
                /* QRIS SCAN INSTRUCTION */
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center py-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    {/* Real QRIS Dn Apps Image Display */}
                    <div className="w-56 max-w-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md relative group bg-white p-1">
                      <img 
                        src="/qris_dnapps.jpeg" 
                        alt="QRIS Dn Apps UjianPintar"
                        className="w-full h-auto object-contain rounded-xl"
                        onError={(e) => {
                          // Fallback to svg if jpeg fails to load
                          (e.target as HTMLImageElement).src = '/qris-dana.svg';
                        }}
                      />
                    </div>

                    <div className="mt-2.5 text-center space-y-1.5">
                      <div className="text-xs font-bold text-slate-800">
                        Pindai QRIS Resmi Dn Apps
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Mendukung DANA, BCA, Livin Mandiri, BRImo, GoPay, OVO, ShopeePay
                      </div>
                      <a
                        href="/qris_dnapps.jpeg"
                        download="qris_dnapps.jpeg"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors border border-slate-200"
                      >
                        <Download className="w-3 h-3" />
                        <span>Simpan Gambar QRIS</span>
                      </a>
                    </div>
                  </div>

                  {/* Exact Amount */}
                  <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-amber-800 font-bold uppercase">Masukkan Nominal Pas:</div>
                      <div className="text-base font-mono font-black text-amber-950">
                        {formatRupiah(activeTransaction.totalAmount)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAmount}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedAmount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAmount ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isSendingOrder}
                onClick={handleConfirmOrder}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl font-display font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSendingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyiapkan Konfirmasi...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Saya Sudah Transfer - Konfirmasi WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Transaksi Aman Langsung ke Pemilik • Verifikasi Cepat Melalui Bot</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentCheckoutModal;

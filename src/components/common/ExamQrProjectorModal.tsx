import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Printer, 
  Copy, 
  Check, 
  Layers, 
  QrCode, 
  Smartphone, 
  Sparkles,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import type { ExamSettings } from '../../types/exam';
import { rosterService } from '../../services/rosterService';
import { PrintableExamQrSheet } from './PrintableExamQrSheet';

interface ExamQrProjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamSettings;
}

export const ExamQrProjectorModal: React.FC<ExamQrProjectorModalProps> = ({
  isOpen,
  onClose,
  exam,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  if (!isOpen || !exam) return null;

  const targetClass = exam.targetClass || 'Semua Kelas';
  const qrPayload = rosterService.generateQrPayload(exam);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=650x650&margin=20&data=${encodeURIComponent(qrPayload)}`;

  const handleCopyToken = () => {
    if (exam.token) {
      navigator.clipboard.writeText(exam.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
        <div 
          className={`w-full bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
            isFullscreen 
              ? 'h-full max-w-full rounded-none' 
              : 'max-w-4xl max-h-[92vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="p-4 px-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-wider font-bold uppercase text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Mode Tampilan Proyektor Kelas
                </span>
                <h3 className="font-display font-black text-lg sm:text-xl text-white tracking-tight line-clamp-1">
                  {exam.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (F11)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Cetak Lembar QR Ujian"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col md:flex-row items-center justify-center gap-8 bg-gradient-to-b from-slate-50 to-white">
            
            {/* Left: Giant QR Code Frame */}
            <div className="flex flex-col items-center text-center space-y-3 flex-shrink-0">
              <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-indigo-200 shadow-xl shadow-indigo-500/10 hover:shadow-2xl transition-all">
                <img
                  src={qrImageUrl}
                  alt={`QR Code ${exam.title}`}
                  className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain rounded-2xl"
                  loading="eager"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 text-xs font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Arahkan Kamera APK Siswa ke Kode di Atas</span>
              </div>
            </div>

            {/* Right: Class Info & Student Instructions */}
            <div className="w-full max-w-md space-y-5">
              
              {/* Target Class & Subject Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-medium text-slate-500">Target Kelas:</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold font-display">
                    <Layers className="w-3.5 h-3.5" />
                    Kelas {targetClass.replace(/^kelas\s*/i, '')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-medium text-slate-500">Mata Pelajaran:</span>
                  <span className="text-xs font-bold text-slate-800 font-display">
                    {exam.subject || 'Umum'} ({exam.gradeLevel || 'Semua Tingkat'})
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">Token Ujian:</span>
                    <span className="text-[10px] text-slate-400">
                      {isTokenVisible ? 'Terlihat di proyektor' : 'Disembunyikan (Buka saat mulai)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTokenVisible ? (
                      <span className="text-xl sm:text-2xl font-mono font-black text-indigo-700 tracking-wider bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-xl">
                        {exam.token || '------'}
                      </span>
                    ) : (
                      <span className="text-xl sm:text-2xl font-mono font-black text-slate-400 tracking-widest bg-slate-100 border border-slate-200 px-3.5 py-1 rounded-xl select-none">
                        ••••••
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsTokenVisible(!isTokenVisible)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                        isTokenVisible
                          ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                      }`}
                      title={isTokenVisible ? 'Sembunyikan Token dari Layar' : 'Tampilkan Token untuk Siswa'}
                    >
                      {isTokenVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="hidden sm:inline">
                        {isTokenVisible ? 'Sembunyikan' : 'Buka Token'}
                      </span>
                    </button>

                    {isTokenVisible && (
                      <button
                        type="button"
                        onClick={handleCopyToken}
                        className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title="Salin Token"
                      >
                        {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Instructions for Students */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Petunjuk Siswa di Kelas:
                </h4>

                <ol className="space-y-2.5 text-xs text-slate-600 font-sans leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Buka aplikasi <strong>UjianPintar</strong> di HP Anda lalu tekan tombol <strong>"Pindai QR Soal"</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Pilih <strong>Nama Anda</strong> dari daftar kelas <strong>{targetClass}</strong> (NISN &amp; Kelas akan terisi otomatis).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Masukkan <strong>Token 6-Digit</strong> saat pengawas menampilkan atau mengumumkan PIN ujian resmi dimulai.</span>
                  </li>
                </ol>
              </div>

            </div>

          </div>

          {/* Footer */}
          <div className="p-3.5 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>UjianPintar PRO • Sistem Ujian Berbasis Roster &amp; QR Code</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>

      {/* Clean A4 Printable Sheet Portal for Browser Print & PDF Export */}
      {typeof document !== 'undefined' &&
        createPortal(
          <PrintableExamQrSheet exam={exam} qrImageUrl={qrImageUrl} />,
          document.body
        )}
    </>
  );
};

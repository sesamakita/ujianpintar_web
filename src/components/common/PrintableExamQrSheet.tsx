import React from 'react';
import type { ExamSettings } from '../../types/exam';

interface PrintableExamQrSheetProps {
  exam: ExamSettings;
  qrImageUrl: string;
}

export const PrintableExamQrSheet: React.FC<PrintableExamQrSheetProps> = ({
  exam,
  qrImageUrl,
}) => {
  const targetClass = exam.targetClass || 'Semua Kelas';
  const displayClass = targetClass.replace(/^kelas\s*/i, '');
  
  const printDateStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  const examCode = exam.id ? exam.id.slice(0, 8).toUpperCase() : 'EXAM-CBT';

  return (
    <div 
      id="print-sheet-portal" 
      className="text-slate-900 bg-white p-8 max-w-3xl mx-auto font-sans leading-relaxed"
    >
      {/* 1. KOP DOKUMEN RESMI UJIAN */}
      <div className="border-b-4 border-double border-slate-900 pb-3 mb-5 text-center">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="text-left">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-900 block font-serif">
              UJIANPINTAR PRO CBT
            </span>
            <span className="text-[10px] text-slate-600 block font-medium">
              Sistem Asesmen Digital &amp; Pengawasan Ujian Online
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-800 block">
              KODE: {examCode}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Dicetak: {printDateStr}
            </span>
          </div>
        </div>

        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 font-serif">
          LEMBAR AKSES QR CODE &amp; TOKEN UJIAN
        </h1>
        <p className="text-xs font-semibold text-slate-600 mt-0.5">
          Tempelkan lembar ini pada papan tulis depan kelas atau pintu ruang ujian
        </p>
      </div>

      {/* 2. TABEL DATA IDENTITAS UJIAN */}
      <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 bg-slate-50 rounded-xl border-2 border-slate-300 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Nama Ujian</span>
            <span className="font-bold text-slate-900">: {exam.title}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Mata Pelajaran</span>
            <span className="font-bold text-slate-900">: {exam.subject || 'Umum'}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Target Kelas</span>
            <span className="font-bold text-indigo-900">: Kelas {displayClass}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Durasi Waktu</span>
            <span className="font-bold text-slate-900">: {exam.durationMinutes || 60} Menit</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Tingkat / Fase</span>
            <span className="font-medium text-slate-800">: {exam.gradeLevel || 'Semua Tingkat'}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Metode Akses</span>
            <span className="font-medium text-slate-800">: Pindai QR &amp; Sinkronisasi Rombel</span>
          </div>
        </div>
      </div>

      {/* 3. AREA QR CODE & TOKEN PIN HIGHLIGHT */}
      <div className="grid grid-cols-2 gap-5 items-stretch p-4 rounded-2xl border-2 border-slate-800 bg-white mb-5 print-avoid-break">
        
        {/* Kolom Kiri: Kode QR Besar */}
        <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-slate-300 bg-slate-50">
          <div className="p-2.5 bg-white rounded-xl border-2 border-indigo-600 shadow-xs mb-2">
            <img
              src={qrImageUrl}
              alt={`QR Code ${exam.title}`}
              className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
              loading="eager"
            />
          </div>
          <span className="text-xs font-black uppercase text-indigo-950 block tracking-wide">
            KODE QR SINKRONISASI
          </span>
          <span className="text-[10px] text-slate-600 font-medium mt-0.5">
            Arahkan kamera aplikasi UjianPintar siswa ke sini
          </span>
        </div>

        {/* Kolom Kanan: Status Token & Informasi Pengawas */}
        <div className="flex flex-col justify-between space-y-3">
          
          <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-center flex-1 flex flex-col justify-center items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              TOKEN UJIAN (PIN 6-DIGIT)
            </span>
            
            <div className="my-2.5 py-2 px-4 bg-amber-50 border border-amber-300 rounded-xl">
              <span className="font-mono text-xs font-black tracking-wider text-amber-900 block uppercase">
                🔒 Diberikan Langsung oleh Pengawas
              </span>
            </div>
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              * Demi menjaga ketertiban, Token PIN tidak dicetak pada lembar ini dan akan diumumkan secara langsung oleh Pengawas Ruang saat waktu ujian resmi dimulai.
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-900 leading-snug">
            <strong className="block font-bold mb-0.5 text-blue-950">Catatan Pengawas Ruang:</strong>
            Siswa memindai QR di samping untuk memilih nama rombel mereka. Presensi kehadiran siswa otomatis masuk ke dasbor <em>Live Proctoring</em> pengawas sebelum token dibagikan.
          </div>

        </div>

      </div>

      {/* 4. PETUNJUK SISWA (3 LANGKAH MUDAH) */}
      <div className="mb-6 p-4 rounded-xl border border-slate-300 bg-slate-50/70 print-avoid-break">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2.5 pb-1 border-b border-slate-300">
          PETUNJUK SISWA DI DALAM RUANG UJIAN:
        </h3>
        <ol className="space-y-2 text-xs text-slate-800">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong>Buka Aplikasi UjianPintar</strong> di smartphone Anda, lalu tekan tombol <strong>"Pindai QR Soal"</strong>.
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <div>
              Setelah QR terdeteksi, <strong>Pilih Nama Anda</strong> dari daftar kelas <strong>{displayClass}</strong>. Nomor Induk Siswa (NISN) dan nama kelas akan terisi secara otomatis oleh sistem.
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <div>
              Ketikkan <strong>Token Ujian 6 Digit</strong> yang diberikan oleh pengawas ruang ketika ujian resmi dimulai, kemudian ketuk <strong>"Mulai Kerjakan Ujian"</strong>.
            </div>
          </li>
        </ol>
      </div>

      {/* 5. TANDA TANGAN PENGAWAS & GURU */}
      <div className="grid grid-cols-2 gap-8 pt-2 text-xs text-center border-t-2 border-slate-200 print-avoid-break">
        <div>
          <p className="text-slate-600 mb-14">Guru Pengampu Mata Pelajaran,</p>
          <div className="w-44 border-b border-slate-800 mx-auto"></div>
          <p className="font-bold text-slate-900 mt-1">NIP/NUPTK: ..............................</p>
        </div>
        <div>
          <p className="text-slate-600 mb-14">Pengawas Ruang Ujian,</p>
          <div className="w-44 border-b border-slate-800 mx-auto"></div>
          <p className="font-bold text-slate-900 mt-1">Tanda Tangan &amp; Nama Terang</p>
        </div>
      </div>

      {/* 6. FOOTER IDENTIFIKASI */}
      <div className="mt-5 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
        <span>UjianPintar PRO • Sistem Ujian Berbasis Roster &amp; QR Code</span>
        <span>Lembar Akses Pengawas • A4 Format</span>
      </div>

    </div>
  );
};

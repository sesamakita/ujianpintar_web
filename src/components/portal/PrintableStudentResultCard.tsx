import React from 'react';
import { Printer, X, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import type { StudentPublicExamSummary } from '../../types/exam';

interface PrintableStudentResultCardProps {
  summary: StudentPublicExamSummary;
  onClose: () => void;
}

export const PrintableStudentResultCard: React.FC<PrintableStudentResultCardProps> = ({
  summary,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isLulus = summary.status === 'Lulus' || summary.percentage >= 75;

  const breakdown = summary.breakdown || {
    objectiveScore: summary.score || 0,
    objectiveMax: summary.maxScore || 100,
    shortAnswerScore: 0,
    shortAnswerMax: 0,
    essayScore: 0,
    essayMax: 0,
    hasPendingEssays: false,
  };

  const safeExamId = (summary.examId || summary.sessionId || 'EXAM')
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Clean Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-skhu-document, #printable-skhu-document * {
            visibility: visible !important;
          }
          #printable-skhu-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
      {/* Container */}
      <div className="bg-white text-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col my-auto print:shadow-none print:w-full print:max-w-none print:rounded-none print:my-0">
        {/* Toolbar Header (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pratinjau Rapor / SKHU Digital</h2>
              <p className="text-xs text-slate-500">Siap dicetak atau disimpan sebagai PDF berstandar resmi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A4) */}
        <div id="printable-skhu-document" className="p-8 sm:p-12 print:p-8 space-y-6 font-sans">
          {/* 1. Official School Letterhead (KOP SEKOLAH) */}
          <div className="border-b-2 border-slate-900 pb-4 text-center relative">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-sm print:border print:border-slate-800">
                UP
              </div>
              <div className="text-center">
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  PEMERINTAH DAERAH PROVINSI / KABUPATEN
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {summary.schoolName || 'SMA NEGERI 1 INDONESIA'}
                </h1>
                {summary.schoolNpsn && summary.schoolNpsn.trim() !== '' && (
                  <p className="text-xs text-slate-500 font-mono">NPSN: {summary.schoolNpsn}</p>
                )}
                <p className="text-xs text-slate-600">
                  Layanan Sistem Asesmen & Ujian Berbasis Komputer / Smartphone (CBT Digital)
                </p>
              </div>
            </div>
            <div className="h-0.5 bg-slate-900 mt-2" />
            <div className="h-px bg-slate-400 mt-0.5" />
          </div>

          {/* 2. Document Title */}
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-900 underline uppercase">
              SURAT KETERANGAN HASIL UJIAN (SKHU) DIGITAL
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Nomor: SKHU/UP/{safeExamId}/{summary.nisn}
            </p>
          </div>

          {/* 3. Student Identification Table */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 print:bg-transparent print:border print:border-slate-300">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex">
                <span className="w-32 font-semibold text-slate-500">Nama Siswa</span>
                <span className="font-bold text-slate-900">: {summary.studentName}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-500">Mata Pelajaran</span>
                <span className="font-bold text-slate-900">: {summary.subject}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-500">NISN / NIS</span>
                <span className="font-bold text-slate-900 font-mono">: {summary.nisn}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-500">Jenis Penilaian</span>
                <span className="font-bold text-slate-900">: {summary.examTitle}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-500">Kelas / Rombel</span>
                <span className="font-bold text-slate-900">: {summary.className}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-500">Tanggal Asesmen</span>
                <span className="font-bold text-slate-900">: {summary.submittedAt}</span>
              </div>
            </div>
          </div>

          {/* 4. Score Summary & Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Rincian Perolehan Nilai & Asesmen Komprehensif
            </h3>
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">Komponen / Tipe Instrumen Soal</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-24">Bobot Maks.</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-28">Skor Perolehan</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">Keterangan Evaluasi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-3 py-2.5 text-center font-mono">1</td>
                    <td className="border border-slate-300 px-4 py-2.5 font-medium text-slate-800">
                      Soal Objektif (Pilihan Ganda & Benar / Salah)
                    </td>
                    <td className="border border-slate-300 px-3 py-2.5 text-center font-mono">
                      {breakdown.objectiveMax}
                    </td>
                    <td className="border border-slate-300 px-3 py-2.5 text-center font-bold font-mono text-blue-700">
                      {breakdown.objectiveScore}
                    </td>
                    <td className="border border-slate-300 px-4 py-2.5 text-slate-600 text-[11px]">
                      Koreksi Otomatis Sistem CBT
                    </td>
                  </tr>

                  {breakdown.shortAnswerMax > 0 && (
                    <tr>
                      <td className="border border-slate-300 px-3 py-2.5 text-center font-mono">2</td>
                      <td className="border border-slate-300 px-4 py-2.5 font-medium text-slate-800">
                        Soal Isian Singkat
                      </td>
                      <td className="border border-slate-300 px-3 py-2.5 text-center font-mono">
                        {breakdown.shortAnswerMax}
                      </td>
                      <td className="border border-slate-300 px-3 py-2.5 text-center font-bold font-mono text-blue-700">
                        {breakdown.shortAnswerScore}
                      </td>
                      <td className="border border-slate-300 px-4 py-2.5 text-slate-600 text-[11px]">
                        Koreksi Pencocokan Kata Kunci
                      </td>
                    </tr>
                  )}

                  {breakdown.essayMax > 0 && (
                    <tr>
                      <td className="border border-slate-300 px-3 py-2.5 text-center font-mono">
                        {breakdown.shortAnswerMax > 0 ? 3 : 2}
                      </td>
                      <td className="border border-slate-300 px-4 py-2.5 font-medium text-slate-800">
                        Soal Uraian / Esai Komprehensif
                      </td>
                      <td className="border border-slate-300 px-3 py-2.5 text-center font-mono">
                        {breakdown.essayMax}
                      </td>
                      <td className="border border-slate-300 px-3 py-2.5 text-center font-bold font-mono text-purple-700">
                        {breakdown.essayScore}
                      </td>
                      <td className="border border-slate-300 px-4 py-2.5 text-slate-600 text-[11px]">
                        {breakdown.hasPendingEssays
                          ? 'Menunggu Penilaian Guru'
                          : 'Penilaian Guru Berbantuan AI'}
                      </td>
                    </tr>
                  )}

                  {/* Total Row */}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="border border-slate-300 px-4 py-3 text-right text-slate-900">
                      TOTAL SKOR AKHIR SISWA
                    </td>
                    <td className="border border-slate-300 px-3 py-3 text-center font-mono">
                      {summary.maxScore}
                    </td>
                    <td className="border border-slate-300 px-3 py-3 text-center text-sm font-black font-mono text-emerald-700">
                      {summary.score}
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-slate-800">
                      Nilai Akhir: <span className="font-black text-sm">{summary.percentage}</span> / 100
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Minimum Standard (KKM) & Achievement Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 print:bg-transparent">
              <span className="text-[11px] text-slate-500 block font-semibold">Kriteria Ketuntasan (KKTP / KKM):</span>
              <span className="text-sm font-bold text-slate-900 font-mono">75.00</span>
            </div>
            <div className={`border rounded-xl p-3 flex items-center justify-between ${
              isLulus
                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-800'
                : 'border-amber-300 bg-amber-50/40 text-amber-800'
            }`}>
              <div>
                <span className="text-[11px] font-semibold block">Status Capaian:</span>
                <span className="text-sm font-black tracking-wide">
                  {isLulus ? 'TUNTAS (LULUS)' : 'BELUM TUNTAS (REMEDIAL)'}
                </span>
              </div>
              {isLulus ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600" />
              )}
            </div>
          </div>

          {/* 6. Teacher Feedback on Essays (if any) */}
          {summary.essayFeedbacks && summary.essayFeedbacks.length > 0 && (
            <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-4 print:border print:border-slate-300 print:bg-transparent">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Catatan & Umpan Balik Guru (Soal Uraian):</span>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                {summary.essayFeedbacks.map((fb, idx) => (
                  <div key={idx} className="bg-white/80 p-2.5 rounded-lg border border-purple-100 print:border-slate-200">
                    <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                      <span>Soal Uraian #{fb.questionNumber}</span>
                      <span className="text-[11px] font-mono">Skor: {fb.scoreEarned} / {fb.maxPoints} Poin</span>
                    </div>
                    <p className="italic text-slate-700 leading-relaxed">"{fb.feedback}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Signatures & Digital Seal Verification */}
          <div className="pt-6 grid grid-cols-2 gap-8 items-end text-xs">
            {/* Digital Stamp & QR Authenticity */}
            <div className="border border-dashed border-slate-300 rounded-xl p-3 flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-lg flex flex-col items-center justify-center p-1 flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <span className="text-[8px] font-mono font-bold tracking-tighter">VERIFIED</span>
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-800 text-xs mb-0.5">Dokumen Digital Sah</p>
                <p>Diterbitkan melalui Platform UjianPintar CBT Cloud.</p>
                <p className="font-mono text-[9px] mt-1 text-slate-400">ID: {summary.sessionId}</p>
              </div>
            </div>

            {/* Teacher Signature Place */}
            <div className="text-center space-y-1">
              <p className="text-slate-600">Mengetahui,</p>
              <p className="text-slate-600">Guru Pengampu Mata Pelajaran</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-slate-300 font-serif italic text-xs">[ Tanda Tangan Digital ]</span>
              </div>
              <p className="font-bold text-slate-900 underline text-xs">
                {summary.teacherName || 'Rahmat, S.Pd.'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {summary.teacherNip && summary.teacherNip.trim() !== ''
                  ? `NIP. ${summary.teacherNip}`
                  : 'NIP. Guru Pengampu'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

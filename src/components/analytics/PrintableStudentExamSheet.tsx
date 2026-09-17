import React from 'react';
import type { GradeRecord, StudentAnswerDetailItem } from '../../types/exam';
import { MathRenderer } from '../common/MathRenderer';

interface PrintableStudentExamSheetProps {
  grade: GradeRecord;
  examTitle?: string;
  items: StudentAnswerDetailItem[];
  summary: {
    totalQuestions: number;
    answeredCount: number;
    correctCount: number;
    wrongCount: number;
    doubtCount: number;
  };
  filterTitle?: string;
}

export const PrintableStudentExamSheet: React.FC<PrintableStudentExamSheetProps> = ({
  grade,
  examTitle,
  items,
  summary,
  filterTitle,
}) => {
  const isPassed = grade.status === 'Lulus';
  const unansweredCount = Math.max(0, summary.totalQuestions - summary.answeredCount);

  const printDateStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  return (
    <div id="print-sheet-portal" className="text-slate-900 bg-white p-6 max-w-4xl mx-auto font-sans">
      {/* KOP DOKUMEN RESMI UJIAN */}
      <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 block">
              Sistem CBT UjianPintar
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              Dokumen Resmi Portofolio Hasil Belajar Siswa
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-700 block">
              ID Dokumen: {grade.sessionId ? grade.sessionId.slice(0, 8).toUpperCase() : grade.nisn}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Dicetak: {printDateStr}
            </span>
          </div>
        </div>

        <h1 className="text-lg font-black uppercase tracking-tight text-slate-900 font-serif">
          LEMBAR HASIL & BUKTI JAWABAN SISWA
        </h1>
        <p className="text-xs font-semibold text-slate-700 mt-0.5">
          {examTitle || 'Evaluasi Pembelajaran Berbasis Komputer (CBT)'}
        </p>
        {filterTitle && (
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 border border-slate-300 text-slate-800">
            {filterTitle}
          </span>
        )}
      </div>

      {/* TABEL DATA IDENTITAS SISWA & PELAKSANAAN */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-300 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Nama Lengkap</span>
            <span className="font-bold text-slate-900">: {grade.name}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Nomor Induk / NISN</span>
            <span className="font-mono font-bold text-slate-900">: {grade.nisn}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Kelas / Rombel</span>
            <span className="font-medium text-slate-800">: {grade.className}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 font-semibold text-slate-600 shrink-0">Mata Pelajaran</span>
            <span className="font-medium text-slate-800">: {examTitle || 'Ujian Terjadwal'}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline">
            <span className="w-32 font-semibold text-slate-600 shrink-0">Waktu Submit</span>
            <span className="font-medium text-slate-800">: {grade.submittedAt || '-'}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-32 font-semibold text-slate-600 shrink-0">Durasi Pengerjaan</span>
            <span className="font-medium text-slate-800">: {grade.timeSpentMinutes} Menit</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-32 font-semibold text-slate-600 shrink-0">Kepatuhan Layar</span>
            <span className="font-medium text-slate-800">
              : {grade.tabViolations > 0 ? `${grade.tabViolations}x Terdeteksi Pelanggaran` : 'Tertib (0 Pelanggaran)'}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-32 font-semibold text-slate-600 shrink-0">Metode Penilaian</span>
            <span className="font-medium text-slate-800">: Otomatis Sistem CBT Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* KOTAK RINGKASAN CAPAIAN NILAI */}
      <div className="mb-5 p-3.5 rounded-xl border border-slate-300 bg-white grid grid-cols-5 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Nilai Akhir</span>
          <span className="text-xl font-black font-mono text-slate-900 block mt-0.5">
            {grade.score}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Skala {grade.maxScore}</span>
        </div>

        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Hasil Kelulusan</span>
          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
            isPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}>
            {grade.status}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Jawaban Benar</span>
          <span className="text-xl font-black font-mono text-emerald-800 block mt-0.5">
            {summary.correctCount}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">Butir Soal</span>
        </div>

        <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-200">
          <span className="text-[10px] uppercase font-bold text-rose-700 block">Jawaban Salah</span>
          <span className="text-xl font-black font-mono text-rose-800 block mt-0.5">
            {summary.wrongCount}
          </span>
          <span className="text-[10px] text-rose-600 font-mono">Butir Soal</span>
        </div>

        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Tidak Dijawab</span>
          <span className="text-xl font-black font-mono text-slate-700 block mt-0.5">
            {unansweredCount}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Butir Soal</span>
        </div>
      </div>

      {/* DAFTAR BUTIR SOAL DAN LEMBAR JAWABAN */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Rincian Jawaban Soal (Total: {items.length} Butir Soal)
          </h2>
          <span className="text-[10px] text-slate-500 italic">
            * Opsi bertanda khusus menunjukkan pilihan siswa dan kunci jawaban resmi
          </span>
        </div>

        {items.map((q) => {
          const isAnswered = !!(q.selectedOptionId || (q.answerText && q.answerText.trim().length > 0));

          return (
            <div
              key={q.questionId}
              className="print-avoid-break p-3.5 rounded-xl border border-slate-300 bg-white text-xs leading-relaxed"
            >
              {/* Header Nomor & Status Poin */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono text-xs">
                    No. {q.number}
                  </span>
                  <span className="text-slate-600 font-semibold">
                    {q.type === 'short_answer' ? 'Isian Singkat' : 'Pilihan Ganda'}
                  </span>
                  {q.isDoubt && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                      Ragu-Ragu
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isAnswered ? (
                    <span className="font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                      [-] Tidak Dijawab (0 / {q.maxPoints} Poin)
                    </span>
                  ) : q.isCorrect ? (
                    <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-[11px]">
                      [✓] BENAR (+{q.pointsEarned} Poin)
                    </span>
                  ) : (
                    <span className="font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded text-[11px]">
                      [✗] SALAH (0 / {q.maxPoints} Poin)
                    </span>
                  )}
                </div>
              </div>

              {/* Teks Pertanyaan & Formula KaTeX */}
              <div className="text-slate-900 mb-2.5">
                <MathRenderer text={q.questionText} />
                {q.latexFormula && (
                  <div className="my-2 p-2 bg-slate-50 border border-slate-200 rounded">
                    <MathRenderer math={q.latexFormula} block />
                  </div>
                )}
                {q.imageUrl && (
                  <div className="my-2">
                    <img
                      src={q.imageUrl}
                      alt="Lampiran Soal"
                      className="max-h-48 object-contain rounded border border-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Pilihan Ganda (A, B, C, D, E) */}
              {q.type !== 'short_answer' && q.options && q.options.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {q.options.map((opt) => {
                    const isStudentChoice = q.selectedOptionId === opt.id;
                    const isCorrectKey = q.correctOptionId === opt.id;

                    let rowStyle = 'bg-white border-slate-200 text-slate-700';
                    let badgeLabel = null;

                    if (isStudentChoice && isCorrectKey) {
                      rowStyle = 'bg-emerald-50/90 border-emerald-400 font-semibold text-emerald-950';
                      badgeLabel = (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                          [✓ Jawaban Siswa - BENAR]
                        </span>
                      );
                    } else if (isStudentChoice && !isCorrectKey) {
                      rowStyle = 'bg-rose-50/90 border-rose-400 font-semibold text-rose-950';
                      badgeLabel = (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">
                          [✗ Jawaban Siswa - SALAH]
                        </span>
                      );
                    } else if (isCorrectKey) {
                      rowStyle = 'bg-emerald-50/40 border-emerald-400 border-dashed text-emerald-900 font-medium';
                      badgeLabel = (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-1.5 py-0.5 rounded">
                          [★ Kunci Jawaban Resmi]
                        </span>
                      );
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start justify-between gap-2 p-2 rounded-lg border text-xs ${rowStyle}`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span
                            className={`w-5 h-5 rounded font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                              isStudentChoice
                                ? isCorrectKey
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-rose-700 text-white'
                                : isCorrectKey
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <div className="pt-0.5 flex-1">
                            <MathRenderer text={opt.text} />
                          </div>
                        </div>
                        {badgeLabel && <div className="shrink-0">{badgeLabel}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Isian Singkat */}
              {q.type === 'short_answer' && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
                  <div className={`p-2 rounded border ${
                    !isAnswered
                      ? 'bg-slate-50 border-slate-300 text-slate-500'
                      : q.isCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}>
                    <span className="font-bold text-[10px] uppercase text-slate-500 block mb-0.5">
                      Jawaban Siswa ({isAnswered ? (q.isCorrect ? 'Benar' : 'Salah') : 'Kosong'}):
                    </span>
                    <p className="font-mono font-bold">
                      {q.answerText || <span className="italic font-normal text-slate-400">- Tidak Diisi -</span>}
                    </p>
                  </div>

                  <div className="p-2 rounded border border-emerald-300 bg-emerald-50/50 text-emerald-950">
                    <span className="font-bold text-[10px] uppercase text-emerald-700 block mb-0.5">
                      Kunci Jawaban Resmi:
                    </span>
                    <p className="font-mono font-bold text-emerald-900">
                      {q.correctAnswerText || '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LEMBAR PENGESAHAN & TANDA TANGAN */}
      <div className="print-avoid-break mt-8 pt-4 border-t-2 border-slate-800 text-xs">
        <div className="grid grid-cols-2 gap-8 text-center">
          <div>
            <p className="font-semibold text-slate-600 mb-1">Mengetahui / Mengonfirmasi,</p>
            <p className="font-bold text-slate-900">Siswa Peserta Ujian</p>
            <div className="h-16 flex items-end justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan Asli)</span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 mt-1 mx-8">
              {grade.name}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">NISN: {grade.nisn}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-600 mb-1">
              {printDateStr.split(',')[0]}
            </p>
            <p className="font-bold text-slate-900">Guru Pengampu / Pengawas Ujian</p>
            <div className="h-16 flex items-end justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan & Cap Sekolah)</span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 mt-1 mx-8">
              ( .................................................... )
            </p>
            <p className="text-[10px] text-slate-500">NIP / NUPTK: .......................................</p>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400">
          Lembar hasil ujian ini dicetak secara otomatis melalui Sistem Komputer UjianPintar dan sah sebagai dokumen portofolio akademik.
        </div>
      </div>
    </div>
  );
};

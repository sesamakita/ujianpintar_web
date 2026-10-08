import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Scale, 
  SlidersHorizontal, 
  Equal, 
  Layers, 
  Sparkles
} from 'lucide-react';
import type { Question, QuestionType } from '../../types/exam';

interface BulkPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  selectedQuestionIds: string[];
  onApplyPoints: (updatedQuestions: Question[]) => void;
}

type BulkMode = 'target100' | 'uniform' | 'by_type';

export const BulkPointsModal: React.FC<BulkPointsModalProps> = ({
  isOpen,
  onClose,
  questions,
  selectedQuestionIds,
  onApplyPoints,
}) => {
  const [mode, setMode] = useState<BulkMode>('target100');
  const [scope, setScope] = useState<'all' | 'selected'>(
    selectedQuestionIds.length > 0 ? 'selected' : 'all'
  );

  // Mode 1: Target Total (Default 100)
  const [targetTotal, setTargetTotal] = useState<number>(100);

  // Mode 2: Uniform points per question
  const [uniformPoints, setUniformPoints] = useState<number>(5);

  // Mode 3: Points by Question Type
  const [typePoints, setTypePoints] = useState<Record<QuestionType, number>>({
    multiple_choice: 2,
    true_false: 2,
    short_answer: 5,
    essay: 10,
  });

  if (!isOpen) return null;

  // Determine which questions are affected
  const targetQuestions = scope === 'selected' && selectedQuestionIds.length > 0
    ? questions.filter((q) => selectedQuestionIds.includes(q.id))
    : questions;

  const targetCount = targetQuestions.length;

  // Statistics of types in target questions
  const typeCounts: Record<QuestionType, number> = {
    multiple_choice: 0,
    true_false: 0,
    short_answer: 0,
    essay: 0,
  };

  targetQuestions.forEach((q) => {
    if (typeCounts[q.type] !== undefined) {
      typeCounts[q.type]++;
    } else {
      typeCounts.multiple_choice++;
    }
  });

  // Calculate simulated preview results
  const calculateSimulatedPoints = (): { pointsMap: Map<string, number>; simulatedTotal: number; summaryText: string } => {
    const pointsMap = new Map<string, number>();

    if (targetCount === 0) {
      return { pointsMap, simulatedTotal: 0, summaryText: 'Tidak ada soal yang dipilih.' };
    }

    if (mode === 'target100') {
      const total = Math.max(1, targetTotal);
      const basePoints = Math.floor(total / targetCount);
      const remainder = total % targetCount;

      targetQuestions.forEach((q, idx) => {
        // Distribute remainder 1 by 1 to first questions
        const pts = idx < remainder ? basePoints + 1 : basePoints;
        pointsMap.set(q.id, Math.max(1, pts));
      });

      const actualSum = Array.from(pointsMap.values()).reduce((a, b) => a + b, 0);
      const minPts = basePoints;
      const maxPts = remainder > 0 ? basePoints + 1 : basePoints;

      return {
        pointsMap,
        simulatedTotal: actualSum,
        summaryText: remainder === 0
          ? `Masing-masing dari ${targetCount} soal akan bernilai ${basePoints} poin (Pas ${actualSum} Poin).`
          : `${remainder} soal bernilai ${maxPts} poin dan ${targetCount - remainder} soal bernilai ${minPts} poin (Total Pas ${actualSum} Poin).`,
      };
    }

    if (mode === 'uniform') {
      const pts = Math.max(1, uniformPoints);
      targetQuestions.forEach((q) => {
        pointsMap.set(q.id, pts);
      });
      const actualSum = targetCount * pts;
      return {
        pointsMap,
        simulatedTotal: actualSum,
        summaryText: `Semua ${targetCount} soal bernilai seragam ${pts} poin (Total: ${actualSum} Poin).`,
      };
    }

    // mode === 'by_type'
    let sum = 0;
    targetQuestions.forEach((q) => {
      const pts = Math.max(1, typePoints[q.type] || 10);
      pointsMap.set(q.id, pts);
      sum += pts;
    });

    return {
      pointsMap,
      simulatedTotal: sum,
      summaryText: `Total akumulasi berdasarkan bobot per jenis: ${sum} Poin.`,
    };
  };

  const simulation = calculateSimulatedPoints();

  const handleApply = () => {
    const { pointsMap } = simulation;
    const updated = questions.map((q) => {
      if (pointsMap.has(q.id)) {
        return { ...q, points: pointsMap.get(q.id)! };
      }
      return q;
    });

    onApplyPoints(updated);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Pengaturan Poin Massal" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full flex flex-col shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-5 text-white flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              <Scale className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg tracking-tight text-white leading-none">
                Pengaturan Poin Masal
              </h3>
              <p className="text-xs text-blue-100 font-sans mt-1">
                Atur bobot skor untuk seluruh butir soal atau kelompok soal sekaligus
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hover">
          
          {/* Scope Selector (Semua vs Terpilih) */}
          <div className="space-y-1.5">
            <label id="bpm-g1" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider">
              Lingkup Butir Soal yang Diubah:
            </label>
            <div role="group" aria-labelledby="bpm-g1" className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-2.5 rounded-xl border text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  scope === 'all'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Semua Soal ({questions.length} Butir)</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('selected')}
                disabled={selectedQuestionIds.length === 0}
                className={`p-2.5 rounded-xl border text-xs font-display font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedQuestionIds.length === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                    : scope === 'selected'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs cursor-pointer'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Hanya yang Dipilih ({selectedQuestionIds.length} Butir)</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="space-y-1.5">
            <label id="bpm-g3" className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider">
              Metode Pengaturan Bobot:
            </label>
            <div role="group" aria-labelledby="bpm-g3" className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('target100')}
                className={`py-2 px-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  mode === 'target100'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bagi Rata (100 Poin)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('uniform')}
                className={`py-2 px-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  mode === 'uniform'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Equal className="w-3.5 h-3.5 text-blue-500" />
                <span>Poin Seragam</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('by_type')}
                className={`py-2 px-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  mode === 'by_type'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-violet-500" />
                <span>Per Jenis Soal</span>
              </button>
            </div>
          </div>

          {/* Tab 1 Content: Target 100 Poin */}
          {mode === 'target100' && (
            <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-display font-bold text-blue-950">
                    Otomatisasi Pembagian Menuju Target Nilai
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Sistem akan membagi total poin ke seluruh {targetCount} butir soal secara presisi. Jika tidak habis dibagi rata, sisa poin akan didistribusikan ke soal awal agar total tepat sesuai target.
                  </p>
                </div>
                <div className="w-24 flex-shrink-0">
                  <label htmlFor="bulkpo-1" className="text-[10px] font-bold text-blue-800 uppercase block mb-1">
                    Target Skor
                  </label>
                  <input id="bulkpo-1"
                    type="number"
                    min="1"
                    max="1000"
                    value={targetTotal}
                    onChange={(e) => setTargetTotal(Math.max(1, parseInt(e.target.value) || 100))}
                    className="w-full bg-white border border-blue-300 font-mono font-black text-sm text-blue-900 text-center py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Target Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-medium">Preset Cepat:</span>
                {[50, 100, 150, 200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetTotal(preset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      targetTotal === preset
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset} Poin
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2 Content: Uniform Points */}
          {mode === 'uniform' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-display font-bold text-slate-900">
                    Nilai Poin Sama Rata per Soal
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Setiap butir soal akan mendapatkan nilai poin yang identik.
                  </p>
                </div>
                <div className="w-24 flex-shrink-0">
                  <label htmlFor="bulkpo-2" className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                    Poin/Soal
                  </label>
                  <input id="bulkpo-2"
                    type="number"
                    min="1"
                    max="100"
                    value={uniformPoints}
                    onChange={(e) => setUniformPoints(Math.max(1, parseInt(e.target.value) || 5))}
                    className="w-full bg-white border border-slate-300 font-mono font-black text-sm text-slate-900 text-center py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10px] text-slate-500 font-medium">Pilihan Cepat:</span>
                {[2, 3, 4, 5, 10, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setUniformPoints(preset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      uniformPoints === preset
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset} Poin
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3 Content: Points by Type */}
          {mode === 'by_type' && (
            <div className="p-4 bg-violet-50/60 border border-violet-200/80 rounded-2xl space-y-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-display font-bold text-violet-950">
                  Atur Bobot Berdasarkan Jenis Soal
                </h4>
                <p className="text-[11px] text-slate-600">
                  Tentukan nilai bobot berbeda untuk masing-masing tipe soal dalam ujian ini:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Pilihan Ganda */}
                <div className="bg-white p-2.5 rounded-xl border border-violet-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-xs font-display font-bold text-slate-800 block">Pilihan Ganda</span>
                    <span className="text-[10px] text-slate-500">{typeCounts.multiple_choice} butir soal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={typePoints.multiple_choice}
                      onChange={(e) => setTypePoints({ ...typePoints, multiple_choice: Math.max(1, parseInt(e.target.value) || 2) })}
                      className="w-14 bg-slate-50 border border-slate-200 text-center font-mono font-bold text-xs py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <span className="text-[10px] text-slate-500">pt</span>
                  </div>
                </div>

                {/* Benar / Salah */}
                <div className="bg-white p-2.5 rounded-xl border border-violet-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-xs font-display font-bold text-slate-800 block">Benar / Salah</span>
                    <span className="text-[10px] text-slate-500">{typeCounts.true_false} butir soal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={typePoints.true_false}
                      onChange={(e) => setTypePoints({ ...typePoints, true_false: Math.max(1, parseInt(e.target.value) || 2) })}
                      className="w-14 bg-slate-50 border border-slate-200 text-center font-mono font-bold text-xs py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <span className="text-[10px] text-slate-500">pt</span>
                  </div>
                </div>

                {/* Isian Singkat */}
                <div className="bg-white p-2.5 rounded-xl border border-violet-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-xs font-display font-bold text-slate-800 block">Isian Singkat</span>
                    <span className="text-[10px] text-slate-500">{typeCounts.short_answer} butir soal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={typePoints.short_answer}
                      onChange={(e) => setTypePoints({ ...typePoints, short_answer: Math.max(1, parseInt(e.target.value) || 5) })}
                      className="w-14 bg-slate-50 border border-slate-200 text-center font-mono font-bold text-xs py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <span className="text-[10px] text-slate-500">pt</span>
                  </div>
                </div>

                {/* Uraian */}
                <div className="bg-white p-2.5 rounded-xl border border-violet-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-xs font-display font-bold text-slate-800 block">Uraian / Esai</span>
                    <span className="text-[10px] text-slate-500">{typeCounts.essay} butir soal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={typePoints.essay}
                      onChange={(e) => setTypePoints({ ...typePoints, essay: Math.max(1, parseInt(e.target.value) || 10) })}
                      className="w-14 bg-slate-50 border border-slate-200 text-center font-mono font-bold text-xs py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <span className="text-[10px] text-slate-500">pt</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Simulation Result Banner */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-mono uppercase text-blue-300 tracking-wider block">
                Pratinjau Hasil Perubahan:
              </span>
              <p className="text-xs font-sans text-slate-200 truncate">
                {simulation.summaryText}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 block font-mono">Total Skor Akhir</span>
              <span className="text-base font-mono font-black text-amber-400">
                {simulation.simulatedTotal} Pts
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={targetCount === 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-display font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Terapkan Bobot Poin ({targetCount} Soal)</span>
          </button>
        </div>

      </div>
    </div>
  );
};

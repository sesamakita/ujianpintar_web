import React, { useState } from 'react';
import { 
  Trash2, 
  Copy, 
  Plus, 
  Code2, 
  Image as ImageIcon, 
  CheckCircle2,
  Check,
  Eye,
  Pencil
} from 'lucide-react';
import type { Question, QuestionType } from '../../types/exam';
import { MathRenderer } from '../common/MathRenderer';

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updated: Question) => void;
  onDelete: (id: string) => void;
  onDuplicate: (q: Question) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  isSelected = false,
  onToggleSelect,
}) => {
  const [showFormulaInput, setShowFormulaInput] = useState(!!question.latexFormula);
  const [showImageInput, setShowImageInput] = useState(!!question.imageUrl);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  const handleTypeChange = (newType: QuestionType) => {
    let newOptions = [...question.options];
    let correctOptionId = question.correctOptionId;

    if (newType === 'true_false' && newOptions.length !== 2) {
      newOptions = [
        { id: `opt-${question.id}-t`, label: 'Benar', text: 'Benar' },
        { id: `opt-${question.id}-f`, label: 'Salah', text: 'Salah' },
      ];
      correctOptionId = newOptions[0].id;
    } else if (newType === 'multiple_choice' && newOptions.length === 0) {
      newOptions = [
        { id: `opt-${question.id}-a`, label: 'A', text: '' },
        { id: `opt-${question.id}-b`, label: 'B', text: '' },
        { id: `opt-${question.id}-c`, label: 'C', text: '' },
        { id: `opt-${question.id}-d`, label: 'D', text: '' },
      ];
      correctOptionId = newOptions[0].id;
    }

    onUpdate({
      ...question,
      type: newType,
      options: newOptions,
      correctOptionId,
    });
  };

  const handleOptionTextChange = (optId: string, text: string) => {
    const updatedOptions = question.options.map((opt) =>
      opt.id === optId ? { ...opt, text } : opt
    );
    onUpdate({ ...question, options: updatedOptions });
  };

  const handleAddOption = () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextLabel = labels[question.options.length] || `Opt ${question.options.length + 1}`;
    const newOpt = {
      id: `opt-${question.id}-${Date.now()}`,
      label: nextLabel,
      text: '',
    };
    onUpdate({
      ...question,
      options: [...question.options, newOpt],
    });
  };

  const handleRemoveOption = (optId: string) => {
    if (question.options.length <= 2) return;
    const filtered = question.options.filter((o) => o.id !== optId);
    let newCorrect = question.correctOptionId;
    if (newCorrect === optId) {
      newCorrect = filtered[0]?.id;
    }
    onUpdate({
      ...question,
      options: filtered,
      correctOptionId: newCorrect,
    });
  };

  return (
    <div
      className={`rounded-2xl border transition-all p-5 space-y-4 ${
        isSelected
          ? 'bg-blue-50/20 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Header Bar - Perfectly Aligned Line */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* Checkbox (Ceklis) */}
          <button
            type="button"
            onClick={() => onToggleSelect?.(question.id)}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-slate-50 border-slate-300 hover:border-blue-400 text-transparent hover:text-slate-300'
            }`}
            title={isSelected ? 'Batalkan pilihan butir ini' : 'Pilih butir soal ini (ceklis)'}
          >
            <Check className={`w-3.5 h-3.5 stroke-[3] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          {/* Question Number Badge */}
          <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-display font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
            {index + 1}
          </span>

          {/* Question Type Selector */}
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className="h-8 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-display font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="multiple_choice">Pilihan Ganda (A-E)</option>
            <option value="short_answer">Isian Singkat (Exact Match)</option>
            <option value="true_false">Benar / Salah (True/False)</option>
            <option value="essay">Uraian / Esai Terbuka</option>
          </select>
        </div>

        {/* Right Tools: Points, Duplicate, Delete */}
        <div className="flex items-center gap-2">
          <div className="h-8 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 rounded-xl">
            <span className="text-[11px] font-display font-bold text-slate-500">Poin:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={question.points}
              onChange={(e) => onUpdate({ ...question, points: parseInt(e.target.value) || 10 })}
              className="w-10 bg-transparent font-mono font-black text-xs text-blue-700 text-right focus:outline-none"
            />
          </div>

          <button
            onClick={() => onDuplicate(question)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Duplikat Butir Soal Ini"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(question.id)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Hapus Butir Soal Ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Question Text Area */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider">
            Teks Butir Pertanyaan
          </label>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setIsEditingQuestion(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                !isEditingQuestion
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilkan rumus matematika rapi"
            >
              <Eye className="w-3 h-3 text-blue-600" />
              <span>Tampilan Rapi</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingQuestion(true)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                isEditingQuestion
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Edit teks / rumus kode mentah"
            >
              <Pencil className="w-3 h-3 text-slate-600" />
              <span>Edit Teks</span>
            </button>
          </div>
        </div>

        {!isEditingQuestion ? (
          <div
            onClick={() => setIsEditingQuestion(true)}
            className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 leading-relaxed font-sans cursor-pointer transition-colors relative group min-h-[64px] flex items-center"
            title="Klik untuk mengedit teks butir soal"
          >
            {question.questionText ? (
              <div className="w-full font-medium leading-relaxed">
                <MathRenderer text={question.questionText} />
              </div>
            ) : (
              <span className="text-slate-400 italic text-xs">Klik untuk mengetikkan teks butir pertanyaan...</span>
            )}
            <span className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md transition-opacity flex items-center gap-1">
              <Pencil className="w-2.5 h-2.5" /> Edit
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={3}
              value={question.questionText}
              onChange={(e) => onUpdate({ ...question, questionText: e.target.value })}
              onBlur={() => {
                if (question.questionText.trim()) {
                  setIsEditingQuestion(false);
                }
              }}
              autoFocus
              placeholder="Tuliskan teks butir pertanyaan di sini..."
              className="w-full bg-white border border-blue-400 ring-2 ring-blue-500/20 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none transition-colors font-sans font-medium leading-relaxed resize-y"
            />
            {question.questionText && (question.questionText.includes('$') || question.questionText.includes('\\')) && (
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-slate-800">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-0.5">Pratinjau Langsung:</span>
                <MathRenderer text={question.questionText} />
              </div>
            )}
          </div>
        )}

        {/* Action Pills for LaTeX / Media */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFormulaInput(!showFormulaInput)}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              showFormulaInput
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4 flex-shrink-0" />
            <span>Rumus LaTeX</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              showImageInput
                ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4 flex-shrink-0" />
            <span>Sisipkan Gambar</span>
          </button>
        </div>

        {/* Formula Input & Live KaTeX Box */}
        {showFormulaInput && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs font-display font-bold text-indigo-950">
              <span className="uppercase tracking-wider">Editor Rumus LaTeX</span>
              <span className="text-indigo-600 text-xs font-mono">
                Contoh: \frac&#123;-b \pm \sqrt&#123;D&#125;&#125;&#123;2a&#125;
              </span>
            </div>
            <input
              type="text"
              value={question.latexFormula || ''}
              onChange={(e) => onUpdate({ ...question, latexFormula: e.target.value })}
              placeholder="Ketikkan kode formula LaTeX..."
              className="w-full h-10 bg-white border border-indigo-200 rounded-xl px-3.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {question.latexFormula && (
              <div className="p-3.5 bg-white rounded-xl border border-indigo-100 flex items-center justify-center shadow-xs">
                <MathRenderer math={question.latexFormula} block />
              </div>
            )}
          </div>
        )}

        {/* Image URL Input */}
        {showImageInput && (
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <label className="block text-xs font-display font-bold text-blue-950 uppercase tracking-wider">
              URL Gambar Diagram / Ilustrasi
            </label>
            <input
              type="text"
              value={question.imageUrl || ''}
              onChange={(e) => onUpdate({ ...question, imageUrl: e.target.value })}
              placeholder="https://example.com/gambar-diagram.png"
              className="w-full h-10 bg-white border border-blue-200 rounded-xl px-3.5 text-sm font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}
      </div>

      {/* Answer Options & Key Section */}
      <div className="pt-4 border-t border-slate-100">
        {question.type === 'multiple_choice' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Pilihan Jawaban & Kunci
              </span>
              <span className="text-xs text-slate-400 font-sans">Pilih huruf untuk menetapkan kunci jawaban</span>
            </div>

            <div className="space-y-2.5">
              {question.options.map((opt) => {
                const isCorrect = question.correctOptionId === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      isCorrect
                        ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400/30'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Radio Button for Key */}
                    <button
                      type="button"
                      onClick={() => onUpdate({ ...question, correctOptionId: opt.id })}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-display font-bold transition-all cursor-pointer flex-shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-500'
                      }`}
                      title="Klik untuk jadikan kunci jawaban benar"
                    >
                      {opt.label}
                    </button>

                    {/* Option Text: Rendered Math vs Input on Edit */}
                    {opt.text && (opt.text.includes('$') || opt.text.includes('\\')) && editingOptionId !== opt.id ? (
                      <div
                        onClick={() => setEditingOptionId(opt.id)}
                        className="flex-1 py-1 px-2 hover:bg-slate-100/80 rounded-lg cursor-pointer text-sm font-sans font-medium text-slate-900 transition-colors flex items-center justify-between group min-h-[32px]"
                        title="Klik untuk mengedit teks pilihan ini"
                      >
                        <div className="flex-1">
                          <MathRenderer text={opt.text} />
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 flex items-center gap-0.5 flex-shrink-0 ml-2">
                          <Pencil className="w-2.5 h-2.5" /> Edit
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                          onBlur={() => setEditingOptionId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingOptionId(null);
                          }}
                          autoFocus={editingOptionId === opt.id}
                          placeholder={`Ketik teks pilihan jawaban ${opt.label}...`}
                          className="w-full bg-transparent text-sm font-sans font-medium text-slate-800 focus:outline-none"
                        />
                        {editingOptionId === opt.id && opt.text && (opt.text.includes('$') || opt.text.includes('\\')) && (
                          <div className="text-xs text-indigo-900 mt-1 pt-1 border-t border-indigo-100/60 font-sans">
                            <MathRenderer text={opt.text} />
                          </div>
                        )}
                      </div>
                    )}

                    {isCorrect && (
                      <span className="text-[11px] font-display font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300 flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Kunci Benar
                      </span>
                    )}

                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1 transition-colors cursor-pointer flex-shrink-0"
                        title="Hapus Opsi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {question.options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-display font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" /> Tambah Pilihan ({['A', 'B', 'C', 'D', 'E', 'F'][question.options.length]})
              </button>
            )}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="space-y-2">
            <span className="text-xs font-display font-bold text-slate-700 uppercase tracking-wider block">
              Pilih Kunci Jawaban Benar:
            </span>
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt) => {
                const isCorrect = question.correctOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdate({ ...question, correctOptionId: opt.id })}
                    className={`h-11 rounded-xl border text-center font-display font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isCorrect
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isCorrect && <Check className="w-4 h-4 stroke-[3]" />}
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {question.type === 'short_answer' && (
          <div className="space-y-2">
            <label className="block text-xs font-display font-bold text-slate-700 uppercase tracking-wider">
              Kunci Jawaban Singkat (Exact Text Match)
            </label>
            <input
              type="text"
              value={question.correctAnswerText || ''}
              onChange={(e) => onUpdate({ ...question, correctAnswerText: e.target.value })}
              placeholder="Contoh: 0 atau -4"
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-[11px] text-slate-400 font-sans">
              Sistem akan mencocokkan teks jawaban siswa secara otomatis.
            </p>
          </div>
        )}

        {question.type === 'essay' && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-sans leading-relaxed">
            <strong className="font-display font-bold">📝 Tipe Soal Esai:</strong> Jawaban esai siswa akan dievaluasi dan dinilai secara manual oleh guru melalui menu rekapitulasi nilai setelah sesi ujian berakhir.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;

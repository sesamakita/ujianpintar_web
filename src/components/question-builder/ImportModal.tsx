import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import type { Question } from '../../types/exam';
import { parseUploadedFile, type ParseResult } from '../../utils/fileParser';
import { downloadExcelTemplate, downloadCsvTemplate, downloadWordTemplate } from '../../utils/templateGenerator';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (questions: Question[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'word'>('excel');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setParseResult(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await parseUploadedFile(file);
      setParseResult(result);
    } catch (err: any) {
      setParseResult({
        success: false,
        questions: [],
        errors: [`Terjadi error: ${err?.message || 'Gagal membaca file.'}`],
        warnings: [],
        totalParsed: 0,
        filename: file.name
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyImport = () => {
    if (parseResult && parseResult.questions.length > 0) {
      onImportSuccess(parseResult.questions);
      handleReset();
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    if (selectedFormat === 'excel') {
      downloadExcelTemplate();
    } else {
      downloadWordTemplate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight">Import Butir Soal Massal</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Unggah butir soal sekaligus dari file Excel (.xlsx, .csv) atau teks</p>
            </div>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="w-8 h-8 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Real File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1 scrollbar-hover">
          {!parseResult ? (
            <>
              {/* Template Selector Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('excel')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedFormat === 'excel'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-display font-bold text-slate-900">Format Microsoft Excel</div>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5">Mendukung .xlsx, .xls, .csv</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('word')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedFormat === 'word'
                      ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-display font-bold text-slate-900">Format Teks Aiken / Word</div>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5">Format standar guru (.txt)</div>
                  </div>
                </button>
              </div>

              {/* Dropzone Upload */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/70'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
                }`}
              >
                {isProcessing ? (
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-display font-bold text-slate-800">Sedang membaca struktur tabel & rumus soal...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-9 h-9 text-slate-400 mx-auto" />
                    <div className="text-xs font-display font-bold text-slate-800">
                      Tarik & Lepaskan File {selectedFormat === 'excel' ? 'Excel (.xlsx, .csv)' : 'Teks (.txt)'} ke sini
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">atau klik area ini untuk memilih file dari komputer</p>
                  </div>
                )}
              </div>

              {/* Download Sample Template */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-display font-bold text-slate-800 uppercase tracking-wider">
                      Unduh Template {selectedFormat === 'excel' ? 'Excel (.xlsx)' : 'Teks (.txt)'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans">
                      Gunakan format baku ini agar kolom & kunci jawaban terisi otomatis
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {selectedFormat === 'excel' && (
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-display font-bold text-slate-700 transition-colors shadow-xs cursor-pointer"
                    >
                      Format .CSV
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-display font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh {selectedFormat === 'excel' ? '.XLSX' : '.TXT'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Live Preview Screen after Parsing */
            <div className="space-y-3.5">
              {/* Parse Result Summary Banner */}
              {parseResult.success ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-display font-bold text-emerald-950">
                        {parseResult.totalParsed} Butir Soal Berhasil Dibaca!
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-sans">
                        File: <span className="font-mono font-bold">{parseResult.filename}</span>
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-display font-bold">
                    Siap Impor
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-display font-bold text-rose-950">Gagal Memproses File</h4>
                    {parseResult.errors.map((err, i) => (
                      <p key={i} className="text-[11px] text-rose-700 font-sans mt-0.5">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings if any */}
              {parseResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="text-[11px] font-display font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Catatan Penyesuaian ({parseResult.warnings.length}):
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 font-sans space-y-0.5">
                    {parseResult.warnings.slice(0, 3).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Questions Preview Table */}
              {parseResult.questions.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 text-xs font-display font-bold text-slate-700 flex items-center justify-between">
                    <span>Pratinjau Butir Soal Terdeteksi</span>
                    <span className="text-[11px] text-slate-500 font-mono font-normal">
                      {parseResult.questions.length} Soal
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {parseResult.questions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3 text-xs space-y-1.5 hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-display font-bold text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold uppercase">
                              {q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'true_false' ? 'Benar/Salah' : 'Isian'}
                            </span>
                            {q.latexFormula && (
                              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded text-[10px] font-mono">
                                LaTeX
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {q.points} Poin
                          </span>
                        </div>
                        <p className="font-sans font-medium text-slate-900 line-clamp-2">
                          {q.questionText}
                        </p>
                        {q.type === 'multiple_choice' && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {q.options.map((opt) => {
                              const isKey = q.correctOptionId === opt.id;
                              return (
                                <span
                                  key={opt.id}
                                  className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                                    isKey
                                      ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {opt.label}. {opt.text}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {q.type === 'short_answer' && (
                          <div className="text-[11px] text-slate-600 font-sans">
                            Kunci: <span className="font-mono font-bold text-emerald-800">{q.correctAnswerText}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          {parseResult ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Upload File Lain</span>
              </button>

              {parseResult.success && parseResult.questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-display font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Terapkan ke Bank Soal (+{parseResult.totalParsed} Soal)</span>
                </button>
              )}
            </>
          ) : (
            <>
              <div className="text-[11px] text-slate-400 font-sans">
                File didukung: <span className="font-mono font-bold text-slate-600">.xlsx, .xls, .csv, .txt</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-display font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;

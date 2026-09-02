import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Bookmark, 
  Grid, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Check
} from 'lucide-react';
import type { ExamSettings, Question, StudentProctoring, GradeRecord, ViolationLogItem } from '../../types/exam';
import { MathRenderer } from '../common/MathRenderer';
import { RustEngineBridge } from '../../wasm/rustEngine';

interface MobilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  examSettings: ExamSettings;
  questions: Question[];
  onStudentSubmit?: (student: StudentProctoring, grade: GradeRecord, logs: ViolationLogItem[]) => void;
}

export const MobilePreviewModal: React.FC<MobilePreviewModalProps> = ({
  isOpen,
  onClose,
  examSettings,
  questions,
  onStudentSubmit,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nisn, setNisn] = useState('0082391024');
  const [name, setName] = useState('Budi Santoso');
  const [tokenInput, setTokenInput] = useState(examSettings.token);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [doubtAnswers, setDoubtAnswers] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentQ = questions[currentQIndex] || questions[0];

  const handleSelectOption = (optId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQIndex]: optId,
    });
  };

  const toggleDoubt = () => {
    setDoubtAnswers({
      ...doubtAnswers,
      [currentQIndex]: !doubtAnswers[currentQIndex],
    });
  };

  const resetSimulation = () => {
    setStep(1);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setShortAnswers({});
    setDoubtAnswers({});
    setIsSubmitted(false);
    setFinalScore(null);
  };

  const handleFinalSubmit = async () => {
    // 1. Convert questions & answers for Rust scoring engine
    const rustQuestions = questions.map((q) => ({
      id: q.id,
      question_type: q.type,
      correct_option_id: q.correctOptionId,
      correct_answer_text: q.correctAnswerText,
      points: q.points || 10,
    }));

    const rustAnswers = questions.map((q, idx) => ({
      question_id: q.id,
      selected_option_id: selectedAnswers[idx],
      answer_text: shortAnswers[idx],
    }));

    // 2. Grade with Rust Engine Bridge
    const gradeResult = RustEngineBridge.gradeExam(rustQuestions, rustAnswers, 75);
    setFinalScore(gradeResult.total_score);
    setIsSubmitted(true);

    const studentId = `stu-${Date.now()}`;
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 3. Create Student Proctoring record
    const studentRecord: StudentProctoring = {
      id: studentId,
      nisn: nisn || '0082391024',
      name: name || 'Siswa Baru',
      className: examSettings.gradeLevel || 'Kelas X',
      progressCount: Object.keys(selectedAnswers).length + Object.keys(shortAnswers).length,
      totalQuestions: questions.length,
      remainingSeconds: examSettings.durationMinutes * 60 - 120,
      connectionStatus: 'online',
      violationCount: 0,
      violationLogs: [],
      status: 'submitted',
      score: gradeResult.total_score,
    };

    // 4. Create Grade Record
    const gradeRecord: GradeRecord = {
      studentId: studentId,
      nisn: nisn || '0082391024',
      name: name || 'Siswa Baru',
      className: examSettings.gradeLevel || 'Kelas X',
      score: gradeResult.total_score,
      maxScore: gradeResult.max_score || 100,
      submittedAt: nowTimeStr,
      timeSpentMinutes: Math.max(1, Math.round(examSettings.durationMinutes / 3)),
      tabViolations: 0,
      status: gradeResult.status,
    };

    if (onStudentSubmit) {
      onStudentSubmit(studentRecord, gradeRecord, []);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-4xl w-full flex flex-col md:flex-row gap-8 shadow-2xl relative">
        
        {/* Left Side: Explanatory Guide */}
        <div className="flex-1 text-white flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-500/30">
                <Smartphone className="w-4 h-4 text-blue-400" /> Simulasi Interaktif Siswa
              </span>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                title="Reset Alur Siswa"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <h2 className="text-2xl font-black text-slate-100 tracking-tight leading-snug">
              Uji Coba Alur Pengerjaan Siswa
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Ketik jawaban pada butir soal baru Anda, lalu klik <strong>"Kumpulkan"</strong> untuk melihat sistem auto-grading Rust menghitung nilai dan memasukkannya ke dashboard guru.
            </p>

            {/* Stepper Indicator */}
            <div className="space-y-3 mt-6">
              {/* Step 1 */}
              <div
                onClick={() => setStep(1)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  step === 1
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    step === 1 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Langkah 1: Quick Entry (Pintu Masuk)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Input NISN & 6 Digit Token PIN ({examSettings.token})</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => setStep(2)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  step === 2
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    step === 2 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Langkah 2: Konfirmasi & Fullscreen Lock</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Verifikasi identitas & penguncian layar penuh browser</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => setStep(3)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  step === 3
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    step === 3 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Langkah 3: Lembar Soal & Auto-Grading</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Pengerjaan soal, auto-save per nomor, & submit nilai</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-xs text-slate-400 leading-relaxed">
            ⚡ <strong className="text-slate-200">Mesin Rust Engine:</strong> Menilai jawaban secara presisi (&lt;5ms) dan membuat stempel integritas SHA-256 anti-manipulasi.
          </div>
        </div>

        {/* Right Side: Phone Frame Mockup */}
        <div className="flex items-center justify-center relative">
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-20 p-2 bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-700 shadow-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Smartphone Bezel */}
          <div className="w-[360px] h-[640px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl ring-8 ring-slate-800 border-4 border-slate-900 flex flex-col relative overflow-hidden">
            {/* Camera notch */}
            <div className="w-32 h-4.5 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
            </div>

            {/* Screen Viewport */}
            <div className="bg-slate-50 flex-1 rounded-[36px] overflow-y-auto relative text-slate-900 flex flex-col">
              
              {/* SUBMISSION RESULT SCREEN */}
              {isSubmitted ? (
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-md animate-bounce">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                      Ujian Selesai Disubmit
                    </span>
                    <h3 className="text-xl font-display font-black text-slate-900 mt-2">
                      Terima Kasih, {name}!
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Lembar jawaban telah terkoreksi otomatis oleh sistem.
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 w-full shadow-xs">
                    <span className="text-xs text-slate-400 font-bold uppercase block">Nilai Perolehan Ujian:</span>
                    <div className="text-4xl font-display font-black text-emerald-700 mt-1">
                      {finalScore} <span className="text-sm font-bold text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { resetSimulation(); onClose(); }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-display font-bold text-xs shadow-md cursor-pointer"
                  >
                    Tutup & Lihat di Dashboard Guru
                  </button>
                </div>
              ) : (
                <>
                  {/* SCREEN 1: QUICK ENTRY */}
                  {step === 1 && (
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="text-center pt-2">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-base mb-2.5 shadow-md">
                          UP
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-lg">UjianPintar</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Masukkan identitas & token ujian sekolah</p>

                        {/* Inputs */}
                        <div className="mt-6 space-y-3.5 text-left">
                          <div>
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">NISN Peserta</label>
                            <input
                              type="text"
                              value={nisn}
                              onChange={(e) => setNisn(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Nama Lengkap Siswa</label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Token PIN (6 Digit)</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={tokenInput}
                              onChange={(e) => setTokenInput(e.target.value)}
                              className="w-full bg-white border-2 border-blue-500 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono font-black text-blue-700 tracking-widest shadow-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={() => setStep(2)}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          Lanjutkan ke Konfirmasi <ArrowRight className="w-4 h-4" />
                        </button>
                        <div className="text-center mt-2.5 text-xs text-slate-400 font-medium">
                          ⚡ Koneksi Siap • Token Valid
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCREEN 2: CONFIRMATION & LOBBY */}
                  {step === 2 && (
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                          Ujian Terjadwal
                        </span>
                        
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                            {examSettings.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">Mapel: {examSettings.subject}</p>
                        </div>

                        {/* Metadata Box */}
                        <div className="grid grid-cols-2 gap-2.5 p-3 bg-white rounded-2xl border border-slate-200 text-xs">
                          <div>
                            <span className="text-slate-400 block font-medium">Durasi:</span>
                            <strong className="text-slate-900 text-sm">{examSettings.durationMinutes} Menit</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Jumlah Soal:</span>
                            <strong className="text-slate-900 text-sm">{questions.length} Butir</strong>
                          </div>
                        </div>

                        {/* Verification Box */}
                        <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200">
                          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Identitas Terverifikasi:</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">{name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">NISN: {nisn} • {examSettings.gradeLevel}</div>
                        </div>

                        {/* Rules */}
                        <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-200">
                          <div className="font-bold text-slate-900 uppercase tracking-wider mb-1">Peraturan Integritas:</div>
                          <div className="flex items-center gap-2 text-rose-600 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Dilarang berpindah tab browser
                          </div>
                          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Jawaban tersimpan otomatis per soal
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={() => setStep(3)}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer"
                        >
                          Mulai Ujian Sekarang (Layar Penuh)
                        </button>
                        <button
                          onClick={() => setStep(1)}
                          className="w-full mt-2 text-xs text-slate-400 font-semibold cursor-pointer"
                        >
                          Bukan Anda? Ganti Akun
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SCREEN 3: EXAM SHEET */}
                  {step === 3 && (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Top Sticky Header */}
                      <div className="p-3.5 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between shadow-xs">
                        <div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Soal No. {currentQIndex + 1} / {questions.length}
                          </div>
                          <div className="text-sm font-black text-blue-700">
                            {examSettings.subject}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-mono font-black flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-rose-600" /> 58:24
                          </span>
                          <button
                            className="p-2 bg-slate-100 rounded-xl text-slate-700 cursor-pointer"
                            title="Daftar Nomor Soal"
                          >
                            <Grid className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Anti-cheat banner */}
                      <div className="bg-emerald-600 text-white text-xs font-bold text-center py-1">
                        🟢 Mode Layar Penuh Aktif • Anti-Cheat On
                      </div>

                      {/* Question Content Area */}
                      <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-sm">
                        <div className="font-semibold text-slate-900 leading-relaxed">
                          <MathRenderer text={currentQ?.questionText || 'Pertanyaan belum diisi di editor guru.'} />
                        </div>

                        {currentQ?.latexFormula && (
                          <div className="p-3 bg-white rounded-2xl border border-indigo-100 flex items-center justify-center my-2 shadow-xs">
                            <MathRenderer math={currentQ.latexFormula} block />
                          </div>
                        )}

                        {/* Options list */}
                        {currentQ?.type === 'multiple_choice' && (
                          <div className="space-y-2.5 pt-1">
                            {currentQ.options.map((opt) => {
                              const isSelected = selectedAnswers[currentQIndex] === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handleSelectOption(opt.id)}
                                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/30 text-blue-900 font-bold'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                  <span className="flex-1 text-xs font-medium">
                                    <MathRenderer text={opt.text || `Pilihan ${opt.label}`} />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {currentQ?.type === 'short_answer' && (
                          <div className="pt-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Ketik Jawaban Anda:</label>
                            <input
                              type="text"
                              value={shortAnswers[currentQIndex] || ''}
                              onChange={(e) => setShortAnswers({ ...shortAnswers, [currentQIndex]: e.target.value })}
                              placeholder="Ketik jawaban singkat di sini..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                            />
                          </div>
                        )}
                      </div>

                      {/* Navigation Bottom Footer */}
                      <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2.5">
                        <button
                          disabled={currentQIndex === 0}
                          onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                          className="px-3 py-2 bg-slate-100 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Prev
                        </button>

                        <button
                          onClick={toggleDoubt}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            doubtAnswers[currentQIndex]
                              ? 'bg-amber-500 text-white'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" /> Ragu
                        </button>

                        {currentQIndex < questions.length - 1 ? (
                          <button
                            onClick={() => setCurrentQIndex(currentQIndex + 1)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            Next <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={handleFinalSubmit}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Kumpulkan
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
  Check,
  Wifi,
  Battery,
  Zap,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Award
} from 'lucide-react';
import type { ExamSettings, Question, StudentProctoring, GradeRecord, ViolationLogItem } from '../../types/exam';
import { MathRenderer } from '../common/MathRenderer';
import { RustEngineBridge } from '../../wasm/rustEngine';

// Default interactive demo questions for simulation preview when accessed from Landing Page or clean editor
export const DEFAULT_DEMO_QUESTIONS: Question[] = [
  {
    id: 'demo-1',
    number: 1,
    type: 'multiple_choice',
    questionText: 'Tentukan himpunan penyelesaian dari persamaan kuadrat berikut untuk nilai $x$ yang memenuhi:',
    latexFormula: 'x^2 - 7x + 12 = 0',
    options: [
      { id: 'opt-1a', label: 'A', text: '$x = 3$ atau $x = 4$' },
      { id: 'opt-1b', label: 'B', text: '$x = -3$ atau $x = -4$' },
      { id: 'opt-1c', label: 'C', text: '$x = 2$ atau $x = 6$' },
      { id: 'opt-1d', label: 'D', text: '$x = -2$ atau $x = -6$' },
      { id: 'opt-1e', label: 'E', text: '$x = 1$ atau $x = 12$' },
    ],
    correctOptionId: 'opt-1a',
    points: 25,
  },
  {
    id: 'demo-2',
    number: 2,
    type: 'multiple_choice',
    questionText: 'Organel sel yang dijuluki sebagai "the powerhouse of cell" karena berfungsi menghasilkan energi utama berupa ATP melalui respirasi seluler adalah...',
    options: [
      { id: 'opt-2a', label: 'A', text: 'Ribosom' },
      { id: 'opt-2b', label: 'B', text: 'Mitokondria' },
      { id: 'opt-2c', label: 'C', text: 'Badan Golgi' },
      { id: 'opt-2d', label: 'D', text: 'Retikulum Endoplasma' },
      { id: 'opt-2e', label: 'E', text: 'Kloroplas' },
    ],
    correctOptionId: 'opt-2b',
    points: 25,
  },
  {
    id: 'demo-3',
    number: 3,
    type: 'multiple_choice',
    questionText: 'Sebuah balok bermassa $m = 4\\text{ kg}$ ditarik dengan gaya mendatar $F = 20\\text{ N}$ di atas lantai licin tanpa gesekan. Hitung besar percepatan ($a$) balok tersebut:',
    latexFormula: 'a = \\frac{F}{m}',
    options: [
      { id: 'opt-3a', label: 'A', text: '2 m/s²' },
      { id: 'opt-3b', label: 'B', text: '4 m/s²' },
      { id: 'opt-3c', label: 'C', text: '5 m/s²' },
      { id: 'opt-3d', label: 'D', text: '10 m/s²' },
      { id: 'opt-3e', label: 'E', text: '80 m/s²' },
    ],
    correctOptionId: 'opt-3c',
    points: 25,
  },
  {
    id: 'demo-4',
    number: 4,
    type: 'short_answer',
    questionText: 'Apa nama ibukota baru Negara Kesatuan Republik Indonesia yang berlokasi di wilayah Pulau Kalimantan?',
    options: [],
    correctAnswerText: 'Nusantara',
    points: 25,
  },
];

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
  questions: propQuestions,
  onStudentSubmit,
}) => {
  // If questions are not provided or array is empty (e.g., opened from Landing Page), fallback to demo questions
  const isUsingDemo = !propQuestions || propQuestions.length === 0;
  const questions = isUsingDemo ? DEFAULT_DEMO_QUESTIONS : propQuestions;

  const effectiveSubject = examSettings.subject || (isUsingDemo ? 'Simulasi CBT Terpadu' : 'Ujian Sekolah');
  const effectiveTitle = (examSettings.title && examSettings.title !== 'Penilaian Harian / Ujian Baru')
    ? examSettings.title
    : (isUsingDemo ? 'Simulasi Ujian Pintar Siswa' : 'Ujian Penilaian Tengah Semester');
  const effectiveGrade = examSettings.gradeLevel || (isUsingDemo ? 'Kelas X (Simulasi Interaktif)' : 'Kelas X');
  const effectiveToken = examSettings.token || 'EXAM88';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nisn, setNisn] = useState('0082391024');
  const [name, setName] = useState('Budi Santoso');
  const [tokenInput, setTokenInput] = useState(effectiveToken);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [doubtAnswers, setDoubtAnswers] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Keep token synced if examSettings changes
  useEffect(() => {
    if (examSettings.token && (!tokenInput || tokenInput === 'EXAM88')) {
      setTokenInput(examSettings.token);
    }
  }, [examSettings.token, tokenInput]);

  if (!isOpen) return null;

  const currentQ = questions[currentQIndex] || questions[0];
  const answeredCount = Object.keys(selectedAnswers).length + Object.keys(shortAnswers).length;

  const handleSelectOption = (optId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optId,
    }));
  };

  const toggleDoubt = () => {
    setDoubtAnswers((prev) => ({
      ...prev,
      [currentQIndex]: !prev[currentQIndex],
    }));
  };

  const resetSimulation = () => {
    setStep(1);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setShortAnswers({});
    setDoubtAnswers({});
    setIsSubmitted(false);
    setFinalScore(null);
    setShowQuestionGrid(false);
  };

  const handleAutoFill = () => {
    setNisn('0082391024');
    setName('Budi Santoso');
    setTokenInput(effectiveToken);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
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
      name: name || 'Budi Santoso',
      className: effectiveGrade,
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
      name: name || 'Budi Santoso',
      className: effectiveGrade,
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
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 select-none animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden ring-1 ring-white/10"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/60 flex-shrink-0 gap-3">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Simulasi Siswa Mobile</h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                  CBT Device Preview
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Pengujian alur pengerjaan interaktif langsung di smartphone
              </p>
            </div>
          </div>

          {/* Center: Interactive Step Switcher */}
          <div className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 gap-1 text-xs">
            <button
              type="button"
              onClick={() => { setStep(1); setIsSubmitted(false); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                step === 1 && !isSubmitted
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Masuk
            </button>
            <button
              type="button"
              onClick={() => { setStep(2); setIsSubmitted(false); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                step === 2 && !isSubmitted
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Lobby
            </button>
            <button
              type="button"
              onClick={() => { setStep(3); setIsSubmitted(false); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                step === 3 && !isSubmitted
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Soal Ujian
            </button>
          </div>

          {/* Right: Reset & Close Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Reset Alur Siswa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 rounded-xl transition-all cursor-pointer shadow-xs group"
              title="Tutup Simulasi (Esc)"
              aria-label="Tutup Simulasi"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 p-4 sm:p-6 overflow-y-auto items-center">
          
          {/* Left Column: Control Panel & Guidance */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-4 text-white">
            
            {/* Title card */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Studio Pengujian Siswa
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug">
                Simulasi Real-time CBT
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Uji langsung alur pengerjaan dari sudut pandang siswa: mulai dari validasi token, penguncian layar anti-curang, hingga penilaian instan oleh mesin Rust.
              </p>

              {isUsingDemo && (
                <div className="mt-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>Memuat 4 butir soal simulasi contoh (Matematika, Biologi, Fisika & Umum).</span>
                </div>
              )}

              {/* Quick autofill button */}
              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shadow-blue-500/20"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Isi Data Tes Otomatis</span>
                </button>
                {copiedNotification && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3" /> Terisi ke HP!
                  </span>
                )}
              </div>
            </div>

            {/* Stepper Card List */}
            <div className="space-y-2.5">
              {/* Step 1 Pill */}
              <div
                onClick={() => { setStep(1); setIsSubmitted(false); }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  step === 1 && !isSubmitted
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/40 border-slate-700/70 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    step === 1 && !isSubmitted ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    1
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200">Tahap 1: Quick Entry (Pintu Masuk)</h4>
                    <p className="text-[11px] text-slate-400 truncate">Input NISN & 6-Digit Token PIN ({effectiveToken})</p>
                  </div>
                </div>
              </div>

              {/* Step 2 Pill */}
              <div
                onClick={() => { setStep(2); setIsSubmitted(false); }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  step === 2 && !isSubmitted
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/40 border-slate-700/70 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    step === 2 && !isSubmitted ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    2
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200">Tahap 2: Konfirmasi & Fullscreen Lock</h4>
                    <p className="text-[11px] text-slate-400 truncate">Verifikasi identitas & instruksi anti-curang ujian</p>
                  </div>
                </div>
              </div>

              {/* Step 3 Pill */}
              <div
                onClick={() => { setStep(3); setIsSubmitted(false); }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  step === 3 && !isSubmitted
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/40 border-slate-700/70 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    step === 3 && !isSubmitted ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    3
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200">Tahap 3: Lembar Soal & Auto-Grading</h4>
                    <p className="text-[11px] text-slate-400 truncate">Pengerjaan soal ({answeredCount}/{questions.length} terjawab) & kalkulasi Rust</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rust Engine Integrity Badge */}
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs text-slate-300 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="leading-snug">
                <span className="font-bold text-slate-200 block">Rust WASM Engine Aktif</span>
                <span className="text-[11px] text-slate-400">
                  Mengoreksi jawaban siswa secara deterministik (&lt;5ms) dan menerbitkan stempel integritas ke proctoring guru.
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Modern Flagship Smartphone Device */}
          <div className="md:col-span-6 lg:col-span-7 flex items-center justify-center py-2">
            
            {/* Sleek Smartphone Frame */}
            <div className="w-[315px] sm:w-[335px] md:w-[345px] h-[550px] sm:h-[575px] bg-slate-950 rounded-[48px] p-2.5 shadow-2xl ring-1 ring-white/15 border-4 border-slate-800/90 flex flex-col relative overflow-hidden flex-shrink-0">
              
              {/* Screen Inner Viewport */}
              <div className="bg-slate-50 flex-1 rounded-[38px] overflow-hidden flex flex-col relative text-slate-900 shadow-inner">
                
                {/* Modern Phone Status Bar */}
                <div className="px-5 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-800 bg-slate-100/90 select-none z-20 border-b border-slate-200/60">
                  {/* Left: Clock */}
                  <span className="w-10">9:41</span>

                  {/* Center: Dynamic Island */}
                  <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md">
                    {/* Camera lens */}
                    <div className="w-2 h-2 rounded-full bg-slate-800 ring-1 ring-slate-700" />
                    {/* Live sensor dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                  </div>

                  {/* Right: Connectivity & Battery */}
                  <div className="w-12 flex items-center justify-end gap-1.5 text-slate-700">
                    <Wifi className="w-3 h-3" />
                    <Battery className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Inside Screen Content Area */}
                <div className="flex-1 overflow-y-auto flex flex-col relative bg-slate-50">
                  
                  {/* SUBMISSION RESULT SCREEN */}
                  {isSubmitted ? (
                    <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-md animate-bounce">
                        <Award className="w-8 h-8 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                          Ujian Selesai Disubmit
                        </span>
                        <h3 className="text-xl font-black text-slate-900 mt-2">
                          Terima Kasih, {name}!
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Lembar jawaban telah terkoreksi otomatis oleh mesin grading Rust.
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-slate-200 w-full shadow-xs">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Nilai Ujian Anda:</span>
                        <div className="text-4xl font-black text-emerald-700 mt-1">
                          {finalScore} <span className="text-sm font-bold text-slate-400">/ 100</span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                          {finalScore !== null && finalScore >= 75 ? (
                            <span className="text-emerald-600 font-bold">✨ Selamat! Anda Lulus KKM</span>
                          ) : (
                            <span className="text-amber-600 font-bold">⚠️ Perlu Remedial Materi</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => { resetSimulation(); onClose(); }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors"
                      >
                        Tutup & Lihat di Dashboard Guru
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* SCREEN 1: QUICK ENTRY */}
                      {step === 1 && (
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="text-center pt-2">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-base mb-2.5 shadow-md shadow-blue-500/20">
                              UP
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-base">UjianPintar Mobile</h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Portal pengerjaan ujian berbasis CBT</p>

                            {/* Inputs */}
                            <div className="mt-5 space-y-3 text-left">
                              <div>
                                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  NISN Peserta
                                </label>
                                <input
                                  type="text"
                                  value={nisn}
                                  onChange={(e) => setNisn(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  placeholder="Masukkan NISN"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Nama Lengkap Siswa
                                </label>
                                <input
                                  type="text"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  placeholder="Nama lengkap"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Token PIN (6 Digit)
                                </label>
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={tokenInput}
                                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                                  className="w-full bg-white border-2 border-blue-500 rounded-xl px-3 py-2 text-center text-base font-mono font-black text-blue-700 tracking-widest shadow-xs"
                                  placeholder="TOKEN"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4">
                            <button
                              onClick={() => setStep(2)}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-colors"
                            >
                              Lanjutkan ke Konfirmasi <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <div className="text-center mt-2 text-[10px] text-slate-400 font-medium">
                              ⚡ Server Online • Koneksi Siap
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SCREEN 2: CONFIRMATION & LOBBY */}
                      {step === 2 && (
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                                Ujian Siap Dimulai
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">
                                TOKEN: {tokenInput || effectiveToken}
                              </span>
                            </div>
                            
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                                {effectiveTitle}
                              </h3>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Mapel: <strong className="text-slate-800">{effectiveSubject}</strong>
                              </p>
                            </div>

                            {/* Metadata Box */}
                            <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium">Durasi Ujian:</span>
                                <strong className="text-slate-900 text-xs">{examSettings.durationMinutes || 60} Menit</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium">Jumlah Soal:</span>
                                <strong className="text-slate-900 text-xs">{questions.length} Butir Soal</strong>
                              </div>
                            </div>

                            {/* Verification Box */}
                            <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200">
                              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                <UserCheck className="w-3 h-3" /> Identitas Terverifikasi:
                              </div>
                              <div className="text-xs font-black text-slate-900 mt-0.5 truncate">{name}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">NISN: {nisn} • {effectiveGrade}</div>
                            </div>

                            {/* Integrity Rules */}
                            <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">
                                Peraturan Integritas:
                              </div>
                              <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-[10px]">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Dilarang berpindah aplikasi/tab
                              </div>
                              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[10px]">
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> Jawaban auto-save realtime
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => setStep(3)}
                              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                            >
                              Mulai Ujian Sekarang (Layar Penuh)
                            </button>
                            <button
                              onClick={() => setStep(1)}
                              className="w-full mt-1.5 text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer text-center"
                            >
                              Bukan Anda? Ganti Akun
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SCREEN 3: EXAM SHEET */}
                      {step === 3 && (
                        <div className="flex-1 flex flex-col justify-between relative">
                          
                          {/* Top Exam Header */}
                          <div className="px-3.5 py-2.5 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between shadow-xs">
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Soal {currentQIndex + 1} dari {questions.length}
                              </div>
                              <div className="text-xs font-black text-blue-700 truncate max-w-[120px]">
                                {effectiveSubject}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-mono font-black flex items-center gap-1">
                                <Clock className="w-3 h-3 text-rose-600" /> 58:24
                              </span>
                              <button
                                onClick={() => setShowQuestionGrid(!showQuestionGrid)}
                                className={`p-1.5 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                                  showQuestionGrid 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title="Buka Daftar Nomor Soal"
                              >
                                <Grid className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Anti-cheat status mini bar */}
                          <div className="bg-emerald-600 text-white text-[10px] font-bold text-center py-0.5">
                            🟢 Fullscreen Terkunci • Anti-Cheat Aktif
                          </div>

                          {/* Question Content Area */}
                          <div className="p-3.5 flex-1 overflow-y-auto space-y-3 text-xs">
                            <div className="font-semibold text-slate-900 leading-relaxed">
                              <MathRenderer text={currentQ?.questionText || 'Pertanyaan belum diisi di editor guru.'} />
                            </div>

                            {currentQ?.latexFormula && (
                              <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center justify-center my-1.5 shadow-xs overflow-x-auto">
                                <MathRenderer math={currentQ.latexFormula} block />
                              </div>
                            )}

                            {/* Options list for Multiple Choice */}
                            {currentQ?.type === 'multiple_choice' && (
                              <div className="space-y-2 pt-1">
                                {currentQ.options.map((opt) => {
                                  const isSelected = selectedAnswers[currentQIndex] === opt.id;
                                  return (
                                    <button
                                      key={opt.id}
                                      onClick={() => handleSelectOption(opt.id)}
                                      className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600/30 text-blue-900 font-bold'
                                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
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

                            {/* Short Answer input */}
                            {currentQ?.type === 'short_answer' && (
                              <div className="pt-1.5">
                                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Ketik Jawaban Singkat:
                                </label>
                                <input
                                  type="text"
                                  value={shortAnswers[currentQIndex] || ''}
                                  onChange={(e) => setShortAnswers({ ...shortAnswers, [currentQIndex]: e.target.value })}
                                  placeholder="Ketik jawaban di sini..."
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-500"
                                />
                              </div>
                            )}
                          </div>

                          {/* Navigation Bottom Footer */}
                          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-1.5">
                            <button
                              disabled={currentQIndex === 0}
                              onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-35 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <ArrowLeft className="w-3 h-3" /> Prev
                            </button>

                            <button
                              onClick={toggleDoubt}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                doubtAnswers[currentQIndex]
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              <Bookmark className="w-3 h-3" /> Ragu
                            </button>

                            {currentQIndex < questions.length - 1 ? (
                              <button
                                onClick={() => setCurrentQIndex(currentQIndex + 1)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                Next <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                onClick={handleFinalSubmit}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                              >
                                Kumpulkan
                              </button>
                            )}
                          </div>

                          {/* Popover: Interactive Question Number Drawer */}
                          {showQuestionGrid && (
                            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs z-30 p-4 flex flex-col justify-between animate-in fade-in duration-150">
                              <div>
                                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                                    Daftar Nomor Soal ({questions.length})
                                  </span>
                                  <button
                                    onClick={() => setShowQuestionGrid(false)}
                                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-5 gap-2 mt-3 max-h-[340px] overflow-y-auto pr-1">
                                  {questions.map((q, idx) => {
                                    const isCurrent = idx === currentQIndex;
                                    const isAnswered = selectedAnswers[idx] !== undefined || !!shortAnswers[idx];
                                    const isDoubt = !!doubtAnswers[idx];

                                    let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                                    if (isDoubt) {
                                      badgeColor = 'bg-amber-500 text-white border-amber-400';
                                    } else if (isAnswered) {
                                      badgeColor = 'bg-blue-600 text-white border-blue-500';
                                    }

                                    return (
                                      <button
                                        key={q.id}
                                        onClick={() => {
                                          setCurrentQIndex(idx);
                                          setShowQuestionGrid(false);
                                        }}
                                        className={`h-10 rounded-xl font-bold text-xs border flex items-center justify-center transition-all cursor-pointer ${badgeColor} ${
                                          isCurrent ? 'ring-2 ring-white scale-105 shadow-md' : ''
                                        }`}
                                      >
                                        {idx + 1}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Grid Legend */}
                              <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-around">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Terjawab
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Ragu
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Belum
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </>
                  )}

                </div>

                {/* Bottom Smartphone Home Indicator */}
                <div className="py-1.5 bg-slate-100 flex items-center justify-center select-none flex-shrink-0 border-t border-slate-200/50">
                  <div className="w-28 h-1 bg-slate-400/80 rounded-full" />
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  Send, 
  CheckCircle, 
  Lock, 
  History
} from 'lucide-react';
import type { StudentProctoring } from '../../types/exam';

interface StudentActionModalProps {
  student: StudentProctoring | null;
  onClose: () => void;
  onResetSession: (studentId: string) => void;
  onSendWarning: (studentId: string, message: string) => void;
  onForceSubmit: (studentId: string) => void;
}

export const StudentActionModal: React.FC<StudentActionModalProps> = ({
  student,
  onClose,
  onResetSession,
  onSendWarning,
  onForceSubmit,
}) => {
  const [warningText, setWarningText] = useState('Peringatan: Tetap berada di layar ujian dan jangan membuka tab lain!');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!student) return null;

  const handleSendWarningClick = () => {
    onSendWarning(student.id, warningText);
    setActionNotice(`Peringatan dikirim ke perangkat ${student.name}`);
    setTimeout(() => {
      setActionNotice(null);
      onClose();
    }, 1500);
  };

  const handleResetClick = () => {
    if (confirm(`Reset sesi ujian ${student.name}? Siswa dapat masuk kembali.`)) {
      onResetSession(student.id);
      setActionNotice(`Sesi ${student.name} telah di-reset.`);
      setTimeout(() => {
        setActionNotice(null);
        onClose();
      }, 1500);
    }
  };

  const handleForceSubmitClick = () => {
    if (confirm(`Kunci dan kumpulkan paksa jawaban milik ${student.name}?`)) {
      onForceSubmit(student.id);
      setActionNotice(`Ujian ${student.name} telah disubmit.`);
      setTimeout(() => {
        setActionNotice(null);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-display font-black text-sm flex-shrink-0 shadow-xs">
              {student.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight">{student.name}</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">NISN: {student.nisn} • {student.className}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {actionNotice ? (
          <div className="py-12 text-center text-emerald-600 space-y-2">
            <CheckCircle className="w-10 h-10 mx-auto animate-bounce" />
            <p className="font-display font-bold text-sm">{actionNotice}</p>
          </div>
        ) : (
          <div className="py-3.5 space-y-4">
            {/* Status overview */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-display font-bold uppercase tracking-wider block">PROGRES</span>
                <span className="text-xs font-display font-black text-slate-900 mt-0.5 block">
                  {student.progressCount} / {student.totalQuestions}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-display font-bold uppercase tracking-wider block">STATUS</span>
                <span className="text-xs font-display font-bold text-blue-600 capitalize mt-0.5 block">
                  {student.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-display font-bold uppercase tracking-wider block">PELANGGARAN</span>
                <span className={`text-xs font-display font-bold mt-0.5 block ${
                  student.violationCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {student.violationCount} Kali
                </span>
              </div>
            </div>

            {/* Violation History Logs */}
            {student.violationLogs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-display font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-rose-500" /> Riwayat Pelanggaran
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-hover">
                  {student.violationLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between font-sans"
                    >
                      <span className="text-[11px]">{log.reason}</span>
                      <span className="font-mono text-[10px] text-rose-700 font-bold ml-2">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action 1: Send Warning */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-display font-bold text-slate-700 uppercase tracking-wider block">
                Kirim Peringatan ke Layar Siswa
              </label>

              {/* Preset Warning Chips */}
              <div className="flex flex-wrap gap-1.5 mb-1">
                {[
                  '👀 Jangan menoleh ke teman!',
                  '📱 Tetap fokus pada layar ujian Anda!',
                  '📵 Dilarang membuka aplikasi / catatan lain!',
                  '⏳ Waktu hampir habis, periksa kembali jawaban Anda.',
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setWarningText(preset)}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-[10px] font-sans transition-colors cursor-pointer border border-slate-200/60"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  placeholder="Ketik pesan peringatan ke layar HP siswa..."
                  className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleSendWarningClick}
                  className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-display font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim
                </button>
              </div>
            </div>

            {/* Action 2: Reset Session & Force Submit */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2.5">
              <button
                onClick={handleResetClick}
                className="h-9 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reset Sesi
              </button>

              <button
                onClick={handleForceSubmitClick}
                className="h-9 px-3 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-rose-600" /> Submit Paksa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentActionModal;

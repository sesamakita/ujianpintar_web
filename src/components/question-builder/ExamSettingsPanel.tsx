import React, { useState } from 'react';
import { 
  ShieldAlert, 
  KeyRound, 
  Calendar, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  RefreshCw, 
  Sliders,
  Check
} from 'lucide-react';
import type { ExamSettings } from '../../types/exam';
import { TimePickerModal } from './TimePickerModal';
import { formatScheduleTime } from '../../services/examService';

interface ExamSettingsPanelProps {
  settings: ExamSettings;
  onChange: (updated: ExamSettings) => void;
  onGenerateNewToken: () => void;
}

export const ExamSettingsPanel: React.FC<ExamSettingsPanelProps> = ({
  settings,
  onChange,
  onGenerateNewToken,
}) => {
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const handleTextChange = (field: keyof ExamSettings, value: any) => {
    onChange({ ...settings, [field]: value });
  };

  const handleAntiCheatChange = (field: keyof ExamSettings['antiCheat'], value: boolean) => {
    onChange({
      ...settings,
      antiCheat: {
        ...settings.antiCheat,
        [field]: value,
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight leading-tight">Pengaturan & Jadwal</h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Sesi, durasi pengerjaan, dan anti-cheat</p>
        </div>
      </div>

      {/* Mata Pelajaran & Kelas */}
      <div className="space-y-3.5">
        <div>
          <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Mata Pelajaran
          </label>
          <input
            type="text"
            placeholder="Contoh: Matematika Wajib, Fisika, Biologi, dll..."
            value={settings.subject}
            onChange={(e) => handleTextChange('subject', e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Rombel / Tingkat Kelas
          </label>
          <input
            type="text"
            placeholder="Contoh: Kelas X MIPA 1, Kelas XI IPA 2, dll..."
            value={settings.gradeLevel}
            onChange={(e) => handleTextChange('gradeLevel', e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Durasi & Waktu Pelaksanaan */}
      <div className="space-y-3.5 pt-3.5 border-t border-slate-100">
        <div>
          <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Durasi Pengerjaan
          </label>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="240"
              value={settings.durationMinutes}
              onChange={(e) => handleTextChange('durationMinutes', parseInt(e.target.value) || 60)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-14 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-sans font-semibold">Menit</span>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-2.5 items-end">
          {/* Kolom Tanggal: 60% Width */}
          <div className="col-span-6 min-w-0">
            <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal
            </label>
            <input
              type="date"
              value={settings.scheduleDate}
              onChange={(e) => handleTextChange('scheduleDate', e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-2"
            />
          </div>

          {/* Kolom Jam Mulai: 40% Width */}
          <div className="col-span-4 min-w-0">
            <label className="text-xs font-display font-bold text-slate-700 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Jam Mulai
            </label>
            <button
              type="button"
              onClick={() => setIsTimePickerOpen(true)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-sans font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 flex items-center justify-between transition-colors cursor-pointer group"
              title="Buka pilihan jam mulai ujian"
            >
              <span className="font-sans font-semibold text-sm text-slate-800 transition-colors">
                {formatScheduleTime(settings.scheduleTime)}
              </span>
              <Clock className="w-4 h-4 text-slate-700 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Token Generator */}
      <div className="pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-display font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Token PIN Akses
          </label>
          <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-sans font-semibold text-emerald-700">Status:</span>
            <span className="font-mono font-bold text-emerald-900">AKTIF</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 h-11 bg-slate-900 text-blue-400 font-mono font-black text-center text-lg flex items-center justify-center rounded-xl tracking-widest border border-slate-800 shadow-inner">
            {settings.token}
          </div>
          <button
            onClick={onGenerateNewToken}
            className="w-11 h-11 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Generate Token Acak Baru"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 font-sans mt-1.5 leading-normal">
          Bagikan 6 digit token ini ke siswa saat ujian dimulai.
        </p>
      </div>

      {/* Anti-Cheat Toggles */}
      <div className="pt-3.5 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-display font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Proteksi Integritas
          </span>
          <span className="text-[10px] font-display font-bold text-slate-400">Anti-Cheat</span>
        </div>

        <div className="space-y-2">
          {/* Detect Tab Switch */}
          <div
            onClick={() => handleAntiCheatChange('detectTabSwitch', !settings.antiCheat.detectTabSwitch)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              settings.antiCheat.detectTabSwitch
                ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                : 'bg-slate-50/60 border-slate-200 text-slate-600'
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-xs font-display font-bold">Deteksi Pindah Tab / Layar</div>
              <div className="text-[11px] text-slate-500 font-sans">Catat log saat siswa keluar layar ujian</div>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
              settings.antiCheat.detectTabSwitch ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
            }`}>
              {settings.antiCheat.detectTabSwitch && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Full Screen Lock */}
          <div
            onClick={() => handleAntiCheatChange('fullScreenLock', !settings.antiCheat.fullScreenLock)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              settings.antiCheat.fullScreenLock
                ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                : 'bg-slate-50/60 border-slate-200 text-slate-600'
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-xs font-display font-bold">Kunci Layar Penuh (Fullscreen)</div>
              <div className="text-[11px] text-slate-500 font-sans">Wajibkan fullscreen saat pengerjaan</div>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
              settings.antiCheat.fullScreenLock ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
            }`}>
              {settings.antiCheat.fullScreenLock && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Shuffle Questions */}
          <div
            onClick={() => handleAntiCheatChange('shuffleQuestions', !settings.antiCheat.shuffleQuestions)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              settings.antiCheat.shuffleQuestions
                ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                : 'bg-slate-50/60 border-slate-200 text-slate-600'
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-xs font-display font-bold">Acak Urutan Nomor Soal</div>
              <div className="text-[11px] text-slate-500 font-sans">Nomor soal berbeda per siswa</div>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
              settings.antiCheat.shuffleQuestions ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
            }`}>
              {settings.antiCheat.shuffleQuestions && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Shuffle Options */}
          <div
            onClick={() => handleAntiCheatChange('shuffleOptions', !settings.antiCheat.shuffleOptions)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              settings.antiCheat.shuffleOptions
                ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                : 'bg-slate-50/60 border-slate-200 text-slate-600'
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-xs font-display font-bold">Acak Opsi Pilihan (A-E)</div>
              <div className="text-[11px] text-slate-500 font-sans">Letak pilihan jawaban teracak</div>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
              settings.antiCheat.shuffleOptions ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
            }`}>
              {settings.antiCheat.shuffleOptions && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Time Picker Modal */}
      <TimePickerModal
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        value={settings.scheduleTime || '08:00'}
        onChange={(newTime) => handleTextChange('scheduleTime', newTime)}
      />
    </div>
  );
};

export default ExamSettingsPanel;

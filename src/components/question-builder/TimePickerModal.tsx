import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  X, 
  Check, 
  Sun, 
  Moon, 
  RotateCcw,
  Keyboard,
  Compass,
  Plus,
  Minus
} from 'lucide-react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // e.g. "08:00"
  onChange: (newTime: string) => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(8);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [activeUnit, setActiveUnit] = useState<'hour' | 'minute'>('hour');
  const [viewMode, setViewMode] = useState<'analog' | 'grid'>('analog');
  const [isDragging, setIsDragging] = useState(false);
  const [timezone, setTimezone] = useState<'WITA' | 'WIB' | 'WIT'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ujianpintar_timezone') || localStorage.getItem('smartexam_timezone');
      if (saved === 'WIB' || saved === 'WITA' || saved === 'WIT') return saved;
      const offsetMinutes = -new Date().getTimezoneOffset();
      const offsetHours = offsetMinutes / 60;
      if (offsetHours === 7) return 'WIB';
      if (offsetHours === 9) return 'WIT';
      return 'WITA'; // Default WITA
    }
    return 'WITA';
  });

  const dialRef = useRef<HTMLDivElement>(null);

  const handleToggleTimezone = () => {
    const next = timezone === 'WITA' ? 'WIB' : timezone === 'WIB' ? 'WIT' : 'WITA';
    setTimezone(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ujianpintar_timezone', next);
    }
  };

  // Sync initial value when opening modal
  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h)) setSelectedHour(Math.min(23, Math.max(0, h)));
      if (!isNaN(m)) setSelectedMinute(Math.min(59, Math.max(0, m)));
    }
    setActiveUnit('hour');
  }, [value, isOpen]);

  if (!isOpen) return null;

  const format2Digits = (num: number) => num.toString().padStart(2, '0');

  const handleApply = () => {
    const formatted = `${format2Digits(selectedHour)}:${format2Digits(selectedMinute)}`;
    onChange(formatted);
    onClose();
  };

  const handleSetNow = () => {
    const now = new Date();
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
  };

  const adjustMinutes = (delta: number) => {
    setSelectedMinute((prev) => {
      let next = prev + delta;
      if (next >= 60) next = 0;
      if (next < 0) next = 59;
      return next;
    });
  };

  const adjustHours = (delta: number) => {
    setSelectedHour((prev) => {
      let next = prev + delta;
      if (next >= 24) next = 0;
      if (next < 0) next = 23;
      return next;
    });
  };

  // Preset quick times
  const presetTimes = [
    { label: '07:00', h: 7, m: 0 },
    { label: '07:30', h: 7, m: 30 },
    { label: '08:00', h: 8, m: 0 },
    { label: '08:30', h: 8, m: 30 },
    { label: '09:00', h: 9, m: 0 },
    { label: '10:00', h: 10, m: 0 },
    { label: '13:00', h: 13, m: 0 },
    { label: '14:00', h: 14, m: 0 },
  ];

  // Calculate clock hand angle and length
  let handAngle = 0;
  let isInnerHand = false;

  if (activeUnit === 'hour') {
    if (selectedHour === 0 || selectedHour >= 13) {
      isInnerHand = true;
      handAngle = (selectedHour % 12) * 30;
    } else {
      isInnerHand = false;
      handAngle = selectedHour * 30;
    }
  } else {
    isInnerHand = false;
    handAngle = selectedMinute * 6;
  }

  // Handle dial pointer events (click or drag)
  const handleDialPointer = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (activeUnit === 'hour') {
      const step = Math.round(angle / 30) % 12;
      // If click is closer to inner radius (< 64px) -> 24h mode (00, 13-23)
      if (distance < 64) {
        const hour = step === 0 ? 0 : step + 12;
        setSelectedHour(hour);
      } else {
        const hour = step === 0 ? 12 : step;
        setSelectedHour(hour);
      }
    } else {
      const min = Math.round(angle / 6) % 60;
      setSelectedMinute(min);
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    handleDialPointer(e);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) {
      handleDialPointer(e);
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Auto transition from hour to minute on release like Android Material TimePicker
      if (activeUnit === 'hour') {
        setTimeout(() => setActiveUnit('minute'), 200);
      }
    }
  };

  // Outer hours (1 to 12)
  const outerHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  // Inner hours (00, 13 to 23)
  const innerHours = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  // Minutes (00, 05, 10, ... 55)
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const isMorning = selectedHour >= 6 && selectedHour < 12;
  const isAfternoon = selectedHour >= 12 && selectedHour < 18;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans overflow-y-auto"
      onMouseUp={handlePointerUp}
      onTouchEnd={handlePointerUp}
    >
      <div className="bg-white rounded-2xl p-4 max-w-[340px] w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-2.5 flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-xs tracking-tight">Pilih Jam Mulai Ujian</h3>
              <p className="text-[10px] text-slate-400 font-sans">Mode Analog Android</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'analog' ? 'grid' : 'analog')}
              className="w-7 h-7 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
              title={viewMode === 'analog' ? 'Beralih ke Input Grid' : 'Beralih ke Jam Analog'}
            >
              {viewMode === 'analog' ? <Keyboard className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Digital Time Header Display (Android Material Style) */}
        <div className="bg-slate-900 text-white rounded-xl py-2 px-3 flex items-center justify-between shadow-inner relative">
          <div className="flex items-center gap-1">
            {/* Hour Selector Button */}
            <button
              type="button"
              onClick={() => setActiveUnit('hour')}
              className={`px-2.5 py-1 rounded-lg font-sans font-black text-2xl transition-all cursor-pointer ${
                activeUnit === 'hour'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {format2Digits(selectedHour)}
            </button>

            <span className="font-sans font-bold text-xl text-slate-500 animate-pulse">:</span>

            {/* Minute Selector Button */}
            <button
              type="button"
              onClick={() => setActiveUnit('minute')}
              className={`px-2.5 py-1 rounded-lg font-sans font-black text-2xl transition-all cursor-pointer ${
                activeUnit === 'minute'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {format2Digits(selectedMinute)}
            </button>

            <button
              type="button"
              onClick={handleToggleTimezone}
              className="text-[10px] font-sans font-bold text-blue-400 hover:text-blue-200 ml-1.5 px-1.5 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 cursor-pointer transition-colors"
              title="Klik untuk beralih zona waktu (WITA / WIB / WIT)"
            >
              {timezone}
            </button>
          </div>

          {/* Time of Day Indicator */}
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-sans font-semibold text-slate-300">
              {isMorning ? (
                <>
                  <Sun className="w-2.5 h-2.5 text-amber-400" /> Pagi
                </>
              ) : isAfternoon ? (
                <>
                  <Sun className="w-2.5 h-2.5 text-orange-400" /> Siang
                </>
              ) : (
                <>
                  <Moon className="w-2.5 h-2.5 text-indigo-300" /> Malam
                </>
              )}
            </span>
            <span className="text-[9px] text-slate-400 font-sans">
              {activeUnit === 'hour' ? '👉 Pilih Jam' : '👉 Pilih Menit'}
            </span>
          </div>
        </div>

        {/* Quick Popular Presets & Now */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          <div className="flex items-center gap-1">
            {presetTimes.slice(0, 4).map((preset) => {
              const isSelected = selectedHour === preset.h && selectedMinute === preset.m;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedHour(preset.h);
                    setSelectedMinute(preset.m);
                  }}
                  className={`py-0.5 px-1.5 rounded-md text-[11px] font-sans font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleSetNow}
            className="text-[10px] text-blue-600 hover:text-blue-700 font-sans font-semibold inline-flex items-center gap-0.5 cursor-pointer flex-shrink-0 ml-1"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Sekarang
          </button>
        </div>

        {/* MAIN BODY: ANALOG CLOCK DIAL (Android Style) */}
        {viewMode === 'analog' ? (
          <div className="flex flex-col items-center justify-center py-0.5">
            {/* The Circular Analog Clock Face (210px × 210px) */}
            <div
              ref={dialRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              className="w-[210px] h-[210px] bg-slate-100/90 rounded-full relative shadow-inner border border-slate-200 select-none cursor-pointer flex items-center justify-center transition-all touch-none"
            >
              {/* Center Pivot Point */}
              <div className="w-2 h-2 bg-blue-600 rounded-full z-30 shadow-sm ring-2 ring-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

              {/* Dynamic Clock Hand Line */}
              <div
                className="absolute bottom-1/2 left-1/2 w-[2px] bg-blue-600 z-20 origin-bottom pointer-events-none transition-transform duration-75"
                style={{
                  height: isInnerHand ? '50px' : '78px',
                  transform: `translateX(-50%) rotate(${handAngle}deg)`,
                }}
              >
                {/* Pointer Tip Active Knob */}
                <div 
                  className={`rounded-full bg-blue-600 text-white font-sans font-bold flex items-center justify-center absolute shadow-md ring-2 ring-blue-400/40 ${
                    isInnerHand 
                      ? 'w-6 h-6 text-[10px] -top-3 -left-[11px]' 
                      : 'w-7 h-7 text-xs -top-3.5 -left-[13px]'
                  }`}
                >
                  {activeUnit === 'hour'
                    ? format2Digits(selectedHour)
                    : format2Digits(selectedMinute)}
                </div>
              </div>

              {/* HOUR MODE: 24-Hour Numbers (Outer 1-12 & Inner 00, 13-23) */}
              {activeUnit === 'hour' && (
                <>
                  {/* Outer Ring: 1 to 12 (radius = 78px) */}
                  {outerHours.map((h, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const radius = 78;
                    const x = 105 + radius * Math.cos(angle);
                    const y = 105 + radius * Math.sin(angle);
                    const isSelected = selectedHour === h;

                    return (
                      <button
                        key={`outer-${h}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHour(h);
                          setTimeout(() => setActiveUnit('minute'), 200);
                        }}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full font-sans text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-white font-black z-25'
                            : 'text-slate-700 hover:text-blue-600 hover:bg-slate-200'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}

                  {/* Inner Ring: 00, 13 to 23 (radius = 50px) */}
                  {innerHours.map((h, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const radius = 50;
                    const x = 105 + radius * Math.cos(angle);
                    const y = 105 + radius * Math.sin(angle);
                    const isSelected = selectedHour === h;

                    return (
                      <button
                        key={`inner-${h}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHour(h);
                          setTimeout(() => setActiveUnit('minute'), 200);
                        }}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded-full font-sans text-[9px] font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-white font-black z-25'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                        }`}
                      >
                        {format2Digits(h)}
                      </button>
                    );
                  })}
                </>
              )}

              {/* MINUTE MODE: 00, 05, 10 ... 55 */}
              {activeUnit === 'minute' && (
                <>
                  {minutesList.map((m, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const radius = 78;
                    const x = 105 + radius * Math.cos(angle);
                    const y = 105 + radius * Math.sin(angle);
                    const isSelected = selectedMinute === m;

                    return (
                      <button
                        key={`min-${m}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMinute(m);
                        }}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full font-sans text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-white font-black z-25'
                            : 'text-slate-700 hover:text-blue-600 hover:bg-slate-200'
                        }`}
                      >
                        {format2Digits(m)}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Fine-Tuning Minute Steppers */}
            <div className="flex items-center justify-center gap-2 mt-2 pt-1.5 border-t border-slate-100 w-full">
              <button
                type="button"
                onClick={() => (activeUnit === 'minute' ? adjustMinutes(-1) : adjustHours(-1))}
                className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-md text-[11px] font-sans font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title={`Kurangi 1 ${activeUnit === 'minute' ? 'Menit' : 'Jam'}`}
              >
                <Minus className="w-2.5 h-2.5" /> 1 {activeUnit === 'minute' ? 'Mnt' : 'Jam'}
              </button>

              <span className="text-[10px] font-sans text-slate-400 font-medium">Presisi</span>

              <button
                type="button"
                onClick={() => (activeUnit === 'minute' ? adjustMinutes(1) : adjustHours(1))}
                className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-md text-[11px] font-sans font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title={`Tambah 1 ${activeUnit === 'minute' ? 'Menit' : 'Jam'}`}
              >
                <Plus className="w-2.5 h-2.5" /> 1 {activeUnit === 'minute' ? 'Mnt' : 'Jam'}
              </button>
            </div>
          </div>
        ) : (
          /* ALTERNATIVE: GRID SELECTOR MODE */
          <div className="space-y-2 py-0.5">
            <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-slate-700">
              <span>{activeUnit === 'hour' ? 'Pilih Jam (00 - 23):' : 'Pilih Menit (00 - 59):'}</span>
              <button
                type="button"
                onClick={() => setActiveUnit(activeUnit === 'hour' ? 'minute' : 'hour')}
                className="text-blue-600 text-[11px] font-semibold hover:underline cursor-pointer"
              >
                Ganti ke {activeUnit === 'hour' ? 'Menit' : 'Jam'}
              </button>
            </div>

            {activeUnit === 'hour' ? (
              <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto pr-1 scrollbar-hover">
                {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                  const isSelected = selectedHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setSelectedHour(h);
                        setActiveUnit('minute');
                      }}
                      className={`h-8 rounded-lg font-sans text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {format2Digits(h)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto pr-1 scrollbar-hover">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => {
                  const isSelected = selectedMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMinute(m)}
                      className={`h-8 rounded-lg font-sans text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      :{format2Digits(m)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-sans font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-sans font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pilih Jam ({format2Digits(selectedHour)}:{format2Digits(selectedMinute)})</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default TimePickerModal;


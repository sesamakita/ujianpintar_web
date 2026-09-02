import React from 'react';
import { 
  Clock, 
  CheckCircle
} from 'lucide-react';
import type { ViolationLogItem } from '../../types/exam';

interface ViolationFeedProps {
  logs: ViolationLogItem[];
  onClearLogs: () => void;
}

export const ViolationFeed: React.FC<ViolationFeedProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <h4 className="font-display font-bold text-slate-900 text-xs tracking-tight uppercase">
            Live Violation Feed
          </h4>
        </div>
        <span className="text-[10px] bg-rose-50 text-rose-700 font-display font-bold px-2 py-0.5 rounded-full border border-rose-200">
          {logs.length} Log
        </span>
      </div>

      {/* Log Items Stream */}
      <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1 flex-1 scrollbar-hover">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-display font-bold text-slate-600">Belum ada pelanggaran.</p>
            <p className="text-[11px] text-slate-400 font-sans">Semua siswa tertib di layar penuh.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isDanger = log.severity === 'danger';
            const isWarning = log.severity === 'warning';

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border text-xs transition-all space-y-1 ${
                  isDanger
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : isWarning
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 font-bold">
                    <Clock className="w-3 h-3" /> {log.timestamp}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded font-mono font-bold uppercase text-[9px] ${
                    isDanger ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                  }`}>
                    {log.severity}
                  </span>
                </div>

                <div className="font-display font-bold text-slate-900 text-xs">
                  {log.studentName}
                </div>

                <div className="text-[11px] text-slate-600 font-sans leading-tight">
                  {log.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {logs.length > 0 && (
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            onClick={onClearLogs}
            className="text-[11px] text-slate-400 hover:text-slate-700 font-display font-bold transition-colors cursor-pointer"
          >
            Bersihkan Log Riwayat
          </button>
        </div>
      )}
    </div>
  );
};

export default ViolationFeed;

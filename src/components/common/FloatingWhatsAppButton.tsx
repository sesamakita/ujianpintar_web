import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { botSettingsService } from '../../services/botSettingsService';

interface FloatingWhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
  hidden?: boolean;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  phoneNumber,
  defaultMessage = 'Halo Admin UjianPintar, saya ingin bertanya seputar platform UjianPintar...',
  hidden = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(true);
  const [activePhone, setActivePhone] = useState(phoneNumber || '6282196929193');

  useEffect(() => {
    if (!phoneNumber) {
      try {
        const settings = botSettingsService.getSettings();
        if (settings.adminPhone) {
          setActivePhone(settings.adminPhone);
        }
      } catch {}
    } else {
      setActivePhone(phoneNumber);
    }
  }, [phoneNumber]);

  if (hidden) return null;

  // Format nomor HP agar selalu berawalan kode negara 62
  let cleanNumber = (activePhone || '6282196929193').replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.slice(1);
  }

  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 select-none print:hidden pointer-events-auto">
      {/* Tooltip badge */}
      {showTooltip && (
        <div className="relative group bg-white border border-slate-200 text-slate-800 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="leading-tight">
            <strong>Ada Pertanyaan?</strong> Chat WhatsApp kami 24/7
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="p-1 -mr-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Tutup pesan"
            aria-label="Tutup pesan"
          >
            <X className="w-3 h-3" />
          </button>
          {/* Arrow pointing down to WA button */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
        </div>
      )}

      {/* Floating WhatsApp Action Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 cursor-pointer"
        title="Tanya seputar platform UjianPintar via WhatsApp"
        aria-label="Tanya seputar platform UjianPintar via WhatsApp"
      >
        {/* Subtle Ping Animation Ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 group-hover:opacity-50 animate-ping pointer-events-none duration-1000" />

        {/* WhatsApp Official Vector Icon */}
        <svg
          className="w-7 h-7 fill-white relative z-10 transition-transform group-hover:scale-110 duration-200"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
};

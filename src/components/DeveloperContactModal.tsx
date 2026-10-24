import React from 'react';
import { X, MessageCircle, Mail, ExternalLink } from 'lucide-react';

interface DeveloperContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperContactModal: React.FC<DeveloperContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#111827] text-white rounded-2xl p-6 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3">
          <div>
            <h3 id="dev-modal-title" className="text-lg font-bold text-white tracking-tight">
              Hubungi Pengembang
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Abu Haripin · Jasa Pembuatan Aplikasi Web &amp; PWA
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mt-2 mb-5">
          Tertarik memesan aplikasi web, sistem SPMB sekolah, atau sistem manajemen lainnya? Silakan pilih saluran komunikasi berikut:
        </p>

        {/* Action Cards */}
        <div className="space-y-3">
          {/* WhatsApp Card */}
          <a
            href="https://wa.me/6285310999527?text=Halo%20Pak%20Abu%20Haripin,%20saya%20tertarik%20dengan%20pembuatan%20aplikasi%20web"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 rounded-xl border border-slate-700/80 bg-slate-850 hover:bg-slate-800 hover:border-emerald-500/60 flex items-center justify-between transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Chat via WhatsApp
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  0853-1099-9527
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
          </a>

          {/* Email Card */}
          <a
            href="mailto:abuharipin@gmail.com?subject=Tanya%20Jasa%20Pembuatan%20Aplikasi%20Web"
            className="w-full p-4 rounded-xl border border-slate-700/80 bg-slate-850 hover:bg-slate-800 hover:border-sky-500/60 flex items-center justify-between transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">
                  Kirim Email
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  abuharipin@gmail.com
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors shrink-0" />
          </a>
        </div>

        {/* Footer Close Button */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

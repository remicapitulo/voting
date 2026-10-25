import React, { useState } from 'react';
import { Smartphone, Laptop, Apple, CheckCircle2, Trophy, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'floating' | 'nav' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'floating'
}) => {
  const { isInstallable, isInstalled, platform, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('duta_pwa_badge_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // If already running in standalone mode (already installed) or dismissed, hide
  if (isInstalled || (variant === 'floating' && isDismissed)) {
    if (variant === 'floating') return null;
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Aplikasi Terpasang</span>
      </div>
    );
  }

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem('duta_pwa_badge_dismissed', 'true');
    } catch (_) {}
  };

  const getPlatformLabel = () => {
    if (platform === 'ios') return 'iPhone';
    if (platform === 'android') return 'Android';
    return 'Desktop';
  };

  return (
    <>
      {/* Badge Melayang PWA - Diposisikan di antara tulisan SMPIT Pondok Duta dan tombol Vote */}
      {variant === 'floating' && (
        <aside
          aria-label="Pemasangan Aplikasi PWA"
          className={`fixed bottom-[7.75rem] sm:bottom-6 right-3 sm:right-6 z-40 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}
        >
          <button
            type="button"
            onClick={handleButtonClick}
            className="flex items-center gap-2 pl-2 pr-3.5 py-2 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 hover:from-emerald-900 hover:to-teal-900 text-white font-bold text-xs rounded-full shadow-2xl border-2 border-amber-400 transition-all cursor-pointer group hover:scale-102 active:scale-95"
            title="Klik untuk memasang aplikasi Duta Evoting di perangkat Anda"
          >
            <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <span className="tracking-tight">Pasang Aplikasi</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800/90 text-amber-300 font-semibold border border-amber-400/30">
              {getPlatformLabel()}
            </span>
          </button>

          {/* Tombol Tutup Badge */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center text-xs shadow-md border border-slate-700 transition-colors cursor-pointer"
            title="Tutup badge pasang aplikasi"
            aria-label="Tutup"
          >
            <X className="w-3 h-3" />
          </button>
        </aside>
      )}

      {/* Varian Navigasi (misal di sheet profil) */}
      {variant === 'nav' && (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-xl shadow-xs transition-all cursor-pointer border border-amber-500/40 ${className}`}
          title="Pasang aplikasi Duta Evoting di Android, iPhone, atau Desktop"
        >
          <Trophy className="w-3.5 h-3.5 text-slate-950" />
          <span>Pasang Aplikasi</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/40 text-slate-950">
            {getPlatformLabel()}
          </span>
        </button>
      )}

      {/* Detail Install Modal */}
      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        platform={platform}
        onInstall={install}
      />
    </>
  );
};

import React, { useState } from 'react';
import { Download, Smartphone, Laptop, Apple, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'floating' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'nav'
}) => {
  const { isInstallable, isInstalled, platform, isIOS, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in standalone mode (already installed), hide or show minimal badge
  if (isInstalled) {
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

  const getPlatformIcon = () => {
    if (platform === 'ios') return <Apple className="w-3.5 h-3.5" />;
    if (platform === 'android') return <Smartphone className="w-3.5 h-3.5" />;
    return <Laptop className="w-3.5 h-3.5" />;
  };

  const getPlatformLabel = () => {
    if (platform === 'ios') return 'iPhone';
    if (platform === 'android') return 'Android';
    return 'Desktop';
  };

  return (
    <>
      {variant === 'nav' && (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-xl shadow-xs transition-all cursor-pointer border border-amber-500/40 ${className}`}
          title="Pasang aplikasi Duta Evoting di Android, iPhone, atau Desktop"
        >
          <Download className="w-3.5 h-3.5 text-slate-950" />
          <span>Install App</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/40 text-slate-950 hidden md:inline">
            {getPlatformLabel()}
          </span>
        </button>
      )}

      {variant === 'floating' && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-40 animate-bounce duration-1000">
          <button
            type="button"
            onClick={handleButtonClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-900 to-teal-900 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs rounded-full shadow-xl border-2 border-amber-400 transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Download className="w-3 h-3 text-slate-950" />
            </div>
            <span>Pasang Aplikasi</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800 text-amber-300 font-semibold">
              {getPlatformLabel()}
            </span>
          </button>
        </div>
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

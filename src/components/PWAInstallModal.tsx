import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  Apple,
  X,
  Share2,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { DevicePlatform } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  platform: DevicePlatform;
  onInstall: () => Promise<boolean>;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  platform,
  onInstall
}) => {
  const [activeTab, setActiveTab] = useState<DevicePlatform>(() => platform || 'android');
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const success = await onInstall();
    setIsInstalling(false);
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        setInstallSuccess(false);
        onClose();
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with App Branding */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg shrink-0 border border-amber-400/40 overflow-hidden">
              <img src="/icon.svg" alt="Piala Duta Evoting" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Pasang Aplikasi Duta Evoting
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  PWA Resmi
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                SMPIT Pondok Duta · Buka cepat langsung dari layar utama
              </p>
            </div>
          </div>

          {/* Platform Tab Navigation */}
          <div className="flex items-center gap-1.5 mt-5 p-1 bg-black/25 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-emerald-950 shadow-md font-bold'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Android</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-emerald-950 shadow-md font-bold'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Apple className="w-4 h-4 text-slate-800" />
              <span>iPhone (iOS)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-white text-emerald-950 shadow-md font-bold'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Laptop className="w-4 h-4 text-emerald-600" />
              <span>Desktop / PC</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status if already installed */}
          {isInstalled && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Aplikasi Duta Evoting sudah terpasang di perangkat ini!</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: ANDROID */}
          {/* ================================================================= */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              {isInstallable && (
                <div className="bg-gradient-to-br from-emerald-50 to-amber-50/50 p-4 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <span className="text-xs font-bold text-emerald-900 block">
                    Perangkat Android Anda Mendukung Pemasangan 1-Klik:
                  </span>
                  <button
                    type="button"
                    disabled={isInstalling}
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-60"
                  >
                    {installSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>Aplikasi Berhasil Dipasang!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-amber-300" />
                        <span>{isInstalling ? 'Memasang Aplikasi...' : 'Pasang di Android Sekarang'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Petunjuk Pemasangan Manual di Android (Google Chrome):
                </span>
                <ol className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Buka situs ini di browser <strong>Google Chrome</strong> pada HP Android Anda.</span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Ketuk tombol <strong>Menu Titik Tiga (⋮)</strong> di pojok kanan atas layar Chrome.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Pilih opsi <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Ketuk <strong>Install</strong>. Ikon Duta Evoting akan langsung muncul di beranda HP Anda layaknya aplikasi Play Store!
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: IPHONE & IPAD (iOS SAFARI) */}
          {/* ================================================================= */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Catatan iPhone / iPad:</strong> Apple mewajibkan pemasangan PWA melalui browser bawaan <strong>Safari</strong>. Jika saat ini Anda membuka via Chrome iOS atau aplikasi lain, silakan buka link di Safari terlebih dahulu.
              </div>

              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Langkah Mudah Pasang di iPhone / iPad:
                </span>

                <ol className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Buka situs ini di browser <strong>Safari</strong> pada iPhone atau iPad Anda.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <span>Ketuk tombol <strong>Bagikan / Share</strong></span>
                      <span className="inline-flex items-center gap-1 mx-1.5 px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-[11px]">
                        <Share2 className="w-3 h-3 text-blue-600" /> Share
                      </span>
                      <span>(ikon kotak dengan panah menghadap ke atas di bilah bawah layar Safari).</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span>Gulir ke bawah pada menu opsi, lalu pilih </span>
                      <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-[11px]">
                        <PlusSquare className="w-3 h-3 text-slate-700" /> Tambahkan ke Layar Utama
                      </span>
                      <span>(Add to Home Screen).</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Ketuk <strong>Tambah (Add)</strong> di sudut kanan atas. Ikon aplikasi Duta Evoting akan tampil di Home Screen iPhone Anda tanpa bilah browser!
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: DESKTOP & LAPTOP (WINDOWS / MAC / LINUX) */}
          {/* ================================================================= */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              {isInstallable && (
                <div className="bg-gradient-to-br from-emerald-50 to-amber-50/50 p-4 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <span className="text-xs font-bold text-emerald-900 block">
                    Browser Komputer Anda Mendukung Pemasangan Langsung:
                  </span>
                  <button
                    type="button"
                    disabled={isInstalling}
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-60"
                  >
                    {installSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>Aplikasi Desktop Berhasil Dipasang!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-amber-300" />
                        <span>{isInstalling ? 'Memasang Aplikasi...' : 'Pasang di Desktop / Laptop Sekarang'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Petunjuk Pemasangan di PC (Chrome / Edge):
                </span>
                <ol className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Buka situs ini di <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> pada PC/Laptop.</span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Lihat ke ujung kanan <strong>Bilah Alamat URL (Address Bar)</strong>, klik ikon <strong>Install / Pasang Aplikasi</strong> (ikon monitor dengan panah ke bawah).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Atau klik menu <strong>Titik Tiga (⋮)</strong> di sudut kanan browser -&gt; <strong>Simpan dan bagikan</strong> -&gt; <strong>"Install Duta Evoting..."</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Klik <strong>Install</strong>. Aplikasi akan terbuka di jendela mandiri tanpa tab browser, dan pintasan otomatis dibuat di Desktop &amp; Start Menu!
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Keunggulan PWA Badge */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aman, Cepat &amp; Hemat Kuota</span>
            </span>
            <span className="text-slate-400">
              Mendukung Android, iOS, Windows, Mac
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            SMP Islam Terpadu Pondok Duta
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

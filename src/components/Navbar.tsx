import React, { useState } from 'react';
import { User, CategoryModel, EventModel } from '../types';
import {
  Flame,
  LogOut,
  FileSpreadsheet,
  Vote,
  Award,
  ShieldCheck,
  User as UserIcon,
  LogIn,
  ChevronUp,
  ChevronDown,
  Trophy,
  Check,
  Utensils,
  Compass,
  Sparkles,
  BookOpen,
  Music,
  Megaphone,
  Download,
  X
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'voter' | 'jury' | 'admin';
  onSelectTab: (tab: 'voter' | 'jury' | 'admin') => void;
  onOpenAuth: () => void;
  onOpenGasModal: () => void;
  onLogout: () => void;
  hasGasConfigured: boolean;
  categories?: CategoryModel[];
  selectedCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
  event?: EventModel;
  logoAplikasiHeader?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenGasModal,
  onLogout,
  hasGasConfigured,
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  event,
  logoAplikasiHeader
}) => {
  const [showMobileProfileSheet, setShowMobileProfileSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Active sub-event categories filtered by activeTab and assessment_type
  const relevantCategories = categories.filter(c => {
    const matchEvent = !event || !c.id_event || c.id_event === event.id_event;
    if (!matchEvent) return false;
    if (activeTab === 'voter' && c.assessment_type === 'jury_only') return false;
    if (activeTab === 'jury' && c.assessment_type === 'public_only') return false;
    return true;
  });
  const displayCategories = relevantCategories.length > 0 
    ? relevantCategories 
    : categories.filter(c => {
        if (activeTab === 'voter' && c.assessment_type === 'jury_only') return false;
        if (activeTab === 'jury' && c.assessment_type === 'public_only') return false;
        return true;
      });
  const currentCategory = displayCategories.find(c => c.id_kategori === selectedCategoryId) || displayCategories[0];

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-4 h-4 text-amber-500" />;
      case 'Utensils': return <Utensils className="w-4 h-4 text-emerald-600" />;
      case 'Compass': return <Compass className="w-4 h-4 text-teal-600" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'Music': return <Music className="w-4 h-4 text-indigo-600" />;
      case 'Megaphone': return <Megaphone className="w-4 h-4 text-rose-600" />;
      default: return <Trophy className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* TOP HEADER (DESKTOP + MOBILE HEADER RINGKAS) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Zone 1: Wordmark Duta Evoting SMPIT Pondok Duta */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onSelectTab('voter')}
                className="flex items-center gap-2.5 text-left group focus:outline-none"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 overflow-hidden p-1 border border-slate-200 ring-1 ring-slate-900/5 shrink-0">
                  {logoAplikasiHeader ? (
                    <img
                      src={logoAplikasiHeader}
                      alt="Logo Aplikasi"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-500 fill-amber-400/20" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block">
                    Duta Evoting
                  </span>
                  <span className="text-xs text-slate-500 whitespace-nowrap block">
                    SMPIT Pondok Duta
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              {/* Menu Voting Publik: Di-hide jika akun adalah Dewan Juri */}
              {currentUser?.role !== 'juri' && (
                <button
                  onClick={() => onSelectTab('voter')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-800 flex items-center gap-1.5 ${
                    activeTab === 'voter' ? 'text-emerald-800 font-semibold' : ''
                  }`}
                >
                  <Vote className="w-4 h-4" />
                  <span>Voting Publik</span>
                </button>
              )}

              {/* Menu Dewan Juri: Hanya bisa dilihat saat dibuka dengan akun Juri atau Admin */}
              {(currentUser?.role === 'juri' || currentUser?.role === 'admin') && (
                <button
                  onClick={() => onSelectTab('jury')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-800 flex items-center gap-1.5 ${
                    activeTab === 'jury' ? 'text-emerald-800 font-semibold' : ''
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Dewan Juri</span>
                </button>
              )}


              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-800 flex items-center gap-1.5 ${
                    activeTab === 'admin' ? 'text-emerald-800 font-semibold' : ''
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Panel Admin</span>
                </button>
              )}

              {currentUser?.role === 'admin' && (
                <button
                  onClick={onOpenGasModal}
                  className="text-xs text-slate-500 hover:text-emerald-800 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  title="Konfigurasi Integrasi Google Spreadsheet & GAS"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Google Sheets API</span>
                  {hasGasConfigured && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Tersambung
                    </span>
                  )}
                </button>
              )}
            </nav>

            {/* Zone 3: Desktop User Profile & Logout */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">
                      {currentUser.nama}
                    </div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {currentUser.role === 'admin'
                        ? 'Administrator'
                        : currentUser.role === 'juri'
                        ? 'Dewan Juri'
                        : 'Pemilih Bebas'}
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
                >
                  Masuk / Daftar
                </button>
              )}
            </div>

            {/* Zone 4: Mobile Top Quick Actions (Quick Profile / Masuk) */}
            <div className="flex md:hidden items-center gap-2">
              {currentUser ? (
                <button
                  onClick={() => setShowMobileProfileSheet(true)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="truncate max-w-[80px]">{currentUser.nama.split(' ')[0]}</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-800 rounded-lg shadow-xs"
                >
                  Masuk
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TAMPILAN PW PADA HP (BOTTOM NAVIGATION BAR ERGONOMIS IKUT SUB-MENU) */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1.5 flex items-center justify-around"
      >
        {/* Tab 1: Voting Publik - HIDE jika akun adalah Dewan Juri */}
        {currentUser?.role !== 'juri' && (
          <button
            onClick={() => onSelectTab('voter')}
            className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'voter'
                ? 'text-emerald-800 font-bold bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Vote className="w-5 h-5" />
              {activeTab === 'voter' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Voting</span>
          </button>
        )}

        {/* Tab 2: Dewan Juri - Hanya bisa dilihat saat dibuka dengan akun Juri atau Admin */}
        {(currentUser?.role === 'juri' || currentUser?.role === 'admin') && (
          <button
            onClick={() => onSelectTab('jury')}
            className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'jury'
                ? 'text-emerald-800 font-bold bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Award className="w-5 h-5" />
              {activeTab === 'jury' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Dewan Juri</span>
          </button>
        )}

        {/* Tab 3: Cabang Lomba - Memilih Cabang Lomba Secara Langsung */}
        {displayCategories.length > 0 && (
          <button
            onClick={() => setShowCategorySheet(true)}
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-slate-600 hover:text-emerald-800 transition-all cursor-pointer"
            title="Pilih Cabang Lomba Langsung"
          >
            <div className="relative">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-600"></span>
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap font-medium text-emerald-950 truncate max-w-[65px]">
              {currentCategory ? currentCategory.nama_kategori.split(' ')[0] : 'Cabang'}
            </span>
          </button>
        )}

        {/* Tab 4: Panel Admin (HANYA MUNCUL JIKA USER ADALAH ADMIN) */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'admin'
                ? 'text-emerald-800 font-bold bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <ShieldCheck className="w-5 h-5" />
              {activeTab === 'admin' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Admin</span>
          </button>
        )}

        {/* Tab Google Sheets API untuk Admin di Mobile */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={onOpenGasModal}
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
            title="Google Sheets API"
          >
            <div className="relative">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              {hasGasConfigured && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Database</span>
          </button>
        )}

        {/* Tab 5: Profil Akun / Masuk */}
        {currentUser ? (
          <button
            onClick={() => setShowMobileProfileSheet(true)}
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
          >
            <UserIcon className="w-5 h-5 text-emerald-800" />
            <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[65px]">
              {currentUser.nama.split(' ')[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-emerald-800 font-bold transition-all"
          >
            <LogIn className="w-5 h-5 text-emerald-800" />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">Masuk</span>
          </button>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE PROFILE BOTTOM SHEET MODAL (Koneksi Database GAS Removed) */}
      {/* ========================================================================= */}
      {showMobileProfileSheet && currentUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-amber-400 font-bold flex items-center justify-center text-lg shadow-xs">
                {currentUser.nama.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-slate-900 truncate">{currentUser.nama}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-mono text-emerald-800">{currentUser.username}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-700 capitalize">
                    {currentUser.role === 'admin'
                      ? 'Administrator'
                      : currentUser.role === 'juri'
                      ? 'Dewan Juri'
                      : 'Pemilih Bebas'}
                  </span>
                </div>
              </div>
            </div>

            {currentUser.role === 'admin' && (
              <div className="py-2 border-y border-slate-100 mb-3 text-xs">
                <button
                  onClick={() => {
                    setShowMobileProfileSheet(false);
                    onOpenGasModal();
                  }}
                  className="w-full text-left py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="font-medium">Pengaturan Google Sheets API</span>
                  <ChevronUp className="w-4 h-4 text-slate-400 rotate-90" />
                </button>
              </div>
            )}

            {/* PWA Install Option in Profile Sheet */}
            <div className="py-2 mb-3">
              <PWAInstallButton variant="nav" className="w-full justify-center py-2.5 text-xs shadow-sm" />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowMobileProfileSheet(false)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowMobileProfileSheet(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / BOTTOM SHEET: PILIH CABANG LOMBA LANGSUNG */}
      {/* ========================================================================= */}
      {showCategorySheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pilih Cabang Lomba</h3>
                  <p className="text-xs text-slate-500">
                    {event ? (event.kode_event || event.nama_event) : 'Pilih kategori aktif'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCategorySheet(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 py-1 pr-1 flex-1">
              {displayCategories.map(cat => {
                const isSelected = cat.id_kategori === selectedCategoryId;
                return (
                  <button
                    key={cat.id_kategori}
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(cat.id_kategori);
                      }
                      setShowCategorySheet(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getCategoryIcon(cat.iconName)}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-bold truncate ${
                          isSelected ? 'text-emerald-950' : 'text-slate-800'
                        }`}>
                          {cat.nama_kategori}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{cat.tipe_peserta || 'Group'}</span>
                          <span aria-hidden="true">·</span>
                          {cat.assessment_type === 'public_only' ? (
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              Vote Bebas
                            </span>
                          ) : cat.assessment_type === 'jury_only' ? (
                            <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Juri Saja
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Multi
                            </span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{cat.kriteria?.length || 0} Kriteria</span>
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="shrink-0 text-xs font-semibold text-slate-400 px-2 py-1 bg-slate-100 rounded-md">
                        Pilih
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2 shrink-0">
              <button
                onClick={() => setShowCategorySheet(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

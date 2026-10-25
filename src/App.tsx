/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ScoreRecapItem, ReportConfig } from './types';
import { apiService, AppStateData } from './services/apiService';
import { Navbar } from './components/Navbar';
import { VoterView } from './components/VoterView';
import { JuryView } from './components/JuryView';
import { AdminView } from './components/AdminView';
import { AuthModal } from './components/AuthModal';
import { GasIntegrationModal } from './components/GasIntegrationModal';
import { PrintReportModal } from './components/PrintReportModal';
import { DeveloperContactModal } from './components/DeveloperContactModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { Trophy } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(apiService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'voter' | 'jury' | 'admin'>(() => {
    const user = apiService.getCurrentUser();
    if (user?.role === 'juri') return 'jury';
    if (user?.role === 'admin') return 'admin';
    return 'voter';
  });
  const [appState, setAppState] = useState<AppStateData>(() => apiService.getAppState());
  const [selectedEventId, setSelectedEventId] = useState<string>(() => appState.event?.id_event || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    return appState.categories[0]?.id_kategori || '';
  });

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isDevContactOpen, setIsDevContactOpen] = useState(false);
  const [hasGasConfigured, setHasGasConfigured] = useState<boolean>(Boolean(apiService.getGasUrl()));
  const [isSyncing, setIsSyncing] = useState(false);

  // Active sub-event currently selected
  const activeEvent = appState.events.find(e => e.id_event === selectedEventId) || appState.event;

  // Print Report Modal State
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    categoryId: string;
    recapData: ScoreRecapItem[];
    weights: { jury: number; public: number };
  }>({
    isOpen: false,
    categoryId: appState.categories[0]?.id_kategori || '',
    recapData: [],
    weights: { jury: 70, public: 30 }
  });

  // Official Report PDF Configuration State (Kepala Sekolah, Ketua Panitia, Logo Kegiatan Kiri & Logo Sekolah Kanan)
  const [reportConfig, setReportConfig] = useState<ReportConfig>(() => apiService.getReportConfig());

  const handleUpdateReportConfig = (newCfg: ReportConfig) => {
    apiService.saveReportConfig(newCfg);
    setReportConfig(newCfg);
  };

  const refreshData = async (syncFromCloud: boolean = false) => {
    if (syncFromCloud && apiService.getGasUrl()) {
      setIsSyncing(true);
      await apiService.syncFromDatabase().catch(console.warn);
      setIsSyncing(false);
    }
    const newState = apiService.getAppState();
    setAppState(newState);
    setReportConfig(apiService.getReportConfig());
    setHasGasConfigured(Boolean(apiService.getGasUrl()));
    if (!selectedEventId && newState.event?.id_event) {
      setSelectedEventId(newState.event.id_event);
    }
    if (!selectedCategoryId && newState.categories[0]?.id_kategori) {
      setSelectedCategoryId(newState.categories[0].id_kategori);
    }
  };

  useEffect(() => {
    refreshData(true);
  }, []);

  // When sub-event is changed, switch active event and update category
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    apiService.setActiveEvent(eventId);
    // Find categories of newly selected sub-event and auto select the first one
    const newCategories = appState.categories.filter(c => c.id_event === eventId);
    if (newCategories.length > 0) {
      setSelectedCategoryId(newCategories[0].id_kategori);
    }
    refreshData();
  };

  // Ensure selectedCategoryId remains valid for the active sub-event
  useEffect(() => {
    const eventCats = appState.categories.filter(c => !selectedEventId || c.id_event === selectedEventId);
    const validCats = eventCats.length > 0 ? eventCats : appState.categories;
    if (validCats.length > 0) {
      const exists = validCats.some(c => c.id_kategori === selectedCategoryId);
      if (!exists) {
        setSelectedCategoryId(validCats[0].id_kategori);
      }
    }
  }, [appState.categories, selectedEventId, selectedCategoryId]);

  // Tab protection based on roles:
  // Dewan Juri is hidden for public & voter, Voting Publik is hidden for juri
  useEffect(() => {
    if ((!currentUser || currentUser.role === 'voter') && activeTab === 'jury') {
      setActiveTab('voter');
    } else if (currentUser?.role === 'juri' && activeTab === 'voter') {
      setActiveTab('jury');
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    apiService.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('voter');
  };

  const handleOpenPrintReport = (
    categoryId: string,
    recapData: ScoreRecapItem[],
    weights: { jury: number; public: number }
  ) => {
    setPrintModalState({
      isOpen: true,
      categoryId,
      recapData,
      weights
    });
  };

  const activeCategoryForPrint =
    appState.categories.find(c => c.id_kategori === printModalState.categoryId) ||
    appState.categories[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Bar Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        onLogout={handleLogout}
        hasGasConfigured={hasGasConfigured}
        categories={appState.categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        event={activeEvent}
        logoAplikasiHeader={reportConfig.logoAplikasiHeader}
      />

      {/* Main Content Viewport with compact natural height and balanced spacing */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-2">
        {activeTab === 'voter' && (
          <VoterView
            event={activeEvent}
            events={appState.events}
            categories={appState.categories}
            teams={appState.teams}
            publicVotes={appState.publicVotes}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onRefreshData={refreshData}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        )}

        {activeTab === 'jury' && (
          <JuryView
            event={activeEvent}
            events={appState.events}
            categories={appState.categories}
            teams={appState.teams}
            juryScores={appState.juryScores}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onRefreshData={refreshData}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            event={activeEvent}
            events={appState.events}
            categories={appState.categories}
            teams={appState.teams}
            users={appState.users}
            juryScores={appState.juryScores}
            publicVotes={appState.publicVotes}
            currentUser={currentUser}
            onOpenPrintReport={handleOpenPrintReport}
            onRefreshData={refreshData}
            onSelectEvent={(eventId) => {
              handleSelectEvent(eventId);
            }}
            reportConfig={reportConfig}
            onUpdateReportConfig={handleUpdateReportConfig}
          />
        )}
      </main>

      {/* Footer: Positioned neatly right under content without large gaps, matching header logo */}
      <footer className="border-t border-slate-200 bg-white py-4 pb-20 sm:pb-4 text-xs text-slate-500 mt-2 sm:mt-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            {/* App Info & Identity (Matches header logo exactly with white background) */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-xs overflow-hidden p-1 border border-slate-200 ring-1 ring-slate-900/5 shrink-0">
                {reportConfig.logoAplikasiHeader ? (
                  <img
                    src={reportConfig.logoAplikasiHeader}
                    alt="Logo Aplikasi"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-400/20" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  Duta Evoting - SMPIT Pondok Duta
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Sistem Terpadu E-Voting &amp; Penilaian Dewan Juri
                </div>
              </div>
            </div>

            {/* Copyright & Dibuat Oleh (Neatly aligned and balanced on desktop, tab, and mobile) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-2.5 gap-y-1.5 text-[11px] sm:text-xs text-slate-500">
              <span className="whitespace-nowrap">© 2026 SMPIT Pondok Duta</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
              <div className="inline-flex items-center gap-1.5 text-slate-600 whitespace-nowrap">
                <span>Dibuat oleh</span>
                <button
                  type="button"
                  onClick={() => setIsDevContactOpen(true)}
                  className="font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
                  title="Klik untuk info kontak pengembang"
                >
                  <span className="underline decoration-emerald-500/50 group-hover:decoration-emerald-800">Abu Haripin</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 group-hover:bg-emerald-500 animate-pulse"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Developer Contact Modal (Abu Haripin) */}
      <DeveloperContactModal
        isOpen={isDevContactOpen}
        onClose={() => setIsDevContactOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshData();
          if (user.role === 'juri') {
            setActiveTab('jury');
          } else if (user.role === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('voter');
          }
        }}
      />

      {/* Google Apps Script Integration Modal (Admin Only) */}
      <GasIntegrationModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        onUrlUpdated={refreshData}
        currentUser={currentUser}
      />

      {/* Official Print Ready Report Modal */}
      {printModalState.isOpen && (
        <PrintReportModal
          isOpen={printModalState.isOpen}
          onClose={() => setPrintModalState(prev => ({ ...prev, isOpen: false }))}
          event={activeEvent}
          category={activeCategoryForPrint}
          recapData={printModalState.recapData}
          weights={printModalState.weights}
          reportConfig={reportConfig}
          onUpdateReportConfig={handleUpdateReportConfig}
        />
      )}

      {/* Badge Melayang PWA (Diposisikan Mengambang di Atas, Setelah Header) */}
      <PWAInstallButton variant="floating" />
    </div>
  );
}

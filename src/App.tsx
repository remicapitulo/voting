/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ScoreRecapItem } from './types';
import { apiService, AppStateData } from './services/apiService';
import { Navbar } from './components/Navbar';
import { VoterView } from './components/VoterView';
import { JuryView } from './components/JuryView';
import { AdminView } from './components/AdminView';
import { AuthModal } from './components/AuthModal';
import { GasIntegrationModal } from './components/GasIntegrationModal';
import { PrintReportModal } from './components/PrintReportModal';
import { DeveloperContactModal } from './components/DeveloperContactModal';
import { Flame } from 'lucide-react';

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

  const refreshData = async (syncFromCloud: boolean = false) => {
    if (syncFromCloud && apiService.getGasUrl()) {
      setIsSyncing(true);
      await apiService.syncFromDatabase().catch(console.warn);
      setIsSyncing(false);
    }
    const newState = apiService.getAppState();
    setAppState(newState);
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      <div>
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
        />

        {/* Main Content Viewport with PW Mobile Bottom Navigation Safe Spacing */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
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
            />
          )}
        </main>
      </div>

      {/* Footer adhering to user requirement: App Name, Copyright, and Created by Abu Haripin with Modal Trigger */}
      <footer className="border-t border-slate-200 bg-white pt-8 pb-24 md:pb-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
            {/* App Info & Identity */}
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-5 h-5 fill-amber-400 stroke-amber-300" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Duta Evoting - SMPIT Pondok Duta
                </div>
                <div className="text-xs text-slate-500">
                  Sistem Terpadu E-Voting &amp; Penilaian Dewan Juri Multi-Event
                </div>
              </div>
            </div>

            {/* Sub-Event Status & Admin GAS Integration */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 font-medium text-slate-700">
                Sub-Event: {activeEvent.kode_event || activeEvent.nama_event}
              </span>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setIsGasModalOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Google Sheets API
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            {/* Copyright */}
            <div className="text-center sm:text-left">
              <span>© 2026 SMPIT Pondok Duta. Seluruh Hak Cipta Dilindungi Undang-Undang.</span>
            </div>

            {/* Created by Abu Haripin with Clickable Modal Trigger */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Dibuat oleh</span>
              <button
                type="button"
                onClick={() => setIsDevContactOpen(true)}
                className="font-bold text-emerald-800 hover:text-emerald-950 underline decoration-emerald-500/50 hover:decoration-emerald-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-emerald-50"
                title="Klik untuk info kontak pengembang"
              >
                <span>Abu Haripin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              </button>
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
        />
      )}
    </div>
  );
}

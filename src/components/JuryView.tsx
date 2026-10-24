import React, { useState, useMemo, useEffect } from 'react';
import { EventModel, CategoryModel, TeamModel, User, JuryScore } from '../types';
import { apiService, getFallbackCriteria } from '../services/apiService';
import {
  Award,
  CheckCircle2,
  Edit3,
  Save,
  Send,
  UserCheck,
  Search,
  X,
  ArrowUpDown,
  Lock,
  Clock,
  Calendar,
  Users,
  User as UserIcon,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { getTeamInitials } from '../utils/initials';

interface JuryViewProps {
  event: EventModel;
  events?: EventModel[];
  categories: CategoryModel[];
  teams: TeamModel[];
  juryScores: JuryScore[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onRefreshData: () => void;
  onSelectEvent?: (eventId: string) => void;
  selectedEventId?: string;
  selectedCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export const JuryView: React.FC<JuryViewProps> = ({
  event,
  events = [],
  categories,
  teams,
  juryScores,
  currentUser,
  onOpenAuth,
  onRefreshData,
  onSelectEvent,
  selectedEventId: propSelectedEventId,
  selectedCategoryId: propSelectedCategoryId,
  onSelectCategory
}) => {
  // Filter sub-event untuk Dewan Juri:
  // Sub-event yang di KUNCI (status_aktif: false) di-HIDE untuk Juri umum (Admin dapat memantau semua)
  const visibleEvents = useMemo(() => {
    const list = events && events.length > 0 ? events : [event];
    if (currentUser?.role === 'admin') return list;
    return list.filter(ev => ev.status_aktif !== false);
  }, [events, event, currentUser?.role]);

  // Selected sub-event
  const [selectedSubEventId, setSelectedSubEventId] = useState<string>(() => {
    if (propSelectedEventId) return propSelectedEventId;
    if (event && (currentUser?.role === 'admin' || event.status_aktif !== false)) return event.id_event;
    const firstActive = (events || []).find(e => e.status_aktif !== false);
    return firstActive?.id_event || event?.id_event || 'event-dutacamp-2026';
  });

  // Sync with propSelectedEventId
  useEffect(() => {
    if (propSelectedEventId && propSelectedEventId !== selectedSubEventId) {
      setSelectedSubEventId(propSelectedEventId);
    }
  }, [propSelectedEventId]);

  // Ensure selectedSubEventId points to a visible event
  useEffect(() => {
    if (visibleEvents.length > 0) {
      const exists = visibleEvents.some(e => e.id_event === selectedSubEventId);
      if (!exists) {
        const fallbackId = visibleEvents[0].id_event;
        setSelectedSubEventId(fallbackId);
        if (onSelectEvent) onSelectEvent(fallbackId);
      }
    }
  }, [visibleEvents, selectedSubEventId]);

  const currentSubEvent = useMemo(() => {
    return visibleEvents.find(e => e.id_event === selectedSubEventId) || visibleEvents[0] || event;
  }, [visibleEvents, selectedSubEventId, event]);

  // Filter categories by selected sub-event (exclude categories marked as public_only)
  const subEventCategories = useMemo(() => {
    const list = categories.filter(
      c => c.id_event === selectedSubEventId && c.assessment_type !== 'public_only'
    );
    if (list.length > 0) return list;
    const fallback = categories.filter(c => c.assessment_type !== 'public_only');
    return fallback.length > 0 ? fallback : categories;
  }, [categories, selectedSubEventId]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    propSelectedCategoryId || subEventCategories[0]?.id_kategori || 'cat-campfire'
  );

  // Sync with prop when selected from bottom nav "Cabang Lomba"
  useEffect(() => {
    if (propSelectedCategoryId && propSelectedCategoryId !== selectedCategoryId) {
      const exists = subEventCategories.some(c => c.id_kategori === propSelectedCategoryId);
      if (exists) {
        setSelectedCategoryId(propSelectedCategoryId);
      }
    }
  }, [propSelectedCategoryId, subEventCategories]);

  // Sync category selection when sub-event changes
  useEffect(() => {
    if (subEventCategories.length > 0) {
      const stillValid = subEventCategories.some(c => c.id_kategori === selectedCategoryId);
      if (!stillValid) {
        const nextId = subEventCategories[0].id_kategori;
        setSelectedCategoryId(nextId);
        if (onSelectCategory) onSelectCategory(nextId);
      }
    }
  }, [selectedSubEventId, subEventCategories]);

  // Teams belonging to the current sub-event
  const subEventTeams = useMemo(() => {
    const list = teams.filter(t => t.id_event === selectedSubEventId);
    return list.length > 0 ? list : teams;
  }, [teams, selectedSubEventId]);

  // Check if sub-event is closed: either because admin closed/did not activate it, or deadline has expired
  const closedStatus = useMemo(() => {
    return apiService.isEventClosed(currentSubEvent);
  }, [currentSubEvent]);

  const isSubEventClosed = closedStatus.isClosed;

  const formattedDeadline = useMemo(() => {
    if (!currentSubEvent.batas_waktu) return null;
    try {
      const d = new Date(currentSubEvent.batas_waktu);
      return d.toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return currentSubEvent.batas_waktu;
    }
  }, [currentSubEvent.batas_waktu]);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'graded'>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default A-Z

  // Selected team for grading in modal / panel
  const [activeTeamForScoring, setActiveTeamForScoring] = useState<TeamModel | null>(null);

  // Local form inputs for rating 1 to 5 per criterion
  const [criterionScores, setCriterionScores] = useState<Record<string, number>>({});
  const [juryNote, setJuryNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeCategory = subEventCategories.find(c => c.id_kategori === selectedCategoryId) || subEventCategories[0] || categories[0];

  // If not logged in or not a jury/admin, show prompt
  if (!currentUser || (currentUser.role !== 'juri' && currentUser.role !== 'admin')) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Eksklusif Dewan Juri</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Halaman penilaian ini khusus diperuntukkan bagi Dewan Juri resmi yang telah ditugaskan oleh Admin Panitia SMPIT Pondok Duta.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          Masuk sebagai Dewan Juri
        </button>
      </div>
    );
  }

  // Get all scores given by this specific jury for the current category
  const myCategoryScores = juryScores.filter(
    s => s.id_jury === currentUser.id && s.id_kategori === selectedCategoryId
  );

  const isAssignedToActiveCategory = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return true;
    if (!activeCategory.assigned_juries || activeCategory.assigned_juries.length === 0) return true;
    return activeCategory.assigned_juries.includes(currentUser.id) ||
           activeCategory.assigned_juries.includes(currentUser.username);
  }, [activeCategory, currentUser]);

  const totalTeams = subEventTeams.length;
  const gradedTeamsCount = myCategoryScores.filter(s => s.is_final).length;
  const progressPercent = totalTeams > 0 ? Math.round((gradedTeamsCount / totalTeams) * 100) : 0;

  // Filter and sort teams A-Z
  const processedTeams = useMemo(() => {
    return subEventTeams
      .filter(t => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = t.nama_regu.toLowerCase().includes(q);
          const matchClass = t.kelas_pangkalan.toLowerCase().includes(q);
          const matchLeader = (t.ketua_regu || '').toLowerCase().includes(q);
          if (!matchName && !matchClass && !matchLeader) return false;
        }

        // Status filter
        if (statusFilter !== 'All') {
          const score = myCategoryScores.find(s => s.id_team === t.id_team && s.is_final);
          if (statusFilter === 'graded' && !score) return false;
          if (statusFilter === 'pending' && score) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.nama_regu.localeCompare(b.nama_regu, 'id', { sensitivity: 'base' });
        } else {
          return b.nama_regu.localeCompare(a.nama_regu, 'id', { sensitivity: 'base' });
        }
      });
  }, [subEventTeams, searchQuery, statusFilter, sortOrder, myCategoryScores]);

  // Open scoring panel for a team
  const handleOpenScoring = (team: TeamModel) => {
    setActiveTeamForScoring(team);
    const existingScore = myCategoryScores.find(s => s.id_team === team.id_team);

    const activeCriteria = (activeCategory?.kriteria && activeCategory.kriteria.length > 0)
      ? activeCategory.kriteria
      : getFallbackCriteria(selectedCategoryId, activeCategory?.nama_kategori || '');

    const initialMap: Record<string, number> = {};
    activeCriteria.forEach(k => {
      if (existingScore && existingScore.kriteria_scores[k] !== undefined) {
        initialMap[k] = existingScore.kriteria_scores[k];
      } else {
        initialMap[k] = 4; // Default standard score 4.0
      }
    });

    setCriterionScores(initialMap);
    setJuryNote(existingScore?.catatan || '');
  };

  const handleScoreChange = (criterion: string, scoreVal: number) => {
    setCriterionScores(prev => ({
      ...prev,
      [criterion]: scoreVal
    }));
  };

  const calculateLiveAverage = () => {
    const vals = Object.values(criterionScores);
    if (vals.length === 0) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return Number((sum / vals.length).toFixed(2));
  };

  const handleSaveScore = async (isFinal: boolean) => {
    if (!activeTeamForScoring) return;

    if (isSubEventClosed) {
      setFeedback({
        type: 'error',
        message: closedStatus.reason === 'not_active'
          ? 'Gagal menyimpan: Sub-Event sedang ditutup oleh panitia.'
          : 'Gagal menyimpan: Batas waktu penilaian telah berakhir dan sistem terkunci.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.submitJuryScore(
        currentUser.id,
        currentUser.nama,
        activeTeamForScoring.id_team,
        selectedCategoryId,
        criterionScores,
        juryNote,
        isFinal
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setActiveTeamForScoring(null);
        onRefreshData();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan nilai' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Jika tidak ada sub-event aktif untuk juri
  if (visibleEvents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Semua Sub-Event Penjurian Sedang Ditutup</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-lg mx-auto">
          Saat ini seluruh sub-event sedang dalam status dikunci/ditutup oleh Admin Panitia.
          Penilaian dewan juri akan dibuka kembali saat panitia mengaktifkan sub-event terkait.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Sub-Event Selector Tabs for Dewan Juri */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Pilihan Sub-Event Penjurian:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {visibleEvents.map(ev => {
              const isSelected = ev.id_event === selectedSubEventId;
              const isEvExpired = apiService.isEventExpired(ev);
              const isEvLocked = !ev.status_aktif;
              return (
                <button
                  key={ev.id_event}
                  onClick={() => {
                    setSelectedSubEventId(ev.id_event);
                    if (onSelectEvent) onSelectEvent(ev.id_event);
                    setActiveTeamForScoring(null);
                    setSearchQuery('');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{ev.kode_event || ev.nama_event}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isEvLocked
                      ? isSelected ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'
                      : !isEvExpired
                        ? isSelected ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
                        : isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {isEvLocked ? 'Dikunci' : !isEvExpired ? 'Dibuka' : 'Waktu Habis (Close)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Jury Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Dewan Juri Terverifikasi</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-semibold">{currentUser.jurySpecialty || 'Penilai Resmi'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600 font-medium">Sub-Event: {currentSubEvent.nama_event}</span>
                <span aria-hidden="true">·</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  !isSubEventClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {!isSubEventClosed ? 'Status: Dibuka' : 'Status: Ditutup'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{currentUser.nama}</h1>
            </div>
          </div>

          {/* Progress Indicator & Deadline Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 min-w-[240px]">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Progres Penilaian Kategori:</span>
                <span className="font-mono font-bold text-emerald-800 tabular-nums">
                  {gradedTeamsCount} dari {totalTeams} {currentSubEvent.tipe_peserta === 'Individu' ? 'Peserta' : 'Regu'} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-700 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {formattedDeadline && (
              <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                isSubEventClosed
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {isSubEventClosed ? <Lock className="w-4 h-4 text-rose-600 shrink-0" /> : <Clock className="w-4 h-4 text-emerald-700 shrink-0" />}
                <div>
                  <div className="font-bold">{isSubEventClosed ? 'Status Penjurian:' : 'Batas Penjurian:'}</div>
                  <div className="text-[11px] opacity-85">{isSubEventClosed ? 'Ditutup' : formattedDeadline}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Pilih Kategori Penilaian:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {subEventCategories.map(c => {
              const isSelected = c.id_kategori === selectedCategoryId;
              const countGradedInCat = juryScores.filter(
                s => s.id_jury === currentUser.id && s.id_kategori === c.id_kategori && s.is_final
              ).length;
              const isAssigned = (!c.assigned_juries || c.assigned_juries.length === 0)
                ? true
                : (currentUser.role === 'admin' || c.assigned_juries.includes(currentUser.id) || c.assigned_juries.includes(currentUser.username));

              return (
                <button
                  key={c.id_kategori}
                  onClick={() => {
                    setSelectedCategoryId(c.id_kategori);
                    setActiveTeamForScoring(null);
                    setSearchQuery('');
                    if (onSelectCategory) onSelectCategory(c.id_kategori);
                  }}
                  className={`py-2.5 px-3.5 rounded-lg text-left text-xs font-semibold transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="truncate">{c.nama_kategori}</span>
                    {!isAssigned && (
                      <span className="text-[10px] text-amber-500 font-normal block">Bukan Penilai</span>
                    )}
                  </div>
                  <span className={`text-[11px] font-mono tabular-nums px-2 py-0.5 rounded shrink-0 ${
                    isSelected ? 'bg-emerald-800 text-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {countGradedInCat}/{subEventTeams.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert if Jury is not assigned to this category */}
      {!isAssignedToActiveCategory && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex items-start gap-3 shadow-xs">
          <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <span>Khusus Juri yang Ditugaskan</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-950">Mode Pratinjau Nilai</span>
            </div>
            <p className="mt-1 leading-relaxed text-slate-700">
              Cabang lomba <strong>{activeCategory.nama_kategori}</strong> memiliki penugasan dewan juri khusus dari panitia. Akun Anda tidak termasuk dalam daftar juri yang ditugaskan pada cabang lomba ini, sehingga form input penilaian dinonaktifkan.
            </p>
          </div>
        </div>
      )}

      {/* Alert if Sub-Event is Closed or Inactive */}
      {isSubEventClosed && (
        <div className={`p-4 rounded-xl border-2 flex items-start gap-3 shadow-sm ${
          closedStatus.reason === 'not_active'
            ? 'border-amber-300 bg-amber-50 text-amber-950'
            : 'border-rose-300 bg-rose-50 text-rose-900'
        }`}>
          {closedStatus.reason === 'not_active' ? (
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          ) : (
            <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm">
            <div className="font-bold uppercase">
              {closedStatus.reason === 'not_active'
                ? 'PENJURIAN DITUTUP (SUB-EVENT TIDAK DIAKTIFKAN)'
                : 'PENJURIAN RESMI DITUTUP (WAKTU HABIS)'}
            </div>
            <p className="mt-0.5 leading-relaxed">
              {closedStatus.reason === 'not_active' ? (
                <>
                  Sub-Event <strong>{currentSubEvent.nama_event}</strong> saat ini dalam status <strong>DITUTUP / NON-AKTIF</strong> oleh Admin Panitia.
                  Anda dapat melihat riwayat nilai yang telah tersimpan, namun form penilaian baru atau pengubahan nilai dikunci sementara.
                </>
              ) : (
                <>
                  Batas waktu penilaian untuk Sub-Event <strong>{currentSubEvent.nama_event}</strong> telah berakhir pada{' '}
                  <strong className="underline">{formattedDeadline}</strong>. Form pengisian nilai baru atau pengubahan nilai telah dikunci oleh sistem.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-semibold underline">
            Tutup
          </button>
        </div>
      )}

      {/* Search Box & Sorting Bar for Dewan Juri */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Kotak Pencarian Nama */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari nama ${currentSubEvent.tipe_peserta === 'Individu' ? 'peserta' : 'regu'}, pangkalan, atau kelas...`}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Semua ({subEventTeams.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Belum ({subEventTeams.length - gradedTeamsCount})
            </button>
            <button
              onClick={() => setStatusFilter('graded')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'graded' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Dinilai ({gradedTeamsCount})
            </button>
          </div>

          {/* Urutan A-Z */}
          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 shrink-0"
            title="Ubah urutan abjad peserta"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-800" />
            <span>Urut: {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Menampilkan <strong>{processedTeams.length}</strong> {currentSubEvent.tipe_peserta === 'Individu' ? 'peserta' : 'regu'} (Urut A-Z) · Form memuat{' '}
            <strong className="text-emerald-800">{activeCategory?.kriteria?.length || 0} kriteria pertanyaan</strong>
          </span>
          <span className="text-slate-400">Skala Penilaian: 1 (Kurang) s/d 5 (Istimewa)</span>
        </div>
      </div>

      {/* Main Grid: Teams List to Grade */}
      {processedTeams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">Tidak ada peserta yang cocok dengan kriteria pencarian.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="mt-3 px-3 py-1.5 text-xs font-semibold bg-emerald-800 text-white rounded-lg"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedTeams.map(team => {
            const scoreObj = myCategoryScores.find(s => s.id_team === team.id_team);
            const isGraded = Boolean(scoreObj?.is_final);
            const isIndividual = team.tipe_partisipasi === 'Individu';

            return (
              <div
                key={team.id_team}
                className={`bg-white rounded-xl border p-5 transition-all flex flex-col justify-between ${
                  isGraded
                    ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {isIndividual ? <UserIcon className="w-3.5 h-3.5 text-slate-400" /> : <Users className="w-3.5 h-3.5 text-slate-400" />}
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {isIndividual ? 'Individu' : 'Regu'} {team.kategori_regu}
                      </span>
                    </div>

                    {isGraded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Skor {scoreObj?.skor_1_to_5.toFixed(2)}/5</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Belum Dinilai
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 my-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                      team.kategori_regu === 'Putra'
                        ? 'bg-gradient-to-br from-emerald-800 to-teal-900'
                        : 'bg-gradient-to-br from-rose-700 to-pink-900'
                    }`}>
                      {getTeamInitials(team.nama_regu)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">{team.nama_regu}</h3>
                      <p className="text-xs text-slate-500">{team.kelas_pangkalan}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-600 italic">
                    "{team.motto}"
                  </div>

                  {team.ketua_regu && (
                    <div className="mt-2 text-[11px] text-slate-500">
                      <span>{isIndividual ? 'Pembimbing: ' : 'Ketua: '}</span>
                      <strong className="text-slate-800">{team.ketua_regu}</strong>
                    </div>
                  )}

                  {scoreObj?.catatan && (
                    <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Catatan Juri:</div>
                      <p className="line-clamp-2">{scoreObj.catatan}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isAssignedToActiveCategory ? (
                    <button
                      disabled
                      className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bukan Juri Penilai</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenScoring(team)}
                      className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        isGraded
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-800 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isGraded ? <Edit3 className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                      <span>{isGraded ? 'Lihat / Edit Nilai' : 'Mulai Menilai'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Scoring Dialog Panel */}
      {activeTeamForScoring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-emerald-900 text-white p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-300 mb-1">
                  <span>Form Penilaian Dewan Juri</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeCategory?.nama_kategori}</span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {activeTeamForScoring.tipe_partisipasi === 'Individu' ? 'Penilaian Peserta:' : 'Penilaian Regu:'}{' '}
                  {activeTeamForScoring.nama_regu}
                </h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {activeTeamForScoring.kelas_pangkalan}
                </p>
              </div>

              <button
                onClick={() => setActiveTeamForScoring(null)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {isSubEventClosed && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {closedStatus.reason === 'not_active'
                      ? 'Sub-Event sedang ditutup oleh panitia. Form dalam mode hanya-baca (Read-Only).'
                      : `Periode penjurian telah berakhir pada ${formattedDeadline}. Form ini dalam mode hanya-baca (Read-Only).`}
                  </span>
                </div>
              )}

              {/* Kriteria list with 1-5 rating buttons */}
              {(() => {
                const effectiveCriteria = (activeCategory?.kriteria && activeCategory.kriteria.length > 0)
                  ? activeCategory.kriteria
                  : getFallbackCriteria(selectedCategoryId, activeCategory?.nama_kategori || '');

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-2 border-b">
                      <span>Kriteria Pertanyaan Penilaian ({effectiveCriteria.length} Pertanyaan)</span>
                      <span className="text-emerald-800 font-bold">Skala 1 s/d 5</span>
                    </div>

                    {effectiveCriteria.map((kriteriaText, idx) => {
                      const currentScore = criterionScores[kriteriaText] || 4;

                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-medium text-slate-900 leading-snug">
                              <span className="font-bold text-emerald-800 mr-1.5">{idx + 1}.</span>
                              {kriteriaText}
                            </div>
                            <div className="font-mono text-sm font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                              {currentScore}.0
                            </div>
                          </div>

                          {/* Score Selector 1 to 5 */}
                          <div className="grid grid-cols-5 gap-2 pt-1">
                            {[1, 2, 3, 4, 5].map(scoreOption => {
                              const isPicked = currentScore === scoreOption;

                              return (
                                <button
                                  key={scoreOption}
                                  type="button"
                                  disabled={isSubEventClosed}
                                  onClick={() => handleScoreChange(kriteriaText, scoreOption)}
                                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                                    isPicked
                                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                                      : isSubEventClosed
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/30'
                                  }`}
                                >
                                  {scoreOption}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-400 px-1">
                            <span>1 = Kurang</span>
                            <span>3 = Cukup</span>
                            <span>5 = Sangat Istimewa</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Catatan Juri */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Catatan / Evaluasi Juri (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={juryNote}
                  disabled={isSubEventClosed}
                  onChange={(e) => setJuryNote(e.target.value)}
                  placeholder="Berikan apresiasi, catatan perbaikan teknis, atau catatan dewan juri..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {/* Live Score Summary */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-950">Rata-Rata Nilai Juri:</div>
                  <div className="text-[11px] text-emerald-700">Otomatis dihitung dari {activeCategory?.kriteria?.length || 0} kriteria</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-emerald-900 font-mono">
                    {calculateLiveAverage()} <span className="text-sm font-normal text-emerald-700">/ 5.00</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    Setara {Number((calculateLiveAverage() * 20).toFixed(1))} dari skala 100
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTeamForScoring(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {isSubEventClosed ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span>Penjurian Ditutup ({closedStatus.reason === 'not_active' ? 'Sub-Event Non-Aktif' : 'Waktu Habis'})</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveScore(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Draft</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveScore(true)}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isSubmitting ? 'Menyimpan...' : 'Kirim Penilaian Final'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

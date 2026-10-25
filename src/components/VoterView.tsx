import React, { useState, useMemo, useEffect } from 'react';
import { EventModel, CategoryModel, TeamModel, User, PublicVote } from '../types';
import { apiService } from '../services/apiService';
import {
  Flame,
  Utensils,
  Compass,
  CheckCircle2,
  Users,
  User as UserIcon,
  Vote,
  ShieldCheck,
  Search,
  AlertCircle,
  Info,
  Check,
  ArrowUpDown,
  Lock,
  Clock,
  Sparkles,
  BookOpen,
  Music,
  Megaphone,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { getTeamInitials } from '../utils/initials';

interface VoterViewProps {
  event: EventModel;
  events?: EventModel[];
  categories: CategoryModel[];
  teams: TeamModel[];
  publicVotes: PublicVote[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onRefreshData: () => void;
  onSelectEvent?: (eventId: string) => void;
  selectedEventId?: string;
  selectedCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export const VoterView: React.FC<VoterViewProps> = ({
  event,
  events = [],
  categories,
  teams,
  publicVotes,
  currentUser,
  onOpenAuth,
  onRefreshData,
  onSelectEvent,
  selectedEventId: propSelectedEventId,
  selectedCategoryId: propSelectedCategoryId,
  onSelectCategory
}) => {
  // Sub-event yang DI KUNCI (status_aktif: false) di-HIDE dari menu akun pemilih bebas.
  // Batas waktu telah habis, belum di kunci: masih muncul tapi Close, tidak bisa di vote.
  const visibleEvents = useMemo(() => {
    const list = events && events.length > 0 ? events : [event];
    return list.filter(ev => ev.status_aktif !== false);
  }, [events, event]);

  // Selected sub-event (default to propSelectedEventId, current active event, or first visible event)
  const [selectedSubEventId, setSelectedSubEventId] = useState<string>(() => {
    if (propSelectedEventId) return propSelectedEventId;
    if (event && event.status_aktif !== false) return event.id_event;
    const firstActive = (events || []).find(e => e.status_aktif !== false);
    return firstActive?.id_event || event?.id_event || '';
  });

  // Sync with propSelectedEventId when changed from parent
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

  // Filter categories by selected sub-event (exclude categories marked as jury_only)
  const subEventCategories = useMemo(() => {
    const list = categories.filter(
      c => c.id_event === selectedSubEventId && c.assessment_type !== 'jury_only'
    );
    if (list.length > 0) return list;
    const fallback = categories.filter(c => c.assessment_type !== 'jury_only');
    return fallback.length > 0 ? fallback : categories;
  }, [categories, selectedSubEventId]);

  // Selected category in the current sub-event
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    propSelectedCategoryId || subEventCategories[0]?.id_kategori || ''
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

  // When sub-event changes, reset category selection to first category in sub-event
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

  // Search & filter state
  const [genderFilter, setGenderFilter] = useState<'All' | 'Putra' | 'Putri'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default A-Z

  // Confirmation modal state
  const [teamToVote, setTeamToVote] = useState<TeamModel | null>(null);
  const [cancelVoteTarget, setCancelVoteTarget] = useState<{ voteId: string; teamName: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeCategory = subEventCategories.find(c => c.id_kategori === selectedCategoryId) || subEventCategories[0] || categories[0];
  const requiredVotes = activeCategory?.votes_required || 1;

  // Hanya admin dan dewan juri yang boleh melihat jumlah perolehan vote
  const canViewLiveVotes = currentUser?.role === 'admin' || currentUser?.role === 'juri';

  // Check if sub-event is closed: either because admin closed/did not activate it, or deadline has expired
  const closedStatus = useMemo(() => {
    return apiService.isEventClosed(currentSubEvent);
  }, [currentSubEvent]);

  const isSubEventClosed = closedStatus.isClosed;

  // Format deadline to Indonesian date string
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

  // Votes cast by current user for this category
  const myCategoryVotes = useMemo(() => {
    if (!currentUser) return [];
    return publicVotes.filter(
      v => v.id_voter === currentUser.id && v.id_kategori === selectedCategoryId
    );
  }, [currentUser, publicVotes, selectedCategoryId]);

  const userVotedTeamIds = useMemo(() => {
    return myCategoryVotes.map(v => v.id_team);
  }, [myCategoryVotes]);

  const isQuotaSatisfied = myCategoryVotes.length >= requiredVotes;
  const remainingVotesCount = Math.max(0, requiredVotes - myCategoryVotes.length);

  // Teams belonging to the current sub-event
  const subEventTeams = useMemo(() => {
    const list = teams.filter(t => t.id_event === selectedSubEventId);
    return list.length > 0 ? list : teams;
  }, [teams, selectedSubEventId]);

  // Filter & Sort A-Z by name
  const processedTeams = useMemo(() => {
    return subEventTeams
      .filter(t => {
        // Gender filter
        if (genderFilter !== 'All' && t.kategori_regu !== genderFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = t.nama_regu.toLowerCase().includes(q);
          const matchClass = t.kelas_pangkalan.toLowerCase().includes(q);
          const matchLeader = (t.ketua_regu || '').toLowerCase().includes(q);
          if (!matchName && !matchClass && !matchLeader) return false;
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
  }, [subEventTeams, genderFilter, searchQuery, sortOrder]);

  // Calculate vote count per team in current category
  const getTeamVoteCount = (teamId: string) => {
    return publicVotes.filter(v => v.id_kategori === selectedCategoryId && v.id_team === teamId).length;
  };

  const handleOpenVoteModal = (team: TeamModel) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (isSubEventClosed) {
      const msg = closedStatus.reason === 'not_active'
        ? `Sub-Event ${currentSubEvent.nama_event} saat ini berstatus DITUTUP oleh panitia. Hak voting tidak dapat digunakan.`
        : `Voting telah ditutup. Batas waktu untuk ${currentSubEvent.nama_event} telah berakhir pada ${formattedDeadline}.`;
      setNotification({
        type: 'error',
        message: msg
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    if (userVotedTeamIds.includes(team.id_team)) {
      setNotification({
        type: 'error',
        message: `Anda sudah memberikan suara untuk ${team.nama_regu}.`
      });
      setTimeout(() => setNotification(null), 3500);
      return;
    }
    if (isQuotaSatisfied) {
      setNotification({
        type: 'error',
        message: `Ketentuan Admin: Kuota tepat ${requiredVotes} suara Anda untuk kategori ini sudah terpenuhi (tidak boleh lebih).`
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    setTeamToVote(team);
  };

  const handleConfirmVote = async () => {
    if (!currentUser || !teamToVote) return;

    if (isSubEventClosed) {
      setNotification({
        type: 'error',
        message: closedStatus.reason === 'not_active'
          ? 'Gagal: Sub-Event sedang ditutup oleh panitia.'
          : 'Gagal: Periode voting telah berakhir dan sistem saat ini terkunci.'
      });
      setIsSubmitting(false);
      setTeamToVote(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.submitPublicVote(
        currentUser.id,
        currentUser.nama,
        teamToVote.id_team,
        selectedCategoryId
      );

      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        setTeamToVote(null);
        onRefreshData();
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal mengirim voting' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4500);
    }
  };

  const handleConfirmCancelVote = async () => {
    if (!cancelVoteTarget) return;

    if (isSubEventClosed) {
      setNotification({
        type: 'error',
        message: 'Tidak dapat membatalkan suara: Sub-event telah resmi ditutup oleh panitia.'
      });
      setCancelVoteTarget(null);
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    setIsCancelling(true);
    try {
      const res = await apiService.removePublicVote(cancelVoteTarget.voteId);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Suara untuk ${cancelVoteTarget.teamName} berhasil dibatalkan. Kuota suara Anda telah dikembalikan.`
        });
        onRefreshData();
      } else {
        setNotification({ type: 'error', message: res.message || 'Gagal membatalkan suara' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal membatalkan suara' });
    } finally {
      setIsCancelling(false);
      setCancelVoteTarget(null);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-emerald-600" />;
      case 'Compass':
        return <Compass className="w-4 h-4 text-teal-600" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'Music':
        return <Music className="w-4 h-4 text-cyan-600" />;
      case 'Megaphone':
        return <Megaphone className="w-4 h-4 text-rose-500" />;
      default:
        return <Flame className="w-4 h-4 text-amber-500" />;
    }
  };

  // Jika semua sub-event di Kunci oleh Admin, sembunyikan semua dan tampilkan pesan informatif
  if (visibleEvents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Semua Sub-Event Sedang Ditutup</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-lg mx-auto">
          Saat ini belum ada sub-event pemungutan suara yang dibuka oleh Panitia SMPIT Pondok Duta.
          Seluruh sub-event sedang dalam status dikunci. Silakan menunggu informasi resmi dari panitia.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
          <Clock className="w-4 h-4 text-emerald-700" />
          <span>Status Sistem: Terkunci oleh Panitia</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      {/* Sub-Event Selector Tabs (Sub-Event Dikunci: HIDE. Batas Waktu Habis: Muncul tapi Close) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Pilihan Sub-Event:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {visibleEvents.map(ev => {
              const isSelected = ev.id_event === selectedSubEventId;
              const isEvExpired = apiService.isEventExpired(ev);
              return (
                <button
                  key={ev.id_event}
                  onClick={() => {
                    setSelectedSubEventId(ev.id_event);
                    if (onSelectEvent) onSelectEvent(ev.id_event);
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
                    !isEvExpired
                      ? isSelected ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
                      : isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {!isEvExpired ? 'Dibuka' : 'Waktu Habis (Close)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-8 shadow-lg border border-emerald-800/40 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-300 mb-2">
            <span>Sub-Event: {currentSubEvent.kode_event || currentSubEvent.nama_event}</span>
            <span aria-hidden="true">·</span>
            <span>SMPIT Pondok Duta</span>
            <span aria-hidden="true">·</span>
            <span>Tipe: {currentSubEvent.tipe_peserta || 'Group'}</span>
            <span aria-hidden="true">·</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              !isSubEventClosed ? 'bg-emerald-800 text-amber-300' : 'bg-rose-900/80 text-rose-300'
            }`}>
              {!isSubEventClosed ? 'Status: DIBUKA' : 'Status: TUTUP (WAKTU HABIS)'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            {currentSubEvent.nama_event}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
            {currentSubEvent.deskripsi || 'Portal E-Voting resmi SMPIT Pondok Duta. Berikan dukungan terbaikmu sesuai ketentuan hak suara yang ditetapkan panitia.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/50">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Ketentuan: Tepat {requiredVotes} Suara per Akun di Kategori Ini</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/50">
              <Users className="w-4 h-4 text-amber-400" />
              <span>{subEventTeams.length} {currentSubEvent.tipe_peserta === 'Individu' ? 'Peserta' : 'Regu/Kontingen'}</span>
            </div>
            {formattedDeadline && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                isSubEventClosed
                  ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                  : 'bg-emerald-900/60 border-emerald-700/50 text-emerald-200'
              }`}>
                {isSubEventClosed ? <Lock className="w-4 h-4 text-rose-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                <span>Batas Waktu: {formattedDeadline}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lock Notification if Sub-Event Deadline Has Expired */}
      {isSubEventClosed && (
        <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-900 flex items-start gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <div className="font-bold">PENJURIAN & VOTING TELAH RESMI DITUTUP (BATAS WAKTU HABIS)</div>
            <p className="mt-0.5 leading-relaxed">
              Batas waktu untuk Sub-Event <strong>{currentSubEvent.nama_event}</strong> telah berakhir pada{' '}
              <strong className="underline">{formattedDeadline}</strong>. Sesuai ketentuan panitia, sistem voting saat ini resmi terkunci dan tidak dapat menerima dukungan baru.
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {subEventCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id_kategori;
            const categoryVotesCount = publicVotes.filter(v => v.id_kategori === cat.id_kategori).length;
            const catVotesReq = cat.votes_required || 1;
            const userVotesCountInCat = currentUser
              ? publicVotes.filter(v => v.id_voter === currentUser.id && v.id_kategori === cat.id_kategori).length
              : 0;
            const isCatComplete = userVotesCountInCat >= catVotesReq;

            return (
              <button
                key={cat.id_kategori}
                onClick={() => {
                  setSelectedCategoryId(cat.id_kategori);
                  setSearchQuery('');
                  if (onSelectCategory) onSelectCategory(cat.id_kategori);
                }}
                className={`p-4 rounded-xl text-left border transition-all relative ${
                  isSelected
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-emerald-800 text-amber-300' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {getCategoryIcon(cat.iconName)}
                    </div>
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-80">
                      Cabang Lomba
                    </span>
                  </div>

                  {currentUser && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isCatComplete
                        ? isSelected ? 'text-amber-300' : 'text-emerald-700'
                        : isSelected ? 'text-emerald-200' : 'text-slate-500'
                    }`}>
                      {isCatComplete ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Lengkap ({catVotesReq}/{catVotesReq})</span>
                        </>
                      ) : (
                        <span>{userVotesCountInCat}/{catVotesReq} Suara</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="font-bold text-base mb-1">{cat.nama_kategori}</div>
                <div className={`text-xs line-clamp-2 leading-relaxed ${
                  isSelected ? 'text-emerald-100' : 'text-slate-500'
                }`}>
                  {cat.deskripsi}
                </div>

                <div className={`mt-3 pt-2 text-xs flex items-center justify-between border-t ${
                  isSelected ? 'border-emerald-800 text-emerald-200' : 'border-slate-100 text-slate-400'
                }`}>
                  <span className="font-medium text-[11px]">
                    Ketentuan: {catVotesReq} vote/akun
                  </span>
                  {canViewLiveVotes ? (
                    <span className="font-mono tabular-nums">{categoryVotesCount} Suara Masuk</span>
                  ) : (
                    <span className="text-[11px] opacity-75">Hasil Tertutup</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Vote Quota Status & Information Bar */}
      <div className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isQuotaSatisfied
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : myCategoryVotes.length > 0
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-white border-slate-200 text-slate-700 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <Info className={`w-4 h-4 shrink-0 ${isQuotaSatisfied ? 'text-emerald-700' : 'text-amber-700'}`} />
          <div>
            <span className="font-bold">Ketentuan Hak Suara Admin:</span> Setiap pemilih wajib memberikan tepat{' '}
            <strong className="underline font-bold text-slate-900">{requiredVotes} suara</strong> pada kategori{' '}
            <strong>{activeCategory?.nama_kategori}</strong> (tidak boleh kurang, tidak boleh lebih).
          </div>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {isQuotaSatisfied ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-800 text-white font-bold text-xs">
                <Check className="w-3.5 h-3.5 text-amber-300" />
                <span>Hak Suara Lengkap ({myCategoryVotes.length}/{requiredVotes})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-slate-900 font-bold text-xs">
                <span>Terpakai: {myCategoryVotes.length} dari {requiredVotes} (Kurang {remainingVotesCount} lagi)</span>
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="text-xs text-emerald-800 font-bold hover:underline shrink-0"
          >
            Masuk untuk Berikan Suara →
          </button>
        )}
      </div>

      {/* Search & Sort Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Kotak Pencarian */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Cari nama ${currentSubEvent.tipe_peserta === 'Individu' ? 'peserta' : 'regu'}, kelas, kontingen, atau pembina...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            {(['All', 'Putra', 'Putri'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  genderFilter === g
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g === 'All' ? 'Semua' : `${g}`}
              </button>
            ))}
          </div>

          {/* Urutan A-Z Toggle */}
          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 shrink-0"
            title="Ubah urutan abjad"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-800" />
            <span>Urut: {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}</span>
          </button>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Menampilkan <strong>{processedTeams.length}</strong> dari {subEventTeams.length} {currentSubEvent.tipe_peserta === 'Individu' ? 'peserta' : 'regu'} (Diurutkan dari {sortOrder === 'asc' ? 'A ke Z' : 'Z ke A'})
          </span>
          {searchQuery && (
            <span>
              Hasil pencarian: "<em>{searchQuery}</em>"
            </span>
          )}
        </div>
      </div>

      {/* Teams Grid */}
      {processedTeams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">Tidak ada peserta/regu yang cocok dengan pencarian.</p>
          <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau bersihkan kotak pencarian.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setGenderFilter('All');
            }}
            className="mt-3 px-3 py-1.5 text-xs font-semibold bg-emerald-800 text-white rounded-lg"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {processedTeams.map((team) => {
            const voteCount = getTeamVoteCount(team.id_team);
            const userVoteObj = myCategoryVotes.find(v => v.id_team === team.id_team);
            const isVotedByMe = Boolean(userVoteObj);
            const isPutra = team.kategori_regu === 'Putra';
            const isIndividual = team.tipe_partisipasi === 'Individu';

            return (
              <div
                key={team.id_team}
                className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden group ${
                  isVotedByMe
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="p-5">
                  {/* Team Visual Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-xs ${
                      isPutra
                        ? 'bg-gradient-to-br from-emerald-800 to-teal-900'
                        : 'bg-gradient-to-br from-rose-700 to-pink-900'
                    }`}>
                      {getTeamInitials(team.nama_regu)}
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isIndividual ? (
                          <UserIcon className="w-3 h-3 text-slate-400" />
                        ) : (
                          <Users className="w-3 h-3 text-slate-400" />
                        )}
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {isIndividual ? 'Individu' : 'Regu'} {team.kategori_regu}
                        </span>
                      </div>
                      {canViewLiveVotes && (
                        <span className="text-xs text-slate-400 font-mono tabular-nums block mt-0.5">
                          {voteCount} Dukungan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Team Details */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {team.nama_regu}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mt-0.5">
                    {team.kelas_pangkalan}
                  </p>

                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 italic">
                    "{team.motto}"
                  </div>

                  {team.ketua_regu && (
                    <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>{isIndividual ? 'Pembimbing:' : 'Ketua Regu:'}</span>
                      <span className="font-medium text-slate-800 truncate">{team.ketua_regu}</span>
                    </div>
                  )}
                </div>

                {/* Action Area */}
                <div className="p-4 pt-0">
                  {isVotedByMe ? (
                    <div className="space-y-1.5">
                      <div className="w-full py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Pilihan Anda Terpilih</span>
                      </div>
                      {!isSubEventClosed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCancelVoteTarget({
                              voteId: userVoteObj!.id_vote,
                              teamName: team.nama_regu
                            });
                          }}
                          className="w-full text-center text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg py-1.5 transition-colors border border-rose-200 mt-1 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Batalkan Pilihan Ini</span>
                        </button>
                      )}
                    </div>
                  ) : isSubEventClosed ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-3 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{closedStatus.reason === 'not_active' ? 'Sub-Event Ditutup' : 'Voting Ditutup (Waktu Habis)'}</span>
                    </button>
                  ) : isQuotaSatisfied ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-3 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed text-center"
                    >
                      Kuota {requiredVotes} Suara Lengkap
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenVoteModal(team)}
                      className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-[0.98] rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 group-hover:bg-emerald-700"
                    >
                      <Vote className="w-4 h-4 text-amber-300" />
                      <span>
                        Vote (Suara {myCategoryVotes.length + 1} dari {requiredVotes})
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {teamToVote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Vote className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Dukungan Suara</h3>
                <p className="text-xs text-slate-500">
                  Suara ke-{myCategoryVotes.length + 1} dari total {requiredVotes} suara wajib
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Sub-Event:</span>
                <span className="font-semibold text-slate-900">{currentSubEvent.nama_event}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Kategori Lomba:</span>
                <span className="font-semibold text-slate-900">{activeCategory?.nama_kategori}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">
                  {teamToVote.tipe_partisipasi === 'Individu' ? 'Peserta Pilihan:' : 'Regu Pilihan:'}
                </span>
                <span className="font-bold text-emerald-800">{teamToVote.nama_regu}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Kelas / Pangkalan:</span>
                <span className="font-medium text-slate-800">{teamToVote.kelas_pangkalan}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Ketentuan Suara:</span>
                <span className="font-bold text-emerald-900">Tepat {requiredVotes} suara per akun</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda memilih <strong>{teamToVote.nama_regu}</strong> sebagai salah satu pilihan terbaik Anda. 
              {myCategoryVotes.length + 1 < requiredVotes ? (
                <span> Setelah ini, Anda masih perlu memilih {requiredVotes - (myCategoryVotes.length + 1)} peserta lagi agar hak suara Anda sah dan lengkap.</span>
              ) : (
                <span> Ini adalah suara terakhir yang melengkapi tepat {requiredVotes} hak suara Anda pada kategori ini.</span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTeamToVote(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmVote}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? 'Mengirim Suara...' : 'Ya, Kirim Suara'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembatalan Pilihan Suara */}
      {cancelVoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto border border-rose-100">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Batalkan Pilihan Suara?
            </h3>

            <p className="text-xs text-slate-600 text-center leading-relaxed mb-6">
              Apakah Anda yakin ingin membatalkan suara untuk{' '}
              <strong className="text-slate-900 font-bold">{cancelVoteTarget.teamName}</strong>?
              Hak suara Anda di kategori ini akan dikembalikan sehingga Anda dapat memilih peserta lain.
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCancelVoteTarget(null)}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelVote}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

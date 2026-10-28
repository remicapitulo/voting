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
  Trash2,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Radio
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUrl';
import {
  getOrCreateDeviceId,
  getFormattedDeviceLabel,
  getSavedVoterDisplayName,
  saveVoterDisplayName
} from '../utils/deviceFingerprint';
import {
  TikTokIcon,
  YouTubeIcon,
  InstagramIcon,
  LiveRadioIcon,
  sanitizeLiveUrl,
  hasAnyLiveStream
} from './LiveStreamIcons';

interface VoterViewProps {
  event: EventModel;
  events?: EventModel[];
  categories: CategoryModel[];
  teams: TeamModel[];
  publicVotes: PublicVote[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onRefreshData: (syncFromCloud?: boolean) => void;
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

  // Device-based identity (1 Device = 1 Kuota Vote tanpa perlu login)
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const deviceLabel = useMemo(() => getFormattedDeviceLabel(deviceId), [deviceId]);
  const [guestVoterName, setGuestVoterName] = useState<string>(() => getSavedVoterDisplayName());

  // State ekspansi daftar anggota regu pada Card
  const [expandedTeamMembers, setExpandedTeamMembers] = useState<Record<string, boolean>>({});
  const toggleExpandTeam = (teamId: string) => {
    setExpandedTeamMembers(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Ticking time untuk live countdown buka & tutup vote cabang lomba
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (ms: number): string => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}h ${hours}j ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}j ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // ID pemilih yang sah: gunakan ID akun jika login, atau ID perangkat unik permanen jika tidak login
  const effectiveVoterId = currentUser ? currentUser.id : deviceId;

  const activeCategory = subEventCategories.find(c => c.id_kategori === selectedCategoryId) || subEventCategories[0] || categories[0];
  const requiredVotes = activeCategory?.votes_required || 1;

  // Jadwal waktu buka & tutup voting publik khusus untuk cabang lomba yang sedang aktif
  const categorySchedule = useMemo(() => {
    return apiService.getCategoryVotingSchedule(activeCategory);
  }, [activeCategory, currentTime]);

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

  // Votes cast by current voter/device for this category
  const myCategoryVotes = useMemo(() => {
    return publicVotes.filter(
      v => (v.id_voter === effectiveVoterId || (currentUser ? v.id_voter === currentUser.id : v.id_voter === deviceId)) &&
           v.id_kategori === selectedCategoryId
    );
  }, [effectiveVoterId, currentUser, deviceId, publicVotes, selectedCategoryId]);

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
    if (categorySchedule.isBeforeStart) {
      setNotification({
        type: 'error',
        message: `Voting untuk cabang lomba "${activeCategory.nama_kategori}" belum dibuka. Akan dibuka pada ${categorySchedule.formattedStart} (dalam ${formatCountdown(categorySchedule.timeLeftToStartMs)}).`
      });
      setTimeout(() => setNotification(null), 4500);
      return;
    }

    if (categorySchedule.isAfterEnd) {
      setNotification({
        type: 'error',
        message: `Voting untuk cabang lomba "${activeCategory.nama_kategori}" telah resmi ditutup pada ${categorySchedule.formattedEnd}.`
      });
      setTimeout(() => setNotification(null), 4500);
      return;
    }

    if (isSubEventClosed) {
      const msg = closedStatus.reason === 'not_active'
        ? `Event ${currentSubEvent.nama_event} saat ini berstatus DITUTUP oleh panitia. Hak voting tidak dapat digunakan.`
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
        message: `Perangkat ini sudah memberikan suara untuk ${team.nama_regu}.`
      });
      setTimeout(() => setNotification(null), 3500);
      return;
    }
    if (isQuotaSatisfied) {
      setNotification({
        type: 'error',
        message: `Ketentuan Panitia: Kuota tepat ${requiredVotes} suara untuk perangkat Anda di kategori ini sudah terpenuhi (tidak boleh lebih).`
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    setTeamToVote(team);
  };

  const handleConfirmVote = async () => {
    if (!teamToVote) return;

    if (categorySchedule.isBeforeStart || categorySchedule.isAfterEnd) {
      setNotification({
        type: 'error',
        message: categorySchedule.isBeforeStart
          ? `Gagal: Voting cabang ini belum dibuka (dibuka pada ${categorySchedule.formattedStart}).`
          : `Gagal: Voting cabang ini telah ditutup pada ${categorySchedule.formattedEnd}.`
      });
      setIsSubmitting(false);
      setTeamToVote(null);
      return;
    }

    if (isSubEventClosed) {
      setNotification({
        type: 'error',
        message: closedStatus.reason === 'not_active'
          ? 'Gagal: Event sedang ditutup oleh panitia.'
          : 'Gagal: Periode voting telah berakhir dan sistem saat ini terkunci.'
      });
      setIsSubmitting(false);
      setTeamToVote(null);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!currentUser && guestVoterName.trim()) {
        saveVoterDisplayName(guestVoterName.trim());
      }
      const finalVoterName = currentUser
        ? (currentUser.nama || currentUser.username)
        : (guestVoterName.trim() ? `${guestVoterName.trim()} (${deviceLabel})` : `Pemilih (${deviceLabel})`);

      const res = await apiService.submitPublicVote(
        effectiveVoterId,
        finalVoterName,
        teamToVote.id_team,
        selectedCategoryId
      );

      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        setTeamToVote(null);
        onRefreshData(true);
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
        onRefreshData(true);
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
        <h2 className="text-xl font-bold text-slate-900 mb-2">Semua Event Sedang Ditutup</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-lg mx-auto">
          Saat ini belum ada event pemungutan suara yang dibuka oleh Panitia SMPIT Pondok Duta.
          Seluruh event sedang dalam status dikunci. Silakan menunggu informasi resmi dari panitia.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
          <Clock className="w-4 h-4 text-emerald-700" />
          <span>Status Sistem: Terkunci oleh Panitia</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* 1. Sub-Event Selector Tabs (Clean Horizontal Scroll on Mobile, Flex on Desktop) */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 px-1 shrink-0">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pilihan Event:
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{ev.kode_event || ev.nama_event}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    !isEvExpired
                      ? isSelected ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
                      : isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {!isEvExpired ? 'Dibuka' : 'Waktu Habis'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Event Hero Banner (Refined Typography & Spacing) */}
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-7 shadow-md border border-emerald-800/40 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-200 mb-2">
            <span className="text-amber-300 font-bold">{currentSubEvent.kode_event || currentSubEvent.nama_event}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>SMPIT Pondok Duta</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>Tipe: {currentSubEvent.tipe_peserta || 'Group'}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              !isSubEventClosed ? 'bg-emerald-800 text-amber-300' : 'bg-rose-900/80 text-rose-300'
            }`}>
              {!isSubEventClosed ? 'Status: DIBUKA' : 'Status: TUTUP (WAKTU HABIS)'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            {currentSubEvent.nama_event}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
            {currentSubEvent.deskripsi || 'Portal E-Voting resmi SMPIT Pondok Duta. Berikan dukungan terbaikmu sesuai ketentuan hak suara yang ditetapkan panitia.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-emerald-200">
            <div className="flex items-center gap-1.5 bg-emerald-900/70 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ketentuan: Tepat {requiredVotes} Suara per Perangkat</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/70 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{subEventTeams.length} {currentSubEvent.tipe_peserta === 'Individu' ? 'Peserta' : 'Regu/Kontingen'}</span>
            </div>
            {formattedDeadline && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isSubEventClosed
                  ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                  : 'bg-emerald-900/70 border-emerald-700/50 text-emerald-200'
              }`}>
                {isSubEventClosed ? <Lock className="w-4 h-4 text-rose-400 shrink-0" /> : <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                <span className="truncate max-w-[260px] sm:max-w-none">Batas Waktu: {formattedDeadline}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lock Notification if Sub-Event Deadline Has Expired */}
      {isSubEventClosed && (
        <div className="p-4 rounded-2xl border-2 border-rose-300 bg-rose-50 text-rose-900 flex items-start gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <div className="font-bold">PENJURIAN & VOTING TELAH RESMI DITUTUP (BATAS WAKTU HABIS)</div>
            <p className="mt-0.5 leading-relaxed">
              Batas waktu untuk Event <strong>{currentSubEvent.nama_event}</strong> telah berakhir pada{' '}
              <strong className="underline">{formattedDeadline}</strong>. Sesuai ketentuan panitia, sistem voting saat ini resmi terkunci dan tidak dapat menerima dukungan baru.
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between shadow-md transition-all ${
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
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-80 cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 3. Category Tabs (Cabang Lomba) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Cabang Lomba ({subEventCategories.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Pilih cabang untuk mulai vote
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subEventCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id_kategori;
            const categoryVotesCount = publicVotes.filter(v => v.id_kategori === cat.id_kategori).length;
            const catVotesReq = cat.votes_required || 1;
            const userVotesCountInCat = publicVotes.filter(
              v => (v.id_voter === effectiveVoterId || (currentUser ? v.id_voter === currentUser.id : v.id_voter === deviceId)) &&
                   v.id_kategori === cat.id_kategori
            ).length;
            const isCatComplete = userVotesCountInCat >= catVotesReq;

            return (
              <div
                key={cat.id_kategori}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedCategoryId(cat.id_kategori);
                  setSearchQuery('');
                  if (onSelectCategory) onSelectCategory(cat.id_kategori);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedCategoryId(cat.id_kategori);
                    setSearchQuery('');
                    if (onSelectCategory) onSelectCategory(cat.id_kategori);
                  }
                }}
                className={`p-4 rounded-2xl text-left border transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/20 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected ? 'bg-emerald-800 text-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getCategoryIcon(cat.iconName)}
                      </div>
                      <span className="text-xs uppercase tracking-wider font-bold opacity-80">
                        Cabang
                      </span>
                    </div>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                      isCatComplete
                        ? isSelected ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
                        : isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-100 text-slate-600'
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
                  </div>

                  <div className="font-bold text-base mb-1 leading-snug">{cat.nama_kategori}</div>
                  <div className={`text-xs line-clamp-2 leading-relaxed ${
                    isSelected ? 'text-emerald-100' : 'text-slate-500'
                  }`}>
                    {cat.deskripsi}
                  </div>

                  {/* Live Streaming Badges on Category Card (Only shown if filled) */}
                  {hasAnyLiveStream(cat) && (
                    <div
                      className={`mt-2.5 pt-2 border-t flex flex-wrap items-center gap-1.5 ${
                        isSelected ? 'border-emerald-800' : 'border-slate-100'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`flex items-center gap-1 text-[10px] font-bold ${
                        isSelected ? 'text-amber-300' : 'text-rose-600'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span>Live:</span>
                      </div>

                      {cat.live_youtube && cat.live_youtube.trim() && (
                        <a
                          href={sanitizeLiveUrl(cat.live_youtube)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Siaran Langsung YouTube"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-transform active:scale-95"
                        >
                          <YouTubeIcon className="w-2.5 h-2.5" />
                          <span>YouTube</span>
                        </a>
                      )}

                      {cat.live_tiktok && cat.live_tiktok.trim() && (
                        <a
                          href={sanitizeLiveUrl(cat.live_tiktok)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Siaran Langsung TikTok"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black hover:bg-slate-800 text-white shadow-2xs transition-transform active:scale-95"
                        >
                          <TikTokIcon className="w-2.5 h-2.5" />
                          <span>TikTok</span>
                        </a>
                      )}

                      {cat.live_instagram && cat.live_instagram.trim() && (
                        <a
                          href={sanitizeLiveUrl(cat.live_instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Siaran Langsung Instagram"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white shadow-2xs transition-transform active:scale-95"
                        >
                          <InstagramIcon className="w-2.5 h-2.5" />
                          <span>Instagram</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Schedule Indicator on Category Tab */}
                  {(() => {
                    const catSched = apiService.getCategoryVotingSchedule(cat);
                    if (catSched.status === 'not_set') return null;
                    if (catSched.isBeforeStart) {
                      return (
                        <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">Buka: {catSched.formattedStart}</span>
                        </div>
                      );
                    }
                    if (catSched.isAfterEnd) {
                      return (
                        <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg ${
                          isSelected ? 'bg-rose-950 text-rose-200 border border-rose-500/50' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Vote Ditutup</span>
                        </div>
                      );
                    }
                    if (catSched.isOpen && cat.voting_end) {
                      return (
                        <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-lg ${
                          isSelected ? 'bg-emerald-800/80 text-emerald-200' : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">S/d: {catSched.formattedEnd}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className={`mt-3 pt-2 text-xs flex items-center justify-between border-t ${
                  isSelected ? 'border-emerald-800 text-emerald-200' : 'border-slate-100 text-slate-400'
                }`}>
                  <span className="font-medium text-[11px]">
                    Ketentuan: {catVotesReq} vote/perangkat
                  </span>
                  {canViewLiveVotes ? (
                    <span className="font-mono tabular-nums font-semibold">{categoryVotesCount} Suara</span>
                  ) : (
                    <span className="text-[11px] opacity-75">Hasil Tertutup</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3b. Dedicated Live Stream Banner for Active Category (Only shown if filled) */}
      {hasAnyLiveStream(activeCategory) && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-red-950 to-rose-900 text-white border border-rose-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-800/60 border border-rose-600/50 flex items-center justify-center shrink-0 text-amber-300">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-600 text-white tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  Siaran Langsung
                </span>
                <span className="text-xs sm:text-sm font-bold text-rose-100">{activeCategory.nama_kategori}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-rose-200/90 mt-0.5 leading-snug">
                Referensi orang tua/wali santri untuk menyaksikan penampilan santri/peserta secara langsung:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-rose-800/50">
            {activeCategory.live_youtube && activeCategory.live_youtube.trim() && (
              <a
                href={sanitizeLiveUrl(activeCategory.live_youtube)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <YouTubeIcon className="w-3.5 h-3.5" />
                <span>Nonton di YouTube</span>
              </a>
            )}

            {activeCategory.live_tiktok && activeCategory.live_tiktok.trim() && (
              <a
                href={sanitizeLiveUrl(activeCategory.live_tiktok)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-black hover:bg-slate-900 text-white border border-slate-700 shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <TikTokIcon className="w-3 h-3" />
                <span>Nonton di TikTok</span>
              </a>
            )}

            {activeCategory.live_instagram && activeCategory.live_instagram.trim() && (
              <a
                href={sanitizeLiveUrl(activeCategory.live_instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <InstagramIcon className="w-3.5 h-3.5" />
                <span>Nonton di Instagram</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 3c. Banner Waktu Buka & Tutup Vote Publik untuk Cabang Lomba Aktif */}
      {categorySchedule.status !== 'not_set' && (
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
          categorySchedule.isBeforeStart
            ? 'bg-gradient-to-r from-amber-950/95 via-amber-900/90 to-yellow-950/95 border-amber-500/50 text-amber-100 shadow-md ring-1 ring-amber-500/20'
            : categorySchedule.isAfterEnd
            ? 'bg-gradient-to-r from-rose-950/95 via-red-950/90 to-rose-900/95 border-rose-500/50 text-rose-100 shadow-md ring-1 ring-rose-500/20'
            : 'bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-emerald-900/90 border-emerald-600/40 text-emerald-100 shadow-xs'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                categorySchedule.isBeforeStart
                  ? 'bg-amber-800/60 border-amber-500/40 text-amber-300'
                  : categorySchedule.isAfterEnd
                  ? 'bg-rose-800/60 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-800/60 border-emerald-500/40 text-emerald-300'
              }`}>
                {categorySchedule.isBeforeStart ? (
                  <Clock className="w-5 h-5 animate-pulse" />
                ) : categorySchedule.isAfterEnd ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    categorySchedule.isBeforeStart
                      ? 'bg-amber-400 text-slate-950'
                      : categorySchedule.isAfterEnd
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-500 text-slate-950'
                  }`}>
                    {categorySchedule.isBeforeStart ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Vote Belum Dibuka (Terkunci)</span>
                      </>
                    ) : categorySchedule.isAfterEnd ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Vote Telah Ditutup</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                        <span>Vote Sedang Berlangsung</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {activeCategory.nama_kategori}
                  </span>
                </div>

                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {categorySchedule.isBeforeStart ? (
                    <>
                      Voting dibuka pada <strong>{categorySchedule.formattedStart}</strong>. Saat ini tombol vote terkunci, namun Anda tetap dapat melihat foto dan profil seluruh regu di bawah ini untuk menunggu.
                    </>
                  ) : categorySchedule.isAfterEnd ? (
                    <>
                      Periode pemilihan suara untuk cabang lomba ini telah resmi berakhir pada <strong>{categorySchedule.formattedEnd}</strong>.
                    </>
                  ) : (
                    <>
                      Voting sedang aktif dan menerima suara pemilih!
                      {categorySchedule.formattedEnd && (
                        <> Ditutup pada <strong>{categorySchedule.formattedEnd}</strong>.</>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Live Countdown Badge */}
            {(categorySchedule.isBeforeStart || (categorySchedule.isOpen && categorySchedule.formattedEnd)) && (
              <div className={`px-4 py-2 rounded-xl shrink-0 font-mono text-xs font-bold flex items-center justify-between md:justify-center gap-2 border self-stretch md:self-auto ${
                categorySchedule.isBeforeStart
                  ? 'bg-amber-900/60 border-amber-400/40 text-amber-200'
                  : 'bg-emerald-900/60 border-emerald-400/40 text-emerald-200'
              }`}>
                <Clock className="w-4 h-4 shrink-0 text-amber-300" />
                <span>
                  {categorySchedule.isBeforeStart
                    ? `Dibuka dalam: ${formatCountdown(categorySchedule.timeLeftToStartMs)}`
                    : `Sisa waktu: ${formatCountdown(categorySchedule.timeLeftToEndMs)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Quota Status & Information Bar (Clean & Responsive for HP and Desktop) */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
        isQuotaSatisfied
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-xs'
          : myCategoryVotes.length > 0
          ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-xs'
          : 'bg-white border-slate-200 text-slate-800 shadow-xs'
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            isQuotaSatisfied ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">
              Ketentuan Hak Suara Perangkat:
            </div>
            <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
              Setiap perangkat/pemilih wajib memberikan tepat{' '}
              <strong className="text-slate-900 font-bold underline">{requiredVotes} suara</strong> pada cabang{' '}
              <strong>{activeCategory?.nama_kategori}</strong> (1 Perangkat = {requiredVotes} Kuota Suara, tidak perlu login/registrasi).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 w-full md:w-auto justify-between md:justify-end">
          {isQuotaSatisfied ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow-xs">
              <Check className="w-3.5 h-3.5 text-amber-300" />
              <span>Hak Suara Lengkap ({myCategoryVotes.length}/{requiredVotes})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xs">
              <span>Perangkat Ini: {myCategoryVotes.length} dari {requiredVotes} (Kurang {remainingVotesCount} lagi)</span>
            </span>
          )}

          {!currentUser ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200 shadow-2xs" title="Kode Unik Perangkat Terproteksi">
              <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{deviceLabel}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/70 text-emerald-900 font-medium text-xs border border-emerald-200">
              <UserIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate max-w-[120px]">{currentUser.nama || currentUser.username}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Kotak Pencarian */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Cari nama ${currentSubEvent.tipe_peserta === 'Individu' ? 'peserta' : 'regu'}, kelas, kontingen...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Gender Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['All', 'Putra', 'Putri'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Ubah urutan abjad"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-800" />
              <span>{sortOrder === 'asc' ? 'A - Z' : 'Z - A'}</span>
            </button>
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Menampilkan <strong>{processedTeams.length}</strong> dari {subEventTeams.length} {currentSubEvent.tipe_peserta === 'Individu' ? 'peserta' : 'regu'} (Urut {sortOrder === 'asc' ? 'A ke Z' : 'Z ke A'})
          </span>
          {searchQuery && (
            <span className="truncate max-w-[160px] sm:max-w-none">
              Kata kunci: "<em>{searchQuery}</em>"
            </span>
          )}
        </div>
      </div>

      {/* 6. Teams Grid */}
      {processedTeams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
          <p className="text-sm font-bold text-slate-800">Tidak ada peserta/regu yang cocok dengan pencarian.</p>
          <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau bersihkan kotak pencarian.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setGenderFilter('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-bold bg-emerald-800 text-white rounded-xl shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {processedTeams.map((team) => {
            const voteCount = getTeamVoteCount(team.id_team);
            const userVoteObj = myCategoryVotes.find(v => v.id_team === team.id_team);
            const isVotedByMe = Boolean(userVoteObj);
            const isPutra = team.kategori_regu === 'Putra';
            const isIndividual = team.tipe_partisipasi === 'Individu';

            const hasPhoto = Boolean(team.foto_url && team.foto_url.trim().length > 4);
            const members = Array.isArray(team.anggota) ? team.anggota : [];
            const isExpanded = Boolean(expandedTeamMembers[team.id_team]);
            const displayedMembers = isExpanded ? members : members.slice(0, 3);

            return (
              <div
                key={team.id_team}
                className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-xl ${
                  isVotedByMe
                    ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-emerald-950/20 shadow-lg'
                    : 'border-slate-800/80 hover:border-emerald-500/50'
                } min-h-[420px] bg-slate-950`}
              >
                {/* 1. Latar Belakang Foto Regu (Background Image) */}
                {hasPhoto ? (
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={formatImageUrl(team.foto_url)}
                      alt={team.nama_regu}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Dark gradient overlay agar teks dan nama-nama tetap terbaca kontras & tajam */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/60 backdrop-blur-[0.5px]" />
                  </div>
                ) : (
                  <div className={`absolute inset-0 z-0 ${
                    isPutra
                      ? 'bg-gradient-to-br from-slate-950 via-emerald-950/80 to-slate-900'
                      : 'bg-gradient-to-br from-slate-950 via-rose-950/80 to-slate-900'
                  }`}>
                    {/* Pattern aksen latar jika belum ada foto */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                  </div>
                )}

                {/* 2. Konten Utama Card */}
                <div className="relative z-10 p-4 sm:p-5 flex-1 flex flex-col">
                  {/* Header Card: Nama Regu & Kelas di Kiri Atas, Kategori & Suara di Kanan Atas */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-amber-300 transition-colors leading-snug drop-shadow-md">
                        {team.nama_regu}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-300/95 mt-0.5 drop-shadow-xs">
                        {team.kelas_pangkalan}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md shadow-2xs border ${
                        isPutra
                          ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-900/80 text-rose-300 border-rose-500/40'
                      }`}>
                        {isIndividual ? <UserIcon className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        <span>{isIndividual ? 'Individu' : 'Regu'} {team.kategori_regu}</span>
                      </span>
                      {canViewLiveVotes && (
                        <span className="text-xs text-amber-300 font-mono tabular-nums block mt-1 font-bold drop-shadow-xs">
                          {voteCount} Suara Masuk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Motto Regu */}
                  {team.motto && (
                    <div className="mb-2.5 p-2 rounded-xl bg-slate-900/70 backdrop-blur-md border border-white/10 text-xs text-slate-200 italic line-clamp-2">
                      "{team.motto}"
                    </div>
                  )}

                  {/* Ketua Regu */}
                  {team.ketua_regu && (
                    <div className="mb-3 text-[11px] text-slate-300 flex items-center gap-1.5 bg-slate-900/50 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/5">
                      <span className="text-slate-400">{isIndividual ? 'Pembimbing:' : 'Ketua Regu:'}</span>
                      <span className="font-bold text-white truncate">{team.ketua_regu}</span>
                    </div>
                  )}

                  {/* Daftar Anggota Regu */}
                  {members.length > 0 && (
                    <div className="mt-auto pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Anggota ({members.length} Siswa):</span>
                        </div>
                        {members.length > 3 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleExpandTeam(team.id_team);
                            }}
                            className="text-[11px] text-amber-300 hover:text-white underline font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Tutup' : `+${members.length - 3} Lainnya`}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>

                      <div className={`rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/15 p-2 space-y-1 transition-all ${
                        isExpanded ? 'max-h-48 overflow-y-auto pr-1' : ''
                      }`}>
                        {displayedMembers.map((nama, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                            <span className="w-4 h-4 rounded-md bg-emerald-500/25 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 border border-emerald-500/30">
                              {idx + 1}
                            </span>
                            <span className="truncate font-medium">{nama}</span>
                          </div>
                        ))}
                        {!isExpanded && members.length > 3 && (
                          <div className="text-[10px] text-slate-400 italic pl-6 pt-0.5">
                            ...dan {members.length - 3} anggota lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Action Area (Tombol Vote) */}
                <div className="relative z-10 p-4 pt-0">
                  {isVotedByMe ? (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 px-3 text-xs font-bold text-white bg-emerald-700/90 border border-emerald-400 rounded-xl flex items-center justify-center gap-1.5 shadow-md backdrop-blur-md">
                        <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>Pilihan Anda Terpilih</span>
                      </div>
                      {!isSubEventClosed && !categorySchedule.isAfterEnd && (
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
                          className="w-full text-center text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/60 rounded-xl py-2 transition-colors border border-rose-500/40 cursor-pointer flex items-center justify-center gap-1.5 backdrop-blur-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Batalkan Pilihan Ini</span>
                        </button>
                      )}
                    </div>
                  ) : categorySchedule.isBeforeStart ? (
                    <button
                      disabled
                      className="w-full min-h-[44px] py-2.5 px-3 text-xs font-bold text-amber-200 bg-amber-950/85 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 border border-amber-500/40 shadow-xs"
                      title={`Voting dibuka pada ${categorySchedule.formattedStart}`}
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Vote Belum Dibuka ({formatCountdown(categorySchedule.timeLeftToStartMs)})</span>
                    </button>
                  ) : categorySchedule.isAfterEnd ? (
                    <button
                      disabled
                      className="w-full min-h-[44px] py-2.5 px-3 text-xs font-bold text-rose-200 bg-rose-950/85 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 border border-rose-500/40 shadow-xs"
                      title={`Voting ditutup pada ${categorySchedule.formattedEnd}`}
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Voting Telah Ditutup</span>
                    </button>
                  ) : isSubEventClosed ? (
                    <button
                      disabled
                      className="w-full min-h-[44px] py-2.5 px-3 text-xs font-medium text-slate-400 bg-slate-900/80 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{closedStatus.reason === 'not_active' ? 'Event Ditutup' : 'Voting Ditutup (Waktu Habis)'}</span>
                    </button>
                  ) : isQuotaSatisfied ? (
                    <button
                      disabled
                      className="w-full min-h-[44px] py-2.5 px-3 text-xs font-medium text-slate-400 bg-slate-900/80 rounded-xl cursor-not-allowed text-center border border-white/10"
                    >
                      Kuota {requiredVotes} Suara Lengkap
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenVoteModal(team)}
                      className="w-full min-h-[44px] py-2.5 px-4 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-110 active:scale-[0.98] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Vote className="w-4 h-4 text-slate-950 shrink-0" />
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

      {/* 7. Confirmation Modal (Fully Responsive & Contained - NEVER Clips on Mobile/Desktop) */}
      {teamToVote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Sticky Top) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Vote className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    Konfirmasi Dukungan Suara
                  </h3>
                  <p className="text-xs text-slate-500">
                    Suara ke-{myCategoryVotes.length + 1} dari total {requiredVotes} suara wajib
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTeamToVote(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
              {/* Highlight Card Regu Pilihan with Photo Background */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 p-4 shadow-sm bg-slate-950">
                {teamToVote.foto_url && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={formatImageUrl(teamToVote.foto_url)}
                      alt={teamToVote.nama_regu}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/60" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      teamToVote.kategori_regu === 'Putra' ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/30' : 'bg-rose-900/80 text-rose-300 border border-rose-500/30'
                    }`}>
                      {teamToVote.tipe_partisipasi === 'Individu' ? 'Peserta' : 'Regu'} {teamToVote.kategori_regu}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-emerald-200 truncate font-medium">{activeCategory?.nama_kategori}</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-extrabold text-white truncate drop-shadow-sm">
                    {teamToVote.nama_regu}
                  </h4>
                  <p className="text-xs font-semibold text-emerald-300/90 truncate mt-0.5">
                    {teamToVote.kelas_pangkalan}
                  </p>
                </div>
              </div>

              {/* Detail Info Ringkas */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Event:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[240px]">{currentSubEvent.nama_event}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Cabang Lomba:</span>
                  <span className="font-semibold text-slate-900">{activeCategory?.nama_kategori}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Ketentuan Suara:</span>
                  <span className="font-bold text-emerald-900">Tepat {requiredVotes} suara per perangkat</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Identitas Pemilih:</span>
                  <span className="font-mono font-semibold text-slate-900 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{currentUser ? `${currentUser.nama}` : `${deviceLabel}`}</span>
                  </span>
                </div>
              </div>

              {/* Daftar Seluruh Anggota Regu dalam Modal Konfirmasi */}
              {Array.isArray(teamToVote.anggota) && teamToVote.anggota.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Daftar Anggota Regu ({teamToVote.anggota.length} Siswa):</span>
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {teamToVote.anggota.map((nama, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-700 text-xs">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium truncate">{nama}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Input Nama Pemilih Opsional untuk Tamu */}
              {!currentUser && (
                <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800">
                    Nama Anda / Wali Murid (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Bambang / Alumni 2023"
                    value={guestVoterName}
                    onChange={(e) => setGuestVoterName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-600 mt-1 leading-snug">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Proteksi Perangkat Aktif:</strong> ID Perangkat (<strong className="font-mono text-slate-800">{deviceLabel}</strong>). Tidak perlu login atau registrasi akun. Vote ganda dari perangkat yang sama akan ditolak secara otomatis.
                    </span>
                  </div>
                </div>
              )}

              {/* Helper Notice */}
              <p className="text-xs text-slate-500 leading-relaxed px-1">
                {myCategoryVotes.length + 1 < requiredVotes ? (
                  <span>
                    Anda memilih <strong>{teamToVote.nama_regu}</strong>. Setelah ini, Anda masih perlu memilih {requiredVotes - (myCategoryVotes.length + 1)} peserta lagi agar hak suara Anda sah dan lengkap.
                  </span>
                ) : (
                  <span>
                    Anda memilih <strong>{teamToVote.nama_regu}</strong>. Ini adalah suara terakhir yang melengkapi tepat {requiredVotes} hak suara perangkat Anda pada cabang ini.
                  </span>
                )}
              </p>
            </div>

            {/* Modal Footer (Sticky Bottom) */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setTeamToVote(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer min-h-[42px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmVote}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-[0.98] rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer flex items-center gap-1.5 min-h-[42px]"
              >
                <Vote className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'Mengirim Suara...' : 'Ya, Kirim Suara'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Konfirmasi Pembatalan Pilihan Suara */}
      {cancelVoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto border border-rose-100">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Batalkan Pilihan Suara?
            </h3>

            <p className="text-xs text-slate-600 text-center leading-relaxed mb-6">
              Apakah Anda yakin ingin membatalkan suara untuk{' '}
              <strong className="text-slate-900 font-bold">{cancelVoteTarget.teamName}</strong>?
              Hak suara Anda di kategori ini akan dikembalikan ke kuota perangkat ini.
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCancelVoteTarget(null)}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer disabled:opacity-50 min-h-[42px]"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelVote}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 min-h-[42px]"
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

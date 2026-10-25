import React, { useState, useMemo } from 'react';
import {
  EventModel,
  CategoryModel,
  TeamModel,
  User,
  JuryScore,
  PublicVote,
  ScoreRecapItem,
  EventParticipantType,
  AssessmentType,
  ReportConfig,
  UploadedLogo
} from '../types';
import { apiService } from '../services/apiService';
import { LogoRenderer } from './LogoRenderer';
import { UploadLogoModal } from './UploadLogoModal';
import {
  LOGO_SEKOLAH_PONDOK_DUTA_SVG,
  LOGO_PRAMUKA_SVG,
  LOGO_OSIS_SVG,
  LOGO_CAMP_SVG,
  LOGO_TUT_WURI_SVG
} from '../utils/reportLogos';
import {
  Settings,
  Users,
  Award,
  Vote,
  Plus,
  Download,
  FileDown,
  Printer,
  CheckCircle2,
  Lock,
  Unlock,
  Clock,
  Calendar,
  Check,
  ListPlus,
  ShieldCheck,
  User as UserIcon,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Power,
  Flame,
  Sparkles,
  Trophy,
  FolderPlus,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Building,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  FileText,
  LayoutGrid,
  Table,
  Medal,
  Cloud,
  Loader2,
  Database
} from 'lucide-react';
import { getFallbackCriteria, DRIVE_LOGO_FOLDER_ID } from '../services/apiService';
import { getTeamInitials } from '../utils/initials';

interface AdminViewProps {
  event: EventModel;
  events?: EventModel[];
  categories: CategoryModel[];
  teams: TeamModel[];
  users: User[];
  juryScores: JuryScore[];
  publicVotes: PublicVote[];
  currentUser: User | null;
  onOpenPrintReport: (categoryId: string, recapData: ScoreRecapItem[], weights: { jury: number; public: number }) => void;
  onRefreshData: () => void;
  onSelectEvent?: (eventId: string) => void;
  reportConfig?: ReportConfig;
  onUpdateReportConfig?: (newConfig: ReportConfig) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  event,
  events = [],
  categories,
  teams,
  users,
  juryScores,
  publicVotes,
  currentUser,
  onOpenPrintReport,
  onRefreshData,
  onSelectEvent,
  reportConfig: initialReportConfig,
  onUpdateReportConfig
}) => {
  const [activeTab, setActiveTab] = useState<'subevent' | 'kalkulasi' | 'tabulasi' | 'voting' | 'aturan' | 'manajemen'>('subevent');

  // Report configuration (Kepala Sekolah, Ketua Panitia, Logo Kegiatan Kiri & Logo Sekolah Kanan)
  const [reportConfig, setReportConfig] = useState<ReportConfig>(() => {
    return initialReportConfig || apiService.getReportConfig();
  });
  const [showReportConfigSection, setShowReportConfigSection] = useState(true);

  // View mode for Klasemen & Rekapitulasi: 'card' (Card View, default for mobile) or 'table' (Tabular View)
  const [recapViewMode, setRecapViewMode] = useState<'card' | 'table'>('card');

  React.useEffect(() => {
    if (initialReportConfig) {
      setReportConfig(initialReportConfig);
    }
  }, [initialReportConfig]);

  const availableEvents = useMemo(() => {
    if (events && events.length > 0) return events;
    return [event];
  }, [events, event]);

  // Selected sub-event in Admin Panel
  const [selectedAdminSubEventId, setSelectedAdminSubEventId] = useState<string>(event.id_event);

  const currentAdminSubEvent = useMemo(() => {
    return availableEvents.find(e => e.id_event === selectedAdminSubEventId) || event;
  }, [availableEvents, selectedAdminSubEventId, event]);

  // Filter categories by selected sub-event
  const subEventCategories = useMemo(() => {
    const list = categories.filter(c => c.id_event === selectedAdminSubEventId);
    return list.length > 0 ? list : categories;
  }, [categories, selectedAdminSubEventId]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    subEventCategories[0]?.id_kategori || 'cat-campfire'
  );

  // Teams belonging to the selected sub-event
  const subEventTeams = useMemo(() => {
    const list = teams.filter(t => t.id_event === selectedAdminSubEventId);
    return list.length > 0 ? list : teams;
  }, [teams, selectedAdminSubEventId]);

  // Aggregation weights (default 70% Jury, 30% Public)
  const initialWeights = apiService.getWeights();
  const [juryWeight, setJuryWeight] = useState<number>(initialWeights.jury);
  const [publicWeight, setPublicWeight] = useState<number>(initialWeights.public);

  // Management modals / forms
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddJuryModal, setShowAddJuryModal] = useState(false);
  const [showAddSubEventModal, setShowAddSubEventModal] = useState(false);

  // Edit modals state
  const [editingTeam, setEditingTeam] = useState<TeamModel | null>(null);
  const [editingJury, setEditingJury] = useState<User | null>(null);
  const [editJuryPassword, setEditJuryPassword] = useState<string>('');

  // Deletion confirmation modals state (replaces window.confirm to prevent iframe sandbox suppression)
  const [juryToDelete, setJuryToDelete] = useState<User | null>(null);
  const [isDeletingJury, setIsDeletingJury] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamModel | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  // New team/participant form state
  const [newParticipantEventId, setNewParticipantEventId] = useState<string>(event.id_event);
  const [newParticipantType, setNewParticipantType] = useState<'Group' | 'Individu'>('Group');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamGender, setNewTeamGender] = useState<'Putra' | 'Putri'>('Putra');
  const [newTeamClass, setNewTeamClass] = useState('');
  const [newTeamMotto, setNewTeamMotto] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState('');

  // New sub-event form state
  const [newSubEventName, setNewSubEventName] = useState('');
  const [newSubEventCode, setNewSubEventCode] = useState('');
  const [newSubEventDesc, setNewSubEventDesc] = useState('');
  const [newSubEventYear, setNewSubEventYear] = useState('2026');
  const [newSubEventType, setNewSubEventType] = useState<EventParticipantType>('Group');
  const [newSubEventDeadline, setNewSubEventDeadline] = useState('2026-11-30T23:59');

  // Deadline editing state per subevent: subeventId -> local ISO string
  const [deadlinesDraft, setDeadlinesDraft] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    availableEvents.forEach(ev => {
      if (ev.batas_waktu) {
        map[ev.id_event] = ev.batas_waktu.slice(0, 16);
      } else {
        map[ev.id_event] = '2026-11-30T23:59';
      }
    });
    return map;
  });

  // New jury form state
  const [newJuryName, setNewJuryName] = useState('');
  const [newJuryUsername, setNewJuryUsername] = useState('');
  const [newJuryPassword, setNewJuryPassword] = useState('');
  const [newJurySpecialty, setNewJurySpecialty] = useState('Dewan Juri Khusus');
  const [isSubmittingJury, setIsSubmittingJury] = useState(false);
  const [juryFormError, setJuryFormError] = useState<string | null>(null);

  // Criteria & Questions management state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestionValue, setEditingQuestionValue] = useState('');
  const [isSavingCriteria, setIsSavingCriteria] = useState(false);
  const [isUploadingLogoKegiatan, setIsUploadingLogoKegiatan] = useState(false);
  const [isUploadingLogoSekolah, setIsUploadingLogoSekolah] = useState(false);
  const [isSavingReportConfig, setIsSavingReportConfig] = useState(false);
  const [isUploadLogoModalOpen, setIsUploadLogoModalOpen] = useState(false);
  const [uploadLogoTargetPos, setUploadLogoTargetPos] = useState<'kiri_sekolah' | 'kanan_kegiatan'>('kanan_kegiatan');
  const [uploadLogoSuggestedName, setUploadLogoSuggestedName] = useState('');
  const [uploadedLogosList, setUploadedLogosList] = useState<UploadedLogo[]>(() => {
    const list = apiService.getUploadedLogos();
    return Array.isArray(list) ? list.filter((l): l is UploadedLogo => Boolean(l && l.url && typeof l.url === 'string')) : [];
  });
  const [confirmDeleteLogoId, setConfirmDeleteLogoId] = useState<string | null>(null);

  // Pustaka Logo: Murni hanya menampilkan logo hasil unggahan dari Google Drive (tidak ada logo preset dummy)

  // Feedback banner
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cabang Lomba (Category) management modals and form state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryModel | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryModel | null>(null);
  const [isSyncingCategory, setIsSyncingCategory] = useState(false);

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('Pentas Seni');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatEventId, setNewCatEventId] = useState(selectedAdminSubEventId);
  const [newCatParticipantType, setNewCatParticipantType] = useState<'Group' | 'Individu'>('Group');
  const [newCatAssessmentType, setNewCatAssessmentType] = useState<AssessmentType>('all');
  const [newCatVotesRequired, setNewCatVotesRequired] = useState<number>(2);
  const [newCatIconName, setNewCatIconName] = useState('Flame');
  const [newCatCriteriaText, setNewCatCriteriaText] = useState(
    'Penguasaan materi & penampilan\nKekompakan & kedisiplinan\nKreativitas & originalitas'
  );
  const [newCatAssignedJuries, setNewCatAssignedJuries] = useState<string[]>([]);
  const [isPurging, setIsPurging] = useState(false);

  const activeCategory = subEventCategories.find(c => c.id_kategori === selectedCategoryId) || subEventCategories[0] || categories[0];
  const juryUsers = users.filter(u => u.role === 'juri');
  const currentVotesRequired = activeCategory?.votes_required || 1;

  // Calculate current category recap
  const recapData = apiService.calculateRecap(selectedCategoryId, juryWeight, publicWeight);

  const handleUpdateWeight = (newJuryW: number) => {
    const clampedJury = Math.max(0, Math.min(100, newJuryW));
    const clampedPub = 100 - clampedJury;
    setJuryWeight(clampedJury);
    setPublicWeight(clampedPub);
    apiService.updateWeights(clampedJury, clampedPub);
  };

  const handleActivateSubEvent = (eventId: string) => {
    const res = apiService.setActiveEvent(eventId);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      onRefreshData();
      if (onSelectEvent) onSelectEvent(eventId);
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
    }
  };

  const handleToggleSubEventStatus = async (eventId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const res = await apiService.toggleEventStatus(eventId, newStatus);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      await onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  const handleSaveDeadline = (eventId: string) => {
    const dl = deadlinesDraft[eventId];
    if (!dl) return;
    const res = apiService.updateEventDeadline(eventId, dl);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
    }
  };

  const handleAddQuickTime = (eventId: string, hoursToAdd: number) => {
    const currentStr = deadlinesDraft[eventId] || new Date().toISOString().slice(0, 16);
    const date = new Date(currentStr);
    date.setHours(date.getHours() + hoursToAdd);
    const newStr = date.toISOString().slice(0, 16);
    setDeadlinesDraft(prev => ({ ...prev, [eventId]: newStr }));
    const res = apiService.updateEventDeadline(eventId, newStr);
    if (res.success) {
      setBannerMsg({ type: 'success', text: `Batas waktu ditambah +${hoursToAdd} jam.` });
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
    }
  };

  const handleCreateSubEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEventName || !newSubEventCode) return;

    const res = apiService.addEvent({
      nama_event: newSubEventName.trim(),
      kode_event: newSubEventCode.trim(),
      deskripsi: newSubEventDesc.trim() || `Event ${newSubEventName} SMPIT Pondok Duta`,
      tahun: newSubEventYear.trim() || '2026',
      status_aktif: true,
      batas_waktu: newSubEventDeadline,
      tipe_peserta: newSubEventType
    });

    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setShowAddSubEventModal(false);
      setNewSubEventName('');
      setNewSubEventCode('');
      setNewSubEventDesc('');
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  const handleCreateParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamClass) return;

    const res = apiService.addTeam({
      id_event: newParticipantEventId,
      nama_regu: newTeamName.trim(),
      tipe_partisipasi: newParticipantType,
      kategori_regu: newTeamGender,
      kelas_pangkalan: newTeamClass.trim(),
      motto: newTeamMotto.trim() || 'Kompak dan Berkarakter',
      ketua_regu: newTeamLeader.trim() || (newParticipantType === 'Individu' ? 'Pembimbing' : 'Ketua Regu')
    });

    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setShowAddTeamModal(false);
      setNewTeamName('');
      setNewTeamClass('');
      setNewTeamMotto('');
      setNewTeamLeader('');
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
    }
  };

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    const res = apiService.updateTeam(editingTeam);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setEditingTeam(null);
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
    }
  };

  const handleDeleteTeam = (team: TeamModel) => {
    setTeamToDelete(team);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    setIsDeletingTeam(true);
    try {
      const res = apiService.deleteTeam(teamToDelete.id_team);
      if (res.success) {
        setBannerMsg({ type: 'success', text: res.message });
        setTeamToDelete(null);
        onRefreshData();
        setTimeout(() => setBannerMsg(null), 3500);
      } else {
        setBannerMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setBannerMsg({ type: 'error', text: err.message || 'Gagal menghapus data peserta' });
    } finally {
      setIsDeletingTeam(false);
    }
  };

  const handleCreateJury = async (e: React.FormEvent) => {
    e.preventDefault();
    setJuryFormError(null);
    if (!newJuryName.trim()) {
      setJuryFormError('Nama lengkap & gelar wajib diisi.');
      return;
    }
    if (!newJuryUsername.trim()) {
      setJuryFormError('Username wajib diisi.');
      return;
    }
    if (!newJuryPassword || newJuryPassword.trim().length < 4) {
      setJuryFormError('Password juri minimal 4 karakter.');
      return;
    }

    setIsSubmittingJury(true);
    try {
      const res = await apiService.addJury({
        nama: newJuryName.trim(),
        username: newJuryUsername.trim(),
        password: newJuryPassword.trim(),
        jurySpecialty: newJurySpecialty.trim()
      });

      if (res.success) {
        setBannerMsg({ type: 'success', text: res.message });
        setShowAddJuryModal(false);
        setNewJuryName('');
        setNewJuryUsername('');
        setNewJuryPassword('');
        setNewJurySpecialty('Dewan Juri Khusus');
        setJuryFormError(null);
        await onRefreshData();
        setTimeout(() => setBannerMsg(null), 3500);
      } else {
        setJuryFormError(res.message);
        setBannerMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setJuryFormError(err.message || 'Terjadi gangguan koneksi saat menyimpan akun juri.');
    } finally {
      setIsSubmittingJury(false);
    }
  };

  const handleUpdateJury = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJury) return;
    setJuryFormError(null);

    setIsSubmittingJury(true);
    try {
      const res = await apiService.updateJury({
        id: editingJury.id,
        nama: editingJury.nama,
        username: editingJury.username,
        password: editJuryPassword,
        jurySpecialty: editingJury.jurySpecialty || 'Dewan Juri Khusus'
      });

      if (res.success) {
        setBannerMsg({ type: 'success', text: res.message });
        setEditingJury(null);
        setEditJuryPassword('');
        setJuryFormError(null);
        await onRefreshData();
        setTimeout(() => setBannerMsg(null), 3500);
      } else {
        setJuryFormError(res.message);
        setBannerMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setJuryFormError(err.message || 'Terjadi gangguan saat memperbarui data juri.');
    } finally {
      setIsSubmittingJury(false);
    }
  };

  const handleDeleteJury = (jury: User) => {
    setJuryToDelete(jury);
  };

  const confirmDeleteJury = async () => {
    if (!juryToDelete) return;
    setIsDeletingJury(true);
    try {
      const res = await apiService.deleteJury(juryToDelete.id, juryToDelete.username, juryToDelete.nama);
      if (res.success) {
        setBannerMsg({ type: 'success', text: res.message });
        setJuryToDelete(null);
        await onRefreshData();
        setTimeout(() => setBannerMsg(null), 3500);
      } else {
        setBannerMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setBannerMsg({ type: 'error', text: err.message || 'Gagal menghapus akun dewan juri' });
    } finally {
      setIsDeletingJury(false);
    }
  };

  // =========================================================================
  // CABANG LOMBA (CATEGORY) HANDLERS
  // =========================================================================
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setBannerMsg({ type: 'error', text: 'Nama Cabang Lomba wajib diisi.' });
      return;
    }

    const lines = newCatCriteriaText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const kriteria = lines.length > 0 ? lines : [
      'Penguasaan materi & penampilan',
      'Kerapian & kedisiplinan',
      'Kreativitas & originalitas'
    ];

    const targetEventId = newCatEventId || selectedAdminSubEventId;
    const res = apiService.addCategory({
      id_event: targetEventId,
      nama_kategori: newCatName.trim(),
      deskripsi: newCatDesc.trim() || `Cabang lomba ${newCatName.trim()} SMPIT Pondok Duta`,
      tipe: newCatType || 'Umum',
      tipe_peserta: newCatParticipantType,
      assessment_type: newCatAssessmentType,
      votes_required: newCatAssessmentType === 'jury_only' ? 1 : newCatVotesRequired,
      iconName: newCatIconName || 'Flame',
      kriteria,
      assigned_juries: newCatAssessmentType === 'public_only' ? [] : newCatAssignedJuries
    });

    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setShowAddCategoryModal(false);
      setNewCatName('');
      setNewCatDesc('');
      setNewCatAssignedJuries([]);
      if (res.category) {
        setSelectedCategoryId(res.category.id_kategori);
      }
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
    }
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editingCategory.nama_kategori.trim()) {
      setBannerMsg({ type: 'error', text: 'Nama Cabang Lomba tidak boleh kosong.' });
      return;
    }

    const res = apiService.updateCategory(editingCategory);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setEditingCategory(null);
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const res = await apiService.deleteCategory(
      categoryToDelete.id_kategori,
      categoryToDelete.nama_kategori,
      categoryToDelete.id_event
    );
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      // If deleted category was currently selected, select another category in the event
      if (selectedCategoryId === categoryToDelete.id_kategori) {
        const remaining = categories.filter(
          c => c.id_event === categoryToDelete.id_event && c.id_kategori !== categoryToDelete.id_kategori
        );
        if (remaining.length > 0) {
          setSelectedCategoryId(remaining[0].id_kategori);
        }
      }
      setCategoryToDelete(null);
      await onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
      setCategoryToDelete(null);
      setTimeout(() => setBannerMsg(null), 4000);
    }
  };

  const handleSyncCategoryWithCloud = async () => {
    setIsSyncingCategory(true);
    try {
      const res = await apiService.syncFromDatabase();
      if (res.success) {
        setBannerMsg({ type: 'success', text: 'Data cabang lomba berhasil disinkronkan langsung dari Google Sheets!' });
        await onRefreshData();
      } else {
        setBannerMsg({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setBannerMsg({ type: 'error', text: 'Gagal sinkronisasi database: ' + e.message });
    } finally {
      setIsSyncingCategory(false);
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  const handlePurgeStaleCategory = async (catName: string, catId: string = 'cat-chef') => {
    const res = await apiService.purgeCategoryFromDatabase(catId, catName, selectedAdminSubEventId);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      await onRefreshData();
      setTimeout(() => setBannerMsg(null), 4000);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
    }
  };

  // Update vote quota per account
  const handleSetVoteQuota = (quota: number) => {
    const res = apiService.updateCategoryVoteQuota(selectedCategoryId, quota);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  // Add a new question to the jury criteria
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || isSavingCriteria) return;

    setIsSavingCriteria(true);
    const currentCriteria = activeCategory?.kriteria || [];
    const updated = [...currentCriteria, newQuestionText.trim()];
    const res = await apiService.updateCategoryCriteria(selectedCategoryId, updated);
    setIsSavingCriteria(false);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setNewQuestionText('');
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  // Delete a question from jury criteria
  const handleDeleteQuestion = async (indexToDelete: number) => {
    if (isSavingCriteria) return;
    const currentCriteria = activeCategory?.kriteria || [];
    if (currentCriteria.length <= 1) {
      setBannerMsg({ type: 'error', text: 'Kategori harus memiliki minimal 1 kriteria pertanyaan penilaian.' });
      setTimeout(() => setBannerMsg(null), 3000);
      return;
    }
    setIsSavingCriteria(true);
    const updated = currentCriteria.filter((_, idx) => idx !== indexToDelete);
    const res = await apiService.updateCategoryCriteria(selectedCategoryId, updated);
    setIsSavingCriteria(false);
    if (res.success) {
      setBannerMsg({ type: 'success', text: 'Kriteria pertanyaan berhasil dihapus dan diperbarui di Google Sheets.' });
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  // Save edited question
  const handleSaveEditQuestion = async (indexToEdit: number) => {
    if (!editingQuestionValue.trim() || isSavingCriteria) return;
    setIsSavingCriteria(true);
    const currentCriteria = activeCategory?.kriteria || [];
    const updated = [...currentCriteria];
    updated[indexToEdit] = editingQuestionValue.trim();
    const res = await apiService.updateCategoryCriteria(selectedCategoryId, updated);
    setIsSavingCriteria(false);
    if (res.success) {
      setBannerMsg({ type: 'success', text: 'Kriteria pertanyaan berhasil diperbarui dan disinkronkan ke Google Sheets.' });
      setEditingQuestionIndex(null);
      setEditingQuestionValue('');
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  // Load default criteria if 0 or reset requested
  const handleLoadDefaultCriteria = async () => {
    if (isSavingCriteria) return;
    setIsSavingCriteria(true);
    const fallback = getFallbackCriteria(selectedCategoryId, activeCategory?.nama_kategori || '');
    const res = await apiService.updateCategoryCriteria(selectedCategoryId, fallback);
    setIsSavingCriteria(false);
    if (res.success) {
      setBannerMsg({ type: 'success', text: `Standar kriteria penilaian (${fallback.length} pertanyaan) berhasil dimuat & disimpan permanen ke Google Sheets!` });
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  // Export CSV of current recap
  const handleExportCSV = () => {
    const headers = ['Rank', 'Nama Peserta/Regu', 'Tipe', 'Pangkalan/Kelas', 'Rerata Juri (1-5)', 'Skor Juri (100)', 'Vote Publik', 'Persentase Vote', 'Nilai Akhir'];
    const rows = recapData.map(r => [
      r.rank,
      `"${r.team.nama_regu}"`,
      r.team.tipe_partisipasi || 'Group',
      `"${r.team.kelas_pangkalan}"`,
      r.averageJuryScore1to5,
      r.convertedJuryScore100,
      r.publicVoteCount,
      `${r.publicVotePercentage}%`,
      r.finalWeightedScore
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_${activeCategory.nama_kategori.replace(/\s+/g, '_')}_SMPIT_PD.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDeadlineDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Report Config Handlers (Kepala Sekolah, Ketua Panitia, Logo Kegiatan Kiri & Logo Sekolah Kanan)
  const handleSaveReportConfig = async () => {
    setIsSavingReportConfig(true);
    const res = await apiService.saveReportConfig(reportConfig);
    setIsSavingReportConfig(false);
    onUpdateReportConfig?.(reportConfig);
    setBannerMsg({ type: 'success', text: res.message });
    setTimeout(() => setBannerMsg(null), 3500);
  };

  const handleResetReportConfig = async () => {
    const defaultConfig: ReportConfig = {
      kepalaSekolah: {
        nama: "Drs. H. Ahmad Syafi'i, M.Pd",
        jabatan: "Kepala SMPIT Pondok Duta / Ka. Mabigus",
        nip: "NIP. 19720815 199802 1 001"
      },
      ketuaPanitia: {
        nama: "Kak Muhammad Ilham, S.Pd",
        jabatan: "Ketua Panitia Pelaksana",
        nip: "NIP. 19850412 201101 1 003"
      },
      titimangsaKota: "Depok",
      logoSekolah: LOGO_SEKOLAH_PONDOK_DUTA_SVG,
      logoSekolahType: 'pondok_duta',
      logoKegiatan: LOGO_PRAMUKA_SVG,
      logoKegiatanType: 'pramuka'
    };
    setReportConfig(defaultConfig);
    await apiService.saveReportConfig(defaultConfig);
    onUpdateReportConfig?.(defaultConfig);
    setBannerMsg({ type: 'success', text: 'Pengaturan Lembar Rekap dikembalikan ke bawaan resmi SMPIT Pondok Duta & tersimpan di Google Sheets.' });
    setTimeout(() => setBannerMsg(null), 3000);
  };

  const handleSelectPresetKegiatan = async (type: string, svg: string) => {
    const updated: ReportConfig = { ...reportConfig, logoKegiatan: svg, logoKegiatanType: type };
    setReportConfig(updated);
    await apiService.saveReportConfig(updated);
    onUpdateReportConfig?.(updated);
    setBannerMsg({ type: 'success', text: `Preset Logo Kegiatan (${type.toUpperCase()}) dipilih & tersimpan di cloud.` });
    setTimeout(() => setBannerMsg(null), 2500);
  };

  const handleSelectPresetSekolah = async (type: string, svg: string) => {
    const updated: ReportConfig = { ...reportConfig, logoSekolah: svg, logoSekolahType: type };
    setReportConfig(updated);
    await apiService.saveReportConfig(updated);
    onUpdateReportConfig?.(updated);
    setBannerMsg({ type: 'success', text: `Preset Logo Sekolah (${type.toUpperCase()}) dipilih & tersimpan di cloud.` });
    setTimeout(() => setBannerMsg(null), 2500);
  };

  const handleOpenUploadModal = (targetPos: 'kiri_sekolah' | 'kanan_kegiatan', defaultName: string = '') => {
    setUploadLogoTargetPos(targetPos);
    setUploadLogoSuggestedName(defaultName);
    setIsUploadLogoModalOpen(true);
  };

  const handleLogoModalUploaded = (newLogo: UploadedLogo, targetPos: 'kiri_sekolah' | 'kanan_kegiatan', setAsHeader?: boolean) => {
    const updatedLogos = [newLogo, ...uploadedLogosList.filter(l => l.id !== newLogo.id && l.name !== newLogo.name)];
    setUploadedLogosList(updatedLogos);

    let updatedConfig: ReportConfig;
    if (targetPos === 'kiri_sekolah') {
      updatedConfig = {
        ...reportConfig,
        logoSekolah: newLogo.url,
        logoSekolahType: 'custom',
        uploadedLogos: updatedLogos
      };
    } else {
      updatedConfig = {
        ...reportConfig,
        logoKegiatan: newLogo.url,
        logoKegiatanType: 'custom',
        uploadedLogos: updatedLogos
      };
    }

    if (setAsHeader) {
      updatedConfig.logoAplikasiHeader = newLogo.url;
    }

    setReportConfig(updatedConfig);
    apiService.saveReportConfig(updatedConfig);
    onUpdateReportConfig?.(updatedConfig);
    setBannerMsg({
      type: 'success',
      text: `Logo "${newLogo.name}" berhasil diunggah ke Google Drive dan langsung diterapkan${setAsHeader ? ' di Kop dan Header Website' : ''}!`
    });
    setTimeout(() => setBannerMsg(null), 3500);
  };

  const handleApplyLibraryLogo = async (logo: UploadedLogo, targetPos: 'kiri_sekolah' | 'kanan_kegiatan' | 'header_app') => {
    if (!logo || !logo.url) return;
    if (targetPos === 'header_app') {
      const isAlreadyActive = reportConfig.logoAplikasiHeader === logo.url;
      let updated: ReportConfig;
      if (isAlreadyActive) {
        // Toggle off: hapus logo kustom header, kembali ke ikon api bawaan
        const { logoAplikasiHeader: _, ...rest } = reportConfig;
        updated = {
          ...rest,
          logoAplikasiHeader: undefined
        };
        setBannerMsg({ type: 'success', text: `Centang dilepas. Logo Aplikasi di Header Website dikembalikan ke ikon bawaan.` });
      } else {
        // Toggle on: pasang logo ini di Header Website
        updated = {
          ...reportConfig,
          logoAplikasiHeader: logo.url
        };
        setBannerMsg({ type: 'success', text: `Logo "${logo.name}" berhasil diterapkan sebagai Logo Aplikasi di Header Website!` });
      }
      setReportConfig(updated);
      await apiService.saveReportConfig(updated);
      onUpdateReportConfig?.(updated);
      setTimeout(() => setBannerMsg(null), 3000);
      return;
    }

    if (targetPos === 'kiri_sekolah') {
      const isAlreadyActive = reportConfig.logoSekolah === logo.url;
      let updated: ReportConfig;
      if (isAlreadyActive) {
        // Toggle off: kembalikan ke preset sekolah bawaan
        updated = {
          ...reportConfig,
          logoSekolah: LOGO_SEKOLAH_PONDOK_DUTA_SVG,
          logoSekolahType: 'pondok_duta'
        };
        setBannerMsg({ type: 'success', text: `Centang dilepas. Logo Kiri dikembalikan ke Logo Bawaan SMPIT Pondok Duta.` });
      } else {
        // Toggle on: terapkan logo ini
        updated = {
          ...reportConfig,
          logoSekolah: logo.url,
          logoSekolahType: 'custom'
        };
        setBannerMsg({ type: 'success', text: `Logo Sekolah diganti ke "${logo.name}" (Kiri Kop).` });
      }
      setReportConfig(updated);
      await apiService.saveReportConfig(updated);
      onUpdateReportConfig?.(updated);
    } else {
      const isAlreadyActive = reportConfig.logoKegiatan === logo.url;
      let updated: ReportConfig;
      if (isAlreadyActive) {
        // Toggle off: kembalikan ke preset kegiatan bawaan (Pramuka)
        updated = {
          ...reportConfig,
          logoKegiatan: LOGO_PRAMUKA_SVG,
          logoKegiatanType: 'pramuka'
        };
        setBannerMsg({ type: 'success', text: `Centang dilepas. Logo Kanan dikembalikan ke Logo Bawaan Kegiatan (Pramuka).` });
      } else {
        // Toggle on: terapkan logo ini
        updated = {
          ...reportConfig,
          logoKegiatan: logo.url,
          logoKegiatanType: 'custom'
        };
        setBannerMsg({ type: 'success', text: `Logo Kegiatan diganti ke "${logo.name}" (Kanan Kop).` });
      }
      setReportConfig(updated);
      await apiService.saveReportConfig(updated);
      onUpdateReportConfig?.(updated);
    }
    setTimeout(() => setBannerMsg(null), 3000);
  };

  const handleConfirmDeleteLogo = async (logo: UploadedLogo) => {
    if (!logo || !logo.id) return;
    await apiService.deleteUploadedLogo(logo.id);
    const updated = uploadedLogosList.filter(l => l.id !== logo.id);
    setUploadedLogosList(updated);

    // Jika logo yang dihapus sedang terpilih di kop kiri, kanan, atau header, reset
    let needConfigUpdate = false;
    const newConfig = { ...reportConfig, uploadedLogos: updated };
    if (reportConfig.logoSekolah === logo.url) {
      newConfig.logoSekolah = LOGO_SEKOLAH_PONDOK_DUTA_SVG;
      newConfig.logoSekolahType = 'pondok_duta';
      needConfigUpdate = true;
    }
    if (reportConfig.logoKegiatan === logo.url) {
      newConfig.logoKegiatan = LOGO_PRAMUKA_SVG;
      newConfig.logoKegiatanType = 'pramuka';
      needConfigUpdate = true;
    }
    if (reportConfig.logoAplikasiHeader === logo.url) {
      newConfig.logoAplikasiHeader = undefined;
      needConfigUpdate = true;
    }

    if (needConfigUpdate) {
      setReportConfig(newConfig);
      await apiService.saveReportConfig(newConfig);
      onUpdateReportConfig?.(newConfig);
    }

    setConfirmDeleteLogoId(null);
    setBannerMsg({ type: 'success', text: `Logo "${logo.name}" telah dihapus dari pustaka tersimpan.` });
    setTimeout(() => setBannerMsg(null), 2500);
  };

  return (
    <div className="space-y-4 pb-2">
      {/* Top Banner Alert */}
      {bannerMsg && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{bannerMsg.text}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-xs font-semibold underline">
            Tutup
          </button>
        </div>
      )}

      {/* Admin Header with Active Sub-Event Highlight */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Panel Kontrol Administrator — Duta Evoting</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Manajemen Sistem & Rekapitulasi Terpadu
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              SMPIT Pondok Duta · Kelola Event, pembobotan nilai, batasan hak suara, dan form dewan juri.
            </p>
          </div>

          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <div className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">
                Event Utama di Aplikasi:
              </div>
              <div className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <span>{event.nama_event}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  event.status_aktif ? 'bg-emerald-800 text-amber-300' : 'bg-rose-800 text-white'
                }`}>
                  {event.status_aktif ? 'DIBUKA' : 'DITUTUP'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('subevent')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'subevent'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Event & Batas Waktu</span>
          </button>

          <button
            onClick={() => setActiveTab('kalkulasi')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'kalkulasi'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Kalkulasi & Rekapitulasi</span>
          </button>

          <button
            onClick={() => setActiveTab('aturan')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'aturan'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Cabang Lomba & Aturan</span>
          </button>

          <button
            onClick={() => setActiveTab('tabulasi')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'tabulasi'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Tabulasi Dewan Juri</span>
          </button>

          <button
            onClick={() => setActiveTab('voting')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'voting'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Rekap Voting Publik</span>
          </button>

          <button
            onClick={() => setActiveTab('manajemen')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'manajemen'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Peserta & Akun Juri</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MANAJEMEN SUB-EVENT, AKTIVASI, BUKA/TUTUP & BATAS WAKTU */}
      {/* ========================================================================= */}
      {activeTab === 'subevent' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pilih & Atur Event (Status Buka / Kunci & Batas Waktu)
              </h3>
              <p className="text-xs text-slate-500">
                Aturan Tampilan Pemilih Bebas: Event yang <strong>DIKUNCI</strong> otomatis di-<strong>HIDE</strong> dari menu. Jika <strong>batas waktu habis namun belum dikunci</strong>, event tetap muncul di menu dengan status <strong>Close</strong> (voting dinonaktifkan).
              </p>
            </div>
            <button
              onClick={() => setShowAddSubEventModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Event</span>
            </button>
          </div>

          {/* Cards for each sub-event */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {availableEvents.map(ev => {
              const isOfficialActive = ev.status_aktif;
              const isExpired = apiService.isEventExpired(ev);
              const draftDeadline = deadlinesDraft[ev.id_event] || (ev.batas_waktu ? ev.batas_waktu.slice(0, 16) : '');

              return (
                <div
                  key={ev.id_event}
                  className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs ${
                    isOfficialActive
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'border-slate-300 bg-slate-50/40 opacity-95'
                  }`}
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                        {ev.kode_event || ev.id_event}
                      </span>
                      {isOfficialActive ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>DIBUKA (AKTIF)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>DITUTUP (NON-AKTIF)</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mb-1">{ev.nama_event}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ev.deskripsi}</p>

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        Tipe: <strong>{ev.tipe_peserta || 'Group'}</strong>
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        Tahun: <strong>{ev.tahun || '2026'}</strong>
                      </span>
                    </div>

                    {/* Deadline Editor Section */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Batas Waktu Vote & Juri:</span>
                        </label>
                        {isExpired ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Terkunci (Expired)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Masih Dibuka
                          </span>
                        )}
                      </div>

                      <input
                        type="datetime-local"
                        value={draftDeadline}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDeadlinesDraft(prev => ({ ...prev, [ev.id_event]: val }));
                        }}
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono bg-white"
                      />

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Status: {formatDeadlineDate(ev.batas_waktu)}</span>
                        <button
                          onClick={() => handleSaveDeadline(ev.id_event)}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                        >
                          Simpan Batas
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400">Tambah waktu:</span>
                        <button
                          onClick={() => handleAddQuickTime(ev.id_event, 1)}
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                        >
                          +1 Jam
                        </button>
                        <button
                          onClick={() => handleAddQuickTime(ev.id_event, 12)}
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                        >
                          +12 Jam
                        </button>
                        <button
                          onClick={() => handleAddQuickTime(ev.id_event, 24)}
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                        >
                          +1 Hari
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Activation and Close/Open Controls */}
                  <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                    {/* Buka / Tutup Sub Event Toggle Button */}
                    <button
                      onClick={() => handleToggleSubEventStatus(ev.id_event, isOfficialActive)}
                      className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 border ${
                        isOfficialActive
                          ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {isOfficialActive ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tutup Event Ini (Kunci Vote & Juri)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Buka Kembali Event Ini</span>
                        </>
                      )}
                    </button>

                    {/* Set as Active Main Sub Event */}
                    {!isOfficialActive && (
                      <button
                        onClick={() => handleActivateSubEvent(ev.id_event)}
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-300" />
                        <span>Buka & Jadikan Event Utama</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category selector for tabs: kalkulasi, tabulasi, voting, aturan */}
      {activeTab !== 'subevent' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide mr-1">
              Pilih Event:
            </span>
            <select
              value={selectedAdminSubEventId}
              onChange={(e) => {
                setSelectedAdminSubEventId(e.target.value);
              }}
              className="p-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50"
            >
              {availableEvents.map(ev => (
                <option key={ev.id_event} value={ev.id_event}>
                  {ev.kode_event || ev.nama_event} {!ev.status_aktif ? '(DITUTUP)' : '(DIBUKA)'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide mr-1">
              Pilih Cabang Lomba:
            </span>
            {subEventCategories.map(c => (
              <button
                key={c.id_kategori}
                onClick={() => setSelectedCategoryId(c.id_kategori)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedCategoryId === c.id_kategori
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.nama_kategori}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KALKULASI & REKAPITULASI NILAI AKHIR */}
      {/* ========================================================================= */}
      {activeTab === 'kalkulasi' && (
        <div className="space-y-6">
          {/* Formula & Weight Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Formula Pembobotan Skor Akhir (Juri + Publik)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan persentase bobot antara Dewan Juri (Skala 1 - 5 dikonversi ke 100) dan Voting Publik.
                </p>
              </div>

              {/* Slider Controls */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800">Juri: {juryWeight}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={juryWeight}
                    onChange={(e) => handleUpdateWeight(Number(e.target.value))}
                    className="w-32 accent-emerald-800 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-700">Publik: {publicWeight}%</span>
                </div>

                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <button
                    onClick={() => handleUpdateWeight(70)}
                    className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 rounded border border-slate-200 text-slate-700"
                  >
                    70/30 (Default)
                  </button>
                  <button
                    onClick={() => handleUpdateWeight(80)}
                    className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 rounded border border-slate-200 text-slate-700"
                  >
                    80/20
                  </button>
                  <button
                    onClick={() => handleUpdateWeight(100)}
                    className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 rounded border border-slate-200 text-slate-700"
                  >
                    100% Juri
                  </button>
                </div>
              </div>

              {/* Action Buttons: Export & Print */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  onClick={() => onOpenPrintReport(selectedCategoryId, recapData, { jury: juryWeight, public: publicWeight })}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Unduh dokumen Berita Acara Rekapitulasi Resmi format PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Unduh Lembar Rekap PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MENU PENGISIAN NAMA KEPALA SEKOLAH, KETUA PANITIA & LOGO KOP PDF */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
                  <FileText className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      Pengaturan Kop &amp; Pejabat Penandatangan Unduhan PDF
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      Resmi
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Atur logo kegiatan (Kiri Kop), logo sekolah (Kanan Kop), serta nama Kepala Sekolah &amp; Ketua Panitia untuk unduhan PDF.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportConfigSection(!showReportConfigSection)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {showReportConfigSection ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Sembunyikan Menu</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Buka Menu Pengisian</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showReportConfigSection && (
              <div className="p-5 sm:p-6 space-y-6">
                {/* 1. BAGIAN PUSTAKA LOGO KOP REKAPITULASI (KIRI = SEKOLAH, KANAN = KEGIATAN) */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 mb-4 gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-800" />
                        <span>1. Pustaka Logo Kop Rekapitulasi &amp; Header</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {uploadedLogosList.length} Logo Google Drive
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pilih logo untuk <strong>Kiri Kop (Sekolah)</strong>, <strong>Kanan Kop (Kegiatan/Cabang Olahraga)</strong>, atau <strong>Header Website</strong>. Murni menggunakan berkas unggahan Anda di Google Drive.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenUploadModal('kanan_kegiatan', 'Logo Cabang Olahraga')}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-300" />
                        <span>+ Unggah Logo Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* PUSTAKA LOGO TERSIMPAN (MURNI HASIL UNGGAHAN GOOGLE DRIVE) */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-emerald-700" />
                          <span>Daftar Pustaka Logo Hasil Unggahan (Google Drive "Logo dan Laporan")</span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          Klik <strong>"Pilih Kiri"</strong> (Kop Sekolah), <strong>"Pilih Kanan"</strong> (Kop Kegiatan/Cabang Olahraga), atau <strong>"Pilih Header"</strong> (Logo Aplikasi di Header Website). Klik tombol yang aktif untuk melepas centang.
                        </p>
                      </div>
                    </div>

                    {uploadedLogosList.length === 0 ? (
                      <div className="p-8 text-center bg-white border-2 border-dashed border-slate-200 rounded-xl space-y-2.5">
                        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <Cloud className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                          Belum Ada Logo Hasil Unggahan
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Semua logo dummy telah dibersihkan. Silakan klik tombol <strong>"+ Unggah Logo Baru"</strong> di atas untuk mengunggah logo ke Google Drive (Folder ID: <span className="font-mono">{DRIVE_LOGO_FOLDER_ID}</span>).
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenUploadModal('kanan_kegiatan', 'Logo Cabang Olahraga')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer mt-1"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-300" />
                          <span>Unggah Logo Pertama</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {uploadedLogosList.filter((logo): logo is UploadedLogo => Boolean(logo && logo.url)).map((logo) => {
                          const isUsedKanan = reportConfig.logoKegiatan === logo.url;
                          const isUsedKiri = reportConfig.logoSekolah === logo.url;
                          const isUsedHeader = reportConfig.logoAplikasiHeader === logo.url;

                          return (
                            <div
                              key={logo.id}
                              className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-3 shadow-xs transition-all ${
                                isUsedKanan || isUsedKiri || isUsedHeader
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                                <LogoRenderer logo={logo.url} alt={logo.name} className="w-10 h-10 object-contain" />
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="text-xs font-bold text-slate-900 truncate" title={logo.name}>
                                  {logo.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                    Google Drive
                                  </span>
                                  <span className="truncate">{logo.fileName || `${logo.name}.png`}</span>
                                </div>

                                {/* Active Badges */}
                                {(isUsedKiri || isUsedKanan || isUsedHeader) && (
                                  <div className="flex flex-wrap gap-1 text-[9px] pt-0.5">
                                    {isUsedKiri && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                        Kop Kiri
                                      </span>
                                    )}
                                    {isUsedKanan && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                                        Kop Kanan
                                      </span>
                                    )}
                                    {isUsedHeader && (
                                      <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-900 font-bold border border-teal-300">
                                        Header Web
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Pilihan Cekmark / Tombol Aksi */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {/* 1. Kanan Kop (Kegiatan) */}
                                  <button
                                    type="button"
                                    onClick={() => handleApplyLibraryLogo(logo, 'kanan_kegiatan')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                                      isUsedKanan
                                        ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-950'
                                        : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                                    }`}
                                    title={isUsedKanan ? 'Aktif di Kanan Kop. Klik untuk melepas centang.' : 'Terapkan sebagai Logo Kanan (Kegiatan/Cabang Olahraga)'}
                                  >
                                    {isUsedKanan ? '✓ Kanan (Lepas)' : 'Pilih Kanan'}
                                  </button>

                                  {/* 2. Kiri Kop (Sekolah) */}
                                  <button
                                    type="button"
                                    onClick={() => handleApplyLibraryLogo(logo, 'kiri_sekolah')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                                      isUsedKiri
                                        ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-800'
                                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                                    }`}
                                    title={isUsedKiri ? 'Aktif di Kiri Kop. Klik untuk melepas centang.' : 'Terapkan sebagai Logo Kiri (Sekolah)'}
                                  >
                                    {isUsedKiri ? '✓ Kiri (Lepas)' : 'Pilih Kiri'}
                                  </button>

                                  {/* 3. Header Website */}
                                  <button
                                    type="button"
                                    onClick={() => handleApplyLibraryLogo(logo, 'header_app')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                                      isUsedHeader
                                        ? 'bg-teal-700 text-white shadow-xs ring-1 ring-teal-950'
                                        : 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200'
                                    }`}
                                    title={isUsedHeader ? 'Aktif sebagai Logo Header Website. Klik untuk melepas centang.' : 'Terapkan sebagai Logo Aplikasi di Header Website (Navbar)'}
                                  >
                                    {isUsedHeader ? '✓ Header (Lepas)' : 'Pilih Header'}
                                  </button>
                                </div>
                              </div>

                              {confirmDeleteLogoId === logo.id ? (
                                <div className="flex items-center gap-1 shrink-0 animate-in fade-in duration-150">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDeleteLogo(logo)}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                                    title="Hapus permanen dari pustaka"
                                  >
                                    Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteLogoId(null)}
                                    className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-semibold cursor-pointer"
                                    title="Batal"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteLogoId(logo.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Hapus logo dari pustaka"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* MINI LIVE PREVIEW OF KOP */}
                  <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Pratinjau Langsung Kop Rekapitulasi Resmi:
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3 bg-slate-50/70 rounded-lg border border-slate-200">
                      {/* KIRI: Logo Sekolah */}
                      <div className="w-14 h-14 shrink-0 flex items-center justify-center p-0.5 bg-white border border-slate-200 rounded">
                        <LogoRenderer logo={reportConfig.logoSekolah} alt="Logo Sekolah" className="w-12 h-12 object-contain" />
                      </div>

                      {/* TENGAH: Teks Kop */}
                      <div className="flex-1 text-center">
                        <div className="text-[9px] font-bold uppercase text-slate-600">YAYASAN PONDOK DUTA</div>
                        <div className="text-xs sm:text-sm font-extrabold uppercase text-emerald-950">SMP ISLAM TERPADU PONDOK DUTA</div>
                        <div className="text-[10px] font-bold text-slate-800">GUGUS DEPAN GERAKAN PRAMUKA / PANITIA KEGIATAN</div>
                        <div className="text-[8.5px] text-slate-500">Jl. Duta Indah No. 1, Cisalak Pasar, Cimanggis, Kota Depok</div>
                      </div>

                      {/* KANAN: Logo Kegiatan */}
                      <div className="w-14 h-14 shrink-0 flex items-center justify-center p-0.5 bg-white border border-slate-200 rounded">
                        <LogoRenderer logo={reportConfig.logoKegiatan} alt="Logo Kegiatan" className="w-12 h-12 object-contain" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="h-[2px] bg-emerald-950 w-full mb-[1px]"></div>
                      <div className="h-[0.5px] bg-emerald-950 w-full"></div>
                    </div>

                    {/* PRATINJAU LOGO APLIKASI HEADER WEBSITE */}
                    <div className="mt-3 p-3 bg-slate-50/70 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
                          {reportConfig.logoAplikasiHeader ? (
                            <img src={reportConfig.logoAplikasiHeader} alt="Header" className="w-full h-full object-contain" />
                          ) : (
                            <Trophy className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-[11px] font-bold text-slate-900 truncate">
                            Logo Header Website: {reportConfig.logoAplikasiHeader ? 'Logo Kustom Aktif (Background Putih)' : 'Lambang Piala Bawaan (Default)'}
                          </div>
                          <div className="text-[9.5px] text-slate-500 truncate">
                            Ditampilkan pada bilah navigasi website dengan latar belakang putih bersih agar tulisan logo terbaca jelas
                          </div>
                        </div>
                      </div>
                      {reportConfig.logoAplikasiHeader && (
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = { ...reportConfig, logoAplikasiHeader: undefined };
                            setReportConfig(updated);
                            await apiService.saveReportConfig(updated);
                            onUpdateReportConfig?.(updated);
                            setBannerMsg({ type: 'success', text: 'Logo Header Website dikembalikan ke lambang piala bawaan.' });
                            setTimeout(() => setBannerMsg(null), 2500);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer shadow-2xs"
                        >
                          Lepas Header
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. BAGIAN PENGISIAN NAMA KEPALA SEKOLAH & KETUA PANITIA */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 mb-4 gap-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-800" />
                      <span>2. Pengisian Nama Kepala Sekolah &amp; Ketua Panitia (Tanda Tangan)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Nama ini otomatis tertera pada tanda tangan pengesahan bagian bawah PDF
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* KETUA PANITIA (KIRI) */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800">
                          Pihak Kiri: Ketua Panitia Pelaksana
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">(Mengetahui)</span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Nama Lengkap &amp; Gelar Ketua Panitia:
                          </label>
                          <input
                            type="text"
                            value={reportConfig.ketuaPanitia.nama}
                            onChange={(e) => setReportConfig({
                              ...reportConfig,
                              ketuaPanitia: { ...reportConfig.ketuaPanitia, nama: e.target.value }
                            })}
                            placeholder="Contoh: Kak Muhammad Ilham, S.Pd"
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Jabatan / Peran Kepanitiaan:
                          </label>
                          <input
                            type="text"
                            value={reportConfig.ketuaPanitia.jabatan}
                            onChange={(e) => setReportConfig({
                              ...reportConfig,
                              ketuaPanitia: { ...reportConfig.ketuaPanitia, jabatan: e.target.value }
                            })}
                            placeholder="Contoh: Ketua Panitia Pelaksana / Ketua Panitia Duta Camp"
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            NIP / NRP / Nomor Identitas:
                          </label>
                          <input
                            type="text"
                            value={reportConfig.ketuaPanitia.nip}
                            onChange={(e) => setReportConfig({
                              ...reportConfig,
                              ketuaPanitia: { ...reportConfig.ketuaPanitia, nip: e.target.value }
                            })}
                            placeholder="Contoh: NIP. 19850412 201101 1 003"
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* KEPALA SEKOLAH / KA. MABIGUS (KANAN) */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800">
                          Pihak Kanan: Kepala Sekolah / Ka. Mabigus
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">(Mengesahkan)</span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Nama Lengkap &amp; Gelar Kepala Sekolah:
                          </label>
                          <input
                            type="text"
                            value={reportConfig.kepalaSekolah.nama}
                            onChange={(e) => setReportConfig({
                              ...reportConfig,
                              kepalaSekolah: { ...reportConfig.kepalaSekolah, nama: e.target.value }
                            })}
                            placeholder="Contoh: Drs. H. Ahmad Syafi'i, M.Pd"
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Jabatan Resmi:
                          </label>
                          <input
                            type="text"
                            value={reportConfig.kepalaSekolah.jabatan}
                            onChange={(e) => setReportConfig({
                              ...reportConfig,
                              kepalaSekolah: { ...reportConfig.kepalaSekolah, jabatan: e.target.value }
                            })}
                            placeholder="Contoh: Kepala SMPIT Pondok Duta / Ka. Mabigus"
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            NIP / Nomor Identitas:
                          </label>
                          <input
                            type="text"
                            value={reportConfig.kepalaSekolah.nip}
                            onChange={(e) => setReportConfig({
                              ...reportConfig,
                              kepalaSekolah: { ...reportConfig.kepalaSekolah, nip: e.target.value }
                            })}
                            placeholder="Contoh: NIP. 19720815 199802 1 001"
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Titimangsa Kota */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="font-semibold text-slate-700">Kota Titimangsa Tanda Tangan:</span>
                    <input
                      type="text"
                      value={reportConfig.titimangsaKota}
                      onChange={(e) => setReportConfig({ ...reportConfig, titimangsaKota: e.target.value })}
                      placeholder="Depok"
                      className="p-1.5 text-xs border border-slate-300 rounded bg-white font-medium w-36"
                    />
                    <span className="text-[11px] text-slate-500">
                      Format hasil pada PDF: <strong>{reportConfig.titimangsaKota || 'Depok'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </span>
                  </div>
                </div>

                {/* 3. TOMBOL AKSI SIMPAN & PREVIEW */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetReportConfig}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ke Bawaan Resmi</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSavingReportConfig}
                      onClick={handleSaveReportConfig}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-98 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isSavingReportConfig ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan ke Google Sheets...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Simpan Pengaturan Kop &amp; Tanda Tangan</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPrintReport(selectedCategoryId, recapData, { jury: juryWeight, public: publicWeight })}
                      className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-slate-950" />
                      <span>Pratinjau &amp; Unduh PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Full Tabular & Mobile Card Ranking Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Klasemen &amp; Rekapitulasi Nilai Akhir
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {recapData.length} Peserta
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sub-Event: {currentAdminSubEvent.nama_event} · Kategori: {activeCategory.nama_kategori} ·{' '}
                  <span className="font-semibold text-emerald-900">
                    {activeCategory.assessment_type === 'public_only'
                      ? 'Formula: 100% Voting Publik (Vote Bebas Saja)'
                      : activeCategory.assessment_type === 'jury_only'
                      ? 'Formula: 100% Penilaian Dewan Juri (Juri Saja)'
                      : `Formula: Juri ${juryWeight}% + Publik ${publicWeight}% (Multi)`}
                  </span>
                </p>
              </div>

              {/* View Switcher: Card View (Optimal for HP) vs Table View */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRecapViewMode('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    recapViewMode === 'card'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Kartu (Sangat responsif dan rapi di HP)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Model Kartu (HP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecapViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    recapViewMode === 'table'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Lengkap"
                >
                  <Table className="w-3.5 h-3.5 text-slate-600" />
                  <span>Model Tabel</span>
                </button>
              </div>
            </div>

            {/* =================================================================== */}
            {/* 1. MODEL KARTU (CARD VIEW) - SANGAT RAPIH DI HP & TABLET */}
            {/* =================================================================== */}
            {recapViewMode === 'card' && (
              <div className="p-3 sm:p-5 bg-slate-50/60">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {recapData.map((row) => {
                    const isRank1 = row.rank === 1;
                    const isRank2 = row.rank === 2;
                    const isRank3 = row.rank === 3;
                    const isTop3 = row.rank <= 3;

                    return (
                      <div
                        key={row.team.id_team}
                        className={`rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                          isRank1
                            ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 border-amber-300 ring-2 ring-amber-400/20 shadow-md'
                            : isRank2
                            ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100/50 border-slate-300 shadow-sm'
                            : isRank3
                            ? 'bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 border-amber-200/80 shadow-sm'
                            : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Card Top: Rank & Status Juara + Skor Akhir */}
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Rank Badge */}
                              <div
                                className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs ${
                                  isRank1
                                    ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-500'
                                    : isRank2
                                    ? 'bg-slate-200 text-slate-800'
                                    : isRank3
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isRank1 && <Trophy className="w-3.5 h-3.5 text-slate-950 fill-amber-300" />}
                                <span>#{row.rank}</span>
                              </div>

                              {/* Status Penghargaan Badge */}
                              {isRank1 ? (
                                <span className="px-2.5 py-0.5 text-[11px] font-extrabold text-amber-950 bg-amber-100 border border-amber-300 rounded-full flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>JUARA 1</span>
                                </span>
                              ) : isRank2 ? (
                                <span className="px-2 py-0.5 text-[11px] font-bold text-slate-700 bg-slate-200 rounded-full">
                                  JUARA 2
                                </span>
                              ) : isRank3 ? (
                                <span className="px-2 py-0.5 text-[11px] font-bold text-amber-900 bg-amber-100/80 rounded-full">
                                  JUARA 3
                                </span>
                              ) : row.isFavorit ? (
                                <span className="px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full">
                                  JUARA FAVORIT
                                </span>
                              ) : null}
                            </div>

                            {/* Nilai Akhir Card Highlight */}
                            <div className="text-right shrink-0 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                              <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                                Nilai Akhir
                              </span>
                              <span className="text-lg font-black text-emerald-950 font-mono tabular-nums leading-tight">
                                {row.finalWeightedScore.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Team Identity */}
                          <div className="mt-3">
                            <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                              {row.team.nama_regu}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                {row.team.tipe_partisipasi === 'Individu' ? 'Individu' : 'Regu'} {row.team.kategori_regu}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="truncate">{row.team.kelas_pangkalan}</span>
                            </div>
                          </div>

                          {/* Breakdown Nilai: Juri vs Vote Publik Grid */}
                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                            {/* Dewan Juri Box */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase">
                                <span>Dewan Juri</span>
                                <span>Skala 100</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="font-mono text-base font-bold text-slate-900">
                                  {row.convertedJuryScore100.toFixed(2)}
                                </span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  Rata: {row.averageJuryScore1to5.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Dinilai {row.juryCount} Juri
                              </div>
                            </div>

                            {/* Vote Publik Box */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase">
                                <span>Vote Publik</span>
                                <span>{row.publicVotePercentage}%</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="font-mono text-base font-bold text-slate-900">
                                  {row.publicVoteCount}
                                </span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  Suara
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Skor Norm: {row.normalizedPublicScore100.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Formula Weight Contribution Footer */}
                        {activeCategory.assessment_type === 'all' && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <span>
                              Kontribusi: Juri <strong>{((row.convertedJuryScore100 * juryWeight) / 100).toFixed(1)}</strong>
                            </span>
                            <span>+</span>
                            <span>
                              Publik <strong>{((row.normalizedPublicScore100 * publicWeight) / 100).toFixed(1)}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 2. MODEL TABEL (TABULAR VIEW) - BAGI PENGGUNA LAPTOP / DESKTOP */}
            {/* =================================================================== */}
            {recapViewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-14 text-center">Rank</th>
                      <th className="py-3 px-4">Nama Peserta / Regu</th>
                      <th className="py-3 px-4">Pangkalan / Kelas</th>
                      <th className="py-3 px-4 text-right">Rerata Juri (1-5)</th>
                      <th className="py-3 px-4 text-right">Skor Juri (100)</th>
                      <th className="py-3 px-4 text-right">Vote Publik</th>
                      <th className="py-3 px-4 text-right font-bold text-emerald-900">Nilai Akhir</th>
                      <th className="py-3 px-4 text-center">Status Penghargaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recapData.map((row) => (
                      <tr
                        key={row.team.id_team}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          row.rank === 1 ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 tabular-nums">
                          #{row.rank}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {row.team.nama_regu}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {row.team.tipe_partisipasi === 'Individu' ? 'Individu' : 'Regu'} {row.team.kategori_regu}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{row.team.kelas_pangkalan}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {row.averageJuryScore1to5.toFixed(2)}
                          <span className="text-[10px] text-slate-400 block">
                            ({row.juryCount} Juri)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {row.convertedJuryScore100.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {row.publicVoteCount} suara
                          <span className="text-[10px] text-slate-400 block">
                            {row.publicVotePercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-emerald-900 tabular-nums">
                          {row.finalWeightedScore.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.rank === 1 ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-100 rounded">
                              Juara 1
                            </span>
                          ) : row.rank === 2 ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold text-slate-700 bg-slate-200 rounded">
                              Juara 2
                            </span>
                          ) : row.rank === 3 ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold text-amber-900 bg-amber-100/70 rounded">
                              Juara 3
                            </span>
                          ) : row.isFavorit ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 rounded border border-rose-200">
                              Juara Favorit
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TABULASI DEWAN JURI */}
      {/* ========================================================================= */}
      {activeTab === 'tabulasi' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Matrix Penilaian Dewan Juri — {activeCategory.nama_kategori}
            </h3>
            <p className="text-xs text-slate-500">
              Berikut rincian skor angka (skala 1 - 5) yang diberikan masing-masing Dewan Juri kepada setiap peserta.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Peserta / Regu</th>
                    <th className="py-3 px-4">Pangkalan / Kelas</th>
                    {juryUsers.map(jury => (
                      <th key={jury.id} className="py-3 px-4 text-center">
                        <div>{jury.nama}</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {jury.jurySpecialty || 'Juri'}
                        </span>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right font-bold text-emerald-900">Rerata (1-5)</th>
                    <th className="py-3 px-4 text-right font-bold text-emerald-900">Skor Konversi (100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subEventTeams.map(team => {
                    const teamScores = juryScores.filter(
                      s => s.id_kategori === selectedCategoryId && s.id_team === team.id_team
                    );
                    let avg1to5 = 0;
                    if (teamScores.length > 0) {
                      const sum = teamScores.reduce((acc, curr) => acc + curr.skor_1_to_5, 0);
                      avg1to5 = Number((sum / teamScores.length).toFixed(2));
                    }
                    const score100 = Number((avg1to5 * 20).toFixed(2));

                    return (
                      <tr key={team.id_team} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {team.nama_regu}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{team.kelas_pangkalan}</td>
                        {juryUsers.map(jury => {
                          const jScore = teamScores.find(s => s.id_jury === jury.id);
                          return (
                            <td key={jury.id} className="py-3 px-4 text-center font-mono tabular-nums">
                              {jScore ? (
                                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                  {jScore.skor_1_to_5.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {avg1to5 > 0 ? avg1to5.toFixed(2) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-900 tabular-nums">
                          {score100 > 0 ? score100.toFixed(2) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REKAP VOTING PUBLIK */}
      {/* ========================================================================= */}
      {activeTab === 'voting' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Perolehan Suara Voters Bebas — {activeCategory.nama_kategori}
            </h3>
            <p className="text-xs text-slate-500">
              Hasil suara murni dari pemilih terverifikasi (Siswa, Alumni, Guru & Umum) dengan aturan {currentVotesRequired} vote per akun.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subEventTeams.map(t => {
              const votes = publicVotes.filter(
                v => v.id_kategori === selectedCategoryId && v.id_team === t.id_team
              );
              return (
                <div key={t.id_team} className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{t.kategori_regu}</span>
                    <span className="font-mono text-lg font-bold text-emerald-800 tabular-nums">
                      {votes.length} Suara
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{t.nama_regu}</h4>
                  <p className="text-xs text-slate-500">{t.kelas_pangkalan}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CABANG LOMBA, ATURAN VOTE PUBLIK & PERTANYAAN FORM JURI */}
      {/* ========================================================================= */}
      {activeTab === 'aturan' && (
        <div className="space-y-6">
          {/* Section 0: Manajemen Cabang Lomba (Tambah & Hapus Cabang Lomba) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>Daftar Cabang Lomba: {currentAdminSubEvent.kode_event || currentAdminSubEvent.nama_event}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Kelola Cabang Lomba ({subEventCategories.length} Cabang Terdaftar)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tambah cabang lomba baru atau hapus cabang yang tidak diperlombakan. Setiap cabang memiliki aturan hak suara dan kriteria penilaian juri tersendiri.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncCategoryWithCloud}
                  disabled={isSyncingCategory}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                  title="Sinkronkan ulang data cabang lomba langsung dari Database Google Sheets"
                >
                  <Database className={`w-3.5 h-3.5 ${isSyncingCategory ? 'animate-spin' : ''}`} />
                  <span>{isSyncingCategory ? 'Menyinkronkan...' : 'Sinkron Database'}</span>
                </button>

                <button
                  onClick={() => {
                    setNewCatEventId(selectedAdminSubEventId);
                    setShowAddCategoryModal(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl flex items-center gap-2 transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Cabang Lomba</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {subEventCategories.map((c) => {
                const isSelected = selectedCategoryId === c.id_kategori;
                return (
                  <div
                    key={c.id_kategori}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {c.tipe || 'Lomba'} · {c.tipe_peserta || 'Group'}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Sedang Dipilih</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{c.nama_kategori}</span>
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {c.deskripsi}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                        {c.assessment_type === 'public_only' ? (
                          <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <Vote className="w-3 h-3 text-sky-600" />
                            <span>Vote Bebas Saja</span>
                          </span>
                        ) : c.assessment_type === 'jury_only' ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-600" />
                            <span>Juri Saja</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Multi (Vote &amp; Juri)</span>
                          </span>
                        )}

                        {c.assessment_type !== 'jury_only' && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                            Wajib <strong>{c.votes_required || 1} Vote</strong>
                          </span>
                        )}

                        {c.assessment_type !== 'public_only' && (
                          <>
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                              <strong>{c.kriteria?.length || 0} Pertanyaan</strong> Juri
                            </span>
                            <span className="bg-amber-50 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-600 inline shrink-0" />
                              {(!c.assigned_juries || c.assigned_juries.length === 0)
                                ? `Semua Juri (${juryUsers.length})`
                                : `${c.assigned_juries.length} Juri Ditugaskan`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedCategoryId(c.id_kategori)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-emerald-800 bg-emerald-100'
                            : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Sedang Dipilih' : 'Pilih & Atur'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingCategory({
                            ...c,
                            assessment_type: c.assessment_type || 'all',
                            assigned_juries: c.assigned_juries || []
                          })}
                          className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Informasi Cabang Lomba"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Cabang Lomba"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 1: Aturan Jumlah Vote Publik per Akun */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Aturan Vote Publik (Wajib & Ketat)</span>
                  {activeCategory.assessment_type === 'jury_only' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Non-Aktif (Juri Saja)
                    </span>
                  )}
                  {activeCategory.assessment_type === 'public_only' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      Vote Bebas Saja
                    </span>
                  )}
                  {(!activeCategory.assessment_type || activeCategory.assessment_type === 'all') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Multi (Vote & Juri)
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Jumlah Hak Suara Publik per Akun — {activeCategory.nama_kategori}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Admin menetapkan ketentuan jumlah hak suara yang wajib digunakan oleh setiap akun voter. 
                  <strong> Tidak boleh kurang dan tidak boleh lebih.</strong>
                </p>
              </div>

              {activeCategory.assessment_type !== 'jury_only' && (
                <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 text-right shrink-0">
                  <span className="text-[11px] text-emerald-700 font-medium block">Ketentuan Saat Ini:</span>
                  <span className="text-lg font-bold font-mono text-emerald-900">
                    {currentVotesRequired} Suara / Akun
                  </span>
                </div>
              )}
            </div>

            {activeCategory.assessment_type === 'jury_only' ? (
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cabang Lomba Dinilai Khusus Oleh Dewan Juri</p>
                  <p className="text-slate-600 mt-0.5">
                    Kategori ini diatur dengan mode <strong>Juri Saja</strong>. Pemilih publik tidak dapat memberikan vote pada kategori ini. Anda dapat mengubah pengaturan ini melalui menu <strong>Kelola Cabang Lomba &gt; Edit</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Jumlah Vote Wajib per Akun Pemilih untuk Kategori Ini:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isActive = currentVotesRequired === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSetVoteQuota(num)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-700/20'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="text-xl font-extrabold font-mono tabular-nums">{num}</div>
                        <div className="text-[11px] font-semibold mt-0.5">
                          {num === 1 ? '1 Suara' : `${num} Suara Wajib`}
                        </div>
                        <div className={`text-[10px] mt-1 ${isActive ? 'text-amber-300' : 'text-slate-400'}`}>
                          {isActive ? 'Aktif' : 'Terapkan'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pertanyaan Form Dewan Juri */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-700 font-bold uppercase tracking-wider">
                  <ListPlus className="w-4 h-4 text-amber-600" />
                  <span>Kriteria & Form Dewan Juri</span>
                  {activeCategory.assessment_type === 'public_only' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      Non-Aktif (Vote Bebas Saja)
                    </span>
                  )}
                  {activeCategory.assessment_type === 'jury_only' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Juri Saja
                    </span>
                  )}
                  {(!activeCategory.assessment_type || activeCategory.assessment_type === 'all') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Multi (Vote & Juri)
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Daftar Pertanyaan di Form Penilaian — {activeCategory.nama_kategori}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>Admin dapat menambah, mengubah, atau menghapus kriteria pertanyaan penilaian skala 1-5 untuk dewan juri.</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Cloud className="w-3 h-3 text-emerald-600 shrink-0" />
                    Tersimpan di Google Sheets Database
                  </span>
                </p>
              </div>

              <div className="bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200 text-right shrink-0">
                <span className="text-[11px] text-amber-800 font-medium block">Total Pertanyaan:</span>
                <span className="text-lg font-bold font-mono text-amber-950">
                  {activeCategory.kriteria.length} Kriteria
                </span>
              </div>
            </div>

            {activeCategory.assessment_type === 'public_only' && (
              <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cabang Lomba Dinilai Khusus Melalui Vote Bebas</p>
                  <p className="text-slate-600 mt-0.5">
                    Kategori ini diatur dengan mode <strong>Vote Bebas Saja</strong>. Penjurian dewan juri dinonaktifkan untuk cabang lomba ini.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddQuestion} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                disabled={isSavingCriteria}
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Tulis pertanyaan/kriteria penilaian baru..."
                className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50 disabled:opacity-60"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSavingCriteria || !newQuestionText.trim()}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSavingCriteria ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Pertanyaan</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSavingCriteria}
                  onClick={handleLoadDefaultCriteria}
                  title="Muat atau pulihkan standar kriteria penilaian resmi"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Muat Standar Resmi</span>
                </button>
              </div>
            </form>

            {activeCategory.kriteria.length === 0 ? (
              <div className="p-6 rounded-2xl bg-amber-50/70 border-2 border-dashed border-amber-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">0 Kriteria — Pertanyaan Penilaian Belum Tersedia</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Cabang lomba ini belum memiliki pertanyaan di Google Sheets. Dewan juri tidak dapat melakukan penilaian jika kriteria kosong. Klik tombol di bawah untuk memuat standar kriteria resmi:
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSavingCriteria}
                  onClick={handleLoadDefaultCriteria}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  {isSavingCriteria ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  <span>Muat Standar Resmi ({getFallbackCriteria(selectedCategoryId, activeCategory.nama_kategori).length} Pertanyaan) &amp; Simpan ke Google Sheets</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {activeCategory.kriteria.map((qText, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                        {idx + 1}
                      </span>
                      {editingQuestionIndex === idx ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            disabled={isSavingCriteria}
                            value={editingQuestionValue}
                            onChange={(e) => setEditingQuestionValue(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs border border-emerald-600 rounded bg-white"
                          />
                          <button
                            disabled={isSavingCriteria}
                            onClick={() => handleSaveEditQuestion(idx)}
                            className="px-3 py-1 bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1"
                          >
                            {isSavingCriteria ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            <span>Simpan</span>
                          </button>
                          <button
                            disabled={isSavingCriteria}
                            onClick={() => setEditingQuestionIndex(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-800 font-medium">{qText}</span>
                      )}
                    </div>

                    {editingQuestionIndex !== idx && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          disabled={isSavingCriteria}
                          onClick={() => {
                            setEditingQuestionIndex(idx);
                            setEditingQuestionValue(qText);
                          }}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          disabled={isSavingCriteria}
                          onClick={() => handleDeleteQuestion(idx)}
                          className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Penugasan Dewan Juri Khusus Cabang Lomba Ini */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-700 font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Penugasan Dewan Juri Khusus</span>
                  {activeCategory.assessment_type === 'public_only' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      Non-Aktif (Vote Bebas Saja)
                    </span>
                  )}
                  {activeCategory.assessment_type === 'jury_only' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Juri Saja
                    </span>
                  )}
                  {(!activeCategory.assessment_type || activeCategory.assessment_type === 'all') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Multi (Vote & Juri)
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Pilih Juri yang Bertugas — {activeCategory.nama_kategori}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Admin memiliki kebebasan penuh memilih jumlah dan nama juri yang ditugaskan menilai pada cabang lomba ini.
                </p>
              </div>

              {activeCategory.assessment_type !== 'public_only' && (
                <div className="bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200 text-right shrink-0">
                  <span className="text-[11px] text-amber-800 font-medium block">Status Penugasan:</span>
                  <span className="text-sm font-bold font-mono text-amber-950">
                    {(!activeCategory.assigned_juries || activeCategory.assigned_juries.length === 0)
                      ? `Semua Juri (${juryUsers.length} Juri)`
                      : `${activeCategory.assigned_juries.length} dari ${juryUsers.length} Juri`}
                  </span>
                </div>
              )}
            </div>

            {activeCategory.assessment_type === 'public_only' ? (
              <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Penugasan Juri Tidak Diperlukan</p>
                  <p className="text-slate-600 mt-0.5">
                    Cabang lomba ini diatur dengan mode <strong>Vote Bebas Saja</strong>, sehingga pemenang ditentukan murni dari akumulasi vote publik tanpa form juri.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Centang dewan juri yang bertugas:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = juryUsers.map(j => j.id);
                        const res = apiService.updateCategoryAssignedJuries(activeCategory.id_kategori, allIds);
                        if (res.success) {
                          setBannerMsg({ type: 'success', text: res.message });
                          onRefreshData();
                          setTimeout(() => setBannerMsg(null), 3000);
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors"
                    >
                      Tugaskan Semua Juri ({juryUsers.length})
                    </button>
                    {activeCategory.assigned_juries && activeCategory.assigned_juries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = apiService.updateCategoryAssignedJuries(activeCategory.id_kategori, []);
                          if (res.success) {
                            setBannerMsg({ type: 'success', text: 'Penugasan di-reset: seluruh dewan juri dapat menilai.' });
                            onRefreshData();
                            setTimeout(() => setBannerMsg(null), 3000);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
                      >
                        Reset (Buka untuk Semua Juri)
                      </button>
                    )}
                  </div>
                </div>

                {juryUsers.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                    Belum ada akun dewan juri yang terdaftar. Silakan buat akun juri terlebih dahulu di tab <strong>Manajemen Peserta &amp; Juri</strong>.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {juryUsers.map(jury => {
                      const isAssigned = (activeCategory.assigned_juries && activeCategory.assigned_juries.length > 0)
                        ? (activeCategory.assigned_juries.includes(jury.id) || activeCategory.assigned_juries.includes(jury.username))
                        : true; // default open to all if empty
                      const isExplicitlyFiltered = activeCategory.assigned_juries && activeCategory.assigned_juries.length > 0;

                      return (
                        <div
                          key={jury.id}
                          onClick={() => {
                            let currentList = activeCategory.assigned_juries || [];
                            // If currently empty (open to all), clicking toggles out from all
                            if (currentList.length === 0) {
                              currentList = juryUsers.map(j => j.id);
                            }
                            const isIncluded = currentList.includes(jury.id) || currentList.includes(jury.username);
                            const nextList = isIncluded
                              ? currentList.filter(id => id !== jury.id && id !== jury.username)
                              : [...currentList, jury.id];

                            const res = apiService.updateCategoryAssignedJuries(activeCategory.id_kategori, nextList);
                            if (res.success) {
                              setBannerMsg({ type: 'success', text: res.message });
                              onRefreshData();
                              setTimeout(() => setBannerMsg(null), 2500);
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                            isAssigned
                              ? 'bg-amber-50/70 border-amber-500 ring-1 ring-amber-500 shadow-xs'
                              : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                            isAssigned
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isAssigned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1 text-xs">
                            <div className="font-bold text-slate-900 truncate">{jury.nama}</div>
                            <div className="text-[11px] text-emerald-800 font-medium truncate mt-0.5">
                              {jury.jurySpecialty || jury.username}
                            </div>
                            <div className="mt-2 flex items-center gap-1.5">
                              {isAssigned ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                                  {isExplicitlyFiltered ? 'Ditugaskan Khusus' : 'Aktif Bertugas'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  Tidak Ditugaskan
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Hanya dewan juri dengan tanda centang di atas yang akan dapat mengisi formulir dan memberikan nilai pada cabang lomba <strong>{activeCategory.nama_kategori}</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: MANAJEMEN PESERTA (GROUP/INDIVIDU) & AKUN JURI (DILENGKAPI EDIT & HAPUS) */}
      {/* ========================================================================= */}
      {activeTab === 'manajemen' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Manajemen Peserta & Akun Dewan Juri</h3>
              <p className="text-xs text-slate-500">Kelola peserta (Group atau Individu) dan akun juri resmi dengan fitur Edit & Hapus</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewParticipantEventId(selectedAdminSubEventId);
                  setShowAddTeamModal(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Peserta (Group / Individu)</span>
              </button>
              <button
                onClick={() => {
                  setJuryFormError(null);
                  setShowAddJuryModal(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Akun Juri</span>
              </button>
            </div>
          </div>

          {/* Section: Daftar Peserta Terdaftar with EDIT & HAPUS */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Peserta Event: {currentAdminSubEvent.kode_event || currentAdminSubEvent.nama_event} ({subEventTeams.length})
              </h4>
              <span className="text-xs text-slate-500">
                Tipe Event: <strong>{currentAdminSubEvent.tipe_peserta || 'Group'}</strong>
              </span>
            </div>

            {subEventTeams.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada peserta terdaftar pada event ini. Klik "Tambah Peserta" untuk menambahkan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subEventTeams.map(t => (
                  <div key={t.id_team} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                        t.kategori_regu === 'Putra'
                          ? 'bg-gradient-to-br from-emerald-800 to-teal-900'
                          : 'bg-gradient-to-br from-rose-700 to-pink-900'
                      }`}>
                        {getTeamInitials(t.nama_regu)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{t.nama_regu}</span>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {t.tipe_partisipasi === 'Individu' ? 'Individu' : 'Group'} · {t.kategori_regu}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {t.kelas_pangkalan} {t.ketua_regu && `· ${t.tipe_partisipasi === 'Individu' ? 'Pembimbing' : 'Ketua'}: ${t.ketua_regu}`}
                        </p>
                        <p className="text-[11px] text-slate-400 italic mt-0.5">"{t.motto}"</p>
                      </div>
                    </div>

                    {/* Action buttons: Edit & Hapus */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => setEditingTeam({ ...t })}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-emerald-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Edit Data Peserta"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTeam(t)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Hapus Peserta"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Akun Dewan Juri with EDIT & HAPUS */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Akun Dewan Juri Resmi ({juryUsers.length})
              </h4>
            </div>
            <div className="divide-y divide-slate-100">
              {juryUsers.map(j => {
                const cleanUname = j.username.replace(/^@+/, '');
                return (
                  <div key={j.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex-1">
                      <span className="font-bold text-sm text-slate-900">{j.nama}</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Username: <strong className="font-mono text-slate-800">{cleanUname}</strong> · Penugasan: {j.jurySpecialty || 'Juri'}
                      </p>
                    </div>

                    {/* Action buttons for Jury */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => {
                          setEditingJury({ ...j, username: cleanUname });
                          setEditJuryPassword('');
                          setJuryFormError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-emerald-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        title="Edit Akun Juri"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteJury(j)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Hapus Akun Juri"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT PESERTA (BARU) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL EDIT PESERTA (BARU - RESPONSIVE & PROFESSIONAL) */}
      {/* ========================================================================= */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-amber-300 shadow-xs">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Edit Data Peserta</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    ID: <span className="font-mono text-amber-300 font-semibold">{editingTeam.id_team}</span> · Perbarui informasi peserta &amp; pangkalan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer"
                title="Tutup Form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleUpdateTeam} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Grid 2 Kolom untuk Sub-Event & Format Partisipasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Sub-Event */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Sub-Event Terkait *</span>
                  </label>
                  <select
                    value={editingTeam.id_event}
                    onChange={(e) => setEditingTeam({ ...editingTeam, id_event: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  >
                    {availableEvents.map(ev => (
                      <option key={ev.id_event} value={ev.id_event}>
                        {ev.kode_event || ev.nama_event} ({ev.tahun || '2026'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Format Partisipasi */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Bentuk Partisipasi *</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTeam({ ...editingTeam, tipe_partisipasi: 'Group' })}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        editingTeam.tipe_partisipasi !== 'Individu'
                          ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-700/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Group / Regu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTeam({ ...editingTeam, tipe_partisipasi: 'Individu' })}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        editingTeam.tipe_partisipasi === 'Individu'
                          ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-700/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Individu</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Kolom untuk Nama & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 3. Nama Regu / Nama Peserta (col-span-2) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {editingTeam.tipe_partisipasi === 'Individu' ? 'Nama Lengkap Peserta *' : 'Nama Regu / Kelompok *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTeam.nama_regu}
                    onChange={(e) => setEditingTeam({ ...editingTeam, nama_regu: e.target.value })}
                    placeholder={editingTeam.tipe_partisipasi === 'Individu' ? 'Contoh: Ahmad Raihan Pratama' : 'Contoh: Regu Rajawali / Regu Melati'}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                </div>

                {/* 4. Kategori (Putra / Putri) */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingTeam({ ...editingTeam, kategori_regu: 'Putra' })}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        editingTeam.kategori_regu === 'Putra'
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Putra
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTeam({ ...editingTeam, kategori_regu: 'Putri' })}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        editingTeam.kategori_regu === 'Putri'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Putri
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid 2 Kolom untuk Kelas & Ketua/Mentor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 5. Kelas & Pangkalan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {editingTeam.tipe_partisipasi === 'Individu' ? 'Kelas & Asal Kontingen *' : 'Kelas & Pangkalan *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTeam.kelas_pangkalan}
                    onChange={(e) => setEditingTeam({ ...editingTeam, kelas_pangkalan: e.target.value })}
                    placeholder="Contoh: Kelas 8A / Pasukan Penggalang Khusus"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                </div>

                {/* 6. Ketua Regu / Mentor */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {editingTeam.tipe_partisipasi === 'Individu' ? 'Nama Guru Pembimbing / Mentor' : 'Nama Ketua Regu (Pinru)'}
                  </label>
                  <input
                    type="text"
                    value={editingTeam.ketua_regu || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, ketua_regu: e.target.value })}
                    placeholder={editingTeam.tipe_partisipasi === 'Individu' ? 'Contoh: Ustadz Danang, S.Pd' : 'Contoh: Muhammad Rizky Pratama'}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 7. Motto / Tekad */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Motto / Semboyan / Tekad Peserta
                </label>
                <input
                  type="text"
                  value={editingTeam.motto || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, motto: e.target.value })}
                  placeholder="Contoh: Tangkas, Berani, dan Berakhlak Mulia"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 italic focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Motto dan Nama Ketua Regu akan tersimpan di database Google Sheets (kolom H &amp; I) serta tampil di kartu pemilih publik.
                </p>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 active:scale-98 rounded-xl shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>Simpan Perubahan ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT AKUN DEWAN JURI (RESPONSIVE & PROFESSIONAL) */}
      {/* ========================================================================= */}
      {editingJury && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-amber-300 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Edit Akun Dewan Juri</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    ID: <span className="font-mono text-amber-300 font-semibold">{editingJury.id}</span> · Perbarui identitas &amp; hak akses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingJury(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleUpdateJury} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Inline Error Notification */}
              {juryFormError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900">Gagal Memperbarui Akun Juri</p>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{juryFormError}</p>
                  </div>
                </div>
              )}

              {/* 1. Nama Lengkap & Gelar */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Nama Lengkap &amp; Gelar *</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingJury.nama}
                  onChange={(e) => setEditingJury({ ...editingJury, nama: e.target.value })}
                  placeholder="Contoh: Kak Wahyu Subekti, S.Pd"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/70 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                />
              </div>

              {/* 2. Penugasan / Spesialisasi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Penugasan / Spesialisasi Dewan Juri</span>
                </label>
                <input
                  type="text"
                  value={editingJury.jurySpecialty || ''}
                  onChange={(e) => setEditingJury({ ...editingJury, jurySpecialty: e.target.value })}
                  placeholder="Contoh: Juri Pentas Seni / Pidato / Semua Kategori"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Keterangan bidang keahlian juri untuk mempermudah identifikasi tugas.
                </p>
              </div>

              {/* 3. Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingJury.username}
                    onChange={(e) => setEditingJury({ ...editingJury, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') })}
                    placeholder="Contoh: juri1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak diganti"
                    value={editJuryPassword}
                    onChange={(e) => setEditJuryPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Min. 4 karakter jika diubah</p>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-slate-50">
                <button
                  type="button"
                  disabled={isSubmittingJury}
                  onClick={() => setEditingJury(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJury}
                  className="px-5 py-2.5 font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 active:scale-98 rounded-xl shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingJury ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Sub-Event Baru */}
      {showAddSubEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Event Baru</h3>
            <p className="text-xs text-slate-500">
              Buat agenda acara baru sekolah seperti PHBI, PHBN, Class Meeting, atau Milad Sekolah.
            </p>
            <form onSubmit={handleCreateSubEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Event *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PHBI - Isra Mi'raj 1448 H"
                  value={newSubEventName}
                  onChange={(e) => setNewSubEventName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Singkat *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PHBI / PHBN"
                    value={newSubEventCode}
                    onChange={(e) => setNewSubEventCode(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={newSubEventYear}
                    onChange={(e) => setNewSubEventYear(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipe Peserta Acara *</label>
                <select
                  value={newSubEventType}
                  onChange={(e) => setNewSubEventType(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                >
                  <option value="Group">Group / Regu Saja</option>
                  <option value="Individu">Perorangan / Individu Saja</option>
                  <option value="Campuran">Campuran (Ada Group & Ada Individu)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batas Waktu Vote & Penjurian</label>
                <input
                  type="datetime-local"
                  value={newSubEventDeadline}
                  onChange={(e) => setNewSubEventDeadline(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat Acara</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan tujuan dan tema perhelatan kegiatan..."
                  value={newSubEventDesc}
                  onChange={(e) => setNewSubEventDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSubEventModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg"
                >
                  Buat Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TAMBAH PESERTA (GROUP / INDIVIDU - RESPONSIVE & PROFESSIONAL) */}
      {/* ========================================================================= */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-amber-300 shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Tambah Peserta Baru</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Daftarkan peserta Regu / Kelompok atau Perorangan ke Database Cloud
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTeamModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer"
                title="Tutup Form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateParticipant} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Grid 2 Kolom untuk Sub-Event & Format Partisipasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Sub-Event */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Event Target *</span>
                  </label>
                  <select
                    value={newParticipantEventId}
                    onChange={(e) => setNewParticipantEventId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  >
                    {availableEvents.map(ev => (
                      <option key={ev.id_event} value={ev.id_event}>
                        {ev.kode_event || ev.nama_event} ({ev.tahun || '2026'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Format Partisipasi */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Bentuk Partisipasi *</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewParticipantType('Group')}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newParticipantType === 'Group'
                          ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-700/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Group / Regu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewParticipantType('Individu')}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newParticipantType === 'Individu'
                          ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-700/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Individu</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Kolom untuk Nama & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 3. Nama Regu / Nama Peserta (col-span-2) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {newParticipantType === 'Individu' ? 'Nama Lengkap Peserta *' : 'Nama Regu / Kelompok *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newParticipantType === 'Individu' ? 'Contoh: Ahmad Raihan Pratama' : 'Contoh: Regu Rajawali / Regu Melati'}
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                </div>

                {/* 4. Kategori (Putra / Putri) */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewTeamGender('Putra')}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        newTeamGender === 'Putra'
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Putra
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTeamGender('Putri')}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        newTeamGender === 'Putri'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Putri
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid 2 Kolom untuk Kelas & Ketua/Mentor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 5. Kelas & Pangkalan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {newParticipantType === 'Individu' ? 'Kelas & Asal Kontingen *' : 'Kelas & Pangkalan *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kelas 8A / Pasukan Khusus"
                    value={newTeamClass}
                    onChange={(e) => setNewTeamClass(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                </div>

                {/* 6. Ketua Regu / Mentor */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {newParticipantType === 'Individu' ? 'Nama Guru Pembimbing / Mentor' : 'Nama Ketua Regu (Pinru)'}
                  </label>
                  <input
                    type="text"
                    placeholder={newParticipantType === 'Individu' ? 'Contoh: Ustadz Danang, S.Pd' : 'Contoh: Muhammad Danis'}
                    value={newTeamLeader}
                    onChange={(e) => setNewTeamLeader(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 7. Motto / Tekad */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Motto / Semboyan / Tekad Peserta
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tangkas, Mandiri, dan Berakhlak Qurani"
                  value={newTeamMotto}
                  onChange={(e) => setNewTeamMotto(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 italic focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Motto dan Nama Ketua Regu akan otomatis tersimpan ke kolom H &amp; I Google Sheets Database.
                </p>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 active:scale-98 rounded-xl shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Peserta ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL BUAT AKUN DEWAN JURI BARU (RESPONSIVE & PROFESSIONAL) */}
      {/* ========================================================================= */}
      {showAddJuryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-amber-300 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Buat Akun Dewan Juri Baru</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Akses formulir penilaian skala 1-5 &amp; tersimpan ke database Google Sheets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddJuryModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateJury} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Inline Error Notification */}
              {juryFormError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900">Gagal Membuat Akun Juri</p>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{juryFormError}</p>
                  </div>
                </div>
              )}

              {/* 1. Nama Lengkap & Gelar */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Nama Lengkap &amp; Gelar Dewan Juri *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kak Wahyu Subekti, S.Pd"
                  value={newJuryName}
                  onChange={(e) => setNewJuryName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/70 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                />
              </div>

              {/* 2. Penugasan / Spesialisasi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Penugasan / Spesialisasi</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Juri Pentas Seni / Juri Pidato / Umum"
                  value={newJurySpecialty}
                  onChange={(e) => setNewJurySpecialty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Keterangan bidang atau spesialisasi juri pada lembar sertifikat &amp; laporan penilaian.
                </p>
              </div>

              {/* 3. Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: juri1"
                    value={newJuryUsername}
                    onChange={(e) => setNewJuryUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Gunakan huruf kecil dan angka sederhana</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password Akun *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 karakter"
                    value={newJuryPassword}
                    onChange={(e) => setNewJuryPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Minimal 4 karakter</p>
                </div>
              </div>

              {/* Informative Note */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Akun juri baru akan otomatis terdaftar di database Google Sheets (Sheet <strong>Users</strong>) dengan hak akses <code>role = jury</code>.
                </span>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-slate-50">
                <button
                  type="button"
                  disabled={isSubmittingJury}
                  onClick={() => setShowAddJuryModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJury}
                  className="px-5 py-2.5 font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 active:scale-98 rounded-xl shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingJury ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-amber-300" />
                      <span>Buat Akun Juri</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Cabang Lomba Baru */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Tambah Cabang Lomba Baru</h3>
                  <p className="text-xs text-emerald-200">Event: {currentAdminSubEvent.kode_event || currentAdminSubEvent.nama_event}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Event Target *</label>
                <select
                  value={newCatEventId}
                  onChange={(e) => setNewCatEventId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                >
                  {availableEvents.map(ev => (
                    <option key={ev.id_event} value={ev.id_event}>
                      {ev.kode_event || ev.nama_event} ({ev.tahun || '2026'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Nama Cabang Lomba *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lomba Masak Rimba / Pentas Seni / Pionering"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Bentuk Partisipasi *</label>
                  <select
                    value={newCatParticipantType}
                    onChange={(e) => setNewCatParticipantType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Group">Group / Regu</option>
                    <option value="Individu">Perorangan / Individu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kategori / Bidang</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kesenian / Pramuka / Religi"
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Pilihan Jenis Penilaian Cabang Lomba */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Jenis Penilaian Cabang Lomba *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatAssessmentType('all')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      newCatAssessmentType === 'all'
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950 ring-1 ring-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs">Multi (Vote &amp; Juri)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Dinilai oleh Pemilih Bebas dan Dewan Juri
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCatAssessmentType('public_only')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      newCatAssessmentType === 'public_only'
                        ? 'bg-sky-50 border-sky-600 text-sky-950 ring-1 ring-sky-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Vote className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-xs">Vote Bebas Saja</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Khusus pemilihan populer tanpa nilai juri
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCatAssessmentType('jury_only')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      newCatAssessmentType === 'jury_only'
                        ? 'bg-amber-50 border-amber-600 text-amber-950 ring-1 ring-amber-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-xs">Juri Saja</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Khusus penilaian teknis juri tanpa vote publik
                    </p>
                  </button>
                </div>
              </div>

              {/* Ketentuan Hak Suara Pemilih Bebas */}
              {newCatAssessmentType !== 'jury_only' ? (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Ketentuan Hak Suara Pemilih Bebas per Akun *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNewCatVotesRequired(num)}
                        className={`py-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                          newCatVotesRequired === num
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>{num}</div>
                        <div className="text-[10px] font-normal">{num === 1 ? '1 Suara' : `${num} Suara`}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Voter wajib memilih tepat {newCatVotesRequired} regu/peserta yang berbeda sebelum dapat submit.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Mode Juri Saja Aktif:</strong> Cabang lomba ini tidak dibuka untuk voting pemilih bebas, hanya dinilai oleh Dewan Juri.
                  </p>
                </div>
              )}

              {/* Penugasan Dewan Juri (Kebebasan Memilih Jumlah & Nama Juri) */}
              {newCatAssessmentType !== 'public_only' ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <label className="font-bold text-slate-800 text-xs">
                        Penugasan Dewan Juri *
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {newCatAssignedJuries.length === 0
                          ? `Semua Juri (${juryUsers.length})`
                          : `${newCatAssignedJuries.length} Juri Dipilih`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setNewCatAssignedJuries(juryUsers.map(j => j.id))}
                        className="px-2 py-0.5 font-semibold text-emerald-800 hover:bg-emerald-100 rounded border border-emerald-300 transition-colors"
                      >
                        Pilih Semua ({juryUsers.length})
                      </button>
                      {newCatAssignedJuries.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setNewCatAssignedJuries([])}
                          className="px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                        >
                          Reset (Semua)
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    Pilih nama-nama juri yang ditugaskan menilai. Jika tidak memilih satupun, maka <strong>seluruh dewan juri ({juryUsers.length} orang)</strong> berhak menilai.
                  </p>

                  {juryUsers.length === 0 ? (
                    <div className="p-2.5 bg-amber-50 rounded-lg text-amber-900 text-[11px]">
                      Belum ada dewan juri terdaftar. Tambahkan akun juri di menu Manajemen Juri.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                      {juryUsers.map(jury => {
                        const isSelected = newCatAssignedJuries.includes(jury.id);
                        return (
                          <div
                            key={jury.id}
                            onClick={() => {
                              setNewCatAssignedJuries(prev =>
                                isSelected ? prev.filter(id => id !== jury.id) : [...prev, jury.id]
                              );
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50/80 border-amber-500 text-amber-950 ring-1 ring-amber-500 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs truncate">{jury.nama}</div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {jury.jurySpecialty || jury.username}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Mode <strong>Vote Bebas Saja</strong>: Penjurian dewan juri tidak digunakan pada cabang lomba ini.</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas tentang cabang lomba dan tujuannya..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kriteria Penilaian Dewan Juri (Satu baris per kriteria)
                </label>
                <textarea
                  rows={3}
                  placeholder="Kriteria 1&#10;Kriteria 2&#10;Kriteria 3"
                  value={newCatCriteriaText}
                  onChange={(e) => setNewCatCriteriaText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Kriteria ini akan menjadi daftar pertanyaan rating 1 - 5 di formulir dewan juri.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Simpan Cabang Lomba
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Cabang Lomba */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Edit Cabang Lomba</h3>
                  <p className="text-xs text-emerald-200">{editingCategory.nama_kategori}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Nama Cabang Lomba *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.nama_kategori}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nama_kategori: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Bentuk Partisipasi</label>
                  <select
                    value={editingCategory.tipe_peserta || 'Group'}
                    onChange={(e) => setEditingCategory({ ...editingCategory, tipe_peserta: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Group">Group / Regu</option>
                    <option value="Individu">Perorangan / Individu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kategori / Bidang</label>
                  <input
                    type="text"
                    value={editingCategory.tipe}
                    onChange={(e) => setEditingCategory({ ...editingCategory, tipe: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Jenis Penilaian */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Jenis Penilaian Cabang Lomba
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory({ ...editingCategory, assessment_type: 'all' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      (editingCategory.assessment_type || 'all') === 'all'
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Multi (Semua)
                    </div>
                    <div className={`text-[10px] mt-0.5 ${(editingCategory.assessment_type || 'all') === 'all' ? 'text-emerald-200' : 'text-slate-500'}`}>
                      Vote Publik + Juri
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingCategory({ ...editingCategory, assessment_type: 'public_only' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      editingCategory.assessment_type === 'public_only'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Vote Bebas Saja
                    </div>
                    <div className={`text-[10px] mt-0.5 ${editingCategory.assessment_type === 'public_only' ? 'text-blue-200' : 'text-slate-500'}`}>
                      Hanya voting publik
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingCategory({ ...editingCategory, assessment_type: 'jury_only' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      editingCategory.assessment_type === 'jury_only'
                        ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Juri Saja
                    </div>
                    <div className={`text-[10px] mt-0.5 ${editingCategory.assessment_type === 'jury_only' ? 'text-amber-200' : 'text-slate-500'}`}>
                      Hanya dewan juri
                    </div>
                  </button>
                </div>
              </div>

              {/* Hak Suara Pemilih Bebas (Hanya jika bukan juri_only) */}
              {editingCategory.assessment_type === 'jury_only' ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cabang lomba ini dinilai <strong>khusus oleh Dewan Juri</strong>. Voting publik dinonaktifkan.</span>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Ketentuan Hak Suara Pemilih Bebas per Akun
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, votes_required: num })}
                        className={`py-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                          (editingCategory.votes_required || 1) === num
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>{num}</div>
                        <div className="text-[10px] font-normal">{num === 1 ? '1 Suara' : `${num} Suara`}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Penugasan Dewan Juri (Kebebasan Memilih Jumlah & Nama Juri) */}
              {editingCategory.assessment_type !== 'public_only' ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <label className="font-bold text-slate-800 text-xs">
                        Penugasan Dewan Juri *
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {(!editingCategory.assigned_juries || editingCategory.assigned_juries.length === 0)
                          ? `Semua Juri (${juryUsers.length})`
                          : `${editingCategory.assigned_juries.length} Juri Dipilih`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setEditingCategory({
                          ...editingCategory,
                          assigned_juries: juryUsers.map(j => j.id)
                        })}
                        className="px-2 py-0.5 font-semibold text-emerald-800 hover:bg-emerald-100 rounded border border-emerald-300 transition-colors"
                      >
                        Pilih Semua ({juryUsers.length})
                      </button>
                      {editingCategory.assigned_juries && editingCategory.assigned_juries.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setEditingCategory({
                            ...editingCategory,
                            assigned_juries: []
                          })}
                          className="px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                        >
                          Reset (Semua)
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    Pilih juri-juri yang ditugaskan khusus untuk cabang lomba ini. Jika dikosongkan/reset, maka <strong>seluruh dewan juri ({juryUsers.length} orang)</strong> berhak menilai.
                  </p>

                  {juryUsers.length === 0 ? (
                    <div className="p-2.5 bg-amber-50 rounded-lg text-amber-900 text-[11px]">
                      Belum ada dewan juri terdaftar. Tambahkan akun juri di menu Manajemen Juri.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                      {juryUsers.map(jury => {
                        const currentAssigned = editingCategory.assigned_juries || [];
                        const isSelected = currentAssigned.includes(jury.id) || currentAssigned.includes(jury.username);
                        return (
                          <div
                            key={jury.id}
                            onClick={() => {
                              const nextList = isSelected
                                ? currentAssigned.filter(id => id !== jury.id && id !== jury.username)
                                : [...currentAssigned, jury.id];
                              setEditingCategory({
                                ...editingCategory,
                                assigned_juries: nextList
                              });
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50/80 border-amber-500 text-amber-950 ring-1 ring-amber-500 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs truncate">{jury.nama}</div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {jury.jurySpecialty || jury.username}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Mode <strong>Vote Bebas Saja</strong>: Penjurian dewan juri tidak digunakan pada cabang lomba ini.</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editingCategory.deskripsi}
                  onChange={(e) => setEditingCategory({ ...editingCategory, deskripsi: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Cabang Lomba */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Cabang Lomba?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Apakah Anda yakin ingin menghapus cabang lomba{' '}
                <strong className="text-slate-900">"{categoryToDelete.nama_kategori}"</strong>?
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
              <strong>Peringatan Penting:</strong> Seluruh data formulir kriteria dewan juri, penilaian juri, dan perolehan suara voting publik pada cabang lomba ini akan dihapus secara permanen.
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Ya, Hapus Cabang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Akun Dewan Juri */}
      {juryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Akun Dewan Juri?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Apakah Anda yakin ingin menghapus akun dewan juri{' '}
                <strong className="text-slate-900 font-semibold">{juryToDelete.nama}</strong>{' '}
                (<span className="font-mono text-emerald-800 font-medium">{juryToDelete.username.replace(/^@+/, '')}</span>)?
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <strong>Perhatian:</strong> Akun ini akan dihapus permanen dari sistem dan database Google Sheets. Seluruh riwayat penilaian yang pernah dimasukkan oleh juri ini juga akan ikut dihapus.
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingJury}
                onClick={() => setJuryToDelete(null)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingJury}
                onClick={confirmDeleteJury}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingJury ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Juri</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Peserta / Regu */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Peserta / Regu?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Apakah Anda yakin ingin menghapus peserta{' '}
                <strong className="text-slate-900 font-semibold">{teamToDelete.nama_regu}</strong>{' '}
                ({teamToDelete.kelas_pangkalan})?
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <strong>Perhatian:</strong> Seluruh nilai dewan juri dan vote publik untuk peserta ini akan ikut dihapus secara permanen.
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingTeam}
                onClick={() => setTeamToDelete(null)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingTeam}
                onClick={confirmDeleteTeam}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingTeam ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Peserta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Logo Modal with Name input and Google Drive folder storage */}
      <UploadLogoModal
        isOpen={isUploadLogoModalOpen}
        onClose={() => setIsUploadLogoModalOpen(false)}
        onLogoUploaded={handleLogoModalUploaded}
        defaultPosition={uploadLogoTargetPos}
        suggestedName={uploadLogoSuggestedName || (uploadLogoTargetPos === 'kiri_sekolah' ? 'Logo SMPIT Pondok Duta' : 'Logo Cabang Olahraga')}
      />
    </div>
  );
};

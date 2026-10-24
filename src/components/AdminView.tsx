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
  AssessmentType
} from '../types';
import { apiService } from '../services/apiService';
import {
  Settings,
  Users,
  Award,
  Vote,
  Plus,
  Download,
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
  FolderPlus
} from 'lucide-react';
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
  onSelectEvent
}) => {
  const [activeTab, setActiveTab] = useState<'subevent' | 'kalkulasi' | 'tabulasi' | 'voting' | 'aturan' | 'manajemen'>('subevent');

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

  // Criteria & Questions management state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestionValue, setEditingQuestionValue] = useState('');

  // Feedback banner
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cabang Lomba (Category) management modals and form state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryModel | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryModel | null>(null);

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

  const handleToggleSubEventStatus = (eventId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const res = apiService.toggleEventStatus(eventId, newStatus);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      onRefreshData();
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
    if (!confirm(`Apakah Anda yakin ingin menghapus peserta "${team.nama_regu}" (${team.kelas_pangkalan})?\n\nPerhatian: Seluruh nilai dewan juri dan vote publik untuk peserta ini akan ikut terhapus secara permanen.`)) {
      return;
    }
    const res = apiService.deleteTeam(team.id_team);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    }
  };

  const handleCreateJury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJuryName || !newJuryUsername || !newJuryPassword) return;

    const res = apiService.addJury({
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
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
    }
  };

  const handleUpdateJury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJury) return;

    const res = apiService.updateJury({
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
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
    }
  };

  const handleDeleteJury = (jury: User) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun Dewan Juri "${jury.nama}" (@${jury.username})?\n\nPerhatian: Semua penilaian yang pernah diinput oleh juri ini akan ikut terhapus.`)) {
      return;
    }
    const res = apiService.deleteJury(jury.id);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
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
      kriteria
    });

    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setShowAddCategoryModal(false);
      setNewCatName('');
      setNewCatDesc('');
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

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const res = apiService.deleteCategory(categoryToDelete.id_kategori);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      // If deleted category was currently selected, select another category in the subevent
      if (selectedCategoryId === categoryToDelete.id_kategori) {
        const remaining = categories.filter(
          c => c.id_event === categoryToDelete.id_event && c.id_kategori !== categoryToDelete.id_kategori
        );
        if (remaining.length > 0) {
          setSelectedCategoryId(remaining[0].id_kategori);
        }
      }
      setCategoryToDelete(null);
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({ type: 'error', text: res.message });
      setCategoryToDelete(null);
      setTimeout(() => setBannerMsg(null), 4000);
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
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const currentCriteria = activeCategory?.kriteria || [];
    const updated = [...currentCriteria, newQuestionText.trim()];
    const res = apiService.updateCategoryCriteria(selectedCategoryId, updated);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setNewQuestionText('');
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
    }
  };

  // Delete a question from jury criteria
  const handleDeleteQuestion = (indexToDelete: number) => {
    const currentCriteria = activeCategory?.kriteria || [];
    if (currentCriteria.length <= 1) {
      setBannerMsg({ type: 'error', text: 'Kategori harus memiliki minimal 1 kriteria pertanyaan penilaian.' });
      setTimeout(() => setBannerMsg(null), 3000);
      return;
    }
    const updated = currentCriteria.filter((_, idx) => idx !== indexToDelete);
    const res = apiService.updateCategoryCriteria(selectedCategoryId, updated);
    if (res.success) {
      setBannerMsg({ type: 'success', text: 'Kriteria pertanyaan berhasil dihapus.' });
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
    }
  };

  // Save edited question
  const handleSaveEditQuestion = (indexToEdit: number) => {
    if (!editingQuestionValue.trim()) return;
    const currentCriteria = activeCategory?.kriteria || [];
    const updated = [...currentCriteria];
    updated[indexToEdit] = editingQuestionValue.trim();
    const res = apiService.updateCategoryCriteria(selectedCategoryId, updated);
    if (res.success) {
      setBannerMsg({ type: 'success', text: 'Kriteria pertanyaan berhasil diperbarui.' });
      setEditingQuestionIndex(null);
      setEditingQuestionValue('');
      onRefreshData();
      setTimeout(() => setBannerMsg(null), 3000);
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

  return (
    <div className="space-y-6 pb-20">
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
              SMPIT Pondok Duta · Kelola Sub-Event, pembobotan nilai, batasan hak suara, dan form dewan juri.
            </p>
          </div>

          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <div className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">
                Sub-Event Utama di Aplikasi:
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
            <span>Sub-Event & Batas Waktu</span>
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
                Pilih & Atur Sub-Event (Status Buka / Kunci & Batas Waktu)
              </h3>
              <p className="text-xs text-slate-500">
                Aturan Tampilan Pemilih Bebas: Sub-Event yang <strong>DIKUNCI</strong> otomatis di-<strong>HIDE</strong> dari menu. Jika <strong>batas waktu habis namun belum dikunci</strong>, sub-event tetap muncul di menu dengan status <strong>Close</strong> (voting dinonaktifkan).
              </p>
            </div>
            <button
              onClick={() => setShowAddSubEventModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sub-Event Baru</span>
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
                          <span>Tutup Sub-Event Ini (Kunci Vote & Juri)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Buka Kembali Sub-Event Ini</span>
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
                        <span>Buka & Jadikan Sub-Event Utama</span>
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
              Pilih Sub-Event:
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
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Cetak Lembar Rekap Resmi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Full Tabular Ranking Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tabel Klasemen & Rekapitulasi Nilai Akhir
                </h3>
                <p className="text-xs text-slate-500">
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
            </div>

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
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                            <strong>{c.kriteria?.length || 0} Pertanyaan</strong> Juri
                          </span>
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
                          onClick={() => setEditingCategory({ ...c, assessment_type: c.assessment_type || 'all' })}
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
                <p className="text-xs text-slate-500 mt-1">
                  Admin dapat menambah, mengubah, atau menghapus kriteria pertanyaan penilaian skala 1-5 untuk dewan juri.
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

            <form onSubmit={handleAddQuestion} className="flex gap-2">
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Tulis pertanyaan/kriteria penilaian baru..."
                className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pertanyaan</span>
              </button>
            </form>

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
                          value={editingQuestionValue}
                          onChange={(e) => setEditingQuestionValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border border-emerald-600 rounded bg-white"
                        />
                        <button
                          onClick={() => handleSaveEditQuestion(idx)}
                          className="px-3 py-1 bg-emerald-800 text-white rounded text-xs font-bold"
                        >
                          Simpan
                        </button>
                        <button
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
                        onClick={() => {
                          setEditingQuestionIndex(idx);
                          setEditingQuestionValue(qText);
                        }}
                        className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(idx)}
                        className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-800 font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                onClick={() => setShowAddJuryModal(true)}
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
                Daftar Peserta Sub-Event: {currentAdminSubEvent.kode_event || currentAdminSubEvent.nama_event} ({subEventTeams.length})
              </h4>
              <span className="text-xs text-slate-500">
                Tipe Sub-Event: <strong>{currentAdminSubEvent.tipe_peserta || 'Group'}</strong>
              </span>
            </div>

            {subEventTeams.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada peserta terdaftar pada sub-event ini. Klik "Tambah Peserta" untuk menambahkan.
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
              {juryUsers.map(j => (
                <div key={j.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex-1">
                    <span className="font-bold text-sm text-slate-900">{j.nama}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Username: <strong className="font-mono text-slate-800">@{j.username}</strong> · Penugasan: {j.jurySpecialty || 'Juri'}
                    </p>
                  </div>

                  {/* Action buttons for Jury */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => {
                        setEditingJury({ ...j });
                        setEditJuryPassword('');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-emerald-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Edit Akun Juri"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteJury(j)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Hapus Akun Juri"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT PESERTA (BARU) */}
      {/* ========================================================================= */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Data Peserta</h3>
                <p className="text-xs text-slate-500">ID: {editingTeam.id_team}</p>
              </div>
              <button
                onClick={() => setEditingTeam(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sub-Event *</label>
                <select
                  value={editingTeam.id_event}
                  onChange={(e) => setEditingTeam({ ...editingTeam, id_event: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  {availableEvents.map(ev => (
                    <option key={ev.id_event} value={ev.id_event}>
                      {ev.kode_event || ev.nama_event}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bentuk Partisipasi *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTeam({ ...editingTeam, tipe_partisipasi: 'Group' })}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 ${
                      editingTeam.tipe_partisipasi !== 'Individu'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Group / Regu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTeam({ ...editingTeam, tipe_partisipasi: 'Individu' })}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 ${
                      editingTeam.tipe_partisipasi === 'Individu'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Perorangan / Individu</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingTeam.tipe_partisipasi === 'Individu' ? 'Nama Lengkap Peserta *' : 'Nama Regu / Kelompok *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingTeam.nama_regu}
                  onChange={(e) => setEditingTeam({ ...editingTeam, nama_regu: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={editingTeam.kategori_regu}
                  onChange={(e) => setEditingTeam({ ...editingTeam, kategori_regu: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                >
                  <option value="Putra">Putra</option>
                  <option value="Putri">Putri</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingTeam.tipe_partisipasi === 'Individu' ? 'Kelas & Asal Kontingen *' : 'Kelas & Pangkalan *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingTeam.kelas_pangkalan}
                  onChange={(e) => setEditingTeam({ ...editingTeam, kelas_pangkalan: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingTeam.tipe_partisipasi === 'Individu' ? 'Nama Guru Pembimbing / Mentor' : 'Nama Ketua Regu'}
                </label>
                <input
                  type="text"
                  value={editingTeam.ketua_regu || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, ketua_regu: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motto / Tekad</label>
                <input
                  type="text"
                  value={editingTeam.motto}
                  onChange={(e) => setEditingTeam({ ...editingTeam, motto: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT AKUN DEWAN JURI (BARU) */}
      {/* ========================================================================= */}
      {editingJury && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Akun Dewan Juri</h3>
                <p className="text-xs text-slate-500">ID: {editingJury.id}</p>
              </div>
              <button
                onClick={() => setEditingJury(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateJury} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={editingJury.nama}
                  onChange={(e) => setEditingJury({ ...editingJury, nama: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Penugasan / Spesialisasi</label>
                <input
                  type="text"
                  value={editingJury.jurySpecialty || ''}
                  onChange={(e) => setEditingJury({ ...editingJury, jurySpecialty: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={editingJury.username}
                  onChange={(e) => setEditingJury({ ...editingJury, username: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password Baru (Opsional, kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  placeholder="Ketik password baru..."
                  value={editJuryPassword}
                  onChange={(e) => setEditJuryPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingJury(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Simpan Perubahan
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
            <h3 className="text-base font-bold text-slate-900">Tambah Sub-Event Baru</h3>
            <p className="text-xs text-slate-500">
              Buat agenda acara baru sekolah seperti PHBI, PHBN, Class Meeting, atau Milad Sekolah.
            </p>
            <form onSubmit={handleCreateSubEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Sub-Event *</label>
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
                  Buat Sub-Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Peserta (Group / Individu) */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Peserta Baru</h3>
            <p className="text-xs text-slate-500">
              Dapat didaftarkan sebagai Regu/Kelompok (Group) atau Perorangan (Individu).
            </p>
            <form onSubmit={handleCreateParticipant} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sub-Event *</label>
                <select
                  value={newParticipantEventId}
                  onChange={(e) => setNewParticipantEventId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  {availableEvents.map(ev => (
                    <option key={ev.id_event} value={ev.id_event}>
                      {ev.kode_event || ev.nama_event}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bentuk Partisipasi *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewParticipantType('Group')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 ${
                      newParticipantType === 'Group'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Group / Regu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewParticipantType('Individu')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 ${
                      newParticipantType === 'Individu'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Perorangan / Individu</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {newParticipantType === 'Individu' ? 'Nama Lengkap Peserta *' : 'Nama Regu / Kelompok *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newParticipantType === 'Individu' ? 'Contoh: Ahmad Raihan Pratama' : 'Contoh: Regu Kancil / Regu Dahlia'}
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={newTeamGender}
                  onChange={(e) => setNewTeamGender(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                >
                  <option value="Putra">Putra</option>
                  <option value="Putri">Putri</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {newParticipantType === 'Individu' ? 'Kelas & Asal Kontingen *' : 'Kelas & Pangkalan *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelas 8A / Kafilah Utama"
                  value={newTeamClass}
                  onChange={(e) => setNewTeamClass(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {newParticipantType === 'Individu' ? 'Nama Guru Pembimbing / Mentor' : 'Nama Ketua Regu'}
                </label>
                <input
                  type="text"
                  placeholder={newParticipantType === 'Individu' ? 'Contoh: Ustadz Hidayat' : 'Contoh: Muhammad Danis'}
                  value={newTeamLeader}
                  onChange={(e) => setNewTeamLeader(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motto / Tekad</label>
                <input
                  type="text"
                  placeholder="Contoh: Tangguh, Cerdas, dan Berakhlak Qurani"
                  value={newTeamMotto}
                  onChange={(e) => setNewTeamMotto(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Akun Juri */}
      {showAddJuryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Buat Akun Dewan Juri Baru</h3>
            <p className="text-xs text-slate-500">
              Akun juri hanya dapat dibuat oleh Admin dan memiliki akses memberikan rating 1 - 5.
            </p>
            <form onSubmit={handleCreateJury} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kak Wahyu Subekti, S.Pd"
                  value={newJuryName}
                  onChange={(e) => setNewJuryName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Penugasan / Spesialisasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Dewan Juri Pentas Seni / Juri Pidato"
                  value={newJurySpecialty}
                  onChange={(e) => setNewJurySpecialty(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="juri_khusus"
                    value={newJuryUsername}
                    onChange={(e) => setNewJuryUsername(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 karakter"
                    value={newJuryPassword}
                    onChange={(e) => setNewJuryPassword(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddJuryModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg"
                >
                  Buat Akun Juri
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
                  <p className="text-xs text-emerald-200">Sub-Event: {currentAdminSubEvent.kode_event || currentAdminSubEvent.nama_event}</p>
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
                <label className="block font-bold text-slate-800 mb-1">Sub-Event Target *</label>
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
    </div>
  );
};

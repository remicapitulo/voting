import {
  User,
  EventModel,
  CategoryModel,
  TeamModel,
  JuryScore,
  PublicVote,
  ScoreRecapItem
} from '../types';
import {
  INITIAL_EVENT,
  INITIAL_EVENTS,
  INITIAL_CATEGORIES,
  INITIAL_TEAMS,
  INITIAL_USERS,
  INITIAL_JURY_SCORES,
  INITIAL_PUBLIC_VOTES
} from '../data/initialData';

const STORAGE_KEYS = {
  GAS_URL: 'duta_camp_gas_url',
  CURRENT_USER: 'duta_camp_current_user',
  EVENT: 'duta_camp_event',
  EVENTS: 'duta_camp_events_list',
  CATEGORIES: 'duta_camp_categories',
  TEAMS: 'duta_camp_teams',
  USERS: 'duta_camp_users',
  JURY_SCORES: 'duta_camp_jury_scores',
  PUBLIC_VOTES: 'duta_camp_public_votes',
  WEIGHTS: 'duta_camp_weights' // e.g. { jury: 70, public: 30 }
};

export interface AppStateData {
  event: EventModel;
  events: EventModel[];
  categories: CategoryModel[];
  teams: TeamModel[];
  users: User[];
  juryScores: JuryScore[];
  publicVotes: PublicVote[];
  weights: { jury: number; public: number };
}

// URL Default Google Apps Script (Telah disematkan permanen ke sistem):
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwc-f56iuEqEO-IhjALRKfL0f6pVWZGA0mRC4CSS5UzVUMm0hbgBYjHUycNjIvEPubJ/exec';

class ApiService {
  private gasUrl: string = DEFAULT_GAS_URL;

  constructor() {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL);
    if (savedUrl && savedUrl.trim().startsWith('http')) {
      this.gasUrl = savedUrl.trim();
    } else {
      this.gasUrl = DEFAULT_GAS_URL;
      localStorage.setItem(STORAGE_KEYS.GAS_URL, DEFAULT_GAS_URL);
    }
    this.initializeLocalStorage();
  }

  private initializeLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENT)) {
      localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(INITIAL_EVENT));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JURY_SCORES)) {
      localStorage.setItem(STORAGE_KEYS.JURY_SCORES, JSON.stringify(INITIAL_JURY_SCORES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PUBLIC_VOTES)) {
      localStorage.setItem(STORAGE_KEYS.PUBLIC_VOTES, JSON.stringify(INITIAL_PUBLIC_VOTES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WEIGHTS)) {
      localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify({ jury: 70, public: 30 }));
    }

    // Auto-sync dari Database Google Sheets jika URL GAS telah terkonfigurasi
    if (this.gasUrl) {
      setTimeout(() => {
        this.syncFromDatabase().catch(console.warn);
      }, 100);
    }
  }

  public getGasUrl(): string {
    return this.gasUrl;
  }

  public setGasUrl(url: string): void {
    this.gasUrl = url.trim();
    localStorage.setItem(STORAGE_KEYS.GAS_URL, this.gasUrl);
  }

  /**
   * Mengambil seluruh data murni langsung dari Database Google Sheets (Cloud)
   * Menyimpan ke LocalStorage sebagai sinkronisasi aktif.
   */
  public async syncFromDatabase(explicitUrl?: string): Promise<{
    success: boolean;
    message: string;
    counts?: { events: number; categories: number; teams: number; users: number; scores: number; votes: number };
  }> {
    const targetUrl = explicitUrl || this.gasUrl;
    if (!targetUrl) {
      return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
    }

    try {
      let rawData: any = null;
      // 1. Coba ambil via GET action=getAllData
      try {
        const res = await fetch(`${targetUrl}?action=getAllData`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && json.data) {
            rawData = json.data;
          }
        }
      } catch (e) {
        console.warn('GET getAllData failed, mencoba POST:', e);
      }

      // 2. Jika GET gagal, coba via POST
      if (!rawData) {
        const postRes = await fetch(targetUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'getAllData' })
        });
        const postJson = await postRes.json();
        if (postJson.status === 'success' && postJson.data) {
          rawData = postJson.data;
        }
      }

      if (!rawData) {
        return {
          success: false,
          message: 'Gagal membaca data dari Google Sheets. Pastikan Web App di-deploy dengan opsi "Anyone".'
        };
      }

      // Normalisasi & Deduplikasi Events dari Database
      const seenEventIds = new Set<string>();
      const events: EventModel[] = [];
      for (const e of rawData.events || []) {
        const id = String(e.id_event || '').trim();
        if (id && !seenEventIds.has(id)) {
          seenEventIds.add(id);

          // Resolusi fleksibel status_aktif dari database
          let isActive = true;
          if (typeof e.status_aktif === 'boolean') {
            isActive = e.status_aktif;
          } else if (typeof e.tahun === 'boolean') {
            // Jika kolom tergeser, boolean tersimpan di kolom 'tahun'
            isActive = e.tahun;
          } else if (String(e.status_aktif).trim().toLowerCase() === 'false' || String(e.status_aktif).trim() === '0') {
            isActive = false;
          } else if (String(e.tahun).trim().toLowerCase() === 'false' || String(e.tahun).trim() === '0') {
            isActive = false;
          } else if (String(e.status_aktif).trim().toLowerCase() === 'true' || String(e.status_aktif).trim() === '1') {
            isActive = true;
          } else if (String(e.tahun).trim().toLowerCase() === 'true' || String(e.tahun).trim() === '1') {
            isActive = true;
          } else {
            // Default sub-event adalah AKTIF (Buka) jika tidak diset false secara eksplisit
            isActive = true;
          }

          // Resolusi nama_event & kode_event jika terjadi pergeseran kolom spreadsheet
          let namaEvent = String(e.nama_event || '').trim();
          let kodeEvent = String(e.kode_event || '').trim();
          let tahunStr = '2026';

          if (typeof e.status_aktif === 'string' && e.status_aktif.length > 5 && e.status_aktif.toLowerCase() !== 'true' && e.status_aktif.toLowerCase() !== 'false') {
            // Kolom status_aktif di spreadsheet terisi nama panjang event
            namaEvent = e.status_aktif;
            kodeEvent = String(e.nama_event || 'Duta Camp').trim();
            tahunStr = (typeof e.kode_event === 'number' || (typeof e.kode_event === 'string' && /^\d+$/.test(e.kode_event)))
              ? String(e.kode_event)
              : '2026';
          } else {
            if (typeof e.tahun === 'string' && /^\d+$/.test(e.tahun)) {
              tahunStr = e.tahun;
            } else if (typeof e.tahun === 'number') {
              tahunStr = String(e.tahun);
            }
          }

          events.push({
            id_event: id,
            kode_event: kodeEvent || namaEvent || 'Duta Camp',
            nama_event: namaEvent || kodeEvent || 'Duta Camp',
            tahun: tahunStr,
            status_aktif: isActive,
            batas_waktu: e.batas_waktu ? String(e.batas_waktu) : undefined,
            deskripsi: e.deskripsi ? String(e.deskripsi) : '',
            tipe_peserta: e.tipe_peserta || 'Group',
            banner_color: e.banner_color || 'from-emerald-950 via-emerald-900 to-teal-950'
          });
        }
      }

      // Normalisasi & Deduplikasi Categories dari Database
      const seenCatIds = new Set<string>();
      const categories: CategoryModel[] = [];
      for (const c of rawData.categories || []) {
        const id = String(c.id_kategori || '').trim();
        if (id && !seenCatIds.has(id)) {
          seenCatIds.add(id);
          let kriteriaArr: string[] = [];
          if (Array.isArray(c.kriteria)) {
            kriteriaArr = c.kriteria;
          } else if (typeof c.kriteria === 'string' && c.kriteria.trim().length > 0) {
            try {
              kriteriaArr = JSON.parse(c.kriteria);
            } catch {
              kriteriaArr = c.kriteria.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          categories.push({
            id_kategori: id,
            id_event: String(c.id_event || ''),
            nama_kategori: String(c.nama_kategori || ''),
            tipe: String(c.tipe || 'Lomba'),
            assessment_type: (c.assessment_type === 'public_only' || c.assessment_type === 'jury_only' || c.assessment_type === 'all')
              ? c.assessment_type
              : 'all',
            tipe_peserta: c.tipe_peserta || 'Group',
            votes_required: Number(c.votes_required) || 1,
            kriteria: kriteriaArr,
            deskripsi: c.deskripsi ? String(c.deskripsi) : '',
            iconName: c.iconName || 'Trophy'
          });
        }
      }

      // Normalisasi & Deduplikasi Teams dari Database
      const seenTeamIds = new Set<string>();
      const teams: TeamModel[] = [];
      for (const t of rawData.teams || []) {
        const id = String(t.id_team || '').trim();
        if (id && !seenTeamIds.has(id)) {
          seenTeamIds.add(id);
          let anggotaArr: string[] = [];
          if (Array.isArray(t.anggota)) {
            anggotaArr = t.anggota;
          } else if (typeof t.anggota === 'string' && t.anggota.trim().length > 0) {
            try {
              anggotaArr = JSON.parse(t.anggota);
            } catch {
              anggotaArr = t.anggota.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }

          // Deteksi kategori regu & foto_url jika tergeser di spreadsheet
          let katRegu: 'Putra' | 'Putri' = 'Putra';
          let fotoUrl = String(t.foto_url || '').trim();
          if (fotoUrl === 'Putra' || fotoUrl === 'Putri') {
            katRegu = fotoUrl;
            fotoUrl = (t.kategori_regu && t.kategori_regu !== 'Putra' && t.kategori_regu !== 'Putri') ? String(t.kategori_regu) : '';
          } else if (t.kategori_regu === 'Putri') {
            katRegu = 'Putri';
          }

          teams.push({
            id_team: id,
            id_event: String(t.id_event || ''),
            nama_regu: String(t.nama_regu || ''),
            kelas_pangkalan: String(t.kelas_pangkalan || ''),
            kategori_regu: katRegu,
            foto_url: fotoUrl,
            anggota: anggotaArr,
            motto: t.motto || '',
            ketua_regu: t.ketua_regu || '',
            color_theme: t.color_theme || 'emerald'
          });
        }
      }

      // Normalisasi & Deduplikasi Users dari Database
      const seenUsernames = new Set<string>();
      const users: User[] = [];
      for (const u of rawData.users || []) {
        const uname = String(u.username || '').trim().toLowerCase();
        if (uname && !seenUsernames.has(uname)) {
          seenUsernames.add(uname);
          users.push({
            id: String(u.id || `user-${Date.now()}`),
            username: uname,
            nama: String(u.nama || ''),
            role: u.role || 'voter',
            emailOrWa: u.emailOrWa || '',
            jurySpecialty: u.jurySpecialty || '',
            password: u.password ? String(u.password) : undefined,
            created_at: u.created_at || new Date().toISOString()
          });
        }
      }

      // Normalisasi & Deduplikasi Jury Scores dari Database
      const seenScoreKeys = new Set<string>();
      const juryScores: JuryScore[] = [];
      for (const s of rawData.jury_scores || []) {
        let idTeam = String(s.id_team || '');
        let idKategori = String(s.id_kategori || '');
        let juryName = String(s.jury_name || '');
        let skorNum = Number(s.skor_1_to_5) || 0;
        let catatanStr = String(s.catatan || '');
        let kScores: Record<string, number> = {};
        let isFinal = true;
        let timestampStr = String(s.timestamp || new Date().toISOString());

        // Jika terjadi pergeseran kolom pada sheet Jury_Scores
        if (typeof s.skor_1_to_5 === 'string' && (s.skor_1_to_5.startsWith('cat-') || s.skor_1_to_5.startsWith('cat_'))) {
          idTeam = String(s.id_kategori || '');
          idKategori = String(s.skor_1_to_5 || '');
          juryName = String(s.id_team || '');
          skorNum = Number(s.catatan) || 0;
          catatanStr = String(s.timestamp || '');
          timestampStr = String(s.is_final || new Date().toISOString());
          isFinal = s.kriteria_scores === true || String(s.kriteria_scores).toLowerCase() === 'true';
          if (typeof s.jury_name === 'string' && s.jury_name.trim().startsWith('{')) {
            try { kScores = JSON.parse(s.jury_name); } catch {}
          }
        } else {
          if (typeof s.kriteria_scores === 'object' && s.kriteria_scores !== null) {
            kScores = s.kriteria_scores;
          } else if (typeof s.kriteria_scores === 'string' && s.kriteria_scores.trim().length > 0) {
            try {
              kScores = JSON.parse(s.kriteria_scores);
            } catch {
              kScores = {};
            }
          }
          isFinal = s.is_final === true || String(s.is_final).toLowerCase() === 'true';
        }

        const key = `${s.id_jury}_${idTeam}_${idKategori}`;
        if (!seenScoreKeys.has(key)) {
          seenScoreKeys.add(key);
          juryScores.push({
            id_score: String(s.id_score || `score-${Date.now()}`),
            id_jury: String(s.id_jury || ''),
            jury_name: juryName,
            id_team: idTeam,
            id_kategori: idKategori,
            skor_1_to_5: skorNum,
            catatan: catatanStr,
            kriteria_scores: kScores,
            is_final: isFinal,
            timestamp: timestampStr
          });
        }
      }

      // Normalisasi & Deduplikasi Public Votes dari Database
      const seenVoteKeys = new Set<string>();
      const publicVotes: PublicVote[] = [];
      for (const v of rawData.public_votes || []) {
        const key = `${v.id_vote || ''}_${v.id_voter}_${v.id_team}_${v.id_kategori}`;
        if (!seenVoteKeys.has(key)) {
          seenVoteKeys.add(key);
          publicVotes.push({
            id_vote: String(v.id_vote || `vote-${Date.now()}`),
            id_voter: String(v.id_voter || ''),
            voter_name: String(v.voter_name || ''),
            id_team: String(v.id_team || ''),
            id_kategori: String(v.id_kategori || ''),
            timestamp: v.timestamp || new Date().toISOString()
          });
        }
      }

      // Simpan langsung ke LocalStorage cache
      if (events.length > 0) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        const active = events.find(e => e.status_aktif) || events[0];
        localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(active));
      }
      if (categories.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      }
      if (teams.length > 0) {
        localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
      }
      if (users.length > 0) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      localStorage.setItem(STORAGE_KEYS.JURY_SCORES, JSON.stringify(juryScores));
      localStorage.setItem(STORAGE_KEYS.PUBLIC_VOTES, JSON.stringify(publicVotes));

      return {
        success: true,
        message: 'Data berhasil disinkronkan langsung dari Database Google Sheets!',
        counts: {
          events: events.length,
          categories: categories.length,
          teams: teams.length,
          users: users.length,
          scores: juryScores.length,
          votes: publicVotes.length
        }
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal membaca database: ${err.message || 'Koneksi terputus'}`
      };
    }
  }

  public async testGasConnection(targetUrl?: string): Promise<{ success: boolean; message: string; counts?: any }> {
    const url = targetUrl || this.gasUrl;
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum diisi' };
    }
    try {
      const response = await fetch(`${url}?action=ping`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      // Sinkronkan seluruh data database secara otomatis saat tes koneksi sukses
      const syncRes = await this.syncFromDatabase(url);

      return {
        success: true,
        message: syncRes.success
          ? `Koneksi berhasil! ${syncRes.counts?.events || 0} Sub-Event, ${syncRes.counts?.categories || 0} Cabang Lomba, ${syncRes.counts?.teams || 0} Peserta berhasil dimuat langsung dari database.`
          : (data.message || 'Koneksi ke Google Apps Script berhasil!')
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal terhubung: ${err.message || 'Pastikan Web App di-deploy dengan opsi "Anyone"'}`
      };
    }
  }

  public getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  public getEvents(): EventModel[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || JSON.stringify(INITIAL_EVENTS));
    } catch {
      return INITIAL_EVENTS;
    }
  }

  public getActiveEvent(): EventModel {
    const events = this.getEvents();
    const active = events.find(e => e.status_aktif) || events[0] || INITIAL_EVENT;
    return active;
  }

  public setActiveEvent(id_event: string): { success: boolean; message: string } {
    const events = this.getEvents();
    let selectedEvent: EventModel | null = null;
    const updatedEvents = events.map(ev => {
      if (ev.id_event === id_event) {
        selectedEvent = { ...ev, status_aktif: true };
        return selectedEvent;
      }
      return ev; // Maintain all other events active so users can vote across different events
    });

    if (!selectedEvent) {
      return { success: false, message: 'Sub Event tidak ditemukan' };
    }

    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updatedEvents));
    localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(selectedEvent));

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'setActiveEvent', id_event })
      }).catch(console.warn);
    }

    return {
      success: true,
      message: `Sub-Event "${(selectedEvent as EventModel).nama_event}" telah dipilih.`
    };
  }

  public toggleEventStatus(id_event: string, isActive: boolean): { success: boolean; message: string } {
    const events = this.getEvents();
    let eventName = '';
    const updated = events.map(ev => {
      if (ev.id_event === id_event) {
        eventName = ev.nama_event;
        return { ...ev, status_aktif: isActive };
      }
      return ev;
    });

    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));

    const currentActive = this.getActiveEvent();
    if (currentActive.id_event === id_event) {
      localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify({ ...currentActive, status_aktif: isActive }));
    }

    if (this.gasUrl) {
      const targetEvent = updated.find(e => e.id_event === id_event);
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'toggleEventStatus', id_event, is_active: isActive })
      }).catch(console.warn);

      if (targetEvent) {
        fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'manageEvent',
            operation: 'update',
            ...targetEvent,
            status_aktif: isActive
          })
        }).catch(console.warn);
      }
    }

    return {
      success: true,
      message: `Sub-Event "${eventName || id_event}" berhasil ${isActive ? 'DIBUKA (Aktif)' : 'DITUTUP (Non-Aktif)'}.`
    };
  }

  public updateEventDeadline(id_event: string, deadline: string): { success: boolean; message: string } {
    const events = this.getEvents();
    const updatedEvents = events.map(ev => {
      if (ev.id_event === id_event) {
        return { ...ev, batas_waktu: deadline };
      }
      return ev;
    });

    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updatedEvents));

    // Also update active event if matched
    const currentActive = this.getActiveEvent();
    if (currentActive.id_event === id_event) {
      const newActive = { ...currentActive, batas_waktu: deadline };
      localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(newActive));
    }

    if (this.gasUrl) {
      const targetEvent = updatedEvents.find(e => e.id_event === id_event);
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateEventDeadline', id_event, deadline })
      }).catch(console.warn);

      if (targetEvent) {
        fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'manageEvent',
            operation: 'update',
            ...targetEvent
          })
        }).catch(console.warn);
      }
    }

    return {
      success: true,
      message: 'Batas waktu penjurian & vote berhasil diperbarui.'
    };
  }

  public addEvent(newEvent: Omit<EventModel, 'id_event'>): { success: boolean; event: EventModel; message: string } {
    const events = this.getEvents();
    const id = `event-${Date.now()}`;
    const eventObj: EventModel = {
      ...newEvent,
      id_event: id,
      status_aktif: newEvent.status_aktif !== undefined ? newEvent.status_aktif : true
    };
    events.push(eventObj);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    if (eventObj.status_aktif) {
      localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(eventObj));
    }

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'manageEvent', operation: 'create', ...eventObj })
      }).catch(console.warn);
    }

    return {
      success: true,
      event: eventObj,
      message: `Sub Event "${eventObj.nama_event}" berhasil dibuat.`
    };
  }

  public updateEvent(updated: EventModel): { success: boolean; message: string } {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id_event === updated.id_event);
    if (index >= 0) {
      events[index] = updated;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
      const currentActive = this.getActiveEvent();
      if (currentActive.id_event === updated.id_event) {
        localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(updated));
      }
      if (this.gasUrl) {
        fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'manageEvent', operation: 'update', ...updated })
        }).catch(console.warn);
      }
      return { success: true, message: `Sub-Event "${updated.nama_event}" berhasil diperbarui.` };
    }
    return { success: false, message: 'Sub Event tidak ditemukan.' };
  }

  public isEventExpired(eventOrId?: EventModel | string): boolean {
    let ev: EventModel | null = null;
    if (typeof eventOrId === 'string') {
      const events = this.getEvents();
      ev = events.find(e => e.id_event === eventOrId) || null;
    } else if (eventOrId) {
      ev = eventOrId;
    } else {
      ev = this.getActiveEvent();
    }
    if (!ev || !ev.batas_waktu) return false;
    const deadline = new Date(ev.batas_waktu).getTime();
    if (isNaN(deadline)) return false;
    return Date.now() > deadline;
  }

  public isEventLocked(eventOrId?: EventModel | string): boolean {
    let ev: EventModel | null = null;
    if (typeof eventOrId === 'string') {
      const events = this.getEvents();
      ev = events.find(e => e.id_event === eventOrId) || null;
    } else if (eventOrId) {
      ev = eventOrId;
    } else {
      ev = this.getActiveEvent();
    }
    if (!ev) return true;
    return ev.status_aktif === false;
  }

  public isEventClosed(eventOrId?: EventModel | string): {
    isClosed: boolean;
    isLocked: boolean;
    isExpired: boolean;
    reason: 'not_active' | 'expired' | null;
  } {
    let ev: EventModel | null = null;
    if (typeof eventOrId === 'string') {
      const events = this.getEvents();
      ev = events.find(e => e.id_event === eventOrId) || null;
    } else if (eventOrId) {
      ev = eventOrId;
    } else {
      ev = this.getActiveEvent();
    }
    if (!ev) return { isClosed: true, isLocked: true, isExpired: false, reason: 'not_active' };

    const isLocked = ev.status_aktif === false;
    const isExpired = this.isEventExpired(ev);

    // 1. Di Kunci oleh Admin (status_aktif: false) -> Alasan: not_active
    if (isLocked) {
      return { isClosed: true, isLocked: true, isExpired, reason: 'not_active' };
    }

    // 2. Batas waktu telah habis, belum di kunci (status_aktif: true tapi Date.now() > batas_waktu) -> Alasan: expired
    if (isExpired) {
      return { isClosed: true, isLocked: false, isExpired: true, reason: 'expired' };
    }

    return { isClosed: false, isLocked: false, isExpired: false, reason: null };
  }

  public getAppState(): AppStateData {
    const events = this.getEvents();
    const activeEvent = events.find(e => e.status_aktif) || events[0] || INITIAL_EVENT;
    return {
      event: activeEvent,
      events: events,
      categories: JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]'),
      teams: JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]'),
      users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
      juryScores: JSON.parse(localStorage.getItem(STORAGE_KEYS.JURY_SCORES) || '[]'),
      publicVotes: JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_VOTES) || '[]'),
      weights: JSON.parse(localStorage.getItem(STORAGE_KEYS.WEIGHTS) || JSON.stringify({ jury: 70, public: 30 }))
    };
  }

  public async login(username: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // If GAS URL is configured, optionally try GAS first
    if (this.gasUrl) {
      try {
        const res = await fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'login', username: cleanUser, password: cleanPass })
        });
        const gasResult = await res.json();
        if (gasResult.status === 'success' && gasResult.user) {
          const userObj: User = {
            id: gasResult.user.id,
            username: gasResult.user.username,
            nama: gasResult.user.nama,
            role: gasResult.user.role,
            created_at: gasResult.user.created_at || new Date().toISOString()
          };
          this.setCurrentUser(userObj);
          return { success: true, user: userObj, message: 'Login berhasil via Google Sheets' };
        }
      } catch (e) {
        console.warn('GAS login failed, falling back to local database:', e);
      }
    }

    // Local DB lookup
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const matched = users.find(
      u => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (matched) {
      const sanitized: User = { ...matched };
      delete sanitized.password;
      this.setCurrentUser(sanitized);
      return { success: true, user: sanitized, message: 'Login berhasil' };
    }

    return { success: false, message: 'Username atau password tidak sesuai' };
  }

  public async registerVoter(
    nama: string,
    emailOrWa: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; user?: User; message: string }> {
    const cleanUser = username.trim().toLowerCase();
    const cleanNama = nama.trim();
    const cleanWa = emailOrWa.trim();
    const cleanPass = password.trim();

    if (!cleanNama || !cleanUser || !cleanPass) {
      return { success: false, message: 'Semua kolom bertanda bintang wajib diisi' };
    }

    // Attempt GAS write if URL present
    if (this.gasUrl) {
      try {
        const res = await fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'register',
            nama: cleanNama,
            emailOrWa: cleanWa,
            username: cleanUser,
            password: cleanPass
          })
        });
        const gasResult = await res.json();
        if (gasResult.status === 'error') {
          return { success: false, message: gasResult.message || 'Pendaftaran gagal' };
        }
      } catch (e) {
        console.warn('GAS registration failed, proceeding to local store:', e);
      }
    }

    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const exists = users.some(u => u.username.toLowerCase() === cleanUser);
    if (exists) {
      return { success: false, message: `Username "${cleanUser}" sudah terdaftar` };
    }

    const newUser: User = {
      id: `voter-${Date.now()}`,
      username: cleanUser,
      nama: cleanNama,
      emailOrWa: cleanWa,
      role: 'voter',
      password: cleanPass,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const sanitized: User = { ...newUser };
    delete sanitized.password;
    this.setCurrentUser(sanitized);

    return { success: true, user: sanitized, message: 'Registrasi berhasil! Anda dapat langsung memilih.' };
  }

  public async submitPublicVote(
    voterId: string,
    voterName: string,
    teamId: string,
    categoryId: string
  ): Promise<{ success: boolean; message: string; remainingVotes?: number; totalCast?: number; requiredVotes?: number }> {
    const votes: PublicVote[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_VOTES) || '[]');
    const categories: CategoryModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const cat = categories.find(c => c.id_kategori === categoryId);
    const requiredVotes = cat?.votes_required || 1;

    // Existing votes by this voter for this category
    const userCategoryVotes = votes.filter(
      v => v.id_voter === voterId && v.id_kategori === categoryId
    );

    // Check if voter already voted for this specific team
    const alreadyVotedThisTeam = userCategoryVotes.some(v => v.id_team === teamId);
    if (alreadyVotedThisTeam) {
      return { success: false, message: 'Anda sudah memberikan suara untuk regu ini.' };
    }

    // Check if voter has already reached the required votes count
    if (userCategoryVotes.length >= requiredVotes) {
      return {
        success: false,
        message: `Hak suara Anda (${requiredVotes} suara) untuk kategori ini sudah terpenuhi sepenuhnya!`
      };
    }

    // Try posting to GAS
    if (this.gasUrl) {
      try {
        await fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'submitPublicVote',
            id_voter: voterId,
            id_team: teamId,
            id_kategori: categoryId
          })
        });
      } catch (err) {
        console.warn('Failed to sync vote to GAS, stored locally:', err);
      }
    }

    const newVote: PublicVote = {
      id_vote: `vote-${Date.now()}`,
      id_voter: voterId,
      voter_name: voterName,
      id_team: teamId,
      id_kategori: categoryId,
      timestamp: new Date().toISOString()
    };

    votes.push(newVote);
    localStorage.setItem(STORAGE_KEYS.PUBLIC_VOTES, JSON.stringify(votes));

    const totalNow = userCategoryVotes.length + 1;
    const remaining = requiredVotes - totalNow;

    if (remaining === 0) {
      return {
        success: true,
        message: `Alhamdulillah! Seluruh ${requiredVotes} hak suara Anda untuk kategori ini telah lengkap digunakan.`,
        remainingVotes: 0,
        totalCast: totalNow,
        requiredVotes
      };
    }

    return {
      success: true,
      message: `Suara berhasil dicatat (${totalNow} dari ${requiredVotes} suara). Sisa ${remaining} suara lagi yang wajib Anda tentukan.`,
      remainingVotes: remaining,
      totalCast: totalNow,
      requiredVotes
    };
  }

  public async removePublicVote(voteId: string): Promise<{ success: boolean; message: string }> {
    const votes: PublicVote[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_VOTES) || '[]');
    const filtered = votes.filter(v => v.id_vote !== voteId);
    localStorage.setItem(STORAGE_KEYS.PUBLIC_VOTES, JSON.stringify(filtered));
    return { success: true, message: 'Suara berhasil dibatalkan.' };
  }

  public updateCategoryVoteQuota(categoryId: string, votesRequired: number): { success: boolean; message: string } {
    const categories: CategoryModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const idx = categories.findIndex(c => c.id_kategori === categoryId);
    if (idx === -1) return { success: false, message: 'Kategori tidak ditemukan' };

    const cleanQuota = Math.max(1, Math.min(10, Math.floor(votesRequired)));
    categories[idx].votes_required = cleanQuota;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    return {
      success: true,
      message: `Ketentuan suara untuk kategori "${categories[idx].nama_kategori}" diatur menjadi ${cleanQuota} suara per akun voter.`
    };
  }

  public updateCategoryCriteria(categoryId: string, newCriteria: string[]): { success: boolean; message: string } {
    const categories: CategoryModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const idx = categories.findIndex(c => c.id_kategori === categoryId);
    if (idx === -1) return { success: false, message: 'Kategori tidak ditemukan' };

    const validCriteria = newCriteria.map(k => k.trim()).filter(k => k.length > 0);
    if (validCriteria.length === 0) {
      return { success: false, message: 'Pertanyaan/kriteria juri tidak boleh kosong' };
    }

    categories[idx].kriteria = validCriteria;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    return {
      success: true,
      message: `Pertanyaan form juri untuk "${categories[idx].nama_kategori}" berhasil diperbarui (${validCriteria.length} pertanyaan).`
    };
  }

  public async submitJuryScore(
    juryId: string,
    juryName: string,
    teamId: string,
    categoryId: string,
    kriteriaScores: Record<string, number>,
    catatan: string = '',
    isFinal: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    // Calculate average score 1.0 to 5.0
    const values = Object.values(kriteriaScores);
    if (values.length === 0) {
      return { success: false, message: 'Kriteria penilaian belum diisi' };
    }
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const avgScore = Number((sum / values.length).toFixed(2));

    const scores: JuryScore[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.JURY_SCORES) || '[]');

    // Try posting to GAS
    if (this.gasUrl) {
      try {
        await fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'submitJuryScore',
            id_jury: juryId,
            id_team: teamId,
            id_kategori: categoryId,
            skor_1_to_5: avgScore,
            catatan: catatan
          })
        });
      } catch (err) {
        console.warn('Failed to sync score to GAS, stored locally:', err);
      }
    }

    const existingIndex = scores.findIndex(
      s => s.id_jury === juryId && s.id_team === teamId && s.id_kategori === categoryId
    );

    const scoreItem: JuryScore = {
      id_score: existingIndex >= 0 ? scores[existingIndex].id_score : `score-${Date.now()}`,
      id_jury: juryId,
      jury_name: juryName,
      id_team: teamId,
      id_kategori: categoryId,
      kriteria_scores: kriteriaScores,
      skor_1_to_5: avgScore,
      catatan,
      is_final: isFinal,
      timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      scores[existingIndex] = scoreItem;
    } else {
      scores.push(scoreItem);
    }

    localStorage.setItem(STORAGE_KEYS.JURY_SCORES, JSON.stringify(scores));

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'submitJuryScore', ...scoreItem })
      }).catch(console.warn);
    }

    return {
      success: true,
      message: isFinal ? 'Penilaian final berhasil dikirim & disimpan.' : 'Draft nilai berhasil disimpan.'
    };
  }

  public addTeam(newTeam: Omit<TeamModel, 'id_team'>): { success: boolean; message: string } {
    const teams: TeamModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
    const id = `team-${Date.now()}`;
    const team: TeamModel = {
      ...newTeam,
      id_team: id
    };
    teams.push(team);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'manageTeam', operation: 'create', ...team })
      }).catch(console.warn);
    }

    return { success: true, message: `Regu "${team.nama_regu}" berhasil ditambahkan.` };
  }

  public updateTeam(updatedTeam: TeamModel): { success: boolean; message: string } {
    const teams: TeamModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
    const idx = teams.findIndex(t => t.id_team === updatedTeam.id_team);
    if (idx >= 0) {
      teams[idx] = updatedTeam;
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
      if (this.gasUrl) {
        fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'manageTeam', operation: 'update', ...updatedTeam })
        }).catch(console.warn);
      }
      return { success: true, message: `Data peserta "${updatedTeam.nama_regu}" berhasil diperbarui.` };
    }
    return { success: false, message: 'Peserta tidak ditemukan.' };
  }

  public deleteTeam(teamId: string): { success: boolean; message: string } {
    const teams: TeamModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
    const target = teams.find(t => t.id_team === teamId);
    const filtered = teams.filter(t => t.id_team !== teamId);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(filtered));

    // Also remove scores and votes associated with this team
    const scores: JuryScore[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.JURY_SCORES) || '[]');
    localStorage.setItem(STORAGE_KEYS.JURY_SCORES, JSON.stringify(scores.filter(s => s.id_team !== teamId)));

    const votes: PublicVote[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_VOTES) || '[]');
    localStorage.setItem(STORAGE_KEYS.PUBLIC_VOTES, JSON.stringify(votes.filter(v => v.id_team !== teamId)));

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'manageTeam', operation: 'delete', id_team: teamId })
      }).catch(console.warn);
    }

    return { success: true, message: `Peserta "${target?.nama_regu || teamId}" berhasil dihapus dari sistem.` };
  }

  public addCategory(newCat: Omit<CategoryModel, 'id_kategori'>): { success: boolean; message: string; category?: CategoryModel } {
    const categories: CategoryModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const id = `cat-${Date.now()}`;
    const category: CategoryModel = {
      ...newCat,
      id_kategori: id
    };
    categories.push(category);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'manageCategory', operation: 'create', ...category })
      }).catch(console.warn);
    }

    return { success: true, message: `Cabang lomba "${category.nama_kategori}" berhasil ditambahkan.`, category };
  }

  public updateCategory(updatedCat: CategoryModel): { success: boolean; message: string } {
    const categories: CategoryModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const idx = categories.findIndex(c => c.id_kategori === updatedCat.id_kategori);
    if (idx >= 0) {
      categories[idx] = updatedCat;
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      if (this.gasUrl) {
        fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'manageCategory', operation: 'update', ...updatedCat })
        }).catch(console.warn);
      }
      return { success: true, message: `Cabang lomba "${updatedCat.nama_kategori}" berhasil diperbarui.` };
    }
    return { success: false, message: 'Cabang lomba tidak ditemukan.' };
  }

  public deleteCategory(categoryId: string): { success: boolean; message: string } {
    const categories: CategoryModel[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const target = categories.find(c => c.id_kategori === categoryId);
    if (!target) {
      return { success: false, message: 'Cabang lomba tidak ditemukan.' };
    }

    // Ensure at least 1 category remains for the event
    const remainingInEvent = categories.filter(c => c.id_event === target.id_event && c.id_kategori !== categoryId);
    if (remainingInEvent.length === 0) {
      return {
        success: false,
        message: 'Tidak dapat menghapus cabang lomba terakhir pada sub-event ini. Minimal harus ada 1 cabang lomba aktif.'
      };
    }

    const filtered = categories.filter(c => c.id_kategori !== categoryId);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));

    // Remove jury scores and public votes belonging to this category
    const scores: JuryScore[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.JURY_SCORES) || '[]');
    localStorage.setItem(STORAGE_KEYS.JURY_SCORES, JSON.stringify(scores.filter(s => s.id_kategori !== categoryId)));

    const votes: PublicVote[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_VOTES) || '[]');
    localStorage.setItem(STORAGE_KEYS.PUBLIC_VOTES, JSON.stringify(votes.filter(v => v.id_kategori !== categoryId)));

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'manageCategory', operation: 'delete', id_kategori: categoryId })
      }).catch(console.warn);
    }

    return { success: true, message: `Cabang lomba "${target.nama_kategori}" beserta data skor terkait berhasil dihapus.` };
  }

  public addJury(juryData: { nama: string; username: string; password: string; jurySpecialty: string }): { success: boolean; message: string } {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.some(u => u.username.toLowerCase() === juryData.username.toLowerCase().trim())) {
      return { success: false, message: 'Username juri sudah digunakan' };
    }
    const newJury: User = {
      id: `jury-${Date.now()}`,
      username: juryData.username.trim().toLowerCase(),
      nama: juryData.nama.trim(),
      role: 'juri',
      jurySpecialty: juryData.jurySpecialty.trim(),
      password: juryData.password.trim(),
      created_at: new Date().toISOString()
    };
    users.push(newJury);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'manageJury', ...newJury })
      }).catch(console.warn);
    }

    return { success: true, message: `Akun Dewan Juri "${newJury.nama}" berhasil dibuat.` };
  }

  public updateJury(juryData: { id: string; nama: string; username: string; password?: string; jurySpecialty: string }): { success: boolean; message: string } {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const idx = users.findIndex(u => u.id === juryData.id);
    if (idx >= 0) {
      const cleanUsername = juryData.username.trim().toLowerCase();
      const conflict = users.some(u => u.id !== juryData.id && u.username.toLowerCase() === cleanUsername);
      if (conflict) {
        return { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh pengguna lain.` };
      }

      users[idx].nama = juryData.nama.trim();
      users[idx].username = cleanUsername;
      users[idx].jurySpecialty = juryData.jurySpecialty.trim();
      if (juryData.password && juryData.password.trim().length > 0) {
        users[idx].password = juryData.password.trim();
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      if (this.gasUrl) {
        fetch(this.gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'manageJury', operation: 'update', ...users[idx] })
        }).catch(console.warn);
      }

      return { success: true, message: `Data akun Dewan Juri "${users[idx].nama}" berhasil diperbarui.` };
    }
    return { success: false, message: 'Akun juri tidak ditemukan.' };
  }

  public deleteJury(juryId: string): { success: boolean; message: string } {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const target = users.find(u => u.id === juryId);
    const filtered = users.filter(u => u.id !== juryId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

    // Also remove scores given by this jury
    const scores: JuryScore[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.JURY_SCORES) || '[]');
    localStorage.setItem(STORAGE_KEYS.JURY_SCORES, JSON.stringify(scores.filter(s => s.id_jury !== juryId)));

    if (this.gasUrl) {
      fetch(this.gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'manageJury', operation: 'delete', id_jury: juryId })
      }).catch(console.warn);
    }

    return { success: true, message: `Akun Dewan Juri "${target?.nama || juryId}" berhasil dihapus.` };
  }

  public updateWeights(juryWeight: number, publicWeight: number): void {
    localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify({ jury: juryWeight, public: publicWeight }));
  }

  public getWeights(): { jury: number; public: number } {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WEIGHTS) || JSON.stringify({ jury: 70, public: 30 }));
  }

  /**
   * Calculate final recap score combining Jury Scores and Public Votes with configurable weights
   */
  public calculateRecap(
    categoryId: string,
    juryWeight: number = 70,
    publicWeight: number = 30
  ): ScoreRecapItem[] {
    const state = this.getAppState();
    const category = state.categories.find(c => c.id_kategori === categoryId);
    const assessType = category?.assessment_type || 'all';
    const teams = category
      ? state.teams.filter(t => t.id_event === category.id_event)
      : state.teams;
    const categoryJuryScores = state.juryScores.filter(s => s.id_kategori === categoryId);
    const categoryPublicVotes = state.publicVotes.filter(v => v.id_kategori === categoryId);

    const totalPublicVotes = categoryPublicVotes.length;
    let maxVotesForAnyTeam = 0;

    // First pass to determine max vote
    teams.forEach(t => {
      const vCount = categoryPublicVotes.filter(v => v.id_team === t.id_team).length;
      if (vCount > maxVotesForAnyTeam) {
        maxVotesForAnyTeam = vCount;
      }
    });

    const recapList: ScoreRecapItem[] = teams.map(team => {
      // Jury scores for this team
      const teamScores = categoryJuryScores.filter(s => s.id_team === team.id_team);
      const juryCount = teamScores.length;
      let averageJuryScore1to5 = 0;
      if (juryCount > 0) {
        const sum = teamScores.reduce((acc, curr) => acc + curr.skor_1_to_5, 0);
        averageJuryScore1to5 = Number((sum / juryCount).toFixed(2));
      }
      // Convert 1-5 scale into 100-based scale (1.0 -> 20, 5.0 -> 100)
      const convertedJuryScore100 = Number((averageJuryScore1to5 * 20).toFixed(2));

      // Public votes for this team
      const teamVotes = categoryPublicVotes.filter(v => v.id_team === team.id_team);
      const publicVoteCount = teamVotes.length;
      const publicVotePercentage = totalPublicVotes > 0
        ? Number(((publicVoteCount / totalPublicVotes) * 100).toFixed(1))
        : 0;

      // Normalization of votes to 100-scale relative to max vote or percentage
      // If there's at least 1 vote, normalize relative to max votes in category (e.g. 10/10 -> 100)
      const normalizedPublicScore100 = maxVotesForAnyTeam > 0
        ? Number(((publicVoteCount / maxVotesForAnyTeam) * 100).toFixed(2))
        : 0;

      // Determine effective weights based on category assessment_type:
      // - 'all': uses juryWeight and publicWeight
      // - 'public_only': 100% public votes
      // - 'jury_only': 100% jury scores
      let effJuryWeight = juryWeight;
      let effPublicWeight = publicWeight;
      if (assessType === 'public_only') {
        effJuryWeight = 0;
        effPublicWeight = 100;
      } else if (assessType === 'jury_only') {
        effJuryWeight = 100;
        effPublicWeight = 0;
      }

      // Final weighted score = (Jury% * Jury100) + (Public% * Public100)
      const finalWeightedScore = Number((
        ((effJuryWeight / 100) * convertedJuryScore100) +
        ((effPublicWeight / 100) * normalizedPublicScore100)
      ).toFixed(2));

      return {
        team,
        juryCount,
        averageJuryScore1to5,
        convertedJuryScore100,
        publicVoteCount,
        publicVotePercentage,
        normalizedPublicScore100,
        finalWeightedScore,
        rank: 0,
        isFavorit: false
      };
    });

    // Sort descending by final weighted score
    recapList.sort((a, b) => b.finalWeightedScore - a.finalWeightedScore);

    // Assign rank 1, 2, 3...
    recapList.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Find Juara Favorit (highest public vote count)
    let highestVote = -1;
    recapList.forEach(item => {
      if (item.publicVoteCount > highestVote && item.publicVoteCount > 0) {
        highestVote = item.publicVoteCount;
      }
    });
    if (highestVote > 0 && assessType !== 'jury_only') {
      recapList.forEach(item => {
        if (item.publicVoteCount === highestVote) {
          item.isFavorit = true;
        }
      });
    }

    return recapList;
  }

  public async resetToDefaultData(): Promise<{ success: boolean; message: string }> {
    return this.syncFromDatabase();
  }
}

export const apiService = new ApiService();

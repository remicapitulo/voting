import { EventModel, CategoryModel, TeamModel, User, JuryScore, PublicVote } from '../types';

/**
 * Data Kosong / Initial State (Seluruh data kini murni bersumber dari Database Google Sheets)
 * Tidak ada lagi hardcoded user, admin, event, kategori, maupun peserta di dalam kode aplikasi.
 */

export const INITIAL_EVENTS: EventModel[] = [];

export const INITIAL_EVENT: EventModel = {
  id_event: '',
  nama_event: 'Memuat Event Database...',
  kode_event: '',
  deskripsi: 'Menghubungkan ke database...',
  tahun: '2026',
  status_aktif: true,
  tipe_peserta: 'Group'
};

export const INITIAL_CATEGORIES: CategoryModel[] = [];

export const INITIAL_TEAMS: TeamModel[] = [];

export const INITIAL_USERS: User[] = [];

export const INITIAL_JURY_SCORES: JuryScore[] = [];

export const INITIAL_PUBLIC_VOTES: PublicVote[] = [];

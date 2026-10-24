export type UserRole = 'admin' | 'juri' | 'voter';

export interface User {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  emailOrWa?: string;
  password?: string;
  created_at: string;
  jurySpecialty?: string; // e.g. "Juri Pentas Seni", "Juri Masak Rimba"
}

export type EventParticipantType = 'Group' | 'Individu' | 'Campuran';

export interface EventModel {
  id_event: string;
  nama_event: string;
  kode_event: string; // e.g. "Duta Camp", "PHBI", "PHBN"
  deskripsi: string;
  tahun: string;
  status_aktif: boolean; // Aktif di Voting Publik & Juri
  batas_waktu?: string; // ISO string batas waktu voting/penjurian (misal: 2026-10-31T23:59:00)
  tipe_peserta: EventParticipantType; // 'Group' | 'Individu' | 'Campuran'
  banner_color?: string;
}

export type AssessmentType = 'all' | 'public_only' | 'jury_only';

export interface CategoryModel {
  id_kategori: string;
  id_event: string;
  nama_kategori: string;
  deskripsi: string;
  tipe: string; // "Pentas Seni", "Lomba Masak", "Tahfidz", "Pidato", dll
  kriteria: string[]; // List of evaluation criteria / questions for jury
  iconName: string;
  votes_required?: number; // Jumlah vote publik per akun (tidak boleh kurang tidak boleh lebih)
  tipe_peserta?: 'Group' | 'Individu'; // Khusus kategori ini per group atau perorangan
  assessment_type?: AssessmentType; // 'all' (Multi: Vote & Juri) | 'public_only' (Vote Bebas Saja) | 'jury_only' (Juri Saja)
}

export interface TeamModel {
  id_team: string;
  id_event: string; // Terikat ke Sub-Event tertentu (Duta Camp, PHBI, PHBN)
  nama_regu: string; // Nama Regu/Kelompok ATAU Nama Peserta Perorangan
  tipe_partisipasi?: 'Group' | 'Individu';
  kategori_regu: 'Putra' | 'Putri';
  kelas_pangkalan: string; // Kelas / Pangkalan / Asal Kontingen
  motto: string;
  ketua_regu?: string; // Ketua regu jika Group, atau pembina/wali jika Individu
  foto_url?: string;
  color_theme?: string;
  anggota?: string[];
}

export interface JuryScore {
  id_score: string;
  id_jury: string;
  jury_name: string;
  id_team: string;
  id_kategori: string;
  kriteria_scores: Record<string, number>; // criterion -> 1 to 5
  skor_1_to_5: number; // average score between 1.0 and 5.0
  catatan?: string;
  is_final: boolean;
  timestamp: string;
}

export interface PublicVote {
  id_vote: string;
  id_voter: string;
  voter_name: string;
  id_team: string;
  id_kategori: string;
  timestamp: string;
}

export interface ScoreRecapItem {
  team: TeamModel;
  juryCount: number;
  averageJuryScore1to5: number; // 1 to 5 scale
  convertedJuryScore100: number; // 20 to 100 scale (average * 20)
  publicVoteCount: number;
  publicVotePercentage: number;
  normalizedPublicScore100: number; // max vote = 100, proportional
  finalWeightedScore: number; // (Jury * bobotJuri + Public * bobotPublic)
  rank: number;
  isFavorit: boolean;
}

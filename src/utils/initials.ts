/**
 * Helper untuk mengekstrak inisial nama regu / peserta
 * Mengabaikan kata umum seperti: "Regu", "Grup", "Tim", "Batch", "Kontingen", "Pasukan", dll.
 * 
 * Contoh:
 * - "Regu Anggrek" -> "AN"
 * - "Regu Elang" -> "EL"
 * - "Regu Garuda" -> "GA"
 * - "Regu Mawar" -> "MA"
 * - "Regu Rajawali (Putra)" -> "RA"
 * - "Regu Singa Lodaya" -> "SL"
 * - "Ahmad Fauzi" -> "AF"
 */
export function getTeamInitials(rawName: string): string {
  if (!rawName) return 'PD';

  // 1. Bersihkan tanda kurung dan informasi tambahan, misal (Putra), (Putri), (Kelas 7D), dsb.
  const clean = rawName
    .replace(/\s*\([^)]*\)/g, '')
    .trim();

  // 2. Daftar kata awalan yang harus diabaikan: "Regu", "Grup", "Tim", "Batch", "Group", "Team", "Kontingen", "Pasukan"
  const ignoredPrefixes = [
    'regu',
    'grup',
    'group',
    'tim',
    'team',
    'batch',
    'kontingen',
    'pasukan'
  ];

  // Pecah kata
  const words = clean.split(/\s+/).filter(Boolean);

  // Filter kata awal yang merupakan kata abaikan
  const significantWords: string[] = [];
  let isPrefixStage = true;

  for (const w of words) {
    const normalized = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (isPrefixStage && ignoredPrefixes.includes(normalized)) {
      continue; // Lewati kata awalan seperti "Regu", "Grup", dll
    }
    isPrefixStage = false;
    significantWords.push(w);
  }

  // Jika semua kata tereliminasi (misal nama hanya "Regu"), pakai kata asli
  const finalWords = significantWords.length > 0 ? significantWords : words;

  if (finalWords.length === 0) return 'PD';

  if (finalWords.length === 1) {
    // Satu kata signifikan, misal "Anggrek" -> "AN", "Elang" -> "EL", "Garuda" -> "GA", "Mawar" -> "MA"
    const lettersOnly = finalWords[0].replace(/[^a-zA-Z0-9]/g, '');
    if (lettersOnly.length >= 2) {
      return lettersOnly.slice(0, 2).toUpperCase();
    }
    return lettersOnly.toUpperCase() || 'PD';
  }

  // Dua kata atau lebih, misal "Singa Lodaya" -> "SL", "Ahmad Fauzi" -> "AF"
  const char1 = finalWords[0].replace(/[^a-zA-Z0-9]/g, '')[0] || '';
  const char2 = finalWords[1].replace(/[^a-zA-Z0-9]/g, '')[0] || '';
  const combined = (char1 + char2).toUpperCase();
  return combined.length === 2 ? combined : finalWords[0].slice(0, 2).toUpperCase();
}

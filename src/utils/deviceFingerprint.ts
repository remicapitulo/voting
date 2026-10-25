/**
 * Utility untuk Identifikasi Unik Perangkat (Device Fingerprint & Persistent UUID)
 * Memungkinkan pemungutan suara (Voting Publik) dibatasi 1 perangkat = 1 kuota
 * tanpa mewajibkan pemilih mendaftar atau login akun.
 */

const STORAGE_KEY_DEVICE_ID = 'duta_evoting_device_uuid';
const STORAGE_KEY_DEVICE_NAME = 'duta_evoting_device_name';

/**
 * Menghasilkan hash numerik sederhana dari string atribut perangkat
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

/**
 * Membaca atau menghasilkan ID perangkat permanen dengan kombinasi entropi perangkat
 */
export function getOrCreateDeviceId(): string {
  try {
    let savedId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (savedId && savedId.trim().length > 8) {
      return savedId.trim();
    }

    // Bangun signature entropi dari perangkat browser
    const screenInfo = typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
      : '0x0';
    const lang = typeof navigator !== 'undefined' ? navigator.language || 'id' : 'id';
    const cores = typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency
      ? String((navigator as any).hardwareConcurrency)
      : '2';
    const tz = typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'
      : 'Asia/Jakarta';
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'device';

    const entropy = `${screenInfo}|${lang}|${cores}|${tz}|${ua}`;
    const hash = simpleHash(entropy).padStart(8, '0').slice(0, 8);
    const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).substring(2, 10);

    const generatedId = `dev_${hash}_${randomPart}`;
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, generatedId);
    try {
      sessionStorage.setItem(STORAGE_KEY_DEVICE_ID, generatedId);
    } catch {}

    return generatedId;
  } catch (e) {
    return `dev_guest_${Date.now()}`;
  }
}

/**
 * Format label kode perangkat ringkas dan elegan untuk ditampilkan di UI
 * Contoh: "DEV-8F92-4A1C"
 */
export function getFormattedDeviceLabel(deviceId?: string): string {
  const id = deviceId || getOrCreateDeviceId();
  const clean = id.replace(/^dev_/, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const part1 = clean.slice(0, 4) || 'SMP';
  const part2 = clean.slice(4, 8) || 'DUTA';
  return `DEV-${part1}-${part2}`;
}

/**
 * Menyimpan nama pemilih sementara yang diketik saat voting pertama kali dari perangkat ini
 */
export function getSavedVoterDisplayName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_DEVICE_NAME) || '';
  } catch {
    return '';
  }
}

export function saveVoterDisplayName(name: string): void {
  try {
    if (name && name.trim()) {
      localStorage.setItem(STORAGE_KEY_DEVICE_NAME, name.trim());
    }
  } catch {}
}

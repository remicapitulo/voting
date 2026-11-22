const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Normalisasi berbagai format tanggal/waktu dari database Google Sheets atau localStorage
 * (ISO UTC "2026-11-06T13:00:00.000Z", JS Date string, "YYYY-MM-DD HH:mm:ss", "DD/MM/YYYY HH:mm")
 * menjadi format lokal "YYYY-MM-DDTHH:mm" yang wajib untuk <input type="datetime-local">.
 */
export function toDateTimeLocalValue(raw?: string | number | Date | null): string {
  if (raw === null || raw === undefined || raw === '') return '';

  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return '';
    return `${raw.getFullYear()}-${pad2(raw.getMonth() + 1)}-${pad2(raw.getDate())}T${pad2(raw.getHours())}:${pad2(raw.getMinutes())}`;
  }

  const trimmed = String(raw).trim().replace(/^'+/, '');
  if (!trimmed) return '';

  // Sudah dalam format YYYY-MM-DDTHH:mm atau YYYY-MM-DD HH:mm(:ss) tanpa suffix timezone
  const localIsoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/);
  if (localIsoMatch) {
    return `${localIsoMatch[1]}T${localIsoMatch[2]}`;
  }

  // Format lokal Indonesia DD/MM/YYYY HH:mm atau DD-MM-YYYY HH.mm
  const idMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[ ,T]+(\d{1,2})[:.](\d{2}))?/);
  if (idMatch) {
    const day = Number(idMatch[1]);
    const month = Number(idMatch[2]);
    const year = Number(idMatch[3]);
    const hour = idMatch[4] !== undefined ? Number(idMatch[4]) : 0;
    const minute = idMatch[5] !== undefined ? Number(idMatch[5]) : 0;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`;
    }
  }

  // ISO dengan timezone (mis. "2026-11-06T13:00:00.000Z" dari Google Sheets) atau JS Date string
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}T${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
  }

  return '';
}

/**
 * Format tanggal/waktu jadwal ke tampilan Indonesia yang jelas untuk pengingat di UI.
 * Contoh: "Jum, 6 Nov 2026, 20.00"
 */
export function formatScheduleDateTime(raw?: string | number | Date | null): string {
  const normalized = toDateTimeLocalValue(raw);
  if (!normalized) return '';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format ringkas untuk badge kartu kategori (mis. "6 Nov, 20.00").
 */
export function formatScheduleShort(raw?: string | number | Date | null): string {
  const normalized = toDateTimeLocalValue(raw);
  if (!normalized) return '';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Utility untuk memformat dan menormalkan URL gambar
 * Mendukung URL langsung (https://...), data:image, dan link Google Drive
 */
export function formatImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Jika berupa data URL atau URL gambar umum
  if (trimmed.startsWith('data:image')) return trimmed;

  // Transformasi link Google Drive menjadi direct thumbnail link yang bisa di-render langsung oleh browser
  if (trimmed.includes('drive.google.com')) {
    const fileIdMatch =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // Menggunakan Google Drive thumbnail URL resolusi tinggi (w1200) tanpa perlu login cookie
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    }
  }

  return trimmed;
}

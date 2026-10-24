/**
 * Preset logo vectors and utilities for official Berita Acara Rekapitulasi
 * Layout:
 * - Kiri Kop: Logo Kegiatan (Pramuka, OSIS, Camp, dll)
 * - Kanan Kop: Logo Sekolah (SMPIT Pondok Duta, Tut Wuri Handayani, dll)
 */

export interface LogoPreset {
  id: string;
  name: string;
  type: 'kegiatan' | 'sekolah';
  svg: string;
}

// 1. Logo Pramuka (Tunas Kelapa Gerakan Pramuka)
export const LOGO_PRAMUKA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="47" fill="#582f0e" stroke="#e0a96d" stroke-width="3"/>
  <circle cx="50" cy="50" r="41" fill="none" stroke="#e0a96d" stroke-dasharray="2 2" stroke-width="1.5"/>
  <!-- Tunas Kelapa -->
  <path d="M50 16 C46 25 43 32 40 40 C36 48 37 54 41 57 C42 48 48 42 50 36 C52 42 58 48 59 57 C63 54 64 48 60 40 C57 32 54 25 50 16 Z" fill="#ffd166"/>
  <!-- Buah Kelapa -->
  <circle cx="50" cy="65" r="13" fill="#ffd166"/>
  <!-- Batang/Akar -->
  <path d="M47 77 C48 83 49 88 50 90 C51 88 52 83 53 77 Z" fill="#ffd166"/>
  <!-- Stars -->
  <circle cx="28" cy="50" r="2.5" fill="#ffd166"/>
  <circle cx="72" cy="50" r="2.5" fill="#ffd166"/>
</svg>`;

// 2. Logo OSIS SMP (Bintang, Buku, Sayap Nasional)
export const LOGO_OSIS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <polygon points="50,4 94,28 94,72 50,96 6,72 6,28" fill="#1e3a8a" stroke="#f59e0b" stroke-width="3"/>
  <!-- Buku Terbuka -->
  <path d="M22 62 C34 56 46 58 50 64 C54 58 66 56 78 62 L78 74 C66 68 54 70 50 76 C46 70 34 68 22 74 Z" fill="#ffffff" stroke="#f59e0b" stroke-width="1.5"/>
  <!-- Bintang Emas -->
  <polygon points="50,22 53,32 63,32 55,38 58,48 50,42 42,48 45,38 37,32 47,32" fill="#fbbf24"/>
  <!-- Text OSIS -->
  <text x="50" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#ffffff" letter-spacing="1">OSIS SMP</text>
</svg>`;

// 3. Logo Duta Camp (Tenda & Api Unggun Kemah)
export const LOGO_CAMP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="47" fill="#064e3b" stroke="#34d399" stroke-width="3"/>
  <!-- Tenda -->
  <polygon points="50,22 18,74 82,74" fill="#047857"/>
  <polygon points="50,22 36,74 64,74" fill="#065f46"/>
  <!-- Pintu Tenda -->
  <polygon points="50,44 42,74 58,74" fill="#022c22"/>
  <!-- Api Unggun di Depan Tenda -->
  <path d="M50 56 C47 62 44 65 44 70 C44 74 47 76 50 76 C53 76 56 74 56 70 C56 65 53 62 50 56 Z" fill="#f59e0b"/>
  <path d="M50 63 C48 66 47 68 47 71 C47 73 48 75 50 75 C52 75 53 73 53 71 C53 68 52 66 50 63 Z" fill="#ef4444"/>
  <!-- Kayu Silang -->
  <line x1="42" y1="76" x2="58" y2="79" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
  <line x1="58" y1="76" x2="42" y2="79" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
  <!-- Bintang -->
  <circle cx="28" cy="34" r="2" fill="#fef08a"/>
  <circle cx="72" cy="34" r="2" fill="#fef08a"/>
</svg>`;

// 4. Logo Resmi SMPIT Pondok Duta (Sekolah)
export const LOGO_SEKOLAH_PONDOK_DUTA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Lingkaran Luar Zamrud -->
  <circle cx="50" cy="50" r="47" fill="#064e3b" stroke="#fbbf24" stroke-width="3"/>
  <circle cx="50" cy="50" r="42" fill="#ffffff"/>
  <!-- Kubah & Pena Islam Terpadu -->
  <path d="M50 20 C42 28 36 38 36 50 C36 60 42 66 50 68 C58 66 64 60 64 50 C64 38 58 28 50 20 Z" fill="#047857"/>
  <!-- Bulan Sabit & Bintang Emas -->
  <path d="M50 26 C48 30 48 35 52 38 C49 37 47 34 47 30 C47 28 48 27 50 26 Z" fill="#f59e0b"/>
  <!-- Buku Terbuka (Al-Qur'an / Ilmu) -->
  <path d="M30 62 C38 57 46 58 50 63 C54 58 62 57 70 62 L70 72 C62 67 54 68 50 73 C46 68 38 67 30 72 Z" fill="#064e3b"/>
  <path d="M32 64 C39 60 45 61 49 65 L49 71 C45 67 39 66 32 70 Z" fill="#fbbf24"/>
  <path d="M68 64 C61 60 55 61 51 65 L51 71 C55 67 61 66 68 70 Z" fill="#fbbf24"/>
  <!-- Pita Tulisan -->
  <rect x="22" y="78" width="56" height="11" rx="3" fill="#064e3b" stroke="#f59e0b" stroke-width="1"/>
  <text x="50" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="6.5" fill="#fbbf24">PONDOK DUTA</text>
</svg>`;

// 5. Logo Tut Wuri Handayani (Kementerian Pendidikan)
export const LOGO_TUT_WURI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <polygon points="50,5 95,38 78,92 22,92 5,38" fill="#0284c7" stroke="#fbbf24" stroke-width="3"/>
  <!-- Sayap & Nyala Api -->
  <path d="M50 20 C46 30 42 38 38 46 C44 48 48 54 50 62 C52 54 56 48 62 46 C58 38 54 30 50 20 Z" fill="#fbbf24"/>
  <!-- Belencong / Nyala Api Atas -->
  <circle cx="50" cy="30" r="5" fill="#ef4444"/>
  <!-- Buku Suci -->
  <path d="M30 66 C38 62 46 63 50 68 C54 63 62 62 70 66 L70 76 C62 72 54 73 50 78 C46 73 38 72 30 76 Z" fill="#ffffff"/>
  <text x="50" y="88" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="6.5" fill="#ffffff">TUT WURI</text>
</svg>`;

export const PRESET_LOGOS: LogoPreset[] = [
  { id: 'pramuka', name: 'Gerakan Pramuka (Tunas Kelapa)', type: 'kegiatan', svg: LOGO_PRAMUKA_SVG },
  { id: 'osis', name: 'OSIS SMP Indonesia', type: 'kegiatan', svg: LOGO_OSIS_SVG },
  { id: 'camp', name: 'Duta Camp (Kemah & Api Unggun)', type: 'kegiatan', svg: LOGO_CAMP_SVG },
  { id: 'pondok_duta', name: 'SMPIT Pondok Duta (Resmi)', type: 'sekolah', svg: LOGO_SEKOLAH_PONDOK_DUTA_SVG },
  { id: 'tut_wuri', name: 'Tut Wuri Handayani (Kemdikbud)', type: 'sekolah', svg: LOGO_TUT_WURI_SVG }
];

/**
 * Cache for converted PNG data URLs so conversion runs once per SVG
 */
const pngCache: Record<string, string> = {};

/**
 * Render an SVG string or image to a PNG Data URL so jsPDF can draw it with 100% fidelity
 */
export async function rasterizeToPngDataUrl(
  imageSource: string,
  targetWidth = 160,
  targetHeight = 160
): Promise<string> {
  if (!imageSource) return '';

  // If already a raster data URL (PNG/JPEG)
  if (imageSource.startsWith('data:image/png') || imageSource.startsWith('data:image/jpeg')) {
    return imageSource;
  }

  // Check cache
  const cacheKey = `${imageSource.slice(0, 40)}_${targetWidth}`;
  if (pngCache[cacheKey]) {
    return pngCache[cacheKey];
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      let src = imageSource;
      let isBlob = false;
      let blobUrl = '';

      if (imageSource.trim().startsWith('<svg') || imageSource.includes('<svg')) {
        const blob = new Blob([imageSource], { type: 'image/svg+xml;charset=utf-8' });
        blobUrl = URL.createObjectURL(blob);
        src = blobUrl;
        isBlob = true;
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const dataUrl = canvas.toDataURL('image/png');
            pngCache[cacheKey] = dataUrl;
            resolve(dataUrl);
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        } finally {
          if (isBlob && blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }
        }
      };

      img.onerror = () => {
        if (isBlob && blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        resolve('');
      };

      img.src = src;
    } catch {
      resolve('');
    }
  });
}

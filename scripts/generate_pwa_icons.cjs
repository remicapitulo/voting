const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const logoPath = path.resolve(__dirname, '../public/assets/aistudio/Logo_SMPIPD_Baru_2017_fav_ico_a861b17a.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

// 1. Trophy SVG for general icon (with rounded corners for preview / SVG)
const trophySvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="emeraldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="35%" stop-color="#fbbf24" />
      <stop offset="70%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="darkGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background with rounded corners for icon.svg -->
  <rect width="512" height="512" rx="110" fill="url(#emeraldBg)" />
  
  <!-- Subtle circular accent / ring -->
  <circle cx="256" cy="256" r="216" fill="none" stroke="#fbbf24" stroke-width="4" stroke-opacity="0.3" stroke-dasharray="8 6" />
  <circle cx="256" cy="256" r="226" fill="none" stroke="#34d399" stroke-width="2" stroke-opacity="0.2" />

  <!-- Trophy Graphic with shadow -->
  <g filter="url(#shadow)">
    <!-- Trophy Left Handle -->
    <path d="M182 170 C120 170 110 255 182 280 L182 250 C145 235 145 195 182 195 Z" fill="url(#goldGradient)" stroke="#b45309" stroke-width="2" />

    <!-- Trophy Right Handle -->
    <path d="M330 170 C392 170 402 255 330 280 L330 250 C367 235 367 195 330 195 Z" fill="url(#goldGradient)" stroke="#b45309" stroke-width="2" />

    <!-- Trophy Main Cup (Bowl) -->
    <path d="M172 140 H340 C340 140 345 270 256 295 C167 270 172 140 172 140 Z" fill="url(#goldGradient)" stroke="#b45309" stroke-width="3" />
    
    <!-- Cup Rim Top Lip -->
    <rect x="164" y="132" width="184" height="18" rx="9" fill="url(#goldGradient)" stroke="#b45309" stroke-width="2" />
    <!-- Cup Rim Highlight -->
    <rect x="170" y="135" width="172" height="5" rx="2.5" fill="#ffffff" fill-opacity="0.5" />

    <!-- Cup Highlight Left Side -->
    <path d="M180 150 C180 150 185 250 250 280 C230 260 200 230 195 150 Z" fill="url(#goldHighlight)" />

    <!-- Cup Center School Logo (Replacing star, unedited official logo) -->
    <image href="data:image/png;base64,${logoBase64}" xlink:href="data:image/png;base64,${logoBase64}" x="214" y="168" width="84" height="86" preserveAspectRatio="xMidYMid meet" />

    <!-- Trophy Neck / Stem -->
    <path d="M242 292 H270 V325 H242 Z" fill="url(#darkGold)" />
    <path d="M236 325 H276 V345 H236 Z" fill="url(#goldGradient)" stroke="#b45309" stroke-width="1.5" />

    <!-- Trophy Tier 1 Base -->
    <path d="M216 345 H296 L290 375 H222 Z" fill="url(#darkGold)" stroke="#b45309" stroke-width="1.5" />
    
    <!-- Trophy Tier 2 Base (Plinth) -->
    <rect x="176" y="375" width="160" height="38" rx="6" fill="#0f172a" stroke="#d97706" stroke-width="3" />
    <rect x="180" y="377" width="152" height="4" fill="#fbbf24" fill-opacity="0.8" />
    
    <!-- Gold Plaque on Plinth -->
    <rect x="206" y="386" width="100" height="18" rx="3" fill="url(#goldGradient)" stroke="#b45309" stroke-width="1" />
    <rect x="216" y="393" width="80" height="3" rx="1.5" fill="#78350f" />

    <!-- Sparkle Stars -->
    <path d="M150 115 Q150 135 130 135 Q150 135 150 155 Q150 135 170 135 Q150 135 150 115 Z" fill="#fef08a" />
    <path d="M362 105 Q362 120 347 120 Q362 120 362 135 Q362 120 377 120 Q362 120 362 105 Z" fill="#fef08a" />
    <circle cx="340" cy="90" r="3" fill="#ffffff" />
    <circle cx="170" cy="100" r="2.5" fill="#ffffff" />
  </g>
</svg>`;

// 2. Full-bleed background SVG for Maskable and Apple Touch Icon (no corner clipping, full-bleed bleed area)
const trophyFullBleedSvg = trophySvg.replace('rx="110"', 'rx="0"');

async function generate() {
  const publicDir = path.resolve(__dirname, '../public');

  // Write icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), trophySvg.trim());
  console.log('Wrote public/icon.svg');

  // Generate pwa-512x512.png
  await sharp(Buffer.from(trophySvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Wrote public/pwa-512x512.png');

  // Generate pwa-192x192.png
  await sharp(Buffer.from(trophySvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Wrote public/pwa-192x192.png');

  // Generate pwa-maskable-512x512.png (full bleed so Android launcher masks without black borders)
  await sharp(Buffer.from(trophyFullBleedSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Wrote public/pwa-maskable-512x512.png');

  // Generate apple-touch-icon.png (180x180 square full bleed)
  await sharp(Buffer.from(trophyFullBleedSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Wrote public/apple-touch-icon.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});

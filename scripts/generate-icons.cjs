const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Helper to write minimal PNG format using built-in zlib
function createPng(width, height, drawPixelFn) {
  // RGBA 4 bytes per pixel
  const rowBytes = width * 4 + 1; // +1 for filter byte (0)
  const buffer = Buffer.alloc(height * rowBytes);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    buffer[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      buffer[offset++] = r;
      buffer[offset++] = g;
      buffer[offset++] = b;
      buffer[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(buffer);

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcData = chunk.subarray(4, 8 + len);
  const crc = crc32(crcData);
  chunk.writeUInt32BE(crc >>> 0, 8 + len);

  return chunk;
}

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// Pixel drawing function for Duta Evoting brand icon:
// Background: Deep Emerald (#064e3b), Circle with Golden Flame (#fbbf24 & #f59e0b)
function drawBrandPixel(isMaskable) {
  return (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Deep Emerald background: [6, 78, 59, 255]
    let r = 6, g = 78, b = 59, a = 255;

    // Corner clipping for standard (non-maskable) rounded squircle
    const radius = w * 0.46;
    if (!isMaskable && dist > radius + 1) {
      return [0, 0, 0, 0];
    }

    // Outer golden border ring
    const ringRadius = isMaskable ? w * 0.36 : w * 0.42;
    const ringWidth = w * 0.025;
    if (Math.abs(dist - ringRadius) < ringWidth) {
      return [251, 191, 36, 255]; // Golden #fbbf24
    }

    // Flame shape mathematics
    // Flame center is roughly at (cx, cy + h * 0.05)
    const scale = isMaskable ? 0.6 : 0.72;
    const fx = (x - cx) / (w * scale);
    const fy = (y - (cy + h * 0.04)) / (h * scale);

    // Approximate teardrop flame equation
    // (fx^2 + (fy + 0.3)^2) shaped flame
    if (fy >= -0.55 && fy <= 0.45) {
      const widthAtY = (0.45 - fy) * Math.sqrt(Math.max(0, fy + 0.55)) * 1.35;
      if (Math.abs(fx) <= widthAtY) {
        // Inner core flame or outer flame
        const innerWidth = widthAtY * 0.55;
        if (Math.abs(fx) <= innerWidth && fy > -0.25 && fy < 0.4) {
          return [254, 240, 138, 255]; // Bright light yellow core #fef08a
        } else if (Math.abs(fx) <= widthAtY * 0.8) {
          return [245, 158, 11, 255]; // Amber flame #f59e0b
        } else {
          return [234, 88, 12, 255]; // Orange edge #ea580c
        }
      }
    }

    return [r, g, b, a];
  };
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA Icons
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, drawBrandPixel(false)));

console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, drawBrandPixel(false)));

console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, drawBrandPixel(true)));

console.log('Generating apple-touch-icon.png (180x180)...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, drawBrandPixel(false)));

// Also create public/icon.svg
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="110" fill="#064e3b" />
  <circle cx="256" cy="256" r="215" fill="none" stroke="#fbbf24" stroke-width="12" stroke-dasharray="14 10" />
  <!-- Flame -->
  <path d="M256 95 C230 170 170 230 170 310 C170 380 210 420 256 420 C302 420 342 380 342 310 C342 230 282 170 256 95 Z" fill="#f59e0b" />
  <path d="M256 180 C242 225 205 265 205 315 C205 358 230 385 256 385 C282 385 307 358 307 315 C307 265 270 225 256 180 Z" fill="#fbbf24" />
  <path d="M256 250 C248 275 230 300 230 330 C230 354 242 370 256 370 C270 370 282 354 282 330 C282 300 264 275 256 250 Z" fill="#fef08a" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);

console.log('PWA icons successfully generated!');

import React from 'react';
import { Youtube, Instagram, Radio } from 'lucide-react';

export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.54 6.27 6.27 0 0 0 2.04-4.54V8.45a8.28 8.28 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.12z" />
  </svg>
);

export const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <Youtube className={className} />
);

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <Instagram className={className} />
);

export const LiveRadioIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <Radio className={className} />
);

/**
 * Format URL with proper scheme so it opens cleanly in external browser
 */
export function sanitizeLiveUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function hasAnyLiveStream(category?: {
  live_tiktok?: string;
  live_youtube?: string;
  live_instagram?: string;
}): boolean {
  if (!category) return false;
  return Boolean(
    (category.live_tiktok && category.live_tiktok.trim().length > 0) ||
    (category.live_youtube && category.live_youtube.trim().length > 0) ||
    (category.live_instagram && category.live_instagram.trim().length > 0)
  );
}

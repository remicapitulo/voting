import React from 'react';

interface LogoRendererProps {
  logo: string;
  alt?: string;
  className?: string;
}

export const LogoRenderer: React.FC<LogoRendererProps> = ({
  logo,
  alt = 'Logo',
  className = 'w-12 h-12 object-contain'
}) => {
  if (!logo || logo.trim().length === 0) {
    return (
      <div className={`bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-bold ${className}`}>
        LOGO
      </div>
    );
  }

  // If SVG string
  if (logo.trim().startsWith('<svg') || logo.includes('<svg')) {
    return (
      <div
        className={`${className} flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full`}
        dangerouslySetInnerHTML={{ __html: logo }}
      />
    );
  }

  // If raster data URL or standard URL
  return (
    <img
      src={logo}
      alt={alt}
      className={`${className} object-contain`}
      onError={(e) => {
        // Fallback placeholder if image load fails
        (e.target as HTMLElement).style.display = 'none';
      }}
    />
  );
};

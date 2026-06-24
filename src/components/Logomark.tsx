import React from 'react';

interface LogomarkProps {
  className?: string;
  size?: number | string;
}

export const Logomark: React.FC<LogomarkProps> = ({ className = '', size = "100%" }) => {
  const id = React.useId().replace(/:/g, '');
  
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
    >
      <defs>
        {/* Deep Charcoal Background Gradient */}
        <radialGradient id={`bg-grad-${id}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#262626" />
          <stop offset="100%" stopColor="#0A0A0A" />
        </radialGradient>

        {/* Premium Gold Gradient */}
        <linearGradient id={`gold-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Soft Ivory Glow */}
        <linearGradient id={`ivory-grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.3" />
        </linearGradient>

        {/* Shadow Filter for Bookmark */}
        <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main Squircle Shape */}
      <rect x="4" y="4" width="92" height="92" rx="28" fill={`url(#bg-grad-${id})`} />
      <rect x="4" y="4" width="92" height="92" rx="28" stroke={`url(#gold-grad-${id})`} strokeWidth="0.75" strokeOpacity="0.4" />

      {/* Book Emblem Group */}
      <g transform="translate(15, 25)">
        {/* Open Book Wings */}
        <path 
          d="M35 55C20 55 5 52 5 55V15C5 12 20 15 35 15V55Z" 
          fill="#171717"
          stroke={`url(#gold-grad-${id})`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path 
          d="M35 55C50 55 65 52 65 55V15C65 12 50 15 35 15V55Z" 
          fill="#171717"
          stroke={`url(#gold-grad-${id})`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Inner Page Detail Lines (Subtle Ivory) */}
        <g stroke={`url(#ivory-grad-${id})`} strokeWidth="0.5" strokeLinecap="round" opacity="0.15">
          <path d="M12 22h15M12 28h15M12 34h12M58 22H43M58 28H43M58 34H46" />
        </g>

        {/* Central Spine/Divider */}
        <path d="M35 12v46" stroke={`url(#gold-grad-${id})`} strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />

        {/* The Premium Bookmark */}
        <path 
          d="M42 10v35l6-4 6 4V10H42z" 
          fill={`url(#gold-grad-${id})`} 
          filter={`url(#shadow-${id})`}
        />
        
        {/* Bookmark Detail (Top Bind) */}
        <rect x="42" y="10" width="12" height="2" fill={`url(#gold-grad-${id})`} opacity="0.8" />
        
        {/* Ivory Shine (Luxury Touch) */}
        <path d="M10 15c5-2 15-2 20 0" stroke="#FFFBEB" strokeWidth="0.5" opacity="0.1" strokeLinecap="round" />
      </g>

      {/* Subtle Bottom Glow Accent */}
      <ellipse cx="50" cy="92" rx="30" ry="4" fill={`url(#gold-grad-${id})`} opacity="0.05" />
    </svg>
  );
};

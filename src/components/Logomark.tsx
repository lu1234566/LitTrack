import React from 'react';

interface LogomarkProps {
  className?: string;
  size?: number | string;
}

export const Logomark: React.FC<LogomarkProps> = ({ className = '', size = "100%" }) => {
  const id = React.useId().replace(/:/g, ''); // Unique ID for gradients
  
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
    >
      {/* Background Squircle */}
      <rect 
        x="2" 
        y="2" 
        width="96" 
        height="96" 
        rx="24" 
        fill={`url(#bg-gradient-${id})`} 
      />
      
      {/* Subtle outer border */}
      <rect 
        x="2" 
        y="2" 
        width="96" 
        height="96" 
        rx="24" 
        stroke={`url(#border-gradient-${id})`}
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />

      {/* Book Icon Group */}
      <g transform="translate(20, 25)">
        {/* Left Side Pages */}
        <path 
          d="M30 40C20 40 10 38 0 40V10C10 8 20 10 30 10V40Z" 
          fill={`url(#book-pages-${id})`}
          stroke={`url(#gold-stroke-${id})`}
          strokeWidth="0.5"
        />
        {/* Right Side Pages */}
        <path 
          d="M30 40C40 40 50 38 60 40V10C50 8 40 10 30 10V40Z" 
          fill={`url(#book-pages-${id})`}
          stroke={`url(#gold-stroke-${id})`}
          strokeWidth="0.5"
        />
        {/* Center Spine */}
        <path 
          d="M29 10C29 8 31 8 31 10V42C31 44 29 44 29 42V10Z" 
          fill={`url(#gold-accent-${id})`}
        />
        {/* Stylized Bookmark */}
        <path 
          d="M40 8V25L45 22L50 25V8H40Z" 
          fill="#F59E0B" 
          className="drop-shadow-sm"
        />
        {/* Progress Sparkles / Dots */}
        <circle cx="10" cy="5" r="1.5" fill="#FBBF24" opacity="0.6">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="0" r="1" fill="#FBBF24" opacity="0.4">
          <animate attributeName="opacity" values="0.1;0.6;0.1" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id={`bg-gradient-${id}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#171717" />
          <stop offset="1" stopColor="#0A0A0A" />
        </linearGradient>
        
        <linearGradient id={`border-gradient-${id}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#78350F" />
        </linearGradient>

        <linearGradient id={`book-pages-${id}`} x1="0" y1="0" x2="60" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#262626" />
          <stop offset="0.5" stopColor="#1A1A1A" />
          <stop offset="1" stopColor="#262626" />
        </linearGradient>

        <linearGradient id={`gold-accent-${id}`} x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>

        <linearGradient id={`gold-stroke-${id}`} x1="0" y1="0" x2="60" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" stopOpacity="0.5" />
          <stop offset="1" stopColor="#D97706" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
};

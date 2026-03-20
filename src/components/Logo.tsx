import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', collapsed = false }) => {
  return (
    <Link 
      to="/" 
      className={`flex items-center gap-3 group transition-all duration-300 hover:scale-[1.02] ${className}`}
      title="Ir para o Dashboard"
    >
      {/* Icon Portion */}
      <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-300" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Page Outline */}
          <path d="M15 75 C 15 75, 30 68, 48 75 L 48 35 C 30 28, 15 35, 15 35 Z" stroke="#F59E0B" strokeWidth="4" strokeLinejoin="round" fill="none" />
          {/* Left Page Inner Line */}
          <path d="M25 68 C 25 68, 35 63, 42 68 L 42 42 C 35 37, 25 42, 25 42 Z" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" fill="none" />
          
          {/* Right Page Outline */}
          <path d="M85 75 C 85 75, 70 68, 52 75 L 52 35 C 70 28, 85 35, 85 35 Z" stroke="#F59E0B" strokeWidth="4" strokeLinejoin="round" fill="none" />
          
          {/* Bar Chart */}
          <rect x="55" y="55" width="6" height="15" fill="#F59E0B" rx="1" />
          <rect x="65" y="45" width="6" height="25" fill="#F59E0B" rx="1" />
          <rect x="75" y="30" width="6" height="40" fill="#F59E0B" rx="1" />
          
          {/* Arrow */}
          <path d="M35 45 Q 50 25 70 20" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
          <polygon points="70,15 76,20 68,24" fill="#F59E0B" />
          
          {/* Stars */}
          <path d="M35 15 Q 38 18 41 15 Q 38 12 35 15 Z" fill="#F59E0B" />
          <path d="M45 5 Q 50 12 55 5 Q 50 -2 45 5 Z" fill="#F59E0B" />
        </svg>
      </div>

      {/* Text Portion */}
      {!collapsed && (
        <div className="flex items-baseline whitespace-nowrap">
          <span className="font-serif text-2xl font-bold tracking-tight text-neutral-100">LitTrack</span>
          <span className="font-serif text-2xl font-bold tracking-tight text-amber-500 ml-1.5">2026</span>
        </div>
      )}
    </Link>
  );
};

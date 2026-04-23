import React from 'react';
import { Link } from 'react-router-dom';

import { Logomark } from './Logomark';

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
      <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl group-hover:border-amber-500/50 transition-all duration-300">
        <Logomark />
      </div>

      {/* Text Portion */}
      {!collapsed && (
        <div className="flex flex-col leading-tight whitespace-nowrap">
          <span className="font-serif text-xl font-bold tracking-tight text-neutral-100">LitTrack</span>
          <span className="font-serif text-sm font-medium tracking-widest text-amber-500/80 uppercase">2026</span>
        </div>
      )}
    </Link>
  );
};

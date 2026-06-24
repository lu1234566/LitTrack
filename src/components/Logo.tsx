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
          <span className="font-serif text-2xl font-bold tracking-tight text-neutral-100 italic">Readora</span>
          <span className="font-serif text-[10px] font-medium tracking-[0.25em] text-amber-500/80 uppercase">Diário Literário</span>
        </div>
      )}
    </Link>
  );
};

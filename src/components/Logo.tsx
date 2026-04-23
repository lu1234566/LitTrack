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
      <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/20 transition-all duration-300">
        <img 
          src="/logo.png" 
          alt="LitTrack Logo" 
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=LT&backgroundColor=f59e0b';
          }}
          referrerPolicy="no-referrer"
        />
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

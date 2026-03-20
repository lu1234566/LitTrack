import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Key, Globe, Lock, ChevronRight } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { Community } from '../types';

interface CommunitySidebarProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ onCreateClick, onJoinClick }) => {
  const { userCommunities, activeCommunity, setActiveCommunity } = useCommunity();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-semibold text-amber-500 flex items-center gap-2">
          <Users size={20} />
          Minhas Comunidades
        </h2>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => setActiveCommunity(null)}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all group ${
            activeCommunity === null 
              ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            activeCommunity === null ? 'border-amber-500/50 bg-amber-500/10' : 'border-neutral-800 bg-neutral-900'
          }`}>
            <Globe size={20} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold truncate">Feed Global</p>
            <p className="text-[10px] opacity-70">Toda a comunidade</p>
          </div>
          <ChevronRight size={16} className={`transition-transform ${activeCommunity === null ? 'rotate-90' : ''}`} />
        </button>

        {userCommunities.map((community) => (
          <button
            key={community.id}
            onClick={() => setActiveCommunity(community)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all group ${
              activeCommunity?.id === community.id 
                ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <img 
                src={community.imageUrl} 
                alt={community.name} 
                className={`w-10 h-10 rounded-xl object-cover border ${
                  activeCommunity?.id === community.id ? 'border-amber-500/50' : 'border-neutral-800'
                }`} 
              />
              <div className="absolute -bottom-1 -right-1 bg-neutral-900 border border-neutral-800 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-amber-500">
                {community.visibility === 'public' ? <Globe size={8} /> : <Lock size={8} />}
              </div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold truncate">{community.name}</p>
              <p className="text-[10px] opacity-70">{community.memberCount} membros</p>
            </div>
            <ChevronRight size={16} className={`transition-transform ${activeCommunity?.id === community.id ? 'rotate-90' : ''}`} />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4">
        <button
          onClick={onCreateClick}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-amber-500/50 hover:text-amber-500 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
            <Plus size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Criar</span>
        </button>
        <button
          onClick={onJoinClick}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-amber-500/50 hover:text-amber-500 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
            <Key size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Entrar</span>
        </button>
      </div>
    </div>
  );
};

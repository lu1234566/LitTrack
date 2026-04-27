import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { calculateStreak } from '../lib/streakUtils';
import { ReadingSession } from '../types';

interface StreakCardProps {
  sessions: ReadingSession[];
}

export const StreakCard: React.FC<StreakCardProps> = ({ sessions }) => {
  const stats = calculateStreak(sessions);
  const { currentStreak, longestStreak, daysReadThisWeek, isStreakBroken } = stats;

  if (sessions.length === 0) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto text-neutral-600">
          <Flame size={32} />
        </div>
        <h3 className="text-xl font-serif font-bold text-neutral-300">Comece sua jornada</h3>
        <p className="text-neutral-500 max-w-xs mx-auto">
          Registre sua primeira sessão de leitura para começar a contar sua sequência.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-6 md:p-8 shadow-xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Flame size={120} className={currentStreak > 0 ? "text-amber-500" : "text-neutral-500"} />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${currentStreak > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-neutral-800 text-neutral-500'}`}>
              <Flame size={24} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-neutral-100">Sequência de Leitura</h3>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Ritmo & Constância</p>
            </div>
          </div>
          {currentStreak > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Ativa</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Atual</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black ${currentStreak > 0 ? 'text-amber-500' : 'text-neutral-400'}`}>
                {currentStreak}
              </span>
              <span className="text-sm font-bold text-neutral-500">dias</span>
            </div>
            {isStreakBroken && (
              <p className="text-xs text-neutral-400 italic mt-2">
                "Toda jornada recomeça com uma página."
              </p>
            )}
            {!isStreakBroken && currentStreak === 0 && (
                <p className="text-xs text-neutral-500 italic mt-2">
                    Mantenha o hábito hoje!
                </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
              <Trophy size={18} className="text-neutral-500" />
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Recorde</p>
                <p className="text-sm font-bold text-neutral-200">{longestStreak} dias</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
              <TrendingUp size={18} className="text-emerald-500" />
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Nesta Semana</p>
                <p className="text-sm font-bold text-neutral-200">{daysReadThisWeek} / 7 dias</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(daysReadThisWeek / 7) * 100}%` }}
                    className="h-full bg-emerald-500"
                />
            </div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-2 text-right">
                {Math.round((daysReadThisWeek / 7) * 100)}% de consistência semanal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

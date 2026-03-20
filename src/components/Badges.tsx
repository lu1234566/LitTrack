import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock, Star, BookOpen, Clock, Flame, Shield } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { Badge, UserBadge } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Badges: React.FC = () => {
  const { badges, userBadges } = useCommunity();

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <Star size={24} />;
      case 'book-open': return <BookOpen size={24} />;
      case 'clock': return <Clock size={24} />;
      case 'flame': return <Flame size={24} />;
      case 'shield': return <Shield size={24} />;
      default: return <Award size={24} />;
    }
  };

  const isEarned = (badgeId: string) => {
    return userBadges.some(ub => ub.badgeId === badgeId);
  };

  const getEarnedDate = (badgeId: string) => {
    const ub = userBadges.find(ub => ub.badgeId === badgeId);
    return ub ? ub.earnedAt : null;
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-serif font-semibold text-amber-500 flex items-center gap-2 mb-6">
          <Award size={24} />
          Conquistas
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {badges.map(badge => {
            const earned = isEarned(badge.id);
            const date = getEarnedDate(badge.id);
            
            return (
              <motion.div 
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                className={`relative bg-neutral-900/50 border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                  earned ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-neutral-800 opacity-50 grayscale'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                  earned ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-500' : 'bg-neutral-800 text-neutral-500'
                }`}>
                  {getBadgeIcon(badge.icon)}
                </div>
                
                <h3 className={`text-sm font-bold mb-1 ${earned ? 'text-neutral-100' : 'text-neutral-400'}`}>
                  {badge.name}
                </h3>
                <p className="text-[10px] text-neutral-500 leading-tight mb-2">
                  {badge.description}
                </p>
                
                {earned && date && (
                  <div className="mt-auto text-[9px] font-medium text-amber-500/70 uppercase tracking-wider">
                    {format(date, "MMM yyyy", { locale: ptBR })}
                  </div>
                )}
                
                {!earned && (
                  <div className="absolute top-2 right-2 text-neutral-600">
                    <Lock size={12} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

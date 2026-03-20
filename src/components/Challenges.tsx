import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Calendar, CheckCircle2, PlusCircle } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Challenges: React.FC = () => {
  const { challenges, userChallenges, joinChallenge } = useCommunity();

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const upcomingChallenges = challenges.filter(c => c.status === 'upcoming');

  const getProgress = (challengeId: string) => {
    const userChallenge = userChallenges.find(uc => uc.challengeId === challengeId);
    if (!userChallenge) return 0;
    return Math.min(100, Math.round((userChallenge.progress / userChallenge.target) * 100));
  };

  const hasJoined = (challengeId: string) => {
    return userChallenges.some(uc => uc.challengeId === challengeId);
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-serif font-semibold text-amber-500 flex items-center gap-2 mb-6">
          <Target size={24} />
          Desafios Ativos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeChallenges.length > 0 ? activeChallenges.map(challenge => {
            const joined = hasJoined(challenge.id);
            const progress = getProgress(challenge.id);
            
            return (
              <motion.div 
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group"
              >
                {/* Background Image/Gradient */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                  {challenge.imageUrl ? (
                    <img src={challenge.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-purple-500/20" />
                  )}
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-100 mb-1">{challenge.title}</h3>
                      <p className="text-sm text-neutral-400 line-clamp-2">{challenge.description}</p>
                    </div>
                    <div className="bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium text-amber-500">
                      <Users size={14} />
                      {challenge.participantsCount}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-neutral-500 mb-6">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Até {format(challenge.endDate, "d 'de' MMM", { locale: ptBR })}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 capitalize">
                      {challenge.type === 'books_read' ? 'Livros Lidos' : 
                       challenge.type === 'pages_read' ? 'Páginas Lidas' : 
                       challenge.type === 'specific_genre' ? 'Gênero Específico' : 'Diversidade'}
                    </span>
                  </div>

                  {joined ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-neutral-400">Progresso</span>
                        <span className="text-amber-500">{progress}%</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                        />
                      </div>
                      {progress >= 100 && (
                        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-2">
                          <CheckCircle2 size={14} /> Desafio Concluído!
                        </p>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => joinChallenge(challenge.id)}
                      className="w-full bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={18} />
                      Participar do Desafio
                    </button>
                  )}
                </div>
              </motion.div>
            );
          }) : (
            <div className="col-span-full text-center py-12 text-neutral-500 bg-neutral-900/30 rounded-3xl border border-neutral-800/50">
              Nenhum desafio ativo no momento.
            </div>
          )}
        </div>
      </section>

      {upcomingChallenges.length > 0 && (
        <section>
          <h2 className="text-xl font-serif font-semibold text-neutral-300 flex items-center gap-2 mb-4">
            <Calendar size={20} />
            Próximos Desafios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {upcomingChallenges.map(challenge => (
              <div key={challenge.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 opacity-75">
                <h3 className="font-medium text-neutral-200 mb-1">{challenge.title}</h3>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <Calendar size={12} />
                  Início: {format(challenge.startDate, "d 'de' MMM", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

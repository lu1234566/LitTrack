import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Clock, Zap, ChevronRight, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useBooks } from '../context/BookContext';
import { Book, ReadingSession } from '../types';
import { Link } from 'react-router-dom';
import { differenceInDays, isSameDay, startOfDay } from 'date-fns';

interface ReadingCompanionProps {
  books: Book[];
  sessions: ReadingSession[];
  onLogAction?: () => void;
}

export const ReadingCompanion: React.FC<ReadingCompanionProps> = ({ books, sessions, onLogAction }) => {
  const { reminderSettings } = useSettings();
  const [isVisible, setIsVisible] = React.useState(true);

  const activeReminder = useMemo(() => {
    if (!reminderSettings.enabled || !isVisible) return null;

    const lendoAgora = books.filter(b => b.status === 'lendo');
    const today = startOfDay(new Date());
    const hasReadToday = sessions.some(s => isSameDay(new Date(s.date), today));
    
    // 1. Streak at Risk Reminder
    const lastSessionDate = sessions.length > 0 ? Math.max(...sessions.map(s => s.date)) : 0;
    const daysSinceLastRead = lastSessionDate ? differenceInDays(today, startOfDay(new Date(lastSessionDate))) : 999;
    
    if (daysSinceLastRead === 1 && !hasReadToday && lendoAgora.length > 0) {
      return {
        type: 'streakAtRisk',
        title: 'Mantenha o Ritmo',
        message: 'Você leu ontem e seu progresso está incrível. Que tal dedicar 10 minutos hoje para manter sua sequência?',
        cta: 'Abrir Leitura Atual',
        link: lendoAgora[0] ? `/livro/${lendoAgora[0].id}` : '/livros',
        icon: <Zap className="text-amber-500" size={20} />
      };
    }

    // 2. Finish Logging Reminder - 100% progress but still 'lendo'
    const almostFinished = lendoAgora.find(b => (b.progressPercentage || 0) >= 100);
    if (almostFinished) {
      return {
        type: 'finishLogging',
        title: 'Ciclo Quase Completo',
        message: `Parece que você concluiu "${almostFinished.titulo}". Deseja finalizar o registro e dar sua nota final?`,
        cta: 'Finalizar Livro',
        link: `/livro/${almostFinished.id}`,
        icon: <Sparkles className="text-amber-500" size={20} />
      };
    }

    // 3. Update Progress Reminder - Older than 3 days
    if (reminderSettings.types.updateProgress) {
      const slowBooks = lendoAgora.filter(book => {
        const lastSession = [...sessions]
          .filter(s => s.bookId === book.id)
          .sort((a, b) => b.date - a.date)[0];
        
        if (!lastSession) return true; // Never logged
        return differenceInDays(today, new Date(lastSession.date)) >= 3;
      });

      if (slowBooks.length > 0) {
        return {
          type: 'updateProgress',
          title: 'Sua jornada espera',
          message: `Faz um tempo que você não avança em "${slowBooks[0].titulo}". Que tal ler algumas páginas hoje?`,
          cta: 'Atualizar Progresso',
          link: `/livro/${slowBooks[0].id}`,
          icon: <BookOpen className="text-amber-500" size={20} />
        };
      }
    }

    // 2. Logging Reminder - No session today
    if (reminderSettings.types.logging && !hasReadToday && lendoAgora.length > 0) {
      return {
        type: 'logging',
        title: 'Momento de Reflexão',
        message: 'Deseja registrar sua leitura de hoje? Pequenos passos levam a grandes histórias.',
        cta: 'Registrar Leitura',
        action: 'log',
        icon: <Clock className="text-emerald-500" size={20} />
      };
    }

    // 3. Simple Reading Reminder
    if (reminderSettings.types.reading && lendoAgora.length > 0) {
      const topBook = [...lendoAgora].sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))[0];
      return {
        type: 'reading',
        title: 'Hora do Refúgio',
        message: `Seu próximo capítulo em "${topBook.titulo}" espera por você.`,
        cta: 'Abrir Livro',
        link: `/livro/${topBook.id}`,
        icon: <Zap className="text-blue-500" size={20} />
      };
    }

    return null;
  }, [books, sessions, reminderSettings, isVisible]);

  if (!activeReminder) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center gap-6 overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <button 
              onClick={() => setIsVisible(false)}
              className="text-neutral-600 hover:text-neutral-400 p-1 rounded-full hover:bg-neutral-800 transition-all"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-shrink-0 w-12 h-12 bg-neutral-950 rounded-2xl flex items-center justify-center border border-neutral-800/50 shadow-inner">
            {activeReminder.icon}
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <h4 className="text-sm font-serif font-bold text-neutral-100 flex items-center justify-center md:justify-start gap-2">
              <Sparkles size={14} className="text-amber-500" />
              {activeReminder.title}
            </h4>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-lg">
              {activeReminder.message}
            </p>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto">
            {activeReminder.link ? (
              <Link
                to={activeReminder.link}
                className="w-full md:w-auto px-6 py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:translate-x-1"
              >
                {activeReminder.cta}
                <ChevronRight size={14} />
              </Link>
            ) : (
              <button
                onClick={() => onLogAction?.()}
                className="w-full md:w-auto px-6 py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:translate-x-1"
              >
                {activeReminder.cta}
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

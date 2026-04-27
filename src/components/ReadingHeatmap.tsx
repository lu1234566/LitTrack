import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReadingSession } from '../types';

interface ReadingHeatmapProps {
  sessions: ReadingSession[];
}

export const ReadingHeatmap: React.FC<ReadingHeatmapProps> = ({ sessions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const yearStart = startOfYear(today);
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, []);

  // Create all days for the current year up to today
  const days = useMemo(() => {
    return eachDayOfInterval({ start: yearStart, end: today });
  }, [yearStart, today]);

  // Aggregate pages read by day
  const dailyActivity = useMemo(() => {
    const activity: Record<string, { pages: number; sessionsCount: number }> = {};
    
    sessions.forEach(session => {
      const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
      if (!activity[dateKey]) {
        activity[dateKey] = { pages: 0, sessionsCount: 0 };
      }
      activity[dateKey].pages += session.pagesRead;
      activity[dateKey].sessionsCount += 1;
    });
    
    return activity;
  }, [sessions]);

  const getColorLevel = (pages: number) => {
    if (pages === 0) return 'bg-neutral-800/30';
    if (pages < 20) return 'bg-emerald-500/20';
    if (pages < 50) return 'bg-emerald-500/40';
    if (pages < 100) return 'bg-emerald-500/70';
    return 'bg-emerald-500';
  };

  // Group days by week for the heatmap layout
  const weeks = useMemo(() => {
    const weeksArr: Date[][] = [];
    let currentWeek: Date[] = [];
    
    // Find the first day of the grid (to align weeks correctly)
    // We want the grid to start on a Sunday or Monday
    // For simplicity, we'll just group every 7 days
    days.forEach((day, i) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || i === days.length - 1) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return weeksArr;
  }, [days]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
      <div className="min-w-[700px] flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const activity = dailyActivity[dateKey] || { pages: 0, sessionsCount: 0 };
              const colorClass = getColorLevel(activity.pages);
              
              return (
                <div 
                  key={dateKey}
                  className={`w-3 h-3 rounded-sm ${colorClass} transition-colors relative group cursor-pointer`}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-neutral-900 border border-neutral-700 text-white text-[10px] px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap">
                      <p className="font-bold border-b border-neutral-800 pb-1 mb-1">
                        {format(day, "d 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-emerald-400">{activity.pages} páginas lidas</p>
                      <p className="text-neutral-400">{activity.sessionsCount} sessões</p>
                    </div>
                    <div className="w-2 h-2 bg-neutral-900 border-r border-b border-neutral-700 rotate-45 mx-auto -mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-between text-[10px] text-neutral-500 font-bold uppercase tracking-widest px-1">
        <div className="flex gap-4">
          <span>Menos</span>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-sm bg-neutral-800/30" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          </div>
          <span>Mais</span>
        </div>
        <div className="flex gap-4">
          <span>{format(yearStart, 'MMM', { locale: ptBR })}</span>
          <span>{format(today, 'MMM', { locale: ptBR })}</span>
        </div>
      </div>
    </div>
  );
};

import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ReadingSession } from '@/types/readingSession';
import { appColors } from '@/theme/tokens';

const EMERALD = '16,185,129'; // emerald-500
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function dayKey(value: number | Date) {
  const d = new Date(value);
  return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
}

function levelColor(pages: number) {
  if (pages <= 0) return appColors.border;
  if (pages < 20) return 'rgba(' + EMERALD + ',0.25)';
  if (pages < 50) return 'rgba(' + EMERALD + ',0.45)';
  if (pages < 100) return 'rgba(' + EMERALD + ',0.7)';
  return 'rgb(' + EMERALD + ')';
}

/** GitHub-style calendar heatmap of pages read per day in the current year. */
export function ReadingHeatmap({ sessions }: { sessions: ReadingSession[] }) {
  const scrollRef = useRef<ScrollView>(null);
  const today = new Date();

  const days = useMemo(() => {
    const start = new Date(today.getFullYear(), 0, 1);
    const out: Date[] = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) out.push(new Date(d));
    return out;
  }, [today.getFullYear(), today.getMonth(), today.getDate()]);

  const activity = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const k = dayKey(s.createdAt);
      map[k] = (map[k] || 0) + (s.pagesRead || 0);
    });
    return map;
  }, [sessions]);

  const weeks = useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <View style={styles.grid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.week}>
              {week.map((day) => (
                <View key={day.getTime()} style={[styles.cell, { backgroundColor: levelColor(activity[dayKey(day)] || 0) }]} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.legendRow}>
        <View style={styles.legendLeft}>
          <Text style={styles.legendText}>MENOS</Text>
          <View style={[styles.cell, { backgroundColor: appColors.border }]} />
          <View style={[styles.cell, { backgroundColor: 'rgba(' + EMERALD + ',0.25)' }]} />
          <View style={[styles.cell, { backgroundColor: 'rgba(' + EMERALD + ',0.45)' }]} />
          <View style={[styles.cell, { backgroundColor: 'rgba(' + EMERALD + ',0.7)' }]} />
          <View style={[styles.cell, { backgroundColor: 'rgb(' + EMERALD + ')' }]} />
          <Text style={styles.legendText}>MAIS</Text>
        </View>
        <Text style={styles.legendText}>{MONTHS[0]} — {MONTHS[today.getMonth()]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  week: { flexDirection: 'column', gap: 4 },
  cell: { width: 13, height: 13, borderRadius: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 8 },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: appColors.textDim, fontSize: 10, letterSpacing: 2, fontWeight: '900' }
});

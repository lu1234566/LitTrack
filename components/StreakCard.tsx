import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ReadingSession } from '@/types/readingSession';
import { calculateStreak } from '@/services/streakUtils';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

export function StreakCard({ sessions }: { sessions: ReadingSession[] }) {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { currentStreak, longestStreak, daysReadThisWeek, isStreakBroken } = calculateStreak(sessions);

  if (sessions.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}><ReadoraIcon name="streak" size={30} color={appColors.textDim} /></View>
        <Text style={styles.emptyTitle}>Comece sua jornada</Text>
        <Text style={styles.emptyText}>Registre sua primeira sessão de leitura para começar a contar sua sequência.</Text>
      </View>
    );
  }

  const active = currentStreak > 0;
  const weekPct = Math.round((daysReadThisWeek / 7) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, active && styles.iconBoxActive]}><ReadoraIcon name="streak" size={22} color={active ? appColors.gold : appColors.textDim} /></View>
          <View>
            <Text style={styles.title}>Sequência de Leitura</Text>
            <Text style={styles.kicker}>RITMO & CONSTÂNCIA</Text>
          </View>
        </View>
        {active ? (
          <View style={styles.badge}><ReadoraIcon name="sparkle" size={11} color={appColors.gold} /><Text style={styles.badgeText}>ATIVA</Text></View>
        ) : null}
      </View>

      <View style={[styles.body, mobile && styles.stack]}>
        <View style={styles.col}>
          <Text style={styles.colLabel}>ATUAL</Text>
          <View style={styles.streakRow}>
            <Text style={[styles.streakValue, active && styles.streakValueActive]}>{currentStreak}</Text>
            <Text style={styles.streakUnit}>dias</Text>
          </View>
          {isStreakBroken ? <Text style={styles.note}>“Toda jornada recomeça com uma página.”</Text> : null}
          {!isStreakBroken && currentStreak === 0 ? <Text style={styles.note}>Mantenha o hábito hoje!</Text> : null}
        </View>

        <View style={styles.col}>
          <View style={styles.statRow}>
            <ReadoraIcon name="progress" size={17} color={appColors.textMuted} />
            <View><Text style={styles.statLabel}>RECORDE</Text><Text style={styles.statValue}>{longestStreak} dias</Text></View>
          </View>
          <View style={styles.statRow}>
            <ReadoraIcon name="trendingUp" size={17} color={appColors.emerald} />
            <View><Text style={styles.statLabel}>NESTA SEMANA</Text><Text style={styles.statValue}>{daysReadThisWeek} / 7 dias</Text></View>
          </View>
        </View>

        <View style={[styles.col, styles.colCenter]}>
          <View style={styles.track}><View style={[styles.fill, { width: (weekPct + '%') as `${number}%` }]} /></View>
          <Text style={styles.consistency}>{weekPct}% de consistência semanal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 28, padding: 24, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 16, backgroundColor: appColors.background, alignItems: 'center', justifyContent: 'center' },
  iconBoxActive: { backgroundColor: appColors.goldDeep },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 19, fontWeight: '900' },
  kicker: { color: appColors.textDim, fontSize: 10, letterSpacing: 2, fontWeight: '900', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderColor: appColors.goldDeep, borderWidth: 1, backgroundColor: appColors.goldDeep, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  badgeText: { color: appColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  body: { flexDirection: 'row', gap: 22 },
  stack: { flexDirection: 'column' },
  col: { flex: 1, gap: 12, justifyContent: 'center' },
  colCenter: { justifyContent: 'center' },
  colLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 2, fontWeight: '900' },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  streakValue: { color: appColors.textMuted, fontSize: 48, fontWeight: '900' },
  streakValueActive: { color: appColors.gold },
  streakUnit: { color: appColors.textMuted, fontSize: 14, fontWeight: '900' },
  note: { color: appColors.textDim, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 13 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, padding: 14 },
  statLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 2, fontWeight: '900' },
  statValue: { color: appColors.text, fontSize: 14, fontWeight: '900', marginTop: 2 },
  track: { height: 8, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: appColors.emerald },
  consistency: { color: appColors.textDim, fontSize: 10, letterSpacing: 1, fontWeight: '900', marginTop: 8, textAlign: 'right' },
  empty: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 28, padding: 30, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: appColors.background, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: appColors.textMuted, fontFamily: appFonts.display, fontSize: 19, fontWeight: '900' },
  emptyText: { color: appColors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 320 }
});

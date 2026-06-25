import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { buildAchievements, calculateReadingStreak } from '@/services/readingAchievements';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors } from '@/theme/tokens';

export default function ProgressScreen() {
  const { books, stats } = useBooks();
  const { preferences } = usePreferences();
  const { quotes } = useQuotes();
  const { shelves } = useShelves();
  const { sessions } = useReadingSessions();
  const achievements = buildAchievements(books, quotes, shelves, sessions);
  const unlocked = achievements.filter((item) => item.unlocked).length;
  const streak = calculateReadingStreak(sessions);
  const goalProgress = preferences.yearlyGoal > 0 ? Math.min(100, Math.round((stats.finishedBooks / preferences.yearlyGoal) * 100)) : 0;
  const sessionPages = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const sessionMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);

  return (
    <Screen>
      <Text style={styles.title}>Progresso</Text>
      <Text style={styles.subtitle}>Conquistas, metas e ritmo de leitura do Readora.</Text>

      <Card>
        <Text style={styles.kicker}>Meta anual</Text>
        <Text style={styles.big}>{stats.finishedBooks}/{preferences.yearlyGoal}</Text>
        <View style={styles.track}><View style={[styles.fill, { width: percent(goalProgress) }]} /></View>
        <Text style={styles.body}>{goalProgress}% da meta anual concluida.</Text>
      </Card>

      <View style={styles.grid}>
        <Card><Text style={styles.big}>{streak}</Text><Text style={styles.label}>dias em sequencia</Text></Card>
        <Card><Text style={styles.big}>{unlocked}/{achievements.length}</Text><Text style={styles.label}>conquistas</Text></Card>
        <Card><Text style={styles.big}>{sessionPages}</Text><Text style={styles.label}>paginas em sessoes</Text></Card>
        <Card><Text style={styles.big}>{sessionMinutes}</Text><Text style={styles.label}>minutos</Text></Card>
      </View>

      <Text style={styles.section}>Conquistas</Text>
      {achievements.map((achievement) => {
        const progress = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
        return (
          <Card key={achievement.id}>
            <View style={styles.achievementRow}><ReadoraIcon name={achievement.unlocked ? 'checkCircle' : 'starOutline'} size={18} color={achievement.unlocked ? appColors.emerald : appColors.textDim} /><Text style={styles.achievementTitle}>{achievement.title}</Text></View>
            <Text style={styles.body}>{achievement.description}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: percent(progress) }]} /></View>
            <Text style={styles.label}>{achievement.progress}/{achievement.target}</Text>
          </Card>
        );
      })}
    </Screen>
  );
}

function percent(value: number) {
  return (value + '%') as `${number}%`;
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  big: { color: appColors.text, fontSize: 34, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  label: { color: appColors.textMuted, fontSize: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { color: appColors.text, fontSize: 20, fontWeight: '900', marginTop: 6 },
  achievementTitle: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  achievementRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { height: 8, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden', marginTop: 10 },
  fill: { height: '100%', backgroundColor: appColors.gold }
});

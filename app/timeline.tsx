import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

export default function TimelineScreen() {
  const { sessions, deleteSession } = useReadingSessions();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const totalPages = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const totalMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);

  const header = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Linha do Tempo</Text>
        <Text style={styles.subtitle}>A cronologia viva das suas sessões de leitura.</Text>
      </View>

      <View style={[styles.grid, mobile && styles.stack]}>
        <Metric label="SESSÕES" value={String(sessions.length)} />
        <Metric label="PÁGINAS" value={String(totalPages)} />
        <Metric label="MINUTOS" value={String(totalMinutes)} />
      </View>
    </>
  );

  const empty = (
    <View style={styles.emptyState}>
      <View style={styles.emptyCircle}><ReadoraIcon name="timeline" size={34} color={appColors.gold} /></View>
      <Text style={styles.emptyTitle}>Nenhum marco registrado</Text>
      <Text style={styles.emptyText}>Atualize o progresso dos seus livros para criar sua linha do tempo.</Text>
    </View>
  );

  return (
    <Screen
      data={sessions}
      itemGap={0}
      keyExtractor={(session) => session.id}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      renderItem={(session, index) => (
        <View style={styles.timelineItem}>
          <View style={styles.timelineRail}><View style={styles.dot} />{index !== sessions.length - 1 ? <View style={styles.line} /> : null}</View>
          <Card>
            <View style={styles.row}>
              <Text style={styles.book}>{session.bookTitle}</Text>
              <Text style={styles.date}>{new Date(session.createdAt).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Text style={styles.body}>{session.pagesRead} páginas • {session.minutesRead} minutos</Text>
            {session.mood ? <Text style={styles.mood}>Humor: {session.mood}</Text> : null}
            {session.note ? <Text style={styles.body}>{session.note}</Text> : null}
            <Pressable style={styles.danger} onPress={() => deleteSession(session.id)}><Text style={styles.dangerText}>Remover sessão</Text></Pressable>
          </Card>
        </View>
      )}
    />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><Text style={styles.metricLabel}>{label}</Text><Text style={styles.big}>{value}</Text></Card>;
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column' },
  header: { gap: 8 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 48, lineHeight: 56, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 18, lineHeight: 26 },
  grid: { flexDirection: 'row', gap: 16 },
  metricLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 4, fontWeight: '900' },
  big: { color: appColors.text, fontSize: 30, fontWeight: '900' },
  emptyState: { minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyCircle: { width: 84, height: 84, borderRadius: 999, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { color: appColors.gold, fontSize: 42 },
  emptyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: appColors.textDim, fontSize: 17, textAlign: 'center', maxWidth: 480, lineHeight: 24 },
  timelineList: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 16 },
  timelineRail: { width: 24, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 999, backgroundColor: appColors.gold, marginTop: 28 },
  line: { flex: 1, width: 2, backgroundColor: appColors.border, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  book: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 22, fontWeight: '900', flex: 1 },
  date: { color: appColors.textDim, fontSize: 12, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  mood: { color: appColors.text, fontWeight: '900' },
  danger: { borderColor: appColors.red, borderWidth: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  dangerText: { color: appColors.red, fontWeight: '900' }
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { appColors } from '@/theme/tokens';

export default function TimelineScreen() {
  const { sessions, deleteSession } = useReadingSessions();
  const totalPages = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const totalMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);

  return (
    <Screen>
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.subtitle}>Historico real das suas sessoes de leitura.</Text>

      <View style={styles.grid}>
        <Card><Text style={styles.big}>{sessions.length}</Text><Text style={styles.label}>sessoes</Text></Card>
        <Card><Text style={styles.big}>{totalPages}</Text><Text style={styles.label}>paginas</Text></Card>
        <Card><Text style={styles.big}>{totalMinutes}</Text><Text style={styles.label}>minutos</Text></Card>
      </View>

      {sessions.length === 0 ? <Text style={styles.muted}>Nenhuma sessao registrada ainda.</Text> : null}
      {sessions.map((session) => (
        <Card key={session.id}>
          <View style={styles.row}>
            <Text style={styles.book}>{session.bookTitle}</Text>
            <Text style={styles.date}>{new Date(session.createdAt).toLocaleDateString('pt-BR')}</Text>
          </View>
          <Text style={styles.body}>{session.pagesRead} paginas • {session.minutesRead} minutos</Text>
          {session.mood ? <Text style={styles.body}>Humor: {session.mood}</Text> : null}
          {session.note ? <Text style={styles.body}>{session.note}</Text> : null}
          <Pressable style={styles.danger} onPress={() => deleteSession(session.id)}><Text style={styles.dangerText}>Remover sessao</Text></Pressable>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  big: { color: appColors.text, fontSize: 28, fontWeight: '900' },
  label: { color: appColors.textMuted, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  book: { color: appColors.gold, fontSize: 16, fontWeight: '900', flex: 1 },
  date: { color: appColors.textDim, fontSize: 12 },
  body: { color: appColors.textMuted, lineHeight: 22 },
  muted: { color: appColors.textMuted },
  danger: { borderColor: appColors.red, borderWidth: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  dangerText: { color: appColors.red, fontWeight: '900' }
});

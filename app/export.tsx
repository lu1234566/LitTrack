import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useShelves } from '@/contexts/ShelfContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { appColors } from '@/theme/tokens';

export default function ExportScreen() {
  const { books, stats } = useBooks();
  const { preferences } = usePreferences();
  const { quotes } = useQuotes();
  const { shelves } = useShelves();
  const { sessions } = useReadingSessions();
  const payload = { exportedAt: new Date().toISOString(), preferences, stats, books, quotes, shelves, sessions };
  const preview = JSON.stringify(payload, null, 2).slice(0, 1600);

  return (
    <Screen>
      <Text style={styles.title}>Exportar</Text>
      <Text style={styles.subtitle}>Previa do backup local com todos os dados principais.</Text>
      <Card>
        <Text style={styles.kicker}>Conteudo pronto para backup</Text>
        <Text style={styles.body}>{books.length} livros, {quotes.length} citacoes, {shelves.length} estantes e {sessions.length} sessoes.</Text>
        <Text style={styles.body}>{stats.pagesRead} paginas, genero principal {stats.favoriteGenre}.</Text>
        <Text style={styles.body}>Leitor: {preferences.readerName}. Meta anual: {preferences.yearlyGoal} livros.</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Previa JSON</Text>
        <Text style={styles.code}>{preview}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  body: { color: appColors.textMuted, lineHeight: 22 },
  code: { color: appColors.textMuted, fontSize: 11, lineHeight: 16 }
});

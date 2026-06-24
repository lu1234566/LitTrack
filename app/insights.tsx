import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { buildReadingInsights } from '@/services/readingInsights';
import { appColors } from '@/theme/tokens';

export default function InsightsScreen() {
  const { books } = useBooks();
  const { quotes } = useQuotes();
  const { shelves } = useShelves();
  const { sessions } = useReadingSessions();
  const insights = buildReadingInsights(books, quotes, shelves, sessions);

  return (
    <Screen>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Leitura analitica dos seus autores, generos, citacoes, humores e ritmo.</Text>

      <View style={styles.grid}>
        <Card><Text style={styles.big}>{insights.averagePagesPerSession}</Text><Text style={styles.label}>paginas por sessao</Text></Card>
        <Card><Text style={styles.big}>{insights.averageMinutesPerSession}</Text><Text style={styles.label}>minutos por sessao</Text></Card>
      </View>

      <InsightList title="Autores recorrentes" items={insights.topAuthors} />
      <InsightList title="Generos fortes" items={insights.topGenres} />
      <InsightList title="Tags das citacoes" items={insights.topQuoteTags} />
      <InsightList title="Humores de leitura" items={insights.topMoods} />

      <Card>
        <Text style={styles.kicker}>Destaques</Text>
        <Text style={styles.body}>Maior estante: {insights.largestShelf?.name || 'sem estantes'}</Text>
        <Text style={styles.body}>Maior livro: {insights.longestBook ? insights.longestBook.title + ' (' + (insights.longestBook.totalPages || 0) + ' pags)' : 'sem livros'}</Text>
        <Text style={styles.body}>Melhor avaliado: {insights.highestRated ? insights.highestRated.title + ' (' + (insights.highestRated.rating || 0) + '/5)' : 'sem notas'}</Text>
      </Card>
    </Screen>
  );
}

function InsightList({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  return (
    <Card>
      <Text style={styles.kicker}>{title}</Text>
      {items.length === 0 ? <Text style={styles.body}>Sem dados suficientes.</Text> : null}
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.item}>{item.label}</Text>
          <Text style={styles.count}>{item.count}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  big: { color: appColors.text, fontSize: 30, fontWeight: '900' },
  label: { color: appColors.textMuted, fontSize: 12, marginTop: 4 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  body: { color: appColors.textMuted, lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: appColors.border, borderBottomWidth: 1, paddingVertical: 10 },
  item: { color: appColors.text, fontWeight: '800', flex: 1 },
  count: { color: appColors.gold, fontWeight: '900' }
});

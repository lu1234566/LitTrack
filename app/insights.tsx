import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { buildReadingInsights } from '@/services/readingInsights';
import { buildDiversity } from '@/services/diversity';
import { appColors } from '@/theme/tokens';

export default function InsightsScreen() {
  const { books } = useBooks();
  const { quotes } = useQuotes();
  const { shelves } = useShelves();
  const { sessions } = useReadingSessions();
  const insights = buildReadingInsights(books, quotes, shelves, sessions);
  const diversity = buildDiversity(books);
  const maxDecade = Math.max(1, ...diversity.decades.map((d) => d.count));

  return (
    <Screen>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Leitura analitica dos seus autores, generos, citacoes, humores e ritmo.</Text>

      <View style={styles.grid}>
        <Card><Text style={styles.big}>{insights.averagePagesPerSession}</Text><Text style={styles.label}>paginas por sessao</Text></Card>
        <Card><Text style={styles.big}>{insights.averageMinutesPerSession}</Text><Text style={styles.label}>minutos por sessao</Text></Card>
      </View>

      <Card>
        <Text style={styles.kicker}>Diversidade de leitura</Text>
        <View style={styles.divRow}>
          <View style={styles.divStat}><Text style={styles.big}>{diversity.distinctGenres}</Text><Text style={styles.label}>generos</Text></View>
          <View style={styles.divStat}><Text style={styles.big}>{diversity.distinctAuthors}</Text><Text style={styles.label}>autores</Text></View>
          <View style={styles.divStat}><Text style={styles.big}>{diversity.spanYears || '—'}</Text><Text style={styles.label}>anos de span</Text></View>
        </View>
        {diversity.decades.length ? (
          <>
            <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>Por década de publicação</Text>
            <View style={styles.decadeChart}>
              {diversity.decades.map((d) => (
                <View key={d.decade} style={styles.decadeCol}>
                  <Text style={styles.decadeCount}>{d.count}</Text>
                  <View style={styles.decadeTrack}><View style={[styles.decadeBar, { height: (Math.round((d.count / maxDecade) * 100) + '%') as `${number}%` }]} /></View>
                  <Text style={styles.decadeLabel}>{d.label}</Text>
                </View>
              ))}
            </View>
            {diversity.oldest && diversity.newest ? <Text style={[styles.body, { marginTop: 14 }]}>De {diversity.oldest.year} ({diversity.oldest.title}) a {diversity.newest.year} ({diversity.newest.title}).</Text> : null}
          </>
        ) : <Text style={styles.body}>Preencha o ano de publicação dos seus livros para ver a distribuição por década.</Text>}
      </Card>

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
  count: { color: appColors.gold, fontWeight: '900' },
  divRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  divStat: { flex: 1, alignItems: 'center' },
  decadeChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 130 },
  decadeCol: { flex: 1, alignItems: 'center', gap: 6 },
  decadeCount: { color: appColors.textMuted, fontSize: 12, fontWeight: '900' },
  decadeTrack: { width: '70%', height: 90, justifyContent: 'flex-end', backgroundColor: appColors.surface, borderRadius: 6, overflow: 'hidden' },
  decadeBar: { width: '100%', backgroundColor: appColors.gold, borderRadius: 6, minHeight: 4 },
  decadeLabel: { color: appColors.textDim, fontSize: 11, fontWeight: '900' }
});

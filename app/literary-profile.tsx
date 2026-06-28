import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { ShareableProfileCards } from '@/components/ShareableProfileCards';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { StreakCard } from '@/components/StreakCard';
import { ReadingHeatmap } from '@/components/ReadingHeatmap';
import { appColors, appFonts } from '@/theme/tokens';

export default function LiteraryProfileScreen() {
  const { books, stats } = useBooks();
  const { quotes } = useQuotes();
  const { sessions } = useReadingSessions();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [showCards, setShowCards] = useState(false);
  const topGenres = Object.entries(books.reduce<Record<string, number>>((acc, book) => {
    acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const totalMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const totalSessionPages = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const favoriteQuotes = quotes.filter((quote) => quote.favorite).length;
  const archetype = resolveArchetype(stats.favoriteGenre, stats.averageRating, sessions.length, favoriteQuotes);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>PERFIL LITERÁRIO</Text>
        <Text style={styles.title}>{archetype}</Text>
        <Text style={styles.subtitle}>Uma leitura simbólica dos seus hábitos, gêneros, memórias e ritmo entre livros.</Text>
        <Pressable style={styles.shareBtn} onPress={() => setShowCards(true)}>
          <ReadoraIcon name="share" size={17} color={appColors.background} />
          <Text style={styles.shareText}>Compartilhar perfil</Text>
        </Pressable>
      </View>

      {showCards ? <ShareableProfileCards books={books} onClose={() => setShowCards(false)} /> : null}

      <View style={[styles.grid, mobile && styles.stack]}>
        <Metric label="GÊNERO DOMINANTE" value={stats.favoriteGenre || '—'} />
        <Metric label="MÉDIA CRÍTICA" value={stats.averageRating.toFixed(1)} accent />
        <Metric label="CITAÇÕES" value={String(quotes.length)} />
        <Metric label="FOCO" value={Math.floor(totalMinutes / 60) + 'h'} />
      </View>

      <View style={[styles.mainGrid, mobile && styles.stack]}>
        <Card>
          <Text style={styles.cardTitle}>Mapa de gêneros</Text>
          {topGenres.length === 0 ? <Text style={styles.body}>Ainda sem gêneros suficientes para leitura de perfil.</Text> : null}
          {topGenres.map(([genre, count]) => (
            <View key={genre} style={styles.genreRow}>
              <View style={styles.genreInfo}><Text style={styles.genre}>{genre}</Text><View style={styles.track}><View style={[styles.fill, { width: percent(Math.min(100, count * 25)) }]} /></View></View>
              <Text style={styles.count}>{count}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Ritmo de leitura</Text>
          <Text style={styles.body}>Você tem {stats.readingBooks} leitura(s) ativa(s), {stats.finishedBooks} concluída(s) e {stats.wishlistBooks} desejada(s).</Text>
          <View style={styles.profileGrid}>
            <Mini label="SESSÕES" value={String(sessions.length)} />
            <Mini label="PÁGINAS" value={String(totalSessionPages)} />
            <Mini label="FAVORITAS" value={String(favoriteQuotes)} />
            <Mini label="LIVROS" value={String(stats.totalBooks)} />
          </View>
        </Card>
      </View>

      <StreakCard sessions={sessions} />

      <Card>
        <Text style={styles.cardTitle}>Mapa de leitura do ano</Text>
        <Text style={styles.body}>Cada quadrado é um dia; a intensidade reflete as páginas lidas nas suas sessões.</Text>
        <View style={{ marginTop: 16 }}>
          <ReadingHeatmap sessions={sessions} />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Memória literária</Text>
        <Text style={styles.quote}>“Quanto mais citações e sessões forem registradas, mais preciso fica o seu retrato de leitor.”</Text>
        <Text style={styles.body}>{quotes.length} citação(ões) cadastradas, com {favoriteQuotes} favorita(s). Seu gênero mais frequente é {stats.favoriteGenre || 'indefinido'}.</Text>
      </Card>
    </Screen>
  );
}

function percent(value: number) {
  return (value + '%') as `${number}%`;
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <Card><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, accent && styles.accent]} numberOfLines={1}>{value}</Text></Card>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <View style={styles.mini}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text></View>;
}

function resolveArchetype(genre: string, averageRating: number, sessions: number, favoriteQuotes: number) {
  const lowerGenre = genre.toLowerCase();
  if (lowerGenre.includes('fantasia')) return 'Leitor de mundos';
  if (favoriteQuotes >= 3) return 'Guardião de trechos';
  if (sessions >= 8) return 'Leitor disciplinado';
  if (averageRating >= 4) return 'Curador exigente';
  return 'Explorador literário';
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column' },
  hero: { gap: 8 },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 5 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 50, lineHeight: 56, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 18, lineHeight: 27, maxWidth: 680 },
  shareBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 22, marginTop: 14 },
  shareText: { color: appColors.background, fontWeight: '900', fontSize: 15 },
  grid: { flexDirection: 'row', gap: 16 },
  mainGrid: { flexDirection: 'row', gap: 16 },
  metricLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  metricValue: { color: appColors.text, fontSize: 26, fontWeight: '900' },
  accent: { color: appColors.gold },
  cardTitle: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 24, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22, marginTop: 10 },
  genreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  genreInfo: { flex: 1, gap: 6 },
  genre: { color: appColors.text, fontWeight: '900' },
  count: { color: appColors.gold, fontWeight: '900' },
  track: { height: 8, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: appColors.gold },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  mini: { width: '47%', backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, padding: 14 },
  miniLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 2, fontWeight: '900' },
  miniValue: { color: appColors.text, fontSize: 24, fontWeight: '900', marginTop: 4 },
  quote: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 20, lineHeight: 30, marginTop: 10 }
});

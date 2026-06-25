import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';
import type { Book } from '@/types/book';

export default function RecommendationsScreen() {
  const { books, stats, updateStatus } = useBooks();
  const { quotes } = useQuotes();
  const { sessions } = useReadingSessions();
  const { shelves } = useShelves();
  const { width } = useWindowDimensions();
  const mobile = width < 760;

  const recommendations = useMemo(() => buildRecommendations(books, quotes, sessions), [books, quotes, sessions]);
  const wishlist = books.filter((book) => book.status === 'wishlist');
  const reading = books.filter((book) => book.status === 'reading');
  const highRatedGenres = topGenres(books.filter((book) => (book.rating || 0) >= 4));
  const strongestShelf = [...shelves].sort((a, b) => b.bookIds.length - a.bookIds.length)[0];

  async function startBook(book: Book) {
    await updateStatus(book.id, 'reading');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>RECOMENDAÇÕES</Text>
        <Text style={styles.title}>Próximas jornadas</Text>
        <Text style={styles.subtitle}>Sugestões locais baseadas no que você avaliou, citou, desejou e leu com mais frequência.</Text>
      </View>

      <View style={[styles.grid, mobile && styles.stack]}>
        <Metric label="NA LISTA" value={String(wishlist.length)} />
        <Metric label="EM ANDAMENTO" value={String(reading.length)} />
        <Metric label="GÊNERO FORTE" value={stats.favoriteGenre || '—'} />
      </View>

      {recommendations.length === 0 ? (
        <View style={styles.emptyState}>
          <ReadoraIcon name="recommendations" size={52} color={appColors.gold} />
          <Text style={styles.emptyTitle}>Ainda não há dados suficientes</Text>
          <Text style={styles.emptyText}>Adicione livros à lista “Quero ler”, registre notas, sessões e citações favoritas para destravar recomendações mais precisas.</Text>
          <Link href="/add" asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryText}>Adicionar leitura</Text></Pressable></Link>
        </View>
      ) : null}

      {recommendations.length ? (
        <View style={styles.recommendationList}>
          {recommendations.map((item, index) => (
            <Card key={item.book.id + index}>
              <View style={[styles.cardHeader, mobile && styles.stack]}>
                <View style={styles.rankCircle}><Text style={styles.rankText}>{index + 1}</Text></View>
                <View style={styles.recTextBox}>
                  <Text style={styles.recLabel}>{item.label}</Text>
                  <Text style={styles.recTitle}>{item.book.title}</Text>
                  <Text style={styles.recMeta}>{item.book.author} • {item.book.genre} • {item.score} pts</Text>
                </View>
                <View style={styles.scoreBox}><Text style={styles.score}>{item.confidence}%</Text><Text style={styles.scoreLabel}>match</Text></View>
              </View>
              <Text style={styles.body}>{item.reason}</Text>
              {item.book.reasonToRead ? <Text style={styles.quote}>“{item.book.reasonToRead}”</Text> : null}
              <View style={[styles.actions, mobile && styles.stack]}>
                <Link href={`/book/${item.book.id}` as never} asChild><Pressable style={styles.secondaryButton}><Text style={styles.secondaryText}>Ver detalhes</Text></Pressable></Link>
                {item.book.status !== 'reading' ? <Pressable style={styles.primaryButtonSmall} onPress={() => startBook(item.book)}><Text style={styles.primaryText}>Começar leitura</Text></Pressable> : <Text style={styles.readingBadge}>LENDO AGORA</Text>}
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      <View style={[styles.grid, mobile && styles.stack]}>
        <Card>
          <Text style={styles.cardTitle}>Gêneros que mais funcionam</Text>
          {highRatedGenres.length ? highRatedGenres.map(([genre, count]) => <Text key={genre} style={styles.bullet}>• {genre}: {count} livro(s) bem avaliados</Text>) : <Text style={styles.body}>Avalie livros para detectar seus gêneros de maior impacto.</Text>}
        </Card>
        <Card>
          <Text style={styles.cardTitle}>Estante guia</Text>
          <Text style={styles.recTitleSmall}>{strongestShelf?.name || 'Nenhuma estante forte ainda'}</Text>
          <Text style={styles.body}>{strongestShelf ? strongestShelf.bookIds.length + ' livros agrupados. Essa coleção ajuda a entender seus interesses.' : 'Crie estantes temáticas para melhorar a curadoria.'}</Text>
        </Card>
      </View>
    </Screen>
  );
}

function buildRecommendations(books: Book[], quotes: Array<{ bookId?: string; favorite?: boolean }>, sessions: Array<{ bookId: string; pagesRead: number }>) {
  const wishlist = books.filter((book) => book.status === 'wishlist');
  const reading = books.filter((book) => book.status === 'reading');
  const finished = books.filter((book) => book.status === 'finished');
  const favoriteGenres = topGenres(finished.filter((book) => (book.rating || 0) >= 4));
  const favoriteAuthors = topAuthors(finished.filter((book) => (book.rating || 0) >= 4));
  const activePages = sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.bookId] = (acc[session.bookId] || 0) + session.pagesRead;
    return acc;
  }, {});
  const quoteBookIds = new Set(quotes.filter((quote) => quote.favorite && quote.bookId).map((quote) => quote.bookId));

  const candidates = [...wishlist, ...reading].map((book) => {
    let score = 20;
    const reasons: string[] = [];
    const genreRank = favoriteGenres.findIndex(([genre]) => genre === book.genre);
    const authorRank = favoriteAuthors.findIndex(([author]) => author === book.author);
    if (book.status === 'wishlist') {
      score += 20;
      reasons.push('está na sua lista de desejos');
    }
    if (book.status === 'reading') {
      score += 26;
      reasons.push('já está em andamento');
    }
    if (genreRank >= 0) {
      score += 28 - genreRank * 5;
      reasons.push('combina com gêneros que você costuma avaliar bem');
    }
    if (authorRank >= 0) {
      score += 22 - authorRank * 4;
      reasons.push('retoma um autor que já funcionou para você');
    }
    if (book.priority === 'alta') {
      score += 10;
      reasons.push('foi marcado como prioridade alta');
    }
    if (book.totalPages && book.totalPages <= 250) {
      score += 8;
      reasons.push('é uma leitura mais rápida para encaixar agora');
    }
    if (activePages[book.id]) {
      score += Math.min(20, activePages[book.id] / 10);
      reasons.push('tem sessões registradas recentemente');
    }
    if (quoteBookIds.has(book.id)) {
      score += 12;
      reasons.push('já gerou citações favoritas');
    }
    const confidence = Math.max(28, Math.min(98, Math.round(score)));
    return {
      book,
      score: Math.round(score),
      confidence,
      label: book.status === 'reading' ? 'Retomar agora' : 'Próxima leitura provável',
      reason: reasons.length ? 'Recomendado porque ' + reasons.join(', ') + '.' : 'Recomendado por estar alinhado ao seu histórico de biblioteca.'
    };
  });

  return candidates.sort((a, b) => b.score - a.score).slice(0, 8);
}

function topGenres(books: Book[]) {
  return Object.entries(books.reduce<Record<string, number>>((acc, book) => {
    if (book.genre) acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);
}

function topAuthors(books: Book[]) {
  return Object.entries(books.reduce<Record<string, number>>((acc, book) => {
    if (book.author) acc[book.author] = (acc[book.author] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue} numberOfLines={1}>{value}</Text></Card>;
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column' },
  header: { gap: 8 },
  kicker: { color: appColors.gold, fontSize: 12, letterSpacing: 5, fontWeight: '900' },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 52, lineHeight: 58, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 18, lineHeight: 27, maxWidth: 720 },
  grid: { flexDirection: 'row', gap: 16 },
  metricLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  metricValue: { color: appColors.text, fontSize: 28, fontWeight: '900' },
  recommendationList: { gap: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rankCircle: { width: 46, height: 46, borderRadius: 999, backgroundColor: appColors.gold, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: appColors.background, fontWeight: '900', fontSize: 18 },
  recTextBox: { flex: 1 },
  recLabel: { color: appColors.gold, fontSize: 11, letterSpacing: 3, fontWeight: '900' },
  recTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 28, fontWeight: '900' },
  recTitleSmall: { color: appColors.text, fontFamily: appFonts.display, fontSize: 24, fontWeight: '900' },
  recMeta: { color: appColors.textDim, fontSize: 13, marginTop: 3 },
  scoreBox: { borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  score: { color: appColors.gold, fontSize: 22, fontWeight: '900' },
  scoreLabel: { color: appColors.textDim, fontSize: 10, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22, marginTop: 12 },
  quote: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 18, lineHeight: 26, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  secondaryButton: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, alignItems: 'center', paddingVertical: 12 },
  secondaryText: { color: appColors.text, fontWeight: '900' },
  primaryButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  primaryButtonSmall: { flex: 1, backgroundColor: appColors.gold, borderRadius: 999, alignItems: 'center', paddingVertical: 12 },
  primaryText: { color: appColors.background, fontWeight: '900' },
  readingBadge: { flex: 1, color: appColors.emerald, textAlign: 'center', fontWeight: '900', letterSpacing: 2 },
  cardTitle: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 22, fontWeight: '900' },
  bullet: { color: appColors.textMuted, lineHeight: 24, marginTop: 10 },
  emptyState: { minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { color: appColors.gold, fontSize: 52 },
  emptyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: appColors.textMuted, textAlign: 'center', lineHeight: 24, maxWidth: 520 }
});

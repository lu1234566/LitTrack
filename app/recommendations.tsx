import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useShelves } from '@/contexts/ShelfContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { appColors } from '@/theme/tokens';

export default function RecommendationsScreen() {
  const { books, stats } = useBooks();
  const { quotes } = useQuotes();
  const { shelves } = useShelves();
  const { sessions } = useReadingSessions();
  const wishlist = books.filter((book) => book.status === 'wishlist');
  const reading = books.filter((book) => book.status === 'reading');
  const favoriteQuoteBookIds = quotes.filter((quote) => quote.favorite && quote.bookId).map((quote) => quote.bookId);
  const quoteDriven = books.find((book) => favoriteQuoteBookIds.includes(book.id));
  const mostActiveBookId = sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.bookId] = (acc[session.bookId] || 0) + session.pagesRead;
    return acc;
  }, {});
  const activeBook = books.find((book) => book.id === Object.entries(mostActiveBookId).sort((a, b) => b[1] - a[1])[0]?.[0]);
  const strongestShelf = shelves.sort((a, b) => b.bookIds.length - a.bookIds.length)[0];

  return (
    <Screen>
      <Text style={styles.title}>Recomendacoes</Text>
      <Text style={styles.subtitle}>Sugestoes locais com base em biblioteca, citacoes, estantes e sessoes.</Text>
      <Card>
        <Text style={styles.cardTitle}>Proxima leitura provavel</Text>
        <Text style={styles.recommendation}>{wishlist[0]?.title || reading[0]?.title || 'Adicione livros na lista Quero ler.'}</Text>
        <Text style={styles.body}>{wishlist[0]?.reasonToRead || 'A recomendacao melhora conforme voce registra mais leituras.'}</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Retomar agora</Text>
        <Text style={styles.book}>{activeBook?.title || reading[0]?.title || 'Sem leitura ativa'}</Text>
        <Text style={styles.body}>Sugestao baseada nas sessoes mais recentes e paginas registradas.</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Pelo seu perfil</Text>
        <Text style={styles.body}>Como {stats.favoriteGenre} aparece mais na sua biblioteca, leituras desse genero devem ficar em destaque.</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Pelas suas citacoes</Text>
        <Text style={styles.book}>{quoteDriven?.title || 'Favorite citacoes para melhorar esta sugestao.'}</Text>
        <Text style={styles.body}>Citacoes favoritas ajudam a identificar livros com maior impacto emocional.</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Estante forte</Text>
        <Text style={styles.book}>{strongestShelf?.name || 'Crie estantes para orientar recomendacoes.'}</Text>
        <Text style={styles.body}>{strongestShelf ? strongestShelf.bookIds.length + ' livros agrupados nesta colecao.' : 'Estantes ajudam a entender seus interesses.'}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  cardTitle: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  recommendation: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  book: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 }
});

import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function RecommendationsScreen() {
  const { books, stats } = useBooks();
  const wishlist = books.filter((book) => book.status === 'wishlist');
  const nextByGenre = books.filter((book) => book.genre === stats.favoriteGenre && book.status !== 'finished');

  return (
    <Screen>
      <Text style={styles.title}>Recomendacoes</Text>
      <Text style={styles.subtitle}>Sugestoes simples com base no genero dominante e na sua lista de interesse.</Text>
      <Card>
        <Text style={styles.cardTitle}>Proxima leitura provavel</Text>
        <Text style={styles.recommendation}>{wishlist[0]?.title || nextByGenre[0]?.title || 'Adicione livros na lista Quero ler.'}</Text>
        <Text style={styles.body}>{wishlist[0]?.reasonToRead || 'A recomendacao ficara melhor quando o historico estiver sincronizado com Firestore.'}</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Padrao atual</Text>
        <Text style={styles.body}>Como {stats.favoriteGenre} aparece mais na sua biblioteca, o app tende a priorizar leituras desse universo.</Text>
      </Card>
      {wishlist.map((book) => (
        <Card key={book.id}>
          <Text style={styles.book}>{book.title}</Text>
          <Text style={styles.body}>{book.author} • {book.genre}</Text>
          <Text style={styles.body}>{book.reasonToRead || 'Sem motivo registrado.'}</Text>
        </Card>
      ))}
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

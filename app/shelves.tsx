import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function ShelvesScreen() {
  const { books } = useBooks();
  const shelves = [
    { name: 'Lendo agora', books: books.filter((book) => book.status === 'reading') },
    { name: 'Concluidos', books: books.filter((book) => book.status === 'finished') },
    { name: 'Quero ler', books: books.filter((book) => book.status === 'wishlist') },
    { name: 'Fantasia', books: books.filter((book) => book.genre.toLowerCase().includes('fantasia')) },
    { name: 'Com citacoes', books: books.filter((book) => book.favoriteQuote) }
  ];

  return (
    <Screen>
      <Text style={styles.title}>Estantes</Text>
      <Text style={styles.subtitle}>Agrupamentos automaticos enquanto as colecoes manuais sao migradas.</Text>
      {shelves.map((shelf) => (
        <Card key={shelf.name}>
          <View style={styles.row}>
            <Text style={styles.shelfName}>{shelf.name}</Text>
            <Text style={styles.count}>{shelf.books.length}</Text>
          </View>
          <Text style={styles.preview}>{shelf.books.slice(0, 3).map((book) => book.title).join(' • ') || 'Sem livros nesta estante.'}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shelfName: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  count: { color: appColors.background, backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontWeight: '900' },
  preview: { color: appColors.textMuted, lineHeight: 22 }
});

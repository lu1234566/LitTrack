import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { BookCard } from '@/components/BookCard';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useShelves } from '@/contexts/ShelfContext';
import { appColors } from '@/theme/tokens';

export default function SearchScreen() {
  const { books } = useBooks();
  const { quotes } = useQuotes();
  const { shelves } = useShelves();
  const [text, setText] = useState('');
  const normalized = text.toLowerCase();

  const bookResults = useMemo(() => {
    if (!normalized.trim()) return books;
    return books.filter((book) => (book.title + ' ' + book.author + ' ' + book.genre + ' ' + (book.publisher || '')).toLowerCase().includes(normalized));
  }, [books, normalized]);

  const quoteResults = useMemo(() => {
    if (!normalized.trim()) return quotes.slice(0, 3);
    return quotes.filter((quote) => (quote.text + ' ' + quote.bookTitle + ' ' + quote.tags.join(' ')).toLowerCase().includes(normalized));
  }, [normalized, quotes]);

  const shelfResults = useMemo(() => {
    if (!normalized.trim()) return shelves.slice(0, 3);
    return shelves.filter((shelf) => (shelf.name + ' ' + (shelf.description || '')).toLowerCase().includes(normalized));
  }, [normalized, shelves]);

  return (
    <Screen>
      <Text style={styles.title}>Pesquisa</Text>
      <Text style={styles.subtitle}>Busca unificada em livros, citacoes e estantes.</Text>
      <TextInput style={styles.input} placeholder="Digite aqui" placeholderTextColor={appColors.textDim} value={text} onChangeText={setText} />
      <Text style={styles.count}>{bookResults.length} livro(s), {quoteResults.length} citacao(oes), {shelfResults.length} estante(s)</Text>

      <Text style={styles.section}>Livros</Text>
      {bookResults.map((book) => <BookCard key={book.id} book={book} />)}

      <Text style={styles.section}>Citacoes</Text>
      {quoteResults.map((quote) => (
        <Card key={quote.id}>
          <Text style={styles.quote}>{quote.text}</Text>
          <Text style={styles.meta}>{quote.bookTitle}</Text>
        </Card>
      ))}

      <Text style={styles.section}>Estantes</Text>
      {shelfResults.map((shelf) => (
        <Link key={shelf.id} href={{ pathname: '/shelf/[id]', params: { id: shelf.id } }} asChild>
          <Pressable>
            <Card>
              <View style={styles.row}>
                <Text style={styles.shelf}>{shelf.name}</Text>
                <Text style={styles.meta}>{shelf.bookIds.length} livros</Text>
              </View>
              <Text style={styles.meta}>{shelf.description || 'Sem descricao.'}</Text>
            </Card>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  input: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  count: { color: appColors.gold, fontWeight: '900' },
  section: { color: appColors.text, fontSize: 20, fontWeight: '900', marginTop: 6 },
  quote: { color: appColors.text, fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
  meta: { color: appColors.textMuted, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  shelf: { color: appColors.text, fontSize: 18, fontWeight: '900' }
});

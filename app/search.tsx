import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { BookCard } from '@/components/BookCard';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function SearchScreen() {
  const { books } = useBooks();
  const [text, setText] = useState('');
  const results = useMemo(() => {
    const normalized = text.toLowerCase();
    if (!normalized.trim()) return books;
    return books.filter((book) => (book.title + ' ' + book.author + ' ' + book.genre).toLowerCase().includes(normalized));
  }, [books, text]);

  return (
    <Screen>
      <Text style={styles.title}>Pesquisa</Text>
      <Text style={styles.subtitle}>Encontre livros cadastrados por titulo, autor ou genero.</Text>
      <TextInput style={styles.input} placeholder="Digite aqui" placeholderTextColor={appColors.textDim} value={text} onChangeText={setText} />
      <Text style={styles.count}>{results.length} resultado(s)</Text>
      {results.map((book) => <BookCard key={book.id} book={book} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  input: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  count: { color: appColors.gold, fontWeight: '900' }
});

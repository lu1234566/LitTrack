import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function YearlyComparisonScreen() {
  const { books } = useBooks();
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const rows = years.map((year) => {
    const yearBooks = books.filter((book) => new Date(book.createdAt).getFullYear() === year || (book.finishedAt && new Date(book.finishedAt).getFullYear() === year));
    return {
      year,
      books: yearBooks.length,
      finished: yearBooks.filter((book) => book.status === 'finished').length,
      // Páginas do próprio livro: o total quando concluído, o progresso atual
      // quando em andamento.
      pages: yearBooks.reduce((sum, book) => sum + (book.status === 'finished' ? (book.totalPages || 0) : (book.currentPage || 0)), 0),
      rated: yearBooks.filter((book) => (book.rating || 0) > 0).length
    };
  });

  return (
    <Screen>
      <Text style={styles.title}>Comparativo anual</Text>
      <Text style={styles.subtitle}>Comparacao entre anos usando os livros cadastrados e seu progresso.</Text>
      {rows.map((row) => (
        <Card key={row.year}>
          <Text style={styles.year}>{row.year}</Text>
          <View style={styles.grid}>
            <View style={styles.item}><Text style={styles.big}>{row.books}</Text><Text style={styles.label}>livros</Text></View>
            <View style={styles.item}><Text style={styles.big}>{row.finished}</Text><Text style={styles.label}>lidos</Text></View>
            <View style={styles.item}><Text style={styles.big}>{row.pages.toLocaleString('pt-BR')}</Text><Text style={styles.label}>paginas</Text></View>
            <View style={styles.item}><Text style={styles.big}>{row.rated}</Text><Text style={styles.label}>avaliados</Text></View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  year: { color: appColors.gold, fontSize: 20, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  item: { width: '47%', backgroundColor: appColors.surfaceSoft, borderRadius: 16, padding: 12 },
  big: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  label: { color: appColors.textMuted, fontSize: 12 },
  body: { color: appColors.textMuted, lineHeight: 22, marginTop: 10 }
});

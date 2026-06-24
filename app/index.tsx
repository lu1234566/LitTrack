import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BookCard } from '@/components/BookCard';
import { NativeMenu } from '@/components/NativeMenu';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function DashboardScreen() {
  const { books, stats, loading } = useBooks();
  const activeBooks = books.filter((book) => book.status === 'reading');

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>READORA NATIVE</Text>
        <Text style={styles.title}>Seu diario literario, agora em app nativo.</Text>
        <Text style={styles.subtitle}>A migracao agora tem a navegacao principal da versao web e a base para portar cada modulo.</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/add" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Adicionar livro</Text>
          </Pressable>
        </Link>
        <Link href="/library" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Biblioteca</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.grid}>
        <Card><Text style={styles.statNumber}>{stats.totalBooks}</Text><Text style={styles.statLabel}>livros</Text></Card>
        <Card><Text style={styles.statNumber}>{stats.pagesRead}</Text><Text style={styles.statLabel}>paginas</Text></Card>
        <Card><Text style={styles.statNumber}>{stats.finishedBooks}</Text><Text style={styles.statLabel}>lidos</Text></Card>
        <Card><Text style={styles.statNumber}>{stats.averageRating}</Text><Text style={styles.statLabel}>media</Text></Card>
      </View>

      <Text style={styles.sectionTitle}>Lendo agora</Text>
      {loading ? <Text style={styles.muted}>Carregando biblioteca...</Text> : null}
      {!loading && activeBooks.length === 0 ? <Text style={styles.muted}>Nenhum livro em leitura no momento.</Text> : null}
      {activeBooks.map((book) => <BookCard key={book.id} book={book} />)}

      <Text style={styles.sectionTitle}>Modulos do Readora</Text>
      <NativeMenu />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 10, paddingTop: 8 },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { color: appColors.text, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: appColors.background, fontWeight: '900' },
  secondaryButton: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: appColors.text, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statNumber: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  statLabel: { color: appColors.textMuted, fontSize: 12 },
  sectionTitle: { color: appColors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  muted: { color: appColors.textMuted }
});

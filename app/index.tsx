import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BookCard } from '@/components/BookCard';
import { NativeMenu } from '@/components/NativeMenu';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { appColors } from '@/theme/tokens';

export default function DashboardScreen() {
  const { books, stats, loading } = useBooks();
  const { preferences } = usePreferences();
  const activeBooks = books.filter((book) => book.status === 'reading');
  const recentBooks = books.slice(0, 3);
  const goalProgress = preferences.yearlyGoal > 0 ? Math.min(100, Math.round((stats.finishedBooks / preferences.yearlyGoal) * 100)) : 0;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>READORA</Text>
        <Text style={styles.title}>Ola, {preferences.readerName}</Text>
        <Text style={styles.subtitle}>Seu diario literario nativo esta ganhando vida com biblioteca local, metas, insights e modulos conectados.</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/add" asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Adicionar livro</Text></Pressable></Link>
        <Link href="/goals" asChild><Pressable style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Metas</Text></Pressable></Link>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Meta anual</Text>
        <Text style={styles.goalText}>{stats.finishedBooks}/{preferences.yearlyGoal} livros</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: goalProgress + '%' }]} /></View>
        <Text style={styles.body}>{goalProgress}% da meta concluida. Meta diaria: {preferences.dailyPageGoal} paginas.</Text>
      </Card>

      <View style={styles.grid}>
        <Card><Text style={styles.statNumber}>{stats.totalBooks}</Text><Text style={styles.statLabel}>livros na estante</Text></Card>
        <Card><Text style={styles.statNumber}>{stats.pagesRead}</Text><Text style={styles.statLabel}>paginas lidas</Text></Card>
        <Card><Text style={styles.statNumber}>{stats.completionRate}%</Text><Text style={styles.statLabel}>conclusao</Text></Card>
        <Card><Text style={styles.statNumber}>{stats.favoriteGenre}</Text><Text style={styles.statLabel}>genero dominante</Text></Card>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Insight do leitor</Text>
        <Text style={styles.body}>Voce esta com {stats.readingBooks} leitura(s) ativa(s), {stats.finishedBooks} livro(s) concluidos e media geral {stats.averageRating}/5.</Text>
        <Text style={styles.body}>Formato preferido: {preferences.favoriteFormat}. Lembrete: {preferences.reminderText}.</Text>
      </Card>

      <Text style={styles.sectionTitle}>Lendo agora</Text>
      {loading ? <Text style={styles.muted}>Carregando biblioteca...</Text> : null}
      {!loading && activeBooks.length === 0 ? <Text style={styles.muted}>Nenhum livro em leitura no momento.</Text> : null}
      {activeBooks.map((book) => <BookCard key={book.id} book={book} />)}

      <Text style={styles.sectionTitle}>Ultimas leituras</Text>
      {recentBooks.map((book) => <BookCard key={'recent-' + book.id} book={book} />)}

      <Text style={styles.sectionTitle}>Modulos do Readora</Text>
      <NativeMenu />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 10, paddingTop: 8, paddingBottom: 4 },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  title: { color: appColors.text, fontSize: 34, lineHeight: 40, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: appColors.background, fontWeight: '900' },
  secondaryButton: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: appColors.text, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statNumber: { color: appColors.text, fontSize: 22, fontWeight: '900' },
  statLabel: { color: appColors.textMuted, fontSize: 12, marginTop: 4 },
  sectionTitle: { color: appColors.text, fontSize: 20, fontWeight: '900', marginTop: 6 },
  cardTitle: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  body: { color: appColors.textMuted, lineHeight: 22 },
  muted: { color: appColors.textMuted },
  goalText: { color: appColors.text, fontSize: 28, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: appColors.gold }
});

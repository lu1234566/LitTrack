import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BookCover } from '@/components/BookCover';
import { useBooks } from '@/contexts/BookContext';
import { statusLabel } from '@/services/bookStorage';
import { BookStatus } from '@/types/book';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

const filters: Array<'all' | BookStatus> = ['all', 'reading', 'finished', 'wishlist'];

export default function GalleryScreen() {
  const { books } = useBooks();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [filter, setFilter] = useState<'all' | BookStatus>('all');
  const visibleBooks = useMemo(() => filter === 'all' ? books : books.filter((book) => book.status === filter), [books, filter]);
  const coverCount = visibleBooks.filter((book) => book.coverUrl).length;
  const withoutCover = visibleBooks.length - coverCount;
  const topGenre = useMemo(() => {
    const entries = Object.entries(visibleBooks.reduce<Record<string, number>>((acc, book) => {
      acc[book.genre] = (acc[book.genre] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || '—';
  }, [visibleBooks]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>GALERIA VISUAL</Text>
        <Text style={styles.title}>Parede de Capas</Text>
        <Text style={styles.subtitle}>Uma vitrine das suas leituras, com capas reais quando disponíveis e cartões editoriais para livros sem imagem.</Text>
      </View>

      <View style={[styles.metrics, mobile && styles.stack]}>
        <Metric label="LIVROS" value={String(visibleBooks.length)} />
        <Metric label="COM CAPA" value={String(coverCount)} />
        <Metric label="SEM CAPA" value={String(withoutCover)} />
        <Metric label="GÊNERO FORTE" value={topGenre} />
      </View>

      <Card>
        <View style={[styles.toolbar, mobile && styles.stack]}>
          <View style={styles.filterRow}>
            {filters.map((item) => (
              <Pressable key={item} style={[styles.filterButton, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
                <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{labelFor(item)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.count}>{visibleBooks.length} livro(s) selecionado(s)</Text>
        </View>
      </Card>

      {visibleBooks.length === 0 ? (
        <View style={styles.emptyState}>
          <ReadoraIcon name="gallery" size={54} color={appColors.gold} />
          <Text style={styles.emptyTitle}>Nenhum livro nesta seleção</Text>
          <Text style={styles.emptyText}>Troque o filtro ou adicione uma nova leitura para montar sua parede visual.</Text>
          <Link href="/add" asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryText}>Adicionar leitura</Text></Pressable></Link>
        </View>
      ) : null}

      <View style={styles.grid}>
        {visibleBooks.map((book, index) => (
          <Link key={book.id} href={{ pathname: '/book/[id]', params: { id: book.id } }} asChild>
            {/* Ver shelves.tsx: com Link asChild o style vai parar num <a> do DOM na web,
                que não aceita array. Flatten resolve sem mudar o resultado visual. */}
            <Pressable style={StyleSheet.flatten([styles.tile, mobile ? styles.tileMobile : styles.tileDesktop])}>
              <View style={styles.coverWrap}>
                <BookCover book={book} height={index % 3 === 1 ? 290 : 250} radius={28} reserveBottom={54} />
                <View style={styles.statusPill}><Text style={styles.statusPillText}>{statusLabel(book.status)}</Text></View>
              </View>
              <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
              <Text style={styles.meta} numberOfLines={1}>{book.author}</Text>
              <Text style={styles.rating}>{book.rating ? '★'.repeat(Math.round(book.rating)) : 'Sem nota'}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue} numberOfLines={1}>{value}</Text></Card>;
}

function labelFor(status: 'all' | BookStatus) {
  if (status === 'all') return 'Todos';
  if (status === 'reading') return 'Lendo';
  if (status === 'finished') return 'Lidos';
  if (status === 'dnf') return 'Abandonados';
  return 'Quero ler';
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column', alignItems: 'stretch' },
  header: { gap: 8 },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 5 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 52, lineHeight: 58, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 18, lineHeight: 27, maxWidth: 720 },
  metrics: { flexDirection: 'row', gap: 16 },
  metricLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  metricValue: { color: appColors.text, fontSize: 26, fontWeight: '900' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  filterActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  filterText: { color: appColors.textMuted, fontSize: 12, fontWeight: '900' },
  filterTextActive: { color: appColors.background },
  count: { color: appColors.textMuted, fontSize: 13, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  tile: { gap: 8 },
  coverWrap: { position: 'relative' },
  tileDesktop: { width: '22.7%' },
  tileMobile: { width: '47%' },
  statusPill: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.72)', borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  statusPillText: { color: appColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  bookTitle: { color: appColors.text, fontWeight: '900', lineHeight: 19, fontSize: 15 },
  meta: { color: appColors.textDim, fontSize: 12 },
  rating: { color: appColors.gold, fontSize: 12, fontWeight: '900' },
  primaryButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 14, marginTop: 8 },
  primaryText: { color: appColors.background, fontWeight: '900' },
  emptyState: { minHeight: 340, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { color: appColors.gold, fontSize: 56 },
  emptyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: appColors.textMuted, textAlign: 'center', lineHeight: 24, maxWidth: 520 }
});

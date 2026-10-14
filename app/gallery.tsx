import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/TranslatedText';
import { Screen } from '@/components/Screen';
import { BookCover } from '@/components/BookCover';
import { useBooks } from '@/contexts/BookContext';
import { calculateProgress } from '@/services/bookStorage';
import { t } from '@/services/i18n';
import { Book, BookStatus } from '@/types/book';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

type Filtro = 'all' | BookStatus;
const filters: Filtro[] = ['all', 'reading', 'finished', 'wishlist', 'dnf'];
const GAP = 12;

/**
 * Parede de capas: todas do mesmo tamanho, as mais recentes primeiro.
 * Antes havia quatro caixas grandes de números, capas com alturas alternadas
 * e uma tarja de status sobre cada capa — ficava bagunçado.
 */
export default function GalleryScreen() {
  const { books } = useBooks();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [filter, setFilter] = useState<Filtro>('all');
  const [gridW, setGridW] = useState(0);

  const contagem = useMemo(() => {
    const c: Record<string, number> = { all: books.length };
    books.forEach((b) => { c[b.status] = (c[b.status] || 0) + 1; });
    return c;
  }, [books]);

  const visibleBooks = useMemo(() => {
    const lista = filter === 'all' ? books : books.filter((book) => book.status === filter);
    return [...lista].sort((a, b) => quando(b) - quando(a));
  }, [books, filter]);
  const semCapa = visibleBooks.filter((book) => !book.coverUrl).length;

  // Colunas fixas e capas na proporção de livro (2:3), medidas pela largura real.
  const colunas = mobile ? 3 : width > 1300 ? 7 : 6;
  const capaW = gridW > 0 ? Math.floor((gridW - GAP * (colunas - 1)) / colunas) : 0;
  const capaH = Math.round(capaW * 1.5);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>GALERIA</Text>
        <Text style={[styles.title, mobile && styles.titleMobile]}>Parede de Capas</Text>
        <Text style={styles.subtitle}>
          {t('{n} livro(s)', { n: visibleBooks.length })}
          {semCapa ? ' · ' + t('{n} sem capa', { n: semCapa }) : ''}
        </Text>
      </View>

      <View style={styles.filterRow}>
        {filters.filter((item) => item === 'all' || contagem[item]).map((item) => (
          <Pressable key={item} style={[styles.filterButton, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {labelFor(item)} <Text style={[styles.filterCount, filter === item && styles.filterTextActive]}>{contagem[item] || 0}</Text>
            </Text>
          </Pressable>
        ))}
      </View>

      {visibleBooks.length === 0 ? (
        <View style={styles.emptyState}>
          <ReadoraIcon name="gallery" size={48} color={appColors.gold} />
          <Text style={styles.emptyTitle}>Nenhum livro nesta seleção</Text>
          <Link href="/add" asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryText}>Adicionar leitura</Text></Pressable></Link>
        </View>
      ) : null}

      <View style={styles.grid} onLayout={(e: LayoutChangeEvent) => setGridW(e.nativeEvent.layout.width)}>
        {capaW > 0 && visibleBooks.map((book) => (
          <Link key={book.id} href={{ pathname: '/book/[id]', params: { id: book.id } }} asChild>
            {/* Link asChild na web passa o style para um <a>: precisa ser objeto. */}
            <Pressable style={StyleSheet.flatten([styles.tile, { width: capaW }])} accessibilityLabel={book.title}>
              <View>
                <BookCover book={book} height={capaH} radius={10} />
                {book.status === 'reading' ? (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: (Math.max(4, calculateProgress(book)) + '%') as `${number}%` }]} />
                  </View>
                ) : null}
                {book.status === 'finished' && book.rating ? (
                  <View style={styles.ratingBadge}><Text style={styles.ratingText}>★ {String(book.rating).replace('.', ',')}</Text></View>
                ) : null}
              </View>
              <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

/** Data mais recente do livro na estante: conclusão, depois última mexida. */
function quando(book: Book) {
  return book.finishedAt || book.updatedAt || book.createdAt || 0;
}

function labelFor(status: Filtro) {
  if (status === 'all') return 'Todos';
  if (status === 'reading') return 'Lendo';
  if (status === 'finished') return 'Lidos';
  if (status === 'dnf') return 'Abandonados';
  return 'Quero ler';
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 5 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 48, lineHeight: 54, fontWeight: '900' },
  titleMobile: { fontSize: 34, lineHeight: 40 },
  subtitle: { color: appColors.textMuted, fontSize: 14, fontWeight: '700' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: { borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  filterActive: { backgroundColor: appColors.gold, borderColor: appColors.gold },
  filterText: { color: appColors.textMuted, fontSize: 12, fontWeight: '900' },
  filterCount: { color: appColors.textDim, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: appColors.background },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { gap: 6 },
  progressTrack: { position: 'absolute', left: 8, right: 8, bottom: 8, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.6)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: appColors.gold },
  ratingBadge: { position: 'absolute', right: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  ratingText: { color: appColors.gold, fontSize: 10, fontWeight: '900' },
  bookTitle: { color: appColors.textMuted, fontSize: 11, fontWeight: '700' },
  primaryButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 14, marginTop: 8 },
  primaryText: { color: appColors.background, fontWeight: '900' },
  emptyState: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 26, fontWeight: '900', textAlign: 'center' }
});

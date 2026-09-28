import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/TranslatedText';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BookCover } from '@/components/BookCover';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { useBooks } from '@/contexts/BookContext';
import { groupSeries, type SeriesGroup } from '@/services/series';
import { appColors, appFonts } from '@/theme/tokens';

/**
 * Séries da biblioteca, deduzidas dos títulos. Cada uma mostra os volumes em
 * ordem, quantos já foram lidos, o que falta ter e o que ler em seguida.
 */
export default function SeriesScreen() {
  const { books } = useBooks();
  const series = useMemo(() => groupSeries(books), [books]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>SUAS SÉRIES</Text>
        <Text style={styles.title}>Séries</Text>
        <Text style={styles.subtitle}>
          Os volumes de cada série em ordem, o seu progresso e o que ler em seguida. O app reconhece a série pelo título do livro.
        </Text>
      </View>

      {series.length === 0 ? (
        <Card>
          <View style={styles.empty}>
            <ReadoraIcon name="series" size={40} color={appColors.textDim} />
            <Text style={styles.emptyTitle}>Nenhuma série ainda</Text>
            <Text style={styles.emptyText}>
              Quando você tiver dois ou mais volumes de uma série — com títulos como “Nome da Série (Volume 2)” ou “Nome da Série, Vol. 3” — ela aparece aqui.
            </Text>
          </View>
        </Card>
      ) : (
        series.map((grupo) => <SeriesCard key={grupo.key} grupo={grupo} />)
      )}
    </Screen>
  );
}

function SeriesCard({ grupo }: { grupo: SeriesGroup }) {
  const pct = grupo.lastVolume ? Math.round((grupo.finished / grupo.lastVolume) * 100) : 0;
  return (
    <Card>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.name}>{grupo.name}</Text>
          <Text style={styles.meta}>
            {grupo.finished} de {grupo.lastVolume} volumes lidos
          </Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillValue}>{pct}%</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: (pct + '%') as `${number}%` }]} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
        {grupo.volumes.map((v) => (
          <Link key={v.book.id} href={('/book/' + v.book.id) as never} asChild>
            <Pressable style={styles.volume}>
              <View style={v.book.status === 'finished' ? null : styles.dim}>
                <BookCover book={v.book} height={126} radius={12} />
              </View>
              <Text style={styles.volumeNumber}>Vol. {v.volume}</Text>
              {v.subtitle ? <Text style={styles.volumeTitle} numberOfLines={2}>{v.subtitle}</Text> : null}
            </Pressable>
          </Link>
        ))}
      </ScrollView>

      {grupo.next ? <NextUp next={grupo.next} /> : <Text style={styles.done}>Série completa na sua biblioteca 🎉</Text>}

      {grupo.missing.length ? (
        <Text style={styles.missing}>
          Faltam na biblioteca: {grupo.missing.map((n) => 'vol. ' + n).join(', ')}
        </Text>
      ) : null}
    </Card>
  );
}

function NextUp({ next }: { next: NonNullable<SeriesGroup['next']> }) {
  const texto =
    next.kind === 'continue' ? 'Continue o volume ' + next.volume
    : next.kind === 'start' ? 'Próximo: volume ' + next.volume
    : 'Próximo: volume ' + next.volume + ' (ainda não está na biblioteca)';
  const conteudo = (
    <View style={styles.next}>
      <ReadoraIcon name={next.kind === 'continue' ? 'trendingUp' : 'forward'} size={16} color={appColors.background} />
      <Text style={styles.nextText}>{texto}</Text>
    </View>
  );
  if (!next.book) return conteudo;
  return (
    <Link href={('/book/' + next.book.id) as never} asChild>
      <Pressable>{conteudo}</Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  kicker: { color: appColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 4 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 44, lineHeight: 50, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22, maxWidth: 620 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 24, fontWeight: '900' },
  emptyText: { color: appColors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 440 },

  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  headText: { flex: 1, gap: 4 },
  name: { color: appColors.text, fontFamily: appFonts.display, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  meta: { color: appColors.textMuted, fontSize: 13 },
  pill: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  pillValue: { color: appColors.gold, fontSize: 18, fontWeight: '900' },

  track: { height: 8, borderRadius: 999, backgroundColor: appColors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: appColors.gold, borderRadius: 999 },

  shelf: { gap: 12, paddingVertical: 4 },
  volume: { width: 86, gap: 6 },
  dim: { opacity: 0.45 },
  volumeNumber: { color: appColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  volumeTitle: { color: appColors.textMuted, fontSize: 11, lineHeight: 15 },

  next: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  nextText: { color: appColors.background, fontWeight: '900' },
  done: { color: appColors.emerald, fontWeight: '900' },
  missing: { color: appColors.textDim, fontSize: 12, lineHeight: 18 }
});

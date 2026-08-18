import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Book } from '@/types/book';
import { appColors, appFonts } from '@/theme/tokens';

/**
 * Capa de um livro em tamanho arbitrário: usa a imagem real quando existe e,
 * quando não existe, desenha um cartão editorial com a inicial, o título e o
 * autor — melhor do que um retângulo vazio numa parede de capas.
 *
 * Extraído da Galeria para que a estante mostre exatamente a mesma capa; a
 * escala tipográfica acompanha a altura para o cartão não ficar com letra de
 * miniatura em tamanho grande, nem o contrário.
 */
export function BookCover({
  book,
  height,
  radius = 18,
  /** Espaço extra no rodapé para quem desenha algo por cima da capa (a Galeria
   *  põe a pílula de status ali, e sem isso ela cobria o nome do autor). */
  reserveBottom = 0
}: {
  book: Book;
  height: number;
  radius?: number;
  reserveBottom?: number;
}) {
  // URL de capa quebrada ou expirada deixava um retângulo preto vazio no lugar
  // do livro. Cair no cartão editorial é sempre melhor do que não mostrar nada.
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(book.coverUrl) && !failed;
  return (
    <View style={[styles.cover, { height, borderRadius: radius }]}>
      {showImage ? (
        <Image source={{ uri: book.coverUrl }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <FallbackCover book={book} height={height} reserveBottom={reserveBottom} />
      )}
    </View>
  );
}

function FallbackCover({ book, height, reserveBottom }: { book: Book; height: number; reserveBottom: number }) {
  const scale = height / 250;
  const compact = height < 170;
  return (
    <View style={[styles.fallback, compact && styles.fallbackCompact, reserveBottom > 0 && { paddingBottom: reserveBottom }]}>
      {!compact ? <Text style={styles.kicker} numberOfLines={1}>{book.genre || 'READORA'}</Text> : null}
      <Text style={[styles.initial, { fontSize: Math.max(30, 74 * scale) }]}>{book.title.slice(0, 1).toUpperCase()}</Text>
      <Text style={[styles.title, { fontSize: Math.max(11, 22 * scale), lineHeight: Math.max(14, 26 * scale) }]} numberOfLines={compact ? 2 : 3}>
        {book.title}
      </Text>
      {!compact ? <Text style={styles.author} numberOfLines={1}>{book.author}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    backgroundColor: appColors.surface,
    borderColor: appColors.borderSoft,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, width: '100%', padding: 18, alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgb(25,23,20)' },
  fallbackCompact: { padding: 10, justifyContent: 'center', gap: 6 },
  kicker: { color: appColors.gold, fontSize: 10, letterSpacing: 3, fontWeight: '900', textAlign: 'center' },
  initial: { color: appColors.gold, fontFamily: appFonts.display, fontWeight: '900' },
  title: { color: appColors.text, fontFamily: appFonts.display, fontWeight: '900', textAlign: 'center' },
  author: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' }
});

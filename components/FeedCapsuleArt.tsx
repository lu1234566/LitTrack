import { forwardRef } from 'react';
import { Image, Text, View } from 'react-native';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appFonts } from '@/theme/tokens';

// Faithful native port of the web Instagram feed capsule (src/components/
// monthly/InstagramFeedCapsule.tsx): a 1080×1350 (4:5) editorial card.
// Every dimension derives from `scale`, so the same component renders both the
// on-screen preview (scale < 1) and the full-resolution share image (scale 1).

export type FeedCapsuleBook = {
  id: string;
  title: string;
  author: string;
  pageCount: number;
  rating: number; // 0-5
  coverUrl?: string;
};

export type FeedCapsuleArtProps = {
  scale?: number;
  monthName: string;
  year: number;
  heading?: string;
  periodText?: string;
  favoriteLabel?: string;
  totalBooks: number;
  totalPages: number;
  ratingOutOf10: number;
  dominantMood: string;
  books: FeedCapsuleBook[];
  bestBook: FeedCapsuleBook | null;
  literaryCopy: string;
};

const MAX_ITEMS = 10;

// Web (Tailwind) palette used by the original card.
const C = {
  bg: '#0d0d0d',
  card: '#171717',
  cardSoft: 'rgba(23,23,23,0.55)',
  border: 'rgba(255,255,255,0.06)',
  amber: '#f59e0b',
  amber50: '#fffbeb',
  amberSoft: 'rgba(245,158,11,0.10)',
  amber30: 'rgba(245,158,11,0.30)',
  amberBorder: 'rgba(245,158,11,0.12)',
  n50: '#fafafa',
  n400: '#a3a3a3',
  n500: '#737373',
  n600: '#525252',
  n700: '#404040',
  n800: '#262626'
};

function Stars({ rating, u }: { rating: number; u: (n: number) => number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <View style={{ flexDirection: 'row', gap: u(2) }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <ReadoraIcon key={i} name={i < filled ? 'star' : 'starOutline'} size={u(20)} color={i < filled ? C.amber : C.n800} />
      ))}
    </View>
  );
}

function Cover({ book, w, h, u }: { book: FeedCapsuleBook; w: number; h: number; u: (n: number) => number }) {
  return (
    <View style={{ width: w, height: h, borderRadius: u(12), overflow: 'hidden', backgroundColor: C.n800, borderColor: C.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={{ width: w, height: h }} resizeMode="cover" />
      ) : (
        <>
          <ReadoraIcon name="library" size={u(24)} color={C.n700} />
          <Text numberOfLines={1} style={{ color: C.n600, fontFamily: appFonts.body, fontSize: u(10), fontWeight: '700', marginTop: u(4), maxWidth: w - u(8), textAlign: 'center' }}>{book.title}</Text>
        </>
      )}
    </View>
  );
}

export const FeedCapsuleArt = forwardRef<View, FeedCapsuleArtProps>(function FeedCapsuleArt(
  { scale = 1, monthName, year, heading, periodText, favoriteLabel, totalBooks, totalPages, ratingOutOf10, dominantMood, books, bestBook, literaryCopy },
  ref
) {
  const u = (n: number) => n * scale;
  const shown = books.slice(0, MAX_ITEMS);
  const labelStyle = { color: C.n500, fontFamily: appFonts.body as string, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: u(1.6) };

  return (
    <View ref={ref} collapsable={false} style={{ width: u(1080), height: u(1350), backgroundColor: C.bg, padding: u(80), overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: u(56) }}>
        <View style={{ flex: 1, paddingRight: u(16) }}>
          <Text style={{ color: C.amber50, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: u(72), lineHeight: u(78) }}>{heading || 'Cápsula Mensal'}</Text>
          <Text style={[labelStyle, { fontSize: u(28), letterSpacing: u(3), marginTop: u(8) }]}>{periodText || monthName + ' / ' + year}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10), backgroundColor: C.amber, paddingHorizontal: u(30), paddingVertical: u(16), borderRadius: u(26) }}>
          <ReadoraIcon name="sparkle" size={u(30)} color={C.bg} />
          <Text style={{ color: C.bg, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(24), textTransform: 'uppercase', letterSpacing: u(2) }}>Readora</Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ flex: 1, flexDirection: 'row', gap: u(32) }}>
        {/* Left column */}
        <View style={{ flex: 5, gap: u(32) }}>
          {/* Summary */}
          <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: u(48), padding: u(40), gap: u(36) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(22) }}>
              <View style={{ padding: u(16), backgroundColor: C.amberSoft, borderRadius: u(18) }}>
                <ReadoraIcon name="progress" size={u(36)} color={C.amber} />
              </View>
              <View>
                <Text style={[labelStyle, { fontSize: u(20), letterSpacing: u(2) }]}>Desempenho</Text>
                <Text style={{ color: C.n50, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(38) }}>Resumo</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopColor: C.border, borderTopWidth: 1, paddingTop: u(28) }}>
              {[
                { label: 'Livros', value: String(totalBooks) },
                { label: 'Páginas', value: totalPages.toLocaleString('pt-BR') },
                { label: 'Rating', value: ratingOutOf10.toFixed(1), mono: true },
                { label: 'Vibe', value: dominantMood, small: true }
              ].map((item) => (
                <View key={item.label} style={{ width: '50%', gap: u(4), paddingBottom: u(24) }}>
                  <Text style={[labelStyle, { fontSize: u(18), letterSpacing: u(1.6) }]}>{item.label}</Text>
                  <Text numberOfLines={1} style={{ color: C.amber50, fontFamily: item.mono ? appFonts.mono : appFonts.body, fontWeight: '900', fontSize: item.small ? u(24) : u(38), letterSpacing: item.mono ? u(-2) : 0 }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Featured book */}
          {bestBook ? (
            <View style={{ backgroundColor: C.cardSoft, borderColor: C.amberBorder, borderWidth: 1, borderRadius: u(40), padding: u(32), flexDirection: 'row', gap: u(24), alignItems: 'center' }}>
              <Cover book={bestBook} w={u(80)} h={u(112)} u={u} />
              <View style={{ flex: 1 }}>
                <View style={{ alignSelf: 'flex-start', backgroundColor: C.amberSoft, paddingHorizontal: u(16), paddingVertical: u(5), borderRadius: u(999), marginBottom: u(10) }}>
                  <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(15), textTransform: 'uppercase', letterSpacing: u(1.4) }}>{favoriteLabel || 'Favorito do Mês'}</Text>
                </View>
                <Text numberOfLines={1} style={{ color: C.n50, fontFamily: appFonts.body, fontWeight: '700', fontSize: u(24), marginBottom: u(4) }}>{bestBook.title}</Text>
                <Text numberOfLines={1} style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(18) }}>{bestBook.author}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Right column */}
        <View style={{ flex: 7, gap: u(18) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(22) }}>
            <Text style={[labelStyle, { fontSize: u(24), letterSpacing: u(7) }]}>Top {shown.length || 10} Livros</Text>
            <View style={{ height: 1, backgroundColor: C.border, flex: 1 }} />
          </View>
          {shown.length === 0 ? (
            <View style={{ flex: 1, borderColor: C.border, borderWidth: 1, borderStyle: 'dashed', borderRadius: u(32), padding: u(40), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.n500, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(22), textAlign: 'center' }}>Nenhum livro concluído neste mês ainda.</Text>
            </View>
          ) : (
            <View style={{ flex: 1, gap: u(10) }}>
              {shown.map((book, idx) => (
                <View key={book.id} style={{ flex: 1, maxHeight: u(140), flexDirection: 'row', alignItems: 'center', gap: u(18), backgroundColor: C.cardSoft, borderColor: C.border, borderWidth: 1, borderRadius: u(22), paddingHorizontal: u(20), paddingVertical: u(10) }}>
                  <Text style={{ color: C.amber30, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: u(30), minWidth: u(34) }}>{idx + 1}</Text>
                  <Cover book={book} w={u(54)} h={u(76)} u={u} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: u(10), marginBottom: u(4) }}>
                      <Text numberOfLines={1} style={{ color: C.n50, fontFamily: appFonts.body, fontWeight: '700', fontSize: u(22), flex: 1 }}>{book.title}</Text>
                      <View style={{ paddingTop: u(3) }}><Stars rating={book.rating} u={u} /></View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10) }}>
                      <Text numberOfLines={1} style={{ color: C.n500, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(16), flexShrink: 1 }}>by {book.author}</Text>
                      <Text style={{ color: C.n800, fontFamily: appFonts.mono, fontSize: u(16) }}>/</Text>
                      <Text style={{ color: C.n600, fontFamily: appFonts.mono, fontSize: u(16) }}>{book.pageCount} pgs</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopColor: C.border, borderTopWidth: 1, paddingTop: u(40), marginTop: u(20) }}>
        <View style={{ flex: 1, paddingRight: u(20) }}>
          <Text numberOfLines={2} style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(24) }}>&ldquo;{literaryCopy}&rdquo;</Text>
          <Text style={[labelStyle, { fontSize: u(20), letterSpacing: u(4), marginTop: u(6), color: C.n600 }]}>Gerado por seu app Readora</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(30), textTransform: 'uppercase', letterSpacing: u(8) }}>Readora</Text>
          <Text style={{ color: C.n700, fontFamily: appFonts.mono, fontSize: u(18) }}>EST. 2024</Text>
        </View>
      </View>
    </View>
  );
});

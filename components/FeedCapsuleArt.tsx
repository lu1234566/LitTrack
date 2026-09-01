import { useState, forwardRef } from 'react';
import { Image, Text, View } from 'react-native';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appFonts } from '@/theme/tokens';

// Native 1080x1350 (4:5) editorial capsule. Every dimension derives from
// `scale`, so the same component renders both the on-screen preview and the
// full-resolution share image without reflowing.

export type FeedCapsuleBook = {
  id: string;
  title: string;
  author: string;
  pageCount: number;
  rating: number;
  coverUrl?: string;
  description?: string;
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

const C = {
  bg: '#0d0d0d',
  card: '#171717',
  cardSoft: 'rgba(23,23,23,0.62)',
  border: 'rgba(255,255,255,0.07)',
  amber: '#f59e0b',
  amber50: '#fffbeb',
  amberSoft: 'rgba(245,158,11,0.10)',
  amber30: 'rgba(245,158,11,0.30)',
  amberBorder: 'rgba(245,158,11,0.14)',
  n50: '#fafafa',
  n400: '#a3a3a3',
  n500: '#737373',
  n600: '#525252',
  n700: '#404040',
  n800: '#262626'
};

function Stars({ rating, u, size = 20 }: { rating: number; u: (n: number) => number; size?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <View style={{ flexDirection: 'row', gap: u(2) }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <ReadoraIcon key={i} name={i < filled ? 'star' : 'starOutline'} size={u(size)} color={i < filled ? C.amber : C.n800} />
      ))}
    </View>
  );
}

function httpsCover(url?: string) {
  return url ? url.replace(/^http:\/\//i, 'https://') : url;
}

function Cover({ book, w, h, u }: { book: FeedCapsuleBook; w: number; h: number; u: (n: number) => number }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const uri = httpsCover(book.coverUrl);

  return (
    <View style={{ width: w, height: h, borderRadius: u(12), overflow: 'hidden', backgroundColor: C.n800, borderColor: C.border, borderWidth: 1 }}>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: u(6) }}>
        <ReadoraIcon name="library" size={u(24)} color={C.n700} />
        <Text numberOfLines={2} style={{ color: C.n600, fontFamily: appFonts.body, fontSize: u(9), fontWeight: '700', marginTop: u(4), textAlign: 'center' }}>{book.title}</Text>
      </View>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ position: 'absolute', inset: 0, width: w, height: h, opacity: loaded ? 1 : 0 }}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
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
    <View ref={ref} collapsable={false} style={{ width: u(1080), height: u(1350), backgroundColor: C.bg, padding: u(68), overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: u(42) }}>
        <View style={{ flex: 1, paddingRight: u(18) }}>
          <Text style={{ color: C.amber50, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: u(68), lineHeight: u(74) }}>{heading || 'Cápsula Mensal'}</Text>
          <Text style={[labelStyle, { fontSize: u(26), letterSpacing: u(3), marginTop: u(6) }]}>{periodText || monthName + ' / ' + year}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(9), backgroundColor: C.amber, paddingHorizontal: u(26), paddingVertical: u(14), borderRadius: u(24) }}>
          <ReadoraIcon name="sparkle" size={u(28)} color={C.bg} />
          <Text style={{ color: C.bg, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(22), textTransform: 'uppercase', letterSpacing: u(1.8) }}>Readora</Text>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: u(24) }}>
        <View style={{ flex: 4, gap: u(22) }}>
          <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: u(40), padding: u(32), gap: u(24) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(18) }}>
              <View style={{ padding: u(14), backgroundColor: C.amberSoft, borderRadius: u(16) }}>
                <ReadoraIcon name="progress" size={u(34)} color={C.amber} />
              </View>
              <View>
                <Text style={[labelStyle, { fontSize: u(17), letterSpacing: u(1.8) }]}>Desempenho</Text>
                <Text style={{ color: C.n50, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(34) }}>Resumo</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopColor: C.border, borderTopWidth: 1, paddingTop: u(22) }}>
              {[
                { label: 'Livros', value: String(totalBooks) },
                { label: 'Páginas', value: totalPages.toLocaleString('pt-BR') },
                { label: 'Rating', value: ratingOutOf10.toFixed(1), mono: true },
                { label: 'Vibe', value: dominantMood, small: true }
              ].map((item) => (
                <View key={item.label} style={{ width: '50%', gap: u(3), paddingBottom: u(18) }}>
                  <Text style={[labelStyle, { fontSize: u(15), letterSpacing: u(1.4) }]}>{item.label}</Text>
                  <Text numberOfLines={1} style={{ color: C.amber50, fontFamily: item.mono ? appFonts.mono : appFonts.body, fontWeight: '900', fontSize: item.small ? u(22) : u(34), letterSpacing: item.mono ? u(-1.5) : 0 }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {bestBook ? (
            <View style={{ flex: 1, backgroundColor: C.cardSoft, borderColor: C.amberBorder, borderWidth: 1, borderRadius: u(36), padding: u(26), justifyContent: 'space-between' }}>
              <View style={{ alignSelf: 'flex-start', backgroundColor: C.amberSoft, paddingHorizontal: u(14), paddingVertical: u(5), borderRadius: u(999) }}>
                <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(14), textTransform: 'uppercase', letterSpacing: u(1.2) }}>{favoriteLabel || 'Favorito do Mês'}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: u(18), alignItems: 'center', marginVertical: u(18) }}>
                <Cover book={bestBook} w={u(104)} h={u(148)} u={u} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={3} style={{ color: C.n50, fontFamily: appFonts.body, fontWeight: '800', fontSize: u(25), lineHeight: u(30), marginBottom: u(8) }}>{bestBook.title}</Text>
                  <Text numberOfLines={2} style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(18), lineHeight: u(22), marginBottom: u(12) }}>{bestBook.author}</Text>
                  <Stars rating={bestBook.rating} u={u} size={18} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: u(10), borderTopColor: C.border, borderTopWidth: 1, paddingTop: u(16) }}>
                <View style={{ flex: 1 }}>
                  <Text style={[labelStyle, { fontSize: u(12), letterSpacing: u(1.2) }]}>Nota</Text>
                  <Text style={{ color: C.amber50, fontFamily: appFonts.mono, fontWeight: '900', fontSize: u(22), marginTop: u(3) }}>{bestBook.rating.toFixed(1)}/5</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[labelStyle, { fontSize: u(12), letterSpacing: u(1.2) }]}>Extensão</Text>
                  <Text style={{ color: C.amber50, fontFamily: appFonts.mono, fontWeight: '900', fontSize: u(22), marginTop: u(3) }}>{bestBook.pageCount} pgs</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, borderColor: C.border, borderWidth: 1, borderStyle: 'dashed', borderRadius: u(36), alignItems: 'center', justifyContent: 'center', padding: u(24) }}>
              <Text style={{ color: C.n500, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(20), textAlign: 'center' }}>Seu favorito do mês aparecerá aqui.</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 8, gap: u(14) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(18) }}>
            <Text style={[labelStyle, { fontSize: u(22), letterSpacing: u(5.5) }]}>Top {shown.length || 10} Livros</Text>
            <View style={{ height: 1, backgroundColor: C.border, flex: 1 }} />
          </View>

          {shown.length === 0 ? (
            <View style={{ flex: 1, borderColor: C.border, borderWidth: 1, borderStyle: 'dashed', borderRadius: u(30), padding: u(36), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.n500, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(22), textAlign: 'center' }}>Nenhum livro concluído neste mês ainda.</Text>
            </View>
          ) : (
            <View style={{ flex: 1, gap: u(7) }}>
              {shown.map((book, idx) => (
                <View key={book.id} style={{ flex: 1, minHeight: u(68), maxHeight: u(102), flexDirection: 'row', alignItems: 'center', gap: u(14), backgroundColor: C.cardSoft, borderColor: C.border, borderWidth: 1, borderRadius: u(20), paddingHorizontal: u(16), paddingVertical: u(7) }}>
                  <Text style={{ color: C.amber30, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: u(28), minWidth: u(30) }}>{idx + 1}</Text>
                  <Cover book={book} w={u(50)} h={u(70)} u={u} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: C.n50, fontFamily: appFonts.body, fontWeight: '800', fontSize: u(21), marginBottom: u(4) }}>{book.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(8) }}>
                      <Text numberOfLines={1} style={{ color: C.n500, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(15), flex: 1 }}>by {book.author}</Text>
                      <Text style={{ color: C.n800, fontFamily: appFonts.mono, fontSize: u(14) }}>/</Text>
                      <Text style={{ color: C.n600, fontFamily: appFonts.mono, fontSize: u(14), marginRight: u(4) }}>{book.pageCount} pgs</Text>
                      <Stars rating={book.rating} u={u} size={14} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopColor: C.border, borderTopWidth: 1, paddingTop: u(26), marginTop: u(14) }}>
        <View style={{ flex: 1, paddingRight: u(24) }}>
          <Text numberOfLines={2} style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(22), lineHeight: u(27) }}>&ldquo;{literaryCopy}&rdquo;</Text>
          <Text style={[labelStyle, { fontSize: u(17), letterSpacing: u(3.4), marginTop: u(5), color: C.n600 }]}>Gerado por seu app Readora</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(28), textTransform: 'uppercase', letterSpacing: u(7) }}>Readora</Text>
          <Text style={{ color: C.n700, fontFamily: appFonts.mono, fontSize: u(16) }}>EST. 2024</Text>
        </View>
      </View>
    </View>
  );
});

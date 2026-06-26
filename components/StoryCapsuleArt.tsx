import { forwardRef } from 'react';
import { Image, Text, View } from 'react-native';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { FeedCapsuleArtProps, FeedCapsuleBook } from '@/components/FeedCapsuleArt';
import { appFonts } from '@/theme/tokens';

// Native port of the web Instagram story capsule (src/components/monthly/
// InstagramStoryCapsule.tsx): a 1080×1920 (9:16) vertical card. Same scale
// contract as FeedCapsuleArt so it serves preview + full-res share.

const C = {
  bg: '#0a0a0a',
  card: '#171717',
  cardSoft: 'rgba(23,23,23,0.6)',
  border: 'rgba(255,255,255,0.06)',
  amber: '#f59e0b',
  amber50: '#fffbeb',
  amberSoft: 'rgba(245,158,11,0.10)',
  amberBorder: 'rgba(245,158,11,0.16)',
  amberLine: 'rgba(245,158,11,0.20)',
  n50: '#fafafa',
  n100: '#f5f5f5',
  n400: '#a3a3a3',
  n500: '#737373',
  n600: '#525252',
  n800: '#262626'
};

function Stars({ rating, u }: { rating: number; u: (n: number) => number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <View style={{ flexDirection: 'row', gap: u(3) }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <ReadoraIcon key={i} name={i < filled ? 'star' : 'starOutline'} size={u(19)} color={i < filled ? C.amber : C.n800} />
      ))}
    </View>
  );
}

function Cover({ book, w, h, u, big }: { book: FeedCapsuleBook; w: number; h: number; u: (n: number) => number; big?: boolean }) {
  return (
    <View style={{ width: w, height: h, borderRadius: u(big ? 24 : 12), overflow: 'hidden', backgroundColor: C.bg, borderColor: C.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={{ width: w, height: h }} resizeMode="cover" />
      ) : (
        <>
          <ReadoraIcon name="library" size={u(big ? 42 : 26)} color={C.n800} />
          <Text numberOfLines={2} style={{ color: C.n600, fontFamily: appFonts.body, fontSize: u(big ? 12 : 9), fontWeight: '800', marginTop: u(6), maxWidth: w - u(10), textAlign: 'center' }}>{book.title}</Text>
        </>
      )}
    </View>
  );
}

function HeroStat({ label, value, subtext, u }: { label: string; value: string; subtext: string; u: (n: number) => number }) {
  return (
    <View style={{ width: '48.5%', backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: u(34), paddingHorizontal: u(20), paddingVertical: u(20), minHeight: u(158), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(18), textTransform: 'uppercase', letterSpacing: u(2), marginBottom: u(12) }}>{label}</Text>
      <Text numberOfLines={1} style={{ color: C.n50, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(56), letterSpacing: u(-2), maxWidth: '100%' }}>{value}</Text>
      <Text numberOfLines={1} style={{ color: C.n500, fontFamily: appFonts.body, fontWeight: '700', fontSize: u(18), marginTop: u(10) }}>{subtext}</Text>
    </View>
  );
}

export const StoryCapsuleArt = forwardRef<View, FeedCapsuleArtProps>(function StoryCapsuleArt(
  { scale = 1, monthName, year, totalBooks, totalPages, ratingOutOf10, dominantMood, books, bestBook, literaryCopy },
  ref
) {
  const u = (n: number) => n * scale;
  const featured = books.slice(0, 10);
  const fav = bestBook || featured[0] || null;
  const cap = (v: string) => v.slice(0, 1).toUpperCase() + v.slice(1);

  return (
    <View ref={ref} collapsable={false} style={{ width: u(1080), height: u(1920), backgroundColor: C.bg, paddingHorizontal: u(80), paddingVertical: u(96), overflow: 'hidden' }}>
      {/* Brand / header */}
      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(16) }}>
          <ReadoraIcon name="sparkle" size={u(34)} color={C.amber} />
          <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(22), textTransform: 'uppercase', letterSpacing: u(11) }}>Readora</Text>
        </View>
        <Text style={{ color: C.n500, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(24), textTransform: 'uppercase', letterSpacing: u(9), marginTop: u(32) }}>Cápsula Literária</Text>
        <Text style={{ color: C.amber50, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: u(92), lineHeight: u(92), marginTop: u(10) }}>{cap(monthName)}</Text>
        <Text style={{ color: C.n500, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(28), textTransform: 'uppercase', letterSpacing: u(8), marginTop: u(8) }}>Jornada {year}</Text>
      </View>

      {/* Metrics grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: u(24), marginTop: u(44) }}>
        <HeroStat label="Livros" value={String(totalBooks)} subtext="concluídos" u={u} />
        <HeroStat label="Páginas" value={totalPages.toLocaleString('pt-BR')} subtext="percorridas" u={u} />
        <HeroStat label="Média" value={ratingOutOf10.toFixed(1)} subtext="nota mensal" u={u} />
        <HeroStat label="Vibe" value={dominantMood} subtext="atmosfera" u={u} />
      </View>

      {/* Favorite */}
      {fav ? (
        <View style={{ backgroundColor: C.card, borderColor: C.amberBorder, borderWidth: 1, borderRadius: u(38), padding: u(24), flexDirection: 'row', alignItems: 'center', gap: u(28), marginTop: u(30) }}>
          <Cover book={fav} w={u(100)} h={u(146)} u={u} big />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: u(10), backgroundColor: C.amber, paddingHorizontal: u(20), paddingVertical: u(10), borderRadius: u(999) }}>
              <ReadoraIcon name="progress" size={u(22)} color={C.bg} />
              <Text style={{ color: C.bg, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(17), textTransform: 'uppercase', letterSpacing: u(1.6) }}>Favorito do mês</Text>
            </View>
            <Text numberOfLines={2} style={{ color: '#fff', fontFamily: appFonts.body, fontWeight: '900', fontSize: u(40), lineHeight: u(42), letterSpacing: u(-1.5), marginTop: u(12) }}>{fav.title}</Text>
            <Text numberOfLines={1} style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(24), marginTop: u(4) }}>{fav.author}</Text>
          </View>
        </View>
      ) : null}

      {/* Top do mês */}
      <View style={{ flex: 1, marginTop: u(32) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(20), marginBottom: u(20) }}>
          <View style={{ height: u(2), backgroundColor: C.amberLine, flex: 1 }} />
          <Text style={{ color: C.n500, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(25), textTransform: 'uppercase', letterSpacing: u(8) }}>Top do mês</Text>
          <View style={{ height: u(2), backgroundColor: C.amberLine, flex: 1 }} />
        </View>
        <View style={{ flex: 1, gap: u(12) }}>
          {featured.map((book, idx) => (
            <View key={book.id} style={{ flex: 1, maxHeight: u(128), backgroundColor: C.cardSoft, borderColor: C.border, borderWidth: 1, borderRadius: u(26), paddingHorizontal: u(18), paddingVertical: u(12), flexDirection: 'row', alignItems: 'center', gap: u(20) }}>
              <View style={{ width: u(40), height: u(40), borderRadius: u(14), backgroundColor: C.amberSoft, borderColor: C.amberBorder, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(22) }}>{idx + 1}</Text>
              </View>
              <Cover book={book} w={u(46)} h={u(66)} u={u} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: C.n100, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(26), letterSpacing: u(-1) }}>{book.title}</Text>
                <Text numberOfLines={1} style={{ color: C.n500, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(17), marginTop: u(2), marginBottom: u(8) }}>{book.author}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: u(16) }}>
                  <Text style={{ color: C.n500, fontFamily: appFonts.mono, fontSize: u(16) }}>{book.pageCount || 0} pág.</Text>
                  <Stars rating={book.rating} u={u} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={{ alignItems: 'center', paddingTop: u(26) }}>
        <Text numberOfLines={2} style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(25), lineHeight: u(32), textAlign: 'center', paddingHorizontal: u(32) }}>&ldquo;{literaryCopy}&rdquo;</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(16), marginTop: u(16), opacity: 0.35 }}>
          <View style={{ width: u(48), height: 1, backgroundColor: '#fff' }} />
          <Text style={{ color: '#fff', fontFamily: appFonts.body, fontWeight: '900', fontSize: u(18), textTransform: 'uppercase', letterSpacing: u(9) }}>readora.app</Text>
          <View style={{ width: u(48), height: 1, backgroundColor: '#fff' }} />
        </View>
      </View>
    </View>
  );
});

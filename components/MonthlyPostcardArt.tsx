import { forwardRef } from 'react';
import { Image, View } from 'react-native';
import { Text } from '@/components/TranslatedText';
import type { FeedCapsuleArtProps, FeedCapsuleBook } from '@/components/FeedCapsuleArt';
import { appFonts } from '@/theme/tokens';
import { appLocale, t } from '@/services/i18n';

/**
 * Arte da Cápsula Mensal, estilo cartão-postal / revista: papel claro, tinta
 * escura, uma cor por mês e as capas como polaroids tortinhas.
 *
 * De propósito o oposto do Wrapped (noite, brilho, partículas): o anual é o
 * grande momento; o mês é um registro bonito e leve.
 *
 * Mesmo contrato de escala das outras cápsulas: medidas pensadas em 1080 de
 * largura e multiplicadas por `scale` (prévia na tela e captura em tamanho real).
 */

// Uma tinta por mês, todas legíveis sobre o papel.
const COR_DO_MES = ['#2F5D8A', '#B0413E', '#4E7A3A', '#C0762B', '#7A4E8C', '#2E7D7A', '#A87A1F', '#A0522D', '#3F6E5B', '#C2572B', '#5B4B8A', '#8C2F39'];

const PAPEL = '#F3EDE2';
const TINTA = '#1C1A17';
const APAGADO = '#6B6358';
const LINHA = '#D8CDBB';

// Inclinação de cada polaroid: fixa, para a arte sair igual toda vez.
const GIRO = [-5, 3, -2, 4, -3, 2];

export type MonthlyPostcardProps = FeedCapsuleArtProps & { format: 'feed' | 'story'; monthIndex: number };

export const MonthlyPostcardArt = forwardRef<View, MonthlyPostcardProps>(function MonthlyPostcardArt(props, ref) {
  const { scale = 1, format, monthIndex, monthName, year, totalBooks, totalPages, ratingOutOf10, books, bestBook, literaryCopy } = props;
  const s = (n: number) => Math.round(n * scale * 100) / 100;
  const story = format === 'story';
  const W = 1080;
  const H = story ? 1920 : 1350;
  const cor = COR_DO_MES[((monthIndex % 12) + 12) % 12];
  const mes = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const media = ratingOutOf10 > 0 ? (ratingOutOf10 / 2).toFixed(1).replace('.', ',') : '—';
  const capas = books.slice(0, story ? 6 : 4);
  const tamCapa = story ? 185 : 170;

  return (
    <View ref={ref} collapsable={false} style={{ width: s(W), height: s(H), backgroundColor: PAPEL, paddingHorizontal: s(80), paddingTop: s(story ? 90 : 70), overflow: 'hidden' }}>
      {/* Faixa de cor do mês na lateral, como a lombada de uma revista. */}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: s(22), backgroundColor: cor }} />

      {/* Cabeçalho de revista */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Text style={{ color: TINTA, fontSize: s(26), fontWeight: '900', letterSpacing: s(8) }}>READORA</Text>
        <Text style={{ color: APAGADO, fontSize: s(24), fontWeight: '800', letterSpacing: s(4) }}>{t('CÁPSULA Nº {n}', { n: String(monthIndex + 1).padStart(2, '0') }) + ' · ' + year}</Text>
      </View>
      <View style={{ height: s(3), backgroundColor: TINTA, marginTop: s(18) }} />
      <View style={{ height: s(1), backgroundColor: TINTA, marginTop: s(6) }} />

      {/* Mês em destaque */}
      <Text style={{ color: cor, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: s(story ? 230 : 200), lineHeight: s(story ? 250 : 215), marginTop: s(story ? 50 : 30) }} numberOfLines={1} adjustsFontSizeToFit>{mes}</Text>
      <Text style={{ color: APAGADO, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: s(34), lineHeight: s(46), marginTop: s(6) }} numberOfLines={3}>{literaryCopy}</Text>

      {/* Números em colunas de jornal */}
      <View style={{ flexDirection: 'row', borderTopWidth: s(2), borderBottomWidth: s(2), borderColor: LINHA, marginTop: s(story ? 60 : 36), paddingVertical: s(22) }}>
        <Coluna s={s} valor={String(totalBooks)} rotulo={totalBooks === 1 ? t('LIVRO') : t('LIVROS')} />
        <View style={{ width: s(2), backgroundColor: LINHA }} />
        <Coluna s={s} valor={totalPages.toLocaleString(appLocale)} rotulo={t('PÁGINAS')} />
        <View style={{ width: s(2), backgroundColor: LINHA }} />
        <Coluna s={s} valor={media + (media !== '—' ? '★' : '')} rotulo={t('MÉDIA')} />
      </View>

      {/* Polaroids */}
      {capas.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: s(story ? 50 : 44), gap: s(story ? 30 : 22), rowGap: s(story ? 28 : 22) }}>
          {capas.map((b, i) => <Polaroid key={b.id} s={s} book={b} largura={tamCapa} giro={GIRO[i % GIRO.length]} />)}
        </View>
      ) : (
        <Text style={{ color: APAGADO, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: s(34), textAlign: 'center', marginTop: s(80) }}>{t('Nenhum livro concluído neste mês — a próxima página te espera.')}</Text>
      )}

      {/* Destaque do mês */}
      {bestBook ? (
        <View style={{ marginTop: s(story ? 50 : 40), flexDirection: 'row', alignItems: 'center', gap: s(18) }}>
          <View style={{ backgroundColor: cor, paddingVertical: s(8), paddingHorizontal: s(16), borderRadius: s(6) }}>
            <Text style={{ color: PAPEL, fontSize: s(20), fontWeight: '900', letterSpacing: s(4) }}>{t('DESTAQUE DO MÊS')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: TINTA, fontFamily: appFonts.display, fontWeight: '900', fontSize: s(36) }} numberOfLines={1}>{bestBook.title}</Text>
            <Text style={{ color: APAGADO, fontSize: s(24), marginTop: s(2) }} numberOfLines={1}>{bestBook.author}{bestBook.rating ? '  ·  ' + '★'.repeat(Math.round(bestBook.rating)) : ''}</Text>
          </View>
        </View>
      ) : null}

      {/* Rodapé: carimbo */}
      <View style={{ position: 'absolute', left: s(80), right: s(80), bottom: s(story ? 70 : 56), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: APAGADO, fontSize: s(22), fontWeight: '800', letterSpacing: s(3) }}>{t('SEU DIÁRIO DE LEITURA')}</Text>
        <View style={{ width: s(96), height: s(96), borderRadius: s(48), borderWidth: s(3), borderColor: cor, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-12deg' }] }}>
          <Text style={{ color: cor, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: s(46), lineHeight: s(52) }}>R</Text>
        </View>
      </View>
    </View>
  );
});

function Coluna({ s, valor, rotulo }: { s: (n: number) => number; valor: string; rotulo: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: TINTA, fontFamily: appFonts.display, fontWeight: '900', fontSize: s(64), lineHeight: s(72) }} numberOfLines={1} adjustsFontSizeToFit>{valor}</Text>
      <Text style={{ color: APAGADO, fontSize: s(20), fontWeight: '900', letterSpacing: s(4), marginTop: s(4) }}>{rotulo}</Text>
    </View>
  );
}

function Polaroid({ s, book, largura, giro }: { s: (n: number) => number; book: FeedCapsuleBook; largura: number; giro: number }) {
  const borda = largura * 0.07;
  return (
    <View style={{ backgroundColor: '#FFFDF8', padding: s(borda), paddingBottom: s(borda * 3.2), transform: [{ rotate: giro + 'deg' }], shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: s(10), shadowOffset: { width: 0, height: s(6) }, elevation: 4 }}>
      <View style={{ width: s(largura), height: s(largura * 1.5), backgroundColor: '#E6DDCC', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {book.coverUrl
          ? <Image source={{ uri: book.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <Text style={{ color: APAGADO, fontFamily: appFonts.display, fontWeight: '900', fontSize: s(largura * 0.35) }}>{book.title.slice(0, 1).toUpperCase()}</Text>}
      </View>
      <Text style={{ color: TINTA, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: s(largura * 0.1), marginTop: s(borda * 0.8), width: s(largura), textAlign: 'center' }} numberOfLines={1}>{book.title}</Text>
    </View>
  );
}

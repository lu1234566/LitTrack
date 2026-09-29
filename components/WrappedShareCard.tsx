import { forwardRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/TranslatedText';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appFonts } from '@/theme/tokens';
import { appLocale } from '@/services/i18n';
import type { WrappedStoryData } from '@/services/wrappedInsights';

/**
 * Arte de compartilhar do Wrapped, no formato de story (9:16).
 *
 * Desenhada em 360×640 e exportada em 1080×1920 (captureRef com width/height):
 * mesma persona, mesmas cores e mesmos destaques das telas — a imagem que a
 * pessoa posta é a cara do Wrapped dela, não uma tabela genérica.
 */
export const SHARE_W = 360;
export const SHARE_H = 640;

const FUNDO = require('../assets/wrapped/11-final.jpg');
const MARCA = require('../assets/brand-mark.png');

export const WrappedShareCard = forwardRef<View, { story: WrappedStoryData; year: number }>(function WrappedShareCard({ story, year }, ref) {
  const { data, persona, palette, partial } = story;
  const accent = palette.accent;
  const top = data.top5.slice(0, 5);
  // A frase do ano, quando a pessoa guardou citações — curta, para caber.
  const frase = story.insights.find((i) => i.quote && i.quote.text.length <= 140)?.quote;

  // Destaques: os traços da persona; se faltar, as maiores descobertas.
  const destaques = [
    ...persona.chips,
    ...story.insights
      .filter((i) => i.big)
      .sort((a, b) => b.score - a.score)
      .map((i) => i.big!.value.toLocaleString(appLocale) + ' ' + i.big!.unit)
  ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 3);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Image source={FUNDO} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {palette.tint ? <LinearGradient colors={palette.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
      <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.8)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Image source={MARCA} style={styles.mark} />
        <Text style={styles.brand}>Readora</Text>
        <Text style={styles.wrappedTag}>WRAPPED</Text>
      </View>

      <Text style={styles.year}>{year}</Text>
      {partial ? <Text style={styles.partial}>SEU ANO ATÉ AGORA</Text> : null}

      <Text style={styles.kicker}>SEU TIPO DE LEITOR</Text>
      <Text style={[styles.persona, { color: accent }]} numberOfLines={2} adjustsFontSizeToFit>{persona.name}</Text>
      <Text style={styles.description} numberOfLines={2}>{persona.description}</Text>

      <View style={styles.stats}>
        <Stat value={String(data.totalBooks)} label="LIVROS" />
        <Stat value={data.totalPages.toLocaleString(appLocale)} label="PÁGINAS" />
        <Stat value={data.ratingOutOf10 ? data.ratingOutOf10.toFixed(1) : '—'} label="NOTA MÉDIA" />
        <Stat value={String(story.authors)} label="AUTORES" />
      </View>

      {destaques.length ? (
        <View style={styles.highlights}>
          {destaques.map((d) => (
            <View key={d} style={[styles.chip, { borderColor: accent }]}>
              <ReadoraIcon name="sparkle" size={11} color={accent} />
              <Text style={styles.chipText} numberOfLines={1}>{d}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {top.length ? (
        <>
          <Text style={styles.sectionLabel}>TOP {top.length}</Text>
          <View style={styles.covers}>
            {top.map((b, i) => (
              <View key={b.id} style={styles.coverCol}>
                <View style={[styles.cover, i === 0 && { borderColor: accent, borderWidth: 2 }]}>
                  {b.coverUrl
                    ? <Image source={{ uri: b.coverUrl }} style={styles.coverImg} resizeMode="cover" />
                    : <Text style={styles.coverLetter}>{b.title.slice(0, 1).toUpperCase()}</Text>}
                </View>
                <Text style={[styles.rank, i === 0 && { color: accent }]}>{i + 1}</Text>
              </View>
            ))}
          </View>
          {data.bestBook ? (
            <Text style={styles.favorite} numberOfLines={1}>
              <Text style={[styles.favoriteLabel, { color: accent }]}>LIVRO DO ANO</Text>
              {'  ' + data.bestBook.title}
            </Text>
          ) : null}
        </>
      ) : null}

      {frase ? (
        <View style={styles.quoteBox}>
          <Text style={styles.quote} numberOfLines={3}>“{frase.text}”</Text>
          <Text style={styles.quoteSource} numberOfLines={1}>{frase.source}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Readora · seu diário de leitura</Text>
      </View>
    </View>
  );
});

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const TS = { textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 } as const;

const styles = StyleSheet.create({
  card: { width: SHARE_W, height: SHARE_H, backgroundColor: '#0b132b', overflow: 'hidden', paddingHorizontal: 26, paddingTop: 24, alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mark: { width: 22, height: 22, borderRadius: 6 },
  brand: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 17 },
  wrappedTag: { ...TS, color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '900', letterSpacing: 3, marginTop: 2 },
  year: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 64, lineHeight: 70, marginTop: 10 },
  partial: { ...TS, color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '900', letterSpacing: 3, marginTop: -4 },
  kicker: { ...TS, color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '900', letterSpacing: 3, marginTop: 14 },
  persona: { ...TS, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 30, lineHeight: 35, textAlign: 'center', marginTop: 6, width: '100%' },
  description: { ...TS, color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6, maxWidth: 290 },
  stats: { flexDirection: 'row', gap: 7, marginTop: 16, width: '100%' },
  stat: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  statValue: { color: '#fff', fontWeight: '900', fontSize: 17 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 7, fontWeight: '900', letterSpacing: 1.2, marginTop: 3 },
  highlights: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12, width: '100%' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.45)', maxWidth: '100%' },
  chipText: { color: '#fff', fontWeight: '800', fontSize: 10.5 },
  sectionLabel: { ...TS, color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '900', letterSpacing: 3, marginTop: 16 },
  covers: { flexDirection: 'row', gap: 8, marginTop: 9 },
  coverCol: { alignItems: 'center', gap: 4 },
  cover: { width: 56, height: 84, borderRadius: 7, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.25)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  coverImg: { width: '100%', height: '100%' },
  coverLetter: { color: 'rgba(255,255,255,0.85)', fontFamily: appFonts.display, fontWeight: '900', fontSize: 22 },
  rank: { ...TS, color: 'rgba(255,255,255,0.85)', fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: 13 },
  favorite: { ...TS, color: '#fff', fontSize: 11.5, fontWeight: '700', marginTop: 10, maxWidth: 300, textAlign: 'center' },
  favoriteLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  quoteBox: { marginTop: 12, alignItems: 'center', maxWidth: 300 },
  quote: { ...TS, color: '#fff', fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  quoteSource: { ...TS, color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  footer: { position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }
});

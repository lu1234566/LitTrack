import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/TranslatedText';
import { Card } from '@/components/Card';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { useBooks } from '@/contexts/BookContext';
import { findSeriesWithAi, isAiConfigured } from '@/services/aiClient';
import { seriesInfoOf, seriesKey } from '@/services/series';
import { haptic } from '@/services/feedback';
import { t } from '@/services/i18n';
import { appColors, appFonts } from '@/theme/tokens';
import type { Book } from '@/types/book';

type Sugestao = { key: string; name: string; itens: Array<{ book: Book; volume: number }> };

/** Livros por chamada: a lista vai inteira no pedido, então em lotes. */
const LOTE = 80;

/**
 * Séries que o título não entrega ("Eragon", "A Empregada", "Sombra e Ossos"):
 * a IA sugere série e volume, a pessoa confere e aplica. Nada é gravado sem
 * confirmação, e cada livro pode ser corrigido depois em Editar.
 */
export function SeriesFinder() {
  const { books, replaceBooks } = useBooks();
  const [estado, setEstado] = useState<'idle' | 'buscando' | 'pronto' | 'erro'>('idle');
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [mensagem, setMensagem] = useState('');

  // Só olha quem ainda não está em série nenhuma (nem pelo título, nem informado).
  const candidatos = useMemo(() => books.filter((b) => b.status !== 'dnf' && !seriesInfoOf(b)), [books]);

  if (!isAiConfigured) return null;

  async function buscar() {
    setEstado('buscando');
    setMensagem('');
    try {
      const achados: Array<{ book: Book; series: string; volume: number }> = [];
      for (let i = 0; i < candidatos.length; i += LOTE) {
        const lote = candidatos.slice(i, i + LOTE);
        const r = await findSeriesWithAi(lote.map((b) => ({ title: b.title, author: b.author })));
        r.forEach((g) => achados.push({ book: lote[g.index], series: g.series, volume: g.volume }));
      }
      // Agrupa pelo nome normalizado; ordena os volumes.
      const mapa = new Map<string, Sugestao>();
      for (const a of achados) {
        const key = seriesKey(a.series);
        const s = mapa.get(key) || { key, name: a.series, itens: [] };
        s.itens.push({ book: a.book, volume: a.volume });
        mapa.set(key, s);
      }
      const lista = [...mapa.values()]
        .map((s) => ({ ...s, itens: s.itens.sort((a, b) => a.volume - b.volume) }))
        .sort((a, b) => b.itens.length - a.itens.length || a.name.localeCompare(b.name));
      setSugestoes(lista);
      setEstado('pronto');
      if (!lista.length) setMensagem(t('Nenhuma série nova encontrada entre os seus livros.'));
    } catch (erro) {
      setEstado('erro');
      setMensagem(t('Não foi possível consultar a IA agora. Tente de novo mais tarde.'));
    }
  }

  async function aplicar() {
    const porLivro = new Map<string, { series: string; volume: number }>();
    sugestoes.forEach((s) => s.itens.forEach((it) => porLivro.set(it.book.id, { series: s.name, volume: it.volume })));
    const agora = Date.now();
    await replaceBooks(books.map((b) => {
      const g = porLivro.get(b.id);
      return g ? { ...b, series: g.series, seriesVolume: g.volume, updatedAt: agora } : b;
    }));
    haptic('success');
    setMensagem(t('{n} livro(s) organizados em séries. Dá para corrigir qualquer um em Editar.', { n: porLivro.size }));
    setSugestoes([]);
    setEstado('idle');
  }

  return (
    <Card>
      <View style={styles.head}>
        <ReadoraIcon name="sparkle" size={18} color={appColors.gold} />
        <Text style={styles.title}>Séries sem número no título</Text>
      </View>
      <Text style={styles.text}>
        Livros como “Eragon” ou “A Empregada” não dizem no título que são de uma série. A IA procura entre os seus livros e você confere antes de aplicar.
      </Text>

      {estado === 'pronto' && sugestoes.length ? (
        <View style={styles.list}>
          {sugestoes.map((s) => (
            <View key={s.key} style={styles.group}>
              <Text style={styles.groupName}>{s.name}</Text>
              {s.itens.map((it) => (
                <Text key={it.book.id} style={styles.item} numberOfLines={1}>
                  {t('Vol. {n}', { n: it.volume })} · {it.book.title}
                </Text>
              ))}
            </View>
          ))}
          <View style={styles.actions}>
            <Pressable style={styles.secondary} onPress={() => { setSugestoes([]); setEstado('idle'); }}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={aplicar}>
              <ReadoraIcon name="check" size={15} color={appColors.background} />
              <Text style={styles.primaryText}>Aplicar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={[styles.primary, styles.alone, (estado === 'buscando' || !candidatos.length) && styles.off]} onPress={buscar} disabled={estado === 'buscando' || !candidatos.length}>
          {estado === 'buscando' ? <ActivityIndicator color={appColors.background} /> : <ReadoraIcon name="search" size={15} color={appColors.background} />}
          <Text style={styles.primaryText}>{estado === 'buscando' ? t('Procurando séries...') : t('Encontrar séries com IA')}</Text>
        </Pressable>
      )}

      {mensagem ? <Text style={styles.message}>{mensagem}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 19, fontWeight: '900' },
  text: { color: appColors.textMuted, fontSize: 13, lineHeight: 19 },
  list: { gap: 12 },
  group: { gap: 3, borderLeftWidth: 2, borderLeftColor: appColors.gold, paddingLeft: 10 },
  groupName: { color: appColors.text, fontWeight: '900', fontSize: 15 },
  item: { color: appColors.textMuted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
  primary: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18 },
  alone: { flex: 0, alignSelf: 'flex-start' },
  off: { opacity: 0.6 },
  primaryText: { color: appColors.background, fontWeight: '900' },
  secondary: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: appColors.textMuted, fontWeight: '800' },
  message: { color: appColors.gold, fontWeight: '800', fontSize: 13 }
});

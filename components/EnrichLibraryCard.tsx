import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { useBooks } from '@/contexts/BookContext';
import { bookNeedsEnrichment, enrichLibrary, missingFields, type EnrichedBookReport } from '@/services/bookEnrichment';
import { haptic } from '@/services/feedback';
import { appColors, appFonts } from '@/theme/tokens';

/**
 * Completa páginas, capa, gênero e sinopse que faltam, para a biblioteca
 * inteira de uma vez. Vive num componente porque aparece em dois lugares:
 * Configurações (onde o usuário procura) e Backup (onde já estava).
 *
 * Nunca sobrescreve o que já está preenchido — só cobre buraco.
 */
export function EnrichLibraryCard({ compact = false }: { compact?: boolean }) {
  const { books, updateBook } = useBooks();
  const [rodando, setRodando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [relatorio, setRelatorio] = useState<EnrichedBookReport[]>([]);

  const incompletos = useMemo(() => books.filter(bookNeedsEnrichment), [books]);
  // Mostrar os títulos e o que falta em cada um é bem mais útil do que um
  // número solto: o usuário entende por que o livro entrou na conta.
  const amostra = useMemo(
    () => incompletos.slice(0, compact ? 4 : 8).map((b) => ({ id: b.id, title: b.title, missing: missingFields(b) })),
    [incompletos, compact]
  );

  async function completar() {
    if (rodando || !incompletos.length) return;
    setRodando(true);
    setRelatorio([]);
    setProgresso('Procurando... 0 de ' + incompletos.length);
    try {
      const resultado = await enrichLibrary(books, updateBook, (p) =>
        setProgresso('Procurando... ' + p.done + ' de ' + p.total + ' (' + p.updated + ' atualizados)')
      );
      setRelatorio(resultado.reports);
      haptic(resultado.updated > 0 ? 'success' : 'warning');
      setProgresso(
        resultado.updated > 0
          ? resultado.updated + ' de ' + resultado.checked + ' livro(s) atualizados.'
          : 'Nenhuma fonte tinha os dados que faltavam nesses livros.'
      );
    } catch {
      haptic('error');
      setProgresso('Não foi possível buscar agora. Verifique a conexão e tente de novo.');
    } finally {
      setRodando(false);
    }
  }

  const preenchidos = relatorio.filter((r) => r.filled.length);

  return (
    <Card>
      <View style={styles.tituloRow}>
        <ReadoraIcon name="sparkle" size={18} color={appColors.gold} />
        <Text style={styles.titulo}>Completar dados dos livros</Text>
      </View>
      <Text style={styles.corpo}>
        Procura capa, número de páginas, gênero e sinopse pelo título e ISBN de cada livro, no Google Books,
        Open Library, Mercado Editorial e Apple Books. O que você já preencheu não é sobrescrito.
      </Text>

      {incompletos.length === 0 ? (
        <Text style={styles.tudoCerto}>Todos os {books.length} livros estão completos.</Text>
      ) : (
        <>
          <Text style={styles.corpo}>
            Incompletos agora: <Text style={styles.destaque}>{incompletos.length}</Text>
          </Text>
          <View style={styles.lista}>
            {amostra.map((item) => (
              <View key={item.id} style={styles.linha}>
                <Text style={styles.linhaTitulo} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.linhaFalta}>falta {item.missing.join(', ')}</Text>
              </View>
            ))}
            {incompletos.length > amostra.length ? (
              <Text style={styles.maisItens}>+ {incompletos.length - amostra.length} livro(s)</Text>
            ) : null}
          </View>
        </>
      )}

      <Pressable
        style={StyleSheet.flatten([styles.botao, (rodando || !incompletos.length) && styles.botaoInativo])}
        onPress={completar}
        disabled={rodando || !incompletos.length}
      >
        <ReadoraIcon name="cloudDownload" size={17} color={appColors.background} />
        <Text style={styles.botaoTexto}>{rodando ? 'Procurando...' : 'Baixar dados que faltam'}</Text>
      </Pressable>

      {progresso ? <Text style={styles.progresso}>{progresso}</Text> : null}

      {preenchidos.length ? (
        <View style={styles.relatorio}>
          <Text style={styles.relatorioKicker}>O QUE FOI PREENCHIDO</Text>
          {preenchidos.slice(0, 6).map((r) => (
            <Text key={r.title} style={styles.relatorioLinha} numberOfLines={2}>
              • {r.title}: {r.filled.join(', ')}
              {r.stillMissing.length ? ' (ainda falta ' + r.stillMissing.join(', ') + ')' : ''}
            </Text>
          ))}
          {preenchidos.length > 6 ? <Text style={styles.maisItens}>+ {preenchidos.length - 6} livro(s)</Text> : null}
        </View>
      ) : null}

      <Text style={styles.nota}>
        Quando nenhum catálogo tem o dado, a IA do app preenche sinopse, gênero e páginas aproximadas.
        Por ser conteúdo gerado, confira antes de considerar exato.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  tituloRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titulo: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 21, fontWeight: '900' },
  corpo: { color: appColors.textMuted, lineHeight: 22 },
  destaque: { color: appColors.text, fontWeight: '900' },
  tudoCerto: { color: appColors.emerald, fontWeight: '900', lineHeight: 22 },
  lista: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  linha: { gap: 2 },
  linhaTitulo: { color: appColors.text, fontWeight: '800', fontSize: 13 },
  linhaFalta: { color: appColors.textDim, fontSize: 11, fontWeight: '700' },
  maisItens: { color: appColors.textDim, fontSize: 11, fontWeight: '800' },
  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 14 },
  botaoInativo: { opacity: 0.45 },
  botaoTexto: { color: appColors.background, fontWeight: '900' },
  progresso: { color: appColors.gold, fontWeight: '800', lineHeight: 20 },
  relatorio: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  relatorioKicker: { color: appColors.textDim, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  relatorioLinha: { color: appColors.textMuted, fontSize: 12, lineHeight: 18 },
  nota: { color: appColors.textDim, fontSize: 11, lineHeight: 17 }
});

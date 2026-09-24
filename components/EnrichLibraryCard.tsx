import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { useBooks } from '@/contexts/BookContext';
import {
  bookNeedsEnrichment,
  enrichLibrary,
  missingFields,
  patchForCandidate,
  type BookCandidate,
  type EnrichedBookReport,
  type PendingChoice
} from '@/services/bookEnrichment';
import { haptic } from '@/services/feedback';
import { appColors, appFonts } from '@/theme/tokens';

const FONTES: Record<string, string> = {
  'google-books': 'Google Books',
  'open-library': 'Open Library',
  'mercado-editorial': 'Mercado Editorial',
  'apple-books': 'Apple Books'
};

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
  // Livros em que a busca achou opções mas nenhuma era confiável o bastante
  // para aplicar sozinha. Em vez de devolver nada, perguntamos.
  const [pendentes, setPendentes] = useState<PendingChoice[]>([]);

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
    setPendentes([]);
    setProgresso('Procurando... 0 de ' + incompletos.length);
    try {
      const resultado = await enrichLibrary(books, updateBook, (p) =>
        setProgresso('Procurando... ' + p.done + ' de ' + p.total + ' (' + p.updated + ' atualizados)')
      );
      setRelatorio(resultado.reports);
      setPendentes(resultado.pending);
      haptic(resultado.updated > 0 ? 'success' : 'warning');
      const aplicados =
        resultado.updated > 0
          ? resultado.updated + ' de ' + resultado.checked + ' livro(s) atualizados.'
          : 'Nenhuma fonte trouxe correspondência segura sozinha.';
      setProgresso(
        resultado.pending.length
          ? aplicados + ' Em ' + resultado.pending.length + ' livro(s) fiquei na dúvida — escolha abaixo.'
          : aplicados
      );
    } catch {
      haptic('error');
      setProgresso('Não foi possível buscar agora. Verifique a conexão e tente de novo.');
    } finally {
      setRodando(false);
    }
  }

  /** O usuário reconheceu o livro: aplica esse candidato e tira da lista. */
  async function escolher(escolha: PendingChoice, candidato: BookCandidate) {
    const patch = patchForCandidate(candidato.external, escolha.book);
    setPendentes((atuais) => atuais.filter((p) => p.book.id !== escolha.book.id));
    try {
      await updateBook(escolha.book.id, patch);
      haptic('success');
    } catch {
      haptic('error');
      // Devolve à lista: sem isso a opção sumia e o livro ficava incompleto
      // sem o usuário ter como tentar de novo.
      setPendentes((atuais) => [escolha, ...atuais]);
    }
  }

  function descartar(bookId: string) {
    haptic('light');
    setPendentes((atuais) => atuais.filter((p) => p.book.id !== bookId));
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

      {pendentes.length ? (
        <View style={styles.duvidas}>
          <View style={styles.tituloRow}>
            <ReadoraIcon name="search" size={15} color={appColors.gold} />
            <Text style={styles.duvidasTitulo}>Preciso da sua ajuda</Text>
          </View>
          <Text style={styles.duvidasTexto}>
            Nestes eu achei opções, mas nenhuma batia com certeza — preencher pela adivinhação traria dados de
            outro livro. Toque na edição certa, ou dispense.
          </Text>
          {pendentes.map((escolha) => (
            <View key={escolha.book.id} style={styles.duvidaBloco}>
              <Text style={styles.duvidaLivro} numberOfLines={2}>{escolha.book.title}</Text>
              <Text style={styles.duvidaAutor} numberOfLines={1}>
                {escolha.book.author || 'sem autor'} · falta {missingFields(escolha.book).join(', ')}
              </Text>
              {escolha.candidates.map((candidato) => (
                <Pressable
                  key={candidato.external.source + candidato.external.id}
                  style={styles.candidato}
                  onPress={() => escolher(escolha, candidato)}
                >
                  <MiniCapa url={candidato.external.coverUrl} titulo={candidato.external.title} />
                  <View style={styles.candidatoInfo}>
                    <Text style={styles.candidatoTitulo} numberOfLines={2}>{candidato.external.title}</Text>
                    <Text style={styles.candidatoAutor} numberOfLines={1}>
                      {candidato.external.author || 'autor não informado'}
                    </Text>
                    <Text style={styles.candidatoFonte} numberOfLines={2}>
                      {FONTES[candidato.external.source] || candidato.external.source} · preenche {candidato.wouldFill.join(', ')}
                    </Text>
                  </View>
                  <ReadoraIcon name="forward" size={16} color={appColors.gold} />
                </Pressable>
              ))}
              <Pressable style={styles.dispensar} onPress={() => descartar(escolha.book.id)}>
                <Text style={styles.dispensarTexto}>Nenhum destes</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

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

/**
 * Miniatura da capa do candidato. Ver a capa é metade da decisão: dá para
 * reconhecer a edição de bate-pronto, muito antes de ler o título.
 */
function MiniCapa({ url, titulo }: { url?: string; titulo: string }) {
  const [falhou, setFalhou] = useState(false);
  const uri = url?.replace(/^http:\/\//i, 'https://');
  if (!uri || falhou) {
    return (
      <View style={StyleSheet.flatten([styles.mini, styles.miniVazia])}>
        <Text style={styles.miniInicial}>{titulo.slice(0, 1).toUpperCase()}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.mini} resizeMode="cover" onError={() => setFalhou(true)} />;
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
  duvidas: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.gold, borderWidth: 1, borderRadius: 16, padding: 13, gap: 10 },
  duvidasTitulo: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 17, fontWeight: '900' },
  duvidasTexto: { color: appColors.textMuted, fontSize: 12, lineHeight: 18 },
  duvidaBloco: { borderTopColor: appColors.borderSoft, borderTopWidth: 1, paddingTop: 10, gap: 8 },
  duvidaLivro: { color: appColors.text, fontFamily: appFonts.display, fontSize: 15, fontWeight: '900' },
  duvidaAutor: { color: appColors.textDim, fontSize: 11, fontWeight: '700' },
  candidato: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 13, padding: 9 },
  candidatoInfo: { flex: 1, gap: 2 },
  candidatoTitulo: { color: appColors.text, fontSize: 13, fontWeight: '800', lineHeight: 18 },
  candidatoAutor: { color: appColors.textMuted, fontSize: 11, fontWeight: '700' },
  candidatoFonte: { color: appColors.gold, fontSize: 10, fontWeight: '800', lineHeight: 15 },
  mini: { width: 42, height: 62, borderRadius: 7, backgroundColor: appColors.surfaceSoft, borderColor: appColors.borderSoft, borderWidth: 1 },
  miniVazia: { alignItems: 'center', justifyContent: 'center' },
  miniInicial: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 20, fontWeight: '900' },
  dispensar: { alignSelf: 'flex-start', paddingVertical: 6 },
  dispensarTexto: { color: appColors.textDim, fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
  relatorio: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  relatorioKicker: { color: appColors.textDim, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  relatorioLinha: { color: appColors.textMuted, fontSize: 12, lineHeight: 18 },
  nota: { color: appColors.textDim, fontSize: 11, lineHeight: 17 }
});

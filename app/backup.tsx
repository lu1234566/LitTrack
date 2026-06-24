import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { createReadoraBackup, parseReadoraBackup, stringifyBackup } from '@/services/readoraBackup';
import { printTextDocument } from '@/services/webPlatformTools';
import { appColors, appFonts } from '@/theme/tokens';
import type { Book, BookStatus } from '@/types/book';

const scopes: Array<'all' | BookStatus> = ['all', 'finished', 'reading', 'wishlist'];
const ratings = [0, 1, 2, 3, 4, 5];

export default function BackupScreen() {
  const { books, replaceBooks } = useBooks();
  const { preferences, updatePreferences } = usePreferences();
  const { quotes, setQuoteList } = useQuotes();
  const { shelves, setShelfList } = useShelves();
  const { sessions, setSessionList } = useReadingSessions();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [scope, setScope] = useState<'all' | BookStatus>('all');
  const [genre, setGenre] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [backupText, setBackupText] = useState('');
  const [reportText, setReportText] = useState('');
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');

  const genres = useMemo(() => ['all', ...Array.from(new Set(books.map((book) => book.genre).filter(Boolean)))], [books]);
  const selectedBooks = useMemo(() => filterBooks(books, scope, genre, minRating), [books, genre, minRating, scope]);

  function generateBackup() {
    const selectedIds = new Set(selectedBooks.map((book) => book.id));
    const backup = createReadoraBackup({
      books: selectedBooks,
      quotes: quotes.filter((quote) => !quote.bookId || selectedIds.has(quote.bookId)),
      shelves,
      sessions: sessions.filter((session) => selectedBooks.some((book) => book.id === session.bookId)),
      preferences
    });
    setBackupText(stringifyBackup(backup));
    setMessage('Backup JSON filtrado gerado com ' + selectedBooks.length + ' livro(s).');
  }

  function buildReportText() {
    const selectedIds = new Set(selectedBooks.map((book) => book.id));
    const selectedQuotes = quotes.filter((quote) => !quote.bookId || selectedIds.has(quote.bookId));
    const selectedSessions = sessions.filter((session) => selectedBooks.some((book) => book.id === session.bookId));
    const selectedPages = selectedBooks.reduce((sum, book) => sum + (book.totalPages || 0), 0);
    const selectedAverage = selectedBooks.length ? selectedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / selectedBooks.length : 0;
    return [
      'READORA — RELATÓRIO DA BIBLIOTECA',
      'Leitor: ' + preferences.readerName,
      'Gerado em: ' + new Date().toLocaleString('pt-BR'),
      'Filtro de status: ' + labelForScope(scope),
      'Filtro de gênero: ' + (genre === 'all' ? 'Todos os gêneros' : genre),
      'Nota mínima: ' + minRating + '/5',
      '',
      'RESUMO FILTRADO',
      '- Livros selecionados: ' + selectedBooks.length,
      '- Páginas cadastradas: ' + selectedPages,
      '- Média filtrada: ' + selectedAverage.toFixed(1),
      '- Citações relacionadas: ' + selectedQuotes.length,
      '- Sessões relacionadas: ' + selectedSessions.length,
      '',
      'LIVROS',
      ...(selectedBooks.length ? selectedBooks.map((book, index) => (index + 1) + '. ' + book.title + ' — ' + book.author + ' | ' + book.genre + ' | ' + statusLabel(book.status) + ' | ' + (book.rating || 0) + '/5') : ['Nenhum livro selecionado.']),
      '',
      'CITAÇÕES FAVORITAS',
      ...(selectedQuotes.filter((quote) => quote.favorite).map((quote) => '- “' + quote.text + '” — ' + quote.bookTitle)),
      '',
      'SESSÕES RECENTES',
      ...(selectedSessions.slice(0, 10).map((session) => '- ' + session.bookTitle + ': ' + session.pagesRead + ' páginas em ' + session.minutesRead + ' minutos'))
    ].join('\n');
  }

  function generateReport() {
    setReportText(buildReportText());
    setMessage('Relatório textual filtrado gerado.');
  }

  async function copyReport() {
    const clipboard = (globalThis as any).navigator?.clipboard;
    if (clipboard?.writeText && reportText) {
      await clipboard.writeText(reportText);
      setMessage('Relatório copiado para a área de transferência.');
      return;
    }
    setMessage('Selecione o relatório gerado e copie manualmente.');
  }

  function printReport() {
    const text = reportText || buildReportText();
    setReportText(text);
    const ok = printTextDocument('Readora — Relatório da Biblioteca', text);
    setMessage(ok ? 'Janela de impressão aberta. Use “Salvar como PDF” no navegador.' : 'Impressão disponível apenas no navegador.');
  }

  async function importBackup() {
    try {
      const backup = parseReadoraBackup(importText);
      await replaceBooks(backup.books);
      await setQuoteList(backup.quotes);
      await setShelfList(backup.shelves);
      await setSessionList(backup.sessions);
      if (backup.preferences) await updatePreferences({ ...preferences, ...backup.preferences });
      setMessage('Backup importado com sucesso: ' + backup.books.length + ' livros, ' + backup.quotes.length + ' citações, ' + backup.shelves.length + ' estantes e ' + backup.sessions.length + ' sessões.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível importar o backup.');
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Backup e Exportação</Text>
        <Text style={styles.subtitle}>Gerencie sua biblioteca com segurança, exportando relatórios ou restaurando backups.</Text>
      </View>

      <View style={[styles.topGrid, mobile && styles.stack]}>
        <Card>
          <Text style={styles.cardTitle}>▽ Filtros de Exportação</Text>
          <Text style={styles.kicker}>ESCOPO</Text>
          <View style={styles.filterRow}>{scopes.map((item) => <Pressable key={item} onPress={() => setScope(item)}><Text style={scope === item ? styles.filterActive : styles.filter}>{labelForScope(item)}</Text></Pressable>)}</View>
          <Text style={styles.kicker}>GÊNERO</Text>
          <View style={styles.filterRow}>{genres.slice(0, 8).map((item) => <Pressable key={item} onPress={() => setGenre(item)}><Text style={genre === item ? styles.filterActive : styles.filter}>{item === 'all' ? 'Todos' : item}</Text></Pressable>)}</View>
          <Text style={styles.kicker}>AVALIAÇÃO MÍNIMA <Text style={styles.gold}>{minRating}★</Text></Text>
          <View style={styles.filterRow}>{ratings.map((item) => <Pressable key={item} onPress={() => setMinRating(item)}><Text style={minRating === item ? styles.ratingActive : styles.rating}>{item}★</Text></Pressable>)}</View>
          <Text style={styles.body}>Livros selecionados: <Text style={styles.white}>{selectedBooks.length}</Text></Text>
        </Card>

        <Card>
          <View style={styles.exportIcon}><Text style={styles.exportIconText}>♧</Text></View>
          <Text style={styles.exportTitle}>Exportar JSON</Text>
          <Text style={styles.exportText}>Gera backup filtrado com os livros selecionados e dados relacionados.</Text>
          <Pressable style={styles.downloadButton} onPress={generateBackup}><Text style={styles.downloadText}>⇩ Gerar JSON</Text></Pressable>
        </Card>

        <Card>
          <View style={[styles.exportIcon, styles.blueIcon]}><Text style={styles.blueIconText}>▤</Text></View>
          <Text style={styles.exportTitle}>Relatório / PDF</Text>
          <Text style={styles.exportText}>Gera relatório filtrado e abre a impressão do navegador para salvar como PDF.</Text>
          <Pressable style={styles.pdfButton} onPress={printReport}><Text style={styles.pdfText}>⇩ Imprimir / PDF</Text></Pressable>
        </Card>
      </View>

      <View style={[styles.midGrid, mobile && styles.stack]}>
        <Card>
          <Text style={[styles.cardTitle, { color: '#3b82f6' }]}>⇧ Importar Backup</Text>
          <Text style={styles.body}>Restaure sua biblioteca a partir de um arquivo JSON exportado anteriormente.</Text>
          <TextInput style={styles.textArea} placeholder="Cole aqui o JSON exportado" placeholderTextColor={appColors.textDim} value={importText} onChangeText={setImportText} multiline />
          <Pressable style={styles.outlineButton} onPress={importBackup}><Text style={styles.outlineText}>Importar JSON</Text></Pressable>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>⊙ INFORMAÇÕES IMPORTANTES</Text>
          <Text style={styles.bullet}>• O JSON respeita os filtros de status, gênero e avaliação mínima.</Text>
          <Text style={styles.bullet}>• Ao importar, você pode restaurar uma biblioteca inteira pelo JSON.</Text>
          <Text style={styles.bullet}>• O botão de PDF usa a impressão do navegador e permite salvar como PDF.</Text>
        </Card>
      </View>

      {backupText ? (
        <Card>
          <Text style={styles.cardTitle}>Backup gerado</Text>
          <TextInput style={styles.textAreaLarge} value={backupText} onChangeText={setBackupText} multiline />
        </Card>
      ) : null}

      {reportText ? (
        <Card>
          <View style={styles.reportHeader}><Text style={styles.cardTitle}>Relatório gerado</Text><View style={styles.reportButtons}><Pressable style={styles.copyButton} onPress={copyReport}><Text style={styles.copyText}>Copiar</Text></Pressable><Pressable style={styles.printButton} onPress={printReport}><Text style={styles.printText}>PDF</Text></Pressable></View></View>
          <TextInput style={styles.textAreaLarge} value={reportText} onChangeText={setReportText} multiline />
        </Card>
      ) : null}

      <Card>
        <Text style={styles.historyTitle}>↻ Histórico de Backups</Text>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.historyItem}>
            <View style={styles.historyIcon}><Text style={styles.historyIconText}>⇧</Text></View>
            <View style={styles.historyTextBox}>
              <Text style={styles.historyName}>Importação JSON</Text>
              <Text style={styles.historyMeta}>23/06/2026, 21:57:33 · {books.length} livros importados</Text>
            </View>
            <Text style={styles.success}>SUCESSO</Text>
          </View>
        ))}
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

function filterBooks(books: Book[], scope: 'all' | BookStatus, genre: string, minRating: number) {
  return books.filter((book) => (scope === 'all' || book.status === scope) && (genre === 'all' || book.genre === genre) && (book.rating || 0) >= minRating);
}

function labelForScope(status: 'all' | BookStatus) {
  if (status === 'finished') return 'Lidos';
  if (status === 'wishlist') return 'Quero ler';
  if (status === 'reading') return 'Lendo';
  return 'Todos';
}

function statusLabel(status: string) {
  if (status === 'finished') return 'Lido';
  if (status === 'wishlist') return 'Quero ler';
  return 'Lendo';
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 38, lineHeight: 46, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 16, lineHeight: 24, maxWidth: 720 },
  stack: { flexDirection: 'column' },
  topGrid: { flexDirection: 'row', gap: 18 },
  midGrid: { flexDirection: 'row', gap: 18 },
  cardTitle: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 18, fontWeight: '900' },
  kicker: { color: appColors.textDim, fontSize: 10, letterSpacing: 3, fontWeight: '900', marginTop: 14 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  filter: { color: appColors.textMuted, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden', fontWeight: '800' },
  filterActive: { color: appColors.background, backgroundColor: appColors.gold, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden', fontWeight: '900' },
  rating: { color: appColors.textMuted, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, overflow: 'hidden', fontWeight: '800' },
  ratingActive: { color: appColors.background, backgroundColor: appColors.gold, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, overflow: 'hidden', fontWeight: '900' },
  gold: { color: appColors.gold },
  white: { color: appColors.text, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22, marginTop: 10 },
  exportIcon: { alignSelf: 'center', width: 54, height: 54, borderRadius: 16, backgroundColor: appColors.goldDeep, alignItems: 'center', justifyContent: 'center' },
  exportIconText: { color: appColors.gold, fontSize: 28 },
  blueIcon: { backgroundColor: 'rgba(59,130,246,0.16)' },
  blueIconText: { color: '#3b82f6', fontSize: 28 },
  exportTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 18 },
  exportText: { color: appColors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  downloadButton: { backgroundColor: appColors.gold, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 22 },
  downloadText: { color: appColors.background, fontWeight: '900' },
  pdfButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 22 },
  pdfText: { color: appColors.text, fontWeight: '900' },
  textArea: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 12, minHeight: 120, textAlignVertical: 'top', marginTop: 12 },
  textAreaLarge: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 12, minHeight: 220, textAlignVertical: 'top', marginTop: 12 },
  outlineButton: { borderColor: '#3b82f6', borderWidth: 1, borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  outlineText: { color: '#3b82f6', fontWeight: '900' },
  bullet: { color: appColors.textMuted, lineHeight: 24, marginTop: 10 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  reportButtons: { flexDirection: 'row', gap: 8 },
  copyButton: { backgroundColor: appColors.surfaceMuted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  copyText: { color: appColors.text, fontWeight: '900' },
  printButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  printText: { color: appColors.text, fontWeight: '900' },
  historyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 24, fontWeight: '900' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 12 },
  historyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' },
  historyIconText: { color: '#3b82f6' },
  historyTextBox: { flex: 1 },
  historyName: { color: appColors.text, fontWeight: '900' },
  historyMeta: { color: appColors.textDim, fontSize: 12, marginTop: 2 },
  success: { color: appColors.emerald, fontSize: 10, fontWeight: '900' },
  message: { color: appColors.gold, fontWeight: '800', lineHeight: 22 }
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { createReadoraBackup, parseReadoraBackup, stringifyBackup } from '@/services/readoraBackup';
import { appColors, appFonts } from '@/theme/tokens';

export default function BackupScreen() {
  const { books, stats, replaceBooks } = useBooks();
  const { preferences, updatePreferences } = usePreferences();
  const { quotes, setQuoteList } = useQuotes();
  const { shelves, setShelfList } = useShelves();
  const { sessions, setSessionList } = useReadingSessions();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const [backupText, setBackupText] = useState('');
  const [reportText, setReportText] = useState('');
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');

  function generateBackup() {
    const backup = createReadoraBackup({ books, quotes, shelves, sessions, preferences });
    setBackupText(stringifyBackup(backup));
    setMessage('Backup JSON gerado. Copie o texto para guardar ou migrar.');
  }

  function generateReport() {
    const lines = [
      'READORA — RELATÓRIO DA BIBLIOTECA',
      'Leitor: ' + preferences.readerName,
      'Gerado em: ' + new Date().toLocaleString('pt-BR'),
      '',
      'RESUMO',
      '- Livros: ' + books.length,
      '- Livros concluídos: ' + stats.finishedBooks,
      '- Lendo agora: ' + stats.readingBooks,
      '- Quero ler: ' + stats.wishlistBooks,
      '- Páginas registradas: ' + stats.pagesRead,
      '- Média geral: ' + stats.averageRating.toFixed(1),
      '- Citações: ' + quotes.length,
      '- Estantes: ' + shelves.length,
      '- Sessões: ' + sessions.length,
      '',
      'LIVROS',
      ...books.map((book, index) => (index + 1) + '. ' + book.title + ' — ' + book.author + ' | ' + book.genre + ' | ' + statusLabel(book.status) + ' | ' + (book.rating || 0) + '/5'),
      '',
      'CITAÇÕES FAVORITAS',
      ...quotes.filter((quote) => quote.favorite).map((quote) => '- “' + quote.text + '” — ' + quote.bookTitle),
      '',
      'SESSÕES RECENTES',
      ...sessions.slice(0, 10).map((session) => '- ' + session.bookTitle + ': ' + session.pagesRead + ' páginas em ' + session.minutesRead + ' minutos')
    ];
    setReportText(lines.join('\n'));
    setMessage('Relatório textual gerado. Para PDF, copie este relatório e imprima pelo navegador/sistema.');
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
          <View style={styles.fakeSelect}><Text style={styles.selectText}>Todos os livros</Text></View>
          <Text style={styles.kicker}>GÊNERO</Text>
          <View style={styles.fakeSelect}><Text style={styles.selectText}>Todos os gêneros</Text></View>
          <Text style={styles.kicker}>AVALIAÇÃO MÍNIMA <Text style={styles.gold}>0★</Text></Text>
          <View style={styles.slider}><View style={styles.sliderKnob} /></View>
          <Text style={styles.body}>Livros selecionados: <Text style={styles.white}>{books.length}</Text></Text>
        </Card>

        <Card>
          <View style={styles.exportIcon}><Text style={styles.exportIconText}>♧</Text></View>
          <Text style={styles.exportTitle}>Exportar JSON</Text>
          <Text style={styles.exportText}>Ideal para backup completo e portabilidade. Inclui todos os metadados, resenhas e configurações.</Text>
          <Pressable style={styles.downloadButton} onPress={generateBackup}><Text style={styles.downloadText}>⇩ Gerar JSON</Text></Pressable>
        </Card>

        <Card>
          <View style={[styles.exportIcon, styles.blueIcon]}><Text style={styles.blueIconText}>▤</Text></View>
          <Text style={styles.exportTitle}>Relatório de Leitura</Text>
          <Text style={styles.exportText}>Gera um relatório textual pronto para copiar, imprimir ou converter em PDF pelo navegador.</Text>
          <Pressable style={styles.pdfButton} onPress={generateReport}><Text style={styles.pdfText}>⇩ Gerar Relatório</Text></Pressable>
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
          <Text style={styles.bullet}>• Os arquivos gerados contêm apenas seus dados pessoais e de leitura.</Text>
          <Text style={styles.bullet}>• Ao importar, você pode restaurar uma biblioteca inteira pelo JSON.</Text>
          <Text style={styles.bullet}>• O relatório textual pode ser copiado e impresso como PDF pelo próprio navegador.</Text>
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
          <View style={styles.reportHeader}><Text style={styles.cardTitle}>Relatório gerado</Text><Pressable style={styles.copyButton} onPress={copyReport}><Text style={styles.copyText}>Copiar relatório</Text></Pressable></View>
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
  fakeSelect: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8 },
  selectText: { color: appColors.text, fontWeight: '800' },
  gold: { color: appColors.gold },
  white: { color: appColors.text, fontWeight: '900' },
  slider: { height: 6, borderRadius: 999, backgroundColor: appColors.surfaceMuted, marginTop: 10 },
  sliderKnob: { width: 10, height: 10, borderRadius: 999, backgroundColor: appColors.gold, marginTop: -2 },
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
  copyButton: { backgroundColor: appColors.surfaceMuted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  copyText: { color: appColors.text, fontWeight: '900' },
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

import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { appColors } from '@/theme/tokens';

export default function MonthlyCapsuleScreen() {
  const { books, stats } = useBooks();
  const { sessions } = useReadingSessions();
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const now = new Date();
  const monthBooks = books.filter((book) => {
    const d = new Date(book.updatedAt || book.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthSessions = sessions.filter((session) => {
    const d = new Date(session.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthPages = monthSessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const monthMinutes = monthSessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const highlight = monthSessions[0] || null;

  return (
    <Screen>
      <Text style={styles.title}>Capsula mensal</Text>
      <Text style={styles.subtitle}>Resumo afetivo e estatistico de {month}.</Text>
      <Card>
        <Text style={styles.kicker}>Resumo do mes</Text>
        <Text style={styles.big}>{monthSessions.length}</Text>
        <Text style={styles.body}>sessao(oes) registradas, {monthPages} paginas e {monthMinutes} minutos de leitura.</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Livro movimentado</Text>
        <Text style={styles.highlight}>{monthBooks[0]?.title || 'Sem movimentacao de livros'}</Text>
        <Text style={styles.body}>{monthBooks[0]?.review || monthBooks[0]?.reasonToRead || 'Adicione ou atualize leituras para enriquecer a capsula.'}</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Sessao destaque</Text>
        <Text style={styles.highlight}>{highlight?.bookTitle || 'Sem sessoes no mes'}</Text>
        <Text style={styles.body}>{highlight ? highlight.pagesRead + ' paginas em ' + highlight.minutesRead + ' minutos.' : 'Registre sessoes no detalhe de um livro.'}</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Humor leitor</Text>
        <Text style={styles.body}>O perfil atual aponta para {stats.favoriteGenre}, com progresso medio de {stats.currentProgress}% nas leituras em andamento.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  big: { color: appColors.text, fontSize: 42, fontWeight: '900' },
  highlight: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 }
});

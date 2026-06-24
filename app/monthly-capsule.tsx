import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function MonthlyCapsuleScreen() {
  const { books, stats } = useBooks();
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const monthBooks = books.filter((book) => {
    const d = new Date(book.updatedAt || book.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const highlight = monthBooks[0] || books[0];

  return (
    <Screen>
      <Text style={styles.title}>Capsula mensal</Text>
      <Text style={styles.subtitle}>Resumo afetivo e estatistico de {month}.</Text>
      <Card>
        <Text style={styles.kicker}>Resumo do mes</Text>
        <Text style={styles.big}>{monthBooks.length}</Text>
        <Text style={styles.body}>livro(s) movimentados neste mes, com {stats.pagesRead} paginas registradas no total.</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Destaque</Text>
        <Text style={styles.highlight}>{highlight?.title || 'Sem livros ainda'}</Text>
        <Text style={styles.body}>{highlight?.review || highlight?.reasonToRead || 'Adicione leituras para gerar uma capsula mais completa.'}</Text>
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

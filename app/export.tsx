import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { appColors } from '@/theme/tokens';

export default function ExportScreen() {
  const { books, stats } = useBooks();
  const preview = JSON.stringify({ exportedAt: new Date().toISOString(), stats, books }, null, 2).slice(0, 900);

  return (
    <Screen>
      <Text style={styles.title}>Exportar</Text>
      <Text style={styles.subtitle}>Previa do backup local. O compartilhamento nativo sera ligado na proxima etapa.</Text>
      <Card>
        <Text style={styles.kicker}>Conteudo pronto para backup</Text>
        <Text style={styles.body}>{books.length} livros, {stats.pagesRead} paginas, genero principal {stats.favoriteGenre}.</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Previa JSON</Text>
        <Text style={styles.code}>{preview}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  body: { color: appColors.textMuted, lineHeight: 22 },
  code: { color: appColors.textMuted, fontSize: 11, lineHeight: 16 }
});

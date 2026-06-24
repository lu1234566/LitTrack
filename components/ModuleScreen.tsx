import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { appColors } from '@/theme/tokens';

export function ModuleScreen({ title, description, next }: { title: string; description: string; next: string[] }) {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>READORA NATIVE</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Card>
        <Text style={styles.cardTitle}>Estado da migracao</Text>
        <Text style={styles.body}>Esta tela ja existe na navegacao nativa. A proxima etapa e portar as regras, dados e interacoes da versao web.</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Proximos passos</Text>
        {next.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  kicker: { color: appColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { color: appColors.text, fontSize: 30, fontWeight: '900' },
  description: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  cardTitle: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  body: { color: appColors.textMuted, lineHeight: 22 },
  bullet: { color: appColors.textMuted, lineHeight: 24 }
});

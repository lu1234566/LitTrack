import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { appColors } from '@/theme/tokens';

const items = [
  { title: 'Biblioteca local', done: true, note: 'Cadastro, edicao, filtros, capas e detalhes.' },
  { title: 'Importacao de livros', done: true, note: 'Busca externa, fallback e duplicados.' },
  { title: 'Sessoes de leitura', done: true, note: 'Registro rapido, timeline e progresso.' },
  { title: 'Citacoes e estantes', done: true, note: 'Criacao, edicao, favoritos e vinculos.' },
  { title: 'Perfil, insights e progresso', done: true, note: 'Gamificacao e leitura analitica.' },
  { title: 'Backup local', done: true, note: 'Exportacao e importacao por JSON.' },
  { title: 'Aparencia ajustavel', done: true, note: 'Cor, densidade e texto.' },
  { title: 'Conta real Google', done: false, note: 'Proxima fase: AuthSession.' },
  { title: 'Firebase automatico', done: false, note: 'Proxima fase: sync por usuario.' },
  { title: 'Build final', done: false, note: 'Teste fisico, APK/AAB, icone e splash.' }
];

export default function ProductStatusScreen() {
  const done = items.filter((item) => item.done).length;
  const progress = Math.round((done / items.length) * 100);

  return (
    <Screen>
      <Text style={styles.title}>Status do produto</Text>
      <Text style={styles.subtitle}>Checklist honesto do que ja esta pronto e do que ainda falta antes de Firebase/producao.</Text>

      <Card>
        <Text style={styles.kicker}>Readora Native</Text>
        <Text style={styles.big}>{progress}%</Text>
        <View style={styles.track}><View style={[styles.fill, { width: progress + '%' }]} /></View>
        <Text style={styles.body}>{done}/{items.length} blocos principais concluidos.</Text>
      </Card>

      {items.map((item) => (
        <Card key={item.title}>
          <View style={styles.row}>
            <Text style={styles.status}>{item.done ? '✓' : '○'}</Text>
            <View style={styles.textBox}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.note}</Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  kicker: { color: appColors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  big: { color: appColors.text, fontSize: 40, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  track: { height: 8, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden', marginTop: 10 },
  fill: { height: '100%', backgroundColor: appColors.gold },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  status: { color: appColors.gold, fontSize: 26, fontWeight: '900' },
  textBox: { flex: 1 },
  itemTitle: { color: appColors.text, fontSize: 17, fontWeight: '900' }
});

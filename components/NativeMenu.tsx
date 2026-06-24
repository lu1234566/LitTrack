import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appColors } from '@/theme/tokens';

const menu = [
  { name: 'Sessao rapida', path: '/quick-session', text: 'Registrar leitura em segundos.' },
  { name: 'Insights', path: '/insights', text: 'Analise avancada dos habitos.' },
  { name: 'Backup', path: '/backup', text: 'Exportar e importar JSON.' },
  { name: 'Descobrir', path: '/discover', text: 'Buscar livros e capas reais.' },
  { name: 'Conta', path: '/account', text: 'Conta e sincronizacao.' },
  { name: 'Progresso', path: '/progress', text: 'Conquistas e sequencia.' },
  { name: 'Metas', path: '/goals', text: 'Objetivos anuais e paginas.' },
  { name: 'Pesquisa', path: '/search', text: 'Busca unificada.' },
  { name: 'Galeria', path: '/gallery', text: 'Parede visual de livros.' },
  { name: 'Perfil', path: '/literary-profile', text: 'Arquetipo e generos.' },
  { name: 'Retrospectiva', path: '/retrospective', text: 'Resumo das leituras.' },
  { name: 'Comparativo', path: '/yearly-comparison', text: 'Anos e progresso.' },
  { name: 'Citacoes', path: '/quotes', text: 'Trechos favoritos.' },
  { name: 'Estantes', path: '/shelves', text: 'Colecoes manuais.' },
  { name: 'Capsula', path: '/monthly-capsule', text: 'Resumo mensal.' },
  { name: 'Timeline', path: '/timeline', text: 'Eventos recentes.' },
  { name: 'Recomendacoes', path: '/recommendations', text: 'Proximas leituras.' },
  { name: 'Exportar', path: '/export', text: 'Backup em JSON.' },
  { name: 'Ajustes', path: '/settings', text: 'Preferencias locais.' }
];

export function NativeMenu() {
  return (
    <View style={styles.wrapper}>
      {menu.map((item) => (
        <Link key={item.path} href={item.path as never} asChild>
          <Pressable style={styles.item}>
            <View style={styles.dot} />
            <View style={styles.textBox}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemText}>{item.text}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 20, padding: 14 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: appColors.gold },
  textBox: { flex: 1 },
  itemTitle: { color: appColors.text, fontSize: 16, fontWeight: '900' },
  itemText: { color: appColors.textMuted, fontSize: 13, marginTop: 3 },
  chevron: { color: appColors.gold, fontSize: 26, fontWeight: '900' }
});

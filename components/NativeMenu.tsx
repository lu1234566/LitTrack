import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appColors } from '@/theme/tokens';

const menu = [
  { name: 'Pesquisa', path: '/search' },
  { name: 'Galeria', path: '/gallery' },
  { name: 'Perfil', path: '/literary-profile' },
  { name: 'Retrospectiva', path: '/retrospective' },
  { name: 'Comparativo', path: '/yearly-comparison' },
  { name: 'Citacoes', path: '/quotes' },
  { name: 'Estantes', path: '/shelves' },
  { name: 'Capsula', path: '/monthly-capsule' },
  { name: 'Timeline', path: '/timeline' },
  { name: 'Recomendacoes', path: '/recommendations' },
  { name: 'Exportar', path: '/export' },
  { name: 'Ajustes', path: '/settings' }
];

export function NativeMenu() {
  return (
    <View style={styles.wrapper}>
      {menu.map((item) => (
        <Link key={item.path} href={item.path as never} asChild>
          <Pressable style={styles.item}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemText}>Em migracao nativa.</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  item: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16
  },
  itemTitle: { color: appColors.text, fontSize: 16, fontWeight: '900' },
  itemText: { color: appColors.textMuted, fontSize: 13, marginTop: 4 }
});

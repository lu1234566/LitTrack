import { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { appColors } from '@/theme/tokens';

const tabs = [
  { label: 'Inicio', href: '/' },
  { label: 'Livros', href: '/library' },
  { label: 'Novo', href: '/add' },
  { label: 'Perfil', href: '/literary-profile' },
  { label: 'Ajustes', href: '/settings' }
];

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const content = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
      <View style={styles.nav}>
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href as never} asChild>
            <Pressable style={styles.navItem}>
              <Text style={styles.navText}>{tab.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: appColors.background },
  scroll: { flexGrow: 1, paddingBottom: 86 },
  content: { flex: 1, padding: 20, gap: 16 },
  nav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderWidth: 1,
    borderRadius: 999,
    padding: 6,
    gap: 4
  },
  navItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999 },
  navText: { color: appColors.textMuted, fontSize: 11, fontWeight: '900' }
});

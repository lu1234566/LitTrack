import { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { usePreferences } from '@/contexts/PreferencesContext';
import { appColors } from '@/theme/tokens';
import { accentColor, densityValue, scaledFont } from '@/services/visualPreferences';

const tabs = [
  { label: 'Inicio', href: '/' },
  { label: 'Livros', href: '/library' },
  { label: 'Descobrir', href: '/discover' },
  { label: 'Novo', href: '/add' },
  { label: 'Conta', href: '/account' },
  { label: 'Ajustes', href: '/settings' }
];

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { preferences } = usePreferences();
  const density = densityValue(preferences.visualDensity);
  const accent = accentColor(preferences.visualAccent);
  const content = <View style={[styles.content, { padding: density.screenPadding, gap: density.screenGap }]}>{children}</View>;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {scroll ? <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: density.bottomPadding }]}>{content}</ScrollView> : content}
      <View style={[styles.nav, { borderColor: accent }]}>
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href as never} asChild>
            <Pressable style={styles.navItem}>
              <Text style={[styles.navText, { fontSize: scaledFont(10, preferences.textScale) }]}>{tab.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: appColors.background },
  scroll: { flexGrow: 1 },
  content: { flex: 1 },
  nav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderRadius: 999,
    padding: 6,
    gap: 4
  },
  navItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999 },
  navText: { color: appColors.textMuted, fontWeight: '900' }
});

import { ReactElement, ReactNode, useState } from 'react';
import { Link, usePathname } from 'expo-router';
import { FlatList, Image, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { usePreferences } from '@/contexts/PreferencesContext';
import { appColors, appFonts } from '@/theme/tokens';
import { accentColor, densityValue, scaledFont } from '@/services/visualPreferences';
import { ReadoraIcon, ReadoraIconName } from '@/components/ReadoraIcon';

const menuItems: { icon: ReadoraIconName; label: string; href: string }[] = [
  { icon: 'dashboard', label: 'Dashboard', href: '/' },
  { icon: 'library', label: 'Meus Livros', href: '/library' },
  { icon: 'shelves', label: 'Minhas Estantes', href: '/shelves' },
  { icon: 'search', label: 'Pesquisar Livros', href: '/search' },
  { icon: 'quotes', label: 'Citações', href: '/quotes' },
  { icon: 'literaryProfile', label: 'Perfil Literário', href: '/literary-profile' },
  { icon: 'monthlyCapsule', label: 'Cápsula Mensal', href: '/monthly-capsule' },
  { icon: 'timeline', label: 'Linha do Tempo', href: '/timeline' },
  { icon: 'retrospective', label: 'Retrospectiva', href: '/retrospective' },
  { icon: 'recommendations', label: 'Recomendações', href: '/recommendations' },
  { icon: 'backup', label: 'Backup e Exportação', href: '/backup' },
  { icon: 'gallery', label: 'Galeria', href: '/gallery' },
  { icon: 'addBook', label: 'Adicionar', href: '/add' }
];

const bottomTabs: { icon: ReadoraIconName; label: string; href: string }[] = [
  { icon: 'dashboard', label: 'Dashboard', href: '/' },
  { icon: 'library', label: 'Livros', href: '/library' },
  { icon: 'shelves', label: 'Estantes', href: '/shelves' },
  { icon: 'quotes', label: 'Citações', href: '/quotes' },
  { icon: 'literaryProfile', label: 'Perfil', href: '/literary-profile' }
];

export function Screen<T>({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
  itemGap
}: {
  children?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** When provided, the screen body is a virtualized FlatList instead of a
   *  ScrollView — only the visible rows are mounted, keeping long lists smooth. */
  data?: ReadonlyArray<T>;
  renderItem?: (item: T, index: number) => ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  ListHeaderComponent?: ReactNode;
  ListEmptyComponent?: ReactNode;
  ListFooterComponent?: ReactNode;
  itemGap?: number;
}) {
  const { preferences } = usePreferences();
  const density = densityValue(preferences.visualDensity);
  const accent = accentColor(preferences.visualAccent);
  const { width } = useWindowDimensions();
  const isDesktop = preferences.layoutMode === 'desktop' ? true : preferences.layoutMode === 'mobile' ? false : width >= 900;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const content = <View style={[styles.content, isDesktop ? styles.desktopContent : styles.mobileContent, { gap: density.screenGap }]}>{children}</View>;

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={Boolean(refreshing)}
      onRefresh={onRefresh}
      tintColor={appColors.gold}
      colors={[appColors.gold]}
      progressBackgroundColor={appColors.surface}
    />
  ) : undefined;

  const gap = itemGap ?? density.screenGap;

  let body: ReactNode;
  if (data && renderItem) {
    body = (
      <FlatList
        data={data as T[]}
        keyExtractor={keyExtractor ? (item, index) => keyExtractor(item, index) : (_, index) => String(index)}
        renderItem={({ item, index }) => renderItem(item, index)}
        ListHeaderComponent={ListHeaderComponent ? <View style={{ gap: density.screenGap, marginBottom: data.length ? gap : 0 }}>{ListHeaderComponent}</View> : null}
        ListEmptyComponent={ListEmptyComponent ? <>{ListEmptyComponent}</> : null}
        ListFooterComponent={ListFooterComponent ? <View style={{ marginTop: gap }}>{ListFooterComponent}</View> : null}
        ItemSeparatorComponent={() => <View style={{ height: gap }} />}
        contentContainerStyle={[isDesktop ? styles.desktopContent : styles.mobileContent, isDesktop ? styles.scrollDesktop : styles.scrollMobile]}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={11}
      />
    );
  } else if (scroll) {
    body = (
      <ScrollView
        contentContainerStyle={[styles.scroll, isDesktop ? styles.scrollDesktop : styles.scrollMobile]}
        refreshControl={refreshControl}
      >
        {content}
      </ScrollView>
    );
  } else {
    body = content;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        {isDesktop ? <Sidebar accent={accent} textScale={preferences.textScale} /> : <MobileTopbar accent={accent} onMenu={() => setDrawerOpen(true)} />}
        <View style={[styles.main, isDesktop ? styles.mainDesktop : styles.mainMobile]}>
          {body}
        </View>
      </View>
      {!isDesktop ? <MobileBottomBar accent={accent} /> : null}
      {!isDesktop && drawerOpen ? <MobileDrawer accent={accent} onClose={() => setDrawerOpen(false)} textScale={preferences.textScale} /> : null}
    </SafeAreaView>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.logoMark, compact && styles.logoMarkSmall]}><ReadoraIcon name="brand" size={compact ? 22 : 24} color={appColors.gold} /></View>
      <View>
        <Text style={[styles.brandName, compact && styles.brandNameSmall]}>Readora</Text>
        <Text style={[styles.brandSub, compact && styles.brandSubSmall]}>DIÁRIO LITERÁRIO</Text>
      </View>
    </View>
  );
}

function Sidebar({ accent, textScale }: { accent: string; textScale?: string }) {
  return (
    <View style={styles.sidebar}>
      <Brand />
      <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarList}>
        {menuItems.map((item, index) => (
          <Link key={item.href + index} href={item.href as never} asChild>
            <Pressable style={({ pressed }) => [styles.sideItem, pressed && styles.sideItemPressed]}>
              <View style={styles.sideIcon}><ReadoraIcon name={item.icon} size={20} color={index === 1 ? accent : appColors.textMuted} /></View>
              <Text style={[styles.sideText, { fontSize: scaledFont(15, textScale) }]}>{item.label}</Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
      <View style={styles.sidebarFooter}>
        <View style={styles.userRow}>
          <Image source={{ uri: 'https://avatars.githubusercontent.com/u/17485550?v=4' }} style={styles.avatar} />
          <View style={styles.userTextBox}>
            <Text style={styles.userName}>Lucas Barcelar</Text>
            <Text style={styles.userEmail}>barcelar34@gmail.com</Text>
          </View>
        </View>
        <Link href="/settings" asChild><Pressable style={styles.sideItem}><View style={styles.sideIcon}><ReadoraIcon name="settings" size={20} color={appColors.textMuted} /></View><Text style={styles.sideText}>Configurações</Text></Pressable></Link>
        <Pressable style={styles.sideItem}><View style={styles.sideIcon}><ReadoraIcon name="logout" size={20} color={appColors.rose} /></View><Text style={[styles.sideText, { color: appColors.rose }]}>Sair</Text></Pressable>
      </View>
    </View>
  );
}

function MobileTopbar({ accent, onMenu }: { accent: string; onMenu: () => void }) {
  return (
    <View style={styles.mobileTopbar}>
      <Pressable onPress={onMenu} style={styles.menuButton}><ReadoraIcon name="menu" size={28} color={appColors.textMuted} /></Pressable>
      <Brand compact />
      <Image source={{ uri: 'https://avatars.githubusercontent.com/u/17485550?v=4' }} style={[styles.mobileAvatar, { borderColor: accent }]} />
    </View>
  );
}

function MobileDrawer({ accent, onClose, textScale }: { accent: string; onClose: () => void; textScale?: string }) {
  return (
    <View style={styles.drawerOverlay}>
      <View style={styles.drawerPanel}>
        <View style={styles.drawerHeader}>
          <Brand />
          <Pressable onPress={onClose} style={styles.closeButton}><ReadoraIcon name="close" size={28} color={appColors.textMuted} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.drawerList}>
          {menuItems.map((item, index) => (
            <Link key={item.href + index} href={item.href as never} asChild>
              <Pressable style={styles.drawerItem} onPress={onClose}>
                <View style={styles.drawerIcon}><ReadoraIcon name={item.icon} size={24} color={index === 0 ? accent : appColors.textMuted} /></View>
                <Text style={[styles.drawerText, { fontSize: scaledFont(20, textScale) }]}>{item.label}</Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
        <View style={styles.drawerFooter}>
          <View style={styles.userRow}>
            <Image source={{ uri: 'https://avatars.githubusercontent.com/u/17485550?v=4' }} style={styles.avatar} />
            <View style={styles.userTextBox}>
              <Text style={styles.userName}>Lucas Barcelar</Text>
              <Text style={styles.userEmail}>barcelar34@gmail.com</Text>
            </View>
          </View>
          <Link href="/settings" asChild><Pressable style={styles.drawerItem} onPress={onClose}><View style={styles.drawerIcon}><ReadoraIcon name="settings" size={24} color={appColors.textMuted} /></View><Text style={styles.drawerText}>Configurações</Text></Pressable></Link>
          <Pressable style={styles.drawerItem}><View style={styles.drawerIcon}><ReadoraIcon name="logout" size={24} color={appColors.rose} /></View><Text style={[styles.drawerText, { color: appColors.rose }]}>Sair</Text></Pressable>
        </View>
      </View>
      <Pressable style={styles.drawerScrim} onPress={onClose} />
    </View>
  );
}

function MobileBottomBar({ accent }: { accent: string }) {
  const pathname = usePathname();
  return (
    <View style={styles.bottomBar}>
      {bottomTabs.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        const color = active ? accent : appColors.textDim;
        return (
          <Link key={tab.href} href={tab.href as never} asChild>
            <Pressable style={styles.bottomItem}>
              <ReadoraIcon name={tab.icon} size={23} color={color} />
              <Text style={[styles.bottomLabel, { color }]} numberOfLines={1}>{tab.label}</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: appColors.background },
  shell: { flex: 1, flexDirection: 'row', backgroundColor: appColors.background },
  main: { flex: 1, backgroundColor: appColors.background },
  mainDesktop: { marginLeft: 0 },
  mainMobile: { paddingTop: 88 },
  scroll: { flexGrow: 1 },
  scrollDesktop: { paddingBottom: 56 },
  scrollMobile: { paddingBottom: 104 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, flexDirection: 'row', backgroundColor: appColors.sidebar, borderTopColor: appColors.border, borderTopWidth: 1, paddingTop: 10, paddingBottom: 22, paddingHorizontal: 6 },
  bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 2 },
  bottomLabel: { fontSize: 11, fontWeight: '800' },
  content: { flex: 1 },
  desktopContent: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 36, paddingTop: 54, paddingBottom: 56 },
  mobileContent: { width: '100%', paddingHorizontal: 16, paddingTop: 28, paddingBottom: 32 },
  sidebar: { width: 255, backgroundColor: appColors.sidebar, borderRightColor: appColors.border, borderRightWidth: 1, paddingTop: 28 },
  sidebarScroll: { flex: 1 },
  sidebarList: { paddingHorizontal: 16, paddingTop: 20, gap: 8 },
  sidebarFooter: { borderTopColor: appColors.border, borderTopWidth: 1, padding: 16, gap: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  logoMark: { width: 42, height: 42, borderRadius: 12, borderColor: appColors.goldDeep, borderWidth: 1, backgroundColor: appColors.surface, alignItems: 'center', justifyContent: 'center' },
  logoMarkSmall: { width: 38, height: 38, borderRadius: 11 },
  logoBook: { color: appColors.gold, fontSize: 24, fontWeight: '900' },
  brandName: { color: appColors.text, fontFamily: appFonts.display, fontSize: 27, fontStyle: 'italic', fontWeight: '900', lineHeight: 28 },
  brandNameSmall: { fontSize: 25, lineHeight: 25 },
  brandSub: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 12, letterSpacing: 4, marginTop: 1 },
  brandSubSmall: { fontSize: 11, letterSpacing: 3 },
  sideItem: { minHeight: 45, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  sideItemPressed: { backgroundColor: appColors.goldDeep },
  sideIcon: { width: 20, alignItems: 'center', justifyContent: 'center' },
  sideText: { color: appColors.textMuted, fontWeight: '800' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 34, height: 34, borderRadius: 999 },
  mobileAvatar: { width: 44, height: 44, borderRadius: 999, borderWidth: 1 },
  userTextBox: { flex: 1 },
  userName: { color: appColors.text, fontWeight: '900' },
  userEmail: { color: appColors.textDim, fontSize: 12, marginTop: 2 },
  mobileTopbar: { position: 'absolute', top: 0, left: 0, right: 0, height: 88, zIndex: 10, backgroundColor: appColors.sidebar, borderBottomColor: appColors.border, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  menuButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  drawerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50, flexDirection: 'row' },
  drawerPanel: { width: '76%', maxWidth: 430, backgroundColor: appColors.sidebar, borderRightColor: appColors.border, borderRightWidth: 1, paddingTop: 34 },
  drawerScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 28 },
  closeText: { color: appColors.textMuted, fontSize: 40, lineHeight: 42 },
  drawerList: { paddingHorizontal: 24, paddingTop: 42, gap: 14 },
  drawerItem: { minHeight: 58, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 20 },
  drawerIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  drawerText: { color: appColors.textMuted, fontWeight: '800' },
  drawerFooter: { borderTopColor: appColors.border, borderTopWidth: 1, padding: 24, gap: 14 }
});

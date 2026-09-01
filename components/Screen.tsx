import { ReactElement, ReactNode, useState } from 'react';
import { Link, usePathname } from 'expo-router';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSession } from '@/contexts/SessionContext';
import { SessionUser } from '@/types/sessionUser';
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
  { icon: 'retrospective', label: 'Retrospectiva', href: '/retrospective' },
  { icon: 'recommendations', label: 'Recomendações', href: '/recommendations' },
  { icon: 'backup', label: 'Backup e Exportação', href: '/backup' },
  { icon: 'gallery', label: 'Galeria', href: '/gallery' },
  { icon: 'addBook', label: 'Adicionar', href: '/add' },
  { icon: 'account', label: 'Conta', href: '/account' }
];

const bottomTabs: { icon: ReadoraIconName; label: string; href: string }[] = [
  { icon: 'dashboard', label: 'Dashboard', href: '/' },
  { icon: 'library', label: 'Livros', href: '/library' },
  { icon: 'shelves', label: 'Estantes', href: '/shelves' },
  { icon: 'quotes', label: 'Citações', href: '/quotes' },
  { icon: 'literaryProfile', label: 'Perfil', href: '/literary-profile' }
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

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
  const { user, signOut } = useSession();
  const insets = useSafeAreaInsets();
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
        contentContainerStyle={[isDesktop ? styles.desktopContent : styles.mobileContent, isDesktop ? styles.scrollDesktop : { paddingBottom: 94 + insets.bottom }]}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={11}
      />
    );
  } else if (scroll) {
    body = (
      <ScrollView
        contentContainerStyle={[styles.scroll, isDesktop ? styles.scrollDesktop : { paddingBottom: 94 + insets.bottom }]}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  } else {
    body = content;
  }

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      setDrawerOpen(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        {isDesktop ? (
          <Sidebar accent={accent} textScale={preferences.textScale} user={user} onSignOut={handleSignOut} />
        ) : (
          <MobileTopbar accent={accent} onMenu={() => setDrawerOpen(true)} user={user} insetTop={insets.top} />
        )}
        <View style={[styles.main, isDesktop ? styles.mainDesktop : { paddingTop: 70 + insets.top }]}>
          {body}
        </View>
      </View>
      {!isDesktop ? <MobileBottomBar accent={accent} insetBottom={insets.bottom} /> : null}
      {!isDesktop && drawerOpen ? (
        <MobileDrawer
          accent={accent}
          onClose={() => setDrawerOpen(false)}
          onSignOut={handleSignOut}
          textScale={preferences.textScale}
          user={user}
          insetTop={insets.top}
          insetBottom={insets.bottom}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandRow, compact && styles.brandRowCompact]}>
      <View style={[styles.logoMark, compact && styles.logoMarkSmall]}>
        <ReadoraIcon name="brand" size={compact ? 21 : 24} color={appColors.gold} />
      </View>
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.brandName, compact && styles.brandNameSmall]}>Readora</Text>
        <Text numberOfLines={1} style={[styles.brandSub, compact && styles.brandSubSmall]}>DIÁRIO LITERÁRIO</Text>
      </View>
    </View>
  );
}

function UserAvatar({ uri, style, iconSize }: { uri?: string | null; style: object; iconSize: number }) {
  if (uri) return <Image source={{ uri }} style={style} />;
  return <View style={[style, styles.avatarFallback]}><ReadoraIcon name="literaryProfile" size={iconSize} color={appColors.textDim} /></View>;
}

function Sidebar({ accent, textScale, user, onSignOut }: { accent: string; textScale?: string; user: SessionUser | null; onSignOut: () => void | Promise<void> }) {
  const pathname = usePathname();
  return (
    <View style={styles.sidebar}>
      <Brand />
      <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarList} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link key={item.href} href={item.href as never} asChild>
              <Pressable style={({ pressed }) => [styles.sideItem, active && styles.sideItemActive, pressed && styles.sideItemPressed]}>
                <View style={styles.sideIcon}><ReadoraIcon name={item.icon} size={20} color={active ? accent : appColors.textMuted} /></View>
                <Text style={[styles.sideText, { fontSize: scaledFont(15, textScale) }, active && { color: accent }]}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
      <View style={styles.sidebarFooter}>
        <Link href="/account" asChild>
          <Pressable style={styles.userRow}>
            <UserAvatar uri={user?.photoURL} style={styles.avatar} iconSize={20} />
            <View style={styles.userTextBox}>
              <Text style={styles.userName}>{user?.displayName || 'Convidado'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'Faça login para sincronizar'}</Text>
            </View>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable style={[styles.sideItem, isActivePath(pathname, '/settings') && styles.sideItemActive]}>
            <View style={styles.sideIcon}><ReadoraIcon name="settings" size={20} color={isActivePath(pathname, '/settings') ? accent : appColors.textMuted} /></View>
            <Text style={[styles.sideText, isActivePath(pathname, '/settings') && { color: accent }]}>Configurações</Text>
          </Pressable>
        </Link>
        <Pressable onPress={() => void onSignOut()} style={styles.sideItem}>
          <View style={styles.sideIcon}><ReadoraIcon name="logout" size={20} color={appColors.rose} /></View>
          <Text style={[styles.sideText, { color: appColors.rose }]}>Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MobileTopbar({ accent, onMenu, user, insetTop }: { accent: string; onMenu: () => void; user: SessionUser | null; insetTop: number }) {
  return (
    <View style={[styles.mobileTopbar, { height: 70 + insetTop, paddingTop: insetTop }]}>
      <Pressable onPress={onMenu} hitSlop={6} style={styles.menuButton}>
        <ReadoraIcon name="menu" size={26} color={appColors.textMuted} />
      </Pressable>
      <View style={styles.topbarBrand}><Brand compact /></View>
      <Link href="/account" asChild>
        <Pressable hitSlop={8} style={styles.topbarAvatar}>
          <UserAvatar uri={user?.photoURL} style={[styles.mobileAvatar, { borderColor: accent }]} iconSize={21} />
        </Pressable>
      </Link>
    </View>
  );
}

function MobileDrawer({
  accent,
  onClose,
  onSignOut,
  textScale,
  user,
  insetTop,
  insetBottom
}: {
  accent: string;
  onClose: () => void;
  onSignOut: () => void | Promise<void>;
  textScale?: string;
  user: SessionUser | null;
  insetTop: number;
  insetBottom: number;
}) {
  const pathname = usePathname();
  return (
    <View style={styles.drawerOverlay}>
      <View style={[styles.drawerPanel, { paddingTop: insetTop + 10 }]}>
        <View style={styles.drawerHeader}>
          <View style={styles.drawerBrand}><Brand compact /></View>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <ReadoraIcon name="close" size={23} color={appColors.textMuted} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.drawerList} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link key={item.href} href={item.href as never} asChild>
                <Pressable style={[styles.drawerItem, active && styles.drawerItemActive]} onPress={onClose}>
                  <View style={styles.drawerIcon}><ReadoraIcon name={item.icon} size={22} color={active ? accent : appColors.textMuted} /></View>
                  <Text numberOfLines={1} style={[styles.drawerText, { fontSize: scaledFont(18, textScale) }, active && { color: accent }]}>{item.label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>
        <View style={[styles.drawerFooter, { paddingBottom: 14 + insetBottom }]}>
          <Link href="/account" asChild>
            <Pressable style={[styles.userRow, styles.drawerUserRow]} onPress={onClose}>
              <UserAvatar uri={user?.photoURL} style={styles.avatarLarge} iconSize={22} />
              <View style={styles.userTextBox}>
                <Text numberOfLines={1} style={styles.userName}>{user?.displayName || 'Convidado'}</Text>
                <Text numberOfLines={1} style={styles.userEmail}>{user?.email || 'Faça login para sincronizar'}</Text>
              </View>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable style={[styles.drawerItem, isActivePath(pathname, '/settings') && styles.drawerItemActive]} onPress={onClose}>
              <View style={styles.drawerIcon}><ReadoraIcon name="settings" size={22} color={isActivePath(pathname, '/settings') ? accent : appColors.textMuted} /></View>
              <Text style={[styles.drawerText, isActivePath(pathname, '/settings') && { color: accent }]}>Configurações</Text>
            </Pressable>
          </Link>
          <Pressable onPress={() => void onSignOut()} style={styles.drawerItem}>
            <View style={styles.drawerIcon}><ReadoraIcon name="logout" size={22} color={appColors.rose} /></View>
            <Text style={[styles.drawerText, { color: appColors.rose }]}>Sair</Text>
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.drawerScrim} onPress={onClose} />
    </View>
  );
}

function MobileBottomBar({ accent, insetBottom }: { accent: string; insetBottom: number }) {
  const pathname = usePathname();
  return (
    <View style={[styles.bottomBar, { paddingBottom: 12 + insetBottom }]}>
      {bottomTabs.map((tab) => {
        const active = isActivePath(pathname, tab.href);
        const color = active ? accent : appColors.textDim;
        return (
          <Link key={tab.href} href={tab.href as never} asChild>
            <Pressable style={styles.bottomItem}>
              <ReadoraIcon name={tab.icon} size={22} color={color} />
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
  scroll: { flexGrow: 1 },
  scrollDesktop: { paddingBottom: 56 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, flexDirection: 'row', backgroundColor: appColors.sidebar, borderTopColor: appColors.border, borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 6 },
  bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 2 },
  bottomLabel: { fontSize: 10, fontWeight: '800' },
  content: { flex: 1 },
  desktopContent: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 36, paddingTop: 54, paddingBottom: 56 },
  mobileContent: { width: '100%', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 32 },
  sidebar: { width: 255, backgroundColor: appColors.sidebar, borderRightColor: appColors.border, borderRightWidth: 1, paddingTop: 28 },
  sidebarScroll: { flex: 1 },
  sidebarList: { paddingHorizontal: 16, paddingTop: 20, gap: 8 },
  sidebarFooter: { borderTopColor: appColors.border, borderTopWidth: 1, padding: 16, gap: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  brandRowCompact: { paddingHorizontal: 0, gap: 10 },
  logoMark: { width: 42, height: 42, borderRadius: 12, borderColor: appColors.goldDeep, borderWidth: 1, backgroundColor: appColors.surface, alignItems: 'center', justifyContent: 'center' },
  logoMarkSmall: { width: 36, height: 36, borderRadius: 10 },
  brandName: { color: appColors.text, fontFamily: appFonts.display, fontSize: 27, fontStyle: 'italic', fontWeight: '900', lineHeight: 28 },
  brandNameSmall: { fontSize: 23, lineHeight: 24 },
  brandSub: { color: appColors.gold, fontFamily: appFonts.display, fontSize: 12, letterSpacing: 4, marginTop: 1 },
  brandSubSmall: { fontSize: 9, letterSpacing: 2.5 },
  sideItem: { minHeight: 45, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  sideItemActive: { backgroundColor: appColors.surfaceSoft },
  sideItemPressed: { backgroundColor: appColors.goldDeep },
  sideIcon: { width: 20, alignItems: 'center', justifyContent: 'center' },
  sideText: { color: appColors.textMuted, fontWeight: '800' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 34, height: 34, borderRadius: 999 },
  avatarLarge: { width: 42, height: 42, borderRadius: 999 },
  mobileAvatar: { width: 40, height: 40, borderRadius: 999, borderWidth: 1 },
  avatarFallback: { backgroundColor: appColors.surface, borderColor: appColors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  userTextBox: { flex: 1, minWidth: 0 },
  userName: { color: appColors.text, fontWeight: '900' },
  userEmail: { color: appColors.textDim, fontSize: 12, marginTop: 2 },
  mobileTopbar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: appColors.sidebar, borderBottomColor: appColors.border, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  topbarBrand: { flex: 1, alignItems: 'center', overflow: 'hidden', paddingHorizontal: 8 },
  topbarAvatar: { width: 42, alignItems: 'flex-end', justifyContent: 'center' },
  menuButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  closeButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  drawerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50, flexDirection: 'row' },
  drawerPanel: { width: '82%', maxWidth: 360, backgroundColor: appColors.sidebar, borderRightColor: appColors.border, borderRightWidth: 1 },
  drawerScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  drawerBrand: { flex: 1, minWidth: 0, overflow: 'hidden' },
  drawerList: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14, gap: 5 },
  drawerItem: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14 },
  drawerItemActive: { backgroundColor: appColors.surfaceSoft },
  drawerIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  drawerText: { color: appColors.textMuted, fontWeight: '800', flexShrink: 1 },
  drawerFooter: { borderTopColor: appColors.border, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, gap: 7 },
  drawerUserRow: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 2 }
});

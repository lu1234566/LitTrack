import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BookCard } from '@/components/BookCard';
import { useBooks } from '@/contexts/BookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useReadingSessions } from '@/contexts/ReadingSessionContext';
import { useShelves } from '@/contexts/ShelfContext';
import { ReadoraIcon, ReadoraIconName } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

export default function DashboardScreen() {
  const { books, stats, loading } = useBooks();
  const { preferences } = usePreferences();
  const { sessions } = useReadingSessions();
  const { shelves } = useShelves();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const recentBooks = books.filter((book) => book.status === 'finished').slice(0, 3);
  const sessionMinutes = sessions.reduce((sum, session) => sum + session.minutesRead, 0);
  const year = new Date().getFullYear();
  const finishedThisYear = books.filter((book) => book.status === 'finished' && new Date(book.finishedAt || book.updatedAt || book.createdAt).getFullYear() === year).length;
  const yearlyGoal = preferences.yearlyGoal || 0;
  const goalPct = yearlyGoal > 0 ? Math.min(100, Math.round((finishedThisYear / yearlyGoal) * 100)) : 0;

  return (
    <Screen>
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>READORA — LITERARY JOURNAL</Text>
        <Text style={[styles.heroTitle, mobile && styles.heroTitleMobile]}>Readora</Text>
        <Text style={styles.heroQuote}>“Os livros são uma forma única de magia portátil.” — Stephen King</Text>
        <View style={[styles.heroActions, mobile && styles.stack]}>
          <Link href="/add" asChild><Pressable style={styles.primaryPill}><ReadoraIcon name="addBook" size={16} color={appColors.background} /><Text style={styles.primaryText}>NOVA JORNADA</Text></Pressable></Link>
          <Link href="/library" asChild><Pressable style={styles.darkPill}><ReadoraIcon name="library" size={16} color={appColors.text} /><Text style={styles.darkPillText}>BIBLIOTECA</Text></Pressable></Link>
        </View>
        <Text style={styles.heroWatermark}>R</Text>
      </View>

      <View style={[styles.statsGrid, mobile && styles.mobileGrid]}>
        <Metric label="OBRAS EM 2026" value={String(stats.finishedBooks)} />
        <Metric label="PÁGINAS DO CICLO" value={stats.pagesRead + ' pág.'} />
        <Metric label="MÉDIA CRÍTICA" value={stats.averageRating.toFixed(1)} accent />
        <Metric label="EM FOCO" value={books.find((book) => book.status === 'reading')?.title || '—'} />
      </View>

      <SectionHeader color={appColors.emerald} title={'Meta de ' + year} action="AJUSTAR" href="/settings" />
      {yearlyGoal > 0 ? (
        <Card>
          <View style={styles.goalTop}>
            <Text style={styles.goalCount}>{finishedThisYear}<Text style={styles.goalOf}> / {yearlyGoal} livros</Text></Text>
            <Text style={styles.goalPct}>{goalPct}%</Text>
          </View>
          <View style={styles.goalTrack}><View style={[styles.goalFill, { width: (goalPct + '%') as `${number}%` }]} /></View>
          <Text style={styles.goalNote}>{finishedThisYear >= yearlyGoal ? 'Meta do ano concluída! 🎉' : 'Faltam ' + (yearlyGoal - finishedThisYear) + ' livro(s) para sua meta anual.'}</Text>
        </Card>
      ) : (
        <Card><Text style={styles.body}>Defina sua meta anual de leitura nas Configurações para acompanhar o progresso aqui.</Text></Card>
      )}

      <SectionHeader color={appColors.gold} title="Últimas Leituras" action="COLEÇÃO" href="/library" />
      {loading ? <Text style={styles.muted}>Carregando biblioteca...</Text> : null}
      {!loading && recentBooks.length === 0 ? (
        <View style={styles.emptyPanel}><Text style={styles.emptyText}>Sua estante de finalizados aguarda a primeira obra.</Text></View>
      ) : null}
      {recentBooks.map((book) => <BookCard key={book.id} book={book} />)}

      <SectionHeader color={appColors.purple} title="Minhas Estantes" action="GESTÃO" href="/shelves" />
      <View style={[styles.shelfGrid, mobile && styles.stack]}>
        {buildShelfCards(shelves).map((shelf) => (
          <Card key={shelf.name}>
            <View style={styles.shelfTop}><View style={styles.folderIcon}><ReadoraIcon name={shelf.icon} size={20} color={shelf.color} /></View><Text style={styles.shelfBadge}>{shelf.count}</Text></View>
            <Text style={styles.shelfTitle}>{shelf.name}</Text>
            <Text style={styles.shelfText}>{shelf.description}</Text>
          </Card>
        ))}
      </View>

      <SectionHeader color={appColors.rose} title="Atmosferas" />
      <View style={[styles.atmosGrid, mobile && styles.stack]}>
        <Card>
          <Text style={styles.displayCardTitle}>Retrato Literário</Text>
          <Text style={styles.body}>A essência da sua caminhada entre páginas e narrativas.</Text>
          <View style={styles.profileGrid}>
            <MiniBox label="MESTRE DAS PALAVRAS" value={stats.favoriteGenre || '—'} />
            <MiniBox label="AURA DOMINANTE" value="EQUILIBRADA" />
            <MiniBox label="OBRA PRIMA" value={books.find((book) => (book.rating || 0) >= 5)?.title || '—'} />
            <MiniBox label="VASTIDÃO" value={String(stats.totalBooks)} />
          </View>
        </Card>
        <View style={styles.capsuleCardGold}>
          <View style={styles.capsuleIcon}><ReadoraIcon name="monthlyCapsule" size={24} color={appColors.gold} /></View>
          <Text style={styles.capsuleTitle}>Cápsula Mensal</Text>
          <Text style={styles.capsuleText}>Reviva suas memórias deste ciclo em uma composição única.</Text>
          <Link href="/monthly-capsule" asChild><Pressable style={styles.blackButton}><Text style={styles.blackButtonText}>GERAR CÁPSULA</Text><ReadoraIcon name="forward" size={14} color={appColors.text} /></Pressable></Link>
        </View>
      </View>

      <View style={[styles.bottomStats, mobile && styles.stack]}>
        <Metric label="ACERVO TOTAL" value={stats.totalBooks + ' Livros'} />
        <Metric label="HORIZONTES" value={stats.finishedBooks + ' Lidos'} />
        <Metric label="TEMPO DE FOCO" value={Math.floor(sessionMinutes / 60) + 'h ' + (sessionMinutes % 60) + 'm'} />
      </View>
    </Screen>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.metricAccent]} numberOfLines={1}>{value}</Text>
    </Card>
  );
}

function SectionHeader({ color, title, action, href }: { color: string; title: string; action?: string; href?: string }) {
  return (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionBar, { backgroundColor: color }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && href ? <Link href={href as never} asChild><Pressable><Text style={styles.sectionAction}>{action} ›</Text></Pressable></Link> : null}
    </View>
  );
}

function MiniBox({ label, value }: { label: string; value: string }) {
  return <View style={styles.miniBox}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue} numberOfLines={1}>{value}</Text></View>;
}

function buildShelfCards(shelves: Array<{ name: string; description?: string; color?: string; bookIds: string[] }>) {
  const base: { name: string; description: string; color: string; icon: ReadoraIconName; count: number }[] = [
    { name: 'QUERO LER', description: 'Obras que despertaram o interesse e aguardam o momento certo.', color: '#3b82f6', icon: 'bookmark', count: 0 },
    { name: 'FAVORITOS', description: 'Livros que deixaram uma marca profunda na alma e no pensamento.', color: '#ef4444', icon: 'heart', count: 0 },
    { name: 'RELER', description: 'Jornadas que merecem ser revisitadas sob novas perspectivas.', color: '#8b5cf6', icon: 'retrospective', count: 0 },
    { name: 'ABANDONADOS', description: 'Caminhos que foram interrompidos, aguardando talvez um novo fôlego.', color: '#64748b', icon: 'flag', count: 0 }
  ];
  if (!shelves.length) return base;
  return base.map((item, index) => ({ ...item, count: shelves[index]?.bookIds.length || item.count }));
}

const styles = StyleSheet.create({
  heroCard: { minHeight: 330, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 54, padding: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: appColors.backgroundSoft, gap: 14 },
  heroKicker: { color: appColors.textDim, letterSpacing: 8, fontSize: 11, fontWeight: '900' },
  heroTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 72, lineHeight: 80, fontWeight: '900' },
  heroTitleMobile: { fontSize: 44, lineHeight: 50 },
  heroQuote: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 18, textAlign: 'center', maxWidth: 520 },
  heroWatermark: { position: 'absolute', right: 26, top: 8, color: 'rgba(255,255,255,0.025)', fontFamily: appFonts.display, fontSize: 350, fontWeight: '900' },
  heroActions: { flexDirection: 'row', gap: 16, marginTop: 22 },
  primaryPill: { backgroundColor: appColors.text, borderRadius: 999, paddingVertical: 16, paddingHorizontal: 34, minWidth: 170, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { color: appColors.background, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  darkPill: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 16, paddingHorizontal: 34, minWidth: 170, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  darkPillText: { color: appColors.text, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  stack: { flexDirection: 'column' },
  statsGrid: { flexDirection: 'row', gap: 18 },
  mobileGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metricLabel: { color: appColors.textDim, fontSize: 11, fontWeight: '900', letterSpacing: 4 },
  metricValue: { color: appColors.text, fontSize: 34, fontWeight: '900' },
  metricAccent: { color: appColors.gold },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  sectionBar: { width: 4, height: 22, borderRadius: 999 },
  sectionTitle: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 24, fontWeight: '900' },
  sectionAction: { color: appColors.textDim, fontSize: 11, letterSpacing: 5, fontWeight: '900', marginLeft: 'auto' },
  emptyPanel: { minHeight: 120, borderColor: appColors.border, borderStyle: 'dashed', borderWidth: 1, borderRadius: 34, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: appColors.textDim, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 16, textAlign: 'center' },
  shelfGrid: { flexDirection: 'row', gap: 20 },
  shelfTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  folderIcon: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  shelfBadge: { color: appColors.textMuted, backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden', fontSize: 11 },
  shelfTitle: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 18, fontWeight: '900' },
  shelfText: { color: appColors.textDim, fontFamily: appFonts.display, fontStyle: 'italic', lineHeight: 19 },
  atmosGrid: { flexDirection: 'row', gap: 28 },
  displayCardTitle: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 34, fontWeight: '900' },
  body: { color: appColors.textMuted, lineHeight: 22 },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 },
  miniBox: { flexGrow: 1, minWidth: 180, backgroundColor: appColors.background, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 24, padding: 22 },
  miniLabel: { color: appColors.textDim, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  miniValue: { color: appColors.text, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 18, fontWeight: '900', marginTop: 10 },
  capsuleCardGold: { flex: 1, backgroundColor: appColors.gold, borderRadius: 28, padding: 28, gap: 16 },
  capsuleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: appColors.background, alignItems: 'center', justifyContent: 'center' },
  capsuleIconText: { color: appColors.gold, fontSize: 24 },
  capsuleTitle: { color: appColors.background, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 32, fontWeight: '900' },
  capsuleText: { color: 'rgba(0,0,0,0.72)', fontFamily: appFonts.display, fontStyle: 'italic', fontSize: 16, lineHeight: 22 },
  blackButton: { backgroundColor: appColors.background, borderRadius: 999, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16 },
  blackButtonText: { color: appColors.text, fontSize: 12, letterSpacing: 1, fontWeight: '900' },
  bottomStats: { flexDirection: 'row', gap: 16 },
  muted: { color: appColors.textMuted },
  goalTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  goalCount: { color: appColors.text, fontFamily: appFonts.display, fontSize: 32, fontWeight: '900' },
  goalOf: { color: appColors.textMuted, fontFamily: appFonts.body, fontSize: 16, fontWeight: '900' },
  goalPct: { color: appColors.emerald, fontSize: 22, fontWeight: '900' },
  goalTrack: { height: 12, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden', marginTop: 12 },
  goalFill: { height: '100%', backgroundColor: appColors.emerald, borderRadius: 999 },
  goalNote: { color: appColors.textMuted, fontSize: 13, marginTop: 10 }
});

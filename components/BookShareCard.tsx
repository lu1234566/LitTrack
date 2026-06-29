import { forwardRef, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Book } from '@/types/book';
import { statusLabel } from '@/services/bookStorage';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { haptic } from '@/services/feedback';
import { appColors, appFonts } from '@/theme/tokens';

// A shareable 1080×1350 stat card for a single book — same scale-driven trick as
// the monthly capsule: one component renders both the on-screen preview (scale<1)
// and the full-resolution export (scale 1).

const C = {
  bg: '#0d0d0d', card: '#171717', border: 'rgba(255,255,255,0.07)',
  amber: '#f59e0b', amber50: '#fffbeb', amberSoft: 'rgba(245,158,11,0.10)',
  n50: '#fafafa', n400: '#a3a3a3', n500: '#737373', n700: '#404040', n800: '#262626'
};

function Stars({ rating, u }: { rating: number; u: (n: number) => number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: 'row', gap: u(6) }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <ReadoraIcon key={i} name={i < full ? 'star' : (i === full && half ? 'star' : 'starOutline')} size={u(46)} color={i < full || (i === full && half) ? C.amber : C.n800} />
      ))}
    </View>
  );
}

export const BookCardArt = forwardRef<View, { book: Book; scale?: number }>(function BookCardArt({ book, scale = 1 }, ref) {
  const u = (n: number) => n * scale;
  const rating = book.rating || 0;
  const moods = (book.mood || '').split(',').map((m) => m.trim()).filter(Boolean).slice(0, 4);
  const stats = [
    { label: 'Páginas', value: book.totalPages ? String(book.totalPages) : '—' },
    { label: 'Gênero', value: book.genre || '—' },
    { label: 'Status', value: statusLabel(book.status) }
  ];

  return (
    <View ref={ref} collapsable={false} style={{ width: u(1080), height: u(1350), backgroundColor: C.bg, padding: u(80), justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: C.n500, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(26), letterSpacing: u(3), textTransform: 'uppercase' }}>Minha Leitura</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10), backgroundColor: C.amber, paddingHorizontal: u(28), paddingVertical: u(14), borderRadius: u(24) }}>
          <ReadoraIcon name="sparkle" size={u(28)} color={C.bg} />
          <Text style={{ color: C.bg, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(22), textTransform: 'uppercase', letterSpacing: u(2) }}>Readora</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: u(48), alignItems: 'center' }}>
        <View style={{ width: u(340), height: u(510), borderRadius: u(20), overflow: 'hidden', backgroundColor: C.n800, borderColor: C.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
          {book.coverUrl ? <Image source={{ uri: book.coverUrl }} style={{ width: u(340), height: u(510) }} resizeMode="cover" /> : <ReadoraIcon name="library" size={u(90)} color={C.n700} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={4} style={{ color: C.amber50, fontFamily: appFonts.display, fontStyle: 'italic', fontWeight: '900', fontSize: u(64), lineHeight: u(70) }}>{book.title}</Text>
          <Text numberOfLines={2} style={{ color: C.n400, fontFamily: appFonts.display, fontSize: u(34), marginTop: u(16) }}>{book.author}</Text>
          <View style={{ marginTop: u(34) }}><Stars rating={rating} u={u} /></View>
          {rating > 0 ? <Text style={{ color: C.n50, fontFamily: appFonts.mono, fontWeight: '900', fontSize: u(40), marginTop: u(18) }}>{rating.toFixed(1)}<Text style={{ color: C.n500, fontSize: u(28) }}> / 5</Text></Text> : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: u(20) }}>
        {stats.map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: u(28), padding: u(32) }}>
            <Text style={{ color: C.n500, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(20), letterSpacing: u(1.6), textTransform: 'uppercase' }}>{s.label}</Text>
            <Text numberOfLines={1} style={{ color: C.n50, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(34), marginTop: u(8) }}>{s.value}</Text>
          </View>
        ))}
      </View>

      {moods.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: u(14) }}>
          {moods.map((m) => (
            <View key={m} style={{ backgroundColor: C.amberSoft, borderRadius: u(999), paddingHorizontal: u(26), paddingVertical: u(12) }}>
              <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(24) }}>{m}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {book.favoriteQuote ? (
        <Text numberOfLines={3} style={{ color: C.n400, fontFamily: appFonts.display, fontStyle: 'italic', fontSize: u(34), lineHeight: u(46) }}>&ldquo;{book.favoriteQuote}&rdquo;</Text>
      ) : <View />}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopColor: C.border, borderTopWidth: 1, paddingTop: u(34) }}>
        <Text style={{ color: C.n700, fontFamily: appFonts.mono, fontSize: u(22) }}>Gerado no Readora</Text>
        <Text style={{ color: C.amber, fontFamily: appFonts.body, fontWeight: '900', fontSize: u(28), letterSpacing: u(6), textTransform: 'uppercase' }}>Readora</Text>
      </View>
    </View>
  );
});

const PREVIEW = 0.32;

export function BookShareCard({ book, onClose }: { book: Book; onClose: () => void }) {
  const shotRef = useRef<View>(null);
  const [message, setMessage] = useState('');

  async function capture(): Promise<string | null> {
    if (!shotRef.current) return null;
    if (book.coverUrl) await Image.prefetch(book.coverUrl).catch(() => false);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return captureRef(shotRef, { format: 'png', quality: 1, result: 'tmpfile' });
  }

  async function share() {
    if (Platform.OS === 'web') { setMessage('Compartilhamento disponível no app.'); return; }
    try {
      const uri = await capture();
      if (uri && (await Sharing.isAvailableAsync())) { haptic('success'); await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: book.title }); }
      else setMessage('Compartilhamento não disponível.');
    } catch { haptic('error'); setMessage('Não foi possível gerar a imagem.'); }
  }

  async function save() {
    if (Platform.OS === 'web') return;
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) { setMessage('Permita o acesso à galeria.'); return; }
      const uri = await capture();
      if (uri) { await MediaLibrary.saveToLibraryAsync(uri); haptic('success'); setMessage('Card salvo na galeria.'); }
    } catch { haptic('error'); setMessage('Não foi possível salvar.'); }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Card do livro</Text>
          <Pressable onPress={onClose} hitSlop={14}><ReadoraIcon name="close" size={26} color={appColors.text} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.preview}>
            <View style={{ width: 1080 * PREVIEW, height: 1350 * PREVIEW }}>
              <View style={{ transform: [{ scale: PREVIEW }], position: 'absolute', top: 0, left: 0 }}>
                <BookCardArt book={book} scale={1} />
              </View>
            </View>
          </View>
          {message ? <Text style={styles.msg}>{message}</Text> : null}
          <Pressable style={styles.shareBtn} onPress={share}><ReadoraIcon name="share" size={18} color={appColors.background} /><Text style={styles.shareText}>Compartilhar</Text></Pressable>
          {Platform.OS !== 'web' ? <Pressable style={styles.saveBtn} onPress={save}><ReadoraIcon name="download" size={18} color={appColors.gold} /><Text style={styles.saveText}>Salvar na galeria</Text></Pressable> : null}
        </ScrollView>

        {/* off-screen full-resolution capture source */}
        <View style={styles.offscreen} pointerEvents="none"><BookCardArt ref={shotRef} book={book} scale={1} /></View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: appColors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 56, paddingBottom: 16, borderBottomColor: appColors.border, borderBottomWidth: 1 },
  topTitle: { color: appColors.text, fontFamily: appFonts.display, fontWeight: '900', fontSize: 22 },
  scroll: { padding: 22, alignItems: 'center', gap: 18 },
  preview: { borderRadius: 16, overflow: 'hidden', borderColor: appColors.border, borderWidth: 1 },
  msg: { color: appColors.gold, fontWeight: '900' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 15, paddingHorizontal: 28, alignSelf: 'stretch' },
  shareText: { color: appColors.background, fontWeight: '900', fontSize: 15 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingVertical: 13, alignSelf: 'stretch' },
  saveText: { color: appColors.gold, fontWeight: '900', fontSize: 14 },
  offscreen: { position: 'absolute', left: -20000, top: 0 }
});

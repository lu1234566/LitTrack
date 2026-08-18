import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BookCover } from '@/components/BookCover';
import { useBooks } from '@/contexts/BookContext';
import { useShelves } from '@/contexts/ShelfContext';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { appColors, appFonts } from '@/theme/tokens';

/** Quantas capas cabem na pilha antes de virar "+N". */
const STACK_LIMIT = 8;

export default function ShelvesScreen() {
  const { books } = useBooks();
  const { shelves, addShelf, deleteShelf } = useShelves();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  // O formulário nasce fechado: criar estante é raro, e antes ele ocupava o
  // topo inteiro da página empurrando as estantes — que são o conteúdo real.
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function handleAdd() {
    if (!name.trim()) return;
    await addShelf({ name: name.trim(), description: description.trim(), color: 'gold', bookIds: [] });
    setName('');
    setDescription('');
    setCreating(false);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>MINHAS ESTANTES</Text>
        <Text style={styles.title}>Estantes</Text>
        <Text style={styles.subtitle}>Colecoes manuais para agrupar leituras do seu jeito.</Text>
      </View>

      {creating ? (
        <Card>
          <Text style={styles.cardKicker}>NOVA ESTANTE</Text>
          <TextInput style={styles.input} placeholder="Nome da estante" placeholderTextColor={appColors.textDim} value={name} onChangeText={setName} autoFocus />
          <TextInput style={styles.input} placeholder="Descricao (opcional)" placeholderTextColor={appColors.textDim} value={description} onChangeText={setDescription} />
          <View style={styles.formActions}>
            <Pressable style={[styles.primaryButton, !name.trim() && styles.disabled]} onPress={handleAdd} disabled={!name.trim()}>
              <ReadoraIcon name="shelves" size={16} color={appColors.background} />
              <Text style={styles.primaryText}>Criar estante</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => setCreating(false)}>
              <Text style={styles.ghostText}>Cancelar</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <Pressable style={styles.newButton} onPress={() => setCreating(true)}>
          <ReadoraIcon name="shelves" size={17} color={appColors.gold} />
          <Text style={styles.newText}>Nova estante</Text>
        </Pressable>
      )}

      {shelves.length === 0 && !creating ? (
        <View style={styles.empty}>
          <ReadoraIcon name="shelves" size={48} color={appColors.gold} />
          <Text style={styles.emptyTitle}>Nenhuma estante ainda</Text>
          <Text style={styles.emptyText}>Agrupe leituras por autor, humor, ano ou o criterio que fizer sentido para voce.</Text>
        </View>
      ) : null}

      {shelves.map((shelf) => {
        const shelfBooks = books.filter((book) => shelf.bookIds.includes(book.id));
        const pages = shelfBooks.reduce((sum, book) => sum + (book.totalPages || 0), 0);
        const stack = shelfBooks.slice(0, STACK_LIMIT);
        const rest = shelfBooks.length - stack.length;
        return (
          <Card key={shelf.id}>
            <View style={styles.shelfHead}>
              <View style={styles.shelfHeadText}>
                <Text style={styles.shelfName} numberOfLines={2}>{shelf.name}</Text>
                {shelf.description ? <Text style={styles.shelfDescription} numberOfLines={2}>{shelf.description}</Text> : null}
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countValue}>{shelfBooks.length}</Text>
                <Text style={styles.countLabel}>{shelfBooks.length === 1 ? 'livro' : 'livros'}</Text>
              </View>
            </View>

            {/* Pilha de capas no lugar do antigo paredão de títulos separados por
                ponto — com 19 livros aquilo virava um bloco de texto ilegível. */}
            {stack.length ? (
              <View style={styles.stack}>
                {stack.map((book, index) => (
                  <View key={book.id} style={[styles.stackItem, index > 0 && styles.stackOverlap]}>
                    <BookCover book={book} height={66} radius={8} />
                  </View>
                ))}
                {rest > 0 ? (
                  <View style={[styles.stackItem, styles.stackOverlap, styles.restBadge]}>
                    <Text style={styles.restText}>+{rest}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.emptyShelf}>Estante vazia — abra para escolher os livros.</Text>
            )}

            {pages > 0 ? <Text style={styles.meta}>{pages.toLocaleString('pt-BR')} paginas no total</Text> : null}

            <View style={[styles.actions, mobile && styles.actionsStacked]}>
              <Link href={{ pathname: '/shelf/[id]', params: { id: shelf.id } }} asChild>
                <Pressable style={StyleSheet.flatten([styles.openButton, mobile && styles.fullWidth])}>
                  <Text style={styles.openText}>Abrir estante</Text>
                  <ReadoraIcon name="forward" size={14} color={appColors.background} />
                </Pressable>
              </Link>
              <Pressable style={StyleSheet.flatten([styles.removeButton, mobile && styles.fullWidth])} onPress={() => deleteShelf(shelf.id)}>
                <ReadoraIcon name="trash" size={15} color={appColors.red} />
                {mobile ? <Text style={styles.removeText}>Remover</Text> : null}
              </Pressable>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  kicker: { color: appColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 4 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 44, lineHeight: 50, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22, maxWidth: 620 },

  newButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'flex-start', borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  newText: { color: appColors.gold, fontWeight: '900' },

  cardKicker: { color: appColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  input: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 15 },
  formActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 13 },
  primaryText: { color: appColors.background, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  ghostButton: { paddingHorizontal: 14, paddingVertical: 13 },
  ghostText: { color: appColors.textMuted, fontWeight: '800' },

  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: { color: appColors.text, fontFamily: appFonts.display, fontSize: 26, fontWeight: '900' },
  emptyText: { color: appColors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 420 },

  shelfHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  shelfHeadText: { flex: 1, gap: 4 },
  shelfName: { color: appColors.text, fontFamily: appFonts.display, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  shelfDescription: { color: appColors.textMuted, fontSize: 13, lineHeight: 19 },
  countPill: { alignItems: 'center', backgroundColor: appColors.surfaceSoft, borderColor: appColors.borderSoft, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, minWidth: 62 },
  countValue: { color: appColors.gold, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  countLabel: { color: appColors.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  stack: { flexDirection: 'row', alignItems: 'center' },
  // A borda escura separa uma capa da outra na sobreposição.
  stackItem: { width: 44, borderRadius: 8, borderWidth: 2, borderColor: appColors.surface, overflow: 'hidden' },
  stackOverlap: { marginLeft: -12 },
  restBadge: { height: 70, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.surfaceMuted },
  restText: { color: appColors.textMuted, fontSize: 13, fontWeight: '900' },
  emptyShelf: { color: appColors.textDim, fontSize: 13, fontStyle: 'italic' },
  meta: { color: appColors.textDim, fontSize: 12, fontWeight: '800' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionsStacked: { flexDirection: 'column', alignItems: 'stretch' },
  fullWidth: { width: '100%' },
  openButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  openText: { color: appColors.background, fontWeight: '900' },
  removeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
  removeText: { color: appColors.red, fontWeight: '900' }
});

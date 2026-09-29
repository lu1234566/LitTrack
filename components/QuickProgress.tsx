import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/TranslatedText';
import { Card } from '@/components/Card';
import { FinishBookSheet } from '@/components/FinishBookSheet';
import { BookCover } from '@/components/BookCover';
import { useBooks } from '@/contexts/BookContext';
import { haptic } from '@/services/feedback';
import { applyProgress, currentValue, formatDuration, formatOf, progressFraction, progressLine, progressPercentOf, quickSteps } from '@/services/bookFormat';
import { t } from '@/services/i18n';
import { appColors } from '@/theme/tokens';
import type { Book } from '@/types/book';

const MAX_LIVROS = 3;

type Ultimo = {
  bookId: string;
  title: string;
  added: number;
  format: ReturnType<typeof formatOf>;
  finished: boolean;
  antes: Pick<Book, 'currentPage' | 'status' | 'finishedAt' | 'progressPercent' | 'listenedMinutes'>;
};

/**
 * "Lendo agora" do painel: soma páginas com um toque, sem abrir o livro.
 * Registrar a leitura do dia é a ação mais repetida do app.
 */
export function QuickProgress() {
  const { books, updateProgress, updateBook } = useBooks();
  const [ultimo, setUltimo] = useState<Ultimo | null>(null);
  // Livro recém-concluído sem nota: abre a tela para avaliar na hora.
  const [concluido, setConcluido] = useState<Book | null>(null);

  // A ordem fica fixa enquanto a tela está aberta: cada toque muda o
  // `updatedAt` e, ordenando por ele, o livro pularia de lugar sob o dedo.
  const ordem = useRef<string[]>([]);
  const lendo = useMemo(() => {
    const atuais = books.filter((b) => b.status === 'reading');
    const ids = new Set(atuais.map((b) => b.id));
    const novos = atuais
      .filter((b) => !ordem.current.includes(b.id))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map((b) => b.id);
    ordem.current = [...novos, ...ordem.current.filter((id) => ids.has(id))];
    return ordem.current.slice(0, MAX_LIVROS).map((id) => atuais.find((b) => b.id === id)!);
  }, [books]);

  useEffect(() => {
    if (!ultimo) return;
    const timer = setTimeout(() => setUltimo(null), 7000);
    return () => clearTimeout(timer);
  }, [ultimo]);

  async function somar(book: Book, passo: number) {
    const antes = { currentPage: book.currentPage, status: book.status, finishedAt: book.finishedAt, progressPercent: book.progressPercent, listenedMinutes: book.listenedMinutes };
    const atual = currentValue(book);
    // Simula antes de gravar: diz se chegou ao fim e quanto de fato somou
    // (perto do fim, +25 pode virar +7).
    const depois = applyProgress(book, atual + passo);
    const somado = currentValue(depois) - atual;
    if (somado <= 0 && depois.status === book.status) return;
    const terminou = depois.status === 'finished' && book.status !== 'finished';
    haptic(terminou ? 'success' : 'light');
    await updateProgress(book.id, atual + passo);
    if (terminou && !book.rating) setConcluido(depois);
    setUltimo((anterior) => ({
      bookId: book.id,
      title: book.title,
      format: formatOf(book),
      // Toques seguidos no mesmo livro somam, e o "desfazer" volta ao início deles.
      added: (anterior?.bookId === book.id ? anterior.added : 0) + somado,
      finished: terminou,
      antes: anterior?.bookId === book.id ? anterior.antes : antes
    }));
  }

  async function desfazer() {
    if (!ultimo) return;
    haptic('light');
    await updateBook(ultimo.bookId, ultimo.antes);
    setUltimo(null);
  }

  if (!lendo.length && !ultimo && !concluido) return null;

  return (
    <Card>
      {concluido ? <FinishBookSheet book={concluido} onClose={() => setConcluido(null)} /> : null}
      {lendo.map((book, i) => {
        const temTotal = progressFraction(book) !== null;
        const pct = progressPercentOf(book);
        return (
          <View key={book.id} style={[styles.row, i > 0 && styles.divider]}>
            <Pressable style={styles.cover} onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}>
              <BookCover book={book} height={68} radius={6} />
            </Pressable>
            <View style={styles.info}>
              <Pressable onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}>
                <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
                <Text style={styles.pages} numberOfLines={1}>
                  {progressLine(book)}
                </Text>
              </Pressable>
              {temTotal ? <View style={styles.track}><View style={[styles.fill, { width: (pct + '%') as `${number}%` }]} /></View> : null}
              <View style={styles.buttons}>
                {quickSteps(formatOf(book)).map((passo) => (
                  <Pressable
                    key={passo.value}
                    style={({ pressed }) => [styles.step, pressed && styles.stepPressed]}
                    onPress={() => somar(book, passo.value)}
                    accessibilityLabel={t('Somar {n}', { n: passo.label.slice(1) })}
                  >
                    <Text style={styles.stepText}>{passo.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        );
      })}

      {ultimo ? (
        <View style={[styles.toast, lendo.length > 0 && styles.divider]}>
          <Text style={styles.toastText} numberOfLines={2}>
            {ultimo.finished
              ? t('Você terminou {title}! 🎉', { title: ultimo.title })
              : ultimo.format === 'ebook'
                ? t('+{n}% em {title}', { n: ultimo.added, title: ultimo.title })
                : ultimo.format === 'audiobook'
                  ? t('+{n} ouvidos em {title}', { n: formatDuration(ultimo.added), title: ultimo.title })
                  : t('+{n} páginas em {title}', { n: ultimo.added, title: ultimo.title })}
          </Text>
          <Pressable onPress={desfazer} hitSlop={8}><Text style={styles.undo}>Desfazer</Text></Pressable>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  divider: { borderTopWidth: 1, borderTopColor: appColors.border, marginTop: 14, paddingTop: 14 },
  cover: { width: 46 },
  info: { flex: 1, minWidth: 0 },
  title: { color: appColors.text, fontWeight: '800', fontSize: 15 },
  pages: { color: appColors.textDim, fontSize: 12, marginTop: 3 },
  track: { height: 5, borderRadius: 999, backgroundColor: appColors.border, overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%', backgroundColor: appColors.gold },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  step: { borderWidth: 1, borderColor: appColors.goldDeep, backgroundColor: appColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  stepPressed: { backgroundColor: appColors.goldDeep },
  stepText: { color: appColors.gold, fontWeight: '800', fontSize: 13 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toastText: { flex: 1, color: appColors.textMuted, fontSize: 13 },
  undo: { color: appColors.gold, fontWeight: '800', fontSize: 13 }
});

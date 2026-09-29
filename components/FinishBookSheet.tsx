import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/TranslatedText';
import { BookCover } from '@/components/BookCover';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { useBooks } from '@/contexts/BookContext';
import { haptic } from '@/services/feedback';
import { t } from '@/services/i18n';
import { appColors, appFonts } from '@/theme/tokens';
import type { Book } from '@/types/book';

/**
 * Aparece quando um livro acaba de ser concluído: é o momento em que a pessoa
 * mais quer registrar o que achou. Nota + uma frase, os dois opcionais.
 * (Notas também alimentam o Wrapped: top 5, livro do ano, "nem tudo foi amor".)
 */
export function FinishBookSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const { updateBook } = useBooks();
  const [rating, setRating] = useState(book.rating || 0);
  const [frase, setFrase] = useState('');

  // Toque numa estrela = nota cheia; tocar de novo na mesma = meia estrela.
  function escolher(i: number) {
    haptic('light');
    setRating((atual) => (atual === i ? i - 0.5 : i));
  }

  async function salvar() {
    const texto = frase.trim();
    const patch: Partial<Book> = {};
    if (rating > 0) patch.rating = rating;
    // Não apaga uma resenha que já existia: a frase entra antes dela.
    if (texto) patch.review = book.review?.trim() ? texto + '\n\n' + book.review.trim() : texto;
    if (Object.keys(patch).length) {
      await updateBook(book.id, patch);
      haptic('success');
    }
    onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('Fechar')} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.top}>
            <View style={styles.cover}><BookCover book={book} height={96} radius={8} /></View>
            <View style={styles.topText}>
              <Text style={styles.kicker}>LEITURA CONCLUÍDA 🎉</Text>
              <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
              {book.author ? <Text style={styles.author} numberOfLines={1}>{book.author}</Text> : null}
            </View>
          </View>

          <Text style={styles.question}>Que nota você dá?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((i) => {
              const nome = rating >= i ? 'star' : rating >= i - 0.5 ? 'starHalf' : 'starOutline';
              return (
                <Pressable key={i} onPress={() => escolher(i)} hitSlop={6} accessibilityLabel={t('{n} estrelas', { n: i })}>
                  <ReadoraIcon name={nome} size={38} color={rating >= i - 0.5 ? appColors.gold : appColors.textDim} />
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>{rating > 0 ? t('{n} de 5 · toque de novo para meia estrela', { n: String(rating).replace('.', ',') }) : t('Toque de novo na mesma estrela para meia estrela')}</Text>

          <TextInput
            style={styles.input}
            placeholder="Uma frase sobre o livro (opcional)"
            placeholderTextColor={appColors.textDim}
            value={frase}
            onChangeText={setFrase}
            multiline
            maxLength={400}
          />

          <View style={styles.actions}>
            <Pressable style={styles.later} onPress={onClose}><Text style={styles.laterText}>Agora não</Text></Pressable>
            <Pressable style={[styles.save, rating === 0 && !frase.trim() && styles.saveOff]} onPress={salvar}>
              <ReadoraIcon name="check" size={16} color={appColors.background} />
              <Text style={styles.saveText}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: appColors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderColor: appColors.border, borderWidth: 1, padding: 22, paddingBottom: 30, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: appColors.border, marginBottom: 4 },
  top: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  cover: { width: 64 },
  topText: { flex: 1, minWidth: 0 },
  kicker: { color: appColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontSize: 22, fontWeight: '900', marginTop: 4 },
  author: { color: appColors.textMuted, fontSize: 13, marginTop: 2 },
  question: { color: appColors.text, fontWeight: '800', fontSize: 15, marginTop: 6 },
  stars: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  hint: { color: appColors.textDim, fontSize: 12, textAlign: 'center' },
  input: { backgroundColor: appColors.background, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, padding: 14, color: appColors.text, fontSize: 15, minHeight: 70, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  later: { flex: 1, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  laterText: { color: appColors.textMuted, fontWeight: '800' },
  save: { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: appColors.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  saveOff: { opacity: 0.5 },
  saveText: { color: appColors.background, fontWeight: '900' }
});

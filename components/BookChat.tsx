import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Book } from '@/types/book';
import { askAboutBook, ChatTurn } from '@/services/claudeClient';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { haptic } from '@/services/feedback';
import { appColors, appFonts } from '@/theme/tokens';

// "Converse com o livro" — a grounded chat about a single book via the Claude API.

export function BookChat({ book, onClose }: { book: Book; onClose: () => void }) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const suggestions = ['Resuma sem spoilers até onde parei', 'Quais são os temas centrais?', 'Vale a pena continuar?'];

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput('');
    setError('');
    const history = turns;
    const next = [...turns, { role: 'user' as const, content: question }];
    setTurns(next);
    setBusy(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const answer = await askAboutBook(book, question, history);
      setTurns((prev) => [...prev, { role: 'assistant', content: answer }]);
      haptic('success');
    } catch (e) {
      haptic('error');
      setError(e instanceof Error ? e.message : 'Não foi possível responder agora.');
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>Converse com o livro</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{book.title}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={14}><ReadoraIcon name="close" size={26} color={appColors.text} /></Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
          {turns.length === 0 ? (
            <View style={styles.intro}>
              <ReadoraIcon name="quoteOfDay" size={40} color={appColors.gold} />
              <Text style={styles.introText}>Pergunte sobre temas, personagens ou peça um resumo sem spoilers. As respostas usam o que você cadastrou do livro.</Text>
              <View style={styles.suggestions}>
                {suggestions.map((s) => (
                  <Pressable key={s} style={styles.suggestion} onPress={() => send(s)}><Text style={styles.suggestionText}>{s}</Text></Pressable>
                ))}
              </View>
            </View>
          ) : null}
          {turns.map((turn, i) => (
            <View key={i} style={[styles.bubble, turn.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              <Text style={turn.role === 'user' ? styles.bubbleUserText : styles.bubbleAIText}>{turn.content}</Text>
            </View>
          ))}
          {busy ? <View style={[styles.bubble, styles.bubbleAI]}><ActivityIndicator color={appColors.gold} /></View> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Pergunte algo sobre o livro..." placeholderTextColor={appColors.textDim} value={input} onChangeText={setInput} multiline onSubmitEditing={() => send(input)} />
          <Pressable style={[styles.sendBtn, (busy || !input.trim()) && styles.sendBtnOff]} disabled={busy || !input.trim()} onPress={() => send(input)}>
            <ReadoraIcon name="forward" size={20} color={appColors.background} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: appColors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 56, paddingBottom: 16, borderBottomColor: appColors.border, borderBottomWidth: 1 },
  title: { color: appColors.text, fontFamily: appFonts.display, fontWeight: '900', fontSize: 22 },
  subtitle: { color: appColors.gold, fontWeight: '800', fontSize: 13, marginTop: 2 },
  scroll: { padding: 18, gap: 12, paddingBottom: 24 },
  intro: { alignItems: 'center', gap: 14, paddingVertical: 36 },
  introText: { color: appColors.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 22, maxWidth: 420 },
  suggestions: { gap: 10, alignSelf: 'stretch', marginTop: 6 },
  suggestion: { borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: appColors.surface },
  suggestionText: { color: appColors.text, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  bubble: { maxWidth: '88%', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: appColors.gold },
  bubbleAI: { alignSelf: 'flex-start', backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1 },
  bubbleUserText: { color: appColors.background, fontWeight: '700', fontSize: 15, lineHeight: 21 },
  bubbleAIText: { color: appColors.text, fontSize: 15, lineHeight: 22 },
  error: { color: appColors.red, fontWeight: '800', fontSize: 13, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderTopColor: appColors.border, borderTopWidth: 1 },
  input: { flex: 1, maxHeight: 120, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, color: appColors.text, fontSize: 16 },
  sendBtn: { width: 48, height: 48, borderRadius: 999, backgroundColor: appColors.gold, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.4 }
});

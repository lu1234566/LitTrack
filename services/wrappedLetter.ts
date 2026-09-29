import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAiConfigured, writeWrappedLetter } from '@/services/aiClient';
import { appLanguage } from '@/services/i18n';

const KEY = '@readora_wrapped_letter';
const TEMPO_MAXIMO = 20000;

/** Mesmo resumo de fatos = mesma carta: não gasta a cota da IA a cada abertura. */
function assinatura(year: number, facts: string[]) {
  const texto = appLanguage + '|' + year + '|' + facts.join('\n');
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
  return String(h);
}

/**
 * Carta do ano escrita pela IA, ou null (IA desligada, fora do ar, lenta).
 * Quem chama mantém a carta montada pelo próprio app nesse caso.
 */
export async function getAiWrappedLetter(year: number, facts: string[], readerName?: string): Promise<string | null> {
  if (!isAiConfigured) return null;
  const chave = assinatura(year, facts);
  try {
    const salvo = JSON.parse((await AsyncStorage.getItem(KEY)) || 'null') as { chave: string; texto: string } | null;
    if (salvo?.chave === chave && salvo.texto) return salvo.texto;
  } catch {
    /* sem cache: segue */
  }
  try {
    const texto = await Promise.race([
      writeWrappedLetter(facts, readerName),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('tempo')), TEMPO_MAXIMO))
    ]);
    if (!texto || texto.length < 40) return null;
    await AsyncStorage.setItem(KEY, JSON.stringify({ chave, texto })).catch(() => {});
    return texto;
  } catch {
    return null;
  }
}

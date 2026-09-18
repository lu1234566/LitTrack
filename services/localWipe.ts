import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Todas as chaves que o Readora grava no aparelho. Lista explícita em vez de
 * `AsyncStorage.clear()`: limpar tudo apagaria também o que outras bibliotecas
 * guardam — a sessão do Firebase Auth, por exemplo, que precisa sobreviver até
 * o logout acontecer de forma ordenada.
 *
 * `reading_sessions` continua aqui porque aparelhos que nunca abriram a versão
 * que removeu a feature ainda têm essa chave gravada.
 */
const READORA_KEYS = [
  '@readora_native_books',
  '@readora_native_quotes',
  '@readora_native_shelves',
  '@readora_native_preferences',
  '@readora_native_reading_sessions',
  '@readora_tombstones',
  '@readora_last_sync'
];

export async function wipeLocalReadoraData() {
  await AsyncStorage.multiRemove(READORA_KEYS);
  return READORA_KEYS.length;
}

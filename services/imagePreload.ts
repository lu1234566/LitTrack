import { Image } from 'react-native';

// O cliente de rede do React Native no Android não tem prazo (timeout 0): uma
// capa num servidor lento deixava o botão de compartilhar esperando para
// sempre, sem erro nem mensagem. Agora as capas têm um prazo; a que não chegar
// a tempo fica de fora da imagem, mas o compartilhamento segue.
export const PRAZO_CAPAS_MS = 2500;
export const PRAZO_CAPTURA_MS = 15000;

export function esperarNoMaximo(promessa: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    promessa.then(
      () => { clearTimeout(timer); resolve(); },
      () => { clearTimeout(timer); resolve(); }
    );
  });
}

export function comPrazo<T>(promessa: Promise<T>, ms: number, mensagem: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(mensagem)), ms);
    promessa.then(
      (valor) => { clearTimeout(timer); resolve(valor); },
      (erro) => { clearTimeout(timer); reject(erro); }
    );
  });
}

/** Põe as capas remotas no cache antes da captura, sem passar do prazo. */
export async function preloadCovers(urls: Array<string | null | undefined>, ms = PRAZO_CAPAS_MS): Promise<void> {
  const remotas = [...new Set(urls.filter((u): u is string => typeof u === 'string' && /^https?:/i.test(u)))];
  if (!remotas.length) return;
  await esperarNoMaximo(Promise.all(remotas.map((u) => Image.prefetch(u).catch(() => false))), ms);
}

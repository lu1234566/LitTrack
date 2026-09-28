/**
 * "A capa existe?" — pergunta que o endereço sozinho não responde.
 *
 * O Google serve uma imagem escrita "image not available" no lugar da capa
 * quando não tem nenhuma, e a Open Library serve um PNG transparente de 1x1.
 * As duas respondem 200 com uma imagem VÁLIDA, então o `onError` do <Image>
 * nunca dispara: o app desenha a caixinha branca achando que é capa.
 *
 * Tentei antes reconhecer pelo nome do arquivo e não funcionou — o endereço
 * que o catálogo devolve é o de capa normal, e o placeholder aparece só no
 * destino, depois do redirecionamento. Agora a verificação é na resposta.
 */

const SUSPEITO = /no_cover|no_image|nocover|googlebooks\/images\/|default=true/i;

/** Abaixo disto não é capa: o placeholder do Google tem 2-3 KB. */
const BYTES_MINIMOS = 3000;

// Uma capa é consultada várias vezes (a mesma edição aparece para livros
// diferentes). Sem cache seria uma requisição por miniatura desenhada.
const cache = new Map<string, Promise<boolean>>();

async function verificar(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    // `response.url` é o endereço FINAL, depois de redirecionamentos — é aqui
    // que o placeholder do Google se revela.
    if (SUSPEITO.test(response.url || '')) return false;
    const tipo = response.headers.get('content-type') || '';
    if (tipo && !tipo.startsWith('image/')) return false;
    const tamanho = Number(response.headers.get('content-length'));
    if (Number.isFinite(tamanho) && tamanho > 0 && tamanho < BYTES_MINIMOS) return false;
    return true;
  } catch {
    // Sem rede, ou bloqueio: não é motivo para esconder a capa. Deixa tentar.
    return true;
  }
}

/**
 * True quando vale a pena desenhar esta capa.
 *
 * No navegador a verificação é PULADA de propósito: `books.google.com` não
 * manda cabeçalho de CORS, então o `fetch` falha para qualquer capa e o app
 * esconderia todas. A tag <img> não tem essa restrição, então na web a capa é
 * desenhada direto e só o `onError` vale.
 */
export function coverLooksReal(url: string): Promise<boolean> {
  if (!url) return Promise.resolve(false);
  const guardado = cache.get(url);
  if (guardado) return guardado;
  const promessa = (async () => {
    if (await zoomGrandeFalso(url)) return false;
    // `document` só existe no navegador: lá o fetch esbarra no CORS do Google,
    // então só a checagem de tamanho (que usa <img>, sem CORS) vale.
    if (typeof document !== 'undefined') return true;
    return verificar(url);
  })();
  cache.set(url, promessa);
  return promessa;
}

/**
 * Mede a imagem sem baixar pelo `fetch` — o app registra aqui o
 * `Image.getSize` do React Native. Fica injetável porque este arquivo é
 * lógica pura e roda nos testes, onde o React Native não existe.
 */
export type ImageSizer = (url: string) => Promise<{ width: number; height: number }>;
let medir: ImageSizer | null = null;
export function setImageSizer(fn: ImageSizer | null) {
  medir = fn;
}

const ZOOM_GRANDE = /^https?:\/\/books\.google\.[^/]+\/books\/.*[?&]zoom=2(&|$)/i;

/**
 * O "image not available" que escapava das outras checagens.
 *
 * O app pede ao Google a capa grande (`zoom=2`). Quando o volume não tem
 * versão grande, o Google não devolve erro: devolve a imagem de aviso, com
 * status 200 e endereço normal — por isso nem nome de arquivo nem cabeçalho
 * a denunciavam. O que a denuncia é o tamanho: uma capa zoom=2 de verdade
 * tem bem mais que 200 px de largura. Pequena assim, não é a capa grande, e
 * a cadeia de fallback cai para a miniatura (zoom=1), que existe.
 */
async function zoomGrandeFalso(url: string): Promise<boolean> {
  if (!medir || !ZOOM_GRANDE.test(url)) return false;
  try {
    const { width } = await medir(url);
    return width > 0 && width <= 200;
  } catch {
    // Não carregou nem para medir: a miniatura é aposta mais segura.
    return true;
  }
}

/** Endereço que vale desenhar: troca o zoom=2 falso pela miniatura real. */
export async function resolveCoverUrl(url: string): Promise<string> {
  if (!url || !ZOOM_GRANDE.test(url)) return url;
  return (await zoomGrandeFalso(url)) ? url.replace(/([?&])zoom=2/, '$1zoom=1') : url;
}

/** Só para os testes: a memória entre casos falsearia o resultado. */
export function resetCoverProbeCache() {
  cache.clear();
  medir = null;
}

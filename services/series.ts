import { Book } from '@/types/book';

/**
 * Séries deduzidas do título — sem campo novo no livro nem migração de dados.
 *
 * Os títulos de série seguem poucos formatos, e são esses que o reconhecedor
 * aceita. Na dúvida, NÃO é série: agrupar "Harry Potter e a Pedra Filosofal"
 * com um livro qualquer por palpite seria pior do que não agrupar.
 */
export type SeriesInfo = { series: string; volume: number; subtitle: string };

const PALAVRA_VOLUME = '(?:volume|vol\\.?|v\\.|book|livro|tomo|part|parte|#)';

// "Série: Subtítulo (Volume 7)" · "Série (Livro 2)"
const ENTRE_PARENTESES = new RegExp('^(.+?)\\s*\\(\\s*' + PALAVRA_VOLUME + '\\s*(\\d{1,3})\\s*\\)\\s*$', 'i');
// "Série, Vol. 12 (Comic)" · "Série Volume 3: Subtítulo" · "Série #4"
const NO_MEIO = new RegExp('^(.+?)[,\\s]+' + PALAVRA_VOLUME + '\\s*(\\d{1,3})\\b\\s*[:\\-–—]?\\s*(.*)$', 'i');

function limpar(s: string) {
  return s.replace(/[\s,:\-–—]+$/g, '').replace(/^[\s,:\-–—]+/g, '').trim();
}

/** Série e volume a partir do título; `null` quando não dá para ter certeza. */
export function parseSeries(title: string): SeriesInfo | null {
  const t = (title || '').replace(/\s+/g, ' ').trim();
  if (!t) return null;

  const p = t.match(ENTRE_PARENTESES);
  if (p) {
    // O que vem antes do parêntese pode ser "Série: Subtítulo".
    const [serie, ...resto] = p[1].split(/:\s+/);
    const nome = limpar(serie);
    if (nome.length >= 2) return { series: nome, volume: Number(p[2]), subtitle: limpar(resto.join(': ')) };
  }

  const m = t.match(NO_MEIO);
  if (m) {
    const nome = limpar(m[1]);
    // Subtítulo sem o "(Comic)" e afins, que é edição, não título.
    const subtitle = limpar(m[3].replace(/\((comic|manga|mangá|hq|graphic novel|deluxe edition|edição de luxo)\)/i, ''));
    if (nome.length >= 2) return { series: nome, volume: Number(m[2]), subtitle };
  }
  return null;
}

/** Chave de agrupamento: ignora caixa, acento e pontuação ("TBATE" ≠, mas "the beginning" = "The Beginning"). */
export function seriesKey(name: string) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export type SeriesVolume = { book: Book; volume: number; subtitle: string };

export type SeriesGroup = {
  key: string;
  name: string;
  volumes: SeriesVolume[];
  finished: number;
  /** Maior volume conhecido — o total da série que o app consegue enxergar. */
  lastVolume: number;
  /** Volumes que faltam na biblioteca entre o 1 e o último conhecido. */
  missing: number[];
  /** O que ler agora: o volume em andamento, ou o primeiro não lido. */
  next: { kind: 'continue' | 'start' | 'missing'; volume: number; book?: Book } | null;
};

/**
 * Agrupa os livros em séries. Só vira série o que tiver 2+ volumes: um livro
 * isolado com "(Volume 3)" no título não é informação útil de agrupamento.
 */
export function groupSeries(books: Book[]): SeriesGroup[] {
  const grupos = new Map<string, { name: string; volumes: SeriesVolume[] }>();
  for (const book of books) {
    const info = parseSeries(book.title);
    if (!info) continue;
    const key = seriesKey(info.series);
    const g = grupos.get(key) || { name: info.series, volumes: [] };
    g.volumes.push({ book, volume: info.volume, subtitle: info.subtitle });
    grupos.set(key, g);
  }

  const resultado: SeriesGroup[] = [];
  for (const [key, g] of grupos) {
    if (g.volumes.length < 2) continue;
    // Mesmo volume duas vezes (edição normal e HQ): o lido vem primeiro.
    const volumes = g.volumes.sort((a, b) => a.volume - b.volume || Number(b.book.status === 'finished') - Number(a.book.status === 'finished'));
    const lastVolume = Math.max(...volumes.map((v) => v.volume));
    const tem = new Set(volumes.map((v) => v.volume));
    const missing: number[] = [];
    for (let n = 1; n < lastVolume; n++) if (!tem.has(n)) missing.push(n);
    const lidos = new Set(volumes.filter((v) => v.book.status === 'finished').map((v) => v.volume));

    let next: SeriesGroup['next'] = null;
    const emAndamento = volumes.find((v) => v.book.status === 'reading');
    if (emAndamento) next = { kind: 'continue', volume: emAndamento.volume, book: emAndamento.book };
    else {
      for (let n = 1; n <= lastVolume; n++) {
        if (lidos.has(n)) continue;
        const v = volumes.find((x) => x.volume === n && x.book.status !== 'dnf');
        next = v ? { kind: 'start', volume: n, book: v.book } : { kind: 'missing', volume: n };
        break;
      }
    }

    resultado.push({ key, name: g.name, volumes, finished: lidos.size, lastVolume, missing, next });
  }
  return resultado.sort((a, b) => b.volumes.length - a.volumes.length || a.name.localeCompare(b.name));
}

/** A série de um livro, para mostrar na tela dele. */
export function seriesOfBook(book: Book, books: Book[]): SeriesGroup | null {
  const info = parseSeries(book.title);
  if (!info) return null;
  const key = seriesKey(info.series);
  return groupSeries(books).find((g) => g.key === key) || null;
}

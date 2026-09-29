import { Book, BookFormat } from '@/types/book';
import { t } from '@/services/i18n';

/**
 * Formato do livro e o progresso na unidade de cada um:
 *  - físico: páginas (currentPage / totalPages)
 *  - e-book: porcentagem (progressPercent) — o Kindle mostra %, não página
 *  - audiolivro: minutos ouvidos (listenedMinutes / totalMinutes)
 *
 * Nos dois últimos, `currentPage` continua sendo preenchida (proporcional,
 * quando o número de páginas é conhecido) para que as estatísticas de
 * páginas lidas, metas e retrospectivas sigam funcionando sem mudança.
 */

export const BOOK_FORMATS: Array<{ value: BookFormat; label: string }> = [
  { value: 'physical', label: 'Físico' },
  { value: 'ebook', label: 'E-book' },
  { value: 'audiobook', label: 'Audiolivro' }
];

export function formatOf(book: Pick<Book, 'format'>): BookFormat {
  return book.format === 'ebook' || book.format === 'audiobook' ? book.format : 'physical';
}

/** Progresso de 0 a 1, ou null quando não dá para saber (falta o total). */
export function progressFraction(book: Book): number | null {
  const formato = formatOf(book);
  if (formato === 'ebook') {
    if (typeof book.progressPercent === 'number') return clamp01(book.progressPercent / 100);
    return book.totalPages ? clamp01((book.currentPage || 0) / book.totalPages) : null;
  }
  if (formato === 'audiobook') {
    return book.totalMinutes ? clamp01((book.listenedMinutes || 0) / book.totalMinutes) : null;
  }
  return book.totalPages ? clamp01((book.currentPage || 0) / book.totalPages) : null;
}

export function progressPercentOf(book: Book): number {
  if (book.status === 'finished') return 100;
  const f = progressFraction(book);
  return f === null ? 0 : Math.round(f * 100);
}

/** Valor atual na unidade do formato (páginas, % ou minutos). */
export function currentValue(book: Book): number {
  const formato = formatOf(book);
  if (formato === 'ebook') return Math.round((progressFraction(book) ?? 0) * 100);
  if (formato === 'audiobook') return book.listenedMinutes || 0;
  return book.currentPage || 0;
}

/** Valor atual como texto para um campo editável ("150", "42", "3h20"). */
export function progressInputText(book: Book, format: BookFormat = formatOf(book)): string {
  if (format === formatOf(book)) {
    const v = currentValue(book);
    if (!v) return '';
    return format === 'audiobook' ? formatDuration(v).replace(' ', '') : String(v);
  }
  // Trocando o formato no formulário: converte pela fração já lida, quando dá.
  const f = book.status === 'finished' ? 1 : progressFraction(book);
  if (f === null || f === 0) return '';
  if (format === 'ebook') return String(Math.round(f * 100));
  if (format === 'physical') return book.totalPages ? String(Math.round(f * book.totalPages)) : '';
  return book.totalMinutes ? formatDuration(Math.round(f * book.totalMinutes)).replace(' ', '') : '';
}

/** "pág. 30 de 120", "34% lido", "2h10 de 8h". Já traduzido. */
export function progressLabel(book: Book): string {
  const formato = formatOf(book);
  if (formato === 'ebook') return t('{p}% lido', { p: currentValue(book) });
  if (formato === 'audiobook') {
    const ouvido = formatDuration(book.listenedMinutes || 0);
    return book.totalMinutes
      ? t('{a} de {b}', { a: ouvido, b: formatDuration(book.totalMinutes) })
      : t('{a} ouvidos', { a: ouvido });
  }
  const atual = book.currentPage || 0;
  if (book.totalPages) return t('pág. {a} de {b}', { a: atual, b: book.totalPages });
  return atual > 0 ? t('pág. {a}', { a: atual }) : t('Número de páginas não informado');
}

/** Linha curta para cartões e widget: rótulo + porcentagem quando faz sentido. */
export function progressLine(book: Book): string {
  const rotulo = progressLabel(book);
  if (formatOf(book) === 'ebook' || progressFraction(book) === null) return rotulo;
  return rotulo + ' · ' + progressPercentOf(book) + '%';
}

/** Botões de soma rápida: páginas, pontos percentuais ou minutos. */
export function quickSteps(format: BookFormat): Array<{ value: number; label: string }> {
  if (format === 'ebook') return [1, 5, 10].map((v) => ({ value: v, label: '+' + v + '%' }));
  if (format === 'audiobook') return [15, 30, 60].map((v) => ({ value: v, label: '+' + formatDuration(v) }));
  return [5, 10, 25].map((v) => ({ value: v, label: '+' + v }));
}

/**
 * Aplica um novo valor de progresso (na unidade do formato) e devolve o livro
 * atualizado: limita ao total, marca como lido ao chegar ao fim (sem apagar
 * um mês de leitura já escolhido) e mantém `currentPage` coerente.
 */
export function applyProgress(book: Book, value: number, now = Date.now()): Book {
  const formato = formatOf(book);
  const v = Math.max(0, Math.round(value));
  let next: Book = { ...book, updatedAt: now };
  let chegouAoFim = false;

  if (formato === 'ebook') {
    const pct = Math.min(100, v);
    next.progressPercent = pct;
    if (book.totalPages) next.currentPage = Math.round((pct / 100) * book.totalPages);
    chegouAoFim = pct >= 100;
  } else if (formato === 'audiobook') {
    const total = book.totalMinutes || 0;
    const min = total > 0 ? Math.min(total, v) : v;
    next.listenedMinutes = min;
    if (total > 0 && book.totalPages) next.currentPage = Math.round((min / total) * book.totalPages);
    chegouAoFim = total > 0 && min >= total;
  } else {
    const total = book.totalPages || 0;
    next.currentPage = total > 0 ? Math.min(total, v) : v;
    chegouAoFim = total > 0 && next.currentPage >= total;
  }

  if (chegouAoFim) {
    next = { ...next, status: 'finished', finishedAt: book.finishedAt || now };
    if (book.totalPages) next.currentPage = book.totalPages;
  }
  return next;
}

/** Quanto falta, para o lembrete "falta pouco" — ou null se ainda está longe. */
export function remainingIfClose(book: Book): { kind: 'pages' | 'percent' | 'minutes'; amount: number } | null {
  const formato = formatOf(book);
  if (formato === 'ebook') {
    const falta = 100 - currentValue(book);
    return progressFraction(book) !== null && falta > 0 && falta <= 10 ? { kind: 'percent', amount: falta } : null;
  }
  if (formato === 'audiobook') {
    const falta = (book.totalMinutes || 0) - (book.listenedMinutes || 0);
    return book.totalMinutes && falta > 0 && falta <= 60 ? { kind: 'minutes', amount: falta } : null;
  }
  const falta = (book.totalPages || 0) - (book.currentPage || 0);
  return book.totalPages && falta > 0 && falta <= 60 ? { kind: 'pages', amount: falta } : null;
}

/** 45 → "45 min", 60 → "1h", 200 → "3h20". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto ? h + 'h' + String(resto).padStart(2, '0') : h + 'h';
}

/**
 * Lê uma duração digitada: "3h20", "3:20", "3h", "45min", "1,5" (horas).
 * Número inteiro sozinho: até 24 é hora (ninguém escreve "8" querendo 8
 * minutos de audiolivro); acima disso, minutos. Retorna NaN se não entender.
 */
export function parseDuration(texto: string): number {
  const s = (texto || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return NaN;
  let m = s.match(/^(\d+)(?:h|:)(\d{1,2})?(?:m|min)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2] || 0);
  m = s.match(/^(\d+)(?:m|min|mins|minutos?)$/);
  if (m) return Number(m[1]);
  m = s.match(/^(\d+)[.,](\d+)h?$/);
  if (m) return Math.round(Number(m[1] + '.' + m[2]) * 60);
  m = s.match(/^(\d+)$/);
  if (m) {
    const n = Number(m[1]);
    return n <= 24 ? n * 60 : n;
  }
  return NaN;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

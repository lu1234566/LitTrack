/**
 * Número de páginas digitado pela pessoa ou vindo de um catálogo.
 *
 * `Number("1.087")` dá 1,087: o ponto de milhar do português vira decimal e um
 * livro de 1087 páginas passa a contar como 1 nas estatísticas. Página nunca é
 * fracionada, então separadores são só separadores.
 */
export function parsePageCount(valor: unknown): number {
  if (typeof valor === 'number') return repairedPageCount(valor);
  const texto = String(valor ?? '');
  // Primeiro número do texto, com ou sem separador de milhar ("1.087", "1 087", "320 p.").
  const m = texto.match(/\d{1,3}(?:[.,\s]\d{3})+(?!\d)|\d+/);
  return m ? parseInt(m[0].replace(/\D/g, ''), 10) : 0;
}

/**
 * Conserta o que já foi salvo com o erro acima: 1,087 volta a 1087. Fração
 * abaixo de 100 só aparece quando o separador de milhar foi lido como decimal
 * ("1.08" era "1.080"); acima disso, só arredonda.
 */
export function repairedPageCount(n: number | undefined): number {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return 0;
  if (Number.isInteger(n)) return n;
  return n < 100 ? Math.round(n * 1000) : Math.round(n);
}

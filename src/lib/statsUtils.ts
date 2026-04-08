/**
 * Utility functions for safe reading statistics calculations and formatting
 */

/**
 * Safely parses a value to a finite number.
 * Returns 0 if the value is invalid, null, undefined, or not a finite number.
 */
export const safeParseNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  
  const parsed = typeof value === 'number' ? value : Number(value);
  
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Formats a number of pages into a human-readable string.
 * Example: 1240 -> "1.240"
 */
export const formatPages = (pages: number): string => {
  const safePages = safeParseNumber(pages);
  return new Intl.NumberFormat('pt-BR').format(Math.floor(safePages));
};

/**
 * Formats pages with a suffix.
 * Example: 392 -> "392 pág."
 */
export const formatPagesShort = (pages: number): string => {
  return `${formatPages(pages)} pág.`;
};

/**
 * Formats pages per book.
 * Example: 280 -> "280 pág./livro"
 */
export const formatPagesPerBook = (pages: number): string => {
  return `${formatPages(pages)} pág./livro`;
};

/**
 * Formats pages with full suffix.
 * Example: 1240 -> "1.240 páginas"
 */
export const formatPagesLong = (pages: number): string => {
  const safePages = safeParseNumber(pages);
  const suffix = Math.floor(safePages) === 1 ? 'página' : 'páginas';
  return `${formatPages(pages)} ${suffix}`;
};

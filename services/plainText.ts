/**
 * Converte HTML em texto simples legível.
 *
 * A API do Google Books devolve a sinopse com marcação — `<p>`, `<b>`, `<i>`,
 * `<br>` e entidades como `&quot;` — e essa string ia direto para o formulário
 * e para a ficha do livro, aparecendo crua para o usuário. As demais fontes
 * (Apple Books, Mercado Editorial, Open Library) têm o mesmo hábito em graus
 * diferentes, então a limpeza vive aqui e é aplicada a todas.
 *
 * A ordem importa: as tags são removidas ANTES de decodificar as entidades.
 * O caminho inverso transformaria um `&lt;p&gt;` literal (que o autor escreveu
 * de propósito) em tag e o apagaria em seguida.
 */

/**
 * Acentuadas em forma nomeada (`&ccedil;`, `&atilde;`) aparecem em catálogos
 * brasileiros e seriam o pior caso possível: sinopse em português com sujeira
 * em cada palavra acentuada. A tabela é gerada em vez de escrita à mão para
 * cobrir maiúsculas e minúsculas sem 80 linhas de repetição.
 */
function buildAccentEntities() {
  const groups: Array<[string, string, string]> = [
    ['acute', 'aeiouy', 'áéíóúý'],
    ['grave', 'aeiou', 'àèìòù'],
    ['circ', 'aeiou', 'âêîôû'],
    ['tilde', 'ano', 'ãñõ'],
    ['uml', 'aeiouy', 'äëïöüÿ'],
    ['ring', 'a', 'å'],
    ['slash', 'o', 'ø'],
    ['cedil', 'c', 'ç']
  ];
  const table: Record<string, string> = {};
  groups.forEach(([suffix, letters, accented]) => {
    [...letters].forEach((letter, index) => {
      const char = accented[index];
      table[letter + suffix] = char;
      table[letter.toUpperCase() + suffix] = char.toUpperCase();
    });
  });
  return table;
}

const NAMED_ENTITIES: Record<string, string> = {
  ...buildAccentEntities(),
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  middot: '·',
  laquo: '«',
  raquo: '»'
};

function decodeEntities(value: string) {
  return value
    // Numéricas: &#233; e &#xE9; — cobrem qualquer acento sem lista fixa.
    .replace(/&#(\d+);/g, (_, code) => safeFromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => {
      // Exato primeiro: `&Ccedil;` e `&ccedil;` são letras diferentes, e um
      // toLowerCase() cego devolveria "ç" minúsculo para as duas.
      const exact = NAMED_ENTITIES[name];
      if (exact !== undefined) return exact;
      const insensitive = NAMED_ENTITIES[name.toLowerCase()];
      return insensitive === undefined ? match : insensitive;
    });
}

function safeFromCodePoint(code: number) {
  // Um &#999999999; malformado derrubaria a tela inteira com RangeError.
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

export function stripHtml(value: string | undefined | null): string {
  const raw = String(value ?? '');
  if (!raw) return '';

  const withoutTags = raw
    // Conteúdo de script/style não é texto para o leitor.
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|blockquote)\s*>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li\s*>/gi, '')
    .replace(/<[^>]*>/g, '');

  return decodeEntities(withoutTags)
    // Espaços/tabs repetidos viram um só, sem tocar nas quebras de linha.
    .replace(/[^\S\n]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Diz se o texto ainda carrega marcação — usado para limpar de uma vez os
 * livros que já foram salvos com HTML, sem reescrever quem já está limpo.
 */
export function looksLikeHtml(value: string | undefined | null): boolean {
  const raw = String(value ?? '');
  if (!raw) return false;
  return /<[a-z][^>]*>|<\/[a-z]+>/i.test(raw) || /&(#\d+|#x[0-9a-f]+|[a-z]+);/i.test(raw);
}

import { en, enPatterns } from '@/services/locales/en';

/**
 * Idioma do app, decidido pelo idioma do sistema.
 *
 * Sem `expo-localization` de propósito: é módulo nativo, e instalá-lo muda a
 * impressão digital do build — a tradução só chegaria com versão nova na loja.
 * O Hermes já expõe o idioma do aparelho pela API `Intl`, e no navegador há
 * `navigator.languages`. Português é o idioma de origem; qualquer outro idioma
 * do sistema recebe inglês, que é o que dá para ler no mundo todo.
 */
export type AppLanguage = 'pt' | 'en';

function localeDoSistema(): string {
  const candidatos: string[] = [];
  try {
    const nav = (globalThis as { navigator?: { languages?: readonly string[]; language?: string } }).navigator;
    if (nav?.languages?.length) candidatos.push(...nav.languages);
    if (nav?.language) candidatos.push(nav.language);
  } catch {
    /* sem navigator (app nativo) */
  }
  try {
    candidatos.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    /* Intl indisponível: fica no idioma de origem */
  }
  return candidatos.find((c) => typeof c === 'string' && c.length >= 2) || 'pt-BR';
}

export function languageFromLocale(locale: string): AppLanguage {
  return /^pt\b/i.test(locale) ? 'pt' : 'en';
}

const LOCALE = localeDoSistema();
export const appLanguage: AppLanguage = languageFromLocale(LOCALE);

/** Locale para datas e números: o do aparelho quando é inglês (en-US, en-GB...). */
export const appLocale = appLanguage === 'pt' ? 'pt-BR' : (/^en\b/i.test(LOCALE) ? LOCALE : 'en-US');

type Vars = Record<string, string | number>;

function interpolar(texto: string, vars?: Vars) {
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : '{' + k + '}'));
}

/** Tradução de um trecho já sem espaços nas pontas. `undefined` = não sabe. */
function traduzirNucleo(nucleo: string, dic: Record<string, string>, padroes: typeof enPatterns, profundidade = 0): string | undefined {
  if (!nucleo) return nucleo;
  const exato = dic[nucleo];
  if (exato !== undefined) return exato;

  const sub = (s: string) => traduzirNucleo(s, dic, padroes, profundidade + 1) ?? s;
  for (const [re, fazer] of padroes) {
    const m = nucleo.match(re);
    if (m) return fazer(m, sub);
  }
  if (profundidade > 2) return undefined;

  // Listas ("Mágico, Sombrio" ou "páginas, capa"): só traduz se TODAS as
  // partes forem conhecidas — senão é conteúdo do usuário e fica como está.
  if (nucleo.includes(', ')) {
    const partes = nucleo.split(', ');
    const traduzidas = partes.map((p) => traduzirNucleo(p, dic, padroes, profundidade + 1));
    if (traduzidas.every((p) => p !== undefined)) return traduzidas.join(', ');
  }
  // Mensagens montadas por frases ("X atualizados. Em 2 fiquei na dúvida").
  // Sem lookbehind: nem todo Hermes suporta, e o erro quebraria o texto todo.
  const frases = nucleo.replace(/([.!?])\s+(?=[A-ZÀ-Ú0-9])/g, '$1\u0000').split('\u0000');
  if (frases.length > 1) {
    const traduzidas = frases.map((f) => traduzirNucleo(f, dic, padroes, profundidade + 1));
    if (traduzidas.every((f) => f !== undefined)) return traduzidas.join(' ');
  }
  return undefined;
}

/**
 * Traduz um texto de interface. A chave é a própria frase em português, então
 * o que ainda não estiver no dicionário aparece em português em vez de sumir
 * ou virar uma chave técnica na tela.
 */
export function t(texto: string, vars?: Vars): string {
  if (typeof texto !== 'string') return texto;
  if (appLanguage === 'pt' || !/[A-Za-zÀ-ú]/.test(texto)) return interpolar(texto, vars);
  return interpolar(translateForLanguage(texto, 'en'), vars);
}

export function translateForLanguage(texto: string, idioma: AppLanguage): string {
  if (idioma === 'pt') return texto;
  const m = texto.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m) return texto;
  const nucleo = m[2].replace(/\s+/g, ' ');
  const traduzido = traduzirNucleo(nucleo, en, enPatterns);
  return traduzido === undefined ? texto : m[1] + traduzido + m[3];
}

/** Para `children` de um <Text>: traduz cada pedaço de texto, deixa o resto. */
export function translateChildren<T>(children: T): T {
  if (appLanguage === 'pt') return children;
  if (typeof children === 'string') return t(children) as unknown as T;
  if (Array.isArray(children)) return children.map((c) => (typeof c === 'string' ? t(c) : c)) as unknown as T;
  return children;
}

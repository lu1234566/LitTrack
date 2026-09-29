import { Book } from '@/types/book';
import { Quote } from '@/types/quote';
import { FeedCapsuleBook } from '@/components/FeedCapsuleArt';
import { buildWrapped, WrappedData } from '@/services/wrapped';
import { groupSeries } from '@/services/series';
import { formatDuration, formatOf } from '@/services/bookFormat';
import { appLocale, t } from '@/services/i18n';

/**
 * O que torna cada Wrapped único: em vez de 11 telas fixas iguais para todo
 * mundo, o app calcula um banco de "descobertas" possíveis, dá a cada uma uma
 * nota de quão marcante ela é PARA ESTE LEITOR e mostra só as melhores.
 * Junta com uma identidade de leitor (persona) e uma paleta tirada do gênero.
 *
 * Tudo aqui é puro (sem tela), para poder ser testado.
 */

export type WrappedImage = 'intro' | 'livros' | 'paginas' | 'autor' | 'genero' | 'atmosfera' | 'mes' | 'top5' | 'livro' | 'maior' | 'final';

export type Insight = {
  id: string;
  /** Quão marcante é para este leitor (0–100). Só as maiores entram. */
  score: number;
  image: WrappedImage;
  kicker: string;
  /** Número grande animado, com a unidade embaixo. */
  big?: { value: number; unit: string };
  /** Nome grande (autor, gênero, ano, título). */
  name?: string;
  lead: string;
  cover?: FeedCapsuleBook;
  covers?: FeedCapsuleBook[];
  quote?: { text: string; source: string };
  chart?: { monthly: number[]; highlight: number[] };
  /** Trecho para a carta do ano: "…foi o ano em que você <letter>". */
  letter?: string;
  /** Evidência curta para os "traços" da persona. */
  chip?: string;
};

export type Persona = { name: string; description: string; chips: string[]; trait: Trait };

export type Palette = { family: GenreFamily; tint: readonly [string, string] | null; accent: string };

export type WrappedStoryData = {
  data: WrappedData;
  insights: Insight[];
  persona: Persona;
  palette: Palette;
  letter: string;
  /** Autores diferentes lidos no ano. */
  authors: number;
  /** O ano ainda está em andamento ("seu ano até agora"). */
  partial: boolean;
  /** Resumo em fatos, para a IA escrever a carta sem inventar nada. */
  facts: string[];
};

/** Até quantas descobertas entram entre as telas fixas. */
const MAX_INSIGHTS = 6;

/** Ordem em que as descobertas escolhidas aparecem (conta uma história). */
const ORDEM = ['pages', 'marathon', 'fastest', 'fireGhost', 'series', 'topAuthor', 'newAuthor', 'genre', 'vibe', 'formats', 'oldest', 'newest', 'waitList', 'longest', 'controversial', 'dnf', 'quote'];

const DIA = 86400000;
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function card(book: Book): FeedCapsuleBook {
  return { id: book.id, title: book.title, author: book.author, pageCount: book.totalPages || 0, rating: book.rating || 0, coverUrl: book.coverUrl, description: book.description };
}

function mes(i: number) {
  return t(MESES[i]);
}

/**
 * Data de conclusão só quando é um dia de verdade. O seletor de mês grava o
 * dia 15 ao meio-dia e os backups antigos o dia 15 à meia-noite — isso é "o
 * mês", não o dia, e inventaria maratonas.
 */
export function realFinishDate(book: Book): number | null {
  if (!book.finishedAt) return null;
  const d = new Date(book.finishedAt);
  const soMes = d.getDate() === 15 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0 && (d.getHours() === 12 || d.getHours() === 0);
  return soMes ? null : book.finishedAt;
}

function finishedIn(books: Book[], year: number) {
  return books.filter((b) => b.status === 'finished' && new Date(b.finishedAt || b.updatedAt || b.createdAt).getFullYear() === year);
}

function publishedYear(book: Book): number | null {
  const m = (book.publishedDate || '').match(/\d{4}/);
  return m ? Number(m[0]) : null;
}

// ---------------------------------------------------------------------------
// Descobertas
// ---------------------------------------------------------------------------

function pagesInsight(d: WrappedData): Insight | null {
  if (d.totalPages <= 0) return null;
  // 0,1 mm por folha dupla ≈ 0,05 mm por página.
  const cm = Math.round(d.totalPages * 0.005);
  const altura = cm >= 100 ? (cm / 100).toFixed(1).replace('.', ',') + ' m' : cm + ' cm';
  return {
    id: 'pages', score: 40 + Math.min(20, d.totalPages / 1000), image: 'paginas',
    kicker: t('FORAM'),
    big: { value: d.totalPages, unit: t('páginas viradas') },
    lead: t('Empilhadas, elas teriam {h} de altura.', { h: altura }),
    letter: t('virou {n} páginas', { n: d.totalPages.toLocaleString(appLocale) })
  };
}

function marathonInsight(fin: Book[]): Insight | null {
  const datados = fin.map((b) => ({ b, d: realFinishDate(b) })).filter((x): x is { b: Book; d: number } => x.d !== null).sort((a, b) => a.d - b.d);
  let melhor: { ini: number; fim: number } | null = null;
  // Janela de até 14 dias com mais livros terminados (empate: a mais curta).
  for (let i = 0, j = 0; j < datados.length; j++) {
    while (datados[j].d - datados[i].d > 14 * DIA) i++;
    const n = j - i + 1;
    const span = datados[j].d - datados[i].d;
    const nMelhor = melhor ? melhor.fim - melhor.ini + 1 : 0;
    const spanMelhor = melhor ? datados[melhor.fim].d - datados[melhor.ini].d : Infinity;
    if (n > nMelhor || (n === nMelhor && span < spanMelhor)) melhor = { ini: i, fim: j };
  }
  if (!melhor) return null;
  const n = melhor.fim - melhor.ini + 1;
  if (n < 3) return null;
  const dias = Math.max(1, Math.round((datados[melhor.fim].d - datados[melhor.ini].d) / DIA) + 1);
  const livros = datados.slice(melhor.ini, melhor.fim + 1).map((x) => x.b);
  return {
    id: 'marathon', score: Math.min(95, 60 + (n - 3) * 8 + (14 - dias)), image: 'mes',
    kicker: t('MODO MARATONA'),
    big: { value: n, unit: t('livros em {d} dias', { d: dias }) },
    lead: t('Em {m}, você emendou um livro no outro.', { m: mes(new Date(datados[melhor.fim].d).getMonth()) }),
    covers: livros.slice(0, 5).map(card),
    letter: t('terminou {n} livros em {d} dias', { n, d: dias }),
    chip: t('{n} livros em {d} dias', { n, d: dias })
  };
}

function fastestInsight(fin: Book[]): Insight | null {
  const candidatos = fin
    .map((b) => {
      const fim = realFinishDate(b);
      if (!fim || !b.startedAt || !b.totalPages || b.totalPages < 150) return null;
      const dias = Math.max(1, Math.round((fim - b.startedAt) / DIA));
      return { b, dias, ritmo: b.totalPages / dias };
    })
    .filter((x): x is { b: Book; dias: number; ritmo: number } => x !== null && x.dias <= 7 && x.ritmo >= 60)
    .sort((a, b) => b.ritmo - a.ritmo);
  const top = candidatos[0];
  if (!top) return null;
  return {
    id: 'fastest', score: Math.min(90, 50 + top.ritmo / 10), image: 'maior',
    kicker: t('LEITURA RELÂMPAGO'),
    name: top.b.title,
    lead: top.dias === 1
      ? t('{p} páginas em um único dia.', { p: top.b.totalPages || 0 })
      : t('{p} páginas em {d} dias — umas {r} por dia.', { p: top.b.totalPages || 0, d: top.dias, r: Math.round(top.ritmo) }),
    cover: card(top.b),
    letter: top.dias === 1 ? t('devorou {title} em um único dia', { title: top.b.title }) : t('devorou {title} em {d} dias', { title: top.b.title, d: top.dias }),
    chip: top.dias === 1 ? t('{title} em 1 dia', { title: top.b.title }) : t('{title} em {d} dias', { title: top.b.title, d: top.dias })
  };
}

function fireGhostInsight(d: WrappedData, year: number, now: Date): Insight | null {
  if (d.bestMonthCount < 3 || d.bestMonth < 0) return null;
  const ultimoMes = year === now.getFullYear() ? now.getMonth() - 1 : 11;
  const zerados = d.monthly.map((c, i) => (c === 0 && i <= ultimoMes ? i : -1)).filter((i) => i >= 0);
  if (!zerados.length) return null;
  const fantasma = zerados.reduce((perto, i) => (Math.abs(i - d.bestMonth) < Math.abs(perto - d.bestMonth) ? i : perto), zerados[0]);
  return {
    id: 'fireGhost', score: 55 + d.bestMonthCount * 2, image: 'mes',
    kicker: t('ALTOS E BAIXOS'),
    name: mes(d.bestMonth),
    lead: t('{fantasma}: nenhum livro. {fogo}: {n}. Leitura também tem estação.', { fantasma: mes(fantasma), fogo: mes(d.bestMonth), n: d.bestMonthCount }),
    chart: { monthly: d.monthly, highlight: [d.bestMonth] },
    letter: t('fez de {m} o seu mês de fogo', { m: mes(d.bestMonth) })
  };
}

function seriesInsight(fin: Book[]): Insight | null {
  const g = groupSeries(fin).sort((a, b) => b.volumes.length - a.volumes.length)[0];
  if (!g || g.volumes.length < 2) return null;
  const n = g.volumes.length;
  return {
    id: 'series', score: Math.min(92, 55 + n * 7), image: 'top5',
    kicker: t('FIDELIDADE A UMA SAGA'),
    big: { value: n, unit: t('volumes de uma só série') },
    lead: g.name,
    covers: g.volumes.slice(0, 5).map((v) => card(v.book)),
    letter: t('acompanhou {n} volumes de {s}', { n, s: g.name }),
    chip: t('{n} volumes de série', { n })
  };
}

function topAuthorInsight(d: WrappedData): Insight | null {
  if (d.topAuthorCount < 2) return null;
  return {
    id: 'topAuthor', score: Math.min(80, 48 + d.topAuthorCount * 6), image: 'autor',
    kicker: t('SEU AUTOR DO ANO'),
    name: d.topAuthor,
    lead: d.authorLead,
    letter: t('voltou {n} vezes a {a}', { n: d.topAuthorCount, a: d.topAuthor }),
    chip: t('{n} livros de {a}', { n: d.topAuthorCount, a: d.topAuthor })
  };
}

function newAuthorInsight(books: Book[], fin: Book[], year: number): Insight | null {
  const antes = new Set(books.filter((b) => b.status === 'finished' && new Date(b.finishedAt || b.updatedAt || b.createdAt).getFullYear() < year).map((b) => (b.author || '').toLowerCase()));
  const achado = fin
    .filter((b) => b.author && !antes.has(b.author.toLowerCase()) && (b.rating || 0) >= 4.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  // Só vale como "descoberta" se a pessoa já tinha histórico antes do ano.
  if (!achado || antes.size === 0) return null;
  return {
    id: 'newAuthor', score: 62, image: 'autor',
    kicker: t('AMOR À PRIMEIRA LEITURA'),
    name: achado.author,
    lead: t('Primeiro livro dele(a) na sua estante — e já levou {r}★ com {title}.', { r: String(achado.rating), title: achado.title }),
    cover: card(achado),
    letter: t('descobriu {a}', { a: achado.author })
  };
}

function genreInsight(d: WrappedData, fin: Book[]): Insight | null {
  const n = fin.filter((b) => (b.genre || '') === d.topGenre).length;
  const pct = fin.length ? Math.round((n / fin.length) * 100) : 0;
  if (n < 3 || pct < 40) return null;
  return {
    id: 'genre', score: 50 + pct / 5, image: 'genero',
    kicker: t('SEU TERRITÓRIO'),
    name: d.topGenre,
    lead: d.genreLead,
    letter: t('morou em {g}', { g: d.topGenre }),
    chip: t('{p}% {g}', { p: pct, g: d.topGenre })
  };
}

function vibeInsight(d: WrappedData, fin: Book[]): Insight | null {
  const n = fin.filter((b) => (b.mood || '').split(',').map((m) => m.trim()).includes(d.vibe)).length;
  if (n < 2) return null;
  return { id: 'vibe', score: 46, image: 'atmosfera', kicker: t('SUA ATMOSFERA'), name: d.vibe, lead: d.vibeLead };
}

function formatsInsight(fin: Book[]): Insight | null {
  const audio = fin.filter((b) => formatOf(b) === 'audiobook');
  const minutos = audio.reduce((s, b) => s + (b.totalMinutes || b.listenedMinutes || 0), 0);
  if (minutos >= 300) {
    const horas = Math.round(minutos / 60);
    return {
      id: 'formats', score: Math.min(85, 65 + horas / 2), image: 'livros',
      kicker: t('LEITURA DE OUVIDO'),
      big: { value: horas, unit: t('horas de audiolivro') },
      lead: t('{n} audiolivro(s) — {d} de histórias contadas no seu ouvido.', { n: audio.length, d: formatDuration(minutos) }),
      covers: audio.slice(0, 5).map(card),
      letter: t('ouviu {h} horas de histórias', { h: horas }),
      chip: t('{h}h de audiolivro', { h: horas })
    };
  }
  const ebooks = fin.filter((b) => formatOf(b) === 'ebook').length;
  const pct = fin.length ? Math.round((ebooks / fin.length) * 100) : 0;
  if (ebooks >= 3 && pct >= 40) {
    return {
      id: 'formats', score: 52, image: 'livros',
      kicker: t('NA TELA'),
      big: { value: pct, unit: t('% das leituras em e-book') },
      lead: t('{n} livros lidos no digital.', { n: ebooks }),
      chip: t('{p}% em e-book', { p: pct })
    };
  }
  return null;
}

function oldestInsight(fin: Book[]): Insight | null {
  const velho = fin.map((b) => ({ b, y: publishedYear(b) })).filter((x): x is { b: Book; y: number } => x.y !== null && x.y <= 1960).sort((a, b) => a.y - b.y)[0];
  if (!velho) return null;
  return {
    id: 'oldest', score: Math.min(85, 60 + (1960 - velho.y) / 8), image: 'maior',
    kicker: t('VIAGEM NO TEMPO'),
    name: String(velho.y),
    lead: t('Você voltou até {y} com {title}, de {a}.', { y: velho.y, title: velho.b.title, a: velho.b.author }),
    cover: card(velho.b),
    letter: t('viajou até {y}', { y: velho.y }),
    chip: t('um livro de {y}', { y: velho.y })
  };
}

function newestInsight(fin: Book[], year: number): Insight | null {
  const novo = fin.find((b) => publishedYear(b) === year);
  if (!novo) return null;
  return {
    id: 'newest', score: 48, image: 'livros',
    kicker: t('RECÉM-SAÍDO DO FORNO'),
    name: novo.title,
    lead: t('Publicado em {y} — e você já leu.', { y: year }),
    cover: card(novo)
  };
}

function waitListInsight(fin: Book[]): Insight | null {
  const espera = fin
    .map((b) => { const fim = realFinishDate(b) ?? b.finishedAt ?? 0; return { b, dias: (fim - b.createdAt) / DIA }; })
    .filter((x) => x.dias >= 300)
    .sort((a, b) => b.dias - a.dias)[0];
  if (!espera) return null;
  const meses = Math.round(espera.dias / 30);
  return {
    id: 'waitList', score: 50 + Math.min(20, meses / 2), image: 'genero',
    kicker: t('A ESPERA VALEU?'),
    name: espera.b.title,
    lead: t('Ficou {m} meses na sua estante antes de você finalmente abrir.', { m: meses }),
    cover: card(espera.b),
    letter: t('finalmente tirou {title} da estante', { title: espera.b.title })
  };
}

function longestInsight(d: WrappedData): Insight | null {
  const l = d.longestBook;
  if (!l || l.pageCount < 400) return null;
  return {
    id: 'longest', score: 44 + Math.min(30, (l.pageCount - 400) / 40), image: 'maior',
    kicker: t('O MAIOR DO ANO'),
    name: l.title,
    lead: t('{p} páginas · {a}', { p: l.pageCount.toLocaleString(appLocale), a: l.author }),
    cover: l,
    letter: t('encarou as {p} páginas de {title}', { p: l.pageCount.toLocaleString(appLocale), title: l.title })
  };
}

function controversialInsight(fin: Book[]): Insight | null {
  const avaliados = fin.filter((b) => (b.rating || 0) > 0);
  if (avaliados.length < 4) return null;
  const pior = [...avaliados].sort((a, b) => (a.rating || 0) - (b.rating || 0))[0];
  const resto = avaliados.filter((b) => b.id !== pior.id);
  const media = resto.reduce((s, b) => s + (b.rating || 0), 0) / resto.length;
  if ((pior.rating || 0) > 2 || media < 3.5) return null;
  return {
    id: 'controversial', score: 68, image: 'atmosfera',
    kicker: t('NEM TUDO FOI AMOR'),
    name: pior.title,
    lead: t('Levou {r}★ — enquanto sua média no resto do ano foi {m}★.', { r: String(pior.rating), m: media.toFixed(1).replace('.', ',') }),
    cover: card(pior),
    chip: t('sincero(a) nas notas')
  };
}

function dnfInsight(books: Book[], year: number): Insight | null {
  const n = books.filter((b) => b.status === 'dnf' && new Date(b.updatedAt || b.createdAt).getFullYear() === year).length;
  if (n < 1) return null;
  return {
    id: 'dnf', score: 38, image: 'atmosfera',
    kicker: t('SEM CULPA'),
    big: { value: n, unit: n === 1 ? t('livro abandonado') : t('livros abandonados') },
    lead: t('A vida é curta demais para livros que não conversam com você.')
  };
}

function quoteInsight(quotes: Quote[], year: number): Insight | null {
  const doAno = quotes.filter((q) => new Date(q.createdAt).getFullYear() === year && q.text && q.text.length >= 15 && q.text.length <= 240);
  const q = doAno.filter((x) => x.favorite).sort((a, b) => b.createdAt - a.createdAt)[0] || doAno.sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!q) return null;
  return {
    id: 'quote', score: q.favorite ? 66 : 54, image: 'livro',
    kicker: t('A FRASE DO SEU ANO'),
    lead: '',
    // A citação às vezes já vem entre aspas; a tela coloca as suas.
    quote: { text: q.text.trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g, '').trim(), source: q.bookTitle + (q.author ? ' · ' + q.author : '') },
    letter: t('guardou frases que ficaram')
  };
}

// ---------------------------------------------------------------------------
// Persona, paleta e carta
// ---------------------------------------------------------------------------

export type GenreFamily = 'fantasia' | 'terror' | 'romance' | 'misterio' | 'scifi' | 'naoficcao' | 'classicos' | 'poesia' | 'quadrinhos' | 'outro';

/**
 * Família do leitor: o gênero mais lido que diga alguma coisa. "Ficção" ou
 * "Literatura" sozinhos não definem cor nem persona — passa para o próximo.
 */
export function readerFamily(fin: Book[]): GenreFamily {
  const contagem: Record<string, number> = {};
  fin.forEach((b) => { if (b.genre) contagem[b.genre] = (contagem[b.genre] || 0) + 1; });
  const ordem = Object.entries(contagem).sort((a, b) => b[1] - a[1]).map(([g]) => genreFamily(g));
  return ordem.find((f) => f !== 'outro') || 'outro';
}

export function genreFamily(genre: string): GenreFamily {
  const g = (genre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/fantas|magia|epic/.test(g)) return 'fantasia';
  if (/terror|horror/.test(g)) return 'terror';
  if (/romance|romant|chick|new adult/.test(g)) return 'romance';
  if (/mister|suspense|thriller|policial|crime|noir/.test(g)) return 'misterio';
  if (/cientific|sci-?fi|distop|cyber|space/.test(g)) return 'scifi';
  if (/nao.?ficcao|biograf|histori|ensaio|autoajuda|negocio|filosof|ciencia|memoria/.test(g)) return 'naoficcao';
  if (/classic/.test(g)) return 'classicos';
  if (/poes|poem/.test(g)) return 'poesia';
  if (/mang|hq|quadrinh|graphic|comic/.test(g)) return 'quadrinhos';
  return 'outro';
}

const SUFIXO: Record<GenreFamily, string> = {
  fantasia: 'da Fantasia',
  terror: 'do Terror',
  romance: 'do Romance',
  misterio: 'do Mistério',
  scifi: 'da Ficção Científica',
  naoficcao: 'da Não Ficção',
  classicos: 'dos Clássicos',
  poesia: 'da Poesia',
  quadrinhos: 'dos Quadrinhos',
  outro: 'de Mil Mundos'
};

// Filtro de cor por cima da arte: cada família de gênero tinge o Wrapped.
const TINTAS: Record<GenreFamily, { tint: readonly [string, string] | null; accent: string }> = {
  fantasia: { tint: ['rgba(76,29,149,0.55)', 'rgba(161,98,7,0.45)'], accent: '#fbbf24' },
  terror: { tint: ['rgba(90,0,0,0.6)', 'rgba(0,0,0,0.55)'], accent: '#f87171' },
  romance: { tint: ['rgba(157,23,77,0.5)', 'rgba(251,113,133,0.35)'], accent: '#fda4af' },
  misterio: { tint: ['rgba(15,60,70,0.55)', 'rgba(15,15,30,0.6)'], accent: '#5eead4' },
  scifi: { tint: ['rgba(8,90,120,0.5)', 'rgba(49,46,129,0.55)'], accent: '#67e8f9' },
  naoficcao: { tint: ['rgba(120,80,10,0.45)', 'rgba(30,60,35,0.5)'], accent: '#fcd34d' },
  classicos: { tint: ['rgba(100,65,30,0.5)', 'rgba(40,25,15,0.55)'], accent: '#e7c38a' },
  poesia: { tint: ['rgba(110,60,140,0.45)', 'rgba(240,170,200,0.3)'], accent: '#f0abfc' },
  quadrinhos: { tint: ['rgba(220,38,38,0.4)', 'rgba(250,204,21,0.3)'], accent: '#fde047' },
  // Sem família reconhecida: as cores do próprio Readora (azul-noite e ouro).
  outro: { tint: ['rgba(10,20,70,0.45)', 'rgba(140,80,10,0.35)'], accent: '#fbbf24' }
};

export type Trait = 'maratonista' | 'sagas' | 'relampago' | 'critica' | 'generosa' | 'viajante' | 'curiosa' | 'ouvinte' | 'fiel' | 'contemplativa' | 'constante';

const TRACO: Record<Trait, { nome: string; descricao: string }> = {
  maratonista: { nome: 'Mente Maratonista', descricao: 'Quando uma história pega, você não larga — e emenda a próxima.' },
  sagas: { nome: 'Alma das Sagas', descricao: 'Você não lê livros soltos: você se muda para mundos inteiros.' },
  relampago: { nome: 'Mente Relâmpago', descricao: 'Páginas somem nas suas mãos. Poucos leem tão rápido quanto você.' },
  critica: { nome: 'Mente Crítica', descricao: 'Cinco estrelas com você se conquistam. Sua nota vale ouro.' },
  generosa: { nome: 'Alma Generosa', descricao: 'Você encontra beleza em quase tudo que lê — e dá o crédito.' },
  viajante: { nome: 'Alma Viajante', descricao: 'Você atravessa décadas e séculos atrás de boas histórias.' },
  curiosa: { nome: 'Mente Curiosa', descricao: 'Nenhum gênero te prende: você quer provar de tudo.' },
  ouvinte: { nome: 'Alma Ouvinte', descricao: 'Suas histórias chegam pelos fones — no caminho, na louça, antes de dormir.' },
  fiel: { nome: 'Alma Fiel', descricao: 'Quando um autor te conquista, você volta sempre.' },
  contemplativa: { nome: 'Alma Contemplativa', descricao: 'Poucos livros, bem escolhidos, lidos sem pressa.' },
  constante: { nome: 'Mente Constante', descricao: 'Livro após livro, no seu ritmo, o ano inteiro.' }
};

function choosePersona(fin: Book[], d: WrappedData, found: Record<string, Insight | null>): Persona {
  const avaliados = fin.filter((b) => (b.rating || 0) > 0);
  const media = avaliados.length ? avaliados.reduce((s, b) => s + (b.rating || 0), 0) / avaliados.length : 0;
  const generos = new Set(fin.map((b) => (b.genre || '').trim().toLowerCase()).filter(Boolean)).size;
  const volumesSerie = found.series?.big?.value || 0;
  const horasAudio = fin.filter((b) => formatOf(b) === 'audiobook').reduce((s, b) => s + (b.totalMinutes || b.listenedMinutes || 0), 0) / 60;
  const velho = found.oldest ? Number(found.oldest.name) : 9999;

  // Cada traço disputa com a força da evidência; vence o mais forte.
  const forca: Array<[Trait, number]> = [
    ['maratonista', found.marathon ? found.marathon.score : d.totalBooks >= 30 ? 70 : 0],
    ['sagas', volumesSerie >= 3 ? 60 + volumesSerie * 5 : 0],
    ['relampago', found.fastest ? found.fastest.score - 5 : 0],
    ['critica', avaliados.length >= 5 && media <= 3.2 ? 72 : 0],
    ['generosa', avaliados.length >= 5 && media >= 4.5 ? 62 : 0],
    ['viajante', velho <= 1950 ? 64 : 0],
    ['curiosa', generos >= 5 ? 50 + generos * 2 : 0],
    ['ouvinte', horasAudio >= 10 ? 60 + horasAudio / 2 : 0],
    ['fiel', d.topAuthorCount >= 3 ? 55 + d.topAuthorCount * 3 : 0],
    ['contemplativa', d.totalBooks > 0 && d.totalBooks <= 5 ? 40 : 0],
    ['constante', 30]
  ];
  const [trait] = forca.sort((a, b) => b[1] - a[1])[0];
  const familia = readerFamily(fin);
  const chips = [
    ...Object.values(found).filter((i): i is Insight => Boolean(i?.chip)).sort((a, b) => b.score - a.score).map((i) => i.chip as string),
    avaliados.length ? t('média {m}★', { m: media.toFixed(1).replace('.', ',') }) : ''
  ].filter(Boolean).slice(0, 3);
  return { trait, name: t(TRACO[trait].nome) + ' ' + t(SUFIXO[familia]), description: t(TRACO[trait].descricao), chips };
}

function composeLetter(d: WrappedData, persona: Persona, chosen: Insight[], partial: boolean, readerName?: string): string {
  if (d.totalBooks === 0) {
    return t('Este foi um ano de pausa — e tudo bem. A próxima história está esperando por você.');
  }
  // As mais marcantes primeiro (não a ordem das telas).
  const trechos = [...chosen].sort((a, b) => b.score - a.score).map((i) => i.letter).filter(Boolean) as string[];
  const abertura = readerName ? readerName + ', ' : '';
  const p1 = abertura + t('em {y} você leu {n} livro(s).', { y: d.year, n: d.totalBooks });
  const tres = trechos.slice(0, 3);
  const lista = tres.length <= 1 ? (tres[0] || '') : t('{a} e {b}', { a: tres.slice(0, -1).join(', '), b: tres[tres.length - 1] });
  const p2 = lista ? t('Foi o ano em que você {lista}.', { lista }) : '';
  const p3 = t('Não é à toa que você é {p} — {d}', { p: persona.name, d: persona.description.charAt(0).toLowerCase() + persona.description.slice(1) });
  const p4 = partial ? t('E o ano ainda nem acabou.') : t('Que o próximo ano traga histórias à sua altura.');
  return [p1, p2, p3, p4].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------

export function buildWrappedStory(books: Book[], quotes: Quote[], year: number, now = new Date(), readerName?: string): WrappedStoryData {
  const data = buildWrapped(books, year);
  const fin = finishedIn(books, year);

  const found: Record<string, Insight | null> = {
    pages: pagesInsight(data),
    marathon: marathonInsight(fin),
    fastest: fastestInsight(fin),
    fireGhost: fireGhostInsight(data, year, now),
    series: seriesInsight(fin),
    topAuthor: topAuthorInsight(data),
    newAuthor: newAuthorInsight(books, fin, year),
    genre: genreInsight(data, fin),
    vibe: vibeInsight(data, fin),
    formats: formatsInsight(fin),
    oldest: oldestInsight(fin),
    newest: newestInsight(fin, year),
    waitList: waitListInsight(fin),
    longest: longestInsight(data),
    controversial: controversialInsight(fin),
    dnf: dnfInsight(books, year),
    quote: quoteInsight(quotes, year)
  };

  const insights = Object.values(found)
    .filter((i): i is Insight => i !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_INSIGHTS)
    .sort((a, b) => ORDEM.indexOf(a.id) - ORDEM.indexOf(b.id));

  const persona = choosePersona(fin, data, found);
  const familia = readerFamily(fin);
  const palette: Palette = { family: familia, ...TINTAS[familia] };
  const partial = year === now.getFullYear() && now.getMonth() < 11;
  const letter = composeLetter(data, persona, insights, partial, readerName);

  const facts = [
    'Ano: ' + year + (partial ? ' (ainda em andamento)' : ''),
    'Livros concluídos: ' + data.totalBooks,
    'Páginas: ' + data.totalPages,
    'Persona do leitor: ' + persona.name + ' — ' + persona.description,
    data.bestBook ? 'Livro favorito: ' + data.bestBook.title + ' (' + data.bestBook.author + '), nota ' + data.bestBook.rating + '/5' : '',
    ...insights.map((i) => [i.kicker, i.name, i.big ? i.big.value + ' ' + i.big.unit : '', i.lead, i.quote ? '"' + i.quote.text + '" — ' + i.quote.source : ''].filter(Boolean).join(': ')),
    'Top 5: ' + data.top5.map((b) => b.title + ' (' + b.rating + '★)').join('; ')
  ].filter(Boolean);

  const authors = new Set(fin.map((b) => (b.author || '').trim().toLowerCase()).filter(Boolean)).size;
  return { data, insights, persona, palette, letter, authors, partial, facts };
}

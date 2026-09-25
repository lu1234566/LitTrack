import { Book } from '@/types/book';
import { ExternalBook } from '@/types/externalBook';
import { candidateScore, looksLikeSameBook, lookupByTitleAuthorDetailed, lookupExternalBooks } from '@/services/externalBookSearch';
import { stripHtml } from '@/services/plainText';

const UNSET_GENRES = ['', 'a definir', 'diverso', 'indefinido'];

/** True when the book is missing data that hurts stats/capsule (pages, cover, genre). */
/** Nomes (em PT) dos dados que faltam neste livro — vazio quando está completo. */
export function missingFields(book: Book): string[] {
  const missing: string[] = [];
  if (!book.totalPages || book.totalPages <= 0) missing.push('páginas');
  if (!book.coverUrl) missing.push('capa');
  if (!book.genre || UNSET_GENRES.includes(book.genre.trim().toLowerCase())) missing.push('gênero');
  if (!book.description || !book.description.trim()) missing.push('sinopse');
  return missing;
}

export function bookNeedsEnrichment(book: Book): boolean {
  return missingFields(book).length > 0;
}

/** Rótulo em PT de cada campo que um patch preencheu. */
function filledLabels(patch: Partial<Book>): string[] {
  const labels: string[] = [];
  if (patch.totalPages) labels.push('páginas');
  if (patch.coverUrl) labels.push('capa');
  if (patch.genre) labels.push('gênero');
  if (patch.description) labels.push('sinopse');
  if (patch.publisher) labels.push('editora');
  if (patch.publishedDate) labels.push('ano');
  if (patch.isbn) labels.push('ISBN');
  return labels;
}

/** O candidato traz algo que este livro ainda não tem? */
function isUsefulFor(candidate: ExternalBook, book: Book): boolean {
  const needsPages = !book.totalPages || book.totalPages <= 0;
  const needsCover = !book.coverUrl;
  const needsGenre = !book.genre || UNSET_GENRES.includes(book.genre.trim().toLowerCase());
  return (
    (needsPages && (candidate.totalPages || 0) > 0) ||
    (needsCover && Boolean(candidate.coverUrl)) ||
    (needsGenre && Boolean(candidate.genre) && !UNSET_GENRES.includes(candidate.genre.trim().toLowerCase())) ||
    (!book.description && Boolean(candidate.description))
  );
}

/** Campos do resultado externo que o livro ainda não tem — nunca sobrescreve. */
function patchFrom(match: ExternalBook, book: Book): Partial<Book> {
  const patch: Partial<Book> = {};
  if ((!book.totalPages || book.totalPages <= 0) && (match.totalPages || 0) > 0) patch.totalPages = match.totalPages;
  if (!book.coverUrl && match.coverUrl) patch.coverUrl = match.coverUrl;
  if ((!book.genre || UNSET_GENRES.includes(book.genre.trim().toLowerCase())) && match.genre && !UNSET_GENRES.includes(match.genre.trim().toLowerCase())) patch.genre = match.genre;
  if (!book.description && match.description) patch.description = match.description;
  if (!book.publisher && match.publisher) patch.publisher = match.publisher;
  if (!book.publishedDate && match.publishedDate) patch.publishedDate = match.publishedDate;
  if (!book.isbn && match.isbn) patch.isbn = match.isbn;
  return patch;
}

/**
 * Antes isto terminava em `results[0]` — o primeiro resultado, fosse ele qual
 * fosse. Para titulo curto e generico ("Divergence", "New Heights") a busca em
 * texto livre traz outro livro, e aceitar o primeiro preenchia paginas e capa
 * ERRADAS. Agora, sem semelhanca de titulo, preferimos nao preencher nada.
 */
function bestMatch(results: ExternalBook[], book: Book): ExternalBook | undefined {
  const title = book.title.trim().toLowerCase();
  const author = book.author.trim().toLowerCase();
  const exatoComAutor = results.find((r) => r.title.trim().toLowerCase() === title && (!author || r.author.trim().toLowerCase().includes(author.split(',')[0])));
  if (exatoComAutor) return exatoComAutor;
  const exato = results.find((r) => r.title.trim().toLowerCase() === title);
  if (exato) return exato;
  return results.find((r) => looksLikeSameBook(r.title, book.title));
}

/**
 * Looks the book up by ISBN (preferred) or title+author and returns a patch with
 * ONLY the fields that were missing — never overwrites data the user already has.
 * Returns null when nothing useful is found (offline, no match, no new data).
 */
/** Candidatos que apareceram mas nao passaram no criterio de semelhanca. */
export type BookCandidate = {
  external: ExternalBook;
  /** O que ESTE candidato preencheria neste livro, se escolhido. */
  wouldFill: string[];
};

/** Por que a IA nao completou o que os catalogos deixaram faltando. */
export type AiOutcome = 'nao-precisou' | 'preencheu' | 'desligada' | 'falhou' | 'nao-conhece';

/** O motivo, mais a mensagem do provedor quando existe. */
export type AiReport = { outcome: AiOutcome; detail?: string };

export type EnrichOutcome = {
  patch: Partial<Book> | null;
  /** Preenchidos quando nao houve certeza — a decisao fica com o usuario. */
  candidates: BookCandidate[];
  /** Diagnostico: sem isto, "sem chave" e "modelo nao conhece" sao iguais. */
  ai: AiReport;
};

/** Torna publico o calculo do patch, para aplicar um candidato escolhido a mao. */
export function patchForCandidate(candidate: ExternalBook, book: Book): Partial<Book> {
  return patchFrom(candidate, book);
}

export async function enrichBookPatch(book: Book): Promise<Partial<Book> | null> {
  return (await enrichBookDetailed(book)).patch;
}

/**
 * Como `enrichBookPatch`, mas quando NAO ha correspondencia confiavel devolve
 * os candidatos encontrados em vez de simplesmente desistir.
 *
 * O guarda de semelhanca evita preencher dado de outro livro, mas sozinho ele
 * so produz silencio: o usuario ficava sem o dado e sem saber que existiam
 * opcoes. Devolvendo os candidatos, quem conhece o livro decide.
 */
export async function enrichBookDetailed(book: Book): Promise<EnrichOutcome> {
  const isbn = (book.isbn || '').replace(/[^0-9Xx]/g, '');
  const titleQuery = [book.title, book.author].filter(Boolean).join(' ').trim();

  // Busca por ISBN primeiro (1:1, mais confiável). Se ela não vier ou não trouxer
  // o que falta, cai para título+autor — antes o código escolhia UMA das duas e
  // desistia, então um ISBN sem correspondência deixava o livro incompleto.
  let match: ExternalBook | undefined;
  // Tudo que apareceu em qualquer etapa — vira a lista de escolha se no fim
  // nenhum candidato for confiavel o bastante.
  const vistos: ExternalBook[] = [];
  if (isbn) {
    const byIsbn = await lookupExternalBooks('isbn:' + isbn);
    vistos.push(...byIsbn);
    match = byIsbn[0];
  }
  // Busca dirigida por campo (intitle/inauthor, title/author) antes do texto
  // livre: para titulo generico ela e a unica que acerta o alvo.
  if ((!match || !isUsefulFor(match, book)) && book.title.trim()) {
    const dirigida = await lookupByTitleAuthorDetailed(book.title, book.author);
    // `seen` inclui o que o filtro de semelhanca descartou: como opcao para o
    // usuario escolher, um quase-acerto da Open Library vale muito mais do que
    // o primeiro palpite do texto livre.
    vistos.push(...dirigida.seen);
    const dirigidoMatch = dirigida.match && bestMatch([dirigida.match], book);
    if (dirigidoMatch && (!match || isUsefulFor(dirigidoMatch, book))) match = dirigidoMatch;
  }
  if ((!match || !isUsefulFor(match, book)) && titleQuery) {
    const byTitle = await lookupExternalBooks(titleQuery);
    vistos.push(...byTitle);
    const titleMatch = bestMatch(byTitle, book);
    if (titleMatch && (!match || isUsefulFor(titleMatch, book))) match = titleMatch;
  }
  // Último recurso: quando os catálogos não têm (ou estão fora do ar / com cota
  // estourada), a IA do app preenche sinopse, gênero e páginas aproximadas.
  // Só entra no que continuar faltando — nunca sobrescreve catálogo.
  const afterCatalogs: Book = match ? { ...book, ...patchFrom(match, book) } : book;
  const gaps = missingFields(afterCatalogs);
  let ai: AiReport = { outcome: 'nao-precisou' };
  if (gaps.length) {
    // Import sob demanda: o aiClient puxa o Firebase, que não deve entrar na
    // árvore de módulos (nem no bundle inicial) de quem só quer os catálogos.
    const resultado = await import('@/services/aiClient')
      .then((mod) => mod.fetchBookFactsDetailed(book.title, book.author))
      .catch((erro) => ({ facts: null, status: 'error' as const, detail: String(erro?.message || erro) }));
    ai = {
      outcome: resultado.status === 'ok' ? 'preencheu'
        : resultado.status === 'off' ? 'desligada'
        : resultado.status === 'unknown-book' ? 'nao-conhece'
        : 'falhou',
      detail: resultado.detail
    };
    const facts = resultado.facts;
    if (facts) {
      const aiPatch: Partial<Book> = {};
      if (gaps.includes('sinopse') && facts.description) aiPatch.description = stripHtml(facts.description);
      if (gaps.includes('páginas') && facts.totalPages) aiPatch.totalPages = facts.totalPages;
      if (gaps.includes('gênero') && facts.genre) aiPatch.genre = facts.genre;
      if (Object.keys(aiPatch).length) {
        return { patch: { ...(match ? patchFrom(match, book) : {}), ...aiPatch }, candidates: [], ai };
      }
      // Veio fato, mas nada que servisse para ESTE livro.
      ai = { outcome: 'nao-precisou' };
    }
  }

  if (!match) return { patch: null, candidates: duvidas(vistos, book), ai };

  const patch = patchFrom(match, book);
  if (Object.keys(patch).length) return { patch, candidates: [], ai };
  return { patch: null, candidates: duvidas(vistos, book), ai };
}

/**
 * Nota minima para um resultado virar opcao na tela. Abaixo disto o candidato
 * nao compartilha nenhuma palavra significativa com o titulo procurado — e
 * foi exatamente isso que encheu a lista de "Pep Comics Vol 1 (1940)" quando
 * o usuario procurava "New Heights".
 */
const NOTA_MINIMA = 0.2;

/**
 * Candidatos que valem uma pergunta: os que preencheriam algo que falta, sem
 * repetir o mesmo livro e ORDENADOS por semelhanca com o que o usuario tem.
 *
 * Mostrar a ordem crua do provedor era pior do que nao mostrar nada: a busca
 * em texto livre devolve qualquer livro que cite a palavra, entao o topo da
 * lista vinha com obras sem relacao nenhuma. Agora entram so os que dividem
 * alguma palavra do titulo, e quem tambem bate o autor sobe.
 */
function duvidas(vistos: ExternalBook[], book: Book): BookCandidate[] {
  const porId = new Map<string, { candidate: BookCandidate; score: number }>();
  vistos.forEach((external) => {
    if (!isUsefulFor(external, book)) return;
    const score = candidateScore(external, book.title, book.author);
    if (score < NOTA_MINIMA) return;
    const chave = (external.title + '|' + external.author).toLowerCase();
    const anterior = porId.get(chave);
    if (anterior && anterior.score >= score) return;
    porId.set(chave, {
      score,
      candidate: { external, wouldFill: filledLabels(patchFrom(external, book)) }
    });
  });
  return Array.from(porId.values())
    .filter((c) => c.candidate.wouldFill.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((c) => c.candidate);
}

export type EnrichProgress = { done: number; total: number; updated: number; currentTitle: string };

/**
 * Enriches every book that needs it, sequentially (gentle on the API), applying
 * each patch through `applyPatch`. Reports progress so the UI can show a count.
 */
export type EnrichedBookReport = { title: string; filled: string[]; stillMissing: string[] };

/** Um livro que ficou sem resposta confiavel, com as opcoes encontradas. */
export type PendingChoice = { book: Book; candidates: BookCandidate[] };

export async function enrichLibrary(
  books: Book[],
  applyPatch: (bookId: string, patch: Partial<Book>) => Promise<void>,
  onProgress?: (p: EnrichProgress) => void
): Promise<{ updated: number; checked: number; reports: EnrichedBookReport[]; pending: PendingChoice[]; ai: AiReport[] }> {
  const targets = books.filter(bookNeedsEnrichment);
  const reports: EnrichedBookReport[] = [];
  const pending: PendingChoice[] = [];
  const ai: AiReport[] = [];
  let updated = 0;
  for (let i = 0; i < targets.length; i++) {
    const book = targets[i];
    onProgress?.({ done: i, total: targets.length, updated, currentTitle: book.title });
    try {
      const { patch, candidates, ai: aiDoLivro } = await enrichBookDetailed(book);
      ai.push(aiDoLivro);
      if (patch) {
        await applyPatch(book.id, patch);
        updated += 1;
        // O que ficou faltando DEPOIS do patch — é isso que explica um livro
        // continuar na contagem de incompletos mesmo tendo sido atualizado.
        reports.push({
          title: book.title,
          filled: filledLabels(patch),
          stillMissing: missingFields({ ...book, ...patch })
        });
      } else {
        reports.push({ title: book.title, filled: [], stillMissing: missingFields(book) });
        // Sem certeza, mas com opcoes: quem conhece o livro decide.
        if (candidates.length) pending.push({ book, candidates });
      }
    } catch {
      reports.push({ title: book.title, filled: [], stillMissing: missingFields(book) });
    }
  }
  onProgress?.({ done: targets.length, total: targets.length, updated, currentTitle: '' });
  return { updated, checked: targets.length, reports, pending, ai };
}

/**
 * Uma frase explicando por que a IA não cobriu o que os catálogos deixaram.
 * A ordem importa: problema de configuração vence "não conhece o livro",
 * porque é o único que o usuário pode consertar.
 */
export function aiDiagnostico(resultados: AiReport[]): string {
  const tem = (o: AiOutcome) => resultados.find((r) => r.outcome === o);
  if (tem('desligada')) {
    return 'A IA está desligada nesta versão do app — falta a chave do Gemini nas variáveis de ambiente.';
  }
  const falha = tem('falhou');
  if (falha) {
    // A mensagem do provedor e o que separa "chave errada" de "cota estourada"
    // de "modelo inexistente". Sem ela, resta adivinhar.
    return 'A IA não respondeu.' + (falha.detail ? ' Resposta do servidor: ' + falha.detail : ' Pode ser chave inválida, cota esgotada ou falha de conexão.');
  }
  if (tem('nao-conhece')) {
    return 'A IA respondeu, mas não conhece esses livros o suficiente para preencher sem inventar.';
  }
  return '';
}

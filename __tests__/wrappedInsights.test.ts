jest.mock('@/services/i18n', () => ({
  ...jest.requireActual('@/services/i18n'),
  appLocale: 'pt-BR',
  t: (texto: string, vars: Record<string, unknown> = {}) => texto.replace(/\{(\w+)\}/g, (_: string, k: string) => String(vars[k] ?? ''))
}));

import { buildWrappedStory, genreFamily, realFinishDate } from '@/services/wrappedInsights';
import { Book } from '@/types/book';
import { Quote } from '@/types/quote';

const ANO = 2026;
const dia = (m: number, d: number, h = 21) => new Date(ANO, m, d, h, 30).getTime();
let n = 0;
const lido = (p: Partial<Book>): Book =>
  ({ id: 'b' + ++n, title: 'Livro ' + n, author: 'Autor ' + n, genre: 'Fantasia', status: 'finished', rating: 4, totalPages: 300, createdAt: dia(0, 1), updatedAt: dia(0, 1), finishedAt: dia(5, 1), ...p } as Book);
const dezembro = new Date(ANO, 11, 20);

describe('datas reais x mes escolhido a mao', () => {
  it('dia 15 ao meio-dia (seletor) e dia 15 a meia-noite (backup antigo) nao contam como dia', () => {
    expect(realFinishDate(lido({ finishedAt: new Date(ANO, 3, 15, 12, 0, 0).getTime() }))).toBeNull();
    expect(realFinishDate(lido({ finishedAt: new Date(ANO, 3, 15).getTime() }))).toBeNull();
    expect(realFinishDate(lido({ finishedAt: dia(3, 15) }))).not.toBeNull();
  });

  it('livros com so o mes nao viram maratona falsa', () => {
    const mesmoMes = [1, 2, 3, 4].map(() => lido({ finishedAt: new Date(ANO, 6, 15, 12).getTime() }));
    const s = buildWrappedStory(mesmoMes, [], ANO, dezembro);
    expect(s.insights.find((i) => i.id === 'marathon')).toBeUndefined();
  });
});

describe('cada leitor recebe uma historia diferente', () => {
  it('maratonista de saga de fantasia', () => {
    const saga = [1, 2, 3, 4, 5].map((v, i) => lido({ title: 'The Beginning After the End (Volume ' + v + ')', author: 'TurtleMe', finishedAt: dia(6, 2 + i * 2), rating: 5 }));
    const s = buildWrappedStory([...saga, lido({}), lido({})], [], ANO, dezembro);
    const ids = s.insights.map((i) => i.id);
    expect(ids).toContain('marathon');
    expect(ids).toContain('series');
    expect(s.insights.find((i) => i.id === 'marathon')?.big?.value).toBe(5);
    expect(s.persona.name).toMatch(/da Fantasia$/);
    expect(['Mente Maratonista', 'Alma das Sagas'].some((p) => s.persona.name.startsWith(p))).toBe(true);
    expect(s.palette.family).toBe('fantasia');
    expect(s.palette.tint).not.toBeNull();
  });

  it('critico exigente de misterio, com um livro odiado', () => {
    const livros = [
      lido({ genre: 'Suspense', rating: 4 }), lido({ genre: 'Suspense', rating: 4 }), lido({ genre: 'Suspense', rating: 4 }),
      lido({ genre: 'Suspense', rating: 4 }), lido({ genre: 'Suspense', rating: 1, title: 'O Chato' })
    ];
    const s = buildWrappedStory(livros, [], ANO, dezembro);
    const polemico = s.insights.find((i) => i.id === 'controversial');
    expect(polemico?.name).toBe('O Chato');
    expect(s.palette.family).toBe('misterio');
    expect(s.persona.name).toMatch(/do Mistério$/);
  });

  it('ouvinte de audiolivros e viajante no tempo', () => {
    const livros = [
      lido({ format: 'audiobook', totalMinutes: 600, genre: 'Clássicos' }),
      lido({ format: 'audiobook', totalMinutes: 540, genre: 'Clássicos' }),
      lido({ title: 'Orgulho e Preconceito', publishedDate: '1813', genre: 'Clássicos' })
    ];
    const s = buildWrappedStory(livros, [], ANO, dezembro);
    const ids = s.insights.map((i) => i.id);
    expect(ids).toContain('formats');
    expect(ids).toContain('oldest');
    expect(s.insights.find((i) => i.id === 'formats')?.big?.value).toBe(19);
    expect(s.persona.name).toMatch(/dos Clássicos$/);
  });

  it('leitura relampago so com data de inicio real', () => {
    const rapido = lido({ title: 'Duna', totalPages: 600, startedAt: dia(8, 1), finishedAt: dia(8, 4) });
    const s = buildWrappedStory([rapido, lido({}), lido({})], [], ANO, dezembro);
    expect(s.insights.find((i) => i.id === 'fastest')?.name).toBe('Duna');
  });

  it('frase do ano vem das citacoes favoritas', () => {
    const q: Quote = { id: 'q', bookTitle: 'Duna', author: 'Frank Herbert', text: 'O medo é o assassino da mente.', tags: [], favorite: true, createdAt: dia(3, 3), updatedAt: dia(3, 3) };
    const s = buildWrappedStory([lido({})], [q], ANO, dezembro);
    expect(s.insights.find((i) => i.id === 'quote')?.quote?.text).toBe('O medo é o assassino da mente.');
  });
});

describe('selecao e carta', () => {
  it('no maximo 6 descobertas, na ordem da historia', () => {
    const livros = Array.from({ length: 12 }, (_, i) => lido({ finishedAt: dia(i % 12, 3 + (i % 3)), genre: 'Fantasia', totalPages: 500 + i * 30, publishedDate: i === 0 ? '1900' : '2020' }));
    const s = buildWrappedStory(livros, [], ANO, dezembro);
    expect(s.insights.length).toBeLessThanOrEqual(6);
    const ORDEM = ['pages', 'marathon', 'fastest', 'fireGhost', 'series', 'topAuthor', 'newAuthor', 'genre', 'vibe', 'formats', 'oldest', 'newest', 'waitList', 'longest', 'controversial', 'dnf', 'quote'];
    const pos = s.insights.map((i) => ORDEM.indexOf(i.id));
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });

  it('carta cita o que aconteceu e avisa quando o ano nao acabou', () => {
    const saga = [1, 2, 3].map((v, i) => lido({ title: 'Mistborn (Volume ' + v + ')', finishedAt: dia(2, 1 + i) }));
    const parcial = buildWrappedStory(saga, [], ANO, new Date(ANO, 8, 29), 'Lucas');
    expect(parcial.partial).toBe(true);
    expect(parcial.letter.startsWith('Lucas, em 2026 você leu 3 livro(s).')).toBe(true);
    expect(parcial.letter).toContain('Mistborn');
    expect(parcial.letter).toContain('E o ano ainda nem acabou.');
    expect(parcial.facts.join('\n')).toContain('Persona do leitor');
  });

  it('ano vazio nao quebra', () => {
    const s = buildWrappedStory([], [], ANO, dezembro);
    expect(s.insights).toEqual([]);
    expect(s.letter).toContain('pausa');
  });

  it('familias de genero', () => {
    expect(genreFamily('Ficção Científica')).toBe('scifi');
    expect(genreFamily('Não ficção')).toBe('naoficcao');
    expect(genreFamily('Mangá')).toBe('quadrinhos');
    expect(genreFamily('Literatura brasileira')).toBe('outro');
  });
});

describe('ajustes vindos do uso real', () => {
  it('"Ficção" generico nao define a familia: vale o proximo genero', () => {
    const livros = [
      ...[1, 2, 3, 4].map(() => lido({ genre: 'Ficção' })),
      lido({ genre: 'Thriller' }), lido({ genre: 'Thriller' }), lido({ genre: 'Fantasia' })
    ];
    const s = buildWrappedStory(livros, [], ANO, dezembro);
    expect(s.palette.family).toBe('misterio');
    expect(s.persona.name).toMatch(/do Mistério$/);
  });

  it('sem familia reconhecida ainda tem cor (a do Readora)', () => {
    const s = buildWrappedStory([lido({ genre: 'Ficção' })], [], ANO, dezembro);
    expect(s.palette.family).toBe('outro');
    expect(s.palette.tint).not.toBeNull();
  });

  it('citacao que ja vem com aspas nao fica com aspas dobradas', () => {
    const q: Quote = { id: 'q', bookTitle: 'The Wife Upstairs', text: '"Of course I do. Everybody should know how."', tags: [], favorite: true, createdAt: dia(3, 3), updatedAt: dia(3, 3) };
    const s = buildWrappedStory([lido({})], [q], ANO, dezembro);
    expect(s.insights.find((i) => i.id === 'quote')?.quote?.text).toBe('Of course I do. Everybody should know how.');
  });

  it('leitura em um dia: singular, sem "dia(s)"', () => {
    const rapido = lido({ title: 'Eldest', totalPages: 644, startedAt: dia(4, 10, 8), finishedAt: dia(4, 10, 23) });
    const s = buildWrappedStory([rapido, lido({}), lido({})], [], ANO, dezembro);
    const f = s.insights.find((i) => i.id === 'fastest');
    expect(f?.chip).toBe('Eldest em 1 dia');
    expect(f?.letter).toBe('devorou Eldest em um único dia');
  });
});

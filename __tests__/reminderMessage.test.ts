import { reminderMessage } from '@/services/reminderMessage';
import { Book } from '@/types/book';

const livro = (p: Partial<Book>): Book =>
  ({ id: 'x', title: 'Ascension', author: 'TurtleMe', genre: 'Fantasia', status: 'reading', createdAt: 1, updatedAt: 1, ...p } as Book);

describe('texto do lembrete de leitura', () => {
  it('perto do fim: quantas paginas faltam', () => {
    const m = reminderMessage([livro({ currentPage: 280, totalPages: 320 })]);
    expect(m.title).toBe('Falta pouco!');
    expect(m.vars).toEqual({ title: 'Ascension', n: 40 });
    expect(m.bookId).toBe('x');
  });

  it('singular quando falta uma pagina', () => {
    expect(reminderMessage([livro({ currentPage: 319, totalPages: 320 })]).body).toBe('Falta 1 página para terminar {title}.');
  });

  it('com meta diaria: sugere a meta', () => {
    const m = reminderMessage([livro({ currentPage: 50, totalPages: 320 })], 20);
    expect(m.vars).toMatchObject({ a: 50, b: 320, g: 20 });
  });

  it('sem meta: mostra a porcentagem', () => {
    expect(reminderMessage([livro({ currentPage: 80, totalPages: 320 })]).vars).toMatchObject({ p: 25 });
  });

  it('sem numero de paginas: convite simples', () => {
    expect(reminderMessage([livro({})]).body).toBe('Que tal continuar {title} hoje?');
  });

  it('nada em andamento: sugere o ultimo da lista de desejos', () => {
    const m = reminderMessage([
      livro({ id: 'a', title: 'Antigo', status: 'wishlist', createdAt: 1 }),
      livro({ id: 'b', title: 'Novo', status: 'wishlist', createdAt: 5 })
    ]);
    expect(m.vars).toEqual({ title: 'Novo' });
    expect(m.bookId).toBe('b');
  });

  it('biblioteca vazia: texto padrao, sem livro', () => {
    expect(reminderMessage([]).bookId).toBeUndefined();
  });
});

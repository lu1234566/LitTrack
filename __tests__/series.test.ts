import { pickReadingWidgetData } from '@/widget/readingWidgetData';
import { groupSeries, parseSeries } from '@/services/series';
import { Book } from '@/types/book';

const livro = (id: string, title: string, status: Book['status'] = 'finished'): Book =>
  ({ id, title, author: 'TurtleMe', genre: 'Fantasia', status, createdAt: 1, updatedAt: 1 } as Book);

describe('reconhecer serie pelo titulo', () => {
  // Títulos reais da biblioteca do usuário.
  it('formato "Serie: Subtitulo (Volume N)"', () => {
    expect(parseSeries('The Beginning After the End: Transcendence (Volume 6)'))
      .toEqual({ series: 'The Beginning After the End', volume: 6, subtitle: 'Transcendence' });
  });

  it('formato "Serie Volume N: Subtitulo"', () => {
    expect(parseSeries('The Beginning After the End Volume 3: Beckoning Fate'))
      .toEqual({ series: 'The Beginning After the End', volume: 3, subtitle: 'Beckoning Fate' });
  });

  it('formato "Serie, Vol. N (Comic)" descarta a edicao', () => {
    expect(parseSeries('The Beginning After the End, Vol. 12 (Comic)'))
      .toEqual({ series: 'The Beginning After the End', volume: 12, subtitle: '' });
  });

  it('portugues e cerquilha', () => {
    expect(parseSeries('Crônicas de Gelo e Fogo (Livro 2)')?.volume).toBe(2);
    expect(parseSeries('Skyward #3')?.series).toBe('Skyward');
  });

  it('titulo comum nao vira serie por palpite', () => {
    expect(parseSeries('Dom Casmurro')).toBeNull();
    expect(parseSeries('1984')).toBeNull();
    expect(parseSeries('Harry Potter e a Pedra Filosofal')).toBeNull();
  });
});

describe('agrupar series', () => {
  const tbate = [
    livro('a', 'The Beginning After the End: Early Years (Volume 1)'),
    livro('b', 'The Beginning After the End: New Heights (Volume 2)'),
    livro('c', 'The Beginning After the End Volume 3: Beckoning Fate'),
    livro('e', 'The Beginning After the End: Convergence (Volume 5)', 'reading'),
    livro('f', 'The beginning after the end: Transcendence (Volume 6)', 'wishlist')
  ];

  it('junta grafias diferentes da mesma serie e ordena por volume', () => {
    const [g] = groupSeries(tbate);
    expect(g.volumes.map((v) => v.volume)).toEqual([1, 2, 3, 5, 6]);
    expect(g.finished).toBe(3);
    expect(g.lastVolume).toBe(6);
  });

  it('aponta o volume que falta na biblioteca', () => {
    expect(groupSeries(tbate)[0].missing).toEqual([4]);
  });

  it('proxima leitura: continuar o que esta em andamento', () => {
    expect(groupSeries(tbate)[0].next).toMatchObject({ kind: 'continue', volume: 5 });
  });

  it('sem nada em andamento: o primeiro nao lido, mesmo que falte na biblioteca', () => {
    const semLeitura = tbate.map((b) => (b.status === 'reading' ? { ...b, status: 'finished' as const } : b));
    expect(groupSeries(semLeitura)[0].next).toMatchObject({ kind: 'missing', volume: 4 });
  });

  it('livro isolado com volume no titulo nao vira serie', () => {
    expect(groupSeries([livro('x', 'Mistborn (Book 2)')])).toEqual([]);
  });
});

describe('widget lendo agora', () => {
  it('mostra o livro em andamento mexido por ultimo', () => {
    const a = { ...livro('a', 'Antigo', 'reading'), updatedAt: 10, currentPage: 50, totalPages: 200 };
    const b = { ...livro('b', 'Recente', 'reading'), updatedAt: 20, currentPage: 30, totalPages: 120, coverUrl: 'http://x/c.jpg' };
    const d = pickReadingWidgetData([a, b, livro('c', 'Lido')]);
    expect(d.book?.title).toBe('Recente');
    expect(d.percent).toBe(25);
    // O widget não desenha http: sobe para https.
    expect(d.book?.coverUrl).toBe('https://x/c.jpg');
  });

  it('sem leitura em andamento, fica vazio', () => {
    expect(pickReadingWidgetData([livro('c', 'Lido')]).book).toBeNull();
  });
});

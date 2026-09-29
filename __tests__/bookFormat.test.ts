// Os textos são conferidos em português, independente do idioma da máquina.
jest.mock('@/services/i18n', () => ({
  ...jest.requireActual('@/services/i18n'),
  t: (texto: string, vars: Record<string, unknown> = {}) => texto.replace(/\{(\w+)\}/g, (_: string, k: string) => String(vars[k] ?? ''))
}));

import { applyProgress, formatDuration, parseDuration, progressInputText, progressLabel, progressLine, progressPercentOf, quickSteps, remainingIfClose } from '@/services/bookFormat';
import { pickReadingWidgetData } from '@/widget/readingWidgetData';
import { reminderMessage } from '@/services/reminderMessage';
import { Book } from '@/types/book';

const livro = (p: Partial<Book>): Book =>
  ({ id: 'x', title: 'Duna', author: 'Frank Herbert', genre: 'Ficção', status: 'reading', createdAt: 1, updatedAt: 1, ...p } as Book);

describe('duracao de audiolivro', () => {
  it('le os jeitos comuns de escrever', () => {
    expect(parseDuration('3h20')).toBe(200);
    expect(parseDuration('3:05')).toBe(185);
    expect(parseDuration('11h')).toBe(660);
    expect(parseDuration('45min')).toBe(45);
    expect(parseDuration('45 min')).toBe(45);
    expect(parseDuration('1,5')).toBe(90);
    expect(parseDuration('8')).toBe(480);
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration('abc')).toBeNaN();
  });

  it('escreve de volta', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(200)).toBe('3h20');
    expect(formatDuration(605)).toBe('10h05');
  });
});

describe('progresso por formato', () => {
  it('livro antigo sem formato continua em paginas', () => {
    const b = livro({ currentPage: 30, totalPages: 120 });
    expect(progressPercentOf(b)).toBe(25);
    expect(progressLine(b)).toBe('pág. 30 de 120 · 25%');
    expect(quickSteps('physical').map((s) => s.label)).toEqual(['+5', '+10', '+25']);
  });

  it('e-book: porcentagem, e a pagina acompanha quando o total e conhecido', () => {
    const b = applyProgress(livro({ format: 'ebook', totalPages: 400 }), 42);
    expect(b.progressPercent).toBe(42);
    expect(b.currentPage).toBe(168);
    expect(progressLine(b)).toBe('42% lido');
    expect(progressInputText(b)).toBe('42');
  });

  it('e-book chegando a 100% vira lido', () => {
    const b = applyProgress(livro({ format: 'ebook', progressPercent: 95 }), 105, 777);
    expect(b.progressPercent).toBe(100);
    expect(b.status).toBe('finished');
    expect(b.finishedAt).toBe(777);
  });

  it('audiolivro: tempo ouvido, limitado a duracao', () => {
    const b = applyProgress(livro({ format: 'audiobook', totalMinutes: 480, totalPages: 600 }), 120);
    expect(b.listenedMinutes).toBe(120);
    expect(b.currentPage).toBe(150);
    expect(progressLine(b)).toBe('2h de 8h · 25%');
    const fim = applyProgress(b, 999);
    expect(fim.listenedMinutes).toBe(480);
    expect(fim.status).toBe('finished');
  });

  it('audiolivro sem duracao: mostra so o ouvido e nao conclui sozinho', () => {
    const b = applyProgress(livro({ format: 'audiobook' }), 95);
    expect(progressLabel(b)).toBe('1h35 ouvidos');
    expect(b.status).toBe('reading');
    expect(progressPercentOf(b)).toBe(0);
  });

  it('nao troca o mes de leitura ja escolhido', () => {
    const b = applyProgress(livro({ currentPage: 100, totalPages: 120, finishedAt: 5 }), 120, 999);
    expect(b.finishedAt).toBe(5);
  });

  it('trocar o formato no formulario converte o progresso', () => {
    const b = livro({ currentPage: 60, totalPages: 120 });
    expect(progressInputText(b, 'ebook')).toBe('50');
    expect(progressInputText(livro({ format: 'ebook', progressPercent: 50, totalPages: 300 }), 'physical')).toBe('150');
  });
});

describe('falta pouco, widget e lembrete', () => {
  it('limites por formato', () => {
    expect(remainingIfClose(livro({ format: 'ebook', progressPercent: 93 }))).toEqual({ kind: 'percent', amount: 7 });
    expect(remainingIfClose(livro({ format: 'audiobook', totalMinutes: 600, listenedMinutes: 560 }))).toEqual({ kind: 'minutes', amount: 40 });
    expect(remainingIfClose(livro({ format: 'ebook', progressPercent: 50 }))).toBeNull();
  });

  it('widget usa a linha do formato', () => {
    const d = pickReadingWidgetData([livro({ format: 'ebook', progressPercent: 34 })]);
    expect(d.line).toBe('34% lido');
    expect(d.percent).toBe(34);
  });

  it('lembrete de audiolivro perto do fim fala em tempo', () => {
    const m = reminderMessage([livro({ format: 'audiobook', totalMinutes: 600, listenedMinutes: 560 })]);
    expect(m.body).toBe('Faltam {n} para terminar {title}.');
    expect(m.vars).toMatchObject({ n: '40 min' });
  });

  it('meta diaria em paginas nao aparece para e-book', () => {
    const m = reminderMessage([livro({ format: 'ebook', progressPercent: 30 })], 20);
    expect(m.vars).toMatchObject({ p: 30 });
  });
});

describe('formato vindo do CSV', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { formatFromCsv } = require('@/services/csvImport');
  it('Goodreads e StoryGraph', () => {
    expect(formatFromCsv('Kindle Edition')).toBe('ebook');
    expect(formatFromCsv('digital')).toBe('ebook');
    expect(formatFromCsv('Audible Audio')).toBe('audiobook');
    expect(formatFromCsv('audio')).toBe('audiobook');
    expect(formatFromCsv('Paperback')).toBeUndefined();
  });
});

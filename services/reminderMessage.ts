import { Book } from '@/types/book';
import { pickReadingWidgetData } from '@/widget/readingWidgetData';

/** Até quantas páginas do fim o lembrete vira "falta pouco". */
const FALTA_POUCO = 60;

export type ReminderMessage = { title: string; body: string; bookId?: string };

/**
 * Texto do lembrete de leitura, a partir da biblioteca no momento do
 * agendamento. O Android guarda o texto junto com o horário, então o app
 * reagenda quando os livros mudam (ver refreshReadingReminder).
 *
 * Retorna o texto em português com {marcadores}; quem agenda traduz.
 */
export function reminderMessage(books: Book[], dailyPageGoal = 0): ReminderMessage & { vars: Record<string, string | number> } {
  const { book, currentPage, totalPages, percent } = pickReadingWidgetData(books);

  if (book && totalPages > 0) {
    const faltam = totalPages - currentPage;
    if (faltam > 0 && faltam <= FALTA_POUCO) {
      return {
        title: 'Falta pouco!',
        body: faltam === 1 ? 'Falta 1 página para terminar {title}.' : 'Faltam {n} páginas para terminar {title}.',
        bookId: book.id,
        vars: { title: book.title, n: faltam }
      };
    }
    if (faltam > 0 && dailyPageGoal > 0) {
      return {
        title: 'Hora de ler no Readora',
        body: '{title}: você está na página {a} de {b}. Que tal mais {g} páginas hoje?',
        bookId: book.id,
        vars: { title: book.title, a: currentPage, b: totalPages, g: dailyPageGoal }
      };
    }
    if (faltam > 0) {
      return {
        title: 'Hora de ler no Readora',
        body: '{title}: você está em {p}%. Continue de onde parou.',
        bookId: book.id,
        vars: { title: book.title, p: percent }
      };
    }
  }

  if (book) {
    return { title: 'Hora de ler no Readora', body: 'Que tal continuar {title} hoje?', bookId: book.id, vars: { title: book.title } };
  }

  // Nada em andamento: sugere o último que entrou na lista de desejos.
  const proximo = books
    .filter((b) => b.status === 'wishlist')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
  if (proximo) {
    return {
      title: 'Hora de ler no Readora',
      body: 'Nenhuma leitura em andamento. Que tal começar {title}?',
      bookId: proximo.id,
      vars: { title: proximo.title }
    };
  }

  return { title: 'Hora de ler no Readora', body: 'Separe alguns minutos para continuar sua jornada literária.', vars: {} };
}

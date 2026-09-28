import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { ReadingWidget } from '@/widget/ReadingWidget';
import { pickReadingWidgetData } from '@/widget/readingWidgetData';
import type { Book } from '@/types/book';

export const READING_WIDGET = 'Reading';

/**
 * Atualiza o widget da tela inicial com os livros atuais. Chamado quando a
 * lista muda — sem isso, o progresso no widget só mudaria na atualização
 * periódica do Android (a cada 30 min, no mínimo).
 *
 * Falhar aqui nunca pode atrapalhar o app: o widget é um extra.
 */
export function updateReadingWidget(books: Book[]) {
  if (Platform.OS !== 'android') return;
  const data = pickReadingWidgetData(books);
  requestWidgetUpdate({
    widgetName: READING_WIDGET,
    renderWidget: (info) => <ReadingWidget data={data} width={info.width} height={info.height} />
  }).catch(() => {});
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { ReadingWidget } from '@/widget/ReadingWidget';
import { pickReadingWidgetData } from '@/widget/readingWidgetData';
import type { Book } from '@/types/book';

/** Mesma chave do bookStorage: o widget lê o que o app gravou. */
const BOOKS_KEY = '@readora_native_books';

export async function loadWidgetBooks(): Promise<Book[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Chamado pelo Android com o app possivelmente FECHADO: ao adicionar o widget,
 * ao redimensionar e a cada atualização periódica. Por isso lê os livros do
 * armazenamento, e não do estado do app.
 */
export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED') return;
  const data = pickReadingWidgetData(await loadWidgetBooks());
  renderWidget(<ReadingWidget data={data} width={widgetInfo.width} />);
}

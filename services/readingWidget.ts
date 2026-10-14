import { createElement } from 'react';
import { Platform } from 'react-native';
import type { Book } from '@/types/book';

export const READING_WIDGET = 'Reading';

/**
 * Atualiza o widget da tela inicial com os livros atuais. Chamado quando a
 * lista muda — sem isso, o widget só mudaria na atualização periódica do
 * Android, que nos Samsung pode demorar horas.
 *
 * Um arquivo só, com checagem de plataforma: antes havia um
 * `readingWidget.native.tsx`, mas o atalho `@/services/...` resolvia direto
 * para este arquivo e o app Android usava a versão vazia — o widget nunca era
 * atualizado pelo app. A biblioteca é carregada só no Android (no site ela nem
 * existe).
 *
 * Falhar aqui nunca pode atrapalhar o app: o widget é um extra.
 */
export function updateReadingWidget(books: Book[]) {
  if (Platform.OS !== 'android') return;
  try {
    const { requestWidgetUpdate } = require('react-native-android-widget') as typeof import('react-native-android-widget');
    const { ReadingWidget } = require('@/widget/ReadingWidget') as typeof import('@/widget/ReadingWidget');
    const { pickReadingWidgetData } = require('@/widget/readingWidgetData') as typeof import('@/widget/readingWidgetData');
    const data = pickReadingWidgetData(books);
    requestWidgetUpdate({
      widgetName: READING_WIDGET,
      renderWidget: (info) => createElement(ReadingWidget, { data, width: info.width, height: info.height })
    }).catch(() => {});
  } catch {
    /* sem widget instalado ou biblioteca indisponível: ignora */
  }
}

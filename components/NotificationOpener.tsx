import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

/**
 * Tocar no lembrete de leitura abre o livro que ele cita — com o app aberto
 * ou fechado (o hook devolve também o toque que abriu o app).
 * Só é montado no Android/iOS.
 */
export function NotificationOpener() {
  const resposta = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!resposta || resposta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const bookId = resposta.notification.request.content.data?.bookId;
    // Esquece o toque já tratado: senão ele reabriria o livro no próximo início.
    Notifications.clearLastNotificationResponse();
    if (typeof bookId !== 'string' || !bookId) return;
    // Com o app abrindo pelo toque, espera o roteador montar a primeira tela.
    const timer = setTimeout(() => router.push({ pathname: '/book/[id]', params: { id: bookId } }), 300);
    return () => clearTimeout(timer);
  }, [resposta]);
  return null;
}

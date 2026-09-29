import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderFrequency } from '@/types/preferences';
import type { Book } from '@/types/book';
import { t } from '@/services/i18n';
import { loadPreferences } from '@/services/preferencesStorage';
import { reminderMessage } from '@/services/reminderMessage';

const REMINDER_ID_KEY = 'readora-reading-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  } as Notifications.NotificationBehavior)
});

export async function requestReminderPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function cancelReadingReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => item.identifier.startsWith(REMINDER_ID_KEY)).map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

export async function scheduleReadingReminder(reminderText: string, frequency: ReminderFrequency, books: Book[] = [], dailyPageGoal = 0) {
  if (Platform.OS === 'web') return { ok: false, message: 'Notificações nativas não funcionam no web. Teste no Android/iOS.' };
  const granted = await requestReminderPermission();
  if (!granted) return { ok: false, message: 'Permissão de notificação negada.' };
  await cancelReadingReminders();
  const parsed = parseTime(reminderText);
  // O texto cita o livro em andamento (ou o próximo da lista de desejos) e
  // tocar na notificação abre esse livro.
  const msg = reminderMessage(books, dailyPageGoal);
  const title = t(msg.title);
  const body = t(msg.body, msg.vars);
  const data = msg.bookId ? { bookId: msg.bookId } : {};

  if (frequency === 'weekly') {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID_KEY + '-weekly',
      content: { title, body, data },
      trigger: { weekday: 2, hour: parsed.hour, minute: parsed.minute, repeats: true } as Notifications.NotificationTriggerInput
    });
    return { ok: true, message: 'Lembrete semanal agendado.' };
  }

  if (frequency === 'weekdays') {
    await Promise.all([2, 3, 4, 5, 6].map((weekday) => Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID_KEY + '-weekday-' + weekday,
      content: { title, body, data },
      trigger: { weekday, hour: parsed.hour, minute: parsed.minute, repeats: true } as Notifications.NotificationTriggerInput
    })));
    return { ok: true, message: 'Lembretes em dias úteis agendados.' };
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID_KEY + '-daily',
    content: { title, body, data },
    trigger: { hour: parsed.hour, minute: parsed.minute, repeats: true } as Notifications.NotificationTriggerInput
  });
  return { ok: true, message: 'Lembrete diário agendado.' };
}

function parseTime(value: string) {
  const match = value.match(/(\d{1,2})[:hH](\d{2})?/);
  if (!match) return { hour: 20, minute: 0 };
  const hour = Math.max(0, Math.min(23, Number(match[1]) || 20));
  const minute = Math.max(0, Math.min(59, Number(match[2]) || 0));
  return { hour, minute };
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Reescreve o texto dos lembretes já agendados com a biblioteca atual — o
 * Android guarda o texto fixo, então sem isso o lembrete citaria a página de
 * dias atrás. Só mexe se já houver lembrete agendado (quem desligou nos
 * Ajustes continua sem). Espera 3 s para juntar vários toques seguidos.
 */
export function refreshReadingReminder(books: Book[]) {
  if (Platform.OS === 'web') return;
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    (async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      if (!scheduled.some((item) => item.identifier.startsWith(REMINDER_ID_KEY))) return;
      const prefs = await loadPreferences();
      if (!prefs.reminderEnabled) return;
      // Sem permissão (revogada nos ajustes do Android): não pede de novo do nada.
      if (!(await Notifications.getPermissionsAsync()).granted) return;
      await scheduleReadingReminder(prefs.reminderText, prefs.reminderFrequency, books, prefs.dailyPageGoal);
    })().catch(() => {});
  }, 3000);
}

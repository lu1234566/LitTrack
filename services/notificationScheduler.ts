import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderFrequency } from '@/types/preferences';

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

export async function scheduleReadingReminder(reminderText: string, frequency: ReminderFrequency) {
  if (Platform.OS === 'web') return { ok: false, message: 'Notificações nativas não funcionam no web. Teste no Android/iOS.' };
  const granted = await requestReminderPermission();
  if (!granted) return { ok: false, message: 'Permissão de notificação negada.' };
  await cancelReadingReminders();
  const parsed = parseTime(reminderText);
  const title = 'Hora de ler no Readora';
  const body = 'Separe alguns minutos para continuar sua jornada literária.';

  if (frequency === 'weekly') {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID_KEY + '-weekly',
      content: { title, body },
      trigger: { weekday: 2, hour: parsed.hour, minute: parsed.minute, repeats: true } as Notifications.NotificationTriggerInput
    });
    return { ok: true, message: 'Lembrete semanal agendado.' };
  }

  if (frequency === 'weekdays') {
    await Promise.all([2, 3, 4, 5, 6].map((weekday) => Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID_KEY + '-weekday-' + weekday,
      content: { title, body },
      trigger: { weekday, hour: parsed.hour, minute: parsed.minute, repeats: true } as Notifications.NotificationTriggerInput
    })));
    return { ok: true, message: 'Lembretes em dias úteis agendados.' };
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID_KEY + '-daily',
    content: { title, body },
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

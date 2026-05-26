import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../lib/notificationService';
import { authStorage } from '@/shared/api/authStorage';
import { userService } from '@/entities/user/api/user.service';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerPushToken().then(setExpoPushToken);

    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Datos adjuntos de la notificación pulsada:', data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification, registerPushToken };
}

export async function registerPushToken() {
  const token = await notificationService.registerForPushNotificationsAsync();
  if (!token) return null;

  const jwt = await authStorage.getToken();
  if (!jwt) return token;

  try {
    await userService.updatePushToken(token);
  } catch (err) {
    console.error('No se pudo registrar el push token en la API:', err);
  }

  return token;
}

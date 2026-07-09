import { userService } from '@/entities/user/api/user.service';
import { authStorage } from '@/shared/api/authStorage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    if (isExpoGo) return;

    let mounted = true;

    (async () => {
      try {
        const mod = await import('expo-notifications');
        const Notifications = mod.default ?? mod;

        if (!mounted) return;

        const { notificationService } = await import('../lib/notificationService');

        notificationService.registerForPushNotificationsAsync().then(async (token: string | null) => {
          if (!mounted) return;
          setExpoPushToken(token);
          if (token) {
            console.log('usePushNotifications: token obtenido, registrando en backend...');
            const jwt = await authStorage.getToken();
            if (jwt) {
              try {
                await userService.updatePushToken(token);
                console.log('usePushNotifications: token registrado exitosamente en el backend');
              } catch (err) {
                console.error('usePushNotifications: error al registrar token en backend:', err);
              }
            } else {
              console.log('usePushNotifications: no hay JWT, se registrara tras login');
            }
          } else {
            console.warn('usePushNotifications: no se obtuvo push token');
          }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener((notif: any) => {
          console.log('usePushNotifications: notificacion recibida en primer plano', notif);
          if (mounted) setNotification(notif);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
          const data = response.notification.request.content.data;
          console.log('usePushNotifications: usuario pulso la notificacion', data);
          
          // Manejar navegación basada en el tipo de evento
          if (data?.tipoEvento === 'NUEVA_CITA' && data?.citaId) {
            // Navegar a detalles de la cita (para doctor)
            router.push(`/citas/${data.citaId}`);
          } else if (data?.tipoEvento === 'CITA_CANCELADA' && data?.citaId) {
            // Navegar a lista de citas actualizada
            router.replace('/(tabs)');
          } else if (data?.tipoEvento === 'RECORDATORIO_CITA' && data?.citaId) {
            // Navegar a detalles de la cita
            router.push(`/citas/${data.citaId}`);
          }
        });

        console.log('usePushNotifications: hook inicializado correctamente');
      } catch (err) {
        console.error('usePushNotifications: error en inicializacion:', err);
      }
    })();

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification, registerPushToken };
}

export async function registerPushToken() {
  if (isExpoGo) return null;

  const { notificationService } = await import('../lib/notificationService');
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
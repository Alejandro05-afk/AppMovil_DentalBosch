import { Platform } from 'react-native';
import Constants from 'expo-constants';

type NotificationsModule = any;
let Notifications: NotificationsModule | null = null;
let handlerSet = false;

// Load expo-notifications immediately and set the handler ASAP
const notificationsReady = (async () => {
  try {
    const mod = await import('expo-notifications');
    Notifications = mod.default ?? mod;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerSet = true;
  } catch (e) {
    console.warn('notificationService: no se pudo inicializar expo-notifications', e);
  }
})();

export const notificationService = {
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    if (Platform.OS === 'web') return null;

    // Wait for initial setup
    await notificationsReady;
    if (!Notifications) {
      console.error('notificationService: expo-notifications no está disponible');
      return null;
    }

    // Retry handler in case the first attempt failed
    if (!handlerSet) {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        handlerSet = true;
      } catch (e) {
        console.warn('notificationService: no se pudo establecer el handler', e);
      }
    }

    // Channel for Android
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('appointments-alerts', {
          name: 'Alertas de Citas',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF4FA3',
        });
      } catch (e) {
        console.warn('notificationService: error creando canal', e);
      }
    }

    // Permissions
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('notificationService: permiso denegado');
        return null;
      }
    } catch (e) {
      console.error('notificationService: error al pedir permisos', e);
      return null;
    }

    // Get Expo push token
    try {
      const projectId =
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.expoConfig?.owner;

      if (!projectId) {
        console.warn(
          'notificationService: no se pudo determinar el projectId. Define EXPO_PUBLIC_EAS_PROJECT_ID en .env'
        );
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      console.log('notificationService: token obtenido:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.error('notificationService: error obteniendo el push token:', error);
      return null;
    }
  },
};

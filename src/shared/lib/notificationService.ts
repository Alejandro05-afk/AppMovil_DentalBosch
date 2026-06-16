import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const notificationService = {
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    if (!Platform.isBackground && Platform.OS === 'web') return null;

    const mod = await import('expo-notifications');
    const Notifications = mod.default ?? mod;

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch {
      // Not available in Expo Go on Android (SDK 53+)
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('appointments-alerts', {
        name: 'Alertas de Citas',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4FA3',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permiso de notificaciones push denegado');
      return null;
    }

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.expoConfig?.owner ??
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

      if (!projectId) {
        console.warn('No se pudo determinar el projectId para Expo Push. Define EXPO_PUBLIC_EAS_PROJECT_ID en .env');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      return tokenData.data;
    } catch (error) {
      console.error('Error obteniendo el push token de Expo:', error);
      return null;
    }
  },
};

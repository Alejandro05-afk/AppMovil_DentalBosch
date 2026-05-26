

```markdown
---
name: expo-notifications-setup
description: >
  Úsalo cuando el usuario necesite configurar, registrar u otorgar soporte para 
  notificaciones push/locales a través de expo-notifications en DentalBosch.
  Se activa ante menciones de: "enviar notificación al doctor", "notificar cancelación",
  "configurar expo-notifications", "token de notificaciones push", o "guardar push token en la base de datos".
  Genera la infraestructura necesaria en la capa shared (para utilitarios globales y hooks de registro)
  y en entities/user para persistir el token en el backend.
---

# Skill: Notificaciones Push con Expo Notifications — DentalBosch

Este skill proporciona la arquitectura guiada para registrar dispositivos móviles mediante tokens push (`ExpoPushToken`), configurar canales de alta prioridad (cruciales para avisos de agenda/cancelación instantáneos) y manejar la recepción de eventos tanto en primer plano como en segundo plano.

---

## 1. Arquitectura FSD a Implementar

La gestión de notificaciones requiere de un servicio compartido y hooks de inicialización global. Sigue esta distribución bajo `src/`:


```

src/
├── entities/
│   └── user/
│       └── api/
│           └── user.service.ts         ← Extensión para guardar el pushToken en el backend
├── shared/
│   ├── lib/
│   │   └── notificationService.ts      ← Configuración nativa de Expo, Canales y Permisos
│   └── hooks/
│       └── usePushNotifications.ts     ← Hook global para inicializar y escuchar eventos en la app

```

---

## 2. Configuración del Servicio de Permisos y Canales

Este módulo encapsula la petición de permisos nativos al sistema operativo (iOS/Android) y crea un canal con la máxima prioridad visual y auditiva para alertas médicas urgentes.

**Archivo:** `src/shared/lib/notificationService.ts`

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuración por defecto del comportamiento en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  /**
   * Solicita permisos y extrae el token único del dispositivo para notificaciones push.
   */
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    if (!Platform.isBackground && Platform.OS === 'web') return null;

    // Configuración obligatoria del canal de notificaciones en Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('appointments-alerts', {
        name: 'Alertas de Citas',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4FA3', // Color primario de DentalBosch
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('¡Permiso de notificaciones push denegado!');
      return null;
    }

    try {
      // Extrae el ID del proyecto desde la configuración de Expo
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.expoConfig?.owner;
      
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      return tokenData.data;
    } catch (error) {
      console.error('Error obteniendo el push token de Expo:', error);
      return null;
    }
  },
};

```

---

## 3. Persistencia del Token en el Servidor (Entities)

El servidor necesita conocer el token de cada usuario para enviarle la alerta correspondiente cuando un paciente agende o cancele.

**Archivo:** `src/entities/user/api/user.service.ts`

```typescript
import { apiClient } from '@/shared/api/apiClient';

export const userService = {
  /**
   * Sincroniza el token del dispositivo actual con la cuenta activa del Doctor o Paciente.
   */
  updatePushToken: async (pushToken: string): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<{ success: boolean }>('/user/push-token', {
      token: pushToken,
    });
    return response.data;
  },
};

```

---

## 4. Hook de Escucha Global (Shared Hooks)

Este Hook centraliza el registro inicial de la app y define los listeners interactivos. Captura los eventos de notificación cuando la app está abierta o cuando el usuario presiona el banner para redirigirse al módulo de citas.

**Archivo:** `src/shared/hooks/usePushNotifications.ts`

```typescript
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../lib/notificationService';
import { userService } from '@/entities/user/api/user.service';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // 1. Registrar dispositivo y enviar token al backend
    notificationService.registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        try {
          await userService.updatePushToken(token);
        } catch (err) {
          console.error('No se pudo registrar el push token en la API:', err);
        }
      }
    });

    // 2. Listener: Se ejecuta cuando llega la notificación con la app en primer plano (Foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    // 3. Listener: Se ejecuta cuando el usuario hace clic o interactúa con la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Datos adjuntos de la notificación pulsada:', data);
      
      // Aquí se puede procesar redirecciones lógicas en base a la payload enviada por el backend.
      // Ejemplo de payload: { screen: 'agendar', citaId: '123' }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return { expoPushToken, notification };
}

```

---

## 5. Vinculación en el Punto de Entrada de la App

Para garantizar que el dispositivo se registre apenas se inicie sesión o cargue la aplicación, el hook debe declararse dentro del Layout raíz.

**Modificación Sugerida en:** `app/_layout.tsx`

```tsx
import "../global.css";
import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { usePushNotifications } from '@/shared/hooks/usePushNotifications'; // ← NUEVO

export default function RootLayout() {
  // Inicializa el registro de notificaciones y listeners de eventos automáticamente
  usePushNotifications();

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(profile)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

```

---

## 6. Referencia de Carga Util (Payload de Backend Recomendada)

Para que las alertas al Doctor y al Paciente funcionen bajo este flujo automatizado, el backend montado en Render debe disparar las estructuras JSON con el siguiente formato hacia la API de Expo (`https://exp.host/--/api/v2/push/send`):

### Caso A: Alerta para el Doctor (Nueva Cita Agendada)

```json
{
  "to": "ExponentPushToken[DOCTOR_TOKEN_AQUÍ]",
  "sound": "default",
  "title": "📅 Nueva Cita Agendada",
  "body": "El paciente Juan Pérez reservó una consulta para el 28 de mayo a las 10:00 AM.",
  "data": { "tipoEvento": "NUEVA_CITA", "citaId": "6a037d8f3d9d21fa8b6712cf" }
}

```

### Caso B: Alerta para el Doctor/Paciente (Cita Cancelada)

```json
{
  "to": "ExponentPushToken[DOCTOR_O_PACIENTE_TOKEN_AQUÍ]",
  "sound": "default",
  "title": "❌ Cita Cancelada",
  "body": "La cita programada para el 28 de mayo ha sido cancelada por el paciente.",
  "data": { "tipoEvento": "CITA_CANCELADA", "citaId": "6a037d8f3d9d21fa8b6712cf" }
}

```

```
================================================

### 🛠️ Recuerda antes de ejecutar:
Instala la biblioteca base nativa en caso de que no figure en las dependencias principales del proyecto con:
```bash
npx expo install expo-notifications

```

Esto asegurará que las versiones de Android e iOS se mantengan sincronizadas exactamente con tu core de **Expo v54**.
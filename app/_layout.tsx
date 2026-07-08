import { AuthProvider, useAuth } from '@/shared/contexts/AuthContext';
import { usePushNotifications } from '@/shared/hooks/usePushNotifications';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { TamaguiAppProvider } from '@/shared/ui/TamaguiAppProvider';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import performance from 'react-native-performance';
import 'react-native-reanimated';
import "../global.css";


performance.mark('app_start');

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

function AppNavigator() {
  const { isLoading } = useAuth();
  usePushNotifications();

  useEffect(() => {
    performance.mark('app_ready');
    performance.measure('tiempo_arranque', 'app_start', 'app_ready');
    const entradas = performance.getEntriesByName('tiempo_arranque');
    console.log(`🚀 DentalBosch cargó por completo en: ${entradas[0].duration.toFixed(2)} ms`);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(profile)" options={{ headerShown: false }} />
        <Stack.Screen name="historial/index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <TamaguiAppProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </TamaguiAppProvider>
  );
}

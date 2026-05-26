import "../global.css";
import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TamaguiAppProvider } from '@/shared/ui/TamaguiAppProvider';
import { usePushNotifications } from '@/shared/hooks/usePushNotifications';

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

export default function RootLayout() {
  usePushNotifications();
  return (
    <TamaguiAppProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(profile)" options={{ headerShown: false }} />
          <Stack.Screen name="historial" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </TamaguiAppProvider>
  );
}

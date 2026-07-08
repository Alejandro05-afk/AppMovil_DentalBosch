import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/shared/contexts/AuthContext';

export default function ProfileLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}

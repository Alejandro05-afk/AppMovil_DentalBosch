import { Platform, TurboModuleRegistry } from 'react-native';
import { authStorage } from './authStorage';
import { publicApiClient } from './apiClient';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

// TurboModule — no requiere importar el JS wrapper que crashea en Expo Go
const RNGoogleSignin: any = TurboModuleRegistry.get('RNGoogleSignin');

export async function signInWithGoogle(): Promise<boolean> {
  if (!RNGoogleSignin) {
    console.warn('Google Sign-In no disponible (RNGoogleSignin no registrado)');
    return false;
  }

  try {
    RNGoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

    if (Platform.OS === 'android') {
      await RNGoogleSignin.hasPlayServices();
    }

    const userInfo = await RNGoogleSignin.signIn();
    const idToken = userInfo.idToken ?? userInfo.data?.idToken;
    if (!idToken) return false;

    const response = await publicApiClient.post<any>('/auth/google/mobile', { id_token: idToken });
    const token = response.data?.token || response.data?.data?.token;
    if (token) {
      await authStorage.setToken(token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Google sign-in error:', error);
    return false;
  }
}

export async function signOut(): Promise<void> {
  try {
    if (RNGoogleSignin) await RNGoogleSignin.signOut();
  } catch (error) {
    console.error('Google sign-out error:', error);
  }
  await authStorage.removeToken();
}

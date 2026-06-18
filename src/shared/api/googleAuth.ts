import * as Google from 'expo-auth-session/providers/google';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { publicApiClient } from './apiClient';
import { authStorage } from './authStorage';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || WEB_CLIENT_ID;
const PROXY_REDIRECT_URL = 'https://auth.expo.io/@alejoafk_05/dentalbosch';

export function useGoogleAuth(onSuccess?: () => void) {
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectUrl = Linking.createURL('');
  
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    expoClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    redirectUri: redirectUrl,
  });

  useEffect(() => {
    const handleGoogleResponse = async (idToken: string) => {
      setGoogleLoading(true);
      try {
        const res = await publicApiClient.post('/auth/google/mobile', { id_token: idToken });
        const token = res.data?.token || res.data?.data?.token;
        if (token) {
          await authStorage.setToken(token);
          onSuccess?.();
        } else {
          Alert.alert('Error', res.data?.mensaje || 'Error al iniciar sesión con Google');
        }
      } catch (error: any) {
        console.error('Google auth backend error:', error);
        Alert.alert('Error', error.response?.data?.mensaje || 'Error de conexión con el servidor');
      } finally {
        setGoogleLoading(false);
      }
    };

    if (response?.type === 'success' && response.params?.id_token) {
      handleGoogleResponse(response.params.id_token);
    } else if (response?.type === 'error') {
      setGoogleLoading(false);
      Alert.alert('Error de autenticación', 'No se pudo completar el login con Google.');
    }
  }, [response, onSuccess]);

  return {
    promptAsync,
    googleLoading,
    disabled: !request,
  };
}

export async function signOut(): Promise<void> {
  await authStorage.removeToken();
}

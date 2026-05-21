import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar de forma defensiva si las credenciales son válidas y no son los placeholders
const isConfigured = 
  supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  supabaseUrl !== 'TU_SUPABASE_URL_AQUI';

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Se maneja de forma manual a través de expo-linking
      },
    })
  : null;

// Auto-refresco de tokens al volver a poner la app en primer plano (solo si está configurado)
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

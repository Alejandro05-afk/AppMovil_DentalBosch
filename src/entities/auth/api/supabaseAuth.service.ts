import { supabase } from '@/shared/api/supabaseClient';
import { publicApiClient } from '@/shared/api/apiClient';
import { RegisterRequest, LoginRequest, AuthResponse, UserProfile } from '../model/auth.types';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Habilita que el navegador de autenticación se cierre correctamente en plataformas web
WebBrowser.maybeCompleteAuthSession();

// Función auxiliar para comprobar de forma defensiva que Supabase esté inicializado
function checkSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Por favor, asegúrate de añadir las credenciales válidas EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env y reiniciar el servidor de desarrollo.'
    );
  }
  return supabase;
}

// Función auxiliar para extraer parámetros de la URL de redirección en React Native de forma robusta
function getParamFromUrl(url: string, param: string): string | null {
  const cleanUrl = url.replace('#', '?');
  const match = RegExp('[?&]' + param + '=([^&]*)').exec(cleanUrl);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}

function getSupabaseErrorMessage(error: any): string {
  const status = error?.status ? ` (${error.status})` : '';
  const code = error?.code ? ` [${error.code}]` : '';
  const message = error?.message || 'Error desconocido de Supabase';
  return `${message}${status}${code}`;
}

export const supabaseAuthService = {
  // Registro de usuario en Supabase Auth
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const client = checkSupabase();
    const { data: signUpData, error } = await client.auth.signUp({
      email: data.email,
      password: data.password || 'TemporaryPassword123!', // En caso de que no se provea contraseña
      options: {
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          cedula: data.cedula,
          telefono: data.telefono,
          fechaNacimiento: data.fechaNacimiento,
          genero: data.genero,
          rol: data.rol || 'paciente',
          direccion: data.direccion,
          contactoEmergencia: data.contactoEmergencia,
        },
      },
    });

    if (error) {
      throw error;
    }

    return {
      token: signUpData.session?.access_token || '',
      user: signUpData.user,
      mensaje: 'Usuario creado y registrado exitosamente en Supabase',
    };
  },

  // Inicio de sesión clásico con correo y contraseña
  async login(data: LoginRequest): Promise<AuthResponse> {
    const client = checkSupabase();
    const { data: signInData, error } = await client.auth.signInWithPassword({
      email: data.email,
      password: data.password || '',
    });

    if (error) {
      throw error;
    }

    return {
      token: signInData.session?.access_token || '',
      user: signInData.user,
      mensaje: 'Inicio de sesión exitoso',
    };
  },

  // Cierre de sesión
  async logout(): Promise<void> {
    const client = checkSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  // Recuperación de contraseña (envía correo para restablecer)
  async recuperarPassword(email: string): Promise<any> {
    const client = checkSupabase();
    const resetUrl = process.env.EXPO_PUBLIC_RESET_PASSWORD_URL || Linking.createURL('/(auth)/reset-password');
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    });

    if (error) {
      console.error('Supabase recovery email error:', {
        message: error.message,
        status: (error as any).status,
        code: (error as any).code,
        redirectTo: resetUrl,
      });

      if ((error as any).status >= 500) {
        const { error: fallbackError } = await client.auth.resetPasswordForEmail(email);
        if (!fallbackError) {
          return {
            mensaje: 'Se ha enviado un correo electrónico para restablecer tu contraseña',
          };
        }

        console.error('Supabase recovery email fallback error:', {
          message: fallbackError.message,
          status: (fallbackError as any).status,
          code: (fallbackError as any).code,
        });
      }

      throw new Error(
        `No se pudo enviar el correo de recuperacion desde Supabase: ${getSupabaseErrorMessage(error)}. Verifica SMTP, URL Configuration y el template Reset Password en Supabase.`
      );
    }

    return {
      mensaje: 'Se ha enviado un correo electrónico para restablecer tu contraseña',
    };
  },

  // Social Login con Google usando OAuth integrado
  async loginWithGoogle(): Promise<AuthResponse> {
    const client = checkSupabase();
    // Generar la URL de redirección profunda de la app
    const redirectUrl = Linking.createURL('/(tabs)');
    
    // Iniciar el flujo de OAuth con Supabase
    const { data: authData, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      if (error.message?.includes('provider is not enabled')) {
        throw new Error(
          'El inicio de sesión con Google no está habilitado. Activá el proveedor Google en el panel de Autenticación de Supabase.'
        );
      }
      throw error;
    }

    if (!authData?.url) {
      throw new Error('No se pudo generar la URL de autenticación de Google. Verificá que las credenciales de Supabase sean correctas.');
    }

    // Abrir el navegador en el dispositivo móvil y esperar el resultado del inicio de sesión
    const result = await WebBrowser.openAuthSessionAsync(authData.url, redirectUrl);

    if (result.type === 'success') {
      const access_token = getParamFromUrl(result.url, 'access_token');
      const refresh_token = getParamFromUrl(result.url, 'refresh_token');

      if (access_token && refresh_token) {
        // Establecer la sesión activa en el cliente de Supabase
        const { error: sessionError } = await client.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          throw sessionError;
        }

        // Sincronizar metadatos de Google a formato local
        const { data: { user } } = await client.auth.getUser();
        let nombre = '';
        let apellido = '';
        if (user) {
          const meta = user.user_metadata || {};
          nombre = meta.nombre || meta.given_name || meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || '';
          const fullNameRest = meta.full_name?.split(' ').slice(1).join(' ') || meta.name?.split(' ').slice(1).join(' ') || '';
          apellido = meta.apellido || meta.family_name || fullNameRest;
          const updates: Record<string, string> = {};
          if (!meta.nombre && nombre) updates.nombre = nombre;
          if (!meta.apellido && apellido) updates.apellido = apellido;
          if (!meta.rol) updates.rol = 'paciente';
          if (Object.keys(updates).length > 0) {
            await client.auth.updateUser({ data: updates });
          }
        }

        // Flujo híbrido: obtener JWT del backend para llamadas API
        const userEmail = user?.email || '';
        const extractToken = (resp: any): string => {
          const d = resp?.data;
          return d?.token || d?.datos?.token || d?.data?.token || d?.access_token || '';
        };
        let finalToken = access_token;
        if (userEmail) {
          // 1) Registrar al usuario en el backend con datos placeholder
          try {
            const r1 = await publicApiClient.post('/auth/registro', {
              email: userEmail,
              password: 'GoogleAuth_' + access_token.substring(0, 12),
              nombre: nombre || userEmail.split('@')[0],
              apellido,
              rol: 'paciente',
              cedula: '0010000000',
              telefono: '8090000000',
              fechaNacimiento: '2000-01-01',
              genero: 'masculino',
              direccion: { calle: 'SIN_REGISTRO', ciudad: 'Santo Domingo', provincia: 'Santo Domingo' },
              contactoEmergencia: { nombre: 'SIN_REGISTRO', telefono: '8090000001', parentesco: 'familiar' },
            });
            const t1 = extractToken(r1);
            if (t1) { finalToken = t1; console.log('[Hybrid] Token obtenido vía register'); }
          } catch (e: any) {
            console.log('[Hybrid] Register falló:', e.response?.status, e.response?.data);
          }
          // 2) Si register falló (usuario ya existe), intentar login
          if (finalToken === access_token) {
            const tempPassword = 'GoogleAuth_' + access_token.substring(0, 12);
            try {
              const r2 = await publicApiClient.post('/auth/login', {
                email: userEmail,
                password: tempPassword,
              });
              const t2 = extractToken(r2);
              if (t2) { finalToken = t2; console.log('[Hybrid] Token obtenido vía login'); }
            } catch (e: any) {
              console.log('[Hybrid] Login falló:', e.response?.status, e.response?.data);
            }
          }
          console.log('[Hybrid] Token final obtenido:', finalToken ? finalToken.substring(0, 20) + '...' : 'ninguno');
        }

        const needsBackendAuth = !!(userEmail && finalToken === access_token);

        return {
          token: finalToken,
          user: user ? { ...user, user_metadata: { ...user.user_metadata, rol: user.user_metadata?.rol || 'paciente' } } : undefined,
          mensaje: 'Autenticación con Google exitosa',
          email: userEmail,
          needsBackendAuth,
        } as any;
      } else {
        throw new Error('No se recibieron los tokens de autenticación en la URL de retorno');
      }
    } else {
      if (result.type === 'cancel') {
        throw new Error('El usuario canceló el inicio de sesión con Google');
      }
      throw new Error(
        `El inicio de sesión con Google no pudo completarse (${result.type}). Verificá que la URL de redirección esté agregada en Supabase: ${redirectUrl}`
      );
    }
  },

  // Obtener perfil básico del usuario autenticado
  async getProfile(): Promise<UserProfile> {
    const client = checkSupabase();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) {
      throw error || new Error('No hay una sesión activa de usuario');
    }

    const metadata = user.user_metadata || {};
    const nombre = metadata.nombre || metadata.given_name || metadata.full_name?.split(' ')[0] || metadata.name?.split(' ')[0] || '';
    const fullNameRest = metadata.full_name?.split(' ').slice(1).join(' ') || metadata.name?.split(' ').slice(1).join(' ') || '';
    const apellido = metadata.apellido || metadata.family_name || fullNameRest;
    return {
      _id: user.id,
      nombre,
      apellido,
      email: user.email || '',
      rol: metadata.rol || 'paciente',
      cedula: metadata.cedula || '',
      telefono: metadata.telefono || '',
      fechaNacimiento: metadata.fechaNacimiento || '',
      genero: metadata.genero || '',
      direccion: metadata.direccion,
      contactoEmergencia: metadata.contactoEmergencia,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
    };
  },
};

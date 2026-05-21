import { apiClient, publicApiClient } from '@/shared/api/apiClient';
import { RegisterRequest, LoginRequest, AuthResponse } from '../model/auth.types';
import { UserProfile } from '@/entities/user/model/user.types';
import { DoctorProfile } from '@/entities/doctor/model/doctor.types';
import { supabaseAuthService } from './supabaseAuth.service';

const AUTH_PROVIDER = process.env.EXPO_PUBLIC_AUTH_PROVIDER || 'backend';

function formatDate(value: string): string {
  return value ? value.split('T')[0] : '';
}

function mapFullProfile(data: any): UserProfile {
  const usuario = data?.usuario || {};
  return {
    nombre: usuario.nombre || '',
    apellido: usuario.apellido || '',
    cedula: usuario.cedula || '',
    email: usuario.email || '',
    rol: usuario.rol || data.rol || '',
    fechaNacimiento: formatDate(data.fechaNacimiento),
    genero: data.genero || '',
    telefono: usuario.telefono || '',
    direccion:
      typeof data.direccion === 'string'
        ? { calle: data.direccion, ciudad: '', provincia: '' }
        : data.direccion || { calle: '', ciudad: '', provincia: '' },
    contactoEmergencia:
      typeof data.contactoEmergencia === 'string'
        ? { nombre: '', telefono: data.contactoEmergencia, parentesco: '' }
        : data.contactoEmergencia || { nombre: '', telefono: '', parentesco: '' },
    avatarUrl: usuario.foto || undefined,
  };
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseAuthService.register(data);
    }
    const response = await publicApiClient.post<any>('/auth/registro', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseAuthService.login(data);
    }
    const response = await publicApiClient.post<any>('/auth/login', data);
    return response.data;
  },

  async loginWithGoogle(): Promise<AuthResponse> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseAuthService.loginWithGoogle();
    }
    throw new Error('El inicio de sesión social con Google solo está soportado a través de Supabase en esta configuración.');
  },

  async logout(): Promise<void> {
    if (AUTH_PROVIDER === 'supabase') {
      await supabaseAuthService.logout();
    }
    // Para backend se maneja principalmente limpiando el almacenamiento local
  },

  async getProfile(): Promise<UserProfile> {
    if (AUTH_PROVIDER === 'supabase') {
      const profile = await supabaseAuthService.getProfile();
      return profile as any;
    }
    const response = await apiClient.get<any>('/auth/perfil');
    const data = response.data?.data || response.data?.datos || response.data;
    return {
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      rol: data.rol || '',
      avatarUrl: data.foto || undefined,
    } as UserProfile;
  },

  async getFullProfile(): Promise<UserProfile> {
    const response = await apiClient.get<any>('/pacientes/perfil/paciente');
    return mapFullProfile(response.data.datos);
  },

  async getDoctorProfile(): Promise<DoctorProfile> {
    const response = await apiClient.get<any>('/doctores/perfil/doctor');
    return response.data.data;
  },

  async actualizarPerfilDoctor(data: Partial<DoctorProfile>): Promise<DoctorProfile> {
    const response = await apiClient.put<any>('/doctores/perfil/doctor', data);
    return response.data.data;
  },

  async recuperarPassword(email: string): Promise<any> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseAuthService.recuperarPassword(email);
    }
    const response = await publicApiClient.post<any>('/auth/recuperar-password', { email });
    return response.data;
  },

  async verificarCodigo(codigo: string): Promise<any> {
    const response = await publicApiClient.post<any>('/auth/verificar-codigo', { codigo });
    return response.data;
  },

  async restablecerPassword(codigo: string, password: string): Promise<any> {
    if (AUTH_PROVIDER === 'supabase') {
      const supabase = (await import('@/shared/api/supabaseClient')).supabase;
      if (!supabase) throw new Error('Supabase no está configurado');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { mensaje: 'Contraseña actualizada exitosamente' };
    }
    const response = await publicApiClient.post<any>('/auth/restablecer-password', { codigo, password });
    return response.data;
  },

  async actualizarPassword(passwordActual: string, passwordNuevo: string): Promise<any> {
    const response = await apiClient.put<any>('/auth/actualizar-password', { passwordActual, passwordNuevo });
    return response.data;
  },

  async actualizarPerfil(data: any): Promise<void> {
    const payload: Record<string, any> = {
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      fechaNacimiento: data.fechaNacimiento,
      genero: data.genero,
      email: data.email,
      cedula: data.cedula,
    };
    if (data.direccion) {
      payload.direccion =
        typeof data.direccion === 'string'
          ? data.direccion
          : data.direccion;
    }
    if (data.contactoEmergencia) {
      payload.contactoEmergencia =
        typeof data.contactoEmergencia === 'string'
          ? data.contactoEmergencia
          : data.contactoEmergencia;
    }
    await apiClient.put<any>('/pacientes/perfil/paciente', payload);
  },
};

import { apiClient } from '@/shared/api/apiClient';
import { RegisterRequest, LoginRequest, AuthResponse, UserProfile } from '../model/auth.types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/registro', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/login', data);
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<any>('/auth/perfil');
    // El backend devuelve { success: true, data: { ...perfil } }
    return response.data.data;
  },

  async recuperarPassword(email: string): Promise<any> {
    const response = await apiClient.post<any>('/auth/recuperar-password', { email });
    return response.data;
  },

  async verificarCodigo(codigo: string): Promise<any> {
    const response = await apiClient.post<any>('/auth/verificar-codigo', { codigo });
    return response.data;
  },

  async restablecerPassword(codigo: string, password: string): Promise<any> {
    const response = await apiClient.post<any>('/auth/restablecer-password', { codigo, password });
    return response.data;
  },

  async actualizarPassword(passwordActual: string, passwordNuevo: string): Promise<any> {
    const response = await apiClient.put<any>('/auth/actualizar-password', { passwordActual, passwordNuevo });
    return response.data;
  },

  async actualizarPerfil(data: any): Promise<UserProfile> {
    const response = await apiClient.put<any>('/pacientes/perfil/paciente', data);
    return response.data.data;
  },
};

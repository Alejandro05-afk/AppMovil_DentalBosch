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
};

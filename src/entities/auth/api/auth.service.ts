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
};

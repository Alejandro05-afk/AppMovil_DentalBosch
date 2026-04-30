import axios from 'axios';
import { authStorage } from './authStorage';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-dental-bosch-vr8o.onrender.com/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token en cada petición
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Manejo global de errores (opcional)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Aquí puedes manejar errores de token expirado (ej. 401)
    if (error.response?.status === 401) {
      // await authStorage.removeToken();
      // lógica para redirigir a login si es necesario
    }
    return Promise.reject(error);
  }
);

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from '@/shared/api/authStorage';
import { authService } from '@/entities/auth/api/auth.service';
import { router } from 'expo-router';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const checkAuth = async () => {
    try {
      const token = await authStorage.getToken();
      if (token) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          setIsAuthenticated(true);
        } catch (err: any) {
          if (err?.response?.status === 401) {
            // Token inválido o expirado
            await authStorage.removeToken();
            setIsAuthenticated(false);
          } else {
            // Error de red o servidor caído — no cerrar sesión
            setIsAuthenticated(true);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    await authStorage.setToken(token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authStorage.removeToken();
    setIsAuthenticated(false);
    setUser(null);
    router.replace('/(auth)/login');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  verifyOtpAndReset: (email: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          // Verify token and fetch user profile
          const res = await api.get('/auth/profile');
          setUser(res.data);
        }
      } catch (error) {
        console.error('Failed to load user', error);
        await SecureStore.deleteItemAsync('userToken');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, ...userData } = res.data;
      await SecureStore.setItemAsync('userToken', token);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    try {
      const payload: any = { name, email, password };
      if (role) payload.role = role;
      const res = await api.post('/auth/register', payload);
      const { token, ...userData } = res.data;
      await SecureStore.setItemAsync('userToken', token);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const requestOtp = async (email: string) => {
    try {
      await api.post('/auth/request-otp', { email });
    } catch (error) {
      throw error;
    }
  };

  const verifyOtpAndReset = async (email: string, otp: string, newPassword: string) => {
    try {
      await api.post('/auth/verify-otp', { email, otp, newPassword });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, requestOtp, verifyOtpAndReset, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

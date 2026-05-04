import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';


const api = axios.create({
  baseURL: 'https://zee-mob.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the auth token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your deployed Render/Railway URL
export const BASE_URL = 'https://your-app.onrender.com/api';

export const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiRequest = async (method, endpoint, body = null) => {
  const headers = await getHeaders();
  const config  = { method, headers };
  if (body) config.body = JSON.stringify(body);
  const res  = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

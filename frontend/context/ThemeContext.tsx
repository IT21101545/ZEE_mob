import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  warning: string;
  inputBackground: string;
}

interface ThemeContextData {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: '#f4f4f4',
  card: '#fff',
  text: '#333',
  textMuted: '#8E8E93',
  border: '#ddd',
  primary: '#007AFF',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FFCC00',
  inputBackground: '#f9f9f9',
};

const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1C1C1E',
  text: '#fff',
  textMuted: '#8E8E93',
  border: '#3A3A3C',
  primary: '#0A84FF',
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FFD60A',
  inputBackground: '#2C2C2E',
};

const ThemeContext = createContext<ThemeContextData>({
  isDarkMode: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme) {
          setIsDarkMode(storedTheme === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('app_theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { theme } from '../theme';
import { useThemeStore } from '../services/store';

export const useAppTheme = () => {
  const { mode, useSystemTheme } = useThemeStore();
  const systemTheme = useColorScheme();
  
  // Menentukan apakah tema saat ini adalah dark mode
  const isDarkMode = useMemo(() => {
    if (useSystemTheme) {
      return systemTheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemTheme, useSystemTheme]);
  
  // Mendapatkan tema yang sesuai berdasarkan mode
  const currentTheme = useMemo(() => {
    // Untuk saat ini, kita hanya memiliki tema light
    // Implementasi tema dark akan ditambahkan nanti
    return theme;
  }, [isDarkMode]);
  
  return {
    theme: currentTheme,
    isDarkMode,
  };
};

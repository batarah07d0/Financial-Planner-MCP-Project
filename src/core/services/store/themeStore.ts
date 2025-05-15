import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  useSystemTheme: boolean;
  motionDetectionEnabled: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setUseSystemTheme: (useSystem: boolean) => void;
  setMotionDetectionEnabled: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      useSystemTheme: true,
      motionDetectionEnabled: false,

      setThemeMode: (mode) => {
        set({ mode, useSystemTheme: mode === 'system' });
      },

      toggleThemeMode: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        set({ mode: newMode, useSystemTheme: false });
      },

      setUseSystemTheme: (useSystem) => {
        set({
          useSystemTheme: useSystem,
          mode: useSystem ? 'system' : get().mode,
        });
      },

      setMotionDetectionEnabled: (enabled) => {
        set({ motionDetectionEnabled: enabled });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

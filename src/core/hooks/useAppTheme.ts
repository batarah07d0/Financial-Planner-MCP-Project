import { theme } from '../theme';

export const useAppTheme = () => {
  // Selalu menggunakan light theme
  return {
    theme,
    isDarkMode: false,
  };
};

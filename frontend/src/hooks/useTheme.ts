import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';

export const useTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark' || true; // Default dark theme for Web3/Crypto aesthetics
  const colors = isDark ? Colors.dark : Colors;

  return {
    isDark,
    colors,
  };
};

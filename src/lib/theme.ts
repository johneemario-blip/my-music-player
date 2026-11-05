import { useColorScheme } from 'react-native';

export interface Theme {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  separator: string;
  highlight: string;
  danger: string;
}

// Text/background pairs keep a contrast ratio of at least 4.5:1 in both schemes.
const light: Theme = {
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#1C1C1E',
  textMuted: '#5A5A5F',
  accent: '#0A60D0',
  onAccent: '#FFFFFF',
  separator: '#D1D1D6',
  highlight: '#E3EEFC',
  danger: '#B3261E',
};

const dark: Theme = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#F2F2F7',
  textMuted: '#AEAEB2',
  accent: '#4C9BFF',
  onAccent: '#000000',
  separator: '#38383A',
  highlight: '#13284A',
  danger: '#FF8A80',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

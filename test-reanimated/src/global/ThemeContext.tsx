import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, AppTheme } from './themes';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: AppTheme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  theme: darkTheme,
  toggleTheme: () => {},
  setMode: () => {},
});

const STORAGE_KEY = '@baza_theme_mode';

// ─── Provider ────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  // Carregar preferência guardada
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'dark' || stored === 'light') setModeState(stored);
      setLoaded(true);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m);
  };

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  if (!loaded) return null; // aguarda carregar do storage

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useTheme() {
  return useContext(ThemeContext);
}

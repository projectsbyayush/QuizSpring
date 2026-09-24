import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { darkTheme, lightTheme } from '../theme';

type ColorMode = 'light' | 'dark';

interface ColorModeState {
  mode: ColorMode;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeState | undefined>(undefined);

function getInitialMode(): ColorMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem('quizspring.color-mode');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    return 'light';
  }
  return 'light';
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(getInitialMode);

  useEffect(() => {
    try {
      window.localStorage.setItem('quizspring.color-mode', mode);
    } catch {
      return;
    }
  }, [mode]);

  const value = useMemo<ColorModeState>(
    () => ({ mode, toggle: () => setMode((current) => (current === 'light' ? 'dark' : 'light')) }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeState {
  const context = useContext(ColorModeContext);
  if (!context) throw new Error('useColorMode must be used within ColorModeProvider');
  return context;
}

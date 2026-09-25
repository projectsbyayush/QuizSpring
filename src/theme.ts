import { createTheme, responsiveFontSizes, type ThemeOptions } from '@mui/material/styles';

const fontStack = ['Inter', 'Public Sans', 'system-ui', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'].join(',');

function buildTheme(mode: 'light' | 'dark') {
  const light = mode === 'light';
  const options: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: light ? '#0071e3' : '#4da3ff',
        light: light ? '#3395f0' : '#7cc0ff',
        dark: light ? '#0058b0' : '#1f6fd6',
        contrastText: '#ffffff',
      },
      secondary: {
        main: light ? '#6d28d9' : '#a78bfa',
        light: light ? '#8b5cf6' : '#c4b5fd',
        dark: light ? '#4c1d95' : '#7c3aed',
        contrastText: light ? '#ffffff' : '#171321',
      },
      background: {
        default: light ? '#f5f5f7' : '#11151d',
        paper: light ? '#ffffff' : '#181e29',
      },
      text: {
        primary: light ? '#1d1d1f' : '#e9edf4',
        secondary: light ? '#6e6e73' : '#a7b1c4',
      },
      divider: light ? 'rgba(0,0,0,0.09)' : 'rgba(148,163,184,0.22)',
      success: { main: light ? '#1f9d4d' : '#4cd964' },
      warning: { main: light ? '#ff9f0a' : '#ffb020' },
      error: { main: light ? '#ff3b30' : '#ff6b62' },
      info: { main: light ? '#0a84ff' : '#5eb0ff' },
    },
    typography: {
      fontFamily: fontStack,
      h1: { fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 },
      h2: { fontWeight: 750, letterSpacing: '-0.03em', lineHeight: 1.1 },
      h3: { fontWeight: 750, letterSpacing: '-0.025em', lineHeight: 1.15 },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 650 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
      button: { textTransform: 'none', fontWeight: 650, letterSpacing: 0 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
            overflowX: 'clip',
            scrollbarWidth: 'thin',
            scrollbarColor: light ? '#7cc0ff transparent' : '#4da3ff transparent',
          },
          img: { maxWidth: '100%' },
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: light ? '#7cc0ff' : '#4da3ff',
            borderRadius: 99,
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: light ? '#3395f0' : '#7cc0ff',
            backgroundClip: 'content-box',
          },
          '::selection': { background: light ? 'rgba(0,113,227,0.2)' : 'rgba(77,163,255,0.28)' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 10,
            paddingBottom: 10,
            minHeight: 42,
          },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: light ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(148,163,184,0.18)',
            boxShadow: light
              ? '0 2px 4px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.05)'
              : '0 10px 28px rgba(2,6,16,0.45)',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: { rounded: { borderRadius: 12 } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8, fontWeight: 650 } },
      },
      MuiLink: {
        defaultProps: { underline: 'none' },
        styleOverrides: {
          root: {
            fontWeight: 600,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'none' },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: light ? '#f5f5f7' : '#202839',
            '& fieldset': { borderColor: 'transparent' },
            '&:hover fieldset': { borderColor: light ? 'rgba(0,113,227,0.4)' : 'rgba(77,163,255,0.45)' },
            '&.Mui-focused fieldset': { borderColor: light ? '#0071e3' : '#4da3ff' },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: light ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(148,163,184,0.18)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: { head: { fontWeight: 700, whiteSpace: 'nowrap' } },
      },
    },
  };
  return responsiveFontSizes(createTheme(options));
}

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');

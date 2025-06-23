import { createTheme } from '@mui/material/styles';

export const premiumTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EC4899', // Pink
      light: '#F472B6',
      dark: '#DB2777',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#0A0A0B',
      paper: '#111113',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      disabled: '#6B7280',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.875rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      fontSize: '0.95rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.2)',
    '0px 4px 8px rgba(0, 0, 0, 0.3)',
    '0px 8px 16px rgba(0, 0, 0, 0.4)',
    '0px 12px 24px rgba(0, 0, 0, 0.5)',
    '0px 16px 32px rgba(0, 0, 0, 0.6)',
    '0px 20px 40px rgba(0, 0, 0, 0.7)',
    '0px 24px 48px rgba(0, 0, 0, 0.8)',
    '0px 32px 64px rgba(0, 0, 0, 0.9)',
    '0 0 0 1px rgba(255, 255, 255, 0.05), 0px 2px 4px rgba(0, 0, 0, 0.2)',
    '0 0 0 1px rgba(255, 255, 255, 0.05), 0px 4px 8px rgba(0, 0, 0, 0.3)',
    '0 0 0 1px rgba(255, 255, 255, 0.05), 0px 8px 16px rgba(0, 0, 0, 0.4)',
    '0 0 0 1px rgba(255, 255, 255, 0.05), 0px 12px 24px rgba(0, 0, 0, 0.5)',
    '0 0 0 1px rgba(255, 255, 255, 0.05), 0px 16px 32px rgba(0, 0, 0, 0.6)',
    '0 0 0 1px rgba(255, 255, 255, 0.05), 0px 20px 40px rgba(0, 0, 0, 0.7)',
    '0 0 0 1px rgba(255, 255, 255, 0.05), 0px 24px 48px rgba(0, 0, 0, 0.8)',
    '0 0 0 1px rgba(255, 255, 255, 0.05), 0px 32px 64px rgba(0, 0, 0, 0.9)',
    '0 0 20px rgba(99, 102, 241, 0.4)',
    '0 0 40px rgba(99, 102, 241, 0.3)',
    '0 0 60px rgba(236, 72, 153, 0.3)',
    '0 0 80px rgba(236, 72, 153, 0.2)',
    '0 0 100px rgba(59, 130, 246, 0.2)',
    '0 0 120px rgba(59, 130, 246, 0.1)',
    '0 0 0 2px rgba(99, 102, 241, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)',
    '0 0 0 2px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.2)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'visible',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366F1',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10, 10, 11, 0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
});
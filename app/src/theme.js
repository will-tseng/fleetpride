import { createTheme } from '@mui/material/styles';
import { colors } from '@styles';

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
    },
    secondary: {
      main: colors.textSecondary,
      light: '#e9e9e9',
    },
    background: {
      default: colors.backgroundLight,
      paper: '#ffffff',
    },
    text: {
      primary: '#222222',
      secondary: colors.textSecondary,
    },
    success: {
      main: colors.success,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: '#0288d1', // Blue color for info alerts
    },
  },
  typography: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    h6: {
      fontWeight: 700,
      letterSpacing: 0.5,
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: 'none',
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: colors.borderLight,
          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: 'rgba(0, 164, 153, 0.04)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          display: 'flex',
          justifyContent: 'center',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          width: '100%',
          justifyContent: 'space-between',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px 0 rgba(99,102,106,0.08)',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 4px 16px 0 rgba(99,102,106,0.16)',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        maxWidthLg: {
          '@media (min-width:1280px)': {
            maxWidth: '1400px', // Increased from 1200px
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          transition: 'color 0.2s ease',
          '&:hover': {
            color: colors.primary,
          },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        li: {
          '& a': {
            '&:hover': {
              color: colors.primary,
            },
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: colors.primary,
            color: 'white',
            '&:hover': {
              backgroundColor: colors.primaryDark,
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 164, 153, 0.1)',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: colors.primary,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: 'rgba(0, 164, 153, 0.1)',
          color: colors.primary,
          '& .MuiAlert-icon': {
            color: colors.primary,
          },
        },
      },
    },
  },
});

export default theme;

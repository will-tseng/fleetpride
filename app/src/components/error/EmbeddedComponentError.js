import { Box, Typography, Button, Paper, useTheme } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

const EmbeddedComponentError = ({ 
  error, 
  resetErrorBoundary, 
  title = 'Component Failed to Load', 
  message = 'There was a problem loading this component. Please try again.',
  minHeight = '200px',
  variant = 'error' // 'error', 'warning', or 'info'
}) => {
  const theme = useTheme();
  
  // Define color schemes based on variant
  const colorSchemes = {
    error: {
      border: '#ffcdd2',
      background: '#fff8f8',
      iconColor: '#d32f2f',
      buttonColor: theme.palette.primary.main,
      buttonHoverColor: theme.palette.primary.dark
    },
    warning: {
      border: '#ffe0b2',
      background: '#fff8e1',
      iconColor: '#f57c00',
      buttonColor: theme.palette.primary.main,
      buttonHoverColor: theme.palette.primary.dark
    },
    info: {
      border: '#bbdefb',
      background: '#e3f2fd',
      iconColor: '#1976d2',
      buttonColor: theme.palette.primary.main,
      buttonHoverColor: theme.palette.primary.dark
    }
  };
  
  const colors = colorSchemes[variant] || colorSchemes.error;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        border: `1px solid ${colors.border}`, 
        borderRadius: 2, 
        backgroundColor: colors.background,
        textAlign: 'center',
        width: '100%',
        minHeight: minHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 40, color: colors.iconColor, mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {process.env.NODE_ENV === 'development' && error && (
        <Box sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: 'rgba(0,0,0,0.04)', 
          width: '90%', 
          borderRadius: 1,
          overflow: 'auto',
          textAlign: 'left',
          maxHeight: '120px'
        }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: colors.iconColor, fontSize: '0.75rem' }}>
            {error.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      <Button 
        startIcon={<RefreshIcon />}
        variant="contained" 
        size="small"
        onClick={resetErrorBoundary}
        sx={{ 
          mt: 1,
          backgroundColor: colors.buttonColor,
          '&:hover': { backgroundColor: colors.buttonHoverColor }
        }}
      >
        Reload Component
      </Button>
    </Paper>
  );
};

export default EmbeddedComponentError;

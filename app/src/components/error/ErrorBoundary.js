import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Box, Button, Typography, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { handleComponentError, getUserFriendlyError } from '@utils/errorHandling';

/**
 * Error fallback component that displays when a component throws an error
 */
function ErrorFallback({ error, resetErrorBoundary }) {
  // Get user-friendly error message from centralized error handling
  const friendlyError = getUserFriendlyError(error);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        m: 2,
        borderRadius: 2,
        backgroundColor: '#fff8f8',
        border: '1px solid #ffcdd2'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" component="h2" color="error" gutterBottom>
          {friendlyError.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: '600px' }}>
          {friendlyError.message}
        </Typography>
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{
            p: 2,
            mb: 3,
            bgcolor: 'background.default',
            width: '100%',
            borderRadius: 1,
            overflow: 'auto',
            textAlign: 'left'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#999', display: 'block', mb: 1 }}>
              Technical Details (Development Only):
            </Typography>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: '#d32f2f' }}>
              {error.message}
            </Typography>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: '#555', fontSize: '0.8rem' }}>
              {error.stack}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#999' }}>
              Error Type: {friendlyError.type} | Severity: {friendlyError.severity}
            </Typography>
          </Box>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={resetErrorBoundary}
          sx={{
            fontWeight: 600,
            mb: 2
          }}
        >
          {friendlyError.action || 'Try Again'}
        </Button>
        <Button
          variant="text"
          color="inherit"
          href="/"
          sx={{ color: 'text.secondary' }}
        >
          Return to Home Page
        </Button>
      </Box>
    </Paper>
  );
}

/**
 * Custom ErrorBoundary component that wraps the react-error-boundary library
 */
export default function ErrorBoundary({ 
  children, 
  onReset, 
  fallbackComponent, 
  componentName = 'Unknown',
  onError 
}) {
  const handleReset = () => {
    // Custom reset logic can go here (clearing caches, etc.)
    if (onReset) {
      onReset();
    }
  };

  const handleError = (error, info) => {
    // Use centralized component error handler
    const errorDetails = handleComponentError(error, info, componentName);

    // Dispatch a custom event for global error tracking
    const errorEvent = new CustomEvent('appComponentError', {
      detail: {
        error,
        info,
        componentName,
        errorDetails,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(errorEvent);

    // Call custom error handler if provided
    if (onError) {
      onError(error, info, componentName);
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallbackComponent || ErrorFallback}
      onReset={handleReset}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

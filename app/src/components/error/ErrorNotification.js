import React from 'react';
import { Snackbar, Alert, AlertTitle, Button, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getUserFriendlyError } from '@utils/errorHandling';

/**
 * Error notification component with automatic user-friendly messages
 */
export default function ErrorNotification({
  error,
  open,
  onClose,
  onRetry,
  autoHideDuration = 6000,
  position = { vertical: 'top', horizontal: 'center' }
}) {
  if (!error || !open) {
    return null;
  }

  const friendlyError = getUserFriendlyError(error);
  const { title, message, severity, canRetry } = friendlyError;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={position}
    >
      <Alert
        onClose={onClose}
        severity={severity === 'critical' || severity === 'high' ? 'error' : 'warning'}
        sx={{ width: '100%', minWidth: 300 }}
        action={
          canRetry && onRetry ? (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => {
                onRetry();
                onClose();
              }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Retry
            </Button>
          ) : null
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
        {process.env.NODE_ENV === 'development' && (
          <Box
            component="details"
            sx={{ mt: 1, fontSize: '0.85em', opacity: 0.8 }}
          >
            <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
            <pre style={{ fontSize: '0.9em', margin: '8px 0', whiteSpace: 'pre-wrap' }}>
              {friendlyError.technical}
            </pre>
          </Box>
        )}
      </Alert>
    </Snackbar>
  );
}

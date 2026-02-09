import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link } from 'react-router-dom';

/**
 * Full page error component for displaying serious application errors
 */
export default function ErrorPage({ error, resetError }) {
  const handleRefresh = () => {
    if (resetError && typeof resetError === 'function') {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'background.default',
      py: 6
    }}>
      <Container maxWidth="md">
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 4, md: 8 },
            borderRadius: 2,
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
          
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            Oops! Something Went Wrong
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: '600px', mx: 'auto' }}>
            We apologize for the inconvenience. An error occurred while loading this page.
            Our team has been notified and we're working to fix the issue.<br />
            <span style={{ fontSize: '0.95em', color: '#888' }}>
              If you need assistance, please contact support and mention the error reference below.
            </span>
          </Typography>
          {/* Error Reference for support */}
          {error && (
            <Typography variant="caption" sx={{ color: '#888', mb: 2, display: 'block' }}>
              Error Reference: <span style={{ fontFamily: 'monospace' }}>{error?.name || 'Error'}-{error?.message?.slice(0, 24) || 'unknown'}</span>
            </Typography>
          )}
          
          {process.env.NODE_ENV === 'development' && error && (
            <Box sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: '#f8f8f8', 
              borderRadius: 1,
              overflow: 'auto',
              textAlign: 'left',
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary' }}>
                Error Details (Development Mode Only):
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: '#d32f2f' }}>
                {error.message || 'Unknown error'}
              </Typography>
              {error.stack && (
                <Typography variant="body2" component="pre" sx={{ 
                  fontFamily: 'monospace', 
                  color: '#555', 
                  fontSize: '0.8rem',
                  mt: 2,
                  whiteSpace: 'pre-wrap'
                }}>
                  {error.stack}
                </Typography>
              )}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ 
                fontWeight: 600,
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
            >
              Refresh Page
            </Button>
            
            <Button 
              variant="outlined" 
              component={Link}
              to="/"
              startIcon={<HomeIcon />}
              sx={{ 
                fontWeight: 600,
                borderColor: '#ddd',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }
              }}
            >
              Return to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

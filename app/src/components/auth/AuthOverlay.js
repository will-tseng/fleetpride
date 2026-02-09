import React from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';

const AuthOverlay = ({ show, isSigningIn, userName, secondaryMessage }) => {
  return (
    <Fade in={show} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          zIndex: 9999,
          display: show ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        {/* Logo or Brand */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: '#537E87',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: '1.5rem',
              }}
            >
              LH
            </Typography>
          </Box>
        </Box>

        {/* Loading Spinner */}
        <CircularProgress
          size={48}
          thickness={4}
          sx={{
            color: '#7FB5C0',
          }}
        />

        {/* Message */}
        <Box sx={{ textAlign: 'center', minHeight: 80 }}>
          {isSigningIn ? (
            <>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#ffffff',
                  mb: 1,
                }}
              >
                Welcome to LucidHome
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 500,
                  color: '#7FB5C0',
                }}
              >
                {userName}
              </Typography>
            </>
          ) : (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              Logging Out...
            </Typography>
          )}

          {/* Secondary message - appears halfway through */}
          <Fade in={!!secondaryMessage} timeout={400}>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                mt: 2,
                fontStyle: 'italic',
              }}
            >
              {secondaryMessage || ''}
            </Typography>
          </Fade>
        </Box>

        {/* Subtle animation bar */}
        <Box
          sx={{
            width: 200,
            height: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            overflow: 'hidden',
            mt: 2,
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: '#7FB5C0',
              animation: 'loadingBar 3s ease-in-out',
              '@keyframes loadingBar': {
                '0%': {
                  transform: 'translateX(-100%)',
                },
                '100%': {
                  transform: 'translateX(0)',
                },
              },
            }}
          />
        </Box>
      </Box>
    </Fade>
  );
};

export default AuthOverlay;

import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #003366 0%, #004488 50%, #003366 100%)',
        py: { xs: 4, md: 6 },
        textAlign: 'center',
        minHeight: { xs: '200px', md: '275px' },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          zIndex: 1,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: '#ffffff',
            fontSize: { xs: '1.75rem', md: '2.5rem' },
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Heavy Duty Parts & Service
        </Typography>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: 'rgba(255,255,255,0.9)',
            mb: 4,
            fontSize: { xs: '1rem', md: '1.25rem' }
          }}
        >
          Your trusted source for truck, trailer, and fleet maintenance parts
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            sx={{
              bgcolor: '#00843D',
              color: 'white',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover': {
                bgcolor: '#006B31',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,132,61,0.4)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            size="large"
            component={Link}
            to="/search?q=*:*&category_s=brakes"
          >
            Shop Brakes
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#CC0000',
              color: 'white',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover': {
                bgcolor: '#990000',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(204,0,0,0.4)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            size="large"
            component={Link}
            to="/search?q=*:*"
          >
            Shop All Parts
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            size="large"
            component={Link}
            to="/search?q=*:*"
          >
            Find Service
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Hero;

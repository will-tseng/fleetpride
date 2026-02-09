import React from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, Divider, IconButton, useMediaQuery, useTheme } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import PinterestIcon from '@mui/icons-material/Pinterest';
import YouTubeIcon from '@mui/icons-material/YouTube';

function Footer() {
  const footerLinks = [
    {
      title: 'FLEETPRIDE',
      links: ['About Us', 'Values', 'Careers', 'Executive Team', 'Newsroom', 'Find a Location']
    },
    {
      title: 'CUSTOMER SERVICE',
      links: ['Contact Us', 'Pay My Bill', 'Product Supply Guide', 'Supplier Request Form', 'Shipping Information']
    },
    {
      title: 'TERMS & POLICIES',
      links: ['Terms & Conditions', 'Terms of Use', 'Privacy Policy', 'Warranty & Returns', 'Accessibility']
    },
    {
      title: 'SERVICES',
      links: ['Apply For Credit', 'SDS Search', 'About Service Centers', 'FleetPride.com Benefits', 'eCash Rewards']
    }
  ];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ backgroundColor: '#003366', color: '#fff', pt: { xs: 4, md: 6 }, pb: { xs: 3, md: 4 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={isMobile ? 2 : 4}>
          {footerLinks.map((section, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                mb: 1.5, 
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}>
                {section.title}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1 : 1.5 }}>
                {section.links.map((link, linkIndex) => (
                  <MuiLink 
                    key={linkIndex} 
                    href="#" 
                    underline="hover" 
                    sx={{ 
                      color: '#e0e0e0', 
                      fontSize: { xs: '12px', md: '14px' },
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    {link}
                  </MuiLink>
                ))}
              </Box>
            </Grid>
          ))}
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Connect With Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <IconButton sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <FacebookIcon />
              </IconButton>
              <IconButton sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <TwitterIcon />
              </IconButton>
              <IconButton sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <InstagramIcon />
              </IconButton>
              <IconButton sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <PinterestIcon />
              </IconButton>
              <IconButton sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <YouTubeIcon />
              </IconButton>
            </Box>
            
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Customer Service
            </Typography>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
              1-800-321-5738
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Monday-Friday: 7AM-6PM CT
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Saturday: 8AM-12PM CT
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 6, mb: 4, backgroundColor: 'rgba(255,255,255,0.1)' }} />

        <Typography variant="body2" sx={{ color: '#bbb', textAlign: 'center' }}>
          © {new Date().getFullYear()} FleetPride. All rights reserved.
        </Typography>
        <Typography variant="caption" sx={{ color: '#999', textAlign: 'center', display: 'block', mt: 1 }}>
          This is a demonstration site powered by Lucidworks Fusion.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;

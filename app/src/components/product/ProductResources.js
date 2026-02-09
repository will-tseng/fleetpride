import React, { useState } from 'react';
import {
  Typography,
  Box,
  Avatar,
  Snackbar,
  Alert
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import pdfIcon from '@assets/pdf.png';

export default function ProductResources({ product }) {

  // State for user feedback
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Get actual resources from product data
  const resources = product._lw_has_pdfs !== false && product._lw_pdf_title_ss && product._lw_pdf_url_ss
    ? product._lw_pdf_title_ss.map((title, index) => ({
      title: title,
      url: product._lw_pdf_url_ss[index],
      fileSize: 'PDF' // We don't have file size info, so just show PDF
    }))
    : [];
  
  return (
    <>
      {product._lw_has_pdfs === false ? (
        <Box
          sx={{
            p: 1,
            textAlign: 'center',
            bgcolor: 'grey.50',
          }}
        >
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ fontSize: '0.875rem' }}
          >
            No resources available for this product.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Resources Header with Status Indicator */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1.5
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#537E87' }}>
              <FolderIcon fontSize="small" />
            </Avatar>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: 'text.primary', flexGrow: 1 }}
            >
              Resources ({resources.length})
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {resources.map((doc, index) => {
              return (
                <Box
                  key={index}
                  component='a'
                  href={doc.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textDecoration: 'none',
                    color: 'primary.main',
                    py: 0.75,
                    px: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.50',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <img
                    src={pdfIcon}
                    alt='PDF'
                    style={{ width: 16, height: 16 }}
                  />
                  <Typography variant='body2' sx={{ fontSize: '0.875rem' }}>
                    {doc.title.length > 40 ? `${doc.title.substring(0, 40)}...` : doc.title}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}

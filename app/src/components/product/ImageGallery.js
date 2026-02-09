import React, { useState, useEffect, useMemo } from 'react';
import { Box, IconButton, Dialog, DialogContent, Chip, useMediaQuery, useTheme } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import { useUser } from '@context/UserContext';

// Map user IDs to their availability field names
const USER_FIELD_MAP = {
  'user1': 'ady_acustomer_b',
  'user2': 'ady_customerb_b',
  'user3': 'ady_customerc_b',
  'user4': 'ady_customerd_b',
};

export default function ImageGallery({ images, productTitle, variantData = [], hideVariants = false, selectedIndex = 0, onImageSelect }) {
  const { isSignedIn, currentUser } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedImage, setSelectedImage] = useState(selectedIndex);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Sync with external selectedIndex if provided
  useEffect(() => {
    if (selectedIndex !== selectedImage) {
      setSelectedImage(selectedIndex);
    }
  }, [selectedIndex]);

  // Check if a variant is available for the current user
  const getVariantAvailability = useMemo(() => {
    if (!isSignedIn || !currentUser) return () => ({ isAvailable: true, hasData: false });

    const availabilityField = USER_FIELD_MAP[currentUser.id];
    if (!availabilityField) return () => ({ isAvailable: true, hasData: false });

    return (variantInfo) => {
      if (!variantInfo) return { isAvailable: true, hasData: false };
      const availability = variantInfo[availabilityField];
      return {
        isAvailable: availability === true,
        hasData: availability !== undefined,
      };
    };
  }, [isSignedIn, currentUser]);

  // Handle image selection and notify parent
  const handleImageSelect = (idx) => {
    setSelectedImage(idx);
    onImageSelect?.(idx);
  };

  // When hideVariants is true, only show the first image
  const displayImages = hideVariants ? [images[0]] : images;
  const currentImage = displayImages[selectedImage] || displayImages[0];
  const hasMultipleImages = !hideVariants && displayImages.length > 1;

  const handlePrevious = () => {
    const newIdx = selectedImage > 0 ? selectedImage - 1 : displayImages.length - 1;
    handleImageSelect(newIdx);
  };

  const handleNext = () => {
    const newIdx = selectedImage < displayImages.length - 1 ? selectedImage + 1 : 0;
    handleImageSelect(newIdx);
  };

  return (
    <>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Main Image Display */}
        <Box
          onClick={() => setImageModalOpen(true)}
          sx={{
            position: 'relative',
            aspectRatio: '1/1',
            width: '100%',
            maxWidth: 420,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            '&:hover .zoom-hint': { opacity: 1 },
            '&:hover .main-image': { transform: 'scale(1.05)' }
          }}
        >
          <Box
            component="img"
            className="main-image"
            src={currentImage}
            alt={productTitle}
            sx={{
              maxHeight: '92%',
              maxWidth: '92%',
              objectFit: 'contain',
              transition: 'transform 0.3s ease-in-out'
            }}
            onError={(e) => {
              e.target.style.opacity = '0.5';
            }}
          />

          {/* Zoom Icon Hint */}
          <Box
            className="zoom-hint"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              opacity: 0,
              transition: 'opacity 0.2s',
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ZoomInIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>

          {/* Navigation Arrows for Main Image */}
          {hasMultipleImages && !isMobile && (
            <>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                sx={{
                  position: 'absolute',
                  left: 8,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: 'white' },
                  boxShadow: 1
                }}
              >
                <NavigateBeforeIcon />
              </IconButton>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                sx={{
                  position: 'absolute',
                  right: 8,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: 'white' },
                  boxShadow: 1
                }}
              >
                <NavigateNextIcon />
              </IconButton>
            </>
          )}

          {/* Image Counter */}
          {hasMultipleImages && (
            <Chip
              label={`${selectedImage + 1} / ${displayImages.length}`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            />
          )}
        </Box>

        {/* Thumbnail Gallery */}
        {hasMultipleImages && (
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              justifyContent: 'center',
              flexWrap: 'wrap',
              pb: 1,
              maxWidth: 420,
              '&::-webkit-scrollbar': {
                height: 6
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'grey.100',
                borderRadius: 3
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'grey.400',
                borderRadius: 3,
                '&:hover': {
                  bgcolor: 'grey.500'
                }
              }
            }}
          >
            {displayImages.map((img, idx) => {
              const variantInfo = variantData[idx];
              const isSelected = selectedImage === idx;
              const availability = getVariantAvailability(variantInfo);
              const isUnavailable = availability.hasData && !availability.isAvailable;

              return (
                <Box
                  key={idx}
                  onClick={() => handleImageSelect(idx)}
                  sx={{
                    minWidth: 80,
                    width: 80,
                    height: 80,
                    cursor: 'pointer',
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected
                      ? (isUnavailable ? 'grey.400' : 'primary.main')
                      : (isUnavailable ? 'grey.200' : 'grey.300'),
                    borderRadius: 1.5,
                    p: 0.5,
                    bgcolor: isSelected
                      ? (isUnavailable ? 'grey.100' : 'primary.50')
                      : (isUnavailable ? 'grey.50' : 'white'),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: isUnavailable ? 'grey.400' : 'primary.main',
                      boxShadow: 2
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={img}
                    alt={variantInfo?.primary_color_s || `Image ${idx + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: 1,
                      opacity: isUnavailable ? 0.4 : 1,
                      filter: isUnavailable ? 'grayscale(100%)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onError={(e) => {
                      e.target.style.opacity = '0.5';
                    }}
                  />
                  {/* Unavailable overlay icon */}
                  {isUnavailable && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BlockIcon sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Fullscreen Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            bgcolor: 'rgba(0,0,0,0.95)'
          }
        }}
      >
        <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Close Button */}
          <IconButton
            onClick={() => setImageModalOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              zIndex: 10,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Header with Variant Info */}
          {variantData[selectedImage] && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 1
              }}
            >
              <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {variantData[selectedImage].primary_color_s || variantData[selectedImage].sku}
              </Box>
            </Box>
          )}

          {/* Main Image */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              p: 4
            }}
          >
            <img
              src={displayImages[selectedImage]}
              alt={productTitle}
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
            />

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <IconButton
                  sx={{
                    position: 'absolute',
                    left: 16,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'white' }
                  }}
                  onClick={handlePrevious}
                >
                  <NavigateBeforeIcon />
                </IconButton>
                <IconButton
                  sx={{
                    position: 'absolute',
                    right: 16,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'white' }
                  }}
                  onClick={handleNext}
                >
                  <NavigateNextIcon />
                </IconButton>
              </>
            )}
          </Box>

          {/* Thumbnail Strip */}
          {hasMultipleImages && (
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                p: 2,
                justifyContent: 'center',
                overflowX: 'auto',
                bgcolor: 'rgba(0,0,0,0.5)'
              }}
            >
              {displayImages.map((img, idx) => {
                const variantInfo = variantData[idx];
                const availability = getVariantAvailability(variantInfo);
                const isUnavailable = availability.hasData && !availability.isAvailable;

                return (
                  <Box
                    key={idx}
                    onClick={() => handleImageSelect(idx)}
                    sx={{
                      width: 70,
                      height: 70,
                      minWidth: 70,
                      border: selectedImage === idx ? '2px solid' : '1px solid',
                      borderColor: selectedImage === idx
                        ? (isUnavailable ? 'grey.400' : 'primary.main')
                        : (isUnavailable ? 'grey.600' : 'grey.500'),
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isUnavailable ? 'grey.200' : 'white',
                      position: 'relative',
                      '&:hover': { borderColor: isUnavailable ? 'grey.400' : 'primary.light' }
                    }}
                  >
                    <img
                      src={img}
                      alt={`Variant ${idx + 1}`}
                      style={{
                        maxHeight: '90%',
                        maxWidth: '90%',
                        objectFit: 'contain',
                        opacity: isUnavailable ? 0.4 : 1,
                        filter: isUnavailable ? 'grayscale(100%)' : 'none'
                      }}
                    />
                    {/* Unavailable overlay icon */}
                    {isUnavailable && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          bgcolor: 'rgba(0,0,0,0.6)',
                          borderRadius: '50%',
                          p: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <BlockIcon sx={{ color: 'white', fontSize: 16 }} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

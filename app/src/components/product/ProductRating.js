import React from 'react';
import { Box, Typography, Rating } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

export default function ProductRating({ rating, reviewsCount, size = 'medium', showCount = true }) {
  // Default to 0 if no rating provided
  const ratingValue = rating || 0;
  const reviews = reviewsCount || 0;

  if (!rating && !reviewsCount) {
    return null;
  }

  const sizeMap = {
    small: { fontSize: '0.75rem', starSize: 'small' },
    medium: { fontSize: '0.875rem', starSize: 'medium' },
    large: { fontSize: '1rem', starSize: 'large' }
  };

  const currentSize = sizeMap[size] || sizeMap.medium;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Rating
        value={ratingValue}
        readOnly
        precision={0.1}
        size={currentSize.starSize}
        emptyIcon={<StarIcon style={{ opacity: 0.3 }} fontSize="inherit" />}
      />
      {showCount && (
        <Typography
          variant="body2"
          sx={{
            fontSize: currentSize.fontSize,
            color: 'text.secondary',
            fontWeight: 500
          }}
        >
          {ratingValue > 0 ? `${ratingValue.toFixed(1)}` : 'No ratings yet'}
          {reviews > 0 && (
            <span style={{ marginLeft: '4px' }}>
              ({reviews.toLocaleString()} {reviews === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </Typography>
      )}
    </Box>
  );
}

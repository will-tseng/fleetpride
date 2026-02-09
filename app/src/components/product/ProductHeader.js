import React from 'react';
import { Box, Typography, Breadcrumbs, Rating } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

/**
 * ProductHeader - Product title, breadcrumbs, ratings, and metadata
 * 
 * @param {Object} props
 * @param {Object} props.product - Product data object
 * @param {number} props.rating - Product rating (optional)
 * @param {number} props.reviewCount - Number of reviews (optional)
 */
export default function ProductHeader({ product, rating, reviewCount }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '*:*';

  if (!product) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs
        separator="›"
        aria-label="breadcrumb"
        sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            '&:hover': { textDecoration: 'underline', color: 'primary.main' },
          }}
        >
          Home
        </Link>
        {product.category && (
          <Link
            to={`/search?category=${encodeURIComponent(product.category)}&q=${encodeURIComponent(query)}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { textDecoration: 'underline', color: 'primary.main' },
            }}
          >
            {product.category}
          </Link>
        )}
      </Breadcrumbs>

      {/* Main Product Title */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 500,
          mb: 0.5,
          lineHeight: 1.2,
          color: '#0F1111',
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '1.75rem' },
        }}
      >
        {product.title}
      </Typography>

      {/* Brand name */}
      {product.manufacturer && (
        <Typography
          variant="body1"
          sx={{
            mb: 1,
            color: '#007185',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'underline',
              cursor: 'pointer',
            },
          }}
        >
          <Link
            to={`/manufacturer/${product.manufacturer}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {product.manufacturer}
          </Link>
        </Typography>
      )}

      {/* Rating and SKU bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        {rating && (
          <Rating
            value={Number(rating)}
            precision={0.5}
            readOnly
            size="small"
            sx={{ color: '#FFA41C', mr: 1 }}
          />
        )}
        
        {reviewCount && (
          <Link
            to="#reviews"
            style={{
              textDecoration: 'none',
              color: '#007185',
              marginRight: '16px',
              '&:hover': { textDecoration: 'underline', color: 'primary.main' },
            }}
          >
            {reviewCount} ratings
          </Link>
        )}
        
        {product.sku && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box component="span" sx={{ mx: 1, fontSize: '0.6rem' }}>
              |
            </Box>
            SKU:{' '}
            <Box component="span" sx={{ fontWeight: 500, ml: 0.5 }}>
              {product.sku}
            </Box>
          </Typography>
        )}
      </Box>
    </Box>
  );
}

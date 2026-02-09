import React from 'react';
import { Box, Typography, Chip, Grid } from '@mui/material';

const VariantSelector = ({ variants, selectedVariant, onVariantSelect }) => {
  // Group variants by color or other distinguishing properties
  const groupedVariants = {};
  
  // Group variants by color for easier selection
  variants.forEach(variant => {
    const color = variant.color || 'Default';
    if (!groupedVariants[color]) {
      groupedVariants[color] = [];
    }
    groupedVariants[color].push(variant);
  });

  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Option
      </Typography>
      
      <Grid container spacing={1}>
        {Object.entries(groupedVariants).map(([color, colorVariants]) => (
          <Grid item xs={12} key={color}>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {colorVariants.map((variant) => (
                  <Chip
                    key={variant.id}
                    label={variant.sku.split(' ').pop() || 'Variant'}
                    onClick={() => onVariantSelect(variant)}
                    sx={{
                      border: selectedVariant?.id === variant.id 
                        ? '2px solid #FF9900' 
                        : '1px solid #e0e0e0',
                      backgroundColor: selectedVariant?.id === variant.id 
                        ? 'rgba(255, 153, 0, 0.08)' 
                        : 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 153, 0, 0.08)',
                        borderColor: '#FF9900',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VariantSelector;

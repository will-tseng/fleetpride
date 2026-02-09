import React from 'react';
import { Grid, Box, Typography } from '@mui/material';

/**
 * SpecificationGrid - Reusable component for displaying product specifications
 * 
 * @param {Object} props
 * @param {Array} props.specifications - Array of spec objects with label and value
 * @param {string} props.title - Section title (optional)
 * @param {Object} props.sx - Additional styling (optional)
 * @param {number} props.columns - Grid columns (default: 2)
 * @param {boolean} props.showBorder - Whether to show borders (default: true)
 */
export default function SpecificationGrid({ 
  specifications = [], 
  title = null, 
  sx = {}, 
  columns = 2, 
  showBorder = true 
}) {
  if (!specifications || specifications.length === 0) {
    return null;
  }

  const gridProps = columns === 1 ? { xs: 12 } : { xs: 12, sm: 6 };

  return (
    <Box sx={{ mb: 4, ...sx }}>
      {title && (
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 2 }}
        >
          {title}
        </Typography>
      )}
      <Grid container spacing={2}>
        {specifications.map((spec, idx) => (
          <Grid item {...gridProps} key={`spec-${idx}`}>
            <Box
              sx={{
                display: 'flex',
                borderBottom: showBorder ? '1px solid #eee' : 'none',
                py: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, width: '40%' }}
              >
                {spec.label}
              </Typography>
              <Typography variant="body2" sx={{ width: '60%' }}>
                {spec.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

import { Grid, Paper, Typography } from '@mui/material';
import { formatPrice } from '@utils/formatter';

export default function ProductSpecifications({ product }) {
  const price = product?.price || product?.price_d || product?.price_f || 0;
  const formattedPrice = formatPrice(price);

  // Helper function to format attribute field names
  const formatAttributeName = (key) => {
    return key
      .replace(/^attribute_/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Core specifications
  const coreSpecs = [
    { label: 'SKU', value: product.sku, priority: 1 },
    { label: 'Brand', value: product.manufacturer, priority: 2 },
    { label: 'Category', value: product.category, priority: 3 },
    { label: 'Price', value: formattedPrice, priority: 4 },
  ];

  // Additional common fields
  const additionalSpecs = [
    { label: 'Weight', value: product.weight ? `${product.weight} lbs` : null },
    { label: 'Dimensions', value: product.dimensions },
    { label: 'Material', value: product.material },
    { label: 'Color', value: product.color },
    { label: 'Finish', value: product.finish },
    { label: 'Model Number', value: product.model_number },
    { label: 'Status', value: product.status },
  ];

  // Extract all attribute_* fields dynamically
  const dynamicAttributes = Object.keys(product)
    .filter(key => key.startsWith('attribute_') && product[key])
    .map(key => ({
      label: formatAttributeName(key),
      value: product[key]
    }));

  // Combine all specifications and filter out empty values
  const specifications = [
    ...coreSpecs,
    ...additionalSpecs,
    ...dynamicAttributes
  ].filter(item => item.value);

  if (specifications.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No specifications available for this product.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {specifications.map((item, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Paper variant='outlined' sx={{ p: 1.5, height: '100%' }}>
            <Typography
              variant='caption'
              color='primary'
              sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase' }}
            >
              {item.label}
            </Typography>
            <Typography
              variant='body2'
              sx={{
                fontFamily:
                  item.label === 'SKU' || item.label === 'Model Number' ? 'monospace' : 'inherit',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'text.primary',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              {item.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

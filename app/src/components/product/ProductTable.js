import React, { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Button,
  Paper,
  IconButton,
  Skeleton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ProductTableRow from './ProductTableRow';
import { useUser } from '@context/UserContext';

// Header column component
const TableHeader = ({ children, sortable, width, align = 'left' }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: align === 'center' ? 'center' : 'flex-start',
      gap: 0.5,
      width,
      minWidth: width,
    }}
  >
    <Typography
      variant="caption"
      sx={{
        fontWeight: 600,
        color: '#333',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Typography>
    {sortable && (
      <IconButton size="small" sx={{ p: 0.25 }}>
        <FilterListIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
      </IconButton>
    )}
  </Box>
);

// Skeleton row for loading state
const ProductTableRowSkeleton = ({ isSignedIn = true }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: isSignedIn
        ? '40px 80px 120px 100px 120px 1fr 100px 180px 120px'
        : '80px 120px 100px 120px 1fr 100px 180px 120px',
      alignItems: 'center',
      gap: 2,
      py: 2,
      px: 1,
      borderBottom: '1px solid #e0e0e0',
    }}
  >
    {isSignedIn && <Skeleton variant="rectangular" width={20} height={20} />}
    <Skeleton variant="rectangular" width={60} height={60} />
    <Box>
      <Skeleton width={80} height={16} />
      <Skeleton width={60} height={14} sx={{ mt: 0.5 }} />
    </Box>
    <Skeleton width={60} height={16} />
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Skeleton variant="rectangular" width={32} height={32} />
      <Skeleton variant="rectangular" width={32} height={32} />
      <Skeleton variant="rectangular" width={32} height={32} />
    </Box>
    <Box>
      <Skeleton width="80%" height={16} />
      <Skeleton width="60%" height={14} sx={{ mt: 0.5 }} />
    </Box>
    <Skeleton width={50} height={20} sx={{ mx: 'auto' }} />
    <Box>
      <Skeleton width={100} height={14} />
      <Skeleton width={100} height={14} sx={{ mt: 0.5 }} />
      <Skeleton width={100} height={14} sx={{ mt: 0.5 }} />
    </Box>
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Skeleton variant="rectangular" width={55} height={32} />
      <Skeleton variant="rectangular" width={50} height={32} />
    </Box>
  </Box>
);

function ProductTable({ products, loading, resultsPerPage = 20, showAllProducts = false, onToggleShowAll }) {
  const { isSignedIn } = useUser();
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(new Set(products.map(p => p.id)));
      setSelectAll(true);
    } else {
      setSelectedProducts(new Set());
      setSelectAll(false);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === products.length);
  };

  // Grid template columns - include checkbox column only for signed-in users
  const gridTemplateColumns = isSignedIn
    ? '40px 80px 120px 100px 120px 1fr 100px 180px 120px'
    : '80px 120px 100px 120px 1fr 100px 180px 120px';

  if (loading) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns,
            alignItems: 'center',
            gap: 2,
            py: 1.5,
            px: 1,
            bgcolor: '#f5f5f5',
            borderBottom: '2px solid #e0e0e0',
          }}
        >
          {isSignedIn && <Skeleton variant="rectangular" width={20} height={20} />}
          <TableHeader>Image</TableHeader>
          <TableHeader sortable>Part #</TableHeader>
          <TableHeader sortable>Mfr.</TableHeader>
          <TableHeader>Variants</TableHeader>
          <TableHeader sortable>Name</TableHeader>
          <TableHeader align="center">Availability</TableHeader>
          <TableHeader sortable>Pricing (USD)</TableHeader>
          <TableHeader>Qty.</TableHeader>
        </Box>
        {/* Skeleton rows */}
        {Array.from({ length: resultsPerPage }).map((_, idx) => (
          <ProductTableRowSkeleton key={idx} isSignedIn={isSignedIn} />
        ))}
      </Paper>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No products found.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Action bar - only show for signed-in users */}
      {isSignedIn && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
            p: 1,
            bgcolor: '#e3f2fd',
            borderRadius: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            disabled={selectedProducts.size === 0}
            sx={{
              bgcolor: '#0066cc',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.8rem',
              '&:hover': { bgcolor: '#0052a3' },
            }}
          >
            Buy Selected
          </Button>
          {onToggleShowAll && (
            <Button
              variant={showAllProducts ? 'contained' : 'outlined'}
              size="small"
              startIcon={showAllProducts ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={onToggleShowAll}
              sx={{
                borderColor: showAllProducts ? 'transparent' : '#0066cc',
                bgcolor: showAllProducts ? '#7b1fa2' : 'transparent',
                color: showAllProducts ? 'white' : '#0066cc',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8rem',
                '&:hover': {
                  bgcolor: showAllProducts ? '#6a1b9a' : 'rgba(0, 102, 204, 0.08)',
                  borderColor: showAllProducts ? 'transparent' : '#0066cc',
                },
              }}
            >
              {showAllProducts ? 'Show My Products' : 'Show All Products'}
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button
            variant="text"
            size="small"
            startIcon={<DownloadIcon />}
            sx={{
              color: '#333',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.8rem',
            }}
          >
            Download Table (.CSV)
          </Button>
        </Box>
      )}

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
        {/* Header row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns,
            alignItems: 'center',
            gap: 2,
            py: 1.5,
            px: 1,
            bgcolor: '#f5f5f5',
            borderBottom: '2px solid #e0e0e0',
          }}
        >
          {isSignedIn && (
            <Box>
              <Checkbox
                checked={selectAll}
                indeterminate={selectedProducts.size > 0 && selectedProducts.size < products.length}
                onChange={handleSelectAll}
                size="small"
              />
            </Box>
          )}
          <TableHeader>Image</TableHeader>
          <TableHeader sortable>Part #</TableHeader>
          <TableHeader sortable>Mfr.</TableHeader>
          <TableHeader>Variants</TableHeader>
          <TableHeader sortable>Name</TableHeader>
          <TableHeader align="center">Availability</TableHeader>
          <TableHeader sortable>Pricing (USD)</TableHeader>
          <TableHeader>Qty.</TableHeader>
        </Box>

        {/* Product rows */}
        {products.map((product) => (
          <ProductTableRow
            key={product.id}
            product={product}
            selected={selectedProducts.has(product.id)}
            onSelect={handleSelectProduct}
          />
        ))}
      </Paper>
    </Box>
  );
}

export default React.memo(ProductTable);

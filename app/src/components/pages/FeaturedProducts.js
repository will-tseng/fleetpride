import React, { useEffect, useState, useRef } from 'react';
import { Container, Box, Typography, Grid, Skeleton, Card, CardContent, Button } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ProductCard from '../product/ProductCard';
import { search } from '@api/search';
import { useStore } from '@context/StoreContext';
import { useUser } from '@context/UserContext';

// Product card skeleton for FeaturedProducts
function FeaturedProductSkeleton() {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '4px 4px 0 0' }} />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} width="60%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={28} width="40%" sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );
}

const FeaturedProducts = React.memo(() => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const { getStoreFilterQuery, getInventoryFilterQuery, selectedStore, inStockOnly, toggleInStockOnly } = useStore();
  const { isSignedIn } = useUser();
  const storeId = selectedStore?.id; // Track store changes for re-fetch

  useEffect(() => {
    mountedRef.current = true;

    const loadFeaturedProducts = async () => {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // Build filter queries including store and inventory filters
      const filterQueries = [];
      const storeFilterQuery = getStoreFilterQuery();
      if (storeFilterQuery) {
        filterQueries.push(storeFilterQuery);
      }

      // Add inventory filter if "In Stock at Store Today" is enabled
      const inventoryFilterQuery = getInventoryFilterQuery();
      if (inventoryFilterQuery) {
        filterQueries.push(inventoryFilterQuery);
      }

      try {
        const result = await search({
          query: '*:*',
          rows: 8,
          queryProfile: 'landing-page',
          filterQueries: filterQueries,
          fields: 'id,name_s,title,title_s,price,price_f,image_url_s,image_url,description,brand_s,manufacturer,category_s,category,subcategory_s,sku,sku_s,part_number_s,price_display_s,features_ss'
        });
        
        if (!mountedRef.current) return;
        
        if (result.success) {
          // Merge expanded image variants into each product
          const expanded = result.data?.expanded || {};

          const productsWithVariants = (result.documents || []).map(product => {
            const groupId = product.group || product.id;
            const expandedDocs = expanded[groupId]?.docs || [];

            // Collect variant data with inventory fields from expanded docs
            let variantData = expandedDocs
              .filter(doc => doc.image_url)
              .map(doc => ({
                image_url: doc.image_url,
                sku: doc.sku || doc.id,
                title: doc.title,
                id: doc.id,
                product_id: doc.product_id,
                online_shipping_b: doc.online_shipping_b,
                chicago_inventory_i: doc.chicago_inventory_i,
                sanfran_inventory_i: doc.sanfran_inventory_i,
                raleigh_inventory_i: doc.raleigh_inventory_i,
              }));

            // Collect all unique image URLs from expanded docs
            let variantImages = expandedDocs
              .map(doc => doc.image_url)
              .filter(Boolean);

            // Fallback: If no expanded docs, search for other products with same group
            if (variantImages.length === 0 && result.documents) {
              const sameGroupProducts = result.documents.filter(p => p.group === groupId && p.id !== product.id);
              variantImages = sameGroupProducts
                .map(p => p.image_url)
                .filter(Boolean);

              // Also collect variant data for fallback
              variantData = sameGroupProducts
                .filter(p => p.image_url)
                .map(p => ({
                  image_url: p.image_url,
                  sku: p.sku || p.id,
                  title: p.title,
                  id: p.id,
                  product_id: p.product_id,
                  online_shipping_b: p.online_shipping_b,
                  chicago_inventory_i: p.chicago_inventory_i,
                  sanfran_inventory_i: p.sanfran_inventory_i,
                  raleigh_inventory_i: p.raleigh_inventory_i,
                }));
            }

            // Always include the main product as first variant if not already included
            const mainVariant = {
              image_url: product.image_url,
              sku: product.sku || product.id,
              title: product.title,
              id: product.id,
              product_id: product.product_id,
              online_shipping_b: product.online_shipping_b,
              chicago_inventory_i: product.chicago_inventory_i,
              sanfran_inventory_i: product.sanfran_inventory_i,
              raleigh_inventory_i: product.raleigh_inventory_i,
            };

            if (product.image_url && !variantImages.includes(product.image_url)) {
              variantImages.unshift(product.image_url);
              variantData.unshift(mainVariant);
            }

            return {
              ...product,
              variant_images: variantImages,
              variant_data: variantData,
              total_variants: variantImages.length
            };
          });
          setProducts(productsWithVariants);
        } else {
          setError(result.error || 'Failed to load featured products.');
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message || 'Failed to load featured products.');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    loadFeaturedProducts();

    return () => {
      mountedRef.current = false;
    };
  }, [storeId, getStoreFilterQuery, getInventoryFilterQuery, inStockOnly]);

  const renderProducts = () => {
    if (loading) {
      // Show skeleton cards while loading
      return Array.from({ length: 8 }).map((_, index) => (
        <Grid item xs={6} sm={6} md={3} key={`skeleton-${index}`}>
          <FeaturedProductSkeleton />
        </Grid>
      ));
    }

    if (!products || products.length === 0) {
      if (!error) {
        return (
          <Grid item xs={12}>
            <Typography variant="body1" align="center">
              No featured products found. This might be due to API configuration or data availability.
            </Typography>
          </Grid>
        );
      }
      return null;
    }

    return products.map((product, idx) => {
      if (!product) return null;
      
      return (
        <Grid 
          item 
          xs={6} 
          sm={6} 
          md={3} 
          key={product.id ? String(product.id) : product.name ? `name-${product.name}` : `product-${idx}`}
        >
          <ProductCard product={product} />
        </Grid>
      );
    });
  };

  return (
    <Container maxWidth="lg" sx={{ my: { xs: 3, md: 6 } }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', md: '1.75rem' }
          }}
        >
          Featured Products
        </Typography>
      </Box>

      {/* Filter Buttons - In Stock at Store Today / Available for Shipping - hidden when signed in */}
      {selectedStore && !isSignedIn && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant={inStockOnly ? 'contained' : 'outlined'}
            onClick={toggleInStockOnly}
            startIcon={selectedStore.id === 'online' ? <LocalShippingIcon /> : <StorefrontIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1,
              px: 2,
              py: 1,
              borderColor: inStockOnly ? 'transparent' : '#e0e0e0',
              backgroundColor: inStockOnly ? '#00a499' : 'transparent',
              color: inStockOnly ? 'white' : '#333',
              '&:hover': {
                backgroundColor: inStockOnly ? '#008f85' : 'rgba(0, 164, 153, 0.08)',
                borderColor: inStockOnly ? 'transparent' : '#00a499',
              },
            }}
          >
            {selectedStore.id === 'online' ? 'Available for Shipping' : 'In Stock at Store Today'}
          </Button>
        </Box>
      )}

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {/* Always use grid view for Featured Products */}
      <Grid container spacing={2}>
        {renderProducts()}
      </Grid>
    </Container>
  );
});

export default FeaturedProducts;

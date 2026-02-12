import * as React from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { loadCart, saveCart } from '@utils/cartUtils';
import { Snackbar, Alert, useMediaQuery, useTheme, Chip } from '@mui/material';
import { formatPrice } from '@utils/formatter';
import ErrorBoundary from '../error/ErrorBoundary';
import { useStore } from '@context/StoreContext';

// Enhanced card dimensions for modern ecommerce look
const CARD_HEIGHT = '400px';
const MOBILE_CARD_HEIGHT = '380px';
const IMAGE_HEIGHT = 200;
const MOBILE_IMAGE_HEIGHT = 180;

function ProductCard({ product }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedStore } = useStore();

  // Get current search query from URL - needs to be before guard clause
  const searchParams = new URLSearchParams(location.search);
  const currentQuery = searchParams.get('q') || '*:*';

  // Get inventory count for the selected store
  const getInventoryCount = () => {
    if (!selectedStore || !product) {
      return null;
    }

    // For online store, sum all physical store inventories
    if (selectedStore.id === 'online') {
      const chicagoInventory = product.chicago_inventory_i || 0;
      const sanfranInventory = product.sanfran_inventory_i || 0;
      const raleighInventory = product.raleigh_inventory_i || 0;
      return chicagoInventory + sanfranInventory + raleighInventory;
    }

    // For physical stores, get that store's inventory
    if (!selectedStore.inventoryField) {
      return null;
    }

    const inventory = product[selectedStore.inventoryField];
    return typeof inventory === 'number' ? inventory : null;
  };

  // Guard: If product is undefined or missing id, render fallback UI
  if (!product || !product.id) {
    return (
      <Card sx={{ width: '100%', height: CARD_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <Typography variant="subtitle1" color="error" gutterBottom>Product Data Error</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Product information is missing or invalid.
        </Typography>
      </Card>
    );
  }

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  
  // Use product.title or product.name (including Fusion _s and _t suffixed fields), with a fallback for unnamed products
  const productTitle = product.title || product.title_s || product.name || product.name_s || product.name_t || 'Unnamed Product';

  // Get brand/manufacturer
  const productBrand = product.brand_s || product.brand_t || product.brand || product.manufacturer || product.manufacturer_s || '';

  // Get part numbers - check for both plain and _s suffixed fields
  const partNumber = product.part_number || product.part_number_s || '';
  const sku = product.sku || product.sku_s || '';
  
  // Handle variant images - use main image as fallback with all possible image fields
  const mainImage = product.image_url_s || product.image_url || product.image || product.image_url_t || `https://placehold.co/400x${isMobile ? MOBILE_IMAGE_HEIGHT : IMAGE_HEIGHT}/e9e9e9/969696?text=${encodeURIComponent(productTitle)}`;
  
  // Enhanced variant images handling - support for multiple fields and colors
  let variantImages = [];
  
  // Collect all available images from the product and its variants
  if (product.variant_images && Array.isArray(product.variant_images)) {
    // Use pre-processed variant_images if available
    variantImages = product.variant_images;
  } else {
    // Fallback to manually collecting images from different fields including the actual API fields
    if (product.image_url_s) variantImages.push(product.image_url_s);
    if (product.image_url && product.image_url !== product.image_url_s) variantImages.push(product.image_url);
    if (product.image && product.image !== product.image_url_s && product.image !== product.image_url) variantImages.push(product.image);
    if (product.image_url_t && product.image_url_t !== product.image_url_s && product.image_url_t !== product.image_url && product.image_url_t !== product.image) variantImages.push(product.image_url_t);
    
    // Add images from arrays if available
    if (Array.isArray(product.image_urls)) variantImages.push(...product.image_urls);
    if (Array.isArray(product.images)) variantImages.push(...product.images);
    
    // Add images from variants if available
    if (Array.isArray(product.variants)) {
      product.variants.forEach(variant => {
        if (variant.images && Array.isArray(variant.images)) {
          variantImages.push(...variant.images);
        }
        if (variant.image_url_s) variantImages.push(variant.image_url_s);
        if (variant.image_url && variant.image_url !== variant.image_url_s) variantImages.push(variant.image_url);
        if (variant.image && variant.image !== variant.image_url_s && variant.image !== variant.image_url) variantImages.push(variant.image);
        if (variant.image_url_t && variant.image_url_t !== variant.image_url_s && variant.image_url_t !== variant.image_url && variant.image_url_t !== variant.image) variantImages.push(variant.image_url_t);
      });
    }
    
    // Remove duplicates and empty values
    variantImages = [...new Set(variantImages)].filter(img => img && img.trim());
  }
  
  // Use all collected images or fallback to main image
  const allImages = variantImages.length > 0 ? variantImages : [mainImage];
  const currentImage = allImages[selectedImageIndex] || mainImage;

  // Card dimensions based on device size
  const cardHeight = isMobile ? MOBILE_CARD_HEIGHT : CARD_HEIGHT;
  const imgHeight = isMobile ? MOBILE_IMAGE_HEIGHT : IMAGE_HEIGHT;

  const addToCart = (e) => {
    // Prevent navigation when clicking Add to Cart
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const cart = loadCart();
      
      // Determine which variant to add based on current selection
      let productToAdd = { ...product, title: productTitle };
      
      // If there are multiple images and a selection is made, use that variant
      if (allImages.length > 1 && selectedImageIndex > 0) {
        const selectedImage = allImages[selectedImageIndex];
        const variantData = product.variant_data && product.variant_data[selectedImageIndex];
        
        if (variantData) {
          productToAdd = {
            ...product,
            title: productTitle,
            id: variantData.id || product.id,
            sku: variantData.sku,
            image_url: selectedImage,
            variant_info: {
              selected_sku: variantData.sku,
              selected_image: selectedImage,
              parent_id: product.id,
              variant_index: selectedImageIndex
            }
          };
        } else {
          // Fallback if no variant data but different image selected
          productToAdd.image_url = selectedImage;
          productToAdd.variant_info = {
            selected_image: selectedImage,
            parent_id: product.id,
            variant_index: selectedImageIndex
          };
        }
      }
      
      const cartItemId = productToAdd.variant_info ? 
        `${product.id}-${productToAdd.variant_info.selected_sku || selectedImageIndex}` : 
        productToAdd.id;
      
      const existingItemIndex = cart.findIndex(item => item.cart_id === cartItemId);
      
      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
      } else {
        cart.push({ 
          ...productToAdd, 
          cart_id: cartItemId,
          quantity: 1,
          image: productToAdd.image_url || productToAdd.image_url_s || mainImage
        });
      }
      
      saveCart(cart);
      
      const variantText = productToAdd.variant_info && productToAdd.variant_info.selected_sku ? 
        ` (${productToAdd.variant_info.selected_sku})` : '';
      setSnackbarMessage(`${productTitle}${variantText} added to cart`);
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to add item to cart');
      setSnackbarOpen(true);
    }
  };

  // Actual product card rendering - Modern ecommerce design
  const renderCard = () => (
    <Card 
      component={RouterLink}
      className="lw-product-card"
      data-product-id={product.id}
      id={product.id}
      to={`/product/${product.id}`}
      sx={{ 
        width: '100%', 
        height: cardHeight,
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          borderColor: 'primary.main',
          '& .product-image': {
            transform: 'scale(1.05)'
          },
          '& .quick-actions': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }}
    >
      {/* Product Image Section - Takes majority of card space */}
      <Box sx={{ position: 'relative', height: imgHeight, overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
        <CardMedia
          component="img"
          className="product-image"
          image={currentImage}
          alt={productTitle} 
          sx={{ 
            objectFit: 'contain',
            width: '100%',
            height: '100%',
            padding: 1,
            transition: 'transform 0.3s ease-in-out',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
        />
        
        {/* Quick Actions Overlay */}
        <Box 
          className="quick-actions"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            opacity: 0,
            transform: 'translateY(-8px)',
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton 
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              '&:hover': { backgroundColor: 'white', color: 'error.main' }
            }}
          >
            <FavoriteBorderIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Sale/Discount Badge */}
        {product.sale_price && product.price > product.sale_price && (
          <Chip
            label={`${Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'error.main',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}
          />
        )}

        
        {/* Enhanced Variant Images Gallery - Bottom overlay */}
        {allImages.length > 1 && (
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 0,
              left: 0, 
              right: 0,
              backgroundColor: 'rgba(128, 128, 128, 0.3)',
              p: 1,
              display: 'flex',
              gap: 0.5,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {allImages.slice(0, 8).map((img, index) => (
              <Box
                key={index}
                component="img"
                src={img}
                alt={`Option ${index + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedImageIndex(index);
                }}
                sx={{
                  width: 28,
                  height: 28,
                  objectFit: 'contain',
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: selectedImageIndex === index ? 'white' : 'transparent',
                  opacity: selectedImageIndex === index ? 1 : 0.7,
                  flexShrink: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                    borderColor: 'white'
                  }
                }}
              />
            ))}
            {allImages.length > 8 && (
              <Box 
                sx={{
                  width: 28, 
                  height: 28, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 1,
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: 'white',
                  flexShrink: 0,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.1)'
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedImageIndex((selectedImageIndex + 1) % allImages.length);
                }}
              >
                +{allImages.length - 8}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Product Info Section - Compact bottom area */}
      <Box sx={{ p: isMobile ? 1.5 : 2, pt: isMobile ? 1 : 1.5, pb: isMobile ? 0.5 : 1 }}>
        {/* Brand/Manufacturer */}
        {productBrand && (
          <Typography
            variant="caption"
            sx={{
              color: '#003366',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
              fontSize: '0.7rem',
              cursor: 'pointer',
              '&:hover': {
                color: '#00843D',
                textDecoration: 'underline'
              },
              transition: 'color 0.2s ease-in-out'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Use React Router navigate instead of nested RouterLink
              navigate(`/search?q=${encodeURIComponent(currentQuery)}&brand=${encodeURIComponent(productBrand)}`);
            }}
          >
            {productBrand}
          </Typography>
        )}
        
        {/* Product Title */}
        <Typography
          className='lw-product-title'
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
            fontSize: isMobile ? '0.9rem' : '1rem',
            mb: 0.5,
            minHeight: '2.6em'
          }}
        >
          {productTitle}
        </Typography>

        {/* Part Numbers */}
        <Box sx={{ mb: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
          {partNumber && (
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              Part #:{' '}
              <Box component="span" sx={{ fontWeight: 500, fontFamily: 'monospace', color: 'text.primary' }}>
                {partNumber}
              </Box>
            </Typography>
          )}
          {sku && (
            <>
              {partNumber && (
                <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  •
                </Box>
              )}
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                MPN:{' '}
                <Box component="span" sx={{ fontWeight: 500, fontFamily: 'monospace', color: 'text.primary' }}>
                  {sku}
                </Box>
              </Typography>
            </>
          )}
        </Box>

        {/* Inventory & Delivery Info */}
        <Box sx={{ mb: 0.5 }}>
          {selectedStore && selectedStore.id === 'online' && (() => {
            const totalInventory = getInventoryCount();
            if (totalInventory > 0) {
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocalShippingIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    <strong>Delivery:</strong>{' '}
                    <span style={{ color: '#2e7d32' }}>
                      {totalInventory} available for shipping
                    </span>
                  </Typography>
                </Box>
              );
            }
            return null;
          })()}

          {selectedStore && selectedStore.id !== 'online' && (() => {
            // Check if product is available at this store
            const isAvailable = product[selectedStore.filterField] === true;
            const inventory = getInventoryCount();

            // Calculate total inventory across all stores for delivery
            const totalInventory = (product.chicago_inventory_i || 0) +
                                 (product.sanfran_inventory_i || 0) +
                                 (product.raleigh_inventory_i || 0);

            return (
              <>
                {/* Pickup line - always show */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                  <StorefrontIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    <strong>Pickup:</strong>{' '}
                    {isAvailable && inventory > 0 ? (
                      <span style={{ color: '#2e7d32' }}>
                        {inventory} in stock at {selectedStore.label}
                      </span>
                    ) : (
                      <span style={{ color: '#d32f2f' }}>
                        Out of stock at {selectedStore.label}
                      </span>
                    )}
                  </Typography>
                </Box>

                {/* Delivery line - show if total inventory > 0 */}
                {totalInventory > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocalShippingIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      <strong>Delivery:</strong>{' '}
                      <span style={{ color: '#2e7d32' }}>Available</span>
                    </Typography>
                  </Box>
                )}
              </>
            );
          })()}
        </Box>

        {/* Price Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isMobile ? 0.5 : 1 }}>
          <Box>
            {product.sale_price && product.price > product.sale_price ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="h6" 
                  className='lw-price'
                  sx={{ 
                    fontWeight: 700,
                    fontSize: isMobile ? '1.1rem' : '1.3rem',
                    color: 'error.main'
                  }}
                >
                  {formatPrice(product.sale_price, 'USD', 2)}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                    fontSize: '0.85rem'
                  }}
                >
                  {formatPrice(product.price, 'USD', 2)}
                </Typography>
              </Box>
            ) : (
              <Typography
                variant="h6"
                className='lw-price'
                sx={{
                  fontWeight: 700,
                  fontSize: isMobile ? '1.1rem' : '1.3rem',
                  color: '#003366'
                }}
              >
                {product.price_display_s || formatPrice(product.price_f || product.price, 'USD', 2) || 'Price unavailable'}
              </Typography>
            )}
          </Box>
          
          {/* Add to Cart Button - FleetPride Green */}
          <Button
            variant="contained"
            className='lw-cart-add-trigger'
            size={isMobile ? 'small' : 'medium'}
            startIcon={<ShoppingCartIcon />}
            onClick={(e) => addToCart(e)}
            sx={{
              backgroundColor: '#00843D',
              color: 'white',
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              px: isMobile ? 2 : 3,
              py: isMobile ? 0.5 : 0.75,
              '&:hover': {
                backgroundColor: '#006B31',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 132, 61, 0.4)'
              },
              transition: 'all 0.2s ease-in-out',
              position: 'relative',
              zIndex: 10,
              fontSize: isMobile ? '0.75rem' : '0.85rem'
            }}
          >
            {isMobile ? 'Add' : 'Add To Cart'}
          </Button>
        </Box>
      </Box>
    </Card>
  );

  return (
    <>
      <ErrorBoundary fallbackComponent={ProductCardFallback}> 
        {renderCard()}
      </ErrorBoundary>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarMessage.startsWith('Failed') ? 'error' : 'success'} sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

const ProductCardFallback = ({ resetErrorBoundary }) => (
  <Card sx={{ width: '100%', height: CARD_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
    <Typography variant='subtitle1' color='error' gutterBottom>Product Display Error</Typography>
    <Typography variant='body2' color='text.secondary' sx={{ mb: 2, textAlign: 'center' }}>
      We couldn't display this product properly.
    </Typography>
    <Button 
      variant='outlined' 
      size='small' 
      onClick={resetErrorBoundary}
      sx={{ mt: 1 }}
    >
      Try Again
    </Button>
  </Card>
);

const MemoizedProductCard = React.memo(ProductCard);

export default MemoizedProductCard;

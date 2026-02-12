import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Grid,
  Paper,
  TextField,
  Snackbar,
  Alert,
  useMediaQuery,
  Chip,
  useTheme,
  Skeleton,
  Avatar,
  Divider
} from '@mui/material';

import QuizIcon from '@mui/icons-material/Quiz';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useStore } from '@context/StoreContext';
import { useUser } from '@context/UserContext';
import LW_Embeddable from '@components/integrations/LW_Agent_Conversational';
import ProductFAQList from '@components/product/ProductFAQList';
import ProductResources from '@components/product/ProductResources';
import ProductRating from '@components/product/ProductRating';
import ImageGallery from '@components/product/ImageGallery';
import ProductDetailTabs from '@components/product/ProductDetailTabs';
import B2BPricingSection from '@components/product/B2BPricingSection';
import EmbeddedComponentError from '@components/error/EmbeddedComponentError';
import ErrorBoundary from '@components/error/ErrorBoundary';
import Breadcrumb from '@components/common/Breadcrumb';
import { search } from '@api/search';
import { formatPrice, generatePlaceholderImageUrl } from '@utils/formatter';
import { loadCart, saveCart } from '@utils/cartUtils';
import { logError } from '@utils/errorHandling';

// Custom hooks
const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const searchConfigs = [
          { query: `id:"${id}"`, queryProfile: 'pdp' },
          { query: `unique_id:"${id}"`, queryProfile: 'default' },
          { query: `product_id:"${id}"`, queryProfile: 'default' }
        ];

        const fields = 'id,title,price,price_d,price_f,sale_price,image_url_s,image_url,image,image_url_t,image_urls,images,description,manufacturer,category,sku,sku_s,part_number,part_number_s,variant_images,variants,total_variants,unique_id,product_id,primary_color_s,weight,status,rating,reviews_count,stock_quantity,dimensions,material,color,finish,care_instructions,warranty,upc,model_number,attribute_*,online_shipping_b,chicago_inventory_i,sanfran_inventory_i,raleigh_inventory_i,chicago_store_b,sanfran_store_b,raleigh_store_b,ady_acustomer_b,ady_aprice_d,ady_customerb_b,ady_bprice_d,ady_customerc_b,ady_cprice_d,ady_customerd_b,ady_dprice_d';
        
        let productData = null;
        let result = null;

        for (const config of searchConfigs) {
          result = await search({
            ...config,
            rows: 1,
            fields
          });

          if (result.success && result.documents?.length > 0) {
            productData = result.documents[0];
            break;
          }
        }

        if (!productData) {
          throw new Error('Product not found');
        }

        // FleetPride products don't use product grouping/variants
        // Each product is standalone, so we just use the main product data
        let variantData = [];

        // Process variant data
        const processedVariants = variantData
          .filter(doc => doc.image_url_s || doc.image_url || doc.image || doc.image_url_t)
          .map(doc => ({
            image_url: doc.image_url_s || doc.image_url || doc.image || doc.image_url_t,
            part_number: doc.part_number || doc.part_number_s,
            sku: doc.sku || doc.sku_s || doc.id,
            title: doc.title,
            id: doc.id,
            product_id: doc.product_id,
            primary_color_s: doc.primary_color_s,
            online_shipping_b: doc.online_shipping_b,
            chicago_inventory_i: doc.chicago_inventory_i,
            sanfran_inventory_i: doc.sanfran_inventory_i,
            raleigh_inventory_i: doc.raleigh_inventory_i,
            price: doc.price || doc.price_d || doc.price_f,
            // User-specific availability and pricing fields
            ady_acustomer_b: doc.ady_acustomer_b,
            ady_aprice_d: doc.ady_aprice_d,
            ady_customerb_b: doc.ady_customerb_b,
            ady_bprice_d: doc.ady_bprice_d,
            ady_customerc_b: doc.ady_customerc_b,
            ady_cprice_d: doc.ady_cprice_d,
            ady_customerd_b: doc.ady_customerd_b,
            ady_dprice_d: doc.ady_dprice_d,
          }));

        const mainVariant = {
          image_url: productData.image_url_s || productData.image_url || productData.image || productData.image_url_t,
          part_number: productData.part_number || productData.part_number_s,
          sku: productData.sku || productData.sku_s || productData.id,
          title: productData.title,
          id: productData.id,
          product_id: productData.product_id,
          primary_color_s: productData.primary_color_s,
          online_shipping_b: productData.online_shipping_b,
          chicago_inventory_i: productData.chicago_inventory_i,
          sanfran_inventory_i: productData.sanfran_inventory_i,
          raleigh_inventory_i: productData.raleigh_inventory_i,
          price: productData.price || productData.price_d || productData.price_f,
          // User-specific availability and pricing fields
          ady_acustomer_b: productData.ady_acustomer_b,
          ady_aprice_d: productData.ady_aprice_d,
          ady_customerb_b: productData.ady_customerb_b,
          ady_bprice_d: productData.ady_bprice_d,
          ady_customerc_b: productData.ady_customerc_b,
          ady_cprice_d: productData.ady_cprice_d,
          ady_customerd_b: productData.ady_customerd_b,
          ady_dprice_d: productData.ady_dprice_d,
        };

        // Always ensure the current product is in the variant list (check by id, not image_url)
        const currentProductInVariants = processedVariants.some(v => v.id === productData.id);
        if (!currentProductInVariants) {
          processedVariants.unshift(mainVariant);
        }

        setProduct({
          ...productData,
          variant_images: processedVariants.map(v => v.image_url),
          variant_data: processedVariants.length > 0 ? processedVariants : [mainVariant],
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  return { product, loading, error };
};

const useProductImages = (product) => {
  return useMemo(() => {
    if (!product) return { mainImage: '', variantImages: [] };

    const productTitle = product.title || 'Unnamed Product';
    const mainImage = product.image_url_s || 
                     product.image_url || 
                     product.image || 
                     generatePlaceholderImageUrl(productTitle);

    let images = [];
    if (product.variant_images?.length > 0) {
      images = product.variant_images;
    } else {
      // Collect all possible image fields
      const imageFields = [
        product.image_url_s,
        product.image_url,
        product.image,
        product.image_url_t,
        ...(product.image_urls || []),
        ...(product.images || [])
      ];
      
      // Add variant images
      if (product.variants?.length > 0) {
        product.variants.forEach(variant => {
          imageFields.push(
            variant.image_url_s,
            variant.image_url,
            variant.image,
            variant.image_url_t,
            ...(variant.images || [])
          );
        });
      }
      
      images = [...new Set(imageFields.filter(img => img && img.trim()))];
    }

    return {
      mainImage,
      variantImages: images.length > 0 ? images : [mainImage]
    };
  }, [product]);
};

// Skeleton component
function ProductDetailSkeleton() {
  return (
    <Container maxWidth='lg' sx={{ py: 3 }}>
      <Skeleton variant='text' height={24} width='60%' sx={{ mb: 3 }} />
      
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Grid container>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2 }}>
              <Skeleton variant='rectangular' height={400} sx={{ borderRadius: 2 }} />
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 2 }}>
              <Skeleton variant='text' height={32} width='85%' sx={{ mb: 1 }} />
              <Skeleton variant='text' height={20} width='40%' sx={{ mb: 2 }} />
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant='text' height={16} width={`${100 - i * 5}%`} sx={{ mb: 0.5 }} />
              ))}
              
              <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Skeleton variant='text' height={48} width='40%' sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Skeleton variant='rectangular' width={70} height={40} />
                  <Skeleton variant='rectangular' width='100%' height={48} />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ p: 2, minHeight: 600 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Skeleton variant='rectangular' height={600} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant='rectangular' height={600} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

// How to Buy Section Component
const HowToBuySection = ({ product, selectedVariant, selectedStore }) => {
  const [selectedOption, setSelectedOption] = useState('pickup');

  // Get inventory for the selected store
  const getStoreInventory = useCallback(() => {
    if (!selectedStore || !selectedStore.inventoryField) return 0;
    const source = selectedVariant || product;
    const inventory = source?.[selectedStore.inventoryField];
    return typeof inventory === 'number' ? inventory : 0;
  }, [selectedStore, selectedVariant, product]);

  // Get total inventory across all stores for delivery
  const getTotalInventory = useCallback(() => {
    const source = selectedVariant || product;
    if (!source) return 0;
    const chicago = typeof source.chicago_inventory_i === 'number' ? source.chicago_inventory_i : 0;
    const sanfran = typeof source.sanfran_inventory_i === 'number' ? source.sanfran_inventory_i : 0;
    const raleigh = typeof source.raleigh_inventory_i === 'number' ? source.raleigh_inventory_i : 0;
    return chicago + sanfran + raleigh;
  }, [selectedVariant, product]);

  // Get delivery date (2 days from now)
  const getDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const storeInventory = getStoreInventory();
  const totalInventory = getTotalInventory();
  const isPickupAvailable = selectedStore && selectedStore.id !== 'online' && storeInventory > 0;
  const isDeliveryAvailable = totalInventory > 0;

  // Auto-select delivery if pickup is not available
  useEffect(() => {
    if (!isPickupAvailable && selectedOption === 'pickup') {
      setSelectedOption('delivery');
    }
  }, [isPickupAvailable, selectedOption]);

  // Don't show if online store is selected
  if (!selectedStore || selectedStore.id === 'online') {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
        How to Get It
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Pickup Option */}
        <Box
          onClick={() => isPickupAvailable && setSelectedOption('pickup')}
          sx={{
            flex: 1,
            minWidth: 160,
            p: 2,
            border: 2,
            borderColor: selectedOption === 'pickup' && isPickupAvailable ? '#f96302' : 'grey.300',
            borderRadius: 2,
            cursor: isPickupAvailable ? 'pointer' : 'default',
            position: 'relative',
            bgcolor: isPickupAvailable ? 'white' : 'grey.100',
            opacity: isPickupAvailable ? 1 : 0.6,
            transition: 'all 0.2s',
            '&:hover': isPickupAvailable ? {
              borderColor: '#f96302',
              boxShadow: '0 2px 8px rgba(249, 99, 2, 0.2)',
            } : {},
          }}
        >
          {selectedOption === 'pickup' && isPickupAvailable && (
            <CheckCircleIcon
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#f96302',
                fontSize: 20
              }}
            />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StorefrontIcon sx={{ color: isPickupAvailable ? 'text.primary' : 'grey.500' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isPickupAvailable ? 'text.primary' : 'grey.500' }}>
              Pickup
            </Typography>
          </Box>

          {isPickupAvailable ? (
            <>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                Today
              </Typography>
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                {storeInventory} in stock
              </Typography>
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600, mt: 0.5 }}>
                FREE
              </Typography>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              Not available at {selectedStore.label}
            </Typography>
          )}
        </Box>

        {/* Delivery Option */}
        <Box
          onClick={() => isDeliveryAvailable && setSelectedOption('delivery')}
          sx={{
            flex: 1,
            minWidth: 160,
            p: 2,
            border: 2,
            borderColor: selectedOption === 'delivery' && isDeliveryAvailable ? '#f96302' : 'grey.300',
            borderRadius: 2,
            cursor: isDeliveryAvailable ? 'pointer' : 'default',
            position: 'relative',
            bgcolor: isDeliveryAvailable ? 'white' : 'grey.100',
            opacity: isDeliveryAvailable ? 1 : 0.6,
            transition: 'all 0.2s',
            '&:hover': isDeliveryAvailable ? {
              borderColor: '#f96302',
              boxShadow: '0 2px 8px rgba(249, 99, 2, 0.2)',
            } : {},
          }}
        >
          {selectedOption === 'delivery' && isDeliveryAvailable && (
            <CheckCircleIcon
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#f96302',
                fontSize: 20
              }}
            />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocalShippingIcon sx={{ color: isDeliveryAvailable ? 'text.primary' : 'grey.500' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isDeliveryAvailable ? 'text.primary' : 'grey.500' }}>
              Delivery
            </Typography>
          </Box>

          {isDeliveryAvailable ? (
            <>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                {getDeliveryDate()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                {totalInventory} available
              </Typography>
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600, mt: 0.5 }}>
                FREE
              </Typography>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              Not available for delivery
            </Typography>
          )}
        </Box>
      </Box>

      {/* Store Info */}
      {selectedOption === 'pickup' && isPickupAvailable && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          Pickup at <strong>{selectedStore.label}</strong>
        </Typography>
      )}
    </Box>
  );
};

// Main component
export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { selectedStore } = useStore();
  const { isSignedIn } = useUser();

  const { product, loading, error } = useProduct(id);
  const { mainImage, variantImages } = useProductImages(product);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const query = new URLSearchParams(location.search).get('q') || '*:*';

  // Enhanced price handling with sale price support
  const regularPrice = product?.price || product?.price_d || product?.price_f || 0;
  const salePrice = product?.sale_price;
  const hasDiscount = salePrice && salePrice < regularPrice;
  const displayPrice = hasDiscount ? salePrice : regularPrice;
  const formattedPrice = formatPrice(displayPrice);
  const formattedRegularPrice = formatPrice(regularPrice);

  // Stock availability
  const stockQuantity = product?.stock_quantity;
  const isInStock = !stockQuantity || stockQuantity > 0;

  const breadcrumbItems = useMemo(() => [
    { label: 'Home', href: '/' },
    ...(product?.category ? [{ 
      label: product.category, 
      href: `/search?category=${encodeURIComponent(product.category)}&q=${encodeURIComponent(query)}` 
    }] : []),
    ...(product?.manufacturer ? [{ 
      label: product.manufacturer, 
      href: `/search?manufacturer=${encodeURIComponent(product.manufacturer)}&q=${encodeURIComponent(query)}` 
    }] : []),
  ], [product, query]);

  const showSnackbar = useCallback((message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }, []);

  const handleQuantityChange = useCallback((e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) setQuantity(value);
  }, []);

  const addToCart = useCallback(() => {
    try {
      const cart = loadCart() || [];
      let productToAdd = { ...product };

      if (variantImages.length > 1 && product.variant_data?.[selectedImage]) {
        const selectedVariant = product.variant_data[selectedImage];
        productToAdd = {
          ...product,
          id: selectedVariant.id || product.id,
          part_number: selectedVariant.part_number || product.part_number,
          sku: selectedVariant.sku,
          title: selectedVariant.title || product.title,
          image_url: selectedVariant.image_url,
          variant_info: {
            selected_sku: selectedVariant.sku,
            selected_image: selectedVariant.image_url,
            parent_id: product.id,
            variant_index: selectedImage,
          },
        };
      }

      const cartItemId = productToAdd.variant_info
        ? `${product.id}-${productToAdd.variant_info.selected_sku}`
        : productToAdd.id;

      const existingIndex = cart.findIndex(item => item.cart_id === cartItemId);

      if (existingIndex >= 0) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + quantity;
      } else {
        cart.push({
          ...productToAdd,
          cart_id: cartItemId,
          quantity,
          image: productToAdd.image_url || productToAdd.image_url_s || mainImage,
          category: productToAdd.category,
        });
      }

      saveCart(cart);
      const variantText = productToAdd.variant_info ? ` (${productToAdd.variant_info.selected_sku})` : '';
      showSnackbar(`${productToAdd.title}${variantText} added to cart!`);
    } catch {
      showSnackbar('Failed to add item to cart');
    }
  }, [product, selectedImage, quantity, variantImages.length, mainImage, showSnackbar]);

  if (loading) return <ProductDetailSkeleton />;
  
  if (error || !product) {
    return (
      <Container maxWidth='lg' sx={{ py: 8 }}>
        <Typography color='error' align='center'>
          {error || 'Product not found'}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: 3 }}>
      {/* Breadcrumb */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumb items={breadcrumbItems} />
      </Box>

      {/* Main Content - Top Row: Image Gallery + Details/Pricing */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Product Image Gallery Section - narrower */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <ImageGallery
              images={variantImages}
              productTitle={product.title}
              variantData={product.variant_data}
              selectedIndex={selectedImage}
              onImageSelect={setSelectedImage}
            />
          </Paper>
        </Grid>

        {/* Product Details Section - wider */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Manufacturer/Brand Badge */}
              {product.manufacturer && (
                <Chip
                  label={product.manufacturer}
                  size="small"
                  sx={{
                    alignSelf: 'flex-start',
                    mb: 1,
                    fontWeight: 600,
                    bgcolor: 'primary.50',
                    color: 'primary.main'
                  }}
                />
              )}

              {/* Product Title */}
              <Typography variant='h4' component='h1' sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}>
                {product.title}
              </Typography>

              {/* Part Numbers - updates based on selected variant */}
              {(() => {
                const selectedVariant = product.variant_data?.[selectedImage];
                const partNumber = product.part_number || product.part_number_s || '';
                const sku = selectedVariant?.sku || product.sku || product.sku_s || '';

                if (!partNumber && !sku) return null;

                return (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                    {partNumber && (
                      <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        Part #: <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{partNumber}</Box>
                      </Typography>
                    )}
                    {sku && (
                      <>
                        {partNumber && (
                          <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>•</Box>
                        )}
                        <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          MPN: <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{sku}</Box>
                        </Typography>
                      </>
                    )}
                  </Box>
                );
              })()}

              {/* Rating */}
              <Box sx={{ mb: 1.5 }}>
                <ProductRating
                  rating={product.rating}
                  reviewsCount={product.reviews_count}
                  size="medium"
                />
              </Box>

              {/* Collection Link */}
              {product.attribute_at_collection_ss && (
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  from the{' '}
                  <Link
                    to={`/?q=${encodeURIComponent(product.attribute_at_collection_ss)}`}
                    style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600 }}
                  >
                    {product.attribute_at_collection_ss} Collection
                  </Link>
                </Typography>
              )}

              {/* Price Section - only show when logged out */}
              {!isSignedIn && (
                <>
                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                      <Typography variant='h3' sx={{ fontWeight: 700, color: hasDiscount ? 'error.main' : 'primary.main' }}>
                        {formattedPrice}
                      </Typography>
                      {hasDiscount && (
                        <Typography
                          variant='h6'
                          sx={{
                            textDecoration: 'line-through',
                            color: 'text.secondary',
                            fontWeight: 400
                          }}
                        >
                          {formattedRegularPrice}
                        </Typography>
                      )}
                      {hasDiscount && (
                        <Chip
                          label={`Save ${Math.round(((regularPrice - salePrice) / regularPrice) * 100)}%`}
                          size="small"
                          color="error"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>

                  </Box>

                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Short Description - only show when logged out */}
              {!isSignedIn && (
                <Typography
                  variant='body2'
                  sx={{
                    lineHeight: 1.7,
                    mb: 2,
                    color: 'text.secondary',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {product.description || 'No detailed description available for this product.'}
                </Typography>
              )}

              {/* B2B Pricing Section - only show when logged in */}
              {isSignedIn && (
                <B2BPricingSection
                  product={product}
                  selectedVariant={product.variant_data?.[selectedImage]}
                  onQuantitySelect={setQuantity}
                  quantity={quantity}
                  onQuantityChange={handleQuantityChange}
                  onAddToCart={addToCart}
                  isInStock={isInStock}
                />
              )}

              {/* Variant Selection - only show when logged out */}
              {!isSignedIn && variantImages.length > 1 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                    Select Option:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {variantImages.map((img, idx) => {
                      const variantInfo = product.variant_data?.[idx] || { sku: `Option ${idx + 1}` };
                      const isSelected = selectedImage === idx;

                      return (
                        <Box
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          sx={{
                            cursor: 'pointer',
                            border: isSelected ? 2 : 1,
                            borderColor: isSelected ? 'primary.main' : 'rgba(0,0,0,0.23)',
                            borderRadius: 1.5,
                            p: 1,
                            bgcolor: isSelected ? 'primary.50' : 'white',
                            minWidth: 80,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              borderColor: 'primary.main',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }
                          }}
                        >
                          <Box
                            component='img'
                            src={img}
                            alt={variantInfo.primary_color_s || variantInfo.sku}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'contain',
                              bgcolor: '#f9f9f9',
                              borderRadius: 1
                            }}
                            onError={(e) => {
                              e.target.src = mainImage;
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* How to Buy Section - only show when logged out */}
              {!isSignedIn && (
                <HowToBuySection
                  product={product}
                  selectedVariant={product.variant_data?.[selectedImage]}
                  selectedStore={selectedStore}
                />
              )}

              {/* Purchase Section - only show when logged out */}
              {!isSignedIn && (
                <Box sx={{ mt: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block' }}>
                        Quantity
                      </Typography>
                      <TextField
                        select
                        value={quantity}
                        onChange={handleQuantityChange}
                        SelectProps={{ native: true }}
                        size='small'
                        sx={{ minWidth: 80 }}
                      >
                        {[...Array(Math.min(stockQuantity || 10, 10))].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </TextField>
                    </Box>

                    <Button
                      variant='contained'
                      onClick={addToCart}
                      disabled={!isInStock}
                      className='lw-cart-add-trigger'
                      sx={{
                        flex: 1,
                        bgcolor: '#C99063',
                        py: 1.75,
                        fontWeight: 600,
                        fontSize: '1rem',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#B8804F' },
                        '&:disabled': {
                          bgcolor: 'grey.300',
                          color: 'grey.600'
                        }
                      }}
                    >
                      {isInStock ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                  </Box>

                  {/* Quick Specs */}
                  {(product.part_number || product.sku || product.weight || product.dimensions) && (
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}>
                      <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
                        QUICK SPECS
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {(product.part_number || product.part_number_s) && (
                          <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                            <strong>Part #:</strong> <Box component="span" sx={{ fontFamily: 'monospace' }}>{product.part_number || product.part_number_s}</Box>
                          </Typography>
                        )}
                        {(product.sku || product.sku_s) && (
                          <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                            <strong>MPN:</strong> <Box component="span" sx={{ fontFamily: 'monospace' }}>{product.sku || product.sku_s}</Box>
                          </Typography>
                        )}
                        {product.weight && (
                          <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                            <strong>Weight:</strong> {product.weight} lbs
                          </Typography>
                        )}
                        {product.dimensions && (
                          <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                            <strong>Dimensions:</strong> {product.dimensions}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabbed Product Information Section */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 2 }}>
        <ProductDetailTabs product={product} />
      </Paper>

      {/* FAQ and Q&A Section */}
      {product._lw_ai_faq_enrichment_t && (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', p: 2 }}>
          <Grid container spacing={2}>
            {/* FAQs and Resources */}
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                minHeight: 600,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* FAQs */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#537E87' }}>
                    <QuizIcon fontSize="small" />
                  </Avatar>
                  <Typography variant='h6' sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    Frequently Asked Questions
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  <ProductFAQList faqData={product._lw_ai_faq_enrichment_t} />

                  {/* Resources */}
                  {product._lw_has_pdfs !== false && product._lw_pdf_title_ss && (
                    <Box sx={{ mt: 3 }}>
                      <ProductResources product={product} />
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Q&A Bot */}
            <Grid item xs={12} md={6}>
              <Box sx={{
                minHeight: 600,
                borderRadius: 2,
                bgcolor: 'grey.50',
                p: 2
              }}>
                <ErrorBoundary
                  componentName='QnAWidget'
                  fallbackComponent={(props) => (
                    <EmbeddedComponentError
                      {...props}
                      title='Q&A Widget Failed to Load'
                      message='Unable to load the Q&A widget. Please try again later.'
                      minHeight='400px'
                    />
                  )}
                  onError={(error, info) =>
                    logError(error, {
                      componentName: 'QnAWidget',
                      productId: product?.id,
                      componentStack: info?.componentStack,
                    })
                  }
                >
                  <LW_Embeddable
                    id='qna-template-1'
                    mockMode={true}
                    productId={product?.id || product?.unique_id || '1251002'}
                    product={product}
                  />
                </ErrorBoundary>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Mobile Cart Button */}
      {isMobile && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            p: 1.5,
            zIndex: 1000,
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant='h6' color='error.main' sx={{ fontWeight: 600 }}>
            {formattedPrice}
          </Typography>
          <Button
            variant='contained'
            onClick={addToCart}
            className='lw-cart-add-trigger'
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            Add to Cart
          </Button>
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity='success'
          variant='filled'
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
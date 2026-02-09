import React, { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  TextField,
  Button,
  Link,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { formatPrice } from '@utils/formatter';
import { loadCart, saveCart } from '@utils/cartUtils';
import { useStore } from '@context/StoreContext';
import { useUser } from '@context/UserContext';

function ProductTableRow({ product, selected, onSelect }) {
  const location = useLocation();
  const { selectedStore } = useStore();
  const { isSignedIn, currentUser } = useUser();
  const [quantity, setQuantity] = useState(1);

  const searchParams = new URLSearchParams(location.search);
  const currentQuery = searchParams.get('q') || '*:*';

  if (!product || !product.id) {
    return null;
  }

  const productTitle = product.title || 'Unnamed Product';
  const productImage = product.image_url_s || product.image_url || product.image || '';
  const price = product.price || product.price_d || product.price_f || 0;
  const sku = product.sku || product.id;

  // Get inventory for selected store
  const getInventory = () => {
    if (!selectedStore || !selectedStore.inventoryField) return null;
    const inventory = product[selectedStore.inventoryField];
    return typeof inventory === 'number' ? inventory : null;
  };

  const inventory = getInventory();
  const hasOnlineShipping = product.online_shipping_b === true;

  // Calculate total inventory across all locations (for logged-in users)
  const getTotalInventory = () => {
    const chicagoInventory = product.chicago_inventory_i || 0;
    const sanfranInventory = product.sanfran_inventory_i || 0;
    const raleighInventory = product.raleigh_inventory_i || 0;
    return chicagoInventory + sanfranInventory + raleighInventory;
  };

  const totalInventory = getTotalInventory();

  // User-specific pricing (for logged-in users like Sarah/user1)
  // Field naming: user1=ady_acustomer_b/ady_aprice_d, user2=ady_customerb_b/ady_priceb_d, etc.
  const getUserPricing = () => {
    if (!isSignedIn || !currentUser) return null;

    // Map user IDs to their field names
    const userFieldMap = {
      'user1': { available: 'ady_acustomer_b', price: 'ady_aprice_d' },
      'user2': { available: 'ady_customerb_b', price: 'ady_bprice_d' },
      'user3': { available: 'ady_customerc_b', price: 'ady_cprice_d' },
      'user4': { available: 'ady_customerd_b', price: 'ady_dprice_d' },
    };

    const userFields = userFieldMap[currentUser.id];
    if (!userFields) return null;

    const isAvailableForUser = product[userFields.available];
    const userPrice = product[userFields.price];

    return {
      isAvailable: isAvailableForUser === true,
      hasAvailabilityData: isAvailableForUser !== undefined,
      userPrice: typeof userPrice === 'number' ? userPrice : null,
    };
  };

  const userPricing = getUserPricing();

  // Volume pricing tiers (simulated)
  const getPricingTiers = (basePrice) => {
    return [
      { qty: 1, price: basePrice },
      { qty: 4, price: basePrice * 0.95 },
      { qty: 12, price: basePrice * 0.90 },
      { qty: 52, price: basePrice * 0.85 },
      { qty: 100, price: basePrice * 0.80 },
    ];
  };

  const pricingTiers = getPricingTiers(price);

  const handleAddToCart = () => {
    try {
      const cart = loadCart() || [];
      const existingIndex = cart.findIndex(item => item.cart_id === product.id);

      if (existingIndex >= 0) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + quantity;
      } else {
        cart.push({
          ...product,
          cart_id: product.id,
          quantity,
          image: productImage,
        });
      }

      saveCart(cart);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  // Get variant images (up to 4)
  const variantImages = product.variant_images || [];
  const variantData = product.variant_data || [];
  const displayVariants = variantImages.slice(0, 4);
  const remainingCount = variantImages.length - 4;

  // Grid template columns - include checkbox column only for signed-in users
  const gridTemplateColumns = isSignedIn
    ? '40px 80px 120px 100px 120px 1fr 100px 180px 120px'
    : '80px 120px 100px 120px 1fr 100px 180px 120px';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns,
        alignItems: 'center',
        gap: 2,
        py: 2,
        px: 1,
        borderBottom: '1px solid #e0e0e0',
        '&:hover': {
          bgcolor: 'rgba(0, 0, 0, 0.02)',
        },
      }}
    >
      {/* Checkbox - only for signed-in users */}
      {isSignedIn && (
        <Box>
          <Checkbox
            checked={selected}
            onChange={(e) => onSelect?.(product.id, e.target.checked)}
            size="small"
          />
        </Box>
      )}

      {/* Image */}
      <Box
        component={RouterLink}
        to={`/product/${product.id}?q=${encodeURIComponent(currentQuery)}`}
        sx={{ display: 'flex', justifyContent: 'center' }}
      >
        <Box
          component="img"
          src={productImage}
          alt={productTitle}
          sx={{
            width: 60,
            height: 60,
            objectFit: 'contain',
            borderRadius: 1,
          }}
          onError={(e) => {
            e.target.src = `https://placehold.co/60x60/f5f5f5/999?text=${encodeURIComponent(productTitle.charAt(0))}`;
          }}
        />
      </Box>

      {/* Part # / SKU */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
          LucidHome Part #
        </Typography>
        <Link
          component={RouterLink}
          to={`/product/${product.id}?q=${encodeURIComponent(currentQuery)}`}
          sx={{
            color: '#0066cc',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.8rem',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {product.sku_s || sku}
        </Link>
      </Box>

      {/* Manufacturer */}
      <Box>
        <Link
          component={RouterLink}
          to={`/search?manufacturer=${encodeURIComponent(product.manufacturer || '')}&q=*:*`}
          sx={{
            color: '#0066cc',
            textDecoration: 'none',
            fontSize: '0.8rem',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {product.manufacturer || '-'}
        </Link>
      </Box>

      {/* Variants */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
        {displayVariants.length > 0 ? (
          <>
            {displayVariants.map((imgUrl, idx) => (
              <Box
                key={idx}
                component={RouterLink}
                to={variantData[idx]?.id ? `/product/${variantData[idx].id}?q=${encodeURIComponent(currentQuery)}` : `/product/${product.id}?q=${encodeURIComponent(currentQuery)}`}
                sx={{
                  width: 32,
                  height: 32,
                  border: '1px solid #e0e0e0',
                  borderRadius: 0.5,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: '#0066cc',
                  },
                }}
              >
                <Box
                  component="img"
                  src={imgUrl}
                  alt={`Variant ${idx + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.src = `https://placehold.co/32x32/f5f5f5/999?text=${idx + 1}`;
                  }}
                />
              </Box>
            ))}
            {remainingCount > 0 && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  ml: 0.5,
                }}
              >
                +{remainingCount}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            -
          </Typography>
        )}
      </Box>

      {/* Product Name/Title */}
      <Box>
        <Link
          component={RouterLink}
          to={`/product/${product.id}?q=${encodeURIComponent(currentQuery)}`}
          sx={{
            color: '#333',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.85rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            '&:hover': {
              color: '#0066cc',
              textDecoration: 'underline'
            },
          }}
        >
          {productTitle}
        </Link>
      </Box>

      {/* Availability */}
      <Box sx={{ textAlign: 'center' }}>
        {isSignedIn ? (
          // Logged-in users: show total inventory across all locations
          totalInventory > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32', fontSize: '0.85rem' }}>
                  {totalInventory}
                </Typography>
                <LocalShippingIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#2e7d32', fontSize: '0.65rem' }}>
                available for shipping
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: '#d32f2f', fontSize: '0.75rem' }}>
              Out of Stock
            </Typography>
          )
        ) : selectedStore && selectedStore.id !== 'online' ? (
          inventory !== null ? (
            inventory > 0 ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32', fontSize: '0.85rem' }}>
                  {inventory}
                </Typography>
                <Typography variant="caption" sx={{ color: '#2e7d32', fontSize: '0.7rem' }}>
                  In Stock
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: '#d32f2f', fontSize: '0.75rem' }}>
                Out of Stock
              </Typography>
            )
          ) : (
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
              Check
            </Typography>
          )
        ) : (
          hasOnlineShipping ? (
            <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 500, fontSize: '0.75rem' }}>
              Available
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: '#d32f2f', fontSize: '0.75rem' }}>
              Unavailable
            </Typography>
          )
        )}
      </Box>

      {/* Pricing (USD) */}
      <Box>
        {isSignedIn && userPricing?.hasAvailabilityData ? (
          // Logged-in user with user-specific pricing data
          userPricing.isAvailable ? (
            // User has access - show original price crossed out and user's price
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  textDecoration: 'line-through',
                  display: 'block',
                }}
              >
                {formatPrice(price)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#2e7d32',
                  mt: 0.5,
                }}
              >
                Your price: {formatPrice(userPricing.userPrice || price * 0.85)}
              </Typography>
            </Box>
          ) : (
            // User doesn't have access - show contact message
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: 'text.secondary',
                fontStyle: 'italic',
                display: 'block',
                lineHeight: 1.3,
              }}
            >
              Contact your local representative for pricing information
            </Typography>
          )
        ) : (
          // Default pricing display (not logged in or no user-specific data)
          <>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
              Price by Qty.
            </Typography>
            {pricingTiers.slice(0, 3).map((tier, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <Typography variant="caption" sx={{ color: '#0066cc', fontWeight: 500 }}>
                  {tier.qty}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: idx === 0 ? 600 : 400 }}>
                  {formatPrice(tier.price)}
                </Typography>
              </Box>
            ))}
          </>
        )}
      </Box>

      {/* Qty Input + Buy Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TextField
          type="number"
          size="small"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          inputProps={{ min: 1, style: { textAlign: 'center', fontSize: '0.85rem' } }}
          sx={{
            width: 55,
            '& .MuiOutlinedInput-root': {
              height: 32,
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAddToCart}
          sx={{
            bgcolor: '#4caf50',
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            minWidth: 50,
            height: 32,
            '&:hover': { bgcolor: '#388e3c' },
          }}
        >
          Buy
        </Button>
      </Box>
    </Box>
  );
}

export default React.memo(ProductTableRow);

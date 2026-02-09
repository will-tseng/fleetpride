import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  CardMedia,
  Button,
  IconButton,
  Divider,
  TextField,
  Paper,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Snackbar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { logError } from '@utils/errorHandling';
import EmbeddedComponentError from '../error/EmbeddedComponentError';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { loadCart, saveCart, clearCart, calculateCartTotals } from '@utils/cartUtils';
import { truncateText, formatPrice as formatPriceUtil } from '@utils/formatter'; // Import and alias formatPrice
import ErrorBoundary from '../error/ErrorBoundary';

// Memoized cart item component
const CartItem = React.memo(({ item, onUpdateQuantity, onRemoveItem }) => {
  const getImageUrl = useCallback((item) => {
    return item.image || `https://placehold.co/400x300/e9e9e9/969696?text=${encodeURIComponent(item.title || 'Product')}`;
  }, []);

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }} className="lw-cart-item" data-product-id={item.id}>
      {/* Product Image */}
      <Box
        component={RouterLink}
        to={`/product/${item.variant_info?.parent_id || item.id}`}
        sx={{ textDecoration: 'none', color: 'inherit', mr: 2, minWidth: 80, maxWidth: 80 }}
      >
        <CardMedia
          component="img"
          height={80}
          image={getImageUrl(item)}
          alt={item.title}
          sx={{
            objectFit: 'contain',
            background: '#f9f9f9',
            borderRadius: 1,
            width: 80,
            height: 80
          }}
        />
      </Box>
      {/* Product Details */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box
            component={RouterLink}
            to={`/product/${item.variant_info?.parent_id || item.id}`}
            sx={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
          >
            <Typography className="lw-cart-item-title" variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {truncateText(item.title, 50)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              SKU: {item.variant_info?.selected_sku || item.sku || 'N/A'}
            </Typography>
            {item.variant_info?.selected_sku && (
              <Typography variant="body2" color="primary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                Selected Variant: {item.variant_info.selected_sku}
              </Typography>
            )}
            <Typography className="lw-cart-item-price" variant="body2" color="text.secondary">
              Unit Price: {formatPriceUtil(item.price) || 'N/A'}
            </Typography>
            {item.manufacturer && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {item.manufacturer || item.category}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120, justifyContent: 'flex-end', ml: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {formatPriceUtil(item.price || item.price_d)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <IconButton
            size="small"
            onClick={() => onUpdateQuantity(item.cart_id || item.id, (item.quantity || 1) - 1)}
            disabled={(item.quantity || 1) <= 1}
          >
            <RemoveIcon />
          </IconButton>
          <TextField
            className="lw-cart-item-quantity"
            size="small"
            value={item.quantity || 1}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value > 0) {
                onUpdateQuantity(item.cart_id || item.id, value);
              }
            }}
            inputProps={{
              min: 1,
              style: { textAlign: 'center', width: '30px' }
            }}
            variant="outlined"
            sx={{ mx: 1, width: 60 }}
          />
          <IconButton
            size="small"
            onClick={() => onUpdateQuantity(item.cart_id || item.id, (item.quantity || 1) + 1)}
          >
            <AddIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => onRemoveItem(item.cart_id || item.id)}
            sx={{ ml: 2 }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
});

function Cart() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  // Memoized cart totals calculation
  const cartTotals = useMemo(() => {
    return calculateCartTotals(cartItems);
  }, [cartItems]);

  // Load cart data on component mount
  useEffect(() => {
    const items = loadCart();
    setCartItems(items);
    setIsLoading(false);
  }, []);

  // Optimized handlers with useCallback
  const updateQuantity = useCallback((cartItemId, newQuantity) => {
    try {
      if (newQuantity < 1) return;

      const updatedCart = cartItems.map(item => 
        item.cart_id === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      
      saveCart(updatedCart);
      setCartItems(updatedCart);
      
      setSnackbarSeverity('success');
      setSnackbarMessage('Cart updated');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Failed to update cart');
      setSnackbarOpen(true);
    }
  }, [cartItems]);

  const removeItem = useCallback((cartItemId) => {
    try {
      const itemToRemove = cartItems.find(item => item.cart_id === cartItemId);
      const updatedCart = cartItems.filter(item => item.cart_id !== cartItemId);
      
      saveCart(updatedCart);
      setCartItems(updatedCart);
      
      const variantText = itemToRemove?.variant_info?.selected_sku ? 
        ` (${itemToRemove.variant_info.selected_sku})` : '';
      setSnackbarSeverity('success');
      setSnackbarMessage(`${itemToRemove?.title || 'Item'}${variantText} removed from cart`);
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Failed to remove item');
      setSnackbarOpen(true);
    }
  }, [cartItems]);

  const handleClearCart = useCallback(() => {
    try {
      clearCart();
      setCartItems([]);
      
      setSnackbarSeverity('success');
      setSnackbarMessage('Cart cleared');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Failed to clear cart');
      setSnackbarOpen(true);
    }
  }, []);

  const handleCheckout = useCallback(() => {
    clearCart();
    setCartItems([]);
    setPurchaseComplete(true);
  }, []);

  // Show thank you hero if purchase is complete
  if (purchaseComplete) {
    return (
      <Box sx={{ flexGrow: 1, py: 8, backgroundColor: 'background.default', minHeight: 'calc(100vh - 300px)' }}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Thank you for your purchase!
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
              Your order has been placed and is being processed.<br />
              You will receive a confirmation email shortly.
            </Typography>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2 }}
            >
              Continue Shopping
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Empty cart state
  if (cartItems.length === 0 && !isLoading) {
    return (
      <Box sx={{ flexGrow: 1, py: 4, backgroundColor: 'background.default', minHeight: 'calc(100vh - 300px)' }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 3 }}>
            <MuiLink component={RouterLink} to="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            <Typography color="text.primary">Shopping Cart</Typography>
          </Breadcrumbs>
          
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', mb: 4 }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 60, color: '#999', mb: 2 }} />
            <Typography variant="h5" gutterBottom>Your cart is empty</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Looks like you haven't added any products to your cart yet.
            </Typography>
            <Button 
              component={RouterLink} 
              to="/"
              variant="contained" 
              color="primary" 
              size="large"
            >
              Continue Shopping
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1, py: { xs: 2, md: 4 }, backgroundColor: 'background.default', minHeight: 'calc(100vh - 300px)' }}>
      <Container maxWidth="lg">
        <Breadcrumbs sx={{ mb: 2, display: { xs: 'none', sm: 'flex' } }}>
          <MuiLink component={RouterLink} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">Shopping Cart</Typography>
        </Breadcrumbs>

        <Grid container spacing={3} alignItems="flex-start">
          {/* Cart Items */}
          <Grid item xs={12} md={8} order={isMobile ? 2 : 1}>
            <Paper elevation={0} sx={{ mb: 3, p: { xs: 2, md: 3 }, minHeight: 400 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                Shopping Cart ({cartTotals.totalItems} {cartTotals.totalItems === 1 ? 'item' : 'items'})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: { xs: 'none', md: 500 }, overflowY: { md: 'auto' } }}>
                {cartItems.map((item) => (
                  <ErrorBoundary 
                    key={item.cart_id || item.id} 
                    componentName={`CartItem-${item.id}`}
                    onError={(error, info) => logError(error, { 
                      componentName: 'CartItem', 
                      productId: item.id,
                      title: item.title,
                      componentStack: info?.componentStack 
                    })}
                    fallbackComponent={props => (
                      <EmbeddedComponentError 
                        {...props} 
                        title="Cart Item Error" 
                        message="This item couldn't be displayed properly. You can try removing it and adding it again." 
                        variant="warning"
                        minHeight="130px"
                      />
                    )}
                  >
                    <CartItem 
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemoveItem={removeItem}
                    />
                  </ErrorBoundary>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Button
                  component={RouterLink}
                  to="/"
                  variant="outlined"
                  sx={{ 
                    textTransform: 'none',
                    borderColor: '#ddd',
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main'
                    }
                  }}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearCart}
                  sx={{ textTransform: 'none' }}
                >
                  Clear Cart
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4} order={isMobile ? 1 : 2}>
            <Paper elevation={0} sx={{
              p: 3,
              mb: 3,
              position: { md: 'sticky' },
              top: { md: 90 },
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              background: '#fff'
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal ({cartTotals.totalItems} items)</Typography>
                <Typography>{formatPriceUtil(cartTotals.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Estimated Tax</Typography>
                <Typography>{formatPriceUtil(cartTotals.tax)}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Estimated Total</Typography>
                <Typography variant="h6" className="lw-cart-total-price" sx={{ fontWeight: 600 }}>{formatPriceUtil(cartTotals.total)}</Typography>
              </Box>
              <Button
                variant="contained"
                className='lw-purchase-trigger'
                fullWidth
                size="large"
                sx={{ 
                  mt: 2, 
                  py: 1.5, 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </Paper>
          </Grid>
        </Grid>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default Cart;

import { logger } from './logger';

// Storage keys
const CART_ITEMS_KEY = 'fusionCart';
const CART_TIMESTAMP_KEY = 'fusionCartTimestamp';

// Cart expiration time (30 minutes)
const CART_EXPIRATION_TIME = 30 * 60 * 1000;

/**
 * Save cart to sessionStorage
 */
export const saveCart = (items) => {
  try {
    sessionStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
    sessionStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (error) {
    logger.error('Error saving cart:', error);
  }
};

/**
 * Load cart from sessionStorage
 */
export const loadCart = () => {
  try {
    const timestamp = parseInt(sessionStorage.getItem(CART_TIMESTAMP_KEY), 10);
    const now = Date.now();
    
    // Clear expired cart
    if (!timestamp || now - timestamp > CART_EXPIRATION_TIME) {
      clearCart();
      return [];
    }
    
    // Update access timestamp
    sessionStorage.setItem(CART_TIMESTAMP_KEY, now.toString());
    
    const cartItems = sessionStorage.getItem(CART_ITEMS_KEY);
    return cartItems ? JSON.parse(cartItems) : [];
  } catch (error) {
    logger.error('Error loading cart:', error);
    return [];
  }
};

/**
 * Clear cart from sessionStorage
 */
export const clearCart = () => {
  try {
    sessionStorage.removeItem(CART_ITEMS_KEY);
    sessionStorage.removeItem(CART_TIMESTAMP_KEY);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (error) {
    logger.error('Error clearing cart:', error);
  }
};

/**
 * Calculate cart totals
 */
export const calculateCartTotals = (cartItems) => {
  const subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price || 0);
    const quantity = parseInt(item.quantity || 1);
    return sum + (price * quantity);
  }, 0);
  
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const totalItems = cartItems.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
  
  return { subtotal, tax, total, totalItems };
};

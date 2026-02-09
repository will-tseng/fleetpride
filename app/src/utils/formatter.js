import { logger } from '../utils/logger';

/**
 * Format price with currency symbol and decimal points
 * 
 * @param {number} price - The price to format
 * @param {string} currency - Currency code (default: USD)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = 'USD', decimals = 2) => {
  if (price === undefined || price === null) return '';
  
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥'
  };
  
  const symbol = symbols[currency] || '';
  return `${symbol}${parseFloat(price).toFixed(decimals)}`;
};

/**
 * Truncate text with ellipsis
 * 
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length (default: 100)
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Format date to locale string
 * 
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale code (default: browser locale)
 * @returns {string} Formatted date
 */
export const formatDate = (date, locale = navigator.language) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    logger.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Get field value with fallbacks
 * 
 * @param {Object} obj - Source object
 * @param {string[]} fields - Field keys to try in order
 * @param {any} defaultValue - Default value if all fields are undefined
 * @returns {any} First defined field value or default value
 */
export const getFieldWithFallback = (obj, fields, defaultValue = '') => {
  if (!obj) return defaultValue;
  
  for (const field of fields) {
    if (obj[field] !== undefined && obj[field] !== null) {
      return obj[field];
    }
  }
  
  return defaultValue;
};

/**
 * Generate a placeholder image URL from placehold.co
 * @param {string} title - Text to display on the placeholder
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} backgroundColor - Background color hex (without #)
 * @param {string} textColor - Text color hex (without #)
 * @returns {string} Placeholder image URL
 */
export const generatePlaceholderImageUrl = (
  title = 'Product',
  width = 400,
  height = 300,
  backgroundColor = 'e9e9e9',
  textColor = '969696'
) => {
  const encodedTitle = encodeURIComponent(title);
  return `https://placehold.co/${width}x${height}/${backgroundColor}/${textColor}?text=${encodedTitle}`;
};

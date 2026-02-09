/**
 * Error handling utilities for Lucidworks embedded script
 * Provides graceful degradation when signal store APIs fail
 */

import { logger } from './logger';

/**
 * Simple error handler for Lucidworks API failures
 */
export const handleLucidworksError = (error, context = 'Lucidworks') => {
  const isNetworkError = error.message?.includes('fetch') || !navigator.onLine;
  
  // Log with appropriate level
  if (isNetworkError) {
    logger.warn(`${context} network error (graceful degradation):`, error.message);
  } else {
    logger.error(`${context} error:`, error.message);
  }

  return {
    success: false,
    error: error.message,
    isNetworkError,
    shouldRetry: isNetworkError && navigator.onLine
  };
};

/**
 * Safe wrapper for Lucidworks functions
 */
export const createSafeLucidworksWrapper = (originalFunction, context = 'Lucidworks function') => {
  return async function(...args) {
    try {
      return await originalFunction.apply(this, args);
    } catch (error) {
      handleLucidworksError(error, context);
      return null; // Graceful degradation
    }
  };
};

/**
 * Simple retry with exponential backoff
 */
export const retryLucidworksOperation = async (operation, options = {}) => {
  const { maxRetries = 3 } = options;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      // Simple exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Simple script monitoring
 */
export const monitorLucidworksScript = (options = {}) => {
  // eslint-disable-next-line no-unused-vars
  const { onScriptLoaded, onScriptError, onScriptTimeout } = options;
  
  // Simple check if script exists
  setTimeout(() => {
    const script = document.querySelector('[id*="lw"]') || document.querySelector('lw-template');
    if (script) {
      logger.info('Lucidworks script detected');
      onScriptLoaded && onScriptLoaded();
    } else {
      logger.warn('Lucidworks script not found');
      onScriptError && onScriptError(new Error('Script not found'));
    }
  }, 1000);
  
  return { cleanup: () => {} };
};

/**
 * Simple network monitor
 */
export const createNetworkMonitor = (onStatusChange) => {
  const handleOnline = () => onStatusChange && onStatusChange(true);
  const handleOffline = () => onStatusChange && onStatusChange(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return {
    cleanup: () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
};

/**
 * Simple global error handler setup
 */
export const setupGlobalLucidworksErrorHandler = (errorCallback) => {
  const handleError = (event) => {
    if (event.error && errorCallback) {
      errorCallback(event.error, { type: 'global-error' });
    }
  };
  
  window.addEventListener('error', handleError);
  
  return () => {
    window.removeEventListener('error', handleError);
  };
};

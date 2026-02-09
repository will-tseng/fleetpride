import { useState, useCallback } from 'react';
import { getUserFriendlyError } from '@utils/errorHandling';

/**
 * Custom hook for managing error notifications
 *
 * @param {Object} options - Configuration options
 * @param {number} options.autoHideDuration - Auto-hide duration in ms (default: 6000)
 * @param {Object} options.position - Notification position (default: { vertical: 'top', horizontal: 'center' })
 * @param {Function} options.onRetry - Callback when retry is clicked
 *
 * @returns {Object} Error notification utilities
 */
export const useErrorNotification = (options = {}) => {
  const {
    autoHideDuration = 6000,
    position = { vertical: 'top', horizontal: 'center' },
    onRetry
  } = options;

  const [notification, setNotification] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Show error notification
   */
  const showError = useCallback((error) => {
    const friendlyError = getUserFriendlyError(error);

    setNotification({
      ...friendlyError,
      raw: error,
      timestamp: Date.now()
    });
    setIsOpen(true);
  }, []);

  /**
   * Show custom notification
   */
  const showNotification = useCallback((title, message, severity = 'error') => {
    setNotification({
      title,
      message,
      severity,
      canRetry: false,
      timestamp: Date.now()
    });
    setIsOpen(true);
  }, []);

  /**
   * Close notification
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Handle retry button click
   */
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry(notification?.raw);
    }
    close();
  }, [notification, onRetry, close]);

  /**
   * Clear notification state
   */
  const clear = useCallback(() => {
    setNotification(null);
    setIsOpen(false);
  }, []);

  return {
    // State
    notification,
    isOpen,

    // Methods
    showError,
    showNotification,
    close,
    handleRetry,
    clear,

    // Config
    autoHideDuration,
    position
  };
};

export default useErrorNotification;

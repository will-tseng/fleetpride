import { useState, useCallback, useRef } from 'react';
import { retryWithBackoff, classifyError, ErrorTypes, getUserFriendlyError } from '@utils/errorHandling';

/**
 * Custom hook for error recovery with automatic retry logic
 *
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms for exponential backoff (default: 1000)
 * @param {Function} options.onError - Callback when an error occurs
 * @param {Function} options.onRetry - Callback when a retry is attempted
 * @param {Function} options.onSuccess - Callback when operation succeeds
 *
 * @returns {Object} Error recovery utilities
 */
export const useErrorRecovery = (options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    onError,
    onRetry,
    onSuccess
  } = options;

  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const lastOperationRef = useRef(null);

  /**
   * Execute an operation with automatic retry logic
   */
  const executeWithRetry = useCallback(async (operation, operationOptions = {}) => {
    const {
      enableRetry = true,
      retryableErrorTypes = [ErrorTypes.NETWORK, ErrorTypes.TIMEOUT, ErrorTypes.API]
    } = operationOptions;

    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
    lastOperationRef.current = { operation, operationOptions };

    try {
      let result;

      if (enableRetry) {
        setIsRetrying(true);
        result = await retryWithBackoff(operation, {
          maxRetries,
          baseDelay,
          onRetry: (attempt, delay) => {
            setRetryCount(attempt);
            if (onRetry) {
              onRetry(attempt, delay);
            }
          }
        });
        setIsRetrying(false);
      } else {
        result = await operation();
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result, error: null };

    } catch (err) {
      setIsRetrying(false);
      const classification = classifyError(err);
      const friendlyError = getUserFriendlyError(err);

      // Determine if error is retryable based on type
      const isRetryable = retryableErrorTypes.includes(classification.type);
      setCanRetry(isRetryable);

      const errorDetails = {
        ...friendlyError,
        classification: classification.type,
        severity: classification.severity,
        canRetry: isRetryable,
        raw: err
      };

      setError(errorDetails);

      if (onError) {
        onError(errorDetails);
      }

      return { success: false, data: null, error: errorDetails };
    }
  }, [maxRetries, baseDelay, onError, onRetry, onSuccess]);

  /**
   * Manually retry the last failed operation
   */
  const retry = useCallback(async () => {
    if (!lastOperationRef.current) {
      return { success: false, error: new Error('No operation to retry') };
    }

    const { operation, operationOptions } = lastOperationRef.current;
    return executeWithRetry(operation, operationOptions);
  }, [executeWithRetry]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setCanRetry(false);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  /**
   * Reset all state including last operation
   */
  const reset = useCallback(() => {
    clearError();
    lastOperationRef.current = null;
  }, [clearError]);

  return {
    // State
    error,
    isRetrying,
    retryCount,
    canRetry,

    // Methods
    executeWithRetry,
    retry,
    clearError,
    reset
  };
};

export default useErrorRecovery;

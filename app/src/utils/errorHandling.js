/**
 * Centralized Error Handling System
 * Consolidates all error handling utilities in one place
 */

import { logger } from './logger';

// ============================================================================
// ERROR TYPES & CLASSIFICATION
// ============================================================================

export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  PARSE: 'PARSE_ERROR',
  COMPONENT: 'COMPONENT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Classify error based on type and message
 */
export const classifyError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.response?.status;

  // Network errors
  if (error.name === 'NetworkError' || message.includes('network') || message.includes('failed to fetch')) {
    return { type: ErrorTypes.NETWORK, severity: ErrorSeverity.HIGH };
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.name === 'TimeoutError' || message.includes('timeout')) {
    return { type: ErrorTypes.TIMEOUT, severity: ErrorSeverity.MEDIUM };
  }

  // Authorization errors
  if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
    return { type: ErrorTypes.AUTHORIZATION, severity: ErrorSeverity.HIGH };
  }

  // Not found errors
  if (status === 404 || message.includes('not found')) {
    return { type: ErrorTypes.NOT_FOUND, severity: ErrorSeverity.LOW };
  }

  // Validation errors
  if (status === 400 || message.includes('validation') || message.includes('invalid')) {
    return { type: ErrorTypes.VALIDATION, severity: ErrorSeverity.LOW };
  }

  // API errors
  if (status >= 500 || message.includes('server error')) {
    return { type: ErrorTypes.API, severity: ErrorSeverity.CRITICAL };
  }

  // Parse errors
  if (message.includes('json') || message.includes('parse') || message.includes('syntax')) {
    return { type: ErrorTypes.PARSE, severity: ErrorSeverity.MEDIUM };
  }

  // Component errors
  if (message.includes('component') || message.includes('render') || message.includes('react')) {
    return { type: ErrorTypes.COMPONENT, severity: ErrorSeverity.MEDIUM };
  }

  return { type: ErrorTypes.UNKNOWN, severity: ErrorSeverity.MEDIUM };
};

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

const ERROR_MESSAGES = {
  [ErrorTypes.NETWORK]: {
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
    action: 'Retry',
  },
  [ErrorTypes.API]: {
    title: 'Service Unavailable',
    message: 'Our service is temporarily unavailable. Please try again in a moment.',
    action: 'Retry',
  },
  [ErrorTypes.VALIDATION]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'Correct',
  },
  [ErrorTypes.AUTHORIZATION]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    action: 'Sign In',
  },
  [ErrorTypes.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    action: 'Go Back',
  },
  [ErrorTypes.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    action: 'Retry',
  },
  [ErrorTypes.PARSE]: {
    title: 'Data Error',
    message: 'There was a problem processing the data. Please try again.',
    action: 'Retry',
  },
  [ErrorTypes.COMPONENT]: {
    title: 'Display Error',
    message: 'There was a problem displaying this content.',
    action: 'Refresh',
  },
  [ErrorTypes.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Retry',
  },
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyError = (error) => {
  const classification = classifyError(error);
  const defaultMessage = ERROR_MESSAGES[classification.type] || ERROR_MESSAGES[ErrorTypes.UNKNOWN];

  return {
    ...defaultMessage,
    type: classification.type,
    severity: classification.severity,
    technical: error?.message || 'Unknown error',
  };
};

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Enhanced error logging with classification
 */
export const logError = (error, context = {}) => {
  const classification = classifyError(error);
  const errorInfo = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    type: classification.type,
    severity: classification.severity,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...context,
  };

  // Log based on severity
  if (classification.severity === ErrorSeverity.CRITICAL) {
    logger.error('🔴 CRITICAL ERROR:', errorInfo);
  } else if (classification.severity === ErrorSeverity.HIGH) {
    logger.error('🟠 HIGH SEVERITY ERROR:', errorInfo);
  } else if (classification.severity === ErrorSeverity.MEDIUM) {
    logger.warn('🟡 MEDIUM SEVERITY ERROR:', errorInfo);
  } else {
    logger.info('⚪ LOW SEVERITY ERROR:', errorInfo);
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production' && classification.severity !== ErrorSeverity.LOW) {
    sendToMonitoringService(errorInfo);
  }

  return errorInfo;
};

/**
 * Mock monitoring service (replace with actual service in production)
 */
const sendToMonitoringService = (errorInfo) => {
  // Production implementation would send to Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'development') {
    console.log('[Monitoring] Would send error to service:', errorInfo);
  }
};

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * API error handler with automatic retry logic
 */
export const handleApiError = async (error, options = {}) => {
  const {
    context = 'API',
    maxRetries = 0,
    retryDelay = 1000,
    onRetry,
  } = options;

  const classification = classifyError(error);
  logError(error, { context });

  // Determine if error is retryable
  const isRetryable = [
    ErrorTypes.NETWORK,
    ErrorTypes.TIMEOUT,
    ErrorTypes.API,
  ].includes(classification.type);

  if (isRetryable && maxRetries > 0) {
    if (onRetry) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return onRetry();
    }
  }

  const userError = getUserFriendlyError(error);

  return {
    success: false,
    error: userError,
    canRetry: isRetryable,
    raw: error,
  };
};

/**
 * Component error handler for React Error Boundaries
 */
export const handleComponentError = (error, errorInfo = {}, componentName = 'Unknown') => {
  const classification = classifyError(error);

  const errorDetails = {
    componentName,
    componentStack: errorInfo?.componentStack,
    message: error?.message || 'Unknown component error',
    stack: error?.stack,
    type: classification.type,
    severity: classification.severity,
  };

  logError(error, errorDetails);

  return {
    ...getUserFriendlyError(error),
    componentName,
  };
};

/**
 * Create error handler for specific component
 */
export const createErrorHandler = (componentName) => {
  return (error, info) => handleComponentError(error, info, componentName);
};

// ============================================================================
// ERROR RECOVERY
// ============================================================================

/**
 * Retry with exponential backoff
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      if (onRetry) {
        onRetry(attempt + 1, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

// ============================================================================
// SAFE OPERATIONS
// ============================================================================

/**
 * Safe async operation wrapper
 */
export const safeAsync = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (error) {
    logError(error, { operation: 'safeAsync' });
    return fallback;
  }
};

/**
 * Safe state update to prevent memory leaks
 */
export const safeSetState = (setState, value, componentName = 'Unknown') => {
  try {
    if (typeof setState === 'function') {
      setState(value);
    }
  } catch (error) {
    logError(error, { componentName, operation: 'safeSetState' });
  }
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate and throw appropriate error
 */
export const validate = (condition, message, type = ErrorTypes.VALIDATION) => {
  if (!condition) {
    const error = new Error(message);
    error.type = type;
    throw error;
  }
};

/**
 * Validate required fields
 */
export const validateRequired = (data, fields) => {
  const missing = fields.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  ErrorTypes,
  ErrorSeverity,
  classifyError,
  getUserFriendlyError,
  logError,
  handleApiError,
  handleComponentError,
  createErrorHandler,
  retryWithBackoff,
  CircuitBreaker,
  safeAsync,
  safeSetState,
  validate,
  validateRequired,
};

# Error Recovery Hooks

This directory contains custom React hooks for error handling and recovery.

## Available Hooks

### `useErrorRecovery`

A hook for executing operations with automatic retry logic and error recovery.

**Features:**
- Automatic retry with exponential backoff
- Error classification and user-friendly messages
- Manual retry capability
- Retry count tracking
- Configurable retry behavior

**Usage:**

```javascript
import { useErrorRecovery } from '@hooks/useErrorRecovery';

function MyComponent() {
  const {
    error,
    isRetrying,
    retryCount,
    canRetry,
    executeWithRetry,
    retry,
    clearError
  } = useErrorRecovery({
    maxRetries: 3,
    baseDelay: 1000,
    onError: (err) => console.error('Operation failed:', err),
    onRetry: (attempt, delay) => console.log(`Retry ${attempt} after ${delay}ms`),
    onSuccess: (result) => console.log('Success:', result)
  });

  const fetchData = async () => {
    const result = await executeWithRetry(
      async () => {
        const response = await fetch('/api/data');
        return response.json();
      },
      {
        enableRetry: true,
        retryableErrorTypes: [ErrorTypes.NETWORK, ErrorTypes.TIMEOUT]
      }
    );

    if (result.success) {
      console.log('Data:', result.data);
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      {isRetrying && <p>Retrying... (Attempt {retryCount})</p>}
      {error && (
        <div>
          <p>Error: {error.message}</p>
          {canRetry && <button onClick={retry}>Retry</button>}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
```

**API:**

```typescript
const {
  // State
  error: ErrorDetails | null,
  isRetrying: boolean,
  retryCount: number,
  canRetry: boolean,

  // Methods
  executeWithRetry: (operation, options?) => Promise<Result>,
  retry: () => Promise<Result>,
  clearError: () => void,
  reset: () => void
} = useErrorRecovery(options);
```

**Options:**
- `maxRetries` (number): Maximum retry attempts (default: 3)
- `baseDelay` (number): Base delay for exponential backoff in ms (default: 1000)
- `onError` (function): Callback when error occurs
- `onRetry` (function): Callback on retry attempt
- `onSuccess` (function): Callback on success

### `useErrorNotification`

A hook for managing error notification UI state.

**Features:**
- User-friendly error messages
- Automatic error classification
- Custom notification support
- Retry button integration
- Auto-hide functionality

**Usage:**

```javascript
import { useErrorNotification } from '@hooks/useErrorNotification';
import ErrorNotification from '@components/error/ErrorNotification';

function MyComponent() {
  const {
    notification,
    isOpen,
    showError,
    showNotification,
    close,
    handleRetry,
    autoHideDuration,
    position
  } = useErrorNotification({
    autoHideDuration: 6000,
    position: { vertical: 'top', horizontal: 'center' },
    onRetry: (error) => console.log('Retrying after error:', error)
  });

  const handleOperation = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      showError(error);
    }
  };

  const handleCustomNotification = () => {
    showNotification('Custom Title', 'Custom message', 'warning');
  };

  return (
    <div>
      <button onClick={handleOperation}>Execute</button>
      <button onClick={handleCustomNotification}>Show Custom</button>

      <ErrorNotification
        error={notification?.raw}
        open={isOpen}
        onClose={close}
        onRetry={notification?.canRetry ? handleRetry : undefined}
        autoHideDuration={autoHideDuration}
        position={position}
      />
    </div>
  );
}
```

**API:**

```typescript
const {
  // State
  notification: NotificationDetails | null,
  isOpen: boolean,

  // Methods
  showError: (error: Error) => void,
  showNotification: (title: string, message: string, severity?: string) => void,
  close: () => void,
  handleRetry: () => void,
  clear: () => void,

  // Config
  autoHideDuration: number,
  position: { vertical: string, horizontal: string }
} = useErrorNotification(options);
```

**Options:**
- `autoHideDuration` (number): Auto-hide duration in ms (default: 6000)
- `position` (object): Notification position (default: { vertical: 'top', horizontal: 'center' })
- `onRetry` (function): Callback when retry is clicked

## Combined Example

Using both hooks together for comprehensive error handling:

```javascript
import { useErrorRecovery } from '@hooks/useErrorRecovery';
import { useErrorNotification } from '@hooks/useErrorNotification';
import ErrorNotification from '@components/error/ErrorNotification';

function ProductLoader({ productId }) {
  const [product, setProduct] = useState(null);

  // Setup error recovery
  const {
    error: recoveryError,
    isRetrying,
    retryCount,
    executeWithRetry,
    retry
  } = useErrorRecovery({
    maxRetries: 2,
    onSuccess: (data) => setProduct(data)
  });

  // Setup error notifications
  const {
    notification,
    isOpen,
    showError,
    close,
    handleRetry: notificationRetry,
    autoHideDuration,
    position
  } = useErrorNotification({
    onRetry: async () => {
      await retry();
    }
  });

  // Load product with retry
  const loadProduct = async () => {
    const result = await executeWithRetry(async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to load product');
      return response.json();
    });

    if (!result.success) {
      showError(result.error.raw);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  if (isRetrying) {
    return <div>Retrying... (Attempt {retryCount})</div>;
  }

  return (
    <div>
      {product && <ProductDetails product={product} />}

      <ErrorNotification
        error={notification?.raw}
        open={isOpen}
        onClose={close}
        onRetry={notification?.canRetry ? notificationRetry : undefined}
        autoHideDuration={autoHideDuration}
        position={position}
      />
    </div>
  );
}
```

## Best Practices

1. **Use `useErrorRecovery` for data fetching and async operations**
   - Automatic retries reduce user frustration
   - Exponential backoff prevents overwhelming servers

2. **Use `useErrorNotification` for user feedback**
   - Shows user-friendly error messages
   - Provides retry option when applicable
   - Auto-hides to avoid cluttering the UI

3. **Combine hooks for complete error handling**
   - `useErrorRecovery` handles the logic
   - `useErrorNotification` handles the UI

4. **Customize retry behavior based on operation**
   - Not all errors should be retried
   - Set `enableRetry: false` for validation errors
   - Use `retryableErrorTypes` to specify which error types to retry

5. **Provide context in error handlers**
   - Pass meaningful context to `onError` callbacks
   - Helps with debugging and monitoring

## See Also

- [Error Handling Utilities](/src/utils/errorHandling.js)
- [Error Notification Component](/src/components/error/ErrorNotification.js)
- [Error Boundary Component](/src/components/error/ErrorBoundary.js)

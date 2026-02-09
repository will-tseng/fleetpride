# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a B2B home goods e-commerce React application with AI-powered conversational product Q&A capabilities. The app integrates with Lucidworks Fusion for search and RAG (Retrieval-Augmented Generation) functionality, and uses an external SE Tools API for PDF-based question answering.

## Key Technologies

- **Frontend**: React 18 with Material-UI (MUI)
- **Build Tool**: Create React App with CRACO for custom webpack configuration
- **Search Platform**: Lucidworks Fusion (cloud-hosted)
- **AI Service**: SE Tools API for conversational PDF Q&A
- **Deployment**: Google Cloud Run (containerized with Docker)
- **Routing**: React Router v7

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Testing
The project uses react-scripts test runner. To run a single test file:
```bash
npm test -- <test-file-name>
```

## Path Aliases (Webpack)

The project uses CRACO to configure webpack path aliases (see `craco.config.js`):

- `@utils` → `src/utils`
- `@api` → `src/api`
- `@assets` → `src/assets`
- `@context` → `src/context`
- `@styles` → `src/styles`
- `@components` → `src/components`
- `@hooks` → `src/hooks`
- `@services` → `src/services`

Always use these aliases when importing from these directories.

## Architecture & Key Concepts

### Application Structure

The app follows a standard React component-based architecture with clear separation of concerns:

- **`src/App.js`**: Main app component with routing, global error handling, and React Error Boundaries wrapping each route
- **`src/api/`**: Search API integration (Lucidworks Fusion)
- **`src/services/`**: External service integrations (conversational AI, PDF services)
- **`src/components/`**: React components organized by feature
- **`src/context/`**: React Context providers (FAQ visibility state)
- **`src/utils/`**: Utility functions (error handling, logging, formatters, cart utils)
- **`src/hooks/`**: Custom React hooks (PDF status polling)

### Search Integration (Lucidworks Fusion)

Located in `src/api/search.js`. This module provides the primary search functionality:

- **Query Profiles**: Different search behaviors for different contexts (`landing-page`, `typeahead`, `pdp`, `category`)
- **Core Functions**:
  - `search()`: Main search with query profiles, pagination, facets, sorting
  - `getTypeaheadSuggestions()`: Autocomplete/typeahead
  - `getHomePageProducts()`: Featured products for landing page
  - `fusion_rag()`: RAG endpoint for AI-powered answers (tries multiple endpoints with fallback)
  - `facetedSearch()`: Search with faceting enabled
  - `getPage()`: Pagination helper

**Important**: The search API uses a shared axios client with interceptors for consistent error handling. All requests include `user_id` and `session` tracking parameters.

### Conversational AI Service

Located in `src/services/conversationalService.js`. This is the core of the AI Q&A feature:

- **API**: Connects to SE Tools API (`https://se-demos-tools.lucidworkssales.com`)
- **Streaming Support**: Implements Server-Sent Events (SSE) for real-time response streaming
  - `fetchBotResponseStreaming()`: Primary streaming API with delta format support
  - `fetchBotResponse()`: Fallback non-streaming API
- **Session Management**: Uses `memoryUuid` to maintain conversation context across follow-up questions
- **Caching**: Response caching (5 min TTL) to reduce redundant API calls
- **PDF Integration**: First message in a conversation can include up to 2 product PDFs for context

**Key Pattern**: The conversational service uses a delta streaming format where the server sends incremental chunks:
```javascript
{
  "requestId": "...",
  "delta": {
    "batch": 0,
    "index": X,
    "output": "chunk of text..."
  },
  "type": "response.text_delta"
}
```

### Conversational Agent Component

Located in `src/components/integrations/LW_Agent_Conversational.js`:

- **Session Isolation**: Each browser tab/session has a unique session ID to prevent conversation mixing
- **Memory Persistence**: Stores `memoryUuid` in localStorage with session+product isolation
- **Streaming UI**: Real-time text streaming with cursor animation
- **Features**: Copy response, feedback (thumbs up/down), clear memory, suggested questions
- **Performance Optimizations**: Memoized components, batched state updates, debounced scrolling

**Important**: The component maintains conversation continuity by persisting `memoryUuid` across component remounts, keyed by both session ID and product ID.

### Error Handling

**Comprehensive centralized error handling system** (see `ERROR_HANDLING_IMPROVEMENTS.md` for full details):

**Core System** (`src/utils/errorHandling.js`):
- **Error Classification**: Automatic categorization by type (NETWORK, API, VALIDATION, etc.) and severity (LOW, MEDIUM, HIGH, CRITICAL)
- **User-Friendly Messages**: All errors automatically translated to user-friendly messages
- **Retry Logic**: `retryWithBackoff()` with exponential backoff for retryable errors
- **Circuit Breaker**: Pattern for preventing cascade failures
- **Enhanced Logging**: Structured logging with classification and context
- **Safe Operations**: `safeAsync()` and `safeSetState()` wrappers

**API Integration** (`src/api/search.js`):
- Enhanced axios interceptor with centralized error handling
- Automatic retry for NETWORK, TIMEOUT, and API errors (up to 2 retries)
- Error responses include type, severity, and retry capability
- Both `search()` and `fusion_rag()` have retry logic

**Error Boundaries**:
- Global error boundary wraps entire app (`src/App.js`)
- Route-level boundaries for HomePage, ProductDetail, SearchResults, Cart
- Enhanced with centralized error handling (`src/components/error/ErrorBoundary.js`)
- Shows user-friendly messages with error type and severity in dev mode

**Error Notification** (`src/components/error/ErrorNotification.js`):
- Snackbar-based user feedback
- Automatic user-friendly messages
- Optional retry button for retryable errors
- Development mode technical details

**Error Recovery Hooks**:
- **`useErrorRecovery`** (`src/hooks/useErrorRecovery.js`): Execute operations with automatic retry and error tracking
- **`useErrorNotification`** (`src/hooks/useErrorNotification.js`): Manage error notification UI state

**Usage Example**:
```javascript
import { useErrorRecovery } from '@hooks/useErrorRecovery';
import { useErrorNotification } from '@hooks/useErrorNotification';

const { executeWithRetry, retry } = useErrorRecovery({ maxRetries: 2 });
const { showError, isOpen, close } = useErrorNotification({ onRetry: retry });

const loadData = async () => {
  const result = await executeWithRetry(fetchData);
  if (!result.success) {
    showError(result.error.raw);
  }
};
```

**Error Types and Retry Strategy**:
- Retryable: NETWORK_ERROR, TIMEOUT_ERROR, API_ERROR (5xx)
- Non-retryable: VALIDATION_ERROR, AUTHORIZATION_ERROR, NOT_FOUND_ERROR
- Retry config: Max 2 retries, 1s base delay, exponential backoff

### React Context

- **FaqContext** (`src/context/FaqContext.js`): Simple global state for FAQ panel visibility toggle
  - Use `useFaq()` hook to access `isFaqVisible` and `toggleFaqVisibility()`

### Custom Hooks

- **usePdfStatus** (`src/hooks/usePdfStatus.js`): Polls PDF processing status from SE Tools API with caching and cleanup
- **useErrorRecovery** (`src/hooks/useErrorRecovery.js`): Execute operations with automatic retry logic and error tracking
- **useErrorNotification** (`src/hooks/useErrorNotification.js`): Manage error notification UI state with user-friendly messages

## Component Organization

Components are organized by feature area:

- **`cart/`**: Shopping cart functionality
- **`common/`**: Shared/reusable components
- **`debug/`**: Development/debugging utilities
- **`error/`**: Error boundaries and error pages
- **`integrations/`**: Third-party integrations (conversational AI agent)
- **`layout/`**: Header, Footer, Hero, Logo
- **`pages/`**: Page-level components (ProductDetail, FeaturedProducts)
- **`product/`**: Product-related components (ProductCard, ProductTabs, SpecificationGrid, etc.)
- **`search/`**: Search UI (SearchResults, SearchSuggestions)

## Environment Variables

- **`REACT_APP_API_BASE_URL`**: Base URL for SE Tools API (defaults to `https://se-demos-tools.lucidworkssales.com`)
  - Used by conversational service and PDF service
  - Set via build arg for Docker builds

## Deployment

### Google Cloud Run

Use `deploy_cloud_run.sh` for deployment:

```bash
# Standard deployment
./deploy_cloud_run.sh

# With Secret Manager (recommended for production)
USE_SECRET_MANAGER=true ./deploy_cloud_run.sh
```

The deployment script:
1. Builds Docker image with React app
2. Pushes to Google Artifact Registry
3. Deploys to Cloud Run with environment variables
4. Configures for production (serves static build on port 8080)

**Build Process**: Multi-stage Dockerfile builds the React app, then serves it with `serve` package on port 8080.

## Important Development Notes

### When Working with Search

- All search operations should go through `src/api/search.js`
- Always include proper query profiles for different contexts
- Use the session tracking helpers (`getSessionId()`, `getUserId()`)
- Handle AbortController signals for request cancellation

### When Working with Conversational AI

- **First question**: Automatically includes up to 2 product PDFs if available
- **Follow-up questions**: Use existing `memoryUuid` to maintain context
- **Error handling**: 400 errors often indicate expired memory - clear `memoryUuid` and retry
- **Streaming**: Prefer `fetchBotResponseStreaming()` with fallback to `fetchBotResponse()`
- **Caching**: Response cache is keyed by `productId_query_memoryUuid`

### When Working with State Management

- Use React Context sparingly (currently only for FAQ visibility)
- Most state is local to components or lifted to parent as needed
- Conversational agent state is isolated per session + product

### When Working with Error Boundaries

- Each major route already has an error boundary
- Wrap new critical features in ErrorBoundary with unique `componentName`
- Always provide `onError` callback for centralized logging

### When Adding New Components

- Place in appropriate feature directory under `src/components/`
- Use Material-UI components for consistency
- Import theme from `src/theme.js` for color/styling constants
- Use path aliases for imports
- Memoize expensive components with `React.memo()`

### Testing Considerations

- The app is set up with react-scripts test runner (Jest)
- Current test infrastructure is minimal
- When adding tests, consider mocking:
  - Axios/fetch for API calls
  - localStorage for session persistence
  - SSE/streaming responses for conversational AI

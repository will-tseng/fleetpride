import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Hero from '@components/layout/Hero';
import ProductDetail from '@components/pages/ProductDetail';
import SearchResults from '@components/search/SearchResults';
import FeaturedProducts from '@components/pages/FeaturedProducts';
import Cart from '@components/cart/Cart';
import ErrorBoundary from '@components/error/ErrorBoundary';
import ErrorPage from '@components/error/ErrorPage';
import { FaqProvider } from '@context/FaqContext';
import { StoreProvider } from '@context/StoreContext';
import { UserProvider } from '@context/UserContext';
import { VehicleProvider } from '@context/VehicleContext';
import { SelectedVehicleProvider } from '@context/SelectedVehicleContext';
import { logError } from '@utils/errorHandling';

function App() {
  const [appError, setAppError] = useState(null);

  // Set up global error handling
  useEffect(() => {
    // Handler for uncaught errors
    const handleGlobalError = (event) => {
      event.preventDefault();
      const errorInfo = {
        message: event.error?.message || 'An unexpected error occurred',
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      };
      logError(event.error || new Error(errorInfo.message), {
        componentName: 'Global',
        ...errorInfo,
      });
      setAppError(event.error || new Error(errorInfo.message));
    };

    // Handler for rejected promises
    const handleUnhandledRejection = (event) => {
      event.preventDefault();
      logError(event.reason, {
        componentName: 'Unhandled Promise',
        message: event.reason?.message || 'Unhandled promise rejection',
      });
      setAppError(event.reason || new Error('Unhandled promise rejection'));
    };

    // Handler for component errors from error boundaries
    const handleAppComponentError = (event) => {
      // Use centralized error logging
      logError(event.detail.error, {
        componentName: event.detail.componentName,
        componentStack: event.detail.info?.componentStack,
        context: 'Error Boundary'
      });
      // Don't set app error here as the error boundary will handle it
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('appComponentError', handleAppComponentError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      window.removeEventListener('appComponentError', handleAppComponentError);
    };
  }, []);

  if (appError) {
    return <ErrorPage error={appError} resetError={() => setAppError(null)} />;
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: 'background.default',
        minHeight: '100vh',
      }}
    >
      <ErrorBoundary
        componentName="AppRoot"
        fallbackComponent={(props) => (
          <ErrorPage
            error={props.error}
            resetError={props.resetErrorBoundary}
          />
        )}
        onError={(error, info) =>
          logError(error, {
            componentName: 'AppRoot',
            componentStack: info?.componentStack,
          })
        }
      >
        <UserProvider>
          <StoreProvider>
            <VehicleProvider>
              <SelectedVehicleProvider>
                <FaqProvider>
                  <Header />
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ErrorBoundary
                          componentName="HomePage"
                          onError={(error, info) =>
                            logError(error, {
                              componentName: 'HomePage',
                              componentStack: info?.componentStack,
                            })
                          }
                        >
                          <>
                            {/* Hero Section */}
                            <Hero />

                            {/* Featured Products Section */}
                            <ErrorBoundary
                              componentName="FeaturedProducts"
                              onError={(error, info) =>
                                logError(error, {
                                  componentName: 'FeaturedProducts',
                                  componentStack: info?.componentStack,
                                })
                              }
                            >
                              <React.Suspense fallback={<CircularProgress />}>
                                <FeaturedProducts />
                              </React.Suspense>
                            </ErrorBoundary>
                            <Footer />
                          </>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/product/:id"
                      element={
                        <ErrorBoundary
                          componentName="ProductDetail"
                          onError={(error, info) =>
                            logError(error, {
                              componentName: 'ProductDetail',
                              componentStack: info?.componentStack,
                            })
                          }
                        >
                          <ProductDetail />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/search"
                      element={
                        <ErrorBoundary
                          componentName="SearchResults"
                          onError={(error, info) =>
                            logError(error, {
                              componentName: 'SearchResults',
                              componentStack: info?.componentStack,
                            })
                          }
                        >
                          <SearchResults />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/checkout/cart"
                      element={
                        <ErrorBoundary
                          componentName="Cart"
                          onError={(error, info) =>
                            logError(error, {
                              componentName: 'Cart',
                              componentStack: info?.componentStack,
                            })
                          }
                        >
                          <Cart />
                        </ErrorBoundary>
                      }
                    />
                  </Routes>
                </FaqProvider>
              </SelectedVehicleProvider>
            </VehicleProvider>
          </StoreProvider>
        </UserProvider>
      </ErrorBoundary>
    </Box>
  );
}

export default App;

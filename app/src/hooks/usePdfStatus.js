import { useState, useEffect, useCallback, useRef } from 'react';

// Global cache to store PDF status results
const pdfStatusCache = new Map();

const usePdfStatus = (product) => {
  const [pdfStatus, setPdfStatus] = useState({
    loading: true,
    status: 'unknown',
    allInGcs: false,
    hasAnyInGcs: false,
    details: null,
    error: null
  });

  // Use ref to track if we've already made a request for this product
  const hasInitialized = useRef(false);
  const currentProductId = useRef(null);

  const checkPdfStatus = useCallback(async () => {
    if (!product) {
      return;
    }

    // Generate a unique cache key for this product
    const productId = product?.id || product?.unique_id || product?.product_id;
    const pdfLinks = product?._lw_pdf_url_ss;
    const cacheKey = `${productId}_${JSON.stringify(pdfLinks)}`;
    
    // Check if we already have cached results
    if (pdfStatusCache.has(cacheKey)) {
      const cachedResult = pdfStatusCache.get(cacheKey);
      setPdfStatus(cachedResult);
      return;
    }
    
    // Reset state
    setPdfStatus(prev => ({ ...prev, loading: true, error: null }));
    
    if (!pdfLinks || !Array.isArray(pdfLinks) || pdfLinks.length === 0) {
      const noPdfResult = {
        loading: false,
        status: 'no_pdfs',
        allInGcs: false,
        hasAnyInGcs: false,
        details: null,
        error: null
      };
      
      // Cache the result
      pdfStatusCache.set(cacheKey, noPdfResult);
      setPdfStatus(noPdfResult);
      return;
    }

    try {

      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://se-demos-tools.lucidworkssales.com';

      // Prepare query parameters
      const params = new URLSearchParams({
        pdfLinks: JSON.stringify(pdfLinks)
      });

      // Add productId if available
      const productId = product?.id || product?.unique_id || product?.product_id;
      if (productId) {
        params.append('productId', productId);
      }

      const requestUrl = `${apiBaseUrl}/api/pdf-status?${params}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const newStatus = {
          loading: false,
          status: result.status,
          allInGcs: result.allInGcs,
          hasAnyInGcs: result.hasAnyInGcs,
          details: result.details,
          error: null
        };
        
        // Cache the successful result
        pdfStatusCache.set(cacheKey, newStatus);
        setPdfStatus(newStatus);
      } else {
        const errorStatus = {
          loading: false,
          status: 'unknown',
          allInGcs: false,
          hasAnyInGcs: false,
          details: null,
          error: result.error || 'Failed to check PDF status'
        };
        
        // Cache error results for a shorter time (don't cache permanently)
        setPdfStatus(errorStatus);
      }
    } catch (error) {
      const errorStatus = {
        loading: false,
        status: 'unknown',
        allInGcs: false,
        hasAnyInGcs: false,
        details: null,
        error: error.message || 'Failed to check PDF status'
      };
      
      // Don't cache network errors
      setPdfStatus(errorStatus);
    }
  }, [product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const productId = product?.id || product?.unique_id || product?.product_id;
    
    // Only run if we haven't initialized yet OR if the product actually changed
    if (!hasInitialized.current || currentProductId.current !== productId) {
      hasInitialized.current = true;
      currentProductId.current = productId;
      checkPdfStatus();
    }
  }, [product, checkPdfStatus]);

  // Return status, refresh function, and cache management
  const returnValue = {
    ...pdfStatus,
    refresh: checkPdfStatus,
    clearCache: () => {
      const productId = product?.id || product?.unique_id || product?.product_id;
      const pdfLinks = product?._lw_pdf_url_ss;
      const cacheKey = `${productId}_${JSON.stringify(pdfLinks)}`;
      pdfStatusCache.delete(cacheKey);
      checkPdfStatus();
    },
    cacheSize: pdfStatusCache.size
  };
  return returnValue;
};

export default usePdfStatus;

import { logger } from '@utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://se-demos-tools.lucidworkssales.com';

// Development-only logging helper
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Cache for API health status to reduce redundant calls
let healthCache = { 
  isHealthy: null, 
  lastChecked: null, 
  checking: false 
};

export const checkApiHealth = async () => {
  try {
    // Return cached result if checked within last 30 seconds
    const now = new Date();
    if (healthCache.lastChecked && 
        (now - healthCache.lastChecked) < 30000 && 
        healthCache.isHealthy !== null) {
      return { 
        isHealthy: healthCache.isHealthy, 
        lastChecked: healthCache.lastChecked 
      };
    }

    if (healthCache.checking) {
      return { 
        isHealthy: healthCache.isHealthy, 
        lastChecked: healthCache.lastChecked 
      };
    }

    healthCache.checking = true;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    const result = { isHealthy: response.ok, lastChecked: new Date() };
    healthCache = { ...result, checking: false };
    
    return result;
  } catch (error) {
    logger.error('API health check failed:', error);
    const result = { isHealthy: false, lastChecked: new Date() };
    healthCache = { ...result, checking: false };
    return result;
  }
};

// Response cache for repeated questions
const responseCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Generate cache key for responses
const generateResponseCacheKey = (query, productId, memoryUuid) => {
  return `${productId}_${query.toLowerCase().trim()}_${memoryUuid || 'initial'}`;
};

// Check cached response
const getCachedResponse = (cacheKey) => {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    devLog('🚀 Using cached response');
    return cached.data;
  }
  if (cached) {
    responseCache.delete(cacheKey); // Remove expired
  }
  return null;
};

// Store response in cache
const setCachedResponse = (cacheKey, data) => {
  // Limit cache size
  if (responseCache.size > 20) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  responseCache.set(cacheKey, { data, timestamp: Date.now() });
};

export const fetchBotResponse = async (requestBody) => {
  // Check cache first
  const batchItem = requestBody.batch?.[0];
  const cacheKey = generateResponseCacheKey(
    batchItem?.query || '', 
    batchItem?.id || '',
    requestBody.useCaseConfig?.memoryUuid
  );
  
  devLog('🔍 fetchBotResponse DEBUG:', {
    query: batchItem?.query,
    productId: batchItem?.id,
    memoryUuid: requestBody.useCaseConfig?.memoryUuid,
    cacheKey,
    pdfCount: batchItem?.pdfLinks?.length || 0,
    apiUrl: `${API_BASE_URL}/api/ask-pdf`,
    apiBaseUrl: API_BASE_URL
  });
  
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    devLog('✅ Using cached response for:', batchItem?.query);
    return cachedResponse;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s for ask-pdf service
  
  try {
    devLog('📡 Making API call to:', `${API_BASE_URL}/api/ask-pdf`);
    devLog('📋 Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/api/ask-pdf`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    devLog('📨 Response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      ok: response.ok
    });
    
    if (!response.ok) {
      // Simplified error handling for better performance
      const errorText = response.statusText || 'API Error';
      console.error('❌ API Error:', `HTTP ${response.status}: ${errorText}`);
      
      // Try to get response body for more details
      try {
        const errorBody = await response.text();
        console.error('❌ Error response body:', errorBody);
      } catch (e) {
        console.error('❌ Could not read error response body');
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    devLog('📋 Response content type:', contentType);
    
    // Try to parse as JSON regardless of content type, since the server might send wrong headers
    let data;
    try {
      data = await response.json();
      devLog('✅ Successfully parsed JSON response:', {
        predictionCount: data.predictions?.length || 0,
        hasMemoryUuid: Boolean(data.predictions?.[0]?.memoryUuid),
        responseLength: data.predictions?.[0]?.response?.length || 0
      });
    } catch (jsonError) {
      // If JSON parsing fails, try to get the raw text for debugging
      const textResponse = await response.text();
      console.error('❌ Failed to parse JSON, raw response:', textResponse.substring(0, 500));
      throw new Error(`Failed to parse response as JSON. Content-Type: ${contentType}. Response: ${textResponse.substring(0, 200)}`);
    }
    devLog('✅ Response data received:', {
      predictionCount: data.predictions?.length || 0,
      hasMemoryUuid: Boolean(data.predictions?.[0]?.memoryUuid),
      responseLength: data.predictions?.[0]?.response?.length || 0
    });
    
    // Cache successful responses
    setCachedResponse(cacheKey, data);
    
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error('❌ fetchBotResponse error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Minimal error logging in production
    if (process.env.NODE_ENV === 'development') {
      console.error('fetchBotResponse error:', error.message);
    }
    
    throw error;
  }
};

// New streaming version for real-time response handling
export const fetchBotResponseStreaming = async (requestBody, onChunk) => {
  // Check cache first
  const batchItem = requestBody.batch?.[0];
  const cacheKey = generateResponseCacheKey(
    batchItem?.query || '', 
    batchItem?.id || '',
    requestBody.useCaseConfig?.memoryUuid
  );
  
  devLog('🔍 fetchBotResponseStreaming DEBUG:', {
    query: batchItem?.query,
    productId: batchItem?.id,
    memoryUuid: requestBody.useCaseConfig?.memoryUuid,
    cacheKey,
    pdfCount: batchItem?.pdfLinks?.length || 0,
    hasOnChunk: typeof onChunk === 'function',
    apiUrl: `${API_BASE_URL}/api/ask-pdf`,
    apiBaseUrl: API_BASE_URL
  });
  
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    devLog('✅ Using cached response for streaming:', batchItem?.query);
    // For cached responses, simulate streaming by calling onChunk with complete data
    if (onChunk && cachedResponse.predictions?.[0]) {
      const responseText = cachedResponse.predictions[0].response || cachedResponse.predictions[0].content || '';
      onChunk(responseText, true); // true indicates completion
    }
    return cachedResponse;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45s for streaming
  
  try {
    devLog('📡 Making streaming API call to:', `${API_BASE_URL}/api/ask-pdf`);
    devLog('📋 Streaming request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/api/ask-pdf`, {
      method: 'POST',
      headers: { 
        'Accept': 'text/event-stream', // Request streaming response
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    devLog('📨 Streaming response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorText = response.statusText || 'API Error';
      console.error('❌ Streaming API Error:', `HTTP ${response.status}: ${errorText}`);
      
      // Try to get response body for more details
      try {
        const errorBody = await response.text();
        console.error('❌ Streaming error response body:', errorBody);
      } catch (e) {
        console.error('❌ Could not read streaming error response body');
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Check if response is actually streaming
    const contentType = response.headers.get('content-type');
    devLog('🔄 Content type check:', contentType);
    
    if (contentType?.includes('text/event-stream')) {
      devLog('🌊 Handling as Server-Sent Events stream');
      // Handle Server-Sent Events streaming
      return await handleStreamingResponse(response, onChunk, cacheKey);
    } else {
      devLog('📄 Falling back to regular JSON response');
      
      // Try to parse as JSON regardless of content type, since server might send wrong headers
      let data;
      try {
        data = await response.json();
        devLog('✅ JSON fallback data received:', {
          predictionCount: data.predictions?.length || 0,
          hasMemoryUuid: Boolean(data.predictions?.[0]?.memoryUuid),
          responseLength: data.predictions?.[0]?.response?.length || 0
        });
      } catch (jsonError) {
        const textResponse = await response.text();
        console.error('❌ Failed to parse JSON in streaming fallback:', textResponse.substring(0, 500));
        throw new Error(`Failed to parse streaming fallback as JSON. Content-Type: ${contentType}. Response: ${textResponse.substring(0, 200)}`);
      }
      
      // Simulate streaming for non-streaming responses
      if (onChunk && data.predictions?.[0]) {
        const responseText = data.predictions[0].response || data.predictions[0].content || '';
        devLog('🎬 Simulating streaming for fallback response');
        onChunk(responseText, true); // true indicates completion
      }
      
      setCachedResponse(cacheKey, data);
      return data;
    }
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error('❌ fetchBotResponseStreaming error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      url: `${API_BASE_URL}/api/ask-pdf`
    });
    
    // More detailed error for debugging
    if (error.name === 'AbortError') {
      console.error('🕐 Streaming request timed out after 45 seconds');
    } else if (error.message?.includes('Failed to fetch')) {
      console.error('🌐 Network error - check if API server is running');
    } else if (error.message?.includes('JSON')) {
      console.error('📋 JSON parsing error - response might not be valid JSON');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('fetchBotResponseStreaming error:', error.message);
    }
    
    throw error;
  }
};

// Handle Server-Sent Events streaming response
const handleStreamingResponse = async (response, onChunk, cacheKey) => {
  devLog('🌊 Starting SSE stream processing');
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedResponse = '';
  let finalData = null;
  let chunkCount = 0;

  try {
    let reading = true;
    while (reading) {
      const { done, value } = await reader.read();
      
      if (done) {
        devLog('✅ Stream reading complete. Total chunks processed:', chunkCount);
        reading = false;
        break;
      }

      chunkCount++;
      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      devLog(`📦 Chunk ${chunkCount} received:`, {
        chunkSize: chunk.length,
        bufferSize: buffer.length,
        accumulatedLength: accumulatedResponse.length
      });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.slice(5); // Remove 'data:' prefix
            devLog('📋 Processing SSE data line:', jsonStr.substring(0, 100) + (jsonStr.length > 100 ? '...' : ''));
            
            if (jsonStr.trim() === '[DONE]' || jsonStr.trim() === '') {
              devLog('🏁 Stream completion marker received');
              // End of stream marker - continue processing but mark for completion
              continue;
            }
            
            const data = JSON.parse(jsonStr);
            
            // Handle delta streaming format from the server
            if (data.delta && data.delta.output) {
              // This is the new delta format: data:{"requestId":"...","delta":{"batch":0,"index":X,"output":"..."},"type":"response.text_delta"}
              const deltaContent = data.delta.output;
              accumulatedResponse += deltaContent;
              
              devLog('📝 Delta streaming content received:', {
                deltaLength: deltaContent.length,
                deltaIndex: data.delta.index,
                deltaBatch: data.delta.batch,
                totalLength: accumulatedResponse.length,
                deltaPreview: deltaContent.substring(0, 50) + (deltaContent.length > 50 ? '...' : ''),
                requestId: data.requestId,
                messageType: data.type
              });
              
              if (onChunk && accumulatedResponse) {
                onChunk(accumulatedResponse, false); // false indicates streaming in progress
              }
              
              // Store the latest data structure
              finalData = {
                predictions: [{
                  response: accumulatedResponse,
                  memoryUuid: data.requestId
                }]
              };
              
            } else if (data.predictions?.[0]) {
              // Handle legacy prediction format
              const prediction = data.predictions[0];
              
              // Check if this is incremental content (delta) or complete response
              const responseContent = prediction.response || prediction.content || '';
              const deltaContent = prediction.delta || '';
              
              if (deltaContent) {
                // This is incremental content - accumulate it
                accumulatedResponse += deltaContent;
                devLog('📝 Legacy delta content received:', {
                  deltaLength: deltaContent.length,
                  totalLength: accumulatedResponse.length,
                  deltaPreview: deltaContent.substring(0, 50) + (deltaContent.length > 50 ? '...' : '')
                });
              } else if (responseContent && responseContent !== accumulatedResponse) {
                // This might be a complete response that's longer than previous
                if (responseContent.length > accumulatedResponse.length) {
                  accumulatedResponse = responseContent;
                  devLog('📝 Complete response chunk received:', {
                    responseLength: responseContent.length,
                    preview: responseContent.substring(0, 100) + (responseContent.length > 100 ? '...' : '')
                  });
                }
              }
              
              if (onChunk && accumulatedResponse) {
                onChunk(accumulatedResponse, false); // false indicates not yet complete
              }
              
              // Store the latest complete data structure
              finalData = data;
            }
          } catch (parseError) {
            devLog('⚠️  Error parsing SSE data:', parseError, 'Line:', line);
          }
        } else if (line.trim() === '' && chunkCount > 1) {
          // Empty line might indicate end of stream after receiving data
          devLog('📝 Empty line detected, might indicate stream end');
        }
      }
    }

    // Wait a moment to ensure all chunks are processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Signal completion
    devLog('🏁 Signaling stream completion:', {
      finalAccumulatedLength: accumulatedResponse.length,
      hasFinalData: Boolean(finalData),
      totalChunks: chunkCount
    });
    
    if (onChunk) {
      onChunk(accumulatedResponse, true); // true indicates completion
    }

    // Cache the final complete response
    if (finalData) {
      devLog('💾 Caching final response data');
      setCachedResponse(cacheKey, finalData);
      return finalData;
    }

    // Fallback response structure if no proper data was received
    devLog('⚠️  Creating fallback response structure');
    const fallbackResponse = {
      predictions: [{
        response: accumulatedResponse,
        memoryUuid: null
      }]
    };
    
    setCachedResponse(cacheKey, fallbackResponse);
    return fallbackResponse;

  } finally {
    devLog('🔒 Releasing stream reader lock');
    reader.releaseLock();
  }
};

export const formatErrorMessage = (error) => {
  let errorMsg = error.message || 'An unexpected error occurred';
  
  if (error.name === 'AbortError') {
    return '⏱️ The AI response took longer than expected. Please try again.';
  }
  
  if (/permission|403|Forbidden/i.test(errorMsg)) {
    return '🚫 You do not have permission to access this resource.';
  }
  
  if (/CORS|Access-Control-Allow-Origin/i.test(errorMsg)) {
    return '🌐 CORS error detected. Please ensure the backend proxy is running.';
  }
  
  return errorMsg;
};

// Function to clear cache when memory expires or for specific products
export const clearRequestCache = (productId = null) => {
  // Clear response cache
  if (productId) {
    const keysToDelete = [];
    for (const key of responseCache.keys()) {
      if (key.startsWith(productId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => responseCache.delete(key));
    devLog(`Cleared ${keysToDelete.length} cached response entries for product: ${productId}`);
  } else {
    const cacheSize = responseCache.size;
    responseCache.clear();
    devLog(`Cleared entire response cache (${cacheSize} entries)`);
  }
};

// Optimized conversation request creation with no PDF validation
export const createConversationRequest = (product, userQuestion, memoryUuid) => {
  // Basic validation
  if (!product || !userQuestion) {
    throw new Error('Product and question are required');
  }
  
  const productId = product.id || product.unique_id || product.product_id;
  const isFollowUp = Boolean(memoryUuid);
  
  // Skip PDF validation completely for speed - always include PDFs if available
  const request = {
    batch: [{
      query: userQuestion,
      name: product.name || 'Product Q&A',
      id: productId,
      // Always include up to 2 PDFs if available (no validation or URL conversion)
      ...((!isFollowUp && product._lw_pdf_url_ss?.length) ? 
        { pdfLinks: product._lw_pdf_url_ss.slice(0, 2) } : {})
    }],
    useCaseConfig: {
      domain: 'manufacturing',
      ...(memoryUuid ? { memoryUuid } : {})
    }
  };
  
  return request;
};

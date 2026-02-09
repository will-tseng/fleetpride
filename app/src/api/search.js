import axios from 'axios';
import { getSessionUUID } from '@utils/uuid';
import { emitDebugLog } from '@utils/logger';
import { handleApiError, retryWithBackoff, classifyError } from '@utils/errorHandling';

const API_CONFIG = {
  baseURL: 'https://saleseng-dev.b.lucidworks.cloud',
  application: 'FleetPride',
  queryProfile: 'FleetPride',
  apiKey: '674ef9e5-6e19-4aae-9533-a6c1c25b86ce',
  timeout: 10000,
};

const QUERY_PROFILES = {
  'default': 'FleetPride',
  'typeahead': 'FleetPride',
  'suggestions': 'FleetPride',
  'landing-page': 'FleetPride',
  'pdp': 'FleetPride',
  'category': 'FleetPride',
};

const DEFAULT_PARAMS = {
  query: '*:*',
  rows: 12,
  start: 0
};


const TYPEAHEAD_FIELDS = [
  'id', 'title', 'title_s', 'name', 'name_s', 'name_t', 'display_name_s', 'text',
  'description', 'description_t', 'url', 'url_s', 'type', 'image_url', 'image_url_s',
  'image', 'imageuri', 'images', 'variant_images', 'brand_s', 'brand_t',
  'part_number_s', 'sku_s', 'price', 'price_f', 'price_display_s', 'category_s', 'subcategory_s'
];

// Cache for session and user IDs
let cachedSessionId = null;
const getUserId = () => 'anonymous';
const getSessionId = () => {
  if (!cachedSessionId) {
    cachedSessionId = getSessionUUID();
  }
  return cachedSessionId;
};

const validateConfig = () => {
  const required = ['baseURL', 'application', 'queryProfile', 'apiKey'];
  const missing = required.filter(key => !API_CONFIG[key]);
  if (missing.length > 0) {
    return false;
  }
  return true;
};

// Shared axios client for all API calls, including fusion_rag
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_CONFIG.apiKey
  }
});

// Enhanced error interceptor with centralized error handling
apiClient.interceptors.response.use(
  response => response,
  async error => {
    // Use centralized error handling
    const result = await handleApiError(error, {
      context: 'Search API',
      maxRetries: 0, // No auto-retry in interceptor, handled per-request
      showNotification: false
    });

    // Preserve the error object with enhanced information
    const enhancedError = new Error(result.error.message);
    enhancedError.originalError = error;
    enhancedError.classification = result.error.type;
    enhancedError.severity = result.error.severity;
    enhancedError.canRetry = result.canRetry;

    return Promise.reject(enhancedError);
  }
);

// Optimized parameter building
const buildSearchParams = (searchOptions) => {
  const {
    query, start, rows, filterQueries = [],
    collapse, collapseField, expand, expandField, fields,
    facet, facetFields, facetLimit, facetMinCount, sort
  } = searchOptions;

  const params = new URLSearchParams({
    q: query,
    start: start.toString(),
    rows: rows.toString(),
    user_id: getUserId(),
    session: getSessionId()
  });

  // Add sort parameter if specified
  if (sort && sort !== 'score desc') {
    params.append('sort', sort);
  }

  // Add filter queries
  filterQueries.forEach(fq => params.append('fq', fq));

  // Add facet parameters
  if (facet) {
    params.append('facet', 'true');
    if (facetLimit) params.append('facet.limit', facetLimit.toString());
    if (facetMinCount) params.append('facet.mincount', facetMinCount.toString());
    // Add facet fields - if not specified, use default FleetPride facet fields
    const defaultFacetFields = ['brand_s', 'category_s', 'subcategory_s'];
    const fieldsToFacet = facetFields || defaultFacetFields;
    fieldsToFacet.forEach(field => params.append('facet.field', field));
  }

  // Add collapse/expand parameters
  if (collapse) {
    params.append('fq', `{!collapse field=${collapseField}}`);
    if (expand) {
      params.append('expand', 'true');
      params.append('expand.field', collapseField);
      if (expandField) {
        params.append('expand.fl', expandField);
      }
    }
  }

  // Add fields if specified
  if (fields) {
    params.append('fl', Array.isArray(fields) ? fields.join(',') : fields);
  }

  return params;
};

// Optimized query processing
const processQuery = (query, id) => {
  if (id && !query.includes('id:')) {
    const escapedId = id.replace(/([!:+&|<>=^(){}[\]^"~*?\\/-])/g, '\\$1');
    return `id:"${escapedId}"`;
  }
  return query;
};

// Optimized result processing
const processSearchResult = (response, id, startTime) => {
  const elapsedMs = Date.now() - startTime;
  let documents = response.data.response?.docs || [];

  if (id) {
    documents = documents.filter(doc => doc.id === id);
  }

  return {
    success: true,
    data: response.data,
    totalResults: response.data.response?.numFound || 0,
    documents: documents,
    facets: response.data.facet_counts || null,
    responseTime: response.data.responseHeader?.QTime || 0,
    elapsedTime: elapsedMs
  };
};

export const search = async (options = {}) => {
  const searchOptions = { ...DEFAULT_PARAMS, ...options };
  const { query, queryProfile, signal, id, sort, enableRetry = true } = searchOptions;


  if (!validateConfig()) {
    const errorMsg = 'API configuration is incomplete';
    emitDebugLog(`❌ ${errorMsg}`);
    return { success: false, error: errorMsg, data: null };
  }

  const startTime = Date.now();

  // Define the search operation
  const performSearch = async () => {
    const processedQuery = processQuery(query, id);
    const profileEndpoint = QUERY_PROFILES[queryProfile] || QUERY_PROFILES.default;
    const params = buildSearchParams({ ...searchOptions, query: processedQuery });
    const requestUrl = `/api/apps/${API_CONFIG.application}/query/${profileEndpoint}`;

    emitDebugLog(`🌐 Request: ${API_CONFIG.baseURL}${requestUrl}${sort ? ` (sorted by ${sort})` : ''}`);

    const response = await apiClient.get(requestUrl, { params, signal });
    return response;
  };

  try {
    let response;

    // Retry logic for retryable errors (network, timeout, API errors)
    if (enableRetry) {
      response = await retryWithBackoff(performSearch, {
        maxRetries: 2,
        baseDelay: 1000,
        onRetry: (attempt, delay) => {
          emitDebugLog(`🔄 Retry attempt ${attempt} after ${delay}ms`);
        }
      });
    } else {
      response = await performSearch();
    }

    const result = processSearchResult(response, id, startTime);
    emitDebugLog(`✅ Response: ${result.totalResults} results in ${result.elapsedTime}ms${sort ? ` (sorted by ${sort})` : ''}`);
    return result;

  } catch (error) {
    const isAborted = error.name === 'AbortError' || error.name === 'CanceledError' || axios.isCancel(error);
    const errorMessage = isAborted ? 'Search was cancelled' : error.message;
    const classification = classifyError(error);

    emitDebugLog(`❌ Error: ${errorMessage} (Type: ${classification.type}, Severity: ${classification.severity})`);

    return {
      success: false,
      error: errorMessage,
      errorType: classification.type,
      severity: classification.severity,
      canRetry: error.canRetry || false,
      data: null,
      cancelled: isAborted
    };
  }
};

export const getTypeaheadSuggestions = async (query, signal = null) => {

  if (!query || query.trim().length < 2) {
    return { success: false, error: 'Query too short', suggestions: [] };
  }
  
  try {
    const result = await search({
      query: `${query}*`,
      rows: 10,
      queryProfile: 'typeahead',
      signal,
      fields: TYPEAHEAD_FIELDS
    });
    
    if (!result.success) {
      return { ...result, suggestions: [] };
    }
    
    const suggestions = result.documents.map((doc, index) => {
      const getImageUrl = () => {
        const imageFields = ['image_url_s', 'image_url', 'image', 'imageuri'];
        for (const field of imageFields) {
          if (doc[field]) return doc[field];
        }
        if (Array.isArray(doc.images) && doc.images[0]) return doc.images[0];
        if (Array.isArray(doc.variant_images) && doc.variant_images[0]) return doc.variant_images[0];
        return null;
      };

      // Build description from brand and part number for FleetPride products
      const getDescription = () => {
        const parts = [];
        if (doc.brand_s || doc.brand_t) parts.push(doc.brand_s || doc.brand_t);
        if (doc.part_number_s) parts.push(`Part #${doc.part_number_s}`);
        if (doc.price_display_s) parts.push(doc.price_display_s);
        if (parts.length > 0) return parts.join(' | ');
        return doc.description || doc.description_t || doc.content?.substring(0, 100) || '';
      };

      return {
        id: doc.id || `suggestion_${index}`,
        title: doc.name_s || doc.name_t || doc.name || doc.title_s || doc.title || doc.display_name_s || doc.text || 'Untitled',
        description: getDescription(),
        url: doc.url_s || doc.url || null,
        type: doc.type || 'product',
        image: getImageUrl(),
        brand: doc.brand_s || doc.brand_t || null,
        price: doc.price_display_s || null,
        partNumber: doc.part_number_s || null,
        category: doc.category_s || null,
        subcategory: doc.subcategory_s || null,
        originalDoc: doc
      };
    });
    
    return {
      success: true,
      suggestions,
      data: result.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestions: []
    };
  }
};

export const facetedSearch = (searchParams = {}, signal = null) => {
  const result = search({
    ...searchParams,
    facet: true,
    signal
  });
  
  return result;
};

export const getPage = (lastSearch = {}, page = 1, signal = null) => {
  const rows = lastSearch.rows || DEFAULT_PARAMS.rows;
  const start = (page - 1) * rows;

  const result = search({
    ...lastSearch,
    start,
    signal
  });
  
  return result;
};

export const getHomePageProducts = (limit = 12, signal = null) => {
  const result = search({
    query: '*:*',
    rows: limit,
    queryProfile: 'landing-page',
    signal
  });

  return result;
};

export const fusion_rag = async (query, context, productId = null, signal = null, enableRetry = true) => {

  if (!validateConfig()) {
    const errorMsg = 'API configuration is incomplete';
    emitDebugLog(`❌ ${errorMsg}`);
    return { success: false, error: errorMsg, data: null };
  }

  const startTime = Date.now();

  // List of RAG endpoints to try in order
  const ragEndpoints = [
    'build_demo_rag',
    'Build_Demo_rag',
    'rag',
    'ui_rag',
    'Build_Demo' // fallback to default profile
  ];

  // Use productId for fq
  let finalProductId = productId;
  if (!finalProductId && context) {
    finalProductId = context.id || context._id || context.productId || context.product_id || context.document_id || context.docId;
  }

  const params = new URLSearchParams({
    q: query,
    user_id: getUserId(),
    session: getSessionId(),
  });

  if (finalProductId) {
    const escapedId = finalProductId.toString().replace(/([!:+&|<>=^(){}[\]^"~*?\\/-])/g, '\\$1');
    params.append('fq', `id:("${escapedId}")`);
  }

  // Try each RAG endpoint
  for (const endpoint of ragEndpoints) {
    try {
      const requestUrl = `/api/apps/${API_CONFIG.application}/query/${endpoint}`;
      const fullUrl = `${API_CONFIG.baseURL}${requestUrl}`;
      emitDebugLog(`🌐 RAG Request: ${fullUrl}`);

      // Define the RAG request operation for retry
      const performRagRequest = async () => {
        return await apiClient.get(requestUrl, {
          params,
          signal,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_CONFIG.apiKey
          }
        });
      };

      // Make the request with retry logic if enabled
      let response;
      if (enableRetry) {
        response = await retryWithBackoff(performRagRequest, {
          maxRetries: 2,
          baseDelay: 1000,
          onRetry: (attempt, delay) => {
            emitDebugLog(`🔄 RAG Retry attempt ${attempt} for ${endpoint} after ${delay}ms`);
          }
        });
      } else {
        response = await performRagRequest();
      }

      const elapsedMs = Date.now() - startTime;
      
      // Extract RAG response from the Fusion response format
      let predictions = null;
      if (response.data.fusion?.grounded_response) {
        const groundedResponse = response.data.fusion.grounded_response;
        
        // Extract just the answer text from the grounded response
        let answerText = groundedResponse;
        
        // Try multiple patterns to extract the answer
        let answerMatch = groundedResponse.match(/ANSWER:\s*\\"(.*?)\\"/);
        if (!answerMatch) {
          answerMatch = groundedResponse.match(/ANSWER:\s*"(.*?)"/);
        }
        if (!answerMatch) {
          answerMatch = groundedResponse.match(/ANSWER:\s*(.+?)(?:\n\n|$)/s);
        }
        
        if (answerMatch && answerMatch[1]) {
          answerText = answerMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .trim();
        }
        
        predictions = [{ answer: answerText }];
      } else {
        // If no grounded_response, create a basic answer from search results
        const docs = response.data.response?.docs || [];
        if (docs.length > 0) {
          const doc = docs[0];
          const basicAnswer = `Based on the product information: ${doc.title_t || doc.title_s || 'Product'} - ${doc.description_t || doc.description_s || 'No description available'}`.substring(0, 500);
          predictions = [{ answer: basicAnswer }];
        }
      }
      
      const result = {
        success: true,
        data: response.data,
        predictions: predictions,
        responseTime: response.data.responseHeader?.QTime || 0,
        elapsedTime: elapsedMs,
        usedEndpoint: endpoint
      };
      
      emitDebugLog(`✅ RAG Response from ${endpoint} in ${result.elapsedTime}ms`);
      return result;

    } catch (error) {
      const isLastEndpoint = endpoint === ragEndpoints[ragEndpoints.length - 1];
      const classification = classifyError(error);

      emitDebugLog(`⚠️ RAG endpoint ${endpoint} failed: ${error.message} (Type: ${classification.type})`);

      // If this is the last endpoint, return the error with enhanced information
      if (isLastEndpoint) {
        const errorMessage = error.message;

        emitDebugLog(`❌ RAG Error: All endpoints failed. Last error: ${errorMessage}`);
        return {
          success: false,
          error: `All RAG endpoints failed. Last error: ${errorMessage}`,
          errorType: classification.type,
          severity: classification.severity,
          canRetry: error.canRetry || false,
          data: null,
          cancelled: false,
          triedEndpoints: ragEndpoints
        };
      }
      // Continue to next endpoint if not the last one
    }
  }
};

const searchApi = {
  search,
  facetedSearch,
  getPage,
  getTypeaheadSuggestions,
  getHomePageProducts,
  fusion_rag
};

export default searchApi;
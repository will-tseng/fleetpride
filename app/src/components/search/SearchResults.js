import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  Skeleton,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  Paper
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { search } from '@api/search';
import ProductCard from '../product/ProductCard';
import SearchSuggestions from './SearchSuggestions';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ErrorBoundary from '../error/ErrorBoundary';
import EmbeddedComponentError from '../error/EmbeddedComponentError';
import HorizontalFacetBar from '../search/HorizontalFacetBar';
import FacetSidebar, { FacetSidebarSkeleton } from './FacetSidebar';
import { logError } from '@utils/errorHandling';
import Breadcrumb from '../common/Breadcrumb';
import { useStore } from '@context/StoreContext';
import { useUser } from '@context/UserContext';
import { useSelectedVehicle } from '@context/SelectedVehicleContext';
import ProductTable from '../product/ProductTable';

function useQuery() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

// Utility function to normalize facets for Fusion/Cloud and Solr formats
function normalizeFacets(facets) {
  if (!facets) return null;
  let facetFields = null;
  if (facets.fields) {
    facetFields = {};
    Object.entries(facets.fields).forEach(([field, arr]) => {
      if (Array.isArray(arr)) {
        const buckets = [];
        for (let i = 0; i < arr.length; i += 2) {
          if (arr[i] !== undefined && arr[i+1] !== undefined) {
            buckets.push({ val: arr[i], count: arr[i+1] });
          }
        }
        facetFields[field] = { buckets };
      }
    });
  } else if (facets.facet_fields) {
    facetFields = {};
    Object.entries(facets.facet_fields).forEach(([field, arr]) => {
      if (Array.isArray(arr)) {
        const buckets = [];
        for (let i = 0; i < arr.length; i += 2) {
          if (arr[i] !== undefined && arr[i+1] !== undefined) {
            buckets.push({ val: arr[i], count: arr[i+1] });
          }
        }
        facetFields[field] = { buckets };
      }
    });
  }
  return facetFields;
}

// Utility function to extract price range facet as buckets (like other facets)
function extractPriceRangeFacet(facets, field = 'price_f') {
  if (!facets?.facet_ranges?.[field]) return null;

  const rangeData = facets.facet_ranges[field];
  const counts = rangeData.counts || [];
  const gap = parseFloat(rangeData.gap) || 100;
  const buckets = [];

  // Convert counts array [start1, count1, start2, count2, ...] to buckets
  for (let i = 0; i < counts.length; i += 2) {
    const start = parseFloat(counts[i]);
    const count = counts[i + 1];
    if (!isNaN(start) && count > 0) {
      const end = start + gap;
      buckets.push({
        val: `$${Math.floor(start)} - $${Math.floor(end)}`,
        rangeVal: `[${start} TO ${end}]`,
        count: count
      });
    }
  }

  // Add "before" bucket if there are items below the start
  if (rangeData.before > 0) {
    const start = parseFloat(rangeData.start) || 0;
    buckets.unshift({
      val: `Under $${Math.floor(start)}`,
      rangeVal: `[* TO ${start}]`,
      count: rangeData.before
    });
  }

  // Add "after" bucket if there are items above the end
  if (rangeData.after > 0) {
    const end = parseFloat(rangeData.end) || 1000;
    buckets.push({
      val: `$${Math.floor(end)}+`,
      rangeVal: `[${end} TO *]`,
      count: rangeData.after
    });
  }

  return { buckets };
}

// Loading skeleton components
function ProductCardSkeleton() {
  // Updated skeleton to match new ProductCard layout
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 'none', border: '1px solid #eee', borderRadius: 2 }}>
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '8px 8px 0 0', bgcolor: '#f9f9f9' }} />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Skeleton variant="text" height={28} width="80%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} width="60%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} width="40%" sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" height={36} width={120} sx={{ mt: 2, borderRadius: 1 }} />
      </CardContent>
    </Card>
  );
}

function SortSelectorSkeleton({ isMobile = false }) {
  // Updated skeleton to match new SortSelector control
  return (
    <Skeleton 
      variant="rectangular" 
      width={isMobile ? 140 : 180} 
      height={isMobile ? 40 : 56}
      sx={{ borderRadius: 1, bgcolor: '#f9f9f9' }}
    />
  );
}

function ViewToggleSkeleton({ isMobile = false }) {
  // Updated skeleton to match new ViewToggle control
  return (
    <Skeleton 
      variant="rectangular" 
      width={isMobile ? 72 : 88} 
      height={isMobile ? 32 : 40}
      sx={{ borderRadius: 1, bgcolor: '#f9f9f9' }}
    />
  );
}



// Optimized ViewToggle component with immediate state updates
const ViewToggle = React.memo(({ viewMode, onViewChange, isMobile = false }) => {
  const handleViewChange = useCallback((event, newView) => {
    if (newView && newView !== viewMode) {
      onViewChange(newView);
    }
  }, [viewMode, onViewChange]);

  return (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleViewChange}
      size={isMobile ? 'small' : 'medium'}
      sx={{
        '& .MuiToggleButton-root': {
          border: '1px solid',
          borderColor: 'divider',
          minWidth: isMobile ? 32 : 40,
          padding: isMobile ? '4px' : '8px',
          transition: 'all 0.15s ease-in-out',
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          },
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }
      }}
    >
      <ToggleButton value='grid' aria-label='grid view'>
        <GridViewIcon fontSize={isMobile ? 'small' : 'medium'} />
      </ToggleButton>
      <ToggleButton value='list' aria-label='list view'>
        <ViewListIcon fontSize={isMobile ? 'small' : 'medium'} />
      </ToggleButton>
    </ToggleButtonGroup>
  );
});

ViewToggle.displayName = 'ViewToggle';

// List view product card component
const ProductListCard = React.memo(({ product }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!product || !product.id) {
    return (
      <Card sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" color="error">
          Product information unavailable
        </Typography>
      </Card>
    );
  }

  const productTitle = product.title || product.name || 'Unnamed Product';
  const mainImage = product.image_url_s || product.image_url || product.image || 
    `https://placehold.co/120x120/e9e9e9/969696?text=${encodeURIComponent(productTitle)}`;

  // Helper function to format price
  const formatPrice = (price, currency = 'USD', decimalPlaces = 2) => {
    if (!price || isNaN(price)) return null;
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(price);
    } catch (error) {
      return `$${Number(price).toFixed(decimalPlaces)}`;
    }
  };

  return (
    <Card 
      component={Link}
      to={`/product/${product.id}`}
      sx={{ 
        p: 2, 
        mb: 2, 
        display: 'flex', 
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      {/* Product Image */}
      <Box sx={{ minWidth: isMobile ? 80 : 120, mr: 2 }}>
        <CardMedia
          component='img'
          height={isMobile ? 80 : 120}
          width={isMobile ? 80 : 120}
          image={mainImage}
          alt={productTitle}
          sx={{
            objectFit: 'contain',
            background: '#f9f9f9',
            borderRadius: 1
          }}
        />
      </Box>

      {/* Product Details */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          sx={{
            fontWeight: 600,
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {productTitle}
        </Typography>

        {product.manufacturer && (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mb: 1 }}
          >
            {product.manufacturer}
          </Typography>
        )}

        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: isMobile ? 2 : 3,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {product.description || 'No description available'}
        </Typography>

        {/* Price and Actions Row */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            sx={{
              fontWeight: 700,
              color: 'primary.main'
            }}
          >
            {formatPrice(product.price, 'USD', 2) || 'Price unavailable'}
          </Typography>

          <Button
            variant='contained'
            size={isMobile ? 'small' : 'medium'}
            startIcon={<ShoppingCartIcon />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add to cart logic would go here
            }}
            sx={{
              backgroundColor: '#C99063',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            Add to Cart
          </Button>
        </Box>
      </Box>
    </Card>
  );
});

ProductListCard.displayName = 'ProductListCard';

// Optimized ProductGrid component
const ProductGrid = React.memo(({ results, loading, resultsPerPage, viewMode = 'grid' }) => {
  if (loading) {
    if (viewMode === 'list') {
      return (
        <Box>
          {Array.from({ length: resultsPerPage }).map((_, index) => (
            <Skeleton
              key={`list-skeleton-${index}`}
              variant='rectangular'
              height={140}
              sx={{ mb: 2, borderRadius: 1 }}
            />
          ))}
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {Array.from({ length: resultsPerPage }).map((_, index) => (
          <Grid item key={`skeleton-${index}`} xs={6} sm={6} md={4} lg={4}>
            <ProductCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (viewMode === 'list') {
    return (
      <Box>
        {results.map((product, index) => (
          <ErrorBoundary
            key={product.id ? String(product.id) : `product-${index}`}
            componentName={`SearchResultProductList-${product.id || index}`}
            onError={(error, info) => logError(error, { 
              componentName: 'SearchResultProductListCard', 
              productId: product.id,
              title: product.title,
              componentStack: info?.componentStack 
            })}
            fallbackComponent={props => (
              <EmbeddedComponentError 
                {...props} 
                title='Product Display Error' 
                message='This product could not be displayed properly.' 
                minHeight='120px'
                variant='info'
              />
            )}
          >
            <ProductListCard product={product} />
          </ErrorBoundary>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {results.map((product, index) => (
        <Grid item key={product.id ? String(product.id) : `product-${index}`} xs={6} sm={6} md={4} lg={4}>
          <ErrorBoundary
            componentName={`SearchResultProduct-${product.id || index}`}
            onError={(error, info) => logError(error, { 
              componentName: 'SearchResultProductCard', 
              productId: product.id,
              title: product.title,
              componentStack: info?.componentStack 
            })}
            fallbackComponent={props => (
              <EmbeddedComponentError 
                {...props} 
                title='Product Display Error' 
                message='This product could not be displayed properly.' 
                minHeight='300px'
                variant='info'
              />
            )}
          >
            <ProductCard product={product} />
          </ErrorBoundary>
        </Grid>
      ))}
    </Grid>
  );
});

// Sort options with proper Lucidworks Fusion syntax
const SORT_OPTIONS = [
  { value: 'score desc', label: 'Relevance (Best Match)', field: 'score', direction: 'desc' },
  { value: 'title asc', label: 'Title (A-Z)', field: 'title', direction: 'asc' },
  { value: 'title desc', label: 'Title (Z-A)', field: 'title', direction: 'desc' },
  { value: 'price asc', label: 'Price (Low to High)', field: 'price', direction: 'asc' },
  { value: 'price desc', label: 'Price (High to Low)', field: 'price', direction: 'desc' }
];

// Memoized sort selector component
const SortSelector = React.memo(({ sortValue, onSortChange, isMobile = false }) => (
  <FormControl 
    size={isMobile ? 'small' : 'medium'} 
    sx={{ 
      minWidth: isMobile ? 140 : 180,
      '& .MuiSelect-select': {
        fontSize: isMobile ? '0.875rem' : '1rem'
      }
    }}
  >
    <InputLabel id='sort-select-label'>Sort by</InputLabel>
    <Select
      labelId='sort-select-label'
      value={sortValue}
      label='Sort by'
      onChange={(e) => onSortChange(e.target.value)}
      sx={{
        backgroundColor: 'background.paper',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'divider'
        }
      }}
    >
      {SORT_OPTIONS.map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
));

SortSelector.displayName = 'SortSelector';

export default function SearchResults() {
  const query = useQuery().get('q') || '';
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const abortControllerRef = useRef(null);
  const { getStoreFilterQuery, getInventoryFilterQuery, selectedStore, inStockOnly, toggleInStockOnly } = useStore();
  const { isSignedIn, currentUser } = useUser();
  const { selectedVehicle: vehicleFilter } = useSelectedVehicle();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facets, setFacets] = useState(null);
  const [selectedFacets, setSelectedFacets] = useState({});
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortValue, setSortValue] = useState('score desc'); // Default to relevance
  const [showAllProducts, setShowAllProducts] = useState(false); // Toggle to show all products (bypass user filter)
  const resultsPerPage = 12;

  // Use ref for price range mapping to avoid triggering re-renders
  const priceRangeMappingRef = useRef({});

  // Get user availability filter for logged-in users
  // Field naming: user1=ady_acustomer_b, user2=ady_customerb_b, user3=ady_customerc_b, user4=ady_customerd_b
  const getUserAvailabilityFilter = useCallback(() => {
    // Skip filter if "Show All Products" is enabled
    if (showAllProducts) return null;
    if (!isSignedIn || !currentUser) return null;

    // Map user IDs to their availability field names
    const userFieldMap = {
      'user1': 'ady_acustomer_b',
      'user2': 'ady_customerb_b',
      'user3': 'ady_customerc_b',
      'user4': 'ady_customerd_b',
    };

    const availabilityField = userFieldMap[currentUser.id];
    if (!availabilityField) return null;

    // Filter to only show products available to this user
    return `${availabilityField}:true`;
  }, [isSignedIn, currentUser, showAllProducts]);

  // Get default view mode based on user
  // Sarah (user1) -> list, Michael (user2) -> grid, everyone else -> list
  const getDefaultViewMode = useCallback(() => {
    if (!isSignedIn || !currentUser) return 'grid'; // logged out users default to grid
    if (currentUser.id === 'user2') return 'grid'; // Michael -> grid
    return 'list'; // Sarah and everyone else -> list
  }, [isSignedIn, currentUser]);

  // Separate state for immediate UI updates
  const [immediateViewMode, setImmediateViewMode] = useState('grid');

  // Track if we've applied user default (to avoid overriding URL param)
  const hasAppliedUserDefault = useRef(false);

  // Memoized page parsing
  const currentPage = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const pageParam = parseInt(params.get('page'), 10);
    return !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
  }, [location.search]);

  // Memoized sort parsing from URL
  const currentSort = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const sortParam = params.get('sort');
    return sortParam && SORT_OPTIONS.some(opt => opt.value === sortParam) 
      ? sortParam 
      : 'score desc';
  }, [location.search]);

  // Memoized view parsing from URL (returns null if no view param in URL)
  const currentView = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    if (viewParam === 'list') return 'list';
    if (viewParam === 'grid') return 'grid';
    return null; // No explicit view param in URL
  }, [location.search]);

  // Update both immediate and URL state when URL changes
  useEffect(() => {
    setPage(currentPage);
    setSortValue(currentSort);

    // If URL has explicit view param, use it; otherwise use user default
    if (currentView !== null) {
      setImmediateViewMode(currentView);
    } else if (!hasAppliedUserDefault.current) {
      setImmediateViewMode(getDefaultViewMode());
      hasAppliedUserDefault.current = true;
    }
  }, [currentPage, currentSort, currentView, getDefaultViewMode]);

  // Reset user default flag when user changes
  useEffect(() => {
    hasAppliedUserDefault.current = false;
    // Apply new user's default view mode
    const params = new URLSearchParams(location.search);
    if (!params.get('view')) {
      setImmediateViewMode(getDefaultViewMode());
      hasAppliedUserDefault.current = true;
    }
  }, [currentUser?.id, getDefaultViewMode, location.search]);

  // Memoized facets parsing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const facetsParam = params.get('facets');

    if (facetsParam) {
      const facetObj = {};
      facetsParam.split('|').forEach(f => {
        const [field, vals] = f.split(':');
        if (field && vals) {
          facetObj[field] = vals.split('~');
        }
      });
      setSelectedFacets(facetObj);
    } else {
      setSelectedFacets({});
    }
  }, [location.search]);

  // Extract category from URL parameters
  const categoryParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category');
  }, [location.search]);

  // Extract manufacturer from URL parameters
  const manufacturerParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('manufacturer');
  }, [location.search]);

  // Memoized filter queries - now includes category, manufacturer, store, inventory, and user availability filters
  const storeFilterQuery = getStoreFilterQuery();
  const inventoryFilterQuery = getInventoryFilterQuery();
  const userAvailabilityFilter = getUserAvailabilityFilter();
  const filterQueries = useMemo(() => {
    // Build facet filters - values within same field should be OR'd together
    const facetFilters = Object.entries(selectedFacets)
      .filter(([, values]) => values && values.length > 0)
      .map(([field, values]) => {
        // Handle Price range facet specially - use ref to avoid re-render loop
        if (field === 'Price') {
          // Look up the rangeVal for each selected price bucket from the ref
          const rangeQueries = values.map(val => {
            return priceRangeMappingRef.current[val] || null;
          }).filter(Boolean);

          if (rangeQueries.length === 1) {
            return `price_f:${rangeQueries[0]}`;
          } else if (rangeQueries.length > 1) {
            return `price_f:(${rangeQueries.join(' OR ')})`;
          }
          return null;
        }

        if (values.length === 1) {
          // Single value: simple filter
          return `${field}:"${values[0]}"`;
        }
        // Multiple values: OR them together
        const orClause = values.map(val => `"${val}"`).join(' OR ');
        return `${field}:(${orClause})`;
      })
      .filter(Boolean);

    // Add category filter if present in URL
    if (categoryParam) {
      facetFilters.push(`category:"${categoryParam}"`);
    }

    // Add manufacturer filter if present in URL
    if (manufacturerParam) {
      facetFilters.push(`manufacturer:"${manufacturerParam}"`);
    }

    // Add store filter based on selected store (only for logged-out users)
    if (storeFilterQuery && !isSignedIn) {
      facetFilters.push(storeFilterQuery);
    }

    // Add inventory filter if "In Stock at Store Today" is enabled (only for logged-out users)
    if (inventoryFilterQuery && !isSignedIn) {
      facetFilters.push(inventoryFilterQuery);
    }

    // Add user availability filter for logged-in users
    if (userAvailabilityFilter) {
      facetFilters.push(userAvailabilityFilter);
    }

    // Add vehicle filter if vehicle is selected
    if (vehicleFilter) {
      facetFilters.push(vehicleFilter.filterQuery);
    }

    return facetFilters;
  }, [selectedFacets, categoryParam, manufacturerParam, storeFilterQuery, inventoryFilterQuery, isSignedIn, userAvailabilityFilter, vehicleFilter]);

  // Optimized sort change handler
  const handleSortChange = useCallback((newSortValue) => {
    const params = new URLSearchParams(location.search);
    
    if (newSortValue === 'score desc') {
      // Remove sort param for default relevance sort
      params.delete('sort');
    } else {
      params.set('sort', newSortValue);
    }
    
    // Reset to first page when changing sort
    params.set('page', '1');
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [location, navigate]);

  // Highly optimized view change handler with immediate updates
  const handleViewChange = useCallback((newViewMode) => {
    // Immediate state update for instant UI feedback
    setImmediateViewMode(newViewMode);
    
    // Batch the URL update to avoid blocking the UI
    requestAnimationFrame(() => {
      const params = new URLSearchParams(location.search);
      
      if (newViewMode === 'grid') {
        params.delete('view');
      } else {
        params.set('view', newViewMode);
      }
      
      // Use replace to avoid history pollution
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    });
  }, [location, navigate]);

  // Optimized search effect with sorting
  useEffect(() => {
    if (!query) return;

    const performSearch = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      setLoading(true);
      setError(null);
      
      try {
        const searchParams = {
          query: query || '*:*',
          start: (page - 1) * resultsPerPage,
          rows: resultsPerPage,
          filterQueries: filterQueries,
          facet: true,
          facetLimit: 50,
          facetMinCount: 1,
          queryProfile: 'default',
          fields: 'id,name_s,title,title_s,price,price_f,price_display_s,image_url_s,image_url,description,brand_s,brand_t,manufacturer,category_s,category,subcategory_s,sku,sku_s,part_number,part_number_s,features_ss,search_text_t,online_shipping_b,chicago_store_b,chicago_inventory_i,sanfran_store_b,sanfran_inventory_i,raleigh_store_b,raleigh_inventory_i',
          sort: sortValue,
          signal
        };
        
        const result = await search(searchParams);
        
        if (signal.aborted) return;
        
        if (result.success) {
          // Process results - simplified for FleetPride (no variant grouping)
          const productsWithVariants = (result.documents || []).map(product => {
            // Get the main image
            const mainImage = product.image_url_s || product.image_url;

            return {
              ...product,
              variant_images: mainImage ? [mainImage] : [],
              variant_data: [],
              total_variants: 1
            };
          });
          
          setResults(productsWithVariants);
          setTotalResults(result.totalResults || 0);

          // Normalize regular facets and add price range facet
          let normalizedFacets = normalizeFacets(result.facets) || {};
          const priceFacet = extractPriceRangeFacet(result.facets);
          if (priceFacet) {
            // Remove the regular price_f facet since we have a range facet for it
            delete normalizedFacets['price_f'];
            // Store the price range mapping in ref for filter queries (avoids re-render loop)
            priceRangeMappingRef.current = {};
            priceFacet.buckets.forEach(bucket => {
              priceRangeMappingRef.current[bucket.val] = bucket.rangeVal;
            });
            // Add Price as first facet by creating a new object with Price first
            normalizedFacets = {
              'Price': { ...priceFacet, isRangeFacet: true, field: 'price_f' },
              ...normalizedFacets
            };
          }
          setFacets(Object.keys(normalizedFacets).length > 0 ? normalizedFacets : null);
        } else {
          setError(result.error || 'No results found.');
        }
      } catch (error) {
        if (!signal.aborted) {
          setError(error.message || 'An error occurred while searching');
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    // Debounce search calls
    const timeoutId = setTimeout(performSearch, 150);
    
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, page, filterQueries, sortValue]); // Add sortValue to dependencies

  // Optimized facet change handler (for single value toggle)
  const handleFacetChange = useCallback((field, value) => {
    const current = selectedFacets[field] || [];
    const newSelected = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    const updatedFacets = { ...selectedFacets, [field]: newSelected };

    // Remove empty arrays
    Object.keys(updatedFacets).forEach(k => {
      if (!updatedFacets[k] || updatedFacets[k].length === 0) {
        delete updatedFacets[k];
      }
    });

    const facetsParam = Object.entries(updatedFacets)
      .map(([f, vals]) => `${f}:${vals.join('~')}`)
      .join('|');

    const params = new URLSearchParams(location.search);
    if (facetsParam) {
      params.set('facets', facetsParam);
    } else {
      params.delete('facets');
    }
    params.set('page', '1');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [selectedFacets, location, navigate]);

  // Handler to apply multiple facet values at once (for horizontal facet bar)
  const handleApplyFacets = useCallback((field, values) => {
    const updatedFacets = { ...selectedFacets, [field]: values };

    // Remove empty arrays
    Object.keys(updatedFacets).forEach(k => {
      if (!updatedFacets[k] || updatedFacets[k].length === 0) {
        delete updatedFacets[k];
      }
    });

    const facetsParam = Object.entries(updatedFacets)
      .map(([f, vals]) => `${f}:${vals.join('~')}`)
      .join('|');

    const params = new URLSearchParams(location.search);
    if (facetsParam) {
      params.set('facets', facetsParam);
    } else {
      params.delete('facets');
    }
    params.set('page', '1');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [selectedFacets, location, navigate]);


  // Optimized page change handler
  const handlePageChange = useCallback((event, value) => {
    const params = new URLSearchParams(location.search);
    params.set('page', value);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [location, navigate]);

  // Optimized clear filters handler - preserve category and manufacturer if present
  const handleClearFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set('q', query);
    
    // Preserve category parameter when clearing other filters
    if (categoryParam) {
      params.set('category', categoryParam);
    }
    
    // Preserve manufacturer parameter when clearing other filters
    if (manufacturerParam) {
      params.set('manufacturer', manufacturerParam);
    }
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [query, categoryParam, manufacturerParam, location.pathname, navigate]);

  // Memoized search suggestions container
  const MemoizedSearchSuggestions = React.memo(({ 
    options, 
    visible, 
    onItemClick, 
    onClose,
    maxItems, 
    maxHeight, 
    containerStyles 
  }) => (
    <SearchSuggestions
      options={options}
      visible={visible}
      onItemClick={onItemClick}
      onClose={onClose}
      maxItems={maxItems}
      maxHeight={maxHeight}
      containerStyles={containerStyles}
    />
  ));

  MemoizedSearchSuggestions.displayName = 'MemoizedSearchSuggestions';

  // Memoized breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Home', href: '/' }];
    
    if (categoryParam) {
      items.push({ label: categoryParam });
    } else if (manufacturerParam) {
      items.push({ label: manufacturerParam });
    } else if (query && query !== '*:*') {
      items.push({ label: `Search Results for "${query}"` });
    } else {
      items.push({ label: 'All Products' });
    }
    
    return items;
  }, [categoryParam, manufacturerParam, query]);

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header with search query, sort, and view toggle */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 2,
        gap: 2
      }}>
        <Typography variant='h4' sx={{ 
          fontWeight: 700, 
          fontSize: { xs: '1.75rem', md: '2.25rem' },
          mb: { xs: 0, sm: 0 }
        }}>
          {categoryParam 
            ? `${categoryParam} Products${query !== '*:*' ? ` for "${query}"` : ''}`
            : manufacturerParam
              ? `${manufacturerParam} Products${query !== '*:*' ? ` for "${query}"` : ''}`
              : query === '*:*' 
                ? 'Showing All Products' 
                : `Search Results for "${query}"`
          }
        </Typography>
        
        {/* Controls container */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'space-between', sm: 'flex-end' },
          flexWrap: 'wrap'
        }}>
          {!loading && totalResults > 0 && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                whiteSpace: 'nowrap'
              }}
            >
              {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {loading ? (
              <>
                <SortSelectorSkeleton isMobile={isMobile} />
                <ViewToggleSkeleton isMobile={isMobile} />
              </>
            ) : (
              <>
                <SortSelector 
                  sortValue={sortValue}
                  onSortChange={handleSortChange}
                  isMobile={isMobile}
                />
                
                <ViewToggle
                  viewMode={immediateViewMode} // Use immediate state for instant feedback
                  onViewChange={handleViewChange}
                  isMobile={isMobile}
                />
              </>
            )}
          </Box>
        </Box>
      </Box>
      
      
      {error && <Typography color='error' sx={{ mb: 2 }}>{error}</Typography>}
      {!loading && !error && results.length === 0 && (
        <Typography>No results found.</Typography>
      )}

      {/* Signed In: Horizontal Facet Bar above results */}
      {isSignedIn && (
        <HorizontalFacetBar
          facets={facets}
          selectedFacets={selectedFacets}
          onFacetChange={handleFacetChange}
          onApplyFacets={handleApplyFacets}
          onClearAll={handleClearFilters}
          loading={loading}
        />
      )}

      {/* Signed In: Toggle between grid and list view */}
      {isSignedIn && (
        <Box sx={{ width: '100%' }}>
          {immediateViewMode === 'list' ? (
            <ProductTable
              products={results}
              loading={loading}
              resultsPerPage={resultsPerPage}
              showAllProducts={showAllProducts}
              onToggleShowAll={() => setShowAllProducts(prev => !prev)}
            />
          ) : (
            <ProductGrid
              results={results}
              loading={loading}
              resultsPerPage={resultsPerPage}
              viewMode="grid"
            />
          )}

          {/* Pagination */}
          {!loading && totalResults > resultsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, overflow: 'auto', py: 1 }}>
              <Pagination
                count={Math.ceil(totalResults / resultsPerPage)}
                page={page}
                onChange={handlePageChange}
                color='primary'
                shape='rounded'
                size={isMobile ? 'small' : 'medium'}
                showFirstButton={!isMobile}
                showLastButton={!isMobile}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Logged Out: Sidebar layout with facets on left */}
      {!isSignedIn && (
        <Grid container spacing={3}>
          {/* Facet Sidebar - left column (only show in grid view) */}
          {immediateViewMode === 'grid' && (
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 0, md: 0 },
                  position: { md: 'sticky' },
                  top: { md: 16 },
                  backgroundColor: 'transparent'
                }}
              >
                {/* Facets */}
                {loading ? (
                  <FacetSidebarSkeleton />
                ) : (
                  <FacetSidebar
                    facets={facets}
                    selectedFacets={selectedFacets}
                    onFacetChange={handleFacetChange}
                  />
                )}
              </Paper>
            </Grid>
          )}

          {/* Products - right column (full width in list view) */}
          <Grid item xs={12} md={immediateViewMode === 'grid' ? 9 : 12}>
            {/* Filter Buttons - In Stock at Store Today / Available for Shipping */}
            {selectedStore && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={inStockOnly ? 'contained' : 'outlined'}
                  onClick={toggleInStockOnly}
                  startIcon={selectedStore.id === 'online' ? <LocalShippingIcon /> : <StorefrontIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    borderColor: inStockOnly ? 'transparent' : '#e0e0e0',
                    backgroundColor: inStockOnly ? '#00a499' : 'transparent',
                    color: inStockOnly ? 'white' : '#333',
                    '&:hover': {
                      backgroundColor: inStockOnly ? '#008f85' : 'rgba(0, 164, 153, 0.08)',
                      borderColor: inStockOnly ? 'transparent' : '#00a499',
                    },
                  }}
                >
                  {selectedStore.id === 'online' ? 'Available for Shipping' : 'In Stock at Store Today'}
                </Button>
              </Box>
            )}

            {/* Show ProductTable for list view, ProductGrid for grid view */}
            {immediateViewMode === 'list' ? (
              <>
                {/* Horizontal facet bar for list view */}
                <HorizontalFacetBar
                  facets={facets}
                  selectedFacets={selectedFacets}
                  onFacetChange={handleFacetChange}
                  onApplyFacets={handleApplyFacets}
                  onClearAll={handleClearFilters}
                  loading={loading}
                />
                <ProductTable
                  products={results}
                  loading={loading}
                  resultsPerPage={resultsPerPage}
                />
              </>
            ) : (
              <ProductGrid
                results={results}
                loading={loading}
                resultsPerPage={resultsPerPage}
                viewMode={immediateViewMode}
              />
            )}

            {/* Pagination */}
            {!loading && totalResults > resultsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, overflow: 'auto', py: 1 }}>
                <Pagination
                  count={Math.ceil(totalResults / resultsPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  color='primary'
                  shape='rounded'
                  size={isMobile ? 'small' : 'medium'}
                  showFirstButton={!isMobile}
                  showLastButton={!isMobile}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      )}
      
    </Container>
  );
}
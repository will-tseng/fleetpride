import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Collapse,
  Checkbox,
  TextField,
  InputAdornment,
  Skeleton,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';

// Helper function to format facet field labels for display
const formatFacetLabel = (field) => {
  // Map technical field names to friendly display labels
  const labelMap = {
    'brand_s': 'Brand',
    'brand_t': 'Brand',
    'category_s': 'Category',
    'category_t': 'Category',
    'subcategory_s': 'Subcategory',
    'subcategory_t': 'Subcategory',
    'price_f': 'Price',
    'Price': 'Price',
    'manufacturer': 'Manufacturer',
    'color_s': 'Color',
    'size_s': 'Size',
  };

  if (labelMap[field]) {
    return labelMap[field];
  }

  // Remove common Solr suffixes and format
  return field
    .replace(/_s$/, '')
    .replace(/_t$/, '')
    .replace(/_f$/, '')
    .replace(/_ss$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

// FacetSidebar loading skeleton component
export function FacetSidebarSkeleton() {
  return (
    <Box sx={{ width: '100%', mb: { xs: 3, sm: 0 } }}>
      {[1, 2, 3, 4].map((item) => (
        <Box key={item} sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Skeleton variant="rectangular" height={44} sx={{ borderRadius: '4px 4px 0 0', bgcolor: '#f8f9fa' }} />
          <Box sx={{ p: 1.5 }}>
            {[1, 2, 3].map((subItem) => (
              <Box key={subItem} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
                <Skeleton variant="text" height={20} width="70%" />
                <Skeleton variant="text" height={20} width="20%" sx={{ ml: 1 }} />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Memoized FacetSidebar with optimized search
const FacetSidebar = React.memo(({
  facets,
  selectedFacets,
  onFacetChange,
  loading = false
}) => {
  const [openFacets, setOpenFacets] = useState(() => {
    // Initialize all facets as open
    const initialState = {};
    Object.keys(facets || {}).forEach(field => {
      initialState[field] = true;
    });
    return initialState;
  });
  const [facetSearchTerms, setFacetSearchTerms] = useState({});

  const searchTimeouts = useRef({});

  const handleFacetSearch = useCallback((field, searchTerm) => {
    // Clear existing timeout
    if (searchTimeouts.current[field]) {
      clearTimeout(searchTimeouts.current[field]);
    }

    // Set new timeout for debounced search
    searchTimeouts.current[field] = setTimeout(() => {
      setFacetSearchTerms(prev => ({
        ...prev,
        [field]: searchTerm
      }));
    }, 300);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(searchTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Optimized bucket filtering with useMemo
  const facetBuckets = useMemo(() => {
    const result = {};
    Object.entries(facets || {}).forEach(([field, facet]) => {
      const searchTerm = facetSearchTerms[field]?.toLowerCase() || '';
      const buckets = facet.buckets || [];
      
      result[field] = {
        filtered: searchTerm 
          ? buckets.filter(bucket => bucket.val.toLowerCase().includes(searchTerm))
          : buckets,
        hasSearchResults: searchTerm ? buckets.some(bucket => bucket.val.toLowerCase().includes(searchTerm)) : true
      };
    });
    return result;
  }, [facets, facetSearchTerms]);

  const toggleFacet = useCallback((field) => {
    setOpenFacets(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Show loading skeleton if loading prop is true
  if (loading) {
    return <FacetSidebarSkeleton />;
  }

  if (!facets) return null;

  return (
    <Box sx={{ width: '100%', mb: { xs: 3, sm: 0 } }}>
      {Object.entries(facets).map(([field, facet]) => {
        const { filtered: filteredBuckets, hasSearchResults } = facetBuckets[field] || { filtered: [], hasSearchResults: false };
        
        return (
          <Box key={field} sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                p: 1.5,
                backgroundColor: '#003366',
                color: '#fff',
                borderBottom: openFacets[field] ? '1px solid #e0e0e0' : 'none',
                borderRadius: openFacets[field] ? '4px 4px 0 0' : '4px',
                '&:hover': {
                  backgroundColor: '#004488'
                }
              }}
              onClick={() => toggleFacet(field)}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, textTransform: 'capitalize', fontSize: '0.875rem' }}>
                {formatFacetLabel(field)}
              </Typography>
              {openFacets[field] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </Box>
            <Collapse in={!!openFacets[field]} timeout="auto" unmountOnExit>
              <Box>
                {/* Facet search input - only show for facets with more than 5 options */}
                {Array.isArray(facet?.buckets) && facet.buckets.length > 5 && (
                  <Box sx={{ p: 1.5, pb: 1, borderBottom: '1px solid #f0f0f0' }}>
                    <TextField
                      size="small"
                      placeholder={`Search ${formatFacetLabel(field)}...`}
                      onChange={(e) => handleFacetSearch(field, e.target.value)}
                      sx={{ 
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.875rem',
                          '& fieldset': {
                            borderColor: '#e0e0e0'
                          }
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                )}
                
                <List 
                  dense 
                  disablePadding 
                  sx={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                      width: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '2px',
                      '&:hover': {
                        background: 'rgba(0,0,0,0.3)',
                      }
                    }
                  }}
                >
                  {Array.isArray(facet?.buckets) && facet.buckets.length > 0 ? (
                    hasSearchResults ? (
                      filteredBuckets.map((bucket) => (
                        <ListItem 
                          key={`${field}-${bucket.val}`} 
                          disableGutters 
                          sx={{ 
                            px: 1.5,
                            py: 0.5,
                            '&:hover': {
                              backgroundColor: '#f8f9fa'
                            }
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={selectedFacets[field]?.includes(bucket.val) || false}
                            onChange={() => onFacetChange(field, bucket.val)}
                            color="primary"
                            sx={{ p: 0.5, mr: 1 }}
                          />
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography 
                                  noWrap 
                                  sx={{ 
                                    fontSize: '0.875rem', 
                                    maxWidth: '75%',
                                    color: 'text.primary'
                                  }}
                                >
                                  {bucket.val}
                                </Typography>
                                <Typography sx={{ 
                                  color: 'text.secondary', 
                                  fontSize: '0.75rem',
                                  fontWeight: 500
                                }}>
                                  ({bucket.count})
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem sx={{ px: 1.5, py: 1 }}>
                        <ListItemText primary={
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontStyle: 'italic' }}>
                            No matches found
                          </Typography>
                        } />
                      </ListItem>
                    )
                  ) : (
                    <ListItem sx={{ px: 1.5, py: 1 }}>
                      <ListItemText primary={
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                          No options
                        </Typography>
                      } />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
});

FacetSidebar.displayName = 'FacetSidebar';

export default FacetSidebar;
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  Typography,
  Chip,
  Skeleton,
  Badge,
  TextField,
  InputAdornment,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
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

// Skeleton for loading state
export function HorizontalFacetBarSkeleton() {
  return (
    <Box sx={{
      display: 'flex',
      gap: 1.5,
      flexWrap: 'wrap',
      alignItems: 'center',
      py: 1.5,
      px: 0,
      mb: 2,
    }}>
      {[1, 2, 3, 4].map((item) => (
        <Skeleton
          key={item}
          variant="rectangular"
          width={120}
          height={36}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}

// Individual facet dropdown component with search and Apply button
const FacetDropdown = React.memo(({
  field,
  facet,
  selectedValues = [],
  onApplyFacets
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSelections, setPendingSelections] = useState([]);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    // Initialize pending selections with current selected values when opening
    setPendingSelections([...selectedValues]);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Clear search and reset pending selections when closing
    setSearchTerm('');
    setPendingSelections([]);
  };

  const handleToggle = (value) => {
    // Toggle in pending selections (not applied yet)
    setPendingSelections(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleApply = () => {
    // Apply all pending selections
    onApplyFacets(field, pendingSelections);
    handleClose();
  };

  const handleClearSelections = () => {
    setPendingSelections([]);
  };

  // Check if there are changes to apply
  const hasChanges = useMemo(() => {
    if (pendingSelections.length !== selectedValues.length) return true;
    const sortedPending = [...pendingSelections].sort();
    const sortedSelected = [...selectedValues].sort();
    return !sortedPending.every((val, idx) => val === sortedSelected[idx]);
  }, [pendingSelections, selectedValues]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 200);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Focus search input when menu opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure menu is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Filter buckets based on search term
  const filteredBuckets = useMemo(() => {
    const buckets = facet?.buckets || [];
    if (!searchTerm) return buckets;

    const lowerSearch = searchTerm.toLowerCase();
    return buckets.filter(bucket =>
      bucket.val.toLowerCase().includes(lowerSearch)
    );
  }, [facet?.buckets, searchTerm]);

  const hasSearchResults = filteredBuckets.length > 0;
  const showSearch = Array.isArray(facet?.buckets) && facet.buckets.length > 5;

  const displayName = formatFacetLabel(field);
  const selectedCount = selectedValues.length;

  return (
    <>
      <Badge
        badgeContent={selectedCount}
        color="primary"
        sx={{
          '& .MuiBadge-badge': {
            right: 8,
            top: 8,
            fontSize: '0.7rem',
            minWidth: 18,
            height: 18,
          }
        }}
      >
        <Button
          onClick={handleClick}
          endIcon={<KeyboardArrowDownIcon sx={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} />}
          sx={{
            textTransform: 'none',
            color: selectedCount > 0 ? 'primary.main' : '#333',
            borderColor: selectedCount > 0 ? 'primary.main' : '#e0e0e0',
            backgroundColor: selectedCount > 0 ? 'rgba(0, 51, 102, 0.08)' : 'transparent',
            fontWeight: selectedCount > 0 ? 600 : 500,
            fontSize: '0.875rem',
            px: 2,
            py: 0.75,
            borderRadius: 1,
            border: '1px solid',
            '&:hover': {
              backgroundColor: selectedCount > 0 ? 'rgba(0, 51, 102, 0.12)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: selectedCount > 0 ? 'primary.main' : '#bdbdbd',
            },
          }}
        >
          {displayName}
        </Button>
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 0.5,
            maxHeight: 350,
            minWidth: 220,
            maxWidth: 320,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 1,
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {/* Search input - only show for facets with more than 5 options */}
        {showSearch && (
          <Box sx={{ px: 1.5, pt: 1, pb: 0.5, borderBottom: '1px solid #f0f0f0' }}>
            <TextField
              inputRef={searchInputRef}
              size="small"
              placeholder={`Search ${displayName.toLowerCase()}...`}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
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
            />
          </Box>
        )}

        {/* Facet options list */}
        <Box sx={{
          maxHeight: showSearch ? 200 : 250,
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
        }}>
          {Array.isArray(facet?.buckets) && facet.buckets.length > 0 ? (
            hasSearchResults ? (
              filteredBuckets.map((bucket) => (
                <MenuItem
                  key={bucket.val}
                  onClick={() => handleToggle(bucket.val)}
                  sx={{
                    py: 0.75,
                    px: 1.5,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 51, 102, 0.08)',
                    }
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={pendingSelections.includes(bucket.val)}
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: 0,
                  }}>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: '0.875rem',
                        flex: 1,
                        mr: 1,
                      }}
                    >
                      {bucket.val}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      ({bucket.count})
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  No matches found
                </Typography>
              </MenuItem>
            )
          ) : (
            <MenuItem disabled>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                No options available
              </Typography>
            </MenuItem>
          )}
        </Box>

        {/* Apply/Clear buttons footer */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          p: 1.5,
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
        }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleClearSelections}
            disabled={pendingSelections.length === 0}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontSize: '0.813rem',
              fontWeight: 500,
              borderColor: '#e0e0e0',
              color: 'text.secondary',
              '&:hover': {
                borderColor: '#bdbdbd',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-disabled': {
                borderColor: '#f0f0f0',
                color: '#bdbdbd',
              }
            }}
          >
            Clear
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleApply}
            disabled={!hasChanges}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontSize: '0.813rem',
              fontWeight: 600,
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&.Mui-disabled': {
                backgroundColor: '#e0e0e0',
                color: '#9e9e9e',
              }
            }}
          >
            Apply {pendingSelections.length > 0 && `(${pendingSelections.length})`}
          </Button>
        </Box>
      </Menu>
    </>
  );
});

FacetDropdown.displayName = 'FacetDropdown';

// Main horizontal facet bar component
const HorizontalFacetBar = React.memo(({
  facets,
  selectedFacets,
  onFacetChange, // Used for chip deletion
  onApplyFacets,
  onClearAll,
  loading = false
}) => {
  // Calculate total selected filters
  const totalSelected = useMemo(() => {
    return Object.values(selectedFacets || {}).reduce(
      (total, values) => total + (values?.length || 0),
      0
    );
  }, [selectedFacets]);

  // Get all selected chips for display
  const selectedChips = useMemo(() => {
    const chips = [];
    Object.entries(selectedFacets || {}).forEach(([field, values]) => {
      (values || []).forEach(value => {
        chips.push({ field, value });
      });
    });
    return chips;
  }, [selectedFacets]);

  if (loading) {
    return <HorizontalFacetBarSkeleton />;
  }

  if (!facets || Object.keys(facets).length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      {/* Facet dropdowns row */}
      <Box sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        alignItems: 'center',
        py: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          <FilterListIcon sx={{ fontSize: '1.25rem', color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Filters:
          </Typography>
        </Box>

        {Object.entries(facets).map(([field, facet]) => (
          <FacetDropdown
            key={field}
            field={field}
            facet={facet}
            selectedValues={selectedFacets[field] || []}
            onApplyFacets={onApplyFacets}
          />
        ))}

        {totalSelected > 0 && (
          <Button
            onClick={onClearAll}
            size="small"
            sx={{
              textTransform: 'none',
              color: 'error.main',
              fontSize: '0.875rem',
              fontWeight: 500,
              ml: 1,
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
              }
            }}
          >
            Clear All ({totalSelected})
          </Button>
        )}
      </Box>

      {/* Selected filter chips */}
      {selectedChips.length > 0 && (
        <Box sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center',
          pt: 1,
        }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 0.5 }}>
            Active:
          </Typography>
          {selectedChips.map(({ field, value }) => (
            <Chip
              key={`${field}-${value}`}
              label={`${formatFacetLabel(field)}: ${value}`}
              size="small"
              onDelete={() => onFacetChange(field, value)}
              deleteIcon={<CloseIcon sx={{ fontSize: '0.875rem !important' }} />}
              sx={{
                height: 26,
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 51, 102, 0.1)',
                color: 'primary.main',
                fontWeight: 500,
                '& .MuiChip-deleteIcon': {
                  color: 'primary.main',
                  '&:hover': {
                    color: 'primary.dark',
                  }
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

HorizontalFacetBar.displayName = 'HorizontalFacetBar';

export default HorizontalFacetBar;

import React, { memo, useCallback, useMemo } from 'react';
import { Paper, List, ListItem, Box, Typography, Avatar, Skeleton } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import { truncateText } from '@utils/formatter';

// Memoized suggestion item component
const SuggestionItem = memo(({ option, onItemClick, isLast }) => {
  const handleClick = useCallback(() => {
    onItemClick(option);
  }, [option, onItemClick]);

  const imageUrl = useMemo(() => {
    if (option.image && typeof option.image === 'string' && option.image.startsWith('http')) {
      return option.image;
    }
    return null;
  }, [option.image]);

  const truncatedTitle = useMemo(() => 
    truncateText(option.title, 40), 
  [option.title]
  );

  const truncatedDescription = useMemo(() => 
    option.description ? truncateText(option.description, 60) : null, 
  [option.description]
  );

  return (
    <ListItem
      button
      divider={!isLast}
      onClick={handleClick}
      onMouseDown={(e) => {
        // Prevent input blur when clicking suggestion
        e.preventDefault();
      }}
      sx={{
        py: 1,
        px: 2,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
        {imageUrl ? (
          <Avatar
            src={imageUrl}
            alt={option.title}
            variant='square'
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 2, 
              bgcolor: 'background.default',
              '& img': {
                objectFit: 'cover'
              }
            }}
            imgProps={{
              loading: 'lazy',
              onError: (e) => {
                e.target.style.display = 'none';
              }
            }}
          >
            <ImageIcon sx={{ color: '#aaa' }} />
          </Avatar>
        ) : (
          <Avatar 
            variant='square' 
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 2, 
              bgcolor: 'background.default' 
            }}
          >
            <ImageIcon sx={{ color: '#aaa' }} />
          </Avatar>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant='body2' 
            fontWeight='500' 
            noWrap
            sx={{ lineHeight: 1.4 }}
          >
            {truncatedTitle}
          </Typography>
          {truncatedDescription && (
            <Typography 
              variant='caption' 
              color='text.secondary' 
              noWrap
              sx={{ lineHeight: 1.2 }}
            >
              {truncatedDescription}
            </Typography>
          )}
        </Box>
      </Box>
    </ListItem>
  );
});

SuggestionItem.displayName = 'SuggestionItem';

// Loading skeleton for suggestions
const SuggestionSkeleton = memo(() => (
  <ListItem sx={{ py: 1, px: 2 }}>
    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
      <Skeleton variant='rectangular' width={40} height={40} sx={{ mr: 2, borderRadius: 1 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant='text' height={20} width='70%' sx={{ mb: 0.5 }} />
        <Skeleton variant='text' height={16} width='50%' />
      </Box>
    </Box>
  </ListItem>
));

SuggestionSkeleton.displayName = 'SuggestionSkeleton';

/**
 * Optimized search suggestions component with virtualization and performance improvements
 */
const SearchSuggestions = memo(({
  options = [],
  visible = false,
  onItemClick,
  onClose,
  maxItems = 5,
  maxHeight = '60vh',
  containerStyles = {},
  loading = false
}) => {
  const handleItemClick = useCallback((option) => {
    if (onItemClick) {
      onItemClick(option);
    }
    // Close suggestions after selection
    if (onClose) {
      onClose();
    }
  }, [onItemClick, onClose]);

  // Memoized visible options to prevent recalculation
  const visibleOptions = useMemo(() => 
    options.slice(0, maxItems), 
  [options, maxItems]
  );

  // Memoized paper styles
  const paperStyles = useMemo(() => ({
    position: 'absolute',
    zIndex: 9999,
    width: 'calc(100% - 32px)',
    mt: 0.5,
    maxHeight,
    overflow: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    ...containerStyles
  }), [maxHeight, containerStyles]);

  if (!visible || (!loading && options.length === 0)) return null;
  
  return (
    <Paper sx={paperStyles}>
      <List dense sx={{ p: 0 }}>
        {loading ? (
          // Show loading skeletons
          Array.from({ length: Math.min(maxItems, 3) }).map((_, index) => (
            <SuggestionSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          // Show actual suggestions
          visibleOptions.map((option, index) => (
            <SuggestionItem
              key={option.id || `suggestion-${index}`}
              option={option}
              index={index}
              onItemClick={handleItemClick}
              isLast={index === visibleOptions.length - 1}
            />
          ))
        )}
      </List>
    </Paper>
  );
});

SearchSuggestions.displayName = 'SearchSuggestions';

export default SearchSuggestions;

import React from 'react';
import { Paper, InputBase, IconButton, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/**
 * Reusable search input component
 */
const SearchInput = ({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder = 'Search products...',
  loading = false,
  customStyles = {},
  showLoadingIndicator = true,
  buttonColor = 'default'
}) => {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value?.trim() && onSubmit) {
      onSubmit(value);
    }
  };
  
  return (
    <Paper
      component="form"
      sx={{
        p: '2px 8px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        ...customStyles
      }}
      onSubmit={handleSubmit}
    >
      <InputBase
        sx={{
          ml: 1,
          flex: 1,
          '& input': {
            fontSize: '0.95rem',
            padding: '6px 0'
          }
        }}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        autoComplete="off"
        spellCheck="false"
      />
      {loading && showLoadingIndicator && <CircularProgress size={20} sx={{ mr: 1 }} />}
      <IconButton
        type="submit"
        sx={{ p: '8px' }}
        aria-label="search"
        color={buttonColor}
      >
        <SearchIcon />
      </IconButton>
    </Paper>
  );
};

export default SearchInput;

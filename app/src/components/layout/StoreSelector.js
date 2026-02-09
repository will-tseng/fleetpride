import React, { useState } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Button,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { useStore } from '@context/StoreContext';

const StoreSelector = () => {
  const { selectedStore, selectStore, storeOptions } = useStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectStore = (storeId) => {
    selectStore(storeId);
    handleClose();
  };

  const getStoreIcon = (storeId) => {
    if (storeId === 'online') {
      return <LocalShippingIcon fontSize="small" />;
    }
    return <StorefrontIcon fontSize="small" />;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button
        onClick={handleClick}
        sx={{
          textTransform: 'none',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          py: 0.5,
          px: 1.5,
          borderRadius: 1,
          backgroundColor: open ? 'rgba(0, 164, 153, 0.08)' : 'transparent',
          border: '1px solid #e0e0e0',
          '&:hover': {
            backgroundColor: 'rgba(0, 164, 153, 0.08)',
            borderColor: '#00a499',
          },
        }}
      >
        {getStoreIcon(selectedStore.id)}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#666',
              fontSize: '0.65rem',
              lineHeight: 1,
              fontWeight: 500,
            }}
          >
            Shopping at
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#00a499',
              lineHeight: 1.2,
            }}
          >
            {selectedStore.label}
          </Typography>
        </Box>
        <KeyboardArrowDownIcon
          fontSize="small"
          sx={{
            color: '#666',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #eee' }}>
          <Typography variant="caption" color="text.secondary">
            Select where you are shopping
          </Typography>
        </Box>
        {storeOptions.map((store) => (
          <MenuItem
            key={store.id}
            onClick={() => handleSelectStore(store.id)}
            selected={selectedStore.id === store.id}
            sx={{
              py: 1.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(0, 164, 153, 0.08)',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(0, 164, 153, 0.12)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getStoreIcon(store.id)}
            </ListItemIcon>
            <ListItemText
              primary={store.label}
              primaryTypographyProps={{
                fontWeight: selectedStore.id === store.id ? 600 : 400,
              }}
            />
            {selectedStore.id === store.id && (
              <CheckIcon fontSize="small" sx={{ color: '#00a499', ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default StoreSelector;

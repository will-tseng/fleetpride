import React, { useState } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Button,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import LogoutIcon from '@mui/icons-material/Logout';
import BusinessIcon from '@mui/icons-material/Business';
import { useUser } from '@context/UserContext';

const AccountSelector = () => {
  const { currentUser, isSignedIn, signIn, signOut, availableUsers } = useUser();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUserSelect = (userId) => {
    signIn(userId);
    handleClose();
  };

  const handleSignOut = () => {
    signOut();
    handleClose();
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button
        onClick={handleClick}
        sx={{
          textTransform: 'none',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          py: 0.5,
          px: 1,
          minWidth: 'auto',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        {isSignedIn ? (
          <>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: '0.75rem',
                bgcolor: '#537E87',
              }}
            >
              {getInitials(currentUser.name)}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  color: 'text.secondary',
                  lineHeight: 1,
                }}
              >
                Hello, {currentUser.name.split(' ')[0]}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  lineHeight: 1.2,
                }}
              >
                Account
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <PersonOutlineIcon sx={{ fontSize: '1.5rem', color: '#666' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  color: 'text.secondary',
                  lineHeight: 1,
                }}
              >
                Hello, Sign in
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  lineHeight: 1.2,
                }}
              >
                Account
              </Typography>
            </Box>
          </>
        )}
        <KeyboardArrowDownIcon
          sx={{
            color: '#666',
            fontSize: '1.2rem',
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
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
          },
        }}
      >
        {isSignedIn && (
          <>
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: '#537E87',
                  }}
                >
                  {getInitials(currentUser.name)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {currentUser.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {currentUser.email}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <BusinessIcon sx={{ fontSize: '0.75rem', color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {currentUser.company} · {currentUser.role}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Divider />
          </>
        )}

        <Typography
          variant="overline"
          sx={{
            px: 2,
            pt: 1.5,
            pb: 0.5,
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.65rem',
          }}
        >
          {isSignedIn ? 'Switch Account' : 'Select Account'}
        </Typography>

        {availableUsers.map((user) => (
          <MenuItem
            key={user.id}
            onClick={() => handleUserSelect(user.id)}
            selected={currentUser?.id === user.id}
            sx={{
              py: 1,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: 'rgba(83, 126, 135, 0.08)',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(83, 126, 135, 0.12)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.7rem',
                  bgcolor: currentUser?.id === user.id ? '#537E87' : 'grey.400',
                }}
              >
                {getInitials(user.name)}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={user.name}
              secondary={user.company}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: currentUser?.id === user.id ? 600 : 400,
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
              }}
            />
            {currentUser?.id === user.id && (
              <CheckIcon sx={{ color: '#537E87', fontSize: '1.2rem' }} />
            )}
          </MenuItem>
        ))}

        {isSignedIn && (
          <>
            <Divider sx={{ my: 1 }} />
            <MenuItem
              onClick={handleSignOut}
              sx={{
                py: 1,
                px: 2,
                color: 'error.main',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon sx={{ color: 'error.main', fontSize: '1.2rem' }} />
              </ListItemIcon>
              <ListItemText
                primary="Sign Out"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                }}
              />
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default AccountSelector;

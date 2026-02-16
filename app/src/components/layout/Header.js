import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Container,
  Button, Divider, Link as MuiLink, Badge, List, ListItem,
  ListItemText, ListItemIcon, Drawer, Tooltip, useTheme,
  LinearProgress, Popover
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CallIcon from '@mui/icons-material/Call';
import ChatIcon from '@mui/icons-material/Chat';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Logo from './Logo';
import StoreSelector from './StoreSelector';
import AccountSelector from './AccountSelector';
import VehicleSelectorEnhanced from '../search/VehicleSelectorEnhanced';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loadCart } from '@utils/cartUtils';
import { getTypeaheadSuggestions } from '@api/search';
import { useFaq } from '@context/FaqContext';
import { useUser } from '@context/UserContext';
import { useSelectedVehicle } from '@context/SelectedVehicleContext';
import { isDebugEnabled, toggleConsoleLogs } from '@utils/logger';
import SearchInput from '../search/SearchInput';
import SearchSuggestions from '../search/SearchSuggestions';
import DebugDrawer from '../debug/DebugDrawer';
import { logEvents } from '@utils/eventLogger';
import { searchInputStyles } from '@styles';

// FleetPride categories for heavy duty truck parts
const mainCategories = [
  { label: 'Brakes & Wheel End', href: 'category_s=brakes' },
  { label: 'Air System', href: 'subcategory_s=air_system' },
  { label: 'Drivetrain', href: 'subcategory_s=drivetrain' },
  { label: 'Engine', href: 'subcategory_s=engine' },
  { label: 'Exhaust', href: 'subcategory_s=exhaust' },
  { label: 'Electrical', href: 'subcategory_s=electrical' },
  { label: 'Lighting', href: 'subcategory_s=lighting' },
  { label: 'Trailer Parts', href: 'subcategory_s=trailer' }
];

const Header = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFaqVisibility } = useFaq();
  const { isSignedIn } = useUser();
  const { selectedVehicle, setSelectedVehicle, clearVehicle } = useSelectedVehicle();

  // Simplified state
  const [cartItems, setCartItems] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastApiCall, setLastApiCall] = useState(null);
  const [logMessages, setLogMessages] = useState([]);
  const [consoleLogsEnabled, setConsoleLogsEnabled] = useState(isDebugEnabled());
  const [vehicleSelectorAnchor, setVehicleSelectorAnchor] = useState(null);
  
  // Refs
  const debounceTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);
  const logRef = useRef([]);

  // Cart updates
  useEffect(() => {
    const updateCartItems = () => setCartItems(loadCart());
    updateCartItems();
    window.addEventListener('cartUpdated', updateCartItems);
    return () => window.removeEventListener('cartUpdated', updateCartItems);
  }, []);

  // Debug event listeners
  useEffect(() => {
    const handleApiCallEvent = (e) => setLastApiCall(e.detail);
    const handleLogEvent = (e) => {
      logRef.current = [...logRef.current, e.detail];
      setLogMessages([...logRef.current]);
    };

    window.addEventListener('lwApiCall', handleApiCallEvent);
    window.addEventListener('lwLog', handleLogEvent);
    
    return () => {
      window.removeEventListener('lwApiCall', handleApiCallEvent);
      window.removeEventListener('lwLog', handleLogEvent);
    };
  }, []);

  // Close suggestions on route change
  useEffect(() => {
    setShowSuggestions(false);
  }, [location.pathname, location.search]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Fetch suggestions
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setLoading(true);
    try {
      const result = await getTypeaheadSuggestions(query);
      const suggestions = result.success ? result.suggestions : [];
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (value, device) => {
    setSearchValue(value);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (value && value.trim().length >= 2) {
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
        logEvents.typeahead(value, device);
      }, 300);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (query, device, method) => {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) return;
    
    setShowSuggestions(false);
    logEvents.search(trimmedQuery, device, method);
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (item, device) => {
    if (!item?.id) return;

    logEvents.suggestion(item, device);
    navigate(`/product/${item.id}`);
    setShowSuggestions(false);
  };

  // Vehicle selector handlers
  const handleVehicleSelectorOpen = (event) => {
    setVehicleSelectorAnchor(event.currentTarget);
  };

  const handleVehicleSelectorClose = () => {
    setVehicleSelectorAnchor(null);
  };

  const handleVehicleSelected = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleSelectorAnchor(null);
    // Navigate to search page with vehicle filter
    const params = new URLSearchParams(location.search);
    navigate(`/search?q=${params.get('q') || '*:*'}`);
  };

  const handleClearVehicle = () => {
    clearVehicle();
  };

  const cartItemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  const renderSearchInput = (device, customStyles, additionalProps = {}) => {
    // Vehicle selector adornment for desktop only
    const vehicleAdornment = device === 'desktop' ? (
      <Button
        onClick={handleVehicleSelectorOpen}
        startIcon={<DirectionsCarIcon sx={{ fontSize: 18 }} />}
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
        sx={{
          minWidth: 150,
          height: 36,
          bgcolor: 'transparent',
          border: '1px solid #d0d0d0',
          borderRadius: 1,
          color: selectedVehicle ? '#003366' : '#666',
          textTransform: 'none',
          fontWeight: selectedVehicle ? 600 : 400,
          fontSize: '0.85rem',
          px: 1.5,
          '&:hover': {
            bgcolor: '#f5f5f5',
            borderColor: '#003366',
          },
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          mr: 1
        }}
      >
        {selectedVehicle
          ? `${selectedVehicle.year} ${selectedVehicle.make}`
          : 'Vehicle'
        }
      </Button>
    ) : null;

    return (
      <SearchInput
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value, device)}
        onSubmit={() => {
          if (searchValue.trim()) {
            handleSearchSubmit(searchValue, device, 'click');
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && searchValue.trim()) {
            e.preventDefault();
            handleSearchSubmit(searchValue, device, 'keyboard-enter');
          } else if (e.key === 'Escape') {
            e.target.blur();
            setShowSuggestions(false);
          }
        }}
        placeholder="What are you shopping for?"
        loading={loading}
        customStyles={customStyles}
        startAdornment={vehicleAdornment}
        {...additionalProps}
      />
    );
  };

  const renderSearchSuggestions = (device, additionalProps = {}) => (
    <SearchSuggestions
      options={searchSuggestions}
      visible={showSuggestions && searchSuggestions.length > 0}
      onItemClick={(item) => handleSuggestionSelect(item, device)}
      onClose={() => setShowSuggestions(false)}
      maxItems={5}
      loading={loading}
      {...additionalProps}
    />
  );

  // Helper function to build category URLs with preserved query
  const buildCategoryUrl = (categoryParam) => {
    const currentParams = new URLSearchParams(location.search);
    const existingQuery = currentParams.get('q');
    const queryParam = existingQuery || '*:*';
    return `/search?${categoryParam}&q=${encodeURIComponent(queryParam)}`;
  };

  // Helper function to build shop all URL with preserved query
  const buildShopAllUrl = () => {
    const currentParams = new URLSearchParams(location.search);
    const existingQuery = currentParams.get('q');
    const queryParam = existingQuery || '*:*';
    return `/search?q=${encodeURIComponent(queryParam)}`;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top utility bar - desktop only */}
      <Box sx={{ 
        backgroundColor: 'background.default', 
        borderTop: `2px solid ${theme.palette.primary.main}`, 
        borderBottom: '1px solid #e0e0e0', 
        display: { xs: 'none', md: 'block' } 
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', py: 0.5 }}>
            <MuiLink href="#" underline="none" sx={{ color: '#63666A', fontSize: 14, display: 'flex', alignItems: 'center', mx: 2 }}>
              <ChatIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Chat With Us
            </MuiLink>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <MuiLink 
              href="#" 
              underline="none" 
              sx={{ color: '#63666A', fontSize: 14, mx: 2, fontWeight: 400, '&:hover': { cursor: 'pointer' } }}
              onClick={(e) => {
                e.preventDefault();
                toggleFaqVisibility();
              }}
            >
              FAQs
            </MuiLink>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <MuiLink 
              href="/support/faq" 
              underline="none" 
              sx={{ color: '#63666A', fontSize: 14, mx: 2 }}
              onClick={e => {
                e.preventDefault();
                setDebugDrawerOpen(true);
              }}
            >
              Help
            </MuiLink>
          </Box>
        </Container>
      </Box>

      {/* Desktop main header */}
      <Box sx={{ 
        backgroundColor: '#fff', 
        display: { xs: 'none', md: 'block' }, 
        boxShadow: 'none', 
        borderBottom: '1px solid #e0e0e0' 
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, pb: 1 }}>
            {/* Logo */}
            <Box sx={{ minWidth: 150, height: 60, display: 'flex', alignItems: 'center' }}>
              <MuiLink href="/" underline="none" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                <Logo height={50} />
              </MuiLink>
            </Box>

            {/* Store Selector - hidden when user is signed in */}
            {!isSignedIn && (
              <Box sx={{ mx: 2 }}>
                <StoreSelector />
              </Box>
            )}

            {/* Desktop search with integrated vehicle selector */}
            <Box
              ref={searchContainerRef}
              sx={{ flex: 1, display: 'flex', alignItems: 'center', ml: 0, mr: 4, position: 'relative' }}
            >
              {renderSearchInput('desktop', searchInputStyles.desktop.paper)}
              {renderSearchSuggestions('desktop')}
            </Box>
            
            {/* Account and Cart */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountSelector />
              <Tooltip title={`${cartItemCount} item${cartItemCount !== 1 ? 's' : ''} in cart`}>
                <IconButton
                  aria-label="shopping cart"
                  sx={{ color: '#333' }}
                  component={Link}
                  to="/checkout/cart"
                >
                  <Badge
                    badgeContent={cartItemCount}
                    overlap="circular"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#00843D',
                        color: 'white',
                        fontSize: 10,
                        height: 20,
                        minWidth: 20,
                        padding: '0 4px',
                      }
                    }}
                  >
                    <ShoppingCartOutlinedIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Mobile header */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, backgroundColor: '#222', py: 1 }}>
        <Container maxWidth="lg" sx={{ px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                color="inherit" 
                edge="start" 
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon sx={{ color: 'white' }} />
              </IconButton>
              <Box sx={{ ml: 1, color: 'white', fontSize: 18, fontWeight: 700, height: 40, display: 'flex', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <Logo height={36} width="auto" />
                </Link>
              </Box>
            </Box>
            <Tooltip title={`${cartItemCount} item${cartItemCount !== 1 ? 's' : ''} in cart`}>
              <IconButton color="inherit" edge="end" component={Link} to="/checkout/cart">
                <Badge badgeContent={cartItemCount} color="primary">
                  <ShoppingCartOutlinedIcon sx={{ color: 'white' }} />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={{ mt: 1.5, mb: 1.5, position: 'relative' }}>
            {renderSearchInput('mobile', searchInputStyles.mobile.paper, { buttonColor: 'primary' })}
            {renderSearchSuggestions('mobile', { maxHeight: '60vh' })}
          </Box>
        </Container>
      </Box>
      
      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{ 
          sx: { 
            width: '80%', 
            maxWidth: 320,
            bgcolor: 'background.paper'
          } 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Menu</Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List>
          <ListItem sx={{ pb: 2 }}>
            <Box sx={{ width: '100%', position: 'relative' }}>
              {renderSearchInput('mobile-drawer', searchInputStyles.drawer.paper)}
              {renderSearchSuggestions('mobile-drawer', { 
                maxHeight: '40vh', 
                containerStyles: { width: '100%' },
                onItemClick: (item) => {
                  handleSuggestionSelect(item, 'mobile-drawer');
                  setMobileMenuOpen(false);
                }
              })}
            </Box>
          </ListItem>

          <ListItem 
            button 
            component={Link} 
            to={buildShopAllUrl()}
            onClick={() => setMobileMenuOpen(false)}
            sx={{ fontWeight: 700 }}
          >
            <ListItemText primary="Shop All Departments" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItem>
          
          {mainCategories.map((cat) => (
            <ListItem 
              button 
              key={cat.label} 
              component={Link} 
              to={buildCategoryUrl(cat.href)}
              onClick={() => setMobileMenuOpen(false)}
            >
              <ListItemText primary={cat.label} />
            </ListItem>
          ))}
          
          <Divider sx={{ my: 1 }} />
          
          <ListItem 
            button
            onClick={(e) => {
              e.preventDefault();
              toggleFaqVisibility();
              setMobileMenuOpen(false);
            }}
          >
            <ListItemIcon>
              <QuestionAnswerIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="FAQs" />
          </ListItem>
          
          <ListItem 
            button
            onClick={() => {
              setDebugDrawerOpen(true);
              setMobileMenuOpen(false);
            }}
          >
            <ListItemIcon>
              <HelpOutlineIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Help" />
          </ListItem>
          
          <Divider sx={{ my: 1 }} />
          
          <ListItem button component="a" href="tel:(800) 375-3403">
            <ListItemIcon>
              <CallIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="(800) 375-3403" />
          </ListItem>
          
          <ListItem button>
            <ListItemIcon>
              <ChatIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Chat With Us" />
          </ListItem>
          
          <Divider sx={{ my: 1 }} />
          
          <ListItem button component={Link} to="/proaccount">
            <ListItemText 
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ fontWeight: 700, mr: 0.5 }}>Are you a Pro?</Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ marginRight: 2 }}>Get</span>
                    <Box sx={{ color: theme.palette.primary.main, fontWeight: 700, mx: 0.5 }}>PRO</Box>
                    <span>Pricing</span>
                  </Box>
                </Box>
              } 
            />
          </ListItem>
        </List>
      </Drawer>

      {/* Desktop Category Navigation Bar */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: theme.palette.primary.main, 
          boxShadow: 'none', 
          borderBottom: `2px solid ${theme.palette.primary.main}`, 
          display: { xs: 'none', md: 'block' },
          position: 'relative'
        }}
      >
        <Container>
          <Toolbar disableGutters sx={{ minHeight: 48, px: 0, flexWrap: 'nowrap', overflowX: 'auto' }}>
            {(() => {
              const currentParams = new URLSearchParams(location.search);
              const hasQuery = currentParams.has('q');
              const isShopAllSelected = location.pathname === '/search' && !currentParams.has('category') && hasQuery;
              return (
                <Button
                  component={Link}
                  to={buildShopAllUrl()}
                  sx={{
                    backgroundColor: isShopAllSelected ? '#00843D' : 'transparent',
                    color: 'white',
                    height: '100%',
                    py: 1,
                    px: 2,
                    borderRadius: 0,
                    fontWeight: 500,
                    fontSize: 14,
                    mr: 1,
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: '#00843D' },
                  }}
                >
                  Categories
                </Button>
              );
            })()}
            {mainCategories.map((cat) => {
              let isSelected = false;
              if (location.pathname === '/search') {
                const params = new URLSearchParams(location.search);
                const categoryParam = params.get('category');
                isSelected = categoryParam === cat.label;
              }
              return (
                <Button
                  key={cat.label}
                  component={Link}
                  to={buildCategoryUrl(cat.href)}
                  sx={{
                    color: 'white',
                    backgroundColor: isSelected ? '#00843D' : 'transparent',
                    px: 2,
                    height: '100%',
                    borderRadius: 0,
                    textTransform: 'none',
                    fontSize: 14,
                    fontWeight: 400,
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  {cat.label}
                </Button>
              );
            })}
          </Toolbar>
        </Container>
        
        {loading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.primary.main
              }
            }} 
          />
        )}
      </AppBar>

      <DebugDrawer
        open={debugDrawerOpen}
        onClose={() => setDebugDrawerOpen(false)}
        lastApiCall={lastApiCall}
        logMessages={logMessages}
        consoleLogsEnabled={consoleLogsEnabled}
        onToggleConsoleLogs={(enabled) => {
          setConsoleLogsEnabled(enabled);
          toggleConsoleLogs(enabled);
        }}
        onClearLogs={() => {
          logRef.current = [];
          setLogMessages([]);
        }}
      />

      {/* Vehicle Selector Popover */}
      <Popover
        open={Boolean(vehicleSelectorAnchor)}
        anchorEl={vehicleSelectorAnchor}
        onClose={handleVehicleSelectorClose}
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
            mt: 1,
            p: 3,
            width: 500,
            maxWidth: '90vw',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1.25rem' }}>
          Shop by Vehicle
        </Typography>
        <VehicleSelectorEnhanced
          onVehicleSelected={handleVehicleSelected}
          onClear={handleClearVehicle}
          selectedVehicle={selectedVehicle}
        />
      </Popover>
    </Box>
  );
};

export default Header;
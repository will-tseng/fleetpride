/**
 * Centralized Style System
 * All reusable styles, colors, and patterns consolidated in one place
 */

// ============================================================================
// COLORS & THEME TOKENS - FleetPride Brand Colors
// ============================================================================
export const colors = {
  // Primary palette - FleetPride Navy Blue
  primary: '#003366',
  primaryDark: '#002244',
  primaryLight: '#004488',

  // Secondary - FleetPride Green (for CTAs, success states)
  secondary: '#00843D',
  secondaryDark: '#006B31',
  secondaryLight: '#00A94F',

  // Accent - FleetPride Red
  accent: '#CC0000',
  accentDark: '#990000',

  // Background colors
  backgroundLight: '#f5f5f5',
  backgroundDark: '#003366',
  cardBackground: '#ffffff',

  // Status colors
  success: '#00843D',
  warning: '#FFA41C',
  error: '#CC0000',
  priceColor: '#003366',

  // Border colors
  borderLight: '#e0e0e0',
  borderMedium: '#ddd',
  borderDark: '#ccc',
  cardBorder: '#e5e5e5',

  // Text colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  textOnDark: '#ffffff',

  // Link colors
  link: '#0066CC',
  linkHover: '#004499',

  // Special colors
  headerBackground: '#003366',
  navBackground: '#003366',
  footerBackground: '#003366',
};

// ============================================================================
// SPACING SYSTEM
// ============================================================================
export const spacing = {
  xs: 0.5,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
};

// ============================================================================
// LAYOUT PATTERNS
// ============================================================================
export const containers = {
  page: {
    py: { xs: 2, sm: 4 },
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
};

export const responsive = {
  mobileOnly: {
    display: { xs: 'block', md: 'none' },
  },
  desktopOnly: {
    display: { xs: 'none', md: 'block' },
  },
  hideOnMobile: {
    display: { xs: 'none', sm: 'flex' },
  },
  stackOnMobile: {
    flexDirection: { xs: 'column', md: 'row' },
  },
};

// ============================================================================
// TYPOGRAPHY PATTERNS
// ============================================================================
export const typography = {
  pageTitle: {
    fontWeight: 700,
    fontSize: { xs: '1.5rem', md: '1.75rem' },
    mb: 2,
  },
  sectionTitle: {
    fontWeight: 600,
    mb: 2,
  },
  price: {
    fontWeight: 700,
    color: colors.priceColor,
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
    '&:hover': {
      textDecoration: 'underline',
      color: colors.primary,
    },
  },
  truncated: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
};

// ============================================================================
// BUTTON PATTERNS
// ============================================================================
export const buttons = {
  primary: {
    backgroundColor: colors.primary,
    '&:hover': {
      backgroundColor: colors.primaryDark,
    },
    borderRadius: 1,
    textTransform: 'none',
    fontWeight: 600,
  },
  secondary: {
    borderColor: colors.borderMedium,
    '&:hover': {
      borderColor: colors.primary,
      backgroundColor: 'rgba(0, 164, 153, 0.04)',
    },
  },
  cartAdd: {
    backgroundColor: colors.primary,
    color: 'white',
    '&:hover': {
      backgroundColor: colors.primaryDark,
    },
    fontWeight: 500,
    textTransform: 'none',
  },
};

export const iconButtonStyles = {
  search: {
    p: '10px',
  },
  mobileSearch: {
    p: '8px',
  },
};

// ============================================================================
// CARD PATTERNS
// ============================================================================
export const cards = {
  base: {
    borderRadius: 2,
    boxShadow: '0 2px 8px 0 rgba(99,102,106,0.08)',
    transition: 'box-shadow 0.2s, transform 0.2s',
    '&:hover': {
      boxShadow: '0 4px 16px 0 rgba(99,102,106,0.16)',
      transform: 'translateY(-2px)',
    },
  },
  product: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: 2,
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
  },
  paper: {
    p: 3,
    border: `1px solid ${colors.borderMedium}`,
    borderRadius: 1,
    background: '#fff',
  },
  sidebar: {
    p: 3,
    borderRadius: 2,
    bgcolor: colors.cardBackground,
    border: `1px solid ${colors.cardBorder}`,
    position: 'sticky',
    top: 24,
  },
};

// ============================================================================
// FORM & INPUT PATTERNS
// ============================================================================
export const forms = {
  quantitySelect: {
    width: '70px',
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: colors.borderMedium },
      '&:hover fieldset': { borderColor: colors.priceColor },
    },
  },
};

export const searchInputStyles = {
  desktop: {
    paper: {
      p: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${colors.borderMedium}`,
      borderRadius: 2,
      boxShadow: 'none',
      width: '100%',
    },
    input: {
      ml: 1,
      flex: 1,
      fontSize: 16,
    },
  },
  mobile: {
    paper: {
      p: '2px 8px',
      display: 'flex',
      alignItems: 'center',
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
      position: 'relative',
    },
    input: {
      ml: 1,
      flex: 1,
      fontSize: '0.95rem',
      padding: '6px 0',
    },
  },
  drawer: {
    paper: {
      p: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      border: `1px solid ${colors.borderMedium}`,
      borderRadius: 2,
    },
    input: {
      ml: 1,
      flex: 1,
      fontSize: '0.9rem',
      padding: '6px 0',
    },
  },
};

// ============================================================================
// HEADER & NAVIGATION PATTERNS
// ============================================================================
export const headerStyles = {
  topBar: {
    backgroundColor: colors.backgroundLight,
    borderTop: `2px solid ${colors.primary}`,
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  mainBar: {
    backgroundColor: '#fff',
    boxShadow: 'none',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  mobileBar: {
    backgroundColor: '#222',
    py: 1,
  },
  menuBar: {
    backgroundColor: colors.textSecondary,
    boxShadow: 'none',
    borderBottom: `2px solid ${colors.primary}`,
  },
};

export const drawerStyles = {
  mobileSidebar: {
    width: '80%',
    maxWidth: 320,
    bgcolor: 'background.paper',
  },
  debugDrawer: {
    width: 600,
    p: 3,
  },
};

// ============================================================================
// COMPONENT-SPECIFIC PATTERNS
// ============================================================================
export const components = {
  rating: {
    color: colors.warning,
    fontSize: '0.8rem',
  },
  breadcrumb: {
    mb: 2,
    color: 'text.secondary',
    fontSize: '0.875rem',
    '& a': {
      '&:hover': {
        color: colors.primary,
      },
    },
  },
  divider: {
    my: 1,
    borderColor: colors.borderLight,
  },
  tabs: {
    borderBottom: `1px solid ${colors.borderMedium}`,
    bgcolor: '#f8f8f8',
    minHeight: 40,
    '& .MuiTabs-indicator': {
      backgroundColor: colors.primary,
      height: 3,
    },
    '& .MuiTab-root': {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: 14,
      color: 'text.secondary',
      minHeight: 40,
      '&.Mui-selected': {
        color: colors.primary,
        fontWeight: 600,
      },
    },
  },
  specification: {
    row: {
      display: 'flex',
      borderBottom: `1px solid ${colors.cardBorder}`,
      py: 1,
    },
    label: {
      fontWeight: 500,
      width: '40%',
    },
    value: {
      width: '60%',
    },
  },
};

// ============================================================================
// PAGE-SPECIFIC LAYOUTS
// ============================================================================
export const layouts = {
  productDetail: {
    breadcrumb: {
      mb: 2,
      color: 'text.secondary',
      fontSize: '0.875rem',
    },
    imageContainer: {
      width: { xs: '100%', md: '30%' },
      minWidth: { md: '250px' },
      mb: { xs: 3, md: 0 },
    },
    infoContainer: {
      width: { xs: '100%', md: '70%' },
    },
    tabsContainer: {
      border: `1px solid ${colors.borderMedium}`,
      borderRadius: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
  },
  grid: {
    spacing: { xs: 2, md: 3 },
    productCard: {
      xs: 6,
      sm: 4,
      md: 3,
    },
  },
};

// ============================================================================
// ANIMATION & TRANSITION PATTERNS
// ============================================================================
export const animations = {
  fadeIn: {
    transition: 'opacity 0.3s ease-in-out',
  },
  slideUp: {
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
  scaleOnHover: {
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
};

// ============================================================================
// STATE PATTERNS
// ============================================================================
export const states = {
  loading: {
    ...containers.centered,
    py: 6,
  },
  error: {
    color: 'error.main',
    textAlign: 'center',
    py: 4,
  },
  empty: {
    ...containers.centered,
    py: 8,
    color: 'text.secondary',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const createSpacingStyles = (direction, size) => ({
  [`${direction}`]: spacing[size] || size,
});

export const createFlexStyles = (direction = 'row', justify = 'flex-start', align = 'stretch') => ({
  display: 'flex',
  flexDirection: direction,
  justifyContent: justify,
  alignItems: align,
});

export const createGridStyles = (xs = 12, sm, md, lg) => ({
  xs,
  ...(sm && { sm }),
  ...(md && { md }),
  ...(lg && { lg }),
});

// ============================================================================
// DEFAULT EXPORT - COMPLETE STYLE SYSTEM
// ============================================================================
export default {
  colors,
  spacing,
  containers,
  responsive,
  typography,
  buttons,
  iconButtonStyles,
  cards,
  forms,
  searchInputStyles,
  headerStyles,
  drawerStyles,
  components,
  layouts,
  animations,
  states,
  // Utility functions
  createSpacingStyles,
  createFlexStyles,
  createGridStyles,
};

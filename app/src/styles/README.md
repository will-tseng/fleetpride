# Styles System

This directory contains the **consolidated style system** for the entire application.

## Usage

Import from `@styles` (webpack alias) or `./styles`:

```javascript
// Import specific exports
import { colors, buttons, cards, layouts } from '@styles';

// Import everything
import styles from '@styles';

// Use in components
<Box sx={cards.product}>
  <Typography sx={typography.price}>$99.99</Typography>
</Box>
```

## Organization

The style system is organized into logical sections:

### 1. **Colors & Theme Tokens**
- `colors` - All color values used across the app
- Primary, background, status, border, and text colors

### 2. **Spacing System**
- `spacing` - Standardized spacing values (xs, sm, md, lg, xl)

### 3. **Layout Patterns**
- `containers` - Flex containers (centered, spaceBetween, flexColumn)
- `responsive` - Responsive display utilities (mobileOnly, desktopOnly, etc.)

### 4. **Typography Patterns**
- `typography` - Text styles (pageTitle, sectionTitle, price, link, truncated)

### 5. **Button Patterns**
- `buttons` - Button styles (primary, secondary, cartAdd)
- `iconButtonStyles` - Icon button specific styles

### 6. **Card Patterns**
- `cards` - Card layouts (base, product, paper, sidebar)

### 7. **Form & Input Patterns**
- `forms` - Form controls (quantitySelect)
- `searchInputStyles` - Search input variations (desktop, mobile, drawer)

### 8. **Header & Navigation**
- `headerStyles` - Header bar styles (topBar, mainBar, mobileBar, menuBar)
- `drawerStyles` - Drawer layouts (mobileSidebar, debugDrawer)

### 9. **Component-Specific**
- `components` - Reusable component styles (rating, breadcrumb, divider, tabs, specification)

### 10. **Page Layouts**
- `layouts` - Page-specific layouts (productDetail, grid)

### 11. **Animations**
- `animations` - Transition effects (fadeIn, slideUp, scaleOnHover)

### 12. **State Patterns**
- `states` - Loading, error, and empty state styles

### 13. **Utility Functions**
- `createSpacingStyles()` - Generate spacing styles
- `createFlexStyles()` - Generate flex container styles
- `createGridStyles()` - Generate grid column styles

## Examples

### Using Colors
```javascript
import { colors } from '@styles';

<Box sx={{ backgroundColor: colors.primary, borderColor: colors.borderLight }}>
```

### Using Card Patterns
```javascript
import { cards } from '@styles';

<Card sx={cards.product}>
  <CardContent>...</CardContent>
</Card>
```

### Using Typography
```javascript
import { typography } from '@styles';

<Typography sx={typography.pageTitle}>Product Details</Typography>
<Typography sx={typography.price}>$99.99</Typography>
```

### Using Layouts
```javascript
import { layouts, responsive } from '@styles';

<Box sx={layouts.productDetail.imageContainer}>
  <img src="..." />
</Box>

<Box sx={responsive.hideOnMobile}>
  Desktop only content
</Box>
```

### Using Utility Functions
```javascript
import { createFlexStyles, createSpacingStyles } from '@styles';

<Box sx={{
  ...createFlexStyles('row', 'space-between', 'center'),
  ...createSpacingStyles('padding', 'md')
}}>
```

## Benefits

1. **Single Source of Truth** - All styles in one place
2. **Consistent Theming** - Colors and values reused across app
3. **Better Maintainability** - Update once, applies everywhere
4. **Smaller Bundle** - No duplicate styles
5. **Type-Safe** - Named exports prevent typos
6. **Developer Experience** - Autocomplete and IntelliSense support

## Migration Notes

Old imports have been updated:
- `@styles/themeStyles` → `@styles`
- `@styles/commonStyles` → `@styles`

The MUI theme (`src/theme.js`) now imports from `@styles` as well.

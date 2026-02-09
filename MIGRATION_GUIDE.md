# FleetPride Migration Guide

This project was copied from the B2B Home Goods demo and needs to be adapted for FleetPride (B2C Auto Parts).

## Project Overview

- **Source**: B2B Home Goods (LucidHome)
- **Target**: FleetPride B2C Auto Parts
- **Industry Change**: Home goods → Auto parts (brakes, wheel-end, etc.)
- **Model Change**: B2B (user-specific pricing) → B2C (standard retail pricing)

## Scraped Product Data

Product data has already been scraped and is available at:
- `C:\Users\wiets\Documents\Demos\fleetpride\fleetpride_products.json` (810 products)
- `C:\Users\wiets\Documents\Demos\fleetpride\fleetpride_products.csv`

### FleetPride Product Fields
```json
{
  "name": "HD Value 16.5\" x 7\" Outboard Mount Balanced Brake Drum",
  "part_number": "HDV1601B",
  "sku": "HDV1601B",
  "brand": "HDVALUE",
  "category": "brakes",
  "subcategory": null,
  "price": "$95.00",
  "description": "Part #: HDV1601B|Brand: HDVALUE|MPN #: HDV1601B",
  "features": ["Feature 1", "Feature 2", ...],
  "specifications": {
    "Brake Surface Diameter": "16.5 in",
    "Drum Weight": "101 lbs",
    ...
  },
  "url": "https://www.fleetpride.com/parts/...",
  "image_url": "https://www2.fleetpride.com/imagesns/PDPF/..."
}
```

---

## Files That Need Updates

### 1. **API Configuration** (CRITICAL - DO FIRST)
**File**: `src/api/search.js`

Update the API configuration for FleetPride's Fusion collection:
```javascript
const API_CONFIG = {
  baseURL: 'https://YOUR-FLEETPRIDE-FUSION-ENDPOINT',
  application: 'FleetPride_App',
  queryProfile: 'FleetPride_QueryProfile',
  apiKey: 'YOUR_API_KEY',
  timeout: 10000,
};
```

Also update `QUERY_PROFILES` and field mappings.

---

### 2. **Field Mappings** (CRITICAL)

The B2B Home Goods app uses different field names than FleetPride. Update these mappings:

| B2B Home Goods Field | FleetPride Field | Used In |
|---------------------|------------------|---------|
| `title` | `name` | ProductCard, ProductTableRow, ProductDetail |
| `manufacturer` | `brand` | ProductCard, ProductTableRow, Search facets |
| `sku_s` | `part_number` | ProductTableRow, ProductDetail |
| `description` | `description` (or parse from features) | ProductDetail |
| `image_url_s` / `image_url` | `image_url` | All product components |
| `price_f` / `price_d` | `price` (needs parsing - comes as "$95.00") | All pricing |
| N/A | `features` (array) | NEW - Add to ProductDetail |
| N/A | `specifications` (object) | NEW - Add to ProductDetail |

**Files to update:**
- `src/components/product/ProductCard.js`
- `src/components/product/ProductTableRow.js`
- `src/components/pages/ProductDetail.js`
- `src/components/search/SearchResults.js`
- `src/components/pages/FeaturedProducts.js`

---

### 3. **Branding Updates**

#### Logo
**File**: `src/components/common/Header.js`
- Replace LucidHome logo with FleetPride logo
- Update company name references

#### Colors
**Files**: Theme files, component styles
- Current primary color: `#537E87` (teal)
- FleetPride colors: Red `#CC0000` and Black (check their branding)

#### Text References
Search and replace these strings across the codebase:
- "LucidHome" → "FleetPride"
- "LucidHome Part #" → "FleetPride Part #" (in `ProductTableRow.js`)
- Any home goods references → auto parts references

---

### 4. **Remove B2B-Specific Features**

Since FleetPride is B2C, remove or simplify these B2B features:

#### User-Specific Pricing (REMOVE)
**Files**:
- `src/context/UserContext.js` - Simplify or remove user pricing fields
- `src/components/product/ProductTableRow.js` - Remove `ady_aprice_d`, `ady_acustomer_b` logic
- `src/components/search/SearchResults.js` - Remove `getUserAvailabilityFilter`, `showAllProducts`

#### Multi-Location Inventory (SIMPLIFY)
**Files**:
- `src/context/StoreContext.js` - Update store locations if needed for FleetPride
- Remove `chicago_inventory_i`, `sanfran_inventory_i`, `raleigh_inventory_i` references

#### User Login (OPTIONAL - KEEP OR SIMPLIFY)
If FleetPride doesn't need user login:
- `src/context/UserContext.js` - Remove or simplify
- `src/components/common/Header.js` - Remove login button
- Remove user-specific view defaults in SearchResults.js

---

### 5. **Add Auto Parts-Specific Features**

#### Product Specifications Display (NEW)
**File**: `src/components/pages/ProductDetail.js`

Add a specifications section:
```jsx
{product.specifications && Object.keys(product.specifications).length > 0 && (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
      Specifications
    </Typography>
    <Table>
      <TableBody>
        {Object.entries(product.specifications).map(([key, value]) => (
          <TableRow key={key}>
            <TableCell sx={{ fontWeight: 500 }}>{key}</TableCell>
            <TableCell>{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
)}
```

#### Product Features List (NEW)
**File**: `src/components/pages/ProductDetail.js`

Add a features section:
```jsx
{product.features && product.features.length > 0 && (
  <Box sx={{ mt: 3 }}>
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
      Features
    </Typography>
    <ul>
      {product.features.map((feature, idx) => (
        <li key={idx}>
          <Typography variant="body2">{feature}</Typography>
        </li>
      ))}
    </ul>
  </Box>
)}
```

---

### 6. **Deployment Configuration**

**Files**:
- `deploy_cloud_run.sh`
- `deploy_cloud_run.ps1`

Update these values:
```bash
PROJECT_ID="your-gcp-project"
REGION="us-central1"
SERVICE_NAME="fleetpride-demo"
IMAGE_NAME="fleetpride-demo"
```

---

### 7. **Package.json**

**File**: `package.json`

Update metadata:
```json
{
  "name": "fleetpride-demo",
  "description": "FleetPride Auto Parts Demo Application",
  "version": "0.1.0"
}
```

---

## Price Parsing Note

FleetPride prices come as strings like `"$95.00"`. You'll need to parse them:

```javascript
const parsePrice = (priceString) => {
  if (!priceString) return 0;
  // Remove $ and commas, convert to number
  return parseFloat(priceString.replace(/[$,]/g, '')) || 0;
};
```

Update the `formatPrice` utility or add parsing where prices are used.

---

## Recommended Migration Order

1. ✅ Copy codebase (DONE)
2. Set up Fusion collection with FleetPride data
3. Update `src/api/search.js` with new API config
4. Update field mappings in components
5. Update branding (logo, colors, text)
6. Remove B2B features (user pricing, multi-user login)
7. Add specifications/features display
8. Test locally with `npm install && npm start`
9. Update deployment config
10. Deploy to Cloud Run

---

## Quick Start

```bash
cd C:\Users\wiets\Documents\Demos\fleetpride\app
npm install
npm start
```

Note: The app will have errors until the API configuration is updated to point to a valid FleetPride Fusion endpoint.

---

## Questions to Answer

1. **Fusion Setup**: Is there already a Fusion collection for FleetPride data, or does one need to be created?
2. **Branding**: Do you have FleetPride logo files and brand color codes?
3. **User Login**: Should the app have user login functionality, or is it purely B2C without accounts?
4. **Store Locations**: Does FleetPride have physical store locations to show inventory, or is it online-only?

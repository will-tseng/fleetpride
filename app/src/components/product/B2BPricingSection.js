import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  TextField,
  Button
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import BlockIcon from '@mui/icons-material/Block';
import { formatPrice } from '@utils/formatter';
import { useUser } from '@context/UserContext';

// Bulk pricing tiers with quantity and discount percentage
const BULK_TIERS = [
  { qty: 1, discount: 0 },      // 100% of base price
  { qty: 4, discount: 0.02 },   // 98% of base price
  { qty: 12, discount: 0.05 },  // 95% of base price
  { qty: 52, discount: 0.10 },  // 90% of base price
  { qty: 100, discount: 0.20 }, // 80% of base price
];

// Map user IDs to their availability and pricing field names
const USER_FIELD_MAP = {
  'user1': { available: 'ady_acustomer_b', price: 'ady_aprice_d' },
  'user2': { available: 'ady_customerb_b', price: 'ady_bprice_d' },
  'user3': { available: 'ady_customerc_b', price: 'ady_cprice_d' },
  'user4': { available: 'ady_customerd_b', price: 'ady_dprice_d' },
};

const B2BPricingSection = ({
  product,
  selectedVariant,
  onQuantitySelect,
  quantity,
  onQuantityChange,
  onAddToCart,
  isInStock = true
}) => {
  const { currentUser } = useUser();

  // Get user-specific pricing and availability
  const userPricing = useMemo(() => {
    if (!currentUser) return null;

    const userFields = USER_FIELD_MAP[currentUser.id];
    if (!userFields) return null;

    const source = selectedVariant || product;
    if (!source) return null;

    const isAvailableForUser = source[userFields.available];
    const userPrice = source[userFields.price];

    return {
      isAvailable: isAvailableForUser === true,
      hasAvailabilityData: isAvailableForUser !== undefined,
      userPrice: typeof userPrice === 'number' ? userPrice : null,
    };
  }, [currentUser, selectedVariant, product]);

  // Get the default (list) price from product or variant
  const defaultPrice = useMemo(() => {
    const source = selectedVariant || product;
    return source?.price || source?.price_d || source?.price_f || 0;
  }, [product, selectedVariant]);

  // Get the base price for calculations - use user-specific price if available
  const basePrice = useMemo(() => {
    // If user has a specific price assigned, use that for calculations
    if (userPricing?.userPrice) {
      return userPricing.userPrice;
    }
    return defaultPrice;
  }, [defaultPrice, userPricing]);

  // Check if user has a custom price different from default
  const hasCustomPrice = userPricing?.userPrice && userPricing.userPrice !== defaultPrice;

  // Calculate total available stock across all warehouses
  const stockInfo = useMemo(() => {
    const source = selectedVariant || product;
    if (!source) return { total: 0, canShipImmediately: 0 };

    const chicago = typeof source.chicago_inventory_i === 'number' ? source.chicago_inventory_i : 0;
    const sanfran = typeof source.sanfran_inventory_i === 'number' ? source.sanfran_inventory_i : 0;
    const raleigh = typeof source.raleigh_inventory_i === 'number' ? source.raleigh_inventory_i : 0;

    const total = chicago + sanfran + raleigh;
    return {
      total,
      canShipImmediately: total,
    };
  }, [product, selectedVariant]);

  // Generate bulk pricing table data
  const pricingTiers = useMemo(() => {
    return BULK_TIERS.map(tier => {
      const unitPrice = basePrice * (1 - tier.discount);
      const extPrice = unitPrice * tier.qty;
      return {
        qty: tier.qty,
        unitPrice,
        extPrice,
        discount: tier.discount,
      };
    });
  }, [basePrice]);

  // Calculate dynamic pricing based on current quantity
  const dynamicPricing = useMemo(() => {
    if (!quantity || quantity < 1) return null;

    let applicableTier = BULK_TIERS[0];
    for (const tier of BULK_TIERS) {
      if (quantity >= tier.qty) {
        applicableTier = tier;
      }
    }

    // Calculate default (list) price with tier discount
    const defaultUnitPrice = defaultPrice * (1 - applicableTier.discount);

    // Calculate user's price with tier discount
    const userUnitPrice = basePrice * (1 - applicableTier.discount);
    const extPrice = userUnitPrice * quantity;

    return {
      defaultUnitPrice,
      userUnitPrice,
      extPrice,
      discount: applicableTier.discount,
      tierQty: applicableTier.qty,
    };
  }, [quantity, basePrice, defaultPrice]);

  // Check if user has access to this variant
  const isVariantAvailable = userPricing?.hasAvailabilityData ? userPricing.isAvailable : true;

  // If user doesn't have access to this variant, show unavailable message
  if (userPricing?.hasAvailabilityData && !userPricing.isAvailable) {
    return (
      <Box sx={{ mb: 3 }}>
        {/* Unavailable Section */}
        <Box
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            mb: 2,
            bgcolor: 'grey.100',
            textAlign: 'center'
          }}
        >
          <BlockIcon sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
            This product is not available for your account
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Contact your local representative for pricing information
          </Typography>
        </Box>

        {/* Greyed out Purchase Section */}
        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            mb: 2,
            bgcolor: 'grey.100',
            opacity: 0.6
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 70, color: 'grey.500' }}>
              Quantity:
            </Typography>
            <TextField
              type="number"
              value={quantity}
              size="small"
              disabled
              inputProps={{ min: 1 }}
              sx={{ width: 100 }}
            />
            <Button
              variant="contained"
              disabled
              sx={{
                flex: 1,
                bgcolor: 'grey.300',
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                color: 'grey.600'
              }}
            >
              Not Available
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!basePrice) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Stock Availability Section */}
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 1,
          mb: 2,
          bgcolor: 'grey.50'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <InventoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            In Stock: {stockInfo.total}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShippingIcon sx={{ color: stockInfo.canShipImmediately > 0 ? 'success.main' : 'grey.400', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <strong>{stockInfo.canShipImmediately}</strong> Can Ship Immediately
          </Typography>
        </Box>
      </Box>

      {/* Purchase Section */}
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 1,
          mb: 2,
          bgcolor: 'white'
        }}
      >
        {/* Quantity Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 70 }}>
            Quantity:
          </Typography>
          <TextField
            type="number"
            value={quantity}
            onChange={onQuantityChange}
            size="small"
            inputProps={{ min: 1 }}
            sx={{ width: 100 }}
          />
          <Button
            variant="contained"
            onClick={onAddToCart}
            disabled={!isInStock || !quantity || quantity < 1 || !isVariantAvailable}
            sx={{
              flex: 1,
              bgcolor: '#546B2F',
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#455A25' },
              '&:disabled': {
                bgcolor: 'grey.300',
                color: 'grey.600'
              }
            }}
          >
            {!isVariantAvailable ? 'Not Available' : (isInStock ? 'Buy' : 'Out of Stock')}
          </Button>
        </Box>

        {/* Dynamic Pricing Display */}
        {dynamicPricing && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Unit Price:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: hasCustomPrice ? 'text.secondary' : 'primary.main',
                  textDecoration: hasCustomPrice ? 'line-through' : 'none'
                }}
              >
                {formatPrice(dynamicPricing.defaultUnitPrice)}
              </Typography>
            </Box>
            {hasCustomPrice && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                  Your Price:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                  {formatPrice(dynamicPricing.userUnitPrice)}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Ext. Price:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {formatPrice(dynamicPricing.extPrice)}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Bulk Pricing Table */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'grey.300' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Pricing (USD)
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: 'text.secondary', py: 1.5 }}
                >
                  Qty.
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 600, color: 'text.secondary', py: 1.5 }}
                >
                  Unit Price
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: 'text.secondary', py: 1.5 }}
                >
                  Ext. Price
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricingTiers.map((tier) => (
                <TableRow
                  key={tier.qty}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: 'white' },
                    '&:nth-of-type(even)': { bgcolor: 'grey.50' },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell
                    align="right"
                    sx={{
                      py: 1.5,
                      borderBottom: '1px dotted',
                      borderColor: 'grey.300'
                    }}
                  >
                    <Box
                      component="span"
                      onClick={() => onQuantitySelect?.(tier.qty)}
                      sx={{
                        color: 'primary.main',
                        fontWeight: 500,
                        cursor: onQuantitySelect ? 'pointer' : 'default',
                        textDecoration: onQuantitySelect ? 'underline' : 'none',
                        textDecorationStyle: 'dotted',
                        '&:hover': onQuantitySelect ? {
                          color: 'primary.dark',
                        } : {}
                      }}
                    >
                      {tier.qty}
                    </Box>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      py: 1.5,
                      fontWeight: 500
                    }}
                  >
                    {formatPrice(tier.unitPrice)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      py: 1.5,
                      fontWeight: 500
                    }}
                  >
                    {formatPrice(tier.extPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default B2BPricingSection;

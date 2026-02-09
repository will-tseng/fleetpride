import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DescriptionIcon from '@mui/icons-material/Description';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ProductSpecifications from './ProductSpecifications';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ProductDetailTabs({ product }) {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Extract key features from description or attributes
  const extractKeyFeatures = () => {
    const features = [];

    // Check for common attribute fields
    if (product.material) features.push(`Material: ${product.material}`);
    if (product.color) features.push(`Color: ${product.color}`);
    if (product.dimensions) features.push(`Dimensions: ${product.dimensions}`);
    if (product.weight) features.push(`Weight: ${product.weight} lbs`);
    if (product.finish) features.push(`Finish: ${product.finish}`);

    // Add any custom attributes (attribute_* fields)
    Object.keys(product).forEach(key => {
      if (key.startsWith('attribute_') && product[key]) {
        const label = key.replace('attribute_', '').replace(/_/g, ' ');
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        features.push(`${formattedLabel}: ${product[key]}`);
      }
    });

    return features;
  };

  const keyFeatures = extractKeyFeatures();

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2 }}>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        aria-label="Product information tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            minHeight: 56
          }
        }}
      >
        <Tab
          icon={<DescriptionIcon />}
          iconPosition="start"
          label="Description"
          id="product-tab-0"
          aria-controls="product-tabpanel-0"
        />
        <Tab
          icon={<ListAltIcon />}
          iconPosition="start"
          label="Specifications"
          id="product-tab-1"
          aria-controls="product-tabpanel-1"
        />
        <Tab
          icon={<LocalShippingIcon />}
          iconPosition="start"
          label="Shipping & Returns"
          id="product-tab-2"
          aria-controls="product-tabpanel-2"
        />
      </Tabs>

      {/* Description Tab */}
      <TabPanel value={currentTab} index={0}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Product Description
        </Typography>
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.7,
            color: 'text.secondary',
            mb: 3
          }}
        >
          {product.description || 'No detailed description available for this product.'}
        </Typography>

        {keyFeatures.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Key Features
            </Typography>
            <List dense sx={{ pl: 0 }}>
              {keyFeatures.map((feature, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    py: 0.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <ListItemText
                    primary={`• ${feature}`}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: {
                        color: 'text.secondary',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {(product.care_instructions || product.warranty) && (
          <>
            <Divider sx={{ my: 3 }} />
            {product.care_instructions && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Care Instructions
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {product.care_instructions}
                </Typography>
              </Box>
            )}
            {product.warranty && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Warranty Information
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {product.warranty}
                </Typography>
              </Box>
            )}
          </>
        )}
      </TabPanel>

      {/* Specifications Tab */}
      <TabPanel value={currentTab} index={1}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Product Specifications
        </Typography>
        <ProductSpecifications product={product} />

        {(product.upc || product.model_number) && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {product.model_number && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Model Number:</strong> {product.model_number}
              </Typography>
            )}
            {product.upc && (
              <Typography variant="body2">
                <strong>UPC:</strong> {product.upc}
              </Typography>
            )}
          </Box>
        )}
      </TabPanel>

      {/* Shipping & Returns Tab */}
      <TabPanel value={currentTab} index={2}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Shipping Information
        </Typography>
        <List sx={{ mb: 3 }}>
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="✓ Free Standard Shipping"
              secondary="Delivery within 5-7 business days"
              primaryTypographyProps={{ fontWeight: 600, color: 'success.main' }}
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="Express Shipping Available"
              secondary="Get it in 2-3 business days for an additional fee"
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="Order Tracking"
              secondary="Track your order every step of the way"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Returns & Exchanges
        </Typography>
        <List>
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="30-Day Return Policy"
              secondary="Return items within 30 days of delivery for a full refund"
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="Free Returns"
              secondary="No restocking fees or return shipping charges"
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemText
              primary="Easy Exchange Process"
              secondary="Contact customer service to initiate a return or exchange"
            />
          </ListItem>
        </List>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600, mb: 1 }}>
            Need Help?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Contact our customer service team at support@example.com or call 1-800-EXAMPLE for assistance with shipping or returns.
          </Typography>
        </Box>
      </TabPanel>
    </Box>
  );
}

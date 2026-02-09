import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';

/**
 * ProductTabs - Reusable tabs component with consistent styling
 * 
 * @param {Object} props
 * @param {Array} props.tabs - Array of tab objects with label and content
 * @param {number} props.defaultTab - Default active tab index (default: 0)
 * @param {Object} props.sx - Additional styling for the container
 * @param {boolean} props.fullHeight - Whether tabs should take full height
 */
export default function ProductTabs({ 
  tabs = [], 
  defaultTab = 0, 
  sx = {}, 
  fullHeight = true 
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid #ddd',
        borderRadius: 1,
        height: fullHeight ? '100%' : 'auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          borderBottom: '1px solid #ddd',
          bgcolor: '#f8f8f8',
          minHeight: 40,
          '& .MuiTabs-indicator': {
            backgroundColor: 'primary.main',
            height: 3
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: 14,
            color: 'text.secondary',
            minHeight: 40,
            '&.Mui-selected': {
              color: 'primary.main',
              fontWeight: 600,
            },
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab.label} disableRipple />
        ))}
      </Tabs>
      
      <Box sx={{ p: 3, overflowY: 'auto', flex: '1 1 auto' }}>
        {tabs.map((tab, index) => (
          <Box 
            key={index}
            hidden={activeTab !== index} 
            sx={{ display: activeTab === index ? 'block' : 'none' }}
          >
            {tab.content}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

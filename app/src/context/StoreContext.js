import React, { createContext, useContext, useState, useCallback } from 'react';

// Store options with their corresponding filter field
const STORE_OPTIONS = [
  { id: 'online', label: 'Online', filterField: 'online_shipping_b', inventoryField: null },
  { id: 'chicago', label: 'Chicago', filterField: 'chicago_store_b', inventoryField: 'chicago_inventory_i' },
  { id: 'sanfran', label: 'San Francisco', filterField: 'sanfran_store_b', inventoryField: 'sanfran_inventory_i' },
  { id: 'raleigh', label: 'Raleigh', filterField: 'raleigh_store_b', inventoryField: 'raleigh_inventory_i' },
];

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [selectedStore, setSelectedStore] = useState(STORE_OPTIONS[2]); // Default to San Francisco
  const [inStockOnly, setInStockOnly] = useState(false); // Filter for in-stock items only

  const selectStore = useCallback((storeId) => {
    const store = STORE_OPTIONS.find(s => s.id === storeId);
    if (store) {
      setSelectedStore(store);
    }
  }, []);

  const toggleInStockOnly = useCallback(() => {
    setInStockOnly(prev => !prev);
  }, []);

  // Generate filter query for the selected store
  // Only apply store filter when "In Stock at Store Today" is enabled
  const getStoreFilterQuery = useCallback(() => {
    if (!inStockOnly || !selectedStore || !selectedStore.filterField) {
      return null;
    }
    return `${selectedStore.filterField}:true`;
  }, [selectedStore, inStockOnly]);

  // Generate inventory filter query (only items with stock > 0)
  const getInventoryFilterQuery = useCallback(() => {
    if (!inStockOnly || !selectedStore || !selectedStore.inventoryField) {
      return null;
    }
    // Filter for inventory greater than 0
    return `${selectedStore.inventoryField}:[1 TO *]`;
  }, [inStockOnly, selectedStore]);

  const value = {
    selectedStore,
    selectStore,
    storeOptions: STORE_OPTIONS,
    getStoreFilterQuery,
    inStockOnly,
    toggleInStockOnly,
    getInventoryFilterQuery,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export default StoreContext;

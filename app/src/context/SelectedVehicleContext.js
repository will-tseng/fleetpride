import React, { createContext, useContext, useState, useCallback } from 'react';

const SelectedVehicleContext = createContext(null);

export const SelectedVehicleProvider = ({ children }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const selectVehicle = useCallback((vehicle) => {
    if (vehicle) {
      // Vehicle object should have: id, label, filterQuery
      setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
    }
  }, []);

  const clearVehicle = useCallback(() => {
    setSelectedVehicle(null);
  }, []);

  const value = {
    selectedVehicle,
    selectVehicle,
    clearVehicle,
  };

  return (
    <SelectedVehicleContext.Provider value={value}>
      {children}
    </SelectedVehicleContext.Provider>
  );
};

export const useSelectedVehicle = () => {
  const context = useContext(SelectedVehicleContext);
  if (!context) {
    // Return a default object if context is not available (allows for optional usage)
    return { selectedVehicle: null, selectVehicle: () => {}, clearVehicle: () => {} };
  }
  return context;
};

export default SelectedVehicleContext;

import React, { createContext, useState, useContext, useEffect } from 'react';

const SelectedVehicleContext = createContext();

export function SelectedVehicleProvider({ children }) {
  const [selectedVehicle, setSelectedVehicle] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('fleetpride_selected_vehicle');
    return saved ? JSON.parse(saved) : null;
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (selectedVehicle) {
      localStorage.setItem('fleetpride_selected_vehicle', JSON.stringify(selectedVehicle));
    } else {
      localStorage.removeItem('fleetpride_selected_vehicle');
    }
  }, [selectedVehicle]);

  const clearVehicle = () => {
    setSelectedVehicle(null);
  };

  return (
    <SelectedVehicleContext.Provider value={{ selectedVehicle, setSelectedVehicle, clearVehicle }}>
      {children}
    </SelectedVehicleContext.Provider>
  );
}

export function useSelectedVehicle() {
  const context = useContext(SelectedVehicleContext);
  if (context === undefined) {
    throw new Error('useSelectedVehicle must be used within a SelectedVehicleProvider');
  }
  return context;
}

export default SelectedVehicleContext;

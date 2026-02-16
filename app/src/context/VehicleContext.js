import React, { createContext, useState, useEffect, useContext } from 'react';

const VehicleContext = createContext();

export function VehicleProvider({ children }) {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check localStorage cache first
    const cachedData = localStorage.getItem('fleetpride_vehicle_data');
    const cachedTime = localStorage.getItem('fleetpride_vehicle_data_time');

    // Cache for 24 hours
    const CACHE_DURATION = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (cachedData && cachedTime && (now - parseInt(cachedTime, 10) < CACHE_DURATION)) {
      try {
        setVehicleData(JSON.parse(cachedData));
        setLoading(false);
        console.log('✅ Loaded vehicle data from cache');
        return;
      } catch (err) {
        console.warn('Failed to parse cached vehicle data:', err);
        localStorage.removeItem('fleetpride_vehicle_data');
        localStorage.removeItem('fleetpride_vehicle_data_time');
      }
    }

    // Fetch fresh data
    fetch('/data/vehicles_reference_complete.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load vehicle data: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setVehicleData(data.vehicles);
        setLoading(false);

        // Cache the data
        try {
          localStorage.setItem('fleetpride_vehicle_data', JSON.stringify(data.vehicles));
          localStorage.setItem('fleetpride_vehicle_data_time', now.toString());
          console.log('✅ Loaded and cached vehicle data');
        } catch (err) {
          console.warn('Failed to cache vehicle data:', err);
        }
      })
      .catch(err => {
        console.error('Error loading vehicle data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <VehicleContext.Provider value={{ vehicleData, loading, error }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicleData() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicleData must be used within a VehicleProvider');
  }
  return context;
}

export default VehicleContext;

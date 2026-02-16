import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ClearIcon from '@mui/icons-material/Clear';
import { useVehicleData } from '@context/VehicleContext';
import { useSelectedVehicle } from '@context/SelectedVehicleContext';

export default function VehicleSelector({ onVehicleSelected, onClear }) {
  const { vehicleData, loading, error } = useVehicleData();
  const { selectedVehicle, setSelectedVehicle, clearVehicle } = useSelectedVehicle();

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={24} sx={{ mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading vehicles...
        </Typography>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load vehicle data: {error}
        </Alert>
      </Paper>
    );
  }

  // No data
  if (!vehicleData) {
    return null;
  }

  // Get available years (sorted newest first)
  const years = Object.keys(vehicleData).sort((a, b) => b - a);

  // Get available makes for selected year
  const makes = selectedYear ? Object.keys(vehicleData[selectedYear]).sort() : [];

  // Get available models for selected year + make
  const models = selectedYear && selectedMake
    ? Object.keys(vehicleData[selectedYear][selectedMake]).sort()
    : [];

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    setSelectedMake('');
    setSelectedModel('');
  };

  const handleMakeChange = (e) => {
    const make = e.target.value;
    setSelectedMake(make);
    setSelectedModel('');
  };

  const handleModelChange = (e) => {
    const model = e.target.value;
    setSelectedModel(model);

    // Get the vehicle info
    const vehicleInfo = vehicleData[selectedYear][selectedMake][model];

    const vehicle = {
      year: selectedYear,
      make: selectedMake,
      model: model,
      key: vehicleInfo.key,
      display: vehicleInfo.display,
      filterQuery: `aces_vehicle_keys_ss:"${vehicleInfo.key}"`
    };

    // Update context
    setSelectedVehicle(vehicle);

    // Also notify parent if provided
    onVehicleSelected?.(vehicle);
  };

  const handleClear = () => {
    setSelectedYear('');
    setSelectedMake('');
    setSelectedModel('');
    clearVehicle();
    onClear?.();
  };

  const isVehicleSelected = selectedVehicle !== null;

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DirectionsCarIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Select Your Vehicle
        </Typography>
      </Box>

      {/* Vehicle Selector Dropdowns */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Year Selector */}
        <FormControl fullWidth size="small">
          <InputLabel id="vehicle-year-label">Year</InputLabel>
          <Select
            labelId="vehicle-year-label"
            id="vehicle-year-select"
            value={selectedYear}
            label="Year"
            onChange={handleYearChange}
          >
            {years.map(year => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Make Selector - Only show if year is selected */}
        {selectedYear && (
          <FormControl fullWidth size="small">
            <InputLabel id="vehicle-make-label">Make</InputLabel>
            <Select
              labelId="vehicle-make-label"
              id="vehicle-make-select"
              value={selectedMake}
              label="Make"
              onChange={handleMakeChange}
            >
              {makes.map(make => (
                <MenuItem key={make} value={make}>
                  {make}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Model Selector - Only show if year and make are selected */}
        {selectedYear && selectedMake && (
          <FormControl fullWidth size="small">
            <InputLabel id="vehicle-model-label">Model</InputLabel>
            <Select
              labelId="vehicle-model-label"
              id="vehicle-model-select"
              value={selectedModel}
              label="Model"
              onChange={handleModelChange}
            >
              {models.map(model => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Selected Vehicle Display & Clear Button */}
        {isVehicleSelected && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`${selectedYear} ${selectedMake} ${selectedModel}`}
              onDelete={handleClear}
              deleteIcon={<ClearIcon />}
              color="primary"
              sx={{ width: '100%', justifyContent: 'space-between', fontSize: '0.875rem' }}
            />
          </Box>
        )}

        {/* Clear All Button - Only show if any selection is made */}
        {(selectedYear || selectedMake || selectedModel) && !isVehicleSelected && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleClear}
            startIcon={<ClearIcon />}
            sx={{ mt: 1 }}
          >
            Clear Selection
          </Button>
        )}
      </Box>

      {/* Helper text */}
      {!isVehicleSelected && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, textAlign: 'center' }}
        >
          Select year, make, and model to filter parts
        </Typography>
      )}
    </Paper>
  );
}

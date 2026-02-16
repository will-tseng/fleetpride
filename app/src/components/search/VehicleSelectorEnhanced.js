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
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Link as MuiLink
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useVehicleData } from '@context/VehicleContext';

export default function VehicleSelectorEnhanced({ onVehicleSelected, onClear, selectedVehicle }) {
  const { vehicleData, loading, error } = useVehicleData();

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('');

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading vehicles...
        </Typography>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 4 }}>
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

  // Get available engines for selected year + make + model
  const engines = selectedYear && selectedMake && selectedModel
    ? Object.keys(vehicleData[selectedYear][selectedMake][selectedModel].engines || {}).sort()
    : [];

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    setSelectedMake('');
    setSelectedModel('');
    setSelectedEngine('');
  };

  const handleMakeChange = (e) => {
    const make = e.target.value;
    setSelectedMake(make);
    setSelectedModel('');
    setSelectedEngine('');
  };

  const handleModelChange = (e) => {
    const model = e.target.value;
    setSelectedModel(model);
    setSelectedEngine('');
  };

  const handleEngineChange = (e) => {
    const engine = e.target.value;
    setSelectedEngine(engine);
  };

  const handleAddVehicle = () => {
    if (!selectedYear || !selectedMake || !selectedModel || !selectedEngine) {
      return;
    }

    // Get the vehicle info with engine
    const vehicleInfo = vehicleData[selectedYear][selectedMake][selectedModel].engines[selectedEngine];

    // Notify parent component
    onVehicleSelected({
      year: selectedYear,
      make: selectedMake,
      model: selectedModel,
      engine: selectedEngine,
      key: vehicleInfo.key,
      display: vehicleInfo.display,
      filterQuery: `aces_vehicle_keys_ss:"${vehicleInfo.key}"`
    });
  };

  const handleClear = () => {
    setSelectedYear('');
    setSelectedMake('');
    setSelectedModel('');
    setSelectedEngine('');
    onClear?.();
  };

  const canAddVehicle = selectedYear && selectedMake && selectedModel && selectedEngine;

  return (
    <Box>
      {/* Vehicle Selector Dropdowns */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Year Selector */}
        <Grid item xs={6} sm={6}>
          <FormControl fullWidth size="medium">
            <InputLabel id="vehicle-year-label">Year</InputLabel>
            <Select
              labelId="vehicle-year-label"
              id="vehicle-year-select"
              value={selectedYear}
              label="Year"
              onChange={handleYearChange}
              sx={{
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d0d0d0',
                },
              }}
            >
              {years.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Make Selector */}
        <Grid item xs={6} sm={6}>
          <FormControl fullWidth size="medium" disabled={!selectedYear}>
            <InputLabel id="vehicle-make-label">Make</InputLabel>
            <Select
              labelId="vehicle-make-label"
              id="vehicle-make-select"
              value={selectedMake}
              label="Make"
              onChange={handleMakeChange}
              sx={{
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d0d0d0',
                },
              }}
            >
              {makes.map(make => (
                <MenuItem key={make} value={make}>
                  {make}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Model Selector */}
        <Grid item xs={6} sm={6}>
          <FormControl fullWidth size="medium" disabled={!selectedMake}>
            <InputLabel id="vehicle-model-label">Model</InputLabel>
            <Select
              labelId="vehicle-model-label"
              id="vehicle-model-select"
              value={selectedModel}
              label="Model"
              onChange={handleModelChange}
              sx={{
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d0d0d0',
                },
              }}
            >
              {models.map(model => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Engine Selector */}
        <Grid item xs={6} sm={6}>
          <FormControl fullWidth size="medium" disabled={!selectedModel}>
            <InputLabel id="vehicle-engine-label">Engine</InputLabel>
            <Select
              labelId="vehicle-engine-label"
              id="vehicle-engine-select"
              value={selectedEngine}
              label="Engine"
              onChange={handleEngineChange}
              sx={{
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d0d0d0',
                },
              }}
            >
              {engines.map(engine => (
                <MenuItem key={engine} value={engine}>
                  {engine}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Add Vehicle Button */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleAddVehicle}
        disabled={!canAddVehicle}
        sx={{
          bgcolor: canAddVehicle ? '#003366' : '#d0d0d0',
          color: 'white',
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          py: 1.5,
          mb: 2,
          '&:hover': {
            bgcolor: canAddVehicle ? '#002244' : '#d0d0d0',
          },
          '&:disabled': {
            bgcolor: '#d0d0d0',
            color: '#999',
          }
        }}
      >
        Add Vehicle
      </Button>

      {/* Selected Vehicle Display */}
      {selectedVehicle && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '1.25rem' }}>
            Select Recent Vehicle
          </Typography>

          <Card
            sx={{
              border: '2px solid #003366',
              borderRadius: 1,
              position: 'relative',
              mb: 2,
              bgcolor: '#f0f7ff'
            }}
          >
            {/* Checkmark corner */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: '0 60px 60px 0',
                borderColor: 'transparent #003366 transparent transparent',
              }}
            />
            <CheckCircleIcon
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'white',
                fontSize: 28,
                zIndex: 1
              }}
            />

            <CardContent sx={{ pb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
                {selectedVehicle.year} {selectedVehicle.make} | {selectedVehicle.model}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedVehicle.engine || 'Heavy Duty Commercial Truck'}
              </Typography>
            </CardContent>
          </Card>

          {/* Clear Vehicle */}
          <MuiLink
            component="button"
            variant="body2"
            onClick={handleClear}
            sx={{
              color: '#003366',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              }
            }}
          >
            Clear Selected Vehicle
          </MuiLink>
        </>
      )}
    </Box>
  );
}

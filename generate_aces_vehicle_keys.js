#!/usr/bin/env node

/**
 * Generate ACES Vehicle Keys for FleetPride Products
 *
 * This script:
 * 1. Reads fleetpride_products_transformed_flat.json
 * 2. Generates realistic vehicle fitment based on brake drum specs
 * 3. Outputs two files:
 *    - product_vehicle_keys.json (for atomic updates)
 *    - vehicles_reference_complete.json (for UI)
 */

const fs = require('fs');

// Heavy-duty truck makes and models
const TRUCK_DATA = {
  'Freightliner': {
    'Cascadia': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4', '6x2'],
      popularEngines: ['DD13', 'DD15', 'DD16']
    },
    'M2 106': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      driveTypes: ['4x2', '6x4'],
      popularEngines: ['Cummins B6.7', 'DD8']
    },
    'Coronado': {
      years: [2015, 2016, 2017, 2018, 2019, 2020],
      driveTypes: ['6x4'],
      popularEngines: ['DD13', 'DD15']
    },
    'Columbia': {
      years: [2015, 2016, 2017],
      driveTypes: ['6x4'],
      popularEngines: ['DD13', 'MBE 4000']
    }
  },
  'Kenworth': {
    'T680': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4', '6x2'],
      popularEngines: ['PACCAR MX-13', 'PACCAR MX-11', 'Cummins X15']
    },
    'T880': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      driveTypes: ['6x4', '8x4'],
      popularEngines: ['PACCAR MX-13', 'Cummins X15']
    },
    'W900': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4'],
      popularEngines: ['PACCAR MX-13', 'Cummins X15']
    },
    'T270': {
      years: [2015, 2016, 2017, 2018, 2019, 2020],
      driveTypes: ['4x2'],
      popularEngines: ['PACCAR PX-7']
    }
  },
  'Peterbilt': {
    '579': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4', '6x2'],
      popularEngines: ['PACCAR MX-13', 'PACCAR MX-11', 'Cummins X15']
    },
    '389': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      driveTypes: ['6x4'],
      popularEngines: ['PACCAR MX-13', 'Cummins X15']
    },
    '567': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      driveTypes: ['6x4', '6x2'],
      popularEngines: ['PACCAR MX-13', 'Cummins X15']
    },
    '220': {
      years: [2015, 2016, 2017, 2018, 2019, 2020],
      driveTypes: ['4x2'],
      popularEngines: ['PACCAR PX-7']
    }
  },
  'Volvo': {
    'VNL 760': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4'],
      popularEngines: ['Volvo D13', 'Volvo D11']
    },
    'VNL 860': {
      years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4'],
      popularEngines: ['Volvo D13']
    },
    'VHD': {
      years: [2015, 2016, 2017, 2018, 2019, 2020],
      driveTypes: ['6x4', '8x4'],
      popularEngines: ['Volvo D11', 'Volvo D13']
    }
  },
  'International': {
    'LT': {
      years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4', '6x2'],
      popularEngines: ['Cummins X15', 'N13']
    },
    'ProStar': {
      years: [2015, 2016, 2017, 2018],
      driveTypes: ['6x4'],
      popularEngines: ['Cummins ISX15', 'MaxxForce 13']
    },
    'LoneStar': {
      years: [2015, 2016, 2017],
      driveTypes: ['6x4'],
      popularEngines: ['Cummins ISX15', 'MaxxForce 15']
    },
    'DuraStar': {
      years: [2015, 2016, 2017, 2018, 2019, 2020],
      driveTypes: ['4x2'],
      popularEngines: ['MaxxForce DT', 'Cummins B6.7']
    }
  },
  'Mack': {
    'Anthem': {
      years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4'],
      popularEngines: ['Mack MP8', 'Mack MP7']
    },
    'Pinnacle': {
      years: [2015, 2016, 2017, 2018, 2019, 2020],
      driveTypes: ['6x4'],
      popularEngines: ['Mack MP8', 'Mack MP7']
    },
    'Granite': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4', '8x4'],
      popularEngines: ['Mack MP8', 'Mack MP7']
    }
  },
  'Western Star': {
    '5700XE': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      driveTypes: ['6x4'],
      popularEngines: ['DD13', 'DD15', 'DD16']
    },
    '4700': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021],
      driveTypes: ['6x4', '8x4'],
      popularEngines: ['DD13', 'DD15']
    }
  }
};

/**
 * Determine which vehicles a brake drum fits based on its specifications
 */
function generateVehicleFitment(product) {
  const vehicleKeys = new Set();

  // Extract key specifications
  const drumSize = product.spec_brake_surface_diameter_value || 0;
  const drumWidth = product.spec_brake_shoe_width_value || 0;
  const boltHoles = product.spec_drum_bolt_hole_count_value || 0;

  // Brake drum size categories (in inches):
  // 16.5" x 7" - Most common Class 8 heavy-duty trucks
  // 15" x 4" - Medium-duty trucks (Class 6-7)
  // 12.25" x 3.38" - Light-duty commercial

  let applicableVehicles = [];

  if (drumSize >= 16 && drumSize <= 17 && drumWidth >= 6) {
    // Heavy-duty Class 8 trucks (16.5" x 7", etc.)
    applicableVehicles = [
      'Freightliner|Cascadia',
      'Freightliner|Coronado',
      'Kenworth|T680',
      'Kenworth|W900',
      'Kenworth|T880',
      'Peterbilt|579',
      'Peterbilt|389',
      'Peterbilt|567',
      'Volvo|VNL 760',
      'Volvo|VNL 860',
      'International|LT',
      'International|ProStar',
      'Mack|Anthem',
      'Mack|Pinnacle',
      'Western Star|5700XE'
    ];
  } else if (drumSize >= 14.5 && drumSize <= 16 && drumWidth >= 4 && drumWidth < 6) {
    // Medium-duty trucks (15" x 4", etc.)
    applicableVehicles = [
      'Freightliner|M2 106',
      'Freightliner|Columbia',
      'Kenworth|T270',
      'Peterbilt|220',
      'International|DuraStar',
      'Volvo|VHD',
      'Mack|Granite',
      'Western Star|4700'
    ];
  } else if (drumSize >= 12 && drumSize < 14.5) {
    // Light-duty commercial
    applicableVehicles = [
      'Freightliner|M2 106',
      'International|DuraStar'
    ];
  } else {
    // Default to most common heavy-duty applications
    applicableVehicles = [
      'Freightliner|Cascadia',
      'Kenworth|T680',
      'Peterbilt|579',
      'Volvo|VNL 760'
    ];
  }

  // Generate vehicle keys for applicable vehicles
  applicableVehicles.forEach(vehicle => {
    const [make, model] = vehicle.split('|');

    if (TRUCK_DATA[make] && TRUCK_DATA[make][model]) {
      const modelData = TRUCK_DATA[make][model];

      // Select a subset of years (not all - to create variety)
      const yearCoverage = 0.6 + Math.random() * 0.3; // 60-90% of years
      const numYears = Math.floor(modelData.years.length * yearCoverage);
      const startIdx = Math.floor(Math.random() * (modelData.years.length - numYears));
      const applicableYears = modelData.years.slice(startIdx, startIdx + numYears);

      applicableYears.forEach(year => {
        // Generate keys for each engine option
        const engines = modelData.popularEngines || [];

        if (engines.length > 0) {
          // For each year, add all engine variations
          engines.forEach(engine => {
            vehicleKeys.add(`${year}|${make}|${model}|${engine}`);
          });
        } else {
          // Fallback: if no engines defined, use Year|Make|Model
          vehicleKeys.add(`${year}|${make}|${model}`);
        }
      });
    }
  });

  return Array.from(vehicleKeys).sort();
}

/**
 * Extract all unique vehicles from product fitments
 */
function extractUniqueVehicles(productVehicleKeys) {
  const vehiclesMap = {};

  productVehicleKeys.forEach(product => {
    product.aces_vehicle_keys_ss.forEach(key => {
      const parts = key.split('|');
      const [year, make, model, engine] = parts;

      if (!vehiclesMap[year]) {
        vehiclesMap[year] = {};
      }
      if (!vehiclesMap[year][make]) {
        vehiclesMap[year][make] = {};
      }
      if (!vehiclesMap[year][make][model]) {
        vehiclesMap[year][make][model] = {
          engines: {}
        };
      }

      // If engine is specified (4-part key), add it
      if (engine) {
        if (!vehiclesMap[year][make][model].engines[engine]) {
          vehiclesMap[year][make][model].engines[engine] = {
            key: key,
            display: `${year} ${make} ${model} ${engine}`
          };
        }
      } else {
        // Legacy 3-part key support (shouldn't happen with new generation)
        vehiclesMap[year][make][model].key = key;
        vehiclesMap[year][make][model].display = `${year} ${make} ${model}`;
      }
    });
  });

  return vehiclesMap;
}

/**
 * Main execution
 */
function main() {
  console.log('🚚 Generating ACES Vehicle Keys for FleetPride Products...\n');

  // Read product data
  const productsData = JSON.parse(
    fs.readFileSync('fleetpride_products_transformed_flat.json', 'utf8')
  );

  console.log(`📦 Loaded ${productsData.length} products\n`);

  // Generate vehicle keys for each product
  const productVehicleKeys = productsData.map((product, idx) => {
    const vehicleKeys = generateVehicleFitment(product);

    if ((idx + 1) % 100 === 0) {
      console.log(`  Processing product ${idx + 1}/${productsData.length}...`);
    }

    return {
      id: product.id,
      aces_vehicle_keys_ss: vehicleKeys
    };
  });

  console.log('\n✅ Generated vehicle keys for all products\n');

  // Extract unique vehicles for reference file
  console.log('📋 Building vehicles reference...');
  const vehiclesReference = extractUniqueVehicles(productVehicleKeys);

  // Calculate statistics
  const totalVehicleCombos = productVehicleKeys.reduce(
    (sum, p) => sum + p.aces_vehicle_keys_ss.length, 0
  );
  const avgFitments = (totalVehicleCombos / productsData.length).toFixed(1);

  const uniqueVehicles = Object.keys(vehiclesReference).reduce((count, year) => {
    return count + Object.keys(vehiclesReference[year]).reduce((makeCount, make) => {
      return makeCount + Object.keys(vehiclesReference[year][make]).length;
    }, 0);
  }, 0);

  console.log(`  📊 Statistics:`);
  console.log(`     - Total products: ${productsData.length}`);
  console.log(`     - Total vehicle fitments: ${totalVehicleCombos}`);
  console.log(`     - Average fitments per product: ${avgFitments}`);
  console.log(`     - Unique vehicle combinations: ${uniqueVehicles}`);
  console.log();

  // Write product_vehicle_keys.json (for atomic updates)
  console.log('💾 Writing product_vehicle_keys.json...');
  fs.writeFileSync(
    'product_vehicle_keys.json',
    JSON.stringify(productVehicleKeys, null, 2)
  );
  console.log('   ✅ Saved product_vehicle_keys.json\n');

  // Write vehicles_reference_complete.json (for UI)
  console.log('💾 Writing vehicles_reference_complete.json...');
  const vehicleReferenceOutput = {
    _comment: "Complete vehicle reference data generated from FleetPride brake drum products",
    _description: "Use this for UI vehicle selector dropdowns",
    _generated_at: new Date().toISOString(),
    _stats: {
      total_products: productsData.length,
      total_fitments: totalVehicleCombos,
      unique_vehicles: uniqueVehicles
    },
    vehicles: vehiclesReference
  };

  fs.writeFileSync(
    'vehicles_reference_complete.json',
    JSON.stringify(vehicleReferenceOutput, null, 2)
  );
  console.log('   ✅ Saved vehicles_reference_complete.json\n');

  // Sample output for verification
  console.log('📄 Sample output (first product):');
  console.log(JSON.stringify(productVehicleKeys[0], null, 2));
  console.log();

  console.log('✨ Done! Files ready for:');
  console.log('   1. Atomic update to Fusion: product_vehicle_keys.json');
  console.log('   2. UI vehicle selector: vehicles_reference_complete.json');
  console.log();
}

// Run the script
main();

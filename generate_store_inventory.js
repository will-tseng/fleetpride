#!/usr/bin/env node

/**
 * Generate Store Inventory Data for FleetPride Products
 *
 * This script:
 * 1. Reads fleetpride_products_transformed_flat.json
 * 2. Generates realistic store inventory based on product characteristics
 * 3. Outputs product_store_inventory.json (for atomic updates)
 *
 * Store Fields Generated:
 * - online_shipping_b: true (all products available online)
 * - chicago_store_b: boolean (product available at Chicago store)
 * - chicago_inventory_i: integer (units in stock at Chicago)
 * - sanfran_store_b: boolean (product available at San Francisco store)
 * - sanfran_inventory_i: integer (units in stock at San Francisco)
 * - raleigh_store_b: boolean (product available at Raleigh store)
 * - raleigh_inventory_i: integer (units in stock at Raleigh)
 */

const fs = require('fs');

// Store configurations
const STORES = [
  {
    id: 'chicago',
    name: 'Chicago',
    storeField: 'chicago_store_b',
    inventoryField: 'chicago_inventory_i',
    // Chicago is a major distribution hub - higher availability
    availabilityRate: 0.75, // 75% of products
    inventoryRange: { min: 5, max: 50 }
  },
  {
    id: 'sanfran',
    name: 'San Francisco',
    storeField: 'sanfran_store_b',
    inventoryField: 'sanfran_inventory_i',
    // San Francisco - medium availability
    availabilityRate: 0.65, // 65% of products
    inventoryRange: { min: 3, max: 35 }
  },
  {
    id: 'raleigh',
    name: 'Raleigh',
    storeField: 'raleigh_store_b',
    inventoryField: 'raleigh_inventory_i',
    // Raleigh - smaller store, lower availability
    availabilityRate: 0.55, // 55% of products
    inventoryRange: { min: 2, max: 25 }
  }
];

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Determine if a product should be available at a store based on:
 * - Store availability rate
 * - Product price (more expensive items less likely to be stocked)
 * - Random factor for variety
 */
function shouldBeInStore(product, store) {
  const baseRate = store.availabilityRate;

  // Extract price
  const price = parseFloat(product.price_d) || 100;

  // More expensive items (> $300) are less likely to be in store
  let priceModifier = 1.0;
  if (price > 500) {
    priceModifier = 0.7; // 30% less likely
  } else if (price > 300) {
    priceModifier = 0.85; // 15% less likely
  }

  // Calculate final availability rate
  const finalRate = baseRate * priceModifier;

  // Random check
  return Math.random() < finalRate;
}

/**
 * Generate inventory quantity for a product at a store
 * Based on:
 * - Store's inventory range
 * - Product price (lower price = higher inventory)
 * - Random variation
 */
function generateInventory(product, store) {
  const { min, max } = store.inventoryRange;
  const price = parseFloat(product.price_d) || 100;

  // Lower priced items tend to have higher inventory
  let inventoryMultiplier = 1.0;
  if (price < 100) {
    inventoryMultiplier = 1.3; // 30% more inventory
  } else if (price > 300) {
    inventoryMultiplier = 0.7; // 30% less inventory
  }

  // Calculate adjusted range
  const adjustedMin = Math.max(1, Math.floor(min * inventoryMultiplier));
  const adjustedMax = Math.floor(max * inventoryMultiplier);

  // Generate random inventory within range
  return randomInt(adjustedMin, adjustedMax);
}

/**
 * Generate store inventory data for a single product
 */
function generateProductInventory(product) {
  const inventoryData = {
    id: product.id,
    // All products available for online shipping
    online_shipping_b: true
  };

  // Generate data for each store
  STORES.forEach(store => {
    const inStore = shouldBeInStore(product, store);

    if (inStore) {
      // Product is available - generate inventory
      const quantity = generateInventory(product, store);
      inventoryData[store.storeField] = true;
      inventoryData[store.inventoryField] = quantity;
    } else {
      // Product not available at this store
      inventoryData[store.storeField] = false;
      inventoryData[store.inventoryField] = 0;
    }
  });

  return inventoryData;
}

/**
 * Main execution
 */
function main() {
  console.log('🏪 Generating Store Inventory Data for FleetPride Products...\n');

  // Read product data
  const productsData = JSON.parse(
    fs.readFileSync('fleetpride_products_transformed_flat.json', 'utf8')
  );

  console.log(`📦 Loaded ${productsData.length} products\n`);

  // Generate inventory for each product
  const productInventory = productsData.map((product, idx) => {
    if ((idx + 1) % 100 === 0) {
      console.log(`  Processing product ${idx + 1}/${productsData.length}...`);
    }

    return generateProductInventory(product);
  });

  console.log('\n✅ Generated inventory data for all products\n');

  // Calculate statistics
  const stats = {
    total_products: productsData.length,
    stores: {}
  };

  STORES.forEach(store => {
    const productsInStore = productInventory.filter(p => p[store.storeField] === true).length;
    const totalInventory = productInventory.reduce((sum, p) => sum + (p[store.inventoryField] || 0), 0);
    const avgInventory = totalInventory / productsInStore;

    stats.stores[store.name] = {
      products_available: productsInStore,
      availability_percent: ((productsInStore / productsData.length) * 100).toFixed(1),
      total_inventory: totalInventory,
      avg_inventory_per_product: avgInventory.toFixed(1)
    };
  });

  console.log('📊 Inventory Statistics:');
  console.log(`   Total Products: ${stats.total_products}`);
  console.log(`   Online: ${stats.total_products} (100%)\n`);

  STORES.forEach(store => {
    const storeStats = stats.stores[store.name];
    console.log(`   ${store.name}:`);
    console.log(`     - Products Available: ${storeStats.products_available} (${storeStats.availability_percent}%)`);
    console.log(`     - Total Inventory: ${storeStats.total_inventory} units`);
    console.log(`     - Avg Inventory/Product: ${storeStats.avg_inventory_per_product} units`);
    console.log();
  });

  // Write product_store_inventory.json (for atomic updates)
  console.log('💾 Writing product_store_inventory.json...');

  // Clean format for atomic updates - just the array of products
  fs.writeFileSync(
    'product_store_inventory.json',
    JSON.stringify(productInventory, null, 2)
  );
  console.log('   ✅ Saved product_store_inventory.json\n');

  // Write stats to separate file for reference
  console.log('💾 Writing product_store_inventory_stats.json...');
  const statsOutput = {
    _comment: "Store inventory statistics",
    _generated_at: new Date().toISOString(),
    _stats: stats
  };

  fs.writeFileSync(
    'product_store_inventory_stats.json',
    JSON.stringify(statsOutput, null, 2)
  );
  console.log('   ✅ Saved product_store_inventory_stats.json\n');

  // Sample output for verification
  console.log('📄 Sample output (first 3 products):');
  console.log(JSON.stringify(productInventory.slice(0, 3), null, 2));
  console.log();

  console.log('✨ Done! Files generated:');
  console.log('   📄 product_store_inventory.json - Ready for atomic update to Fusion');
  console.log('   📊 product_store_inventory_stats.json - Statistics and metadata');
  console.log();
}

// Run the script
main();

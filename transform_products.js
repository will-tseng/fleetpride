/**
 * FleetPride Product Data Transformer
 * Prepares scraped product data for search engine ingestion (Lucidworks Fusion/Solr)
 */

const fs = require('fs');
const path = require('path');

// Input/Output paths
const INPUT_FILE = path.join(__dirname, 'fleetpride_products.json');
const OUTPUT_FILE = path.join(__dirname, 'fleetpride_products_transformed.json');

/**
 * Parse price string to numeric value
 * @param {string} priceStr - Price like "$95.00" or "$1,299.99"
 * @returns {number|null} - Numeric price or null if unparseable
 */
function parsePrice(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return null;
  const cleaned = priceStr.replace(/[$,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse measurement string to extract numeric value and unit
 * @param {string} measureStr - Measurement like "16.5 in", "101 lbs", "7.54""
 * @returns {object} - { value: number, unit: string, original: string }
 */
function parseMeasurement(measureStr) {
  if (!measureStr || typeof measureStr !== 'string') {
    return { value: null, unit: null, original: measureStr };
  }

  const original = measureStr.trim();

  // Handle inch notation with quotes: 7.54"
  if (original.endsWith('"') || original.endsWith("'")) {
    const value = parseFloat(original.slice(0, -1));
    return {
      value: isNaN(value) ? null : value,
      unit: original.endsWith('"') ? 'in' : 'ft',
      original
    };
  }

  // Match patterns like "16.5 in", "101 lbs", "6.00 ft"
  const match = original.match(/^([\d.,]+)\s*(.*)$/);
  if (match) {
    const value = parseFloat(match[1].replace(',', ''));
    let unit = match[2].trim().toLowerCase();

    // Normalize common unit variations
    const unitMap = {
      'lbs': 'lb',
      'lb': 'lb',
      'in': 'in',
      'inch': 'in',
      'inches': 'in',
      'ft': 'ft',
      'feet': 'ft',
      'foot': 'ft',
      'mm': 'mm',
      'cm': 'cm',
      'm': 'm',
      'oz': 'oz',
      'kg': 'kg',
      'g': 'g'
    };

    unit = unitMap[unit] || unit;

    return {
      value: isNaN(value) ? null : value,
      unit: unit || null,
      original
    };
  }

  return { value: null, unit: null, original };
}

/**
 * Normalize specification keys to consistent snake_case format
 * @param {string} key - Original specification key
 * @returns {string} - Normalized key
 */
function normalizeSpecKey(key) {
  return key
    .toLowerCase()
    .replace(/[\/\-\(\)]/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Derive subcategory from product name and specifications
 * @param {object} product - Product object
 * @returns {string} - Derived subcategory
 */
function deriveSubcategory(product) {
  const name = (product.name || '').toLowerCase();
  const specs = product.specifications || {};

  // Check product name for subcategory hints
  if (name.includes('brake drum')) return 'brake_drums';
  if (name.includes('brake shoe')) return 'brake_shoes';
  if (name.includes('brake rotor') || name.includes('disc brake')) return 'brake_rotors';
  if (name.includes('brake pad')) return 'brake_pads';
  if (name.includes('brake chamber')) return 'brake_chambers';
  if (name.includes('slack adjuster')) return 'slack_adjusters';
  if (name.includes('abs') && name.includes('sensor')) return 'abs_sensors';
  if (name.includes('abs') && (name.includes('cable') || name.includes('extension'))) return 'abs_cables';
  if (name.includes('wheel seal')) return 'wheel_seals';
  if (name.includes('hub')) return 'hubs';
  if (name.includes('caliper')) return 'calipers';
  if (name.includes('air dryer')) return 'air_dryers';
  if (name.includes('valve')) return 'valves';
  if (name.includes('spring') && name.includes('brake')) return 'brake_springs';
  if (name.includes('kit')) return 'brake_kits';
  if (name.includes('hardware')) return 'brake_hardware';

  // Default based on category
  return 'other_brake_parts';
}

/**
 * Generate searchable text field combining key product info
 * @param {object} product - Product object
 * @returns {string} - Combined searchable text
 */
function generateSearchText(product) {
  const parts = [];

  // Add name
  if (product.name) parts.push(product.name);

  // Add brand
  if (product.brand) parts.push(product.brand);

  // Add part number and SKU
  if (product.part_number) parts.push(product.part_number);
  if (product.sku && product.sku !== product.part_number) parts.push(product.sku);

  // Add features
  if (Array.isArray(product.features)) {
    parts.push(...product.features);
  }

  // Add key specification values (non-numeric ones that might be searchable)
  if (product.specifications) {
    const searchableSpecs = ['Application', 'Mounting Type', 'Notes', 'Application Notes'];
    for (const key of searchableSpecs) {
      if (product.specifications[key]) {
        parts.push(product.specifications[key]);
      }
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Transform a single product for search engine ingestion
 * @param {object} product - Raw product object
 * @param {number} index - Product index for ID generation
 * @returns {object} - Transformed product
 */
function transformProduct(product, index) {
  const transformed = {
    // Core identifiers
    id: product.part_number || product.sku || `fp_${index}`,
    part_number: product.part_number || null,
    sku: product.sku || null,

    // Product info
    name: product.name || '',
    title: product.name || '', // Alias for compatibility
    brand: product.brand || '',
    manufacturer: product.brand || '', // Alias for compatibility

    // Categorization
    category: product.category || 'brakes',
    subcategory: product.subcategory || deriveSubcategory(product),

    // Pricing
    price: parsePrice(product.price),
    price_display: product.price || null,

    // URLs
    url: product.url || null,
    image_url: product.image_url || null,

    // Content
    features: product.features || [],
    features_text: (product.features || []).join(' | '),

    // Searchable text field
    search_text: generateSearchText(product),

    // Metadata
    scraped_at: product.scraped_at || null,
    source: 'fleetpride.com'
  };

  // Process specifications into typed fields
  if (product.specifications && typeof product.specifications === 'object') {
    const specs = {};
    const specsFlat = {}; // For faceting with string values

    for (const [key, value] of Object.entries(product.specifications)) {
      const normalizedKey = normalizeSpecKey(key);

      if (typeof value === 'string') {
        const parsed = parseMeasurement(value);

        // Store both the parsed value and original
        specs[normalizedKey] = {
          value: parsed.value,
          unit: parsed.unit,
          display: parsed.original
        };

        // Flat version for faceting (original string value)
        specsFlat[normalizedKey] = parsed.original;

        // Create typed fields for common numeric specifications
        if (parsed.value !== null) {
          transformed[`spec_${normalizedKey}_value`] = parsed.value;
          if (parsed.unit) {
            transformed[`spec_${normalizedKey}_unit`] = parsed.unit;
          }
        }
      } else {
        specs[normalizedKey] = value;
        specsFlat[normalizedKey] = String(value);
      }
    }

    transformed.specifications = specs;
    transformed.specifications_flat = specsFlat;

    // Extract commonly-used specifications as top-level fields for faceting
    if (specs.brake_size) {
      transformed.brake_size = specs.brake_size.display || null;
    }
    if (specs.mounting_type) {
      transformed.mounting_type = specs.mounting_type.display || specs.mounting_type;
    }
    if (specs.balanced) {
      transformed.balanced = specs.balanced.display || specs.balanced;
    }
    if (specs.application) {
      transformed.application = specs.application.display || specs.application;
    }
    if (specs.drum_weight || specs.weight) {
      const weight = specs.drum_weight || specs.weight;
      transformed.weight = weight.value || null;
      transformed.weight_unit = weight.unit || 'lb';
      transformed.weight_display = weight.display || null;
    }
  }

  return transformed;
}

/**
 * Main transformation function
 */
function transformProducts() {
  console.log('Reading input file:', INPUT_FILE);

  // Read input file
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(rawData);

  console.log(`Found ${data.total_products} products to transform`);

  // Transform each product
  const transformedProducts = data.products.map((product, index) => {
    return transformProduct(product, index);
  });

  // Generate statistics
  const stats = {
    total_products: transformedProducts.length,
    brands: [...new Set(transformedProducts.map(p => p.brand).filter(Boolean))],
    subcategories: [...new Set(transformedProducts.map(p => p.subcategory).filter(Boolean))],
    price_range: {
      min: Math.min(...transformedProducts.map(p => p.price).filter(p => p !== null)),
      max: Math.max(...transformedProducts.map(p => p.price).filter(p => p !== null))
    },
    products_with_images: transformedProducts.filter(p => p.image_url).length,
    products_with_features: transformedProducts.filter(p => p.features && p.features.length > 0).length
  };

  console.log('\nTransformation Statistics:');
  console.log(`  Total products: ${stats.total_products}`);
  console.log(`  Unique brands: ${stats.brands.length}`);
  console.log(`  Subcategories: ${stats.subcategories.length}`);
  console.log(`  Price range: $${stats.price_range.min} - $${stats.price_range.max}`);
  console.log(`  Products with images: ${stats.products_with_images}`);
  console.log(`  Products with features: ${stats.products_with_features}`);

  // Write output - array of documents ready for indexing
  const output = {
    metadata: {
      transformed_at: new Date().toISOString(),
      source_file: INPUT_FILE,
      stats: stats
    },
    documents: transformedProducts
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nTransformed data written to: ${OUTPUT_FILE}`);

  // Also write a flat array version for direct Solr/Fusion indexing
  const flatOutputFile = OUTPUT_FILE.replace('.json', '_flat.json');
  fs.writeFileSync(flatOutputFile, JSON.stringify(transformedProducts, null, 2));
  console.log(`Flat document array written to: ${flatOutputFile}`);

  return { stats, transformedProducts };
}

// Run transformation
transformProducts();

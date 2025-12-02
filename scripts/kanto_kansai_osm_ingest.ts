/**
 * Kanto & Kansai OSM Ingestion Script
 * 
 * This script:
 * 1. Queries OpenStreetMap (Overpass API) for shops in Kanto and Kansai regions
 * 2. Filters by specific categories (Dining, Beauty Services, Activities)
 * 3. Checks for duplicates before inserting
 * 4. Generates multilingual translations
 * 5. Inserts into Supabase shops table
 * 
 * Usage: npx tsx scripts/kanto_kansai_osm_ingest.ts
 * Or: npm run osm-ingest (if added to package.json)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from multiple possible locations
const possibleEnvPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'apps', 'api', '.env'),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
    console.log(`✅ Loaded environment from: ${envPath}`);
    break;
  }
}

// Also try default dotenv loading
dotenv.config({ override: false });

// Try both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL (for compatibility)
// Also check command line arguments
const SUPABASE_URL = 
  process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1] ||
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL;
  
const SUPABASE_SERVICE_ROLE_KEY = 
  process.argv.find(arg => arg.startsWith('--key='))?.split('=')[1] ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
  
const OPENAI_API_KEY = 
  process.argv.find(arg => arg.startsWith('--openai='))?.split('=')[1] ||
  process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\n💡 Usage options:');
  console.error('   1. Create .env.local file with:');
  console.error('      NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('   2. Or pass as command line arguments:');
  console.error('      npm run osm-ingest -- --url=https://... --key=...');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// REGION DEFINITIONS
// ============================================================================

interface Prefecture {
  name: string;
  nameJa: string;
  boundingBox: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
}

const KANTO_PREFECTURES: Prefecture[] = [
  { name: 'Tokyo', nameJa: '東京都', boundingBox: [35.4, 139.0, 35.9, 139.9] },
  { name: 'Kanagawa', nameJa: '神奈川県', boundingBox: [35.1, 139.0, 35.7, 139.8] },
  { name: 'Chiba', nameJa: '千葉県', boundingBox: [35.0, 139.7, 35.9, 140.9] },
  { name: 'Saitama', nameJa: '埼玉県', boundingBox: [35.7, 138.9, 36.3, 139.9] },
  { name: 'Ibaraki', nameJa: '茨城県', boundingBox: [35.9, 139.7, 36.6, 140.8] },
  { name: 'Gunma', nameJa: '群馬県', boundingBox: [36.1, 138.5, 36.8, 139.4] },
  { name: 'Tochigi', nameJa: '栃木県', boundingBox: [36.2, 139.4, 36.9, 140.1] },
];

const KANSAI_PREFECTURES: Prefecture[] = [
  { name: 'Osaka', nameJa: '大阪府', boundingBox: [34.4, 135.2, 34.9, 135.7] },
  { name: 'Kyoto', nameJa: '京都府', boundingBox: [34.7, 135.0, 35.6, 135.8] },
  { name: 'Hyogo', nameJa: '兵庫県', boundingBox: [34.2, 134.3, 35.3, 135.2] },
  { name: 'Nara', nameJa: '奈良県', boundingBox: [34.1, 135.5, 34.7, 136.0] },
  { name: 'Shiga', nameJa: '滋賀県', boundingBox: [34.9, 135.7, 35.6, 136.3] },
  { name: 'Wakayama', nameJa: '和歌山県', boundingBox: [33.4, 135.0, 34.3, 135.6] },
];

// ============================================================================
// OSM DATA STRUCTURES
// ============================================================================

interface OSMNode {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    'name:ja'?: string;
    'name:en'?: string;
    amenity?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:postcode'?: string;
    'addr:full'?: string;
    cuisine?: string;
    [key: string]: string | undefined;
  };
  center?: { lat: number; lon: number };
}

interface OverpassResponse {
  elements: OSMNode[];
}

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

interface CategoryMapping {
  subcategory: string;
  mainCategory: string;
  osmQueries: string[];
  namePatterns: string[];
}

const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    subcategory: 'Restaurant',
    mainCategory: 'Dining & Izakaya',
    osmQueries: ['amenity=restaurant'],
    namePatterns: [],
  },
  {
    subcategory: 'Izakaya',
    mainCategory: 'Dining & Izakaya',
    osmQueries: ['amenity=restaurant', 'amenity=pub'],
    namePatterns: ['居酒屋', 'izakaya', 'Izakaya'],
  },
  {
    subcategory: 'Karaoke',
    mainCategory: 'Dining & Izakaya',
    osmQueries: ['amenity=karaoke_box', 'leisure=entertainment'],
    namePatterns: ['カラオケ', 'karaoke', 'Karaoke'],
  },
  {
    subcategory: 'Waxing',
    mainCategory: 'Beauty Services',
    osmQueries: ['shop=beauty'],
    namePatterns: ['脱毛', 'ブラジリアンワックス', 'ワックス脱毛', 'waxing', 'Waxing'],
  },
  {
    subcategory: 'Pilates',
    mainCategory: 'Activities & Sports',
    osmQueries: ['leisure=sports_centre', 'sport=pilates'],
    namePatterns: ['ピラティス', 'Pilates', 'pilates'],
  },
  {
    subcategory: 'Yoga',
    mainCategory: 'Activities & Sports',
    osmQueries: ['leisure=sports_centre', 'sport=yoga'],
    namePatterns: ['ヨガ', 'Yoga', 'yoga'],
  },
];

// ============================================================================
// TRANSLATION FUNCTIONS
// ============================================================================

async function translateText(text: string, targetLang: 'ja' | 'en' | 'es' | 'pt' | 'cn'): Promise<string> {
  if (!text || text.trim() === '') return '';
  
  // If already in target language, return as-is
  if (targetLang === 'ja' && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
    return text; // Contains Japanese characters
  }
  if (targetLang === 'en' && !/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
    return text; // No Japanese characters, assume English
  }

  // Use OpenAI for translation if available
  if (OPENAI_API_KEY) {
    try {
      const languageNames: Record<string, string> = {
        ja: 'Japanese',
        en: 'English',
        es: 'Spanish',
        pt: 'Portuguese',
        cn: 'Chinese (Simplified)',
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text to ${languageNames[targetLang]}. Maintain the same tone and formality. Return ONLY the translated text, no explanations.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data.choices[0]?.message?.content?.trim();
        if (translated) {
          return translated;
        }
      }
    } catch (error) {
      console.warn(`Translation failed for "${text}" to ${targetLang}:`, error);
    }
  }

  // Fallback: return original text
  return text;
}

async function generateTranslations(text: string): Promise<{
  ja: string;
  en: string;
  es: string;
  pt: string;
  cn: string;
}> {
  // Detect if text is Japanese
  const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
  
  const baseText = isJapanese ? text : text; // Use original as base

  const [ja, en, es, pt, cn] = await Promise.all([
    isJapanese ? Promise.resolve(text) : translateText(text, 'ja'),
    isJapanese ? translateText(text, 'en') : Promise.resolve(text),
    translateText(text, 'es'),
    translateText(text, 'pt'),
    translateText(text, 'cn'),
  ]);

  return { ja, en, es, pt, cn };
}

// ============================================================================
// SUPABASE HELPERS
// ============================================================================

async function getCategoryId(categoryName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();

  if (error || !data) {
    console.error(`❌ Category "${categoryName}" not found:`, error);
    return null;
  }

  return data.id;
}

async function getSubcategoryId(subcategoryName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', subcategoryName)
    .single();

  if (error || !data) {
    // Subcategory might not exist, that's okay
    return null;
  }

  return data.id;
}

// ============================================================================
// DUPLICATE CHECKING
// ============================================================================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');
}

// Cache for OSM IDs to avoid repeated queries
const osmIdCache = new Set<string>();
const duplicateCheckCache = new Map<string, boolean>();

async function checkDuplicate(
  name: string,
  address: string,
  lat: number,
  lon: number,
  osmId: number
): Promise<boolean> {
  const osmIdStr = osmId.toString();
  
  // Quick cache check for OSM ID
  if (osmIdCache.has(osmIdStr)) {
    return true; // Already seen this OSM ID
  }

  const normalizedName = normalizeText(name);
  const cacheKey = `${normalizedName}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
  
  // Check cache first
  if (duplicateCheckCache.has(cacheKey)) {
    return duplicateCheckCache.get(cacheKey)!;
  }

  // Check by OSM ID (fastest check first)
  const { data: osmMatch } = await supabase
    .from('shops')
    .select('id')
    .eq('osm_id', osmIdStr)
    .limit(1)
    .single();

  if (osmMatch) {
    osmIdCache.add(osmIdStr);
    duplicateCheckCache.set(cacheKey, true);
    return true; // Duplicate by OSM ID
  }

  // Check by name and approximate location (simplified - only check nearby shops)
  const { data: nearbyShops } = await supabase
    .from('shops')
    .select('id, name, latitude, longitude, address')
    .gte('latitude', lat - 0.01) // ~1km radius
    .lte('latitude', lat + 0.01)
    .gte('longitude', lon - 0.01)
    .lte('longitude', lon + 0.01)
    .limit(100); // Reduced from 1000

  if (nearbyShops) {
    for (const shop of nearbyShops) {
      if (!shop.latitude || !shop.longitude) continue;

      const shopNameNormalized = normalizeText(shop.name || '');
      
      // Check name match and distance
      if (shopNameNormalized === normalizedName) {
        const distance = calculateDistance(lat, lon, shop.latitude, shop.longitude);
        if (distance < 50) {
          duplicateCheckCache.set(cacheKey, true);
          return true; // Duplicate by name and location
        }
      }
    }
  }

  duplicateCheckCache.set(cacheKey, false);
  return false; // Not a duplicate
}

// ============================================================================
// OSM QUERY FUNCTIONS
// ============================================================================

function buildOverpassQuery(prefecture: Prefecture, categoryMapping: CategoryMapping): string {
  const [minLat, minLon, maxLat, maxLon] = prefecture.boundingBox;
  const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;

  // Build query parts
  const queryParts: string[] = [];
  
  for (const osmQuery of categoryMapping.osmQueries) {
    const [key, value] = osmQuery.split('=');
    
    // Query nodes
    queryParts.push(`node["${key}"="${value}"]({{bbox}});`);
    
    // Query ways
    queryParts.push(`way["${key}"="${value}"]({{bbox}});`);
  }

  // If name patterns exist, we'll filter in post-processing
  // Overpass doesn't support complex regex in the query itself easily
  const query = `
[out:json][timeout:300];
(
  ${queryParts.join('\n  ')}
);
out center meta;
`.replace(/{{bbox}}/g, bbox);

  return query;
}

async function queryOverpassAPI(query: string): Promise<OSMNode[]> {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data: OverpassResponse = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error('Error querying Overpass API:', error);
    return [];
  }
}

function categorizeOSMNode(node: OSMNode): { subcategory: string; mainCategory: string } | null {
  const name = (node.tags?.name || '').toLowerCase();
  const nameJa = (node.tags?.['name:ja'] || '').toLowerCase();
  const combinedName = `${name} ${nameJa}`.toLowerCase();

  // Check each category mapping
  for (const mapping of CATEGORY_MAPPINGS) {
    // Check OSM tags
    const matchesOSMTag = mapping.osmQueries.some((query) => {
      const [key, value] = query.split('=');
      return node.tags?.[key] === value;
    });

    if (!matchesOSMTag) continue;

    // Check name patterns (if required)
    if (mapping.namePatterns.length > 0) {
      const matchesNamePattern = mapping.namePatterns.some((pattern) => 
        combinedName.includes(pattern.toLowerCase())
      );
      
      if (!matchesNamePattern) continue;
    }

    // Special handling for Izakaya (must have "居酒屋" in name)
    if (mapping.subcategory === 'Izakaya') {
      if (!combinedName.includes('居酒屋') && !combinedName.includes('izakaya')) {
        continue;
      }
    }

    // Special handling for Karaoke (must have "カラオケ" in name)
    if (mapping.subcategory === 'Karaoke') {
      if (!combinedName.includes('カラオケ') && !combinedName.includes('karaoke')) {
        continue;
      }
    }

    return {
      subcategory: mapping.subcategory,
      mainCategory: mapping.mainCategory,
    };
  }

  return null;
}

// ============================================================================
// DATA PROCESSING
// ============================================================================

function parseOSMNode(node: OSMNode): {
  name: string;
  address: string;
  lat: number;
  lon: number;
  osmId: number;
} | null {
  const name = node.tags?.name || node.tags?.['name:ja'] || node.tags?.['name:en'] || '';
  if (!name) return null;

  // Get coordinates
  let lat: number, lon: number;
  if (node.type === 'node' && node.lat && node.lon) {
    lat = node.lat;
    lon = node.lon;
  } else if (node.center) {
    lat = node.center.lat;
    lon = node.center.lon;
  } else {
    return null; // No coordinates
  }

  // Build address
  const addressParts: string[] = [];
  if (node.tags?.['addr:street']) addressParts.push(node.tags['addr:street']);
  if (node.tags?.['addr:housenumber']) addressParts.push(node.tags['addr:housenumber']);
  if (node.tags?.['addr:city']) addressParts.push(node.tags['addr:city']);
  if (node.tags?.['addr:postcode']) addressParts.push(node.tags['addr:postcode']);
  
  const address = addressParts.length > 0 
    ? addressParts.join(' ')
    : node.tags?.['addr:full'] || '';

  return {
    name,
    address,
    lat,
    lon,
    osmId: node.id,
  };
}

// ============================================================================
// MAIN INGESTION FUNCTION
// ============================================================================

interface IngestionStats {
  totalQueried: number;
  totalInserted: number;
  totalSkipped: number;
  byPrefecture: Record<string, { inserted: number; skipped: number }>;
  bySubcategory: Record<string, number>;
}

async function ingestPrefecture(
  prefecture: Prefecture,
  region: 'Kanto' | 'Kansai',
  stats: IngestionStats
): Promise<void> {
  console.log(`\n📍 Processing ${prefecture.name} (${prefecture.nameJa})...`);

  for (const categoryMapping of CATEGORY_MAPPINGS) {
    console.log(`  🔍 Querying ${categoryMapping.subcategory}...`);

    const query = buildOverpassQuery(prefecture, categoryMapping);
    const nodes = await queryOverpassAPI(query);

    console.log(`  ✅ Found ${nodes.length} OSM nodes`);

    for (const node of nodes) {
      stats.totalQueried++;

      // Parse node
      const parsed = parseOSMNode(node);
      if (!parsed) {
        stats.totalSkipped++;
        continue;
      }

      // Categorize
      const category = categorizeOSMNode(node);
      if (!category) {
        stats.totalSkipped++;
        continue;
      }

      // Check duplicate
      const isDuplicate = await checkDuplicate(
        parsed.name,
        parsed.address,
        parsed.lat,
        parsed.lon,
        parsed.osmId
      );

      if (isDuplicate) {
        stats.totalSkipped++;
        if (stats.totalSkipped % 10 === 0) {
          process.stdout.write('.');
        }
        continue;
      }

      // Get category IDs
      const mainCategoryId = await getCategoryId(category.mainCategory);
      if (!mainCategoryId) {
        console.warn(`    ⚠️  Main category "${category.mainCategory}" not found, skipping`);
        stats.totalSkipped++;
        continue;
      }

      // Skip translations for speed - use original text
      // Insert into Supabase
      const insertData: any = {
        name: parsed.name, // Primary name (use Japanese if available, else English)
        address: parsed.address,
        latitude: parsed.lat,
        longitude: parsed.lon,
        osm_id: parsed.osmId.toString(),
        category_id: mainCategoryId,
        subcategory: category.subcategory,
        prefecture: prefecture.name,
        country: 'Japan',
        language_code: 'ja', // Default to Japanese
        claim_status: 'unclaimed',
      };
      
      const { error: insertError } = await supabase.from('shops').insert(insertData);

      if (insertError) {
        console.error(`    ❌ Error inserting shop "${parsed.name}":`, insertError);
        stats.totalSkipped++;
      } else {
        stats.totalInserted++;
        stats.bySubcategory[category.subcategory] = (stats.bySubcategory[category.subcategory] || 0) + 1;
        stats.byPrefecture[prefecture.name] = {
          inserted: (stats.byPrefecture[prefecture.name]?.inserted || 0) + 1,
          skipped: stats.byPrefecture[prefecture.name]?.skipped || 0,
        };
        process.stdout.write('+');
      }

      // Reduced rate limiting - only 10ms delay
      if (stats.totalInserted % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Starting Kanto & Kansai OSM Ingestion');
  console.log('='.repeat(80));

  const stats: IngestionStats = {
    totalQueried: 0,
    totalInserted: 0,
    totalSkipped: 0,
    byPrefecture: {},
    bySubcategory: {},
  };

  try {
    // Process Kanto prefectures
    console.log('\n🏙️  KANTO REGION');
    console.log('='.repeat(80));
    for (const prefecture of KANTO_PREFECTURES) {
      await ingestPrefecture(prefecture, 'Kanto', stats);
    }

    // Process Kansai prefectures
    console.log('\n\n🏙️  KANSAI REGION');
    console.log('='.repeat(80));
    for (const prefecture of KANSAI_PREFECTURES) {
      await ingestPrefecture(prefecture, 'Kansai', stats);
    }

    // Print final statistics
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 FINAL STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Queried: ${stats.totalQueried}`);
    console.log(`Total Inserted: ${stats.totalInserted}`);
    console.log(`Total Skipped: ${stats.totalSkipped}`);

    console.log('\n📋 By Prefecture:');
    for (const [pref, data] of Object.entries(stats.byPrefecture)) {
      console.log(`  ${pref}: ${data.inserted} inserted, ${data.skipped} skipped`);
    }

    console.log('\n📋 By Subcategory:');
    for (const [subcat, count] of Object.entries(stats.bySubcategory)) {
      console.log(`  ${subcat}: ${count} shops`);
    }

    console.log('\n✅ Ingestion completed successfully!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();


// apps/api/src/scripts/importJapanBusinesses.ts
// Comprehensive Japan business import using Government Data and OpenStreetMap
// NO API KEYS REQUIRED - Uses only free public data sources

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import * as fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// File paths
const BACKUPS_DIR = path.resolve(__dirname, "../../backups");
const CHECKPOINT_FILE = path.resolve(__dirname, "../../import_checkpoint.json");
const LOG_FILE = path.resolve(__dirname, `../../import_log_${Date.now()}.txt`);

// Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Statistics
const stats = {
  totalFound: 0,
  duplicates: 0,
  inserted: 0,
  errors: 0,
  retries: 0,
  bySource: {} as Record<string, number>,
  byCategory: {} as Record<string, number>,
};

// Logging
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Append to log file
  try {
    if (!fs.existsSync(path.dirname(LOG_FILE))) {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, logMessage + "\n");
  } catch (error) {
    // Ignore log file errors
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Create backup of existing shops
async function createBackup(): Promise<string> {
  log("📦 Creating backup of existing shops...");
  
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.resolve(BACKUPS_DIR, `shops_backup_${timestamp}.json`);

    // Fetch all shops from Supabase
    const { data: shops, error } = await supabase
      .from("shops")
      .select("*");

    if (error) {
      log(`⚠️  Error fetching shops for backup: ${error.message}`);
      return "";
    }

    const backup = {
      timestamp: new Date().toISOString(),
      count: shops?.length || 0,
      shops: shops || [],
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    log(`✅ Backup created: ${backupFile} (${backup.count} shops)`);
    return backupFile;
  } catch (error: any) {
    log(`❌ Error creating backup: ${error.message}`);
    return "";
  }
}

// Load checkpoint
function loadCheckpoint(): Set<string> {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const content = fs.readFileSync(CHECKPOINT_FILE, "utf-8");
      const checkpoint = JSON.parse(content);
      return new Set(checkpoint.processed || []);
    }
  } catch (error) {
    log("⚠️  Could not load checkpoint, starting fresh");
  }
  return new Set<string>();
}

// Save checkpoint
function saveCheckpoint(processed: Set<string>) {
  try {
    const checkpoint = {
      processed: Array.from(processed),
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    log("⚠️  Could not save checkpoint");
  }
}

// Generate unique identifier for duplicate checking
function generateShopKey(name: string, lat: number, lng: number): string {
  // Normalize name and round coordinates to ~10m precision
  const normalizedName = name.toLowerCase().trim().replace(/\s+/g, " ");
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `${normalizedName}::${roundedLat}::${roundedLng}`;
}

// Check if shop already exists (by osm_id OR name + lat + lng)
async function isDuplicate(name: string, lat: number, lng: number, osmId?: string | number): Promise<boolean> {
  if (!name || !lat || !lng) return false;

  // First check by osm_id if available (most reliable)
  if (osmId) {
    const { data: existingByOsmId } = await supabase
      .from("shops")
      .select("id")
      .eq("osm_id", osmId.toString())
      .maybeSingle();
    
    if (existingByOsmId) {
      return true;
    }
  }

  const shopKey = generateShopKey(name, lat, lng);
  const checkpoint = loadCheckpoint();
  if (checkpoint.has(shopKey)) {
    return true;
  }

  // Check in database (within ~10m radius)
  const radius = 0.0001; // ~10 meters
  const { data } = await supabase
    .from("shops")
    .select("id, name, latitude, longitude")
    .gte("latitude", lat - radius)
    .lte("latitude", lat + radius)
    .gte("longitude", lng - radius)
    .lte("longitude", lng + radius)
    .limit(10);

  if (data && data.length > 0) {
    // Check exact match
    for (const shop of data) {
      if (shop.latitude && shop.longitude) {
        const latDiff = Math.abs(shop.latitude - lat);
        const lngDiff = Math.abs(shop.longitude - lng);
        if (latDiff < 0.0001 && lngDiff < 0.0001) {
          const existingKey = generateShopKey(shop.name, shop.latitude, shop.longitude);
          if (existingKey === shopKey) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// Get or create category
async function getOrCreateCategoryId(categoryName: string): Promise<string | null> {
  const cache = (getOrCreateCategoryId as any).cache || {};
  if (cache[categoryName]) {
    return cache[categoryName];
  }

  // Try to get existing
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .maybeSingle();

  if (existing) {
    cache[categoryName] = existing.id;
    (getOrCreateCategoryId as any).cache = cache;
    return existing.id;
  }

  // Create new
  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert([{ name: categoryName, description: `Auto-created during import` }])
    .select("id")
    .single();

  if (error) {
    // Race condition - try again
    const { data: retry } = await supabase
      .from("categories")
      .select("id")
      .eq("name", categoryName)
      .maybeSingle();

    if (retry) {
      cache[categoryName] = retry.id;
      (getOrCreateCategoryId as any).cache = cache;
      return retry.id;
    }
    log(`⚠️  Could not create category "${categoryName}": ${error.message}`);
    return null;
  }

  if (newCategory) {
    cache[categoryName] = newCategory.id;
    (getOrCreateCategoryId as any).cache = cache;
    log(`  ✓ Created category: "${categoryName}"`);
    return newCategory.id;
  }

  return null;
}

// Categorize shop from industry code or OSM tags
// Maps to category names that exist in the database
function categorizeShop(name: string, industryCode?: string, osmTags?: any): string {
  const nameLower = name.toLowerCase();
  
  // Map common industry codes to categories
  if (industryCode) {
    const code = industryCode.toString();
    // Japanese industry codes (simplified mapping)
    if (code.includes("801") || code.includes("美容")) return "Beauty Salon";
    if (code.includes("802") || code.includes("理容")) return "Barbershop";
    if (code.includes("803") || code.includes("ネイル")) return "Nail Salon";
    if (code.includes("804") || code.includes("エステ")) return "Spa & Massage";
    if (code.includes("701") || code.includes("宿泊")) return "Hotels & Ryokan";
    if (code.includes("601") || code.includes("飲食")) return "Restaurants & Izakaya";
    if (code.includes("温泉") || code.includes("銭湯")) return "Spas, Onsen & Day-use Bathhouses";
  }

  // Use OSM tags - comprehensive mapping for all categories
  if (osmTags) {
    // Beauty & Salon categories
    if (osmTags.amenity === "beauty_salon" || osmTags.shop === "beauty") return "Beauty Salon";
    if (osmTags.shop === "hairdresser" || osmTags.amenity === "hairdresser") return "Hair Salon";
    if (osmTags.amenity === "barbershop") return "Barbershop";
    if (osmTags.amenity === "nail_salon" || osmTags.shop === "nail") return "Nail Salon";
    if (osmTags.amenity === "spa") return "Spa & Massage";
    
    // Eyelash (no direct OSM tag, but check name)
    if (nameLower.match(/eyelash|lash|まつげ|エクステ|ラッシュ/)) return "Eyelash";
    
    // Hotels & Accommodation
    if (osmTags.tourism === "hotel" || osmTags.tourism === "guest_house" || 
        osmTags.tourism === "hostel" || osmTags.tourism === "resort" ||
        osmTags.tourism === "ryokan") return "Hotels & Ryokan";
    
    // Restaurants
    if (osmTags.amenity === "restaurant" || osmTags.amenity === "cafe" ||
        osmTags.amenity === "food_court") return "Restaurants & Izakaya";
    
    // Spas, Onsen & Bathhouses
    if (osmTags.amenity === "public_bath" || osmTags.amenity === "bathhouse" ||
        osmTags.leisure === "sauna" || osmTags.amenity === "hot_spring") return "Spas, Onsen & Day-use Bathhouses";
    
    // Golf
    if (osmTags.leisure === "golf_course" || osmTags.leisure === "pitch" && osmTags.sport === "golf") return "Golf Courses & Practice Ranges";
    
    // Karaoke
    if (osmTags.amenity === "karaoke_box" || osmTags.leisure === "karaoke") return "Private Karaoke Rooms";
    
    // Medical/Clinic categories
    if (osmTags.amenity === "dentist" || osmTags.amenity === "dental_clinic") return "Dental Clinic";
    if (osmTags.amenity === "clinic" && (nameLower.match(/婦人|women|女性/) || osmTags.healthcare === "gynaecology")) return "Women's Clinic";
  }

  // Fallback to name matching (comprehensive)
  if (nameLower.match(/eyelash|lash|まつげ|エクステ|ラッシュ|アイラッシュ/)) return "Eyelash";
  if (nameLower.match(/美容|beauty|コスメ/)) return "Beauty Salon";
  if (nameLower.match(/ヘア|hair|カット|cut/) && !nameLower.match(/ネイル|nail/)) return "Hair Salon";
  if (nameLower.match(/理容|barber/)) return "Barbershop";
  if (nameLower.match(/ネイル|nail|マニキュア/)) return "Nail Salon";
  if (nameLower.match(/エステ|spa|massage|マッサージ|整体/)) return "Spa & Massage";
  if (nameLower.match(/ホテル|hotel|ryokan|旅館|民宿|リゾート/)) return "Hotels & Ryokan";
  if (nameLower.match(/レストラン|restaurant|居酒屋|飲食店|料理店/)) return "Restaurants & Izakaya";
  if (nameLower.match(/温泉|onsen|銭湯|サウナ|岩盤浴|日帰り温泉|天然温泉|健康ランド|スーパー銭湯/)) return "Spas, Onsen & Day-use Bathhouses";
  if (nameLower.match(/ゴルフ|golf|ゴルフ場|練習場|打ちっぱなし/)) return "Golf Courses & Practice Ranges";
  if (nameLower.match(/カラオケ|karaoke|カラオケルーム|カラオケボックス/)) return "Private Karaoke Rooms";
  if (nameLower.match(/歯科|dental|dentist|デンタル|歯医者/)) return "Dental Clinic";
  if (nameLower.match(/婦人科|women.*clinic|女性.*clinic/)) return "Women's Clinic";

  return "General Salon";
}

// ============================================================================
// SOURCE 1: JAPAN GOVERNMENT OPEN DATA
// ============================================================================

async function fetchGovernmentData(): Promise<any[]> {
  log("\n📊 Source 1: Japan Government Open Data");
  log("─".repeat(60));
  log("  ⏸️  DISABLED - Government data fetching temporarily disabled");
  log("  ℹ️  Will be enabled once dataset URLs are configured");
  
  const shops: any[] = [];
  stats.bySource["government"] = 0;
  return shops;
}

// ============================================================================
// SOURCE 2: OPENSTREETMAP (Overpass API)
// ============================================================================

// Load categories from database and map to OSM tags
async function loadCategoryOSMMappings(): Promise<Array<{ tag: string; value: string; categoryName: string }>> {
  // Fetch all categories from database
  const { data: categories, error } = await supabase
    .from("categories")
    .select("name")
    .order("name");

  if (error) {
    log(`⚠️  Error loading categories: ${error.message}`);
    // Fallback to default list if database query fails
    return getDefaultOSMMappings();
  }

  if (!categories || categories.length === 0) {
    log("⚠️  No categories found in database, using default mappings");
    return getDefaultOSMMappings();
  }

  log(`✓ Loaded ${categories.length} categories from database`);

  // Map each category to its OSM tags
  const mappings: Array<{ tag: string; value: string; categoryName: string }> = [];
  
  for (const category of categories) {
    const categoryName = category.name;
    const categoryMappings = getOSMTagsForCategory(categoryName);
    mappings.push(...categoryMappings);
  }

  return mappings;
}

// Get OSM tag mappings for a specific category
function getOSMTagsForCategory(categoryName: string): Array<{ tag: string; value: string; categoryName: string }> {
  const mappings: Array<{ tag: string; value: string; categoryName: string }> = [];

  // Map category names to OSM tags
  switch (categoryName) {
    case "Beauty Salon":
      mappings.push({ tag: "amenity", value: "beauty_salon", categoryName });
      mappings.push({ tag: "shop", value: "beauty", categoryName });
      break;
    case "Hair Salon":
      mappings.push({ tag: "shop", value: "hairdresser", categoryName });
      mappings.push({ tag: "amenity", value: "hairdresser", categoryName });
      break;
    case "Barbershop":
      mappings.push({ tag: "amenity", value: "barbershop", categoryName });
      break;
    case "Nail Salon":
      mappings.push({ tag: "amenity", value: "nail_salon", categoryName });
      mappings.push({ tag: "shop", value: "nail", categoryName });
      break;
    case "Eyelash":
      // No direct OSM tag, will be matched by name
      break;
    case "Spa & Massage":
      mappings.push({ tag: "amenity", value: "spa", categoryName });
      break;
    case "Hotels & Ryokan":
      mappings.push({ tag: "tourism", value: "hotel", categoryName });
      mappings.push({ tag: "tourism", value: "guest_house", categoryName });
      mappings.push({ tag: "tourism", value: "hostel", categoryName });
      mappings.push({ tag: "tourism", value: "resort", categoryName });
      mappings.push({ tag: "tourism", value: "ryokan", categoryName });
      break;
    case "Restaurants & Izakaya":
      mappings.push({ tag: "amenity", value: "restaurant", categoryName });
      mappings.push({ tag: "amenity", value: "cafe", categoryName });
      mappings.push({ tag: "amenity", value: "food_court", categoryName });
      break;
    case "Spas, Onsen & Day-use Bathhouses":
      mappings.push({ tag: "amenity", value: "public_bath", categoryName });
      mappings.push({ tag: "amenity", value: "bathhouse", categoryName });
      mappings.push({ tag: "leisure", value: "sauna", categoryName });
      mappings.push({ tag: "amenity", value: "hot_spring", categoryName });
      break;
    case "Golf Courses & Practice Ranges":
      mappings.push({ tag: "leisure", value: "golf_course", categoryName });
      break;
    case "Private Karaoke Rooms":
      mappings.push({ tag: "amenity", value: "karaoke_box", categoryName });
      mappings.push({ tag: "leisure", value: "karaoke", categoryName });
      break;
    case "Dental Clinic":
      mappings.push({ tag: "amenity", value: "dentist", categoryName });
      mappings.push({ tag: "amenity", value: "dental_clinic", categoryName });
      break;
    case "Women's Clinic":
      mappings.push({ tag: "amenity", value: "clinic", categoryName });
      break;
    case "General Salon":
      // Will be matched by name fallback
      break;
  }

  return mappings;
}

// Default OSM mappings if database query fails
function getDefaultOSMMappings(): Array<{ tag: string; value: string; categoryName: string }> {
  return [
    { tag: "amenity", value: "beauty_salon", categoryName: "Beauty Salon" },
    { tag: "shop", value: "beauty", categoryName: "Beauty Salon" },
    { tag: "shop", value: "hairdresser", categoryName: "Hair Salon" },
    { tag: "amenity", value: "barbershop", categoryName: "Barbershop" },
    { tag: "amenity", value: "nail_salon", categoryName: "Nail Salon" },
    { tag: "amenity", value: "spa", categoryName: "Spa & Massage" },
    { tag: "tourism", value: "hotel", categoryName: "Hotels & Ryokan" },
    { tag: "tourism", value: "guest_house", categoryName: "Hotels & Ryokan" },
    { tag: "tourism", value: "hostel", categoryName: "Hotels & Ryokan" },
    { tag: "tourism", value: "resort", categoryName: "Hotels & Ryokan" },
    { tag: "tourism", value: "ryokan", categoryName: "Hotels & Ryokan" },
    { tag: "amenity", value: "restaurant", categoryName: "Restaurants & Izakaya" },
    { tag: "amenity", value: "cafe", categoryName: "Restaurants & Izakaya" },
    { tag: "amenity", value: "public_bath", categoryName: "Spas, Onsen & Day-use Bathhouses" },
    { tag: "amenity", value: "bathhouse", categoryName: "Spas, Onsen & Day-use Bathhouses" },
    { tag: "leisure", value: "sauna", categoryName: "Spas, Onsen & Day-use Bathhouses" },
    { tag: "amenity", value: "hot_spring", categoryName: "Spas, Onsen & Day-use Bathhouses" },
    { tag: "leisure", value: "golf_course", categoryName: "Golf Courses & Practice Ranges" },
    { tag: "amenity", value: "karaoke_box", categoryName: "Private Karaoke Rooms" },
    { tag: "amenity", value: "dentist", categoryName: "Dental Clinic" },
    { tag: "amenity", value: "dental_clinic", categoryName: "Dental Clinic" },
    { tag: "amenity", value: "clinic", categoryName: "Women's Clinic" },
  ];
}

async function fetchOSMData(): Promise<any[]> {
  log("\n🗺️  Source 2: OpenStreetMap (Overpass API)");
  log("─".repeat(60));

  const shops: any[] = [];
  const checkpoint = loadCheckpoint();

  try {
    // Load category mappings from database
    const businessTypes = await loadCategoryOSMMappings();
    log(`✓ Loaded ${businessTypes.length} OSM tag mappings for all categories\n`);

    // NEW PREFECTURES TO IMPORT (excluding already-done ones)
    // Bbox format: "minLon,minLat,maxLon,maxLat"
    const prefectures = [
      { name: "Saitama", bbox: "139.0,35.7,139.9,36.2" },
      { name: "Chiba", bbox: "139.7,35.0,140.9,35.9" },
      { name: "Hyogo", bbox: "134.5,34.2,135.5,35.2" },
      { name: "Hiroshima", bbox: "132.0,34.0,133.5,34.8" },
      { name: "Miyagi", bbox: "140.5,37.7,141.5,38.7" },
      { name: "Okinawa", bbox: "127.0,24.0,130.0,26.8" },
    ];

    // Track stats by prefecture and category
    const prefectureStats: Record<string, Record<string, number>> = {};

    for (const prefecture of prefectures) {
      log(`\n📍 Processing ${prefecture.name}...`);
      prefectureStats[prefecture.name] = {};

      for (const businessType of businessTypes) {
        try {
          const checkpointKey = `${prefecture.name}::${businessType.tag}::${businessType.value}`;
          if (checkpoint.has(checkpointKey)) {
            log(`  ⏭️  Skipping ${businessType.categoryName} (${businessType.tag}=${businessType.value}) - already processed`);
            continue;
          }

          log(`  🔍 Importing ${businessType.categoryName} in ${prefecture.name}...`);

          // Overpass API query - bbox format: (south,west,north,east)
          const [minLon, minLat, maxLon, maxLat] = prefecture.bbox.split(",").map(parseFloat);
          const query = `[out:json][timeout:25];
(
  node["${businessType.tag}"="${businessType.value}"](${minLat},${minLon},${maxLat},${maxLon});
  way["${businessType.tag}"="${businessType.value}"](${minLat},${minLon},${maxLat},${maxLon});
  relation["${businessType.tag}"="${businessType.value}"](${minLat},${minLon},${maxLat},${maxLon});
);
out center meta;`;

          const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `data=${encodeURIComponent(query)}`,
          });

          if (!response.ok) {
            log(`  ⚠️  Failed to fetch ${prefecture.name} - ${businessType.categoryName}: ${response.status}`);
            await sleep(2000);
            continue;
          }

          const data = await response.json() as any;
          const elements = data.elements || [];
          const shopCount = elements.length;

          for (const element of elements) {
            const lat = element.lat || element.center?.lat;
            const lng = element.lon || element.center?.lon;

            if (!lat || !lng) continue;

            const name = element.tags?.name || element.tags?.["name:ja"] || "";
            if (!name) continue;

            shops.push({
              name: name,
              address: element.tags?.["addr:full"] || 
                      `${element.tags?.["addr:city"] || ""} ${element.tags?.["addr:street"] || ""}`.trim(),
              latitude: lat,
              longitude: lng,
              city: element.tags?.["addr:city"] || element.tags?.["addr:town"] || null,
              prefecture: prefecture.name,
              osmTags: element.tags,
              osmId: element.id,
              source: "osm",
            });
          }

          if (shopCount > 0) {
            log(`  ✓ Found ${shopCount} ${businessType.categoryName} shops in ${prefecture.name}`);
            prefectureStats[prefecture.name][businessType.categoryName] = shopCount;
          }

          checkpoint.add(checkpointKey);
          saveCheckpoint(checkpoint);

          await sleep(2000); // Rate limit: 2 sec between requests
        } catch (error: any) {
          log(`  ⚠️  Error fetching ${prefecture.name} - ${businessType.categoryName}: ${error.message}`);
        }
      }

      // Summary for this prefecture
      const prefectureTotal = Object.values(prefectureStats[prefecture.name]).reduce((a, b) => a + b, 0);
      log(`  📊 ${prefecture.name} total: ${prefectureTotal} shops found`);
    }

    log(`\n  ✓ Found ${shops.length} shops from OpenStreetMap`);
    stats.bySource["osm"] = shops.length;
  } catch (error: any) {
    log(`  ❌ Error fetching OSM Data: ${error.message}`);
  }

  return shops;
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function importBusinesses() {
  log("🚀 Starting Japan Business Importer");
  log("=".repeat(60));

  // Create backup first
  const backupFile = await createBackup();
  if (backupFile) {
    log(`✅ Backup saved: ${backupFile}\n`);
  }

  // Fetch from all sources
  log("📡 Fetching businesses from all sources...\n");

  const allShops: any[] = [];

  // Source 1: Government Data
  const govShops = await fetchGovernmentData();
  allShops.push(...govShops);

  // Source 2: OSM
  const osmShops = await fetchOSMData();
  allShops.push(...osmShops);

  stats.totalFound = allShops.length;

  log(`\n${"=".repeat(60)}`);
  log(`📊 Phase 1 Complete: Found ${allShops.length} businesses`);
  log("=".repeat(60));

  // Phase 2: Check duplicates and prepare for insert
  log("\n💾 Phase 2: Checking duplicates and preparing businesses...\n");

  const shopsToInsert: any[] = [];
  const checkpoint = loadCheckpoint();
  let processed = 0;

  for (const shop of allShops) {
    processed++;
    if (processed % 100 === 0) {
      log(`  ⏳ Processed ${processed}/${allShops.length} businesses...`);
    }

    // Validate required fields
    if (!shop.name || !shop.latitude || !shop.longitude) {
      continue;
    }

    // Check duplicate (by osm_id OR name + coordinates)
    const duplicate = await isDuplicate(shop.name, shop.latitude, shop.longitude, shop.osmId);
    if (duplicate) {
      stats.duplicates++;
      const shopKey = generateShopKey(shop.name, shop.latitude, shop.longitude);
      checkpoint.add(shopKey);
      continue;
    }

    // Categorize
    const categoryName = categorizeShop(
      shop.name,
      shop.industryCode,
      shop.osmTags
    );

    // Get or create category
    const categoryId = await getOrCreateCategoryId(categoryName);
    if (!categoryId) {
      continue;
    }

    // Prepare shop for insert
    shopsToInsert.push({
      name: shop.name,
      address: shop.address || null,
      latitude: shop.latitude,
      longitude: shop.longitude,
      city: shop.city || null,
      country: "Japan",
      zip_code: shop.zipCode || null,
      phone: shop.phone || null,
      email: shop.email || null,
      website: shop.website || null,
      category_id: categoryId,
      claim_status: "unclaimed",
      owner_user_id: null,
      osm_id: shop.osmId || null,
      unique_id: shop.source === "osm" ? `osm:${shop.osmId}` : `gov:${shop.industryCode || shop.name}`,
    });

    const shopKey = generateShopKey(shop.name, shop.latitude, shop.longitude);
    checkpoint.add(shopKey);
    stats.byCategory[categoryName] = (stats.byCategory[categoryName] || 0) + 1;
  }

  saveCheckpoint(checkpoint);

  log(`\n  ✓ ${shopsToInsert.length} businesses ready to insert (${stats.duplicates} duplicates skipped)`);

  // Phase 3: Batch insert with retry
  log("\n📦 Phase 3: Inserting businesses in batches...\n");

  const batchSize = 200;
  for (let i = 0; i < shopsToInsert.length; i += batchSize) {
    const batch = shopsToInsert.slice(i, i + batchSize);
    let retries = 0;
    let success = false;

    while (retries < 3 && !success) {
      const { error } = await supabase.from("shops").insert(batch);

      if (error) {
        retries++;
        stats.retries++;
        log(`  ⚠️  Error inserting batch ${Math.floor(i / batchSize) + 1} (attempt ${retries}/3): ${error.message}`);
        
        if (retries < 3) {
          await sleep(2000 * retries); // Exponential backoff
        } else {
          stats.errors += batch.length;
          log(`  ❌ Failed to insert batch ${Math.floor(i / batchSize) + 1} after 3 attempts`);
        }
      } else {
        success = true;
        stats.inserted += batch.length;
        log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batch.length} businesses`);
      }
    }
  }

  // Summary
  log("\n" + "=".repeat(60));
  log("📊 IMPORT SUMMARY");
  log("=".repeat(60));
  log(`Total businesses found: ${stats.totalFound}`);
  log(`Duplicates skipped: ${stats.duplicates}`);
  log(`Successfully inserted: ${stats.inserted}`);
  log(`Errors: ${stats.errors}`);
  log(`Retries: ${stats.retries}`);

  log("\nBy Source:");
  for (const [source, count] of Object.entries(stats.bySource)) {
    log(`  ${source}: ${count}`);
  }

  log("\nBy Category:");
  for (const [category, count] of Object.entries(stats.byCategory)) {
    log(`  ${category}: ${count}`);
  }

  log("\n✅ Import complete!");

  // Get final count
  const { count: finalCount } = await supabase
    .from("shops")
    .select("id", { count: "exact", head: true });

  log("\n" + "=".repeat(60));
  log("📊 FINAL SUMMARY");
  log("=".repeat(60));
  log(`Successfully inserted: ${stats.inserted}`);
  log(`Duplicates skipped: ${stats.duplicates}`);
  log(`Total shops in database: ${finalCount || 0}`);
  log(`📝 Log file: ${LOG_FILE}`);
}

// Run
importBusinesses()
  .then(() => {
    log("\n🎉 Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Fatal error: ${error}`);
    console.error(error);
    process.exit(1);
  });


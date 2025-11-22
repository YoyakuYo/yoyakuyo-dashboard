// apps/api/src/scripts/importJapanShopsMultiSource.ts
// Multi-source shop importer for Japan using FREE APIs
// Sources: Japan Government Open Data, Japan Tourism API, Hot Pepper Beauty API, OpenStreetMap (fallback)

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import * as fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// File paths
const DATA_DIR = path.resolve(__dirname, "../../data");
const BACKUP_FILE = path.resolve(DATA_DIR, "shops_multisource_backup.json");
const CHECKPOINT_FILE = path.resolve(__dirname, "../../multisource_checkpoint.json");

// Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// API Keys (optional - some sources don't require keys)
const JAPAN_TOURISM_API_KEY = process.env.JAPAN_TOURISM_API_KEY || "";
const HOT_PEPPER_BEAUTY_API_KEY = process.env.HOT_PEPPER_BEAUTY_API_KEY || "";

// Statistics
const stats = {
  totalFound: 0,
  duplicates: 0,
  inserted: 0,
  errors: 0,
  bySource: {} as Record<string, number>,
  byCategory: {} as Record<string, number>,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    console.warn("⚠️  Could not load checkpoint, starting fresh");
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
    console.warn("⚠️  Could not save checkpoint:", error);
  }
}

// Save backup
function saveBackup(shops: Map<string, any>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const shopsArray = Array.from(shops.values());
    const backup = {
      shops: shopsArray,
      count: shopsArray.length,
      timestamp: new Date().toISOString(),
      sources: Object.keys(stats.bySource),
    };

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
    console.log(`💾 Saved ${shops.size} shops to backup: ${BACKUP_FILE}`);
  } catch (error) {
    console.warn("⚠️  Could not save backup:", error);
  }
}

// Load backup
function loadBackup(): Map<string, any> | null {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, "utf-8");
      const data = JSON.parse(content);
      const shopsMap = new Map<string, any>();
      if (Array.isArray(data.shops)) {
        for (const shop of data.shops) {
          if (shop.unique_id) {
            shopsMap.set(shop.unique_id, shop);
          }
        }
      }
      console.log(`📂 Loaded ${shopsMap.size} shops from backup`);
      return shopsMap;
    }
  } catch (error) {
    console.warn("⚠️  Could not load backup:", error);
  }
  return null;
}

// Generate unique_id from source and external ID
function generateUniqueId(source: string, externalId: string): string {
  return `${source}:${externalId}`;
}

// Normalize shop data from different sources
function normalizeShop(data: any, source: string): any | null {
  try {
    const uniqueId = generateUniqueId(source, data.id || data.external_id || data.osm_id || "");
    if (!uniqueId || uniqueId === `${source}:`) {
      return null; // Skip if no valid ID
    }

    return {
      unique_id: uniqueId,
      name: data.name || data.店舗名 || data.施設名 || data.title || "",
      address: data.address || data.住所 || data.address || "",
      latitude: parseFloat(data.latitude || data.lat || data.緯度 || data.y || ""),
      longitude: parseFloat(data.longitude || data.lon || data.経度 || data.x || ""),
      city: data.city || data.市区町村 || data.city_name || null,
      country: "Japan",
      zip_code: data.zip_code || data.郵便番号 || data.postal_code || null,
      phone: data.phone || data.電話番号 || data.tel || null,
      email: data.email || "",
      website: data.website || data.url || data.ホームページ || null,
      category: categorizeShop(data.name || data.店舗名 || "", data.address || ""),
      source: source,
      external_id: data.id || data.external_id || data.osm_id || null,
    };
  } catch (error) {
    console.warn(`⚠️  Error normalizing shop from ${source}:`, error);
    return null;
  }
}

// Auto-categorize shop (reuse logic from OSM script)
function categorizeShop(name: string, address: string): string {
  const nameLower = name.toLowerCase();
  const addressLower = (address || "").toLowerCase();
  const combined = `${nameLower} ${addressLower}`;

  // Exclude non-booking businesses
  if (combined.match(/コンビニ|konbini|convenience store|supermarket|grocery store/i) &&
      !combined.match(/スーパー銭湯|super.*sento/i)) {
    return "Unknown";
  }

  // Categories (most specific first)
  if (combined.match(/karaoke|カラオケ/)) return "Private Karaoke Rooms";
  if (combined.match(/golf|ゴルフ/)) return "Golf Courses & Practice Ranges";
  if (combined.match(/onsen|温泉|銭湯|サウナ|hot spring|bathhouse/)) return "Spas, Onsen & Day-use Bathhouses";
  if (combined.match(/hotel|ryokan|inn|resort|ホテル|旅館|民宿/)) return "Hotels & Ryokan";
  if (combined.match(/restaurant|izakaya|dining|レストラン|居酒屋|飲食店/)) return "Restaurants & Izakaya";
  if (combined.match(/eyelash|lash|まつげ/)) return "Eyelash";
  if (combined.match(/nail|ネイル/)) return "Nail Salon";
  if (combined.match(/barber|理髪|理容/)) return "Barbershop";
  if (combined.match(/spa|massage|エステ|マッサージ|整体/)) return "Spa & Massage";
  if (combined.match(/hair|ヘア|美容室|カット/)) return "Hair Salon";
  if (combined.match(/beauty|cosmetic|美容|コスメ/)) return "Beauty Salon";

  return "Unknown";
}

// Check for duplicate by unique_id
async function isDuplicate(uniqueId: string): Promise<boolean> {
  if (!uniqueId) return false;

  const { data } = await supabase
    .from("shops")
    .select("id")
    .eq("unique_id", uniqueId)
    .maybeSingle();

  return !!data;
}

// Get or create category by name
async function getOrCreateCategoryId(categoryName: string): Promise<string | null> {
  // Check cache first
  const cache = (getOrCreateCategoryId as any).cache || {};
  if (cache[categoryName]) {
    return cache[categoryName];
  }

  // Try to get existing category
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

  // Create missing category
  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert([{ name: categoryName, description: `Auto-created during multi-source import` }])
    .select("id")
    .single();

  if (error) {
    // Race condition - try fetching again
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
    console.warn(`⚠️  Could not create category "${categoryName}":`, error.message);
    return null;
  }

  if (newCategory) {
    cache[categoryName] = newCategory.id;
    (getOrCreateCategoryId as any).cache = cache;
    console.log(`  ✓ Created category: "${categoryName}"`);
    return newCategory.id;
  }

  return null;
}

// ============================================================================
// SOURCE 1: JAPAN GOVERNMENT OPEN DATA
// ============================================================================

async function fetchJapanGovernmentData(): Promise<any[]> {
  console.log("\n📊 Source 1: Japan Government Open Data");
  console.log("─".repeat(60));

  const shops: any[] = [];
  const checkpoint = loadCheckpoint();

  try {
    // Japan Government Open Data Portal (data.go.jp)
    // Service Industry Value Chain Innovation Platform
    // Example endpoint (adjust based on actual available datasets)
    const baseUrl = "https://www.data.go.jp/data/dataset/";
    
    // Note: Actual endpoint depends on available datasets
    // This is a template - you'll need to find the actual dataset URL
    console.log("  ℹ️  Government data requires manual dataset discovery");
    console.log("  ℹ️  Visit: https://www.data.go.jp/");
    console.log("  ℹ️  Search for: サービス産業, 美容院, サロン, 宿泊施設");
    
    // Example: If you find a CSV/JSON dataset, fetch it here
    // const response = await fetch(baseUrl + "dataset-id");
    // const data = await response.json();
    // Process and normalize data...

    console.log(`  ✓ Found ${shops.length} shops from Government Data`);
    stats.bySource["government"] = shops.length;
  } catch (error: any) {
    console.error("  ❌ Error fetching Government Data:", error.message);
  }

  return shops;
}

// ============================================================================
// SOURCE 2: JAPAN TOURISM API (JNTO)
// ============================================================================

async function fetchJapanTourismData(): Promise<any[]> {
  console.log("\n🏯 Source 2: Japan Tourism API (JNTO)");
  console.log("─".repeat(60));

  const shops: any[] = [];

  if (!JAPAN_TOURISM_API_KEY) {
    console.log("  ⚠️  JAPAN_TOURISM_API_KEY not set - skipping");
    console.log("  ℹ️  Get free API key: https://www.jnto.go.jp/");
    return shops;
  }

  try {
    // JNTO API endpoint (example - adjust based on actual API)
    const baseUrl = "https://api.jnto.go.jp/";
    const endpoint = "tourism/facilities"; // Adjust endpoint

    // Fetch in batches (respect rate limits)
    const prefectures = [
      "tokyo", "osaka", "kyoto", "hokkaido", "okinawa", "kanagawa",
      "aichi", "fukuoka", "hiroshima", "sendai", "nagoya", "yokohama"
    ];

    for (const prefecture of prefectures) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}?prefecture=${prefecture}&key=${JAPAN_TOURISM_API_KEY}`, {
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          console.warn(`  ⚠️  Failed to fetch ${prefecture}: ${response.status}`);
          continue;
        }

        const data = await response.json() as any;
        // Process data based on actual API response structure
        // const facilities = data.facilities || data.data || [];
        // for (const facility of facilities) {
        //   shops.push(normalizeShop(facility, "tourism"));
        // }

        await sleep(1000); // Rate limit: 1 req/sec
      } catch (error: any) {
        console.warn(`  ⚠️  Error fetching ${prefecture}:`, error.message);
      }
    }

    console.log(`  ✓ Found ${shops.length} shops from Tourism API`);
    stats.bySource["tourism"] = shops.length;
  } catch (error: any) {
    console.error("  ❌ Error fetching Tourism Data:", error.message);
  }

  return shops;
}

// ============================================================================
// SOURCE 3: HOT PEPPER BEAUTY API
// ============================================================================

async function fetchHotPepperBeautyData(): Promise<any[]> {
  console.log("\n💅 Source 3: Hot Pepper Beauty API");
  console.log("─".repeat(60));

  const shops: any[] = [];

  if (!HOT_PEPPER_BEAUTY_API_KEY) {
    console.log("  ⚠️  HOT_PEPPER_BEAUTY_API_KEY not set - skipping");
    console.log("  ℹ️  Get free API key: https://webservice.recruit.co.jp/");
    return shops;
  }

  try {
    // Hot Pepper Beauty API (Recruit)
    const baseUrl = "https://webservice.recruit.co.jp/beauty/v1/";
    const endpoint = "salon";

    // Major areas in Japan
    const areas = [
      "AREA110", // Tokyo
      "AREA120", // Kanagawa
      "AREA130", // Saitama
      "AREA140", // Chiba
      "AREA270", // Osaka
      "AREA260", // Kyoto
      "AREA230", // Aichi
      "AREA400", // Fukuoka
    ];

    let page = 1;
    const perPage = 100;
    let hasMore = true;

    for (const area of areas) {
      page = 1;
      hasMore = true;

      while (hasMore) {
        try {
          const params = new URLSearchParams({
            key: HOT_PEPPER_BEAUTY_API_KEY,
            area: area,
            count: perPage.toString(),
            start: ((page - 1) * perPage + 1).toString(),
            format: "json",
          });

          const response = await fetch(`${baseUrl}${endpoint}?${params.toString()}`);

          if (!response.ok) {
            console.warn(`  ⚠️  Failed to fetch ${area} page ${page}: ${response.status}`);
            hasMore = false;
            continue;
          }

          const data = await response.json() as any;
          const results = data.results?.shop || [];

          for (const shop of results) {
            const normalized = normalizeShop({
              id: shop.id,
              name: shop.name,
              address: shop.address,
              lat: shop.lat,
              lng: shop.lng,
              tel: shop.tel,
              url: shop.urls?.pc,
            }, "hotpepper");
            if (normalized) shops.push(normalized);
          }

          hasMore = results.length === perPage;
          page++;

          await sleep(1000); // Rate limit: 1 req/sec
        } catch (error: any) {
          console.warn(`  ⚠️  Error fetching ${area} page ${page}:`, error.message);
          hasMore = false;
        }
      }
    }

    console.log(`  ✓ Found ${shops.length} shops from Hot Pepper Beauty`);
    stats.bySource["hotpepper"] = shops.length;
  } catch (error: any) {
    console.error("  ❌ Error fetching Hot Pepper Data:", error.message);
  }

  return shops;
}

// ============================================================================
// SOURCE 4: OPENSTREETMAP (FALLBACK)
// ============================================================================

async function fetchOSMData(): Promise<any[]> {
  console.log("\n🗺️  Source 4: OpenStreetMap (Fallback)");
  console.log("─".repeat(60));

  const shops: any[] = [];

  try {
    // Use existing OSM import logic as fallback
    // For now, return empty - can integrate existing OSM script here
    console.log("  ℹ️  OSM import available via importJapanShopsOSM.ts");
    console.log("  ℹ️  Run that script separately for OSM data");

    stats.bySource["osm"] = shops.length;
  } catch (error: any) {
    console.error("  ❌ Error fetching OSM Data:", error.message);
  }

  return shops;
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function importMultiSource() {
  console.log("🚀 Starting Multi-Source Shop Importer for Japan\n");
  console.log("=".repeat(60));

  // Check if backup exists
  const existingBackup = loadBackup();
  if (existingBackup && existingBackup.size > 0) {
    console.log(`📂 Found existing backup with ${existingBackup.size} shops`);
    console.log("  ℹ️  Delete backup file to re-fetch from APIs\n");
  }

  const allShops = new Map<string, any>();
  const checkpoint = loadCheckpoint();

  // Fetch from all sources
  console.log("📡 Fetching shops from multiple sources...\n");

  // Source 1: Government Data
  const govShops = await fetchJapanGovernmentData();
  for (const shop of govShops) {
    if (shop.unique_id) {
      allShops.set(shop.unique_id, shop);
    }
  }

  // Source 2: Tourism API
  const tourismShops = await fetchJapanTourismData();
  for (const shop of tourismShops) {
    if (shop.unique_id) {
      allShops.set(shop.unique_id, shop);
    }
  }

  // Source 3: Hot Pepper Beauty
  const hotpepperShops = await fetchHotPepperBeautyData();
  for (const shop of hotpepperShops) {
    if (shop.unique_id) {
      allShops.set(shop.unique_id, shop);
    }
  }

  // Source 4: OSM (fallback)
  const osmShops = await fetchOSMData();
  for (const shop of osmShops) {
    if (shop.unique_id) {
      allShops.set(shop.unique_id, shop);
    }
  }

  stats.totalFound = allShops.size;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 Phase 1 Complete: Found ${allShops.size} unique shops`);
  console.log("=".repeat(60));

  // Save backup
  saveBackup(allShops);

  // Phase 2: Check duplicates and prepare for insert
  console.log("\n💾 Phase 2: Checking duplicates and preparing shops...\n");

  const shopsToInsert: any[] = [];
  let processed = 0;

  for (const [uniqueId, shop] of allShops.entries()) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`  ⏳ Processed ${processed}/${allShops.size} shops...`);
    }

    // Check duplicate
    const duplicate = await isDuplicate(uniqueId);
    if (duplicate) {
      stats.duplicates++;
      continue;
    }

    // Skip Unknown category
    if (shop.category === "Unknown") {
      continue;
    }

    // Get or create category
    const categoryId = await getOrCreateCategoryId(shop.category);
    if (!categoryId) {
      console.warn(`⚠️  Skipping shop "${shop.name}" - could not resolve category`);
      continue;
    }

    shopsToInsert.push({
      name: shop.name,
      address: shop.address,
      latitude: shop.latitude,
      longitude: shop.longitude,
      city: shop.city,
      country: shop.country,
      zip_code: shop.zip_code,
      phone: shop.phone,
      email: shop.email,
      website: shop.website,
      category_id: categoryId,
      claim_status: "unclaimed",
      owner_user_id: null, // Scraped shops have no owner
      unique_id: shop.unique_id,
      osm_id: shop.source === "osm" ? shop.external_id : null,
    });

    stats.byCategory[shop.category] = (stats.byCategory[shop.category] || 0) + 1;
  }

  console.log(`\n  ✓ ${shopsToInsert.length} shops ready to insert (${stats.duplicates} duplicates skipped)`);

  // Phase 3: Batch insert
  console.log("\n📦 Phase 3: Inserting shops in batches...\n");

  const batchSize = 100;
  for (let i = 0; i < shopsToInsert.length; i += batchSize) {
    const batch = shopsToInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("shops").insert(batch);

    if (error) {
      console.error(`  ❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      stats.errors += batch.length;
    } else {
      stats.inserted += batch.length;
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batch.length} shops`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 IMPORT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total shops found: ${stats.totalFound}`);
  console.log(`Duplicates skipped: ${stats.duplicates}`);
  console.log(`Successfully inserted: ${stats.inserted}`);
  console.log(`Errors: ${stats.errors}`);

  console.log("\nBy Source:");
  for (const [source, count] of Object.entries(stats.bySource)) {
    console.log(`  ${source}: ${count}`);
  }

  console.log("\nBy Category:");
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${category}: ${count}`);
  }

  console.log("\n✅ Multi-source import complete!");
}

// Run
importMultiSource()
  .then(() => {
    console.log("\n🎉 Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });


// apps/api/src/scripts/importFromBackup.ts
// Import shops from local backup JSON file into Supabase
// This script reads shops_backup.json and inserts missing shops

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import * as fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Backup file path
const BACKUP_FILE = path.resolve(__dirname, "../../data/shops_backup.json");

// Statistics
const stats = {
  totalInBackup: 0,
  duplicates: 0,
  inserted: 0,
  errors: 0,
  byCategory: {} as Record<string, number>,
};

// Check for duplicate shop by osm_id (primary check)
async function isDuplicate(osmId: string): Promise<boolean> {
  if (!osmId) return false;
  
  const { data } = await supabase
    .from("shops")
    .select("id")
    .eq("osm_id", osmId.toString())
    .maybeSingle();
  
  return !!data;
}

// Get or create category by name
async function getOrCreateCategoryId(categoryName: string): Promise<string | null> {
  // First, try to get existing category
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .maybeSingle();
  
  if (existing) {
    return existing.id;
  }
  
  // Create missing category
  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert([{ name: categoryName, description: `Auto-created during backup import` }])
    .select("id")
    .single();
  
  if (error) {
    // If insert fails, try fetching again (race condition)
    const { data: retry } = await supabase
      .from("categories")
      .select("id")
      .eq("name", categoryName)
      .maybeSingle();
    
    if (retry) {
      return retry.id;
    }
    
    console.warn(`⚠️  Could not create category "${categoryName}":`, error.message);
    return null;
  }
  
  if (newCategory) {
    console.log(`  ✓ Created category: "${categoryName}"`);
    return newCategory.id;
  }
  
  return null;
}

// Load backup file
function loadBackup(): any[] {
  try {
    if (!fs.existsSync(BACKUP_FILE)) {
      console.error(`❌ Backup file not found: ${BACKUP_FILE}`);
      console.error("   Please run importJapanShopsOSM.ts first to create the backup.");
      process.exit(1);
    }
    
    const fileContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.shops || !Array.isArray(data.shops)) {
      console.error("❌ Invalid backup file format. Expected { shops: [...] }");
      process.exit(1);
    }
    
    console.log(`📂 Loaded ${data.shops.length} shops from backup file`);
    console.log(`   File: ${BACKUP_FILE}`);
    console.log(`   Saved: ${data.timestamp || 'unknown'}`);
    
    return data.shops;
  } catch (error: any) {
    console.error("❌ Error loading backup file:", error.message);
    process.exit(1);
  }
}

// Main import function
async function importFromBackup() {
  console.log("🚀 Starting Shop Import from Backup\n");
  console.log("=".repeat(60));
  
  // Load shops from backup
  const shops = loadBackup();
  stats.totalInBackup = shops.length;
  
  console.log(`\n📊 Processing ${shops.length} shops from backup...\n`);
  
  // Get all existing categories
  const categoryMap = new Map<string, string>();
  const { data: categories } = await supabase.from("categories").select("id, name");
  if (categories) {
    for (const cat of categories) {
      categoryMap.set(cat.name, cat.id);
    }
  }
  
  const shopsToInsert: any[] = [];
  let processed = 0;
  
  // Phase 1: Check duplicates and prepare shops
  console.log("💾 Phase 1: Checking duplicates and preparing shops...\n");
  
  for (const shop of shops) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`  ⏳ Processed ${processed}/${shops.length} shops...`);
    }
    
    // Check duplicate by osm_id
    if (shop.osm_id) {
      const duplicate = await isDuplicate(shop.osm_id);
      if (duplicate) {
        stats.duplicates++;
        continue;
      }
    }
    
    // Skip shops with "Unknown" category
    const categoryName = shop.category || "Unknown";
    if (categoryName === "Unknown") {
      continue;
    }
    
    // Get or create category ID
    let categoryId = categoryMap.get(categoryName);
    if (!categoryId) {
      categoryId = await getOrCreateCategoryId(categoryName) || null;
      if (categoryId) {
        categoryMap.set(categoryName, categoryId);
      }
    }
    
    if (!categoryId) {
      console.warn(`⚠️  Skipping shop "${shop.name}" - could not resolve category "${categoryName}"`);
      continue;
    }
    
    shopsToInsert.push({
      name: shop.name,
      address: shop.address || null,
      latitude: shop.latitude || null,
      longitude: shop.longitude || null,
      city: shop.city || null,
      country: shop.country || "Japan",
      zip_code: shop.zip_code || null,
      phone: shop.phone || null,
      email: shop.email || null,
      website: shop.website || null,
      category_id: categoryId,
      claim_status: "unclaimed",
      osm_id: shop.osm_id || null,
    });
    
    // Track by category
    stats.byCategory[categoryName] = (stats.byCategory[categoryName] || 0) + 1;
  }
  
  console.log(`\n  ✓ ${shopsToInsert.length} shops ready to insert (${stats.duplicates} duplicates skipped)`);
  
  // Phase 2: Batch insert
  console.log("\n📦 Phase 2: Inserting shops in batches...\n");
  
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
  console.log(`Total shops in backup: ${stats.totalInBackup}`);
  console.log(`Duplicates skipped: ${stats.duplicates}`);
  console.log(`Successfully inserted: ${stats.inserted}`);
  console.log(`Errors: ${stats.errors}`);
  
  console.log("\nBy Category:");
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${category}: ${count}`);
  }
  
  console.log("\n✅ Import from backup complete!");
}

// Run
importFromBackup()
  .then(() => {
    console.log("\n🎉 Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });


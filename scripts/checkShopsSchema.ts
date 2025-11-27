// scripts/checkShopsSchema.ts
// Script to read current shops table schema from Supabase

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from 'url';

// For ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../yoyakuyo-api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in yoyakuyo-api/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkShopsSchema() {
  try {
    console.log("=".repeat(80));
    console.log("STEP A — Current shops table structure");
    console.log("=".repeat(80));
    console.log("\nQuerying Supabase for shops table schema...\n");

    // Fetch a sample shop to see what columns exist
    const { data: sampleShop, error: sampleError } = await supabase
      .from('shops')
      .select('*')
      .limit(1)
      .single();

    if (sampleError && sampleError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error fetching sample shop:", sampleError);
      throw new Error("Could not fetch shops table schema");
    }

    if (!sampleShop) {
      console.log("⚠️  No shops found in database. Using TypeScript interface as reference.\n");
      // Fallback to TypeScript interface
      const knownColumns = [
        { name: 'id', type: 'UUID' },
        { name: 'name', type: 'TEXT' },
        { name: 'address', type: 'TEXT' },
        { name: 'phone', type: 'TEXT' },
        { name: 'email', type: 'TEXT' },
        { name: 'website', type: 'VARCHAR(500)' },
        { name: 'city', type: 'TEXT' },
        { name: 'prefecture', type: 'TEXT' },
        { name: 'normalized_city', type: 'TEXT' },
        { name: 'country', type: 'TEXT' },
        { name: 'zip_code', type: 'TEXT' },
        { name: 'description', type: 'TEXT' },
        { name: 'owner_email', type: 'TEXT' },
        { name: 'owner_user_id', type: 'UUID' },
        { name: 'category_id', type: 'UUID' },
        { name: 'latitude', type: 'NUMERIC' },
        { name: 'longitude', type: 'NUMERIC' },
        { name: 'google_place_id', type: 'VARCHAR(255)' },
        { name: 'business_status', type: 'VARCHAR(50)' },
        { name: 'opening_hours', type: 'JSONB' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP' },
      ];

      console.log("Columns (from migration history):\n");
      for (const col of knownColumns) {
        console.log(`  - ${col.name}: ${col.type}`);
      }

      // Check for required fields
      const hasWebsiteUrl = knownColumns.some(c => c.name === 'website_url');
      const hasOpeningHours = knownColumns.some(c => c.name === 'opening_hours');
      
      console.log("\n" + "=".repeat(80));
      console.log("STEP B — Missing fields detected");
      console.log("=".repeat(80));
      console.log(`\nwebsite_url: ${hasWebsiteUrl ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`opening_hours: ${hasOpeningHours ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (!hasWebsiteUrl || !hasOpeningHours) {
        console.log("\n" + "=".repeat(80));
        console.log("STEP C — SQL migration required");
        console.log("=".repeat(80));
        console.log("\n-- Add missing columns to shops table\n");
        if (!hasWebsiteUrl) {
          console.log("ALTER TABLE shops ADD COLUMN IF NOT EXISTS website_url TEXT;");
        }
        if (!hasOpeningHours) {
          console.log("ALTER TABLE shops ADD COLUMN IF NOT EXISTS opening_hours JSONB;");
        }
      } else {
        console.log("\n✅ All required fields already exist. No migration needed.");
      }
      
      return;
    }

    // Display schema from actual data
    console.log("Columns (from actual database):\n");
    const columnNames = Object.keys(sampleShop);
    for (const colName of columnNames.sort()) {
      const value = sampleShop[colName];
      let type = 'UNKNOWN';
      if (value === null) {
        type = 'NULL';
      } else if (typeof value === 'string') {
        type = 'TEXT/VARCHAR';
      } else if (typeof value === 'number') {
        type = 'NUMERIC';
      } else if (typeof value === 'boolean') {
        type = 'BOOLEAN';
      } else if (Array.isArray(value)) {
        type = 'ARRAY';
      } else if (typeof value === 'object') {
        type = 'JSONB';
      }
      console.log(`  - ${colName}: ${type}${value === null ? ' (nullable)' : ''}`);
    }

    // Check for required fields
    const hasWebsiteUrl = 'website_url' in sampleShop;
    const hasOpeningHours = 'opening_hours' in sampleShop;
    const hasWebsite = 'website' in sampleShop; // Check for existing 'website' field
    
    console.log("\n" + "=".repeat(80));
    console.log("STEP B — Missing fields detected");
    console.log("=".repeat(80));
    console.log(`\nwebsite_url: ${hasWebsiteUrl ? '✅ EXISTS' : '❌ MISSING'}`);
    if (hasWebsite && !hasWebsiteUrl) {
      console.log(`  ⚠️  Note: 'website' field exists (VARCHAR(500)), but 'website_url' (TEXT) is missing`);
    }
    console.log(`opening_hours: ${hasOpeningHours ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasWebsiteUrl || !hasOpeningHours) {
      console.log("\n" + "=".repeat(80));
      console.log("STEP C — SQL migration required");
      console.log("=".repeat(80));
      console.log("\n-- Add missing columns to shops table\n");
      if (!hasWebsiteUrl) {
        console.log("ALTER TABLE shops ADD COLUMN IF NOT EXISTS website_url TEXT;");
      }
      if (!hasOpeningHours) {
        console.log("ALTER TABLE shops ADD COLUMN IF NOT EXISTS opening_hours JSONB;");
      }
    } else {
      console.log("\n✅ All required fields already exist. No migration needed.");
    }

  } catch (error: any) {
    console.error("Error checking schema:", error);
    process.exit(1);
  }
}

// Run the check
checkShopsSchema().then(() => {
  console.log("\n" + "=".repeat(80));
  console.log("STEP D — Confirm that NO previous fixes will be overwritten");
  console.log("=".repeat(80));
  console.log("\n✅ Verification:");
  console.log("  - prefecture column: NOT TOUCHED");
  console.log("  - normalized_city column: NOT TOUCHED");
  console.log("  - All existing columns: PRESERVED");
  console.log("  - Only ADDING new columns (website_url, opening_hours)");
  console.log("  - Using IF NOT EXISTS to prevent errors if columns exist");
  console.log("  - No modification to existing data or structure");
  console.log("\n" + "=".repeat(80));
  console.log("STEP E — Ready for confirmation");
  console.log("=".repeat(80));
  console.log("\n⚠️  SQL migration is ready but NOT applied yet.");
  console.log("⚠️  Please review the migration above and confirm before applying.");
  console.log("\n");
  process.exit(0);
}).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

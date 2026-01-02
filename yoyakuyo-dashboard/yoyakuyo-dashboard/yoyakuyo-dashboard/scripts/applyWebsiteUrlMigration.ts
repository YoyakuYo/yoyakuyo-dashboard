// scripts/applyWebsiteUrlMigration.ts
// Script to apply the website_url migration to Supabase

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from 'url';
import * as fs from "fs";

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

async function applyMigration() {
  try {
    console.log("=".repeat(80));
    console.log("Applying website_url migration to shops table");
    console.log("=".repeat(80));
    console.log("\n");

    // Read the migration SQL
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/add_website_url_to_shops.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log("Migration SQL to execute:");
    console.log("-".repeat(80));
    console.log(migrationSQL);
    console.log("-".repeat(80));
    console.log("\n");

    // Execute the migration using Supabase REST API
    // Since Supabase JS client doesn't support raw SQL directly, we'll use a workaround
    // First, check if column exists
    const { data: sampleShop } = await supabase
      .from('shops')
      .select('website_url')
      .limit(1)
      .single();

    if (sampleShop && 'website_url' in sampleShop) {
      console.log("✅ Column 'website_url' already exists. Migration may have already been applied.");
      console.log("   (This is safe - IF NOT EXISTS prevents errors)");
    } else {
      console.log("⚠️  Column 'website_url' not found. Attempting to add it...");
      console.log("   Note: Supabase JS client doesn't support ALTER TABLE directly.");
      console.log("   Please apply the migration manually via Supabase Dashboard SQL Editor.");
      console.log("\n");
      console.log("To apply manually:");
      console.log("1. Go to Supabase Dashboard → SQL Editor");
      console.log("2. Paste the SQL from the migration file");
      console.log("3. Click 'Run'");
      console.log("\n");
      console.log("Or use Supabase CLI:");
      console.log("  supabase db push");
      console.log("\n");
      
      // Try to use RPC if available (some Supabase instances have exec_sql function)
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
          sql: migrationSQL
        });
        
        if (rpcError) {
          throw rpcError;
        }
        
        console.log("✅ Migration applied successfully via RPC!");
      } catch (rpcErr: any) {
        if (rpcErr.message?.includes('function') || rpcErr.message?.includes('does not exist')) {
          console.log("ℹ️  RPC function not available. Manual application required.");
        } else {
          throw rpcErr;
        }
      }
    }

    // Verify the column was added
    console.log("\n" + "=".repeat(80));
    console.log("Verifying migration...");
    console.log("=".repeat(80));
    
    const { data: verifyShop, error: verifyError } = await supabase
      .from('shops')
      .select('website_url')
      .limit(1)
      .single();

    if (verifyError && verifyError.code === 'PGRST116') {
      console.log("⚠️  No shops found in database. Cannot verify column exists.");
    } else if (verifyError && verifyError.message?.includes('website_url')) {
      console.log("❌ Column 'website_url' not found. Migration may need to be applied manually.");
    } else if (verifyShop && 'website_url' in verifyShop) {
      console.log("✅ SUCCESS! Column 'website_url' now exists in shops table.");
      console.log(`   Sample value: ${verifyShop.website_url || '(null)'}`);
    } else {
      console.log("⚠️  Could not verify column. Please check manually in Supabase Dashboard.");
    }

  } catch (error: any) {
    console.error("\n❌ Error applying migration:", error);
    console.error("\nPlease apply the migration manually via Supabase Dashboard SQL Editor.");
    console.error("Migration file: supabase/migrations/add_website_url_to_shops.sql");
    process.exit(1);
  }
}

// Run the migration
applyMigration().then(() => {
  console.log("\n" + "=".repeat(80));
  console.log("Migration process complete");
  console.log("=".repeat(80));
  console.log("\n");
  process.exit(0);
}).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


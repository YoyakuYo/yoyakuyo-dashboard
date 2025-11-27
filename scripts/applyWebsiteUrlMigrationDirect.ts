// scripts/applyWebsiteUrlMigrationDirect.ts
// Script to apply the website_url migration using Supabase REST API

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

async function applyMigration() {
  try {
    console.log("=".repeat(80));
    console.log("Applying website_url migration to shops table");
    console.log("=".repeat(80));
    console.log("\n");

    // Read the migration SQL
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/add_website_url_to_shops.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Extract just the ALTER TABLE statement (remove comments for cleaner execution)
    const alterTableSQL = migrationSQL
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    console.log("Executing SQL:");
    console.log("-".repeat(80));
    console.log(alterTableSQL);
    console.log("-".repeat(80));
    console.log("\n");

    // Use Supabase REST API to execute SQL
    // Supabase provides a REST endpoint for executing SQL via the Management API
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      throw new Error("Could not extract project reference from SUPABASE_URL");
    }

    // Try using Supabase Management API
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    
    console.log("Attempting to apply migration via Supabase Management API...\n");

    const response = await fetch(managementApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: alterTableSQL
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("⚠️  Management API approach not available or failed.");
      console.log("   Error:", errorText);
      console.log("\n");
      console.log("Please apply the migration manually:");
      console.log("1. Go to Supabase Dashboard → SQL Editor");
      console.log("2. Paste this SQL:");
      console.log("\n" + alterTableSQL + "\n");
      console.log("3. Click 'Run'");
      console.log("\n");
      console.log("Or use Supabase CLI:");
      console.log("  supabase db push");
      return;
    }

    const result = await response.json();
    console.log("✅ Migration applied successfully!");
    console.log("Result:", result);

    // Verify the column was added
    console.log("\n" + "=".repeat(80));
    console.log("Verifying migration...");
    console.log("=".repeat(80));
    
    // Use a simple query to check if column exists
    const verifyUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'website_url';"
      }),
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      if (verifyData && verifyData.length > 0) {
        console.log("✅ SUCCESS! Column 'website_url' verified in shops table.");
      } else {
        console.log("⚠️  Column verification inconclusive. Please check manually.");
      }
    } else {
      console.log("⚠️  Could not verify column automatically. Please check in Supabase Dashboard.");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("\nThe Supabase JS client doesn't support ALTER TABLE directly.");
    console.error("Please apply the migration manually via Supabase Dashboard SQL Editor.");
    console.error("\nMigration file: supabase/migrations/add_website_url_to_shops.sql");
    console.error("\nSQL to execute:");
    console.log("\nALTER TABLE shops ADD COLUMN IF NOT EXISTS website_url TEXT;");
    console.log("COMMENT ON COLUMN shops.website_url IS 'Website URL from Google Places API enrichment (TEXT type for flexibility)';");
  }
}

// Run the migration
applyMigration().then(() => {
  console.log("\n" + "=".repeat(80));
  console.log("Migration process complete");
  console.log("=".repeat(80));
  process.exit(0);
}).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


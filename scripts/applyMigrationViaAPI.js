// scripts/applyMigrationViaAPI.js
// Apply migration using Supabase Management API

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../yoyakuyo-api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

// Extract project reference
const projectMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!projectMatch) {
  console.error("Error: Could not extract project reference from SUPABASE_URL");
  process.exit(1);
}

const projectRef = projectMatch[1];

// SQL to execute
const sql = `ALTER TABLE shops ADD COLUMN IF NOT EXISTS website_url TEXT;
COMMENT ON COLUMN shops.website_url IS 'Website URL from Google Places API enrichment (TEXT type for flexibility)';`;

console.log("=".repeat(80));
console.log("Applying website_url migration via Supabase");
console.log("=".repeat(80));
console.log("\nSQL:");
console.log(sql);
console.log("\n");

// Use Supabase REST API to execute SQL via a stored procedure or direct execution
// Since direct SQL execution isn't available via REST, we'll use the PostgREST approach
// by creating a temporary function, or use the Supabase Dashboard URL

// For now, provide the Dashboard URL and instructions
const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

console.log("⚠️  Supabase REST API doesn't support direct ALTER TABLE execution.");
console.log("   This is a security feature to prevent unauthorized schema changes.");
console.log("\n");
console.log("✅ Migration file created: supabase/migrations/add_website_url_to_shops.sql");
console.log("\n");
console.log("To apply the migration, choose one of these methods:");
console.log("\n");
console.log("METHOD 1 - Supabase Dashboard (Recommended):");
console.log(`1. Open: ${dashboardUrl}`);
console.log("2. Paste this SQL:");
console.log("\n" + sql + "\n");
console.log("3. Click 'Run'");
console.log("\n");
console.log("METHOD 2 - Supabase CLI:");
console.log("  cd supabase");
console.log("  supabase db push");
console.log("\n");
console.log("METHOD 3 - psql (if you have direct database access):");
console.log("  psql <your-connection-string> -f supabase/migrations/add_website_url_to_shops.sql");
console.log("\n");

// Try to verify current state
const verifyUrl = new URL(`${supabaseUrl}/rest/v1/shops?select=id,website_url&limit=1`);
const verifyOptions = {
  method: 'GET',
  headers: {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Prefer': 'return=representation',
  }
};

console.log("Checking current schema...\n");

const req = https.request(verifyUrl, verifyOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        if (result && result.length > 0) {
          if ('website_url' in result[0]) {
            console.log("✅ Column 'website_url' already exists!");
            console.log("   Migration may have already been applied.");
          } else {
            console.log("❌ Column 'website_url' not found.");
            console.log("   Please apply the migration using one of the methods above.");
          }
        }
      } catch (e) {
        // Check error message
        if (data.includes('column') && data.includes('website_url')) {
          console.log("❌ Column 'website_url' not found.");
          console.log("   Please apply the migration using one of the methods above.");
        } else {
          console.log("⚠️  Could not automatically verify column status.");
        }
      }
    } else {
      // Parse error to see if it's about missing column
      try {
        const error = JSON.parse(data);
        if (error.message && error.message.includes('website_url')) {
          console.log("❌ Column 'website_url' not found.");
          console.log("   Please apply the migration using one of the methods above.");
        } else {
          console.log("⚠️  Status:", res.statusCode);
          console.log("   Please verify manually in Supabase Dashboard.");
        }
      } catch (e) {
        console.log("⚠️  Could not verify automatically.");
      }
    }
    console.log("\n" + "=".repeat(80));
    console.log("Migration ready to apply");
    console.log("=".repeat(80));
  });
});

req.on('error', (error) => {
  console.log("⚠️  Could not verify column status automatically.");
  console.log("   Please apply the migration and verify in Supabase Dashboard.");
});

req.end();


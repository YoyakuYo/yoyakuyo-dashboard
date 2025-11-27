// scripts/applyMigration.js
// Simple Node.js script to apply the website_url migration

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

// Read migration SQL
const migrationPath = path.resolve(__dirname, '../supabase/migrations/add_website_url_to_shops.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

// Extract just the ALTER TABLE statement
const alterTableSQL = migrationSQL
  .split('\n')
  .filter(line => line.trim() && !line.trim().startsWith('--'))
  .join('\n')
  .trim();

console.log("=".repeat(80));
console.log("Applying website_url migration");
console.log("=".repeat(80));
console.log("\nSQL to execute:");
console.log(alterTableSQL);
console.log("\n");

// Since Supabase doesn't allow direct SQL execution via REST API for security,
// we'll provide clear instructions for manual application
console.log("⚠️  Supabase requires manual SQL execution for security reasons.");
console.log("\nTo apply this migration:");
console.log("\n1. Go to: https://supabase.com/dashboard/project/" + projectRef + "/sql/new");
console.log("2. Paste this SQL:");
console.log("\n" + alterTableSQL + "\n");
console.log("3. Click 'Run'");
console.log("\nAlternatively, if you have Supabase CLI installed:");
console.log("  supabase db push");
console.log("\n");

// Try to verify if column exists (to check if already applied)
const verifyUrl = new URL(`${supabaseUrl}/rest/v1/shops?select=website_url&limit=1`);
const verifyOptions = {
  method: 'GET',
  headers: {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
  }
};

const req = https.request(verifyUrl, verifyOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        if (result && result.length > 0 && 'website_url' in result[0]) {
          console.log("✅ Column 'website_url' already exists! Migration may have been applied.");
        } else {
          console.log("❌ Column 'website_url' not found. Please apply the migration manually.");
        }
      } catch (e) {
        if (data.includes('website_url')) {
          console.log("✅ Column 'website_url' appears to exist!");
        } else {
          console.log("⚠️  Could not verify column status automatically.");
        }
      }
    } else if (res.statusCode === 400 && data.includes('website_url')) {
      console.log("❌ Column 'website_url' not found. Please apply the migration.");
    } else {
      console.log("⚠️  Could not verify column status. Please check manually.");
    }
  });
});

req.on('error', (error) => {
  console.log("⚠️  Could not verify column status automatically.");
  console.log("   Please apply the migration manually and verify in Supabase Dashboard.");
});

req.end();


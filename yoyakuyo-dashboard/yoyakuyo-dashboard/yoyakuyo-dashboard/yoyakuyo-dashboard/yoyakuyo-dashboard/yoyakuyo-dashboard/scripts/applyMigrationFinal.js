// scripts/applyMigrationFinal.js
// Apply migration using Supabase Management API

const https = require('https');
require('dotenv').config({ path: require('path').resolve(__dirname, '../yoyakuyo-api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

// Extract project reference
const projectMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!projectMatch) {
  console.error("Error: Could not extract project reference");
  process.exit(1);
}

const projectRef = projectMatch[1];

// SQL to execute
const sql = `ALTER TABLE shops ADD COLUMN IF NOT EXISTS website_url TEXT;
COMMENT ON COLUMN shops.website_url IS 'Website URL from Google Places API enrichment (TEXT type for flexibility)';`;

console.log("=".repeat(80));
console.log("Applying website_url migration via Supabase Management API");
console.log("=".repeat(80));
console.log("\nSQL:");
console.log(sql);
console.log("\n");

// Use Supabase Management API
// Note: This requires the Management API access token, not the service role key
// For security, Supabase doesn't allow direct SQL execution via REST API
// We'll need to use the Dashboard or create a database function

// Try to use Supabase's SQL execution endpoint (if available)
const sqlUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

const postData = JSON.stringify({ sql: sql });

const options = {
  hostname: `${projectRef}.supabase.co`,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }
};

console.log("Attempting to execute SQL via Supabase REST API...\n");

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log("✅ Migration applied successfully!");
      console.log("Response:", data);
    } else if (res.statusCode === 404) {
      console.log("⚠️  SQL execution endpoint not available.");
      console.log("   This is normal - Supabase doesn't allow direct SQL execution via REST API.");
      console.log("\n");
      console.log("✅ Migration file created: supabase/migrations/add_website_url_to_shops.sql");
      console.log("\n");
      console.log("Please apply manually via Supabase Dashboard:");
      console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
      console.log("2. Paste the SQL above");
      console.log("3. Click 'Run'");
    } else {
      console.log("⚠️  Status:", res.statusCode);
      console.log("Response:", data);
      console.log("\n");
      console.log("Migration file ready. Please apply via Supabase Dashboard.");
    }
    
    // Verify
    console.log("\n" + "=".repeat(80));
    console.log("Verifying migration...");
    console.log("=".repeat(80));
    
    const verifyOptions = {
      hostname: `${projectRef}.supabase.co`,
      path: '/rest/v1/shops?select=website_url&limit=1',
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    };
    
    const verifyReq = https.request(verifyOptions, (verifyRes) => {
      let verifyData = '';
      verifyRes.on('data', (chunk) => { verifyData += chunk; });
      verifyRes.on('end', () => {
        if (verifyRes.statusCode === 200) {
          try {
            const result = JSON.parse(verifyData);
            if (result && result.length > 0 && 'website_url' in result[0]) {
              console.log("✅ SUCCESS! Column 'website_url' now exists!");
            } else {
              console.log("⚠️  Column verification inconclusive.");
            }
          } catch (e) {
            console.log("⚠️  Could not parse verification response.");
          }
        } else if (verifyRes.statusCode === 400) {
          const error = JSON.parse(verifyData);
          if (error.message && error.message.includes('website_url')) {
            console.log("❌ Column 'website_url' not found yet.");
            console.log("   Please apply the migration via Supabase Dashboard.");
          }
        }
      });
    });
    
    verifyReq.on('error', () => {
      console.log("⚠️  Could not verify automatically.");
    });
    
    verifyReq.end();
  });
});

req.on('error', (error) => {
  console.log("⚠️  Could not execute SQL directly (this is expected).");
  console.log("   Supabase requires manual SQL execution for security.");
  console.log("\n");
  console.log("✅ Migration file ready: supabase/migrations/add_website_url_to_shops.sql");
  console.log("\n");
  console.log("Please apply via Supabase Dashboard:");
  console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log("2. Paste this SQL:");
  console.log("\n" + sql + "\n");
  console.log("3. Click 'Run'");
});

req.write(postData);
req.end();


// Script to check how many shops were inserted during the import
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../yoyakuyo-api/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in yoyakuyo-api/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkImportResults() {
  console.log("🔍 Checking Import Results...\n");
  console.log("=".repeat(60));

  try {
    // 1. Total shop count
    const { count: totalCount, error: totalError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;
    console.log(`\n📊 Total Shops in Database: ${totalCount || 0}`);

    // 2. Shops created in the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const yesterdayISO = yesterday.toISOString();

    const { count: recentCount, error: recentError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterdayISO);

    if (!recentError) {
      console.log(`\n🆕 Shops Created in Last 24 Hours: ${recentCount || 0}`);
    }

    // 3. Shops created in the last hour (very recent)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const oneHourAgoISO = oneHourAgo.toISOString();

    const { count: veryRecentCount, error: veryRecentError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneHourAgoISO);

    if (!veryRecentError) {
      console.log(`\n⚡ Shops Created in Last Hour: ${veryRecentCount || 0}`);
    }

    // 4. Shops by source (Google Places, OSM, etc.)
    const { data: shopsBySource, error: sourceError } = await supabase
      .from("shops")
      .select("google_place_id, osm_id, government_id");

    if (!sourceError && shopsBySource) {
      const sourceCounts = {
        google_places: 0,
        osm: 0,
        government: 0,
        unknown: 0
      };

      shopsBySource.forEach((shop) => {
        if (shop.google_place_id) {
          sourceCounts.google_places++;
        } else if (shop.osm_id) {
          sourceCounts.osm++;
        } else if (shop.government_id) {
          sourceCounts.government++;
        } else {
          sourceCounts.unknown++;
        }
      });

      console.log("\n📦 Shops by Source:");
      console.log(`   Google Places: ${sourceCounts.google_places}`);
      console.log(`   OpenStreetMap (OSM): ${sourceCounts.osm}`);
      console.log(`   Government Data: ${sourceCounts.government}`);
      console.log(`   Unknown/Other: ${sourceCounts.unknown}`);
    }

    // 5. Get most recent shops (last 10)
    const { data: recentShops, error: recentShopsError } = await supabase
      .from("shops")
      .select("id, name, created_at, google_place_id, osm_id")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentShopsError && recentShops && recentShops.length > 0) {
      console.log("\n🕐 Most Recent Shops (Last 10):");
      recentShops.forEach((shop, index) => {
        const source = shop.google_place_id ? "Google" : shop.osm_id ? "OSM" : "Unknown";
        const date = new Date(shop.created_at).toLocaleString();
        console.log(`   ${index + 1}. ${shop.name} (${source}) - ${date}`);
      });
    }

    // 6. Summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 SUMMARY:");
    console.log("=".repeat(60));
    console.log(`Total Shops: ${totalCount || 0}`);
    if (!recentError) {
      console.log(`Shops Created in Last 24 Hours: ${recentCount || 0}`);
    }
    if (!veryRecentError) {
      console.log(`Shops Created in Last Hour: ${veryRecentCount || 0}`);
    }
    console.log("=".repeat(60));
    console.log("\n✅ Check complete!");

  } catch (error) {
    console.error("❌ Error checking import results:", error.message);
    process.exit(1);
  }
}

checkImportResults();


// Quick script to check shop stats for enrichment
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: require("path").join(__dirname, "../yoyakuyo-api/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStats() {
  const { count: total, error: totalError } = await supabase
    .from("shops")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    console.error("Error:", totalError);
    process.exit(1);
  }

  const { data: shops, error } = await supabase
    .from("shops")
    .select("id, google_place_id, website, phone, opening_hours")
    .limit(1000);

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  const withPlaceId = shops.filter(s => s.google_place_id).length;
  const withoutPlaceId = shops.length - withPlaceId;
  const hasWebsite = shops.filter(s => s.website || s.website_url).length;
  const hasPhone = shops.filter(s => s.phone).length;
  const hasOpeningHours = shops.filter(s => s.opening_hours).length;

  console.log("📊 Shop Enrichment Statistics");
  console.log("=".repeat(60));
  console.log(`Total shops: ${total || 0}`);
  console.log(`\nSample of 1000 shops:`);
  console.log(`  With Google Place ID: ${withPlaceId} (${((withPlaceId/1000)*100).toFixed(1)}%)`);
  console.log(`  Without Place ID: ${withoutPlaceId} (${((withoutPlaceId/1000)*100).toFixed(1)}%)`);
  console.log(`\nCurrent data completeness:`);
  console.log(`  Has website: ${hasWebsite} (${((hasWebsite/1000)*100).toFixed(1)}%)`);
  console.log(`  Has phone: ${hasPhone} (${((hasPhone/1000)*100).toFixed(1)}%)`);
  console.log(`  Has opening hours: ${hasOpeningHours} (${((hasOpeningHours/1000)*100).toFixed(1)}%)`);

  // Calculate time estimates
  const GOOGLE_PLACES_DELAY_MS = 200; // 5 requests/second
  const estimatedWithId = (withPlaceId * GOOGLE_PLACES_DELAY_MS) / 1000; // 1 request per shop
  const estimatedWithoutId = (withoutPlaceId * GOOGLE_PLACES_DELAY_MS * 2) / 1000; // 2 requests (search + details)
  const totalSeconds = estimatedWithId + estimatedWithoutId;
  const totalMinutes = Math.ceil(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Scale to full dataset
  const scaleFactor = (total || 0) / 1000;
  const scaledMinutes = Math.ceil(totalMinutes * scaleFactor);
  const scaledHours = Math.floor(scaledMinutes / 60);
  const scaledRemainingMins = scaledMinutes % 60;

  console.log(`\n⏱️  Time Estimates (for ${total || 0} shops):`);
  console.log(`  Minimum time: ~${scaledMinutes} minutes`);
  if (scaledHours > 0) {
    console.log(`  (${scaledHours}h ${scaledRemainingMins}m)`);
  }
  console.log(`  With overhead/retries: ~${Math.ceil(scaledMinutes * 1.2)} minutes`);
  console.log(`  API requests needed: ~${Math.ceil((withPlaceId + withoutPlaceId * 2) * scaleFactor)}`);
  console.log("=".repeat(60));
}

checkStats().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });


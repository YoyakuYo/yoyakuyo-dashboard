// Check how many shops have google_place_id
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../yoyakuyo-api/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPlaceIds() {
  console.log("🔍 Checking shop Google Place ID statistics...\n");
  
  // Get total count
  const { count: total, error: totalError } = await supabase
    .from("shops")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    console.error("❌ Error:", totalError);
    process.exit(1);
  }

  // Get count with place_id
  const { count: withPlaceId, error: withIdError } = await supabase
    .from("shops")
    .select("*", { count: "exact", head: true })
    .not("google_place_id", "is", null);

  if (withIdError) {
    console.error("❌ Error:", withIdError);
    process.exit(1);
  }

  // Get count without place_id
  const { count: withoutPlaceId, error: withoutIdError } = await supabase
    .from("shops")
    .select("*", { count: "exact", head: true })
    .is("google_place_id", null);

  if (withoutIdError) {
    console.error("❌ Error:", withoutIdError);
    process.exit(1);
  }

  // Get sample data to check completeness
  const { data: sample, error: sampleError } = await supabase
    .from("shops")
    .select("id, google_place_id, website, website_url, phone, opening_hours, latitude, longitude")
    .limit(1000);

  if (sampleError) {
    console.error("❌ Error:", sampleError);
    process.exit(1);
  }

  const hasWebsite = sample.filter(s => s.website || s.website_url).length;
  const hasPhone = sample.filter(s => s.phone).length;
  const hasOpeningHours = sample.filter(s => s.opening_hours).length;
  const hasCoordinates = sample.filter(s => s.latitude && s.longitude).length;

  console.log("=".repeat(60));
  console.log("📊 SHOP STATISTICS");
  console.log("=".repeat(60));
  console.log(`\nTotal shops: ${total || 0}`);
  console.log(`\nGoogle Place ID Status:`);
  console.log(`  ✅ With Place ID: ${withPlaceId || 0} (${((withPlaceId / total) * 100).toFixed(1)}%)`);
  console.log(`  ❌ Without Place ID: ${withoutPlaceId || 0} (${((withoutPlaceId / total) * 100).toFixed(1)}%)`);
  
  console.log(`\nData Completeness (sample of 1000):`);
  console.log(`  📍 Has coordinates: ${hasCoordinates} (${((hasCoordinates/1000)*100).toFixed(1)}%)`);
  console.log(`  🌐 Has website: ${hasWebsite} (${((hasWebsite/1000)*100).toFixed(1)}%)`);
  console.log(`  📞 Has phone: ${hasPhone} (${((hasPhone/1000)*100).toFixed(1)}%)`);
  console.log(`  🕐 Has opening hours: ${hasOpeningHours} (${((hasOpeningHours/1000)*100).toFixed(1)}%)`);

  // Calculate time estimates
  const GOOGLE_PLACES_DELAY_MS = 200; // 5 requests/second
  
  // Shops with place_id: 1 request per shop (Place Details)
  const timeWithId = ((withPlaceId || 0) * GOOGLE_PLACES_DELAY_MS) / 1000; // seconds
  const minutesWithId = Math.ceil(timeWithId / 60);
  
  // Shops without place_id: 2 requests per shop (Search + Place Details)
  const timeWithoutId = ((withoutPlaceId || 0) * GOOGLE_PLACES_DELAY_MS * 2) / 1000; // seconds
  const minutesWithoutId = Math.ceil(timeWithoutId / 60);
  
  const totalSeconds = timeWithId + timeWithoutId;
  const totalMinutes = Math.ceil(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  const totalRequests = (withPlaceId || 0) + ((withoutPlaceId || 0) * 2);
  const estimatedWithOverhead = Math.ceil(totalMinutes * 1.2); // 20% overhead for retries/errors

  console.log(`\n⏱️  ENRICHMENT TIME ESTIMATES`);
  console.log("=".repeat(60));
  console.log(`Shops with Place ID (${withPlaceId || 0}):`);
  console.log(`  Time: ~${minutesWithId} minutes`);
  console.log(`  Requests: ${withPlaceId || 0} (1 per shop)`);
  
  console.log(`\nShops without Place ID (${withoutPlaceId || 0}):`);
  console.log(`  Time: ~${minutesWithoutId} minutes`);
  console.log(`  Requests: ${(withoutPlaceId || 0) * 2} (2 per shop: search + details)`);
  
  console.log(`\n📊 TOTAL ESTIMATE:`);
  console.log(`  Total API requests: ${totalRequests}`);
  if (totalHours > 0) {
    console.log(`  Minimum time: ~${totalMinutes} minutes (${totalHours}h ${remainingMinutes}m)`);
  } else {
    console.log(`  Minimum time: ~${totalMinutes} minutes`);
  }
  console.log(`  With overhead/retries: ~${estimatedWithOverhead} minutes`);
  if (estimatedWithOverhead > 60) {
    const hours = Math.floor(estimatedWithOverhead / 60);
    const mins = estimatedWithOverhead % 60;
    console.log(`  (${hours}h ${mins}m)`);
  }
  console.log("=".repeat(60));
  
  // Recommendation
  console.log(`\n💡 RECOMMENDATION:`);
  if ((withoutPlaceId || 0) > (withPlaceId || 0)) {
    console.log(`  Most shops need place_id lookup (search + details)`);
    console.log(`  Consider running overnight or in batches`);
  } else {
    console.log(`  Most shops have place_id (faster enrichment)`);
    console.log(`  Can run during business hours`);
  }
  console.log("");
}

checkPlaceIds()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });


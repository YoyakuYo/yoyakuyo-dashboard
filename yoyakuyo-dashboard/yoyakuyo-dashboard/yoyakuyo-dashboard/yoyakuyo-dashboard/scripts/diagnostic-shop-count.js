// Diagnostic script to count shops in the database
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: require("path").join(__dirname, "../apps/api/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in apps/api/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runDiagnostic() {
  console.log("🔍 Running Shop Count Diagnostic...\n");
  console.log("=".repeat(60));

  try {
    // 1. Total shop count
    const { count: totalCount, error: totalError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;
    console.log(`\n📊 Total Shops: ${totalCount || 0}`);

    // 2. Shops by claim_status
    const { data: claimStatusData, error: claimError } = await supabase
      .from("shops")
      .select("claim_status");

    if (!claimError && claimStatusData) {
      const statusCounts = {};
      claimStatusData.forEach((shop) => {
        const status = shop.claim_status || "null";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log("\n📋 Shops by Claim Status:");
      Object.entries(statusCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`);
        });
    }

    // 3. Visible shops (not hidden)
    const { count: visibleCount, error: visibleError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true })
      .or("claim_status.is.null,claim_status.neq.hidden");

    if (!visibleError) {
      console.log(`\n👁️  Visible Shops (not hidden): ${visibleCount || 0}`);
    }

    // 4. Shops with owner vs unclaimed
    const { count: claimedCount, error: claimedError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true })
      .not("owner_user_id", "is", null);

    const { count: unclaimedCount, error: unclaimedError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true })
      .is("owner_user_id", null);

    if (!claimedError && !unclaimedError) {
      console.log("\n👤 Ownership Status:");
      console.log(`   Claimed: ${claimedCount || 0}`);
      console.log(`   Unclaimed: ${unclaimedCount || 0}`);
    }

    // 5. Shops by category
    const { count: categorizedCount, error: categorizedError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true })
      .not("category_id", "is", null);

    const { count: uncategorizedCount, error: uncategorizedError } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true })
      .is("category_id", null);

    if (!categorizedError && !uncategorizedError) {
      console.log("\n🏷️  Category Status:");
      console.log(`   Categorized: ${categorizedCount || 0}`);
      console.log(`   Uncategorized: ${uncategorizedCount || 0}`);
    }

    // 6. Get category breakdown
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name");

    if (!catError && categories) {
      console.log("\n📂 Shops by Category:");
      for (const category of categories) {
        const { count, error } = await supabase
          .from("shops")
          .select("*", { count: "exact", head: true })
          .eq("category_id", category.id);
        if (!error) {
          console.log(`   ${category.name}: ${count || 0}`);
        }
      }
    }

    // 7. Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📈 SUMMARY:");
    console.log("=".repeat(60));
    console.log(`Total Shops: ${totalCount || 0}`);
    console.log(`Visible Shops: ${visibleCount || 0}`);
    if (!claimedError && !unclaimedError) {
      console.log(`Claimed: ${claimedCount || 0}`);
      console.log(`Unclaimed: ${unclaimedCount || 0}`);
    }
    if (!categorizedError && !uncategorizedError) {
      console.log(`Categorized: ${categorizedCount || 0}`);
      console.log(`Uncategorized: ${uncategorizedCount || 0}`);
    }
    console.log("=".repeat(60));
    console.log("\n✅ Diagnostic complete!");

  } catch (error) {
    console.error("❌ Error running diagnostic:", error.message);
    process.exit(1);
  }
}

runDiagnostic();


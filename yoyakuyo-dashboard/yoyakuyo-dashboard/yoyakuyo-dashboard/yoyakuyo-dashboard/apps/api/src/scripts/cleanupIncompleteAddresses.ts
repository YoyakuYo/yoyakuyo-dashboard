import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Japanese major city names (common incomplete addresses)
const JAPANESE_CITY_NAMES = [
  '大阪市', '京都市', '横浜市', '名古屋市', '福岡市', 
  '札幌市', '仙台市', '神戸市', '広島市', '北九州市',
  'さいたま市', '千葉市', '堺市', '新潟市', '静岡市'
];

// Single digit/character addresses
const SINGLE_CHAR_ADDRESSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

interface ShopWithIssue {
  id: string;
  name: string;
  address: string;
  issue_type: string;
  prefecture?: string;
  city?: string;
  claim_status?: string;
  is_verified?: boolean;
  created_at?: string;
}

/**
 * Identify the type of address issue
 */
function identifyAddressIssue(address: string): string | null {
  const trimmed = address.trim();
  
  // Too short (3 characters or less)
  if (trimmed.length <= 3) {
    return 'too_short';
  }
  
  // Numbers only
  if (/^[0-9]+$/.test(trimmed)) {
    return 'numbers_only';
  }
  
  // Starts with number only (like "1 横浜市")
  if (/^[0-9]+\s/.test(trimmed)) {
    return 'starts_with_number';
  }
  
  // City name only
  if (JAPANESE_CITY_NAMES.includes(trimmed)) {
    return 'city_name_only';
  }
  
  // Single character addresses
  if (SINGLE_CHAR_ADDRESSES.includes(trimmed)) {
    return 'single_char';
  }
  
  return null;
}

/**
 * Find all shops with incomplete addresses
 */
async function findShopsWithIncompleteAddresses(): Promise<ShopWithIssue[]> {
  console.log("🔍 Finding shops with incomplete addresses...");
  
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;
  const shopsWithIssues: ShopWithIssue[] = [];
  
  while (hasMore) {
    const { data: shops, error } = await supabaseAdmin
      .from("shops")
      .select("id, name, address, prefecture, city, claim_status, is_verified, created_at")
      .not("address", "is", null)
      .neq("address", "")
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error(`❌ Error fetching shops at offset ${offset}:`, error.message);
      break;
    }
    
    if (!shops || shops.length === 0) {
      hasMore = false;
      break;
    }
    
    for (const shop of shops) {
      const issueType = identifyAddressIssue(shop.address);
      if (issueType) {
        shopsWithIssues.push({
          id: shop.id,
          name: shop.name || 'N/A',
          address: shop.address,
          issue_type: issueType,
          prefecture: shop.prefecture,
          city: shop.city,
          claim_status: shop.claim_status,
          is_verified: shop.is_verified,
          created_at: shop.created_at,
        });
      }
    }
    
    offset += batchSize;
    hasMore = shops.length === batchSize;
    
    if (offset % 10000 === 0) {
      console.log(`  Processed ${offset} shops, found ${shopsWithIssues.length} with issues...`);
    }
  }
  
  return shopsWithIssues;
}

/**
 * Group shops by issue type
 */
function groupByIssueType(shops: ShopWithIssue[]): Record<string, ShopWithIssue[]> {
  const grouped: Record<string, ShopWithIssue[]> = {};
  
  for (const shop of shops) {
    if (!grouped[shop.issue_type]) {
      grouped[shop.issue_type] = [];
    }
    grouped[shop.issue_type].push(shop);
  }
  
  return grouped;
}

/**
 * Mark shops as hidden (soft delete) instead of hard delete
 */
async function markShopsAsHidden(shopIds: string[], dryRun: boolean = true): Promise<void> {
  if (dryRun) {
    console.log(`\n🔍 DRY RUN: Would mark ${shopIds.length} shops as hidden`);
    return;
  }
  
  console.log(`\n🗑️  Marking ${shopIds.length} shops as hidden...`);
  
  const batchSize = 100;
  for (let i = 0; i < shopIds.length; i += batchSize) {
    const batch = shopIds.slice(i, i + batchSize);
    
    const { error } = await supabaseAdmin
      .from("shops")
      .update({ claim_status: 'hidden' })
      .in("id", batch);
    
    if (error) {
      console.error(`❌ Error marking batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`  ✅ Marked batch ${i / batchSize + 1} (${batch.length} shops)`);
    }
  }
}

/**
 * Main cleanup function
 */
async function cleanupIncompleteAddresses(options: {
  dryRun?: boolean;
  markAsHidden?: boolean;
  issueTypes?: string[];
}) {
  const {
    dryRun = true,
    markAsHidden = false,
    issueTypes = ['too_short', 'numbers_only', 'single_char', 'city_name_only', 'starts_with_number']
  } = options;
  
  console.log("🚀 Starting cleanup of incomplete addresses...");
  console.log(`   Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`   Mark as Hidden: ${markAsHidden ? 'YES' : 'NO'}`);
  console.log(`   Issue Types: ${issueTypes.join(', ')}\n`);
  
  // Find all shops with issues
  const shopsWithIssues = await findShopsWithIncompleteAddresses();
  console.log(`\n📊 Found ${shopsWithIssues.length} shops with incomplete addresses\n`);
  
  // Group by issue type
  const grouped = groupByIssueType(shopsWithIssues);
  
  // Print summary
  console.log("📋 Summary by Issue Type:");
  console.log("=" .repeat(50));
  for (const [issueType, shops] of Object.entries(grouped)) {
    console.log(`  ${issueType}: ${shops.length} shops`);
  }
  console.log("=" .repeat(50));
  
  // Filter by selected issue types
  const shopsToProcess = shopsWithIssues.filter(shop => 
    issueTypes.includes(shop.issue_type)
  );
  
  console.log(`\n🎯 Shops to process: ${shopsToProcess.length}`);
  
  // Show sample shops
  console.log("\n📝 Sample shops (first 10):");
  shopsToProcess.slice(0, 10).forEach((shop, index) => {
    console.log(`  ${index + 1}. [${shop.issue_type}] ${shop.name} - "${shop.address}"`);
  });
  
  if (shopsToProcess.length > 10) {
    console.log(`  ... and ${shopsToProcess.length - 10} more`);
  }
  
  // Mark as hidden if requested
  if (markAsHidden && shopsToProcess.length > 0) {
    const shopIds = shopsToProcess.map(s => s.id);
    await markShopsAsHidden(shopIds, dryRun);
    
    if (!dryRun) {
      console.log(`\n✅ Cleanup complete! ${shopIds.length} shops marked as hidden.`);
    } else {
      console.log(`\n💡 Run with dryRun=false to actually mark shops as hidden.`);
    }
  }
  
  // Export to CSV format for review
  console.log("\n📄 Sample data (first 5 shops):");
  console.log("ID,Name,Address,Issue Type,Prefecture,City,Claim Status,Is Verified");
  shopsToProcess.slice(0, 5).forEach(shop => {
    console.log(`${shop.id},"${shop.name}","${shop.address}",${shop.issue_type},${shop.prefecture || 'N/A'},${shop.city || 'N/A'},${shop.claim_status || 'N/A'},${shop.is_verified || false}`);
  });
}

// Run the cleanup
(async () => {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const markAsHidden = args.includes('--mark-hidden');
  const issueTypes = args.includes('--all-issues') 
    ? ['too_short', 'numbers_only', 'single_char', 'city_name_only', 'starts_with_number']
    : ['too_short', 'numbers_only', 'single_char', 'starts_with_number']; // Default: includes most common issues

  if (!dryRun) {
    console.log("⚠️  WARNING: This will modify the database!");
    console.log("   Press Ctrl+C within 5 seconds to cancel...\n");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    await cleanupIncompleteAddresses({
      dryRun,
      markAsHidden,
      issueTypes,
    });
  } catch (error) {
    console.error("Error running cleanup:", error);
    process.exit(1);
  }
})();


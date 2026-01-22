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

/**
 * Extract city from address using patterns
 */
function extractCityFromAddress(address: string): string | null {
  if (!address || address.trim() === '') return null;
  
  const trimmed = address.trim();
  
  // Pattern 1: "X区", "X市", "X町", "X村" (Japanese city suffixes)
  const japanesePattern = /([^\s,，]+)[区市町村]/;
  const japaneseMatch = trimmed.match(japanesePattern);
  if (japaneseMatch && japaneseMatch[1]) {
    return japaneseMatch[1].trim();
  }
  
  // Pattern 2: "X-ku", "X-shi", "X ku", "X shi" (Romanized)
  const romanizedPattern = /([^\s,，]+)[-\s](ku|shi|city|ward|区|市|町|村)/i;
  const romanizedMatch = trimmed.match(romanizedPattern);
  if (romanizedMatch && romanizedMatch[1]) {
    return romanizedMatch[1].trim();
  }
  
  // Pattern 3: Common Japanese city names in address
  const cityPatterns = [
    /(東京|tokyo)/i,
    /(大阪|osaka)/i,
    /(横浜|yokohama)/i,
    /(名古屋|nagoya)/i,
    /(京都|kyoto)/i,
    /(神戸|kobe)/i,
    /(福岡|fukuoka)/i,
    /(札幌|sapporo)/i,
    /(仙台|sendai)/i,
    /(広島|hiroshima)/i,
  ];
  
  for (const pattern of cityPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Pattern 4: Get first meaningful word (fallback)
  const words = trimmed.split(/[,\s，]+/).filter(w => w.length > 1 && !/^\d+$/.test(w));
  if (words.length > 0) {
    // Skip common prefixes
    const skipWords = ['日本', 'japan', 'jp', '〒', '1', '2', '3', '4', '5'];
    for (const word of words) {
      if (!skipWords.includes(word.toLowerCase())) {
        return word.trim();
      }
    }
  }
  
  return null;
}

/**
 * Main function to populate missing city data
 */
async function populateMissingCityData(options: {
  dryRun?: boolean;
  useNormalizedCity?: boolean;
  extractFromAddress?: boolean;
}) {
  const {
    dryRun = true,
    useNormalizedCity = true,
    extractFromAddress = true,
  } = options;
  
  console.log("🚀 Starting population of missing city data...");
  console.log(`   Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`   Use normalized_city: ${useNormalizedCity ? 'YES' : 'NO'}`);
  console.log(`   Extract from address: ${extractFromAddress ? 'YES' : 'NO'}\n`);
  
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;
  let totalProcessed = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  const updateStats = {
    fromNormalizedCity: 0,
    fromAddress: 0,
    alreadyHasCity: 0,
    cannotExtract: 0,
  };
  
  while (hasMore) {
    // Fetch all shops and filter for those without city
    // We'll process in batches but need to filter in memory
    const { data: allShops, error: fetchError } = await supabaseAdmin
      .from("shops")
      .select("id, name, address, city, normalized_city, prefecture")
      .range(offset, offset + batchSize - 1);
    
    if (fetchError) {
      console.error(`❌ Error fetching shops at offset ${offset}:`, fetchError.message);
      errorCount++;
      break;
    }
    
    if (!allShops || allShops.length === 0) {
      hasMore = false;
      break;
    }
    
    // Filter shops that need city data
    const shops = allShops.filter(shop => 
      !shop.city || shop.city.trim() === ''
    );
    
    // If no shops need updating in this batch, continue to next batch
    if (shops.length === 0) {
      offset += batchSize;
      hasMore = allShops.length === batchSize;
      continue;
    }
    
    for (const shop of shops) {
      totalProcessed++;
      
      // Skip if already has city
      if (shop.city && shop.city.trim() !== '') {
        updateStats.alreadyHasCity++;
        skippedCount++;
        continue;
      }
      
      let newCity: string | null = null;
      let source = '';
      
      // Strategy 1: Use normalized_city if available
      if (useNormalizedCity && shop.normalized_city && shop.normalized_city.trim() !== '') {
        newCity = shop.normalized_city.trim();
        source = 'normalized_city';
        updateStats.fromNormalizedCity++;
      }
      // Strategy 2: Extract from address
      else if (extractFromAddress && shop.address && shop.address.trim() !== '') {
        const extracted = extractCityFromAddress(shop.address);
        if (extracted) {
          newCity = extracted;
          source = 'address';
          updateStats.fromAddress++;
        } else {
          updateStats.cannotExtract++;
        }
      } else {
        updateStats.cannotExtract++;
      }
      
      // Update shop if we found a city
      if (newCity && !dryRun) {
        const { error: updateError } = await supabaseAdmin
          .from("shops")
          .update({ city: newCity })
          .eq("id", shop.id);
        
        if (updateError) {
          console.error(`❌ Error updating shop ${shop.id}:`, updateError.message);
          errorCount++;
        } else {
          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`  ✅ Updated ${updatedCount} shops...`);
          }
        }
      } else if (newCity && dryRun) {
        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`  🔍 Would update ${updatedCount} shops...`);
        }
      }
    }
    
    offset += batchSize;
    hasMore = allShops && allShops.length === batchSize;
    
    if (offset % 10000 === 0) {
      console.log(`  Processed ${offset} shops, updated ${updatedCount}...`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total shops processed: ${totalProcessed}`);
  console.log(`Shops already have city: ${updateStats.alreadyHasCity}`);
  console.log(`Shops updated: ${updatedCount}`);
  console.log(`Shops skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log("\nUpdate Sources:");
  console.log(`  From normalized_city: ${updateStats.fromNormalizedCity}`);
  console.log(`  From address extraction: ${updateStats.fromAddress}`);
  console.log(`  Cannot extract: ${updateStats.cannotExtract}`);
  
  if (dryRun) {
    console.log("\n💡 Run with --execute to actually update the database.");
  } else {
    console.log(`\n✅ Successfully updated ${updatedCount} shops with city data!`);
  }
}

// Run the script
(async () => {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const useNormalizedCity = !args.includes('--no-normalized-city');
  const extractFromAddress = !args.includes('--no-extract-address');

  if (!dryRun) {
    console.log("⚠️  WARNING: This will modify the database!");
    console.log("   Press Ctrl+C within 5 seconds to cancel...\n");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    await populateMissingCityData({
      dryRun,
      useNormalizedCity,
      extractFromAddress,
    });
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  }
})();


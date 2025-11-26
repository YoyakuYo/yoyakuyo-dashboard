// scripts/cleanupShops.ts
// Shop database cleanup script - identifies invalid shops for removal
// DO NOT DELETE until user confirms

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables from yoyakuyo-api/.env
// Try multiple possible locations
const possibleEnvPaths = [
  path.join(process.cwd(), "yoyakuyo-api", ".env"),
  path.join(process.cwd(), ".env"),
];

let envPath: string | undefined;
for (const possiblePath of possibleEnvPaths) {
  if (fs.existsSync(possiblePath)) {
    envPath = possiblePath;
    break;
  }
}

if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from: ${envPath}`);
} else {
  // Fallback: try default dotenv behavior
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface Shop {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  prefecture: string | null;
  normalized_city: string | null;
  latitude: number | null;
  longitude: number | null;
  category_id: string | null;
  description: string | null;
}

interface RemovalReason {
  shop: Shop;
  reasons: string[];
  warnings: string[];
}

// Generic shop names that should be removed
const GENERIC_NAMES = [
  'salon', 'store', 'shop', 'golf', 'market', 'restaurant', 'cafe', 'bar',
  'clinic', 'hospital', 'hotel', 'spa', 'beauty', 'nail', 'hair', 'barber',
  'dental', 'eyelash', 'onsen', 'karaoke', 'womens clinic',
  'サロン', '店', 'ショップ', 'ゴルフ', 'マーケット', 'レストラン', 'カフェ', 'バー',
  'クリニック', '病院', 'ホテル', 'スパ', '美容', 'ネイル', 'ヘア', '理髪',
  '歯科', 'まつげ', '温泉', 'カラオケ', '女性クリニック'
];

// Japanese address markers that must be present
const JAPANESE_ADDRESS_MARKERS = ['市', '区', '町', '村', '都', '府', '道'];

// Validation functions
function isGenericName(name: string): boolean {
  if (!name || name.trim().length === 0) return true;
  
  const nameWords = name.toLowerCase().trim().split(/\s+/);
  
  // Single word names that are EXACTLY a generic term (e.g., just "Salon", "Store")
  if (nameWords.length === 1) {
    const singleWord = nameWords[0].toLowerCase();
    // Only flag if it's EXACTLY a generic term, not if it contains one
    return GENERIC_NAMES.some(generic => singleWord === generic);
  }
  
  // Check if name is EXACTLY a generic category (e.g., "Salon", "Hair Salon" as the entire name)
  const nameLower = name.toLowerCase().trim();
  
  // Allow names like "HAIR SALON SUZUKI" or "Levi Hair Salon" - they have additional identifiers
  // Only flag if the name is JUST a generic term or starts/ends with ONLY a generic term
  const isExactGeneric = GENERIC_NAMES.some(generic => nameLower === generic);
  if (isExactGeneric) return true;
  
  // Don't flag names that have additional words (like "HAIR SALON SUZUKI" or "Levi Hair Salon")
  // These are valid shop names even if they contain generic terms
  return false;
}

function hasFullAddress(address: string | null): boolean {
  if (!address || address.trim().length < 5) return false;
  
  const trimmed = address.trim();
  const trimmedLower = trimmed.toLowerCase();
  
  // Check for postal code (Japanese postal codes: 〒123-4567 or 123-4567 or 1234567)
  const hasPostalCode = /[〒]?\d{3}[-\s]?\d{4}/.test(trimmed) || /\d{7}/.test(trimmed);
  
  // If address has postal code, it's definitely valid
  if (hasPostalCode) return true;
  
  // Check for location information (prefecture/city) - Japanese or English/romaji
  const hasLocationInfo = 
    // Japanese markers
    JAPANESE_ADDRESS_MARKERS.some(marker => trimmed.includes(marker)) ||
    // English/romaji prefecture/city names
    /(tokyo|osaka|kyoto|hokkaido|kanagawa|saitama|chiba|shibuya|shinjuku|chofu|shimokitazawa|ikebukuro|akihabara|ginza|roppongi)/i.test(trimmedLower) ||
    // Common Japanese city patterns in romaji
    /(shi|ku|cho|machi|gun|mura|son|city|ward)/i.test(trimmedLower);
  
  // Check for street-level information
  // Support both half-width (0-9) and full-width (０-９) Japanese numerals
  const hasStreetInfo = 
    // Half-width numbers (Western style) - street numbers, building numbers
    /\d+[-\s]?\d*[-\s]?\d*/.test(trimmed) ||
    // Full-width Japanese numerals (０-９) - e.g., "１−１−１", "２−５５−３"
    /[０-９]+[−\s]?[０-９]*[−\s]?[０-９]*/.test(trimmed) ||
    // Mixed half-width and full-width with hyphens/dashes
    /[0-9０-９]+[−\-\s]+[0-9０-９]+[−\-\s]*[0-9０-９]*/.test(trimmed) ||
    // Japanese address components with numbers (丁目, 番地, etc.)
    // Pattern: numbers before 丁目 (e.g., "５丁目") OR 丁目 followed by numbers (e.g., "名駅南５丁目５")
    /[0-9０-９一二三四五六七八九十]+[丁目番号号番地]/.test(trimmed) ||
    /[丁目][0-9０-９一二三四五六七八九十]+/.test(trimmed) ||
    // Pattern: 丁目 followed by numbers with dash (e.g., "５丁目５－２１")
    /[丁目][0-9０-９一二三四五六七八九十]+[−\-\s]+[0-9０-９一二三四五六七八九十]+/.test(trimmed) ||
    // Building names
    /[建物ビルマンション|building|bldg|ビル|マンション]/i.test(trimmed) ||
    // Street names/patterns (Japanese or English)
    /(chōme|cho|machi|dori|street|avenue|road|通り|通|tori|dōri)/i.test(trimmed) ||
    // Address-like patterns (e.g., "2-55-3", "shimoishara 2-55-3")
    /\w+\s+[0-9０-９]+[−\-\s]?[0-9０-９]*[−\-\s]?[0-9０-９]*/.test(trimmed);
  
  // Address is valid if it has BOTH location info AND street info
  if (hasLocationInfo && hasStreetInfo) return true;
  
  // Also accept if it has a recognizable address pattern (e.g., "tokyo to chofu shi shimoishara 2-55-3")
  const hasAddressPattern = /(tokyo|osaka|kyoto|hokkaido|kanagawa|saitama|chiba)\s+(to|prefecture|都|府|県)?\s*\w+\s+(shi|city|市)?\s+\w+\s+[0-9０-９]+[−\-\s]?[0-9０-９]*[−\-\s]?[0-9０-９]*/i.test(trimmedLower);
  if (hasAddressPattern) return true;
  
  // If address has Japanese address structure (都道府県 + 市区町村 + 番地), it's valid
  // Pattern: something with 都/府/県 + something with 市/区/町/村 + numbers (half-width or full-width) or street info
  // Example: "大阪府堺市堺区大町西１−１−１" (has 府 + 市 + 区 + full-width numbers)
  // Example: "愛知県名古屋市中村区名駅南５丁目５－２１" (has 県 + 市 + 区 + 丁目 + numbers)
  const hasJapaneseStructure = 
    /[都府県道]/.test(trimmed) && 
    /[市区町村]/.test(trimmed) && 
    (hasStreetInfo || /[0-9０-９]+/.test(trimmed) || /[一二三四五六七八九十]+/.test(trimmed) || /[丁目]/.test(trimmed));
  if (hasJapaneseStructure) return true;
  
  // If address is reasonably long and has location + numbers (any format), it's probably valid
  if (trimmed.length >= 15 && hasLocationInfo && (/[0-9０-９]+/.test(trimmed) || /[一二三四五六七八九十]+/.test(trimmed))) return true;
  
  return false;
}

function hasValidLocation(shop: Shop): boolean {
  // Check if prefecture exists in database
  const hasPrefecture = !!(shop.prefecture && shop.prefecture.trim() !== '');
  
  // Check if city exists in database
  const hasCity = !!(shop.normalized_city && shop.normalized_city.trim() !== '') ||
                  !!(shop.city && shop.city.trim() !== '');
  
  // If both exist in database, we're good
  if (hasPrefecture && hasCity) return true;
  
  // If missing, try to extract from address (backend does this on-the-fly)
  if (shop.address) {
    const address = shop.address.toLowerCase();
    
    // Check for prefecture markers in address (Japanese)
    const prefectureMarkers = ['都', '府', '道', '県'];
    const hasPrefectureInAddress = prefectureMarkers.some(marker => shop.address!.includes(marker));
    
    // Check for city markers in address (Japanese)
    const cityMarkers = ['市', '区', '町', '村'];
    const hasCityInAddress = cityMarkers.some(marker => shop.address!.includes(marker));
    
    // If address contains both prefecture and city markers (Japanese), it's valid
    if (hasPrefectureInAddress && hasCityInAddress) return true;
    
    // Also check for English/romaji location patterns
    // Pattern: "tokyo to chofu shi" or "tokyo, chofu" or "chofu, tokyo"
    const hasEnglishPrefecture = /(tokyo|osaka|kyoto|hokkaido|kanagawa|saitama|chiba|prefecture|都|府|県)/i.test(address);
    const hasEnglishCity = /(shibuya|shinjuku|chofu|shimokitazawa|ikebukuro|akihabara|ginza|roppongi|shi|ku|city|ward|市|区|町|村)/i.test(address);
    
    // If address has both prefecture and city in English/romaji, it's valid
    if (hasEnglishPrefecture && hasEnglishCity) return true;
    
    // Also accept if address has recognizable location pattern
    // e.g., "tokyo to chofu shi" or "chofu, tokyo" or "shibuya-ku, tokyo"
    const hasLocationPattern = /(tokyo|osaka|kyoto|hokkaido|kanagawa|saitama|chiba).*?(shibuya|shinjuku|chofu|shimokitazawa|ikebukuro|akihabara|ginza|roppongi|\w+\s*(shi|ku|city|ward|市|区|町|村))/i.test(address);
    if (hasLocationPattern) return true;
  }
  
  // If we can't determine location from address either, it's invalid
  return false;
}

function hasCoordinates(shop: Shop): boolean {
  return shop.latitude !== null && 
         shop.longitude !== null &&
         !isNaN(shop.latitude) &&
         !isNaN(shop.longitude) &&
         shop.latitude !== 0 &&
         shop.longitude !== 0;
}

function validateShop(shop: Shop): { valid: boolean; reasons: string[]; warnings: string[] } {
  const reasons: string[] = [];
  const warnings: string[] = [];
  
  const hasFullAddr = hasFullAddress(shop.address);
  const hasCategory = shop.category_id && shop.category_id.trim() !== '';
  const isGeneric = isGenericName(shop.name);
  
  // CRITICAL: Generic or single-word name (not a real shop)
  // BUT: If shop has full address AND category, keep it even with generic name
  if (isGeneric) {
    if (hasFullAddr && hasCategory) {
      // Shop has generic name but full address and category - KEEP IT
      // Just add a warning, not a critical reason
      warnings.push(`Generic name but has full address and category: "${shop.name}"`);
    } else {
      // Generic name AND missing address or category - mark for removal
      reasons.push(`Generic or single-word name: "${shop.name}"`);
    }
  }
  
  // CRITICAL: Missing or incomplete address (no street information)
  // BUT: If shop has category and is not generic, we might be more lenient
  // Actually, let's keep this strict - address is important
  if (!hasFullAddr) {
    reasons.push(`Missing or incomplete address: "${shop.address || 'null'}"`);
  }
  
  // WARNING: Missing coordinates (can be geocoded later, but report it)
  if (!hasCoordinates(shop)) {
    warnings.push(`Missing or invalid coordinates (lat: ${shop.latitude}, lng: ${shop.longitude}) - can be geocoded later`);
  }
  
  // WARNING: Location fields missing (but can be extracted from address)
  if (!hasValidLocation(shop)) {
    // Only flag if address also doesn't contain location info (Japanese or English)
    const address = (shop.address || '').toLowerCase();
    const hasLocationInAddress = 
      JAPANESE_ADDRESS_MARKERS.some(marker => shop.address!.includes(marker)) ||
      /(tokyo|osaka|kyoto|hokkaido|kanagawa|saitama|chiba|prefecture|都|府|県)/i.test(address) ||
      /(shibuya|shinjuku|chofu|shimokitazawa|ikebukuro|akihabara|ginza|roppongi|shi|ku|city|ward|市|区|町|村)/i.test(address);
    if (!hasLocationInAddress) {
      warnings.push(`Cannot determine location from address or database fields`);
    }
  }
  
  // WARNING: Address too short (might be incomplete) - but only if it's really short
  // Don't flag addresses that are 10+ characters as they might be valid
  if (shop.address && shop.address.trim().length < 10 && !hasFullAddr) {
    warnings.push(`Address too short: ${shop.address.trim().length} characters`);
  }
  
  // A shop is INVALID only if it fails CRITICAL checks
  // Note: Generic name alone is NOT a blocker if shop has full address AND category
  return {
    valid: reasons.length === 0,
    reasons,
    warnings
  };
}

async function fetchAllShops(): Promise<Shop[]> {
  const allShops: Shop[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;
  
  console.log('Fetching all shops from database...');
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, address, city, prefecture, normalized_city, latitude, longitude, category_id, description')
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error(`Error fetching batch ${offset / batchSize + 1}:`, error);
      break;
    }
    
    if (data && data.length > 0) {
      allShops.push(...data);
      console.log(`Fetched batch ${offset / batchSize + 1}: ${data.length} shops (total: ${allShops.length})`);
      hasMore = data.length === batchSize;
      offset += batchSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`\nTotal shops fetched: ${allShops.length}\n`);
  return allShops;
}

async function analyzeShops(): Promise<{
  validShops: Shop[];
  invalidShops: RemovalReason[];
  shopsWithWarnings: Array<{ shop: Shop; warnings: string[] }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    withWarnings: number;
    reasonsBreakdown: Record<string, number>;
    warningsBreakdown: Record<string, number>;
  };
}> {
  const shops = await fetchAllShops();
  const validShops: Shop[] = [];
  const invalidShops: RemovalReason[] = [];
  const shopsWithWarnings: Array<{ shop: Shop; warnings: string[] }> = [];
  const reasonsBreakdown: Record<string, number> = {};
  const warningsBreakdown: Record<string, number> = {};
  
  console.log('Analyzing shops...\n');
  
  for (const shop of shops) {
    const validation = validateShop(shop);
    
    if (validation.valid) {
      validShops.push(shop);
      
      // Track warnings for valid shops too
      if (validation.warnings.length > 0) {
        shopsWithWarnings.push({
          shop,
          warnings: validation.warnings
        });
        
        // Count warnings
        for (const warning of validation.warnings) {
          const warningKey = warning.split(':')[0]; // Get main warning category
          warningsBreakdown[warningKey] = (warningsBreakdown[warningKey] || 0) + 1;
        }
      }
    } else {
      invalidShops.push({
        shop,
        reasons: validation.reasons,
        warnings: validation.warnings
      });
      
      // Count reasons (critical issues only)
      for (const reason of validation.reasons) {
        const reasonKey = reason.split(':')[0]; // Get main reason category
        reasonsBreakdown[reasonKey] = (reasonsBreakdown[reasonKey] || 0) + 1;
      }
      
      // Count warnings for invalid shops too
      for (const warning of validation.warnings) {
        const warningKey = warning.split(':')[0];
        warningsBreakdown[warningKey] = (warningsBreakdown[warningKey] || 0) + 1;
      }
    }
  }
  
  return {
    validShops,
    invalidShops,
    shopsWithWarnings,
    summary: {
      total: shops.length,
      valid: validShops.length,
      invalid: invalidShops.length,
      withWarnings: shopsWithWarnings.length,
      reasonsBreakdown,
      warningsBreakdown
    }
  };
}

function writeRemovalLog(invalidShops: RemovalReason[]): void {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logPath = path.join(logDir, 'removed-shops.log');
  const timestamp = new Date().toISOString();
  
  let logContent = `# Shop Removal Log\n`;
  logContent += `# Generated: ${timestamp}\n`;
  logContent += `# Total shops marked for removal: ${invalidShops.length}\n\n`;
  
  for (const { shop, reasons, warnings } of invalidShops) {
    logContent += `---\n`;
    logContent += `ID: ${shop.id}\n`;
    logContent += `Name: ${shop.name}\n`;
    logContent += `Address: ${shop.address || 'null'}\n`;
    logContent += `Prefecture: ${shop.prefecture || 'null'}\n`;
    logContent += `City: ${shop.normalized_city || shop.city || 'null'}\n`;
    logContent += `Coordinates: (${shop.latitude}, ${shop.longitude})\n`;
    logContent += `Category ID: ${shop.category_id || 'null'}\n`;
    logContent += `CRITICAL Reasons for removal:\n`;
    for (const reason of reasons) {
      logContent += `  - ${reason}\n`;
    }
    if (warnings.length > 0) {
      logContent += `WARNINGS (not blocking, but should be addressed):\n`;
      for (const warning of warnings) {
        logContent += `  - ${warning}\n`;
      }
    }
    logContent += `\n`;
  }
  
  fs.writeFileSync(logPath, logContent, 'utf-8');
  console.log(`\nRemoval log written to: ${logPath}`);
}

function printSummary(summary: any, invalidShops: RemovalReason[], shopsWithWarnings: Array<{ shop: Shop; warnings: string[] }>): void {
  console.log('='.repeat(80));
  console.log('SHOP CLEANUP ANALYSIS SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal shops in database: ${summary.total}`);
  console.log(`✅ Valid shops (to keep): ${summary.valid} (${((summary.valid / summary.total) * 100).toFixed(2)}%)`);
  console.log(`❌ Invalid shops (to remove): ${summary.invalid} (${((summary.invalid / summary.total) * 100).toFixed(2)}%)`);
  console.log(`⚠️  Shops with warnings (valid but need attention): ${summary.withWarnings} (${((summary.withWarnings / summary.total) * 100).toFixed(2)}%)`);
  
  console.log(`\n📊 Critical Issues (causing removal):`);
  const sortedReasons = Object.entries(summary.reasonsBreakdown)
    .sort((a, b) => (b[1] as number) - (a[1] as number));
  
  if (sortedReasons.length > 0) {
    for (const [reason, count] of sortedReasons) {
      console.log(`  - ${reason}: ${count as number} shops`);
    }
  } else {
    console.log(`  (none)`);
  }
  
  console.log(`\n⚠️  Warnings (not blocking, but should be addressed):`);
  const sortedWarnings = Object.entries(summary.warningsBreakdown)
    .sort((a, b) => (b[1] as number) - (a[1] as number));
  
  if (sortedWarnings.length > 0) {
    for (const [warning, count] of sortedWarnings) {
      console.log(`  - ${warning}: ${count as number} shops`);
    }
  } else {
    console.log(`  (none)`);
  }
  
  console.log(`\n📋 Sample of shops to be removed (first 10):`);
  for (let i = 0; i < Math.min(10, invalidShops.length); i++) {
    const { shop, reasons, warnings } = invalidShops[i];
    console.log(`\n  ${i + 1}. ${shop.name} (ID: ${shop.id.substring(0, 8)}...)`);
    console.log(`     Address: ${shop.address || 'null'}`);
    console.log(`     Critical Reasons: ${reasons.join('; ')}`);
    if (warnings.length > 0) {
      console.log(`     Warnings: ${warnings.join('; ')}`);
    }
  }
  
  if (invalidShops.length > 10) {
    console.log(`\n  ... and ${invalidShops.length - 10} more shops`);
  }
  
  if (shopsWithWarnings.length > 0) {
    console.log(`\n📋 Sample of valid shops with warnings (first 5):`);
    for (let i = 0; i < Math.min(5, shopsWithWarnings.length); i++) {
      const { shop, warnings } = shopsWithWarnings[i];
      console.log(`\n  ${i + 1}. ${shop.name} (ID: ${shop.id.substring(0, 8)}...)`);
      console.log(`     Address: ${shop.address || 'null'}`);
      console.log(`     Warnings: ${warnings.join('; ')}`);
    }
    if (shopsWithWarnings.length > 5) {
      console.log(`\n  ... and ${shopsWithWarnings.length - 5} more shops with warnings`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  IMPORTANT: No shops have been deleted yet.');
  console.log('⚠️  Review the summary above and the removal log before confirming deletion.');
  console.log('📝 Shops with valid addresses but missing coordinates will be KEPT (can geocode later).');
  console.log('='.repeat(80));
}

async function deleteShops(invalidShops: RemovalReason[]): Promise<void> {
  console.log(`\n🗑️  Starting deletion of ${invalidShops.length} invalid shops...\n`);
  
  const batchSize = 100;
  let deletedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < invalidShops.length; i += batchSize) {
    const batch = invalidShops.slice(i, i + batchSize);
    const shopIds = batch.map(item => item.shop.id);
    
    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .in('id', shopIds);
      
      if (error) {
        console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, error);
        errorCount += batch.length;
      } else {
        deletedCount += batch.length;
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} shops (total: ${deletedCount}/${invalidShops.length})`);
      }
    } catch (err: any) {
      console.error(`Exception deleting batch ${Math.floor(i / batchSize) + 1}:`, err);
      errorCount += batch.length;
    }
  }
  
  console.log(`\n✅ Deletion complete!`);
  console.log(`   - Successfully deleted: ${deletedCount} shops`);
  console.log(`   - Errors: ${errorCount} shops`);
}

async function main() {
  try {
    console.log('Starting shop cleanup analysis...\n');
    
    const { validShops, invalidShops, shopsWithWarnings, summary } = await analyzeShops();
    
    // Write removal log
    if (invalidShops.length > 0) {
      writeRemovalLog(invalidShops);
    }
    
    // Print summary
    printSummary(summary, invalidShops, shopsWithWarnings);
    
    console.log('\n✅ Analysis complete!');
    
    // Proceed with deletion
    if (invalidShops.length > 0) {
      console.log(`\n⚠️  WARNING: About to delete ${invalidShops.length} invalid shops from the database.`);
      console.log('Proceeding with deletion...\n');
      
      await deleteShops(invalidShops);
      
      console.log('\n📝 Deletion log saved to: logs/removed-shops.log');
    } else {
      console.log('\n✅ No shops to delete - all shops are valid!');
    }
    
  } catch (error) {
    console.error('Error during cleanup analysis:', error);
    process.exit(1);
  }
}

// Run the script
main();


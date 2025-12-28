import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Minimal Shop interface for the script
interface Shop {
  id: string;
  name: string;
  address: string;
  prefecture?: string | null; // Existing prefecture field
  city?: string | null; // Existing city field
  normalized_city?: string | null; // Existing normalized_city field
  city_id?: string | null; // New city_id field
}

interface City {
  id: string;
  name: string;
  slug: string;
  prefecture_name: string;
}

// Helper to normalize city names into slugs (lowercase, snake_case)
function slugify(text: string): string {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with _
    .replace(/&/g, 'and')            // Replace & with 'and'
    .replace(/\//g, '_')            // Replace / with _
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/__+/g, '_')           // Replace multiple _ with single _
    .replace(/^-+/, '')            // Trim - from start of text
    .replace(/-+$/, '');           // Trim - from end of text
}

// Re-implementing extractPrefecture and extractCity from frontend for consistency
// NOTE: In a real app, this logic would be shared or ideally done in DB/backend exclusively
const JAPANESE_PREFECTURES: Array<{ pattern: RegExp; name: string; key: string }> = [
  { pattern: /東京都|tokyo|東京/i, name: '東京都', key: 'tokyo' },
  { pattern: /大阪府|osaka|大阪/i, name: '大阪府', key: 'osaka' },
  { pattern: /京都府|kyoto|京都/i, name: '京都府', key: 'kyoto' },
  { pattern: /北海道|hokkaido|hokkaidō/i, name: '北海道', key: 'hokkaido' },
  { pattern: /青森県|aomori/i, name: '青森県', key: 'aomori' },
  { pattern: /岩手県|iwate/i, name: '岩手県', key: 'iwate' },
  { pattern: /宮城県|miyagi/i, name: '宮城県', key: 'miyagi' },
  { pattern: /秋田県|akita/i, name: '秋田県', key: 'akita' },
  { pattern: /山形県|yamagata/i, name: '山形県', key: 'yamagata' },
  { pattern: /福島県|fukushima/i, name: '福島県', key: 'fukushima' },
  { pattern: /茨城県|ibaraki/i, name: '茨城県', key: 'ibaraki' },
  { pattern: /栃木県|tochigi/i, name: '栃木県', key: 'tochigi' },
  { pattern: /群馬県|gunma/i, name: '群馬県', key: 'gunma' },
  { pattern: /埼玉県|saitama/i, name: '埼玉県', key: 'saitama' },
  { pattern: /千葉県|chiba/i, name: '千葉県', key: 'chiba' },
  { pattern: /神奈川県|kanagawa/i, name: '神奈川県', key: 'kanagawa' },
  { pattern: /新潟県|niigata/i, name: '新潟県', key: 'niigata' },
  { pattern: /富山県|toyama/i, name: '富山県', key: 'toyama' },
  { pattern: /石川県|ishikawa/i, name: '石川県', key: 'ishikawa' },
  { pattern: /福井県|fukui/i, name: '福井県', key: 'fukui' },
  { pattern: /山梨県|yamanashi/i, name: '山梨県', key: 'yamanashi' },
  { pattern: /長野県|nagano/i, name: '長野県', key: 'nagano' },
  { pattern: /岐阜県|gifu/i, name: '岐阜県', key: 'gifu' },
  { pattern: /静岡県|shizuoka/i, name: '静岡県', key: 'shizuoka' },
  { pattern: /愛知県|aichi/i, name: '愛知県', key: 'aichi' },
  { pattern: /三重県|mie/i, name: '三重県', key: 'mie' },
  { pattern: /滋賀県|shiga/i, name: '滋賀県', key: 'shiga' },
  { pattern: /兵庫県|hyogo|hyōgo/i, name: '兵庫県', key: 'hyogo' },
  { pattern: /奈良県|nara/i, name: '奈良県', key: 'nara' },
  { pattern: /和歌山県|wakayama/i, name: '和歌山県', key: 'wakayama' },
  { pattern: /鳥取県|tottori/i, name: '鳥取県', key: 'tottori' },
  { pattern: /島根県|shimane/i, name: '島根県', key: 'shimane' },
  { pattern: /岡山県|okayama|okayamashi/i, name: '岡山県', key: 'okayama' },
  { pattern: /広島県|hiroshima/i, name: '広島県', key: 'hiroshima' },
  { pattern: /山口県|yamaguchi/i, name: '山口県', key: 'yamaguchi' },
  { pattern: /徳島県|tokushima/i, name: '徳島県', key: 'tokushima' },
  { pattern: /香川県|kagawa/i, name: '香川県', key: 'kagawa' },
  { pattern: /愛媛県|ehime/i, name: '愛媛県', key: 'ehime' },
  { pattern: /高知県|kochi/i, name: '高知県', key: 'kochi' },
  { pattern: /福岡県|fukuoka/i, name: '福岡県', key: 'fukuoka' },
  { pattern: /佐賀県|saga/i, name: '佐賀県', key: 'saga' },
  { pattern: /長崎県|nagasaki/i, name: '長崎県', key: 'nagasaki' },
  { pattern: /熊本県|kumamoto/i, name: '熊本県', key: 'kumamoto' },
  { pattern: /大分県|oita/i, name: '大分県', key: 'oita' },
  { pattern: /宮崎県|miyazaki/i, name: '宮崎県', key: 'miyazaki' },
  { pattern: /鹿児島県|kagoshima/i, name: '鹿児島県', key: 'kagoshima' },
  { pattern: /沖縄県|okinawa/i, name: '沖縄県', key: 'okinawa' },
];

function extractPrefectureName(shop: Shop): string | null {
  if (shop.prefecture && shop.prefecture.trim()) {
    return shop.prefecture.trim();
  }
  const address = shop.address || '';
  const combined = address.toLowerCase();

  for (const { pattern, name } of JAPANESE_PREFECTURES) {
    if (pattern.test(combined)) {
      return name;
    }
  }
  return null;
}

function extractCityName(shop: Shop): string | null {
  if (shop.normalized_city && shop.normalized_city.trim()) {
    return shop.normalized_city.trim();
  }
  if (shop.city && shop.city.trim()) {
    return shop.city.trim();
  }

  const address = shop.address || '';
  const prefectureName = extractPrefectureName(shop);

  // Remove prefecture name if present to simplify city extraction
  let addressWithoutPrefecture = address;
  if (prefectureName) {
    addressWithoutPrefecture = address.replace(new RegExp(prefectureName, 'i'), '');
  }

  // Patterns to extract city names (e.g., X市, X町, X村, X区)
  const cityPatterns = [
    /([^\s,]+(?:市|町|村|区))/,
    // More patterns can be added here if needed for broader coverage
  ];

  for (const pattern of cityPatterns) {
    const match = addressWithoutPrefecture.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: try to get the first meaningful word after a numeric string (often a street number)
  // This is a heuristic and might need refinement based on more data
  const parts = addressWithoutPrefecture.split(/\s|,/);
  let foundCity = null;
  for (let i = 0; i < parts.length; i++) {
    // Skip numeric parts or short strings
    if (parts[i].match(/^\d+$/) || parts[i].length <= 1) {
      continue;
    }
    // If the next part looks like a Japanese city suffix, or it's a kanji string, take it
    if (parts[i].match(/(市|町|村|区)$/) || parts[i].match(/^[\u4E00-\u9FFF]+$/)) {
      foundCity = parts[i];
      break;
    }
  }
  
  return foundCity || null;
}

async function populateCitiesTable() {
  console.log("🚀 Starting population of cities table...");

  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;
  let totalShopsProcessed = 0;
  const processedCities = new Map<string, City>(); // Map: city_slug -> City object

  while (hasMore) {
    const { data: shops, error: fetchError } = await supabaseAdmin
      .from("shops")
      .select("id, name, address, prefecture, city, normalized_city")
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error("❌ Error fetching shops:", fetchError.message);
      process.exit(1);
    }

    if (!shops || shops.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Fetched ${shops.length} shops (offset: ${offset})...`);

    for (const shop of shops) {
      totalShopsProcessed++;
      const prefectureName = extractPrefectureName(shop);
      const cityName = extractCityName(shop);

      if (cityName && prefectureName) {
        const citySlug = slugify(cityName);

        if (!processedCities.has(citySlug)) {
          // Try to insert the city, or get its ID if it already exists
          const { data: insertedCity, error: insertError } = await supabaseAdmin
            .from("cities")
            .upsert({ name: cityName, slug: citySlug, prefecture_name: prefectureName }, { onConflict: 'slug', ignoreDuplicates: false })
            .select("id, name, slug, prefecture_name")
            .single();

          if (insertError) {
            console.error(`❌ Error upserting city ${cityName} (${citySlug}):`, insertError.message);
            // Continue, don't block the entire script
          } else if (insertedCity) {
            processedCities.set(insertedCity.slug, insertedCity);
            console.log(`✅ Upserted city: ${insertedCity.name} (ID: ${insertedCity.id})`);
          }
        }

        const cityInMap = processedCities.get(citySlug);
        if (cityInMap) {
          // Update the shop with the city_id
          const { error: updateShopError } = await supabaseAdmin
            .from("shops")
            .update({ city_id: cityInMap.id })
            .eq("id", shop.id);

          if (updateShopError) {
            console.error(`❌ Error updating shop ${shop.id} with city_id ${cityInMap.id}:`, updateShopError.message);
          } else {
            // console.log(`🔄 Updated shop ${shop.name} with city_id: ${cityInMap.id}`);
          }
        }
      } else {
        // console.warn(`⚠️ Could not extract city or prefecture for shop: ${shop.name} (Address: ${shop.address})`);
      }
    }

    offset += batchSize;
    hasMore = shops.length === batchSize;
  }

  console.log(`✨ Finished processing ${totalShopsProcessed} shops.`);
  console.log(`📊 Unique cities processed and upserted: ${processedCities.size}`);
}

populateCitiesTable().catch(console.error);

#!/usr/bin/env node
/**
 * Automatic Shop Classification Script
 * 
 * This script classifies all shops in the Supabase database into proper categories
 * using keyword matching and OpenAI for ambiguous cases.
 * 
 * Usage:
 *   npx tsx scripts/classifyShops.ts
 *   or
 *   node --loader ts-node/esm scripts/classifyShops.ts
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

// Try to load dotenv if available
try {
  const dotenv = require("dotenv");
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
} catch (error) {
  // dotenv not installed, environment variables must be set in system
  console.log("ℹ️  dotenv not found, using system environment variables");
}

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error("❌ Error: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is required");
  console.error("   This script needs service role key to update shops");
  process.exit(1);
}

// Initialize Supabase client with service role key (for admin operations)
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

// Main categories to classify into
const MAIN_CATEGORIES = {
  BEAUTY_SERVICES: "Beauty Services",
  SPA_RELAXATION: "Spa, Onsen & Relaxation",
  HOTELS_STAYS: "Hotels & Stays",
  DINING_IZAKAYA: "Dining & Izakaya",
  CLINICS_MEDICAL: "Clinics & Medical Care",
  ACTIVITIES_SPORTS: "Activities & Sports",
  UNKNOWN: "Unknown",
} as const;

// Keyword rules for each category (English and Japanese)
const KEYWORD_RULES: Record<string, string[]> = {
  [MAIN_CATEGORIES.BEAUTY_SERVICES]: [
    // English
    "hair", "salon", "nail", "manicure", "pedicure", "barber", "barbershop",
    "eyelash", "lash", "extension", "eyebrow", "beauty", "cosmetic", "makeup",
    "make-up", "esthetic", "aesthetic", "waxing", "haircut", "hair color",
    "haircolor", "styling", "coloring", "perm", "straightening",
    // Japanese
    "ヘア", "サロン", "ネイル", "マニキュア", "ペディキュア", "バーバー",
    "理髪", "理容", "まつげ", "エクステ", "眉毛", "美容", "コスメ",
    "エステ", "脱毛", "カット", "カラー", "パーマ", "ストレート",
    "ヘアサロン", "ネイルサロン", "美容室", "理髪店", "理容室",
  ],
  [MAIN_CATEGORIES.SPA_RELAXATION]: [
    // English
    "onsen", "hot spring", "hotspring", "spa", "massage", "therapy",
    "relaxation", "wellness", "aromatherapy", "facial", "body treatment",
    "ryokan", "traditional bath", "thermal", "spring",
    // Japanese
    "温泉", "湯", "スパ", "マッサージ", "整体", "リラクゼーション",
    "リラク", "アロマ", "エステ", "旅館", "露天風呂", "日帰り温泉",
    "温浴", "サウナ", "岩盤浴",
  ],
  [MAIN_CATEGORIES.HOTELS_STAYS]: [
    // English
    "hotel", "ryokan", "stay", "inn", "guesthouse", "hostel", "resort",
    "accommodation", "lodging", "boutique hotel", "business hotel",
    "capsule hotel", "minshuku", "pension",
    // Japanese
    "ホテル", "旅館", "宿", "民宿", "ゲストハウス", "リゾート", "宿泊",
    "ビジネスホテル", "カプセルホテル", "旅館", "和風旅館", "ペンション",
  ],
  [MAIN_CATEGORIES.DINING_IZAKAYA]: [
    // English
    "restaurant", "izakaya", "dining", "food", "cafe", "café", "coffee",
    "bar", "pub", "bistro", "diner", "eatery", "kitchen", "grill",
    "sushi", "ramen", "yakitori", "tempura", "kaiseki",
    // Japanese
    "レストラン", "居酒屋", "いざかや", "食堂", "カフェ", "コーヒー",
    "バー", "パブ", "飲食", "料理", "寿司", "ラーメン", "焼き鳥",
    "天ぷら", "懐石", "和食", "洋食", "中華",
  ],
  [MAIN_CATEGORIES.CLINICS_MEDICAL]: [
    // English
    "dental", "dentist", "clinic", "medical", "hospital", "doctor",
    "physician", "aesthetic clinic", "esthetic clinic", "women clinic",
    "gynecology", "wellness clinic", "skin clinic", "dermatology",
    "ophthalmology", "eye clinic", "vision", "orthopedic", "pediatric",
    // Japanese
    "歯科", "歯医者", "デンタル", "クリニック", "医院", "病院",
    "美容外科", "美容皮膚科", "エステ", "婦人科", "女性", "健康",
    "ヘルス", "皮膚科", "眼科", "整形外科", "小児科",
  ],
  [MAIN_CATEGORIES.ACTIVITIES_SPORTS]: [
    // English
    "golf", "gym", "fitness", "yoga", "sports", "sport", "lessons",
    "training", "activities", "activity", "recreation", "indoor",
    "outdoor", "tennis", "swimming", "diving", "skiing", "snowboarding",
    "martial arts", "karate", "judo", "archery", "cycling",
    // Japanese
    "ゴルフ", "ゴルフ場", "ゴルフ練習場", "ジム", "フィットネス",
    "スポーツ", "レッスン", "トレーニング", "アクティビティ",
    "レクリエーション", "屋内", "屋外", "テニス", "スイミング",
    "ダイビング", "スキー", "武道", "空手", "柔道", "弓道",
  ],
};

// ============================================================================
// TYPES
// ============================================================================

interface Shop {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  category_id?: string | null;
  subcategory?: string | null;
  [key: string]: any; // For any other fields
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

interface ClassificationResult {
  categoryName: string;
  categoryId: string | null;
  confidence: 'high' | 'medium' | 'low';
  method: 'keyword' | 'ai' | 'fallback';
}

interface Stats {
  total: number;
  processed: number;
  skipped: number;
  errors: number;
  byCategory: Record<string, number>;
  byMethod: {
    keyword: number;
    ai: number;
    fallback: number;
  };
  changes: Array<{
    shopId: string;
    shopName: string;
    oldCategory: string | null;
    newCategory: string;
    method: string;
  }>;
}

// ============================================================================
// CATEGORY LOOKUP
// ============================================================================

let categoryCache: Map<string, string> | null = null;

/**
 * Ensure main categories exist in database, create if missing
 */
async function ensureMainCategories(): Promise<void> {
  console.log("📋 Ensuring main categories exist in database...");
  
  const { data: existingCategories } = await supabase
    .from("categories")
    .select("id, name");

  const existingNames = new Set(existingCategories?.map(c => c.name) || []);

  // Check which main categories are missing
  const missingCategories = Object.values(MAIN_CATEGORIES).filter(
    name => !existingNames.has(name)
  );

  if (missingCategories.length > 0) {
    console.log(`📝 Creating ${missingCategories.length} missing main categories...`);
    
    const categoriesToInsert = missingCategories.map(name => ({
      name,
      description: `Main category: ${name}`,
    }));

    const { error } = await supabase
      .from("categories")
      .insert(categoriesToInsert);

    if (error) {
      console.error("❌ Error creating categories:", error);
      throw error;
    }

    console.log(`✅ Created ${missingCategories.length} main categories`);
  } else {
    console.log("✅ All main categories already exist");
  }
}

/**
 * Fetch all categories from database and cache them
 */
async function loadCategories(): Promise<Map<string, string>> {
  if (categoryCache) {
    return categoryCache;
  }

  // Ensure main categories exist first
  await ensureMainCategories();

  console.log("📋 Loading categories from database...");
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name");

  if (error) {
    console.error("❌ Error loading categories:", error);
    throw error;
  }

  if (!categories || categories.length === 0) {
    console.error("❌ No categories found in database!");
    throw new Error("No categories found");
  }

  categoryCache = new Map();
  for (const cat of categories) {
    categoryCache.set(cat.name, cat.id);
  }

  console.log(`✅ Loaded ${categoryCache.size} categories`);
  return categoryCache;
}

/**
 * Get category ID by name (dynamically fetched from database)
 */
async function getCategoryId(categoryName: string): Promise<string | null> {
  const categories = await loadCategories();
  return categories.get(categoryName) || null;
}

// ============================================================================
// KEYWORD CLASSIFICATION
// ============================================================================

/**
 * Normalize text for keyword matching
 */
function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text.toLowerCase().trim();
}

/**
 * Check if text contains any of the keywords
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some(keyword => normalized.includes(keyword.toLowerCase()));
}

/**
 * Classify shop using keyword matching
 * Returns category name if found, null if ambiguous
 */
function classifyByKeywords(shop: Shop): { category: string | null; confidence: 'high' | 'medium' } {
  const searchText = [
    shop.name,
    shop.description,
    shop.category,
    shop.subcategory,
  ].filter(Boolean).join(" ");

  const normalizedText = normalizeText(searchText);
  
  if (!normalizedText) {
    return { category: null, confidence: 'medium' };
  }

  // Count matches for each category
  const matches: Record<string, number> = {};
  
  for (const [categoryName, keywords] of Object.entries(KEYWORD_RULES)) {
    const matchCount = keywords.filter(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      matches[categoryName] = matchCount;
    }
  }

  // If no matches, return null (will use AI or fallback)
  if (Object.keys(matches).length === 0) {
    return { category: null, confidence: 'medium' };
  }

  // If only one category matches, return it with high confidence
  const matchedCategories = Object.keys(matches);
  if (matchedCategories.length === 1) {
    return { category: matchedCategories[0], confidence: 'high' };
  }

  // If multiple categories match, return the one with most matches
  const sortedMatches = Object.entries(matches).sort((a, b) => b[1] - a[1]);
  const topMatch = sortedMatches[0];
  const secondMatch = sortedMatches[1];

  // If top match has significantly more matches, use it
  if (topMatch[1] >= secondMatch[1] * 2) {
    return { category: topMatch[0], confidence: 'high' };
  }

  // If matches are close, return null to use AI
  return { category: null, confidence: 'medium' };
}

// ============================================================================
// AI CLASSIFICATION
// ============================================================================

/**
 * Classify shop using OpenAI when keyword matching is ambiguous
 */
async function classifyWithAI(shop: Shop): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️  OpenAI API key not found, using fallback to Unknown");
    return MAIN_CATEGORIES.UNKNOWN;
  }

  const shopInfo = [
    `Name: ${shop.name}`,
    shop.description ? `Description: ${shop.description}` : "",
    shop.category ? `Old Category: ${shop.category}` : "",
    shop.subcategory ? `Subcategory: ${shop.subcategory}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are a business classification assistant. Classify the following Japanese business into ONE of these categories:

1. "${MAIN_CATEGORIES.BEAUTY_SERVICES}" - Hair salons, nail salons, barbershops, eyelash salons, beauty services
2. "${MAIN_CATEGORIES.SPA_RELAXATION}" - Spas, onsen (hot springs), massage, relaxation services, ryokan baths
3. "${MAIN_CATEGORIES.HOTELS_STAYS}" - Hotels, ryokan (traditional inns), guesthouses, accommodations
4. "${MAIN_CATEGORIES.DINING_IZAKAYA}" - Restaurants, izakaya (Japanese pubs), cafes, bars, dining establishments
5. "${MAIN_CATEGORIES.CLINICS_MEDICAL}" - Dental clinics, medical clinics, aesthetic clinics, women's clinics, wellness clinics
6. "${MAIN_CATEGORIES.ACTIVITIES_SPORTS}" - Golf courses, gyms, sports facilities, activity centers, recreational activities
7. "${MAIN_CATEGORIES.UNKNOWN}" - Only if truly unclassifiable

Business Information:
${shopInfo}

Respond with ONLY the category name (exactly as listed above, including any punctuation). Do not include any explanation or additional text.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using cost-effective model
        messages: [
          {
            role: "system",
            content: "You are a precise business classification assistant. Always respond with only the exact category name.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️  OpenAI API error: ${response.status} - ${errorText}`);
      return MAIN_CATEGORIES.UNKNOWN;
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const classification = data.choices[0]?.message?.content?.trim() || "";
    
    // Validate the response is one of our categories
    const validCategories = Object.values(MAIN_CATEGORIES);
    if (validCategories.includes(classification as any)) {
      return classification;
    }

    // Try to find a partial match
    const partialMatch = validCategories.find(cat => 
      classification.toLowerCase().includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(classification.toLowerCase())
    );

    if (partialMatch) {
      return partialMatch;
    }

    console.warn(`⚠️  AI returned invalid category: "${classification}", using Unknown`);
    return MAIN_CATEGORIES.UNKNOWN;
  } catch (error) {
    console.warn(`⚠️  OpenAI API error:`, error);
    return MAIN_CATEGORIES.UNKNOWN;
  }
}

// ============================================================================
// MAIN CLASSIFICATION LOGIC
// ============================================================================

/**
 * Classify a single shop
 */
async function classifyShop(shop: Shop): Promise<ClassificationResult> {
  // Try keyword classification first
  const keywordResult = classifyByKeywords(shop);

  if (keywordResult.category && keywordResult.confidence === 'high') {
    const categoryId = await getCategoryId(keywordResult.category);
    return {
      categoryName: keywordResult.category,
      categoryId,
      confidence: 'high',
      method: 'keyword',
    };
  }

  // If ambiguous or no keywords match, use AI (if available)
  if (OPENAI_API_KEY) {
    const aiCategory = await classifyWithAI(shop);
    const categoryId = await getCategoryId(aiCategory);
    return {
      categoryName: aiCategory,
      categoryId,
      confidence: keywordResult.category ? 'medium' : 'low',
      method: 'ai',
    };
  }

  // Fallback to Unknown if no AI available
  const categoryId = await getCategoryId(MAIN_CATEGORIES.UNKNOWN);
  return {
    categoryName: MAIN_CATEGORIES.UNKNOWN,
    categoryId,
    confidence: 'low',
    method: 'fallback',
  };
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  console.log("🚀 Starting shop classification script...\n");

  // Load categories first
  await loadCategories();

  // Initialize stats
  const stats: Stats = {
    total: 0,
    processed: 0,
    skipped: 0,
    errors: 0,
    byCategory: {},
    byMethod: {
      keyword: 0,
      ai: 0,
      fallback: 0,
    },
    changes: [],
  };

  // Fetch all shops
  console.log("📦 Fetching all shops from database...");
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: shops, error } = await supabase
      .from("shops")
      .select("id, name, description, category, category_id, subcategory")
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error("❌ Error fetching shops:", error);
      stats.errors++;
      break;
    }

    if (!shops || shops.length === 0) {
      hasMore = false;
      break;
    }

    stats.total += shops.length;
    console.log(`📊 Processing batch: ${offset + 1}-${offset + shops.length} of ${stats.total} shops...`);

    // Process each shop
    for (const shop of shops) {
      try {
        // Skip if shop has no name
        if (!shop.name || shop.name.trim() === "") {
          stats.skipped++;
          continue;
        }

        // Classify the shop
        const result = await classifyShop(shop);

        // Get old category name for logging
        let oldCategoryName: string | null = null;
        if (shop.category_id) {
          const categories = await loadCategories();
          for (const [name, id] of categories.entries()) {
            if (id === shop.category_id) {
              oldCategoryName = name;
              break;
            }
          }
        }

        // Update shop if category changed
        if (result.categoryId && result.categoryId !== shop.category_id) {
          const { error: updateError } = await supabase
            .from("shops")
            .update({ category_id: result.categoryId })
            .eq("id", shop.id);

          if (updateError) {
            console.error(`❌ Error updating shop ${shop.id}:`, updateError);
            stats.errors++;
            continue;
          }

          // Log the change
          stats.changes.push({
            shopId: shop.id,
            shopName: shop.name,
            oldCategory: oldCategoryName,
            newCategory: result.categoryName,
            method: result.method,
          });

          // Update stats
          stats.byCategory[result.categoryName] = (stats.byCategory[result.categoryName] || 0) + 1;
          stats.byMethod[result.method]++;
        } else if (!result.categoryId) {
          console.warn(`⚠️  Category "${result.categoryName}" not found in database for shop: ${shop.name}`);
          stats.errors++;
        }

        stats.processed++;

        // Progress indicator
        if (stats.processed % 100 === 0) {
          console.log(`   Processed ${stats.processed} shops...`);
        }

        // Small delay to avoid rate limiting (especially for AI calls)
        if (result.method === 'ai') {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay for AI calls
        }
      } catch (error) {
        console.error(`❌ Error processing shop ${shop.id}:`, error);
        stats.errors++;
      }
    }

    offset += batchSize;
    hasMore = shops.length === batchSize;
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================

  console.log("\n" + "=".repeat(80));
  console.log("📊 CLASSIFICATION SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total shops: ${stats.total}`);
  console.log(`Processed: ${stats.processed}`);
  console.log(`Skipped (no name): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`\nClassification method breakdown:`);
  console.log(`  Keyword matching: ${stats.byMethod.keyword}`);
  console.log(`  AI classification: ${stats.byMethod.ai}`);
  console.log(`  Fallback (Unknown): ${stats.byMethod.fallback}`);
  console.log(`\nShops by category:`);
  
  const sortedCategories = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1]);

  for (const [category, count] of sortedCategories) {
    const percentage = ((count / stats.processed) * 100).toFixed(1);
    console.log(`  ${category}: ${count} (${percentage}%)`);
  }

  // Show sample changes
  if (stats.changes.length > 0) {
    console.log(`\n📝 Sample changes (first 10):`);
    stats.changes.slice(0, 10).forEach(change => {
      console.log(`  ${change.shopName}`);
      console.log(`    Old: ${change.oldCategory || 'None'} → New: ${change.newCategory} (${change.method})`);
    });
    if (stats.changes.length > 10) {
      console.log(`  ... and ${stats.changes.length - 10} more changes`);
    }
  }

  console.log("\n✅ Classification complete!");
  console.log("=".repeat(80));
}

// Run the script
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});


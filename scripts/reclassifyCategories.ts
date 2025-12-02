/**
 * Reclassify Categories Script
 * 
 * This script rebuilds the category system in Supabase:
 * 1. Creates/renames categories to final structure (preserving UUIDs)
 * 2. Reassigns all shops to correct new categories
 * 3. Logs all changes
 * 4. Verifies results
 * 
 * Usage: npm run reclassify-categories
 * Or: npx tsx scripts/reclassifyCategories.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// FINAL CATEGORY STRUCTURE
// ============================================================================

interface CategoryDefinition {
  name: string;
  description: string;
  oldNames?: string[]; // Old names that should be renamed to this
  isMainCategory: boolean;
}

const FINAL_CATEGORIES: CategoryDefinition[] = [
  // Main Categories
  { name: 'Beauty Services', description: 'Hair salons, nail salons, barbershops, eyelash salons, beauty services', isMainCategory: true },
  { name: 'Spa, Onsen & Relaxation', description: 'Spas, onsen (hot springs), massage, relaxation services, ryokan baths', isMainCategory: true },
  { name: 'Hotels & Stays', description: 'Hotels, ryokan (traditional inns), guesthouses, accommodations', isMainCategory: true },
  { name: 'Dining & Izakaya', description: 'Restaurants, izakaya (Japanese pubs), cafes, bars, dining establishments', isMainCategory: true },
  { name: 'Clinics & Medical Care', description: 'Dental clinics, medical clinics, aesthetic clinics, women\'s clinics, wellness clinics', isMainCategory: true },
  { name: 'Activities & Sports', description: 'Golf courses, gyms, sports facilities, activity centers, recreational activities', isMainCategory: true },
  { name: 'Unknown', description: 'Uncategorized shops', isMainCategory: true },
  
  // Beauty Services Subcategories
  { name: 'Hair Salon', description: 'Hair styling and coloring services', oldNames: [], isMainCategory: false },
  { name: 'Nail Salon', description: 'Nail care and manicure services', oldNames: [], isMainCategory: false },
  { name: 'Eyelash / Eyebrow', description: 'Eyelash extensions and eyebrow treatments', oldNames: ['Eyelash & Eyebrow', 'Eyelash', 'Eyebrow'], isMainCategory: false },
  { name: 'Beauty Salon', description: 'General beauty and cosmetic services', oldNames: [], isMainCategory: false },
  { name: 'General Salon', description: 'Multi-service salon', oldNames: [], isMainCategory: false },
  { name: 'Barbershop', description: 'Men\'s haircuts and grooming', oldNames: ['Barber Shop'], isMainCategory: false },
  { name: 'Waxing', description: 'Waxing and hair removal services', oldNames: ['Waxing Shop'], isMainCategory: false },
  
  // Spa, Onsen & Relaxation Subcategories
  { name: 'Spa', description: 'Spa treatments and wellness services', oldNames: ['Spa & Massage'], isMainCategory: false },
  { name: 'Massages', description: 'Massage therapy and relaxation', oldNames: ['Massage'], isMainCategory: false },
  { name: 'Onsen', description: 'Traditional Japanese hot springs', oldNames: [], isMainCategory: false },
  { name: 'Ryokan Onsen', description: 'Traditional Japanese inns with onsen', oldNames: ['Onsen & Ryokan', 'Ryokan'], isMainCategory: false },
  
  // Hotels & Stays Subcategories
  { name: 'Hotel', description: 'Hotels and accommodations', oldNames: [], isMainCategory: false },
  { name: 'Boutique Hotel', description: 'Boutique and design hotels', oldNames: [], isMainCategory: false },
  { name: 'Guest House', description: 'Guesthouses and budget accommodations', oldNames: ['Guesthouse'], isMainCategory: false },
  { name: 'Ryokan Stay', description: 'Traditional Japanese inn accommodations', oldNames: ['Ryokan'], isMainCategory: false },
  
  // Dining & Izakaya Subcategories
  { name: 'Restaurant', description: 'Restaurants and dining establishments', oldNames: [], isMainCategory: false },
  { name: 'Izakaya', description: 'Japanese casual dining and drinking establishments', oldNames: ['Izakaya & Bar'], isMainCategory: false },
  { name: 'Karaoke', description: 'Private karaoke rooms and karaoke establishments', oldNames: ['Private Karaoke Rooms'], isMainCategory: false },
  
  // Clinics & Medical Care Subcategories
  { name: 'Dental Clinic', description: 'Dental care and dental clinics', oldNames: [], isMainCategory: false },
  { name: 'Eye Clinic', description: 'Eye care and ophthalmology clinics', oldNames: ['Ophthalmology'], isMainCategory: false },
  { name: 'Women\'s Clinic', description: 'Women\'s health and care clinics', oldNames: ['Womens Clinic'], isMainCategory: false },
  { name: 'Wellness Clinic', description: 'Wellness and preventive care clinics', oldNames: [], isMainCategory: false },
  
  // Activities & Sports Subcategories
  { name: 'Golf', description: 'Golf courses', oldNames: ['Golf Course', 'Golf Courses & Practice Ranges'], isMainCategory: false },
  { name: 'Golf Practice Range', description: 'Golf practice ranges and driving ranges', oldNames: ['Golf Practice'], isMainCategory: false },
  { name: 'Pilates', description: 'Pilates studios and classes', oldNames: [], isMainCategory: false },
  { name: 'Yoga', description: 'Yoga studios and classes', oldNames: [], isMainCategory: false },
];

// Mapping rules: Old category names → New main category
const CATEGORY_MAPPING: Record<string, string> = {
  // Beauty Services
  'Hair Salon': 'Beauty Services',
  'Nail Salon': 'Beauty Services',
  'Eyelash': 'Beauty Services',
  'Eyelash & Eyebrow': 'Beauty Services',
  'Eyebrow': 'Beauty Services',
  'Beauty Salon': 'Beauty Services',
  'General Salon': 'Beauty Services',
  'Barbershop': 'Beauty Services',
  'Barber Shop': 'Beauty Services',
  'Waxing': 'Beauty Services',
  'Waxing Shop': 'Beauty Services',
  
  // Spa, Onsen & Relaxation
  'Spa': 'Spa, Onsen & Relaxation',
  'Spa & Massage': 'Spa, Onsen & Relaxation',
  'Massages': 'Spa, Onsen & Relaxation',
  'Massage': 'Spa, Onsen & Relaxation',
  'Onsen': 'Spa, Onsen & Relaxation',
  'Ryokan Onsen': 'Spa, Onsen & Relaxation',
  'Onsen & Ryokan': 'Spa, Onsen & Relaxation',
  'Ryokan': 'Spa, Onsen & Relaxation',
  
  // Hotels & Stays
  'Hotel': 'Hotels & Stays',
  'Boutique Hotel': 'Hotels & Stays',
  'Guest House': 'Hotels & Stays',
  'Guesthouse': 'Hotels & Stays',
  'Ryokan Stay': 'Hotels & Stays',
  'Hotels & Ryokan': 'Hotels & Stays',
  
  // Dining & Izakaya
  'Restaurant': 'Dining & Izakaya',
  'Restaurants & Izakaya': 'Dining & Izakaya',
  'Izakaya': 'Dining & Izakaya',
  'Izakaya & Bar': 'Dining & Izakaya',
  'Karaoke': 'Dining & Izakaya',
  'Private Karaoke Rooms': 'Dining & Izakaya',
  
  // Clinics & Medical Care
  'Dental Clinic': 'Clinics & Medical Care',
  'Eye Clinic': 'Clinics & Medical Care',
  'Ophthalmology': 'Clinics & Medical Care',
  'Women\'s Clinic': 'Clinics & Medical Care',
  'Womens Clinic': 'Clinics & Medical Care',
  'Wellness Clinic': 'Clinics & Medical Care',
  'Medical Clinic': 'Clinics & Medical Care',
  'Aesthetic Clinic': 'Clinics & Medical Care',
  
  // Activities & Sports
  'Golf': 'Activities & Sports',
  'Golf Course': 'Activities & Sports',
  'Golf Practice Range': 'Activities & Sports',
  'Golf Practice': 'Activities & Sports',
  'Golf Courses & Practice Ranges': 'Activities & Sports',
  'Pilates': 'Activities & Sports',
  'Yoga': 'Activities & Sports',
  'Sports': 'Activities & Sports',
  'Sports Facility': 'Activities & Sports',
};

// ============================================================================
// Helper Functions
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Shop {
  id: string;
  name: string;
  category_id: string | null;
}

interface ChangeLog {
  shopId: string;
  shopName: string;
  oldCategoryName: string;
  newCategoryName: string;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Ensure all final categories exist (create or rename)
 */
async function ensureFinalCategories(): Promise<Map<string, string>> {
  console.log('📋 Ensuring final categories exist...');
  const categoryMap = new Map<string, string>();
  
  for (const categoryDef of FINAL_CATEGORIES) {
    // Check if category with exact name exists
    let { data: existing, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', categoryDef.name)
      .single();
    
    if (existing) {
      // Category exists with correct name
      categoryMap.set(categoryDef.name, existing.id);
      console.log(`✅ Category "${categoryDef.name}" exists (${existing.id})`);
    } else {
      // Check if category with old name exists
      let found = false;
      if (categoryDef.oldNames && categoryDef.oldNames.length > 0) {
        for (const oldName of categoryDef.oldNames) {
          const { data: oldCategory } = await supabase
            .from('categories')
            .select('id, name')
            .eq('name', oldName)
            .single();
          
          if (oldCategory) {
            // Rename existing category to preserve UUID
            const { error: updateError } = await supabase
              .from('categories')
              .update({ 
                name: categoryDef.name,
                description: categoryDef.description 
              })
              .eq('id', oldCategory.id);
            
            if (updateError) {
              console.error(`❌ Error renaming "${oldName}" to "${categoryDef.name}":`, updateError);
            } else {
              categoryMap.set(categoryDef.name, oldCategory.id);
              console.log(`🔄 Renamed "${oldName}" → "${categoryDef.name}" (${oldCategory.id})`);
              found = true;
              break;
            }
          }
        }
      }
      
      if (!found) {
        // Create new category
        const { data: newCategory, error: insertError } = await supabase
          .from('categories')
          .insert({
            name: categoryDef.name,
            description: categoryDef.description,
          })
          .select('id')
          .single();
        
        if (insertError) {
          console.error(`❌ Error creating category "${categoryDef.name}":`, insertError);
        } else if (newCategory) {
          categoryMap.set(categoryDef.name, newCategory.id);
          console.log(`➕ Created category "${categoryDef.name}" (${newCategory.id})`);
        }
      }
    }
    
    await sleep(50); // Small delay to avoid overwhelming the database
  }
  
  return categoryMap;
}

/**
 * Get category name by ID
 */
async function getCategoryNameById(categoryId: string | null, categoryMap: Map<string, string>): Promise<string> {
  if (!categoryId) return 'None';
  
  // Reverse lookup in categoryMap
  for (const [name, id] of categoryMap.entries()) {
    if (id === categoryId) {
      return name;
    }
  }
  
  // Fallback: query database
  const { data } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single();
  
  return data?.name || 'Unknown';
}

/**
 * Reassign shops to correct categories
 */
async function reassignShops(categoryMap: Map<string, string>): Promise<ChangeLog[]> {
  console.log('\n🔄 Reassigning shops to correct categories...');
  const changes: ChangeLog[] = [];
  
  // Get all shops
  let offset = 0;
  const limit = 1000;
  let allShops: Shop[] = [];
  
  while (true) {
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, category_id')
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ Error fetching shops:', error);
      break;
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    allShops = allShops.concat(data);
    offset += limit;
  }
  
  console.log(`📊 Found ${allShops.length} shops to process`);
  
  const unknownCategoryId = categoryMap.get('Unknown');
  if (!unknownCategoryId) {
    throw new Error('Unknown category not found!');
  }
  
  // Process each shop
  for (const shop of allShops) {
    const oldCategoryName = await getCategoryNameById(shop.category_id, categoryMap);
    let newCategoryName: string | null = null;
    
    // Find new category using mapping rules
    if (oldCategoryName && oldCategoryName !== 'None' && oldCategoryName !== 'Unknown') {
      newCategoryName = CATEGORY_MAPPING[oldCategoryName] || null;
    }
    
    // If no mapping found, try keyword matching on shop name/description
    if (!newCategoryName && shop.name) {
      const shopNameLower = shop.name.toLowerCase();
      
      // Beauty Services keywords
      if (shopNameLower.includes('hair') || shopNameLower.includes('nail') || 
          shopNameLower.includes('barber') || shopNameLower.includes('beauty') ||
          shopNameLower.includes('salon') || shopNameLower.includes('eyelash') ||
          shopNameLower.includes('waxing') || shopNameLower.includes('美容') ||
          shopNameLower.includes('ネイル') || shopNameLower.includes('ヘア')) {
        newCategoryName = 'Beauty Services';
      }
      // Spa, Onsen & Relaxation keywords
      else if (shopNameLower.includes('spa') || shopNameLower.includes('massage') ||
               shopNameLower.includes('onsen') || shopNameLower.includes('ryokan') ||
               shopNameLower.includes('温泉') || shopNameLower.includes('スパ') ||
               shopNameLower.includes('マッサージ')) {
        newCategoryName = 'Spa, Onsen & Relaxation';
      }
      // Hotels & Stays keywords
      else if (shopNameLower.includes('hotel') || shopNameLower.includes('guesthouse') ||
               shopNameLower.includes('accommodation') || shopNameLower.includes('ホテル') ||
               shopNameLower.includes('旅館') || shopNameLower.includes('宿泊')) {
        newCategoryName = 'Hotels & Stays';
      }
      // Dining & Izakaya keywords
      else if (shopNameLower.includes('restaurant') || shopNameLower.includes('izakaya') ||
               shopNameLower.includes('karaoke') || shopNameLower.includes('cafe') ||
               shopNameLower.includes('レストラン') || shopNameLower.includes('居酒屋') ||
               shopNameLower.includes('カラオケ') || shopNameLower.includes('カフェ')) {
        newCategoryName = 'Dining & Izakaya';
      }
      // Clinics & Medical Care keywords
      else if (shopNameLower.includes('clinic') || shopNameLower.includes('dental') ||
               shopNameLower.includes('medical') || shopNameLower.includes('hospital') ||
               shopNameLower.includes('クリニック') || shopNameLower.includes('医院') ||
               shopNameLower.includes('病院') || shopNameLower.includes('歯科')) {
        newCategoryName = 'Clinics & Medical Care';
      }
      // Activities & Sports keywords
      else if (shopNameLower.includes('golf') || shopNameLower.includes('sports') ||
               shopNameLower.includes('pilates') || shopNameLower.includes('yoga') ||
               shopNameLower.includes('ゴルフ') || shopNameLower.includes('スポーツ')) {
        newCategoryName = 'Activities & Sports';
      }
    }
    
    // Default to Unknown if no match
    if (!newCategoryName) {
      newCategoryName = 'Unknown';
    }
    
    const newCategoryId = categoryMap.get(newCategoryName);
    if (!newCategoryId) {
      console.error(`❌ Category "${newCategoryName}" not found in categoryMap!`);
      continue;
    }
    
    // Update shop if category changed
    if (shop.category_id !== newCategoryId) {
      const { error: updateError } = await supabase
        .from('shops')
        .update({ category_id: newCategoryId })
        .eq('id', shop.id);
      
      if (updateError) {
        console.error(`❌ Error updating shop ${shop.id}:`, updateError);
      } else {
        changes.push({
          shopId: shop.id,
          shopName: shop.name,
          oldCategoryName: oldCategoryName,
          newCategoryName: newCategoryName,
        });
      }
    }
    
    if (changes.length % 100 === 0 && changes.length > 0) {
      console.log(`   Processed ${changes.length} shop reassignments...`);
    }
    
    await sleep(10); // Small delay
  }
  
  return changes;
}

/**
 * Delete old categories that are not in final structure
 */
async function deleteOldCategories(categoryMap: Map<string, string>): Promise<void> {
  console.log('\n🗑️  Deleting old categories...');
  
  const finalCategoryNames = new Set(FINAL_CATEGORIES.map(c => c.name));
  
  // Get all categories
  const { data: allCategories, error } = await supabase
    .from('categories')
    .select('id, name');
  
  if (error) {
    console.error('❌ Error fetching categories:', error);
    return;
  }
  
  if (!allCategories) return;
  
  // Get categories that have shops (for safety)
  const { data: categoriesWithShops } = await supabase
    .from('shops')
    .select('category_id')
    .not('category_id', 'is', null);
  
  const categoriesInUse = new Set(
    categoriesWithShops?.map(s => s.category_id) || []
  );
  
  let deletedCount = 0;
  for (const category of allCategories) {
    if (!finalCategoryNames.has(category.name)) {
      // Only delete if no shops are using it
      if (!categoriesInUse.has(category.id)) {
        const { error: deleteError } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting category "${category.name}":`, deleteError);
        } else {
          console.log(`   🗑️  Deleted old category: "${category.name}"`);
          deletedCount++;
        }
      } else {
        console.log(`   ⚠️  Skipped category "${category.name}" (has ${categoriesInUse.has(category.id) ? 'shops' : 'no shops'})`);
      }
    }
  }
  
  console.log(`✅ Deleted ${deletedCount} old categories`);
}

/**
 * Print verification report
 */
async function printVerificationReport(categoryMap: Map<string, string>): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICATION REPORT');
  console.log('='.repeat(80));
  
  // Main categories
  console.log('\n📋 Main Categories:');
  const mainCategories = FINAL_CATEGORIES.filter(c => c.isMainCategory);
  
  for (const mainCat of mainCategories) {
    const categoryId = categoryMap.get(mainCat.name);
    if (!categoryId) continue;
    
    const { count, error } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .or('claim_status.is.null,claim_status.neq.hidden');
    
    if (error) {
      console.error(`   ❌ Error counting ${mainCat.name}:`, error);
    } else {
      console.log(`   ${mainCat.name.padEnd(30)}: ${count || 0} shops`);
    }
  }
  
  // Total shops
  const { count: totalShops } = await supabase
    .from('shops')
    .select('*', { count: 'exact', head: true })
    .or('claim_status.is.null,claim_status.neq.hidden');
  
  console.log(`\n📊 Total Shops: ${totalShops || 0}`);
  
  // Subcategories
  console.log('\n📋 Subcategories:');
  const subcategories = FINAL_CATEGORIES.filter(c => !c.isMainCategory);
  
  for (const subcat of subcategories) {
    const categoryId = categoryMap.get(subcat.name);
    if (!categoryId) continue;
    
    const { count, error } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .or('claim_status.is.null,claim_status.neq.hidden');
    
    if (!error && count && count > 0) {
      console.log(`   ${subcat.name.padEnd(30)}: ${count} shops`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Starting Category Reclassification Script...');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Ensure final categories exist
    const categoryMap = await ensureFinalCategories();
    console.log(`\n✅ Category map created with ${categoryMap.size} categories`);
    
    // Step 2: Reassign shops
    const changes = await reassignShops(categoryMap);
    console.log(`\n✅ Reassigned ${changes.length} shops`);
    
    // Step 3: Delete old categories
    await deleteOldCategories(categoryMap);
    
    // Step 4: Print verification report
    await printVerificationReport(categoryMap);
    
    // Step 5: Save change log
    const logPath = path.join(process.cwd(), 'category_reclassification_log.json');
    fs.writeFileSync(logPath, JSON.stringify(changes, null, 2));
    console.log(`\n📝 Change log saved to: ${logPath}`);
    
    console.log('\n✅ Category reclassification completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();


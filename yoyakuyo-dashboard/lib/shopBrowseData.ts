// lib/shopBrowseData.ts
// Simple data helpers for browse page - NO tree building, NO address parsing

export interface Shop {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  prefecture?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  categories?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  claim_status?: string | null;
  average_rating?: number | null;
  total_reviews?: number | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface FilterOptions {
  prefecture?: string | null;
  categoryId?: string | null;
  searchQuery?: string;
}

/**
 * Get unique list of prefectures from shops array
 * Uses the direct prefecture field - no parsing
 */
export function getUniquePrefectures(shops: Shop[]): string[] {
  const prefectures = shops
    .map(shop => shop.prefecture)
    .filter((pref): pref is string => Boolean(pref && pref.trim()));
  
  return Array.from(new Set(prefectures)).sort();
}

/**
 * Get shop count for a prefecture
 */
export function getPrefectureShopCount(shops: Shop[], prefecture: string): number {
  return shops.filter(shop => shop.prefecture === prefecture).length;
}

/**
 * Get shop count for a category
 */
export function getCategoryShopCount(shops: Shop[], categoryId: string): number {
  return shops.filter(shop => shop.category_id === categoryId).length;
}

/**
 * Filter shops based on simple criteria
 * NO tree building, NO address parsing - just direct field matching
 */
export function filterShops(shops: Shop[], options: FilterOptions): Shop[] {
  let filtered = shops;

  // Filter out hidden shops
  filtered = filtered.filter(shop => shop.claim_status !== 'hidden');

  // Filter by prefecture
  if (options.prefecture) {
    filtered = filtered.filter(shop => shop.prefecture === options.prefecture);
  }

  // Filter by category
  if (options.categoryId) {
    filtered = filtered.filter(shop => shop.category_id === options.categoryId);
  }

  // Filter by search query
  if (options.searchQuery && options.searchQuery.trim()) {
    const query = options.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(shop => {
      // Search in name
      if (shop.name?.toLowerCase().includes(query)) return true;
      
      // Search in city
      if (shop.city?.toLowerCase().includes(query)) return true;
      
      // Search in prefecture
      if (shop.prefecture?.toLowerCase().includes(query)) return true;
      
      // Search in address
      if (shop.address?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }

  return filtered;
}

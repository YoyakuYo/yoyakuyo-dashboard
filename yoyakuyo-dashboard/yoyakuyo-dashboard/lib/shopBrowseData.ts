// apps/dashboard/lib/shopBrowseData.ts
// Data shaping helpers for browse page - converts flat shop list into nested structures

export interface Shop {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  prefecture?: string | null;
  normalized_city?: string | null;
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
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

// Extract prefecture from shop - use backend-provided field
export function extractPrefecture(shop: Shop): string {
  // Use backend-provided prefecture field if available
  if (shop.prefecture && shop.prefecture.trim()) {
    return shop.prefecture.trim();
  }
  // Fallback to 'unknown' if not provided
  return 'unknown';
}

// Extract city from shop - use backend-provided normalized_city field
export function extractCity(shop: Shop): string {
  // Use backend-provided normalized_city field if available
  if (shop.normalized_city && shop.normalized_city.trim()) {
    return shop.normalized_city.trim();
  }
  // Fallback to 'unknown' if not provided
  return 'unknown';
}

// Area tree structure
export interface AreaTree {
  [prefectureKey: string]: {
    name: string; // Display name (localized later)
    code?: string;
    cities: {
      [cityKey: string]: {
        name: string;
        shopCount: number;
        shops: Shop[];
      };
    };
    shopCount: number;
  };
}

// Build area tree: Prefecture → City → Shops
export function buildAreaTree(shops: Shop[]): AreaTree {
  const tree: AreaTree = {};

  for (const shop of shops) {
    // Skip hidden shops
    if (shop.claim_status === 'hidden') continue;

    const prefectureKey = extractPrefecture(shop);
    const cityKey = extractCity(shop);

    // Initialize prefecture if needed
    if (!tree[prefectureKey]) {
      tree[prefectureKey] = {
        name: prefectureKey, // Will be localized in UI
        cities: {},
        shopCount: 0,
      };
    }

    // Initialize city if needed
    if (!tree[prefectureKey].cities[cityKey]) {
      tree[prefectureKey].cities[cityKey] = {
        name: cityKey, // Will be localized in UI
        shopCount: 0,
        shops: [],
      };
    }

    // Add shop
    tree[prefectureKey].cities[cityKey].shops.push(shop);
    tree[prefectureKey].cities[cityKey].shopCount++;
    tree[prefectureKey].shopCount++;
  }

  return tree;
}

// Category tree structure
export interface CategoryTree {
  [categoryId: string]: {
    name: string; // Category name (localized later)
    slug: string;
    shopCount: number;
    prefectures: {
      [prefectureKey: string]: {
        name: string;
        shopCount: number;
        cities: {
          [cityKey: string]: {
            name: string;
            shopCount: number;
            shops: Shop[];
          };
        };
      };
    };
  };
}

// Build category tree: Category → Prefecture → City → Shops
export function buildCategoryTree(shops: Shop[], categories: Category[]): CategoryTree {
  const tree: CategoryTree = {};
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

  for (const shop of shops) {
    // Skip hidden shops
    if (shop.claim_status === 'hidden') continue;

    const categoryId = shop.category_id || 'unknown';
    const category = categoryMap.get(categoryId) || shop.categories;
    const categoryName = category?.name || 'Unknown';

    const prefectureKey = extractPrefecture(shop);
    const cityKey = extractCity(shop);

    // Initialize category if needed
    if (!tree[categoryId]) {
      tree[categoryId] = {
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
        shopCount: 0,
        prefectures: {},
      };
    }

    // Initialize prefecture if needed
    if (!tree[categoryId].prefectures[prefectureKey]) {
      tree[categoryId].prefectures[prefectureKey] = {
        name: prefectureKey, // Will be localized in UI
        shopCount: 0,
        cities: {},
      };
    }

    // Initialize city if needed
    if (!tree[categoryId].prefectures[prefectureKey].cities[cityKey]) {
      tree[categoryId].prefectures[prefectureKey].cities[cityKey] = {
        name: cityKey, // Will be localized in UI
        shopCount: 0,
        shops: [],
      };
    }

    // Add shop
    tree[categoryId].prefectures[prefectureKey].cities[cityKey].shops.push(shop);
    tree[categoryId].prefectures[prefectureKey].cities[cityKey].shopCount++;
    tree[categoryId].prefectures[prefectureKey].shopCount++;
    tree[categoryId].shopCount++;
  }

  return tree;
}

// Filter shops by search query
export function filterShopsBySearch(shops: Shop[], searchQuery: string): Shop[] {
  if (!searchQuery.trim()) return shops;

  const query = searchQuery.toLowerCase().trim();
  
  return shops.filter(shop => {
    // Search in name
    if (shop.name.toLowerCase().includes(query)) return true;
    
    // Search in address
    if (shop.address?.toLowerCase().includes(query)) return true;
    
    // Search in city
    if (shop.city?.toLowerCase().includes(query)) return true;
    
    // Search in category name
    if (shop.categories?.name.toLowerCase().includes(query)) return true;
    
    return false;
  });
}


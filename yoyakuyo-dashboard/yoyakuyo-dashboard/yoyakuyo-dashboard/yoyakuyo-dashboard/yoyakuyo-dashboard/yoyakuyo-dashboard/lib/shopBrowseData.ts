// lib/shopBrowseData.ts
// Japanese address extraction and area tree building

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

// Area tree structure
export interface AreaTree {
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
}

// Category tree structure
export interface CategoryTree {
  [categoryId: string]: {
    name: string;
    shopCount: number;
    shops: Shop[];
  };
}

// ---------------------------------------------
// PREFECTURE MAP (47 prefectures with major cities)
// ---------------------------------------------
const PREFECTURE_MAP = {
  "北海道": ["札幌市"],
  "青森県": [],
  "岩手県": [],
  "宮城県": ["仙台市"],
  "秋田県": [],
  "山形県": [],
  "福島県": [],
  "茨城県": [],
  "栃木県": [],
  "群馬県": [],
  "埼玉県": ["さいたま市"],
  "千葉県": ["千葉市"],
  "東京都": ["新宿区","渋谷区","品川区","港区","千代田区","豊島区","中野区","世田谷区"],
  "神奈川県": ["横浜市","川崎市"],
  "新潟県": [],
  "富山県": [],
  "石川県": [],
  "福井県": [],
  "山梨県": [],
  "長野県": [],
  "岐阜県": [],
  "静岡県": [],
  "愛知県": ["名古屋市"],
  "三重県": [],
  "滋賀県": [],
  "京都府": ["京都市"],
  "大阪府": ["大阪市"],
  "兵庫県": ["神戸市"],
  "奈良県": [],
  "和歌山県": [],
  "鳥取県": [],
  "島根県": [],
  "岡山県": [],
  "広島県": ["広島市"],
  "山口県": [],
  "徳島県": [],
  "香川県": [],
  "愛媛県": [],
  "高知県": [],
  "福岡県": ["福岡市"],
  "佐賀県": [],
  "長崎県": [],
  "熊本県": ["熊本市"],
  "大分県": [],
  "宮崎県": [],
  "鹿児島県": [],
  "沖縄県": ["那覇市"]
};

// --------------------
// Extract Prefecture
// --------------------
export function extractPrefecture(shop: Shop): string {
  const addr = shop.address || "";

  // 1. Direct prefecture extraction
  for (const prefecture of Object.keys(PREFECTURE_MAP)) {
    if (addr.includes(prefecture)) return prefecture;
  }

  // 2. Deduce prefecture from city ("大阪市" → "大阪府")
  if (shop.city) {
    const cityValue = shop.city;
    for (const [pref, cities] of Object.entries(PREFECTURE_MAP)) {
      if (cities.some(city => cityValue.includes(city))) {
        return pref;
      }
    }
  }

  return "不明";
}

// --------------------
// Extract City
// --------------------
export function extractCity(shop: Shop): string {
  if (shop.city) return shop.city;

  const addr = shop.address || "";

  const cityMatch = addr.match(/([^\s,]+?(市|区|町|村))/);
  if (cityMatch) return cityMatch[1];

  return "不明";
}

// --------------------
// Build Area Tree
// --------------------
export function buildAreaTree(shops: Shop[]): AreaTree {
  const tree: AreaTree = {};

  for (const shop of shops) {
    if (shop.claim_status === "hidden") continue;

    const pref = extractPrefecture(shop);
    const city = extractCity(shop);

    if (!tree[pref]) {
      tree[pref] = {
        name: pref,
        cities: {},
        shopCount: 0
      };
    }

    if (!tree[pref].cities[city]) {
      tree[pref].cities[city] = {
        name: city,
        shopCount: 0,
        shops: []
      };
    }

    tree[pref].cities[city].shops.push(shop);
    tree[pref].cities[city].shopCount++;
    tree[pref].shopCount++;
  }

  return tree;
}

// ---------------------------------------------
// BUILD CATEGORY TREE (Category → Shops)
// ---------------------------------------------
export function buildCategoryTree(shops: Shop[], categories: Category[]): CategoryTree {
  const tree: CategoryTree = {};
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

  for (const shop of shops) {
    if (shop.claim_status === "hidden") continue;

    const categoryId = shop.category_id || "不明";
    const category = categoryMap.get(categoryId) || shop.categories;
    const categoryName = category?.name || "Unnamed";

    if (!tree[categoryId]) {
      tree[categoryId] = {
        name: categoryName,
        shopCount: 0,
        shops: []
      };
    }

    tree[categoryId].shops.push(shop);
    tree[categoryId].shopCount++;
  }

  return tree;
}

/**
 * Get unique list of prefectures from shops array
 * Uses extractPrefecture() which falls back to address parsing if prefecture field is missing
 */
export function getUniquePrefectures(shops: Shop[]): string[] {
  const prefectures = shops
    .map(shop => extractPrefecture(shop))
    .filter(pref => pref && pref !== "不明");
  
  return Array.from(new Set(prefectures)).sort();
}

/**
 * Get shop count for a prefecture
 * Uses extractPrefecture() for accurate matching
 */
export function getPrefectureShopCount(shops: Shop[], prefecture: string): number {
  return shops.filter(shop => extractPrefecture(shop) === prefecture).length;
}

/**
 * Get shop count for a category
 */
export function getCategoryShopCount(shops: Shop[], categoryId: string): number {
  return shops.filter(shop => shop.category_id === categoryId).length;
}

/**
 * Filter shops by search query
 */
export function filterShopsBySearch(shops: Shop[], searchQuery: string): Shop[] {
  if (!searchQuery.trim()) return shops;

  const query = searchQuery.toLowerCase().trim();
  
  return shops.filter(shop => {
    // Search in name
    if (shop.name?.toLowerCase().includes(query)) return true;
    
    // Search in city (uses extractCity for fallback)
    const shopCity = extractCity(shop);
    if (shopCity?.toLowerCase().includes(query)) return true;
    
    // Search in prefecture (uses extractPrefecture for fallback)
    const shopPrefecture = extractPrefecture(shop);
    if (shopPrefecture?.toLowerCase().includes(query)) return true;
    
    // Search in address
    if (shop.address?.toLowerCase().includes(query)) return true;
    
    return false;
  });
}

/**
 * Filter shops based on simple criteria
 * Uses extractPrefecture() for prefecture filtering to support address fallback
 */
export function filterShops(shops: Shop[], options: FilterOptions): Shop[] {
  let filtered = shops;

  // Filter out hidden shops
  filtered = filtered.filter(shop => shop.claim_status !== "hidden");

  // Filter by prefecture (uses extractPrefecture for fallback support)
  if (options.prefecture) {
    filtered = filtered.filter(shop => extractPrefecture(shop) === options.prefecture);
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
      
      // Search in city (uses extractCity for fallback)
      const shopCity = extractCity(shop);
      if (shopCity?.toLowerCase().includes(query)) return true;
      
      // Search in prefecture (uses extractPrefecture for fallback)
      const shopPrefecture = extractPrefecture(shop);
      if (shopPrefecture?.toLowerCase().includes(query)) return true;
      
      // Search in address
      if (shop.address?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }

  return filtered;
}

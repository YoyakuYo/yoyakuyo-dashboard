// lib/browse/shopBrowseData.ts
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

// Extract prefecture from shop - use backend-provided field first
export function extractPrefecture(shop: Shop): string {
  // Use backend-provided prefecture field if available
  if (shop.prefecture && shop.prefecture.trim()) {
    return shop.prefecture.trim();
  }
  
  // Fallback: try to extract from address or city field
  const address = shop.address || '';
  const city = shop.city || '';
  const combined = `${address} ${city}`.toLowerCase();

  // Japanese prefecture names
  const prefecturePatterns: Array<{ pattern: RegExp; name: string; key: string }> = [
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
    { pattern: /岡山県|okayama/i, name: '岡山県', key: 'okayama' },
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

  for (const { pattern, name, key } of prefecturePatterns) {
    if (pattern.test(combined)) {
      return key;
    }
  }

  return 'unknown';
}

// Extract city from shop - use backend-provided normalized_city field first
export function extractCity(shop: Shop): string {
  // Use backend-provided normalized_city field if available
  if (shop.normalized_city && shop.normalized_city.trim()) {
    return shop.normalized_city.trim();
  }
  
  // Fallback: Use city field if available
  if (shop.city && shop.city.trim()) {
    return shop.city.trim();
  }

  // Fallback: Extract from address
  const address = shop.address || '';
  
  // Try to extract ward/city patterns
  // Pattern: "X区", "X市", "X-ku", "X-shi", "X ku", "X shi"
  const patterns = [
    /([^\s,]+)[区市町村]/,
    /([^\s,]+)[-\s](ku|shi|city|ward|区|市|町|村)/i,
  ];

  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: try to get first meaningful word from address
  const words = address.split(/[,\s]+/).filter(w => w.length > 1);
  if (words.length > 0) {
    return words[0];
  }

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


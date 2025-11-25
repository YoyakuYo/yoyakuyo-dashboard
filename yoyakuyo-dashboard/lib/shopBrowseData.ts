// lib/shopBrowseData.ts
// Simple data helpers for browse page with Japanese address extraction support

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
 * Extract prefecture from shop data
 * Uses shop.prefecture if available, otherwise extracts from address using regex
 */
export function extractPrefecture(shop: Shop): string {
  // Use prefecture field if available and valid
  if (shop.prefecture && shop.prefecture.trim() && shop.prefecture !== 'unknown') {
    return shop.prefecture.trim();
  }

  // Fallback: extract from address using regex patterns
  const address = shop.address || '';
  const city = shop.city || '';
  const combined = `${address} ${city}`.toLowerCase();

  // Complete list of all 47 Japanese prefectures
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

/**
 * Extract city/ward from shop data
 * Uses shop.city if available, otherwise extracts from address using regex
 */
export function extractCity(shop: Shop): string {
  // Use city field if available and valid
  if (shop.city && shop.city.trim() && shop.city !== 'unknown') {
    return shop.city.trim();
  }

  // Fallback: extract from address
  const address = shop.address || '';
  
  // Try to extract ward/city patterns
  // Pattern: "X区", "X市", "X町", "X村", "X-ku", "X-shi", "X ku", "X shi"
  const patterns = [
    /([^\s,]+)[区市町村]/,  // Matches Japanese: "X区", "X市", "X町", "X村"
    /([^\s,]+)[-\s](ku|shi|city|ward|区|市|町|村)/i,  // Matches: "X-ku", "X shi", etc.
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

/**
 * Get unique list of prefectures from shops array
 * Uses extractPrefecture() which falls back to address parsing if prefecture field is missing
 */
export function getUniquePrefectures(shops: Shop[]): string[] {
  const prefectures = shops
    .map(shop => extractPrefecture(shop))
    .filter(pref => pref && pref !== 'unknown');
  
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
 * Filter shops based on simple criteria
 * Uses extractPrefecture() for prefecture filtering to support address fallback
 */
export function filterShops(shops: Shop[], options: FilterOptions): Shop[] {
  let filtered = shops;

  // Filter out hidden shops
  filtered = filtered.filter(shop => shop.claim_status !== 'hidden');

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

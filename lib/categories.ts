// Category definitions for Yoyaku Yo landing page
// 13 main categories with Japanese names and Unsplash image mappings
// Each category has 5 different image variations

export interface Category {
  id: string;
  name: string;
  nameJa: string;
  nameEs?: string;
  namePt?: string;
  nameZh?: string;
  imageKey: string;
  unsplashSearch: string; // Primary Unsplash search term
  imageVariations: string[]; // 5 different search terms for variety
  parentId?: string; // For backward compatibility
  isSubcategory?: boolean; // For backward compatibility
}

// 13 main categories for the landing page with 5 image variations each
export const CATEGORIES: Category[] = [
  {
    id: 'hair_salon',
    name: 'Hair Salon',
    nameJa: 'ヘアサロン',
    nameEs: 'Salón de Peluquería',
    namePt: 'Salão de Cabelo',
    nameZh: '美发沙龙',
    imageKey: 'hair-salon',
    unsplashSearch: 'japanese modern hair salon',
    imageVariations: [
      'japanese modern hair salon',
      'tokyo hair salon interior',
      'japanese beauty salon styling',
      'japanese hair salon chair mirror',
      'modern japanese hair salon design',
    ],
  },
  {
    id: 'nail_salon',
    name: 'Nail Salon',
    nameJa: 'ネイルサロン',
    nameEs: 'Salón de Uñas',
    namePt: 'Salão de Unhas',
    nameZh: '美甲沙龙',
    imageKey: 'nail-salon',
    unsplashSearch: 'japanese nail salon interior',
    imageVariations: [
      'japanese nail salon interior',
      'tokyo nail art salon',
      'japanese manicure station',
      'modern nail salon japan',
      'japanese nail design studio',
    ],
  },
  {
    id: 'spa_massage',
    name: 'Spa & Massage',
    nameJa: 'スパ・リラク',
    nameEs: 'Spa y Masaje',
    namePt: 'Spa e Massagem',
    nameZh: '水疗和按摩',
    imageKey: 'spa-massage',
    unsplashSearch: 'luxury japanese spa massage',
    imageVariations: [
      'luxury japanese spa massage',
      'japanese relaxation spa room',
      'tokyo spa treatment room',
      'japanese hot stone massage',
      'modern japanese spa interior',
    ],
  },
  {
    id: 'onsen_ryokan',
    name: 'Onsen & Ryokan',
    nameJa: '温泉・旅館',
    nameEs: 'Onsen y Ryokan',
    namePt: 'Onsen e Ryokan',
    nameZh: '温泉和旅馆',
    imageKey: 'onsen-ryokan',
    unsplashSearch: 'japanese onsen outdoor',
    imageVariations: [
      'japanese onsen outdoor',
      'traditional japanese ryokan room',
      'japanese hot spring mountain',
      'ryokan tatami room japan',
      'japanese onsen bath view',
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    nameJa: 'レストラン',
    nameEs: 'Restaurante',
    namePt: 'Restaurante',
    nameZh: '餐厅',
    imageKey: 'restaurant',
    unsplashSearch: 'tokyo fine dining restaurant',
    imageVariations: [
      'tokyo fine dining restaurant',
      'japanese restaurant interior modern',
      'osaka sushi restaurant counter',
      'japanese izakaya restaurant',
      'tokyo ramen shop interior',
    ],
  },
  {
    id: 'izakaya_bar',
    name: 'Izakaya & Bar',
    nameJa: '居酒屋・バー',
    nameEs: 'Izakaya y Bar',
    namePt: 'Izakaya e Bar',
    nameZh: '居酒屋和酒吧',
    imageKey: 'izakaya-bar',
    unsplashSearch: 'osaka izakaya counter',
    imageVariations: [
      'osaka izakaya counter',
      'tokyo izakaya interior',
      'japanese bar counter night',
      'traditional izakaya japan',
      'modern japanese bar tokyo',
    ],
  },
  {
    id: 'hotel',
    name: 'Hotel',
    nameJa: 'ホテル',
    nameEs: 'Hotel',
    namePt: 'Hotel',
    nameZh: '酒店',
    imageKey: 'hotel',
    unsplashSearch: 'ryokan tatami room',
    imageVariations: [
      'ryokan tatami room',
      'japanese hotel room modern',
      'tokyo luxury hotel lobby',
      'japanese ryokan bedroom',
      'modern japanese hotel interior',
    ],
  },
  {
    id: 'barber_shop',
    name: 'Barber Shop',
    nameJa: '理髪店・バーバー',
    nameEs: 'Barbería',
    namePt: 'Barbearia',
    nameZh: '理发店',
    imageKey: 'barber-shop',
    unsplashSearch: 'japanese barber shop',
    imageVariations: [
      'japanese barber shop',
      'tokyo barbershop interior',
      'modern japanese barber chair',
      'traditional japanese barbershop',
      'japanese mens salon tokyo',
    ],
  },
  {
    id: 'aesthetic_clinic',
    name: 'Aesthetic Clinic',
    nameJa: 'エステ・美容医療',
    nameEs: 'Clínica Estética',
    namePt: 'Clínica Estética',
    nameZh: '美容诊所',
    imageKey: 'aesthetic-clinic',
    unsplashSearch: 'japanese aesthetic clinic',
    imageVariations: [
      'japanese aesthetic clinic',
      'tokyo beauty clinic interior',
      'modern japanese medical spa',
      'japanese cosmetic clinic',
      'tokyo aesthetic treatment room',
    ],
  },
  {
    id: 'golf',
    name: 'Golf',
    nameJa: 'ゴルフ場',
    nameEs: 'Golf',
    namePt: 'Golfe',
    nameZh: '高尔夫',
    imageKey: 'golf',
    unsplashSearch: 'japan golf course morning',
    imageVariations: [
      'japan golf course morning',
      'japanese golf course green',
      'tokyo golf driving range',
      'japanese golf course mountain',
      'modern japanese golf club',
    ],
  },
  {
    id: 'dental_clinic',
    name: 'Dental Clinic',
    nameJa: '歯科',
    nameEs: 'Clínica Dental',
    namePt: 'Clínica Odontológica',
    nameZh: '牙科诊所',
    imageKey: 'dental-clinic',
    unsplashSearch: 'modern japanese dental clinic',
    imageVariations: [
      'modern japanese dental clinic',
      'tokyo dental office interior',
      'japanese dental treatment room',
      'modern dental clinic japan',
      'japanese dentist office design',
    ],
  },
  {
    id: 'womens_clinic',
    name: "Women's Clinic",
    nameJa: 'レディースクリニック',
    nameEs: 'Clínica para Mujeres',
    namePt: 'Clínica Feminina',
    nameZh: '妇科诊所',
    imageKey: 'womens-clinic',
    unsplashSearch: 'japanese womens clinic',
    imageVariations: [
      'japanese womens clinic',
      'tokyo womens health clinic',
      'modern japanese medical clinic',
      'japanese gynecology clinic',
      'tokyo womens clinic interior',
    ],
  },
  {
    id: 'eyelash_eyebrow',
    name: 'Eyelash & Eyebrow',
    nameJa: 'まつげ・眉毛サロン',
    nameEs: 'Pestañas y Cejas',
    namePt: 'Cílios e Sobrancelhas',
    nameZh: '睫毛和眉毛沙龙',
    imageKey: 'eyelash-eyebrow',
    unsplashSearch: 'japanese eyelash salon',
    imageVariations: [
      'japanese eyelash salon',
      'tokyo eyelash extension salon',
      'japanese eyebrow salon interior',
      'modern japanese beauty salon',
      'tokyo lash salon treatment room',
    ],
  },
];

// Helper function to get all categories
export function getAllCategories(): Category[] {
  return CATEGORIES;
}

// Helper function to get category by ID
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

// Helper function to get category name in current language
export function getCategoryName(category: Category, locale: string): string {
  switch (locale) {
    case 'ja':
      return category.nameJa;
    case 'es':
      return category.nameEs || category.name;
    case 'pt-BR':
      return category.namePt || category.name;
    case 'zh':
      return category.nameZh || category.name;
    default:
      return category.name;
  }
}

// Helper function to get Unsplash image URL
export function getUnsplashImageUrl(searchTerm: string, width: number = 800, height: number = 600): string {
  // Using Unsplash Source API for dynamic images
  const encodedSearch = encodeURIComponent(searchTerm);
  return `https://source.unsplash.com/${width}x${height}/?${encodedSearch}`;
}

// Get a specific image variation for a category (0-4)
export function getCategoryImageUrl(category: Category, variationIndex: number = 0, width: number = 800, height: number = 600): string {
  const index = Math.max(0, Math.min(4, variationIndex)); // Clamp between 0-4
  const searchTerm = category.imageVariations[index] || category.imageVariations[0];
  return getUnsplashImageUrl(searchTerm, width, height);
}

// Get all 5 image URLs for a category
export function getAllCategoryImageUrls(category: Category, width: number = 800, height: number = 600): string[] {
  return category.imageVariations.map(searchTerm => getUnsplashImageUrl(searchTerm, width, height));
}

// Get a random image URL for a category
export function getRandomCategoryImageUrl(category: Category, width: number = 800, height: number = 600): string {
  const randomIndex = Math.floor(Math.random() * category.imageVariations.length);
  return getCategoryImageUrl(category, randomIndex, width, height);
}

// Legacy helper functions for backward compatibility
export function getTopLevelCategories(): Category[] {
  return getAllCategories();
}

export function getSubcategories(parentId: string): Category[] {
  // Since we don't have parent-child relationships in the new structure,
  // return empty array for backward compatibility
  return [];
}

export function hasSubcategories(categoryId: string): boolean {
  // Since we don't have parent-child relationships in the new structure,
  // return false for backward compatibility
  return false;
}

// Legacy function for backward compatibility
export function getCategoryImagePath(imageKey: string): string {
  return `/categories/${imageKey}.jpg`;
}

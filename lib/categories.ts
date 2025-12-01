// Category definitions for Yoyaku Yo landing page
// 13 main categories with Japanese names and Unsplash image mappings

export interface Category {
  id: string;
  name: string;
  nameJa: string;
  nameEs?: string;
  namePt?: string;
  nameZh?: string;
  imageKey: string;
  unsplashSearch: string; // Unsplash search term for the image
  parentId?: string; // For backward compatibility
  isSubcategory?: boolean; // For backward compatibility
}

// 13 main categories for the landing page
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

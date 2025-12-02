// Category definitions for Yoyaku Yo
// 6 main categories with subcategories structure
// Matches the database category structure

export interface Category {
  id: string;
  name: string;
  nameJa: string;
  nameEs?: string;
  namePt?: string;
  nameZh?: string;
  imageKey: string;
  unsplashSearch: string;
  imageVariations: string[];
  parentId?: string; // ID of parent main category
  isSubcategory?: boolean; // true if this is a subcategory
  // Database mapping - the actual name in the database
  dbName?: string; // The exact name as stored in the database
}

// 6 MAIN CATEGORIES (parent categories) - These match the database
export const MAIN_CATEGORIES: Category[] = [
  {
    id: 'beauty_services',
    name: 'Beauty Services',
    nameJa: '美容サービス',
    nameEs: 'Servicios de Belleza',
    namePt: 'Serviços de Beleza',
    nameZh: '美容服务',
    imageKey: 'beauty-services',
    unsplashSearch: 'japanese beauty salon',
    imageVariations: [
      'japanese beauty salon',
      'tokyo hair salon interior',
      'japanese nail salon',
      'modern japanese beauty services',
      'japanese beauty treatment',
    ],
    isSubcategory: false,
    dbName: 'Beauty Services',
  },
  {
    id: 'spa_onsen_relaxation',
    name: 'Spa, Onsen & Relaxation',
    nameJa: 'スパ・温泉・リラクゼーション',
    nameEs: 'Spa, Onsen y Relajación',
    namePt: 'Spa, Onsen e Relaxamento',
    nameZh: '水疗、温泉和放松',
    imageKey: 'spa-onsen-relaxation',
    unsplashSearch: 'japanese onsen outdoor',
    imageVariations: [
      'japanese onsen outdoor',
      'luxury japanese spa massage',
      'traditional japanese ryokan room',
      'japanese hot spring mountain',
      'japanese relaxation spa room',
    ],
    isSubcategory: false,
    dbName: 'Spa, Onsen & Relaxation',
  },
  {
    id: 'hotels_stays',
    name: 'Hotels & Stays',
    nameJa: 'ホテル・宿泊',
    nameEs: 'Hoteles y Alojamientos',
    namePt: 'Hotéis e Hospedagens',
    nameZh: '酒店和住宿',
    imageKey: 'hotels-stays',
    unsplashSearch: 'japanese hotel room modern',
    imageVariations: [
      'japanese hotel room modern',
      'tokyo luxury hotel lobby',
      'japanese ryokan bedroom',
      'modern japanese hotel interior',
      'ryokan tatami room',
    ],
    isSubcategory: false,
    dbName: 'Hotels & Stays',
  },
  {
    id: 'dining_izakaya',
    name: 'Dining & Izakaya',
    nameJa: '飲食・居酒屋',
    nameEs: 'Restaurantes e Izakaya',
    namePt: 'Restaurantes e Izakaya',
    nameZh: '餐饮和居酒屋',
    imageKey: 'dining-izakaya',
    unsplashSearch: 'tokyo fine dining restaurant',
    imageVariations: [
      'tokyo fine dining restaurant',
      'osaka izakaya counter',
      'japanese restaurant interior modern',
      'tokyo ramen shop interior',
      'japanese izakaya restaurant',
    ],
    isSubcategory: false,
    dbName: 'Dining & Izakaya',
  },
  {
    id: 'clinics_medical_care',
    name: 'Clinics & Medical Care',
    nameJa: 'クリニック・医療',
    nameEs: 'Clínicas y Atención Médica',
    namePt: 'Clínicas e Cuidados Médicos',
    nameZh: '诊所和医疗',
    imageKey: 'clinics-medical-care',
    unsplashSearch: 'modern japanese medical clinic',
    imageVariations: [
      'modern japanese medical clinic',
      'tokyo dental office interior',
      'japanese aesthetic clinic',
      'tokyo womens health clinic',
      'japanese dental treatment room',
    ],
    isSubcategory: false,
    dbName: 'Clinics & Medical Care',
  },
  {
    id: 'activities_sports',
    name: 'Activities & Sports',
    nameJa: 'アクティビティ・スポーツ',
    nameEs: 'Actividades y Deportes',
    namePt: 'Atividades e Esportes',
    nameZh: '活动和运动',
    imageKey: 'activities-sports',
    unsplashSearch: 'japan golf course morning',
    imageVariations: [
      'japan golf course morning',
      'japanese golf course green',
      'tokyo golf driving range',
      'japanese sports facility',
      'modern japanese golf club',
    ],
    isSubcategory: false,
    dbName: 'Activities & Sports',
  },
];

// SUBCATEGORIES (child categories) - These are the old categories that map to main categories
export const SUBCATEGORIES: Category[] = [
  // Beauty Services subcategories
  {
    id: 'hair_salon',
    name: 'Hair Salon',
    nameJa: 'ヘアサロン',
    nameEs: 'Salón de Peluquería',
    namePt: 'Salão de Cabelo',
    nameZh: '美发沙龙',
    parentId: 'beauty_services',
    isSubcategory: true,
    imageKey: 'hair-salon',
    unsplashSearch: 'japanese modern hair salon',
    imageVariations: [
      'japanese modern hair salon',
      'tokyo hair salon interior',
      'japanese beauty salon styling',
      'japanese hair salon chair mirror',
      'modern japanese hair salon design',
    ],
    dbName: 'Hair Salon',
  },
  {
    id: 'nail_salon',
    name: 'Nail Salon',
    nameJa: 'ネイルサロン',
    nameEs: 'Salón de Uñas',
    namePt: 'Salão de Unhas',
    nameZh: '美甲沙龙',
    parentId: 'beauty_services',
    isSubcategory: true,
    imageKey: 'nail-salon',
    unsplashSearch: 'japanese nail salon interior',
    imageVariations: [
      'japanese nail salon interior',
      'tokyo nail art salon',
      'japanese manicure station',
      'modern nail salon japan',
      'japanese nail design studio',
    ],
    dbName: 'Nail Salon',
  },
  {
    id: 'barber_shop',
    name: 'Barber Shop',
    nameJa: '理髪店・バーバー',
    nameEs: 'Barbería',
    namePt: 'Barbearia',
    nameZh: '理发店',
    parentId: 'beauty_services',
    isSubcategory: true,
    imageKey: 'barber-shop',
    unsplashSearch: 'japanese barber shop',
    imageVariations: [
      'japanese barber shop',
      'tokyo barbershop interior',
      'modern japanese barber chair',
      'traditional japanese barbershop',
      'japanese mens salon tokyo',
    ],
    dbName: 'Barber Shop',
  },
  {
    id: 'eyelash_eyebrow',
    name: 'Eyelash & Eyebrow',
    nameJa: 'まつげ・眉毛サロン',
    nameEs: 'Pestañas y Cejas',
    namePt: 'Cílios e Sobrancelhas',
    nameZh: '睫毛和眉毛沙龙',
    parentId: 'beauty_services',
    isSubcategory: true,
    imageKey: 'eyelash-eyebrow',
    unsplashSearch: 'japanese eyelash salon',
    imageVariations: [
      'japanese eyelash salon',
      'tokyo eyelash extension salon',
      'japanese eyebrow salon interior',
      'modern japanese beauty salon',
      'tokyo lash salon treatment room',
    ],
    dbName: 'Eyelash & Eyebrow',
  },
  
  // Spa, Onsen & Relaxation subcategories
  {
    id: 'spa_massage',
    name: 'Spa & Massage',
    nameJa: 'スパ・リラク',
    nameEs: 'Spa y Masaje',
    namePt: 'Spa e Massagem',
    nameZh: '水疗和按摩',
    parentId: 'spa_onsen_relaxation',
    isSubcategory: true,
    imageKey: 'spa-massage',
    unsplashSearch: 'luxury japanese spa massage',
    imageVariations: [
      'luxury japanese spa massage',
      'japanese relaxation spa room',
      'tokyo spa treatment room',
      'japanese hot stone massage',
      'modern japanese spa interior',
    ],
    dbName: 'Spa & Massage',
  },
  {
    id: 'onsen_ryokan',
    name: 'Onsen & Ryokan',
    nameJa: '温泉・旅館',
    nameEs: 'Onsen y Ryokan',
    namePt: 'Onsen e Ryokan',
    nameZh: '温泉和旅馆',
    parentId: 'spa_onsen_relaxation',
    isSubcategory: true,
    imageKey: 'onsen-ryokan',
    unsplashSearch: 'japanese onsen outdoor',
    imageVariations: [
      'japanese onsen outdoor',
      'traditional japanese ryokan room',
      'japanese hot spring mountain',
      'ryokan tatami room japan',
      'japanese onsen bath view',
    ],
    dbName: 'Onsen & Ryokan',
  },
  
  // Hotels & Stays subcategories
  {
    id: 'hotel',
    name: 'Hotel',
    nameJa: 'ホテル',
    nameEs: 'Hotel',
    namePt: 'Hotel',
    nameZh: '酒店',
    parentId: 'hotels_stays',
    isSubcategory: true,
    imageKey: 'hotel',
    unsplashSearch: 'ryokan tatami room',
    imageVariations: [
      'ryokan tatami room',
      'japanese hotel room modern',
      'tokyo luxury hotel lobby',
      'japanese ryokan bedroom',
      'modern japanese hotel interior',
    ],
    dbName: 'Hotel',
  },
  
  // Dining & Izakaya subcategories
  {
    id: 'restaurant',
    name: 'Restaurant',
    nameJa: 'レストラン',
    nameEs: 'Restaurante',
    namePt: 'Restaurante',
    nameZh: '餐厅',
    parentId: 'dining_izakaya',
    isSubcategory: true,
    imageKey: 'restaurant',
    unsplashSearch: 'tokyo fine dining restaurant',
    imageVariations: [
      'tokyo fine dining restaurant',
      'japanese restaurant interior modern',
      'osaka sushi restaurant counter',
      'japanese izakaya restaurant',
      'tokyo ramen shop interior',
    ],
    dbName: 'Restaurant',
  },
  {
    id: 'izakaya_bar',
    name: 'Izakaya & Bar',
    nameJa: '居酒屋・バー',
    nameEs: 'Izakaya y Bar',
    namePt: 'Izakaya e Bar',
    nameZh: '居酒屋和酒吧',
    parentId: 'dining_izakaya',
    isSubcategory: true,
    imageKey: 'izakaya-bar',
    unsplashSearch: 'osaka izakaya counter',
    imageVariations: [
      'osaka izakaya counter',
      'tokyo izakaya interior',
      'japanese bar counter night',
      'traditional izakaya japan',
      'modern japanese bar tokyo',
    ],
    dbName: 'Izakaya & Bar',
  },
  
  // Clinics & Medical Care subcategories
  {
    id: 'aesthetic_clinic',
    name: 'Aesthetic Clinic',
    nameJa: 'エステ・美容医療',
    nameEs: 'Clínica Estética',
    namePt: 'Clínica Estética',
    nameZh: '美容诊所',
    parentId: 'clinics_medical_care',
    isSubcategory: true,
    imageKey: 'aesthetic-clinic',
    unsplashSearch: 'japanese aesthetic clinic',
    imageVariations: [
      'japanese aesthetic clinic',
      'tokyo beauty clinic interior',
      'modern japanese medical spa',
      'japanese cosmetic clinic',
      'tokyo aesthetic treatment room',
    ],
    dbName: 'Aesthetic Clinic',
  },
  {
    id: 'dental_clinic',
    name: 'Dental Clinic',
    nameJa: '歯科',
    nameEs: 'Clínica Dental',
    namePt: 'Clínica Odontológica',
    nameZh: '牙科诊所',
    parentId: 'clinics_medical_care',
    isSubcategory: true,
    imageKey: 'dental-clinic',
    unsplashSearch: 'modern japanese dental clinic',
    imageVariations: [
      'modern japanese dental clinic',
      'tokyo dental office interior',
      'japanese dental treatment room',
      'modern dental clinic japan',
      'japanese dentist office design',
    ],
    dbName: 'Dental Clinic',
  },
  {
    id: 'womens_clinic',
    name: "Women's Clinic",
    nameJa: 'レディースクリニック',
    nameEs: 'Clínica para Mujeres',
    namePt: 'Clínica Feminina',
    nameZh: '妇科诊所',
    parentId: 'clinics_medical_care',
    isSubcategory: true,
    imageKey: 'womens-clinic',
    unsplashSearch: 'japanese womens clinic',
    imageVariations: [
      'japanese womens clinic',
      'tokyo womens health clinic',
      'modern japanese medical clinic',
      'japanese gynecology clinic',
      'tokyo womens clinic interior',
    ],
    dbName: "Women's Clinic",
  },
  
  // Activities & Sports subcategories
  {
    id: 'golf',
    name: 'Golf',
    nameJa: 'ゴルフ場',
    nameEs: 'Golf',
    namePt: 'Golfe',
    nameZh: '高尔夫',
    parentId: 'activities_sports',
    isSubcategory: true,
    imageKey: 'golf',
    unsplashSearch: 'japan golf course morning',
    imageVariations: [
      'japan golf course morning',
      'japanese golf course green',
      'tokyo golf driving range',
      'japanese golf course mountain',
      'modern japanese golf club',
    ],
    dbName: 'Golf',
  },
];

// Combined list of all categories (main + subcategories)
export const CATEGORIES: Category[] = [...MAIN_CATEGORIES, ...SUBCATEGORIES];

// Helper function to get all categories
export function getAllCategories(): Category[] {
  return CATEGORIES;
}

// Helper function to get only main categories
export function getMainCategories(): Category[] {
  return MAIN_CATEGORIES;
}

// Helper function to get category by ID
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

// Helper function to get category by database name
export function getCategoryByDbName(dbName: string): Category | undefined {
  return CATEGORIES.find(cat => cat.dbName === dbName);
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

// Get subcategories for a parent category
export function getSubcategories(parentId: string): Category[] {
  return SUBCATEGORIES.filter(cat => cat.parentId === parentId);
}

// Check if a category has subcategories
export function hasSubcategories(categoryId: string): boolean {
  return SUBCATEGORIES.some(cat => cat.parentId === categoryId);
}

// Get parent category for a subcategory
export function getParentCategory(categoryId: string): Category | undefined {
  const category = getCategoryById(categoryId);
  if (!category || !category.parentId) return undefined;
  return getCategoryById(category.parentId);
}

// Legacy helper functions for backward compatibility
export function getTopLevelCategories(): Category[] {
  return getMainCategories();
}

// Legacy function for backward compatibility
export function getCategoryImagePath(imageKey: string): string {
  return `/categories/${imageKey}.jpg`;
}

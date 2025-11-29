// apps/dashboard/lib/categories.ts
// Category definitions with Japanese names and image mappings
// Supports hierarchical categories with parent-child relationships

export interface Category {
  id: string;
  name: string;
  nameJa: string;
  imageKey: string;
  parentId?: string; // ID of parent category (for subcategories)
  isSubcategory?: boolean; // True if this is a subcategory
}

// Category mapping: English name -> Japanese name -> image filename
// Beauty Salon is the parent, with Hair Salon, Nail Salon, and Eyelash as subcategories
export const CATEGORIES: Category[] = [
  {
    id: 'restaurants_izakaya',
    name: 'Restaurants & Izakaya',
    nameJa: 'レストラン・居酒屋',
    imageKey: 'restaurant',
  },
  {
    id: 'hotels_ryokan',
    name: 'Hotels & Ryokan',
    nameJa: 'ホテル・旅館',
    imageKey: 'hotel',
  },
  {
    id: 'beauty_salon',
    name: 'Beauty Salon',
    nameJa: '美容サロン',
    imageKey: 'beauty-salon',
  },
  {
    id: 'hair_salon',
    name: 'Hair Salon',
    nameJa: 'ヘアサロン',
    imageKey: 'hair-salon',
    parentId: 'beauty_salon',
    isSubcategory: true,
  },
  {
    id: 'nail_salon',
    name: 'Nail Salon',
    nameJa: 'ネイルサロン',
    imageKey: 'nails',
    parentId: 'beauty_salon',
    isSubcategory: true,
  },
  {
    id: 'eyelash',
    name: 'Eyelash',
    nameJa: 'まつげ',
    imageKey: 'eyelash',
    parentId: 'beauty_salon',
    isSubcategory: true,
  },
  {
    id: 'barbershop',
    name: 'Barbershop',
    nameJa: '理髪店',
    imageKey: 'barber',
  },
  {
    id: 'spa_massage',
    name: 'Spa & Massage',
    nameJa: 'スパ・マッサージ',
    imageKey: 'spa',
  },
  {
    id: 'onsen_bathhouses',
    name: 'Onsen & Day-use Bathhouses',
    nameJa: '温泉・銭湯',
    imageKey: 'onsen',
  },
  {
    id: 'dental_clinic',
    name: 'Dental Clinic',
    nameJa: '歯科',
    imageKey: 'dental',
  },
  {
    id: 'womens_clinic',
    name: "Women's Clinic",
    nameJa: '婦人科',
    imageKey: 'womens-clinic',
  },
  {
    id: 'golf_courses_ranges',
    name: 'Golf Courses & Practice Ranges',
    nameJa: 'ゴルフ場・練習場',
    imageKey: 'golf',
  },
  {
    id: 'private_karaoke_rooms',
    name: 'Private Karaoke Rooms',
    nameJa: 'カラオケルーム',
    imageKey: 'karaoke',
  },
];

// Helper function to get all top-level categories (no parent)
export function getTopLevelCategories(): Category[] {
  return CATEGORIES.filter(cat => !cat.isSubcategory && !cat.parentId);
}

// Helper function to get subcategories of a parent category
export function getSubcategories(parentId: string): Category[] {
  return CATEGORIES.filter(cat => cat.parentId === parentId);
}

// Helper function to check if a category has subcategories
export function hasSubcategories(categoryId: string): boolean {
  return CATEGORIES.some(cat => cat.parentId === categoryId);
}

// Get category image path
export function getCategoryImagePath(imageKey: string): string {
  return `/categories/${imageKey}.jpg`;
}


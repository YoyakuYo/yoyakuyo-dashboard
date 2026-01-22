// apps/dashboard/lib/categories.ts
// Category definitions with Japanese names and image mappings

export interface Category {
  id: string;
  name: string;
  nameJa: string;
  imageKey: string;
}

// Category mapping: English name -> Japanese name -> image filename
export const CATEGORIES: Category[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    nameJa: 'レストラン',
    imageKey: 'restaurant',
  },
  {
    id: 'izakaya',
    name: 'Izakaya',
    nameJa: '居酒屋',
    imageKey: 'izakaya',
  },
  {
    id: 'hotel',
    name: 'Hotel',
    nameJa: 'ホテル',
    imageKey: 'hotel',
  },
  {
    id: 'ryokan',
    name: 'Ryokan',
    nameJa: '旅館',
    imageKey: 'ryokan',
  },
  {
    id: 'hair_salon',
    name: 'Hair Salon',
    nameJa: 'ヘアサロン',
    imageKey: 'hair-salon',
  },
  {
    id: 'barbershop',
    name: 'Barbershop',
    nameJa: '理髪店',
    imageKey: 'barber',
  },
  {
    id: 'nail_salon',
    name: 'Nail Salon',
    nameJa: 'ネイルサロン',
    imageKey: 'nails',
  },
  {
    id: 'eyelash',
    name: 'Eyelash',
    nameJa: 'まつげ',
    imageKey: 'eyelash',
  },
  {
    id: 'spas_onsen_bathhouses',
    name: 'Spas, Onsen & Day-use Bathhouses',
    nameJa: '温泉・銭湯',
    imageKey: 'onsen',
  },
  {
    id: 'spa_massage',
    name: 'Spa & Massage',
    nameJa: 'スパ・マッサージ',
    imageKey: 'spa',
  },
  {
    id: 'beauty_salon',
    name: 'Beauty Salon',
    nameJa: '美容サロン',
    imageKey: 'beauty-salon',
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

// Get category image path
export function getCategoryImagePath(imageKey: string): string {
  return `/categories/${imageKey}.jpg`;
}


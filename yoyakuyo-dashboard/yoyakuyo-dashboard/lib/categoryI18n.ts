// Category i18n helpers
// The DB/category strings are not consistent (different languages, punctuation, &/and, etc.)
// This file normalizes them into stable message keys under `categories.*`.

export type CategoryI18nKey =
  | 'all'
  | 'unknown'
  | 'barbershop'
  | 'beauty_salon'
  | 'beauty_services'
  | 'hair_salon'
  | 'nail_salon'
  | 'general_salon'
  | 'eyelash'
  | 'eyelash_eyebrow'
  | 'spa_massage'
  | 'massages'
  | 'spa_onsen_relaxation'
  | 'onsen'
  | 'hotels_ryokan'
  | 'hotels_stays'
  | 'hotel'
  | 'boutique_hotel'
  | 'guest_house'
  | 'ryokan_stay'
  | 'ryokan_onsen'
  | 'dining_izakaya'
  | 'restaurants_izakaya'
  | 'restaurant'
  | 'izakaya'
  | 'karaoke'
  | 'private_karaoke_rooms'
  | 'clinics_medical_care'
  | 'dental_clinic'
  | 'womens_clinic'
  | 'eye_clinic'
  | 'wellness_clinic'
  | 'activities_sports'
  | 'golf'
  | 'golf_practice_range'
  | 'golf_courses_ranges'
  | 'pilates'
  | 'yoga'
  | 'waxing';

function normalizeForLookup(input: string): string {
  return input
    .trim()
    .replace(/[’'`]/g, '') // remove apostrophes
    .replace(/&/g, ' and ')
    .replace(/\//g, ' ')
    .replace(/[(),.]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Exact + normalized aliases -> canonical i18n key (without the `categories.` prefix)
const ALIASES: Record<string, CategoryI18nKey> = {
  // Unknown
  unknown: 'unknown',
  '不明': 'unknown',
  'unknown category': 'unknown',

  // Beauty services (main)
  'beauty services': 'beauty_services',
  '美容サービス': 'beauty_services',

  // Spa/Onsen (main)
  'spa onsen relaxation': 'spa_onsen_relaxation',
  'spa onsen and relaxation': 'spa_onsen_relaxation',
  'spa, onsen & relaxation': 'spa_onsen_relaxation',
  'spa, onsen and relaxation': 'spa_onsen_relaxation',
  'スパ・温泉・リラクゼーション': 'spa_onsen_relaxation',

  // Hotels (main)
  'hotels stays': 'hotels_stays',
  'hotels and stays': 'hotels_stays',
  'hotels & stays': 'hotels_stays',
  'ホテル・宿泊': 'hotels_stays',

  // Dining (main)
  'dining izakaya': 'dining_izakaya',
  'dining and izakaya': 'dining_izakaya',
  'dining & izakaya': 'dining_izakaya',
  '飲食・居酒屋': 'dining_izakaya',

  // Clinics (main)
  'clinics medical care': 'clinics_medical_care',
  'clinics and medical care': 'clinics_medical_care',
  'clinics & medical care': 'clinics_medical_care',
  'クリニック・医療': 'clinics_medical_care',

  // Activities (main)
  'activities sports': 'activities_sports',
  'activities and sports': 'activities_sports',
  'activities & sports': 'activities_sports',
  'アクティビティ・スポーツ': 'activities_sports',

  // Subcategories / leaf categories (common)
  barbershop: 'barbershop',
  'barber shop': 'barbershop',
  '理髪店': 'barbershop',
  '理髪店・バーバー': 'barbershop',

  'beauty salon': 'beauty_salon',
  '美容サロン': 'beauty_salon',

  'hair salon': 'hair_salon',
  'ヘアサロン': 'hair_salon',

  'nail salon': 'nail_salon',
  'ネイルサロン': 'nail_salon',

  'general salon': 'general_salon',
  '総合サロン': 'general_salon',

  eyelash: 'eyelash',
  'まつげ': 'eyelash',

  'eyelash eyebrow': 'eyelash_eyebrow',
  'eyelash and eyebrow': 'eyelash_eyebrow',
  'eyelash & eyebrow': 'eyelash_eyebrow',
  'eyelash / eyebrow': 'eyelash_eyebrow',
  'まつげ 眉毛': 'eyelash_eyebrow',
  'まつげ・眉毛': 'eyelash_eyebrow',
  'まつげ・眉毛サロン': 'eyelash_eyebrow',

  'spa & massage': 'spa_massage',
  'spa and massage': 'spa_massage',
  'spa massage': 'spa_massage',
  'スパ・マッサージ': 'spa_massage',

  massages: 'massages',
  'マッサージ': 'massages',

  onsen: 'onsen',
  '温泉': 'onsen',

  hotel: 'hotel',
  'ホテル': 'hotel',
  'boutique hotel': 'boutique_hotel',
  'ブティックホテル': 'boutique_hotel',
  'guest house': 'guest_house',
  'ゲストハウス': 'guest_house',
  'ryokan stay': 'ryokan_stay',
  '旅館 宿泊': 'ryokan_stay',
  'ryokan onsen': 'ryokan_onsen',
  '旅館 温泉': 'ryokan_onsen',

  restaurant: 'restaurant',
  'レストラン': 'restaurant',
  izakaya: 'izakaya',
  '居酒屋': 'izakaya',

  karaoke: 'karaoke',
  'カラオケ': 'karaoke',
  'private karaoke rooms': 'private_karaoke_rooms',
  'カラオケルーム': 'private_karaoke_rooms',

  'dental clinic': 'dental_clinic',
  '歯科': 'dental_clinic',
  'womens clinic': 'womens_clinic',
  "women's clinic": 'womens_clinic',
  'women s clinic': 'womens_clinic',
  '婦人科': 'womens_clinic',
  'eye clinic': 'eye_clinic',
  '眼科': 'eye_clinic',
  'wellness clinic': 'wellness_clinic',

  golf: 'golf',
  'ゴルフ': 'golf',
  'golf practice range': 'golf_practice_range',
  'golf practice ranges': 'golf_practice_range',
  'ゴルフ練習場': 'golf_practice_range',
  'golf courses practice ranges': 'golf_courses_ranges',
  'golf courses and practice ranges': 'golf_courses_ranges',
  'golf courses & practice ranges': 'golf_courses_ranges',

  pilates: 'pilates',
  'ピラティス': 'pilates',
  yoga: 'yoga',
  'ヨガ': 'yoga',

  waxing: 'waxing',
  '脱毛': 'waxing',
};

export function getCategoryI18nKey(raw: string | null | undefined): CategoryI18nKey | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1) Try exact match (handles JP strings cleanly)
  if (ALIASES[trimmed as keyof typeof ALIASES]) {
    return ALIASES[trimmed as keyof typeof ALIASES];
  }

  // 2) Try normalized match (handles punctuation/case)
  const normalized = normalizeForLookup(trimmed);
  if (ALIASES[normalized as keyof typeof ALIASES]) {
    return ALIASES[normalized as keyof typeof ALIASES];
  }

  // 3) Best-effort slug -> category key (safe fallback if messages include it)
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return (slug ? (slug as CategoryI18nKey) : null);
}

export function getCategoryLabel(
  t: (key: string) => string,
  raw: string | null | undefined
): string | null {
  if (!raw) return null;

  const key = getCategoryI18nKey(raw);
  if (!key) return raw;

  const i18nKey = `categories.${key}`;
  try {
    const translated = t(i18nKey);
    if (translated && translated !== i18nKey) return translated;
  } catch {
    // ignore - fall back to raw
  }
  return raw;
}



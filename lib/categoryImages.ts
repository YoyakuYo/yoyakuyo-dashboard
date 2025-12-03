// lib/categoryImages.ts
// Image arrays for each category with specific images
// Marketing descriptions for each category

export interface CategoryMarketing {
  images: string[];
  description: string;
  descriptionJa: string;
}

export const categoryMarketing: Record<string, CategoryMarketing> = {
  // Restaurants & Izakaya
  'restaurant': {
    images: [],
    description: 'Discover authentic Japanese izakaya pubs, traditional restaurants, and modern dining experiences. From cozy neighborhood izakaya to upscale restaurants, find the perfect place for your next meal.',
    descriptionJa: '本格的な居酒屋、伝統的なレストラン、モダンなダイニング体験をお探しください。近所の居酒屋から高級レストランまで、次の食事に最適な場所を見つけましょう。',
  },
  
  // Hotels & Ryokan (legacy key)
  'hotel': {
    images: [
      'https://besthotelshome.com/wp-content/uploads/2020/02/Conrad-Tokyo-Best-Luxury-Hotels-in-Tokyo.jpg',
      'https://66.media.tumblr.com/1096a312af4ac78a80f5ab50e89a0516/tumblr_n33buxuBih1r2doe0o1_1280.jpg',
      'https://misstourist.com/wp-content/uploads/2022/06/4-1-Coolest-hotels-in-Tokyo-with-a-view.jpg',
      'https://urbanpixxels.com/wp-content/uploads/14-11376-post/Koyoto-Ryokan-Hiiragiya-Traditional-Wing.jpg',
      'https://assets.vogue.com/photos/5a31647948b79a4f01f38a11/master/pass/luxury-ryokan-onsen-japan-promo.jpg',
      'https://www.hotelsinheaven.com/wp-content/uploads/2019/01/mandarin-oriental-tokyo-facade-hotel-mobile-scaled.jpg',
    ],
    description: 'Experience traditional Japanese hospitality at ryokan inns or enjoy modern comfort at luxury hotels. From hot spring resorts to city center hotels, find your perfect accommodation.',
    descriptionJa: '旅館で伝統的な日本のおもてなしを体験するか、高級ホテルでモダンな快適さをお楽しみください。温泉リゾートから都心のホテルまで、最適な宿泊施設を見つけましょう。',
  },
  
  // Hotels & Stays (main category - matches imageKey in categories.ts)
  'hotels-stays': {
    images: [],
    description: 'Experience traditional Japanese hospitality at ryokan inns or enjoy modern comfort at luxury hotels. From hot spring resorts to city center hotels, find your perfect accommodation.',
    descriptionJa: '旅館で伝統的な日本のおもてなしを体験するか、高級ホテルでモダンな快適さをお楽しみください。温泉リゾートから都心のホテルまで、最適な宿泊施設を見つけましょう。',
  },
  
  // Beauty Salon (parent)
  'beauty-salon': {
    images: [],
    description: 'Comprehensive beauty services including hair styling, nail art, and eyelash extensions. Find top-rated salons for all your beauty needs.',
    descriptionJa: 'ヘアスタイリング、ネイルアート、まつげエクステンションを含む総合的な美容サービス。すべての美容ニーズに対応する高評価のサロンを見つけましょう。',
  },
  
  // Hair Salon (subcategory)
  'hair-salon': {
    images: [],
    description: 'Professional hair styling, cutting, coloring, and treatments. Book with expert stylists at modern salons across Japan.',
    descriptionJa: 'プロフェッショナルなヘアスタイリング、カット、カラーリング、トリートメント。日本全国のモダンなサロンで専門スタイリストに予約しましょう。',
  },
  
  // Nail Salon (subcategory)
  'nails': {
    images: [],
    description: 'Beautiful nail art, gel manicures, and pedicures. Express your style with creative designs from talented nail artists.',
    descriptionJa: '美しいネイルアート、ジェルマニキュア、ペディキュア。才能あるネイルアーティストによるクリエイティブなデザインでスタイルを表現しましょう。',
  },
  
  // Eyelash (subcategory)
  'eyelash': {
    images: [],
    description: 'Professional eyelash extensions and treatments. Enhance your natural beauty with expert lash services.',
    descriptionJa: 'プロフェッショナルなまつげエクステンションとトリートメント。専門のまつげサービスで自然な美しさを引き立てましょう。',
  },
  
  // Barbershop
  'barber': {
    images: [],
    description: 'Classic and modern barbershop services. Get the perfect cut, shave, and grooming experience.',
    descriptionJa: 'クラシックでモダンな理髪店サービス。完璧なカット、シェービング、グルーミング体験を受けましょう。',
  },
  
  // Spa & Massage
  'spa': {
    images: [],
    description: 'Relax and rejuvenate with professional spa treatments and massages. From hot stone therapy to aromatherapy, find your perfect wellness experience.',
    descriptionJa: 'プロフェッショナルなスパトリートメントとマッサージでリラックスして若返りましょう。ホットストーンセラピーからアロマセラピーまで、完璧なウェルネス体験を見つけましょう。',
  },
  
  // Onsen & Bathhouses
  'onsen': {
    images: [],
    description: 'Experience traditional Japanese hot springs and public bathhouses. Relax in natural mineral waters and enjoy authentic Japanese bathing culture.',
    descriptionJa: '伝統的な日本の温泉と銭湯を体験しましょう。天然の鉱泉水でリラックスし、本格的な日本の入浴文化をお楽しみください。',
  },
  
  // Dental Clinic
  'dental': {
    images: [],
    description: 'Professional dental care and treatments. Find experienced dentists for checkups, cleanings, and specialized procedures.',
    descriptionJa: 'プロフェッショナルな歯科治療とケア。検診、クリーニング、専門治療の経験豊富な歯科医を見つけましょう。',
  },
  
  // Women's Clinic
  'womens-clinic': {
    images: [],
    description: 'Comprehensive women\'s health services and gynecological care. Trusted clinics providing professional medical support.',
    descriptionJa: '総合的な女性の健康サービスと婦人科ケア。プロフェッショナルな医療サポートを提供する信頼できるクリニック。',
  },
  
  // Clinics & Medical Care (main category)
  'clinics-medical-care': {
    images: [],
    description: 'Professional medical and wellness services including dental care, women\'s health, eye clinics, and aesthetic treatments. Trusted clinics providing comprehensive healthcare.',
    descriptionJa: '歯科治療、女性の健康、眼科、美容治療を含むプロフェッショナルな医療およびウェルネスサービス。総合的なヘルスケアを提供する信頼できるクリニック。',
  },
  
  // Golf Courses
  'golf': {
    images: [],
    description: 'Book tee times at premier golf courses and practice ranges. Perfect your swing at top-rated facilities across Japan.',
    descriptionJa: '一流のゴルフコースと練習場でティータイムを予約しましょう。日本全国の高評価施設でスイングを完璧にしましょう。',
  },
  
  // Karaoke
  'karaoke': {
    images: [],
    description: 'Private karaoke rooms for groups and parties. Sing your heart out in comfortable, modern rooms with the latest sound systems.',
    descriptionJa: 'グループやパーティー用のプライベートカラオケルーム。最新の音響システムを備えた快適でモダンなルームで心ゆくまで歌いましょう。',
  },
};

// Get images for a category by imageKey (backward compatibility)
export const categoryImages: Record<string, string[]> = Object.fromEntries(
  Object.entries(categoryMarketing).map(([key, value]) => [key, value.images])
);

// Get images for a category by imageKey
export function getCategoryImages(imageKey: string): string[] {
  return categoryMarketing[imageKey]?.images || categoryImages[imageKey] || [];
}

// Get marketing description for a category
export function getCategoryMarketing(imageKey: string): CategoryMarketing | null {
  return categoryMarketing[imageKey] || null;
}


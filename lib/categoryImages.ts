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
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', // Izakaya alley with lanterns
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', // Traditional Japanese dining room
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', // Modern bar/lounge
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80', // Traditional restaurant interior
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80', // Izakaya exterior at night
      'https://images.unsplash.com/photo-1552569971-1bcd527aca45?w=800&q=80', // Modern restaurant
    ],
    description: 'Discover authentic Japanese izakaya pubs, traditional restaurants, and modern dining experiences. From cozy neighborhood izakaya to upscale restaurants, find the perfect place for your next meal.',
    descriptionJa: '本格的な居酒屋、伝統的なレストラン、モダンなダイニング体験をお探しください。近所の居酒屋から高級レストランまで、次の食事に最適な場所を見つけましょう。',
  },
  
  // Hotels & Ryokan
  'hotel': {
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', // Modern hotel room
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', // Hotel rooftop pool
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80', // Traditional ryokan
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80', // Hotel lobby
      'https://images.unsplash.com/photo-1551882547-ec40c82c007a?w=800&q=80', // Hotel room with city view
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', // Onsen village/ryokan
    ],
    description: 'Experience traditional Japanese hospitality at ryokan inns or enjoy modern comfort at luxury hotels. From hot spring resorts to city center hotels, find your perfect accommodation.',
    descriptionJa: '旅館で伝統的な日本のおもてなしを体験するか、高級ホテルでモダンな快適さをお楽しみください。温泉リゾートから都心のホテルまで、最適な宿泊施設を見つけましょう。',
  },
  
  // Beauty Salon (parent)
  'beauty-salon': {
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    ],
    description: 'Comprehensive beauty services including hair styling, nail art, and eyelash extensions. Find top-rated salons for all your beauty needs.',
    descriptionJa: 'ヘアスタイリング、ネイルアート、まつげエクステンションを含む総合的な美容サービス。すべての美容ニーズに対応する高評価のサロンを見つけましょう。',
  },
  
  // Hair Salon (subcategory)
  'hair-salon': {
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', // Modern hair salon with mirrors
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
    ],
    description: 'Professional hair styling, cutting, coloring, and treatments. Book with expert stylists at modern salons across Japan.',
    descriptionJa: 'プロフェッショナルなヘアスタイリング、カット、カラーリング、トリートメント。日本全国のモダンなサロンで専門スタイリストに予約しましょう。',
  },
  
  // Nail Salon (subcategory)
  'nails': {
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80', // Nail polish collection
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80', // Nail art showcase
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
    ],
    description: 'Beautiful nail art, gel manicures, and pedicures. Express your style with creative designs from talented nail artists.',
    descriptionJa: '美しいネイルアート、ジェルマニキュア、ペディキュア。才能あるネイルアーティストによるクリエイティブなデザインでスタイルを表現しましょう。',
  },
  
  // Eyelash (subcategory)
  'eyelash': {
    images: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    ],
    description: 'Professional eyelash extensions and treatments. Enhance your natural beauty with expert lash services.',
    descriptionJa: 'プロフェッショナルなまつげエクステンションとトリートメント。専門のまつげサービスで自然な美しさを引き立てましょう。',
  },
  
  // Barbershop
  'barber': {
    images: [
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80', // Modern barbershop interior
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', // Barbershop with vintage chairs
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    ],
    description: 'Classic and modern barbershop services. Get the perfect cut, shave, and grooming experience.',
    descriptionJa: 'クラシックでモダンな理髪店サービス。完璧なカット、シェービング、グルーミング体験を受けましょう。',
  },
  
  // Spa & Massage
  'spa': {
    images: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80', // Spa room with massage table
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80', // Hot stone massage
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    ],
    description: 'Relax and rejuvenate with professional spa treatments and massages. From hot stone therapy to aromatherapy, find your perfect wellness experience.',
    descriptionJa: 'プロフェッショナルなスパトリートメントとマッサージでリラックスして若返りましょう。ホットストーンセラピーからアロマセラピーまで、完璧なウェルネス体験を見つけましょう。',
  },
  
  // Onsen & Bathhouses
  'onsen': {
    images: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80', // Traditional onsen village
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', // Onsen resort
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    ],
    description: 'Experience traditional Japanese hot springs and public bathhouses. Relax in natural mineral waters and enjoy authentic Japanese bathing culture.',
    descriptionJa: '伝統的な日本の温泉と銭湯を体験しましょう。天然の鉱泉水でリラックスし、本格的な日本の入浴文化をお楽しみください。',
  },
  
  // Dental Clinic
  'dental': {
    images: [
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80', // Modern dental clinic reception
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
    ],
    description: 'Professional dental care and treatments. Find experienced dentists for checkups, cleanings, and specialized procedures.',
    descriptionJa: 'プロフェッショナルな歯科治療とケア。検診、クリーニング、専門治療の経験豊富な歯科医を見つけましょう。',
  },
  
  // Women's Clinic
  'womens-clinic': {
    images: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80',
    ],
    description: 'Comprehensive women\'s health services and gynecological care. Trusted clinics providing professional medical support.',
    descriptionJa: '総合的な女性の健康サービスと婦人科ケア。プロフェッショナルな医療サポートを提供する信頼できるクリニック。',
  },
  
  // Golf Courses
  'golf': {
    images: [
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
      'https://images.unsplash.com/photo-1532301791573-4e6ce86a085f?w=800&q=80',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
      'https://images.unsplash.com/photo-1532301791573-4e6ce86a085f?w=800&q=80',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
      'https://images.unsplash.com/photo-1532301791573-4e6ce86a085f?w=800&q=80',
    ],
    description: 'Book tee times at premier golf courses and practice ranges. Perfect your swing at top-rated facilities across Japan.',
    descriptionJa: '一流のゴルフコースと練習場でティータイムを予約しましょう。日本全国の高評価施設でスイングを完璧にしましょう。',
  },
  
  // Karaoke
  'karaoke': {
    images: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', // Modern karaoke room with screens
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', // Disco-style karaoke room
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    ],
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
  return categoryMarketing[imageKey]?.images || categoryImages[imageKey] || [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  ];
}

// Get marketing description for a category
export function getCategoryMarketing(imageKey: string): CategoryMarketing | null {
  return categoryMarketing[imageKey] || null;
}


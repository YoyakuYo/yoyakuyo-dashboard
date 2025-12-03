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
  
  // Hotels & Ryokan
  'hotel': {
    images: [
      'https://besthotelshome.com/wp-content/uploads/2020/02/Conrad-Tokyo-Best-Luxury-Hotels-in-Tokyo.jpg',
      'https://66.media.tumblr.com/1096a312af4ac78a80f5ab50e89a0516/tumblr_n33buxuBih1r2doe0o1_1280.jpg',
      'https://misstourist.com/wp-content/uploads/2022/06/4-1-Coolest-hotels-in-Tokyo-with-a-view.jpg',
      'https://urbanpixxels.com/wp-content/uploads/14-11376-post/Koyoto-Ryokan-Hiiragiya-Traditional-Wing.jpg',
      'https://assets.vogue.com/photos/5a31647948b79a4f01f38a11/master/pass/luxury-ryokan-onsen-japan-promo.jpg',
      'https://www.hotelsinheaven.com/wp-content/uploads/2019/01/mandarin-oriental-tokyo-facade-hotel-mobile-scaled.jpg',
      'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/hoshinoya-kyoto-floating-tearoom-3-1549906559.jpg?resize=768:*',
      'https://secure.s.forbestravelguide.com/img/properties/Property-AndazTokyoToranomonHills-Hotel-GuestroomSuite-DeluxeAndazLargeKing-HyattCorporation.jpg',
      'https://twomonkeystravelgroup.com/wp-content/uploads/2016/02/Ultimate-List-of-the-Best-Luxury-Hotels-in-Japan-5.jpg',
      'https://www.erikastravelventures.com/wp-content/uploads/2024/08/4.jpg',
    ],
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
  
  // Clinics & Medical Care (Main Category)
  'clinics-medical-care': {
    images: [
      'https://static.vecteezy.com/system/resources/previews/012/043/583/large_2x/gynecology-medicine-concept-women-s-health-doctor-holding-in-hand-the-hologram-of-female-reproductive-system-and-medical-icons-network-connection-on-virtual-screen-illustration-vector.jpg',
      'https://thumbs.dreamstime.com/z/anatomy-female-reproductive-system-d-illustration-female-gynecology-organs-highlighted-inside-body-anatomy-female-123657563.jpg',
      'https://c8.alamy.com/comp/2HTXG9X/gynecology-and-obstetrics-icon-set-in-colored-line-style-women-reproductive-health-vector-illustration-2HTXG9X.jpg',
      'https://www.womensclinicofatlanta.com/wp-content/uploads/2021/10/home-sti-services.jpg',
      'https://www.rappler.com/tachyon/2022/12/Kindred-Clinic-1.jpg?resize=1279%2C720&zoom=1',
      'https://img.freepik.com/premium-vector/vector-logo-women-s-health-clinic-elegant_626969-43.jpg?w=2000',
      'https://treesforhealth.org/wp-content/uploads/2020/04/shutterstock_581411425.jpg',
      'https://as1.ftcdn.net/v2/jpg/02/95/56/44/1000_F_295564471_QuEZep8kRRwM01Z796dKX5RGgZIyforw.jpg',
      'https://graziamagazine.com/me/wp-content/uploads/sites/16/2024/09/best-aesthetics-clinic-dubai-kings--1024x683.jpeg',
      'https://www.aesthetic-clinics.co.uk/wp-content/uploads/2022/10/AestheticClinicsWeb-300x67.png',
    ],
    description: 'Professional medical care including dental clinics, women\'s health services, aesthetic treatments, and wellness clinics. Find trusted healthcare providers across Japan.',
    descriptionJa: '歯科クリニック、女性の健康サービス、美容治療、ウェルネスクリニックを含むプロフェッショナルな医療ケア。日本全国の信頼できる医療提供者を見つけましょう。',
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


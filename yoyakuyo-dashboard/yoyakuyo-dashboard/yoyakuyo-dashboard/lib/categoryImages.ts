// lib/categoryImages.ts
// Image arrays for each category with specific images
// Marketing descriptions for each category

export interface CategoryMarketing {
  images: string[];
  description: string;
  descriptionJa: string;
}

export const categoryMarketing: Record<string, CategoryMarketing> = {
  // Dining & Izakaya (main category)
  'dining-izakaya': {
    images: [
      'https://www.willflyforfood.net/wp-content/uploads/2020/01/miyako3.jpg',
      'https://media-cdn.tripadvisor.com/media/photo-s/1a/7d/96/e3/photo1jpg.jpg',
      'https://media.timeout.com/images/105746598/1920/1080/image.jpg',
      'https://www.hankyu-hotel.com/en/hotel/dh/dhtokyo/-/media/hotel/dh/dhtokyo/restaurants/images/raunnji/lounge21_new_room/9546_1.jpg?h=300&w=500&la=ja-JP&hash=05109D606B951B47977E1D07FFA1D3FE52CED483',
      'https://tse2.mm.bing.net/th/id/OIP.xP9qQffIuyKuTrZm8ipP5QHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
      'https://media.timeout.com/images/103536311/image.jpg',
      'https://www.willflyforfood.net/wp-content/uploads/2019/02/rai-rai-tei1.jpg.webp',
      'https://th.bing.com/th/id/R.be77f140de9c7ddd3274fe24c665041a?rik=iIGCXYNr0ZE1xw&riu=http%3a%2f%2fdiscoverjapan.blog%2fwp-content%2fuploads%2f2024%2f05%2fdff9e495482cc7de561eed8aa754d085.webp&ehk=UAm%2bDCDta%2fODAfcLEWlVW%2bxYxJRRI%2btYWd8c1VuXKR4%3d&risl=&pid=ImgRaw&r=0',
      'https://a.cdn-hotels.com/gdcs/production198/d1097/cd589259-ee09-472d-98f7-d50fb8d9bff8.jpg?impolicy=fcrop&w=1600&h=1066&q=medium',
    ],
    description: 'Discover authentic Japanese izakaya pubs, traditional restaurants, and modern dining experiences. From cozy neighborhood izakaya to upscale restaurants, find the perfect place for your next meal.',
    descriptionJa: '本格的な居酒屋、伝統的なレストラン、モダンなダイニング体験をお探しください。近所の居酒屋から高級レストランまで、次の食事に最適な場所を見つけましょう。',
  },
  
  // Restaurants & Izakaya (legacy)
  'restaurant': {
    images: [],
    description: 'Discover authentic Japanese izakaya pubs, traditional restaurants, and modern dining experiences. From cozy neighborhood izakaya to upscale restaurants, find the perfect place for your next meal.',
    descriptionJa: '本格的な居酒屋、伝統的なレストラン、モダンなダイニング体験をお探しください。近所の居酒屋から高級レストランまで、次の食事に最適な場所を見つけましょう。',
  },
  
  // Hotels & Ryokan (legacy key)
  'hotel': {
    images: [],
    description: 'Experience traditional Japanese hospitality at ryokan inns or enjoy modern comfort at luxury hotels. From hot spring resorts to city center hotels, find your perfect accommodation.',
    descriptionJa: '旅館で伝統的な日本のおもてなしを体験するか、高級ホテルでモダンな快適さをお楽しみください。温泉リゾートから都心のホテルまで、最適な宿泊施設を見つけましょう。',
  },
  
  // Hotels & Stays (main category - matches imageKey in categories.ts)
  'hotels-stays': {
    images: [
      'https://twomonkeystravelgroup.com/wp-content/uploads/2016/02/Ultimate-List-of-the-Best-Luxury-Hotels-in-Japan-5.jpg',
      'https://www.agoda.com/wp-content/uploads/2024/11/Oriental-Hotel.jpeg',
      'https://media.cntraveler.com/photos/61e11d6518fe5208acfca9a7/16:9/w_2560%2Cc_limit/Suiran%2C-a-Luxury-Collection-Hotel%2C-Kyoto.jpg',
      'https://secure.s.forbestravelguide.com/img/properties/Property-AndazTokyoToranomonHills-Hotel-GuestroomSuite-DeluxeAndazLargeKing-HyattCorporation.jpg',
      'https://secure.s.forbestravelguide.com/img/properties/hotel-the-mitsui-kyoto/hotel-the-mitsui-kyoto-garden.jpg',
      'https://stories-editor.hilton.com/apac/wp-content/uploads/sites/3/2021/09/LXR-ROKU-KYOTO-Hero.jpg?w=1080&h=760&crop=1&q=75',
    ],
    description: 'Experience traditional Japanese hospitality at ryokan inns or enjoy modern comfort at luxury hotels. From hot spring resorts to city center hotels, find your perfect accommodation.',
    descriptionJa: '旅館で伝統的な日本のおもてなしを体験するか、高級ホテルでモダンな快適さをお楽しみください。温泉リゾートから都心のホテルまで、最適な宿泊施設を見つけましょう。',
  },
  
  // Beauty Services (main category)
  'beauty-services': {
    images: [
      'https://i.pinimg.com/originals/08/97/cb/0897cbdc3142bd46bc7742d870a8ada5.jpg',
      'https://barb.pro/uploads/images/blog/1703/1-spring-nail-idea.jpg',
      'https://styleyouroccasion.com/wp-content/uploads/2022/11/Neutral-Nails-Pins-3.jpg',
      'https://comfortel.co.uk/wp-content/uploads/our-favourite-salon-design-trends-202.jpg',
      'https://i.pinimg.com/originals/48/9e/3a/489e3a9554d378d489e6e47b7363207c.jpg',
      'https://images.squarespace-cdn.com/content/v1/615b663e7af04a6b75ad47fa/1634105808237-GZ9K3UX6SFZCKJZB66MC/gotstyleshairsalon.jpg',
      'https://thumbs.dreamstime.com/z/woman-long-eyelashes-beauty-salon-eyelash-extension-woman-long-eyelashes-beauty-salon-eyelash-171786288.jpg',
      'https://thumbs.dreamstime.com/z/beautiful-woman-long-eyelashes-beauty-salon-eyelash-extension-procedure-lashes-close-up-beautiful-woman-long-109072421.jpg',
      'https://forreslocal.com/wp-content/uploads/2022/11/MFH-NEWS-stylestreetbarbers-2216.36-1-scaled.jpg',
      'https://blogz.my/wp-content/uploads/2024/09/Top-5-barber-shop-in-shah-alam-scaled.jpeg',
    ],
    description: 'Comprehensive beauty services including hair styling, nail art, and eyelash extensions. Find top-rated salons for all your beauty needs.',
    descriptionJa: 'ヘアスタイリング、ネイルアート、まつげエクステンションを含む総合的な美容サービス。すべての美容ニーズに対応する高評価のサロンを見つけましょう。',
  },
  
  // Beauty Salon (parent - legacy)
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
  
  // Spa, Onsen & Relaxation (main category)
  'spa-onsen-relaxation': {
    images: [
      'https://anaicbeppu.com/wp-content/uploads/slider16/Main-Onsen-Inside-11.jpeg',
      'https://www.onsen.co.nz/wp-content/uploads/2020/04/Original-Onsen.jpg',
      'https://nzhotpools.co.nz/wp-content/uploads/2017/01/Onsen-3.jpg',
      'https://i.ytimg.com/vi/hgpTL3IMWXc/maxresdefault.jpg',
      'https://i.ytimg.com/vi/Mli3BEsyghs/maxresdefault.jpg',
      'https://tse2.mm.bing.net/th/id/OIP.qLuuEe4oiNOxp3lkG4TYGQHaLH?rs=1&pid=ImgDetMain&o=7&rm=3',
      'https://goodspaguide--live.s3.amazonaws.com/_1200x630_crop_center-center_82_none/Ikbal_spab.jpg?mtime=1702312696',
      'https://img.freepik.com/premium-photo/photo-spa-relaxation-room-with-cozy-seating_1055425-40368.jpg?w=1060',
      'https://images.squarespace-cdn.com/content/v1/61afd43e933ad92c6928b093/1686162068976-Q4SDZSW5AH2PZDKDOPOC/mobile+massage+vancouver.jpg',
      'https://static.wixstatic.com/media/3d581d_ac0d3bd0ef8d4ebd8ebba4f40c1f242f~mv2.png/v1/fill/w_640,h_426,al_c,q_85,enc_auto/3d581d_ac0d3bd0ef8d4ebd8ebba4f40c1f242f~mv2.png',
    ],
    description: 'Relax and rejuvenate with professional spa treatments, massages, and traditional Japanese hot springs. From hot stone therapy to onsen baths, find your perfect wellness experience.',
    descriptionJa: 'プロフェッショナルなスパトリートメント、マッサージ、伝統的な日本の温泉でリラックスして若返りましょう。ホットストーンセラピーから温泉まで、完璧なウェルネス体験を見つけましょう。',
  },
  
  // Spa & Massage (subcategory)
  'spa': {
    images: [],
    description: 'Relax and rejuvenate with professional spa treatments and massages. From hot stone therapy to aromatherapy, find your perfect wellness experience.',
    descriptionJa: 'プロフェッショナルなスパトリートメントとマッサージでリラックスして若返りましょう。ホットストーンセラピーからアロマセラピーまで、完璧なウェルネス体験を見つけましょう。',
  },
  
  // Onsen & Bathhouses (subcategory)
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
    images: [
      'https://tse1.explicit.bing.net/th/id/OIP.RXJmd_tAGNF_r98P7iP-OAHaE7?rs=1&pid=ImgDetMain&o=7&rm=3',
      'https://midcitihospital.com/wp-content/uploads/2020/10/Gynaecology-1-1024x683.jpg',
      'https://img.freepik.com/premium-vector/gynecology-obstetrics-banner_111409-802.jpg?w=2000',
      'https://images.pexels.com/photos/6809642/pexels-photo-6809642.jpeg?cs=srgb&dl=pexels-pavel-danilyuk-6809642.jpg&fm=jpg',
      'https://preview.redd.it/dental-clinic-interior-design-latest-interiors-v0-niaih3ygq4da1.jpg?width=3000&format=pjpg&auto=webp&s=080c992b8d88f4a91f518de53f1533c01f599209',
      'https://www.liveenhanced.com/wp-content/uploads/2019/09/dental-clinic-21.jpg',
    ],
    description: 'Professional medical and wellness services including dental care, women\'s health, eye clinics, and aesthetic treatments. Trusted clinics providing comprehensive healthcare.',
    descriptionJa: '歯科治療、女性の健康、眼科、美容治療を含むプロフェッショナルな医療およびウェルネスサービス。総合的なヘルスケアを提供する信頼できるクリニック。',
  },
  
  // Activities & Sports (main category)
  'activities-sports': {
    images: [
      'https://thegolfdome.com/wp-content/uploads/2022/03/IntUpper-downrange_1920x1080-1536x864.jpg',
      'https://www.indoorgolfarena.eu/image/2016/3/16/716_iga_so_20140122_def_page_24_2_jpg_2c8b1ad14b3e708bb19aff54e73d53d3.jpg(mediaclass-default.39a7cb77450cae1df8cc1a404ecae71401e24d88).jpg',
      'https://thegolfdome.com/wp-content/uploads/2022/03/PracticeStudios_1920x1080.jpg',
      'https://www.theteenmagazine.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBLzQvQVE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ%3d%3d--21f59fb1691960e074a44fbb757996001b37f933/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RW5KbGMybDZaVjkwYjE5bWFYUmJCMmtDNkFNdyIsImV4cCI6bnVsbCwicHVyIjoidmFyaWF0aW9uIn19--630ea93a8437270e449de3dbebc208269f777335/pexels-nicholas-fu-9288101.jpg',
      'https://uploads-ssl.webflow.com/620d593c0cff284f05f9cb95/625091a96cb932f79c70dd17_PS+Pilates+Studio+Highlands+Colorado+Denver.jpg',
      'https://www.bodysmart.com.au/wp-content/uploads/2017/05/20171229_Pilates-Exercise-Room.jpg',
      'https://thumbs.dreamstime.com/b/image-shows-interior-modern-pilates-studio-room-features-wooden-reformers-wall-water-feature-plants-322655362.jpg',
      'https://nfg-sofun.s3.amazonaws.com/uploads/event/photo/46270/poster_board_240728808_4156236694474593_7477211711026404452_n.jpg',
    ],
    description: 'Book tee times at premier golf courses, practice your swing, or join fitness classes. From golf to pilates and yoga, find your perfect activity across Japan.',
    descriptionJa: '一流のゴルフコースでティータイムを予約し、スイングを練習し、フィットネスクラスに参加しましょう。ゴルフからピラティス、ヨガまで、日本全国で完璧なアクティビティを見つけましょう。',
  },
  
  // Golf Courses (subcategory)
  'golf': {
    images: [],
    description: 'Book tee times at premier golf courses and practice ranges. Perfect your swing at top-rated facilities across Japan.',
    descriptionJa: '一流のゴルフコースと練習場でティータイムを予約しましょう。日本全国の高評価施設でスイングを完璧にしましょう。',
  },
  
  // Karaoke (subcategory)
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


"use client";

import CategoryCard from './CategoryCard';

export default function CategorySection() {
  const categories = [
    {
      id: 'beauty_services',
      title: 'Beauty Services',
      titleJa: '美容サービス',
      description: 'Discover beauty services across Japan — trusted salons with clear pricing and real availability.',
      sellingPoints: [
        'Popular salons nationwide',
        'Easy booking',
        'Verified shops',
        'Real-time schedules',
      ],
      imageSearchTerms: [
        'japanese modern hair salon interior tokyo',
        'tokyo beauty salon styling chair',
        'japanese nail art salon professional',
        'japanese barber shop traditional',
        'japanese eyelash extension treatment',
        'modern japanese beauty salon design',
      ],
    },
    {
      id: 'spa_onsen',
      title: 'Spa, Onsen & Relaxation',
      titleJa: 'スパ・温泉・リラクゼーション',
      description: 'Enjoy traditional Japanese onsen, spas, and relaxation services for all visitors and residents.',
      sellingPoints: [
        'Private & public options',
        'Premium relaxation',
        'Nighttime onsen views',
        'Instant booking',
      ],
      imageSearchTerms: [
        'japanese onsen outdoor hot spring night',
        'luxury japanese spa massage treatment',
        'traditional japanese ryokan tatami room',
        'japanese hot spring mountain view',
        'japanese relaxation spa room modern',
        'tokyo spa treatment room luxury',
      ],
    },
    {
      id: 'hotels',
      title: 'Hotels & Stays',
      titleJa: 'ホテル・宿泊',
      description: 'Find comfortable hotels, ryokans, and boutique stays across Japan.',
      sellingPoints: [
        'Ideal for travelers',
        'Clean & modern stays',
        'Real availability',
        'Easy multilingual booking',
      ],
      imageSearchTerms: [
        'https://i.pinimg.com/originals/41/c1/1e/41c11eeca92e8e5e791ca1802d0a8fd0.jpg',
        'https://www.princehotels.com/parktower/wp-content/uploads/sites/14/2019/07/res-stellar-platinum.jpg.jpg',
        'https://familytravelgenie.com/media/wp-uploads/2024/04/Palace-Hotel-Tokyo-Executive-Club-Lounge-Night-Time.jpg',
        'https://images.adsttc.com/media/images/5839/349a/e58e/cebc/9300/004e/large_jpg/03.jpg?1480144020',
        'https://cf.bstatic.com/xdata/images/hotel/max1024x768/219186638.jpg?k=2345e338a266b160d19f5adda9137b1761aab25ef558b1d8184da836358cadc1&o=&hp=1',
        'https://www.royalparkhotels.co.jp/canvas/ginzacorridor/assets/images/home/kv.png',
      ],
    },
    {
      id: 'dining',
      title: 'Dining & Izakaya',
      titleJa: '飲食・居酒屋',
      description: 'Experience restaurants and izakayas across Japan with simple online booking.',
      sellingPoints: [
        'Authentic dining',
        'Local favorites',
        'Clear menus',
        'Fast reservations',
      ],
      imageSearchTerms: [
        'tokyo fine dining restaurant elegant',
        'japanese restaurant interior modern design',
        'japanese izakaya bar counter night',
        'tokyo nightlife restaurant neon',
        'japanese traditional restaurant authentic',
        'modern japanese dining experience',
      ],
    },
    {
      id: 'clinics',
      title: 'Clinics & Medical Care',
      titleJa: 'クリニック・医療',
      description: 'Book medical and wellness services with trusted clinics.',
      sellingPoints: [
        'Licensed clinics',
        'Aesthetic, dental, women\'s care',
        'Clean facilities',
        'Easy appointment booking',
      ],
      imageSearchTerms: [
        'japanese modern clinic interior clean',
        'tokyo medical clinic professional',
        'japanese aesthetic clinic treatment',
        'japanese dental clinic modern',
        'modern japanese healthcare facility',
        'japanese medical facility sterile',
      ],
    },
    {
      id: 'activities',
      title: 'Activities & Sports',
      titleJa: 'アクティビティ・スポーツ',
      description: 'Enjoy activities and sports anywhere in Japan.',
      sellingPoints: [
        'Golf practice ranges',
        'Indoor/outdoor facilities',
        'Beginner friendly',
        'Instant session booking',
      ],
      imageSearchTerms: [
        'japanese golf practice range driving',
        'tokyo sports facility modern',
        'japanese indoor sports complex',
        'japanese recreational activity outdoor',
        'modern japanese sports center facility',
        'japanese activity center recreation',
      ],
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: 2 boxes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <CategoryCard
            title={categories[0].title}
            titleJa={categories[0].titleJa}
            description={categories[0].description}
            sellingPoints={categories[0].sellingPoints}
            imageSearchTerms={categories[0].imageSearchTerms}
            categoryId={categories[0].id}
          />
          <CategoryCard
            title={categories[1].title}
            titleJa={categories[1].titleJa}
            description={categories[1].description}
            sellingPoints={categories[1].sellingPoints}
            imageSearchTerms={categories[1].imageSearchTerms}
            categoryId={categories[1].id}
          />
        </div>

        {/* Row 2: 2 boxes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <CategoryCard
            title={categories[2].title}
            titleJa={categories[2].titleJa}
            description={categories[2].description}
            sellingPoints={categories[2].sellingPoints}
            imageSearchTerms={categories[2].imageSearchTerms}
            categoryId={categories[2].id}
          />
          <CategoryCard
            title={categories[3].title}
            titleJa={categories[3].titleJa}
            description={categories[3].description}
            sellingPoints={categories[3].sellingPoints}
            imageSearchTerms={categories[3].imageSearchTerms}
            categoryId={categories[3].id}
          />
        </div>

        {/* Row 3: 2 boxes */}
        <div className="grid md:grid-cols-2 gap-6">
          <CategoryCard
            title={categories[4].title}
            titleJa={categories[4].titleJa}
            description={categories[4].description}
            sellingPoints={categories[4].sellingPoints}
            imageSearchTerms={categories[4].imageSearchTerms}
            categoryId={categories[4].id}
          />
          <CategoryCard
            title={categories[5].title}
            titleJa={categories[5].titleJa}
            description={categories[5].description}
            sellingPoints={categories[5].sellingPoints}
            imageSearchTerms={categories[5].imageSearchTerms}
            categoryId={categories[5].id}
          />
        </div>
      </div>
    </section>
  );
}


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
        'japanese modern hair salon',
        'tokyo beauty salon interior',
        'japanese nail salon',
        'japanese barber shop',
        'japanese eyelash extension',
        'modern japanese beauty salon',
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
        'japanese onsen outdoor night',
        'luxury japanese spa massage',
        'traditional japanese ryokan room',
        'japanese hot spring mountain',
        'japanese relaxation spa room',
        'tokyo spa treatment room',
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
        'japanese modern hotel lobby',
        'tokyo hotel room interior',
        'japanese boutique hotel',
        'japanese business hotel',
        'modern japanese hotel design',
        'japanese hotel room view',
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
        'tokyo fine dining restaurant',
        'japanese restaurant interior modern',
        'japanese izakaya bar',
        'tokyo nightlife restaurant',
        'japanese traditional restaurant',
        'modern japanese dining',
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
        'japanese modern clinic interior',
        'tokyo medical clinic',
        'japanese aesthetic clinic',
        'japanese dental clinic',
        'modern japanese healthcare',
        'japanese medical facility',
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
        'japanese golf practice range',
        'tokyo sports facility',
        'japanese indoor sports',
        'japanese recreational activity',
        'modern japanese sports center',
        'japanese activity center',
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


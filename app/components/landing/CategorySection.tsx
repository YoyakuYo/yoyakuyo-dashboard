"use client";

import { useTranslations } from 'next-intl';
import CategoryCard from './CategoryCard';

export default function CategorySection() {
  const t = useTranslations('landing');
  
  const categories = [
    {
      id: 'beauty_services',
      title: t('categoryBeautyTitle'),
      titleJa: t('categoryBeautyTitleJa'),
      description: t('categoryBeautyDesc'),
      sellingPoints: [
        t('categoryBeautyPoint1'),
        t('categoryBeautyPoint2'),
        t('categoryBeautyPoint3'),
        t('categoryBeautyPoint4'),
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
      title: t('categorySpaTitle'),
      titleJa: t('categorySpaTitleJa'),
      description: t('categorySpaDesc'),
      sellingPoints: [
        t('categorySpaPoint1'),
        t('categorySpaPoint2'),
        t('categorySpaPoint3'),
        t('categorySpaPoint4'),
      ],
      imageSearchTerms: [
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
        'https://static.vecteezy.com/system/resources/previews/027/177/280/non_2x/types-of-massage-infographics-vector.jpg',
      ],
    },
    {
      id: 'hotels',
      title: t('categoryHotelsTitle'),
      titleJa: t('categoryHotelsTitleJa'),
      description: t('categoryHotelsDesc'),
      sellingPoints: [
        t('categoryHotelsPoint1'),
        t('categoryHotelsPoint2'),
        t('categoryHotelsPoint3'),
        t('categoryHotelsPoint4'),
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
      title: t('categoryDiningTitle'),
      titleJa: t('categoryDiningTitleJa'),
      description: t('categoryDiningDesc'),
      sellingPoints: [
        t('categoryDiningPoint1'),
        t('categoryDiningPoint2'),
        t('categoryDiningPoint3'),
        t('categoryDiningPoint4'),
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
      title: t('categoryClinicsTitle'),
      titleJa: t('categoryClinicsTitleJa'),
      description: t('categoryClinicsDesc'),
      sellingPoints: [
        t('categoryClinicsPoint1'),
        t('categoryClinicsPoint2'),
        t('categoryClinicsPoint3'),
        t('categoryClinicsPoint4'),
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
      title: t('categoryActivitiesTitle'),
      titleJa: t('categoryActivitiesTitleJa'),
      description: t('categoryActivitiesDesc'),
      sellingPoints: [
        t('categoryActivitiesPoint1'),
        t('categoryActivitiesPoint2'),
        t('categoryActivitiesPoint3'),
        t('categoryActivitiesPoint4'),
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


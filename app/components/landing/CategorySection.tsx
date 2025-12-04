"use client";

import { useTranslations } from 'next-intl';
import CategoryCard from './CategoryCard';
import { getCategoryImages } from '@/lib/categoryImages';

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
      imageSearchTerms: getCategoryImages('beauty-services'),
    },
    {
      id: 'spa_onsen_relaxation',
      title: t('categorySpaTitle'),
      titleJa: t('categorySpaTitleJa'),
      description: t('categorySpaDesc'),
      sellingPoints: [
        t('categorySpaPoint1'),
        t('categorySpaPoint2'),
        t('categorySpaPoint3'),
        t('categorySpaPoint4'),
      ],
      imageSearchTerms: getCategoryImages('spa-onsen-relaxation'),
    },
    {
      id: 'hotels_stays',
      title: t('categoryHotelsTitle'),
      titleJa: t('categoryHotelsTitleJa'),
      description: t('categoryHotelsDesc'),
      sellingPoints: [
        t('categoryHotelsPoint1'),
        t('categoryHotelsPoint2'),
        t('categoryHotelsPoint3'),
        t('categoryHotelsPoint4'),
      ],
      imageSearchTerms: getCategoryImages('hotels-stays'),
    },
    {
      id: 'dining_izakaya',
      title: t('categoryDiningTitle'),
      titleJa: t('categoryDiningTitleJa'),
      description: t('categoryDiningDesc'),
      sellingPoints: [
        t('categoryDiningPoint1'),
        t('categoryDiningPoint2'),
        t('categoryDiningPoint3'),
        t('categoryDiningPoint4'),
      ],
      imageSearchTerms: getCategoryImages('dining-izakaya'),
    },
    {
      id: 'clinics_medical_care',
      title: t('categoryClinicsTitle'),
      titleJa: t('categoryClinicsTitleJa'),
      description: t('categoryClinicsDesc'),
      sellingPoints: [
        t('categoryClinicsPoint1'),
        t('categoryClinicsPoint2'),
        t('categoryClinicsPoint3'),
        t('categoryClinicsPoint4'),
      ],
      imageSearchTerms: getCategoryImages('clinics-medical-care'),
    },
    {
      id: 'activities_sports',
      title: t('categoryActivitiesTitle'),
      titleJa: t('categoryActivitiesTitleJa'),
      description: t('categoryActivitiesDesc'),
      sellingPoints: [
        t('categoryActivitiesPoint1'),
        t('categoryActivitiesPoint2'),
        t('categoryActivitiesPoint3'),
        t('categoryActivitiesPoint4'),
      ],
      imageSearchTerms: getCategoryImages('activities-sports'),
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


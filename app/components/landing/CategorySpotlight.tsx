"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// Category spotlight data - NOT clickable, just visual showcase
// Using existing category images from public/categories/ and Unsplash as fallback
const categories = [
  {
    id: 'hotels_ryokan',
    image: '/categories/hotel.jpg',
    fallback: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    nameKey: 'hotelsRyokan',
    descKey: 'hotelsRyokanDesc',
  },
  {
    id: 'restaurants_izakaya',
    image: '/categories/restaurant.jpg',
    fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    nameKey: 'restaurantsIzakaya',
    descKey: 'restaurantsIzakayaDesc',
  },
  {
    id: 'beauty_salon',
    image: '/categories/beauty-salon.jpg',
    fallback: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    nameKey: 'beautySalon',
    descKey: 'beautySalonDesc',
  },
  {
    id: 'nail_salon',
    image: '/categories/nails.jpg',
    fallback: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
    nameKey: 'nailSalon',
    descKey: 'nailSalonDesc',
  },
  {
    id: 'eyelash_salon',
    image: '/categories/eyelash.jpg',
    fallback: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    nameKey: 'eyelashSalon',
    descKey: 'eyelashSalonDesc',
  },
  {
    id: 'spa_massage',
    image: '/categories/spa.jpg',
    fallback: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    nameKey: 'spaMassage',
    descKey: 'spaMassageDesc',
  },
  {
    id: 'onsen_dayuse',
    image: '/categories/onsen.jpg',
    fallback: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
    nameKey: 'onsenDayuse',
    descKey: 'onsenDayuseDesc',
  },
  {
    id: 'golf_courses',
    image: '/categories/golf.jpg',
    fallback: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
    nameKey: 'golfCourses',
    descKey: 'golfCoursesDesc',
  },
];

export default function CategorySpotlight() {
  const t = useTranslations('landing');

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          {t('categorySpotlightTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Image */}
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={category.image}
                  alt={t(`categories.${category.nameKey}`)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized={true}
                  onError={(e) => {
                    // Fallback to Unsplash image if local image fails
                    (e.target as HTMLImageElement).src = category.fallback;
                  }}
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">
                  {t(`categories.${category.nameKey}`)}
                </h3>
                <p className="text-sm text-white/90 line-clamp-2">
                  {t(`categories.${category.descKey}`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


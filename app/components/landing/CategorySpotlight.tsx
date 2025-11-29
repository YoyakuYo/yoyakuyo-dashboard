"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// Category spotlight data - NOT clickable, just visual showcase
// Using DIFFERENT Unsplash images from customer page for unique visual identity
const categories = [
  {
    id: 'hotels_ryokan',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    nameKey: 'hotelsRyokan',
    descKey: 'hotelsRyokanDesc',
  },
  {
    id: 'restaurants_izakaya',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    nameKey: 'restaurantsIzakaya',
    descKey: 'restaurantsIzakayaDesc',
  },
  {
    id: 'beauty_salon',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
    nameKey: 'beautySalon',
    descKey: 'beautySalonDesc',
  },
  {
    id: 'nail_salon',
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&q=80',
    nameKey: 'nailSalon',
    descKey: 'nailSalonDesc',
  },
  {
    id: 'eyelash_salon',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e0b09?w=800&q=80',
    nameKey: 'eyelashSalon',
    descKey: 'eyelashSalonDesc',
  },
  {
    id: 'spa_massage',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80',
    nameKey: 'spaMassage',
    descKey: 'spaMassageDesc',
  },
  {
    id: 'onsen_dayuse',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    nameKey: 'onsenDayuse',
    descKey: 'onsenDayuseDesc',
  },
  {
    id: 'golf_courses',
    image: 'https://images.unsplash.com/photo-1532301791573-4e6ce86a085f?w=800&q=80',
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
                    // Fallback gradient if image fails
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Fallback gradient - only shows if image fails */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 hidden" />
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


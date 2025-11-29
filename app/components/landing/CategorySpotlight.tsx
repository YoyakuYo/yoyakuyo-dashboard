"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// Category spotlight data - NOT clickable, just visual showcase
const categories = [
  {
    id: 'hotels_ryokan',
    image: '/images/categories/hotels-ryokan.jpg',
    nameKey: 'hotelsRyokan',
    descKey: 'hotelsRyokanDesc',
  },
  {
    id: 'restaurants_izakaya',
    image: '/images/categories/restaurants-izakaya.jpg',
    nameKey: 'restaurantsIzakaya',
    descKey: 'restaurantsIzakayaDesc',
  },
  {
    id: 'beauty_salon',
    image: '/images/categories/beauty-salon.jpg',
    nameKey: 'beautySalon',
    descKey: 'beautySalonDesc',
  },
  {
    id: 'nail_salon',
    image: '/images/categories/nail-salon.jpg',
    nameKey: 'nailSalon',
    descKey: 'nailSalonDesc',
  },
  {
    id: 'eyelash_salon',
    image: '/images/categories/eyelash-salon.jpg',
    nameKey: 'eyelashSalon',
    descKey: 'eyelashSalonDesc',
  },
  {
    id: 'spa_massage',
    image: '/images/categories/spa-massage.jpg',
    nameKey: 'spaMassage',
    descKey: 'spaMassageDesc',
  },
  {
    id: 'onsen_dayuse',
    image: '/images/categories/onsen-dayuse.jpg',
    nameKey: 'onsenDayuse',
    descKey: 'onsenDayuseDesc',
  },
  {
    id: 'golf_courses',
    image: '/images/categories/golf-courses.jpg',
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
              <div className="absolute inset-0">
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${category.image})`,
                  }}
                >
                  {/* Fallback gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
                </div>
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


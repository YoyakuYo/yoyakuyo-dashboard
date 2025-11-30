// app/components/landing/CategoryBanners.tsx
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface Category {
  id: string;
  image: string;
  nameKey: string;
  descKey: string;
  modalTitleKey: string;
  modalDescKey: string;
  modalBenefitsKey: string;
  modalAIKey: string;
}

const categories: Category[] = [
  {
    id: 'hotels_ryokan',
    image: 'https://besthotelshome.com/wp-content/uploads/2020/02/Conrad-Tokyo-Best-Luxury-Hotels-in-Tokyo.jpg',
    nameKey: 'hotelsRyokan',
    descKey: 'hotelsRyokanDesc',
    modalTitleKey: 'hotelsRyokanModalTitle',
    modalDescKey: 'hotelsRyokanModalDesc',
    modalBenefitsKey: 'hotelsRyokanModalBenefits',
    modalAIKey: 'hotelsRyokanModalAI',
  },
  {
    id: 'restaurants_izakaya',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80',
    nameKey: 'restaurantsIzakaya',
    descKey: 'restaurantsIzakayaDesc',
    modalTitleKey: 'restaurantsIzakayaModalTitle',
    modalDescKey: 'restaurantsIzakayaModalDesc',
    modalBenefitsKey: 'restaurantsIzakayaModalBenefits',
    modalAIKey: 'restaurantsIzakayaModalAI',
  },
  {
    id: 'beauty_salon',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80',
    nameKey: 'beautySalon',
    descKey: 'beautySalonDesc',
    modalTitleKey: 'beautySalonModalTitle',
    modalDescKey: 'beautySalonModalDesc',
    modalBenefitsKey: 'beautySalonModalBenefits',
    modalAIKey: 'beautySalonModalAI',
  },
  {
    id: 'eyelash_salon',
    image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1920&q=80',
    nameKey: 'eyelashSalon',
    descKey: 'eyelashSalonDesc',
    modalTitleKey: 'eyelashSalonModalTitle',
    modalDescKey: 'eyelashSalonModalDesc',
    modalBenefitsKey: 'eyelashSalonModalBenefits',
    modalAIKey: 'eyelashSalonModalAI',
  },
  {
    id: 'nail_salon',
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1920&q=80',
    nameKey: 'nailSalon',
    descKey: 'nailSalonDesc',
    modalTitleKey: 'nailSalonModalTitle',
    modalDescKey: 'nailSalonModalDesc',
    modalBenefitsKey: 'nailSalonModalBenefits',
    modalAIKey: 'nailSalonModalAI',
  },
  {
    id: 'onsen_dayuse',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1920&q=80',
    nameKey: 'onsenDayuse',
    descKey: 'onsenDayuseDesc',
    modalTitleKey: 'onsenDayuseModalTitle',
    modalDescKey: 'onsenDayuseModalDesc',
    modalBenefitsKey: 'onsenDayuseModalBenefits',
    modalAIKey: 'onsenDayuseModalAI',
  },
  {
    id: 'spa_massage',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1920&q=80',
    nameKey: 'spaMassage',
    descKey: 'spaMassageDesc',
    modalTitleKey: 'spaMassageModalTitle',
    modalDescKey: 'spaMassageModalDesc',
    modalBenefitsKey: 'spaMassageModalBenefits',
    modalAIKey: 'spaMassageModalAI',
  },
  {
    id: 'golf_courses',
    image: 'https://images.unsplash.com/photo-1532301791573-4e6ce86a085f?w=1920&q=80',
    nameKey: 'golfCourses',
    descKey: 'golfCoursesDesc',
    modalTitleKey: 'golfCoursesModalTitle',
    modalDescKey: 'golfCoursesModalDesc',
    modalBenefitsKey: 'golfCoursesModalBenefits',
    modalAIKey: 'golfCoursesModalAI',
  },
];

interface CategoryModalProps {
  category: Category | null;
  onClose: () => void;
}

function CategoryModal({ category, onClose }: CategoryModalProps) {
  const t = useTranslations('home.categories');

  if (!category) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Header */}
        <div className="relative h-64 md:h-80">
          <Image
            src={category.image}
            alt={t(category.nameKey)}
            fill
            className="object-cover rounded-t-2xl"
            sizes="100vw"
            unoptimized={true}
            onError={(e) => {
              // Fallback to gradient if image fails
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Fallback gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-t-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-2xl" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-800 text-xl font-bold transition-colors z-10"
          >
            ×
          </button>
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {t(category.modalTitleKey)}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            {t(category.modalDescKey)}
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {t('whyBookWithUs')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t(category.modalBenefitsKey)}
            </p>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>🤖</span>
              {t('aiSupport')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t(category.modalAIKey)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryBanners() {
  const t = useTranslations('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  return (
    <>
      <section className="py-0 bg-white">
        <div className="max-w-7xl mx-auto">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`relative h-[400px] md:h-[500px] cursor-pointer group overflow-hidden ${
                index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              <div className="absolute inset-0">
                <Image
                  src={category.image}
                  alt={t(`categories.${category.nameKey}`)}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="100vw"
                  unoptimized={true}
                  onError={(e) => {
                    // Fallback to gradient if image fails
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Fallback gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
              </div>

              <div className="relative z-10 h-full flex items-center">
                <div className={`max-w-7xl mx-auto px-8 w-full ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                  <div className={`max-w-2xl ${index % 2 === 0 ? 'ml-0' : 'ml-auto'}`}>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                      {t(`categories.${category.nameKey}`)}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/90 drop-shadow-md mb-6">
                      {t(`categories.${category.descKey}`)}
                    </p>
                    <button className="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg border-2 border-white/50 hover:border-white transition-all text-lg">
                      {t('learnMore')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CategoryModal 
        category={selectedCategory} 
        onClose={() => setSelectedCategory(null)} 
      />
    </>
  );
}


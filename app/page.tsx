// Yoyaku Yo - Production Landing Page
"use client";

import React, { Suspense, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import ModernLandingHeader from './components/landing/ModernLandingHeader';
import OwnerModals from './components/OwnerModals';
import CategoryCarousel from './components/landing/CategoryCarousel';
import { getAllCategories, getCategoryName } from '@/lib/categories';

export const dynamic = 'force-dynamic';

function HomeContent() {
  const locale = useLocale();
  const t = useTranslations('landing');
  const categories = getAllCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchLocation) params.set('location', searchLocation);
    window.location.href = `/categories?${params.toString()}`;
  };

  // Popular cities for Japan
  const popularCities = [
    { id: 'tokyo', name: 'Tokyo', nameJa: '東京' },
    { id: 'osaka', name: 'Osaka', nameJa: '大阪' },
    { id: 'kyoto', name: 'Kyoto', nameJa: '京都' },
    { id: 'yokohama', name: 'Yokohama', nameJa: '横浜' },
    { id: 'sapporo', name: 'Sapporo', nameJa: '札幌' },
    { id: 'fukuoka', name: 'Fukuoka', nameJa: '福岡' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <ModernLandingHeader />

      {/* HERO SECTION - 90vh, full-bleed background */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://source.unsplash.com/1920x1080/?japanese modern hotel lobby"
            alt="Yoyaku Yo"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-8 md:mb-12">
            {/* Main Headline - Changes with language */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight drop-shadow-lg">
              {t('heroHeadline')}
            </h1>
            
            {/* Sub-headline */}
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 md:mb-12 max-w-3xl mx-auto drop-shadow-md">
              {t('heroSubheadline')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 md:p-6 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Field 1: Service/Salon Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder1')}
                  className="w-full px-4 py-3 md:py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 text-sm md:text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Field 2: Location Search */}
              <div>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder={t('searchPlaceholder2')}
                  className="w-full px-4 py-3 md:py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 text-sm md:text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Search Button - Gradient */}
            <button
              onClick={handleSearch}
              className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 md:py-4 rounded-lg font-bold text-base md:text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {t('searchButton')}
            </button>
          </div>
        </div>
      </section>

      {/* TRUST ROW - Real numbers only */}
      <section className="bg-white border-b border-gray-200 py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm md:text-base text-gray-700">
            <span className="font-semibold text-gray-900">30,000+ {t('trustShops')}</span>
            <span className="hidden md:inline">•</span>
            <span>{t('trustPayment')}</span>
            <span className="hidden md:inline">•</span>
            <span>{t('trustLanguages')}</span>
            <span className="hidden md:inline">•</span>
            <span>{t('trustSecure')}</span>
          </div>
        </div>
      </section>

      {/* 13-CATEGORY HORIZONTAL SCROLLING CAROUSEL */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
            {t('categoriesTitle')}
          </h2>
          <CategoryCarousel />
        </div>
      </section>

      {/* HOW IT WORKS - 3 Steps */}
      <section className="py-12 md:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('howItWorksTitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                {t('step1Title')}
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {t('step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                {t('step2Title')}
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {t('step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                {t('step3Title')}
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR CITIES ROW */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
            {t('popularCitiesTitle')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.id}
                href={`/categories?location=${city.id}`}
                className="bg-white rounded-lg p-4 md:p-6 text-center shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-pink-500"
              >
                <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1">
                  {locale === 'ja' ? city.nameJa : city.name}
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">
                  {locale === 'ja' ? city.name : city.nameJa}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CLEAN FOOTER */}
      <footer className="bg-gray-900 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 text-sm md:text-base">
            © {new Date().getFullYear()} Yoyaku Yo. {t('allRightsReserved')}
          </div>
        </div>
      </footer>

      <OwnerModals />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

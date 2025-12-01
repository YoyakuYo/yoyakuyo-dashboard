// apps/dashboard/app/page.tsx
// New Marketing Landing Page - Layout A (bright travel) + Layout C (dark highlights)

"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { getTopLevelCategories } from '@/lib/categories';
import { getCategoryImages, getCategoryMarketing } from '@/lib/categoryImages';
import OwnerModals from './components/OwnerModals';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Japanese context hero images
const heroImages = [
  {
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80',
    alt: 'Luxury hotel lobby',
  },
  {
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80',
    alt: 'Spa room with soft lighting',
  },
  {
    url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1920&q=80',
    alt: 'Modern beauty salon interior',
  },
  {
    url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1920&q=80',
    alt: 'Beautiful nail salon',
  },
  {
    url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e0b09?w=1920&q=80',
    alt: 'Eyelash salon interior',
  },
];

function HomeContent() {
  let t: ReturnType<typeof useTranslations>;
  let tHome: ReturnType<typeof useTranslations>;
  const locale = useLocale();
  const isJapanese = locale === 'ja';
  
  try {
    t = useTranslations();
    tHome = useTranslations('home');
  } catch (error) {
    console.warn("useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tHome = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const categoryPreviewRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const topLevelCategories = getTopLevelCategories();
  // Show 4-6 categories in preview
  const previewCategories = topLevelCategories.slice(0, 6);
  
  // Hero image carousel state
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const scrollToCategories = () => {
    categoryPreviewRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SECTION 1 — HERO (Japan-Focused) */}
      <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden">
        {/* Rotating Background Images */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentHeroImage ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
                unoptimized={true}
              />
            </div>
          ))}
          {/* Soft Gradient Overlay (Sakura-inspired) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent"></div>
        </div>

        {/* Hero Content (Left-aligned, Japanese style) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            {/* Bilingual Title (Japanese primary) */}
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight font-bilingual`}>
              {isJapanese ? (
                <>
                  <span className="block">日本で予約</span>
                  <span className="block text-2xl md:text-3xl lg:text-4xl font-normal mt-2 text-white/90">
                    {tHome('heroTitle') || "Japan's Premier Booking Platform"}
                  </span>
                </>
              ) : (
                tHome('heroTitle') || "Japan's Premier Booking Platform"
              )}
            </h1>
            <p className={`text-lg md:text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
              {isJapanese 
                ? "全国のサロン・クリニック・ホテルを簡単予約。多言語対応のAIアシスタントが24時間サポートします。"
                : tHome('heroSubtitle') || "Book salons, clinics, hotels, and more across Japan. AI assistant supports you in multiple languages 24/7."}
            </p>
            
            {/* CTA Buttons (Large, 48px height) */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToCategories}
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl min-h-[48px]"
              >
                {isJapanese ? 'カテゴリーを見る' : (tHome('browseCategories') || 'Browse Categories')}
              </button>
              <button
                onClick={scrollToHowItWorks}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl text-lg border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all min-h-[48px]"
              >
                {isJapanese ? '使い方を見る' : (tHome('howItWorks') || 'How It Works')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroImage(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentHeroImage
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* SECTION 1.5 — TRUST INDICATORS (New) */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">10K+</div>
              <div className={`text-sm text-gray-600 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '店舗' : 'Shops'}
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">50K+</div>
              <div className={`text-sm text-gray-600 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '予約' : 'Bookings'}
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">4.8★</div>
              <div className={`text-sm text-gray-600 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '評価' : 'Rating'}
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">47</div>
              <div className={`text-sm text-gray-600 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '都道府県' : 'Prefectures'}
              </div>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className={isJapanese ? 'font-japanese' : ''}>{isJapanese ? 'SSL暗号化' : 'SSL Encrypted'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className={isJapanese ? 'font-japanese' : ''}>{isJapanese ? '安全決済' : 'Secure Payment'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className={isJapanese ? 'font-japanese' : ''}>{isJapanese ? 'プライバシー保護' : 'Privacy Protected'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — FEATURE SUMMARY CARDS (Enhanced) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02]">
              <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '全国検索' : (tHome('feature1Title') || 'Search Anywhere in Japan')}
              </h3>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? '47都道府県の店舗を検索。カテゴリーや地域から簡単に見つけられます。'
                  : (tHome('feature1Text') || 'Browse verified salons, clinics, hotels, and more in every major region.')}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02]">
              <div className="w-20 h-20 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'AI予約アシスタント' : (tHome('feature2Title') || 'AI Recommends the Best Match')}
              </h3>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? '多言語対応のAIが24時間サポート。希望の日時を提案し、予約を代行します。'
                  : (tHome('feature2Text') || 'Ask in your language and let AI find times, suggest shops, and handle bookings.')}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02]">
              <div className="w-20 h-20 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '簡単・迅速' : (tHome('feature3Title') || 'Instant Online Booking')}
              </h3>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? '数分で予約完了、管理も簡単。電話や長いフォームは不要です。'
                  : (tHome('feature3Text') || 'No phone calls or long forms—book in a few messages and track everything online.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2.5 — HOW IT WORKS (New Timeline) */}
      <section ref={howItWorksRef} className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? '使い方' : (tHome('howItWorks') || 'How It Works')}
            </h2>
            <p className={`text-lg text-gray-600 max-w-2xl mx-auto ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? '3ステップで簡単予約' : '3 simple steps to book'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-teal-200" style={{ top: '80px' }}></div>
            
            {/* Step 1 */}
            <div className="relative bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">
                {isJapanese ? '一' : '1'}
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'カテゴリーを選択' : 'Choose Category'}
              </h3>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? 'お探しのカテゴリーや地域を選択'
                  : 'Select the category or area you\'re looking for'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">
                {isJapanese ? '二' : '2'}
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'AIで予約' : 'Book with AI'}
              </h3>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? 'AIアシスタントが希望の日時を提案'
                  : 'AI assistant suggests available times'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">
                {isJapanese ? '三' : '3'}
              </div>
              <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '確認完了' : 'Confirmation'}
              </h3>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? '予約確認メールが届きます'
                  : 'Receive confirmation email'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — CATEGORY PREVIEW (Enhanced) */}
      <section ref={categoryPreviewRef} className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? 'カテゴリーから探す' : (tHome('categoryPreviewTitle') || 'Browse by Category')}
            </h2>
            <p className={`text-lg text-gray-600 max-w-2xl mx-auto ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? 'お気に入りのカテゴリーを選択' : (tHome('categoryPreviewSubtitle') || 'Explore popular categories.')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            {previewCategories.map((category) => {
              const images = getCategoryImages(category.imageKey);
              const marketing = getCategoryMarketing(category.imageKey);
              const categoryName = category.name;
              const currentImage = images[0] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';

              return (
                <Link
                  key={category.id}
                  href={`/categories?category=${category.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all group hover:scale-[1.02]"
                >
                  <div className="relative aspect-[4/3] w-full">
                    {currentImage && (
                      <Image
                        src={currentImage}
                        alt={categoryName}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized={true}
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className={`font-semibold text-gray-900 text-sm ${isJapanese ? 'font-japanese' : ''}`}>{categoryName}</h3>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/categories"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl min-h-[48px]"
            >
              {isJapanese ? 'すべてのカテゴリーを見る →' : (tHome('viewAllCategories') || 'View all categories →')}
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4 — TESTIMONIALS (New) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? 'お客様の声' : 'Customer Reviews'}
            </h2>
            <p className={`text-lg text-gray-600 max-w-2xl mx-auto ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? '実際にご利用いただいたお客様からの声' : 'What our customers say'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">田</span>
                </div>
                <div>
                  <div className={`font-semibold text-gray-900 ${isJapanese ? 'font-japanese' : ''}`}>
                    {isJapanese ? '田中様' : 'Tanaka-san'}
                  </div>
                  <div className="flex text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? 'AIアシスタントがとても親切で、予約が簡単でした。多言語対応も素晴らしいです。'
                  : 'The AI assistant was very helpful and booking was easy. The multilingual support is excellent.'}
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-bold text-lg">佐</span>
                </div>
                <div>
                  <div className={`font-semibold text-gray-900 ${isJapanese ? 'font-japanese' : ''}`}>
                    {isJapanese ? '佐藤様' : 'Sato-san'}
                  </div>
                  <div className="flex text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? '全国の店舗が検索できて便利。特に美容サロンの予約が簡単になりました。'
                  : 'It\'s convenient to search shops nationwide. Booking beauty salons has become much easier.'}
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-teal-600 font-bold text-lg">鈴</span>
                </div>
                <div>
                  <div className={`font-semibold text-gray-900 ${isJapanese ? 'font-japanese' : ''}`}>
                    {isJapanese ? '鈴木様' : 'Suzuki-san'}
                  </div>
                  <div className="flex text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className={`text-gray-600 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese 
                  ? '24時間いつでも予約できて、確認もすぐに来るので安心です。'
                  : 'I can book anytime 24/7, and confirmations come immediately, which is reassuring.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4.5 — OWNER/CUSTOMER MARKETING STRIP */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Left: For Customers */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className={`text-2xl font-bold text-gray-900 mb-6 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'お客様向け' : (tHome('forCustomersTitle') || 'For Customers')}
              </h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={isJapanese ? 'font-japanese' : ''}>{tHome('customerBullet1') || 'Search shops by category or location'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={isJapanese ? 'font-japanese' : ''}>{tHome('customerBullet2') || 'Book instantly with AI assistance'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={isJapanese ? 'font-japanese' : ''}>{tHome('customerBullet3') || 'Save favorites and keep your booking history'}</span>
                </li>
              </ul>
            </div>

            {/* Right: For Owners */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className={`text-2xl font-bold text-gray-900 mb-6 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'オーナー向け' : (tHome('forOwnersTitle') || 'For Owners')}
              </h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={isJapanese ? 'font-japanese' : ''}>{tHome('ownerBullet1') || 'Manage bookings & availability'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={isJapanese ? 'font-japanese' : ''}>{tHome('ownerBullet2') || 'Handle customer messages automatically with AI'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={isJapanese ? 'font-japanese' : ''}>{tHome('ownerBullet3') || 'See simple analytics for performance'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — CTA SECTION (Enhanced) */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-pink-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
            {isJapanese ? '今すぐ予約を始めましょう' : 'Start Booking Now'}
          </h2>
          <p className={`text-lg text-gray-600 mb-8 ${isJapanese ? 'font-japanese' : ''}`}>
            {isJapanese ? '無料で簡単、すぐに始められます' : 'Free and easy to get started'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'login' } }));
              }}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl min-h-[48px]"
            >
              {t('nav.login') || 'Login'}
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'join' } }));
              }}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl text-lg border-2 border-blue-600 hover:bg-blue-50 transition-all min-h-[48px]"
            >
              {t('nav.join') || 'Join'}
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <span className={isJapanese ? 'font-japanese' : ''}>✓ {isJapanese ? '無料' : 'Free'}</span>
            <span className={isJapanese ? 'font-japanese' : ''}>✓ {isJapanese ? '簡単' : 'Easy'}</span>
            <span className={isJapanese ? 'font-japanese' : ''}>✓ {isJapanese ? '安全' : 'Secure'}</span>
          </div>
        </div>
      </section>

      {/* SECTION 6 — DARK HIGHLIGHTS PREVIEW (C-style) */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-white mb-8 text-center ${isJapanese ? 'font-japanese' : ''}`}>
            {isJapanese ? '人気の店舗を発見' : (tHome('highlightsTitle') || 'Discover Top Shops')}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Featured Card */}
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-cyan-500 transition-colors">
              <h3 className={`text-2xl font-bold text-white mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'おすすめ店舗' : (tHome('featuredCardTitle') || 'Featured Shops')}
              </h3>
              <p className={`text-gray-300 mb-6 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese ? 'Yoyaku Yoが厳選したおすすめの店舗' : (tHome('featuredCardText') || 'Our most recommended and highly-rated partners.')}
              </p>
              <Link
                href="/featured"
                className="inline-block px-6 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
              >
                {isJapanese ? 'おすすめを見る →' : (tHome('viewFeatured') || 'View Featured →')}
              </Link>
            </div>

            {/* Trending Card */}
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-cyan-500 transition-colors">
              <h3 className={`text-2xl font-bold text-white mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'トレンド' : (tHome('trendingCardTitle') || 'Trending Now')}
              </h3>
              <p className={`text-gray-300 mb-6 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                {isJapanese ? '今最も予約されている人気の店舗' : (tHome('trendingCardText') || 'Shops people are booking most.')}
              </p>
              <Link
                href="/trending"
                className="inline-block px-6 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
              >
                {isJapanese ? 'トレンドを見る →' : (tHome('viewTrending') || 'View Trending →')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Login/Signup Modals */}
      <OwnerModals />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

// YoyakuYo Landing Page - Inspired by Luxury Hotel Booking Sites
"use client";

import React, { Suspense, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ModernLandingHeader from './components/landing/ModernLandingHeader';
import OwnerModals from './components/OwnerModals';
import FeaturedReviews from './components/FeaturedReviews';
import Link from 'next/link';
import { getTopLevelCategories } from '@/lib/categories';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function HomeContent() {
  let t: ReturnType<typeof useTranslations>;
  const locale = useLocale();
  const isJapanese = locale === 'ja';
  
  try {
    t = useTranslations('landing');
  } catch (error) {
    console.warn("useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const topLevelCategories = getTopLevelCategories();
  const featuredCategories = topLevelCategories.slice(0, 6);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedArea) params.set('area', selectedArea);
    window.location.href = `/categories?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <ModernLandingHeader />

      {/* HERO SECTION - Hotel Style */}
      <section className="relative min-h-[600px] md:min-h-[700px] lg:min-h-[800px] overflow-hidden">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900">
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-32 pb-16">
          <div className="max-w-4xl">
            {/* Welcome Text */}
            <p className="text-blue-300 text-sm md:text-base mb-4 font-medium">
              {t('heroWelcome') || (isJapanese ? 'ようこそ' : 'Welcome to')}
            </p>
            
            {/* Main Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t('heroTitle') || (isJapanese 
                ? '完璧なサービスを予約'
                : 'Book Your Perfect Service')}
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl">
              {t('heroSubtitle') || (isJapanese 
                ? '日本全国のサロン、クリニック、ホテルをAIアシスタントが24時間サポート'
                : 'Discover and book beauty, wellness, and hospitality services across Japan with 24/7 AI assistance')}
            </p>

            {/* Booking Widget - Hotel Style */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8">
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                {/* Service/Salon Search */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    {t('searchService') || (isJapanese ? 'サービス・サロン名' : 'Service / Salon Name')}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder') || (isJapanese ? '検索...' : 'Search...')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    {t('category') || (isJapanese ? 'カテゴリー' : 'Category')}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white"
                  >
                    <option value="">{t('allCategories') || (isJapanese ? 'すべて' : 'All')}</option>
                    {topLevelCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {isJapanese ? cat.nameJa : cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    {t('area') || (isJapanese ? 'エリア' : 'Area')}
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white"
                  >
                    <option value="">{t('allAreas') || (isJapanese ? 'すべて' : 'All Areas')}</option>
                    <option value="tokyo">{isJapanese ? '東京' : 'Tokyo'}</option>
                    <option value="osaka">{isJapanese ? '大阪' : 'Osaka'}</option>
                    <option value="kyoto">{isJapanese ? '京都' : 'Kyoto'}</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>🔍</span>
                <span>{t('checkAvailability') || (isJapanese ? '検索する' : 'Check Availability')}</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 mt-8 text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm">{t('trust24h') || (isJapanese ? '24時間対応' : '24/7 Support')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm">{t('trustAI') || (isJapanese ? 'AIアシスタント' : 'AI Assistant')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm">{t('trustSecure') || (isJapanese ? '安全な予約' : 'Secure Booking')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm mb-2">
              {t('categoriesLabel') || (isJapanese ? 'カテゴリー' : 'CATEGORIES')}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('exploreCategories') || (isJapanese ? 'カテゴリーを探索' : 'Explore Our Categories')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('categoriesDesc') || (isJapanese 
                ? '日本全国の様々なサービスをカテゴリーから探せます'
                : 'Discover services across Japan by category')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6">
            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/categories?category=${category.id}`}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
              >
                {/* Category Image Placeholder */}
                <div className="relative h-64 bg-gradient-to-br from-blue-100 via-gray-100 to-blue-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-5xl mb-2">🏪</div>
                    <p className="text-sm">{t('categoryImage') || 'Category Image'}</p>
                  </div>
                </div>

                {/* Category Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {isJapanese ? category.nameJa : category.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {t('viewDetails') || (isJapanese ? '詳細を見る →' : 'View Details →')}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/categories"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              {t('viewAllCategories') || (isJapanese ? 'すべてのカテゴリーを見る' : 'View All Categories')}
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm mb-2">
              {t('howItWorksLabel') || (isJapanese ? '使い方' : 'HOW IT WORKS')}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('howItWorksTitle') || (isJapanese ? '簡単3ステップ' : 'Simple 3 Steps')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('step1Title') || (isJapanese ? 'カテゴリーを選択' : 'Choose Category')}
              </h3>
              <p className="text-gray-600">
                {t('step1Desc') || (isJapanese 
                  ? 'お探しのサービスカテゴリーを選択'
                  : 'Select the service category you\'re looking for')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('step2Title') || (isJapanese ? 'AIとチャット' : 'Chat with AI')}
              </h3>
              <p className="text-gray-600">
                {t('step2Desc') || (isJapanese 
                  ? 'AIアシスタントが最適な店舗と時間を提案'
                  : 'AI assistant suggests the best shops and available times')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('step3Title') || (isJapanese ? '予約完了' : 'Book Instantly')}
              </h3>
              <p className="text-gray-600">
                {t('step3Desc') || (isJapanese 
                  ? '数秒で予約完了、確認メールが届きます'
                  : 'Complete booking in seconds, receive instant confirmation')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE YOYAKUYO */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm mb-2">
              {t('whyLabel') || (isJapanese ? 'なぜ選ぶ' : 'WHY CHOOSE')}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('whyTitle') || (isJapanese ? 'Yoyaku Yoを選ぶ理由' : 'Why Choose Yoyaku Yo')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t('feature1Title') || (isJapanese ? 'AIアシスタント' : 'AI Assistant')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('feature1Desc') || (isJapanese 
                  ? '24時間365日、多言語対応のAIがサポート'
                  : '24/7 multilingual AI support')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🇯🇵</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t('feature2Title') || (isJapanese ? '全国対応' : 'Nationwide')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('feature2Desc') || (isJapanese 
                  ? '47都道府県の店舗を網羅'
                  : 'Covering all 47 prefectures')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t('feature3Title') || (isJapanese ? '即時予約' : 'Instant Booking')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('feature3Desc') || (isJapanese 
                  ? '電話不要、数秒で予約完了'
                  : 'No phone calls needed, book in seconds')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t('feature4Title') || (isJapanese ? '安全・安心' : 'Secure & Safe')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('feature4Desc') || (isJapanese 
                  ? 'SSL暗号化、安全な決済システム'
                  : 'SSL encrypted, secure payment system')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <FeaturedReviews />

      {/* CTA SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('ctaTitle') || (isJapanese ? '今すぐ始めましょう' : 'Get Started Today')}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t('ctaDesc') || (isJapanese 
              ? 'Yoyaku Yoで日本全国のサービスを簡単に予約'
              : 'Book services across Japan easily with Yoyaku Yo')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'join' } }));
              }}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
            >
              {t('ctaJoin') || (isJapanese ? '無料で登録' : 'Join Free')}
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'login' } }));
              }}
              className="px-8 py-4 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-600 transition-all border-2 border-white/30"
            >
              {t('ctaLogin') || (isJapanese ? 'ログイン' : 'Login')}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Yoyaku Yo</h3>
              <p className="text-gray-400 text-sm">
                {t('footerAboutDesc') || (isJapanese 
                  ? '日本最大級の予約プラットフォーム'
                  : "Japan's largest booking platform")}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footerLinks') || (isJapanese ? 'リンク' : 'Links')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/categories" className="text-gray-400 hover:text-white transition-colors">{t('browse') || (isJapanese ? '閲覧' : 'Browse')}</Link></li>
                <li><Link href="/featured" className="text-gray-400 hover:text-white transition-colors">{t('featured') || (isJapanese ? 'おすすめ' : 'Featured')}</Link></li>
                <li><Link href="/trending" className="text-gray-400 hover:text-white transition-colors">{t('trending') || (isJapanese ? 'トレンド' : 'Trending')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footerContact') || (isJapanese ? 'お問い合わせ' : 'Contact')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t('footerSupport') || (isJapanese ? 'サポート' : 'Support')}</li>
                <li>{t('footerHelp') || (isJapanese ? 'ヘルプ' : 'Help Center')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footerFollow') || (isJapanese ? 'フォロー' : 'Follow Us')}</h3>
              <div className="flex gap-4">
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">📘</span>
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">📷</span>
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">🐦</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Yoyaku Yo. {t('allRightsReserved') || (isJapanese ? '全著作権所有' : 'All Rights Reserved')}.
          </div>
        </div>
      </footer>

      <OwnerModals />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

// Modern Landing Page - eBeauty + HOT PEPPER Beauty Style
"use client";

import React, { Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ModernLandingHeader from './components/landing/ModernLandingHeader';
import OwnerModals from './components/OwnerModals';
import FeaturedReviews from './components/FeaturedReviews';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function HomeContent() {
  let t: ReturnType<typeof useTranslations>;
  let tHome: ReturnType<typeof useTranslations>;
  const locale = useLocale();
  const isJapanese = locale === 'ja';
  
  try {
    t = useTranslations('landing');
    tHome = useTranslations('home');
  } catch (error) {
    console.warn("useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tHome = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  return (
    <div className="min-h-screen bg-white">
      <ModernLandingHeader />

      {/* HERO SECTION (eBeauty style) */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Content + Search */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('heroTitle') || (isJapanese 
                ? '日本全国のビューティー・ウェルネスサービスを予約'
                : 'Find and book beauty and wellness services across Japan')}
            </h1>
            
            {/* Search Interface */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('searchServicePlaceholder') || (isJapanese ? 'サービス名・サロン名' : 'Service / Salon Name')}
                  className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              </div>
              <div className="relative">
                <select className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 appearance-none bg-white">
                  <option>{t('selectArea') || (isJapanese ? 'エリアを選択' : 'Select Area')}</option>
                </select>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">📍</span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
              </div>
              <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                <span>🔍</span>
                <span>{t('search') || (isJapanese ? '検索' : 'Search')}</span>
              </button>
            </div>

            {/* App Download QR */}
            <div className="flex items-center gap-4 mt-8">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-4xl">📱</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('downloadApp') || (isJapanese ? 'アプリをダウンロード' : 'Download The App Now')}</p>
                <p className="text-sm text-gray-600">{t('downloadAppSubtext') || (isJapanese ? '今すぐダウンロード' : 'Get it now')}</p>
              </div>
            </div>
          </div>

          {/* Right: Large Image Placeholder */}
          <div className="relative h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-lg">{t('imagePlaceholder') || (isJapanese ? '画像を追加' : 'Image Placeholder')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* TODAY'S EXCLUSIVE DEALS */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
                {t('exclusiveDealsTitle') || (isJapanese ? '本日の限定デール' : "Today's Exclusive Deals")}
              </h2>
              <p className="text-gray-600">
                {t('exclusiveDealsSubtitle') || (isJapanese ? 'デールタイプでサロンを探す' : 'Discover salons by type of deals')}
              </p>
            </div>
            <Link
              href="/featured"
              className="text-pink-600 font-semibold hover:text-pink-700 hover:underline transition-colors"
            >
              {t('viewAllDeals') || (isJapanese ? 'すべて見る' : 'View All Deals')} →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-sm">{t('dealImage') || 'Deal Image'}</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    {t(`deal${i}Title`) || (isJapanese ? `デール ${i}` : `Deal ${i}`)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {t(`deal${i}Location`) || (isJapanese ? 'サロン名、所在地' : 'Salon Name, Location')}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      ¥2,980
                    </span>
                    <span className="text-gray-400 line-through">¥5,000</span>
                  </div>
                  <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all">
                    {t('bookNow') || (isJapanese ? '今すぐ予約' : 'Book Now')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
              {t('popularServicesTitle') || (isJapanese ? '人気サービス' : 'Popular Services')}
            </h2>
            <p className="text-gray-600">
              {t('popularServicesSubtitle') || (isJapanese ? '人気サービスでサロンを探す' : 'Find your salon by popular services')}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              { icon: '✂️', name: t('serviceHairCut') || (isJapanese ? 'カット' : 'Hair Cut') },
              { icon: '🎨', name: t('serviceHairColor') || (isJapanese ? 'カラー' : 'Hair Color') },
              { icon: '💅', name: t('serviceManicure') || (isJapanese ? 'マニキュア' : 'Manicure') },
              { icon: '🦶', name: t('servicePedicure') || (isJapanese ? 'ペディキュア' : 'Pedicure') },
              { icon: '✨', name: t('serviceFacial') || (isJapanese ? 'フェイシャル' : 'Facial') },
              { icon: '💆', name: t('serviceMassage') || (isJapanese ? 'マッサージ' : 'Massage') },
              { icon: '🧴', name: t('serviceWaxing') || (isJapanese ? '脱毛' : 'Waxing') },
            ].map((service, i) => (
              <Link
                key={i}
                href={`/categories?service=${service.name.toLowerCase().replace(' ', '-')}`}
                className="flex flex-col items-center gap-2 cursor-pointer hover:scale-110 transition-transform group"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl group-hover:bg-gradient-to-br group-hover:from-pink-100 group-hover:to-purple-100 transition-all">
                  {service.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600 transition-colors">{service.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED SALONS */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
              {t('featuredSalonsTitle') || (isJapanese ? 'おすすめサロン' : 'Featured Salons')}
            </h2>
            <p className="text-gray-600">
              {t('featuredSalonsSubtitle') || (isJapanese ? '特別なメンバーを見つける' : 'Find our special members')}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Link
                key={i}
                href="/featured"
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="relative h-48 bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">🏪</div>
                    <p className="text-sm">{t('salonImage') || 'Salon Image'}</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t(`salon${i}Name`) || (isJapanese ? `サロン ${i}` : `Salon ${i}`)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t(`salon${i}Location`) || (isJapanese ? '所在地' : 'Location')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEWLY ADDED SALONS */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
              {t('newlyAddedTitle') || (isJapanese ? '新規追加サロン' : 'Newly Added Salons')}
            </h2>
            <p className="text-gray-600">
              {t('newlyAddedSubtitle') || (isJapanese ? '新しく参加したサロンを見る' : 'View all newly joined salons')}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Link
                key={i}
                href="/featured"
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all group relative"
              >
                <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                  {t('new') || (isJapanese ? '新規' : 'New')}
                </div>
                <div className="relative h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-purple-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">🆕</div>
                    <p className="text-sm">{t('salonImage') || 'Salon Image'}</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t(`newSalon${i}Name`) || (isJapanese ? `新規サロン ${i}` : `New Salon ${i}`)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t(`newSalon${i}Location`) || (isJapanese ? '所在地' : 'Location')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOAD APP CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {t('downloadAppTitle') || (isJapanese ? 'アプリをダウンロード' : 'Download The App Now')}
              </h2>
              <p className="text-lg mb-6 opacity-90">
                {t('downloadAppDesc') || (isJapanese 
                  ? 'アプリでより便利に予約できます'
                  : 'Book more conveniently with our app')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                  <span>🍎</span>
                  <span>{t('appStore') || (isJapanese ? 'App Store' : 'App Store')}</span>
                </button>
                <button className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                  <span>🤖</span>
                  <span>{t('googlePlay') || (isJapanese ? 'Google Play' : 'Google Play')}</span>
                </button>
              </div>
            </div>
            <div className="relative h-96 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <div className="text-center text-white/80">
                <div className="text-6xl mb-4">📱</div>
                <p className="text-lg">{t('appMockup') || (isJapanese ? 'アプリモックアップ' : 'App Mockup')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SALON OWNER CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                {t('ownerCTATitle') || (isJapanese ? 'サロンオーナー・経営者の方へ' : 'Are You a Salon Manager Or Owner?')}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {t('ownerCTADesc') || (isJapanese 
                  ? 'Yoyaku Yoでビジネスを成長させましょう'
                  : 'Grow your business with Yoyaku Yo')}
              </p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'join', type: 'owner' } }));
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                {t('joinForFree') || (isJapanese ? '無料で登録' : 'Join Us For Free')}
              </button>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">💼</div>
                <p className="text-lg">{t('dashboardMockup') || (isJapanese ? 'ダッシュボードモックアップ' : 'Dashboard Mockup')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER STORIES */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
              {t('customerStoriesTitle') || (isJapanese ? 'お客様の声' : 'Customer Stories')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('customerStoriesSubtitle') || (isJapanese 
                ? 'お客様の体験談をご覧ください'
                : 'Beauty and confidence radiate from within us. Explore the empowering stories of these happy individuals.')}
            </p>
          </div>
          <FeaturedReviews />
        </div>
      </section>

      {/* COMPREHENSIVE FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footerAbout') || (isJapanese ? '会社について' : 'About Us')}</h3>
              <p className="text-gray-400 text-sm">
                {t('footerAboutDesc') || (isJapanese 
                  ? '日本最大級の予約プラットフォーム'
                  : "Japan's largest booking platform")}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footerContact') || (isJapanese ? 'お問い合わせ' : 'Contact Us')}</h3>
              <p className="text-gray-400 text-sm mb-2">{t('footerAddress') || (isJapanese ? '住所' : 'Address')}</p>
              <p className="text-gray-400 text-sm mb-2">{t('footerPhone') || (isJapanese ? '電話' : 'Phone')}</p>
              <p className="text-gray-400 text-sm">{t('footerEmail') || (isJapanese ? 'メール' : 'Email')}</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footerLinks') || (isJapanese ? 'リンク' : 'Links')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">{t('privacyPolicy') || (isJapanese ? 'プライバシーポリシー' : 'Privacy Policy')}</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">{t('termsOfService') || (isJapanese ? '利用規約' : 'Terms of Service')}</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">{t('contact') || (isJapanese ? 'お問い合わせ' : 'Contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footerFollow') || (isJapanese ? 'フォロー' : 'Follow Us')}</h3>
              <div className="flex gap-4 mb-4">
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">📘</span>
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">📷</span>
                <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">🐦</span>
              </div>
              <div className="flex flex-col gap-2">
                <button className="bg-white text-gray-900 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <span>🍎</span>
                  <span>{t('appStore') || 'App Store'}</span>
                </button>
                <button className="bg-white text-gray-900 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <span>🤖</span>
                  <span>{t('googlePlay') || 'Google Play'}</span>
                </button>
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

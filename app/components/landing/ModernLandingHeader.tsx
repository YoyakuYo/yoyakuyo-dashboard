"use client";

import { useTranslations, useLocale } from 'next-intl';
import { LanguageSwitcher } from '../LanguageSwitcher';
import AnimatedLogo from './AnimatedLogo';
import Link from 'next/link';

export default function ModernLandingHeader() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const isJapanese = locale === 'ja';

  const mainCategories = [
    { key: 'hairSalon', href: '/categories?category=hair-salon', icon: '✂️' },
    { key: 'nailSalon', href: '/categories?category=nail-salon', icon: '💅' },
    { key: 'spa', href: '/categories?category=spa', icon: '🧖' },
    { key: 'hotel', href: '/categories?category=hotel', icon: '🏨' },
    { key: 'restaurant', href: '/categories?category=restaurant', icon: '🍱' },
    { key: 'clinic', href: '/categories?category=clinic', icon: '🏥' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Top Banner */}
      <div className="bg-blue-600 text-white text-xs py-2 px-4 text-center">
        {t('topBanner') || (isJapanese 
          ? '国内最大級の予約サイト - 24時間ネット予約対応'
          : "Japan's Largest Booking Site - 24/7 Online Booking")}
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Logo and Main Nav */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <AnimatedLogo />

            {/* Category Navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              {mainCategories.map((cat) => (
                <Link
                  key={cat.key}
                  href={cat.href}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  <span>{cat.icon}</span>
                  <span>{t(`category.${cat.key}`) || cat.key}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side: Location + Auth */}
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-gray-100 rounded-full text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors">
              <span>📍</span>
              <span>{t('yourLocation') || (isJapanese ? '現在地' : 'Your Location')}</span>
            </button>
            <LanguageSwitcher />
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'login' } }));
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              {t('signInUp') || (isJapanese ? 'ログイン / 登録' : 'Sign In / Sign Up')}
            </button>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="bg-gray-50 py-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t('searchPlaceholder') || (isJapanese ? 'サービス名・サロン名で検索' : 'Search services or salon name')}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 transition-colors"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all">
                {t('search') || (isJapanese ? '検索' : 'Search')}
              </button>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span>
                <span>{t('badge24h') || (isJapanese ? '24時間予約' : '24/7 Booking')}</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-600">
                <span>★</span>
                <span>{t('badgePoints') || (isJapanese ? 'ポイント還元' : 'Points Back')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


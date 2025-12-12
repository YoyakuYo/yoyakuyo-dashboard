"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import WhiteLanguageSwitcher from './WhiteLanguageSwitcher';

export default function MinimalNavbar() {
  const t = useTranslations('landing');
  const handleLoginClick = () => {
    if (typeof window !== 'undefined') {
      // Open role selection modal for login
      window.dispatchEvent(new CustomEvent('openLoginModal'));
    }
  };

  const handleJoinClick = () => {
    if (typeof window !== 'undefined') {
      // Open role selection modal for join
      window.dispatchEvent(new CustomEvent('openSignupModal'));
    }
  };

  return (
    <nav className="sticky top-[44px] z-[150] bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-japanese-red transition-colors">
            Yoyaku Yo
          </Link>

          {/* Center: Categories | SERVICES */}
          <div className="flex items-center gap-2">
            <Link 
              href="/browse" 
              className="text-sm font-medium text-gray-900 hover:text-japanese-red transition-colors"
            >
              {t('navCategories') || 'Categories'}
            </Link>
            <span className="text-gray-400">|</span>
            <Link 
              href="/services" 
              className="text-sm font-medium text-gray-900 hover:text-japanese-red transition-colors"
            >
              {t('navServices') || 'SERVICES'}
            </Link>
          </div>

          {/* Right: Language + Login + Join */}
          <div className="flex items-center gap-4">
            <WhiteLanguageSwitcher />
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 text-sm font-medium text-gray-900 hover:text-japanese-red transition-colors"
            >
              {t('heroLogin') || 'Login'}
            </button>
            <button
              onClick={handleJoinClick}
              className="px-4 py-2 text-sm font-medium bg-japanese-red/90 hover:bg-japanese-red text-white rounded-md transition-all shadow-md hover:shadow-lg"
            >
              {t('heroJoin')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}


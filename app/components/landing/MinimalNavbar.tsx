"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function MinimalNavbar() {
  const t = useTranslations('landing');
  const handleLoginClick = () => {
    if (typeof window !== 'undefined') {
      // Open role selection modal for login (Customer vs Owner)
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
    <nav className="sticky top-[48px] z-[150] bg-blue-900 backdrop-blur-sm border-b border-blue-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="text-xl font-semibold text-white hover:text-blue-200 transition-colors">
            Yoyaku Yo
          </Link>

          {/* Center: Categories | Services */}
          <div className="flex items-center gap-2">
            <Link
              href="/browse"
              className="text-sm font-medium text-white hover:text-blue-200 transition-colors"
            >
              {t('navCategories') || 'Categories'}
            </Link>
            <span className="text-blue-300">|</span>
            <Link
              href="/services"
              className="text-sm font-medium text-white hover:text-blue-200 transition-colors"
            >
              {t('navServices') || 'Services'}
            </Link>
          </div>

          {/* Right: Login + Join */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors"
            >
              {t('heroLogin') || 'Login'}
            </button>
            <button
              onClick={handleJoinClick}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-md hover:shadow-lg"
            >
              {t('heroJoin')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}


"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import WhiteLanguageSwitcher from './WhiteLanguageSwitcher';

export default function MinimalNavbar() {
  const t = useTranslations('landing');
  const handleLoginClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openLoginModal'));
    }
  };

  const handleJoinClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSignupModal'));
    }
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="text-xl font-semibold text-white hover:text-blue-300 transition-colors">
            Yoyaku Yo
          </Link>

          {/* Center: Categories */}
          <Link 
            href="/browse" 
            className="text-sm font-medium text-white hover:text-blue-300 transition-colors"
          >
            {t('navCategories')}
          </Link>

          {/* Right: Language + Login + Join */}
          <div className="flex items-center gap-4">
            <WhiteLanguageSwitcher />
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 text-sm font-medium text-white hover:text-blue-300 transition-colors"
            >
              {t('heroLogin')}
            </button>
            <button
              onClick={handleJoinClick}
              className="px-4 py-2 text-sm font-medium text-white hover:text-blue-300 transition-colors"
            >
              {t('heroJoin')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}


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
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="text-xl font-semibold text-white hover:text-japanese-gold transition-colors drop-shadow-lg">
            Yoyaku Yo
          </Link>

          {/* Center: Categories | Services */}
          <div className="flex items-center gap-2">
            <Link 
              href="/browse" 
              className="text-sm font-medium text-white hover:text-japanese-gold transition-colors drop-shadow-md"
            >
              {t('navCategories')}
            </Link>
            <span className="text-white/60">|</span>
            <Link 
              href="/services" 
              className="text-sm font-medium text-white hover:text-japanese-gold transition-colors drop-shadow-md"
            >
              {t('navServices') || 'Services'}
            </Link>
          </div>

          {/* Right: Language + Login + Join */}
          <div className="flex items-center gap-4">
            <WhiteLanguageSwitcher />
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 text-sm font-medium text-white hover:text-japanese-gold transition-colors drop-shadow-md"
            >
              {t('heroLogin')}
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


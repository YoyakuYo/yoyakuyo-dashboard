'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LandingHeaderProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export function LandingHeader({ onOpenLogin, onOpenSignup }: LandingHeaderProps) {
  const t = useTranslations();
  
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Yoyaku Yo
          </Link>

          {/* Right: Language Switcher + Owner Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <button
              onClick={onOpenLogin}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('home.ownerLogin')}
            </button>
            <button
              onClick={onOpenSignup}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {t('home.joinAsOwner')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


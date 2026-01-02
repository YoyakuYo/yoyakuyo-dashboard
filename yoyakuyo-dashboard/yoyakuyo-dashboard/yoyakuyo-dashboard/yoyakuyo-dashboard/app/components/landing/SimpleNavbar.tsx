"use client";

import Link from 'next/link';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function SimpleNavbar() {
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-pink-600 hover:text-pink-700 transition-colors">
            Yoyaku Yo
          </Link>

          {/* Right Side: Language, Login, Join */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Login
            </button>
            <button
              onClick={handleJoinClick}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}


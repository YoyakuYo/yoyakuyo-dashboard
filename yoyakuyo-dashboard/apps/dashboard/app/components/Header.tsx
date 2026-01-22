// apps/dashboard/app/components/Header.tsx

"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import LanguageToggle from './LanguageToggle';

const Header = React.memo(() => {
  const t = useTranslations();

  const handleOpenSidebar = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSidebarDrawer'));
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg z-50">
      {/* Mobile Header */}
      <div className="flex lg:hidden items-center h-full px-4">
        <button
          className="text-2xl text-white focus:outline-none p-2 mr-2"
          aria-label="Open menu"
          onClick={handleOpenSidebar}
        >
          ☰
        </button>
        <h1 className="text-xl font-bold">{t('nav.dashboard')}</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center h-full justify-between px-6">
        <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
        <LanguageToggle />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;


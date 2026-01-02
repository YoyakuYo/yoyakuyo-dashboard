// apps/dashboard/app/components/Header.tsx

"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import LanguageToggle from './LanguageToggle';

const Header = React.memo(() => {
  const t = useTranslations();
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg z-50">
      <div className="h-full flex items-center justify-between px-6">
        <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
        <LanguageToggle />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;


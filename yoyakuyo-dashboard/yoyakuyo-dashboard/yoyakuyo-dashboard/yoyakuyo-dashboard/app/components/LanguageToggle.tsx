'use client';

import React, { useState, useEffect } from 'react';
import { setLanguage, getLanguage } from '@/lib/i18n';

export default function LanguageToggle() {
  // Start with null to avoid hydration mismatch - will be set after mount
  const [currentLang, setCurrentLang] = useState<'en' | 'ja' | null>(null);
  const [mounted, setMounted] = useState(false);

  // Only read language after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    const lang = getLanguage();
    setCurrentLang(lang);
  }, []);

  const handleLanguageChange = (lang: 'en' | 'ja') => {
    if (lang === currentLang) return; // Don't do anything if already selected
    
    setLanguage(lang);
    setCurrentLang(lang);
    // Trigger the languageChanged event that NextIntlProvider listens to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('languageChanged'));
      // Small delay to ensure state updates, then reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // During SSR and before mount, render with default 'en' styling to avoid mismatch
  // After mount, use the actual language
  const activeLang = mounted ? currentLang : 'en';

  return (
    <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-0.5 bg-white shadow-sm">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          activeLang === 'en'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label="Switch to English"
        type="button"
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('ja')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          activeLang === 'ja'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label="Switch to Japanese"
        type="button"
      >
        日本語
      </button>
    </div>
  );
}


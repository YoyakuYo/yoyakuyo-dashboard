'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SupportedLocale } from '../../i18n';

const languages: Array<{ code: SupportedLocale; name: string; flag: string }> = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
];

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('ja');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get current locale from cookie or localStorage
    const getStoredLocale = (): SupportedLocale => {
      if (typeof window === 'undefined') return 'ja';
      
      const cookies = document.cookie.split(';');
      const langCookie = cookies.find(c => c.trim().startsWith('yoyaku_yo_language='));
      if (langCookie) {
        const value = langCookie.split('=')[1]?.trim() as SupportedLocale;
        if (languages.some(l => l.code === value)) {
          return value;
        }
      }
      
      const stored = localStorage.getItem('yoyaku_yo_language') as SupportedLocale;
      if (languages.some(l => l.code === stored)) {
        return stored;
      }
      
      return 'ja';
    };

    setCurrentLocale(getStoredLocale());
  }, []);

  const changeLanguage = (locale: SupportedLocale) => {
    // Save to both cookie and localStorage
    document.cookie = `yoyaku_yo_language=${locale}; path=/; max-age=31536000`; // 1 year
    localStorage.setItem('yoyaku_yo_language', locale);
    
    setCurrentLocale(locale);
    setIsOpen(false);
    
    // Dispatch custom event to notify NextIntlProvider
    window.dispatchEvent(new Event('languageChanged'));
    
    // Force a full page reload to ensure all translations are applied
    window.location.reload();
  };

  const currentLang = languages.find(l => l.code === currentLocale) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
        aria-label="Change language"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="text-sm font-medium text-gray-700">{currentLang.code.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                    currentLocale === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                  {currentLocale === lang.code && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


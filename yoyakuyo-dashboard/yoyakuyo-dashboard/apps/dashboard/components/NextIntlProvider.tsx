'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';

export function NextIntlProviderWrapper({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<'en' | 'ja'>('en');
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    // Get locale from cookie or localStorage
    const getStoredLocale = (): 'en' | 'ja' => {
      if (typeof window === 'undefined') return 'en';
      
      // Try cookie first
      const cookies = document.cookie.split(';');
      const langCookie = cookies.find(c => c.trim().startsWith('bookyo_language='));
      if (langCookie) {
        const value = langCookie.split('=')[1]?.trim();
        if (value === 'en' || value === 'ja') {
          return value;
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('bookyo_language');
      if (stored === 'en' || stored === 'ja') {
        return stored;
      }
      
      return 'en';
    };

    const currentLocale = getStoredLocale();
    setLocale(currentLocale);

    // Load messages
    import(`../messages/${currentLocale}.json`)
      .then((mod) => {
        setMessages(mod.default);
      })
      .catch(() => {
        // Fallback to English if locale file not found
        import('../messages/en.json').then((mod) => {
          setMessages(mod.default);
        });
      });
  }, []);

  // Listen for locale changes
  useEffect(() => {
    const handleStorageChange = () => {
      const cookies = document.cookie.split(';');
      const langCookie = cookies.find(c => c.trim().startsWith('bookyo_language='));
      if (langCookie) {
        const value = langCookie.split('=')[1]?.trim();
        if (value === 'en' || value === 'ja') {
          setLocale(value);
          import(`../messages/${value}.json`)
            .then((mod) => setMessages(mod.default))
            .catch(() => {
              import('../messages/en.json').then((mod) => setMessages(mod.default));
            });
        }
      }
    };

    // Listen for custom event when language changes
    window.addEventListener('languageChanged', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('languageChanged', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!messages) {
    return <>{children}</>; // Render children without provider while loading
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}


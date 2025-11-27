'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import type { SupportedLocale } from '../../i18n';
// Import default messages for SSR
import enMessages from '../../messages/en.json';
import jaMessages from '../../messages/ja.json';
import zhMessages from '../../messages/zh.json';
import esMessages from '../../messages/es.json';
import ptBRMessages from '../../messages/pt-BR.json';

// Ensure messages are always valid objects
const messageMap: Record<SupportedLocale, any> = {
  'en': enMessages && typeof enMessages === 'object' ? enMessages : {},
  'ja': jaMessages && typeof jaMessages === 'object' ? jaMessages : {},
  'zh': zhMessages && typeof zhMessages === 'object' ? zhMessages : {},
  'es': esMessages && typeof esMessages === 'object' ? esMessages : {},
  'pt-BR': ptBRMessages && typeof ptBRMessages === 'object' ? ptBRMessages : {},
};

export function NextIntlProviderWrapper({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>('ja'); // Default to Japanese
  const [messages, setMessages] = useState<any>(messageMap['ja']);

  useEffect(() => {
    // Get locale from cookie or localStorage
    const getStoredLocale = (): SupportedLocale => {
      if (typeof window === 'undefined') return 'ja';
      
      // Try cookie first
      const cookies = document.cookie.split(';');
      const langCookie = cookies.find(c => c.trim().startsWith('yoyaku_yo_language='));
      if (langCookie) {
        const value = langCookie.split('=')[1]?.trim() as SupportedLocale;
        if (value && messageMap[value]) {
          return value;
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('yoyaku_yo_language') as SupportedLocale;
      if (stored && messageMap[stored]) {
        return stored;
      }
      
      return 'ja'; // Default to Japanese
    };

    const currentLocale = getStoredLocale();
    setLocale(currentLocale);
    setMessages(messageMap[currentLocale] || messageMap['ja']);
  }, []);

  // Listen for locale changes
  useEffect(() => {
    const handleStorageChange = () => {
      // Check both cookie and localStorage
      const cookies = document.cookie.split(';');
      const langCookie = cookies.find(c => c.trim().startsWith('yoyaku_yo_language='));
      let newLocale: SupportedLocale | null = null;
      
      if (langCookie) {
        const value = langCookie.split('=')[1]?.trim() as SupportedLocale;
        if (value && messageMap[value]) {
          newLocale = value;
        }
      }
      
      // Fallback to localStorage if cookie not found
      if (!newLocale) {
        const stored = localStorage.getItem('yoyaku_yo_language') as SupportedLocale;
        if (stored && messageMap[stored]) {
          newLocale = stored;
        }
      }
      
      if (newLocale) {
        // Use functional update to avoid dependency on locale
        setLocale(prevLocale => {
          if (prevLocale !== newLocale) {
            setMessages(messageMap[newLocale!] || messageMap['ja']);
            return newLocale!;
          }
          return prevLocale;
        });
      }
    };

    // Listen for custom event when language changes
    window.addEventListener('languageChanged', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('languageChanged', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array - only set up listeners once

  // Ensure messages is always a valid object with proper structure
  const safeMessages = messages && typeof messages === 'object' ? messages : messageMap['ja'];
  
  // Validate that shops.photos exists in messages
  if (process.env.NODE_ENV === 'development' && safeMessages.shops && !safeMessages.shops.photos) {
    console.warn('⚠️ shops.photos missing in messages, adding fallback');
    const photoTexts: Record<SupportedLocale, string> = {
      'ja': '写真',
      'en': 'Photos',
      'zh': '照片',
      'es': 'Fotos',
      'pt-BR': 'Fotos',
    };
    safeMessages.shops = {
      ...safeMessages.shops,
      photos: photoTexts[locale] || 'Photos',
    };
  }
  
  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={safeMessages}
      onError={(error) => {
        // Silently handle missing translation keys - getMessageFallback will handle them
        // Only log unexpected errors in development
        if (process.env.NODE_ENV === 'development' && error.code !== 'MISSING_MESSAGE') {
          console.warn('next-intl error:', error);
        }
      }}
      getMessageFallback={({ namespace, key, error }) => {
        // Provide fallback for missing messages
        if (key === 'shops.photos') {
          const photoTexts: Record<SupportedLocale, string> = {
            'ja': '写真',
            'en': 'Photos',
            'zh': '照片',
            'es': 'Fotos',
            'pt-BR': 'Fotos',
          };
          return photoTexts[locale] || 'Photos';
        }
        
        // Handle missing city/prefecture keys gracefully
        if (key.startsWith('cities.') || key.startsWith('prefectures.')) {
          // Extract the name from the key (e.g., "cities.tokyo" -> "tokyo")
          const name = key.split('.').pop() || key;
          // Format nicely: replace dashes/underscores with spaces, capitalize words
          return name
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
            .trim();
        }
        
        // For other missing keys, return the key itself (next-intl will handle it)
        return key;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}


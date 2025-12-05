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

// Get locale from cookie or localStorage (synchronous for initial render)
function getStoredLocale(): SupportedLocale {
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
}

export function NextIntlProviderWrapper({ children }: { children: ReactNode }) {
  // Initialize with stored locale immediately (not just in useEffect)
  const initialLocale = typeof window !== 'undefined' ? getStoredLocale() : 'ja';
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);
  const [messages, setMessages] = useState<any>(messageMap[initialLocale] || messageMap['ja']);

  useEffect(() => {
    // Re-check locale on mount to ensure it's up to date
    const currentLocale = getStoredLocale();
    if (currentLocale !== locale) {
      setLocale(currentLocale);
      setMessages(messageMap[currentLocale] || messageMap['ja']);
    }
  }, []);

  // Listen for locale changes
  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      // Check if event has detail with locale
      const customEvent = event as CustomEvent<{ locale?: SupportedLocale }>;
      let newLocale: SupportedLocale | null = null;
      
      if (customEvent.detail?.locale && messageMap[customEvent.detail.locale]) {
        newLocale = customEvent.detail.locale;
      } else {
        // Check both cookie and localStorage
        const cookies = document.cookie.split(';');
        const langCookie = cookies.find(c => c.trim().startsWith('yoyaku_yo_language='));
        
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
      }
      
      if (newLocale) {
        // Use functional update to avoid dependency on locale
        setLocale(prevLocale => {
          if (prevLocale !== newLocale) {
            const newMessages = messageMap[newLocale!] || messageMap['ja'];
            setMessages(newMessages);
            return newLocale!;
          }
          return prevLocale;
        });
      }
    };

    const handleStorageChange = () => {
      handleLanguageChange(new Event('storage'));
    };

    // Listen for custom event when language changes
    window.addEventListener('languageChanged', handleLanguageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
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
        
        // Handle missing category keys gracefully
        if (key.startsWith('categories.')) {
          // Extract the category name from the key (e.g., "categories.beauty_services" -> "Beauty Services")
          const categoryName = key.replace('categories.', '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
            .trim();
          return categoryName;
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


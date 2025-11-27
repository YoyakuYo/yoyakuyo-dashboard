import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export type SupportedLocale = 'ja' | 'en' | 'zh' | 'pt-BR' | 'es';

export const supportedLocales: SupportedLocale[] = ['ja', 'en', 'zh', 'pt-BR', 'es'];

export default getRequestConfig(async () => {
  let locale: SupportedLocale = 'ja'; // Default to Japanese
  let messages: any = {};
  
  try {
    // Get locale from cookie, default to 'ja'
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('yoyaku_yo_language')?.value;
    
    if (localeCookie && supportedLocales.includes(localeCookie as SupportedLocale)) {
      locale = localeCookie as SupportedLocale;
    }
  } catch (error) {
    // If cookies() fails, use default locale
    console.warn("🔥 Failed to read locale cookie, using default 'ja':", error);
    locale = 'ja';
  }
  
  try {
    // Try to load messages for the locale
    const messagesModule = await import(`./messages/${locale}.json`);
    messages = messagesModule.default || {};
    
    // Validate messages is an object
    if (typeof messages !== 'object' || messages === null) {
      throw new Error(`Messages for locale '${locale}' is not a valid object`);
    }
  } catch (error) {
    // If locale file fails to load, fallback to English, then Japanese
    console.warn(`🔥 Failed to load messages for locale '${locale}', falling back to 'en':`, error);
    
    try {
      const fallbackModule = await import(`./messages/en.json`);
      messages = fallbackModule.default || {};
      locale = 'en'; // Force English locale if fallback used
    } catch (fallbackError) {
      // If even English fails, try Japanese
      try {
        const jaFallback = await import(`./messages/ja.json`);
        messages = jaFallback.default || {};
        locale = 'ja';
      } catch (jaError) {
        console.error("🔥 Failed to load fallback messages:", jaError);
        messages = {};
      }
    }
  }
  
  return {
    locale,
    messages
  };
});


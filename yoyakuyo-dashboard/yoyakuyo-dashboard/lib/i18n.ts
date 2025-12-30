// apps/dashboard/lib/i18n.ts
// Simple i18n utility with cookie persistence

'use client';

export type Language = 'en' | 'ja';

const COOKIE_NAME = 'yoyaku_yo_language';
const DEFAULT_LANGUAGE: Language = 'en';

// Get language from cookie (client-side only)
export function getLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const cookies = document.cookie.split(';');
  const langCookie = cookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
  
  if (langCookie) {
    const value = langCookie.split('=')[1]?.trim();
    if (value === 'en' || value === 'ja') {
      return value;
    }
  }
  
  return DEFAULT_LANGUAGE;
}

// Set language cookie
export function setLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  
  // Set cookie with 1 year expiration
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=${lang}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  
  // Also set in localStorage for immediate access
  localStorage.setItem(COOKIE_NAME, lang);
}

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.shops': 'Shops',
    'nav.ownerLogin': 'Owner Login',
    'nav.myShop': 'My Shop',
    'nav.aiAssistant': 'AI Assistant',
    'nav.logout': 'Logout',
    'home.title': 'Yoyaku Yo',
    'home.subtitle': 'AI-powered booking assistant for salons in Tokyo',
    'home.browseShops': 'Browse Shops',
    'home.ownerLogin': 'Owner Login',
    'booking.title': 'Book an appointment',
    'booking.service': 'Service',
    'booking.staff': 'Staff (Optional)',
    'booking.date': 'Date',
    'booking.time': 'Time',
    'booking.yourName': 'Your Name',
    'booking.yourEmail': 'Your Email',
    'booking.phone': 'Phone (Optional)',
    'booking.submit': 'Book Now',
    'booking.success': 'Booking request submitted successfully!',
    'chat.title': 'Chat with AI assistant',
    'chat.placeholder': 'Type your message...',
    'chat.send': 'Send',
    'categories.all': 'All Categories',
    'categories.barbershop': 'Barbershop',
    'categories.beauty_salon': 'Beauty Salon',
    'categories.eyelash': 'Eyelash',
    'categories.general_salon': 'General Salon',
    'categories.hair_salon': 'Hair Salon',
    'categories.nail_salon': 'Nail Salon',
    'categories.spa_massage': 'Spa & Massage',
    'categories.unknown': 'Unknown',
    'shops.search': 'Search by name',
    'shops.categories': 'Categories',
    'shops.found': 'Found',
    'shops.shop': 'shop',
    'shops.shops': 'shops',
    'shops.viewDetails': 'View details',
    'shops.loading': 'Loading shops...',
    'shops.noShops': 'No shops found',
    'shops.tryAdjusting': 'Try adjusting your search or category filter',
    'shops.notAvailable': 'No shops are available at the moment',
  },
  ja: {
    'nav.shops': '店舗',
    'nav.ownerLogin': 'オーナーログイン',
    'nav.myShop': 'マイショップ',
    'nav.aiAssistant': 'AIアシスタント',
    'nav.logout': 'ログアウト',
    'home.title': 'Yoyaku Yo',
    'home.subtitle': '東京のサロン向けAI予約アシスタント',
    'home.browseShops': '店舗を探す',
    'home.ownerLogin': 'オーナーログイン',
    'booking.title': '予約する',
    'booking.service': 'サービス',
    'booking.staff': 'スタッフ（任意）',
    'booking.date': '日付',
    'booking.time': '時間',
    'booking.yourName': 'お名前',
    'booking.yourEmail': 'メールアドレス',
    'booking.phone': '電話番号（任意）',
    'booking.submit': '予約する',
    'booking.success': '予約リクエストが送信されました！',
    'chat.title': 'AIアシスタントとチャット',
    'chat.placeholder': 'メッセージを入力...',
    'chat.send': '送信',
    'categories.all': 'すべてのカテゴリー',
    'categories.barbershop': '理髪店',
    'categories.beauty_salon': '美容サロン',
    'categories.eyelash': 'まつげ',
    'categories.general_salon': '総合サロン',
    'categories.hair_salon': 'ヘアサロン',
    'categories.nail_salon': 'ネイルサロン',
    'categories.spa_massage': 'スパ・マッサージ',
    'categories.unknown': '不明',
    'shops.search': '名前で検索',
    'shops.categories': 'カテゴリー',
    'shops.found': '見つかりました',
    'shops.shop': '店舗',
    'shops.shops': '店舗',
    'shops.viewDetails': '詳細を見る',
    'shops.loading': '店舗を読み込み中...',
    'shops.noShops': '店舗が見つかりませんでした',
    'shops.tryAdjusting': '検索またはカテゴリーフィルターを調整してみてください',
    'shops.notAvailable': '現在利用可能な店舗はありません',
  },
};

export function t(key: string, lang: Language = getLanguage()): string {
  return translations[lang]?.[key] || key;
}


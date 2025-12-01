// apps/dashboard/app/components/PublicFooter.tsx
// Footer component for all public pages

"use client";

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function PublicFooter() {
  const pathname = usePathname();
  const isDarkPage = pathname === '/featured' || pathname === '/trending';

  const locale = useLocale();
  const isJapanese = locale === 'ja';
  
  let t: ReturnType<typeof useTranslations>;
  let tFooter: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
    tFooter = useTranslations('footer');
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tFooter = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  return (
    <footer className={`${isDarkPage ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'} border-t ${isDarkPage ? 'border-slate-700' : 'border-gray-200'} py-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="text-2xl font-bold mb-4">Yoyaku Yo</div>
            <p className={`text-sm ${isDarkPage ? 'text-gray-400' : 'text-gray-600'} ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? '日本の予約プラットフォーム' : "Japan's Premier Booking Platform"}
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDarkPage ? 'text-white' : 'text-gray-900'} ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? 'サービス' : 'Services'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/categories" 
                  className={`text-sm ${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors ${isJapanese ? 'font-japanese' : ''}`}
                >
                  {isJapanese ? 'カテゴリー' : 'Categories'}
                </Link>
              </li>
              <li>
                <Link 
                  href="/featured" 
                  className={`text-sm ${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors ${isJapanese ? 'font-japanese' : ''}`}
                >
                  {isJapanese ? 'おすすめ' : 'Featured'}
                </Link>
              </li>
              <li>
                <Link 
                  href="/trending" 
                  className={`text-sm ${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors ${isJapanese ? 'font-japanese' : ''}`}
                >
                  {isJapanese ? 'トレンド' : 'Trending'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDarkPage ? 'text-white' : 'text-gray-900'} ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? '法律' : 'Legal'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  className={`text-sm ${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors ${isJapanese ? 'font-japanese' : ''}`}
                >
                  {isJapanese ? '会社概要' : (tFooter('about') || 'About')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className={`text-sm ${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors ${isJapanese ? 'font-japanese' : ''}`}
                >
                  {isJapanese ? 'プライバシーポリシー' : (tFooter('privacy') || 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className={`text-sm ${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors ${isJapanese ? 'font-japanese' : ''}`}
                >
                  {isJapanese ? '利用規約' : (tFooter('terms') || 'Terms')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className={`text-sm ${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors ${isJapanese ? 'font-japanese' : ''}`}
                >
                  {isJapanese ? 'お問い合わせ' : (tFooter('contact') || 'Contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* App Download (QR Code placeholder) */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDarkPage ? 'text-white' : 'text-gray-900'} ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? 'アプリ' : 'App'}
            </h4>
            <div className={`text-sm ${isDarkPage ? 'text-gray-400' : 'text-gray-600'} ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese ? '近日公開' : 'Coming Soon'}
            </div>
            {/* QR Code placeholder - can be added later when app is ready */}
            {/* <div className="mt-4 w-24 h-24 bg-gray-200 rounded-lg"></div> */}
          </div>
        </div>

        <div className={`pt-8 border-t ${isDarkPage ? 'border-slate-700' : 'border-gray-200'} flex flex-col md:flex-row justify-between items-center gap-4`}>
          <div className={`text-sm ${isDarkPage ? 'text-gray-400' : 'text-gray-500'} ${isJapanese ? 'font-japanese' : ''}`}>
            © {new Date().getFullYear()} Yoyaku Yo. {isJapanese ? '無断転載禁止' : (tFooter('rights') || 'All rights reserved.')}
          </div>
          {/* Social Media Links (placeholder) */}
          <div className="flex gap-4">
            {/* Can add social media icons here later */}
          </div>
        </div>
      </div>
    </footer>
  );
}


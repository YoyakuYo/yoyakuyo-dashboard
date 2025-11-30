// apps/dashboard/app/components/PublicFooter.tsx
// Footer component for all public pages

"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function PublicFooter() {
  const pathname = usePathname();
  const isDarkPage = pathname === '/featured' || pathname === '/trending';

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
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold">
            Yoyaku Yo
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link 
              href="/about" 
              className={`${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              {tFooter('about') || 'About'}
            </Link>
            <Link 
              href="/privacy" 
              className={`${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              {tFooter('privacy') || 'Privacy Policy'}
            </Link>
            <Link 
              href="/terms" 
              className={`${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              {tFooter('terms') || 'Terms'}
            </Link>
            <Link 
              href="/contact" 
              className={`${isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              {tFooter('contact') || 'Contact'}
            </Link>
          </div>
        </div>
        <div className={`mt-8 text-center text-sm ${isDarkPage ? 'text-gray-400' : 'text-gray-500'}`}>
          © {new Date().getFullYear()} Yoyaku Yo. {tFooter('rights') || 'All rights reserved.'}
        </div>
      </div>
    </footer>
  );
}


"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import HeroCarousel from '@/app/components/landing/HeroCarousel';
import CategoryGrid from '@/app/components/landing/CategoryGrid';
import { BrowseAIAssistant } from '@/app/browse/components/BrowseAIAssistant';
import { BrowseAIProvider } from '@/app/components/BrowseAIContext';

export const dynamic = 'force-dynamic';

export default function CustomerHomePage() {
  const router = useRouter();
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/customer/shops?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/customer/shops');
    }
  };

  return (
    <BrowseAIProvider>
      <div className="min-h-screen bg-white">
        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Category Grid */}
        <CategoryGrid />

        {/* Search & Quick Actions */}
        <section className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {t('home.search')}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Browse AI Assistant - Hidden but available for context */}
        <div className="hidden">
          <BrowseAIAssistant />
        </div>
      </div>
    </BrowseAIProvider>
  );
}


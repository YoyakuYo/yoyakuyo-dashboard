// apps/dashboard/app/trending/page.tsx
// Trending Shops Page - Dark Theme

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { apiUrl } from '@/lib/apiClient';
import { CATEGORIES } from '@/lib/categories';
import { PREFECTURES } from '@/lib/prefectures';

export const dynamic = 'force-dynamic';

interface Shop {
  id: string;
  name: string;
  address?: string;
  prefecture?: string;
  city?: string;
  category_id?: string;
  cover_photo_url?: string;
  image_url?: string;
  logo_url?: string;
  claim_status?: string;
  // Add popularity metrics if available
  view_count?: number;
  booking_count?: number;
  rating?: number;
}

function TrendingPageContent() {
  let t: ReturnType<typeof useTranslations>;
  let tHome: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
    tHome = useTranslations('home');
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tHome = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<'week' | 'month' | 'all'>('week');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '50');
        
        if (selectedCategory !== 'all') {
          params.set('category', selectedCategory);
        }

        const res = await fetch(`${apiUrl}/shops?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const shopsArray = Array.isArray(data) 
            ? data 
            : (data.data && Array.isArray(data.data) 
              ? data.data 
              : (data.shops || []));
          
          const visibleShops = shopsArray.filter((shop: Shop) => 
            !shop.claim_status || shop.claim_status !== 'hidden'
          );
          
          // Sort by popularity (if metrics exist, otherwise by name)
          const sortedShops = [...visibleShops].sort((a, b) => {
            const aScore = (a.booking_count || 0) + (a.view_count || 0) + (a.rating || 0) * 10;
            const bScore = (b.booking_count || 0) + (b.view_count || 0) + (b.rating || 0) * 10;
            return bScore - aScore;
          });
          
          setShops(sortedShops);
        }
      } catch (error) {
        console.error('Error loading trending shops:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [selectedCategory, timeWindow]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '';
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.name || '';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {tHome('trendingPageTitle') || 'Trending Shops'}
          </h1>
          <p className="text-xl text-gray-300">
            {tHome('trendingPageSubtitle') || 'Most viewed and most booked shops.'}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          {/* Time Window Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimeWindow('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeWindow === 'week'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              {tHome('thisWeek') || 'This Week'}
            </button>
            <button
              onClick={() => setTimeWindow('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeWindow === 'month'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              {tHome('thisMonth') || 'This Month'}
            </button>
            <button
              onClick={() => setTimeWindow('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeWindow === 'all'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              {tHome('allTime') || 'All Time'}
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">{t('browse.allCategories') || 'All Categories'}</option>
            {CATEGORIES.filter(c => !c.isSubcategory).map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {/* Shop Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-gray-400">{t('common.loading') || 'Loading shops...'}</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">{t('shops.noShops') || 'No shops found.'}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-300">
              {t('shops.shopsFound', { count: shops.length }) || `${shops.length} shops found`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop, index) => {
                const imageUrl = shop.cover_photo_url || shop.image_url || shop.logo_url;
                return (
                  <Link
                    key={shop.id}
                    href={`/browse?shop=${shop.id}`}
                    className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-500 transition-all group relative"
                  >
                    {/* Trending Badge */}
                    {index < 3 && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-1 bg-cyan-500 text-white text-xs font-semibold rounded">
                          #{index + 1} {t('home.trending') || 'Trending'}
                        </span>
                      </div>
                    )}
                    <div className="relative h-48">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={shop.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2">{shop.name}</h3>
                      <p className="text-sm text-gray-400 mb-1">
                        {getCategoryName(shop.category_id)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {shop.city || shop.prefecture || 'Japan'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <TrendingPageContent />
    </Suspense>
  );
}


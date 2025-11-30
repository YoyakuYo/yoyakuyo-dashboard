// apps/dashboard/app/featured/page.tsx
// Featured Shops Page - Dark Theme

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { apiUrl } from '@/lib/apiClient';
import { CATEGORIES } from '@/lib/categories';
import { PREFECTURES } from '@/lib/prefectures';
import { REGIONS } from '@/lib/regions';

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
}

function FeaturedPageContent() {
  let t: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('all');

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
        if (selectedPrefecture !== 'all') {
          params.set('prefecture', selectedPrefecture);
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
          
          setShops(visibleShops);
        }
      } catch (error) {
        console.error('Error loading featured shops:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [selectedCategory, selectedPrefecture]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '';
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.name || '';
  };

  const getPrefectureName = (prefKey?: string) => {
    if (!prefKey) return '';
    const pref = PREFECTURES.find(p => p.key === prefKey);
    return pref?.name || prefKey;
  };

  // Filter prefectures by selected region
  const availablePrefectures = selectedRegion === 'all' 
    ? PREFECTURES 
    : REGIONS.find(r => r.key === selectedRegion)?.prefectures.map(key => 
        PREFECTURES.find(p => p.key === key)
      ).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('home.featuredPageTitle') || 'Featured Shops'}
          </h1>
          <p className="text-xl text-gray-300">
            {t('home.featuredPageSubtitle') || 'Curated salons, clinics, hotels and more across Japan.'}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedPrefecture('all');
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">{t('browse.allRegions') || 'All Regions'}</option>
            {REGIONS.map(region => (
              <option key={region.key} value={region.key}>{region.name}</option>
            ))}
          </select>

          {/* Prefecture Filter */}
          <select
            value={selectedPrefecture}
            onChange={(e) => setSelectedPrefecture(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">{t('browse.allPrefectures') || 'All Prefectures'}</option>
            {availablePrefectures.map((pref: any) => (
              <option key={pref.key} value={pref.key}>{pref.name}</option>
            ))}
          </select>

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
              {shops.map((shop) => {
                const imageUrl = shop.cover_photo_url || shop.image_url || shop.logo_url;
                return (
                  <Link
                    key={shop.id}
                    href={`/browse?shop=${shop.id}`}
                    className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-500 transition-all group"
                  >
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
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-cyan-500 text-white text-xs font-semibold rounded">
                          {t('home.featured') || 'Featured'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2">{shop.name}</h3>
                      <p className="text-sm text-gray-400 mb-1">
                        {getCategoryName(shop.category_id)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {shop.city || getPrefectureName(shop.prefecture) || 'Japan'}
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

export default function FeaturedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <FeaturedPageContent />
    </Suspense>
  );
}


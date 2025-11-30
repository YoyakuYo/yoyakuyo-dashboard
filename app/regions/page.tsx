// apps/dashboard/app/regions/page.tsx
// Region → Prefecture → City Filter Page

"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { apiUrl } from '@/lib/apiClient';
import { REGIONS, getPrefecturesInRegion } from '@/lib/regions';
import { PREFECTURES } from '@/lib/prefectures';

export const dynamic = 'force-dynamic';

interface Shop {
  id: string;
  name: string;
  address?: string;
  prefecture?: string;
  city?: string;
  normalized_city?: string;
  category_id?: string;
  cover_photo_url?: string;
  image_url?: string;
  logo_url?: string;
}

function RegionsPageContent() {
  let t: ReturnType<typeof useTranslations>;
  const locale = useLocale();
  const isJapanese = locale === 'ja';
  try {
    t = useTranslations();
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  // Fetch all shops to compute available regions/prefectures/cities
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/shops?page=1&limit=1000`);
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
        console.error('Error loading shops:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  // Compute which regions/prefectures/cities have shops
  const { regionsWithShops, prefecturesWithShops, citiesWithShops } = useMemo(() => {
    const prefCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const citiesByPref: Record<string, Set<string>> = {};

    shops.forEach((shop) => {
      // Match prefecture
      let matchingPref = PREFECTURES.find(p => {
        if (!shop.prefecture) return false;
        const shopPref = shop.prefecture.toLowerCase();
        return shopPref.includes(p.name.toLowerCase()) || 
               shopPref.includes(p.nameJa) ||
               p.nameJa.includes(shopPref) ||
               shop.address?.includes(p.nameJa);
      });

      if (matchingPref) {
        const prefKey = matchingPref.key;
        prefCounts[prefKey] = (prefCounts[prefKey] || 0) + 1;

        // Extract city
        let city = shop.normalized_city || shop.city;
        if (!city && shop.address) {
          const cityMatch = shop.address.match(/([^都道府県]+(?:市|区|町|村|郡))/);
          if (cityMatch) {
            city = cityMatch[0].trim();
          }
        }
        
        if (city) {
          const cityKey = `${prefKey}_${city}`;
          cityCounts[cityKey] = (cityCounts[cityKey] || 0) + 1;
          
          if (!citiesByPref[prefKey]) {
            citiesByPref[prefKey] = new Set();
          }
          citiesByPref[prefKey].add(city);
        }
      }
    });

    // Find regions that have shops
    const regionsWithShops = REGIONS.filter(region => 
      region.prefectures.some(prefKey => prefCounts[prefKey] > 0)
    );

    return {
      regionsWithShops,
      prefecturesWithShops: prefCounts,
      citiesWithShops: { counts: cityCounts, byPrefecture: citiesByPref },
    };
  }, [shops]);

  // Filter shops based on selections
  const filteredShops = useMemo(() => {
    let filtered = shops;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop => 
        shop.name?.toLowerCase().includes(query) ||
        shop.city?.toLowerCase().includes(query) ||
        shop.address?.toLowerCase().includes(query)
      );
    }

    // Filter by prefectures
    if (selectedPrefectures.length > 0) {
      filtered = filtered.filter(shop => {
        if (!shop.prefecture) return false;
        return selectedPrefectures.some(prefKey => {
          const pref = PREFECTURES.find(p => p.key === prefKey);
          if (!pref) return false;
          const shopPref = shop.prefecture.toLowerCase();
          return shopPref.includes(pref.name.toLowerCase()) || 
                 shopPref.includes(pref.nameJa) ||
                 shop.address?.includes(pref.nameJa);
        });
      });
    }

    // Filter by cities
    if (selectedCities.length > 0) {
      filtered = filtered.filter(shop => {
        const shopCity = (shop.normalized_city || shop.city || '').toLowerCase();
        return selectedCities.some(city => shopCity.includes(city.toLowerCase()));
      });
    }

    return filtered;
  }, [shops, searchQuery, selectedPrefectures, selectedCities]);

  const toggleRegion = (regionKey: string) => {
    setExpandedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regionKey)) {
        newSet.delete(regionKey);
      } else {
        newSet.add(regionKey);
      }
      return newSet;
    });
  };

  const togglePrefecture = (prefKey: string) => {
    setSelectedPrefectures(prev => 
      prev.includes(prefKey) 
        ? prev.filter(p => p !== prefKey)
        : [...prev, prefKey]
    );
    // Clear cities when prefecture is deselected
    if (selectedPrefectures.includes(prefKey)) {
      setSelectedCities([]);
    }
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const getPrefectureName = (prefKey: string) => {
    const pref = PREFECTURES.find(p => p.key === prefKey);
    return isJapanese ? pref?.nameJa : pref?.name || prefKey;
  };

  const getRegionName = (regionKey: string) => {
    const region = REGIONS.find(r => r.key === regionKey);
    return isJapanese ? region?.nameJa : region?.name || regionKey;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('regions.pageTitle') || 'Search by Region'}
          </h1>
          <p className="text-lg text-gray-600">
            {t('regions.pageSubtitle') || 'Filter shops by region, prefecture, and city.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('regions.searchPlaceholder') || 'Search city or area name...'}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Left: Filters */}
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t('regions.filterByRegion') || 'Filter by Region'}
            </h2>

            <div className="space-y-4">
              {regionsWithShops.map((region) => {
                const prefectures = getPrefecturesInRegion(region.key);
                const availablePrefectures = prefectures.filter(pref => 
                  prefecturesWithShops[pref.key] > 0
                );
                const isExpanded = expandedRegions.has(region.key);

                if (availablePrefectures.length === 0) return null;

                return (
                  <div key={region.key} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleRegion(region.key)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900">
                        {getRegionName(region.key)}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2">
                        {availablePrefectures.map((pref) => {
                          const isSelected = selectedPrefectures.includes(pref.key);
                          const cities = citiesWithShops.byPrefecture[pref.key] 
                            ? Array.from(citiesWithShops.byPrefecture[pref.key])
                            : [];
                          const shopCount = prefecturesWithShops[pref.key] || 0;

                          return (
                            <div key={pref.key} className="ml-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePrefecture(pref.key)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className={`text-sm ${isSelected ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
                                  {getPrefectureName(pref.key)} ({shopCount})
                                </span>
                              </label>

                              {/* Cities under prefecture */}
                              {isSelected && cities.length > 0 && (
                                <div className="ml-6 mt-2 space-y-1">
                                  {cities.map((city) => {
                                    const cityKey = `${pref.key}_${city}`;
                                    const cityCount = citiesWithShops.counts[cityKey] || 0;
                                    const isCitySelected = selectedCities.includes(city);

                                    return (
                                      <label key={city} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isCitySelected}
                                          onChange={() => toggleCity(city)}
                                          className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className={`text-xs ${isCitySelected ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                                          {city} ({cityCount})
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Shop List */}
          <div className="md:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {t('regions.shopsFound', { count: filteredShops.length }) || `${filteredShops.length} shops found`}
              </h2>
              {(selectedPrefectures.length > 0 || selectedCities.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedPrefectures([]);
                    setSelectedCities([]);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {t('regions.clearFilters') || 'Clear filters'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('common.loading') || 'Loading shops...'}</p>
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">{t('shops.noShops') || 'No shops found.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop) => {
                  const imageUrl = shop.cover_photo_url || shop.image_url || shop.logo_url;
                  return (
                    <Link
                      key={shop.id}
                      href={`/browse?shop=${shop.id}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all group"
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
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2">{shop.name}</h3>
                        <p className="text-sm text-gray-600">
                          {shop.city || shop.prefecture || shop.address || 'Japan'}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <RegionsPageContent />
    </Suspense>
  );
}


// app/browse/components/RegionPrefectureCityFilter.tsx
// 3-level filter: Region → Prefecture → City

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { REGIONS, getPrefecturesInRegion, getRegionForPrefecture } from '@/lib/regions';
import { PREFECTURES } from '@/lib/prefectures';
import { useLocale, useTranslations } from 'next-intl';

interface RegionPrefectureCityFilterProps {
  selectedCategoryId: string | null;
  selectedPrefectures: string[];
  selectedCities: string[];
  onTogglePrefecture: (pref: string) => void;
  onToggleCity: (city: string) => void;
  shops: any[]; // Shops array to compute counts
  apiUrl?: string;
}

export function RegionPrefectureCityFilter({
  selectedCategoryId,
  selectedPrefectures,
  selectedCities,
  onTogglePrefecture,
  onToggleCity,
  shops,
  apiUrl,
}: RegionPrefectureCityFilterProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [prefectureShopCounts, setPrefectureShopCounts] = useState<Record<string, number>>({});
  const [cityShopCounts, setCityShopCounts] = useState<Record<string, number>>({});
  const [availableCities, setAvailableCities] = useState<Record<string, string[]>>({}); // prefecture -> cities[]
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Compute shop counts per prefecture and city from loaded shops
  useEffect(() => {
    if (!selectedCategoryId || shops.length === 0) {
      setPrefectureShopCounts({});
      setCityShopCounts({});
      setAvailableCities({});
      return;
    }

    const prefCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const citiesByPref: Record<string, Set<string>> = {};

    shops.forEach((shop) => {
      // Find matching prefecture
      let matchingPref: typeof PREFECTURES[0] | undefined;
      
      // Try to match by prefecture field
      if (shop.prefecture) {
        matchingPref = PREFECTURES.find(p => {
          const shopPref = shop.prefecture.toLowerCase();
          return shopPref.includes(p.name.toLowerCase()) || 
                 shopPref.includes(p.nameJa) ||
                 p.nameJa.includes(shopPref);
        });
      }
      
      // If no match, try to extract from address
      if (!matchingPref && shop.address) {
        const prefMatch = shop.address.match(/(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/);
        if (prefMatch) {
          matchingPref = PREFECTURES.find(p => p.nameJa === prefMatch[0]);
        }
      }

      if (matchingPref) {
        const prefKey = matchingPref.key;
        prefCounts[prefKey] = (prefCounts[prefKey] || 0) + 1;

        // Extract city - prefer normalized_city, then city, then extract from address
        let city = shop.normalized_city || shop.city;
        if (!city && shop.address) {
          // Extract city from address (look for patterns like "Chofu-shi", "調布市", etc.)
          const cityMatch = shop.address.match(/([^都道府県]+(?:市|区|町|村|郡))/);
          if (cityMatch) {
            city = cityMatch[0].trim();
          }
        }
        
        if (city) {
          // Use city as-is for the key (normalize for consistency)
          const cityKey = city.toLowerCase().replace(/\s+/g, '_').replace(/[市区町村郡]/g, '');
          cityCounts[cityKey] = (cityCounts[cityKey] || 0) + 1;
          
          if (!citiesByPref[prefKey]) {
            citiesByPref[prefKey] = new Set();
          }
          citiesByPref[prefKey].add(city);
        }
      }
    });

    setPrefectureShopCounts(prefCounts);
    setCityShopCounts(cityCounts);
    
    // Convert Sets to arrays
    const citiesByPrefArray: Record<string, string[]> = {};
    Object.keys(citiesByPref).forEach(prefKey => {
      citiesByPrefArray[prefKey] = Array.from(citiesByPref[prefKey]);
    });
    setAvailableCities(citiesByPrefArray);
  }, [shops, selectedCategoryId]);

  // Fetch prefecture counts from API when category is selected
  useEffect(() => {
    if (!selectedCategoryId || !apiUrl) return;

    setLoading(true);
    fetch(`${apiUrl}/shops/prefecture-counts?category=${selectedCategoryId}`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setPrefectureShopCounts(data);
        }
      })
      .catch(err => {
        console.error('Error fetching prefecture counts:', err);
        // Silently fail - we'll use shop counts from loaded shops instead
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCategoryId, apiUrl]);

  const toggleRegion = (regionKey: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(regionKey)) {
        next.delete(regionKey);
      } else {
        next.add(regionKey);
      }
      return next;
    });
  };

  // Get cities for a selected prefecture
  const getCitiesForPrefecture = (prefKey: string): string[] => {
    return availableCities[prefKey] || [];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {t('browse.filterByRegion') || 'Filter by Region'}
      </h2>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('browse.searchPlaceholder') || 'Search by city name or shop name...'}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          onChange={(e) => {
            // This will be handled by parent component's searchQuery state
            const value = e.target.value;
            // Dispatch event or use callback - for now, we'll let parent handle it
          }}
        />
      </div>

      {/* Region → Prefecture → City Tree */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {REGIONS.map((region) => {
          const prefectures = getPrefecturesInRegion(region.key);
          const isExpanded = expandedRegions.has(region.key);
          
          return (
            <div key={region.key} className="border border-gray-200 rounded-lg p-4">
              {/* Region Header */}
              <button
                onClick={() => toggleRegion(region.key)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {locale === 'ja' ? region.nameJa : region.name}
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Prefectures (shown when region is expanded) */}
              {isExpanded && (
                <div className="mt-4 space-y-2">
                  {prefectures.map((pref) => {
                    const shopCount = prefectureShopCounts[pref.key] || 0;
                    const isChecked = selectedPrefectures.includes(pref.key);
                    const isDisabled = shopCount === 0;
                    const cities = getCitiesForPrefecture(pref.key);

                    return (
                      <div key={pref.key} className="ml-4 space-y-2">
                        {/* Prefecture Checkbox */}
                        <label
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                            isDisabled
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                              : isChecked
                              ? 'border-pink-500 bg-pink-50 cursor-pointer'
                              : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => !isDisabled && onTogglePrefecture(pref.key)}
                            disabled={isDisabled}
                            className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500 disabled:opacity-50"
                          />
                          <span className="text-sm text-gray-700 flex-1">
                            {locale === 'ja' ? pref.nameJa : pref.name}
                          </span>
                          <span className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                            ({shopCount})
                          </span>
                        </label>

                        {/* Cities (shown when prefecture is checked) */}
                        {isChecked && cities.length > 0 && (
                          <div className="ml-6 space-y-1 mt-2">
                            {cities.map((city) => {
                              const cityKey = city.toLowerCase().replace(/\s+/g, '_');
                              const cityShopCount = cityShopCounts[cityKey] || 0;
                              const isCityChecked = selectedCities.includes(cityKey);

                              return (
                                <label
                                  key={cityKey}
                                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isCityChecked}
                                    onChange={() => onToggleCity(cityKey)}
                                    className="w-3.5 h-3.5 text-pink-600 rounded focus:ring-pink-500"
                                  />
                                  <span className="text-xs text-gray-600 flex-1">{city}</span>
                                  <span className="text-xs text-gray-400">({cityShopCount})</span>
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
  );
}


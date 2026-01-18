// app/components/landing/CategoryFilters.tsx
// Three filter dropdowns: Categories (with subcategories), Regions, Prefectures

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { REGIONS } from '@/lib/regions';
import { PREFECTURES } from '@/lib/prefectures';
import { MAIN_CATEGORIES, getSubcategories } from '@/lib/categories';
import { useLocale } from 'next-intl';

interface CategoryFiltersProps {
  categoryId: string;
  onFilterChange?: (filters: {
    subcategory: string;
    region: string;
    prefecture: string;
  }) => void;
}

export default function CategoryFilters({ categoryId, onFilterChange }: CategoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isJapanese = locale === 'ja';

  // Get initial values from URL params
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    searchParams.get('subcategory') || 'all'
  );
  const [selectedRegion, setSelectedRegion] = useState<string>(
    searchParams.get('region') || 'all'
  );
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>(
    searchParams.get('prefecture') || 'all'
  );

  // Get the current main category from categoryId
  const currentMainCategory = MAIN_CATEGORIES.find(c => c.id === categoryId);
  
  // Get ONLY subcategories of the current main category
  const availableSubcategories = useMemo(() => {
    if (!currentMainCategory) return [];
    const subcats = getSubcategories(currentMainCategory.id);
    console.log('DEBUG CategoryFilters: Main category:', currentMainCategory.id, 'Subcategories found:', subcats.map(s => s.name));
    return subcats;
  }, [currentMainCategory]);

  // Get prefectures based on selected region
  const availablePrefectures = useMemo(() => {
    if (selectedRegion === 'all') {
      return PREFECTURES;
    }
    const region = REGIONS.find(r => r.key === selectedRegion);
    if (!region) return [];
    return PREFECTURES.filter(p => region.prefectures.includes(p.key));
  }, [selectedRegion]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSubcategory !== 'all') params.set('subcategory', selectedSubcategory);
    if (selectedRegion !== 'all') params.set('region', selectedRegion);
    if (selectedPrefecture !== 'all') params.set('prefecture', selectedPrefecture);
    
    const newUrl = `/categories/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });

    // Notify parent component of filter changes
    if (onFilterChange) {
      onFilterChange({
        subcategory: selectedSubcategory,
        region: selectedRegion,
        prefecture: selectedPrefecture,
      });
    }
  }, [selectedSubcategory, selectedRegion, selectedPrefecture, categoryId, router, onFilterChange]);

  // Reset prefecture when region changes
  useEffect(() => {
    if (selectedRegion === 'all') {
      setSelectedPrefecture('all');
    } else {
      // Check if current prefecture is still valid for new region
      const region = REGIONS.find(r => r.key === selectedRegion);
      if (region && !region.prefectures.includes(selectedPrefecture)) {
        setSelectedPrefecture('all');
      }
    }
  }, [selectedRegion]);

  // Get category name for display
  const getCategoryName = (cat: typeof MAIN_CATEGORIES[0]) => {
    return isJapanese ? cat.nameJa : cat.name;
  };

  return (
    <div className="mb-8">
      <p className="text-white text-sm mb-4 drop-shadow-md">
        Hand-picked shops recommended by Yo and Yo.
      </p>
      
      <div className="flex flex-wrap gap-3">
        {/* Subcategory Dropdown - Only shows subcategories of current main category */}
        <div className="relative flex-1 min-w-[200px]">
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full appearance-none bg-gray-700 text-gray-300 px-4 py-2.5 pr-8 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
          >
            <option value="all">
              {isJapanese ? 'すべてのサブカテゴリー' : 'All Subcategories'}
            </option>
            {availableSubcategories.length > 0 ? (
              availableSubcategories.map(subcat => (
                <option key={subcat.id} value={subcat.id}>
                  {getCategoryName(subcat)}
                </option>
              ))
            ) : (
              // If no subcategories, allow selecting the main category itself
              currentMainCategory && (
                <option value={currentMainCategory.id}>
                  {getCategoryName(currentMainCategory)}
                </option>
              )
            )}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* All Regions Dropdown */}
        <div className="relative flex-1 min-w-[200px]">
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedPrefecture('all'); // Reset prefecture when region changes
            }}
            className="w-full appearance-none bg-gray-700 text-gray-300 px-4 py-2.5 pr-8 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
          >
            <option value="all">All Regions</option>
            {REGIONS.map(region => (
              <option key={region.key} value={region.key}>
                {isJapanese ? region.nameJa : region.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* All Prefectures Dropdown */}
        <div className="relative flex-1 min-w-[200px]">
          <select
            value={selectedPrefecture}
            onChange={(e) => setSelectedPrefecture(e.target.value)}
            disabled={selectedRegion === 'all' && availablePrefectures.length === PREFECTURES.length}
            className="w-full appearance-none bg-gray-700 text-gray-300 px-4 py-2.5 pr-8 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All Prefectures</option>
            {availablePrefectures.map(pref => (
              <option key={pref.key} value={pref.key}>
                {isJapanese ? pref.nameJa : pref.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}


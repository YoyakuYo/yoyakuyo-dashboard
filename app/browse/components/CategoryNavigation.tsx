// app/browse/components/CategoryNavigation.tsx
// Category-based navigation component for browse page

"use client";
import React from 'react';
import type { CategoryTree } from '@/lib/browse/shopBrowseData';

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

interface CategoryNavigationProps {
  categoryTree: CategoryTree;
  categories: Category[];
  selectedCategoryId: string | null;
  selectedPrefecture: string | null;
  selectedCity: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectPrefecture: (pref: string | null) => void;
  onSelectCity: (city: string | null) => void;
  getCategoryName: (name: string) => string;
  getPrefectureName: (key: string) => string;
  getCityName: (key: string) => string;
  t: any;
}

export function CategoryNavigation({
  categoryTree,
  categories,
  selectedCategoryId,
  selectedPrefecture,
  selectedCity,
  onSelectCategory,
  onSelectPrefecture,
  onSelectCity,
  getCategoryName,
  getPrefectureName,
  getCityName,
  t,
}: CategoryNavigationProps) {
  // Show all categories, even if they have 0 shops (don't filter by categoryTree)
  const sortedCategories = categories
    .sort((a, b) => {
      const nameA = getCategoryName(a.name);
      const nameB = getCategoryName(b.name);
      return nameA.localeCompare(nameB);
    });

  const selectedCategory = selectedCategoryId ? categoryTree[selectedCategoryId] : null;
  const selectedPrefectureData = selectedCategory && selectedPrefecture
    ? selectedCategory.prefectures[selectedPrefecture]
    : null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{t('browse.category')}</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedCategories.map((category) => {
          const categoryData = categoryTree[category.id];
          const shopCount = categoryData?.shopCount || 0;
          const isSelected = selectedCategoryId === category.id;
          return (
            <div key={category.id}>
              <button
                onClick={() => {
                  onSelectCategory(isSelected ? null : category.id);
                  onSelectPrefecture(null);
                  onSelectCity(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{getCategoryName(category.name)}</span>
                  <span className="text-xs text-gray-500">({shopCount})</span>
                </div>
              </button>
              {isSelected && selectedCategory && (
                <>
                  {selectedPrefecture ? (
                    <div className="mt-2 ml-4 space-y-1">
                      {selectedPrefectureData && Object.keys(selectedPrefectureData.cities)
                        .sort((a, b) => {
                          const nameA = getCityName(a);
                          const nameB = getCityName(b);
                          return nameA.localeCompare(nameB, 'ja');
                        })
                        .map((cityKey) => {
                          const city = selectedPrefectureData.cities[cityKey];
                          const isCitySelected = selectedCity === cityKey;
                          return (
                            <button
                              key={cityKey}
                              onClick={() => onSelectCity(isCitySelected ? null : cityKey)}
                              className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                                isCitySelected
                                  ? 'bg-blue-50 text-blue-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{getCityName(cityKey)}</span>
                                <span className="text-xs text-gray-500">({city.shopCount})</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="mt-2 ml-4 space-y-1">
                      {Object.keys(selectedCategory.prefectures)
                        .sort((a, b) => {
                          const nameA = getPrefectureName(a);
                          const nameB = getPrefectureName(b);
                          return nameA.localeCompare(nameB, 'ja');
                        })
                        .map((prefKey) => {
                          const prefecture = selectedCategory.prefectures[prefKey];
                          const isPrefSelected = selectedPrefecture === prefKey;
                          return (
                            <button
                              key={prefKey}
                              onClick={() => {
                                onSelectPrefecture(isPrefSelected ? null : prefKey);
                                onSelectCity(null);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                                isPrefSelected
                                  ? 'bg-blue-50 text-blue-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{getPrefectureName(prefKey)}</span>
                                <span className="text-xs text-gray-500">({prefecture.shopCount})</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


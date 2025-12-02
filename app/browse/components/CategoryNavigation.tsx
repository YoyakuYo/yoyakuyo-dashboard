// app/browse/components/CategoryNavigation.tsx
// Category-based navigation component for browse page
// Supports hierarchical categories with subcategories and checkbox-based location selection

"use client";
import React from 'react';
import type { CategoryTree } from '@/lib/browse/shopBrowseData';
import { CATEGORIES, getSubcategories, hasSubcategories } from '@/lib/categories';

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

interface CategoryNavigationProps {
  categoryTree: CategoryTree;
  categories: Category[];
  selectedCategoryId: string | null;
  selectedPrefectures: string[]; // Changed to array for multiple selection
  selectedCities: string[]; // Changed to array for multiple selection
  onSelectCategory: (id: string | null) => void;
  onTogglePrefecture: (pref: string) => void; // Changed to toggle for checkbox
  onToggleCity: (city: string) => void; // Changed to toggle for checkbox
  getCategoryName: (name: string) => string;
  getPrefectureName: (key: string) => string;
  getCityName: (key: string) => string;
  t: any;
}

export function CategoryNavigation({
  categoryTree,
  categories,
  selectedCategoryId,
  selectedPrefectures,
  selectedCities,
  onSelectCategory,
  onTogglePrefecture,
  onToggleCity,
  getCategoryName,
  getPrefectureName,
  getCityName,
  t,
}: CategoryNavigationProps) {
  // Filter to show only top-level categories (not subcategories)
  // Match by database name since database uses UUIDs, not our string IDs
  const topLevelCategories = categories.filter(cat => {
    const categoryDef = CATEGORIES.find(c => c.dbName === cat.name);
    // Show main categories (not subcategories) OR categories that don't match our definitions
    return !categoryDef || !categoryDef.isSubcategory;
  });

  const sortedCategories = topLevelCategories
    .sort((a, b) => {
      const nameA = getCategoryName(a.name);
      const nameB = getCategoryName(b.name);
      return nameA.localeCompare(nameB);
    });

  const selectedCategory = selectedCategoryId ? categoryTree[selectedCategoryId] : null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{t('browse.category')}</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedCategories.map((category) => {
          const categoryData = categoryTree[category.id];
          const shopCount = categoryData?.shopCount || 0;
          const isSelected = selectedCategoryId === category.id;
          // Match by database name since database uses UUIDs
          const categoryDef = CATEGORIES.find(c => c.dbName === category.name);
          // Get subcategories that belong to this main category
          const subcategories = categoryDef ? getSubcategories(categoryDef.id) : [];
          const hasSubs = categoryDef ? hasSubcategories(categoryDef.id) : false;
          
          // Find subcategories in the database categories list
          const dbSubcategories = subcategories
            .map(subcat => categories.find(dbCat => dbCat.name === subcat.dbName))
            .filter(Boolean) as Category[];

          return (
            <div key={category.id}>
              <button
                onClick={() => {
                  onSelectCategory(isSelected ? null : category.id);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getCategoryName(category.name)}</span>
                    {hasSubs && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                        {subcategories.length} {t('browse.subcategories') || 'subcategories'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">({shopCount})</span>
                </div>
              </button>
              
              {/* Show subcategories when parent is selected */}
              {isSelected && hasSubs && dbSubcategories.length > 0 && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-blue-200 pl-3">
                  {dbSubcategories.map((subcatCategory) => {
                    const subcatData = categoryTree[subcatCategory.id];
                    const subcatShopCount = subcatData?.shopCount || 0;
                    const subcatDef = CATEGORIES.find(c => c.dbName === subcatCategory.name);
                    
                    return (
                      <button
                        key={subcatCategory.id}
                        onClick={() => {
                          onSelectCategory(subcatCategory.id);
                        }}
                        className="w-full text-left px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">└</span>
                          <span>{getCategoryName(subcatCategory.name)}</span>
                        </div>
                        <span className="text-xs text-gray-400">({subcatShopCount})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Show location checkboxes when category is selected */}
              {isSelected && selectedCategory && (
                <div className="mt-3 ml-4 space-y-3">
                  {/* Prefectures with checkboxes */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {t('browse.prefecture') || 'Prefecture'}
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {Object.keys(selectedCategory.prefectures)
                        .sort((a, b) => {
                          const nameA = getPrefectureName(a);
                          const nameB = getPrefectureName(b);
                          return nameA.localeCompare(nameB, 'ja');
                        })
                        .map((prefKey) => {
                          const prefecture = selectedCategory.prefectures[prefKey];
                          const isPrefChecked = selectedPrefectures.includes(prefKey);
                          const prefCities = prefecture.cities || {};
                          const hasCheckedCities = Object.keys(prefCities).some(cityKey => 
                            selectedCities.includes(cityKey)
                          );
                          
                          return (
                            <div key={prefKey} className="space-y-1">
                              <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isPrefChecked}
                                  onChange={() => onTogglePrefecture(prefKey)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div className="flex items-center justify-between flex-1">
                                  <span className="text-sm text-gray-700">
                                    {getPrefectureName(prefKey)}
                                  </span>
                                  <span className="text-xs text-gray-500">({prefecture.shopCount})</span>
                                </div>
                              </label>
                              
                              {/* Show cities when prefecture is checked */}
                              {isPrefChecked && Object.keys(prefCities).length > 0 && (
                                <div className="ml-6 space-y-1">
                                  {Object.keys(prefCities)
                                    .sort((a, b) => {
                                      const nameA = getCityName(a);
                                      const nameB = getCityName(b);
                                      return nameA.localeCompare(nameB, 'ja');
                                    })
                                    .map((cityKey) => {
                                      const city = prefCities[cityKey];
                                      const isCityChecked = selectedCities.includes(cityKey);
                                      
                                      return (
                                        <label
                                          key={cityKey}
                                          className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-gray-50 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isCityChecked}
                                            onChange={() => onToggleCity(cityKey)}
                                            className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                                          />
                                          <div className="flex items-center justify-between flex-1">
                                            <span className="text-xs text-gray-600">
                                              {getCityName(cityKey)}
                                            </span>
                                            <span className="text-xs text-gray-400">({city.shopCount})</span>
                                          </div>
                                        </label>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


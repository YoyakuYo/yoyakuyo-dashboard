// app/browse/components/AreaNavigation.tsx
// Area-based navigation component for browse page
// Uses checkbox-based selection for multiple location selection

"use client";
import React from 'react';
import type { AreaTree } from '@/lib/browse/shopBrowseData';

interface AreaNavigationProps {
  areaTree: AreaTree;
  selectedPrefectures: string[]; // Changed to array for multiple selection
  selectedCities: string[]; // Changed to array for multiple selection
  onTogglePrefecture: (pref: string) => void; // Changed to toggle for checkbox
  onToggleCity: (city: string) => void; // Changed to toggle for checkbox
  getPrefectureName: (key: string) => string;
  getCityName: (key: string) => string;
  t: any;
}

export function AreaNavigation({
  areaTree,
  selectedPrefectures,
  selectedCities,
  onTogglePrefecture,
  onToggleCity,
  getPrefectureName,
  getCityName,
  t,
}: AreaNavigationProps) {
  const sortedPrefectures = Object.keys(areaTree).sort((a, b) => {
    const nameA = getPrefectureName(a);
    const nameB = getPrefectureName(b);
    return nameA.localeCompare(nameB, 'ja');
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{t('browse.prefecture')}</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedPrefectures.map((prefKey) => {
          const prefecture = areaTree[prefKey];
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
  );
}


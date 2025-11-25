// app/browse/components/AreaNavigation.tsx
// Area-based navigation component for browse page

"use client";
import React from 'react';
import type { AreaTree } from '@/lib/browse/shopBrowseData';

interface AreaNavigationProps {
  areaTree: AreaTree;
  selectedPrefecture: string | null;
  selectedCity: string | null;
  onSelectPrefecture: (pref: string | null) => void;
  onSelectCity: (city: string | null) => void;
  getPrefectureName: (key: string) => string;
  getCityName: (key: string) => string;
  t: any;
}

export function AreaNavigation({
  areaTree,
  selectedPrefecture,
  selectedCity,
  onSelectPrefecture,
  onSelectCity,
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
          const isSelected = selectedPrefecture === prefKey;
          return (
            <div key={prefKey}>
              <button
                onClick={() => {
                  onSelectPrefecture(isSelected ? null : prefKey);
                  onSelectCity(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{getPrefectureName(prefKey)}</span>
                  <span className="text-xs text-gray-500">({prefecture.shopCount})</span>
                </div>
              </button>
              {isSelected && (
                <div className="mt-2 ml-4 space-y-1">
                  {Object.keys(prefecture.cities)
                    .sort((a, b) => {
                      const nameA = getCityName(a);
                      const nameB = getCityName(b);
                      return nameA.localeCompare(nameB, 'ja');
                    })
                    .map((cityKey) => {
                      const city = prefecture.cities[cityKey];
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


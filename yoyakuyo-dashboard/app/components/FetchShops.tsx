"use client";
import React, { useState } from 'react';
import { apiUrl } from '@/lib/apiClient';

interface OSMShop {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  zip_code: string | null;
  phone: null;
  email: null;
  website: null;
  osm_id: string;
  osm_type: string;
  isDuplicate: boolean;
  existingShop?: any;
  duplicateReason?: string;
  category_id: string | null;
  category_name: string;
}

interface FetchShopsProps {
  onShopImported?: () => void;
}

export default function FetchShops({ onShopImported }: FetchShopsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OSMShop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedShops, setSelectedShops] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !location.trim()) {
      setError('Please enter a search query or location');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedShops(new Set());

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (location.trim()) params.append('location', location.trim());
      params.append('limit', '20');

      const res = await fetch(`${apiUrl}/shops/search/osm?${params.toString()}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to search');
      }

      const data = await res.json();
      setResults(data);
      
      if (data.length === 0) {
        setError('No shops found. Try a different search term.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search for shops');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedShops.size === 0) {
      setError('Please select at least one shop to import');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const shopsToImport = results.filter(shop => selectedShops.has(shop.osm_id) && !shop.isDuplicate);
      
      if (shopsToImport.length === 0) {
        setError('No valid shops selected (all are duplicates)');
        setImporting(false);
        return;
      }
      
      // Import shops one by one
      let successCount = 0;
      let failCount = 0;
      
      for (const shop of shopsToImport) {
        try {
          const res = await fetch(`${apiUrl}/shops`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: shop.name,
              address: shop.address,
              latitude: shop.latitude,
              longitude: shop.longitude,
              city: shop.city,
              country: shop.country,
              zip_code: shop.zip_code,
              phone: shop.phone,
              email: shop.email || '',
              website: shop.website,
              category_id: shop.category_id,
              claim_status: 'unclaimed',
              osm_id: shop.osm_id,
            }),
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }
      
      // Clear selections and results
      setSelectedShops(new Set());
      setResults([]);
      setSearchQuery('');
      setLocation('');
      
      if (onShopImported) {
        onShopImported();
      }
      
      if (failCount > 0) {
        alert(`Imported ${successCount} shop(s) successfully. ${failCount} failed.`);
      } else {
        alert(`Successfully imported ${successCount} shop(s)!`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import shops');
    } finally {
      setImporting(false);
    }
  };

  const toggleSelection = (osmId: string) => {
    const newSelected = new Set(selectedShops);
    if (newSelected.has(osmId)) {
      newSelected.delete(osmId);
    } else {
      newSelected.add(osmId);
    }
    setSelectedShops(newSelected);
  };

  const selectAll = () => {
    const validShops = results.filter(s => !s.isDuplicate);
    setSelectedShops(new Set(validShops.map(s => s.osm_id)));
  };

  const deselectAll = () => {
    setSelectedShops(new Set());
  };

  const validShopsCount = results.filter(s => !s.isDuplicate).length;
  const selectedValidCount = results.filter(s => selectedShops.has(s.osm_id) && !s.isDuplicate).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Fetch Shops from OpenStreetMap</h2>
      
      <form onSubmit={handleSearch} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query (e.g., "hair salon Tokyo", "barber shop Shibuya", "歯科 新宿")
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="hair salon, barber shop, spa, 美容室, 歯科..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (optional, e.g., "Tokyo", "Shibuya", "Osaka")
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Tokyo, Shibuya, Shinjuku, Osaka, Kyoto..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search Shops'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Found {results.length} result(s) • {validShopsCount} available to import
                {results.length - validShopsCount > 0 && (
                  <span className="text-orange-600"> • {results.length - validShopsCount} duplicates</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {validShopsCount > 0 && (
                <>
                  <button
                    onClick={selectAll}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Deselect All
                  </button>
                </>
              )}
              <button
                onClick={handleImport}
                disabled={importing || selectedValidCount === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importing...' : `Import ${selectedValidCount} Shop(s)`}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((shop) => {
              const isSelected = selectedShops.has(shop.osm_id);
              const isDuplicate = shop.isDuplicate;
              
              return (
                <div
                  key={shop.osm_id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isDuplicate
                      ? 'border-orange-300 bg-orange-50 opacity-75'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => !isDuplicate && toggleSelection(shop.osm_id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isDuplicate && toggleSelection(shop.osm_id)}
                      disabled={isDuplicate}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                        {shop.category_name && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                            {shop.category_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
                      {shop.city && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {shop.city}{shop.country ? `, ${shop.country}` : ''}
                        </p>
                      )}
                      {isDuplicate && (
                        <p className="text-xs text-orange-600 mt-2 font-medium">
                          ⚠️ Duplicate: {shop.duplicateReason || 'Already exists in database'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


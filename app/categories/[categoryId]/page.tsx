// app/categories/[categoryId]/page.tsx
// Category landing page with strict discovery flow - NO shops until filters are selected

"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MAIN_CATEGORIES, SUBCATEGORIES, getSubcategories } from '@/lib/categories';
import CategoryFilters from '@/app/components/landing/CategoryFilters';
import CategorySellingSection from '@/app/components/landing/CategorySellingSection';
import { apiUrl } from '@/lib/apiClient';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  category_id?: string;
  subcategory?: string;
  claim_status?: string;
  is_verified?: boolean; // Added is_verified to Shop interface
  [key: string]: any;
}

interface City {
  id: string;
  name: string;
  slug: string;
  prefecture_name: string;
}

function CategoryPageContent() {
  console.log('CategoryPageContent: apiUrl is', apiUrl); // DIAGNOSTIC LOG
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const categoryId = params.categoryId as string;

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [cities, setCities] = useState<City[]>([]); // New state for cities
  const [verifiedStatus, setVerifiedStatus] = useState<'all' | 'verified'>('all'); // New state for verified status

  const [filters, setFilters] = useState({
    subcategory: 'all',
    region: 'all',
    prefecture: 'all',
    city: 'all', // New filter for city
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch cities when prefecture changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!apiUrl || filters.prefecture === 'all') {
        setCities([]);
        setFilters(prev => ({ ...prev, city: 'all' })); // Reset city filter if prefecture is 'all'
        return;
      }

      try {
        const url = `${apiUrl}/cities?prefecture_name=${filters.prefecture}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setCities(data);
          // If the previously selected city is not in the new list, reset it
          if (!data.some((city: City) => city.id === filters.city)) {
            setFilters(prev => ({ ...prev, city: 'all' }));
          }
        } else {
          console.error('❌ Failed to fetch cities:', res.status, res.statusText);
          setCities([]);
          setFilters(prev => ({ ...prev, city: 'all' }));
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
        setFilters(prev => ({ ...prev, city: 'all' }));
      }
    };
    fetchCities();
  }, [filters.prefecture, apiUrl]);


  // Get category
  const category = MAIN_CATEGORIES.find(c => c.id === categoryId);

  // Check if any filter or search query is active
  const hasActiveFilter = useMemo(() => {
    return filters.subcategory !== 'all' || 
           filters.region !== 'all' || 
           filters.prefecture !== 'all' ||
           filters.city !== 'all' || // New: Check for city filter
           verifiedStatus !== 'all' || // New: Check for verified status
           debouncedSearchQuery.trim() !== '';
  }, [filters, verifiedStatus, debouncedSearchQuery]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: { subcategory?: string; region?: string; prefecture?: string; city?: string; is_verified?: 'all' | 'verified' }) => {
    setFilters(prev => ({ 
      ...prev,
      ...newFilters,
    }));
    if (newFilters.is_verified !== undefined) {
      setVerifiedStatus(newFilters.is_verified);
    }
    setCurrentPage(1);
    setShops([]);
  }, []);

  // Fetch shops ONLY if filters or search query are active
  const fetchShops = useCallback(async (page: number = 1, append: boolean = false) => {
    // Do not fetch if no filters are selected and no search query is active
    if (!hasActiveFilter) {
      setShops([]);
      setLoading(false);
      return;
    }

    if (!apiUrl || !category) return;

    try {
      if (!append) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '30');
      
      if (debouncedSearchQuery.trim()) {
        params.set('search', debouncedSearchQuery.trim());
      }
      
      // Get category UUID from database
      const categoryRes = await fetch(`${apiUrl}/categories`);
      if (categoryRes.ok) {
        const categories = await categoryRes.json();
        
        // If subcategory is selected, use subcategory UUID, otherwise use main category UUID
        let categoryUuidSet = false;
        if (filters.subcategory !== 'all') {
          // Legacy ID mapping for backward compatibility
          const legacyIdMap: Record<string, string> = {
            'spa_massage': 'spa', // Map old combined ID to new "Spa" subcategory
            'onsen_ryokan': 'ryokan_onsen', // Map old combined ID to new "Ryokan Onsen" subcategory
          };
          const mappedId = legacyIdMap[filters.subcategory] || filters.subcategory;
          
          const subcategory = SUBCATEGORIES.find(c => c.id === mappedId) || 
                             MAIN_CATEGORIES.find(c => c.id === mappedId);
          if (subcategory) {
            const dbSubcategory = categories.find((c: any) => c.name === subcategory.dbName);
            if (dbSubcategory) {
              params.set('category', dbSubcategory.id); // Use subcategory UUID
              categoryUuidSet = true;
              console.log(`✅ Using subcategory UUID: ${dbSubcategory.id} for "${subcategory.dbName}"`);
            } else {
              console.warn(`⚠️ Subcategory "${subcategory.dbName}" not found in database, falling back to main category`);
              console.log('Available categories:', categories.map((c: any) => c.name));
            }
          } else {
            console.warn(`⚠️ Subcategory ID "${filters.subcategory}" (mapped: "${mappedId}") not found, falling back to main category`);
          }
        }
        
        // Fallback to main category if subcategory lookup failed or no subcategory selected
        if (!categoryUuidSet) {
          const dbCategory = categories.find((c: any) => c.name === category.dbName);
          if (dbCategory) {
            params.set('category', dbCategory.id); // Use main category UUID
            console.log(`✅ Using main category UUID: ${dbCategory.id} for "${category.dbName}"`);
          } else {
            console.error(`❌ Main category not found in database: "${category.dbName}"`);
            console.log('Available categories:', categories.map((c: any) => c.name));
          }
        }
      } else {
        console.error('❌ Failed to fetch categories:', categoryRes.status, categoryRes.statusText);
      }

      // Add prefecture filter if selected
      if (filters.prefecture !== 'all') {
        params.set('prefecture', filters.prefecture);
      }

      // Add city filter if selected
      if (filters.city !== 'all') {
        params.set('city_id', filters.city); // Send city_id to backend
      }

      // Add verified status filter
      if (verifiedStatus === 'verified') {
        params.set('is_verified', 'true');
      }
      
      const url = `${apiUrl}/shops?${params.toString()}`;
      console.log(`🔍 Fetching shops from: ${url}`);
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const shopsArray = data.shops || [];
        console.log(`📦 Received ${shopsArray.length} shops from API (total: ${data.total || 'unknown'})`);
        
        // Filter by region and prefecture (client-side, as they're not in DB)
        let filteredShops = shopsArray;
        
        // Import utilities for prefecture extraction
        const { extractPrefecture } = await import('@/lib/browse/shopBrowseData');
        const { PREFECTURES } = await import('@/lib/prefectures');
        
        // Helper function to get prefecture key from shop
        const getShopPrefectureKey = (shop: Shop): string | null => {
          // First, try to use shop.prefecture field if it exists
          if (shop.prefecture) {
            const pref = PREFECTURES.find((p: any) => 
              p.name.toLowerCase() === shop.prefecture?.toLowerCase() ||
              p.nameJa === shop.prefecture ||
              p.key === shop.prefecture?.toLowerCase() ||
              shop.prefecture?.includes(p.nameJa) ||
              shop.prefecture?.toLowerCase().includes(p.name.toLowerCase())
            );
            if (pref) return pref.key;
          }
          
          // Fallback: extract from address using extractPrefecture function
          // Ensure address exists before calling extractPrefecture
          if (shop.address) {
            // Create a shop object with required address field for extractPrefecture
            const shopWithAddress = {
              ...shop,
              address: shop.address,
            };
            const extractedKey = extractPrefecture(shopWithAddress);
            return extractedKey !== 'unknown' ? extractedKey : null;
          }
          return null;
        };
        
        if (filters.region !== 'all') {
          const { REGIONS } = await import('@/lib/regions');
          const region = REGIONS.find(r => r.key === filters.region);
          if (region) {
            const regionPrefectureKeys = region.prefectures;
            filteredShops = shopsArray.filter((shop: Shop) => {
              const shopPrefectureKey = getShopPrefectureKey(shop);
              if (!shopPrefectureKey) return false;
              return regionPrefectureKeys.includes(shopPrefectureKey);
            });
          }
        }
        
        // Further filter by specific prefecture if selected
        if (filters.prefecture !== 'all') {
          filteredShops = filteredShops.filter((shop: Shop) => {
            const shopPrefectureKey = getShopPrefectureKey(shop);
            if (!shopPrefectureKey) return false;
            return shopPrefectureKey === filters.prefecture;
          });
        }

        // Filter out hidden shops
        const visibleShops = filteredShops.filter((shop: Shop) => 
          !shop.claim_status || shop.claim_status !== 'hidden'
        );

        console.log(`✅ Filtered to ${visibleShops.length} visible shops (from ${filteredShops.length} after region/prefecture filter, from ${shopsArray.length} from API)`);

        if (append) {
          setShops(prev => [...prev, ...visibleShops]);
        } else {
          setShops(visibleShops);
        }

        // Calculate hasMore based on actual results
        const totalPages = data.totalPages || Math.ceil((data.total || visibleShops.length) / 30);
        setHasMore(visibleShops.length === 30 && page < totalPages);
        setCurrentPage(page);
      } else {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('❌ Failed to fetch shops:', res.status, res.statusText, errorText);
        if (!append) setShops([]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      if (!append) setShops([]);
    } finally {
      setLoading(false);
    }
  }, [filters, category, apiUrl, debouncedSearchQuery, verifiedStatus]); // Added city and verifiedStatus to deps

  // Fetch shops immediately when filters change - CRITICAL: No delay, no placeholder blocking
  useEffect(() => {
    // Reset state when filters change
    setCurrentPage(1);
    setHasMore(true);
    
    if (hasActiveFilter) {
      // Immediately fetch shops when any filter is active
      fetchShops(1, false);
    } else {
      setShops([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.subcategory, filters.region, filters.prefecture, filters.city, verifiedStatus, hasActiveFilter, debouncedSearchQuery]); // Watch filter changes, city, verifiedStatus and hasActiveFilter

  // Load more shops
  const loadMoreShops = useCallback(() => {
    if (!loading && hasMore && hasActiveFilter) {
      fetchShops(currentPage + 1, true);
    }
  }, [loading, hasMore, currentPage, hasActiveFilter, fetchShops]);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Category not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <CategoryFilters 
          categoryId={categoryId}
          onFilterChange={handleFilterChange}
        />

        {/* City Filter */}
        {filters.prefecture !== 'all' && (
          <div className="mt-4">
            <label htmlFor="city-filter" className="block text-sm font-medium text-gray-300 mb-2">
              {locale === 'ja' ? '都市を選択' : 'Select City'}
            </label>
            <div className="relative">
              <select
                id="city-filter"
                name="city-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-japanese-red focus:border-japanese-red sm:text-sm rounded-md bg-gray-700 text-white border-gray-600"
                value={filters.city}
                onChange={(e) => handleFilterChange({ city: e.target.value })}
              >
                <option value="all">{locale === 'ja' ? 'すべての都市' : 'All Cities'}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Verified Shops Filter */}
        <div className="mt-4">
          <label htmlFor="verified-filter" className="block text-sm font-medium text-gray-300 mb-2">
            {locale === 'ja' ? 'ショップステータス' : 'Shop Status'}
          </label>
          <div className="relative">
            <select
              id="verified-filter"
              name="verified-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-japanese-red focus:border-japanese-red sm:text-sm rounded-md bg-gray-700 text-white border-gray-600"
              value={verifiedStatus}
              onChange={(e) => handleFilterChange({ is_verified: e.target.value as 'all' | 'verified' })}
            >
              <option value="all">{locale === 'ja' ? 'すべてのショップ' : 'All Shops'}</option>
              <option value="verified">{locale === 'ja' ? '認証済みショップのみ' : 'Verified Shops Only'}</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-8 mb-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'ja' ? 'ショップ名または地域で検索' : 'Search by shop name or location...'}
              className="w-full px-4 py-3 bg-gray-900 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-japanese-red focus:border-transparent outline-none text-lg"
            />
          </div>
        </div>

        {/* Category Selling Section - Only show when NO filters are active AND no search query is active */}
        {!hasActiveFilter && <CategorySellingSection categoryId={categoryId} />}

        {/* Shop Results - Show immediately when filters are active */}
        {hasActiveFilter && (
          <div className="mt-12">
            {loading && shops.length === 0 ? (
              <div className="text-center text-white py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4">Loading shops...</p>
              </div>
            ) : shops.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">
                  {shops.length} {locale === 'ja' ? '店舗が見つかりました' : 'shops found'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shops.map((shop) => (
                    <Link
                      key={shop.id}
                      href={`/shops/${shop.id}`}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {shop.image_url && (
                        <div className="w-full h-48 overflow-hidden bg-gray-100">
                          <img
                            src={shop.image_url}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{shop.name}</h3>
                        {shop.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {shop.description.length > 100 ? shop.description.substring(0, 100) + '...' : shop.description}
                          </p>
                        )}
                        <p className="text-gray-500 text-sm">
                          {shop.prefecture && shop.city ? `${shop.prefecture}, ${shop.city}` : shop.address}
                        </p>
                        {shop.is_verified && (
                            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {locale === 'ja' ? '認証済み' : 'Verified'}
                            </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMoreShops}
                      disabled={loading}
                      className="px-6 py-3 bg-japanese-red hover:bg-japanese-red/90 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-white py-12">
                <p className="text-lg">
                  {locale === 'ja' 
                    ? '選択されたフィルターに一致する店舗は見つかりませんでした。' 
                    : 'No shops found for this selection'}
                </p>
                <p className="text-sm text-white/70 mt-2">
                  {locale === 'ja'
                    ? 'フィルターを調整してお試しください。'
                    : 'Try adjusting your filters.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Message when no filters selected */}
        {!hasActiveFilter && (
          <div className="mt-12 text-center text-white/80 py-12">
            <p className="text-lg mb-2">
              {locale === 'ja' 
                ? 'フィルターを選択して店舗を検索してください' 
                : 'Select filters above to discover shops'}
            </p>
            <p className="text-sm text-white/60">
              {locale === 'ja'
                ? 'カテゴリー、地域、または都道府県を選択してください'
                : 'Choose a category, region, or prefecture to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}

// app/browse/page.tsx
// Redesigned browse page with "By Area" and "By Category" navigation modes

"use client";
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import {
  buildCategoryTree,
  filterShopsBySearch,
  type Shop,
  type CategoryTree,
} from '@/lib/browse/shopBrowseData';
import { CATEGORIES } from '@/lib/categories';
import { CategoryNavigation } from './components/CategoryNavigation';
import { ShopCard } from './components/ShopCard';
import { useBrowseAIContext } from '@/app/components/BrowseAIContext';

// Force dynamic rendering to avoid prerendering errors
export const dynamic = 'force-dynamic';

// Component to update browse context
function UpdateBrowseContext({
  shops,
  selectedPrefectures,
  selectedCities,
  selectedCategoryId,
  searchQuery,
  setBrowseContext,
}: {
  shops: Shop[];
  selectedPrefectures: string[];
  selectedCities: string[];
  selectedCategoryId: string | null;
  searchQuery: string;
  setBrowseContext: (context: any) => void;
}) {
  useEffect(() => {
    setBrowseContext({
      shops,
      selectedPrefecture: selectedPrefectures.length > 0 ? selectedPrefectures[0] : null, // For backward compatibility
      selectedCity: selectedCities.length > 0 ? selectedCities[0] : null, // For backward compatibility
      selectedPrefectures, // New array format
      selectedCities, // New array format
      selectedCategoryId,
      searchQuery,
    });
  }, [shops, selectedPrefectures, selectedCities, selectedCategoryId, searchQuery, setBrowseContext]);
  return null;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const browseContext = useBrowseAIContext(); // Get context to share with global AI bubble
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalShops, setTotalShops] = useState(0);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  // Navigation state - Changed to arrays for multiple selection
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>(() => {
    const pref = searchParams.get('prefecture');
    return pref ? pref.split(',').filter(Boolean) : [];
  });
  const [selectedCities, setSelectedCities] = useState<string[]>(() => {
    const city = searchParams.get('city');
    return city ? city.split(',').filter(Boolean) : [];
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  
  // Toggle functions for checkbox-based selection
  const togglePrefecture = (pref: string) => {
    setSelectedPrefectures(prev => 
      prev.includes(pref) 
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };
  
  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debug: Log API URL
  useEffect(() => {
    console.log('🔧 API URL configured:', apiUrl || '❌ NOT SET - Check NEXT_PUBLIC_API_URL env var');
  }, []);

  // Use local categories instead of fetching from API
  // This ensures all categories defined in lib/categories.ts are available
  useEffect(() => {
    // Convert CATEGORIES to the format expected by the component
    const formattedCategories = CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.nameJa, // Use Japanese name as description
    }));
    console.log('✅ Using local categories:', formattedCategories.length, 'items');
    setCategories(formattedCategories);
  }, []);


  // Fetch category stats (shop counts per category) from backend
  const fetchCategoryStats = useCallback(async () => {
    if (!apiUrl) return;
    
    try {
      const res = await fetch(`${apiUrl}/categories/stats`);
      if (res.ok) {
        const stats = await res.json();
        setCategoryStats(stats);
        console.log('✅ Category stats loaded:', stats);
      }
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  }, [apiUrl]);

  // Fetch shops with pagination
  const fetchShops = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!apiUrl) {
      console.error('❌ NEXT_PUBLIC_API_URL is not set! Cannot fetch shops.');
      if (!append) {
        setShops([]);
        setLoading(false);
      }
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setShops([]);
        setCurrentPage(1);
      }

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '30');
      
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      // Support multiple prefectures and cities (comma-separated)
      if (selectedPrefectures.length > 0) {
        params.set('prefecture', selectedPrefectures.join(','));
      }
      if (selectedCities.length > 0) {
        params.set('city', selectedCities.join(','));
      }
      if (selectedCategoryId) {
        params.set('category', selectedCategoryId);
      }

      const url = `${apiUrl}/shops?${params.toString()}`;
      console.log('🔍 Fetching shops from:', url);
      
      const res = await fetch(url);
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await res.json();
            
            // Backend returns: { shops: [...], page, limit, total, totalPages }
            const shopsArray = data.shops || [];
            
            const visibleShops = shopsArray.filter((shop: Shop) => 
              !shop.claim_status || shop.claim_status !== 'hidden'
            );
            
            if (append) {
              setShops(prev => [...prev, ...visibleShops]);
            } else {
              setShops(visibleShops);
            }
            
            setTotalShops(data.total || 0);
            setHasMore(page < (data.totalPages || 1));
            setCurrentPage(page);
          } catch (jsonError: any) {
            console.error('❌ Error parsing shops JSON:', jsonError);
            if (!append) setShops([]);
          }
        } else {
          console.error('❌ Expected JSON response but got:', contentType);
          if (!append) setShops([]);
        }
      } else {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('❌ Error fetching shops:', res.status, res.statusText, errorText);
        if (!append) setShops([]);
      }
    } catch (error: any) {
      console.error('❌ Exception fetching shops:', error);
      if (!append) setShops([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiUrl, debouncedSearch, selectedPrefectures, selectedCities, selectedCategoryId]);

  // Fetch category stats on mount
  useEffect(() => {
    fetchCategoryStats();
  }, [fetchCategoryStats]);

  // Fetch shops when filters change
  useEffect(() => {
    fetchShops(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedPrefectures, selectedCities, selectedCategoryId]);

  // Load more shops
  const loadMoreShops = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchShops(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, currentPage, fetchShops]);

  // Auto-select prefecture with most shops on first load (if no filters selected)
  useEffect(() => {
    const hasFilters = selectedPrefectures.length > 0 || selectedCities.length > 0 || selectedCategoryId || debouncedSearch;
    
    if (!hasFilters && !hasAutoSelected && shops.length === 0 && !loading) {
      // Fetch top prefecture and auto-select it
      fetch(`${apiUrl}/shops/top-prefecture`)
        .then(res => res.json())
        .then(data => {
          if (data.prefecture && data.shopCount > 0) {
            setSelectedPrefectures([data.prefecture]);
            setHasAutoSelected(true);
          }
        })
        .catch(error => {
          console.error('Error fetching top prefecture:', error);
          // Fallback to Tokyo if API fails
          setSelectedPrefectures(['tokyo']);
          setHasAutoSelected(true);
        });
    }
  }, [shops.length, loading, selectedPrefectures, selectedCities, selectedCategoryId, debouncedSearch, hasAutoSelected, apiUrl]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedPrefectures.length > 0) params.set('prefecture', selectedPrefectures.join(','));
    if (selectedCities.length > 0) params.set('city', selectedCities.join(','));
    if (selectedCategoryId) params.set('category', selectedCategoryId);
    const newUrl = `/browse${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, selectedPrefectures, selectedCities, selectedCategoryId, router]);

  // Filter shops by search (client-side filtering on already-loaded shops)
  const filteredShops = useMemo(() => {
    return filterShopsBySearch(shops, debouncedSearch);
  }, [shops, debouncedSearch]);

  // Build category tree from loaded shops (for navigation)
  // Then merge in category stats from backend for accurate counts
  const categoryTree = useMemo(() => {
    const tree = buildCategoryTree(filteredShops, categories);
    
    // Merge backend category stats to get accurate counts for all categories
    // This ensures categories show correct shop counts even if shops aren't loaded yet
    for (const category of categories) {
      if (!tree[category.id]) {
        // Initialize category if it doesn't exist in tree
        tree[category.id] = {
          name: category.name,
          slug: category.name.toLowerCase().replace(/\s+/g, '-'),
          shopCount: 0,
          prefectures: {},
        };
      }
      
      // Update shop count from backend stats if available, otherwise use 0
      // This ensures all categories show a count (even if 0)
      tree[category.id].shopCount = categoryStats[category.id] ?? 0;
    }
    
    return tree;
  }, [filteredShops, categories, categoryStats]);

  // Get translated prefecture name
  const getPrefectureName = (key: string): string => {
    try {
      const translated = t(`prefectures.${key}`);
      return translated !== `prefectures.${key}` ? translated : key;
    } catch {
      return key;
    }
  };

  // Get translated city name
  const getCityName = (key: string): string => {
    try {
      const translated = t(`cities.${key}`);
      return translated !== `cities.${key}` ? translated : key;
    } catch {
      return key;
    }
  };

  // Get translated category name
  const getCategoryName = (categoryName: string): string => {
    if (!categoryName || categoryName.trim() === '') {
      return 'Unknown Category';
    }
    
    // Try to translate using the category name as-is
    const key = categoryName.toLowerCase().replace(/\s+/g, '_').replace(/&/g, 'and').replace(/[^a-z0-9_]/g, '_');
    try {
      const translated = t(`categories.${key}`);
      // If translation exists and is different from the key, use it
      if (translated && translated !== `categories.${key}`) {
        return translated;
      }
    } catch {
      // Translation failed, continue to return original name
    }
    
    // Return the original category name if translation doesn't exist
    return categoryName;
  };

  // Display shops - use loaded shops directly (already filtered by backend)
  const displayShops = useMemo(() => {
    // Deduplicate shops by ID to prevent duplicate key errors
    const seen = new Set<string>();
    return filteredShops.filter(shop => {
      if (seen.has(shop.id)) {
        return false;
      }
      seen.add(shop.id);
      return true;
    });
  }, [filteredShops]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('shops.shops')}
            </h1>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('shops.searchPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>


        {loading && shops.length === 0 ? (
          <div className="lg:col-span-3">
            {/* Skeleton Loader */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Navigation */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
                <CategoryNavigation
                  categoryTree={categoryTree}
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  selectedPrefectures={selectedPrefectures}
                  selectedCities={selectedCities}
                  onSelectCategory={setSelectedCategoryId}
                  onTogglePrefecture={togglePrefecture}
                  onToggleCity={toggleCity}
                  getCategoryName={getCategoryName}
                  getPrefectureName={getPrefectureName}
                  getCityName={getCityName}
                  t={t}
                />
              </div>
            </aside>

            {/* Main Content - Shop List */}
            <div className="lg:col-span-3">
              {displayShops.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="text-6xl mb-4">🏪</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('shops.noShops')}</h2>
                  <p className="text-gray-600">{t('shops.tryAdjusting')}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {t('shops.shopsFound', { count: totalShops || displayShops.length })}
                    {displayShops.length < totalShops && (
                      <span className="ml-2">({displayShops.length} loaded)</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayShops.map((shop) => (
                      <ShopCard key={shop.id} shop={shop} getCategoryName={getCategoryName} t={t} />
                    ))}
                    {loadingMore && (
                      <>
                        {[...Array(3)].map((_, i) => (
                          <div key={`skeleton-${i}`} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  {hasMore && !loadingMore && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={loadMoreShops}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('shops.loadMore') || 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Update global AI bubble context with browse page state */}
      {browseContext && (
        <UpdateBrowseContext
          shops={displayShops}
          selectedPrefectures={selectedPrefectures}
          selectedCities={selectedCities}
          selectedCategoryId={selectedCategoryId}
          searchQuery={debouncedSearch}
          setBrowseContext={browseContext.setBrowseContext}
        />
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BrowsePageContent />
    </Suspense>
  );
}

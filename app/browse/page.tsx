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
  type AreaTree,
  type CategoryTree,
} from '@/lib/browse/shopBrowseData';
import { CATEGORIES } from '@/lib/categories';
import { AreaNavigation } from './components/AreaNavigation';
import { CategoryNavigation } from './components/CategoryNavigation';
import { ShopCard } from './components/ShopCard';
import { useBrowseAIContext } from '@/app/components/BrowseAIContext';

// Force dynamic rendering to avoid prerendering errors
export const dynamic = 'force-dynamic';

// Component to update browse context
function UpdateBrowseContext({
  shops,
  selectedPrefecture,
  selectedCity,
  selectedCategoryId,
  searchQuery,
  setBrowseContext,
}: {
  shops: Shop[];
  selectedPrefecture: string | null;
  selectedCity: string | null;
  selectedCategoryId: string | null;
  searchQuery: string;
  setBrowseContext: (context: any) => void;
}) {
  useEffect(() => {
    setBrowseContext({
      shops,
      selectedPrefecture,
      selectedCity,
      selectedCategoryId,
      searchQuery,
    });
  }, [shops, selectedPrefecture, selectedCity, selectedCategoryId, searchQuery, setBrowseContext]);
  return null;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

type BrowseMode = 'area' | 'category';

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
  const [areaTree, setAreaTree] = useState<AreaTree>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [browseMode, setBrowseMode] = useState<BrowseMode>(
    (searchParams.get('mode') as BrowseMode) || 'area'
  );
  
  // Navigation state
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(
    searchParams.get('prefecture') || null
  );
  const [selectedCity, setSelectedCity] = useState<string | null>(
    searchParams.get('city') || null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

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

  // Fetch area tree from backend
  const fetchAreaTree = useCallback(async () => {
    if (!apiUrl) return;
    
    try {
      const res = await fetch(`${apiUrl}/shops/area-tree`);
      if (res.ok) {
        const tree = await res.json();
        setAreaTree(tree);
      }
    } catch (error) {
      console.error('Error fetching area tree:', error);
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
      if (selectedPrefecture) {
        params.set('prefecture', selectedPrefecture);
      }
      if (selectedCity) {
        params.set('city', selectedCity);
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
  }, [apiUrl, debouncedSearch, selectedPrefecture, selectedCity, selectedCategoryId]);

  // Fetch area tree on mount
  useEffect(() => {
    fetchAreaTree();
  }, [fetchAreaTree]);

  // Fetch shops when filters change
  useEffect(() => {
    fetchShops(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedPrefecture, selectedCity, selectedCategoryId]);

  // Load more shops
  const loadMoreShops = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchShops(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, currentPage, fetchShops]);

  // Auto-select prefecture with most shops on first load (if no filters selected)
  useEffect(() => {
    const hasFilters = selectedPrefecture || selectedCity || selectedCategoryId || debouncedSearch;
    
    if (!hasFilters && !hasAutoSelected && shops.length === 0 && !loading) {
      // Fetch top prefecture and auto-select it
      fetch(`${apiUrl}/shops/top-prefecture`)
        .then(res => res.json())
        .then(data => {
          if (data.prefecture && data.shopCount > 0) {
            setSelectedPrefecture(data.prefecture);
            setHasAutoSelected(true);
          }
        })
        .catch(error => {
          console.error('Error fetching top prefecture:', error);
          // Fallback to Tokyo if API fails
          setSelectedPrefecture('tokyo');
          setHasAutoSelected(true);
        });
    }
  }, [shops.length, loading, selectedPrefecture, selectedCity, selectedCategoryId, debouncedSearch, hasAutoSelected, apiUrl]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (browseMode) params.set('mode', browseMode);
    if (selectedPrefecture) params.set('prefecture', selectedPrefecture);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedCategoryId) params.set('category', selectedCategoryId);
    const newUrl = `/browse${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, browseMode, selectedPrefecture, selectedCity, selectedCategoryId, router]);

  // Filter shops by search (client-side filtering on already-loaded shops)
  const filteredShops = useMemo(() => {
    return filterShopsBySearch(shops, debouncedSearch);
  }, [shops, debouncedSearch]);

  // Build category tree from loaded shops (for navigation)
  const categoryTree = useMemo(() => {
    return buildCategoryTree(filteredShops, categories);
  }, [filteredShops, categories]);

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
    const key = categoryName.toLowerCase().replace(/\s+/g, '_');
    try {
      const translated = t(`categories.${key}`);
      return translated !== `categories.${key}` ? translated : categoryName;
    } catch {
      return categoryName;
    }
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

  // Reset navigation when mode changes
  const handleModeChange = (mode: BrowseMode) => {
    setBrowseMode(mode);
    setSelectedPrefecture(null);
    setSelectedCity(null);
    setSelectedCategoryId(null);
  };

  // Sort prefectures by name
  const sortedPrefectures = useMemo(() => {
    const prefs = Object.keys(browseMode === 'area' ? areaTree : 
      (selectedCategoryId && categoryTree[selectedCategoryId] ? categoryTree[selectedCategoryId].prefectures : {}));
    return prefs.sort((a, b) => {
      const nameA = getPrefectureName(a);
      const nameB = getPrefectureName(b);
      return nameA.localeCompare(nameB, 'ja');
    });
  }, [browseMode, areaTree, categoryTree, selectedCategoryId, getPrefectureName]);

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

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => handleModeChange('area')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                browseMode === 'area'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('browse.byArea')}
            </button>
            <button
              onClick={() => handleModeChange('category')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                browseMode === 'category'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('browse.byCategory')}
            </button>
          </div>
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
                {browseMode === 'area' ? (
                  <AreaNavigation
                    areaTree={areaTree}
                    selectedPrefecture={selectedPrefecture}
                    selectedCity={selectedCity}
                    onSelectPrefecture={setSelectedPrefecture}
                    onSelectCity={setSelectedCity}
                    getPrefectureName={getPrefectureName}
                    getCityName={getCityName}
                    t={t}
                  />
                ) : (
                  <CategoryNavigation
                    categoryTree={categoryTree}
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    selectedPrefecture={selectedPrefecture}
                    selectedCity={selectedCity}
                    onSelectCategory={setSelectedCategoryId}
                    onSelectPrefecture={setSelectedPrefecture}
                    onSelectCity={setSelectedCity}
                    getCategoryName={getCategoryName}
                    getPrefectureName={getPrefectureName}
                    getCityName={getCityName}
                    t={t}
                  />
                )}
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
          selectedPrefecture={selectedPrefecture}
          selectedCity={selectedCity}
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

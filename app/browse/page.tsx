// apps/dashboard/app/browse/page.tsx
// Redesigned browse page with "By Area" and "By Category" navigation modes

"use client";
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import {
  buildAreaTree,
  buildCategoryTree,
  filterShopsBySearch,
  type Shop,
  type AreaTree,
  type CategoryTree,
} from '@/lib/shopBrowseData';

// Force dynamic rendering to avoid prerendering errors
export const dynamic = 'force-dynamic';

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
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      // Add check for apiUrl
      if (!apiUrl) {
        console.error('❌ NEXT_PUBLIC_API_URL is not set! Cannot fetch categories.');
        setCategories([]);
        return;
      }

      try {
        const url = `${apiUrl}/categories`;
        console.log('🔍 Fetching categories from:', url);
        const res = await fetch(url);
        
        console.log('📡 Categories response status:', res.status, res.statusText);
        
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          console.log('📦 Categories content-type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await res.json();
              console.log('✅ Categories fetched:', data?.length || 0, 'items');
              setCategories(Array.isArray(data) ? data : []);
            } catch (jsonError: any) {
              console.error('❌ Error parsing categories JSON:', jsonError);
              setCategories([]);
            }
          } else {
            console.error('❌ Expected JSON but received:', contentType);
            setCategories([]);
          }
        } else {
          const errorText = await res.text().catch(() => 'Unknown error');
          console.error('❌ Error fetching categories:', res.status, res.statusText, errorText);
          setCategories([]);
        }
      } catch (error: any) {
        console.error('❌ Exception fetching categories:', error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, [apiUrl]);

  // Fetch shops
  const fetchShops = useCallback(async () => {
    // Add check for apiUrl
    if (!apiUrl) {
      console.error('❌ NEXT_PUBLIC_API_URL is not set! Cannot fetch shops.');
      setShops([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }

      const url = `${apiUrl}/shops${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 Fetching shops from:', url);
      
      const res = await fetch(url);
      
      console.log('📡 Shops response status:', res.status, res.statusText);
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        console.log('📦 Shops content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await res.json();
            console.log('📊 Raw shops response:', data);
            
            // Backend returns: { data: [...], pagination: {...} }
            const shopsArray = Array.isArray(data) 
              ? data 
              : (data.data && Array.isArray(data.data) 
                ? data.data 
                : (data.shops || []));
            
            console.log('✅ Shops array length:', shopsArray.length);
            
            const visibleShops = shopsArray.filter((shop: Shop) => 
              !shop.claim_status || shop.claim_status !== 'hidden'
            );
            
            console.log('✅ Visible shops after filtering:', visibleShops.length);
            setShops(visibleShops);
            console.log('✅ Shops state updated, total shops:', visibleShops.length);
          } catch (jsonError: any) {
            console.error('❌ Error parsing shops JSON:', jsonError);
            setShops([]);
          }
        } else {
          console.error('❌ Expected JSON response but got:', contentType);
          setShops([]);
        }
      } else {
        // Handle non-200 responses
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('❌ Error fetching shops:', res.status, res.statusText, errorText);
        setShops([]);
      }
    } catch (error: any) {
      console.error('❌ Exception fetching shops:', error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, debouncedSearch]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

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

  // Build data trees
  const filteredShops = useMemo(() => {
    return filterShopsBySearch(shops, debouncedSearch);
  }, [shops, debouncedSearch]);

  const areaTree = useMemo(() => {
    const tree = buildAreaTree(filteredShops);
    console.log('🌳 Area tree built:', Object.keys(tree).length, 'prefectures');
    console.log('🌳 Area tree keys:', Object.keys(tree));
    return tree;
  }, [filteredShops]);

  const categoryTree = useMemo(() => {
    const tree = buildCategoryTree(filteredShops, categories);
    console.log('🌳 Category tree built:', Object.keys(tree).length, 'categories');
    console.log('🌳 Category tree keys:', Object.keys(tree));
    return tree;
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

  // Get shops to display based on current selection
  const displayShops = useMemo(() => {
    let shops: Shop[] = [];
    
    if (browseMode === 'area') {
      if (selectedCity && selectedPrefecture) {
        shops = areaTree[selectedPrefecture]?.cities[selectedCity]?.shops || [];
      } else if (selectedPrefecture) {
        // Return all shops in prefecture
        const prefecture = areaTree[selectedPrefecture];
        if (prefecture) {
          shops = Object.values(prefecture.cities).flatMap(city => city.shops);
        }
      } else {
        // No prefecture selected - show ALL shops from all prefectures
        shops = Object.values(areaTree).flatMap(prefecture => 
          Object.values(prefecture.cities).flatMap(city => city.shops)
        );
      }
    } else {
      // Category mode
      if (selectedCity && selectedPrefecture && selectedCategoryId) {
        shops = categoryTree[selectedCategoryId]?.prefectures[selectedPrefecture]?.cities[selectedCity]?.shops || [];
      } else if (selectedPrefecture && selectedCategoryId) {
        const category = categoryTree[selectedCategoryId];
        if (category) {
          const prefecture = category.prefectures[selectedPrefecture];
          if (prefecture) {
            shops = Object.values(prefecture.cities).flatMap(city => city.shops);
          }
        }
      } else if (selectedCategoryId) {
        const category = categoryTree[selectedCategoryId];
        if (category) {
          shops = Object.values(category.prefectures).flatMap(pref => 
            Object.values(pref.cities).flatMap(city => city.shops)
          );
        }
      } else {
        // No category selected - show ALL shops from all categories
        shops = Object.values(categoryTree).flatMap(category =>
          Object.values(category.prefectures).flatMap(pref => 
            Object.values(pref.cities).flatMap(city => city.shops)
          )
        );
      }
    }
    
    // Deduplicate shops by ID to prevent duplicate key errors
    const seen = new Set<string>();
    return shops.filter(shop => {
      if (seen.has(shop.id)) {
        return false;
      }
      seen.add(shop.id);
      return true;
    });
  }, [browseMode, selectedPrefecture, selectedCity, selectedCategoryId, areaTree, categoryTree]);

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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">{t('shops.loading')}</p>
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
                    {t('shops.shopsFound', { count: displayShops.length })}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayShops.map((shop) => (
                      <ShopCard key={shop.id} shop={shop} getCategoryName={getCategoryName} t={t} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Area Navigation Component
function AreaNavigation({
  areaTree,
  selectedPrefecture,
  selectedCity,
  onSelectPrefecture,
  onSelectCity,
  getPrefectureName,
  getCityName,
  t,
}: {
  areaTree: AreaTree;
  selectedPrefecture: string | null;
  selectedCity: string | null;
  onSelectPrefecture: (pref: string | null) => void;
  onSelectCity: (city: string | null) => void;
  getPrefectureName: (key: string) => string;
  getCityName: (key: string) => string;
  t: any;
}) {
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

// Category Navigation Component
function CategoryNavigation({
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
}: {
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
}) {
  const sortedCategories = categories
    .filter(cat => categoryTree[cat.id])
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
                  <span className="text-xs text-gray-500">({categoryData.shopCount})</span>
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

// Shop Card Component
function ShopCard({ shop, getCategoryName, t }: { shop: Shop; getCategoryName: (name: string) => string; t: any }) {
  return (
    <Link
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
        <div className="mb-2">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{shop.name}</h3>
          {shop.categories && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              {getCategoryName(shop.categories.name)}
            </span>
          )}
        </div>
        {shop.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {shop.description.length > 100 ? shop.description.substring(0, 100) + '...' : shop.description}
          </p>
        )}
        <p className="text-gray-500 text-sm mb-4">{shop.address}</p>
        <div className="mt-4">
          <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg">
            {t('shops.viewDetails')} →
          </span>
        </div>
      </div>
    </Link>
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

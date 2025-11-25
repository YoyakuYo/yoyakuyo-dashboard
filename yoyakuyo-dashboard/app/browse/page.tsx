// app/browse/page.tsx
// Simplified browse page - uses direct API fields, no complex trees

"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import {
  getUniquePrefectures,
  getPrefectureShopCount,
  getCategoryShopCount,
  filterShops,
  type Shop,
  type Category,
} from '@/lib/shopBrowseData';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type BrowseMode = 'area' | 'category';

export default function BrowsePage() {
  const router = useRouter();
  const t = useTranslations();
  
  // Data state
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [browseMode, setBrowseMode] = useState<BrowseMode>('area');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = (params.get('mode') as BrowseMode) || 'area';
      const pref = params.get('prefecture');
      const cat = params.get('category');
      const search = params.get('search') || '';
      
      setBrowseMode(mode);
      setSelectedPrefecture(pref);
      setSelectedCategoryId(cat);
      setSearchQuery(search);
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!apiUrl) {
        console.error('❌ NEXT_PUBLIC_API_URL is not set!');
        setCategories([]);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : []);
        } else {
          console.error('❌ Error fetching categories:', res.status);
          setCategories([]);
        }
      } catch (error) {
        console.error('❌ Exception fetching categories:', error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      if (!apiUrl) {
        console.error('❌ NEXT_PUBLIC_API_URL is not set!');
        setAllShops([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/shops`);
        
        if (res.ok) {
          const data = await res.json();
          
          // Handle different response formats
          let shopsArray: Shop[] = [];
          if (Array.isArray(data)) {
            shopsArray = data;
          } else if (data?.data && Array.isArray(data.data)) {
            shopsArray = data.data;
          } else if (data?.shops && Array.isArray(data.shops)) {
            shopsArray = data.shops;
          }
          
          console.log('✅ Loaded shops:', shopsArray.length);
          setAllShops(shopsArray);
        } else {
          console.error('❌ Error fetching shops:', res.status);
          setAllShops([]);
        }
      } catch (error) {
        console.error('❌ Exception fetching shops:', error);
        setAllShops([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShops();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (browseMode) params.set('mode', browseMode);
    if (selectedPrefecture) params.set('prefecture', selectedPrefecture);
    if (selectedCategoryId) params.set('category', selectedCategoryId);
    
    const newUrl = `/browse${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, browseMode, selectedPrefecture, selectedCategoryId, router]);

  // Get unique prefectures from all shops
  const prefectures = useMemo(() => {
    return getUniquePrefectures(allShops);
  }, [allShops]);

  // Filter shops based on current selections
  const filteredShops = useMemo(() => {
    return filterShops(allShops, {
      prefecture: browseMode === 'area' ? selectedPrefecture : null,
      categoryId: browseMode === 'category' ? selectedCategoryId : null,
      searchQuery: debouncedSearch,
    });
  }, [allShops, browseMode, selectedPrefecture, selectedCategoryId, debouncedSearch]);

  // Get translated prefecture name
  const getPrefectureName = (pref: string): string => {
    try {
      const translated = t(`prefectures.${pref}`);
      return translated !== `prefectures.${pref}` ? translated : pref;
    } catch {
      return pref;
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

  // Handle mode change
  const handleModeChange = (mode: BrowseMode) => {
    setBrowseMode(mode);
    setSelectedPrefecture(null);
    setSelectedCategoryId(null);
  };

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
                    prefectures={prefectures}
                    allShops={allShops}
                    selectedPrefecture={selectedPrefecture}
                    onSelectPrefecture={setSelectedPrefecture}
                    getPrefectureName={getPrefectureName}
                    t={t}
                  />
                ) : (
                  <CategoryNavigation
                    categories={categories}
                    allShops={allShops}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    getCategoryName={getCategoryName}
                    t={t}
                  />
                )}
              </div>
            </aside>

            {/* Main Content - Shop List */}
            <div className="lg:col-span-3">
              {filteredShops.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="text-6xl mb-4">🏪</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('shops.noShops')}</h2>
                  <p className="text-gray-600">{t('shops.tryAdjusting')}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {t('shops.shopsFound', { count: filteredShops.length })}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredShops.map((shop) => (
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
  prefectures,
  allShops,
  selectedPrefecture,
  onSelectPrefecture,
  getPrefectureName,
  t,
}: {
  prefectures: string[];
  allShops: Shop[];
  selectedPrefecture: string | null;
  onSelectPrefecture: (pref: string | null) => void;
  getPrefectureName: (pref: string) => string;
  t: any;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{t('browse.prefecture')}</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {prefectures.length === 0 ? (
          <p className="text-sm text-gray-500">{t('browse.noPrefectures')}</p>
        ) : (
          prefectures.map((pref) => {
            const isSelected = selectedPrefecture === pref;
            const count = getPrefectureShopCount(allShops, pref);
            return (
              <button
                key={pref}
                onClick={() => onSelectPrefecture(isSelected ? null : pref)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{getPrefectureName(pref)}</span>
                  <span className="text-xs text-gray-500">({count})</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Category Navigation Component
function CategoryNavigation({
  categories,
  allShops,
  selectedCategoryId,
  onSelectCategory,
  getCategoryName,
  t,
}: {
  categories: Category[];
  allShops: Shop[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  getCategoryName: (name: string) => string;
  t: any;
}) {
  const sortedCategories = [...categories].sort((a, b) => {
    const nameA = getCategoryName(a.name);
    const nameB = getCategoryName(b.name);
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{t('browse.category')}</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedCategories.length === 0 ? (
          <p className="text-sm text-gray-500">{t('browse.noCategories')}</p>
        ) : (
          sortedCategories.map((category) => {
            const isSelected = selectedCategoryId === category.id;
            const count = getCategoryShopCount(allShops, category.id);
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(isSelected ? null : category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{getCategoryName(category.name)}</span>
                  <span className="text-xs text-gray-500">({count})</span>
                </div>
              </button>
            );
          })
        )}
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

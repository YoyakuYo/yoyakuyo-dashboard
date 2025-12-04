"use client";

import { useState, useEffect, useCallback } from "react";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export default function CustomerShopsPage() {
  const { user } = useCustomAuth();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [shops, setShops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [totalShops, setTotalShops] = useState(0);

  // Load categories and favorites on mount
  useEffect(() => {
    loadCategories();
    if (user) {
      loadFavorites();
    }
  }, [user]);

  // Get category from URL params on mount
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  // Initial load of shops (only once on mount)
  useEffect(() => {
    const category = searchParams.get('category');
    const initialCategory = category || null;
    
    const loadInitialShops = async () => {
      if (!apiUrl) {
        console.error("API URL not configured");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '30');
        
        if (initialCategory) {
          params.set('category', initialCategory);
        }

        const url = `${apiUrl}/shops?${params.toString()}`;
        const res = await fetch(url);

        if (res.ok) {
          const data = await res.json();
          const shopsArray = data.shops || [];
          const total = data.total || shopsArray.length;
          
          const visibleShops = shopsArray.filter((shop: any) => 
            !shop.claim_status || shop.claim_status !== 'hidden'
          );

          setShops(visibleShops);
          setTotalShops(total);
          setHasMore(visibleShops.length === 30 && visibleShops.length < total);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Error loading shops:", error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialShops();
  }, []);

  const loadCategories = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading categories:", error);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadShops = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!apiUrl) {
      console.error("API URL not configured");
      setLoading(false);
      return;
    }

    try {
      if (!append) {
        setLoading(true);
        setShops([]); // Clear existing shops when loading new page
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '30'); // Load 30 shops per page
      
      // Add category filter if selected
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      
      // Add search filter if provided
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const url = `${apiUrl}/shops?${params.toString()}`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const shopsArray = data.shops || [];
        const total = data.total || shopsArray.length;
        
        // Filter out hidden shops
        const visibleShops = shopsArray.filter((shop: any) => 
          !shop.claim_status || shop.claim_status !== 'hidden'
        );

        setTotalShops(total);
        
        // Update shops and hasMore
        if (append) {
          setShops(prev => {
            const newShops = [...prev, ...visibleShops];
            setHasMore(newShops.length < total && visibleShops.length === 30);
            return newShops;
          });
        } else {
          setShops(visibleShops);
          setHasMore(visibleShops.length === 30 && visibleShops.length < total);
        }
        setCurrentPage(page);
      } else {
        console.error("Error loading shops:", res.statusText);
        if (!append) setShops([]);
      }
    } catch (error) {
      console.error("Error loading shops:", error);
      if (!append) setShops([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiUrl, selectedCategory, searchQuery]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("customer_favorites")
        .select("shop_id")
        .eq("customer_id", user.id);

      if (data) {
        setFavorites(new Set(data.map((f) => f.shop_id)));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  // Load more shops (infinite scroll)
  const loadMoreShops = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadShops(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, currentPage, loadShops]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      loadShops(1, false);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery, loadShops]);

  // Reload shops when category changes
  useEffect(() => {
    loadShops(1, false);
  }, [selectedCategory, loadShops]);

  const toggleFavorite = async (shopId: string) => {
    if (!user) {
      // Redirect to login
      window.location.href = "/customer-login";
      return;
    }

    const supabase = getSupabaseClient();
    const isFavorite = favorites.has(shopId);

    if (isFavorite) {
      await supabase
        .from("customer_favorites")
        .delete()
        .eq("customer_id", user.id)
        .eq("shop_id", shopId);
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(shopId);
        return next;
      });
    } else {
      await supabase
        .from("customer_favorites")
        .insert({
          customer_id: user.id,
          shop_id: shopId,
        });
      setFavorites((prev) => new Set(prev).add(shopId));
    }
  };

  // No need for client-side filtering - backend handles it

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('customer.nav.browseShops')}</h1>
      </div>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t('categories.all')}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t(`categories.${category.name.toLowerCase().replace(/\s+/g, '_')}`) || category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('shops.searchPlaceholder')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Shops Count */}
      {!loading && shops.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {t('shops.shopsFound', { count: totalShops || shops.length })}
        </div>
      )}

      {/* Shops Grid */}
      {loading && shops.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">{t('shops.noShops')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
            >
              {shop.main_image_url && (
                <div className="relative h-48 w-full">
                  <Image
                    src={shop.main_image_url}
                    alt={shop.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/customer/shops/${shop.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {shop.name}
                  </Link>
                  <button
                    onClick={() => toggleFavorite(shop.id)}
                    className={`p-1 ${
                      favorites.has(shop.id)
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                    title={favorites.has(shop.id) ? t('customer.nav.favorites') : t('customer.nav.favorites')}
                  >
                    <svg
                      className={`w-5 h-5 ${favorites.has(shop.id) ? "fill-current" : ""}`}
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.655l-6.828-6.827a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                {shop.category && (
                  <p className="text-sm text-gray-600 mb-2">{shop.category}</p>
                )}
                {shop.address && (
                  <p className="text-sm text-gray-500 mb-2">{shop.address}</p>
                )}
                {shop.rating && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                    <span className="text-yellow-500">★</span>
                    <span>{shop.rating.toFixed(1)}</span>
                    {shop.review_count && (
                      <span className="text-gray-500">({shop.review_count})</span>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link
                    href={`/customer/shops/${shop.id}`}
                    className="flex-1 px-4 py-2 text-sm font-medium text-center text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {t('shops.viewDetails')}
                  </Link>
                  <Link
                    href={`/book/${shop.id}`}
                    className="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('shops.bookNow')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMoreShops}
                disabled={loadingMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? t('shops.loading') || 'Loading...' : t('shops.loadMore') || 'Load More'}
              </button>
            </div>
          )}
          
          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="mt-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function CustomerShopsPage() {
  const { user } = useCustomAuth();
  const t = useTranslations();
  const [shops, setShops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Get category from URL params
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (category) {
      setSelectedCategory(category);
    }
    
    loadCategories();
    loadShops();
    loadFavorites();
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

  const loadShops = async () => {
    try {
      const supabase = getSupabaseClient();
      // Load all shops - use pagination for large datasets
      let allShops: any[] = [];
      let page = 0;
      const pageSize = 1000; // Load 1000 at a time
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .order("name", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error("Error loading shops:", error);
          hasMore = false;
        } else if (data && data.length > 0) {
          allShops = [...allShops, ...data];
          // If we got less than pageSize, we've reached the end
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      setShops(allShops);
      console.log(`Loaded ${allShops.length} shops`);
    } catch (error) {
      console.error("Error loading shops:", error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("customer_favorites")
      .select("shop_id")
      .eq("customer_id", user.id);

    if (data) {
      setFavorites(new Set(data.map((f) => f.shop_id)));
    }
  };

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

  const filteredShops = shops.filter((shop) => {
    // Filter by category if selected
    if (selectedCategory && shop.category_id !== selectedCategory && shop.category !== selectedCategory && shop.subcategory !== selectedCategory) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        shop.name?.toLowerCase().includes(query) ||
        shop.address?.toLowerCase().includes(query) ||
        shop.category?.toLowerCase().includes(query) ||
        shop.subcategory?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

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

      {/* Shops Grid */}
      {filteredShops.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">{t('shops.noShops')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
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
      )}
    </div>
  );
}


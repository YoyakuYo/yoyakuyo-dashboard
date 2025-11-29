"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";

export default function CustomerShopsPage() {
  const { user } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadShops();
    loadFavorites();
  }, []);

  const loadShops = async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .order("name", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error loading shops:", error);
    } else {
      setShops(data || []);
    }
    setLoading(false);
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

  const filteredShops = shops.filter((shop) =>
    shop.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Browse Shops</h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search shops by name, location, or category..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Shops Grid */}
      {filteredShops.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No shops found.</p>
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
                    title={favorites.has(shop.id) ? "Remove from favorites" : "Add to favorites"}
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
                    View Details
                  </Link>
                  <Link
                    href={`/book/${shop.id}`}
                    className="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book Now
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


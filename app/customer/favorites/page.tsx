"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";

export default function CustomerFavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("customer_favorites")
      .select(`
        *,
        shops (
          id,
          name,
          address,
          phone,
          description,
          category,
          main_image_url,
          rating,
          review_count
        )
      `)
      .eq("customer_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading favorites:", error);
    } else {
      setFavorites(data || []);
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (shopId: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("customer_favorites")
      .delete()
      .eq("customer_id", user?.id)
      .eq("shop_id", shopId);

    if (error) {
      console.error("Error removing favorite:", error);
      alert("Failed to remove favorite");
    } else {
      loadFavorites();
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Favorite Shops</h1>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">You haven't saved any favorite shops yet.</p>
          <Link
            href="/customer/shops"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse shops to add favorites →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => {
            const shop = favorite.shops;
            if (!shop) return null;

            return (
              <div
                key={favorite.id}
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
                      onClick={() => handleRemoveFavorite(shop.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove from favorites"
                    >
                      <svg
                        className="w-5 h-5 fill-current"
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
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span className="text-yellow-500">★</span>
                      <span>{shop.rating.toFixed(1)}</span>
                      {shop.review_count && (
                        <span className="text-gray-500">({shop.review_count})</span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/customer/shops/${shop.id}`}
                      className="flex-1 px-4 py-2 text-sm font-medium text-center text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      View Shop
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
            );
          })}
        </div>
      )}
    </div>
  );
}


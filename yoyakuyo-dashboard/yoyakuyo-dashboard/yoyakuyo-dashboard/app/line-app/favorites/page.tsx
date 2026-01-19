"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { useLineAppI18n } from "../i18n";

declare global {
  interface Window {
    liff: any;
  }
}

interface FavoriteShop {
  id: string;
  name: string;
  address?: string;
  main_image_url?: string;
  image_url?: string;
  cover_photo_url?: string;
  logo_url?: string;
}

interface FavoriteRecord {
  id: string;
  shop_id: string;
  shops?: FavoriteShop;
}

export default function LineFavoritesPage() {
  const router = useRouter();
  const { t: li } = useLineAppI18n();
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadFavorites = async () => {
      if (!apiUrl) {
        setError(li("apiUrlNotConfigured"));
        setLoading(false);
        return;
      }

      try {
        if (typeof window === "undefined" || !window.liff) {
          setError(li("lineAppNotAvailable"));
          setLoading(false);
          return;
        }

        await window.liff.ready;
        const idToken = await window.liff.getIDToken();
        if (!idToken) {
          setError(li("lineAppNotAvailable"));
          setLoading(false);
          return;
        }

        // Resolve canonical customer_id via verify endpoint
        const verifyRes = await fetch(`${apiUrl}/api/line/liff/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (!verifyRes.ok) {
          setError(li("failedToVerifyLineUser"));
          setLoading(false);
          return;
        }

        const verifyData = await verifyRes.json();
        const customerId = verifyData?.customer_id as string | undefined;
        
        // CRITICAL: customer_id from verify endpoint IS the auth.users.id
        // get_or_create_customer_from_line creates both auth.users and customers records
        // So customer_id MUST exist in auth.users for the backend check to pass
        if (!customerId) {
          setError(li("failedToVerifyLineUser"));
          setLoading(false);
          return;
        }
        
        // Get LINE user ID for headers (for logging/debugging)
        const profile = await window.liff.getProfile();
        const lineUserId = profile.userId;
        
        // Build headers - MUST include customer_id as x-user-id for backend auth check
        // Backend /customers/favorites checks auth.users using x-user-id
        const headers: Record<string, string> = {
          "x-user-id": customerId, // REQUIRED: Backend checks auth.users with this
          "x-customer-id": customerId, // Also send as customer-id for compatibility
          "x-line-user-id": lineUserId, // Include LINE identity for logging
        };
        
        // Include ID token
        if (idToken) {
          headers["x-id-token"] = idToken;
        }

        const favRes = await fetch(`${apiUrl}/customers/favorites`, {
          headers,
        });

        if (!favRes.ok) {
          const errJson = await favRes.json().catch(() => ({}));
          console.error("[LINE Favorites] Failed to load favorites:", errJson);
          setError(errJson.error || "Failed to load favorites");
          setLoading(false);
          return;
        }

        const favData = await favRes.json();
        const favList: FavoriteRecord[] = Array.isArray(favData)
          ? favData
          : Array.isArray(favData.favorites)
          ? favData.favorites
          : [];

        setFavorites(favList);
      } catch (err: any) {
        console.error("[LINE Favorites] Error loading favorites:", err);
        setError(err?.message || "Failed to load favorites");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const getShopImage = (shop: FavoriteShop) =>
    shop.main_image_url || shop.image_url || shop.cover_photo_url || shop.logo_url || "";

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      <header className="bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← {li("back")}
          </button>
          <h1 className="text-lg font-bold text-gray-900">{li("savedShopsTitle")}</h1>
          <span className="w-8" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{li("loading")}</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">{li("noSavedShops")}</p>
            <button
              onClick={() => router.push("/line-app?tab=search")}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {li("browseShops")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((fav) => {
              const shop = fav.shops;
              if (!shop) return null;

              const img = getShopImage(shop);

              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  {img && (
                    <div className="w-full h-40 bg-gray-100 overflow-hidden">
                      <img
                        src={img}
                        alt={shop.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">
                      {shop.name}
                    </h2>
                    {shop.address && (
                      <p className="text-xs text-gray-600 mb-3">{shop.address}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/line-app/shops/${shop.id}`)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        {li("browseShops")}
                      </button>
                      <button
                        onClick={() => router.push(`/line-app/shops/${shop.id}`)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        {li("bookNow")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}



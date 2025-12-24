"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

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

type LineLang = "ja" | "en" | "es" | "pt" | "ko" | "zh";

const normalizeLineLang = (lang: string): LineLang => {
  if (lang.startsWith("pt")) return "pt";
  if (lang === "es") return "es";
  if (lang === "ko") return "ko";
  if (lang === "zh") return "zh";
  if (lang === "en") return "en";
  return "ja";
};

const texts = {
  title: {
    ja: "保存したお店",
    en: "Saved Shops",
    es: "Tiendas guardadas",
    pt: "Lojas salvas",
    ko: "저장된 가게",
    zh: "已保存的店铺",
  },
  noFavorites: {
    ja: "まだ保存したお店がありません。",
    en: "You have not saved any shops yet.",
    es: "Todavía no has guardado ninguna tienda.",
    pt: "Você ainda não salvou nenhuma loja.",
    ko: "아직 저장한 가게가 없습니다.",
    zh: "您还没有保存任何店铺。",
  },
  browseButton: {
    ja: "お店を探す",
    en: "Browse shops",
    es: "Buscar tiendas",
    pt: "Procurar lojas",
    ko: "가게 찾기",
    zh: "浏览店铺",
  },
  backButton: {
    ja: "戻る",
    en: "Back",
    es: "Volver",
    pt: "Voltar",
    ko: "뒤로",
    zh: "返回",
  },
  bookButton: {
    ja: "予約する",
    en: "Book",
    es: "Reservar",
    pt: "Reservar",
    ko: "예약",
    zh: "预约",
  },
};

export default function LineFavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [language, setLanguage] = useState<LineLang>("ja");

  const t = (key: keyof typeof texts) => {
    const langKey = normalizeLineLang(language);
    const entry = texts[key];
    return entry[langKey] || entry.en;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = window.localStorage.getItem("line_app_language") || "ja";
      setLanguage(normalizeLineLang(storedLang));
    }
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!apiUrl) {
        setError("API URL not configured");
        setLoading(false);
        return;
      }

      try {
        if (typeof window === "undefined" || !window.liff) {
          setError("LINE app is not available");
          setLoading(false);
          return;
        }

        await window.liff.ready;
        const idToken = await window.liff.getIDToken();
        if (!idToken) {
          setError("Failed to get LINE ID token");
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
          setError("Failed to verify LINE user");
          setLoading(false);
          return;
        }

        const verifyData = await verifyRes.json();
        const customerId = verifyData?.customer_id as string | undefined;
        if (!customerId) {
          setError("Could not resolve customer");
          setLoading(false);
          return;
        }

        const favRes = await fetch(`${apiUrl}/customers/favorites`, {
          headers: {
            "x-user-id": customerId,
          },
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← {t("backButton")}
          </button>
          <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
          <span className="w-8" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">{t("noFavorites")}</p>
            <button
              onClick={() => router.push("/line-app?tab=search")}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {t("browseButton")}
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
                        {t("browseButton")}
                      </button>
                      <button
                        onClick={() => router.push(`/line-app/shops/${shop.id}`)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        {t("bookButton")}
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



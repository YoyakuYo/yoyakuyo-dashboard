"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";

export default function CustomerShopDetailPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const { user } = useCustomAuth();
  const [shop, setShop] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      loadShop();
      checkFavorite();
    }
  }, [shopId, user]);

  const loadShop = async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single();

    if (error) {
      console.error("Error loading shop:", error);
    } else {
      setShop(data);
    }
    setLoading(false);
  };

  const checkFavorite = async () => {
    if (!user) return;

    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("customer_favorites")
      .select("id")
      .eq("customer_id", user.id)
      .eq("shop_id", shopId)
      .single();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      window.location.href = "/customer-login";
      return;
    }

    const supabase = getSupabaseClient();
    if (isFavorite) {
      await supabase
        .from("customer_favorites")
        .delete()
        .eq("customer_id", user.id)
        .eq("shop_id", shopId);
      setIsFavorite(false);
    } else {
      await supabase
        .from("customer_favorites")
        .insert({
          customer_id: user.id,
          shop_id: shopId,
        });
      setIsFavorite(true);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Shop not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/customer/shops"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Shops
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {shop.main_image_url && (
          <div className="relative h-64 w-full">
            <Image
              src={shop.main_image_url}
              alt={shop.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.name}</h1>
              {shop.category && (
                <p className="text-lg text-gray-600 mb-2">{shop.category}</p>
              )}
              {shop.address && (
                <p className="text-gray-500 mb-2">{shop.address}</p>
              )}
            </div>
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg ${
                isFavorite
                  ? "bg-red-50 text-red-500"
                  : "bg-gray-100 text-gray-400 hover:text-red-500"
              }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`}
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

          {shop.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{shop.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {shop.phone && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <a
                  href={`tel:${shop.phone}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {shop.phone}
                </a>
              </div>
            )}
            {shop.website_url && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Website</h3>
                <a
                  href={shop.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Visit Website
                </a>
              </div>
            )}
            {shop.rating && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Rating</h3>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span>{shop.rating.toFixed(1)}</span>
                  {shop.review_count && (
                    <span className="text-gray-500">({shop.review_count} reviews)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Link
              href={`/book/${shop.id}`}
              className="flex-1 px-6 py-3 text-center font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Appointment
            </Link>
            <Link
              href={`/customer/chat`}
              className="px-6 py-3 text-center font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Ask AI Assistant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


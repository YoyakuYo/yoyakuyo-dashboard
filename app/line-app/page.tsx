"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/apiClient";

// LINE LIFF SDK types
declare global {
  interface Window {
    liff: any;
  }
}

interface Shop {
  id: string;
  name: string;
  address?: string;
  description?: string;
  main_image_url?: string;
  category?: string;
}

function LineAppPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [lineUser, setLineUser] = useState<any>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("all");

  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

  // Initialize LIFF
  useEffect(() => {
    if (typeof window === "undefined" || !LIFF_ID) {
      console.warn("LIFF ID not configured");
      setLoading(false);
      return;
    }

    const initLiff = async () => {
      try {
        // Dynamically load LIFF SDK
        const script = document.createElement("script");
        script.src = "https://static.line-scdn.net/liff/edge/versions/2.24.0/sdk.js";
        script.onload = async () => {
          try {
            await window.liff.init({ liffId: LIFF_ID });
            setLiffInitialized(true);

            if (window.liff.isLoggedIn()) {
              const profile = await window.liff.getProfile();
              setLineUser(profile);
              
              // Sync with backend
              await syncLineUser(profile.userId, profile.displayName, profile.pictureUrl);
            } else {
              // Redirect to LINE Login
              window.liff.login();
            }
          } catch (error) {
            console.error("LIFF initialization error:", error);
            setLoading(false);
          }
        };
        script.onerror = () => {
          console.error("Failed to load LIFF SDK");
          setLoading(false);
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error("Error loading LIFF SDK:", error);
        setLoading(false);
      }
    };

    initLiff();
  }, [LIFF_ID]);

  // Sync LINE user with backend
  const syncLineUser = async (userId: string, displayName?: string, pictureUrl?: string) => {
    try {
      await fetch(`${apiUrl}/api/line/user`, {
        headers: {
          "x-line-user-id": userId,
        },
      });
    } catch (error) {
      console.error("Error syncing LINE user:", error);
    }
  };

  // Search shops
  const searchShops = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("keyword", searchQuery);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedPrefecture !== "all") params.set("prefecture", selectedPrefecture);

      const res = await fetch(`${apiUrl}/api/line/shops/search?${params.toString()}`);
      const data = await res.json();
      setShops(data.shops || []);
    } catch (error) {
      console.error("Error searching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (liffInitialized && lineUser) {
      searchShops();
    }
  }, [liffInitialized, lineUser, selectedCategory, selectedPrefecture]);

  if (!liffInitialized && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading LINE App...</p>
        </div>
      </div>
    );
  }

  if (!lineUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in with LINE</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Yoyaku Yo</h1>
            {lineUser && (
              <div className="flex items-center gap-2">
                {lineUser.pictureUrl && (
                  <img
                    src={lineUser.pictureUrl}
                    alt={lineUser.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{lineUser.displayName}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="space-y-3">
            {/* Search Bar */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchShops()}
              placeholder="Search shops by name, location..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="beauty_services">Beauty Services</option>
                <option value="spa_onsen_relaxation">Spa & Onsen</option>
                <option value="hotels_stays">Hotels & Stays</option>
                <option value="dining_izakaya">Dining & Izakaya</option>
              </select>

              <select
                value={selectedPrefecture}
                onChange={(e) => setSelectedPrefecture(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Prefectures</option>
                <option value="tokyo">Tokyo</option>
                <option value="osaka">Osaka</option>
                <option value="kyoto">Kyoto</option>
                <option value="hokkaido">Hokkaido</option>
              </select>
            </div>

            <button
              onClick={searchShops}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Shop Results */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching shops...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No shops found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/line-app/shops/${shop.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {shop.main_image_url && (
                  <div className="w-full h-48 overflow-hidden bg-gray-100">
                    <img
                      src={shop.main_image_url}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{shop.name}</h3>
                  {shop.address && (
                    <p className="text-sm text-gray-600 mb-2">{shop.address}</p>
                  )}
                  {shop.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{shop.description}</p>
                  )}
                  <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Book Now
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-around">
            <Link href="/line-app" className="flex flex-col items-center py-2 text-blue-600">
              <span className="text-2xl">🔍</span>
              <span className="text-xs mt-1">Search</span>
            </Link>
            <Link href="/line-app/bookings" className="flex flex-col items-center py-2 text-gray-600">
              <span className="text-2xl">📋</span>
              <span className="text-xs mt-1">Bookings</span>
            </Link>
            <Link href="/line-app/chat" className="flex flex-col items-center py-2 text-gray-600">
              <span className="text-2xl">💬</span>
              <span className="text-xs mt-1">Chat</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default function LineAppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading LINE App...</p>
        </div>
      </div>
    }>
      <LineAppPageContent />
    </Suspense>
  );
}


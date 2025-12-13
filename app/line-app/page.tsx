"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { BrowseAIAssistant } from "@/app/browse/components/BrowseAIAssistant";
import { BrowseAIProvider } from "@/app/components/BrowseAIContext";

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
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("search");

  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

  // Get tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab") || "search";
    setActiveTab(tab);
  }, [searchParams]);

  // Block external navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Prevent window.open
    const originalOpen = window.open;
    window.open = function(...args) {
      console.warn("Blocked window.open in LIFF app");
      return null;
    };

    // Prevent target="_blank" links
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.target === "_blank") {
        e.preventDefault();
        const href = link.getAttribute("href");
        if (href && href.startsWith("/")) {
          router.push(href);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      window.open = originalOpen;
      document.removeEventListener("click", handleClick);
    };
  }, [router]);

  // Initialize LIFF - ONLY after liff.init success and isInClient() === true
  useEffect(() => {
    if (typeof window === "undefined" || !LIFF_ID) {
      setError("LIFF ID not configured");
      setLoading(false);
      return;
    }

    const initLiff = async () => {
      try {
        // Load LIFF SDK if not already loaded
        if (!window.liff) {
          const script = document.createElement("script");
          script.src = "https://static.line-scdn.net/liff/edge/versions/2.24.0/sdk.js";
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load LIFF SDK"));
            document.body.appendChild(script);
          });
        }

        // Initialize LIFF
        await window.liff.init({ liffId: LIFF_ID });
        setLiffInitialized(true);

        // CRITICAL: Only proceed if in LINE client
        if (!window.liff.isInClient()) {
          // If opened in browser, try to redirect to LINE app
          const liffUrl = `https://liff.line.me/${LIFF_ID}${window.location.search}`;
          setError("Opening in LINE app...");
          
          try {
            // Try to open in LINE app
            window.liff.openWindow({
              url: liffUrl,
              external: false
            });
            // If openWindow succeeds, wait a bit then show message
            setTimeout(() => {
              setError("Please open this link in the LINE app. If you scanned the QR code, make sure to use LINE's built-in scanner.");
            }, 2000);
          } catch (err) {
            setError("Please open this link in the LINE app. Scan the QR code using LINE app's camera scanner.");
          }
          setLoading(false);
          return;
        }

        // Verify login
        if (!window.liff.isLoggedIn()) {
          window.liff.login();
          return;
        }

        // Get profile ONLY after init success and isInClient check
        const profile = await window.liff.getProfile();
        
        if (!profile || !profile.userId) {
          setError("Failed to get LINE profile");
          setLoading(false);
          return;
        }

        setLineUser(profile);
        
        // Sync with backend - upsert LINE user
        await syncLineUser(profile.userId, profile.displayName, profile.pictureUrl);
        setLoading(false);
      } catch (error: any) {
        console.error("LIFF initialization error:", error);
        setError(error.message || "Failed to initialize LINE app");
        setLoading(false);
      }
    };

    initLiff();
  }, [LIFF_ID]);

  // Sync LINE user with backend - upsert permanently
  const syncLineUser = async (userId: string, displayName?: string, pictureUrl?: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/line/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-line-user-id": userId,
        },
        body: JSON.stringify({
          line_user_id: userId,
          line_display_name: displayName,
          line_picture_url: pictureUrl,
        }),
      });
      
      if (!response.ok) {
        console.error("Failed to sync LINE user");
      }
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
    if (liffInitialized && lineUser && activeTab === "search") {
      searchShops();
    }
  }, [liffInitialized, lineUser, selectedCategory, selectedPrefecture, activeTab]);

  // Navigate to tab
  const navigateToTab = (tab: string) => {
    router.push(`/line-app?tab=${tab}`);
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">LINE App Required</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!lineUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading LINE profile...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowseAIProvider>
      <div className="min-h-screen bg-gray-50 pb-20">
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

        {/* Tab Content */}
        {activeTab === "search" && (
          <>
            {/* Search Section */}
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchShops()}
                    placeholder="Search shops by name, location..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                      <option value="clinics_medical_care">Clinics & Medical Care</option>
                      <option value="activities_sports">Activities & Sports</option>
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
                    <button
                      key={shop.id}
                      onClick={() => router.push(`/line-app/shops/${shop.id}`)}
                      className="w-full text-left bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
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
                      <span className="mt-4 inline-block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-semibold">
                        Book Now
                      </span>
                    </div>
                  </button>
                ))}
                </div>
              )}
            </main>
          </>
        )}

        {activeTab === "booking" && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Bookings</h2>
              <p className="text-gray-600">View and manage your bookings</p>
              <button
                onClick={() => router.push("/line-app/bookings")}
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                View All Bookings
              </button>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Assistant</h2>
              <BrowseAIAssistant
                shops={shops}
                selectedPrefecture={selectedPrefecture !== "all" ? selectedPrefecture : undefined}
                selectedCity={undefined}
                selectedCategoryId={selectedCategory !== "all" ? selectedCategory : undefined}
                searchQuery={searchQuery || undefined}
                locale="ja"
              />
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">チャット</h2>
              <p className="text-gray-600 mb-4">LINEチャットでAIアシスタントと会話できます</p>
              <button
                onClick={() => router.push("/line-app/chat")}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Open Chat
              </button>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex justify-around">
              <button
                onClick={() => navigateToTab("search")}
                className={`flex flex-col items-center py-2 ${activeTab === "search" ? "text-blue-600" : "text-gray-600"}`}
              >
                <span className="text-2xl">🔍</span>
                <span className="text-xs mt-1">検索</span>
              </button>
              <button
                onClick={() => navigateToTab("booking")}
                className={`flex flex-col items-center py-2 ${activeTab === "booking" ? "text-blue-600" : "text-gray-600"}`}
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs mt-1">予約</span>
              </button>
              <button
                onClick={() => navigateToTab("ai")}
                className={`flex flex-col items-center py-2 ${activeTab === "ai" ? "text-blue-600" : "text-gray-600"}`}
              >
                <span className="text-2xl">🤖</span>
                <span className="text-xs mt-1">AI相談</span>
              </button>
              <button
                onClick={() => navigateToTab("chat")}
                className={`flex flex-col items-center py-2 ${activeTab === "chat" ? "text-blue-600" : "text-gray-600"}`}
              >
                <span className="text-2xl">💬</span>
                <span className="text-xs mt-1">チャット</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </BrowseAIProvider>
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

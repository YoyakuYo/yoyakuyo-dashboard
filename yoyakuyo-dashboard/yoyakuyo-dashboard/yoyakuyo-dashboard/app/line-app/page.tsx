"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { useLineAppI18n } from "./i18n";

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

// Simple multi-language labels for LINE app UI
const LINE_LANGS = ["ja", "en", "es", "pt", "ko", "zh"] as const;
type LineLang = (typeof LINE_LANGS)[number];

const normalizeLineLang = (lang: string): LineLang => {
  if (lang.startsWith("pt")) return "pt";
  if (lang === "es") return "es";
  if (lang === "ko") return "ko";
  if (lang === "zh") return "zh";
  if (lang === "en") return "en";
  return "ja";
};

const lineTexts = {
  languageLabel: {
    ja: "言語:",
    en: "Language:",
    es: "Idioma:",
    pt: "Idioma:",
    ko: "언어:",
    zh: "语言：",
  },
  searchPlaceholder: {
    ja: "店舗名、場所で検索...",
    en: "Search shops by name, location...",
    es: "Buscar tiendas por nombre o ubicación...",
    pt: "Busque lojas por nome ou localização...",
    ko: "상호명이나 위치로 매장을 검색하세요...",
    zh: "按店名或位置搜索店铺...",
  },
  allCategories: {
    ja: "すべてのカテゴリ",
    en: "All Categories",
    es: "Todas las categorías",
    pt: "Todas as categorias",
    ko: "전체 카테고리",
    zh: "所有类别",
  },
  cat_beauty: {
    ja: "美容サービス",
    en: "Beauty Services",
    es: "Servicios de belleza",
    pt: "Serviços de beleza",
    ko: "미용 서비스",
    zh: "美容服务",
  },
  cat_spa: {
    ja: "スパ・温泉・リラクゼーション",
    en: "Spa & Onsen",
    es: "Spa y onsen",
    pt: "Spa e onsen",
    ko: "스파 & 온천",
    zh: "水疗与温泉",
  },
  cat_hotels: {
    ja: "ホテル・宿泊",
    en: "Hotels & Stays",
    es: "Hoteles y estancias",
    pt: "Hotéis e estadias",
    ko: "호텔 및 숙박",
    zh: "酒店与住宿",
  },
  cat_dining: {
    ja: "飲食・居酒屋",
    en: "Dining & Izakaya",
    es: "Restaurantes e izakayas",
    pt: "Restaurantes e izakayas",
    ko: "식당 & 이자카야",
    zh: "餐饮和居酒屋",
  },
  cat_clinics: {
    ja: "クリニック・医療",
    en: "Clinics & Medical Care",
    es: "Clínicas y atención médica",
    pt: "Clínicas e cuidados médicos",
    ko: "클리닉 & 의료",
    zh: "诊所与医疗护理",
  },
  cat_activities: {
    ja: "アクティビティ・スポーツ",
    en: "Activities & Sports",
    es: "Actividades y deportes",
    pt: "Atividades e esportes",
    ko: "액티비티 & 스포츠",
    zh: "活动与运动",
  },
  allPrefectures: {
    ja: "すべての都道府県",
    en: "All Prefectures",
    es: "Todas las prefecturas",
    pt: "Todas as províncias",
    ko: "전체 지역",
    zh: "所有都道府县",
  },
  pref_tokyo: {
    ja: "東京",
    en: "Tokyo",
    es: "Tokio",
    pt: "Tóquio",
    ko: "도쿄",
    zh: "东京",
  },
  pref_osaka: {
    ja: "大阪",
    en: "Osaka",
    es: "Osaka",
    pt: "Osaka",
    ko: "오사카",
    zh: "大阪",
  },
  pref_kyoto: {
    ja: "京都",
    en: "Kyoto",
    es: "Kioto",
    pt: "Quioto",
    ko: "교토",
    zh: "京都",
  },
  pref_hokkaido: {
    ja: "北海道",
    en: "Hokkaido",
    es: "Hokkaido",
    pt: "Hokkaido",
    ko: "홋카이도",
    zh: "北海道",
  },
  searchButton: {
    ja: "検索",
    en: "Search",
    es: "Buscar",
    pt: "Buscar",
    ko: "검색",
    zh: "搜索",
  },
  noShops: {
    ja: "店舗が見つかりませんでした。フィルターを調整してください。",
    en: "No shops found. Try adjusting your filters.",
    es: "No se encontraron tiendas. Intenta ajustar los filtros.",
    pt: "Nenhuma loja encontrada. Tente ajustar os filtros.",
    ko: "매장을 찾을 수 없습니다. 필터를 변경해 보세요.",
    zh: "未找到店铺，请尝试调整筛选条件。",
  },
  bookNow: {
    ja: "今すぐ予約",
    en: "Book Now",
    es: "Reservar ahora",
    pt: "Reservar agora",
    ko: "지금 예약",
    zh: "立即预约",
  },
  bookingsTitle: {
    ja: "予約一覧",
    en: "My Bookings",
    es: "Mis reservas",
    pt: "Minhas reservas",
    ko: "내 예약",
    zh: "我的预约",
  },
  bookingsSubtitle: {
    ja: "予約を表示・管理する",
    en: "View and manage your bookings",
    es: "Ver y gestionar tus reservas",
    pt: "Ver e gerenciar suas reservas",
    ko: "예약을 확인하고 관리하세요",
    zh: "查看和管理您的预约",
  },
  bookingsButton: {
    ja: "すべての予約を表示",
    en: "View All Bookings",
    es: "Ver todas las reservas",
    pt: "Ver todas as reservas",
    ko: "모든 예약 보기",
    zh: "查看全部预约",
  },
  inboxTitle: {
    ja: "受信箱",
    en: "Inbox",
    es: "Bandeja de entrada",
    pt: "Caixa de entrada",
    ko: "받은 메시지함",
    zh: "收件箱",
  },
  inboxSubtitle: {
    ja: "メッセージを管理するには、受信箱ページに移動してください。",
    en: "Navigate to the inbox page to manage your messages.",
    es: "Ve a la página de bandeja de entrada para gestionar tus mensajes.",
    pt: "Vá para a página da caixa de entrada para gerenciar suas mensagens.",
    ko: "메시지를 관리하려면 받은 메시지함 페이지로 이동하세요.",
    zh: "前往收件箱页面管理您的消息。",
  },
  inboxButton: {
    ja: "受信箱を開く",
    en: "Open Inbox",
    es: "Abrir bandeja de entrada",
    pt: "Abrir caixa de entrada",
    ko: "받은 메시지함 열기",
    zh: "打开收件箱",
  },
  aiTitle: {
    ja: "AIアシスタント",
    en: "AI Assistant",
    es: "Asistente de IA",
    pt: "Assistente de IA",
    ko: "AI 도우미",
    zh: "AI 助手",
  },
  aiSubtitle: {
    ja: "右下のチャットバブルを使用してAIアシスタントとチャットしてください。",
    en: "Open the AI tab to chat with the AI assistant.",
    es: "Usa la burbuja de chat flotante en la esquina inferior derecha para hablar con el asistente de IA.",
    pt: "Use a bolha de chat flutuante no canto inferior direito para falar com o assistente de IA.",
    ko: "오른쪽 하단의 말풍선을 눌러 AI 도우미와 대화하세요.",
    zh: "使用右下角的聊天气泡与 AI 助手聊天。",
  },
  nav_search: {
    ja: "検索",
    en: "Search",
    es: "Buscar",
    pt: "Buscar",
    ko: "검색",
    zh: "搜索",
  },
  nav_booking: {
    ja: "予約",
    en: "Booking",
    es: "Reservas",
    pt: "Reservas",
    ko: "예약",
    zh: "预约",
  },
  nav_inbox: {
    ja: "受信箱",
    en: "Inbox",
    es: "Bandeja",
    pt: "Caixa",
    ko: "받은함",
    zh: "收件箱",
  },
  nav_ai: {
    ja: "AI相談",
    en: "AI Help",
    es: "Ayuda IA",
    pt: "Ajuda IA",
    ko: "AI 도움",
    zh: "AI 帮助",
  },
  favoritesTitle: {
    ja: "保存したお店",
    en: "Saved Shops",
    es: "Tiendas guardadas",
    pt: "Lojas salvas",
    ko: "저장된 가게",
    zh: "已保存的店铺",
  },
  favoritesSubtitle: {
    ja: "お気に入りに追加したお店を確認できます。",
    en: "See the shops you have saved as favorites.",
    es: "Ve las tiendas que has guardado como favoritas.",
    pt: "Veja as lojas que você salvou como favoritas.",
    ko: "즐겨찾기에 추가한 가게를 확인하세요.",
    zh: "查看您收藏的店铺。",
  },
  favoritesButton: {
    ja: "保存したお店を見る",
    en: "View Saved Shops",
    es: "Ver tiendas guardadas",
    pt: "Ver lojas salvas",
    ko: "저장된 가게 보기",
    zh: "查看已保存的店铺",
  },
  nav_favorites: {
    ja: "保存",
    en: "Saved",
    es: "Guardados",
    pt: "Salvos",
    ko: "저장됨",
    zh: "已保存",
  },
};

function LineAppPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLineAppI18n();
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [lineUser, setLineUser] = useState<any>(null);
  const [lineUserId, setLineUserId] = useState<string>("");
  const [lineCustomerProfileId, setLineCustomerProfileId] = useState<string>("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("search");

  const langKey = normalizeLineLang(language);
  const tx = (key: keyof typeof lineTexts) => {
    const entry = lineTexts[key];
    return entry[langKey] || entry.en;
  };

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

        // Initialize LIFF with proper configuration
        await window.liff.init({ 
          liffId: LIFF_ID,
          // Enable automatic login redirect
          withLoginOnExternalBrowser: true,
        });
        setLiffInitialized(true);
        
        // STEP 4: Detect entry point (QR, Rich Menu, or Chat)
        const urlParams = new URLSearchParams(window.location.search);
        const entryPoint = urlParams.get('entry') || 
                          (urlParams.get('liff.state') ? 'richmenu' : 'direct');
        console.log('[LIFF] Entry point detected:', entryPoint);
        
        // Store entry point for analytics/debugging
        if (entryPoint) {
          sessionStorage.setItem('liff_entry_point', entryPoint);
        }

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

        // STEP 4: FIX LIFF LOGIN FLOW - Proper persistence
        // Call liff.login() if not logged in - this persists the session
        if (!window.liff.isLoggedIn()) {
          console.log('[LIFF] User not logged in, calling liff.login()...');
          try {
            // liff.login() will redirect to LINE login page if needed
            // After login, LINE will redirect back to this LIFF app
            window.liff.login({
              redirectUri: window.location.href, // Return to same URL after login
            });
            return; // Will redirect, so don't continue
          } catch (loginErr: any) {
            console.error('[LIFF] Login error:', loginErr);
            // If login fails, try without redirectUri (default behavior)
            try {
              window.liff.login();
              return;
            } catch (fallbackErr) {
              console.error('[LIFF] Fallback login error:', fallbackErr);
              setError("Failed to login to LINE. Please try again.");
              setLoading(false);
              return;
            }
          }
        }
        
        console.log('[LIFF] User is logged in, continuing...');

        // Get profile ONLY after init success and isInClient check
        const profile = await window.liff.getProfile();
        
        if (!profile || !profile.userId) {
          setError("Failed to get LINE profile");
          setLoading(false);
          return;
        }

        setLineUser(profile);
        setLineUserId(profile.userId);
        
        // CRITICAL: Get ID token and verify to get canonical user_id
        try {
          const idToken = await window.liff.getIDToken();
          if (idToken) {
            const verifyResponse = await fetch(`${apiUrl}/api/line/liff/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ id_token: idToken }),
            });
            
            if (verifyResponse.ok) {
              const userData = await verifyResponse.json();
              // Store canonical user_id for booking creation
              if (userData.user_id) {
                // Store in sessionStorage for use in booking creation
                sessionStorage.setItem('canonical_user_id', userData.user_id);
                if (userData.customer_profile_id) {
                  setLineCustomerProfileId(userData.customer_profile_id);
                }
              }
            } else {
              console.warn('ID token verification failed, falling back to legacy sync');
              // Fallback to legacy sync
              const syncResult = await syncLineUser(profile.userId, profile.displayName, profile.pictureUrl);
              if (syncResult?.customerProfileId) {
                setLineCustomerProfileId(syncResult.customerProfileId);
              }
            }
          } else {
            // No ID token available, use legacy sync
            const syncResult = await syncLineUser(profile.userId, profile.displayName, profile.pictureUrl);
            if (syncResult?.customerProfileId) {
              setLineCustomerProfileId(syncResult.customerProfileId);
            }
          }
        } catch (tokenError) {
          console.error('Error getting ID token:', tokenError);
          // Fallback to legacy sync
          const syncResult = await syncLineUser(profile.userId, profile.displayName, profile.pictureUrl);
          if (syncResult?.customerProfileId) {
            setLineCustomerProfileId(syncResult.customerProfileId);
          }
        }
        
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
      
      if (response.ok) {
        const userData = await response.json();
        return { customerProfileId: userData.id };
      } else {
        console.error("Failed to sync LINE user");
        return null;
      }
    } catch (error) {
      console.error("Error syncing LINE user:", error);
      return null;
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
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-14 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900">{t("appName")}</h1>
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
                    placeholder={tx("searchPlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">{tx("allCategories")}</option>
                      <option value="beauty_services">{tx("cat_beauty")}</option>
                      <option value="spa_onsen_relaxation">{tx("cat_spa")}</option>
                      <option value="hotels_stays">{tx("cat_hotels")}</option>
                      <option value="dining_izakaya">{tx("cat_dining")}</option>
                      <option value="clinics_medical_care">{tx("cat_clinics")}</option>
                      <option value="activities_sports">{tx("cat_activities")}</option>
                    </select>
                    <select
                      value={selectedPrefecture}
                      onChange={(e) => setSelectedPrefecture(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">{tx("allPrefectures")}</option>
                      <option value="tokyo">{tx("pref_tokyo")}</option>
                      <option value="osaka">{tx("pref_osaka")}</option>
                      <option value="kyoto">{tx("pref_kyoto")}</option>
                      <option value="hokkaido">{tx("pref_hokkaido")}</option>
                    </select>
                  </div>
                  <button
                    onClick={searchShops}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {tx("searchButton")}
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
                  <p className="text-gray-600">{tx("noShops")}</p>
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
                        {tx("bookNow")}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{tx("bookingsTitle")}</h2>
              <p className="text-gray-600">{tx("bookingsSubtitle")}</p>
              <button
                onClick={() => router.push("/line-app/bookings")}
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {tx("bookingsButton")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "inbox" && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{tx("inboxTitle")}</h2>
              <p className="text-gray-600 mb-4">{tx("inboxSubtitle")}</p>
              <button
                onClick={() => router.push("/line-app/inbox")}
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {tx("inboxButton")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{tx("aiTitle")}</h2>
              <p className="text-gray-600">{tx("aiSubtitle")}</p>
              <p className="mt-4 text-gray-500">AI Assistant is no longer available.</p>
            </div>
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{tx("favoritesTitle")}</h2>
              <p className="text-gray-600">{tx("favoritesSubtitle")}</p>
              <button
                onClick={() => router.push("/line-app/favorites")}
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {tx("favoritesButton")}
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
                <span className="text-xs mt-1">{tx("nav_search")}</span>
              </button>
              <button
                onClick={() => navigateToTab("booking")}
                className={`flex flex-col items-center py-2 ${activeTab === "booking" ? "text-blue-600" : "text-gray-600"}`}
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs mt-1">{tx("nav_booking")}</span>
              </button>
              <button
                onClick={() => navigateToTab("inbox")}
                className={`flex flex-col items-center py-2 ${activeTab === "inbox" ? "text-blue-600" : "text-gray-600"}`}
              >
                <span className="text-2xl">📬</span>
                <span className="text-xs mt-1">{tx("nav_inbox")}</span>
              </button>
              <button
                onClick={() => navigateToTab("ai")}
                className={`flex flex-col items-center py-2 ${activeTab === "ai" ? "text-blue-600" : "text-gray-600"}`}
              >
                <span className="text-2xl">🤖</span>
                <span className="text-xs mt-1">{tx("nav_ai")}</span>
              </button>
              <button
                onClick={() => navigateToTab("favorites")}
                className={`flex flex-col items-center py-2 ${
                  activeTab === "favorites" ? "text-blue-600" : "text-gray-600"
                }`}
              >
                <span className="text-2xl">⭐</span>
                <span className="text-xs mt-1">{tx("nav_favorites")}</span>
              </button>
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LineAppPageContent />
    </Suspense>
  );
}

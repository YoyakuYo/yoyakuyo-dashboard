module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/apps/dashboard/lib/supabaseClient.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/lib/supabaseClient.ts
// Browser/client Supabase instance for authentication
__turbopack_context__.s([
    "getSupabaseClient",
    ()=>getSupabaseClient,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-ssr] (ecmascript) <locals>");
;
let supabaseInstance = null;
function getSupabaseClient() {
    // Return existing instance if already created
    if (supabaseInstance) {
        return supabaseInstance;
    }
    // Only check env vars in the browser (runtime)
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // During SSR/build, return a placeholder client
    supabaseInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])("https://placeholder.supabase.co", "placeholder-key", {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
    return supabaseInstance;
}
const supabase = new Proxy({}, {
    get (_target, prop) {
        const client = getSupabaseClient();
        const value = client[prop];
        // If it's a function, bind it to the client
        if (typeof value === "function") {
            return value.bind(client);
        }
        return value;
    }
});
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/dashboard/lib/useAuth.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/lib/useAuth.tsx
// Auth context and hook for Supabase authentication
__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/supabaseClient.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Check if Supabase is properly configured
        const supabaseUrl = ("TURBOPACK compile-time value", "https://neguwrjykwnfhdlwktpd.supabase.co");
        const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3V3cmp5a3duZmhkbHdrdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjcwNDcsImV4cCI6MjA3ODYwMzA0N30.vMM0ckYDzz7aUD9ClF4uZhE0OFucnVlAG5khrQOu7uY");
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Get initial session - wrap in try-catch to handle any errors gracefully
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then(({ data: { session }, error })=>{
                if (error) {
                    console.error("Error getting session:", error);
                }
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }).catch((error)=>{
                console.error("Error initializing auth:", error);
                setLoading(false);
            });
            // Listen for auth changes
            try {
                const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange((_event, session)=>{
                    setSession(session);
                    setUser(session?.user ?? null);
                    setLoading(false);
                });
                return ()=>{
                    try {
                        subscription.unsubscribe();
                    } catch (e) {
                    // Ignore unsubscribe errors
                    }
                };
            } catch (error) {
                console.error("Error setting up auth listener:", error);
                setLoading(false);
                return ()=>{};
            }
        } catch (error) {
            console.error("Error in auth initialization:", error);
            setLoading(false);
        }
    }, []);
    const signOut = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
            // Still redirect even if signOut fails
            router.push("/");
        }
    }, [
        router
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            user,
            session,
            loading,
            signOut
        }), [
        user,
        session,
        loading,
        signOut
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/lib/useAuth.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
function useAuth() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
}),
"[project]/apps/dashboard/app/components/AuthGuard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/AuthGuard.tsx
// Component to protect routes - redirects to login if not authenticated
__turbopack_context__.s([
    "default",
    ()=>AuthGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function AuthGuard({ children }) {
    const { user, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!loading && !user) {
            router.push("/");
        }
    }, [
        user,
        loading,
        router
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gray-50 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/AuthGuard.tsx",
                        lineNumber: 24,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-gray-600",
                        children: "Loading..."
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/AuthGuard.tsx",
                        lineNumber: 25,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/components/AuthGuard.tsx",
                lineNumber: 23,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/dashboard/app/components/AuthGuard.tsx",
            lineNumber: 22,
            columnNumber: 7
        }, this);
    }
    if (!user) {
        return null; // Will redirect
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
}),
"[project]/apps/dashboard/lib/i18n.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/lib/i18n.ts
// Simple i18n utility with cookie persistence
__turbopack_context__.s([
    "getLanguage",
    ()=>getLanguage,
    "setLanguage",
    ()=>setLanguage,
    "t",
    ()=>t
]);
'use client';
const COOKIE_NAME = 'bookyo_language';
const DEFAULT_LANGUAGE = 'en';
function getLanguage() {
    if ("TURBOPACK compile-time truthy", 1) return DEFAULT_LANGUAGE;
    //TURBOPACK unreachable
    ;
    const cookies = undefined;
    const langCookie = undefined;
}
function setLanguage(lang) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    // Set cookie with 1 year expiration
    const expires = undefined;
}
// Translations
const translations = {
    en: {
        'nav.shops': 'Shops',
        'nav.ownerLogin': 'Owner Login',
        'nav.myShop': 'My Shop',
        'nav.aiAssistant': 'AI Assistant',
        'nav.logout': 'Logout',
        'home.title': 'Bookyo',
        'home.subtitle': 'AI-powered booking assistant for salons in Tokyo',
        'home.browseShops': 'Browse Shops',
        'home.ownerLogin': 'Owner Login',
        'booking.title': 'Book an appointment',
        'booking.service': 'Service',
        'booking.staff': 'Staff (Optional)',
        'booking.date': 'Date',
        'booking.time': 'Time',
        'booking.yourName': 'Your Name',
        'booking.yourEmail': 'Your Email',
        'booking.phone': 'Phone (Optional)',
        'booking.submit': 'Book Now',
        'booking.success': 'Booking request submitted successfully!',
        'chat.title': 'Chat with AI assistant',
        'chat.placeholder': 'Type your message...',
        'chat.send': 'Send',
        'categories.all': 'All Categories',
        'categories.barbershop': 'Barbershop',
        'categories.beauty_salon': 'Beauty Salon',
        'categories.eyelash': 'Eyelash',
        'categories.general_salon': 'General Salon',
        'categories.hair_salon': 'Hair Salon',
        'categories.nail_salon': 'Nail Salon',
        'categories.spa_massage': 'Spa & Massage',
        'categories.unknown': 'Unknown',
        'shops.search': 'Search by name',
        'shops.categories': 'Categories',
        'shops.found': 'Found',
        'shops.shop': 'shop',
        'shops.shops': 'shops',
        'shops.viewDetails': 'View details',
        'shops.loading': 'Loading shops...',
        'shops.noShops': 'No shops found',
        'shops.tryAdjusting': 'Try adjusting your search or category filter',
        'shops.notAvailable': 'No shops are available at the moment'
    },
    ja: {
        'nav.shops': '店舗',
        'nav.ownerLogin': 'オーナーログイン',
        'nav.myShop': 'マイショップ',
        'nav.aiAssistant': 'AIアシスタント',
        'nav.logout': 'ログアウト',
        'home.title': 'Bookyo',
        'home.subtitle': '東京のサロン向けAI予約アシスタント',
        'home.browseShops': '店舗を探す',
        'home.ownerLogin': 'オーナーログイン',
        'booking.title': '予約する',
        'booking.service': 'サービス',
        'booking.staff': 'スタッフ（任意）',
        'booking.date': '日付',
        'booking.time': '時間',
        'booking.yourName': 'お名前',
        'booking.yourEmail': 'メールアドレス',
        'booking.phone': '電話番号（任意）',
        'booking.submit': '予約する',
        'booking.success': '予約リクエストが送信されました！',
        'chat.title': 'AIアシスタントとチャット',
        'chat.placeholder': 'メッセージを入力...',
        'chat.send': '送信',
        'categories.all': 'すべてのカテゴリー',
        'categories.barbershop': '理髪店',
        'categories.beauty_salon': '美容サロン',
        'categories.eyelash': 'まつげ',
        'categories.general_salon': '総合サロン',
        'categories.hair_salon': 'ヘアサロン',
        'categories.nail_salon': 'ネイルサロン',
        'categories.spa_massage': 'スパ・マッサージ',
        'categories.unknown': '不明',
        'shops.search': '名前で検索',
        'shops.categories': 'カテゴリー',
        'shops.found': '見つかりました',
        'shops.shop': '店舗',
        'shops.shops': '店舗',
        'shops.viewDetails': '詳細を見る',
        'shops.loading': '店舗を読み込み中...',
        'shops.noShops': '店舗が見つかりませんでした',
        'shops.tryAdjusting': '検索またはカテゴリーフィルターを調整してみてください',
        'shops.notAvailable': '現在利用可能な店舗はありません'
    }
};
function t(key, lang = getLanguage()) {
    return translations[lang]?.[key] || key;
}
}),
"[project]/apps/dashboard/app/components/LanguageToggle.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LanguageToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/i18n.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function LanguageToggle() {
    // Start with null to avoid hydration mismatch - will be set after mount
    const [currentLang, setCurrentLang] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Only read language after component mounts (client-side only)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMounted(true);
        const lang = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguage"])();
        setCurrentLang(lang);
    }, []);
    const handleLanguageChange = (lang)=>{
        if (lang === currentLang) return; // Don't do anything if already selected
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$i18n$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setLanguage"])(lang);
        setCurrentLang(lang);
        // Trigger the languageChanged event that NextIntlProvider listens to
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    };
    // During SSR and before mount, render with default 'en' styling to avoid mismatch
    // After mount, use the actual language
    const activeLang = mounted ? currentLang : 'en';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-1 border border-gray-300 rounded-lg p-0.5 bg-white shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>handleLanguageChange('en'),
                className: `px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeLang === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`,
                "aria-label": "Switch to English",
                type: "button",
                children: "EN"
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/LanguageToggle.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>handleLanguageChange('ja'),
                className: `px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeLang === 'ja' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`,
                "aria-label": "Switch to Japanese",
                type: "button",
                children: "日本語"
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/LanguageToggle.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/components/LanguageToggle.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/dashboard/app/components/Header.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/Header.tsx
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/LanguageToggle.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const Header = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].memo(()=>{
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTranslations"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full flex items-center justify-between px-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-2xl font-bold",
                    children: t('nav.dashboard')
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/Header.tsx",
                    lineNumber: 13,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/Header.tsx",
                    lineNumber: 14,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/apps/dashboard/app/components/Header.tsx",
            lineNumber: 12,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/components/Header.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
Header.displayName = 'Header';
const __TURBOPACK__default__export__ = Header;
}),
"[project]/apps/dashboard/app/components/Sidebar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/Sidebar.tsx
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/supabaseClient.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
const Sidebar = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].memo(()=>{
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const { signOut, user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTranslations"])();
    const [unreadCount, setUnreadCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const subscriptionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const apiUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
    // Load unread summary on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (user?.id) {
            loadUnreadSummary();
            subscribeToUnreadUpdates();
        }
        return ()=>{
            if (subscriptionRef.current) {
                const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, [
        user
    ]);
    const loadUnreadSummary = async ()=>{
        try {
            const res = await fetch(`${apiUrl}/messages/owner/unread-summary`, {
                headers: {
                    'x-user-id': user?.id || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error loading unread summary:', error);
        }
    };
    const subscribeToUnreadUpdates = ()=>{
        if (!user?.id) return;
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
        // Subscribe to shop_messages for the owner's shops
        // We'll need to get shop IDs first, but for now, subscribe to all and filter client-side
        const channel = supabase.channel('unread_messages_updates').on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'shop_messages',
            filter: 'sender_type=eq.customer'
        }, ()=>{
            // Reload unread summary when new customer message arrives
            loadUnreadSummary();
        }).on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'shop_messages',
            filter: 'read_by_owner=eq.true'
        }, ()=>{
            // Reload unread summary when messages are marked as read
            loadUnreadSummary();
        }).subscribe();
        subscriptionRef.current = channel;
    };
    const navItems = [
        {
            href: '/shops',
            label: t('nav.myShop'),
            icon: '🏪'
        },
        {
            href: '/assistant',
            label: t('nav.aiAssistant'),
            icon: '🤖',
            badge: unreadCount > 0 ? unreadCount : undefined
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "hidden lg:block w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 pt-16",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
            className: "p-4 flex flex-col h-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "space-y-1 flex-1",
                    children: navItems.map((item)=>{
                        const isActive = pathname === item.href || item.href !== '/' && pathname?.startsWith(item.href);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: item.href,
                                className: `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${isActive ? 'bg-blue-600 text-white font-bold' : 'text-gray-300 hover:bg-slate-800 hover:text-white'}`,
                                children: [
                                    isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                        lineNumber: 113,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xl",
                                        children: item.icon
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                        lineNumber: 115,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `font-medium ${isActive ? 'font-bold' : ''}`,
                                        children: item.label
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                        lineNumber: 116,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    item.badge !== undefined && item.badge > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-auto bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center",
                                        children: item.badge
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                        lineNumber: 118,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                lineNumber: 104,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        }, item.href, false, {
                            fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                            lineNumber: 103,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0));
                    })
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                    lineNumber: 99,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-auto pt-4 border-t border-gray-700",
                    children: [
                        user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-4 py-2 mb-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400 truncate",
                                title: user.email || undefined,
                                children: user.email
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                lineNumber: 132,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                            lineNumber: 131,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: signOut,
                            className: "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xl",
                                    children: "🚪"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                    lineNumber: 141,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium",
                                    children: t('nav.logout')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                    lineNumber: 142,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                            lineNumber: 137,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                    lineNumber: 129,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
            lineNumber: 98,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
        lineNumber: 97,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
Sidebar.displayName = 'Sidebar';
const __TURBOPACK__default__export__ = Sidebar;
}),
"[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/PublicLayoutWrapper.tsx
// Wrapper that applies public layout to all public routes
// This is used in the root layout to ensure all public routes get the header
__turbopack_context__.s([
    "default",
    ()=>PublicLayoutWrapper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/LanguageToggle.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
function PublicLayoutWrapper({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-white border-b border-gray-200 sticky top-0 z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between h-16",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/",
                                className: "text-3xl font-bold text-blue-600 hover:text-blue-700",
                                children: "Bookyo"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
                                lineNumber: 21,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                className: "flex items-center gap-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
                                    lineNumber: 25,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
                                lineNumber: 24,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
                        lineNumber: 20,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
                    lineNumber: 19,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                children: children
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/dashboard/app/components/DashboardLayout.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/DashboardLayout.tsx
// Applies dashboard layout (Header, Sidebar, AuthGuard) only to non-auth routes
// Auth routes are handled by (auth)/layout.tsx and render without dashboard UI
__turbopack_context__.s([
    "default",
    ()=>DashboardLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$AuthGuard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/AuthGuard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/Header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$Sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/Sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$PublicLayoutWrapper$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
// Routes that should NOT have dashboard layout (Header, Sidebar, AuthGuard)
const authRoutes = [];
function DashboardLayout({ children }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    // Route matching rules:
    // DashboardLayout should ONLY apply to routes in the (owner) folder
    // All other routes are public and use (public)/layout.tsx
    const isOwnerRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const route = pathname || "";
        // Owner dashboard routes (protected, should use DashboardLayout)
        const ownerRoutes = [
            '/shops',
            '/assistant'
        ];
        // Check exact matches
        if (ownerRoutes.includes(route)) {
            return true;
        }
        // Check if it starts with owner route patterns
        if (route.startsWith('/shops/services') || route.startsWith('/shops/staff')) {
            return true;
        }
        // Everything else is public (uses (public)/layout.tsx)
        return false;
    }, [
        pathname
    ]);
    const isAuthRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>authRoutes.includes(pathname || ""), [
        pathname
    ]);
    console.log("🔥 DashboardLayout evaluating route:", pathname, "| isOwnerRoute:", isOwnerRoute, "| isAuthRoute:", isAuthRoute);
    // For auth routes, just pass through - login and signup handle their own styling
    if (isAuthRoute) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: children
        }, void 0, false);
    }
    // For public routes, wrap with PublicLayoutWrapper (includes header)
    if (!isOwnerRoute) {
        console.log("🔥 DashboardLayout: Applying PublicLayoutWrapper for public route:", pathname);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$PublicLayoutWrapper$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            children: children
        }, void 0, false, {
            fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
            lineNumber: 62,
            columnNumber: 12
        }, this);
    }
    // For owner dashboard routes, apply full dashboard layout with AuthGuard
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$AuthGuard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$Sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "lg:ml-64 pt-16 min-h-screen bg-gray-50",
                children: children
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/dashboard/messages/en.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"common":{"save":"Save Changes","cancel":"Cancel","edit":"Edit","delete":"Delete","create":"Create","update":"Update","submit":"Submit","submitting":"Submitting...","loading":"Loading...","error":"Error","success":"Success","or":"or","confirm":"Confirm","reject":"Reject","yes":"Yes","no":"No","close":"Close","for":"for","keepIt":"Keep It","updating":"Updating...","cancelling":"Cancelling...","rescheduling":"Rescheduling...","unknown":"Unknown","back":"Back","next":"Next","previous":"Previous","search":"Search","filter":"Filter","actions":"Actions","photos":"Photos","name":"Name","email":"Email","phone":"Phone","address":"Address","website":"Website","description":"Description","price":"Price","duration":"Duration","status":"Status","date":"Date","time":"Time","optional":"Optional","required":"Required"},"auth":{"signInToShop":"Sign in to your shop","password":"Password","signingIn":"Signing in...","signIn":"Sign In","dontHaveAccount":"Don't have an account?","createOwnerAccount":"Create Owner Account","ownerName":"Owner Name","creatingAccount":"Creating account...","signUp":"Sign Up","alreadyHaveAccount":"Already have an account?","unexpectedError":"An unexpected error occurred","fillRequiredFields":"Please fill in all required fields","failedToSetupAccount":"Failed to setup account"},"nav":{"shops":"Shops","ownerLogin":"Owner Login","myShop":"My Shop","aiAssistant":"AI Assistant","logout":"Logout","dashboard":"Bookyo Dashboard"},"home":{"title":"Bookyo","subtitle":"AI-powered booking assistant for salons in Tokyo","browseShops":"Browse Shops","ownerLogin":"Owner Login","joinAsOwner":"Join as Owner","feature1":"Let customers book online 24/7","feature2":"AI assistant handles messages, reschedules and cancellations","feature3":"Simple dashboard for shop owners","forCustomers":"For Customers","forCustomersDesc":"Find salons by category, browse services, and book online 24/7.","forOwners":"For Owners","forOwnersDesc":"Connect your shop, manage bookings, and let AI handle customer messages.","aiAssistance":"AI Assistance","aiAssistanceDesc":"Handles customer messages in Japanese or English, manages reschedules and cancellations."},"booking":{"title":"Book an appointment","service":"Service","staff":"Staff","staffOptional":"Staff (Optional)","date":"Date","time":"Time","yourName":"Your Name","yourEmail":"Your Email","phone":"Phone (Optional)","submit":"Book Now","success":"Booking request submitted successfully!","ownerWillConfirm":"The shop owner will confirm your appointment.","anyAvailable":"Any available","chooseService":"Choose Service","chooseStaff":"Choose Staff","chooseDate":"Choose Date","chooseTimeslot":"Choose Timeslot","yourInformation":"Your Information","selectService":"Select a service","selectStaff":"Select a staff member","checkAvailability":"Check Availability","bookAppointment":"Book Appointment","bookingSuccessful":"Booking successful!","bookingFailed":"Booking failed. Please try again.","tryAgain":"Please try again","timeslotSelected":"Timeslot selected!","cancelBooking":"Cancel Booking","rescheduleBooking":"Reschedule Booking","cancelConfirm":"Are you sure you want to cancel this booking","rescheduleConfirm":"Reschedule booking for","current":"Current","newDateTime":"New Date & Time","cancelled":"Booking cancelled successfully!","rescheduled":"Booking rescheduled successfully!","failedToCancel":"Failed to cancel booking","failedToReschedule":"Failed to reschedule booking","failedToCreate":"Failed to create booking. Please try again."},"chat":{"title":"Chat with AI assistant","placeholder":"Type your message...","send":"Send","startConversation":"Start a conversation with the AI assistant","noResponse":"No response","errorEncountered":"Sorry, I encountered an error","cannotRespond":"Sorry, I cannot respond at the moment. Please try again later."},"categories":{"all":"All Categories","barbershop":"Barbershop","beauty_salon":"Beauty Salon","eyelash":"Eyelash","general_salon":"General Salon","hair_salon":"Hair Salon","nail_salon":"Nail Salon","spa_massage":"Spa & Massage","unknown":"Unknown"},"shops":{"search":"Search by name","categories":"Categories","found":"Found","shop":"shop","shops":"shops","viewDetails":"View details","loading":"Loading shops...","noShops":"No shops found","tryAdjusting":"Try adjusting your search or category filter","notAvailable":"No shops are available at the moment","contact":"Contact","services":"Services","staff":"Staff","bookNow":"Book Now","shopNotFound":"Shop not found","shopDoesNotExist":"The shop you are looking for does not exist.","invalidShopId":"Invalid shop ID","failedToFetchShop":"Failed to fetch shop","photos":"Photos","photosWillAppear":"Photos will appear here once added by the shop owner.","noServicesAvailable":"No services available.","noStaffAvailable":"No staff information available."},"myShop":{"title":"My Shop","overview":"Overview","services":"Services","staff":"Staff","bookings":"Bookings","photos":"Photos","shopName":"Shop Name","address":"Address","phone":"Phone","email":"Email","website":"Website","city":"City","country":"Country","zipCode":"Zip Code","description":"Description","saveChanges":"Save Changes","noShop":"You don't have a shop yet.","createShop":"Create Shop","claimShop":"Claim Shop","getStarted":"Get Started","createNewShop":"Create New Shop","startFresh":"Start fresh with a new shop listing.","claimExistingShop":"Claim Existing Shop","claimOwnership":"Claim ownership of an existing shop.","selectUnclaimedShop":"Select an unclaimed shop to claim ownership.","noUnclaimedShops":"No unclaimed shops available.","loading":"Loading shop details...","createNewService":"Create New Service","editService":"Edit Service","serviceName":"Service Name","serviceDescription":"Description","servicePrice":"Price ($)","serviceDuration":"Duration (minutes)","noServices":"No services yet.","createFirstService":"Create your first service above.","addStaff":"Add New Staff Member","editStaff":"Edit Staff Member","firstName":"First Name","lastName":"Last Name","staffPhone":"Phone","staffEmail":"Email","noStaff":"No staff yet.","addFirstStaff":"Add your first staff member above.","noBookings":"No bookings yet.","bookingsWillAppear":"Bookings will appear here when customers make reservations.","customer":"Customer","dateTime":"Date & Time","service":"Service","pending":"pending","confirmed":"confirmed","rejected":"rejected","cancelled":"cancelled","completed":"completed","confirmBooking":"Confirm Booking","rejectBooking":"Reject Booking","areYouSureConfirm":"Are you sure you want to confirm this booking","areYouSureReject":"Are you sure you want to reject this booking","bookingConfirmed":"Booking confirmed successfully!","bookingRejected":"Booking rejected successfully!","failedToUpdateStatus":"Failed to update booking status","uploadLogo":"Upload Logo","changeLogo":"Change Logo","uploadCover":"Upload Cover","changeCover":"Change Cover","uploadGalleryPhoto":"Upload Gallery Photo","shopLogo":"Shop Logo","coverPhoto":"Cover Photo","galleryPhotos":"Gallery Photos","noLogo":"No logo","shopOverview":"Shop Overview","editShop":"Edit Shop","noGalleryPhotos":"No gallery photos yet. Upload your first photo!","noCoverPhoto":"No cover photo","photoUploaded":"Photo uploaded successfully!","photoDeleted":"Photo deleted successfully!","failedToUpload":"Failed to upload photo","failedToDelete":"Failed to delete photo","photosSaved":"Photos saved successfully!"},"status":{"pending":"Pending","confirmed":"Confirmed","rejected":"Rejected","cancelled":"Cancelled","completed":"Completed"}});}),
"[project]/apps/dashboard/messages/ja.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"common":{"save":"変更を保存","cancel":"キャンセル","edit":"編集","delete":"削除","create":"作成","update":"更新","submit":"送信","submitting":"送信中...","loading":"読み込み中...","error":"エラー","success":"成功","or":"または","confirm":"確認","reject":"拒否","yes":"はい","no":"いいえ","close":"閉じる","for":"の","keepIt":"保持する","updating":"更新中...","cancelling":"キャンセル中...","rescheduling":"変更中...","unknown":"不明","back":"戻る","next":"次へ","previous":"前へ","search":"検索","filter":"フィルター","actions":"アクション","photos":"写真","name":"名前","email":"メール","phone":"電話","address":"住所","website":"ウェブサイト","description":"説明","price":"価格","duration":"時間","status":"ステータス","date":"日付","time":"時間","optional":"任意","required":"必須"},"auth":{"signInToShop":"店舗にサインイン","password":"パスワード","signingIn":"サインイン中...","signIn":"サインイン","dontHaveAccount":"アカウントをお持ちでない場合","createOwnerAccount":"オーナーアカウントを作成","ownerName":"お名前","creatingAccount":"アカウント作成中...","signUp":"アカウントを作成","alreadyHaveAccount":"すでにアカウントをお持ちの場合","unexpectedError":"予期しないエラーが発生しました","fillRequiredFields":"すべての必須フィールドに入力してください","failedToSetupAccount":"アカウントの設定に失敗しました"},"nav":{"shops":"店舗","ownerLogin":"オーナーログイン","myShop":"マイショップ","aiAssistant":"AIアシスタント","logout":"ログアウト","dashboard":"Bookyoダッシュボード"},"home":{"title":"Bookyo","subtitle":"東京のサロン向けAI予約アシスタント","browseShops":"店舗を探す","ownerLogin":"オーナーログイン","joinAsOwner":"オーナーとして参加","feature1":"お客様が24時間365日オンラインで予約可能","feature2":"AIアシスタントがメッセージ、予約変更、キャンセルを処理","feature3":"店舗オーナー向けのシンプルなダッシュボード","forCustomers":"お客様向け","forCustomersDesc":"カテゴリ別にサロンを検索し、サービスを閲覧し、24時間365日オンラインで予約できます。","forOwners":"オーナー向け","forOwnersDesc":"店舗を接続し、予約を管理し、AIに顧客メッセージを処理させます。","aiAssistance":"AIアシスタント","aiAssistanceDesc":"日本語または英語で顧客メッセージを処理し、予約変更とキャンセルを管理します。"},"booking":{"title":"予約する","service":"サービス","staff":"スタッフ","staffOptional":"スタッフ（任意）","date":"日付","time":"時間","yourName":"お名前","yourEmail":"メールアドレス","phone":"電話番号（任意）","submit":"予約する","success":"予約リクエストが送信されました！","ownerWillConfirm":"店舗オーナーが予約を確認します。","anyAvailable":"利用可能なスタッフ","chooseService":"サービスを選択","chooseStaff":"スタッフを選択","chooseDate":"日付を選択","chooseTimeslot":"時間帯を選択","yourInformation":"お客様情報","selectService":"サービスを選択してください","selectStaff":"スタッフを選択してください","checkAvailability":"空き状況を確認","bookAppointment":"予約する","bookingSuccessful":"予約が完了しました！","bookingFailed":"予約に失敗しました。もう一度お試しください。","tryAgain":"もう一度お試しください","timeslotSelected":"時間帯が選択されました！","cancelBooking":"予約をキャンセル","rescheduleBooking":"予約を変更","cancelConfirm":"この予約をキャンセルしてもよろしいですか","rescheduleConfirm":"予約を変更","current":"現在","newDateTime":"新しい日時","cancelled":"予約がキャンセルされました！","rescheduled":"予約が変更されました！","failedToCancel":"予約のキャンセルに失敗しました","failedToReschedule":"予約の変更に失敗しました","failedToCreate":"予約の作成に失敗しました。もう一度お試しください。"},"chat":{"title":"AIアシスタントとチャット","placeholder":"メッセージを入力...","send":"送信","startConversation":"AIアシスタントとの会話を始めましょう","noResponse":"応答がありません","errorEncountered":"申し訳ございませんが、エラーが発生しました","cannotRespond":"申し訳ございませんが、現在応答できません。後でもう一度お試しください。"},"categories":{"all":"すべてのカテゴリー","barbershop":"理髪店","beauty_salon":"美容サロン","eyelash":"まつげ","general_salon":"総合サロン","hair_salon":"ヘアサロン","nail_salon":"ネイルサロン","spa_massage":"スパ・マッサージ","unknown":"不明"},"shops":{"search":"名前で検索","categories":"カテゴリー","found":"見つかりました","shop":"店舗","shops":"店舗","viewDetails":"詳細を見る","loading":"店舗を読み込み中...","noShops":"店舗が見つかりませんでした","tryAdjusting":"検索またはカテゴリーフィルターを調整してみてください","notAvailable":"現在利用可能な店舗はありません","contact":"連絡先","services":"サービス","staff":"スタッフ","bookNow":"今すぐ予約","shopNotFound":"店舗が見つかりません","shopDoesNotExist":"お探しの店舗は存在しません。","invalidShopId":"無効な店舗ID","failedToFetchShop":"店舗の取得に失敗しました","photos":"写真","photosWillAppear":"店舗オーナーが写真を追加すると、ここに表示されます。","noServicesAvailable":"利用可能なサービスがありません。","noStaffAvailable":"スタッフ情報がありません。"},"myShop":{"title":"マイショップ","overview":"概要","services":"サービス","staff":"スタッフ","bookings":"予約","photos":"写真","shopName":"店舗名","address":"住所","phone":"電話","email":"メール","website":"ウェブサイト","city":"市区町村","country":"国","zipCode":"郵便番号","description":"説明","saveChanges":"変更を保存","noShop":"まだ店舗がありません。","createShop":"店舗を作成","claimShop":"店舗を申請","getStarted":"始める","createNewShop":"新しい店舗を作成","startFresh":"新しい店舗リストから始めます。","claimExistingShop":"既存の店舗を申請","claimOwnership":"既存の店舗の所有権を申請します。","selectUnclaimedShop":"所有権を申請する未申請の店舗を選択してください。","noUnclaimedShops":"利用可能な未申請の店舗はありません。","loading":"店舗詳細を読み込み中...","createNewService":"新しいサービスを作成","editService":"サービスを編集","serviceName":"サービス名","serviceDescription":"説明","servicePrice":"価格（円）","serviceDuration":"時間（分）","noServices":"まだサービスがありません。","createFirstService":"上記で最初のサービスを作成してください。","addStaff":"新しいスタッフを追加","editStaff":"スタッフを編集","firstName":"名","lastName":"姓","staffPhone":"電話","staffEmail":"メール","noStaff":"まだスタッフがありません。","addFirstStaff":"上記で最初のスタッフを追加してください。","noBookings":"まだ予約がありません。","bookingsWillAppear":"お客様が予約をすると、ここに表示されます。","customer":"お客様","dateTime":"日時","service":"サービス","pending":"保留中","confirmed":"確認済み","rejected":"拒否","cancelled":"キャンセル済み","completed":"完了","confirmBooking":"予約を確認","rejectBooking":"予約を拒否","areYouSureConfirm":"この予約を確認してもよろしいですか","areYouSureReject":"この予約を拒否してもよろしいですか","bookingConfirmed":"予約が確認されました！","bookingRejected":"予約が拒否されました！","failedToUpdateStatus":"予約ステータスの更新に失敗しました","uploadLogo":"ロゴをアップロード","changeLogo":"ロゴを変更","uploadCover":"カバー写真をアップロード","changeCover":"カバー写真を変更","uploadGalleryPhoto":"ギャラリー写真をアップロード","shopLogo":"店舗ロゴ","coverPhoto":"カバー写真","galleryPhotos":"ギャラリー写真","noLogo":"ロゴなし","shopOverview":"店舗概要","editShop":"店舗を編集","noGalleryPhotos":"まだギャラリー写真がありません。最初の写真をアップロードしてください！","noCoverPhoto":"カバー写真がありません","photoUploaded":"写真がアップロードされました！","photoDeleted":"写真が削除されました！","failedToUpload":"写真のアップロードに失敗しました","failedToDelete":"写真の削除に失敗しました","photosSaved":"写真が保存されました！"},"status":{"pending":"保留中","confirmed":"確認済み","rejected":"拒否","cancelled":"キャンセル済み","completed":"完了"}});}),
"[project]/apps/dashboard/app/components/NextIntlProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NextIntlProviderWrapper",
    ()=>NextIntlProviderWrapper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$shared$2f$NextIntlClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__NextIntlClientProvider$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js [app-ssr] (ecmascript) <export default as NextIntlClientProvider>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
// Import default messages for SSR
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$en$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/apps/dashboard/messages/en.json (json)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$ja$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/apps/dashboard/messages/ja.json (json)");
'use client';
;
;
;
;
;
// Ensure messages are always valid objects
const defaultMessages = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$en$2e$json__$28$json$29$__["default"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$en$2e$json__$28$json$29$__["default"] === 'object' ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$en$2e$json__$28$json$29$__["default"] : {};
const defaultJaMessages = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$ja$2e$json__$28$json$29$__["default"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$ja$2e$json__$28$json$29$__["default"] === 'object' ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$ja$2e$json__$28$json$29$__["default"] : {};
function NextIntlProviderWrapper({ children }) {
    const [locale, setLocale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('en');
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(defaultMessages); // Start with default messages
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Get locale from cookie or localStorage
        const getStoredLocale = ()=>{
            if ("TURBOPACK compile-time truthy", 1) return 'en';
            //TURBOPACK unreachable
            ;
            // Try cookie first
            const cookies = undefined;
            const langCookie = undefined;
            // Fallback to localStorage
            const stored = undefined;
        };
        const currentLocale = getStoredLocale();
        setLocale(currentLocale);
        // Set messages based on locale
        if (currentLocale === 'ja') {
            setMessages(defaultJaMessages);
        } else {
            setMessages(defaultMessages);
        }
    }, []);
    // Listen for locale changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleStorageChange = ()=>{
            // Check both cookie and localStorage
            const cookies = document.cookie.split(';');
            const langCookie = cookies.find((c)=>c.trim().startsWith('bookyo_language='));
            let newLocale = null;
            if (langCookie) {
                const value = langCookie.split('=')[1]?.trim();
                if (value === 'en' || value === 'ja') {
                    newLocale = value;
                }
            }
            // Fallback to localStorage if cookie not found
            if (!newLocale) {
                const stored = localStorage.getItem('bookyo_language');
                if (stored === 'en' || stored === 'ja') {
                    newLocale = stored;
                }
            }
            if (newLocale) {
                // Use functional update to avoid dependency on locale
                setLocale((prevLocale)=>{
                    if (prevLocale !== newLocale) {
                        setMessages(newLocale === 'ja' ? defaultJaMessages : defaultMessages);
                        return newLocale;
                    }
                    return prevLocale;
                });
            }
        };
        // Listen for custom event when language changes
        window.addEventListener('languageChanged', handleStorageChange);
        window.addEventListener('storage', handleStorageChange);
        return ()=>{
            window.removeEventListener('languageChanged', handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // Empty dependency array - only set up listeners once
    // Ensure messages is always a valid object with proper structure
    const safeMessages = messages && typeof messages === 'object' ? messages : defaultMessages;
    // Validate that shops.photos exists in messages
    if (("TURBOPACK compile-time value", "development") === 'development' && safeMessages.shops && !safeMessages.shops.photos) {
        console.warn('⚠️ shops.photos missing in messages, adding fallback');
        safeMessages.shops = {
            ...safeMessages.shops,
            photos: locale === 'ja' ? '写真' : 'Photos'
        };
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$shared$2f$NextIntlClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__NextIntlClientProvider$3e$__["NextIntlClientProvider"], {
        locale: locale,
        messages: safeMessages,
        onError: (error)=>{
            // In development, log but don't crash
            if ("TURBOPACK compile-time truthy", 1) {
                console.warn('next-intl error:', error);
            }
        },
        getMessageFallback: ({ namespace, key, error })=>{
            // Provide fallback for missing messages
            if (key === 'shops.photos') {
                return locale === 'ja' ? '写真' : 'Photos';
            }
            return key;
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/components/NextIntlProvider.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b951dcfd._.js.map
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/dashboard/lib/supabaseClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/lib/supabaseClient.ts
// Browser/client Supabase instance for authentication
__turbopack_context__.s([
    "getSupabaseClient",
    ()=>getSupabaseClient,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-client] (ecmascript) <locals>");
;
let supabaseInstance = null;
function getSupabaseClient() {
    // Return existing instance if already created
    if (supabaseInstance) {
        return supabaseInstance;
    }
    // Only check env vars in the browser (runtime)
    if ("TURBOPACK compile-time truthy", 1) {
        const supabaseUrl = ("TURBOPACK compile-time value", "https://neguwrjykwnfhdlwktpd.supabase.co");
        const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3V3cmp5a3duZmhkbHdrdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjcwNDcsImV4cCI6MjA3ODYwMzA0N30.vMM0ckYDzz7aUD9ClF4uZhE0OFucnVlAG5khrQOu7uY");
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Create real client with actual credentials
        supabaseInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        return supabaseInstance;
    }
    //TURBOPACK unreachable
    ;
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/lib/useAuth.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/lib/useAuth.tsx
// Auth context and hook for Supabase authentication
__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/supabaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            // Check if Supabase is properly configured
            const supabaseUrl = ("TURBOPACK compile-time value", "https://neguwrjykwnfhdlwktpd.supabase.co");
            const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3V3cmp5a3duZmhkbHdrdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjcwNDcsImV4cCI6MjA3ODYwMzA0N30.vMM0ckYDzz7aUD9ClF4uZhE0OFucnVlAG5khrQOu7uY");
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            // Get initial session - wrap in try-catch to handle any errors gracefully
            try {
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then({
                    "AuthProvider.useEffect": ({ data: { session }, error })=>{
                        if (error) {
                            console.error("Error getting session:", error);
                        }
                        setSession(session);
                        setUser(session?.user ?? null);
                        setLoading(false);
                    }
                }["AuthProvider.useEffect"]).catch({
                    "AuthProvider.useEffect": (error)=>{
                        console.error("Error initializing auth:", error);
                        setLoading(false);
                    }
                }["AuthProvider.useEffect"]);
                // Listen for auth changes (this fires when session is set/updated/removed)
                try {
                    const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                        "AuthProvider.useEffect": (event, session)=>{
                            // Update session and user state whenever auth state changes
                            setSession(session);
                            setUser(session?.user ?? null);
                            setLoading(false);
                            // Log auth events for debugging (only in development)
                            if ("TURBOPACK compile-time truthy", 1) {
                                console.log('Auth state changed:', event, session ? 'Session active' : 'No session');
                            }
                        }
                    }["AuthProvider.useEffect"]);
                    return ({
                        "AuthProvider.useEffect": ()=>{
                            try {
                                subscription.unsubscribe();
                            } catch (e) {
                            // Ignore unsubscribe errors
                            }
                        }
                    })["AuthProvider.useEffect"];
                } catch (error) {
                    console.error("Error setting up auth listener:", error);
                    setLoading(false);
                    return ({
                        "AuthProvider.useEffect": ()=>{}
                    })["AuthProvider.useEffect"];
                }
            } catch (error) {
                console.error("Error in auth initialization:", error);
                setLoading(false);
            }
        }
    }["AuthProvider.useEffect"], []);
    const signOut = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[signOut]": async ()=>{
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
                router.push("/");
            } catch (error) {
                console.error("Error signing out:", error);
                // Still redirect even if signOut fails
                router.push("/");
            }
        }
    }["AuthProvider.useCallback[signOut]"], [
        router
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AuthProvider.useMemo[value]": ()=>({
                user,
                session,
                loading,
                signOut
            })
    }["AuthProvider.useMemo[value]"], [
        user,
        session,
        loading,
        signOut
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/lib/useAuth.tsx",
        lineNumber: 106,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "qxqwjy8lx5qPBxSlZzRL7ZU+6ZE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/components/AuthGuard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/AuthGuard.tsx
// Component to protect routes - redirects to login if not authenticated
__turbopack_context__.s([
    "default",
    ()=>AuthGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function AuthGuard({ children }) {
    _s();
    const { user, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthGuard.useEffect": ()=>{
            if (!loading && !user) {
                router.push("/");
            }
        }
    }["AuthGuard.useEffect"], [
        user,
        loading,
        router
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gray-50 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/AuthGuard.tsx",
                        lineNumber: 24,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(AuthGuard, "Zr2WDa/YWeMetzDhcnOimt0LiKE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AuthGuard;
var _c;
__turbopack_context__.k.register(_c, "AuthGuard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/lib/i18n.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
const COOKIE_NAME = 'yoyaku_yo_language';
const DEFAULT_LANGUAGE = 'en';
function getLanguage() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const cookies = document.cookie.split(';');
    const langCookie = cookies.find((c)=>c.trim().startsWith(`${COOKIE_NAME}=`));
    if (langCookie) {
        const value = langCookie.split('=')[1]?.trim();
        if (value === 'en' || value === 'ja') {
            return value;
        }
    }
    return DEFAULT_LANGUAGE;
}
function setLanguage(lang) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Set cookie with 1 year expiration
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${COOKIE_NAME}=${lang}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    // Also set in localStorage for immediate access
    localStorage.setItem(COOKIE_NAME, lang);
}
// Translations
const translations = {
    en: {
        'nav.shops': 'Shops',
        'nav.ownerLogin': 'Owner Login',
        'nav.myShop': 'My Shop',
        'nav.aiAssistant': 'AI Assistant',
        'nav.logout': 'Logout',
        'home.title': 'Yoyaku Yo',
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
        'home.title': 'Yoyaku Yo',
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/components/LanguageToggle.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LanguageToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/i18n.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function LanguageToggle() {
    _s();
    // Start with null to avoid hydration mismatch - will be set after mount
    const [currentLang, setCurrentLang] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Only read language after component mounts (client-side only)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LanguageToggle.useEffect": ()=>{
            setMounted(true);
            const lang = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLanguage"])();
            setCurrentLang(lang);
        }
    }["LanguageToggle.useEffect"], []);
    const handleLanguageChange = (lang)=>{
        if (lang === currentLang) return; // Don't do anything if already selected
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setLanguage"])(lang);
        setCurrentLang(lang);
        // Trigger the languageChanged event that NextIntlProvider listens to
        if ("TURBOPACK compile-time truthy", 1) {
            window.dispatchEvent(new CustomEvent('languageChanged'));
            // Small delay to ensure state updates, then reload
            setTimeout(()=>{
                window.location.reload();
            }, 100);
        }
    };
    // During SSR and before mount, render with default 'en' styling to avoid mismatch
    // After mount, use the actual language
    const activeLang = mounted ? currentLang : 'en';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-1 border border-gray-300 rounded-lg p-0.5 bg-white shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
_s(LanguageToggle, "dRShOG5OHcfTxI0Bp/rjssPFWbg=");
_c = LanguageToggle;
var _c;
__turbopack_context__.k.register(_c, "LanguageToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/components/Header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/Header.tsx
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/LanguageToggle.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const Header = /*#__PURE__*/ _s(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_c = _s(()=>{
    _s();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full flex items-center justify-between px-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-2xl font-bold",
                    children: t('nav.dashboard')
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/Header.tsx",
                    lineNumber: 13,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
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
}, "h6+q2O3NJKPY5uL0BIJGLIanww8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"]
    ];
})), "h6+q2O3NJKPY5uL0BIJGLIanww8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"]
    ];
});
_c1 = Header;
Header.displayName = 'Header';
const __TURBOPACK__default__export__ = Header;
var _c, _c1;
__turbopack_context__.k.register(_c, "Header$React.memo");
__turbopack_context__.k.register(_c1, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/lib/apiClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/lib/apiClient.ts
// Centralized API client for making authenticated requests to the backend API
__turbopack_context__.s([
    "ApiClient",
    ()=>ApiClient,
    "apiClient",
    ()=>apiClient,
    "apiUrl",
    ()=>apiUrl,
    "buildHeaders",
    ()=>buildHeaders,
    "getApiUrl",
    ()=>getApiUrl,
    "getUserId",
    ()=>getUserId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/supabaseClient.ts [app-client] (ecmascript)");
;
const apiUrl = ("TURBOPACK compile-time value", "http://localhost:3000");
/**
 * Get the API base URL from environment variables
 * @deprecated Use the exported `apiUrl` constant instead
 */ function getApiUrl() {
    return apiUrl || '';
}
/**
 * Get the current authenticated user ID
 */ async function getUserId() {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
}
/**
 * Build headers for API requests
 */ async function buildHeaders(customHeaders = {}) {
    const userId = await getUserId();
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
    };
    // Add user ID header if user is authenticated
    if (userId) {
        headers['x-user-id'] = userId;
    }
    return headers;
}
/**
 * Handle API response and parse JSON
 */ async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        if (isJson) {
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch  {
            // If JSON parsing fails, use default error message
            }
        } else {
            try {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = errorText;
                }
            } catch  {
            // If text parsing fails, use default error message
            }
        }
        throw new Error(errorMessage);
    }
    if (isJson) {
        return await response.json();
    }
    const text = await response.text();
    // Try to parse as JSON even if content-type doesn't say so
    try {
        return JSON.parse(text);
    } catch  {
        return text;
    }
}
/**
 * API Client class for making authenticated requests
 */ class ApiClient {
    baseUrl;
    constructor(){
        this.baseUrl = getApiUrl();
    }
    /**
   * Make a GET request
   */ async get(endpoint, options = {}) {
        const headers = await buildHeaders(options.headers);
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers,
            ...options
        });
        return handleResponse(response);
    }
    /**
   * Make a POST request
   */ async post(endpoint, data, options = {}) {
        const headers = await buildHeaders(options.headers);
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: data ? JSON.stringify(data) : undefined,
            ...options
        });
        return handleResponse(response);
    }
    /**
   * Make a PUT request
   */ async put(endpoint, data, options = {}) {
        const headers = await buildHeaders(options.headers);
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers,
            body: data ? JSON.stringify(data) : undefined,
            ...options
        });
        return handleResponse(response);
    }
    /**
   * Make a PATCH request
   */ async patch(endpoint, data, options = {}) {
        const headers = await buildHeaders(options.headers);
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: data ? JSON.stringify(data) : undefined,
            ...options
        });
        return handleResponse(response);
    }
    /**
   * Make a DELETE request
   */ async delete(endpoint, options = {}) {
        const headers = await buildHeaders(options.headers);
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers,
            ...options
        });
        return handleResponse(response);
    }
}
const apiClient = new ApiClient();
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/components/BookingNotificationContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/BookingNotificationContext.tsx
// Context for managing booking notification badge count
__turbopack_context__.s([
    "BookingNotificationProvider",
    ()=>BookingNotificationProvider,
    "useBookingNotifications",
    ()=>useBookingNotifications
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const BookingNotificationContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function BookingNotificationProvider({ children }) {
    _s();
    const [unreadBookingsCount, setUnreadBookingsCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BookingNotificationContext.Provider, {
        value: {
            unreadBookingsCount,
            setUnreadBookingsCount
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/components/BookingNotificationContext.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_s(BookingNotificationProvider, "ZREAk5BiJYYuOu30zjHCl1td8kg=");
_c = BookingNotificationProvider;
function useBookingNotifications() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(BookingNotificationContext);
    if (context === undefined) {
        throw new Error('useBookingNotifications must be used within a BookingNotificationProvider');
    }
    return context;
}
_s1(useBookingNotifications, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "BookingNotificationProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/components/Sidebar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/Sidebar.tsx
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/supabaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/apiClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/BookingNotificationContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
const Sidebar = /*#__PURE__*/ _s(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_c = _s(()=>{
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const { signOut, user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])();
    const [unreadCount, setUnreadCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const subscriptionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { unreadBookingsCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBookingNotifications"])();
    // Load unread summary on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Sidebar.useEffect": ()=>{
            if (user?.id) {
                loadUnreadSummary();
                subscribeToUnreadUpdates();
            }
            return ({
                "Sidebar.useEffect": ()=>{
                    if (subscriptionRef.current) {
                        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
                        supabase.removeChannel(subscriptionRef.current);
                    }
                }
            })["Sidebar.useEffect"];
        }
    }["Sidebar.useEffect"], [
        user
    ]);
    const loadUnreadSummary = async ()=>{
        try {
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/messages/owner/unread-summary`, {
                headers: {
                    'x-user-id': user?.id || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            // Silently handle connection errors (API server not running)
            if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                // API server is not running - this is expected during development
                setUnreadCount(0);
                return;
            }
            // Only log unexpected errors
            console.error('Error loading unread summary:', error);
        }
    };
    const subscribeToUnreadUpdates = ()=>{
        if (!user?.id) return;
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
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
            href: '/analytics',
            label: t('analytics.title'),
            icon: '📊'
        },
        {
            href: '/assistant',
            label: t('nav.aiAssistant'),
            icon: '🤖',
            badge: unreadCount > 0 ? unreadCount : undefined
        },
        {
            href: '/bookings',
            label: t('nav.bookings'),
            icon: '📅',
            badge: unreadBookingsCount > 0 ? unreadBookingsCount : undefined
        },
        {
            href: '/settings',
            label: 'Settings',
            icon: '⚙️'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "hidden lg:block w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 pt-16",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
            className: "p-4 flex flex-col h-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "space-y-1 flex-1",
                    children: navItems.map((item)=>{
                        const isActive = pathname === item.href || item.href !== '/' && pathname?.startsWith(item.href);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: item.href,
                                className: `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${isActive ? 'bg-blue-600 text-white font-bold' : 'text-gray-300 hover:bg-slate-800 hover:text-white'}`,
                                children: [
                                    isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                        lineNumber: 125,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xl",
                                        children: item.icon
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                        lineNumber: 127,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `font-medium ${isActive ? 'font-bold' : ''}`,
                                        children: item.label
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                        lineNumber: 128,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    item.badge !== undefined && item.badge > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-auto bg-[#3B82F6] text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center",
                                        children: item.badge
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                        lineNumber: 130,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                lineNumber: 116,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        }, item.href, false, {
                            fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                            lineNumber: 115,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0));
                    })
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                    lineNumber: 111,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-auto pt-4 border-t border-gray-700",
                    children: [
                        user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-4 py-2 mb-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400 truncate",
                                title: user.email || undefined,
                                children: user.email
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                lineNumber: 144,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                            lineNumber: 143,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: signOut,
                            className: "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xl",
                                    children: "🚪"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                    lineNumber: 153,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium",
                                    children: t('nav.logout')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                                    lineNumber: 154,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                            lineNumber: 149,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
                    lineNumber: 141,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
            lineNumber: 110,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/components/Sidebar.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
}, "SIgAKsVy/3TNtIWHxJ1fqSVqJtA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBookingNotifications"]
    ];
})), "SIgAKsVy/3TNtIWHxJ1fqSVqJtA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBookingNotifications"]
    ];
});
_c1 = Sidebar;
Sidebar.displayName = 'Sidebar';
const __TURBOPACK__default__export__ = Sidebar;
var _c, _c1;
__turbopack_context__.k.register(_c, "Sidebar$React.memo");
__turbopack_context__.k.register(_c1, "Sidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/PublicLayoutWrapper.tsx
// Wrapper that applies public layout to all public routes
// This is used in the root layout to ensure all public routes get the header
__turbopack_context__.s([
    "default",
    ()=>PublicLayoutWrapper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/LanguageToggle.tsx [app-client] (ecmascript)");
"use client";
;
;
;
function PublicLayoutWrapper({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-white border-b border-gray-200 sticky top-0 z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between h-16",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/",
                                className: "text-3xl font-bold text-blue-600 hover:text-blue-700",
                                children: "Yoyaku Yo"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx",
                                lineNumber: 21,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                className: "flex items-center gap-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
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
_c = PublicLayoutWrapper;
var _c;
__turbopack_context__.k.register(_c, "PublicLayoutWrapper");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/components/OwnerPowerBot.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/OwnerPowerBot.tsx
// Fixed bottom-right chat bubble for owner power bot
__turbopack_context__.s([
    "default",
    ()=>OwnerPowerBot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/supabaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/apiClient.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function OwnerPowerBot() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [ownerLanguage, setOwnerLanguage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('en');
    const [threadId, setThreadId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loadingThread, setLoadingThread] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const subscriptionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Load owner language
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OwnerPowerBot.useEffect": ()=>{
            if (user?.id) {
                fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/users/me`, {
                    headers: {
                        'x-user-id': user.id
                    }
                }).then({
                    "OwnerPowerBot.useEffect": (res)=>{
                        if (res.ok) {
                            return res.json();
                        }
                        return null;
                    }
                }["OwnerPowerBot.useEffect"]).then({
                    "OwnerPowerBot.useEffect": (data)=>{
                        if (data) {
                            setOwnerLanguage(data.preferredLanguage || 'en');
                        }
                    }
                }["OwnerPowerBot.useEffect"]).catch({
                    "OwnerPowerBot.useEffect": (error)=>{
                        // Silently handle connection errors (API server not running)
                        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                            console.error('Error loading owner language:', error);
                        }
                    }
                }["OwnerPowerBot.useEffect"]);
            }
        }
    }["OwnerPowerBot.useEffect"], [
        user,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]
    ]);
    // Get shop ID and owner thread
    const [shopId, setShopId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OwnerPowerBot.useEffect": ()=>{
            if (user?.id) {
                fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/shops`, {
                    headers: {
                        'x-user-id': user.id
                    }
                }).then({
                    "OwnerPowerBot.useEffect": (res)=>{
                        if (res.ok) {
                            return res.json();
                        }
                        return null;
                    }
                }["OwnerPowerBot.useEffect"]).then({
                    "OwnerPowerBot.useEffect": (shops)=>{
                        if (shops && Array.isArray(shops) && shops.length > 0) {
                            const firstShopId = shops[0].id;
                            setShopId(firstShopId);
                            // Get or create owner thread for this shop
                            fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/owner/thread?shopId=${firstShopId}`, {
                                headers: {
                                    'x-user-id': user.id
                                }
                            }).then({
                                "OwnerPowerBot.useEffect": (res)=>{
                                    if (res.ok) {
                                        return res.json();
                                    }
                                    return null;
                                }
                            }["OwnerPowerBot.useEffect"]).then({
                                "OwnerPowerBot.useEffect": (data)=>{
                                    if (data?.threadId) {
                                        setThreadId(data.threadId);
                                        // Load thread messages
                                        loadThreadMessages(data.threadId);
                                    }
                                }
                            }["OwnerPowerBot.useEffect"]).catch({
                                "OwnerPowerBot.useEffect": (error)=>{
                                    // Silently handle connection errors
                                    if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                                        console.error('Error loading owner thread:', error);
                                    }
                                }
                            }["OwnerPowerBot.useEffect"]).finally({
                                "OwnerPowerBot.useEffect": ()=>{
                                    setLoadingThread(false);
                                }
                            }["OwnerPowerBot.useEffect"]);
                        } else {
                            setLoadingThread(false);
                        }
                    }
                }["OwnerPowerBot.useEffect"]).catch({
                    "OwnerPowerBot.useEffect": (error)=>{
                        // Silently handle connection errors (API server not running)
                        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                            console.error('Error loading shops:', error);
                        }
                        setLoadingThread(false);
                    }
                }["OwnerPowerBot.useEffect"]);
            } else {
                setLoadingThread(false);
            }
        }
    }["OwnerPowerBot.useEffect"], [
        user,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]
    ]);
    // Load thread messages
    const loadThreadMessages = async (threadIdToLoad)=>{
        try {
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/messages/thread/${threadIdToLoad}`, {
                headers: {
                    'x-user-id': user?.id || ''
                }
            });
            if (res.ok) {
                const threadMessages = await res.json();
                // Convert to local Message format
                const convertedMessages = (Array.isArray(threadMessages) ? threadMessages : []).map((msg)=>({
                        id: msg.id,
                        content: msg.content,
                        sender: msg.senderType === 'owner' ? 'owner' : 'bot',
                        timestamp: new Date(msg.createdAt)
                    }));
                setMessages(convertedMessages);
            }
        } catch (error) {
            // Silently handle connection errors
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error loading thread messages:', error);
            }
        }
    };
    // Subscribe to real-time messages for owner thread
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OwnerPowerBot.useEffect": ()=>{
            if (threadId && isOpen) {
                const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
                const channel = supabase.channel(`owner_messages:thread_id=eq.${threadId}`).on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'shop_messages',
                    filter: `thread_id=eq.${threadId}`
                }, {
                    "OwnerPowerBot.useEffect.channel": (payload)=>{
                        const newMessage = payload.new;
                        if (newMessage && newMessage.thread_id === threadId) {
                            // Check if message already exists
                            setMessages({
                                "OwnerPowerBot.useEffect.channel": (prev)=>{
                                    const exists = prev.some({
                                        "OwnerPowerBot.useEffect.channel.exists": (msg)=>msg.id === newMessage.id
                                    }["OwnerPowerBot.useEffect.channel.exists"]);
                                    if (exists) return prev;
                                    return [
                                        ...prev,
                                        {
                                            id: newMessage.id,
                                            content: newMessage.content,
                                            sender: newMessage.sender_type === 'owner' ? 'owner' : 'bot',
                                            timestamp: new Date(newMessage.created_at)
                                        }
                                    ];
                                }
                            }["OwnerPowerBot.useEffect.channel"]);
                        }
                    }
                }["OwnerPowerBot.useEffect.channel"]).subscribe();
                subscriptionRef.current = channel;
                return ({
                    "OwnerPowerBot.useEffect": ()=>{
                        if (subscriptionRef.current) {
                            supabase.removeChannel(subscriptionRef.current);
                        }
                    }
                })["OwnerPowerBot.useEffect"];
            }
        }
    }["OwnerPowerBot.useEffect"], [
        threadId,
        isOpen
    ]);
    // Load messages when chat opens
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OwnerPowerBot.useEffect": ()=>{
            if (isOpen && threadId && messages.length === 0) {
                loadThreadMessages(threadId);
            }
        }
    }["OwnerPowerBot.useEffect"], [
        isOpen,
        threadId
    ]);
    // Scroll to bottom
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OwnerPowerBot.useEffect": ()=>{
            if (isOpen) {
                messagesEndRef.current?.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    }["OwnerPowerBot.useEffect"], [
        messages,
        isOpen
    ]);
    // Send command or chat message
    const handleSend = async (e)=>{
        e.preventDefault();
        if (!input.trim() || loading || !shopId) return;
        const command = input.trim();
        setInput('');
        setLoading(true);
        // Add owner message optimistically (will be replaced by real message from DB via real-time)
        const tempOwnerMsgId = `temp_${Date.now()}`;
        const ownerMsg = {
            id: tempOwnerMsgId,
            content: command,
            sender: 'owner',
            timestamp: new Date()
        };
        setMessages((prev)=>[
                ...prev,
                ownerMsg
            ]);
        try {
            // Build conversation history for context (last 10 messages)
            const conversationHistory = messages.slice(-10).map((msg)=>({
                    role: msg.sender === 'owner' ? 'user' : 'assistant',
                    content: msg.content
                }));
            // Parse and execute command OR chat
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/owner/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.id || ''
                },
                body: JSON.stringify({
                    shopId,
                    command,
                    ownerLanguage,
                    conversationHistory,
                    threadId: threadId
                })
            });
            if (res.ok) {
                const data = await res.json();
                // Update threadId if returned (for new threads)
                if (data.threadId && !threadId) {
                    setThreadId(data.threadId);
                }
                // Add bot response optimistically (will be replaced by real message from DB via real-time)
                const tempBotMsgId = `temp_${Date.now() + 1}`;
                const botMsg = {
                    id: tempBotMsgId,
                    content: data.message || 'Done!',
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages((prev)=>[
                        ...prev,
                        botMsg
                    ]);
                // Real-time subscription will replace optimistic messages with real ones from DB
                // Remove temp messages after a delay if they weren't replaced
                setTimeout(()=>{
                    setMessages((prev)=>prev.filter((msg)=>!msg.id.startsWith('temp_')));
                    // Reload to get all real messages
                    if (data.threadId || threadId) {
                        loadThreadMessages(data.threadId || threadId);
                    }
                }, 1000);
            } else {
                // Remove optimistic owner message on error
                setMessages((prev)=>prev.filter((msg)=>msg.id !== tempOwnerMsgId));
                const errorData = await res.json().catch(()=>({}));
                const errorMsg = {
                    id: (Date.now() + 1).toString(),
                    content: `Error: ${errorData.error || errorData.message || 'Failed to execute command'}`,
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages((prev)=>[
                        ...prev,
                        errorMsg
                    ]);
            }
        } catch (error) {
            // Remove optimistic owner message on error
            setMessages((prev)=>prev.filter((msg)=>msg.id !== tempOwnerMsgId));
            // Handle connection errors gracefully
            if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                const errorMsg = {
                    id: (Date.now() + 1).toString(),
                    content: 'Error: API server is not running. Please start the API server.',
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages((prev)=>[
                        ...prev,
                        errorMsg
                    ]);
            } else {
                console.error('Error executing command/chat:', error);
                const errorMsg = {
                    id: (Date.now() + 1).toString(),
                    content: 'Error: Could not execute command or chat',
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages((prev)=>[
                        ...prev,
                        errorMsg
                    ]);
            }
        } finally{
            setLoading(false);
        }
    };
    // Get bot title in owner's language
    const botTitle = ownerLanguage === 'ja' ? 'AIアシスタント' : 'AI Assistant';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            !isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsOpen(true),
                className: "fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group",
                "aria-label": "Open AI Assistant",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-8 h-8",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                            lineNumber: 327,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                        lineNumber: 326,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                        lineNumber: 329,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                lineNumber: 321,
                columnNumber: 9
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-3 h-3 bg-green-400 rounded-full animate-pulse"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                        lineNumber: 339,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "font-bold",
                                        children: botTitle
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                        lineNumber: 340,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                lineNumber: 338,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setIsOpen(false),
                                className: "text-white hover:text-gray-200 transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-5 h-5",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M6 18L18 6M6 6l12 12"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                        lineNumber: 347,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                    lineNumber: 346,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                lineNumber: 342,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                        lineNumber: 337,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50",
                        children: [
                            messages.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center text-gray-500 text-sm py-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-medium mb-2",
                                        children: "Chat with AI or give commands:"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                        lineNumber: 356,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "text-left space-y-1 text-xs",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: '• Commands: "Cancel Mario X44\'s booking"'
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                                lineNumber: 358,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: '• Commands: "Close salon August 10-16"'
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                                lineNumber: 359,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: '• Chat: "How many bookings today?"'
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                                lineNumber: 360,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: '• Chat: "What\'s the weather?"'
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                                lineNumber: 361,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                        lineNumber: 357,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                lineNumber: 355,
                                columnNumber: 15
                            }, this),
                            messages.map((msg)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `max-w-[80%] rounded-lg px-3 py-2 ${msg.sender === 'owner' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm",
                                            children: msg.content
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                            lineNumber: 377,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                        lineNumber: 370,
                                        columnNumber: 17
                                    }, this)
                                }, msg.id, false, {
                                    fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                    lineNumber: 366,
                                    columnNumber: 15
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: messagesEndRef
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                lineNumber: 381,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                        lineNumber: 353,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-t border-gray-200 p-3 bg-white rounded-b-xl",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleSend,
                            className: "flex gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    value: input,
                                    onChange: (e)=>setInput(e.target.value),
                                    placeholder: "Type a command or chat...",
                                    className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm",
                                    disabled: loading
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                    lineNumber: 387,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    disabled: loading || !input.trim(),
                                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
                                    children: loading ? '...' : '→'
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                                    lineNumber: 395,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                            lineNumber: 386,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                        lineNumber: 385,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/components/OwnerPowerBot.tsx",
                lineNumber: 335,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
_s(OwnerPowerBot, "A0WfK6ddaqOmuJ+DVLVyML1RJys=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = OwnerPowerBot;
var _c;
__turbopack_context__.k.register(_c, "OwnerPowerBot");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/lib/useBookingNotifications.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/lib/useBookingNotifications.ts
// Hook for subscribing to booking notifications via Supabase Realtime
__turbopack_context__.s([
    "useBookingNotificationsHook",
    ()=>useBookingNotificationsHook
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/supabaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/BookingNotificationContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/apiClient.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function useBookingNotificationsHook() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { setUnreadBookingsCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBookingNotifications"])();
    const subscriptionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const shopIdsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const reloadPendingCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBookingNotificationsHook.useCallback[reloadPendingCount]": async ()=>{
            if (!user?.id) return;
            try {
                const bookingsRes = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/bookings`, {
                    headers: {
                        'x-user-id': user.id
                    }
                });
                if (bookingsRes.ok) {
                    const bookingsData = await bookingsRes.json();
                    const bookings = Array.isArray(bookingsData) ? bookingsData : [];
                    const pendingCount = bookings.filter({
                        "useBookingNotificationsHook.useCallback[reloadPendingCount]": (booking)=>booking.status === 'pending'
                    }["useBookingNotificationsHook.useCallback[reloadPendingCount]"]).length;
                    setUnreadBookingsCount(pendingCount);
                }
            } catch (error) {
                // Silently handle connection errors (API server not running)
                if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                    console.error('Error reloading pending bookings count:', error);
                }
                setUnreadBookingsCount(0);
            }
        }
    }["useBookingNotificationsHook.useCallback[reloadPendingCount]"], [
        user?.id,
        setUnreadBookingsCount
    ]);
    const subscribeToBookingUpdates = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBookingNotificationsHook.useCallback[subscribeToBookingUpdates]": ()=>{
            if (!user?.id) return;
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
            // Subscribe to bookings table for INSERT and UPDATE events
            const channel = supabase.channel('booking_notifications').on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'bookings'
            }, {
                "useBookingNotificationsHook.useCallback[subscribeToBookingUpdates].channel": async (payload)=>{
                    const newBooking = payload.new;
                    // Check if booking belongs to owner's shop and is pending
                    if (newBooking && newBooking.status === 'pending') {
                        // If we have shop IDs cached, check immediately
                        if (shopIdsRef.current.length > 0 && shopIdsRef.current.includes(newBooking.shop_id)) {
                            // Reload count to ensure accuracy
                            await reloadPendingCount();
                        } else {
                            // Otherwise, reload count to be safe
                            await reloadPendingCount();
                        }
                    }
                }
            }["useBookingNotificationsHook.useCallback[subscribeToBookingUpdates].channel"]).on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'bookings'
            }, {
                "useBookingNotificationsHook.useCallback[subscribeToBookingUpdates].channel": async (payload)=>{
                    const updatedBooking = payload.new;
                    const oldBooking = payload.old;
                    // If status changed from pending to something else, decrement
                    if (oldBooking?.status === 'pending' && updatedBooking?.status !== 'pending') {
                        // Reload count to ensure accuracy
                        await reloadPendingCount();
                    } else if (oldBooking?.status !== 'pending' && updatedBooking?.status === 'pending') {
                        await reloadPendingCount();
                    }
                }
            }["useBookingNotificationsHook.useCallback[subscribeToBookingUpdates].channel"]).subscribe();
            subscriptionRef.current = channel;
        }
    }["useBookingNotificationsHook.useCallback[subscribeToBookingUpdates]"], [
        user?.id,
        reloadPendingCount,
        setUnreadBookingsCount
    ]);
    // Load initial pending bookings count and get shop IDs
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBookingNotificationsHook.useEffect": ()=>{
            if (!user?.id) {
                setUnreadBookingsCount(0);
                return;
            }
            const loadPendingBookingsCount = {
                "useBookingNotificationsHook.useEffect.loadPendingBookingsCount": async ()=>{
                    try {
                        // First, get shop IDs for this owner
                        const shopsRes = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/shops`, {
                            headers: {
                                'x-user-id': user.id
                            }
                        });
                        if (shopsRes.ok) {
                            const shopsData = await shopsRes.json();
                            const shops = Array.isArray(shopsData) ? shopsData : [];
                            shopIdsRef.current = shops.map({
                                "useBookingNotificationsHook.useEffect.loadPendingBookingsCount": (shop)=>shop.id
                            }["useBookingNotificationsHook.useEffect.loadPendingBookingsCount"]);
                            if (shopIdsRef.current.length === 0) {
                                setUnreadBookingsCount(0);
                                return;
                            }
                            // Get pending bookings count
                            const bookingsRes = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/bookings`, {
                                headers: {
                                    'x-user-id': user.id
                                }
                            });
                            if (bookingsRes.ok) {
                                const bookingsData = await bookingsRes.json();
                                const bookings = Array.isArray(bookingsData) ? bookingsData : [];
                                const pendingCount = bookings.filter({
                                    "useBookingNotificationsHook.useEffect.loadPendingBookingsCount": (booking)=>booking.status === 'pending'
                                }["useBookingNotificationsHook.useEffect.loadPendingBookingsCount"]).length;
                                setUnreadBookingsCount(pendingCount);
                            }
                        }
                    } catch (error) {
                        // Silently handle connection errors (API server not running)
                        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                            console.error('Error loading pending bookings count:', error);
                        }
                        setUnreadBookingsCount(0);
                    }
                }
            }["useBookingNotificationsHook.useEffect.loadPendingBookingsCount"];
            loadPendingBookingsCount();
            subscribeToBookingUpdates();
            return ({
                "useBookingNotificationsHook.useEffect": ()=>{
                    if (subscriptionRef.current) {
                        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
                        supabase.removeChannel(subscriptionRef.current);
                    }
                }
            })["useBookingNotificationsHook.useEffect"];
        }
    }["useBookingNotificationsHook.useEffect"], [
        user,
        setUnreadBookingsCount,
        subscribeToBookingUpdates
    ]);
}
_s(useBookingNotificationsHook, "MKDP4FufKly+GBllsIE+pCbwvvY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBookingNotifications"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/components/DashboardLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/components/DashboardLayout.tsx
// Applies dashboard layout (Header, Sidebar, AuthGuard) only to non-auth routes
// Auth routes are handled by (auth)/layout.tsx and render without dashboard UI
__turbopack_context__.s([
    "default",
    ()=>DashboardLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$AuthGuard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/AuthGuard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/Header.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$Sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/Sidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$PublicLayoutWrapper$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/PublicLayoutWrapper.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$OwnerPowerBot$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/OwnerPowerBot.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useBookingNotifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useBookingNotifications.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
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
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    // Route matching rules:
    // DashboardLayout should ONLY apply to routes in the (owner) folder
    // All other routes are public and use (public)/layout.tsx
    const isOwnerRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "DashboardLayout.useMemo[isOwnerRoute]": ()=>{
            const route = pathname || "";
            // Owner dashboard routes (protected, should use DashboardLayout)
            const ownerRoutes = [
                '/shops',
                '/assistant',
                '/bookings',
                '/settings'
            ];
            // Check exact matches
            if (ownerRoutes.includes(route)) {
                return true;
            }
            // Check if it starts with owner route patterns
            if (route.startsWith('/shops/services')) {
                return true;
            }
            // Everything else is public (uses (public)/layout.tsx)
            return false;
        }
    }["DashboardLayout.useMemo[isOwnerRoute]"], [
        pathname
    ]);
    const isAuthRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "DashboardLayout.useMemo[isAuthRoute]": ()=>authRoutes.includes(pathname || "")
    }["DashboardLayout.useMemo[isAuthRoute]"], [
        pathname
    ]);
    console.log("🔥 DashboardLayout evaluating route:", pathname, "| isOwnerRoute:", isOwnerRoute, "| isAuthRoute:", isAuthRoute);
    // For auth routes, just pass through - login and signup handle their own styling
    if (isAuthRoute) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: children
        }, void 0, false);
    }
    // For public routes, wrap with PublicLayoutWrapper (includes header)
    if (!isOwnerRoute) {
        console.log("🔥 DashboardLayout: Applying PublicLayoutWrapper for public route:", pathname);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$PublicLayoutWrapper$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            children: children
        }, void 0, false, {
            fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
            lineNumber: 66,
            columnNumber: 12
        }, this);
    }
    // For owner dashboard routes, apply full dashboard layout with AuthGuard
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$AuthGuard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BookingNotificationsWrapper, {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
                    lineNumber: 73,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$Sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
                    lineNumber: 74,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                    className: "lg:ml-64 pt-16 min-h-screen bg-gray-50",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$OwnerPowerBot$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
            lineNumber: 72,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/components/DashboardLayout.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_s(DashboardLayout, "au3rdSevTsc3k6Gci61bzg7QxEc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = DashboardLayout;
// Wrapper component to initialize booking notifications hook
function BookingNotificationsWrapper({ children }) {
    _s1();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useBookingNotifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBookingNotificationsHook"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s1(BookingNotificationsWrapper, "/45psYsY1tAraCmzeAO0JMeoZ8Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useBookingNotifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBookingNotificationsHook"]
    ];
});
_c1 = BookingNotificationsWrapper;
var _c, _c1;
__turbopack_context__.k.register(_c, "DashboardLayout");
__turbopack_context__.k.register(_c1, "BookingNotificationsWrapper");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/messages/en.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v(JSON.parse("{\"common\":{\"save\":\"Save Changes\",\"cancel\":\"Cancel\",\"edit\":\"Edit\",\"delete\":\"Delete\",\"create\":\"Create\",\"update\":\"Update\",\"submit\":\"Submit\",\"submitting\":\"Submitting...\",\"loading\":\"Loading...\",\"error\":\"Error\",\"success\":\"Success\",\"or\":\"or\",\"confirm\":\"Confirm\",\"reject\":\"Reject\",\"yes\":\"Yes\",\"no\":\"No\",\"close\":\"Close\",\"for\":\"for\",\"keepIt\":\"Keep It\",\"updating\":\"Updating...\",\"cancelling\":\"Cancelling...\",\"rescheduling\":\"Rescheduling...\",\"unknown\":\"Unknown\",\"back\":\"Back\",\"next\":\"Next\",\"previous\":\"Previous\",\"search\":\"Search\",\"filter\":\"Filter\",\"actions\":\"Actions\",\"photos\":\"Photos\",\"name\":\"Name\",\"email\":\"Email\",\"phone\":\"Phone\",\"address\":\"Address\",\"website\":\"Website\",\"description\":\"Description\",\"price\":\"Price\",\"duration\":\"Duration\",\"status\":\"Status\",\"date\":\"Date\",\"time\":\"Time\",\"optional\":\"Optional\",\"required\":\"Required\",\"characters\":\"characters\"},\"auth\":{\"signInToShop\":\"Sign in to your shop\",\"password\":\"Password\",\"signingIn\":\"Signing in...\",\"signIn\":\"Sign In\",\"dontHaveAccount\":\"Don't have an account?\",\"createOwnerAccount\":\"Create Owner Account\",\"ownerName\":\"Owner Name\",\"creatingAccount\":\"Creating account...\",\"signUp\":\"Sign Up\",\"alreadyHaveAccount\":\"Already have an account?\",\"unexpectedError\":\"An unexpected error occurred\",\"fillRequiredFields\":\"Please fill in all required fields\",\"failedToSetupAccount\":\"Failed to setup account\"},\"nav\":{\"shops\":\"Shops\",\"ownerLogin\":\"Owner Login\",\"myShop\":\"My Shop\",\"aiAssistant\":\"AI Assistant\",\"bookings\":\"Bookings\",\"logout\":\"Logout\",\"dashboard\":\"Yoyaku Yo Dashboard\"},\"home\":{\"title\":\"Yoyaku Yo\",\"subtitle\":\"AI-powered booking assistant for salons in Tokyo\",\"browseShops\":\"Browse Shops\",\"ownerLogin\":\"Owner Login\",\"joinAsOwner\":\"Join as Owner\",\"feature1\":\"Let customers book online 24/7\",\"feature2\":\"AI assistant handles messages, reschedules and cancellations\",\"feature3\":\"Simple dashboard for shop owners\",\"forCustomers\":\"For Customers\",\"forCustomersDesc\":\"Find salons by category, browse services, and book online 24/7.\",\"forOwners\":\"For Owners\",\"forOwnersDesc\":\"Connect your shop, manage bookings, and let AI handle customer messages.\",\"aiAssistance\":\"AI Assistance\",\"aiAssistanceDesc\":\"Handles customer messages in Japanese or English, manages reschedules and cancellations.\",\"heroTitle\":\"Yoyaku Yo\",\"heroSubtitle\":\"Where Beauty Meets Technology\",\"searchPlaceholder\":\"Search by shop, category, or area\",\"browseByCategory\":\"Browse by Category\",\"browseByArea\":\"Browse by Area\",\"nearbyServices\":\"Nearby Services\",\"howItWorks\":\"How It Works\",\"forCustomersTitle\":\"For Customers\",\"forCustomersBullet1\":\"Search salons by category\",\"forCustomersBullet2\":\"Book online 24/7\",\"forCustomersBullet3\":\"Easily select services and staff\",\"forOwnersTitle\":\"For Owners\",\"forOwnersBullet1\":\"Manage bookings and availability easily\",\"forOwnersBullet2\":\"Centralize customer information\",\"forOwnersBullet3\":\"Operate efficiently with a simple dashboard\",\"aiAssistanceTitle\":\"AI Assistance\",\"aiAssistanceBullet1\":\"Automatically respond to customer messages in Japanese/English\",\"aiAssistanceBullet2\":\"Handle reschedules and cancellations automatically\",\"aiAssistanceBullet3\":\"24/7 support\"},\"booking\":{\"title\":\"Book an appointment\",\"service\":\"Service\",\"staff\":\"Staff\",\"staffOptional\":\"Staff (Optional)\",\"date\":\"Date\",\"time\":\"Time\",\"yourName\":\"Your Name\",\"submit\":\"Book Now\",\"success\":\"Booking confirmed!\",\"confirmedMessage\":\"Your appointment is confirmed. Your personal ID is {customerId}. You can change or cancel anytime right here in this chat — just say hello again! ✨\",\"ownerWillConfirm\":\"The shop owner will confirm your appointment.\",\"anyAvailable\":\"Any available\",\"chooseService\":\"Choose Service\",\"chooseStaff\":\"Choose Staff\",\"chooseDate\":\"Choose Date\",\"chooseTimeslot\":\"Choose Timeslot\",\"yourInformation\":\"Your Information\",\"selectService\":\"Select a service\",\"selectStaff\":\"Select a staff member\",\"checkAvailability\":\"Check Availability\",\"bookAppointment\":\"Book Appointment\",\"bookingSuccessful\":\"Booking successful!\",\"bookingFailed\":\"Booking failed. Please try again.\",\"tryAgain\":\"Please try again\",\"timeslotSelected\":\"Timeslot selected!\",\"cancelBooking\":\"Cancel Booking\",\"rescheduleBooking\":\"Reschedule Booking\",\"cancelConfirm\":\"Are you sure you want to cancel this booking\",\"rescheduleConfirm\":\"Reschedule booking for\",\"current\":\"Current\",\"newDateTime\":\"New Date & Time\",\"cancelled\":\"Booking cancelled successfully!\",\"rescheduled\":\"Booking rescheduled successfully!\",\"failedToCancel\":\"Failed to cancel booking\",\"failedToReschedule\":\"Failed to reschedule booking\",\"failedToCreate\":\"Failed to create booking. Please try again.\"},\"chat\":{\"title\":\"Chat with AI assistant\",\"placeholder\":\"Type your message...\",\"send\":\"Send\",\"startConversation\":\"Start a conversation with the AI assistant\",\"noResponse\":\"No response\",\"errorEncountered\":\"Sorry, I encountered an error\",\"cannotRespond\":\"Sorry, I cannot respond at the moment. Please try again later.\"},\"categories\":{\"all\":\"All Categories\",\"barbershop\":\"Barbershop\",\"beauty_salon\":\"Beauty Salon\",\"eyelash\":\"Eyelash\",\"general_salon\":\"General Salon\",\"hair_salon\":\"Hair Salon\",\"nail_salon\":\"Nail Salon\",\"spa_massage\":\"Spa & Massage\",\"dental_clinic\":\"Dental Clinic\",\"womens_clinic\":\"Women's Clinic\",\"hotels_ryokan\":\"Hotels & Ryokan\",\"restaurants_izakaya\":\"Restaurants & Izakaya\",\"spas_onsen_bathhouses\":\"Spas, Onsen & Day-use Bathhouses\",\"golf_courses_ranges\":\"Golf Courses & Practice Ranges\",\"private_karaoke_rooms\":\"Private Karaoke Rooms\",\"unknown\":\"Unknown\"},\"prefectures\":{\"hokkaido\":\"Hokkaido\",\"aomori\":\"Aomori\",\"iwate\":\"Iwate\",\"miyagi\":\"Miyagi\",\"akita\":\"Akita\",\"yamagata\":\"Yamagata\",\"fukushima\":\"Fukushima\",\"ibaraki\":\"Ibaraki\",\"tochigi\":\"Tochigi\",\"gunma\":\"Gunma\",\"saitama\":\"Saitama\",\"chiba\":\"Chiba\",\"tokyo\":\"Tokyo\",\"kanagawa\":\"Kanagawa\",\"niigata\":\"Niigata\",\"toyama\":\"Toyama\",\"ishikawa\":\"Ishikawa\",\"fukui\":\"Fukui\",\"yamanashi\":\"Yamanashi\",\"nagano\":\"Nagano\",\"gifu\":\"Gifu\",\"shizuoka\":\"Shizuoka\",\"aichi\":\"Aichi\",\"mie\":\"Mie\",\"shiga\":\"Shiga\",\"kyoto\":\"Kyoto\",\"osaka\":\"Osaka\",\"hyogo\":\"Hyogo\",\"nara\":\"Nara\",\"wakayama\":\"Wakayama\",\"tottori\":\"Tottori\",\"shimane\":\"Shimane\",\"okayama\":\"Okayama\",\"hiroshima\":\"Hiroshima\",\"yamaguchi\":\"Yamaguchi\",\"tokushima\":\"Tokushima\",\"kagawa\":\"Kagawa\",\"ehime\":\"Ehime\",\"kochi\":\"Kochi\",\"fukuoka\":\"Fukuoka\",\"saga\":\"Saga\",\"nagasaki\":\"Nagasaki\",\"kumamoto\":\"Kumamoto\",\"oita\":\"Oita\",\"miyazaki\":\"Miyazaki\",\"kagoshima\":\"Kagoshima\",\"okinawa\":\"Okinawa\"},\"cities\":{\"tokyo\":\"Tokyo\",\"shinjuku\":\"Shinjuku\",\"shibuya\":\"Shibuya\",\"setagaya\":\"Setagaya\",\"suginami\":\"Suginami\",\"nakano\":\"Nakano\",\"meguro\":\"Meguro\",\"ota\":\"Ota\",\"shinagawa\":\"Shinagawa\",\"minato\":\"Minato\",\"chuo\":\"Chuo\",\"chiyoda\":\"Chiyoda\",\"bunkyo\":\"Bunkyo\",\"taito\":\"Taito\",\"sumida\":\"Sumida\",\"koto\":\"Koto\",\"kita\":\"Kita\",\"arakawa\":\"Arakawa\",\"itabashi\":\"Itabashi\",\"nerima\":\"Nerima\",\"adachi\":\"Adachi\",\"katsushika\":\"Katsushika\",\"edogawa\":\"Edogawa\",\"toshima\":\"Toshima\",\"yokohama\":\"Yokohama\",\"osaka\":\"Osaka\",\"osaka_kita\":\"Kita-ku, Osaka\",\"osaka_chuo\":\"Chuo-ku, Osaka\",\"osaka_nishi\":\"Nishi-ku, Osaka\",\"osaka_minato\":\"Minato-ku, Osaka\",\"osaka_tennoji\":\"Tennoji-ku, Osaka\",\"osaka_taisho\":\"Taisho-ku, Osaka\",\"osaka_naniwa\":\"Naniwa-ku, Osaka\",\"osaka_nishiyodogawa\":\"Nishiyodogawa-ku, Osaka\",\"osaka_yodogawa\":\"Yodogawa-ku, Osaka\",\"osaka_higashiyodogawa\":\"Higashiyodogawa-ku, Osaka\",\"osaka_ikuno\":\"Ikuno-ku, Osaka\",\"osaka_asahi\":\"Asahi-ku, Osaka\",\"osaka_joto\":\"Joto-ku, Osaka\",\"osaka_abeno\":\"Abeno-ku, Osaka\",\"osaka_hirano\":\"Hirano-ku, Osaka\",\"osaka_suminoe\":\"Suminoe-ku, Osaka\",\"osaka_sumiyoshi\":\"Sumiyoshi-ku, Osaka\",\"osaka_tsurumi\":\"Tsurumi-ku, Osaka\",\"osaka_konohana\":\"Konohana-ku, Osaka\",\"osaka_fukushima\":\"Fukushima-ku, Osaka\",\"osaka_higashinari\":\"Higashinari-ku, Osaka\",\"osaka_nishinari\":\"Nishinari-ku, Osaka\",\"kyoto\":\"Kyoto\",\"nagoya\":\"Nagoya\",\"sapporo\":\"Sapporo\",\"fukuoka\":\"Fukuoka\",\"kobe\":\"Kobe\",\"sendai\":\"Sendai\",\"hiroshima\":\"Hiroshima\",\"kitakyushu\":\"Kitakyushu\",\"saitama\":\"Saitama\",\"niigata\":\"Niigata\",\"hamamatsu\":\"Hamamatsu\",\"shizuoka\":\"Shizuoka\",\"okayama\":\"Okayama\",\"kumamoto\":\"Kumamoto\",\"kagoshima\":\"Kagoshima\",\"utsunomiya\":\"Utsunomiya\",\"matsuyama\":\"Matsuyama\",\"himeji\":\"Himeji\",\"kanazawa\":\"Kanazawa\",\"nagano\":\"Nagano\",\"toyama\":\"Toyama\",\"gifu\":\"Gifu\",\"fukui\":\"Fukui\",\"tottori\":\"Tottori\",\"matsue\":\"Matsue\",\"kofu\":\"Kofu\",\"mito\":\"Mito\",\"urawa\":\"Urawa\",\"kawasaki\":\"Kawasaki\",\"sagamihara\":\"Sagamihara\",\"yokosuka\":\"Yokosuka\",\"chigasaki\":\"Chigasaki\",\"fujisawa\":\"Fujisawa\",\"kamakura\":\"Kamakura\",\"odawara\":\"Odawara\",\"atami\":\"Atami\",\"numazu\":\"Numazu\",\"toyohashi\":\"Toyohashi\",\"okazaki\":\"Okazaki\",\"takayama\":\"Takayama\",\"tsuruga\":\"Tsuruga\",\"maizuru\":\"Maizuru\",\"nara\":\"Nara\",\"kurashiki\":\"Kurashiki\",\"fukuyama\":\"Fukuyama\",\"yamaguchi\":\"Yamaguchi\",\"shimonoseki\":\"Shimonoseki\",\"tokushima\":\"Tokushima\",\"takamatsu\":\"Takamatsu\",\"kochi\":\"Kochi\",\"saga\":\"Saga\",\"nagasaki\":\"Nagasaki\",\"oita\":\"Oita\",\"miyazaki\":\"Miyazaki\",\"naha\":\"Naha\",\"umeda\":\"Umeda, Osaka\",\"namba\":\"Namba, Osaka\",\"shinsaibashi\":\"Shinsaibashi, Osaka\",\"dotonbori\":\"Dotonbori, Osaka\",\"tennoji\":\"Tennoji, Osaka\",\"roppongi\":\"Roppongi\",\"ginza\":\"Ginza\",\"akihabara\":\"Akihabara\",\"harajuku\":\"Harajuku\",\"asakusa\":\"Asakusa\",\"omotesando\":\"Omotesando\",\"ikebukuro\":\"Ikebukuro\",\"ueno\":\"Ueno\"},\"browse\":{\"byArea\":\"By Area\",\"byCategory\":\"By Category\",\"prefecture\":\"Prefecture\",\"category\":\"Category\",\"city\":\"City\"},\"shops\":{\"search\":\"Search by shop name, area or service\",\"searchPlaceholder\":\"Search by shop name, area or service\",\"categories\":\"Categories\",\"found\":\"Found\",\"shop\":\"shop\",\"shops\":\"shops\",\"shopsFound\":\"{count} shops found\",\"shopsInAreas\":\"{shops} shops · {areas} areas\",\"viewDetails\":\"View details\",\"loading\":\"Loading shops...\",\"noShops\":\"No shops found\",\"tryAdjusting\":\"Try adjusting your search or category filter\",\"notAvailable\":\"No shops are available at the moment\",\"contact\":\"Contact\",\"services\":\"Services\",\"staff\":\"Staff\",\"bookNow\":\"Book Now\",\"shopNotFound\":\"Shop not found\",\"shopDoesNotExist\":\"The shop you are looking for does not exist.\",\"invalidShopId\":\"Invalid shop ID\",\"failedToFetchShop\":\"Failed to fetch shop\",\"photos\":\"Photos\",\"photosWillAppear\":\"Photos will appear here once added by the shop owner.\",\"noServicesAvailable\":\"No services available.\",\"noStaffAvailable\":\"No staff information available.\",\"filteredByArea\":\"Filtered by area:\",\"clearAreaFilter\":\"Clear area filter\",\"inAreas\":\"in {count} {count, plural, one {area} other {areas}}\",\"showLess\":\"Show less ({hidden} hidden)\",\"seeAllAreas\":\"See all {count} areas →\"},\"myShop\":{\"title\":\"My Shop\",\"overview\":\"Overview\",\"services\":\"Services\",\"staff\":\"Staff\",\"bookings\":\"Bookings\",\"photos\":\"Photos\",\"shopName\":\"Shop Name\",\"address\":\"Address\",\"phone\":\"Phone\",\"email\":\"Email\",\"website\":\"Website\",\"city\":\"City\",\"country\":\"Country\",\"zipCode\":\"Zip Code\",\"description\":\"Description\",\"saveChanges\":\"Save Changes\",\"noShop\":\"You don't have a shop yet.\",\"createShop\":\"Create Shop\",\"claimShop\":\"Claim Shop\",\"getStarted\":\"Get Started\",\"createNewShop\":\"Create New Shop\",\"startFresh\":\"Start fresh with a new shop listing.\",\"claimExistingShop\":\"Claim Existing Shop\",\"claimOwnership\":\"Claim ownership of an existing shop.\",\"selectUnclaimedShop\":\"Select an unclaimed shop to claim ownership.\",\"noUnclaimedShops\":\"No unclaimed shops available.\",\"loading\":\"Loading shop details...\",\"createNewService\":\"Create New Service\",\"editService\":\"Edit Service\",\"serviceName\":\"Service Name\",\"serviceDescription\":\"Description\",\"servicePrice\":\"Price ($)\",\"serviceDuration\":\"Duration (minutes)\",\"noServices\":\"No services yet.\",\"createFirstService\":\"Create your first service above.\",\"addStaff\":\"Add New Staff Member\",\"editStaff\":\"Edit Staff Member\",\"firstName\":\"First Name\",\"lastName\":\"Last Name\",\"staffPhone\":\"Phone\",\"staffEmail\":\"Email\",\"noStaff\":\"No staff yet.\",\"addFirstStaff\":\"Add your first staff member above.\",\"noBookings\":\"No bookings yet.\",\"bookingsWillAppear\":\"Bookings will appear here when customers make reservations.\",\"customer\":\"Customer\",\"dateTime\":\"Date & Time\",\"service\":\"Service\",\"pending\":\"pending\",\"confirmed\":\"confirmed\",\"rejected\":\"rejected\",\"cancelled\":\"cancelled\",\"completed\":\"completed\",\"confirmBooking\":\"Confirm Booking\",\"rejectBooking\":\"Reject Booking\",\"areYouSureConfirm\":\"Are you sure you want to confirm this booking\",\"areYouSureReject\":\"Are you sure you want to reject this booking\",\"bookingConfirmed\":\"Booking confirmed successfully!\",\"bookingRejected\":\"Booking rejected successfully!\",\"failedToUpdateStatus\":\"Failed to update booking status\",\"uploadLogo\":\"Upload Logo\",\"changeLogo\":\"Change Logo\",\"uploadCover\":\"Upload Cover\",\"changeCover\":\"Change Cover\",\"uploadGalleryPhoto\":\"Upload Gallery Photo\",\"shopLogo\":\"Shop Logo\",\"coverPhoto\":\"Cover Photo\",\"galleryPhotos\":\"Gallery Photos\",\"noLogo\":\"No logo\",\"shopOverview\":\"Shop Overview\",\"editShop\":\"Edit Shop\",\"noGalleryPhotos\":\"No gallery photos yet. Upload your first photo!\",\"noCoverPhoto\":\"No cover photo\",\"photoUploaded\":\"Photo uploaded successfully!\",\"photoDeleted\":\"Photo deleted successfully!\",\"failedToUpload\":\"Failed to upload photo\",\"failedToDelete\":\"Failed to delete photo\",\"photosSaved\":\"Photos saved successfully!\"},\"assistant\":{\"title\":\"AI Assistant\",\"subtitle\":\"Manage customer conversations and get AI help\",\"customerConversations\":\"Customer Conversations\",\"selectConversation\":\"Select a conversation\",\"selectConversationDesc\":\"Choose a thread from the left to view messages\",\"noConversations\":\"No conversations yet\",\"loadingThreads\":\"Loading threads...\",\"youAreHandling\":\"✓ You are handling\",\"letAiHandle\":\"Let AI handle\",\"noMessages\":\"No messages yet\",\"startConversation\":\"Start the conversation!\",\"booking\":\"Booking:\",\"sending\":\"Sending...\",\"send\":\"Send\",\"typeMessage\":\"Type your message...\",\"youAreTyping\":\"You are typing...\"},\"status\":{\"pending\":\"Pending\",\"confirmed\":\"Confirmed\",\"rejected\":\"Rejected\",\"cancelled\":\"Cancelled\",\"completed\":\"Completed\"},\"reviews\":{\"title\":\"Reviews\",\"writeReview\":\"Write a Review\",\"rating\":\"Rating\",\"comment\":\"Comment\",\"photos\":\"Photos\",\"submit\":\"Submit Review\",\"averageRating\":\"Average Rating\",\"totalReviews\":\"Total Reviews\",\"verified\":\"Verified Booking\",\"ownerResponse\":\"Owner Response\",\"respond\":\"Respond to Review\",\"noReviews\":\"No reviews yet\",\"addFirstReview\":\"Be the first to review this shop\"},\"analytics\":{\"title\":\"Analytics\",\"overview\":\"Overview\",\"bookings\":\"Bookings\",\"revenue\":\"Revenue\",\"averagePerDay\":\"Average per Day\",\"cancellationRate\":\"Cancellation Rate\",\"bookingTrends\":\"Booking Trends\",\"servicePopularity\":\"Service Popularity\",\"staffPerformance\":\"Staff Performance\",\"peakHours\":\"Peak Hours\",\"customerAnalytics\":\"Customer Analytics\",\"newCustomers\":\"New Customers\",\"returningCustomers\":\"Returning Customers\",\"dateRange\":\"Date Range\",\"last7Days\":\"Last 7 Days\",\"last30Days\":\"Last 30 Days\",\"last90Days\":\"Last 90 Days\",\"custom\":\"Custom\",\"date\":\"Date\"},\"line\":{\"loginWithLine\":\"Login with LINE\",\"connectLineAccount\":\"Connect LINE Account\",\"lineConnected\":\"LINE Connected\",\"lineNotConnected\":\"LINE Not Connected\",\"shareOnLine\":\"Share on LINE\",\"disconnect\":\"Disconnect\"}}"));}),
"[project]/apps/dashboard/messages/ja.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v(JSON.parse("{\"common\":{\"save\":\"変更を保存\",\"cancel\":\"キャンセル\",\"edit\":\"編集\",\"delete\":\"削除\",\"create\":\"作成\",\"update\":\"更新\",\"submit\":\"送信\",\"submitting\":\"送信中...\",\"loading\":\"読み込み中...\",\"error\":\"エラー\",\"success\":\"成功\",\"or\":\"または\",\"confirm\":\"確認\",\"reject\":\"拒否\",\"yes\":\"はい\",\"no\":\"いいえ\",\"close\":\"閉じる\",\"for\":\"の\",\"keepIt\":\"保持する\",\"updating\":\"更新中...\",\"cancelling\":\"キャンセル中...\",\"rescheduling\":\"変更中...\",\"unknown\":\"不明\",\"back\":\"戻る\",\"next\":\"次へ\",\"previous\":\"前へ\",\"search\":\"検索\",\"filter\":\"フィルター\",\"actions\":\"アクション\",\"photos\":\"写真\",\"name\":\"名前\",\"email\":\"メール\",\"phone\":\"電話\",\"address\":\"住所\",\"website\":\"ウェブサイト\",\"description\":\"説明\",\"price\":\"価格\",\"duration\":\"時間\",\"status\":\"ステータス\",\"date\":\"日付\",\"time\":\"時間\",\"optional\":\"任意\",\"required\":\"必須\"},\"auth\":{\"signInToShop\":\"店舗にサインイン\",\"password\":\"パスワード\",\"signingIn\":\"サインイン中...\",\"signIn\":\"サインイン\",\"dontHaveAccount\":\"アカウントをお持ちでない場合\",\"createOwnerAccount\":\"オーナーアカウントを作成\",\"ownerName\":\"お名前\",\"creatingAccount\":\"アカウント作成中...\",\"signUp\":\"アカウントを作成\",\"alreadyHaveAccount\":\"すでにアカウントをお持ちの場合\",\"unexpectedError\":\"予期しないエラーが発生しました\",\"fillRequiredFields\":\"すべての必須フィールドに入力してください\",\"failedToSetupAccount\":\"アカウントの設定に失敗しました\"},\"nav\":{\"shops\":\"店舗\",\"ownerLogin\":\"オーナーログイン\",\"myShop\":\"マイショップ\",\"aiAssistant\":\"AIアシスタント\",\"bookings\":\"予約\",\"logout\":\"ログアウト\",\"dashboard\":\"Yoyaku Yoダッシュボード\"},\"home\":{\"title\":\"Yoyaku Yo\",\"subtitle\":\"東京のサロン向けAI予約アシスタント\",\"browseShops\":\"店舗を探す\",\"ownerLogin\":\"オーナーログイン\",\"joinAsOwner\":\"オーナーとして参加\",\"feature1\":\"お客様が24時間365日オンラインで予約可能\",\"feature2\":\"AIアシスタントがメッセージ、予約変更、キャンセルを処理\",\"feature3\":\"店舗オーナー向けのシンプルなダッシュボード\",\"forCustomers\":\"お客様向け\",\"forCustomersDesc\":\"カテゴリ別にサロンを検索し、サービスを閲覧し、24時間365日オンラインで予約できます。\",\"forOwners\":\"オーナー向け\",\"forOwnersDesc\":\"店舗を接続し、予約を管理し、AIに顧客メッセージを処理させます。\",\"aiAssistance\":\"AIアシスタント\",\"aiAssistanceDesc\":\"日本語または英語で顧客メッセージを処理し、予約変更とキャンセルを管理します。\",\"heroTitle\":\"Yoyaku Yo\",\"heroSubtitle\":\"美とテクノロジーが融合した予約プラットフォーム\",\"searchPlaceholder\":\"店舗、カテゴリー、エリアで検索\",\"browseByCategory\":\"カテゴリーで探す\",\"browseByArea\":\"エリアで探す\",\"nearbyServices\":\"近くのサービス\",\"howItWorks\":\"使い方\",\"forCustomersTitle\":\"お客様向け\",\"forCustomersBullet1\":\"カテゴリー別にサロンを検索\",\"forCustomersBullet2\":\"24時間365日オンラインで予約可能\",\"forCustomersBullet3\":\"サービスとスタッフを簡単に選択\",\"forOwnersTitle\":\"オーナー向け\",\"forOwnersBullet1\":\"予約と空き状況を簡単に管理\",\"forOwnersBullet2\":\"顧客情報を一元管理\",\"forOwnersBullet3\":\"シンプルなダッシュボードで効率的に運営\",\"aiAssistanceTitle\":\"AIアシスタント\",\"aiAssistanceBullet1\":\"日本語・英語で顧客メッセージに自動対応\",\"aiAssistanceBullet2\":\"予約変更とキャンセルを自動処理\",\"aiAssistanceBullet3\":\"24時間365日サポート\"},\"booking\":{\"title\":\"予約する\",\"service\":\"サービス\",\"staff\":\"スタッフ\",\"staffOptional\":\"スタッフ（任意）\",\"date\":\"日付\",\"time\":\"時間\",\"yourName\":\"お名前\",\"submit\":\"予約する\",\"success\":\"予約が確認されました！\",\"confirmedMessage\":\"ご予約が確定しました。あなたの個人IDは{customerId}です。このチャットでいつでも変更やキャンセルができます — もう一度こんにちはと言ってください！ ✨\",\"ownerWillConfirm\":\"店舗オーナーが予約を確認します。\",\"anyAvailable\":\"利用可能なスタッフ\",\"chooseService\":\"サービスを選択\",\"chooseStaff\":\"スタッフを選択\",\"chooseDate\":\"日付を選択\",\"chooseTimeslot\":\"時間帯を選択\",\"yourInformation\":\"お客様情報\",\"selectService\":\"サービスを選択してください\",\"selectStaff\":\"スタッフを選択してください\",\"checkAvailability\":\"空き状況を確認\",\"bookAppointment\":\"予約する\",\"bookingSuccessful\":\"予約が完了しました！\",\"bookingFailed\":\"予約に失敗しました。もう一度お試しください。\",\"tryAgain\":\"もう一度お試しください\",\"timeslotSelected\":\"時間帯が選択されました！\",\"cancelBooking\":\"予約をキャンセル\",\"rescheduleBooking\":\"予約を変更\",\"cancelConfirm\":\"この予約をキャンセルしてもよろしいですか\",\"rescheduleConfirm\":\"予約を変更\",\"current\":\"現在\",\"newDateTime\":\"新しい日時\",\"cancelled\":\"予約がキャンセルされました！\",\"rescheduled\":\"予約が変更されました！\",\"failedToCancel\":\"予約のキャンセルに失敗しました\",\"failedToReschedule\":\"予約の変更に失敗しました\",\"failedToCreate\":\"予約の作成に失敗しました。もう一度お試しください。\"},\"chat\":{\"title\":\"AIアシスタントとチャット\",\"placeholder\":\"メッセージを入力...\",\"send\":\"送信\",\"startConversation\":\"AIアシスタントとの会話を始めましょう\",\"noResponse\":\"応答がありません\",\"errorEncountered\":\"申し訳ございませんが、エラーが発生しました\",\"cannotRespond\":\"申し訳ございませんが、現在応答できません。後でもう一度お試しください。\"},\"categories\":{\"all\":\"すべてのカテゴリー\",\"barbershop\":\"理髪店\",\"beauty_salon\":\"美容サロン\",\"eyelash\":\"まつげ\",\"general_salon\":\"総合サロン\",\"hair_salon\":\"ヘアサロン\",\"nail_salon\":\"ネイルサロン\",\"spa_massage\":\"スパ・マッサージ\",\"dental_clinic\":\"歯科\",\"womens_clinic\":\"婦人科\",\"hotels_ryokan\":\"ホテル・旅館\",\"restaurants_izakaya\":\"レストラン・居酒屋\",\"spas_onsen_bathhouses\":\"スパ・温泉・日帰り入浴\",\"golf_courses_ranges\":\"ゴルフ場・練習場\",\"private_karaoke_rooms\":\"カラオケルーム\",\"unknown\":\"不明\"},\"prefectures\":{\"hokkaido\":\"北海道\",\"aomori\":\"青森県\",\"iwate\":\"岩手県\",\"miyagi\":\"宮城県\",\"akita\":\"秋田県\",\"yamagata\":\"山形県\",\"fukushima\":\"福島県\",\"ibaraki\":\"茨城県\",\"tochigi\":\"栃木県\",\"gunma\":\"群馬県\",\"saitama\":\"埼玉県\",\"chiba\":\"千葉県\",\"tokyo\":\"東京都\",\"kanagawa\":\"神奈川県\",\"niigata\":\"新潟県\",\"toyama\":\"富山県\",\"ishikawa\":\"石川県\",\"fukui\":\"福井県\",\"yamanashi\":\"山梨県\",\"nagano\":\"長野県\",\"gifu\":\"岐阜県\",\"shizuoka\":\"静岡県\",\"aichi\":\"愛知県\",\"mie\":\"三重県\",\"shiga\":\"滋賀県\",\"kyoto\":\"京都府\",\"osaka\":\"大阪府\",\"hyogo\":\"兵庫県\",\"nara\":\"奈良県\",\"wakayama\":\"和歌山県\",\"tottori\":\"鳥取県\",\"shimane\":\"島根県\",\"okayama\":\"岡山県\",\"hiroshima\":\"広島県\",\"yamaguchi\":\"山口県\",\"tokushima\":\"徳島県\",\"kagawa\":\"香川県\",\"ehime\":\"愛媛県\",\"kochi\":\"高知県\",\"fukuoka\":\"福岡県\",\"saga\":\"佐賀県\",\"nagasaki\":\"長崎県\",\"kumamoto\":\"熊本県\",\"oita\":\"大分県\",\"miyazaki\":\"宮崎県\",\"kagoshima\":\"鹿児島県\",\"okinawa\":\"沖縄県\"},\"cities\":{\"tokyo\":\"東京\",\"shinjuku\":\"新宿区\",\"shibuya\":\"渋谷区\",\"setagaya\":\"世田谷区\",\"suginami\":\"杉並区\",\"nakano\":\"中野区\",\"meguro\":\"目黒区\",\"ota\":\"大田区\",\"shinagawa\":\"品川区\",\"minato\":\"港区\",\"chuo\":\"中央区\",\"chiyoda\":\"千代田区\",\"bunkyo\":\"文京区\",\"taito\":\"台東区\",\"sumida\":\"墨田区\",\"koto\":\"江東区\",\"kita\":\"北区\",\"arakawa\":\"荒川区\",\"itabashi\":\"板橋区\",\"nerima\":\"練馬区\",\"adachi\":\"足立区\",\"katsushika\":\"葛飾区\",\"edogawa\":\"江戸川区\",\"toshima\":\"豊島区\",\"yokohama\":\"横浜市\",\"osaka\":\"大阪市\",\"osaka_kita\":\"大阪市北区\",\"osaka_chuo\":\"大阪市中央区\",\"osaka_nishi\":\"大阪市西区\",\"osaka_minato\":\"大阪市港区\",\"osaka_tennoji\":\"大阪市天王寺区\",\"osaka_taisho\":\"大阪市大正区\",\"osaka_naniwa\":\"大阪市浪速区\",\"osaka_nishiyodogawa\":\"大阪市西淀川区\",\"osaka_yodogawa\":\"大阪市淀川区\",\"osaka_higashiyodogawa\":\"大阪市東淀川区\",\"osaka_ikuno\":\"大阪市生野区\",\"osaka_asahi\":\"大阪市旭区\",\"osaka_joto\":\"大阪市城東区\",\"osaka_abeno\":\"大阪市阿倍野区\",\"osaka_hirano\":\"大阪市平野区\",\"osaka_suminoe\":\"大阪市住之江区\",\"osaka_sumiyoshi\":\"大阪市住吉区\",\"osaka_tsurumi\":\"大阪市鶴見区\",\"osaka_konohana\":\"大阪市此花区\",\"osaka_fukushima\":\"大阪市福島区\",\"osaka_higashinari\":\"大阪市東成区\",\"osaka_nishinari\":\"大阪市西成区\",\"kyoto\":\"京都市\",\"nagoya\":\"名古屋市\",\"sapporo\":\"札幌市\",\"fukuoka\":\"福岡市\",\"kobe\":\"神戸市\",\"sendai\":\"仙台市\",\"hiroshima\":\"広島市\",\"kitakyushu\":\"北九州市\",\"saitama\":\"さいたま市\",\"niigata\":\"新潟市\",\"hamamatsu\":\"浜松市\",\"shizuoka\":\"静岡市\",\"okayama\":\"岡山市\",\"kumamoto\":\"熊本市\",\"kagoshima\":\"鹿児島市\",\"utsunomiya\":\"宇都宮市\",\"matsuyama\":\"松山市\",\"himeji\":\"姫路市\",\"kanazawa\":\"金沢市\",\"nagano\":\"長野市\",\"toyama\":\"富山市\",\"gifu\":\"岐阜市\",\"fukui\":\"福井市\",\"tottori\":\"鳥取市\",\"matsue\":\"松江市\",\"kofu\":\"甲府市\",\"mito\":\"水戸市\",\"urawa\":\"浦和市\",\"kawasaki\":\"川崎市\",\"sagamihara\":\"相模原市\",\"yokosuka\":\"横須賀市\",\"chigasaki\":\"茅ヶ崎市\",\"fujisawa\":\"藤沢市\",\"kamakura\":\"鎌倉市\",\"odawara\":\"小田原市\",\"atami\":\"熱海市\",\"numazu\":\"沼津市\",\"toyohashi\":\"豊橋市\",\"okazaki\":\"岡崎市\",\"takayama\":\"高山市\",\"tsuruga\":\"敦賀市\",\"maizuru\":\"舞鶴市\",\"nara\":\"奈良市\",\"kurashiki\":\"倉敷市\",\"fukuyama\":\"福山市\",\"yamaguchi\":\"山口市\",\"shimonoseki\":\"下関市\",\"tokushima\":\"徳島市\",\"takamatsu\":\"高松市\",\"kochi\":\"高知市\",\"saga\":\"佐賀市\",\"nagasaki\":\"長崎市\",\"oita\":\"大分市\",\"miyazaki\":\"宮崎市\",\"naha\":\"那覇市\",\"umeda\":\"梅田（大阪）\",\"namba\":\"難波（大阪）\",\"shinsaibashi\":\"心斎橋（大阪）\",\"dotonbori\":\"道頓堀（大阪）\",\"tennoji\":\"天王寺（大阪）\",\"roppongi\":\"六本木\",\"ginza\":\"銀座\",\"akihabara\":\"秋葉原\",\"harajuku\":\"原宿\",\"asakusa\":\"浅草\",\"omotesando\":\"表参道\",\"ikebukuro\":\"池袋\",\"ueno\":\"上野\"},\"browse\":{\"byArea\":\"エリアで探す\",\"byCategory\":\"カテゴリーで探す\",\"prefecture\":\"都道府県\",\"category\":\"カテゴリー\",\"city\":\"市区町村\"},\"shops\":{\"search\":\"店舗名、エリア、サービスで検索\",\"searchPlaceholder\":\"店舗名、エリア、サービスで検索\",\"categories\":\"カテゴリー\",\"found\":\"見つかりました\",\"shop\":\"店舗\",\"shops\":\"店舗\",\"shopsFound\":\"{count}件の店舗が見つかりました\",\"shopsInAreas\":\"{shops}店舗 · {areas}エリア\",\"viewDetails\":\"詳細を見る\",\"loading\":\"店舗を読み込み中...\",\"noShops\":\"店舗が見つかりませんでした\",\"tryAdjusting\":\"検索またはカテゴリーフィルターを調整してみてください\",\"notAvailable\":\"現在利用可能な店舗はありません\",\"contact\":\"連絡先\",\"services\":\"サービス\",\"staff\":\"スタッフ\",\"bookNow\":\"今すぐ予約\",\"shopNotFound\":\"店舗が見つかりません\",\"shopDoesNotExist\":\"お探しの店舗は存在しません。\",\"invalidShopId\":\"無効な店舗ID\",\"failedToFetchShop\":\"店舗の取得に失敗しました\",\"photos\":\"写真\",\"photosWillAppear\":\"店舗オーナーが写真を追加すると、ここに表示されます。\",\"noServicesAvailable\":\"利用可能なサービスがありません。\",\"noStaffAvailable\":\"スタッフ情報がありません。\",\"filteredByArea\":\"エリアでフィルター:\",\"clearAreaFilter\":\"エリアフィルターをクリア\",\"inAreas\":\"{count}エリア\",\"showLess\":\"折りたたむ（{hidden}件非表示）\",\"seeAllAreas\":\"全{count}エリアを見る →\"},\"myShop\":{\"title\":\"マイショップ\",\"overview\":\"概要\",\"services\":\"サービス\",\"staff\":\"スタッフ\",\"bookings\":\"予約\",\"photos\":\"写真\",\"shopName\":\"店舗名\",\"address\":\"住所\",\"phone\":\"電話\",\"email\":\"メール\",\"website\":\"ウェブサイト\",\"city\":\"市区町村\",\"country\":\"国\",\"zipCode\":\"郵便番号\",\"description\":\"説明\",\"saveChanges\":\"変更を保存\",\"noShop\":\"まだ店舗がありません。\",\"createShop\":\"店舗を作成\",\"claimShop\":\"店舗を申請\",\"getStarted\":\"始める\",\"createNewShop\":\"新しい店舗を作成\",\"startFresh\":\"新しい店舗リストから始めます。\",\"claimExistingShop\":\"既存の店舗を申請\",\"claimOwnership\":\"既存の店舗の所有権を申請します。\",\"selectUnclaimedShop\":\"所有権を申請する未申請の店舗を選択してください。\",\"noUnclaimedShops\":\"利用可能な未申請の店舗はありません。\",\"loading\":\"店舗詳細を読み込み中...\",\"createNewService\":\"新しいサービスを作成\",\"editService\":\"サービスを編集\",\"serviceName\":\"サービス名\",\"serviceDescription\":\"説明\",\"servicePrice\":\"価格（円）\",\"serviceDuration\":\"時間（分）\",\"noServices\":\"まだサービスがありません。\",\"createFirstService\":\"上記で最初のサービスを作成してください。\",\"addStaff\":\"新しいスタッフを追加\",\"editStaff\":\"スタッフを編集\",\"firstName\":\"名\",\"lastName\":\"姓\",\"staffPhone\":\"電話\",\"staffEmail\":\"メール\",\"noStaff\":\"まだスタッフがありません。\",\"addFirstStaff\":\"上記で最初のスタッフを追加してください。\",\"noBookings\":\"まだ予約がありません。\",\"bookingsWillAppear\":\"お客様が予約をすると、ここに表示されます。\",\"customer\":\"お客様\",\"dateTime\":\"日時\",\"service\":\"サービス\",\"pending\":\"保留中\",\"confirmed\":\"確認済み\",\"rejected\":\"拒否\",\"cancelled\":\"キャンセル済み\",\"completed\":\"完了\",\"confirmBooking\":\"予約を確認\",\"rejectBooking\":\"予約を拒否\",\"areYouSureConfirm\":\"この予約を確認してもよろしいですか\",\"areYouSureReject\":\"この予約を拒否してもよろしいですか\",\"bookingConfirmed\":\"予約が確認されました！\",\"bookingRejected\":\"予約が拒否されました！\",\"failedToUpdateStatus\":\"予約ステータスの更新に失敗しました\",\"uploadLogo\":\"ロゴをアップロード\",\"changeLogo\":\"ロゴを変更\",\"uploadCover\":\"カバー写真をアップロード\",\"changeCover\":\"カバー写真を変更\",\"uploadGalleryPhoto\":\"ギャラリー写真をアップロード\",\"shopLogo\":\"店舗ロゴ\",\"coverPhoto\":\"カバー写真\",\"galleryPhotos\":\"ギャラリー写真\",\"noLogo\":\"ロゴなし\",\"shopOverview\":\"店舗概要\",\"editShop\":\"店舗を編集\",\"noGalleryPhotos\":\"まだギャラリー写真がありません。最初の写真をアップロードしてください！\",\"noCoverPhoto\":\"カバー写真がありません\",\"photoUploaded\":\"写真がアップロードされました！\",\"photoDeleted\":\"写真が削除されました！\",\"failedToUpload\":\"写真のアップロードに失敗しました\",\"failedToDelete\":\"写真の削除に失敗しました\",\"photosSaved\":\"写真が保存されました！\"},\"assistant\":{\"title\":\"AIアシスタント\",\"subtitle\":\"顧客との会話を管理し、AIのサポートを受けます\",\"customerConversations\":\"顧客との会話\",\"selectConversation\":\"会話を選択\",\"selectConversationDesc\":\"左側からスレッドを選択してメッセージを表示\",\"noConversations\":\"まだ会話がありません\",\"loadingThreads\":\"スレッドを読み込み中...\",\"youAreHandling\":\"✓ あなたが対応中\",\"letAiHandle\":\"AIに任せる\",\"noMessages\":\"まだメッセージがありません\",\"startConversation\":\"会話を始めましょう！\",\"booking\":\"予約:\",\"sending\":\"送信中...\",\"send\":\"送信\",\"typeMessage\":\"メッセージを入力...\",\"youAreTyping\":\"入力中...\"},\"status\":{\"pending\":\"保留中\",\"confirmed\":\"確認済み\",\"rejected\":\"拒否\",\"cancelled\":\"キャンセル済み\",\"completed\":\"完了\"},\"reviews\":{\"title\":\"レビュー\",\"writeReview\":\"レビューを書く\",\"rating\":\"評価\",\"comment\":\"コメント\",\"photos\":\"写真\",\"submit\":\"レビューを送信\",\"averageRating\":\"平均評価\",\"totalReviews\":\"総レビュー数\",\"verified\":\"確認済み予約\",\"ownerResponse\":\"オーナーの返信\",\"respond\":\"レビューに返信\",\"noReviews\":\"レビューはまだありません\",\"addFirstReview\":\"最初のレビューを書いてみませんか\",\"characters\":\"文字\"},\"analytics\":{\"title\":\"分析\",\"overview\":\"概要\",\"bookings\":\"予約\",\"revenue\":\"収益\",\"averagePerDay\":\"1日平均\",\"cancellationRate\":\"キャンセル率\",\"bookingTrends\":\"予約トレンド\",\"servicePopularity\":\"サービス人気\",\"staffPerformance\":\"スタッフ実績\",\"peakHours\":\"ピーク時間\",\"customerAnalytics\":\"顧客分析\",\"newCustomers\":\"新規顧客\",\"returningCustomers\":\"リピーター\",\"dateRange\":\"期間\",\"last7Days\":\"過去7日間\",\"last30Days\":\"過去30日間\",\"last90Days\":\"過去90日間\",\"custom\":\"カスタム\",\"date\":\"日付\"},\"line\":{\"loginWithLine\":\"LINEでログイン\",\"connectLineAccount\":\"LINEアカウントを接続\",\"lineConnected\":\"LINE接続済み\",\"lineNotConnected\":\"LINE未接続\",\"shareOnLine\":\"LINEでシェア\",\"disconnect\":\"切断\"}}"));}),
"[project]/apps/dashboard/messages/zh.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"home":{"title":"Yoyaku Yo","subtitle":"东京美发沙龙AI预约助手","browseShops":"浏览店铺","ownerLogin":"店主登录","joinAsOwner":"成为店主","heroTitle":"Yoyaku Yo","heroSubtitle":"美与科技融合的预约平台","searchPlaceholder":"按店铺、类别或地区搜索","browseByCategory":"按类别浏览","browseByArea":"按地区浏览","nearbyServices":"附近服务","howItWorks":"使用方式","forCustomersTitle":"顾客","forCustomersBullet1":"按类别搜索沙龙","forCustomersBullet2":"24/7在线预约","forCustomersBullet3":"轻松选择服务和员工","forOwnersTitle":"店主","forOwnersBullet1":"轻松管理预约和可用性","forOwnersBullet2":"集中管理客户信息","forOwnersBullet3":"通过简单仪表板高效运营","aiAssistanceTitle":"AI助手","aiAssistanceBullet1":"自动处理日语/英语客户消息","aiAssistanceBullet2":"自动处理预约变更和取消","aiAssistanceBullet3":"24/7支持"},"browse":{"byArea":"按地区","byCategory":"按类别","prefecture":"都道府县","category":"类别","city":"城市"},"shops":{"search":"按店铺名称、地区或服务搜索","searchPlaceholder":"按店铺名称、地区或服务搜索","shops":"店铺","shopsFound":"找到 {count} 家店铺","viewDetails":"查看详情","loading":"正在加载店铺...","noShops":"未找到店铺","tryAdjusting":"请尝试调整搜索或类别筛选器"},"categories":{"all":"所有类别","barbershop":"理发店","beauty_salon":"美容院","nail_salon":"美甲沙龙","spa_massage":"水疗和按摩","hotels_ryokan":"酒店和日式旅馆","restaurants_izakaya":"餐厅和居酒屋"},"prefectures":{"tokyo":"东京都","osaka":"大阪府","kyoto":"京都府","kanagawa":"神奈川县","aichi":"爱知县","fukuoka":"福冈县"}});}),
"[project]/apps/dashboard/messages/es.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"home":{"title":"Yoyaku Yo","subtitle":"Asistente de reservas con IA para salones en Tokio","browseShops":"Explorar Tiendas","ownerLogin":"Iniciar Sesión","joinAsOwner":"Únete como Propietario","heroTitle":"Yoyaku Yo","heroSubtitle":"Donde la Belleza Encuentra la Tecnología","searchPlaceholder":"Buscar por tienda, categoría o área","browseByCategory":"Explorar por Categoría","browseByArea":"Explorar por Área","nearbyServices":"Servicios Cercanos","howItWorks":"Cómo Funciona","forCustomersTitle":"Para Clientes","forCustomersBullet1":"Buscar salones por categoría","forCustomersBullet2":"Reservar en línea 24/7","forCustomersBullet3":"Seleccionar fácilmente servicios y personal","forOwnersTitle":"Para Propietarios","forOwnersBullet1":"Gestionar reservas y disponibilidad fácilmente","forOwnersBullet2":"Centralizar información de clientes","forOwnersBullet3":"Operar eficientemente con un panel simple","aiAssistanceTitle":"Asistencia IA","aiAssistanceBullet1":"Responder automáticamente a mensajes en japonés/español","aiAssistanceBullet2":"Gestionar cambios y cancelaciones automáticamente","aiAssistanceBullet3":"Soporte 24/7"},"browse":{"byArea":"Por Área","byCategory":"Por Categoría","prefecture":"Prefectura","category":"Categoría","city":"Ciudad"},"shops":{"search":"Buscar por nombre de tienda, área o servicio","searchPlaceholder":"Buscar por nombre de tienda, área o servicio","shops":"Tiendas","shopsFound":"Se encontraron {count} tiendas","viewDetails":"Ver detalles","loading":"Cargando tiendas...","noShops":"No se encontraron tiendas","tryAdjusting":"Intente ajustar su búsqueda o filtro de categoría"},"categories":{"all":"Todas las Categorías","barbershop":"Barbería","beauty_salon":"Salón de Belleza","nail_salon":"Salón de Uñas","spa_massage":"Spa y Masaje","hotels_ryokan":"Hoteles y Ryokan","restaurants_izakaya":"Restaurantes e Izakaya"},"prefectures":{"tokyo":"Tokio","osaka":"Osaka","kyoto":"Kioto","kanagawa":"Kanagawa","aichi":"Aichi","fukuoka":"Fukuoka"}});}),
"[project]/apps/dashboard/messages/pt-BR.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"home":{"title":"Yoyaku Yo","subtitle":"Assistente de reservas com IA para salões em Tóquio","browseShops":"Explorar Lojas","ownerLogin":"Login do Proprietário","joinAsOwner":"Juntar-se como Proprietário","heroTitle":"Yoyaku Yo","heroSubtitle":"Onde a Beleza Encontra a Tecnologia","searchPlaceholder":"Pesquisar por loja, categoria ou área","browseByCategory":"Explorar por Categoria","browseByArea":"Explorar por Área","nearbyServices":"Serviços Próximos","howItWorks":"Como Funciona","forCustomersTitle":"Para Clientes","forCustomersBullet1":"Buscar salões por categoria","forCustomersBullet2":"Reservar online 24/7","forCustomersBullet3":"Selecionar facilmente serviços e equipe","forOwnersTitle":"Para Proprietários","forOwnersBullet1":"Gerenciar reservas e disponibilidade facilmente","forOwnersBullet2":"Centralizar informações dos clientes","forOwnersBullet3":"Operar eficientemente com um painel simples","aiAssistanceTitle":"Assistência IA","aiAssistanceBullet1":"Responder automaticamente a mensagens em japonês/português","aiAssistanceBullet2":"Gerenciar reagendamentos e cancelamentos automaticamente","aiAssistanceBullet3":"Suporte 24/7"},"browse":{"byArea":"Por Área","byCategory":"Por Categoria","prefecture":"Prefeitura","category":"Categoria","city":"Cidade"},"shops":{"search":"Pesquisar por nome da loja, área ou serviço","searchPlaceholder":"Pesquisar por nome da loja, área ou serviço","shops":"Lojas","shopsFound":"{count} lojas encontradas","viewDetails":"Ver detalhes","loading":"Carregando lojas...","noShops":"Nenhuma loja encontrada","tryAdjusting":"Tente ajustar sua pesquisa ou filtro de categoria"},"categories":{"all":"Todas as Categorias","barbershop":"Barbearia","beauty_salon":"Salão de Beleza","nail_salon":"Salão de Unhas","spa_massage":"Spa e Massagem","hotels_ryokan":"Hotéis e Ryokan","restaurants_izakaya":"Restaurantes e Izakaya"},"prefectures":{"tokyo":"Tóquio","osaka":"Osaka","kyoto":"Quioto","kanagawa":"Kanagawa","aichi":"Aichi","fukuoka":"Fukuoka"}});}),
"[project]/apps/dashboard/app/components/NextIntlProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NextIntlProviderWrapper",
    ()=>NextIntlProviderWrapper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$shared$2f$NextIntlClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NextIntlClientProvider$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js [app-client] (ecmascript) <export default as NextIntlClientProvider>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
// Import default messages for SSR
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$en$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/apps/dashboard/messages/en.json (json)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$ja$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/apps/dashboard/messages/ja.json (json)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$zh$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/apps/dashboard/messages/zh.json (json)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$es$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/apps/dashboard/messages/es.json (json)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$pt$2d$BR$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/apps/dashboard/messages/pt-BR.json (json)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
// Ensure messages are always valid objects
const messageMap = {
    'en': __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$en$2e$json__$28$json$29$__["default"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$en$2e$json__$28$json$29$__["default"] === 'object' ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$en$2e$json__$28$json$29$__["default"] : {},
    'ja': __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$ja$2e$json__$28$json$29$__["default"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$ja$2e$json__$28$json$29$__["default"] === 'object' ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$ja$2e$json__$28$json$29$__["default"] : {},
    'zh': __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$zh$2e$json__$28$json$29$__["default"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$zh$2e$json__$28$json$29$__["default"] === 'object' ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$zh$2e$json__$28$json$29$__["default"] : {},
    'es': __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$es$2e$json__$28$json$29$__["default"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$es$2e$json__$28$json$29$__["default"] === 'object' ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$es$2e$json__$28$json$29$__["default"] : {},
    'pt-BR': __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$pt$2d$BR$2e$json__$28$json$29$__["default"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$pt$2d$BR$2e$json__$28$json$29$__["default"] === 'object' ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$messages$2f$pt$2d$BR$2e$json__$28$json$29$__["default"] : {}
};
function NextIntlProviderWrapper({ children }) {
    _s();
    const [locale, setLocale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('ja'); // Default to Japanese
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(messageMap['ja']);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NextIntlProviderWrapper.useEffect": ()=>{
            // Get locale from cookie or localStorage
            const getStoredLocale = {
                "NextIntlProviderWrapper.useEffect.getStoredLocale": ()=>{
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
                    // Try cookie first
                    const cookies = document.cookie.split(';');
                    const langCookie = cookies.find({
                        "NextIntlProviderWrapper.useEffect.getStoredLocale.langCookie": (c)=>c.trim().startsWith('yoyaku_yo_language=')
                    }["NextIntlProviderWrapper.useEffect.getStoredLocale.langCookie"]);
                    if (langCookie) {
                        const value = langCookie.split('=')[1]?.trim();
                        if (value && messageMap[value]) {
                            return value;
                        }
                    }
                    // Fallback to localStorage
                    const stored = localStorage.getItem('yoyaku_yo_language');
                    if (stored && messageMap[stored]) {
                        return stored;
                    }
                    return 'ja'; // Default to Japanese
                }
            }["NextIntlProviderWrapper.useEffect.getStoredLocale"];
            const currentLocale = getStoredLocale();
            setLocale(currentLocale);
            setMessages(messageMap[currentLocale] || messageMap['ja']);
        }
    }["NextIntlProviderWrapper.useEffect"], []);
    // Listen for locale changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NextIntlProviderWrapper.useEffect": ()=>{
            const handleStorageChange = {
                "NextIntlProviderWrapper.useEffect.handleStorageChange": ()=>{
                    // Check both cookie and localStorage
                    const cookies = document.cookie.split(';');
                    const langCookie = cookies.find({
                        "NextIntlProviderWrapper.useEffect.handleStorageChange.langCookie": (c)=>c.trim().startsWith('yoyaku_yo_language=')
                    }["NextIntlProviderWrapper.useEffect.handleStorageChange.langCookie"]);
                    let newLocale = null;
                    if (langCookie) {
                        const value = langCookie.split('=')[1]?.trim();
                        if (value && messageMap[value]) {
                            newLocale = value;
                        }
                    }
                    // Fallback to localStorage if cookie not found
                    if (!newLocale) {
                        const stored = localStorage.getItem('yoyaku_yo_language');
                        if (stored && messageMap[stored]) {
                            newLocale = stored;
                        }
                    }
                    if (newLocale) {
                        // Use functional update to avoid dependency on locale
                        setLocale({
                            "NextIntlProviderWrapper.useEffect.handleStorageChange": (prevLocale)=>{
                                if (prevLocale !== newLocale) {
                                    setMessages(messageMap[newLocale] || messageMap['ja']);
                                    return newLocale;
                                }
                                return prevLocale;
                            }
                        }["NextIntlProviderWrapper.useEffect.handleStorageChange"]);
                    }
                }
            }["NextIntlProviderWrapper.useEffect.handleStorageChange"];
            // Listen for custom event when language changes
            window.addEventListener('languageChanged', handleStorageChange);
            window.addEventListener('storage', handleStorageChange);
            return ({
                "NextIntlProviderWrapper.useEffect": ()=>{
                    window.removeEventListener('languageChanged', handleStorageChange);
                    window.removeEventListener('storage', handleStorageChange);
                }
            })["NextIntlProviderWrapper.useEffect"];
        }
    }["NextIntlProviderWrapper.useEffect"], []); // Empty dependency array - only set up listeners once
    // Ensure messages is always a valid object with proper structure
    const safeMessages = messages && typeof messages === 'object' ? messages : messageMap['ja'];
    // Validate that shops.photos exists in messages
    if (("TURBOPACK compile-time value", "development") === 'development' && safeMessages.shops && !safeMessages.shops.photos) {
        console.warn('⚠️ shops.photos missing in messages, adding fallback');
        const photoTexts = {
            'ja': '写真',
            'en': 'Photos',
            'zh': '照片',
            'es': 'Fotos',
            'pt-BR': 'Fotos'
        };
        safeMessages.shops = {
            ...safeMessages.shops,
            photos: photoTexts[locale] || 'Photos'
        };
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$shared$2f$NextIntlClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NextIntlClientProvider$3e$__["NextIntlClientProvider"], {
        locale: locale,
        messages: safeMessages,
        onError: (error)=>{
            // Silently handle missing translation keys - getMessageFallback will handle them
            // Only log unexpected errors in development
            if (("TURBOPACK compile-time value", "development") === 'development' && error.code !== 'MISSING_MESSAGE') {
                console.warn('next-intl error:', error);
            }
        },
        getMessageFallback: ({ namespace, key, error })=>{
            // Provide fallback for missing messages
            if (key === 'shops.photos') {
                const photoTexts = {
                    'ja': '写真',
                    'en': 'Photos',
                    'zh': '照片',
                    'es': 'Fotos',
                    'pt-BR': 'Fotos'
                };
                return photoTexts[locale] || 'Photos';
            }
            // Handle missing city/prefecture keys gracefully
            if (key.startsWith('cities.') || key.startsWith('prefectures.')) {
                // Extract the name from the key (e.g., "cities.tokyo" -> "tokyo")
                const name = key.split('.').pop() || key;
                // Format nicely: replace dashes/underscores with spaces, capitalize words
                return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (l)=>l.toUpperCase()).trim();
            }
            // For other missing keys, return the key itself (next-intl will handle it)
            return key;
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/components/NextIntlProvider.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}
_s(NextIntlProviderWrapper, "g7k7oua2k5rdGqPzWEsfuHRwWuM=");
_c = NextIntlProviderWrapper;
var _c;
__turbopack_context__.k.register(_c, "NextIntlProviderWrapper");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_dashboard_f9f56223._.js.map
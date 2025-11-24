module.exports = [
"[project]/apps/dashboard/app/components/LanguageSwitcher.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LanguageSwitcher",
    ()=>LanguageSwitcher
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
'use client';
;
;
;
const languages = [
    {
        code: 'ja',
        name: '日本語',
        flag: '🇯🇵'
    },
    {
        code: 'en',
        name: 'English',
        flag: '🇺🇸'
    },
    {
        code: 'zh',
        name: '中文',
        flag: '🇨🇳'
    },
    {
        code: 'es',
        name: 'Español',
        flag: '🇪🇸'
    },
    {
        code: 'pt-BR',
        name: 'Português',
        flag: '🇧🇷'
    }
];
function LanguageSwitcher() {
    const [currentLocale, setCurrentLocale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('ja');
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Get current locale from cookie or localStorage
        const getStoredLocale = ()=>{
            if ("TURBOPACK compile-time truthy", 1) return 'ja';
            //TURBOPACK unreachable
            ;
            const cookies = undefined;
            const langCookie = undefined;
            const stored = undefined;
        };
        setCurrentLocale(getStoredLocale());
    }, []);
    const changeLanguage = (locale)=>{
        // Save to both cookie and localStorage
        document.cookie = `yoyaku_yo_language=${locale}; path=/; max-age=31536000`; // 1 year
        localStorage.setItem('yoyaku_yo_language', locale);
        setCurrentLocale(locale);
        setIsOpen(false);
        // Dispatch custom event to notify NextIntlProvider
        window.dispatchEvent(new Event('languageChanged'));
        // Refresh the page to apply new locale
        router.refresh();
    };
    const currentLang = languages.find((l)=>l.code === currentLocale) || languages[0];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsOpen(!isOpen),
                className: "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors",
                "aria-label": "Change language",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-lg",
                        children: currentLang.flag
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm font-medium text-gray-700",
                        children: currentLang.code.toUpperCase()
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: `w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`,
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M19 9l-7 7-7-7"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                            lineNumber: 77,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed inset-0 z-10",
                        onClick: ()=>setIsOpen(false)
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                        lineNumber: 83,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "py-1",
                            children: languages.map((lang)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>changeLanguage(lang.code),
                                    className: `w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-100 transition-colors ${currentLocale === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-lg",
                                            children: lang.flag
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                                            lineNumber: 97,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm",
                                            children: lang.name
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                                            lineNumber: 98,
                                            columnNumber: 19
                                        }, this),
                                        currentLocale === lang.code && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "ml-auto text-blue-600",
                                            children: "✓"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                                            lineNumber: 100,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, lang.code, true, {
                                    fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                                    lineNumber: 90,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                            lineNumber: 88,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/components/LanguageSwitcher.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/dashboard/lib/shopBrowseData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/lib/shopBrowseData.ts
// Data shaping helpers for browse page - converts flat shop list into nested structures
__turbopack_context__.s([
    "buildAreaTree",
    ()=>buildAreaTree,
    "buildCategoryTree",
    ()=>buildCategoryTree,
    "extractCity",
    ()=>extractCity,
    "extractPrefecture",
    ()=>extractPrefecture,
    "filterShopsBySearch",
    ()=>filterShopsBySearch
]);
function extractPrefecture(shop) {
    const address = shop.address || '';
    const city = shop.city || '';
    const combined = `${address} ${city}`.toLowerCase();
    // Japanese prefecture names
    const prefecturePatterns = [
        {
            pattern: /東京都|tokyo|東京/i,
            name: '東京都',
            key: 'tokyo'
        },
        {
            pattern: /大阪府|osaka|大阪/i,
            name: '大阪府',
            key: 'osaka'
        },
        {
            pattern: /京都府|kyoto|京都/i,
            name: '京都府',
            key: 'kyoto'
        },
        {
            pattern: /北海道|hokkaido|hokkaidō/i,
            name: '北海道',
            key: 'hokkaido'
        },
        {
            pattern: /青森県|aomori/i,
            name: '青森県',
            key: 'aomori'
        },
        {
            pattern: /岩手県|iwate/i,
            name: '岩手県',
            key: 'iwate'
        },
        {
            pattern: /宮城県|miyagi/i,
            name: '宮城県',
            key: 'miyagi'
        },
        {
            pattern: /秋田県|akita/i,
            name: '秋田県',
            key: 'akita'
        },
        {
            pattern: /山形県|yamagata/i,
            name: '山形県',
            key: 'yamagata'
        },
        {
            pattern: /福島県|fukushima/i,
            name: '福島県',
            key: 'fukushima'
        },
        {
            pattern: /茨城県|ibaraki/i,
            name: '茨城県',
            key: 'ibaraki'
        },
        {
            pattern: /栃木県|tochigi/i,
            name: '栃木県',
            key: 'tochigi'
        },
        {
            pattern: /群馬県|gunma/i,
            name: '群馬県',
            key: 'gunma'
        },
        {
            pattern: /埼玉県|saitama/i,
            name: '埼玉県',
            key: 'saitama'
        },
        {
            pattern: /千葉県|chiba/i,
            name: '千葉県',
            key: 'chiba'
        },
        {
            pattern: /神奈川県|kanagawa/i,
            name: '神奈川県',
            key: 'kanagawa'
        },
        {
            pattern: /新潟県|niigata/i,
            name: '新潟県',
            key: 'niigata'
        },
        {
            pattern: /富山県|toyama/i,
            name: '富山県',
            key: 'toyama'
        },
        {
            pattern: /石川県|ishikawa/i,
            name: '石川県',
            key: 'ishikawa'
        },
        {
            pattern: /福井県|fukui/i,
            name: '福井県',
            key: 'fukui'
        },
        {
            pattern: /山梨県|yamanashi/i,
            name: '山梨県',
            key: 'yamanashi'
        },
        {
            pattern: /長野県|nagano/i,
            name: '長野県',
            key: 'nagano'
        },
        {
            pattern: /岐阜県|gifu/i,
            name: '岐阜県',
            key: 'gifu'
        },
        {
            pattern: /静岡県|shizuoka/i,
            name: '静岡県',
            key: 'shizuoka'
        },
        {
            pattern: /愛知県|aichi/i,
            name: '愛知県',
            key: 'aichi'
        },
        {
            pattern: /三重県|mie/i,
            name: '三重県',
            key: 'mie'
        },
        {
            pattern: /滋賀県|shiga/i,
            name: '滋賀県',
            key: 'shiga'
        },
        {
            pattern: /兵庫県|hyogo|hyōgo/i,
            name: '兵庫県',
            key: 'hyogo'
        },
        {
            pattern: /奈良県|nara/i,
            name: '奈良県',
            key: 'nara'
        },
        {
            pattern: /和歌山県|wakayama/i,
            name: '和歌山県',
            key: 'wakayama'
        },
        {
            pattern: /鳥取県|tottori/i,
            name: '鳥取県',
            key: 'tottori'
        },
        {
            pattern: /島根県|shimane/i,
            name: '島根県',
            key: 'shimane'
        },
        {
            pattern: /岡山県|okayama/i,
            name: '岡山県',
            key: 'okayama'
        },
        {
            pattern: /広島県|hiroshima/i,
            name: '広島県',
            key: 'hiroshima'
        },
        {
            pattern: /山口県|yamaguchi/i,
            name: '山口県',
            key: 'yamaguchi'
        },
        {
            pattern: /徳島県|tokushima/i,
            name: '徳島県',
            key: 'tokushima'
        },
        {
            pattern: /香川県|kagawa/i,
            name: '香川県',
            key: 'kagawa'
        },
        {
            pattern: /愛媛県|ehime/i,
            name: '愛媛県',
            key: 'ehime'
        },
        {
            pattern: /高知県|kochi/i,
            name: '高知県',
            key: 'kochi'
        },
        {
            pattern: /福岡県|fukuoka/i,
            name: '福岡県',
            key: 'fukuoka'
        },
        {
            pattern: /佐賀県|saga/i,
            name: '佐賀県',
            key: 'saga'
        },
        {
            pattern: /長崎県|nagasaki/i,
            name: '長崎県',
            key: 'nagasaki'
        },
        {
            pattern: /熊本県|kumamoto/i,
            name: '熊本県',
            key: 'kumamoto'
        },
        {
            pattern: /大分県|oita/i,
            name: '大分県',
            key: 'oita'
        },
        {
            pattern: /宮崎県|miyazaki/i,
            name: '宮崎県',
            key: 'miyazaki'
        },
        {
            pattern: /鹿児島県|kagoshima/i,
            name: '鹿児島県',
            key: 'kagoshima'
        },
        {
            pattern: /沖縄県|okinawa/i,
            name: '沖縄県',
            key: 'okinawa'
        }
    ];
    for (const { pattern, name, key } of prefecturePatterns){
        if (pattern.test(combined)) {
            return key;
        }
    }
    return 'unknown';
}
function extractCity(shop) {
    // Use city field if available
    if (shop.city && shop.city.trim()) {
        return shop.city.trim();
    }
    // Extract from address
    const address = shop.address || '';
    // Try to extract ward/city patterns
    // Pattern: "X区", "X市", "X-ku", "X-shi", "X ku", "X shi"
    const patterns = [
        /([^\s,]+)[区市町村]/,
        /([^\s,]+)[-\s](ku|shi|city|ward|区|市|町|村)/i
    ];
    for (const pattern of patterns){
        const match = address.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    // Fallback: try to get first meaningful word from address
    const words = address.split(/[,\s]+/).filter((w)=>w.length > 1);
    if (words.length > 0) {
        return words[0];
    }
    return 'unknown';
}
function buildAreaTree(shops) {
    const tree = {};
    for (const shop of shops){
        // Skip hidden shops
        if (shop.claim_status === 'hidden') continue;
        const prefectureKey = extractPrefecture(shop);
        const cityKey = extractCity(shop);
        // Initialize prefecture if needed
        if (!tree[prefectureKey]) {
            tree[prefectureKey] = {
                name: prefectureKey,
                cities: {},
                shopCount: 0
            };
        }
        // Initialize city if needed
        if (!tree[prefectureKey].cities[cityKey]) {
            tree[prefectureKey].cities[cityKey] = {
                name: cityKey,
                shopCount: 0,
                shops: []
            };
        }
        // Add shop
        tree[prefectureKey].cities[cityKey].shops.push(shop);
        tree[prefectureKey].cities[cityKey].shopCount++;
        tree[prefectureKey].shopCount++;
    }
    return tree;
}
function buildCategoryTree(shops, categories) {
    const tree = {};
    const categoryMap = new Map(categories.map((cat)=>[
            cat.id,
            cat
        ]));
    for (const shop of shops){
        // Skip hidden shops
        if (shop.claim_status === 'hidden') continue;
        const categoryId = shop.category_id || 'unknown';
        const category = categoryMap.get(categoryId) || shop.categories;
        const categoryName = category?.name || 'Unknown';
        const prefectureKey = extractPrefecture(shop);
        const cityKey = extractCity(shop);
        // Initialize category if needed
        if (!tree[categoryId]) {
            tree[categoryId] = {
                name: categoryName,
                slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
                shopCount: 0,
                prefectures: {}
            };
        }
        // Initialize prefecture if needed
        if (!tree[categoryId].prefectures[prefectureKey]) {
            tree[categoryId].prefectures[prefectureKey] = {
                name: prefectureKey,
                shopCount: 0,
                cities: {}
            };
        }
        // Initialize city if needed
        if (!tree[categoryId].prefectures[prefectureKey].cities[cityKey]) {
            tree[categoryId].prefectures[prefectureKey].cities[cityKey] = {
                name: cityKey,
                shopCount: 0,
                shops: []
            };
        }
        // Add shop
        tree[categoryId].prefectures[prefectureKey].cities[cityKey].shops.push(shop);
        tree[categoryId].prefectures[prefectureKey].cities[cityKey].shopCount++;
        tree[categoryId].prefectures[prefectureKey].shopCount++;
        tree[categoryId].shopCount++;
    }
    return tree;
}
function filterShopsBySearch(shops, searchQuery) {
    if (!searchQuery.trim()) return shops;
    const query = searchQuery.toLowerCase().trim();
    return shops.filter((shop)=>{
        // Search in name
        if (shop.name.toLowerCase().includes(query)) return true;
        // Search in address
        if (shop.address?.toLowerCase().includes(query)) return true;
        // Search in city
        if (shop.city?.toLowerCase().includes(query)) return true;
        // Search in category name
        if (shop.categories?.name.toLowerCase().includes(query)) return true;
        return false;
    });
}
}),
"[project]/apps/dashboard/app/browse/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/browse/page.tsx
// Redesigned browse page with "By Area" and "By Category" navigation modes
__turbopack_context__.s([
    "default",
    ()=>BrowsePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/apiClient.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageSwitcher$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/LanguageSwitcher.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$shopBrowseData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/shopBrowseData.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
function BrowsePageContent() {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTranslations"])();
    const [shops, setShops] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [categories, setCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get('search') || '');
    const [browseMode, setBrowseMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get('mode') || 'area');
    // Navigation state
    const [selectedPrefecture, setSelectedPrefecture] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get('prefecture') || null);
    const [selectedCity, setSelectedCity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get('city') || null);
    const [selectedCategoryId, setSelectedCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get('category') || null);
    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchQuery);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const timer = setTimeout(()=>{
            setDebouncedSearch(searchQuery);
        }, 500);
        return ()=>clearTimeout(timer);
    }, [
        searchQuery
    ]);
    // Fetch categories
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchCategories = async ()=>{
            try {
                const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiUrl"]}/categories`);
                if (res.ok) {
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await res.json();
                        setCategories(Array.isArray(data) ? data : []);
                    }
                }
            } catch (error) {
                if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                    console.error('Error fetching categories:', error);
                }
                setCategories([]);
            }
        };
        fetchCategories();
    }, [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiUrl"]
    ]);
    // Fetch shops
    const fetchShops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (debouncedSearch.trim()) {
                params.set('search', debouncedSearch.trim());
            }
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiUrl"]}/shops${params.toString() ? `?${params.toString()}` : ''}`);
            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    const shopsArray = Array.isArray(data) ? data : data.shops || [];
                    const visibleShops = shopsArray.filter((shop)=>!shop.claim_status || shop.claim_status !== 'hidden');
                    setShops(visibleShops);
                }
            }
        } catch (error) {
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error fetching shops:', error);
            }
            setShops([]);
        } finally{
            setLoading(false);
        }
    }, [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiUrl"],
        debouncedSearch
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchShops();
    }, [
        fetchShops
    ]);
    // Update URL when filters change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (browseMode) params.set('mode', browseMode);
        if (selectedPrefecture) params.set('prefecture', selectedPrefecture);
        if (selectedCity) params.set('city', selectedCity);
        if (selectedCategoryId) params.set('category', selectedCategoryId);
        const newUrl = `/browse${params.toString() ? `?${params.toString()}` : ''}`;
        router.replace(newUrl, {
            scroll: false
        });
    }, [
        debouncedSearch,
        browseMode,
        selectedPrefecture,
        selectedCity,
        selectedCategoryId,
        router
    ]);
    // Build data trees
    const filteredShops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$shopBrowseData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["filterShopsBySearch"])(shops, debouncedSearch);
    }, [
        shops,
        debouncedSearch
    ]);
    const areaTree = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$shopBrowseData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildAreaTree"])(filteredShops);
    }, [
        filteredShops
    ]);
    const categoryTree = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$shopBrowseData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildCategoryTree"])(filteredShops, categories);
    }, [
        filteredShops,
        categories
    ]);
    // Get translated prefecture name
    const getPrefectureName = (key)=>{
        try {
            const translated = t(`prefectures.${key}`);
            return translated !== `prefectures.${key}` ? translated : key;
        } catch  {
            return key;
        }
    };
    // Get translated city name
    const getCityName = (key)=>{
        try {
            const translated = t(`cities.${key}`);
            return translated !== `cities.${key}` ? translated : key;
        } catch  {
            return key;
        }
    };
    // Get translated category name
    const getCategoryName = (categoryName)=>{
        const key = categoryName.toLowerCase().replace(/\s+/g, '_');
        try {
            const translated = t(`categories.${key}`);
            return translated !== `categories.${key}` ? translated : categoryName;
        } catch  {
            return categoryName;
        }
    };
    // Get shops to display based on current selection
    const displayShops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        let shops = [];
        if (browseMode === 'area') {
            if (selectedCity && selectedPrefecture) {
                shops = areaTree[selectedPrefecture]?.cities[selectedCity]?.shops || [];
            } else if (selectedPrefecture) {
                // Return all shops in prefecture
                const prefecture = areaTree[selectedPrefecture];
                if (prefecture) {
                    shops = Object.values(prefecture.cities).flatMap((city)=>city.shops);
                }
            }
        } else {
            // Category mode
            if (selectedCity && selectedPrefecture && selectedCategoryId) {
                shops = categoryTree[selectedCategoryId]?.prefectures[selectedPrefecture]?.cities[selectedCity]?.shops || [];
            } else if (selectedPrefecture && selectedCategoryId) {
                const category = categoryTree[selectedCategoryId];
                if (category) {
                    const prefecture = category.prefectures[selectedPrefecture];
                    if (prefecture) {
                        shops = Object.values(prefecture.cities).flatMap((city)=>city.shops);
                    }
                }
            } else if (selectedCategoryId) {
                const category = categoryTree[selectedCategoryId];
                if (category) {
                    shops = Object.values(category.prefectures).flatMap((pref)=>Object.values(pref.cities).flatMap((city)=>city.shops));
                }
            }
        }
        // Deduplicate shops by ID to prevent duplicate key errors
        const seen = new Set();
        return shops.filter((shop)=>{
            if (seen.has(shop.id)) {
                return false;
            }
            seen.add(shop.id);
            return true;
        });
    }, [
        browseMode,
        selectedPrefecture,
        selectedCity,
        selectedCategoryId,
        areaTree,
        categoryTree
    ]);
    // Reset navigation when mode changes
    const handleModeChange = (mode)=>{
        setBrowseMode(mode);
        setSelectedPrefecture(null);
        setSelectedCity(null);
        setSelectedCategoryId(null);
    };
    // Sort prefectures by name
    const sortedPrefectures = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const prefs = Object.keys(browseMode === 'area' ? areaTree : selectedCategoryId && categoryTree[selectedCategoryId] ? categoryTree[selectedCategoryId].prefectures : {});
        return prefs.sort((a, b)=>{
            const nameA = getPrefectureName(a);
            const nameB = getPrefectureName(b);
            return nameA.localeCompare(nameB, 'ja');
        });
    }, [
        browseMode,
        areaTree,
        categoryTree,
        selectedCategoryId,
        getPrefectureName
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white border-b border-gray-200 sticky top-0 z-20",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 py-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-2xl font-bold text-gray-900",
                                children: t('shops.shops')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 247,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$LanguageSwitcher$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LanguageSwitcher"], {}, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 250,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 246,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                    lineNumber: 245,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 244,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-7xl mx-auto px-4 py-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            value: searchQuery,
                            onChange: (e)=>setSearchQuery(e.target.value),
                            placeholder: t('shops.searchPlaceholder'),
                            className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                            lineNumber: 258,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 257,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6 border-b border-gray-200",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handleModeChange('area'),
                                    className: `px-4 py-2 font-medium border-b-2 transition-colors ${browseMode === 'area' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`,
                                    children: t('browse.byArea')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 270,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handleModeChange('category'),
                                    className: `px-4 py-2 font-medium border-b-2 transition-colors ${browseMode === 'category' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`,
                                    children: t('browse.byCategory')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 280,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                            lineNumber: 269,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 268,
                        columnNumber: 9
                    }, this),
                    loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 295,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-gray-600",
                                children: t('shops.loading')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 296,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 294,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 lg:grid-cols-4 gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                                className: "lg:col-span-1",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white rounded-xl border border-gray-200 p-4 sticky top-24",
                                    children: browseMode === 'area' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AreaNavigation, {
                                        areaTree: areaTree,
                                        selectedPrefecture: selectedPrefecture,
                                        selectedCity: selectedCity,
                                        onSelectPrefecture: setSelectedPrefecture,
                                        onSelectCity: setSelectedCity,
                                        getPrefectureName: getPrefectureName,
                                        getCityName: getCityName,
                                        t: t
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 304,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CategoryNavigation, {
                                        categoryTree: categoryTree,
                                        categories: categories,
                                        selectedCategoryId: selectedCategoryId,
                                        selectedPrefecture: selectedPrefecture,
                                        selectedCity: selectedCity,
                                        onSelectCategory: setSelectedCategoryId,
                                        onSelectPrefecture: setSelectedPrefecture,
                                        onSelectCity: setSelectedCity,
                                        getCategoryName: getCategoryName,
                                        getPrefectureName: getPrefectureName,
                                        getCityName: getCityName,
                                        t: t
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 315,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 302,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 301,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-3",
                                children: displayShops.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white rounded-xl border border-gray-200 p-12 text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-6xl mb-4",
                                            children: "🏪"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 337,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-bold text-gray-900 mb-2",
                                            children: t('shops.noShops')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 338,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-600",
                                            children: t('shops.tryAdjusting')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 339,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 336,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mb-4 text-sm text-gray-600",
                                            children: t('shops.shopsFound', {
                                                count: displayShops.length
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 343,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                                            children: displayShops.map((shop)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ShopCard, {
                                                    shop: shop,
                                                    getCategoryName: getCategoryName,
                                                    t: t
                                                }, shop.id, false, {
                                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                    lineNumber: 348,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 346,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 334,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 299,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 255,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
        lineNumber: 242,
        columnNumber: 5
    }, this);
}
// Area Navigation Component
function AreaNavigation({ areaTree, selectedPrefecture, selectedCity, onSelectPrefecture, onSelectCity, getPrefectureName, getCityName, t }) {
    const sortedPrefectures = Object.keys(areaTree).sort((a, b)=>{
        const nameA = getPrefectureName(a);
        const nameB = getPrefectureName(b);
        return nameA.localeCompare(nameB, 'ja');
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "font-semibold text-gray-900",
                children: t('browse.prefecture')
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 389,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2 max-h-96 overflow-y-auto",
                children: sortedPrefectures.map((prefKey)=>{
                    const prefecture = areaTree[prefKey];
                    const isSelected = selectedPrefecture === prefKey;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    onSelectPrefecture(isSelected ? null : prefKey);
                                    onSelectCity(null);
                                },
                                className: `w-full text-left px-3 py-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: getPrefectureName(prefKey)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 408,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-gray-500",
                                            children: [
                                                "(",
                                                prefecture.shopCount,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 409,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 407,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 396,
                                columnNumber: 15
                            }, this),
                            isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 ml-4 space-y-1",
                                children: Object.keys(prefecture.cities).sort((a, b)=>{
                                    const nameA = getCityName(a);
                                    const nameB = getCityName(b);
                                    return nameA.localeCompare(nameB, 'ja');
                                }).map((cityKey)=>{
                                    const city = prefecture.cities[cityKey];
                                    const isCitySelected = selectedCity === cityKey;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onSelectCity(isCitySelected ? null : cityKey),
                                        className: `w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${isCitySelected ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: getCityName(cityKey)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                    lineNumber: 434,
                                                    columnNumber: 29
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs text-gray-500",
                                                    children: [
                                                        "(",
                                                        city.shopCount,
                                                        ")"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                    lineNumber: 435,
                                                    columnNumber: 29
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 433,
                                            columnNumber: 27
                                        }, this)
                                    }, cityKey, false, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 424,
                                        columnNumber: 25
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 413,
                                columnNumber: 17
                            }, this)
                        ]
                    }, prefKey, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 395,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 390,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
        lineNumber: 388,
        columnNumber: 5
    }, this);
}
// Category Navigation Component
function CategoryNavigation({ categoryTree, categories, selectedCategoryId, selectedPrefecture, selectedCity, onSelectCategory, onSelectPrefecture, onSelectCity, getCategoryName, getPrefectureName, getCityName, t }) {
    const sortedCategories = categories.filter((cat)=>categoryTree[cat.id]).sort((a, b)=>{
        const nameA = getCategoryName(a.name);
        const nameB = getCategoryName(b.name);
        return nameA.localeCompare(nameB);
    });
    const selectedCategory = selectedCategoryId ? categoryTree[selectedCategoryId] : null;
    const selectedPrefectureData = selectedCategory && selectedPrefecture ? selectedCategory.prefectures[selectedPrefecture] : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "font-semibold text-gray-900",
                children: t('browse.category')
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 493,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2 max-h-96 overflow-y-auto",
                children: sortedCategories.map((category)=>{
                    const categoryData = categoryTree[category.id];
                    const isSelected = selectedCategoryId === category.id;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    onSelectCategory(isSelected ? null : category.id);
                                    onSelectPrefecture(null);
                                    onSelectCity(null);
                                },
                                className: `w-full text-left px-3 py-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: getCategoryName(category.name)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 513,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-gray-500",
                                            children: [
                                                "(",
                                                categoryData.shopCount,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 514,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 512,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 500,
                                columnNumber: 15
                            }, this),
                            isSelected && selectedCategory && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: selectedPrefecture ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-2 ml-4 space-y-1",
                                    children: selectedPrefectureData && Object.keys(selectedPrefectureData.cities).sort((a, b)=>{
                                        const nameA = getCityName(a);
                                        const nameB = getCityName(b);
                                        return nameA.localeCompare(nameB, 'ja');
                                    }).map((cityKey)=>{
                                        const city = selectedPrefectureData.cities[cityKey];
                                        const isCitySelected = selectedCity === cityKey;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>onSelectCity(isCitySelected ? null : cityKey),
                                            className: `w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${isCitySelected ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: getCityName(cityKey)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                        lineNumber: 541,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-500",
                                                        children: [
                                                            "(",
                                                            city.shopCount,
                                                            ")"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                        lineNumber: 542,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 540,
                                                columnNumber: 31
                                            }, this)
                                        }, cityKey, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 531,
                                            columnNumber: 29
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 520,
                                    columnNumber: 21
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-2 ml-4 space-y-1",
                                    children: Object.keys(selectedCategory.prefectures).sort((a, b)=>{
                                        const nameA = getPrefectureName(a);
                                        const nameB = getPrefectureName(b);
                                        return nameA.localeCompare(nameB, 'ja');
                                    }).map((prefKey)=>{
                                        const prefecture = selectedCategory.prefectures[prefKey];
                                        const isPrefSelected = selectedPrefecture === prefKey;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                onSelectPrefecture(isPrefSelected ? null : prefKey);
                                                onSelectCity(null);
                                            },
                                            className: `w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${isPrefSelected ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: getPrefectureName(prefKey)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                        lineNumber: 573,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-500",
                                                        children: [
                                                            "(",
                                                            prefecture.shopCount,
                                                            ")"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                        lineNumber: 574,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 572,
                                                columnNumber: 31
                                            }, this)
                                        }, prefKey, false, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 560,
                                            columnNumber: 29
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 549,
                                    columnNumber: 21
                                }, this)
                            }, void 0, false)
                        ]
                    }, category.id, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 499,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 494,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
        lineNumber: 492,
        columnNumber: 5
    }, this);
}
// Shop Card Component
function ShopCard({ shop, getCategoryName, t }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        href: `/shops/${shop.id}`,
        className: "bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow",
        children: [
            shop.image_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-48 overflow-hidden bg-gray-100",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: shop.image_url,
                    alt: shop.name,
                    className: "w-full h-full object-cover"
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                    lineNumber: 600,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 599,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-bold text-gray-900 mb-1",
                                children: shop.name
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 609,
                                columnNumber: 11
                            }, this),
                            shop.categories && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded",
                                children: getCategoryName(shop.categories.name)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 611,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 608,
                        columnNumber: 9
                    }, this),
                    shop.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600 text-sm mb-3 line-clamp-2",
                        children: shop.description.length > 100 ? shop.description.substring(0, 100) + '...' : shop.description
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 617,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-500 text-sm mb-4",
                        children: shop.address
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 621,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg",
                            children: [
                                t('shops.viewDetails'),
                                " →"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                            lineNumber: 623,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 622,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 607,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
        lineNumber: 594,
        columnNumber: 5
    }, this);
}
function BrowsePage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center min-h-[400px]",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 637,
                        columnNumber: 11
                    }, void 0),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-gray-600",
                        children: "Loading..."
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 638,
                        columnNumber: 11
                    }, void 0)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 636,
                columnNumber: 9
            }, void 0)
        }, void 0, false, {
            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
            lineNumber: 635,
            columnNumber: 7
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BrowsePageContent, {}, void 0, false, {
            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
            lineNumber: 642,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
        lineNumber: 634,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=apps_dashboard_4e41cfc6._.js.map
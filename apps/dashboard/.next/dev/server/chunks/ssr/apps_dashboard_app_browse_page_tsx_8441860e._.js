module.exports = [
"[project]/apps/dashboard/app/browse/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/browse/page.tsx
// Public shops directory with perfect category + location grouping
__turbopack_context__.s([
    "default",
    ()=>PublicShopsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
// Tokyo 23 wards
const TOKYO_WARDS = [
    'chiyoda',
    'chuo',
    'minato',
    'shinjuku',
    'bunkyo',
    'taito',
    'sumida',
    'koto',
    'shinagawa',
    'meguro',
    'ota',
    'setagaya',
    'shibuya',
    'nakano',
    'suginami',
    'toshima',
    'kita',
    'arakawa',
    'itabashi',
    'nerima',
    'adachi',
    'katsushika',
    'edogawa'
];
// Extract city/ward from address and return translation key
function extractAreaKey(address) {
    if (!address) return 'unknown';
    const addrLower = address.toLowerCase();
    // Check for Tokyo 23 wards first (most specific)
    const tokyoWardMap = {
        'chiyoda': 'cities.chiyoda',
        'chuo': 'cities.chuo',
        'minato': 'cities.minato',
        'shinjuku': 'cities.shinjuku',
        'bunkyo': 'cities.bunkyo',
        'taito': 'cities.taito',
        'sumida': 'cities.sumida',
        'koto': 'cities.koto',
        'shinagawa': 'cities.shinagawa',
        'meguro': 'cities.meguro',
        'ota': 'cities.ota',
        'setagaya': 'cities.setagaya',
        'shibuya': 'cities.shibuya',
        'nakano': 'cities.nakano',
        'suginami': 'cities.suginami',
        'toshima': 'cities.toshima',
        'kita': 'cities.kita',
        'arakawa': 'cities.arakawa',
        'itabashi': 'cities.itabashi',
        'nerima': 'cities.nerima',
        'adachi': 'cities.adachi',
        'katsushika': 'cities.katsushika',
        'edogawa': 'cities.edogawa'
    };
    for (const [ward, key] of Object.entries(tokyoWardMap)){
        if (addrLower.includes(`${ward}-ku`) || addrLower.includes(`${ward} ku`) || addrLower.includes(`${ward}区`)) {
            return key;
        }
    }
    // Check for major cities with common English names
    const majorCityMap = [
        {
            pattern: /umeda|北区/i,
            key: 'cities.osaka_kita'
        },
        {
            pattern: /namba|難波/i,
            key: 'cities.namba'
        },
        {
            pattern: /shinsaibashi|心斎橋/i,
            key: 'cities.shinsaibashi'
        },
        {
            pattern: /dotonbori|道頓堀/i,
            key: 'cities.dotonbori'
        },
        {
            pattern: /tennoji|天王寺/i,
            key: 'cities.tennoji'
        },
        {
            pattern: /roppongi|六本木/i,
            key: 'cities.roppongi'
        },
        {
            pattern: /ginza|銀座/i,
            key: 'cities.ginza'
        },
        {
            pattern: /akihabara|秋葉原/i,
            key: 'cities.akihabara'
        },
        {
            pattern: /harajuku|原宿/i,
            key: 'cities.harajuku'
        },
        {
            pattern: /asakusa|浅草/i,
            key: 'cities.asakusa'
        },
        {
            pattern: /omotesando|表参道/i,
            key: 'cities.omotesando'
        },
        {
            pattern: /ikebukuro|池袋/i,
            key: 'cities.ikebukuro'
        },
        {
            pattern: /ueno|上野/i,
            key: 'cities.ueno'
        },
        {
            pattern: /yokohama|横浜/i,
            key: 'cities.yokohama'
        },
        {
            pattern: /osaka|大阪/i,
            key: 'cities.osaka'
        },
        {
            pattern: /kyoto|京都/i,
            key: 'cities.kyoto'
        },
        {
            pattern: /sapporo|札幌/i,
            key: 'cities.sapporo'
        },
        {
            pattern: /fukuoka|福岡/i,
            key: 'cities.fukuoka'
        },
        {
            pattern: /nagoya|名古屋/i,
            key: 'cities.nagoya'
        },
        {
            pattern: /kobe|神戸/i,
            key: 'cities.kobe'
        },
        {
            pattern: /sendai|仙台/i,
            key: 'cities.sendai'
        },
        {
            pattern: /hiroshima|広島/i,
            key: 'cities.hiroshima'
        }
    ];
    for (const city of majorCityMap){
        if (city.pattern.test(address)) {
            return city.key;
        }
    }
    // Extract ward/city pattern: "X-ku", "X ku", "X-shi", "X shi", "X区", "X市"
    const wardMatch = address.match(/([^\s,]+)[-\s](ku|shi|city|区|市)/i);
    if (wardMatch) {
        const area = wardMatch[1].toLowerCase();
        // Try to find translation key
        const cityKey = `cities.${area}`;
        return cityKey;
    }
    // Fallback: return raw area name (will be displayed as-is if no translation)
    const words = address.split(/[,\s]+/).filter((w)=>w.length > 2);
    if (words.length > 0) {
        return words[0].toLowerCase();
    }
    return 'unknown';
}
// Get translated area name with safe error handling
function getTranslatedAreaName(areaKey, t) {
    // Helper to safely get translation
    const safeTranslate = (key)=>{
        try {
            const translated = t(key);
            // If translation equals the key, it means the key wasn't found
            return translated !== key ? translated : null;
        } catch (error) {
            // Translation key doesn't exist, return null
            return null;
        }
    };
    // If it's a translation key (starts with cities. or prefectures.)
    if (areaKey.startsWith('cities.') || areaKey.startsWith('prefectures.')) {
        const translated = safeTranslate(areaKey);
        if (translated) return translated;
        // Fallback: extract the last part of the key (city/prefecture name)
        const fallback = areaKey.split('.').pop() || areaKey;
        // Clean up the name (remove special characters, format nicely)
        return fallback.replace(/[-_]/g, ' ').replace(/\b\w/g, (l)=>l.toUpperCase());
    }
    // Try cities. prefix
    const cityKey = `cities.${areaKey}`;
    const cityTranslated = safeTranslate(cityKey);
    if (cityTranslated) return cityTranslated;
    // Fallback: format the area key nicely
    return areaKey.replace(/[-_]/g, ' ').replace(/\b\w/g, (l)=>l.toUpperCase()).trim();
}
// Map database category names to translation keys
const getCategoryTranslationKey = (categoryName)=>{
    const nameLower = categoryName.toLowerCase().trim();
    const mapping = {
        'barbershop': 'categories.barbershop',
        'beauty salon': 'categories.beauty_salon',
        'eyelash': 'categories.eyelash',
        'general salon': 'categories.general_salon',
        'hair salon': 'categories.hair_salon',
        'nail salon': 'categories.nail_salon',
        'spa & massage': 'categories.spa_massage',
        'spa and massage': 'categories.spa_massage',
        'dental clinic': 'categories.dental_clinic',
        'women\'s clinic': 'categories.womens_clinic',
        'hotels & ryokan': 'categories.hotels_ryokan',
        'restaurants & izakaya': 'categories.restaurants_izakaya',
        'spas, onsen & day-use bathhouses': 'categories.spas_onsen_bathhouses',
        'golf courses & practice ranges': 'categories.golf_courses_ranges',
        'private karaoke rooms': 'categories.private_karaoke_rooms',
        'unknown': 'categories.unknown'
    };
    return mapping[nameLower] || `categories.${nameLower.replace(/\s+/g, '_')}`;
};
// Get translated category name
const getTranslatedCategoryName = (categoryName, t)=>{
    const translationKey = getCategoryTranslationKey(categoryName);
    try {
        const translated = t(translationKey);
        // If translation equals the key, it means the key wasn't found
        return translated !== translationKey ? translated : categoryName;
    } catch (error) {
        // Translation key doesn't exist, return original category name
        return categoryName;
    }
};
function PublicShopsPageContent() {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTranslations"])();
    const [shops, setShops] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [categories, setCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [categoryCounts, setCategoryCounts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get('search') || '');
    const [selectedCategoryId, setSelectedCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get('category_id') || null);
    const [selectedArea, setSelectedArea] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get('area') || null);
    const [expandedCategories, setExpandedCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [expandedAreas, setExpandedAreas] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const apiUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
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
                const res = await fetch(`${apiUrl}/categories`);
                if (res.ok) {
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await res.json();
                        setCategories(Array.isArray(data) ? data : []);
                    }
                }
            } catch (error) {
                // Silently handle connection errors (API server not running)
                if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                    console.error('Error fetching categories:', error);
                }
                setCategories([]);
            }
        };
        fetchCategories();
    }, [
        apiUrl
    ]);
    // Fetch category stats
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchCategoryStats = async ()=>{
            try {
                const res = await fetch(`${apiUrl}/categories/stats`);
                if (res.ok) {
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await res.json();
                        if (data && typeof data === 'object' && !Array.isArray(data)) {
                            setCategoryCounts(data);
                        }
                    }
                }
            } catch (error) {
                // Silently handle connection errors (API server not running)
                if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                    console.error('Error fetching category stats:', error);
                }
                setCategoryCounts({});
            }
        };
        fetchCategoryStats();
    }, [
        apiUrl
    ]);
    // Fetch shops with filters
    const fetchShops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (debouncedSearch.trim()) {
                params.set('search', debouncedSearch.trim());
            }
            if (selectedCategoryId && selectedCategoryId !== 'all') {
                params.set('category_id', selectedCategoryId);
            }
            const res = await fetch(`${apiUrl}/shops${params.toString() ? `?${params.toString()}` : ''}`);
            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    const visibleShops = Array.isArray(data) ? data.filter((shop)=>!shop.claim_status || shop.claim_status !== 'hidden') : [];
                    setShops(visibleShops);
                }
            }
        } catch (error) {
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error fetching shops:', error);
            }
            setShops([]);
        } finally{
            setLoading(false);
        }
    }, [
        apiUrl,
        debouncedSearch,
        selectedCategoryId
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
        if (selectedCategoryId && selectedCategoryId !== 'all') params.set('category_id', selectedCategoryId);
        if (selectedArea) params.set('area', selectedArea);
        const newUrl = `/browse${params.toString() ? `?${params.toString()}` : ''}`;
        router.replace(newUrl, {
            scroll: false
        });
    }, [
        debouncedSearch,
        selectedCategoryId,
        selectedArea,
        router
    ]);
    // Group shops by category, then by area
    const groupedShops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const categoryMap = new Map();
        // Filter shops by selected area if any
        const filteredShops = selectedArea ? shops.filter((shop)=>{
            const areaKey = extractAreaKey(shop.address);
            const translatedName = getTranslatedAreaName(areaKey, t);
            return translatedName === selectedArea || areaKey === selectedArea;
        }) : shops;
        // Group by category, then by area
        filteredShops.forEach((shop)=>{
            const categoryId = shop.category_id || 'unknown';
            const categoryName = shop.categories?.name || 'Unknown';
            const areaKey = extractAreaKey(shop.address);
            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, new Map());
            }
            const areaMap = categoryMap.get(categoryId);
            if (!areaMap.has(areaKey)) {
                areaMap.set(areaKey, []);
            }
            areaMap.get(areaKey).push(shop);
        });
        // Convert to CategoryGroup array
        const categoryGroups = [];
        categoryMap.forEach((areaMap, categoryId)=>{
            const firstShop = Array.from(areaMap.values())[0]?.[0];
            const categoryName = firstShop?.categories?.name || 'Unknown';
            // Convert areas to array and sort by count
            const areas = Array.from(areaMap.entries()).map(([areaKey, shops])=>({
                    areaName: getTranslatedAreaName(areaKey, t),
                    areaKey,
                    shops,
                    count: shops.length
                })).sort((a, b)=>b.count - a.count); // Sort by count descending
            const totalShops = areas.reduce((sum, area)=>sum + area.count, 0);
            categoryGroups.push({
                categoryId,
                categoryName,
                areas,
                totalShops
            });
        });
        // Sort categories by total shops descending
        categoryGroups.sort((a, b)=>b.totalShops - a.totalShops);
        return categoryGroups;
    }, [
        shops,
        selectedArea
    ]);
    // Auto-expand categories with shops
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const newExpanded = new Set();
        groupedShops.forEach((group)=>{
            if (group.totalShops > 0) {
                newExpanded.add(group.categoryId);
            }
        });
        setExpandedCategories(newExpanded);
    }, [
        groupedShops
    ]);
    const handleCategoryClick = (categoryId)=>{
        setSelectedCategoryId(categoryId);
        setSelectedArea(null); // Clear area filter when changing category
    };
    const handleAreaClick = (area)=>{
        setSelectedArea(area);
    };
    const clearAreaFilter = ()=>{
        setSelectedArea(null);
    };
    const toggleCategory = (categoryId)=>{
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };
    const truncateDescription = (text, maxLength = 120)=>{
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };
    // Filter shops for display (by area if selected)
    const displayShops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (selectedArea) {
            return shops.filter((shop)=>{
                const areaKey = extractAreaKey(shop.address);
                const translatedName = getTranslatedAreaName(areaKey, t);
                return translatedName === selectedArea || areaKey === selectedArea;
            });
        }
        return shops;
    }, [
        shops,
        selectedArea,
        t
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col lg:flex-row gap-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: "w-full lg:w-64 flex-shrink-0",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl border border-gray-200 p-6 sticky top-24",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-2",
                                    children: t('shops.search')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 462,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    value: searchQuery,
                                    onChange: (e)=>setSearchQuery(e.target.value),
                                    placeholder: t('shops.searchPlaceholder'),
                                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 465,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                            lineNumber: 461,
                            columnNumber: 11
                        }, this),
                        selectedArea && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-600 mb-1",
                                                children: t('shops.filteredByArea')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 479,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-semibold text-blue-700",
                                                children: selectedArea
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 480,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 478,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: clearAreaFilter,
                                        className: "text-blue-600 hover:text-blue-800 text-sm font-medium",
                                        title: t('shops.clearAreaFilter'),
                                        children: "✕"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 482,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 477,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                            lineNumber: 476,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-sm font-semibold text-gray-900 mb-3",
                                    children: t('shops.categories')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 495,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handleCategoryClick(null),
                                            className: `w-full text-left px-3 py-2 rounded-lg transition-colors ${!selectedCategoryId || selectedCategoryId === 'all' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`,
                                            children: [
                                                t('categories.all'),
                                                " (",
                                                categoryCounts.all || 0,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 497,
                                            columnNumber: 15
                                        }, this),
                                        categories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handleCategoryClick(category.id),
                                                className: `w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategoryId === category.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`,
                                                children: [
                                                    getTranslatedCategoryName(category.name, t),
                                                    " (",
                                                    categoryCounts[category.id] || 0,
                                                    ")"
                                                ]
                                            }, category.id, true, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 508,
                                                columnNumber: 17
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                    lineNumber: 496,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                            lineNumber: 494,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                    lineNumber: 459,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 458,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold text-gray-900 mb-2",
                                children: t('shops.shops')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 528,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600",
                                children: loading ? t('shops.loading') : t('shops.shopsFound', {
                                    count: displayShops.length
                                })
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 529,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 527,
                        columnNumber: 9
                    }, this),
                    loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 536,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-gray-600",
                                children: t('shops.loading')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 537,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 535,
                        columnNumber: 11
                    }, this) : selectedArea ? // Show shops in selected area
                    displayShops.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl border border-gray-200 p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-6xl mb-4",
                                children: "🏪"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 543,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-gray-900 mb-2",
                                children: t('shops.noShops')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 544,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mb-4",
                                children: [
                                    t('shops.noShops'),
                                    " ",
                                    t('shops.inAreas', {
                                        count: 1
                                    }),
                                    " ",
                                    selectedArea
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 545,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: clearAreaFilter,
                                className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700",
                                children: t('shops.clearAreaFilter')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 546,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 542,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                        children: displayShops.map((shop)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
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
                                            lineNumber: 563,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 562,
                                        columnNumber: 21
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
                                                        lineNumber: 572,
                                                        columnNumber: 23
                                                    }, this),
                                                    shop.categories && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded",
                                                        children: getTranslatedCategoryName(shop.categories.name, t)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                        lineNumber: 574,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 571,
                                                columnNumber: 21
                                            }, this),
                                            shop.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-600 text-sm mb-3 line-clamp-2",
                                                children: truncateDescription(shop.description, 100)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 580,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-500 text-sm mb-4",
                                                children: shop.address
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 584,
                                                columnNumber: 21
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
                                                    lineNumber: 586,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 585,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 570,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, shop.id, true, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 556,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 554,
                        columnNumber: 13
                    }, this) : groupedShops.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl border border-gray-200 p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-6xl mb-4",
                                children: "🏪"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 597,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-gray-900 mb-2",
                                children: t('shops.noShops')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 598,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600",
                                children: searchQuery || selectedCategoryId ? t('shops.tryAdjusting') : t('shops.notAvailable')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 599,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 596,
                        columnNumber: 11
                    }, this) : // Show grouped view by category and area
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-8",
                        children: groupedShops.map((categoryGroup)=>{
                            const isExpanded = expandedCategories.has(categoryGroup.categoryId);
                            const showAllAreas = categoryGroup.areas.length <= 10;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white rounded-xl border border-gray-200 overflow-hidden",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>toggleCategory(categoryGroup.categoryId),
                                        className: "w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors flex items-center justify-between",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-2xl",
                                                    children: isExpanded ? '▼' : '▶'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                    lineNumber: 620,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-left",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            className: "text-xl font-bold text-gray-900",
                                                            children: getTranslatedCategoryName(categoryGroup.categoryName, t)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                            lineNumber: 624,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-gray-600",
                                                            children: t('shops.shopsInAreas', {
                                                                shops: categoryGroup.totalShops,
                                                                areas: categoryGroup.areas.length
                                                            })
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                            lineNumber: 627,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                    lineNumber: 623,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                            lineNumber: 619,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 615,
                                        columnNumber: 19
                                    }, this),
                                    isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "p-6 space-y-4",
                                        children: [
                                            (showAllAreas || expandedAreas.has(categoryGroup.categoryId) ? categoryGroup.areas : categoryGroup.areas.slice(0, 10)).map((area)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "border-l-4 border-blue-500 pl-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleAreaClick(area.areaName),
                                                        className: "w-full text-left group hover:bg-blue-50 p-3 rounded-lg transition-colors",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center justify-between",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                            className: "text-lg font-semibold text-gray-900 group-hover:text-blue-700",
                                                                            children: area.areaName
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                                            lineNumber: 648,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-sm text-gray-600 mt-1",
                                                                            children: [
                                                                                area.count,
                                                                                " ",
                                                                                area.count !== 1 ? t('shops.shops') : t('shops.shop')
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                                            lineNumber: 651,
                                                                            columnNumber: 33
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                                    lineNumber: 647,
                                                                    columnNumber: 31
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity",
                                                                    children: "View →"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                                    lineNumber: 655,
                                                                    columnNumber: 31
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                            lineNumber: 646,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                        lineNumber: 642,
                                                        columnNumber: 27
                                                    }, this)
                                                }, area.areaName, false, {
                                                    fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                    lineNumber: 641,
                                                    columnNumber: 25
                                                }, this)),
                                            !showAllAreas && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    const newExpanded = new Set(expandedAreas);
                                                    if (newExpanded.has(categoryGroup.categoryId)) {
                                                        newExpanded.delete(categoryGroup.categoryId);
                                                    } else {
                                                        newExpanded.add(categoryGroup.categoryId);
                                                    }
                                                    setExpandedAreas(newExpanded);
                                                },
                                                className: "w-full text-center py-2 text-blue-600 hover:text-blue-800 font-medium text-sm",
                                                children: expandedAreas.has(categoryGroup.categoryId) ? t('shops.showLess', {
                                                    hidden: categoryGroup.areas.length - 10
                                                }) : t('shops.seeAllAreas', {
                                                    count: categoryGroup.areas.length
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                                lineNumber: 665,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                        lineNumber: 636,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, categoryGroup.categoryId, true, {
                                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                                lineNumber: 613,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 607,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 526,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
        lineNumber: 456,
        columnNumber: 5
    }, this);
}
function PublicShopsPage() {
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTranslations"])();
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
                        lineNumber: 700,
                        columnNumber: 11
                    }, void 0),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-gray-600",
                        children: t('common.loading')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                        lineNumber: 701,
                        columnNumber: 11
                    }, void 0)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/browse/page.tsx",
                lineNumber: 699,
                columnNumber: 9
            }, void 0)
        }, void 0, false, {
            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
            lineNumber: 698,
            columnNumber: 7
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PublicShopsPageContent, {}, void 0, false, {
            fileName: "[project]/apps/dashboard/app/browse/page.tsx",
            lineNumber: 705,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/dashboard/app/browse/page.tsx",
        lineNumber: 697,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=apps_dashboard_app_browse_page_tsx_8441860e._.js.map
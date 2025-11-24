(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/dashboard/app/components/FetchShops.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FetchShops
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function FetchShops({ onShopImported }) {
    _s();
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [location, setLocation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedShops, setSelectedShops] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [importing, setImporting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const apiUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
    const handleSearch = async (e)=>{
        e.preventDefault();
        if (!searchQuery.trim() && !location.trim()) {
            setError('Please enter a search query or location');
            return;
        }
        setLoading(true);
        setError(null);
        setResults([]);
        setSelectedShops(new Set());
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('q', searchQuery.trim());
            if (location.trim()) params.append('location', location.trim());
            params.append('limit', '20');
            const res = await fetch(`${apiUrl}/shops/search/osm?${params.toString()}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to search');
            }
            const data = await res.json();
            setResults(data);
            if (data.length === 0) {
                setError('No shops found. Try a different search term.');
            }
        } catch (err) {
            setError(err.message || 'Failed to search for shops');
        } finally{
            setLoading(false);
        }
    };
    const handleImport = async ()=>{
        if (selectedShops.size === 0) {
            setError('Please select at least one shop to import');
            return;
        }
        setImporting(true);
        setError(null);
        try {
            const shopsToImport = results.filter((shop)=>selectedShops.has(shop.osm_id) && !shop.isDuplicate);
            if (shopsToImport.length === 0) {
                setError('No valid shops selected (all are duplicates)');
                setImporting(false);
                return;
            }
            // Import shops one by one
            let successCount = 0;
            let failCount = 0;
            for (const shop of shopsToImport){
                try {
                    const res = await fetch(`${apiUrl}/shops`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: shop.name,
                            address: shop.address,
                            latitude: shop.latitude,
                            longitude: shop.longitude,
                            city: shop.city,
                            country: shop.country,
                            zip_code: shop.zip_code,
                            phone: shop.phone,
                            email: shop.email || '',
                            website: shop.website,
                            category_id: shop.category_id,
                            claim_status: 'unclaimed',
                            osm_id: shop.osm_id
                        })
                    });
                    if (res.ok) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (err) {
                    failCount++;
                }
            }
            // Clear selections and results
            setSelectedShops(new Set());
            setResults([]);
            setSearchQuery('');
            setLocation('');
            if (onShopImported) {
                onShopImported();
            }
            if (failCount > 0) {
                alert(`Imported ${successCount} shop(s) successfully. ${failCount} failed.`);
            } else {
                alert(`Successfully imported ${successCount} shop(s)!`);
            }
        } catch (err) {
            setError(err.message || 'Failed to import shops');
        } finally{
            setImporting(false);
        }
    };
    const toggleSelection = (osmId)=>{
        const newSelected = new Set(selectedShops);
        if (newSelected.has(osmId)) {
            newSelected.delete(osmId);
        } else {
            newSelected.add(osmId);
        }
        setSelectedShops(newSelected);
    };
    const selectAll = ()=>{
        const validShops = results.filter((s)=>!s.isDuplicate);
        setSelectedShops(new Set(validShops.map((s)=>s.osm_id)));
    };
    const deselectAll = ()=>{
        setSelectedShops(new Set());
    };
    const validShopsCount = results.filter((s)=>!s.isDuplicate).length;
    const selectedValidCount = results.filter((s)=>selectedShops.has(s.osm_id) && !s.isDuplicate).length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white rounded-xl border border-gray-200 p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-xl font-bold text-gray-900 mb-4",
                children: "Fetch Shops from OpenStreetMap"
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSearch,
                className: "mb-6 space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: 'Search Query (e.g., "hair salon Tokyo", "barber shop Shibuya", "歯科 新宿")'
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                lineNumber: 181,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: searchQuery,
                                onChange: (e)=>setSearchQuery(e.target.value),
                                placeholder: "hair salon, barber shop, spa, 美容室, 歯科...",
                                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                lineNumber: 184,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: 'Location (optional, e.g., "Tokyo", "Shibuya", "Osaka")'
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                lineNumber: 194,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: location,
                                onChange: (e)=>setLocation(e.target.value),
                                placeholder: "Tokyo, Shibuya, Shinjuku, Osaka, Kyoto...",
                                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                lineNumber: 197,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                        lineNumber: 193,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        disabled: loading,
                        className: "w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                        children: loading ? 'Searching...' : 'Search Shops'
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                lineNumber: 179,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700",
                children: error
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                lineNumber: 216,
                columnNumber: 9
            }, this),
            results.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-600",
                                    children: [
                                        "Found ",
                                        results.length,
                                        " result(s) • ",
                                        validShopsCount,
                                        " available to import",
                                        results.length - validShopsCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-orange-600",
                                            children: [
                                                " • ",
                                                results.length - validShopsCount,
                                                " duplicates"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                            lineNumber: 228,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                    lineNumber: 225,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                lineNumber: 224,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    validShopsCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: selectAll,
                                                className: "px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors",
                                                children: "Select All"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                                lineNumber: 235,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: deselectAll,
                                                className: "px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors",
                                                children: "Deselect All"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                                lineNumber: 241,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleImport,
                                        disabled: importing || selectedValidCount === 0,
                                        className: "px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                        children: importing ? 'Importing...' : `Import ${selectedValidCount} Shop(s)`
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                        lineNumber: 249,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                lineNumber: 232,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                        lineNumber: 223,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2 max-h-96 overflow-y-auto",
                        children: results.map((shop)=>{
                            const isSelected = selectedShops.has(shop.osm_id);
                            const isDuplicate = shop.isDuplicate;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `p-4 border rounded-lg transition-colors ${isDuplicate ? 'border-orange-300 bg-orange-50 opacity-75' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 cursor-pointer'}`,
                                onClick: ()=>!isDuplicate && toggleSelection(shop.osm_id),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            checked: isSelected,
                                            onChange: ()=>!isDuplicate && toggleSelection(shop.osm_id),
                                            disabled: isDuplicate,
                                            className: "mt-1"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                            lineNumber: 277,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-start justify-between gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "font-semibold text-gray-900",
                                                            children: shop.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                                            lineNumber: 286,
                                                            columnNumber: 25
                                                        }, this),
                                                        shop.category_name && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded whitespace-nowrap",
                                                            children: shop.category_name
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                                            lineNumber: 288,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                                    lineNumber: 285,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-gray-600 mt-1",
                                                    children: shop.address
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                                    lineNumber: 293,
                                                    columnNumber: 23
                                                }, this),
                                                shop.city && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500 mt-1",
                                                    children: [
                                                        "📍 ",
                                                        shop.city,
                                                        shop.country ? `, ${shop.country}` : ''
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                                    lineNumber: 295,
                                                    columnNumber: 25
                                                }, this),
                                                isDuplicate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-orange-600 mt-2 font-medium",
                                                    children: [
                                                        "⚠️ Duplicate: ",
                                                        shop.duplicateReason || 'Already exists in database'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                                    lineNumber: 300,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                            lineNumber: 284,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                    lineNumber: 276,
                                    columnNumber: 19
                                }, this)
                            }, shop.osm_id, false, {
                                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                                lineNumber: 265,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                        lineNumber: 259,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
                lineNumber: 222,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/components/FetchShops.tsx",
        lineNumber: 176,
        columnNumber: 5
    }, this);
}
_s(FetchShops, "8+ZYM33xqONTQd6FxkBLVjqwNSA=");
_c = FetchShops;
var _c;
__turbopack_context__.k.register(_c, "FetchShops");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/dashboard/app/shops/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/my-shop/page.tsx
// "My Shop" page for owners to manage their shop
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$FetchShops$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/FetchShops.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const MyShopPage = ()=>{
    _s();
    const { user, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const authLoading = Boolean(loading); // Ensure it's always a boolean for stable dependency array
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const apiUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])();
    const [shop, setShop] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pageLoading, setPageLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('overview');
    // Form states
    const [editingShop, setEditingShop] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [shopForm, setShopForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        google_place_id: '',
        city: '',
        country: '',
        zip_code: '',
        description: '',
        language_code: ''
    });
    const [showCreateShop, setShowCreateShop] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showClaimShop, setShowClaimShop] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [unclaimedShops, setUnclaimedShops] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [claimLoading, setClaimLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Data states
    const [services, setServices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [staff, setStaff] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [bookings, setBookings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [photos, setPhotos] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // Service form state
    const [editingService, setEditingService] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [serviceForm, setServiceForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        description: '',
        price: 0,
        duration_minutes: 0
    });
    const [serviceError, setServiceError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Staff form state
    const [editingStaff, setEditingStaff] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [staffForm, setStaffForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        first_name: '',
        last_name: '',
        phone: '',
        email: ''
    });
    const [staffError, setStaffError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Booking status update state
    const [statusUpdateModal, setStatusUpdateModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isOpen: false,
        bookingId: null,
        newStatus: null,
        bookingCustomerName: null
    });
    const [statusUpdateLoading, setStatusUpdateLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [statusUpdateMessage, setStatusUpdateMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Cancel booking modal state
    const [cancelModal, setCancelModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isOpen: false,
        bookingId: null,
        bookingCustomerName: null
    });
    const [cancelLoading, setCancelLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [cancelMessage, setCancelMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Reschedule booking modal state
    const [rescheduleModal, setRescheduleModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isOpen: false,
        bookingId: null,
        bookingCustomerName: null,
        currentDateTime: null
    });
    const [rescheduleLoading, setRescheduleLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [rescheduleMessage, setRescheduleMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [newDateTime, setNewDateTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    // Photo upload toast notification
    const [photoToast, setPhotoToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Fetch unclaimed shops when claim modal opens
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MyShopPage.useEffect": ()=>{
            if (showClaimShop && user && !authLoading) {
                const fetchUnclaimedShops = {
                    "MyShopPage.useEffect.fetchUnclaimedShops": async ()=>{
                        try {
                            setClaimLoading(true);
                            const res = await fetch(`${apiUrl}/shops?unclaimed=true`, {
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            if (res.ok) {
                                const contentType = res.headers.get('content-type');
                                if (contentType && contentType.includes('application/json')) {
                                    const data = await res.json();
                                    setUnclaimedShops(Array.isArray(data) ? data : []);
                                } else {
                                    console.error('Expected JSON but received:', contentType);
                                    setUnclaimedShops([]);
                                }
                            } else {
                                console.error('Failed to fetch unclaimed shops:', res.status, res.statusText);
                                setUnclaimedShops([]);
                            }
                        } catch (error) {
                            console.error('Error fetching unclaimed shops:', error);
                            setUnclaimedShops([]);
                        } finally{
                            setClaimLoading(false);
                        }
                    }
                }["MyShopPage.useEffect.fetchUnclaimedShops"];
                fetchUnclaimedShops();
            }
        }
    }["MyShopPage.useEffect"], [
        showClaimShop,
        user,
        authLoading,
        apiUrl
    ]);
    // Fetch user's shop
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MyShopPage.useEffect": ()=>{
            // Wait for auth to finish loading and ensure user exists with valid ID
            if (authLoading || !user || !user.id) {
                if (authLoading) {
                    setPageLoading(true);
                } else if (!user) {
                    setPageLoading(false);
                }
                return;
            }
            const fetchMyShop = {
                "MyShopPage.useEffect.fetchMyShop": async ()=>{
                    try {
                        setPageLoading(true);
                        // Validate user.id is a valid UUID before making request
                        if (!user.id || typeof user.id !== 'string' || user.id === 'undefined' || user.id === 'null') {
                            console.error('Invalid user ID:', user.id);
                            setShop(null);
                            setShopForm({});
                            setPageLoading(false);
                            return;
                        }
                        // Fetch shops owned by user - backend now filters by owner_user_id
                        const url = `${apiUrl}/shops?owner_user_id=${encodeURIComponent(user.id)}`;
                        console.log('Fetching shop from:', url);
                        console.log('User ID:', user.id);
                        const res = await fetch(url, {
                            headers: {
                                'x-user-id': user.id,
                                'Content-Type': 'application/json'
                            }
                        }).catch({
                            "MyShopPage.useEffect.fetchMyShop": (fetchError)=>{
                                console.error('Network error fetching shop:', fetchError);
                                throw new Error(`Failed to connect to API: ${fetchError.message}. Make sure the API server is running on ${apiUrl}`);
                            }
                        }["MyShopPage.useEffect.fetchMyShop"]);
                        if (res.status === 404) {
                            // User owns no shop
                            console.log('No shop found for user');
                            setShop(null);
                            setShopForm({});
                            return;
                        }
                        if (res.ok) {
                            const contentType = res.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                const data = await res.json();
                                if (Array.isArray(data) && data.length > 0) {
                                    // Use the first shop if multiple exist
                                    const userShop = data[0];
                                    setShop(userShop);
                                    setShopForm({
                                        name: userShop.name || '',
                                        address: userShop.address || '',
                                        phone: userShop.phone || '',
                                        email: userShop.email || '',
                                        website: userShop.website || '',
                                        google_place_id: userShop.google_place_id || '',
                                        city: userShop.city || '',
                                        country: userShop.country || '',
                                        zip_code: userShop.zip_code || '',
                                        description: userShop.description || '',
                                        language_code: userShop.language_code || '',
                                        category: userShop.category || null,
                                        subcategory: userShop.subcategory || null,
                                        logo_url: userShop.logo_url || null,
                                        cover_photo_url: userShop.cover_photo_url || null
                                    });
                                    // Fetch related data
                                    fetchServices(userShop.id);
                                    fetchStaff(userShop.id);
                                    fetchBookings(userShop.id);
                                    fetchPhotos(userShop.id);
                                } else {
                                    setShop(null);
                                    setShopForm({});
                                }
                            } else {
                                console.error('Expected JSON but received:', contentType);
                                setShop(null);
                                setShopForm({});
                            }
                        } else {
                            const errorText = await res.text().catch({
                                "MyShopPage.useEffect.fetchMyShop": ()=>'Unknown error'
                            }["MyShopPage.useEffect.fetchMyShop"]);
                            console.error('Error fetching shop:', res.status, res.statusText, errorText);
                            setShop(null);
                            setShopForm({});
                        }
                    } catch (error) {
                        console.error('Error fetching shop:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('Full error details:', errorMessage);
                        setShop(null);
                        setShopForm({});
                    } finally{
                        setPageLoading(false);
                    }
                }
            }["MyShopPage.useEffect.fetchMyShop"];
            fetchMyShop();
        }
    }["MyShopPage.useEffect"], [
        user,
        authLoading,
        apiUrl
    ]);
    const fetchServices = async (shopId)=>{
        if (!shopId || !user) return;
        try {
            const res = await fetch(`${apiUrl}/shops/${shopId}/services`, {
                headers: {
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                const data = await res.json();
                setServices(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };
    const fetchStaff = async (shopId)=>{
        if (!shopId || !user) return;
        try {
            const res = await fetch(`${apiUrl}/shops/${shopId}/staff`, {
                headers: {
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStaff(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };
    const fetchBookings = async (shopId)=>{
        if (!shopId || !user) return;
        try {
            const res = await fetch(`${apiUrl}/bookings`, {
                headers: {
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter to only this shop's bookings
                const shopBookings = Array.isArray(data) ? data.filter((b)=>b.shop_id === shopId) : [];
                setBookings(shopBookings);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookings([]);
        }
    };
    const fetchPhotos = async (shopId)=>{
        if (!shopId || !user) return;
        try {
            const res = await fetch(`${apiUrl}/shops/${shopId}/photos`, {
                headers: {
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                const data = await res.json();
                setPhotos(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
            setPhotos([]);
        }
    };
    // Service handlers
    const handleCreateService = async (e)=>{
        e.preventDefault();
        if (!shop || !user) return;
        setServiceError(null);
        try {
            const res = await fetch(`${apiUrl}/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    shop_id: shop.id,
                    name: serviceForm.name,
                    description: serviceForm.description,
                    price: serviceForm.price,
                    duration: serviceForm.duration_minutes
                })
            });
            if (res.ok) {
                await fetchServices(shop.id);
                setServiceForm({
                    name: '',
                    description: '',
                    price: 0,
                    duration_minutes: 0
                });
            } else {
                const errorData = await res.json().catch(()=>({
                        error: 'Failed to create service'
                    }));
                setServiceError(errorData.error || 'Failed to create service');
            }
        } catch (error) {
            console.error('Error creating service:', error);
            setServiceError('Failed to create service');
        }
    };
    const handleUpdateService = async (e)=>{
        e.preventDefault();
        if (!shop || !user || !editingService) return;
        setServiceError(null);
        try {
            const res = await fetch(`${apiUrl}/services/${editingService.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    name: serviceForm.name,
                    description: serviceForm.description,
                    price: serviceForm.price,
                    duration_minutes: serviceForm.duration_minutes
                })
            });
            if (res.ok) {
                await fetchServices(shop.id);
                setEditingService(null);
                setServiceForm({
                    name: '',
                    description: '',
                    price: 0,
                    duration_minutes: 0
                });
            } else {
                const errorData = await res.json().catch(()=>({
                        error: 'Failed to update service'
                    }));
                setServiceError(errorData.error || 'Failed to update service');
            }
        } catch (error) {
            console.error('Error updating service:', error);
            setServiceError('Failed to update service');
        }
    };
    const handleDeleteService = async (serviceId)=>{
        if (!shop || !user || !confirm('Are you sure you want to delete this service?')) return;
        try {
            const res = await fetch(`${apiUrl}/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                await fetchServices(shop.id);
            } else {
                alert('Failed to delete service');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Failed to delete service');
        }
    };
    const startEditService = (service)=>{
        setEditingService(service);
        setServiceForm({
            name: service.name,
            description: service.description || '',
            price: service.price,
            duration_minutes: service.duration_minutes || 0
        });
    };
    // Staff handlers
    const handleCreateStaff = async (e)=>{
        e.preventDefault();
        if (!shop || !user) return;
        setStaffError(null);
        try {
            const res = await fetch(`${apiUrl}/staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    shop_id: shop.id,
                    first_name: staffForm.first_name,
                    last_name: staffForm.last_name,
                    phone: staffForm.phone,
                    email: staffForm.email
                })
            });
            if (res.ok) {
                await fetchStaff(shop.id);
                setStaffForm({
                    first_name: '',
                    last_name: '',
                    phone: '',
                    email: ''
                });
            } else {
                const errorData = await res.json().catch(()=>({
                        error: 'Failed to create staff'
                    }));
                setStaffError(errorData.error || 'Failed to create staff');
            }
        } catch (error) {
            console.error('Error creating staff:', error);
            setStaffError('Failed to create staff');
        }
    };
    const handleUpdateStaff = async (e)=>{
        e.preventDefault();
        if (!shop || !user || !editingStaff) return;
        setStaffError(null);
        try {
            const res = await fetch(`${apiUrl}/staff/${editingStaff.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    first_name: staffForm.first_name,
                    last_name: staffForm.last_name,
                    phone: staffForm.phone,
                    email: staffForm.email
                })
            });
            if (res.ok) {
                await fetchStaff(shop.id);
                setEditingStaff(null);
                setStaffForm({
                    first_name: '',
                    last_name: '',
                    phone: '',
                    email: ''
                });
            } else {
                const errorData = await res.json().catch(()=>({
                        error: 'Failed to update staff'
                    }));
                setStaffError(errorData.error || 'Failed to update staff');
            }
        } catch (error) {
            console.error('Error updating staff:', error);
            setStaffError('Failed to update staff');
        }
    };
    const handleDeleteStaff = async (staffId)=>{
        if (!shop || !user || !confirm('Are you sure you want to delete this staff member?')) return;
        try {
            const res = await fetch(`${apiUrl}/staff/${staffId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                await fetchStaff(shop.id);
            } else {
                alert('Failed to delete staff');
            }
        } catch (error) {
            console.error('Error deleting staff:', error);
            alert('Failed to delete staff');
        }
    };
    const startEditStaff = (staffMember)=>{
        setEditingStaff(staffMember);
        setStaffForm({
            first_name: staffMember.first_name,
            last_name: staffMember.last_name || '',
            phone: staffMember.phone || '',
            email: staffMember.email || ''
        });
    };
    // Booking status handlers
    const openStatusUpdateModal = (bookingId, newStatus, customerName)=>{
        setStatusUpdateModal({
            isOpen: true,
            bookingId,
            newStatus,
            bookingCustomerName: customerName
        });
        setStatusUpdateMessage(null);
    };
    const closeStatusUpdateModal = ()=>{
        setStatusUpdateModal({
            isOpen: false,
            bookingId: null,
            newStatus: null,
            bookingCustomerName: null
        });
        setStatusUpdateMessage(null);
    };
    const handleUpdateBookingStatus = async ()=>{
        if (!shop || !user || !statusUpdateModal.bookingId || !statusUpdateModal.newStatus) return;
        setStatusUpdateLoading(true);
        setStatusUpdateMessage(null);
        try {
            const res = await fetch(`${apiUrl}/bookings/${statusUpdateModal.bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    status: statusUpdateModal.newStatus
                })
            });
            if (res.ok) {
                setStatusUpdateMessage({
                    type: 'success',
                    text: statusUpdateModal.newStatus === 'confirmed' ? t('myShop.bookingConfirmed') : t('myShop.bookingRejected')
                });
                // Refresh bookings list
                await fetchBookings(shop.id);
                // Close modal after a short delay
                setTimeout(()=>{
                    closeStatusUpdateModal();
                }, 1500);
            } else {
                const errorData = await res.json().catch(()=>({
                        error: t('myShop.failedToUpdateStatus')
                    }));
                setStatusUpdateMessage({
                    type: 'error',
                    text: errorData.error || t('myShop.failedToUpdateStatus')
                });
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            setStatusUpdateMessage({
                type: 'error',
                text: t('myShop.failedToUpdateStatus')
            });
        } finally{
            setStatusUpdateLoading(false);
        }
    };
    // Cancel booking handlers
    const openCancelModal = (bookingId, customerName)=>{
        setCancelModal({
            isOpen: true,
            bookingId,
            bookingCustomerName: customerName
        });
        setCancelMessage(null);
    };
    const closeCancelModal = ()=>{
        setCancelModal({
            isOpen: false,
            bookingId: null,
            bookingCustomerName: null
        });
        setCancelMessage(null);
    };
    const handleCancelBooking = async ()=>{
        if (!shop || !user || !cancelModal.bookingId) return;
        setCancelLoading(true);
        setCancelMessage(null);
        try {
            const res = await fetch(`${apiUrl}/bookings/${cancelModal.bookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                setCancelMessage({
                    type: 'success',
                    text: t('booking.cancelled')
                });
                // Refresh bookings list
                await fetchBookings(shop.id);
                // Close modal after a short delay
                setTimeout(()=>{
                    closeCancelModal();
                }, 1500);
            } else {
                const errorData = await res.json().catch(()=>({
                        error: t('booking.failedToCancel')
                    }));
                setCancelMessage({
                    type: 'error',
                    text: errorData.error || t('booking.failedToCancel')
                });
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            setCancelMessage({
                type: 'error',
                text: t('booking.failedToCancel')
            });
        } finally{
            setCancelLoading(false);
        }
    };
    // Reschedule booking handlers
    const openRescheduleModal = (bookingId, customerName, currentStartTime)=>{
        const currentDate = new Date(currentStartTime);
        const localDateTime = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
        setRescheduleModal({
            isOpen: true,
            bookingId,
            bookingCustomerName: customerName,
            currentDateTime: currentStartTime
        });
        setNewDateTime(localDateTime);
        setRescheduleMessage(null);
    };
    const closeRescheduleModal = ()=>{
        setRescheduleModal({
            isOpen: false,
            bookingId: null,
            bookingCustomerName: null,
            currentDateTime: null
        });
        setNewDateTime('');
        setRescheduleMessage(null);
    };
    const handleRescheduleBooking = async ()=>{
        if (!shop || !user || !rescheduleModal.bookingId || !newDateTime) return;
        setRescheduleLoading(true);
        setRescheduleMessage(null);
        try {
            // Convert local datetime to ISO string
            const dateTimeISO = new Date(newDateTime).toISOString();
            const res = await fetch(`${apiUrl}/bookings/${rescheduleModal.bookingId}/reschedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    date_time: dateTimeISO
                })
            });
            if (res.ok) {
                setRescheduleMessage({
                    type: 'success',
                    text: t('booking.rescheduled')
                });
                // Refresh bookings list
                await fetchBookings(shop.id);
                // Close modal after a short delay
                setTimeout(()=>{
                    closeRescheduleModal();
                }, 1500);
            } else {
                const errorData = await res.json().catch(()=>({
                        error: t('booking.failedToReschedule')
                    }));
                setRescheduleMessage({
                    type: 'error',
                    text: errorData.error || t('booking.failedToReschedule')
                });
            }
        } catch (error) {
            console.error('Error rescheduling booking:', error);
            setRescheduleMessage({
                type: 'error',
                text: t('booking.failedToReschedule')
            });
        } finally{
            setRescheduleLoading(false);
        }
    };
    const handleCreateShop = async (e)=>{
        e.preventDefault();
        if (!user) return;
        try {
            const res = await fetch(`${apiUrl}/shops`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify(shopForm)
            });
            if (res.ok) {
                const newShop = await res.json();
                setShop(newShop);
                setShopForm(newShop);
                setShowCreateShop(false);
                router.refresh();
            } else {
                const error = await res.json();
                alert(`Error: ${error.error || 'Failed to create shop'}`);
            }
        } catch (error) {
            console.error('Error creating shop:', error);
            alert('Failed to create shop');
        }
    };
    const handleUpdateShop = async (e)=>{
        e.preventDefault();
        if (!shop || !user) return;
        try {
            // Send all fields that exist in the database schema
            const updateData = {};
            if (shopForm.name !== undefined && shopForm.name !== null) updateData.name = shopForm.name;
            if (shopForm.address !== undefined && shopForm.address !== null) updateData.address = shopForm.address;
            if (shopForm.phone !== undefined && shopForm.phone !== null) updateData.phone = shopForm.phone;
            if (shopForm.email !== undefined && shopForm.email !== null) updateData.email = shopForm.email;
            if (shopForm.website !== undefined && shopForm.website !== null) updateData.website = shopForm.website;
            if (shopForm.google_place_id !== undefined && shopForm.google_place_id !== null) updateData.google_place_id = shopForm.google_place_id;
            if (shopForm.city !== undefined && shopForm.city !== null) updateData.city = shopForm.city;
            if (shopForm.country !== undefined && shopForm.country !== null) updateData.country = shopForm.country;
            if (shopForm.zip_code !== undefined && shopForm.zip_code !== null) updateData.zip_code = shopForm.zip_code;
            if (shopForm.description !== undefined && shopForm.description !== null) updateData.description = shopForm.description;
            if (shopForm.language_code !== undefined && shopForm.language_code !== null) updateData.language_code = shopForm.language_code;
            const res = await fetch(`${apiUrl}/shops/${shop.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify(updateData)
            });
            if (res.ok) {
                const updatedShop = await res.json();
                setShop(updatedShop);
                setShopForm(updatedShop);
                setEditingShop(false);
            } else {
                const error = await res.json();
                alert(`Error: ${error.error || 'Failed to update shop'}`);
            }
        } catch (error) {
            console.error('Error updating shop:', error);
            alert('Failed to update shop');
        }
    };
    const handlePhotoUpload = async (e, type)=>{
        if (!shop || !user || !e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }
        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('shopId', shop.id);
            formData.append('type', type);
            // Ensure API URL is set correctly
            const uploadUrl = `${apiUrl || 'http://localhost:3000'}/photos/upload`;
            // Upload to API using multipart/form-data
            const res = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'x-user-id': user.id
                },
                body: formData
            });
            // Validate response is JSON before parsing
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const errorText = await res.text();
                console.error('Non-JSON response:', errorText);
                throw new Error(`Server returned non-JSON response: ${res.status} ${res.statusText}`);
            }
            if (res.ok) {
                const data = await res.json();
                const photoUrl = data.url;
                const photoRecord = data.photo;
                if (!photoUrl) {
                    throw new Error('No URL returned from upload');
                }
                // Show success toast
                setPhotoToast({
                    type: 'success',
                    message: t('myShop.photoUploaded')
                });
                setTimeout(()=>setPhotoToast(null), 3000);
                // Immediately add the new photo to the photos state (optimistic update)
                if (photoRecord) {
                    setPhotos((prev)=>{
                        // Remove any existing photo of the same type (for logo/cover) or add to gallery
                        if (type === 'logo' || type === 'cover') {
                            return prev.filter((p)=>!(p.type === type && p.shop_id === shop.id)).concat([
                                photoRecord
                            ]);
                        } else {
                            // For gallery, just add the new photo immediately
                            return [
                                ...prev,
                                photoRecord
                            ];
                        }
                    });
                } else {
                    // Fallback: refresh photos list if no record returned
                    await fetchPhotos(shop.id);
                }
                // Update shop with new URL (for logo/cover backward compatibility)
                if (type === 'logo' || type === 'cover') {
                    const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
                    const updateRes = await fetch(`${apiUrl}/shops/${shop.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': user.id
                        },
                        body: JSON.stringify({
                            [updateField]: photoUrl
                        })
                    });
                    if (updateRes.ok) {
                        const updatedShop = await updateRes.json();
                        setShop(updatedShop);
                    }
                    // Only refresh for logo/cover to update shop data
                    router.refresh();
                }
            // Gallery photos don't need router.refresh() since we update state directly
            } else {
                const errorText = await res.text();
                let errorMessage = t('myShop.failedToUpload');
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorMessage;
                } catch  {
                    errorMessage = errorText || errorMessage;
                }
                setPhotoToast({
                    type: 'error',
                    message: errorMessage
                });
                setTimeout(()=>setPhotoToast(null), 5000);
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            const errorMessage = error instanceof Error ? error.message : t('common.unknown');
            setPhotoToast({
                type: 'error',
                message: `${t('myShop.failedToUpload')}: ${errorMessage}`
            });
            setTimeout(()=>setPhotoToast(null), 5000);
        }
        // Reset the input
        e.target.value = '';
    };
    const handleSavePhotos = async ()=>{
        if (!shop || !user) return;
        try {
            // Refresh photos list to ensure we have the latest data
            await fetchPhotos(shop.id);
            setPhotoToast({
                type: 'success',
                message: t('myShop.photoUploaded')
            });
            setTimeout(()=>setPhotoToast(null), 3000);
            router.refresh();
        } catch (error) {
            console.error('Error saving photos:', error);
            setPhotoToast({
                type: 'error',
                message: 'Failed to save photos'
            });
            setTimeout(()=>setPhotoToast(null), 5000);
        }
    };
    const handlePhotoDelete = async (photoId, type)=>{
        if (!shop || !user) return;
        if (!confirm(`Are you sure you want to delete this ${type} photo?`)) return;
        try {
            const res = await fetch(`${apiUrl}/shops/${shop.id}/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                // Remove photo from state immediately
                setPhotos((prev)=>prev.filter((p)=>p.id !== photoId));
                // Refresh photos list to ensure consistency
                await fetchPhotos(shop.id);
                // Update shop if it was logo or cover
                if (type === 'logo' || type === 'cover') {
                    const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
                    const updateRes = await fetch(`${apiUrl}/shops/${shop.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': user.id
                        },
                        body: JSON.stringify({
                            [updateField]: null
                        })
                    });
                    if (updateRes.ok) {
                        const updatedShop = await updateRes.json();
                        setShop(updatedShop);
                    }
                }
                router.refresh();
            } else {
                const error = await res.json();
                alert(`${t('common.error')}: ${error.error || t('myShop.failedToDelete')}`);
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert(t('myShop.failedToDelete'));
        }
    };
    if (pageLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-8 flex items-center justify-center min-h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1065,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-gray-600",
                        children: t('common.loading')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1066,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1064,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
            lineNumber: 1063,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    // User doesn't own a shop - show create/claim options
    if (!shop) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-8 max-w-4xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-3xl font-bold text-gray-900 mb-8",
                    children: t('myShop.title')
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1076,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold text-gray-900 mb-4",
                            children: t('myShop.getStarted')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1079,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-6",
                            children: [
                                t('myShop.noShop'),
                                " ",
                                t('myShop.createShop'),
                                " ",
                                t('common.or'),
                                " ",
                                t('myShop.claimShop'),
                                "."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1080,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid md:grid-cols-2 gap-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border border-gray-200 rounded-lg p-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-xl font-semibold text-gray-900 mb-2",
                                            children: t('myShop.createNewShop')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1087,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-600 mb-4",
                                            children: t('myShop.startFresh')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1088,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setShowCreateShop(true),
                                            className: "w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors",
                                            children: t('myShop.createShop')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1089,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1086,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border border-gray-200 rounded-lg p-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-xl font-semibold text-gray-900 mb-2",
                                            children: t('myShop.claimExistingShop')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1099,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-600 mb-4",
                                            children: t('myShop.claimOwnership')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1100,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setShowClaimShop(true),
                                            className: "w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors",
                                            children: t('myShop.claimShop')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1101,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1098,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1084,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1078,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                showCreateShop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-md border border-gray-100 p-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold text-gray-900 mb-4",
                            children: t('myShop.createNewShop')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1114,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleCreateShop,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.shopName')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1118,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                required: true,
                                                value: shopForm.name || '',
                                                onChange: (e)=>setShopForm((prev)=>({
                                                            ...prev,
                                                            name: e.target.value
                                                        })),
                                                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1119,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1117,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.address')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1128,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                required: true,
                                                value: shopForm.address || '',
                                                onChange: (e)=>setShopForm((prev)=>({
                                                            ...prev,
                                                            address: e.target.value
                                                        })),
                                                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1129,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1127,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.phone')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1138,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "tel",
                                                required: true,
                                                value: shopForm.phone || '',
                                                onChange: (e)=>setShopForm((prev)=>({
                                                            ...prev,
                                                            phone: e.target.value
                                                        })),
                                                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1139,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1137,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.email')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1148,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "email",
                                                required: true,
                                                value: shopForm.email || '',
                                                onChange: (e)=>setShopForm((prev)=>({
                                                            ...prev,
                                                            email: e.target.value
                                                        })),
                                                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1149,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1147,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                className: "px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors",
                                                children: t('myShop.createShop')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1158,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowCreateShop(false),
                                                className: "px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors",
                                                children: t('common.cancel')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1164,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1157,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1116,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1115,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1113,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0)),
                showClaimShop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-md border border-gray-100 p-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-bold text-gray-900",
                                    children: t('myShop.claimShop')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1181,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setShowClaimShop(false),
                                    className: "px-4 py-2 text-gray-600 hover:text-gray-900",
                                    children: "×"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1182,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1180,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-6",
                            children: t('myShop.selectUnclaimedShop')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1189,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        claimLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center py-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1195,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-2 text-gray-600",
                                    children: t('shops.loading')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1196,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1194,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)) : unclaimedShops.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center py-8 text-gray-500",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: t('myShop.noUnclaimedShops')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1200,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1199,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3 max-h-96 overflow-y-auto",
                            children: unclaimedShops.map((unclaimedShop)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "font-semibold text-gray-900",
                                                        children: unclaimedShop.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1211,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    unclaimedShop.address && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-gray-600 mt-1",
                                                        children: unclaimedShop.address
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1213,
                                                        columnNumber: 27
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1210,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: async ()=>{
                                                    if (!user) return;
                                                    try {
                                                        setClaimLoading(true);
                                                        const res = await fetch(`${apiUrl}/shops/${unclaimedShop.id}/claim`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'x-user-id': user.id
                                                            }
                                                        });
                                                        if (res.ok) {
                                                            const claimedShop = await res.json();
                                                            setShop(claimedShop);
                                                            setShopForm(claimedShop);
                                                            setShowClaimShop(false);
                                                            router.refresh();
                                                        } else {
                                                            const error = await res.json();
                                                            alert(`Error: ${error.error || 'Failed to claim shop'}`);
                                                        }
                                                    } catch (error) {
                                                        console.error('Error claiming shop:', error);
                                                        alert('Failed to claim shop');
                                                    } finally{
                                                        setClaimLoading(false);
                                                    }
                                                },
                                                className: "px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors",
                                                children: t('myShop.claimShop')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1216,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1209,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, unclaimedShop.id, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1205,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1203,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1179,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
            lineNumber: 1075,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    // User owns a shop - show management UI
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-5xl mx-auto px-4 py-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold text-gray-900 mb-2",
                        children: t('myShop.title')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1266,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-lg text-gray-600",
                        children: shop.name
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1267,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1265,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 border-b border-gray-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-1",
                    children: [
                        'overview',
                        'services',
                        'staff',
                        'bookings',
                        'photos'
                    ].map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                setActiveTab(tab);
                                // Fetch data when tab is clicked
                                if (shop && user) {
                                    if (tab === 'services') {
                                        fetchServices(shop.id);
                                    } else if (tab === 'staff') {
                                        fetchStaff(shop.id);
                                    } else if (tab === 'bookings') {
                                        fetchBookings(shop.id);
                                    } else if (tab === 'photos') {
                                        fetchPhotos(shop.id);
                                    }
                                }
                            },
                            className: `px-6 py-3 font-medium transition-colors relative ${activeTab === tab ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`,
                            children: [
                                t(`myShop.${tab}`),
                                activeTab === tab && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1299,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, tab, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1274,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1272,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1271,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            activeTab === 'overview' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl border border-gray-200 shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-gray-900",
                                children: t('myShop.shopOverview')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1310,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            !editingShop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setEditingShop(true),
                                className: "mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium",
                                children: t('myShop.editShop')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1312,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1309,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    editingShop ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: handleUpdateShop,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: t('myShop.shopName')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1325,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            required: true,
                                            value: shopForm.name || '',
                                            onChange: (e)=>setShopForm((prev)=>({
                                                        ...prev,
                                                        name: e.target.value
                                                    })),
                                            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1326,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1324,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: t('myShop.address')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1335,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            required: true,
                                            value: shopForm.address || '',
                                            onChange: (e)=>setShopForm((prev)=>({
                                                        ...prev,
                                                        address: e.target.value
                                                    })),
                                            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1336,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1334,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid md:grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                                    children: t('myShop.phone')
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1346,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "tel",
                                                    required: true,
                                                    value: shopForm.phone || '',
                                                    onChange: (e)=>setShopForm((prev)=>({
                                                                ...prev,
                                                                phone: e.target.value
                                                            })),
                                                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1347,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1345,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                                    children: t('myShop.email')
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1356,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "email",
                                                    required: true,
                                                    value: shopForm.email || '',
                                                    onChange: (e)=>setShopForm((prev)=>({
                                                                ...prev,
                                                                email: e.target.value
                                                            })),
                                                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1357,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1355,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1344,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: t('myShop.website')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1367,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "url",
                                            value: shopForm.website || '',
                                            onChange: (e)=>setShopForm((prev)=>({
                                                        ...prev,
                                                        website: e.target.value
                                                    })),
                                            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1368,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1366,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "submit",
                                            className: "px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors",
                                            children: t('common.save')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1376,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>{
                                                setEditingShop(false);
                                                setShopForm(shop ? {
                                                    name: shop.name || '',
                                                    address: shop.address || '',
                                                    phone: shop.phone || '',
                                                    email: shop.email || '',
                                                    website: shop.website || '',
                                                    google_place_id: shop.google_place_id || '',
                                                    city: shop.city || '',
                                                    country: shop.country || '',
                                                    zip_code: shop.zip_code || '',
                                                    description: shop.description || '',
                                                    language_code: shop.language_code || '',
                                                    category: shop.category || null,
                                                    subcategory: shop.subcategory || null,
                                                    logo_url: shop.logo_url || null,
                                                    cover_photo_url: shop.cover_photo_url || null
                                                } : {
                                                    name: '',
                                                    address: '',
                                                    phone: '',
                                                    email: '',
                                                    website: '',
                                                    google_place_id: '',
                                                    city: '',
                                                    country: '',
                                                    zip_code: '',
                                                    description: '',
                                                    language_code: ''
                                                });
                                            },
                                            className: "px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors",
                                            children: t('common.cancel')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1382,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1375,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1323,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1322,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid md:grid-cols-2 gap-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm font-medium text-gray-500 mb-1",
                                                children: t('common.name')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1427,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-lg text-gray-900",
                                                children: shop.name
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1428,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1426,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm font-medium text-gray-500 mb-1",
                                                children: t('myShop.address')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1431,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-lg text-gray-900",
                                                children: shop.address
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1432,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1430,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm font-medium text-gray-500 mb-1",
                                                children: t('myShop.phone')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1435,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-lg text-gray-900",
                                                children: shop.phone
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1436,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1434,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm font-medium text-gray-500 mb-1",
                                                children: t('myShop.email')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1439,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-lg text-gray-900",
                                                children: shop.email
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1440,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1438,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1425,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            shop.website && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                        className: "text-sm font-medium text-gray-500 mb-1",
                                        children: t('myShop.website')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1445,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: shop.website,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            className: "text-lg text-blue-600 hover:underline",
                                            children: shop.website
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1447,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1446,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1444,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1424,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1308,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$FetchShops$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    onShopImported: ()=>{
                        // Refresh shop data if needed
                        if (shop && user) {
                            fetchShop(user.id);
                        }
                    }
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1460,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1459,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            activeTab === 'services' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl border border-gray-200 shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-gray-900 mb-4",
                        children: t('myShop.services')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1472,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6 border border-gray-200 rounded-lg p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-gray-900 mb-4",
                                children: editingService ? t('myShop.editService') : t('myShop.createNewService')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1476,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            serviceError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm",
                                children: serviceError
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1480,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: editingService ? handleUpdateService : handleCreateService,
                                className: "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid md:grid-cols-2 gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "block text-sm font-medium text-gray-700 mb-1",
                                                        children: [
                                                            t('myShop.serviceName'),
                                                            " *"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1487,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "text",
                                                        value: serviceForm.name,
                                                        onChange: (e)=>setServiceForm((prev)=>({
                                                                    ...prev,
                                                                    name: e.target.value
                                                                })),
                                                        required: true,
                                                        className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none",
                                                        placeholder: t('myShop.serviceName')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1488,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1486,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "block text-sm font-medium text-gray-700 mb-1",
                                                        children: [
                                                            t('myShop.servicePrice'),
                                                            " *"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1498,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "number",
                                                        value: serviceForm.price,
                                                        onChange: (e)=>setServiceForm((prev)=>({
                                                                    ...prev,
                                                                    price: parseFloat(e.target.value) || 0
                                                                })),
                                                        required: true,
                                                        min: "0",
                                                        step: "0.01",
                                                        className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1499,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1497,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1485,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.serviceDescription')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1511,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                value: serviceForm.description,
                                                onChange: (e)=>setServiceForm((prev)=>({
                                                            ...prev,
                                                            description: e.target.value
                                                        })),
                                                rows: 3,
                                                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none",
                                                placeholder: t('myShop.serviceDescription')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1512,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1510,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: [
                                                    t('myShop.serviceDuration'),
                                                    " *"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1521,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                value: serviceForm.duration_minutes,
                                                onChange: (e)=>setServiceForm((prev)=>({
                                                            ...prev,
                                                            duration_minutes: parseInt(e.target.value) || 0
                                                        })),
                                                required: true,
                                                min: "1",
                                                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1522,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1520,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                className: "px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors",
                                                children: editingService ? t('common.update') : t('common.create')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1532,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            editingService && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>{
                                                    setEditingService(null);
                                                    setServiceForm({
                                                        name: '',
                                                        description: '',
                                                        price: 0,
                                                        duration_minutes: 0
                                                    });
                                                },
                                                className: "px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors",
                                                children: t('common.cancel')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1539,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1531,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1484,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1475,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    services.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border border-gray-200 rounded-lg p-8 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-4xl mb-4",
                                children: "⚙️"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1557,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mb-2",
                                children: t('myShop.noServices')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1558,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: t('myShop.createFirstService')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1559,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1556,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-gray-200",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.name')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1566,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.description')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1567,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.price')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1568,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.duration')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1569,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.actions')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1570,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1565,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1564,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: services.map((service)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-900 font-medium",
                                                    children: service.name
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1576,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: service.description || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1577,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-700",
                                                    children: [
                                                        "$",
                                                        service.price
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1578,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-700",
                                                    children: [
                                                        service.duration_minutes || 0,
                                                        " min"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1579,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>startEditService(service),
                                                                className: "text-blue-600 hover:text-blue-800 text-sm font-medium",
                                                                children: t('common.edit')
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                lineNumber: 1582,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>handleDeleteService(service.id),
                                                                className: "text-red-600 hover:text-red-800 text-sm font-medium",
                                                                children: t('common.delete')
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                lineNumber: 1588,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1581,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1580,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, service.id, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1575,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1573,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1563,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1562,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1471,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            activeTab === 'staff' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl border border-gray-200 shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-gray-900 mb-4",
                        children: t('myShop.staff')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1607,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6 border border-gray-200 rounded-lg p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-gray-900 mb-4",
                                children: editingStaff ? t('myShop.editStaff') : t('myShop.addStaff')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1611,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            staffError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm",
                                children: staffError
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1615,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: editingStaff ? handleUpdateStaff : handleCreateStaff,
                                className: "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid md:grid-cols-2 gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "block text-sm font-medium text-gray-700 mb-1",
                                                        children: [
                                                            t('myShop.firstName'),
                                                            " *"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1622,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "text",
                                                        value: staffForm.first_name,
                                                        onChange: (e)=>setStaffForm((prev)=>({
                                                                    ...prev,
                                                                    first_name: e.target.value
                                                                })),
                                                        required: true,
                                                        className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none",
                                                        placeholder: t('myShop.firstName')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1623,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1621,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "block text-sm font-medium text-gray-700 mb-1",
                                                        children: t('myShop.lastName')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1633,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "text",
                                                        value: staffForm.last_name,
                                                        onChange: (e)=>setStaffForm((prev)=>({
                                                                    ...prev,
                                                                    last_name: e.target.value
                                                                })),
                                                        className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none",
                                                        placeholder: t('myShop.lastName')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1634,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1632,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1620,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid md:grid-cols-2 gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "block text-sm font-medium text-gray-700 mb-1",
                                                        children: t('myShop.staffPhone')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1645,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "tel",
                                                        value: staffForm.phone,
                                                        onChange: (e)=>setStaffForm((prev)=>({
                                                                    ...prev,
                                                                    phone: e.target.value
                                                                })),
                                                        className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none",
                                                        placeholder: t('myShop.staffPhone')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1646,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1644,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "block text-sm font-medium text-gray-700 mb-1",
                                                        children: t('myShop.staffEmail')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1655,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "email",
                                                        value: staffForm.email,
                                                        onChange: (e)=>setStaffForm((prev)=>({
                                                                    ...prev,
                                                                    email: e.target.value
                                                                })),
                                                        className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none",
                                                        placeholder: t('myShop.staffEmail')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1656,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1654,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1643,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                className: "px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors",
                                                children: editingStaff ? t('common.update') : t('common.create')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1666,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            editingStaff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>{
                                                    setEditingStaff(null);
                                                    setStaffForm({
                                                        first_name: '',
                                                        last_name: '',
                                                        phone: '',
                                                        email: ''
                                                    });
                                                },
                                                className: "px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors",
                                                children: t('common.cancel')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1673,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1665,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1619,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1610,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    staff.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border border-gray-200 rounded-lg p-8 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-4xl mb-4",
                                children: "👥"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1691,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mb-2",
                                children: t('myShop.noStaff')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1692,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: t('myShop.addFirstStaff')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1693,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1690,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-gray-200",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.name')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1700,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('myShop.staffPhone')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1701,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('myShop.staffEmail')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1702,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.actions')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1703,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1699,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1698,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: staff.map((member)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-900 font-medium",
                                                    children: [
                                                        member.first_name,
                                                        " ",
                                                        member.last_name
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1709,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: member.phone || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1712,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: member.email || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1713,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>startEditStaff(member),
                                                                className: "text-blue-600 hover:text-blue-800 text-sm font-medium",
                                                                children: t('common.edit')
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                lineNumber: 1716,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>handleDeleteStaff(member.id),
                                                                className: "text-red-600 hover:text-red-800 text-sm font-medium",
                                                                children: t('common.delete')
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                lineNumber: 1722,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1715,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1714,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, member.id, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1708,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1706,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1697,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1696,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1606,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            activeTab === 'bookings' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl border border-gray-200 shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-gray-900 mb-4",
                        children: t('myShop.bookings')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1741,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    bookings.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border border-gray-200 rounded-lg p-8 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-4xl mb-4",
                                children: "📅"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1744,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mb-2",
                                children: t('myShop.noBookings')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1745,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: t('myShop.bookingsWillAppear')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1746,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1743,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-gray-200",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('myShop.customer')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1753,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.email')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1754,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.phone')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1755,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('myShop.dateTime')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1756,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('myShop.service')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1757,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.status')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1758,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.actions')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1759,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1752,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1751,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: bookings.map((booking)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-900 font-medium",
                                                    children: booking.customer_name || t('common.unknown')
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1765,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: booking.customer_email || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1768,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: booking.customer_phone || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1769,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-700",
                                                    children: booking.start_time ? new Date(booking.start_time).toLocaleString() : 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1770,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: booking.services?.name || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1773,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'rejected' ? 'bg-red-100 text-red-700' : booking.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : booking.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`,
                                                        children: t(`status.${booking.status || 'pending'}`)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1777,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1776,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex gap-2 flex-wrap",
                                                        children: [
                                                            (!booking.status || booking.status === 'pending') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>openStatusUpdateModal(booking.id, 'confirmed', booking.customer_name || null),
                                                                        className: "px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium",
                                                                        children: t('common.confirm')
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                        lineNumber: 1791,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>openStatusUpdateModal(booking.id, 'rejected', booking.customer_name || null),
                                                                        className: "px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium",
                                                                        children: t('common.reject')
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                        lineNumber: 1797,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true),
                                                            booking.status && booking.status !== 'cancelled' && booking.status !== 'completed' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>openCancelModal(booking.id, booking.customer_name || null),
                                                                        className: "px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium",
                                                                        children: t('booking.cancelBooking')
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                        lineNumber: 1807,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>openRescheduleModal(booking.id, booking.customer_name || null, booking.start_time),
                                                                        className: "px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium",
                                                                        children: t('booking.rescheduleBooking')
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                        lineNumber: 1813,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1788,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1787,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, booking.id, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1764,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1762,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1750,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1749,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1740,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            activeTab === 'photos' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl border border-gray-200 shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-gray-900",
                                children: t('myShop.photos')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1835,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleSavePhotos,
                                className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium",
                                children: t('common.save')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1836,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1834,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    photoToast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `mb-4 p-3 rounded-lg ${photoToast.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`,
                        children: photoToast.message
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1846,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-gray-900 mb-3",
                                children: t('myShop.shopLogo')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1857,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    (()=>{
                                        const logoPhoto = photos.find((p)=>p.type === 'logo');
                                        const logoUrl = logoPhoto?.url || shop.logo_url;
                                        return logoUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: logoUrl,
                                            alt: "Logo",
                                            className: "w-24 h-24 object-cover rounded-lg border border-gray-200"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1863,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400",
                                            children: t('myShop.noLogo')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1865,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0));
                                    })(),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "file",
                                        accept: "image/jpeg,image/png",
                                        onChange: (e)=>handlePhotoUpload(e, 'logo'),
                                        className: "hidden",
                                        id: "logo-upload"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1870,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "logo-upload",
                                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors",
                                        children: photos.find((p)=>p.type === 'logo') || shop.logo_url ? t('myShop.changeLogo') : t('myShop.uploadLogo')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1877,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    (()=>{
                                        const logoPhoto = photos.find((p)=>p.type === 'logo');
                                        if (logoPhoto) {
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handlePhotoDelete(logoPhoto.id, 'logo'),
                                                className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors",
                                                children: t('common.delete')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1887,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0));
                                        }
                                        return null;
                                    })()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1858,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1856,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-gray-900 mb-3",
                                children: t('myShop.coverPhoto')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1902,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    (()=>{
                                        const coverPhoto = photos.find((p)=>p.type === 'cover');
                                        const coverUrl = coverPhoto?.url || shop.cover_photo_url;
                                        return coverUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: coverUrl,
                                            alt: "Cover",
                                            className: "w-48 h-32 object-cover rounded-lg border border-gray-200"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1908,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-48 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400",
                                            children: t('myShop.noCoverPhoto')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1910,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0));
                                    })(),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "file",
                                        accept: "image/jpeg,image/png",
                                        onChange: (e)=>handlePhotoUpload(e, 'cover'),
                                        className: "hidden",
                                        id: "cover-upload"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1915,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "cover-upload",
                                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors",
                                        children: photos.find((p)=>p.type === 'cover') || shop.cover_photo_url ? t('myShop.changeCover') : t('myShop.uploadCover')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1922,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    (()=>{
                                        const coverPhoto = photos.find((p)=>p.type === 'cover');
                                        if (coverPhoto) {
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handlePhotoDelete(coverPhoto.id, 'cover'),
                                                className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors",
                                                children: t('common.delete')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1932,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0));
                                        }
                                        return null;
                                    })()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1903,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1901,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-gray-900 mb-3",
                                children: t('myShop.galleryPhotos')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1947,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "file",
                                accept: "image/jpeg,image/png,image/jpg",
                                onChange: (e)=>handlePhotoUpload(e, 'gallery'),
                                className: "hidden",
                                id: "gallery-upload"
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1948,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "gallery-upload",
                                className: "inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors mb-4",
                                children: t('myShop.uploadGalleryPhoto')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1955,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            photos.filter((p)=>p.type === 'gallery').length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border border-gray-200 rounded-lg p-8 text-center bg-gray-50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl mb-2",
                                        children: "📸"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1963,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-gray-500",
                                        children: t('myShop.noGalleryPhotos')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1964,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1962,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
                                children: photos.filter((p)=>p.type === 'gallery').map((photo)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative group",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: photo.url,
                                                alt: "Gallery",
                                                className: "w-full h-48 object-cover rounded-lg border border-gray-200",
                                                onError: (e)=>{
                                                    console.error('Error loading image:', photo.url);
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1970,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handlePhotoDelete(photo.id, 'gallery'),
                                                className: "absolute top-2 right-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 shadow-lg",
                                                children: t('common.delete')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1979,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, photo.id, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1969,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1967,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1946,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1833,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            statusUpdateModal.isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50",
                onClick: closeStatusUpdateModal,
                onMouseDown: (e)=>{
                    if (e.target === e.currentTarget) {
                        closeStatusUpdateModal();
                    }
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative",
                    onClick: (e)=>e.stopPropagation(),
                    onMouseDown: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: closeStatusUpdateModal,
                            className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2009,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-xl font-bold text-gray-900 mb-4",
                            children: statusUpdateModal.newStatus === 'confirmed' ? t('myShop.confirmBooking') : t('myShop.rejectBooking')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2017,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-6",
                            children: [
                                statusUpdateModal.newStatus === 'confirmed' ? t('myShop.areYouSureConfirm') : t('myShop.areYouSureReject'),
                                " ",
                                statusUpdateModal.bookingCustomerName ? `${t('common.for')} ${statusUpdateModal.bookingCustomerName}` : '',
                                "?"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2021,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        statusUpdateMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `mb-4 p-3 rounded-lg ${statusUpdateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`,
                            children: statusUpdateMessage.text
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2026,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-3 justify-end",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: closeStatusUpdateModal,
                                    disabled: statusUpdateLoading,
                                    className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                    children: t('common.cancel')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 2036,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleUpdateBookingStatus,
                                    disabled: statusUpdateLoading,
                                    className: `px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${statusUpdateModal.newStatus === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`,
                                    children: statusUpdateLoading ? t('common.updating') : statusUpdateModal.newStatus === 'confirmed' ? t('common.confirm') : t('common.reject')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 2044,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2035,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 2004,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1995,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            cancelModal.isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50",
                onClick: closeCancelModal,
                onMouseDown: (e)=>{
                    if (e.target === e.currentTarget) {
                        closeCancelModal();
                    }
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative",
                    onClick: (e)=>e.stopPropagation(),
                    onMouseDown: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: closeCancelModal,
                            className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2077,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-xl font-bold text-gray-900 mb-4",
                            children: t('booking.cancelBooking')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2085,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-6",
                            children: [
                                t('booking.cancelConfirm'),
                                " ",
                                cancelModal.bookingCustomerName ? `${t('common.for')} ${cancelModal.bookingCustomerName}` : '',
                                "?"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2089,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        cancelMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `mb-4 p-3 rounded-lg ${cancelMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`,
                            children: cancelMessage.text
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2094,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-3 justify-end",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: closeCancelModal,
                                    disabled: cancelLoading,
                                    className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                    children: [
                                        t('common.no'),
                                        ", ",
                                        t('common.keepIt')
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 2104,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleCancelBooking,
                                    disabled: cancelLoading,
                                    className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                                    children: cancelLoading ? t('common.cancelling') : `${t('common.yes')}, ${t('booking.cancelBooking')}`
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 2112,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2103,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 2072,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 2063,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            rescheduleModal.isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50",
                onClick: closeRescheduleModal,
                onMouseDown: (e)=>{
                    if (e.target === e.currentTarget) {
                        closeRescheduleModal();
                    }
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative",
                    onClick: (e)=>e.stopPropagation(),
                    onMouseDown: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: closeRescheduleModal,
                            className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2141,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-xl font-bold text-gray-900 mb-4",
                            children: t('booking.rescheduleBooking')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2149,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-4",
                            children: [
                                rescheduleModal.bookingCustomerName ? `${t('booking.rescheduleConfirm')} ${rescheduleModal.bookingCustomerName}` : t('booking.rescheduleBooking'),
                                ":"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2153,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        rescheduleModal.currentDateTime && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-500 mb-4",
                            children: [
                                t('booking.current'),
                                ": ",
                                new Date(rescheduleModal.currentDateTime).toLocaleString()
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2158,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-2",
                                    children: t('booking.newDateTime')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 2164,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "datetime-local",
                                    value: newDateTime,
                                    onChange: (e)=>setNewDateTime(e.target.value),
                                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none",
                                    required: true
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 2167,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2163,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        rescheduleMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `mb-4 p-3 rounded-lg ${rescheduleMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`,
                            children: rescheduleMessage.text
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2177,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-3 justify-end",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: closeRescheduleModal,
                                    disabled: rescheduleLoading,
                                    className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                    children: t('common.cancel')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 2187,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleRescheduleBooking,
                                    disabled: rescheduleLoading || !newDateTime,
                                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                                    children: rescheduleLoading ? t('common.rescheduling') : t('booking.rescheduleBooking')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 2195,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2186,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 2136,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 2127,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
        lineNumber: 1263,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(MyShopPage, "k+QyzdQfAEhz1xP3ZRkMesLi8z8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"]
    ];
});
_c = MyShopPage;
const __TURBOPACK__default__export__ = MyShopPage;
var _c;
__turbopack_context__.k.register(_c, "MyShopPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_dashboard_app_e5384ec4._.js.map
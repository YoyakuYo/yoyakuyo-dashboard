(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
;
var _s = __turbopack_context__.k.signature();
"use client";
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
                            // Silently handle connection errors (API server not running)
                            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                                console.error('Error fetching unclaimed shops:', error);
                            }
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
                        let res;
                        try {
                            res = await fetch(url, {
                                headers: {
                                    'x-user-id': user.id,
                                    'Content-Type': 'application/json'
                                }
                            });
                        } catch (fetchError) {
                            // Handle connection errors gracefully
                            if (fetchError?.message?.includes('Failed to fetch') || fetchError?.message?.includes('ERR_CONNECTION_REFUSED')) {
                                // API server is not running - silently handle
                                setShop(null);
                                setShopForm({});
                                setPageLoading(false);
                                return;
                            }
                            throw fetchError;
                        }
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
                        // Silently handle connection errors (API server not running)
                        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                            console.error('Error fetching shop:', error);
                        }
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
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error fetching services:', error);
            }
            setServices([]);
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
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error fetching staff:', error);
            }
            setStaff([]);
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
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error fetching bookings:', error);
            }
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
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error fetching photos:', error);
            }
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
                        lineNumber: 1092,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-gray-600",
                        children: t('common.loading')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1093,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1091,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
            lineNumber: 1090,
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
                    lineNumber: 1103,
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
                            lineNumber: 1106,
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
                            lineNumber: 1107,
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
                                            lineNumber: 1114,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-600 mb-4",
                                            children: t('myShop.startFresh')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1115,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setShowCreateShop(true),
                                            className: "w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors",
                                            children: t('myShop.createShop')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1116,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1113,
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
                                            lineNumber: 1126,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-600 mb-4",
                                            children: t('myShop.claimOwnership')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1127,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setShowClaimShop(true),
                                            className: "w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors",
                                            children: t('myShop.claimShop')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1128,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1125,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1111,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1105,
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
                            lineNumber: 1141,
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
                                                lineNumber: 1145,
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
                                                lineNumber: 1146,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1144,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.address')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1155,
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
                                                lineNumber: 1156,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1154,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.phone')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1165,
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
                                                lineNumber: 1166,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1164,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.email')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1175,
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
                                                lineNumber: 1176,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1174,
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
                                                lineNumber: 1185,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowCreateShop(false),
                                                className: "px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors",
                                                children: t('common.cancel')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1191,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1184,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1143,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1142,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1140,
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
                                    lineNumber: 1208,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setShowClaimShop(false),
                                    className: "px-4 py-2 text-gray-600 hover:text-gray-900",
                                    children: "×"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1209,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1207,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-6",
                            children: t('myShop.selectUnclaimedShop')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1216,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        claimLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center py-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1222,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-2 text-gray-600",
                                    children: t('shops.loading')
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1223,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1221,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)) : unclaimedShops.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center py-8 text-gray-500",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: t('myShop.noUnclaimedShops')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1227,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1226,
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
                                                        lineNumber: 1238,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    unclaimedShop.address && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-gray-600 mt-1",
                                                        children: unclaimedShop.address
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1240,
                                                        columnNumber: 27
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1237,
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
                                                lineNumber: 1243,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1236,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, unclaimedShop.id, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1232,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1230,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1206,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
            lineNumber: 1102,
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
                        lineNumber: 1293,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-lg text-gray-600",
                        children: shop.name
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1294,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1292,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 border-b border-gray-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-1",
                    children: [
                        'overview',
                        'services',
                        'bookings',
                        'photos'
                    ].map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                setActiveTab(tab);
                                // Fetch data when tab is clicked
                                if (shop && user) {
                                    if (tab === 'services') {
                                        fetchServices(shop.id);
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
                                    lineNumber: 1324,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, tab, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1301,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1299,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1298,
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
                                lineNumber: 1335,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            !editingShop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setEditingShop(true),
                                className: "mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium",
                                children: t('myShop.editShop')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1337,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1334,
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
                                            lineNumber: 1350,
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
                                            lineNumber: 1351,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1349,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: t('myShop.address')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1360,
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
                                            lineNumber: 1361,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1359,
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
                                                    lineNumber: 1371,
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
                                                    lineNumber: 1372,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1370,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                                    children: t('myShop.email')
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1381,
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
                                                    lineNumber: 1382,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1380,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1369,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: t('myShop.website')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1392,
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
                                            lineNumber: 1393,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1391,
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
                                            lineNumber: 1401,
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
                                            lineNumber: 1407,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1400,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1348,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1347,
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
                                                lineNumber: 1452,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-lg text-gray-900",
                                                children: shop.name
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1453,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1451,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm font-medium text-gray-500 mb-1",
                                                children: t('myShop.address')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1456,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-lg text-gray-900",
                                                children: shop.address
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1457,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1455,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm font-medium text-gray-500 mb-1",
                                                children: t('myShop.phone')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1460,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-lg text-gray-900",
                                                children: shop.phone
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1461,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1459,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm font-medium text-gray-500 mb-1",
                                                children: t('myShop.email')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1464,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-lg text-gray-900",
                                                children: shop.email
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1465,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1463,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1450,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            shop.website && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                        className: "text-sm font-medium text-gray-500 mb-1",
                                        children: t('myShop.website')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1470,
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
                                            lineNumber: 1472,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1471,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1469,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1449,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1333,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            activeTab === 'services' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl border border-gray-200 shadow-sm p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-gray-900 mb-4",
                        children: t('myShop.services')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1485,
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
                                lineNumber: 1489,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            serviceError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm",
                                children: serviceError
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1493,
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
                                                        lineNumber: 1500,
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
                                                        lineNumber: 1501,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1499,
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
                                                        lineNumber: 1511,
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
                                                        lineNumber: 1512,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1510,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1498,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1",
                                                children: t('myShop.serviceDescription')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1524,
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
                                                lineNumber: 1525,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1523,
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
                                                lineNumber: 1534,
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
                                                lineNumber: 1535,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1533,
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
                                                lineNumber: 1545,
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
                                                lineNumber: 1552,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1544,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1497,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1488,
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
                                lineNumber: 1570,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mb-2",
                                children: t('myShop.noServices')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1571,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: t('myShop.createFirstService')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1572,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1569,
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
                                                lineNumber: 1579,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.description')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1580,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.price')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1581,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.duration')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1582,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.actions')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1583,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1578,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1577,
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
                                                    lineNumber: 1589,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: service.description || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1590,
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
                                                    lineNumber: 1591,
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
                                                    lineNumber: 1592,
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
                                                                lineNumber: 1595,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>handleDeleteService(service.id),
                                                                className: "text-red-600 hover:text-red-800 text-sm font-medium",
                                                                children: t('common.delete')
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                lineNumber: 1601,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1594,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1593,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, service.id, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1588,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1586,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1576,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1575,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1484,
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
                        lineNumber: 1621,
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
                                lineNumber: 1624,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mb-2",
                                children: t('myShop.noBookings')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1625,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: t('myShop.bookingsWillAppear')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1626,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1623,
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
                                                lineNumber: 1633,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.email')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1634,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.phone')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1635,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('myShop.dateTime')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1636,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('myShop.service')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1637,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.status')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1638,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-3 px-4 font-semibold text-gray-700",
                                                children: t('common.actions')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1639,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1632,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1631,
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
                                                    lineNumber: 1645,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: booking.customer_email || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1648,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: booking.customer_phone || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1649,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-700",
                                                    children: booking.start_time ? new Date(booking.start_time).toLocaleString() : 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1650,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4 text-gray-600",
                                                    children: booking.services?.name || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1653,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-3 px-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'rejected' ? 'bg-red-100 text-red-700' : booking.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : booking.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`,
                                                        children: t(`status.${booking.status || 'pending'}`)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1657,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1656,
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
                                                                        lineNumber: 1671,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>openStatusUpdateModal(booking.id, 'rejected', booking.customer_name || null),
                                                                        className: "px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium",
                                                                        children: t('common.reject')
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                        lineNumber: 1677,
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
                                                                        lineNumber: 1687,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>openRescheduleModal(booking.id, booking.customer_name || null, booking.start_time),
                                                                        className: "px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium",
                                                                        children: t('booking.rescheduleBooking')
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                                        lineNumber: 1693,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                        lineNumber: 1668,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                    lineNumber: 1667,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, booking.id, true, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1644,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                    lineNumber: 1642,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1630,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1629,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1620,
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
                                lineNumber: 1715,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleSavePhotos,
                                className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium",
                                children: t('common.save')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1716,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1714,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    photoToast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `mb-4 p-3 rounded-lg ${photoToast.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`,
                        children: photoToast.message
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1726,
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
                                lineNumber: 1737,
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
                                            lineNumber: 1743,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400",
                                            children: t('myShop.noLogo')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1745,
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
                                        lineNumber: 1750,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "logo-upload",
                                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors",
                                        children: photos.find((p)=>p.type === 'logo') || shop.logo_url ? t('myShop.changeLogo') : t('myShop.uploadLogo')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1757,
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
                                                lineNumber: 1767,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0));
                                        }
                                        return null;
                                    })()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1738,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1736,
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
                                lineNumber: 1782,
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
                                            lineNumber: 1788,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-48 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400",
                                            children: t('myShop.noCoverPhoto')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                            lineNumber: 1790,
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
                                        lineNumber: 1795,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "cover-upload",
                                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors",
                                        children: photos.find((p)=>p.type === 'cover') || shop.cover_photo_url ? t('myShop.changeCover') : t('myShop.uploadCover')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1802,
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
                                                lineNumber: 1812,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0));
                                        }
                                        return null;
                                    })()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1783,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1781,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-gray-900 mb-3",
                                children: t('myShop.galleryPhotos')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1827,
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
                                lineNumber: 1828,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "gallery-upload",
                                className: "inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors mb-4",
                                children: t('myShop.uploadGalleryPhoto')
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1835,
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
                                        lineNumber: 1843,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-gray-500",
                                        children: t('myShop.noGalleryPhotos')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1844,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1842,
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
                                                lineNumber: 1850,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handlePhotoDelete(photo.id, 'gallery'),
                                                className: "absolute top-2 right-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 shadow-lg",
                                                children: t('common.delete')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                                lineNumber: 1859,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, photo.id, true, {
                                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                        lineNumber: 1849,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                                lineNumber: 1847,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                        lineNumber: 1826,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1713,
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
                            lineNumber: 1889,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-xl font-bold text-gray-900 mb-4",
                            children: statusUpdateModal.newStatus === 'confirmed' ? t('myShop.confirmBooking') : t('myShop.rejectBooking')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1897,
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
                            lineNumber: 1901,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        statusUpdateMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `mb-4 p-3 rounded-lg ${statusUpdateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`,
                            children: statusUpdateMessage.text
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1906,
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
                                    lineNumber: 1916,
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
                                    lineNumber: 1924,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1915,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1884,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1875,
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
                            lineNumber: 1957,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-xl font-bold text-gray-900 mb-4",
                            children: t('booking.cancelBooking')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1965,
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
                            lineNumber: 1969,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        cancelMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `mb-4 p-3 rounded-lg ${cancelMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`,
                            children: cancelMessage.text
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1974,
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
                                    lineNumber: 1984,
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
                                    lineNumber: 1992,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 1983,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 1952,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 1943,
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
                            lineNumber: 2021,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-xl font-bold text-gray-900 mb-4",
                            children: t('booking.rescheduleBooking')
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2029,
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
                            lineNumber: 2033,
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
                            lineNumber: 2038,
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
                                    lineNumber: 2044,
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
                                    lineNumber: 2047,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2043,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        rescheduleMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `mb-4 p-3 rounded-lg ${rescheduleMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`,
                            children: rescheduleMessage.text
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2057,
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
                                    lineNumber: 2067,
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
                                    lineNumber: 2075,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                            lineNumber: 2066,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                    lineNumber: 2016,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/shops/page.tsx",
                lineNumber: 2007,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/shops/page.tsx",
        lineNumber: 1290,
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

//# sourceMappingURL=apps_dashboard_app_shops_page_tsx_c1c0bc37._.js.map
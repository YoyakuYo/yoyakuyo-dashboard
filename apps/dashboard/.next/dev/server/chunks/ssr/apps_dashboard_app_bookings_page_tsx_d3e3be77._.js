module.exports = [
"[project]/apps/dashboard/app/bookings/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/bookings/page.tsx
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/app/components/BookingNotificationContext.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const BookingsPage = ()=>{
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const { setUnreadBookingsCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$app$2f$components$2f$BookingNotificationContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useBookingNotifications"])();
    const [bookings, setBookings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [shops, setShops] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [services, setServices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [staffMembers, setStaffMembers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [timeslots, setTimeslots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newBooking, setNewBooking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        shop_id: '',
        service_id: '',
        staff_id: '',
        timeslot_id: '',
        start_time: '',
        end_time: '',
        notes: ''
    });
    const [updatingStatus, setUpdatingStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingBooking, setEditingBooking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editStartTime, setEditStartTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [editEndTime, setEditEndTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [showEditModal, setShowEditModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [openDropdown, setOpenDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const dropdownRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])({});
    const apiUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
    // Reset unread count when page loads
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setUnreadBookingsCount(0);
    }, [
        setUnreadBookingsCount
    ]);
    // Close dropdown when clicking outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!openDropdown) return;
        const handleClickOutside = (event)=>{
            const target = event.target;
            const dropdownElement = dropdownRefs.current[openDropdown];
            if (dropdownElement && !dropdownElement.contains(target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return ()=>document.removeEventListener('mousedown', handleClickOutside);
    }, [
        openDropdown
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!user) return;
        const fetchAll = async ()=>{
            try {
                const headers = {
                    'x-user-id': user.id
                };
                // Fetch all shops
                const shopsRes = await fetch(`${apiUrl}/shops`);
                if (shopsRes.ok) {
                    const shopsData = await shopsRes.json();
                    setShops(Array.isArray(shopsData) ? shopsData : []);
                } else {
                    console.error("Failed to fetch shops:", shopsRes.status, shopsRes.statusText);
                    setShops([]);
                }
                // Fetch services (filtered by user's shops)
                const servicesRes = await fetch(`${apiUrl}/services`, {
                    headers
                });
                if (servicesRes.ok) {
                    const servicesData = await servicesRes.json();
                    setServices(Array.isArray(servicesData) ? servicesData : []);
                } else {
                    console.error("Failed to fetch services:", servicesRes.status, servicesRes.statusText);
                    setServices([]);
                }
                // Fetch staff (filtered by user's shops)
                const staffRes = await fetch(`${apiUrl}/staff`, {
                    headers
                });
                if (staffRes.ok) {
                    const staffData = await staffRes.json();
                    setStaffMembers(Array.isArray(staffData) ? staffData : []);
                } else {
                    console.error("Failed to fetch staff:", staffRes.status, staffRes.statusText);
                    setStaffMembers([]);
                }
                // Fetch timeslots (filtered by user's shops)
                try {
                    const timeslotsRes = await fetch(`${apiUrl}/timeslots`, {
                        headers
                    });
                    if (timeslotsRes.ok) {
                        const timeslotsData = await timeslotsRes.json();
                        setTimeslots(Array.isArray(timeslotsData) ? timeslotsData : []);
                    } else {
                        console.error("Failed to fetch timeslots:", timeslotsRes.status, timeslotsRes.statusText);
                        setTimeslots([]);
                    }
                } catch (timeslotError) {
                    console.error("Error fetching timeslots:", timeslotError);
                    setTimeslots([]);
                }
                // Fetch bookings (filtered by user's shops)
                try {
                    const bookingsRes = await fetch(`${apiUrl}/bookings`, {
                        headers
                    });
                    if (bookingsRes.ok) {
                        const bookingsData = await bookingsRes.json();
                        // Double-check that data is an array before setting state
                        if (Array.isArray(bookingsData)) {
                            setBookings(bookingsData);
                        } else {
                            console.error("Bookings data is not an array:", typeof bookingsData, bookingsData);
                            setBookings([]);
                        }
                    } else {
                        console.error("Failed to fetch bookings:", bookingsRes.status, bookingsRes.statusText);
                        // Try to get error message from response
                        try {
                            const errorData = await bookingsRes.json();
                            console.error("Error details:", errorData);
                        } catch (e) {
                        // Ignore JSON parse errors
                        }
                        setBookings([]);
                    }
                } catch (bookingError) {
                    console.error("Error fetching bookings:", bookingError);
                    setBookings([]);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                // Ensure all states are arrays even on error
                setShops([]);
                setServices([]);
                setStaffMembers([]);
                setTimeslots([]);
                setBookings([]);
            }
        };
        fetchAll();
    }, [
        apiUrl,
        user
    ]);
    const handleInputChange = (e)=>{
        const { name, value } = e.target;
        setNewBooking((prev)=>({
                ...prev,
                [name]: value
            }));
    };
    // No date filtering - all bookings for owner's shops are shown
    const filteredBookings = bookings;
    const refreshBookings = async ()=>{
        if (!user?.id) return;
        try {
            const bookingsRes = await fetch(`${apiUrl}/bookings`, {
                headers: {
                    'x-user-id': user.id
                }
            });
            if (bookingsRes.ok) {
                const bookingsData = await bookingsRes.json();
                if (Array.isArray(bookingsData)) {
                    setBookings(bookingsData);
                    const pendingCount = bookingsData.filter((b)=>b.status === 'pending').length;
                    setUnreadBookingsCount(pendingCount);
                }
            }
        } catch (error) {
            console.error('Error refreshing bookings:', error);
        }
    };
    const confirmBooking = async (bookingId)=>{
        if (!user?.id) return;
        setUpdatingStatus(bookingId);
        try {
            const res = await fetch(`${apiUrl}/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    status: 'confirmed'
                })
            });
            if (res.ok) {
                await refreshBookings();
            } else {
                const errorData = await res.json().catch(()=>({}));
                alert(errorData.error || 'Failed to confirm booking');
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
            alert('Failed to confirm booking');
        } finally{
            setUpdatingStatus(null);
        }
    };
    const cancelBooking = async (bookingId)=>{
        if (!user?.id) return;
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        setUpdatingStatus(bookingId);
        try {
            const res = await fetch(`${apiUrl}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-id': user.id
                }
            });
            if (res.ok) {
                await refreshBookings();
            } else {
                const errorData = await res.json().catch(()=>({}));
                alert(errorData.error || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('Error canceling booking:', error);
            alert('Failed to cancel booking');
        } finally{
            setUpdatingStatus(null);
        }
    };
    const openEditModal = (booking)=>{
        setEditingBooking(booking);
        // Convert ISO strings to datetime-local format
        const startDateTime = booking.start_time ? new Date(booking.start_time).toISOString().slice(0, 16) : '';
        const endDateTime = booking.end_time ? new Date(booking.end_time).toISOString().slice(0, 16) : '';
        setEditStartTime(startDateTime);
        setEditEndTime(endDateTime);
        setShowEditModal(true);
    };
    const saveReschedule = async ()=>{
        if (!user?.id || !editingBooking) return;
        if (!editStartTime || !editEndTime) {
            alert('Please provide both start and end times');
            return;
        }
        setUpdatingStatus(editingBooking.id);
        try {
            const res = await fetch(`${apiUrl}/bookings/${editingBooking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    start_time: new Date(editStartTime).toISOString(),
                    end_time: new Date(editEndTime).toISOString()
                })
            });
            if (res.ok) {
                await refreshBookings();
                setShowEditModal(false);
                setEditingBooking(null);
                setEditStartTime('');
                setEditEndTime('');
            } else {
                const errorData = await res.json().catch(()=>({}));
                alert(errorData.error || 'Failed to reschedule booking');
            }
        } catch (error) {
            console.error('Error rescheduling booking:', error);
            alert('Failed to reschedule booking');
        } finally{
            setUpdatingStatus(null);
        }
    };
    const createBooking = async ()=>{
        try {
            const res = await fetch(`${apiUrl}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newBooking)
            });
            if (res.ok) {
                // Refresh bookings after creation
                try {
                    const bookingsRes = await fetch(`${apiUrl}/bookings`);
                    if (bookingsRes.ok) {
                        const bookingsData = await bookingsRes.json();
                        // Double-check that data is an array before setting state
                        if (Array.isArray(bookingsData)) {
                            setBookings(bookingsData);
                        } else {
                            console.error("Bookings data is not an array:", typeof bookingsData, bookingsData);
                            setBookings([]);
                        }
                    } else {
                        console.error("Failed to refresh bookings:", bookingsRes.status, bookingsRes.statusText);
                        setBookings([]);
                    }
                } catch (refreshError) {
                    console.error("Error refreshing bookings:", refreshError);
                    setBookings([]);
                }
                setNewBooking({
                    shop_id: '',
                    service_id: '',
                    staff_id: '',
                    timeslot_id: '',
                    start_time: '',
                    end_time: '',
                    notes: ''
                });
            } else {
                console.error("Failed to create booking:", res.status, res.statusText);
            }
        } catch (error) {
            console.error("Failed to create booking:", error);
        }
    };
    // Show empty state if user has no shops
    if (user && shops.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl font-bold text-gray-800 mb-2",
                            children: "Bookings"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 378,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600",
                            children: "View and manage all bookings"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 379,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                    lineNumber: 377,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-6xl mb-4",
                            children: "🏪"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 382,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold text-gray-800 mb-2",
                            children: "No Shops Found"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 383,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-6",
                            children: "You need to create or claim a shop before you can view bookings."
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 384,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/shops",
                            className: "inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200",
                            children: "Go to Shops →"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 387,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                    lineNumber: 381,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
            lineNumber: 376,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold text-gray-800 mb-2",
                        children: "Bookings"
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                        lineNumber: 401,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "View and manage all bookings"
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                        lineNumber: 402,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                lineNumber: 400,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-4 border-b border-gray-200 bg-gray-50",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-bold text-gray-800",
                            children: [
                                "All Bookings (",
                                filteredBookings.length,
                                ")"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 408,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                        lineNumber: 407,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: Array.isArray(filteredBookings) && filteredBookings.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: "bg-gray-50",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                                children: "Customer"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                lineNumber: 417,
                                                columnNumber: 45
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                                children: "Service"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                lineNumber: 418,
                                                columnNumber: 45
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                                children: "Staff"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                lineNumber: 419,
                                                columnNumber: 45
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                                children: "Start Time"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                lineNumber: 420,
                                                columnNumber: 45
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                                children: "End Time"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                lineNumber: 421,
                                                columnNumber: 45
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                                children: "Status"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                lineNumber: 422,
                                                columnNumber: 45
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                                children: "Actions"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                lineNumber: 423,
                                                columnNumber: 45
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                        lineNumber: 416,
                                        columnNumber: 41
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                    lineNumber: 415,
                                    columnNumber: 37
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: "bg-white divide-y divide-gray-200",
                                    children: filteredBookings.map((booking)=>{
                                        try {
                                            const startTime = booking.start_time ? new Date(booking.start_time).toLocaleString() : 'N/A';
                                            const endTime = booking.end_time ? new Date(booking.end_time).toLocaleString() : 'N/A';
                                            const isPending = booking.status === 'pending';
                                            const isUpdating = updatingStatus === booking.id;
                                            const getStatusBadge = (status)=>{
                                                const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
                                                switch(status){
                                                    case 'pending':
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `${baseClasses} bg-yellow-100 text-yellow-800`,
                                                            children: "Pending"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                            lineNumber: 438,
                                                            columnNumber: 68
                                                        }, ("TURBOPACK compile-time value", void 0));
                                                    case 'confirmed':
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `${baseClasses} bg-green-100 text-green-800`,
                                                            children: "Confirmed"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                            lineNumber: 440,
                                                            columnNumber: 68
                                                        }, ("TURBOPACK compile-time value", void 0));
                                                    case 'rejected':
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `${baseClasses} bg-red-100 text-red-800`,
                                                            children: "Declined"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                            lineNumber: 442,
                                                            columnNumber: 68
                                                        }, ("TURBOPACK compile-time value", void 0));
                                                    case 'cancelled':
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `${baseClasses} bg-gray-100 text-gray-800`,
                                                            children: "Cancelled"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                            lineNumber: 444,
                                                            columnNumber: 68
                                                        }, ("TURBOPACK compile-time value", void 0));
                                                    case 'completed':
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `${baseClasses} bg-blue-100 text-blue-800`,
                                                            children: "Completed"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                            lineNumber: 446,
                                                            columnNumber: 68
                                                        }, ("TURBOPACK compile-time value", void 0));
                                                    default:
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `${baseClasses} bg-gray-100 text-gray-800`,
                                                            children: status
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                            lineNumber: 448,
                                                            columnNumber: 68
                                                        }, ("TURBOPACK compile-time value", void 0));
                                                }
                                            };
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "hover:bg-gray-50 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 text-sm",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "font-medium text-gray-900",
                                                                children: booking.customer_name || 'N/A'
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                lineNumber: 455,
                                                                columnNumber: 61
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            booking.customer_email && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-500 text-xs",
                                                                children: booking.customer_email
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                lineNumber: 457,
                                                                columnNumber: 65
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            booking.customer_phone && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-500 text-xs",
                                                                children: booking.customer_phone
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                lineNumber: 460,
                                                                columnNumber: 65
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                        lineNumber: 454,
                                                        columnNumber: 57
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 text-sm text-gray-600",
                                                        children: booking.services?.name || 'N/A'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                        lineNumber: 463,
                                                        columnNumber: 57
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 text-sm text-gray-600",
                                                        children: booking.staff ? `${booking.staff.first_name || ''} ${booking.staff.last_name || ''}`.trim() || 'N/A' : 'N/A'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                        lineNumber: 464,
                                                        columnNumber: 57
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 text-sm text-gray-600",
                                                        children: startTime
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                        lineNumber: 467,
                                                        columnNumber: 57
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 text-sm text-gray-600",
                                                        children: endTime
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                        lineNumber: 468,
                                                        columnNumber: 57
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 text-sm",
                                                        children: getStatusBadge(booking.status)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                        lineNumber: 469,
                                                        columnNumber: 57
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 text-sm",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            ref: (el)=>{
                                                                dropdownRefs.current[booking.id] = el;
                                                            },
                                                            className: "relative inline-block text-left",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    onClick: ()=>setOpenDropdown(openDropdown === booking.id ? null : booking.id),
                                                                    disabled: isUpdating,
                                                                    className: "inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
                                                                    children: [
                                                                        "Actions",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                            className: "-mr-1 ml-2 h-4 w-4",
                                                                            xmlns: "http://www.w3.org/2000/svg",
                                                                            viewBox: "0 0 20 20",
                                                                            fill: "currentColor",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                fillRule: "evenodd",
                                                                                d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
                                                                                clipRule: "evenodd"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                                lineNumber: 485,
                                                                                columnNumber: 73
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                            lineNumber: 484,
                                                                            columnNumber: 69
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                    lineNumber: 477,
                                                                    columnNumber: 65
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                openDropdown === booking.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "py-1",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                onClick: ()=>{
                                                                                    setOpenDropdown(null);
                                                                                    openEditModal(booking);
                                                                                },
                                                                                disabled: isUpdating || booking.status === 'cancelled' || booking.status === 'completed',
                                                                                className: "block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",
                                                                                children: "Edit / Reschedule"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                                lineNumber: 491,
                                                                                columnNumber: 77
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            booking.status !== 'confirmed' && booking.status !== 'cancelled' && booking.status !== 'completed' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                onClick: ()=>{
                                                                                    setOpenDropdown(null);
                                                                                    confirmBooking(booking.id);
                                                                                },
                                                                                disabled: isUpdating,
                                                                                className: "block w-full text-left px-4 py-2 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed",
                                                                                children: "Confirm"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                                lineNumber: 502,
                                                                                columnNumber: 81
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                onClick: ()=>{
                                                                                    setOpenDropdown(null);
                                                                                    cancelBooking(booking.id);
                                                                                },
                                                                                disabled: isUpdating || booking.status === 'cancelled' || booking.status === 'completed',
                                                                                className: "block w-full text-left px-4 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed",
                                                                                children: "Cancel / Delete"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                                lineNumber: 513,
                                                                                columnNumber: 77
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                        lineNumber: 490,
                                                                        columnNumber: 73
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                                    lineNumber: 489,
                                                                    columnNumber: 69
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                            lineNumber: 473,
                                                            columnNumber: 61
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                        lineNumber: 472,
                                                        columnNumber: 57
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, booking.id || Math.random(), true, {
                                                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                                lineNumber: 453,
                                                columnNumber: 53
                                            }, ("TURBOPACK compile-time value", void 0));
                                        } catch (e) {
                                            console.error("Error rendering booking row:", e, booking);
                                            return null;
                                        }
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                    lineNumber: 426,
                                    columnNumber: 37
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 414,
                            columnNumber: 33
                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-12 text-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-500 text-lg",
                                    children: bookings.length === 0 ? 'No bookings found' : 'No bookings match your filters'
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                    lineNumber: 539,
                                    columnNumber: 37
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-400 text-sm mt-2",
                                    children: bookings.length === 0 ? 'Bookings will appear here once customers make appointments' : 'Try adjusting your filters'
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                    lineNumber: 544,
                                    columnNumber: 37
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 538,
                            columnNumber: 33
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                        lineNumber: 412,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                lineNumber: 406,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            showEditModal && editingBooking && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-xl p-6 w-full max-w-md",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold text-gray-800 mb-4",
                            children: "Edit / Reschedule Booking"
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 558,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: "Start Time"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                            lineNumber: 561,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "datetime-local",
                                            value: editStartTime,
                                            onChange: (e)=>setEditStartTime(e.target.value),
                                            className: "w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                            lineNumber: 562,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                    lineNumber: 560,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: "End Time"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                            lineNumber: 570,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "datetime-local",
                                            value: editEndTime,
                                            onChange: (e)=>setEditEndTime(e.target.value),
                                            className: "w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                            lineNumber: 571,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                    lineNumber: 569,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 559,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-4 mt-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: saveReschedule,
                                    disabled: updatingStatus === editingBooking.id,
                                    className: "flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                    children: updatingStatus === editingBooking.id ? 'Saving...' : 'Save Changes'
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                    lineNumber: 580,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setShowEditModal(false);
                                        setEditingBooking(null);
                                        setEditStartTime('');
                                        setEditEndTime('');
                                    },
                                    className: "flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors",
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                                    lineNumber: 587,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                            lineNumber: 579,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                    lineNumber: 557,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
                lineNumber: 556,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/bookings/page.tsx",
        lineNumber: 399,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = BookingsPage;
}),
];

//# sourceMappingURL=apps_dashboard_app_bookings_page_tsx_d3e3be77._.js.map
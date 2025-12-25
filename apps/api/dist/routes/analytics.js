"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
// Log route registration
console.log("[Analytics Router] Initializing analytics routes...");
// Helper to get user ID from headers
function getUserId(req) {
    return req.headers["x-user-id"] || null;
}
// Helper to verify user owns the shop
function verifyShopOwnership(userId, shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, error } = yield supabase_1.supabase
            .from("shops")
            .select("id")
            .eq("id", shopId)
            .eq("owner_user_id", userId)
            .single();
        return !error && data !== null;
    });
}
// GET /analytics/revenue - Get revenue analytics for owner's shop
router.get("/revenue", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[Analytics] GET /analytics/revenue called");
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { period = "30" } = req.query; // days
        const periodDays = parseInt(period, 10);
        // Get owner's shop
        const { data: shops, error: shopsError } = yield supabase_1.supabase
            .from("shops")
            .select("id")
            .eq("owner_user_id", userId)
            .limit(1);
        if (shopsError || !shops || shops.length === 0) {
            return res.status(404).json({ error: "Shop not found" });
        }
        const shopId = shops[0].id;
        // Get revenue analytics using optimized function or direct query
        let revenueData = null;
        const { data: revenueDataResult, error: revenueError } = yield supabase_1.supabase
            .rpc("get_shop_revenue_analytics", { p_shop_id: shopId });
        if (revenueError || !revenueDataResult || revenueDataResult.length === 0) {
            console.error("Error fetching revenue analytics (trying fallback):", revenueError);
            // Fallback to direct query if function doesn't exist
            const { data: bookings, error: bookingsError } = yield supabase_1.supabase
                .from("bookings")
                .select(`
          id,
          status,
          created_at,
          customer_id,
          payments(amount, status, created_at)
        `)
                .eq("shop_id", shopId);
            if (bookingsError) {
                console.error("Fallback query also failed:", bookingsError);
                return res.status(500).json({ error: "Failed to fetch revenue analytics" });
            }
            // Calculate revenue from bookings
            const allPayments = (bookings === null || bookings === void 0 ? void 0 : bookings.flatMap((b) => b.payments || [])) || [];
            const completedPayments = allPayments.filter((p) => p.status === "completed");
            const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const revenueLast30Days = completedPayments
                .filter((p) => new Date(p.created_at) >= thirtyDaysAgo)
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const revenueLast7Days = completedPayments
                .filter((p) => new Date(p.created_at) >= sevenDaysAgo)
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const uniqueCustomers = new Set((bookings === null || bookings === void 0 ? void 0 : bookings.map((b) => b.customer_id).filter(Boolean)) || []).size;
            const newCustomers30Days = new Set((bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => new Date(b.created_at) >= thirtyDaysAgo).map((b) => b.customer_id).filter(Boolean)) || []).size;
            revenueData = {
                shop_id: shopId,
                total_bookings: (bookings === null || bookings === void 0 ? void 0 : bookings.length) || 0,
                completed_bookings: (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "completed").length) || 0,
                confirmed_bookings: (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "confirmed").length) || 0,
                pending_bookings: (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "pending").length) || 0,
                cancelled_bookings: (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "cancelled").length) || 0,
                total_revenue: totalRevenue,
                revenue_last_30_days: revenueLast30Days,
                revenue_last_7_days: revenueLast7Days,
                average_booking_value: completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0,
                unique_customers: uniqueCustomers,
                new_customers_30_days: newCustomers30Days,
            };
        }
        else {
            revenueData = revenueDataResult[0];
        }
        // Get daily revenue for the period using optimized function or direct query
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        const startDateStr = startDate.toISOString().split("T")[0];
        let dailyRevenue = [];
        const { data: dailyRevenueResult, error: dailyError } = yield supabase_1.supabase
            .rpc("get_booking_analytics_by_date", {
            p_shop_id: shopId,
            p_start_date: startDateStr
        });
        if (dailyError || !dailyRevenueResult) {
            console.error("Error fetching daily revenue (trying fallback):", dailyError);
            // Fallback to direct query
            const { data: bookings, error: bookingsError } = yield supabase_1.supabase
                .from("bookings")
                .select(`
          id,
          status,
          created_at,
          customer_id,
          payments(amount, status)
        `)
                .eq("shop_id", shopId)
                .gte("created_at", startDate.toISOString())
                .order("created_at", { ascending: true });
            if (!bookingsError && bookings) {
                // Group by date
                const dailyMap = new Map();
                bookings.forEach((booking) => {
                    var _a;
                    const date = new Date(booking.created_at).toISOString().split("T")[0];
                    if (!dailyMap.has(date)) {
                        dailyMap.set(date, {
                            booking_date: date,
                            bookings_count: 0,
                            completed_count: 0,
                            confirmed_count: 0,
                            pending_count: 0,
                            cancelled_count: 0,
                            revenue: 0,
                            unique_customers: new Set(),
                        });
                    }
                    const day = dailyMap.get(date);
                    day.bookings_count++;
                    if (booking.status === "completed")
                        day.completed_count++;
                    if (booking.status === "confirmed")
                        day.confirmed_count++;
                    if (booking.status === "pending")
                        day.pending_count++;
                    if (booking.status === "cancelled")
                        day.cancelled_count++;
                    const completedPayments = ((_a = booking.payments) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === "completed")) || [];
                    day.revenue += completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                    if (booking.customer_id)
                        day.unique_customers.add(booking.customer_id);
                });
                dailyRevenue = Array.from(dailyMap.values()).map((day) => (Object.assign(Object.assign({}, day), { unique_customers: day.unique_customers.size })));
            }
        }
        else {
            dailyRevenue = dailyRevenueResult || [];
        }
        res.json({
            summary: revenueData,
            daily: dailyRevenue || [],
            period_days: periodDays,
        });
    }
    catch (error) {
        console.error("Error in revenue analytics:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}));
// GET /analytics/customers - Get customer analytics
router.get("/customers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get owner's shop
        const { data: shops, error: shopsError } = yield supabase_1.supabase
            .from("shops")
            .select("id")
            .eq("owner_user_id", userId)
            .limit(1);
        if (shopsError || !shops || shops.length === 0) {
            return res.status(404).json({ error: "Shop not found" });
        }
        const shopId = shops[0].id;
        // Get customer analytics for this shop (direct query - no joins to avoid timeouts)
        const { data: bookings, error: bookingsError } = yield supabase_1.supabase
            .from("bookings")
            .select(`
        customer_id,
        status,
        created_at,
        payments(amount, status)
      `)
            .eq("shop_id", shopId);
        if (bookingsError) {
            console.error("Error fetching customer analytics:", bookingsError);
            return res.status(500).json({ error: "Failed to fetch customer analytics" });
        }
        // Process customer data
        const customerMap = new Map();
        bookings === null || bookings === void 0 ? void 0 : bookings.forEach((booking) => {
            var _a;
            const customerId = booking.customer_id;
            if (!customerId)
                return;
            if (!customerMap.has(customerId)) {
                customerMap.set(customerId, {
                    customer_id: customerId,
                    customer_type: "customer", // Default type
                    total_bookings: 0,
                    completed_bookings: 0,
                    cancelled_bookings: 0,
                    total_spent: 0,
                    first_booking: booking.created_at,
                    last_booking: booking.created_at,
                });
            }
            const customer = customerMap.get(customerId);
            customer.total_bookings++;
            if (booking.status === "completed") {
                customer.completed_bookings++;
            }
            if (booking.status === "cancelled") {
                customer.cancelled_bookings++;
            }
            const completedPayments = ((_a = booking.payments) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === "completed")) || [];
            const totalSpent = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            customer.total_spent += totalSpent;
            if (new Date(booking.created_at) < new Date(customer.first_booking)) {
                customer.first_booking = booking.created_at;
            }
            if (new Date(booking.created_at) > new Date(customer.last_booking)) {
                customer.last_booking = booking.created_at;
            }
        });
        const customers = Array.from(customerMap.values());
        // Calculate averages
        const totalCustomers = customers.length;
        const avgBookingsPerCustomer = totalCustomers > 0
            ? customers.reduce((sum, c) => sum + c.total_bookings, 0) / totalCustomers
            : 0;
        const avgSpentPerCustomer = totalCustomers > 0
            ? customers.reduce((sum, c) => sum + c.total_spent, 0) / totalCustomers
            : 0;
        res.json({
            customers,
            summary: {
                total_customers: totalCustomers,
                new_customers_30_days: customers.filter((c) => {
                    const firstBooking = new Date(c.first_booking);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return firstBooking >= thirtyDaysAgo;
                }).length,
                average_bookings_per_customer: Math.round(avgBookingsPerCustomer * 100) / 100,
                average_spent_per_customer: Math.round(avgSpentPerCustomer * 100) / 100,
                total_revenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
            },
        });
    }
    catch (error) {
        console.error("Error in customer analytics:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}));
// GET /analytics/performance - Get performance metrics
router.get("/performance", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get owner's shop
        const { data: shops, error: shopsError } = yield supabase_1.supabase
            .from("shops")
            .select("id")
            .eq("owner_user_id", userId)
            .limit(1);
        if (shopsError || !shops || shops.length === 0) {
            return res.status(404).json({ error: "Shop not found" });
        }
        const shopId = shops[0].id;
        // Get performance metrics using optimized function or direct query
        let performance = null;
        const { data: performanceResult, error: performanceError } = yield supabase_1.supabase
            .rpc("get_shop_performance_metrics", { p_shop_id: shopId });
        if (performanceError || !performanceResult || performanceResult.length === 0) {
            console.error("Error fetching performance metrics (trying fallback):", performanceError);
            // Fallback to direct query
            const { data: bookings, error: bookingsError } = yield supabase_1.supabase
                .from("bookings")
                .select(`
          id,
          status,
          created_at,
          customer_id,
          payments(amount, status, created_at)
        `)
                .eq("shop_id", shopId);
            const { data: reviews } = yield supabase_1.supabase
                .from("reviews")
                .select("id, rating")
                .eq("shop_id", shopId)
                .eq("status", "published");
            if (bookingsError) {
                console.error("Fallback query also failed:", bookingsError);
                return res.status(500).json({ error: "Failed to fetch performance metrics" });
            }
            const totalBookings = (bookings === null || bookings === void 0 ? void 0 : bookings.length) || 0;
            const completedBookings = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "completed").length) || 0;
            const cancelledBookings = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "cancelled").length) || 0;
            const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
            const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
            const allPayments = (bookings === null || bookings === void 0 ? void 0 : bookings.flatMap((b) => b.payments || [])) || [];
            const completedPayments = allPayments.filter((p) => p.status === "completed");
            const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const avgBookingValue = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0;
            const uniqueCustomers = new Set((bookings === null || bookings === void 0 ? void 0 : bookings.map((b) => b.customer_id).filter(Boolean)) || []).size;
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const newCustomers30Days = new Set((bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => new Date(b.created_at) >= thirtyDaysAgo).map((b) => b.customer_id).filter(Boolean)) || []).size;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const bookingsLast7Days = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => new Date(b.created_at) >= sevenDaysAgo).length) || 0;
            const bookingsLast30Days = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => new Date(b.created_at) >= thirtyDaysAgo).length) || 0;
            const revenueLast7Days = completedPayments
                .filter((p) => new Date(p.created_at) >= sevenDaysAgo)
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const revenueLast30Days = completedPayments
                .filter((p) => new Date(p.created_at) >= thirtyDaysAgo)
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const avgRating = reviews && reviews.length > 0
                ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
                : 0;
            performance = {
                shop_id: shopId,
                total_bookings: totalBookings,
                completed_bookings: completedBookings,
                cancelled_bookings: cancelledBookings,
                completion_rate: Math.round(completionRate * 100) / 100,
                cancellation_rate: Math.round(cancellationRate * 100) / 100,
                total_revenue: totalRevenue,
                average_booking_value: avgBookingValue,
                unique_customers: uniqueCustomers,
                new_customers_30_days: newCustomers30Days,
                total_reviews: (reviews === null || reviews === void 0 ? void 0 : reviews.length) || 0,
                average_rating: avgRating,
                bookings_last_7_days: bookingsLast7Days,
                bookings_last_30_days: bookingsLast30Days,
                revenue_last_7_days: revenueLast7Days,
                revenue_last_30_days: revenueLast30Days,
            };
        }
        else {
            performance = performanceResult[0];
        }
        res.json(performance);
    }
    catch (error) {
        console.error("Error in performance analytics:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}));
// GET /analytics/bookings - Get detailed booking analytics
router.get("/bookings", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { period = "30", group_by = "day" } = req.query;
        const periodDays = parseInt(period, 10);
        const groupBy = group_by;
        // Get owner's shop
        const { data: shops, error: shopsError } = yield supabase_1.supabase
            .from("shops")
            .select("id")
            .eq("owner_user_id", userId)
            .limit(1);
        if (shopsError || !shops || shops.length === 0) {
            return res.status(404).json({ error: "Shop not found" });
        }
        const shopId = shops[0].id;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        let query = supabase_1.supabase
            .from("bookings")
            .select(`
        id,
        status,
        created_at,
        customer_id,
        payments(amount, status)
      `)
            .eq("shop_id", shopId)
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: true });
        const { data: bookings, error: bookingsError } = yield query;
        if (bookingsError) {
            console.error("Error fetching bookings:", bookingsError);
            return res.status(500).json({ error: "Failed to fetch bookings" });
        }
        // Group bookings by period
        const grouped = {};
        bookings === null || bookings === void 0 ? void 0 : bookings.forEach((booking) => {
            var _a;
            const date = new Date(booking.created_at);
            let key;
            if (groupBy === "day") {
                key = date.toISOString().split("T")[0];
            }
            else if (groupBy === "week") {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split("T")[0];
            }
            else if (groupBy === "month") {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            }
            else {
                key = date.toISOString().split("T")[0];
            }
            if (!grouped[key]) {
                grouped[key] = {
                    period: key,
                    total: 0,
                    pending: 0,
                    confirmed: 0,
                    completed: 0,
                    cancelled: 0,
                    revenue: 0,
                };
            }
            grouped[key].total++;
            grouped[key][booking.status] = (grouped[key][booking.status] || 0) + 1;
            const completedPayments = ((_a = booking.payments) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === "completed")) || [];
            const revenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            grouped[key].revenue += revenue;
        });
        const groupedArray = Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
        // Calculate totals
        const totals = {
            total: (bookings === null || bookings === void 0 ? void 0 : bookings.length) || 0,
            pending: (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "pending").length) || 0,
            confirmed: (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "confirmed").length) || 0,
            completed: (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "completed").length) || 0,
            cancelled: (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === "cancelled").length) || 0,
            revenue: (bookings === null || bookings === void 0 ? void 0 : bookings.reduce((sum, b) => {
                var _a;
                const completedPayments = ((_a = b.payments) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === "completed")) || [];
                return sum + completedPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
            }, 0)) || 0,
        };
        res.json({
            grouped: groupedArray,
            totals,
            period_days: periodDays,
            group_by: groupBy,
        });
    }
    catch (error) {
        console.error("Error in booking analytics:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}));
// GET /analytics/report - Generate comprehensive report
router.get("/report", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { period = "30", group_by = "day" } = req.query;
        const periodDays = parseInt(period, 10);
        const groupBy = group_by;
        // Get owner's shop
        const { data: shops, error: shopsError } = yield supabase_1.supabase
            .from("shops")
            .select("id, name")
            .eq("owner_user_id", userId)
            .limit(1);
        if (shopsError || !shops || shops.length === 0) {
            return res.status(404).json({ error: "Shop not found" });
        }
        const shop = shops[0];
        const shopId = shop.id;
        // Fetch all analytics data directly from database (no views to avoid timeouts)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        // Get all bookings for this shop
        const { data: allBookings, error: bookingsError } = yield supabase_1.supabase
            .from("bookings")
            .select(`
        id,
        status,
        created_at,
        customer_id,
        payments(amount, status, created_at)
      `)
            .eq("shop_id", shopId);
        // Get reviews
        const { data: reviews } = yield supabase_1.supabase
            .from("reviews")
            .select("id, rating")
            .eq("shop_id", shopId)
            .eq("status", "published");
        if (bookingsError) {
            console.error("Error fetching bookings for report:", bookingsError);
            return res.status(500).json({ error: "Failed to fetch analytics data" });
        }
        // Calculate revenue data
        const allPayments = (allBookings === null || allBookings === void 0 ? void 0 : allBookings.flatMap((b) => b.payments || [])) || [];
        const completedPayments = allPayments.filter((p) => p.status === "completed");
        const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const revenueLast30Days = completedPayments
            .filter((p) => new Date(p.created_at) >= thirtyDaysAgo)
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const revenueLast7Days = completedPayments
            .filter((p) => new Date(p.created_at) >= sevenDaysAgo)
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const uniqueCustomers = new Set((allBookings === null || allBookings === void 0 ? void 0 : allBookings.map((b) => b.customer_id).filter(Boolean)) || []).size;
        const newCustomers30Days = new Set((allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => new Date(b.created_at) >= thirtyDaysAgo).map((b) => b.customer_id).filter(Boolean)) || []).size;
        const revenueData = {
            shop_id: shopId,
            total_bookings: (allBookings === null || allBookings === void 0 ? void 0 : allBookings.length) || 0,
            completed_bookings: (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => b.status === "completed").length) || 0,
            confirmed_bookings: (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => b.status === "confirmed").length) || 0,
            pending_bookings: (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => b.status === "pending").length) || 0,
            cancelled_bookings: (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => b.status === "cancelled").length) || 0,
            total_revenue: totalRevenue,
            revenue_last_30_days: revenueLast30Days,
            revenue_last_7_days: revenueLast7Days,
            average_booking_value: completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0,
            unique_customers: uniqueCustomers,
            new_customers_30_days: newCustomers30Days,
        };
        // Calculate daily revenue
        const dailyMap = new Map();
        allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => new Date(b.created_at) >= startDate).forEach((booking) => {
            var _a;
            const date = new Date(booking.created_at).toISOString().split("T")[0];
            if (!dailyMap.has(date)) {
                dailyMap.set(date, {
                    booking_date: date,
                    bookings_count: 0,
                    completed_count: 0,
                    confirmed_count: 0,
                    pending_count: 0,
                    cancelled_count: 0,
                    revenue: 0,
                    unique_customers: new Set(),
                });
            }
            const day = dailyMap.get(date);
            day.bookings_count++;
            if (booking.status === "completed")
                day.completed_count++;
            if (booking.status === "confirmed")
                day.confirmed_count++;
            if (booking.status === "pending")
                day.pending_count++;
            if (booking.status === "cancelled")
                day.cancelled_count++;
            const dayPayments = ((_a = booking.payments) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === "completed")) || [];
            day.revenue += dayPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            if (booking.customer_id)
                day.unique_customers.add(booking.customer_id);
        });
        const dailyRevenue = Array.from(dailyMap.values()).map((day) => (Object.assign(Object.assign({}, day), { unique_customers: day.unique_customers.size }))).sort((a, b) => a.booking_date.localeCompare(b.booking_date));
        // Calculate performance metrics
        const totalBookings = (allBookings === null || allBookings === void 0 ? void 0 : allBookings.length) || 0;
        const completedBookings = (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => b.status === "completed").length) || 0;
        const cancelledBookings = (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => b.status === "cancelled").length) || 0;
        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
        const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
        const bookingsLast7Days = (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => new Date(b.created_at) >= sevenDaysAgo).length) || 0;
        const bookingsLast30Days = (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => new Date(b.created_at) >= thirtyDaysAgo).length) || 0;
        const avgRating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
            : 0;
        const performance = {
            shop_id: shopId,
            total_bookings: totalBookings,
            completed_bookings: completedBookings,
            cancelled_bookings: cancelledBookings,
            completion_rate: Math.round(completionRate * 100) / 100,
            cancellation_rate: Math.round(cancellationRate * 100) / 100,
            total_revenue: totalRevenue,
            average_booking_value: completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0,
            unique_customers: uniqueCustomers,
            new_customers_30_days: newCustomers30Days,
            total_reviews: (reviews === null || reviews === void 0 ? void 0 : reviews.length) || 0,
            average_rating: avgRating,
            bookings_last_7_days: bookingsLast7Days,
            bookings_last_30_days: bookingsLast30Days,
            revenue_last_7_days: revenueLast7Days,
            revenue_last_30_days: revenueLast30Days,
        };
        // Calculate customer analytics
        const reportCustomerMap = new Map();
        allBookings === null || allBookings === void 0 ? void 0 : allBookings.forEach((booking) => {
            var _a;
            const customerId = booking.customer_id;
            if (!customerId)
                return;
            if (!reportCustomerMap.has(customerId)) {
                reportCustomerMap.set(customerId, {
                    customer_id: customerId,
                    total_bookings: 0,
                    completed_bookings: 0,
                    cancelled_bookings: 0,
                    total_spent: 0,
                    first_booking: booking.created_at,
                    last_booking: booking.created_at,
                });
            }
            const customer = reportCustomerMap.get(customerId);
            customer.total_bookings++;
            if (booking.status === "completed")
                customer.completed_bookings++;
            if (booking.status === "cancelled")
                customer.cancelled_bookings++;
            const customerPayments = ((_a = booking.payments) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === "completed")) || [];
            customer.total_spent += customerPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            if (new Date(booking.created_at) < new Date(customer.first_booking)) {
                customer.first_booking = booking.created_at;
            }
            if (new Date(booking.created_at) > new Date(customer.last_booking)) {
                customer.last_booking = booking.created_at;
            }
        });
        const customers = Array.from(reportCustomerMap.values());
        const totalCustomers = customers.length;
        const avgBookingsPerCustomer = totalCustomers > 0
            ? customers.reduce((sum, c) => sum + c.total_bookings, 0) / totalCustomers
            : 0;
        const avgSpentPerCustomer = totalCustomers > 0
            ? customers.reduce((sum, c) => sum + c.total_spent, 0) / totalCustomers
            : 0;
        // Calculate booking analytics
        const bookingsInPeriod = (allBookings === null || allBookings === void 0 ? void 0 : allBookings.filter((b) => new Date(b.created_at) >= startDate)) || [];
        const groupedMap = new Map();
        bookingsInPeriod.forEach((booking) => {
            var _a;
            const date = new Date(booking.created_at);
            let key;
            if (groupBy === "day") {
                key = date.toISOString().split("T")[0];
            }
            else if (groupBy === "week") {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split("T")[0];
            }
            else if (groupBy === "month") {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            }
            else {
                key = date.toISOString().split("T")[0];
            }
            if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                    period: key,
                    total: 0,
                    pending: 0,
                    confirmed: 0,
                    completed: 0,
                    cancelled: 0,
                    revenue: 0,
                });
            }
            const group = groupedMap.get(key);
            group.total++;
            group[booking.status] = (group[booking.status] || 0) + 1;
            const periodPayments = ((_a = booking.payments) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === "completed")) || [];
            group.revenue += periodPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        });
        const grouped = Array.from(groupedMap.values()).sort((a, b) => a.period.localeCompare(b.period));
        const totals = {
            total: bookingsInPeriod.length,
            pending: bookingsInPeriod.filter((b) => b.status === "pending").length,
            confirmed: bookingsInPeriod.filter((b) => b.status === "confirmed").length,
            completed: bookingsInPeriod.filter((b) => b.status === "completed").length,
            cancelled: bookingsInPeriod.filter((b) => b.status === "cancelled").length,
            revenue: bookingsInPeriod.reduce((sum, b) => {
                var _a;
                const periodPayments = ((_a = b.payments) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === "completed")) || [];
                return sum + periodPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
            }, 0),
        };
        // Customer data already calculated above using reportCustomerMap
        res.json({
            shop: {
                id: shop.id,
                name: shop.name,
            },
            period: {
                days: periodDays,
                start_date: startDate.toISOString(),
                end_date: new Date().toISOString(),
            },
            generated_at: new Date().toISOString(),
            revenue: {
                summary: revenueData,
                daily: dailyRevenue || [],
            },
            performance,
            bookings: {
                grouped,
                totals,
                period_days: periodDays,
                group_by: groupBy,
            },
            customers: {
                customers,
                summary: {
                    total_customers: totalCustomers,
                    new_customers_30_days: customers.filter((c) => {
                        const firstBooking = new Date(c.first_booking);
                        return firstBooking >= thirtyDaysAgo;
                    }).length,
                    average_bookings_per_customer: Math.round(avgBookingsPerCustomer * 100) / 100,
                    average_spent_per_customer: Math.round(avgSpentPerCustomer * 100) / 100,
                    total_revenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
                },
            },
        });
    }
    catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}));
console.log("[Analytics Router] Routes registered: /revenue, /customers, /performance, /bookings, /report");
exports.default = router;

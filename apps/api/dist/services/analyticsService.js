"use strict";
// apps/api/src/services/analyticsService.ts
// Analytics service for shop owners
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
exports.getShopOverview = getShopOverview;
exports.getBookingTrends = getBookingTrends;
exports.getServicePopularity = getServicePopularity;
exports.getStaffPerformance = getStaffPerformance;
exports.getCustomerAnalytics = getCustomerAnalytics;
exports.getPeakHours = getPeakHours;
exports.getCancellationRate = getCancellationRate;
const supabase_1 = require("../lib/supabase");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
/**
 * Get shop overview statistics
 */
function getShopOverview(shopId, startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: bookings, error } = yield dbClient
                .from('bookings')
                .select('status, start_time, services(price)')
                .eq('shop_id', shopId)
                .gte('start_time', startDate)
                .lte('start_time', endDate);
            if (error) {
                throw error;
            }
            const totalBookings = (bookings === null || bookings === void 0 ? void 0 : bookings.length) || 0;
            const confirmedBookings = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === 'confirmed').length) || 0;
            const cancelledBookings = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === 'cancelled').length) || 0;
            const completedBookings = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === 'completed').length) || 0;
            const pendingBookings = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === 'pending').length) || 0;
            const daysDiff = (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                (1000 * 60 * 60 * 24);
            const days = Math.max(1, daysDiff);
            const averageBookingsPerDay = totalBookings / days;
            const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
            // Calculate revenue (sum of service prices for completed bookings)
            const totalRevenue = (bookings === null || bookings === void 0 ? void 0 : bookings.filter((b) => b.status === 'completed' || b.status === 'confirmed').reduce((sum, b) => {
                var _a;
                const price = ((_a = b.services) === null || _a === void 0 ? void 0 : _a.price) || 0;
                return sum + price;
            }, 0)) || 0;
            const averageRevenuePerDay = totalRevenue / days;
            return {
                totalBookings,
                confirmedBookings,
                cancelledBookings,
                completedBookings,
                pendingBookings,
                averageBookingsPerDay: Math.round(averageBookingsPerDay * 100) / 100,
                cancellationRate: Math.round(cancellationRate * 100) / 100,
                totalRevenue,
                averageRevenuePerDay: Math.round(averageRevenuePerDay * 100) / 100,
            };
        }
        catch (error) {
            console.error('Error getting shop overview:', error);
            throw error;
        }
    });
}
/**
 * Get booking trends over time
 */
function getBookingTrends(shopId_1, startDate_1, endDate_1) {
    return __awaiter(this, arguments, void 0, function* (shopId, startDate, endDate, groupBy = 'day') {
        try {
            const { data: bookings, error } = yield dbClient
                .from('bookings')
                .select('status, start_time')
                .eq('shop_id', shopId)
                .gte('start_time', startDate)
                .lte('start_time', endDate)
                .order('start_time', { ascending: true });
            if (error) {
                throw error;
            }
            // Group bookings by date
            const grouped = {};
            bookings === null || bookings === void 0 ? void 0 : bookings.forEach((booking) => {
                const date = new Date(booking.start_time);
                let key;
                if (groupBy === 'day') {
                    key = date.toISOString().split('T')[0]; // YYYY-MM-DD
                }
                else if (groupBy === 'week') {
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                }
                else {
                    // month
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                }
                if (!grouped[key]) {
                    grouped[key] = {
                        date: key,
                        count: 0,
                        confirmed: 0,
                        cancelled: 0,
                        completed: 0,
                    };
                }
                grouped[key].count++;
                if (booking.status === 'confirmed')
                    grouped[key].confirmed++;
                if (booking.status === 'cancelled')
                    grouped[key].cancelled++;
                if (booking.status === 'completed')
                    grouped[key].completed++;
            });
            return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
        }
        catch (error) {
            console.error('Error getting booking trends:', error);
            throw error;
        }
    });
}
/**
 * Get service popularity
 */
function getServicePopularity(shopId, startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: bookings, error } = yield dbClient
                .from('bookings')
                .select('service_id, services(id, name, price), status')
                .eq('shop_id', shopId)
                .gte('start_time', startDate)
                .lte('start_time', endDate);
            if (error) {
                throw error;
            }
            const serviceMap = {};
            bookings === null || bookings === void 0 ? void 0 : bookings.forEach((booking) => {
                const service = booking.services;
                if (!service || !service.id)
                    return;
                const serviceId = service.id;
                if (!serviceMap[serviceId]) {
                    serviceMap[serviceId] = {
                        serviceId,
                        serviceName: service.name || 'Unknown',
                        bookingCount: 0,
                        revenue: 0,
                    };
                }
                serviceMap[serviceId].bookingCount++;
                if (booking.status === 'completed' ||
                    booking.status === 'confirmed') {
                    serviceMap[serviceId].revenue += service.price || 0;
                }
            });
            return Object.values(serviceMap).sort((a, b) => b.bookingCount - a.bookingCount);
        }
        catch (error) {
            console.error('Error getting service popularity:', error);
            throw error;
        }
    });
}
/**
 * Get staff performance
 */
function getStaffPerformance(shopId, startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: bookings, error } = yield dbClient
                .from('bookings')
                .select('staff_id, staff(first_name, last_name)')
                .eq('shop_id', shopId)
                .gte('start_time', startDate)
                .lte('start_time', endDate)
                .not('staff_id', 'is', null);
            if (error) {
                throw error;
            }
            const staffMap = {};
            bookings === null || bookings === void 0 ? void 0 : bookings.forEach((booking) => {
                const staff = booking.staff;
                if (!staff || !booking.staff_id)
                    return;
                const staffId = booking.staff_id;
                if (!staffMap[staffId]) {
                    staffMap[staffId] = {
                        staffId,
                        staffName: `${staff.first_name || ''} ${staff.last_name || ''}`.trim(),
                        bookingCount: 0,
                    };
                }
                staffMap[staffId].bookingCount++;
            });
            return Object.values(staffMap).sort((a, b) => b.bookingCount - a.bookingCount);
        }
        catch (error) {
            console.error('Error getting staff performance:', error);
            throw error;
        }
    });
}
/**
 * Get customer analytics
 */
function getCustomerAnalytics(shopId, startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: bookings, error } = yield dbClient
                .from('bookings')
                .select('customer_id, customer_name, start_time')
                .eq('shop_id', shopId)
                .gte('start_time', startDate)
                .lte('start_time', endDate);
            if (error) {
                throw error;
            }
            // Get all bookings for this shop (to determine returning customers)
            const { data: allBookings } = yield dbClient
                .from('bookings')
                .select('customer_id, start_time')
                .eq('shop_id', shopId)
                .lt('start_time', startDate);
            const customerFirstBooking = {};
            allBookings === null || allBookings === void 0 ? void 0 : allBookings.forEach((b) => {
                if (b.customer_id && !customerFirstBooking[b.customer_id]) {
                    customerFirstBooking[b.customer_id] = b.start_time;
                }
            });
            const customerCounts = {};
            let newCustomers = 0;
            let returningCustomers = 0;
            bookings === null || bookings === void 0 ? void 0 : bookings.forEach((booking) => {
                if (booking.customer_id) {
                    if (!customerCounts[booking.customer_id]) {
                        customerCounts[booking.customer_id] = 0;
                        // Check if this is their first booking
                        if (!customerFirstBooking[booking.customer_id] ||
                            booking.start_time < customerFirstBooking[booking.customer_id]) {
                            newCustomers++;
                        }
                        else {
                            returningCustomers++;
                        }
                    }
                    customerCounts[booking.customer_id]++;
                }
            });
            const topCustomers = Object.entries(customerCounts)
                .map(([customerId, count]) => {
                const booking = bookings === null || bookings === void 0 ? void 0 : bookings.find((b) => b.customer_id === customerId);
                return {
                    customerId,
                    customerName: (booking === null || booking === void 0 ? void 0 : booking.customer_name) || 'Unknown',
                    bookingCount: count,
                };
            })
                .sort((a, b) => b.bookingCount - a.bookingCount)
                .slice(0, 10);
            return {
                newCustomers,
                returningCustomers,
                topCustomers,
            };
        }
        catch (error) {
            console.error('Error getting customer analytics:', error);
            throw error;
        }
    });
}
/**
 * Get peak booking hours
 */
function getPeakHours(shopId, startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: bookings, error } = yield dbClient
                .from('bookings')
                .select('start_time')
                .eq('shop_id', shopId)
                .gte('start_time', startDate)
                .lte('start_time', endDate);
            if (error) {
                throw error;
            }
            const hourCounts = {};
            bookings === null || bookings === void 0 ? void 0 : bookings.forEach((booking) => {
                const date = new Date(booking.start_time);
                const hour = date.getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });
            return Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                bookingCount: hourCounts[i] || 0,
            }));
        }
        catch (error) {
            console.error('Error getting peak hours:', error);
            throw error;
        }
    });
}
/**
 * Get cancellation rate
 */
function getCancellationRate(shopId, startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const overview = yield getShopOverview(shopId, startDate, endDate);
            return overview.cancellationRate;
        }
        catch (error) {
            console.error('Error getting cancellation rate:', error);
            throw error;
        }
    });
}

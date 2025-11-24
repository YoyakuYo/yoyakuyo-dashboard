"use strict";
// apps/api/src/routes/analytics.ts
// Analytics API routes for shop owners
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
const analyticsService_1 = require("../services/analyticsService");
const router = (0, express_1.Router)();
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// Middleware to verify shop ownership
function verifyShopOwnership(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.headers['x-user-id'];
            const shopId = req.params.shopId || req.query.shop_id;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            if (!shopId) {
                return res.status(400).json({ error: 'shop_id is required' });
            }
            // Verify user owns the shop
            const { data: shop, error } = yield dbClient
                .from('shops')
                .select('id, owner_user_id')
                .eq('id', shopId)
                .single();
            if (error || !shop) {
                return res.status(404).json({ error: 'Shop not found' });
            }
            if (shop.owner_user_id !== userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            next();
        }
        catch (error) {
            console.error('Error verifying shop ownership:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
}
// GET /analytics/shop/:shopId/overview
router.get('/shop/:shopId/overview', verifyShopOwnership, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const startDate = req.query.start_date ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = req.query.end_date || new Date().toISOString();
        const overview = yield (0, analyticsService_1.getShopOverview)(shopId, startDate, endDate);
        return res.status(200).json(overview);
    }
    catch (error) {
        console.error('Error in GET /analytics/shop/:shopId/overview:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /analytics/shop/:shopId/bookings
router.get('/shop/:shopId/bookings', verifyShopOwnership, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const startDate = req.query.start_date ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = req.query.end_date || new Date().toISOString();
        const groupBy = req.query.group_by || 'day';
        const trends = yield (0, analyticsService_1.getBookingTrends)(shopId, startDate, endDate, groupBy);
        return res.status(200).json(trends);
    }
    catch (error) {
        console.error('Error in GET /analytics/shop/:shopId/bookings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /analytics/shop/:shopId/services
router.get('/shop/:shopId/services', verifyShopOwnership, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const startDate = req.query.start_date ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = req.query.end_date || new Date().toISOString();
        const services = yield (0, analyticsService_1.getServicePopularity)(shopId, startDate, endDate);
        return res.status(200).json(services);
    }
    catch (error) {
        console.error('Error in GET /analytics/shop/:shopId/services:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /analytics/shop/:shopId/staff
router.get('/shop/:shopId/staff', verifyShopOwnership, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const startDate = req.query.start_date ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = req.query.end_date || new Date().toISOString();
        const staff = yield (0, analyticsService_1.getStaffPerformance)(shopId, startDate, endDate);
        return res.status(200).json(staff);
    }
    catch (error) {
        console.error('Error in GET /analytics/shop/:shopId/staff:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /analytics/shop/:shopId/customers
router.get('/shop/:shopId/customers', verifyShopOwnership, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const startDate = req.query.start_date ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = req.query.end_date || new Date().toISOString();
        const customers = yield (0, analyticsService_1.getCustomerAnalytics)(shopId, startDate, endDate);
        return res.status(200).json(customers);
    }
    catch (error) {
        console.error('Error in GET /analytics/shop/:shopId/customers:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /analytics/shop/:shopId/peak-hours
router.get('/shop/:shopId/peak-hours', verifyShopOwnership, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const startDate = req.query.start_date ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = req.query.end_date || new Date().toISOString();
        const peakHours = yield (0, analyticsService_1.getPeakHours)(shopId, startDate, endDate);
        return res.status(200).json(peakHours);
    }
    catch (error) {
        console.error('Error in GET /analytics/shop/:shopId/peak-hours:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /analytics/shop/:shopId/cancellation-rate
router.get('/shop/:shopId/cancellation-rate', verifyShopOwnership, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const startDate = req.query.start_date ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = req.query.end_date || new Date().toISOString();
        const rate = yield (0, analyticsService_1.getCancellationRate)(shopId, startDate, endDate);
        return res.status(200).json({ cancellationRate: rate });
    }
    catch (error) {
        console.error('Error in GET /analytics/shop/:shopId/cancellation-rate:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;

"use strict";
// apps/api/src/routes/owner.ts
// Owner routes for standalone API
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
// GET /owner/bookings - Get all bookings for owner's shops
router.get('/bookings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!supabase_1.supabaseAdmin) {
            return res.status(500).json({ error: 'Database configuration error' });
        }
        const userId = req.headers['x-user-id'];
        console.log('[Owner Bookings] Request for userId:', userId);
        if (!userId) {
            console.log('[Owner Bookings] No userId in headers');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Get all shops owned by this user
        const { data: shops, error: shopsError } = yield supabase_1.supabaseAdmin
            .from('shops')
            .select('id, name')
            .eq('owner_user_id', userId);
        console.log('[Owner Bookings] Shops query result:', { shops, shopsError });
        if (shopsError) {
            console.error('Error fetching shops for owner:', shopsError);
            return res.status(500).json({ error: 'Failed to fetch shops' });
        }
        if (!shops || shops.length === 0) {
            console.log('[Owner Bookings] No shops found for user');
            return res.json([]);
        }
        const shopIds = shops.map(shop => shop.id);
        console.log('[Owner Bookings] Shop IDs to query:', shopIds);
        // Get all bookings for these shops with service information
        const { data: bookings, error: bookingsError } = yield supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        id,
        shop_id,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        start_time,
        end_time,
        status,
        created_at,
        notes,
        services(name)
      `)
            .in('shop_id', shopIds)
            .order('created_at', { ascending: false });
        console.log('[Owner Bookings] Bookings query result:', { count: bookings === null || bookings === void 0 ? void 0 : bookings.length, bookingsError });
        if (bookingsError) {
            console.error('Error fetching bookings for owner:', bookingsError);
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }
        // Add shop name to each booking
        const bookingsWithShopNames = (bookings === null || bookings === void 0 ? void 0 : bookings.map(booking => {
            const shop = shops.find(s => s.id === booking.shop_id);
            return Object.assign(Object.assign({}, booking), { shop_name: (shop === null || shop === void 0 ? void 0 : shop.name) || 'Unknown Shop' });
        })) || [];
        console.log('[Owner Bookings] Final response:', bookingsWithShopNames.length, 'bookings');
        res.json(bookingsWithShopNames);
    }
    catch (error) {
        console.error('Error in owner bookings:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
exports.default = router;

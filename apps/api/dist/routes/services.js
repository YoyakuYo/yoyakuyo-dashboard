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
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get user_id from header (x-user-id) for filtering
        const userId = req.headers['x-user-id'];
        let query = supabase_1.supabase.from('services').select('*');
        // If user_id provided, filter by shops owned by user
        if (userId) {
            // First get shop IDs owned by this user
            const { data: userShops, error: shopsError } = yield supabase_1.supabase
                .from('shops')
                .select('id')
                .eq('owner_user_id', userId);
            if (shopsError) {
                console.error('Error fetching user shops:', shopsError);
                return res.status(200).json([]);
            }
            if (!userShops || userShops.length === 0) {
                // User owns no shops, return empty array
                return res.status(200).json([]);
            }
            const shopIds = userShops.map(shop => shop.id);
            query = query.in('shop_id', shopIds);
        }
        const { data: services, error } = yield query;
        if (error) {
            console.error('Error fetching services:', error);
            // Return empty array to prevent frontend .map() errors
            return res.status(200).json([]);
        }
        // Ensure we always return an array
        return res.json(Array.isArray(services) ? services : []);
    }
    catch (error) {
        console.error('Error during fetching services:', error);
        // Return empty array to prevent frontend crashes
        return res.status(200).json([]);
    }
}));
// POST /services
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { shop_id, name, description, price, duration } = req.body;
        const userId = req.headers['x-user-id'];
        // Verify user owns the shop
        if (userId && shop_id) {
            const { data: shop, error: shopError } = yield supabase_1.supabase
                .from('shops')
                .select('owner_user_id')
                .eq('id', shop_id)
                .single();
            if (shopError || !shop) {
                return res.status(404).json({ error: 'Shop not found' });
            }
            if (shop.owner_user_id !== userId) {
                return res.status(403).json({ error: 'You do not own this shop' });
            }
        }
        const { data: newService, error } = yield supabase_1.supabase
            .from('services')
            .insert([
            {
                shop_id,
                name,
                description,
                price,
                duration,
            }
        ])
            .select('*');
        if (error) {
            console.error('Error creating service:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(201).json((_a = newService === null || newService === void 0 ? void 0 : newService[0]) !== null && _a !== void 0 ? _a : { message: 'Service created' });
    }
    catch (error) {
        console.error('Error during service creation:', error);
        return res.status(500).json({ error: error.message });
    }
}));
// GET /services/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { data: service, error: serviceError } = yield supabase_1.supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .single();
        if (serviceError) {
            console.error('Error fetching service:', serviceError);
            return res.status(404).json({ error: serviceError.message });
        }
        return res.json(service);
    }
    catch (error) {
        console.error('Error during service retrieval:', error);
        return res.status(500).json({ error: error.message });
    }
}));
// PUT /services/:id - Update a service
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serviceId = req.params.id;
        const { name, description, price, duration_minutes, duration, shop_id } = req.body;
        const userId = req.headers['x-user-id'];
        // First, get the existing service to check ownership
        const { data: existingService, error: fetchError } = yield supabase_1.supabase
            .from('services')
            .select('shop_id')
            .eq('id', serviceId)
            .single();
        if (fetchError || !existingService) {
            return res.status(404).json({ error: 'Service not found' });
        }
        // Verify user owns the shop that this service belongs to
        if (userId) {
            const { data: shop, error: shopError } = yield supabase_1.supabase
                .from('shops')
                .select('owner_user_id')
                .eq('id', existingService.shop_id)
                .single();
            if (shopError || !shop) {
                return res.status(404).json({ error: 'Shop not found' });
            }
            if (shop.owner_user_id !== userId) {
                return res.status(403).json({ error: 'You do not own this shop' });
            }
            // If shop_id is being changed, verify user owns the new shop too
            if (shop_id && shop_id !== existingService.shop_id) {
                const { data: newShop, error: newShopError } = yield supabase_1.supabase
                    .from('shops')
                    .select('owner_user_id')
                    .eq('id', shop_id)
                    .single();
                if (newShopError || !newShop) {
                    return res.status(404).json({ error: 'New shop not found' });
                }
                if (newShop.owner_user_id !== userId) {
                    return res.status(403).json({ error: 'You do not own the new shop' });
                }
            }
        }
        // Build update object (only include fields that are provided)
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (price !== undefined)
            updateData.price = price;
        // Handle duration: accept either duration_minutes or duration from request body
        // Frontend sends duration_minutes, but we also check for duration as fallback
        const durationValue = duration_minutes !== undefined ? duration_minutes : (duration !== undefined ? duration : undefined);
        console.log('[PUT /services/:id] Received duration values:', { duration_minutes, duration, durationValue });
        if (durationValue !== undefined && durationValue !== null && durationValue !== '') {
            // Convert to number, handling both string and number inputs
            const numDuration = typeof durationValue === 'string' ? parseFloat(durationValue) : Number(durationValue);
            console.log('[PUT /services/:id] Converted duration:', numDuration, 'isNaN?', isNaN(numDuration));
            // Update if we have a valid number (including 0)
            if (!isNaN(numDuration) && numDuration >= 0) {
                updateData.duration_minutes = numDuration;
                console.log('[PUT /services/:id] Setting duration_minutes to:', numDuration);
            }
            else {
                console.warn('[PUT /services/:id] Invalid duration value, skipping update:', numDuration);
            }
        }
        else {
            console.log('[PUT /services/:id] No duration value provided, skipping update');
        }
        if (shop_id !== undefined)
            updateData.shop_id = shop_id;
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        console.log('[PUT /services/:id] Final updateData being sent to database:', JSON.stringify(updateData, null, 2));
        const { data, error } = yield supabase_1.supabase
            .from('services')
            .update(updateData)
            .eq('id', serviceId)
            .select()
            .single();
        if (error) {
            console.error('[PUT /services/:id] Database error:', error);
        }
        else {
            console.log('[PUT /services/:id] Update successful. Returned data:', JSON.stringify(data, null, 2));
        }
        if (error) {
            console.error('Error updating service:', error);
            return res.status(400).json({ error: error.message });
        }
        return res.json(data);
    }
    catch (err) {
        console.error('Server error updating service:', err);
        return res.status(500).json({ error: 'Server error updating service' });
    }
}));
// DELETE /services/:id
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serviceId = req.params.id;
        const userId = req.headers['x-user-id'];
        // First, get the existing service to check ownership
        const { data: existingService, error: fetchError } = yield supabase_1.supabase
            .from('services')
            .select('shop_id')
            .eq('id', serviceId)
            .single();
        if (fetchError || !existingService) {
            return res.status(404).json({ error: 'Service not found' });
        }
        // Verify user owns the shop that this service belongs to
        if (userId) {
            const { data: shop, error: shopError } = yield supabase_1.supabase
                .from('shops')
                .select('owner_user_id')
                .eq('id', existingService.shop_id)
                .single();
            if (shopError || !shop) {
                return res.status(404).json({ error: 'Shop not found' });
            }
            if (shop.owner_user_id !== userId) {
                return res.status(403).json({ error: 'You do not own this shop' });
            }
        }
        const { error } = yield supabase_1.supabase
            .from('services')
            .delete()
            .eq('id', serviceId);
        if (error) {
            console.error('Error deleting service:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ message: 'Service deleted successfully' });
    }
    catch (err) {
        console.error('Server error deleting service:', err);
        return res.status(500).json({ error: 'Server error deleting service' });
    }
}));
exports.default = router;

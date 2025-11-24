"use strict";
// apps/api/src/routes/customers.ts
// Customer routes for magic code lookup and customer ID management
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
const customerIdService_1 = require("../services/customerIdService");
const router = (0, express_1.Router)();
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// GET /customers/magic/:magicCode - Find customer by magic code
router.get('/magic/:magicCode', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { magicCode } = req.params;
        if (!magicCode) {
            return res.status(400).json({ error: 'Magic code is required' });
        }
        const customer = yield (0, customerIdService_1.findCustomerByMagicCode)(magicCode);
        if (!customer.customerId) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        // Find or create thread for this customer
        // Get the first shop thread for this customer
        const { data: thread } = yield dbClient
            .from('shop_threads')
            .select('id, shop_id')
            .eq('customer_id', customer.customerId) // Use customer_id instead of email
            .limit(1)
            .single();
        return res.json(Object.assign(Object.assign({}, customer), { threadId: (thread === null || thread === void 0 ? void 0 : thread.id) || null, shopId: (thread === null || thread === void 0 ? void 0 : thread.shop_id) || null }));
    }
    catch (error) {
        console.error('Error finding customer by magic code:', error);
        return res.status(500).json({ error: error.message });
    }
}));
// POST /customers/:id/ensure-id - Ensure customer has ID and magic code
router.post('/:id/ensure-id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }
        const result = yield (0, customerIdService_1.ensureCustomerId)(id, name);
        return res.json(result);
    }
    catch (error) {
        console.error('Error ensuring customer ID:', error);
        return res.status(500).json({ error: error.message });
    }
}));
// POST /customers/:id/push-subscription - Save customer push subscription (safe - optional feature)
router.post('/:id/push-subscription', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { subscription, userAgent } = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Invalid subscription data' });
        }
        // Safe: Import dynamically to avoid breaking if web-push isn't set up
        const { saveCustomerPushSubscription } = require('../services/webPushService');
        const success = yield saveCustomerPushSubscription(id, subscription, userAgent);
        if (success) {
            return res.json({ success: true });
        }
        else {
            // Safe: Return success even if subscription save failed (non-critical feature)
            return res.json({
                success: false,
                message: 'Push notifications not configured. Subscription saved but notifications disabled.'
            });
        }
    }
    catch (error) {
        // Safe: Don't break the API if push subscriptions fail
        console.error('Error saving push subscription:', error);
        return res.status(500).json({
            error: 'Failed to save subscription',
            message: error.message
        });
    }
}));
exports.default = router;

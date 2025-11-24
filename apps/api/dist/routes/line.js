"use strict";
// apps/api/src/routes/line.ts
// LINE integration API routes
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
const lineService_1 = require("../services/lineService");
const router = (0, express_1.Router)();
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// GET /line/auth-url - Get LINE OAuth URL (customer login)
router.get('/auth-url', (req, res) => {
    try {
        const state = req.query.state;
        const authUrl = (0, lineService_1.getLineAuthUrl)(state);
        if (!authUrl) {
            return res.status(503).json({
                error: 'LINE integration not configured',
                message: 'LINE API keys are missing',
            });
        }
        return res.status(200).json({ authUrl, state });
    }
    catch (error) {
        console.error('Error in GET /line/auth-url:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /line/shop-auth-url - Get LINE OAuth URL for shop owners
router.get('/shop-auth-url', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        const shopId = req.query.shopId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!shopId) {
            return res.status(400).json({ error: 'shopId is required' });
        }
        // Verify shop ownership
        const { data: shop, error: shopError } = yield dbClient
            .from('shops')
            .select('id, owner_user_id')
            .eq('id', shopId)
            .single();
        if (shopError || !shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const state = `${shopId}_${Date.now()}`;
        const authUrl = (0, lineService_1.getShopOwnerLineAuthUrl)(shopId, state);
        if (!authUrl) {
            return res.status(503).json({
                error: 'LINE Messaging API not configured',
                message: 'LINE_MESSAGING_CHANNEL_ID is missing',
            });
        }
        return res.status(200).json({ authUrl, state, shopId });
    }
    catch (error) {
        console.error('Error in GET /line/shop-auth-url:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /line/callback - Handle LINE OAuth callback (customer login)
router.get('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const code = req.query.code;
        const state = req.query.state;
        const error = req.query.error;
        if (error) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/?line_error=${error}`);
        }
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/?line_error=no_code`);
        }
        const lineUser = yield (0, lineService_1.handleLineCallback)(code);
        // Find or create customer
        // For now, redirect to frontend with LINE user info
        // Frontend will handle customer creation/linking
        const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/line/callback`);
        redirectUrl.searchParams.set('line_user_id', lineUser.lineUserId);
        redirectUrl.searchParams.set('display_name', lineUser.displayName || '');
        redirectUrl.searchParams.set('picture_url', lineUser.pictureUrl || '');
        if (lineUser.email) {
            redirectUrl.searchParams.set('email', lineUser.email);
        }
        return res.redirect(redirectUrl.toString());
    }
    catch (error) {
        console.error('Error in GET /line/callback:', error);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/?line_error=callback_failed`);
    }
}));
// GET /line/shop-callback - Handle LINE OAuth callback for shop owners
router.get('/shop-callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const code = req.query.code;
        const state = req.query.state;
        const error = req.query.error;
        if (error) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/shops?line_error=${error}`);
        }
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/shops?line_error=no_code`);
        }
        // Extract shopId from state (format: shopId_timestamp)
        const shopId = state ? state.split('_')[0] : null;
        if (!shopId) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/shops?line_error=invalid_state`);
        }
        // Handle OAuth callback
        const { accessToken, destinationId, channelId } = yield (0, lineService_1.handleShopOwnerLineCallback)(code, shopId);
        // Generate LINE URL from destination ID (use channel ID as destination ID for now)
        // Note: Actual destination ID should come from LINE Developers Console webhook configuration
        const actualDestinationId = destinationId || channelId || '';
        if (!actualDestinationId) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/shops?line_error=no_destination_id`);
        }
        const deeplinkUrl = `https://line.me/R/ti/p/${actualDestinationId}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(deeplinkUrl)}`;
        // Update shop with LINE destination ID, QR code, and access token
        const { error: updateError } = yield dbClient
            .from('shops')
            .update({
            line_destination_id: actualDestinationId,
            line_qr_code_url: qrCodeUrl,
            line_channel_access_token: accessToken,
        })
            .eq('id', shopId);
        if (updateError) {
            console.error('Error updating shop LINE credentials:', updateError);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/shops?line_error=update_failed`);
        }
        // Ensure QR code is saved - double-check
        const { data: updatedShop } = yield dbClient
            .from('shops')
            .select('line_qr_code_url')
            .eq('id', shopId)
            .single();
        if (!(updatedShop === null || updatedShop === void 0 ? void 0 : updatedShop.line_qr_code_url)) {
            console.warn(`[LINE Callback] QR code not saved for shop ${shopId}, retrying...`);
            yield dbClient
                .from('shops')
                .update({ line_qr_code_url: qrCodeUrl })
                .eq('id', shopId);
        }
        // Also update line_shop_settings if it exists
        const { data: existingSettings } = yield dbClient
            .from('line_shop_settings')
            .select('id')
            .eq('shop_id', shopId)
            .limit(1);
        if (existingSettings && existingSettings.length > 0) {
            yield dbClient
                .from('line_shop_settings')
                .update({
                line_destination_id: actualDestinationId,
                line_access_token: accessToken,
            })
                .eq('shop_id', shopId);
        }
        else {
            yield dbClient
                .from('line_shop_settings')
                .insert([{
                    shop_id: shopId,
                    line_destination_id: actualDestinationId,
                    line_access_token: accessToken,
                }]);
        }
        // Redirect to shop page with success message
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/shops?line_connected=success`);
    }
    catch (error) {
        console.error('Error in GET /line/shop-callback:', error);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/shops?line_error=callback_failed`);
    }
}));
// POST /line/send-message - Send message to LINE user (internal use)
router.post('/send-message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, message, shopId } = req.body;
        if (!userId || !message) {
            return res.status(400).json({ error: 'userId and message are required' });
        }
        if (!(0, lineService_1.isLineConfigured)()) {
            return res.status(503).json({ error: 'LINE not configured' });
        }
        const success = yield (0, lineService_1.sendLineMessage)(userId, message, shopId);
        if (!success) {
            return res.status(500).json({ error: 'Failed to send message' });
        }
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error in POST /line/send-message:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /line/connect-shop - Connect shop's LINE Official Account
router.post('/connect-shop', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        const { shopId, lineDestinationId, lineOfficialAccountId, lineChannelAccessToken } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!shopId || !lineDestinationId) {
            return res.status(400).json({
                error: 'shopId and lineDestinationId are required',
            });
        }
        // Verify shop ownership
        const { data: shop, error: shopError } = yield dbClient
            .from('shops')
            .select('id, owner_user_id')
            .eq('id', shopId)
            .single();
        if (shopError || !shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        // Generate LINE URL from destination ID
        const deeplinkUrl = `https://line.me/R/ti/p/${lineDestinationId}`;
        // Generate QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(deeplinkUrl)}`;
        // Update shop with LINE destination ID and QR code
        const updateData = {
            line_destination_id: lineDestinationId,
            line_qr_code_url: qrCodeUrl,
        };
        // Optionally update other LINE fields if provided
        if (lineOfficialAccountId) {
            updateData.line_official_account_id = lineOfficialAccountId;
        }
        if (lineChannelAccessToken) {
            updateData.line_channel_access_token = lineChannelAccessToken;
        }
        const { error: updateError } = yield dbClient
            .from('shops')
            .update(updateData)
            .eq('id', shopId);
        if (updateError) {
            console.error('Error updating shop LINE credentials:', updateError);
            return res.status(500).json({ error: 'Failed to connect LINE account' });
        }
        // Also update line_shop_settings if it exists
        if (lineChannelAccessToken) {
            const { data: existingSettings } = yield dbClient
                .from('line_shop_settings')
                .select('id')
                .eq('shop_id', shopId)
                .limit(1);
            if (existingSettings && existingSettings.length > 0) {
                // Update existing
                yield dbClient
                    .from('line_shop_settings')
                    .update({
                    line_destination_id: lineDestinationId,
                    line_access_token: lineChannelAccessToken,
                })
                    .eq('shop_id', shopId);
            }
            else {
                // Create new
                yield dbClient
                    .from('line_shop_settings')
                    .insert([{
                        shop_id: shopId,
                        line_destination_id: lineDestinationId,
                        line_access_token: lineChannelAccessToken,
                    }]);
            }
        }
        return res.status(200).json({
            success: true,
            qrCodeUrl: qrCodeUrl,
            deeplinkUrl: deeplinkUrl,
        });
    }
    catch (error) {
        console.error('Error in POST /line/connect-shop:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /line/share-url - Generate LINE share URL
router.get('/share-url', (req, res) => {
    try {
        const shopId = req.query.shop_id;
        const shopName = req.query.shop_name || 'Shop';
        if (!shopId) {
            return res.status(400).json({ error: 'shop_id is required' });
        }
        const shareUrl = (0, lineService_1.getLineShareUrl)(shopId, shopName);
        return res.status(200).json({ shareUrl });
    }
    catch (error) {
        console.error('Error in GET /line/share-url:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /line/link-customer - Link LINE user to customer
router.post('/link-customer', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId, lineUserId, displayName, pictureUrl } = req.body;
        if (!customerId || !lineUserId) {
            return res.status(400).json({ error: 'customerId and lineUserId are required' });
        }
        // Upsert LINE user mapping
        const { data, error } = yield dbClient
            .from('line_user_mappings')
            .upsert({
            customer_id: customerId,
            line_user_id: lineUserId,
            line_display_name: displayName || null,
            line_picture_url: pictureUrl || null,
        }, {
            onConflict: 'line_user_id',
        })
            .select()
            .single();
        if (error) {
            console.error('Error linking LINE user:', error);
            return res.status(500).json({ error: 'Failed to link LINE user' });
        }
        return res.status(200).json({ success: true, mapping: data });
    }
    catch (error) {
        console.error('Error in POST /line/link-customer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /line/webhook - LINE webhook endpoint (must respond with HTTP 200)
// This route is accessible at both /line/webhook and /api/line/webhook
router.post('/webhook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Always respond with HTTP 200 immediately (LINE requires this)
    // The actual processing happens in server.ts for multi-tenant support
    // This is a fallback handler to ensure 200 response
    try {
        console.log('[LINE Webhook Route] Received:', JSON.stringify(req.body, null, 2));
        res.status(200).send('OK');
    }
    catch (err) {
        console.error('[LINE Webhook Route] Error:', err);
        // Always respond with 200 to prevent LINE from retrying
        res.status(200).send('OK');
    }
}));
exports.default = router;

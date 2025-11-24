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
// QR code generation for LINE deep links
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
const dbClient = supabase_1.supabaseAdmin;
// GET /qr/shop/:shopId/line - Generate or retrieve LINE QR code for a shop
router.get('/shop/:shopId/line', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!dbClient) {
            throw new Error('Database client not initialized');
        }
        const { shopId } = req.params;
        const userId = req.headers['x-user-id'];
        if (!shopId) {
            return res.status(400).json({ error: 'shopId is required' });
        }
        // Verify shop exists and user owns it (if userId provided)
        const { data: shop, error: shopError } = yield dbClient
            .from('shops')
            .select('id, name, line_destination_id, line_qr_code_url')
            .eq('id', shopId)
            .single();
        if (shopError || !shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        // If userId provided, verify ownership
        if (userId) {
            if (!dbClient) {
                throw new Error('Database client not initialized');
            }
            const { data: ownerShop } = yield dbClient
                .from('shops')
                .select('owner_user_id')
                .eq('id', shopId)
                .eq('owner_user_id', userId)
                .single();
            if (!ownerShop) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }
        // Check if LINE destination ID exists
        if (!shop.line_destination_id) {
            return res.status(400).json({
                error: 'LINE destination ID not configured. Please connect LINE account first.'
            });
        }
        // Check if QR already exists
        if (shop.line_qr_code_url) {
            // Return existing QR URL
            return res.json({
                qrImageUrl: shop.line_qr_code_url,
                deeplinkUrl: `https://line.me/R/ti/p/${shop.line_destination_id}`,
            });
        }
        // Generate LINE URL from destination ID
        const deeplinkUrl = `https://line.me/R/ti/p/${shop.line_destination_id}`;
        // Generate QR code using external service
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(deeplinkUrl)}`;
        // Update shop record with QR code URL
        if (!dbClient) {
            throw new Error('Database client not initialized');
        }
        yield dbClient
            .from('shops')
            .update({
            line_qr_code_url: qrCodeUrl,
        })
            .eq('id', shopId);
        return res.json({
            qrImageUrl: qrCodeUrl,
            deeplinkUrl: deeplinkUrl,
        });
    }
    catch (error) {
        console.error('Error generating QR code:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate QR code' });
    }
}));
exports.default = router;

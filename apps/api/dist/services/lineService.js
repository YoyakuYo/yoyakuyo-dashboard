"use strict";
// apps/api/src/services/lineService.ts
// LINE integration service
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
exports.isLineConfigured = isLineConfigured;
exports.getLineAuthUrl = getLineAuthUrl;
exports.getShopOwnerLineAuthUrl = getShopOwnerLineAuthUrl;
exports.handleLineCallback = handleLineCallback;
exports.handleShopOwnerLineCallback = handleShopOwnerLineCallback;
exports.getLineMessagingClient = getLineMessagingClient;
exports.sendLineMessage = sendLineMessage;
exports.sendBookingConfirmation = sendBookingConfirmation;
exports.sendBookingReminder = sendBookingReminder;
exports.sendBookingUpdate = sendBookingUpdate;
exports.getLineShareUrl = getLineShareUrl;
const bot_sdk_1 = require("@line/bot-sdk");
const supabase_1 = require("../lib/supabase");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// LINE configuration (with graceful degradation if keys missing)
const LINE_LOGIN_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID;
const LINE_LOGIN_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
const LINE_MESSAGING_CHANNEL_ID = process.env.LINE_MESSAGING_CHANNEL_ID;
const LINE_MESSAGING_CHANNEL_SECRET = process.env.LINE_MESSAGING_CHANNEL_SECRET;
const LINE_MESSAGING_ACCESS_TOKEN = process.env.LINE_MESSAGING_ACCESS_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
// Helper function to get redirect URI with proper prefix
// Uses /api/line/ prefix when API_URL is set (production/ngrok), /line/ for localhost
const getRedirectUri = (endpoint) => {
    if (process.env.LINE_REDIRECT_URI && endpoint === '/callback') {
        return process.env.LINE_REDIRECT_URI;
    }
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    // If API_URL is set and not localhost, use /api prefix (for ngrok/production)
    if (process.env.API_URL && process.env.API_URL !== 'http://localhost:3000') {
        return `${baseUrl}/api/line${endpoint}`;
    }
    // Localhost: use /line prefix (routes mounted at /line)
    return `${baseUrl}/line${endpoint}`;
};
const LINE_REDIRECT_URI = getRedirectUri('/callback');
// Check if LINE is configured
function isLineConfigured() {
    return !!(LINE_LOGIN_CHANNEL_ID &&
        LINE_LOGIN_CHANNEL_SECRET &&
        LINE_MESSAGING_CHANNEL_ID &&
        LINE_MESSAGING_CHANNEL_SECRET &&
        LINE_MESSAGING_ACCESS_TOKEN);
}
/**
 * Get LINE OAuth URL for login (customer login)
 */
function getLineAuthUrl(state) {
    if (!isLineConfigured()) {
        console.warn('LINE Login not configured - LINE_LOGIN_CHANNEL_ID missing');
        return null;
    }
    const stateParam = state || Math.random().toString(36).substring(7);
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINE_LOGIN_CHANNEL_ID,
        redirect_uri: LINE_REDIRECT_URI,
        state: stateParam,
        scope: 'profile openid email',
    });
    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}
/**
 * Get LINE OAuth URL for shop owners (LINE Messaging API)
 * Requests scopes: openid, profile, message.write, message.read
 */
function getShopOwnerLineAuthUrl(shopId, state) {
    if (!LINE_MESSAGING_CHANNEL_ID || !LINE_MESSAGING_CHANNEL_SECRET) {
        console.warn('LINE Messaging API not configured - LINE_MESSAGING_CHANNEL_ID missing');
        return null;
    }
    const stateParam = state || `${shopId}_${Math.random().toString(36).substring(7)}`;
    const redirectUri = getRedirectUri('/shop-callback');
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINE_MESSAGING_CHANNEL_ID,
        redirect_uri: redirectUri,
        state: stateParam,
        scope: 'openid profile message.write message.read',
    });
    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}
/**
 * Handle LINE OAuth callback and get user info (customer login)
 */
function handleLineCallback(code) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isLineConfigured()) {
            throw new Error('LINE not configured');
        }
        try {
            // Exchange code for access token
            const tokenResponse = yield fetch('https://api.line.me/oauth2/v2.1/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: LINE_REDIRECT_URI,
                    client_id: LINE_LOGIN_CHANNEL_ID,
                    client_secret: LINE_LOGIN_CHANNEL_SECRET,
                }),
            });
            if (!tokenResponse.ok) {
                throw new Error('Failed to exchange code for token');
            }
            const tokenData = yield tokenResponse.json();
            const accessToken = tokenData.access_token;
            // Get user profile
            const profileResponse = yield fetch('https://api.line.me/v2/profile', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!profileResponse.ok) {
                throw new Error('Failed to get user profile');
            }
            const profile = yield profileResponse.json();
            return {
                lineUserId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
                email: tokenData.id_token ? yield getEmailFromIdToken(tokenData.id_token) : null,
            };
        }
        catch (error) {
            console.error('Error handling LINE callback:', error);
            throw error;
        }
    });
}
/**
 * Handle LINE OAuth callback for shop owners
 * Returns access token and destination ID (from webhook configuration)
 */
function handleShopOwnerLineCallback(code, shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!LINE_MESSAGING_CHANNEL_ID || !LINE_MESSAGING_CHANNEL_SECRET) {
            throw new Error('LINE Messaging API not configured');
        }
        try {
            const redirectUri = getRedirectUri('/shop-callback');
            // Exchange code for access token
            const tokenResponse = yield fetch('https://api.line.me/oauth2/v2.1/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                    client_id: LINE_MESSAGING_CHANNEL_ID,
                    client_secret: LINE_MESSAGING_CHANNEL_SECRET,
                }),
            });
            if (!tokenResponse.ok) {
                const errorText = yield tokenResponse.text();
                console.error('LINE OAuth token error:', errorText);
                throw new Error('Failed to exchange code for token');
            }
            const tokenData = yield tokenResponse.json();
            const accessToken = tokenData.access_token;
            // Get channel info to extract destination ID
            // Note: Destination ID is typically set in LINE Developers Console webhook configuration
            // For now, we'll need the owner to provide it, or we can get it from webhook verification
            // The destination ID is usually the channel ID for Messaging API
            const destinationId = LINE_MESSAGING_CHANNEL_ID; // This is a placeholder - actual destination ID comes from webhook config
            return {
                accessToken,
                destinationId,
                channelId: LINE_MESSAGING_CHANNEL_ID,
            };
        }
        catch (error) {
            console.error('Error handling shop owner LINE callback:', error);
            throw error;
        }
    });
}
/**
 * Get email from LINE ID token
 */
function getEmailFromIdToken(idToken) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // In production, verify the ID token signature
            // For now, decode the JWT payload
            const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
            return payload.email || null;
        }
        catch (error) {
            console.error('Error decoding ID token:', error);
            return null;
        }
    });
}
/**
 * Get LINE Messaging API client for a shop
 */
function getLineMessagingClient(shopId) {
    if (!isLineConfigured()) {
        return null;
    }
    // In production, get channel access token from shop record
    // For now, use the global access token
    return new bot_sdk_1.Client({
        channelAccessToken: LINE_MESSAGING_ACCESS_TOKEN,
    });
}
/**
 * Send LINE message to a user
 */
function sendLineMessage(userId, message, shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isLineConfigured()) {
            console.warn('LINE Messaging not configured');
            return false;
        }
        try {
            const client = getLineMessagingClient(shopId || '');
            if (!client) {
                return false;
            }
            yield client.pushMessage(userId, {
                type: 'text',
                text: message,
            });
            return true;
        }
        catch (error) {
            console.error('Error sending LINE message:', error);
            return false;
        }
    });
}
/**
 * Send booking confirmation via LINE
 */
function sendBookingConfirmation(customerId, bookingData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get LINE user ID for customer
            const { data: mapping } = yield dbClient
                .from('line_user_mappings')
                .select('line_user_id')
                .eq('customer_id', customerId)
                .single();
            if (!mapping) {
                return false; // Customer doesn't have LINE connected
            }
            const message = `✅ 予約が確定しました！\n\n店舗: ${bookingData.shopName}\nサービス: ${bookingData.serviceName}\n日時: ${bookingData.date} ${bookingData.time}\n\n予約ID: ${bookingData.bookingId}\n\n変更やキャンセルはチャットでお知らせください。`;
            return yield sendLineMessage(mapping.line_user_id, message);
        }
        catch (error) {
            console.error('Error sending booking confirmation via LINE:', error);
            return false;
        }
    });
}
/**
 * Send booking reminder (24h before)
 */
function sendBookingReminder(customerId, bookingData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: mapping } = yield dbClient
                .from('line_user_mappings')
                .select('line_user_id')
                .eq('customer_id', customerId)
                .single();
            if (!mapping) {
                return false;
            }
            const message = `📅 予約リマインダー\n\n明日の予約をお忘れなく！\n\n店舗: ${bookingData.shopName}\nサービス: ${bookingData.serviceName}\n日時: ${bookingData.date} ${bookingData.time}`;
            return yield sendLineMessage(mapping.line_user_id, message);
        }
        catch (error) {
            console.error('Error sending booking reminder via LINE:', error);
            return false;
        }
    });
}
/**
 * Send booking update (cancellation/reschedule)
 */
function sendBookingUpdate(customerId, bookingData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: mapping } = yield dbClient
                .from('line_user_mappings')
                .select('line_user_id')
                .eq('customer_id', customerId)
                .single();
            if (!mapping) {
                return false;
            }
            let message = '';
            if (bookingData.updateType === 'cancelled') {
                message = `❌ 予約がキャンセルされました\n\n店舗: ${bookingData.shopName}\n\nまたのご利用をお待ちしております。`;
            }
            else {
                message = `🔄 予約が変更されました\n\n店舗: ${bookingData.shopName}\n\n新しい日時: ${bookingData.newDate} ${bookingData.newTime}`;
            }
            return yield sendLineMessage(mapping.line_user_id, message);
        }
        catch (error) {
            console.error('Error sending booking update via LINE:', error);
            return false;
        }
    });
}
/**
 * Generate LINE share URL for a shop
 */
function getLineShareUrl(shopId, shopName) {
    const url = `${FRONTEND_URL}/shops/${shopId}`;
    const text = encodeURIComponent(`${shopName} - 予約はこちらから`);
    return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${text}`;
}

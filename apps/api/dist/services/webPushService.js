"use strict";
// apps/api/src/services/webPushService.ts
// Web Push notification service for customers
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.saveCustomerPushSubscription = saveCustomerPushSubscription;
exports.sendWebPushToCustomer = sendWebPushToCustomer;
exports.notifyCustomerBookingChange = notifyCustomerBookingChange;
const webpush = __importStar(require("web-push"));
const supabase_1 = require("../lib/supabase");
const multilingualService_1 = require("./multilingualService");
const customerService_1 = require("./customerService");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// Initialize VAPID keys (safe - only initializes if keys exist)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@yoyaku-yo.com';
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails('mailto:omar@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        console.log('[WebPush] ✅ VAPID keys configured');
    }
    catch (err) {
        console.warn("⚠️ WebPush VAPID config error, continuing without push notifications:", err.message);
    }
}
else {
    console.warn('[WebPush] ⚠️  VAPID keys not configured - Web Push will be disabled (this is safe)');
}
/**
 * Save customer's push subscription (safe - won't break if table doesn't exist yet)
 */
function saveCustomerPushSubscription(customerId, subscription, userAgent) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Check if VAPID keys are configured
            if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
                console.log('[WebPush] VAPID keys not configured, skipping subscription save');
                return false;
            }
            const { error } = yield dbClient
                .from('customer_push_subscriptions')
                .upsert({
                customer_id: customerId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                user_agent: userAgent || null,
            }, {
                onConflict: 'customer_id,endpoint',
            });
            if (error) {
                // Safe: If table doesn't exist, just log and return false
                if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('does not exist')) || error.code === '42P01') {
                    console.log('[WebPush] Push subscriptions table not found - run migration first');
                    return false;
                }
                console.error('[WebPush] Error saving push subscription:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            // Safe: Catch all errors and return false instead of throwing
            console.error('[WebPush] Error saving push subscription:', error);
            return false;
        }
    });
}
/**
 * Send Web Push notification to customer (safe - gracefully handles missing setup)
 */
function sendWebPushToCustomer(customerId, title, message, url) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Safe: Check if VAPID keys are configured
            if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
                console.log(`[WebPush] VAPID keys not configured, skipping push to customer ${customerId}`);
                return false;
            }
            // Get all push subscriptions for this customer
            const { data: subscriptions, error } = yield dbClient
                .from('customer_push_subscriptions')
                .select('endpoint, p256dh, auth')
                .eq('customer_id', customerId);
            // Safe: If table doesn't exist or no subscriptions, just return false
            if (error) {
                if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('does not exist')) || error.code === '42P01') {
                    console.log('[WebPush] Push subscriptions table not found - run migration first');
                    return false;
                }
                console.error('[WebPush] Error fetching subscriptions:', error);
                return false;
            }
            if (!subscriptions || subscriptions.length === 0) {
                console.log(`[WebPush] No subscriptions found for customer ${customerId}`);
                return false;
            }
            // Get customer language for localized message (safe - handles errors)
            let customerLang = 'en';
            try {
                customerLang = yield (0, customerService_1.getCustomerLanguage)(null, customerId);
            }
            catch (langError) {
                console.warn('[WebPush] Error getting customer language, using English:', langError);
            }
            const localizedMessage = (yield (0, multilingualService_1.generateMultilingualResponse)('what_can_i_help', customerLang)) + ' ' + message;
            const payload = JSON.stringify({
                title,
                body: localizedMessage,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                data: {
                    url: url || '/',
                    customerId,
                },
            });
            // Send to all subscriptions (safe - handles failures gracefully)
            const results = yield Promise.allSettled(subscriptions.map((sub) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    }, payload);
                    return true;
                }
                catch (error) {
                    // If subscription is invalid (410 Gone or 404 Not Found), remove it
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log(`[WebPush] Removing invalid subscription: ${sub.endpoint}`);
                        try {
                            yield dbClient
                                .from('customer_push_subscriptions')
                                .delete()
                                .eq('endpoint', sub.endpoint);
                        }
                        catch (deleteError) {
                            // Safe: Ignore delete errors
                            console.warn('[WebPush] Error removing invalid subscription:', deleteError);
                        }
                    }
                    throw error;
                }
            })));
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            console.log(`[WebPush] Sent to ${successCount}/${subscriptions.length} subscriptions for customer ${customerId}`);
            return successCount > 0;
        }
        catch (error) {
            // Safe: Catch all errors and return false instead of throwing
            console.error('[WebPush] Error sending web push:', error);
            return false;
        }
    });
}
/**
 * Send notification when booking is cancelled/rescheduled (safe - handles errors gracefully)
 */
function notifyCustomerBookingChange(customerId, action, bookingDetails, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Safe: Get customer language with proper error handling
            let customerLang = 'en';
            try {
                customerLang = yield (0, customerService_1.getCustomerLanguage)(null, customerId);
            }
            catch (langError) {
                console.warn('[WebPush] Error getting customer language, using English:', langError);
            }
            let titleKey = 'booking_cancelled';
            if (action === 'rescheduled') {
                titleKey = 'reschedule_message';
            }
            const title = yield (0, multilingualService_1.generateMultilingualResponse)(titleKey, customerLang);
            const message = `${bookingDetails.serviceName || 'Booking'} on ${bookingDetails.date} at ${bookingDetails.time}`;
            // Get customer's magic code for chat URL (safe - handles missing customer)
            let chatUrl;
            try {
                const { data: customer } = yield dbClient
                    .from('customers')
                    .select('magic_code')
                    .eq('id', customerId)
                    .single();
                if (customer === null || customer === void 0 ? void 0 : customer.magic_code) {
                    const frontendUrl = process.env.FRONTEND_URL || ((_a = process.env.NEXT_PUBLIC_API_URL) === null || _a === void 0 ? void 0 : _a.replace(':3000', ':3001')) || 'http://localhost:3001';
                    chatUrl = `${frontendUrl}/c/${customer.magic_code}`;
                }
            }
            catch (customerError) {
                console.warn('[WebPush] Error getting customer magic code:', customerError);
                // Continue without chat URL
            }
            return yield sendWebPushToCustomer(customerId, title, message, chatUrl);
        }
        catch (error) {
            // Safe: Catch all errors and return false instead of throwing
            console.error('[WebPush] Error notifying customer of booking change:', error);
            return false;
        }
    });
}

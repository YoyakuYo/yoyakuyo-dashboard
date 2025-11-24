"use strict";
// apps/api/src/services/lineWebhookService.ts
// LINE webhook service for multi-tenant shop support
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
exports.resolveShopFromDestination = resolveShopFromDestination;
exports.getOrCreateLineThread = getOrCreateLineThread;
exports.saveLineMessage = saveLineMessage;
exports.buildShopAIPrompt = buildShopAIPrompt;
exports.isFirstMessageInThread = isFirstMessageInThread;
exports.buildWelcomeMessage = buildWelcomeMessage;
const supabase_1 = require("../lib/supabase");
const bookingService_1 = require("./bookingService");
const bookingService_2 = require("./bookingService");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
/**
 * Resolve shop from LINE destination ID
 */
function resolveShopFromDestination(destination) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!destination) {
            return { shopId: null, welcomeMessageTemplate: null, lineAccessToken: null };
        }
        try {
            const { data: settings, error } = yield dbClient
                .from('line_shop_settings')
                .select('shop_id, welcome_message_template, line_access_token')
                .eq('line_destination_id', destination)
                .limit(1)
                .single();
            if (error || !settings) {
                console.warn(`[LINE Webhook] Unknown destination: ${destination}`);
                return { shopId: null, welcomeMessageTemplate: null, lineAccessToken: null };
            }
            return {
                shopId: settings.shop_id,
                welcomeMessageTemplate: settings.welcome_message_template || null,
                lineAccessToken: settings.line_access_token || null,
            };
        }
        catch (error) {
            console.error('[LINE Webhook] Error resolving shop from destination:', error.message);
            return { shopId: null, welcomeMessageTemplate: null, lineAccessToken: null };
        }
    });
}
/**
 * Get or create thread for LINE user + shop
 */
function getOrCreateLineThread(shopId, lineUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if thread exists for this shop + LINE user
            const { data: existingThreads, error: findError } = yield dbClient
                .from('shop_threads')
                .select('id')
                .eq('shop_id', shopId)
                .eq('line_user_id', lineUserId)
                .limit(1);
            if (findError) {
                console.error('[LINE Webhook] Error finding thread:', findError);
            }
            if (existingThreads && existingThreads.length > 0) {
                return existingThreads[0].id;
            }
            // Create new thread for LINE user (always customer type)
            const { data: newThread, error: insertError } = yield dbClient
                .from('shop_threads')
                .insert([{
                    shop_id: shopId,
                    line_user_id: lineUserId,
                    thread_type: 'customer', // LINE threads are always customer-facing
                    booking_id: null,
                    customer_email: null,
                    customer_id: null,
                }])
                .select('id')
                .single();
            if (insertError) {
                console.error('[LINE Webhook] Error creating thread:', insertError);
                return null;
            }
            return newThread.id;
        }
        catch (error) {
            console.error('[LINE Webhook] Error in getOrCreateLineThread:', error.message);
            return null;
        }
    });
}
/**
 * Save customer message from LINE
 */
function saveLineMessage(threadId, content, lineUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { error } = yield dbClient
                .from('shop_messages')
                .insert([{
                    thread_id: threadId,
                    sender_type: 'customer',
                    content: content,
                    source: 'line', // Mark as LINE source
                    read_by_owner: false,
                    read_by_customer: true,
                    sender_id: lineUserId,
                }]);
            if (error) {
                console.error('[LINE Webhook] Error saving message:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('[LINE Webhook] Error in saveLineMessage:', error.message);
            return false;
        }
    });
}
/**
 * Build AI system prompt with shop context
 */
function buildShopAIPrompt(shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        const shop = yield (0, bookingService_1.getShopDetails)(shopId);
        if (!shop) {
            return 'You are a helpful AI assistant for a shop booking platform.';
        }
        // Get shop services
        const services = yield (0, bookingService_2.getShopServices)(shopId);
        const servicesList = services.length > 0
            ? services.map(s => `- ${s.name}`).join('\n')
            : 'No services listed yet';
        const shopName = shop.name || 'our shop';
        const shopCategory = shop.category || 'business';
        const shopAddress = shop.address || shop.city || shop.prefecture || 'Location not specified';
        const shopDescription = shop.description || '';
        return `You are the AI booking assistant for "${shopName}"${shopCategory ? ` (a ${shopCategory})` : ''}.

SHOP INFORMATION:
- Shop Name: ${shopName}
- Category: ${shopCategory}
- Address: ${shopAddress}${shopDescription ? `\n- Description: ${shopDescription}` : ''}

AVAILABLE SERVICES:
${servicesList}

IMPORTANT RULES:
- Always speak on behalf of this shop only
- Be friendly, professional, and helpful
- Help customers book appointments, check availability, reschedule, or cancel
- Use the shop name naturally in your responses
- If asked about services, refer to the list above
- DO NOT ask for phone number or email address - these are NOT required
- When a customer wants to book, ask for their name first, then service, date, and time
- After collecting all info and customer confirms, create the booking immediately`;
    });
}
/**
 * Check if this is the first message in a thread
 */
function isFirstMessageInThread(threadId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: messages, error } = yield dbClient
                .from('shop_messages')
                .select('id')
                .eq('thread_id', threadId)
                .limit(1);
            if (error) {
                console.error('[LINE Webhook] Error checking thread messages:', error);
                return true; // Assume first message on error
            }
            return !messages || messages.length === 0;
        }
        catch (error) {
            console.error('[LINE Webhook] Error in isFirstMessageInThread:', error.message);
            return true;
        }
    });
}
/**
 * Build welcome message from template
 */
function buildWelcomeMessage(template, shopName) {
    return template.replace(/\{\{shop_name\}\}/g, shopName);
}

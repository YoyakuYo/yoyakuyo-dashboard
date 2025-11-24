"use strict";
// apps/api/src/routes/owner.ts
// Owner power bot routes - supports both commands and chat
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
const ownerCommandService_1 = require("../services/ownerCommandService");
const languageDetectionService_1 = require("../services/languageDetectionService");
const bookingService_1 = require("../services/bookingService");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// POST /owner/command - Execute owner command OR chat with AI
router.post('/command', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = req.headers['x-user-id'];
        const { shopId, command, ownerLanguage: providedLanguage, conversationHistory, threadId } = req.body;
        if (!shopId || !command) {
            return res.status(400).json({ error: 'shopId and command are required' });
        }
        // Verify user owns the shop
        if (userId) {
            const { data: shop } = yield dbClient
                .from('shops')
                .select('owner_user_id')
                .eq('id', shopId)
                .eq('owner_user_id', userId)
                .single();
            if (!shop) {
                return res.status(403).json({ error: 'Access denied. You do not own this shop.' });
            }
        }
        // Get or create owner thread for this shop
        let ownerThreadId = threadId;
        if (!ownerThreadId) {
            // Find existing owner thread for this shop
            const { data: existingThreads } = yield dbClient
                .from('shop_threads')
                .select('id')
                .eq('shop_id', shopId)
                .eq('thread_type', 'owner')
                .limit(1);
            if (existingThreads && existingThreads.length > 0) {
                ownerThreadId = existingThreads[0].id;
            }
            else {
                // Create new owner thread
                const { data: newThread, error: threadError } = yield dbClient
                    .from('shop_threads')
                    .insert([{
                        shop_id: shopId,
                        thread_type: 'owner', // Owner AI assistant thread
                        booking_id: null,
                        customer_email: null,
                        customer_id: null,
                    }])
                    .select('id')
                    .single();
                if (threadError || !newThread) {
                    console.error('Error creating owner thread:', threadError);
                    // Continue without thread (backward compatibility)
                }
                else {
                    ownerThreadId = newThread.id;
                }
            }
        }
        // Save owner message to thread if thread exists
        if (ownerThreadId) {
            try {
                yield dbClient
                    .from('shop_messages')
                    .insert([{
                        thread_id: ownerThreadId,
                        sender_type: 'owner',
                        content: command,
                        source: 'dashboard',
                        read_by_owner: true,
                        read_by_customer: false,
                        sender_id: userId || null,
                    }]);
            }
            catch (msgError) {
                console.error('Error saving owner message:', msgError);
                // Continue even if message save fails
            }
        }
        // Auto-detect owner language if not provided
        let ownerLanguage = providedLanguage || (yield (0, languageDetectionService_1.detectLanguage)(command));
        // Step 1: Try to parse as a command first
        const parsedCommand = yield (0, ownerCommandService_1.parseOwnerCommand)(command, shopId, ownerLanguage);
        // Step 2: If it's a recognized command, execute it
        if (parsedCommand.action !== 'unknown') {
            const result = yield (0, ownerCommandService_1.executeOwnerCommand)(parsedCommand, shopId, ownerLanguage);
            // Save command result as AI message if thread exists
            if (ownerThreadId && result.message) {
                try {
                    yield dbClient
                        .from('shop_messages')
                        .insert([{
                            thread_id: ownerThreadId,
                            sender_type: 'ai',
                            content: result.message,
                            source: 'dashboard',
                            read_by_owner: true,
                            read_by_customer: false,
                        }]);
                }
                catch (msgError) {
                    console.error('Error saving AI response:', msgError);
                }
            }
            return res.json(Object.assign(Object.assign({}, result), { threadId: ownerThreadId }));
        }
        // Step 3: If it's NOT a command, use AI chat for conversation
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return res.status(500).json({
                success: false,
                message: 'AI chat is not available. OpenAI API key not configured.'
            });
        }
        // Fetch shop details for context
        const shop = yield (0, bookingService_1.getShopDetails)(shopId);
        const shopName = (shop === null || shop === void 0 ? void 0 : shop.name) || 'your shop';
        const shopCategory = (shop === null || shop === void 0 ? void 0 : shop.category) || 'business';
        const shopDescription = (shop === null || shop === void 0 ? void 0 : shop.description) || '';
        const shopLocation = (shop === null || shop === void 0 ? void 0 : shop.address) || (shop === null || shop === void 0 ? void 0 : shop.city) || (shop === null || shop === void 0 ? void 0 : shop.prefecture) || '';
        // Build shop context string
        let shopContext = '';
        if (shop) {
            shopContext = `\n\nSHOP CONTEXT:
- Shop Name: ${shopName}
- Category: ${shopCategory}`;
            if (shopDescription) {
                shopContext += `\n- Description: ${shopDescription}`;
            }
            if (shopLocation) {
                shopContext += `\n- Location: ${shopLocation}`;
            }
        }
        // Get language name for the prompt
        const languageNames = {
            'ja': 'Japanese', 'en': 'English', 'zh': 'Chinese', 'vi': 'Vietnamese',
            'pt': 'Portuguese', 'fr': 'French', 'ru': 'Russian', 'es': 'Spanish',
            'ko': 'Korean', 'th': 'Thai', 'de': 'German', 'it': 'Italian',
            'ar': 'Arabic', 'hi': 'Hindi',
        };
        const detectedLanguageName = languageNames[ownerLanguage] || 'English';
        // Build conversation history with shop context
        const messages = [
            {
                role: 'system',
                content: `You are a helpful AI assistant for the owner of "${shopName}" - a ${shopCategory}. The owner speaks ${detectedLanguageName}.${shopContext}

You help with:
- Answering questions about bookings, customers, and shop operations
- Providing insights and suggestions
- General conversation
- Explaining how to view updated shop hours and calendar information

IMPORTANT: When the owner asks about calendar or opening hours:
- If hours were just updated, confirm the update was successful
- Explain that opening hours are displayed in the Calendar View section of the Bookings page
- If they can't see the update, suggest refreshing the page
- You can fetch current opening hours from the shop data if needed

You can also execute commands, but if the owner asks you to do something that requires action (like cancel a booking or close the shop), 
you should tell them they can use commands like "Cancel [customer name]'s booking" or "Close salon [dates]".

Be friendly, professional, and helpful. Respond ONLY in ${detectedLanguageName}, not any other language.`
            },
            ...(conversationHistory || []),
            {
                role: 'user',
                content: command,
            },
        ];
        // Call OpenAI for chat
        const response = yield fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages,
                temperature: 0.7,
                max_tokens: 500,
            }),
        });
        if (!response.ok) {
            const errorText = yield response.text();
            console.error('OpenAI chat error:', response.status, errorText);
            return res.status(500).json({
                success: false,
                message: 'Sorry, I encountered an error. Please try again.'
            });
        }
        const data = yield response.json();
        const aiResponse = ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || 'Sorry, I could not generate a response.';
        // Save AI response to thread if thread exists
        if (ownerThreadId) {
            try {
                yield dbClient
                    .from('shop_messages')
                    .insert([{
                        thread_id: ownerThreadId,
                        sender_type: 'ai',
                        content: aiResponse,
                        source: 'dashboard',
                        read_by_owner: true,
                        read_by_customer: false,
                    }]);
            }
            catch (msgError) {
                console.error('Error saving AI response:', msgError);
            }
        }
        return res.json({
            success: true,
            message: aiResponse,
            isCommand: false, // Indicate this was a chat response, not a command
            threadId: ownerThreadId, // Return thread ID for frontend
        });
    }
    catch (error) {
        console.error('Error processing owner command/chat:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'An error occurred. Please try again.'
        });
    }
}));
// GET /owner/thread - Get or create owner thread for a shop
router.get('/thread', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        const shopId = req.query.shopId;
        if (!shopId) {
            return res.status(400).json({ error: 'shopId is required' });
        }
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Verify user owns the shop
        const { data: shop } = yield dbClient
            .from('shops')
            .select('owner_user_id')
            .eq('id', shopId)
            .eq('owner_user_id', userId)
            .single();
        if (!shop) {
            return res.status(403).json({ error: 'Access denied. You do not own this shop.' });
        }
        // Find existing owner thread for this shop
        const { data: existingThreads } = yield dbClient
            .from('shop_threads')
            .select('id')
            .eq('shop_id', shopId)
            .eq('thread_type', 'owner')
            .limit(1);
        let threadId;
        if (existingThreads && existingThreads.length > 0) {
            threadId = existingThreads[0].id;
        }
        else {
            // Create new owner thread
            const { data: newThread, error: threadError } = yield dbClient
                .from('shop_threads')
                .insert([{
                    shop_id: shopId,
                    thread_type: 'owner',
                    booking_id: null,
                    customer_email: null,
                    customer_id: null,
                }])
                .select('id')
                .single();
            if (threadError || !newThread) {
                return res.status(500).json({ error: 'Failed to create owner thread' });
            }
            threadId = newThread.id;
        }
        return res.json({ threadId });
    }
    catch (error) {
        console.error('Error getting owner thread:', error);
        return res.status(500).json({ error: error.message || 'An error occurred' });
    }
}));
exports.default = router;

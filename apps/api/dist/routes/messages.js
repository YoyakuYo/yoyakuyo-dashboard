"use strict";
// apps/api/src/routes/messages.ts
// API routes for messages (customer, AI, owner) using shop_threads and shop_messages
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
const customerService_1 = require("../services/customerService");
const router = (0, express_1.Router)();
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// POST /messages/start-thread - Start or find existing thread
router.post("/start-thread", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId, customerEmail, customerId, bookingId, threadType, anonymousSessionId } = req.body;
        if (!shopId) {
            return res.status(400).json({ error: "shopId is required" });
        }
        // Determine thread_type: 'owner' for dashboard, 'customer' for public/LINE
        const finalThreadType = threadType || 'customer'; // Default to customer for public access
        // Try to find existing thread
        let query = dbClient
            .from("shop_threads")
            .select("*")
            .eq("shop_id", shopId)
            .eq("thread_type", finalThreadType); // Filter by thread_type for security
        if (bookingId) {
            query = query.eq("booking_id", bookingId);
        }
        else if (customerId) {
            query = query.eq("customer_id", customerId);
        }
        else if (customerEmail) {
            query = query.eq("customer_email", customerEmail);
        }
        else if (anonymousSessionId) {
            // For public visitors, match by anonymous_session_id
            query = query.eq("anonymous_session_id", anonymousSessionId);
        }
        else {
            // If no identifiers, create a new thread
            const { data: newThread, error: insertError } = yield dbClient
                .from("shop_threads")
                .insert([{
                    shop_id: shopId,
                    thread_type: finalThreadType,
                    anonymous_session_id: anonymousSessionId || null,
                    booking_id: null,
                    customer_email: null,
                }])
                .select()
                .single();
            if (insertError) {
                console.error("Error creating thread:", insertError);
                return res.status(500).json({ error: insertError.message });
            }
            return res.json({
                threadId: newThread.id,
                shopId: newThread.shop_id,
                bookingId: newThread.booking_id,
                customerEmail: newThread.customer_email,
            });
        }
        const { data: existingThreads, error: findError } = yield query;
        if (findError) {
            console.error("Error finding thread:", findError);
            return res.status(500).json({ error: findError.message });
        }
        // If thread exists, return it
        if (existingThreads && existingThreads.length > 0) {
            const thread = existingThreads[0];
            return res.json({
                threadId: thread.id,
                shopId: thread.shop_id,
                bookingId: thread.booking_id,
                customerEmail: thread.customer_email,
            });
        }
        // Create new thread
        const { data: newThread, error: insertError } = yield dbClient
            .from("shop_threads")
            .insert([{
                shop_id: shopId,
                thread_type: finalThreadType,
                anonymous_session_id: anonymousSessionId || null,
                booking_id: bookingId || null,
                customer_email: customerEmail || null,
                customer_id: customerId || null,
            }])
            .select()
            .single();
        if (insertError) {
            console.error("Error creating thread:", insertError);
            return res.status(500).json({ error: insertError.message });
        }
        return res.json({
            threadId: newThread.id,
            shopId: newThread.shop_id,
            bookingId: newThread.booking_id,
            customerEmail: newThread.customer_email,
        });
    }
    catch (e) {
        console.error("Error during start-thread:", e);
        return res.status(500).json({ error: e.message });
    }
}));
// GET /messages/thread/:threadId - Get message history for a thread
router.get("/thread/:threadId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        const userId = req.headers['x-user-id'];
        const anonymousSessionId = req.query.anonymousSessionId;
        // Verify thread exists and check access
        const { data: thread, error: threadError } = yield dbClient
            .from("shop_threads")
            .select("thread_type, shop_id, line_user_id, anonymous_session_id, customer_id, customer_email")
            .eq("id", threadId)
            .single();
        if (threadError || !thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        // SECURITY: Verify access based on thread_type
        if (thread.thread_type === 'owner') {
            // Only shop owners can access owner threads
            if (!userId) {
                return res.status(401).json({ error: "Authentication required for owner threads" });
            }
            // Verify user owns the shop
            const { data: shop } = yield dbClient
                .from("shops")
                .select("owner_user_id")
                .eq("id", thread.shop_id)
                .eq("owner_user_id", userId)
                .single();
            if (!shop) {
                return res.status(403).json({ error: "Access denied" });
            }
        }
        else if (thread.thread_type === 'customer') {
            // Customer threads: verify access via userId, customer_id, line_user_id, or anonymous_session_id
            if (userId) {
                // Check if user owns the shop (owners can see customer threads)
                const { data: shop } = yield dbClient
                    .from("shops")
                    .select("owner_user_id")
                    .eq("id", thread.shop_id)
                    .eq("owner_user_id", userId)
                    .single();
                if (!shop) {
                    // Not owner, check if it's their customer thread
                    // This would require customer_id mapping - for now, allow if they have matching identifiers
                    // In production, add proper customer-user mapping
                }
            }
            else if (anonymousSessionId) {
                // Public visitor: must match anonymous_session_id
                if (thread.anonymous_session_id !== anonymousSessionId) {
                    return res.status(403).json({ error: "Access denied" });
                }
            }
            else {
                // No authentication - deny access to customer threads
                return res.status(401).json({ error: "Authentication or session required" });
            }
        }
        const { data, error } = yield dbClient
            .from("shop_messages")
            .select("*")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: true });
        if (error) {
            console.error("Error fetching messages:", error);
            return res.status(500).json({ error: error.message });
        }
        // Transform to match expected format
        const messages = (Array.isArray(data) ? data : []).map((msg) => ({
            id: msg.id,
            senderType: msg.sender_type,
            content: msg.content,
            source: msg.source,
            createdAt: msg.created_at,
            readByOwner: msg.read_by_owner || false,
            readByCustomer: msg.read_by_customer || false,
            senderId: msg.sender_id || null,
        }));
        return res.json(messages);
    }
    catch (e) {
        console.error("Error during fetching thread messages:", e);
        return res.status(500).json({ error: e.message });
    }
}));
// POST /messages/thread/:threadId/send - Send a message in a thread
router.post("/thread/:threadId/send", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        const { senderType, senderId, content } = req.body;
        if (!senderType || !content) {
            return res.status(400).json({ error: "senderType and content are required" });
        }
        if (!['customer', 'owner', 'ai'].includes(senderType)) {
            return res.status(400).json({ error: "senderType must be 'customer', 'owner', or 'ai'" });
        }
        // If senderType is 'customer', create/find customer record
        if (senderType === 'customer') {
            const { data: thread } = yield dbClient
                .from("shop_threads")
                .select("customer_email")
                .eq("id", threadId)
                .single();
            if (thread === null || thread === void 0 ? void 0 : thread.customer_email) {
                // Extract name from message or use email as identifier
                // Try to find name in message (simple pattern matching)
                const nameMatch = content.match(/(?:私の名前は|名前は|I'm|My name is)\s*([A-Za-z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/i);
                const customerName = nameMatch ? nameMatch[1] : null;
                yield (0, customerService_1.findOrCreateCustomer)(thread.customer_email, customerName || undefined, undefined);
            }
        }
        // Verify thread exists and get thread_type for security
        const { data: thread, error: threadError } = yield dbClient
            .from("shop_threads")
            .select("thread_type, shop_id")
            .eq("id", threadId)
            .single();
        if (threadError || !thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        // If senderType is 'owner', set read_by_owner = true by default
        const messageData = {
            thread_id: threadId,
            sender_type: senderType,
            content: content,
            source: req.body.source || 'dashboard', // Track source: dashboard, public, or line
            read_by_owner: senderType === 'owner' ? true : false,
            read_by_customer: senderType === 'customer' ? true : false,
        };
        if (senderId) {
            messageData.sender_id = senderId;
        }
        // If senderType is 'owner', translate to customer's language
        let finalContent = content;
        if (senderType === 'owner') {
            try {
                // Get recent customer messages to detect their language
                const { data: recentCustomerMessages } = yield dbClient
                    .from("shop_messages")
                    .select("content")
                    .eq("thread_id", threadId)
                    .eq("sender_type", "customer")
                    .order("created_at", { ascending: false })
                    .limit(5);
                if (recentCustomerMessages && recentCustomerMessages.length > 0) {
                    // Detect customer's language from their most recent message
                    const { detectLanguage } = require('../services/languageDetectionService');
                    const customerLanguage = yield detectLanguage(recentCustomerMessages[0].content);
                    // Detect owner's message language
                    const ownerLanguage = yield detectLanguage(content);
                    // Translate owner's message to customer's language if different
                    if (customerLanguage !== ownerLanguage) {
                        const translateRes = yield fetch(`${process.env.API_URL || 'http://localhost:3000'}/ai/translate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: content,
                                targetLanguage: customerLanguage,
                                sourceLanguage: ownerLanguage,
                            }),
                        });
                        if (translateRes.ok) {
                            const translateData = yield translateRes.json();
                            finalContent = translateData.translatedText || content;
                        }
                    }
                }
            }
            catch (translateError) {
                console.error("Error translating owner message:", translateError);
                // Continue with original content if translation fails
            }
        }
        // Update messageData with translated content
        messageData.content = finalContent;
        const { data, error } = yield dbClient
            .from("shop_messages")
            .insert([messageData])
            .select()
            .single();
        if (error) {
            console.error("Error creating message:", error);
            return res.status(500).json({ error: error.message || 'Failed to create message' });
        }
        // If senderType is 'owner', check if it's a command for AI to handle
        if (senderType === 'owner') {
            // Get thread info
            const { data: thread } = yield dbClient
                .from("shop_threads")
                .select("shop_id, booking_id, owner_taken_over")
                .eq("id", threadId)
                .single();
            if (thread) {
                // Check if message contains cancellation/reschedule commands
                const lowerContent = finalContent.toLowerCase();
                // Multilingual command detection
                const isCommand = /cancel|reschedule|cancellation|変更|キャンセル|予約変更|annuler|stornieren|cancelar|取消/i.test(lowerContent);
                if (isCommand && thread.booking_id) {
                    // This is a command - let AI handle it
                    fetch(`${process.env.API_URL || 'http://localhost:3000'}/ai/chat-thread`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            threadId: threadId,
                            shopId: thread.shop_id,
                            bookingId: thread.booking_id,
                            message: content, // Original English message
                            source: 'owner', // Indicate this is from owner
                        }),
                    }).catch(err => {
                        console.error("Error calling AI for owner command:", err);
                    });
                }
            }
        }
        // If senderType is 'customer', trigger AI reply (only if owner hasn't taken over)
        if (senderType === 'customer') {
            // Get shop_id and owner_taken_over status from thread
            const { data: thread } = yield dbClient
                .from("shop_threads")
                .select("shop_id, booking_id, owner_taken_over")
                .eq("id", threadId)
                .single();
            if (thread && !thread.owner_taken_over) {
                // Call AI route to generate reply (async, don't wait)
                fetch(`${process.env.API_URL || 'http://localhost:3000'}/ai/chat-thread`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        threadId: threadId,
                        shopId: thread.shop_id,
                        bookingId: thread.booking_id,
                        message: content,
                        source: 'customer',
                    }),
                }).catch(err => {
                    console.error("Error calling AI for reply:", err);
                });
            }
        }
        return res.json({
            id: data.id,
            senderType: data.sender_type,
            content: data.content,
            createdAt: data.created_at,
            readByOwner: data.read_by_owner || false,
            readByCustomer: data.read_by_customer || false,
            senderId: data.sender_id || null,
            originalContent: senderType === 'owner' ? content : undefined, // Return original English for owner view
        });
    }
    catch (e) {
        console.error("Error during sending message:", e);
        return res.status(500).json({ error: e.message });
    }
}));
// POST /messages/thread/:threadId/mark-read-owner - Mark messages as read by owner
router.post("/thread/:threadId/mark-read-owner", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        const { error } = yield dbClient
            .from("shop_messages")
            .update({ read_by_owner: true })
            .eq("thread_id", threadId)
            .eq("sender_type", "customer")
            .eq("read_by_owner", false);
        if (error) {
            console.error("Error marking messages as read:", error);
            return res.status(500).json({ error: error.message });
        }
        return res.json({ success: true });
    }
    catch (e) {
        console.error("Error during mark-read-owner:", e);
        return res.status(500).json({ error: e.message });
    }
}));
// GET /messages/owner/threads - Get all threads for owner's shop(s)
router.get("/owner/threads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        // Get shop IDs owned by this user
        const { data: shops, error: shopsError } = yield dbClient
            .from("shops")
            .select("id")
            .eq("owner_user_id", userId);
        if (shopsError) {
            console.error("Error fetching user shops:", shopsError);
            return res.status(500).json({ error: shopsError.message });
        }
        if (!shops || shops.length === 0) {
            return res.json([]);
        }
        const shopIds = shops.map((s) => s.id);
        // Get threads for owner's shops (both owner and customer types)
        const { data: threads, error: threadsError } = yield dbClient
            .from("shop_threads")
            .select("*")
            .in("shop_id", shopIds)
            // Owner can see both 'owner' (internal AI) and 'customer' (public/LINE) threads
            .order("updated_at", { ascending: false });
        if (threadsError) {
            console.error("Error fetching threads:", threadsError);
            return res.status(500).json({ error: threadsError.message });
        }
        // Get unread counts and last messages for each thread
        const threadsWithDetails = yield Promise.all((Array.isArray(threads) ? threads : []).map((thread) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // Get unread count from view
            const { data: unreadData } = yield dbClient
                .from("shop_owner_unread_counts")
                .select("unread_count")
                .eq("shop_id", thread.shop_id)
                .eq("thread_id", thread.id)
                .single();
            // Get last message
            const { data: lastMessage } = yield dbClient
                .from("shop_messages")
                .select("*")
                .eq("thread_id", thread.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
            return {
                id: thread.id,
                shopId: thread.shop_id,
                bookingId: thread.booking_id,
                customerEmail: thread.customer_email,
                threadType: thread.thread_type || 'customer',
                lineUserId: thread.line_user_id,
                unreadCount: (unreadData === null || unreadData === void 0 ? void 0 : unreadData.unread_count) || 0,
                lastMessageAt: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.created_at) || thread.updated_at,
                lastMessagePreview: ((_a = lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.content) === null || _a === void 0 ? void 0 : _a.substring(0, 100)) || null,
                lastMessageFrom: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.sender_type) || null,
            };
        })));
        return res.json(threadsWithDetails);
    }
    catch (e) {
        console.error("Error during fetching owner threads:", e);
        return res.status(500).json({ error: e.message });
    }
}));
// GET /messages/owner/unread-summary - Get total unread count for owner
router.get("/owner/unread-summary", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        // Get shop IDs owned by this user
        const { data: shops, error: shopsError } = yield dbClient
            .from("shops")
            .select("id")
            .eq("owner_user_id", userId);
        if (shopsError) {
            console.error("Error fetching user shops:", shopsError);
            return res.status(500).json({ error: shopsError.message });
        }
        if (!shops || shops.length === 0) {
            return res.json({ unreadCount: 0 });
        }
        const shopIds = shops.map((s) => s.id);
        // Get unread counts from view
        const { data: unreadCounts, error: countsError } = yield dbClient
            .from("shop_owner_unread_counts")
            .select("unread_count")
            .in("shop_id", shopIds);
        if (countsError) {
            console.error("Error fetching unread counts:", countsError);
            return res.status(500).json({ error: countsError.message });
        }
        const totalUnread = (Array.isArray(unreadCounts) ? unreadCounts : [])
            .reduce((sum, item) => sum + (item.unread_count || 0), 0);
        return res.json({ unreadCount: totalUnread });
    }
    catch (e) {
        console.error("Error during fetching unread summary:", e);
        return res.status(500).json({ error: e.message });
    }
}));
// Legacy endpoints (keep for backward compatibility)
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = req.query.shop_id;
        const bookingId = req.query.booking_id;
        if (!shopId) {
            return res.status(400).json({ error: "shop_id is required" });
        }
        let query = dbClient
            .from("messages")
            .select("*")
            .eq("shop_id", shopId)
            .order("created_at", { ascending: true });
        if (bookingId) {
            query = query.eq("booking_id", bookingId);
        }
        const { data, error } = yield query;
        if (error) {
            console.error("Error fetching messages:", error);
            return res.status(500).json({ error: error.message });
        }
        return res.json(Array.isArray(data) ? data : []);
    }
    catch (e) {
        console.error("Error during fetching messages:", e);
        return res.status(500).json({ error: e.message });
    }
}));
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shop_id, booking_id, sender_type, message, language_code } = req.body;
        if (!shop_id || !sender_type || !message) {
            return res.status(400).json({ error: "shop_id, sender_type, and message are required" });
        }
        const { data, error } = yield dbClient
            .from("messages")
            .insert([
            {
                shop_id,
                booking_id: booking_id || null,
                sender_type,
                message,
                language_code: language_code || 'en',
            }
        ])
            .select()
            .single();
        if (error) {
            console.error("Error creating message:", error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(201).json(data);
    }
    catch (e) {
        console.error("Error during creating message:", e);
        return res.status(500).json({ error: e.message });
    }
}));
// PATCH /messages/thread/:threadId/takeover - Toggle owner takeover
router.patch("/thread/:threadId/takeover", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        const { takenOver } = req.body;
        if (typeof takenOver !== 'boolean') {
            return res.status(400).json({ error: "takenOver must be a boolean" });
        }
        const { data, error } = yield dbClient
            .from("shop_threads")
            .update({ owner_taken_over: takenOver })
            .eq("id", threadId)
            .select()
            .single();
        if (error) {
            console.error("Error updating takeover status:", error);
            return res.status(500).json({ error: error.message });
        }
        return res.json({
            threadId: data.id,
            ownerTakenOver: data.owner_taken_over,
        });
    }
    catch (e) {
        console.error("Error during takeover toggle:", e);
        return res.status(500).json({ error: e.message });
    }
}));
exports.default = router;

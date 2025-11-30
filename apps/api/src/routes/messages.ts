// apps/api/src/routes/messages.ts
// API routes for messages (customer, AI, owner) using shop_threads and shop_messages

import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { findOrCreateCustomer } from "../services/customerService";

const router = Router();
const dbClient = supabaseAdmin || supabase;

// POST /messages/start-thread - Start or find existing thread
router.post("/start-thread", async (req: Request, res: Response) => {
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
        } else if (customerId) {
            query = query.eq("customer_id", customerId);
        } else if (customerEmail) {
            query = query.eq("customer_email", customerEmail);
        } else if (anonymousSessionId) {
            // For public visitors, match by anonymous_session_id
            query = query.eq("anonymous_session_id", anonymousSessionId);
        } else {
            // If no identifiers, create a new thread
            const { data: newThread, error: insertError } = await dbClient
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

        const { data: existingThreads, error: findError } = await query;

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
        const { data: newThread, error: insertError } = await dbClient
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
    } catch (e: any) {
        console.error("Error during start-thread:", e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /messages/thread/:threadId - Get message history for a thread
router.get("/thread/:threadId", async (req: Request, res: Response) => {
    try {
        const { threadId } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const anonymousSessionId = req.query.anonymousSessionId as string | undefined;

        // Verify thread exists and check access
        const { data: thread, error: threadError } = await dbClient
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
            const { data: shop } = await dbClient
                .from("shops")
                .select("owner_user_id")
                .eq("id", thread.shop_id)
                .eq("owner_user_id", userId)
                .single();
            
            if (!shop) {
                return res.status(403).json({ error: "Access denied" });
            }
        } else if (thread.thread_type === 'customer') {
            // Customer threads: verify access via userId, customer_id, line_user_id, or anonymous_session_id
            if (userId) {
                // Check if user owns the shop (owners can see customer threads)
                const { data: shop } = await dbClient
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
            } else if (anonymousSessionId) {
                // Public visitor: must match anonymous_session_id
                if (thread.anonymous_session_id !== anonymousSessionId) {
                    return res.status(403).json({ error: "Access denied" });
                }
            } else {
                // No authentication - deny access to customer threads
                return res.status(401).json({ error: "Authentication or session required" });
            }
        }

        const { data, error } = await dbClient
            .from("shop_messages")
            .select("*")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            return res.status(500).json({ error: error.message });
        }

        // Transform to match expected format
        const messages = (Array.isArray(data) ? data : []).map((msg: any) => ({
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
    } catch (e: any) {
        console.error("Error during fetching thread messages:", e);
        return res.status(500).json({ error: e.message });
    }
});

// POST /messages/thread/:threadId/send - Send a message in a thread
router.post("/thread/:threadId/send", async (req: Request, res: Response) => {
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
            const { data: thread } = await dbClient
                .from("shop_threads")
                .select("customer_email")
                .eq("id", threadId)
                .single();

            if (thread?.customer_email) {
                // Extract name from message or use email as identifier
                // Try to find name in message (simple pattern matching)
                const nameMatch = content.match(/(?:私の名前は|名前は|I'm|My name is)\s*([A-Za-z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/i);
                const customerName = nameMatch ? nameMatch[1] : null;

                await findOrCreateCustomer(
                    thread.customer_email,
                    customerName || undefined,
                    undefined
                );
            }
        }

        // Verify thread exists and get thread_type for security
        const { data: thread, error: threadError } = await dbClient
            .from("shop_threads")
            .select("thread_type, shop_id")
            .eq("id", threadId)
            .single();

        if (threadError || !thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        // If senderType is 'owner', set read_by_owner = true by default
        const messageData: any = {
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
                const { data: recentCustomerMessages } = await dbClient
                    .from("shop_messages")
                    .select("content")
                    .eq("thread_id", threadId)
                    .eq("sender_type", "customer")
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (recentCustomerMessages && recentCustomerMessages.length > 0) {
                    // Detect customer's language from their most recent message
                    const { detectLanguage } = require('../services/languageDetectionService');
                    const customerLanguage = await detectLanguage(recentCustomerMessages[0].content);
                    
                    // Detect owner's message language
                    const ownerLanguage = await detectLanguage(content);
                    
                    // Translate owner's message to customer's language if different
                    if (customerLanguage !== ownerLanguage) {
                        const translateRes = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/ai/translate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: content,
                                targetLanguage: customerLanguage,
                                sourceLanguage: ownerLanguage,
                            }),
                        });
                        
                        if (translateRes.ok) {
                            const translateData = await translateRes.json() as { translatedText?: string };
                            finalContent = translateData.translatedText || content;
                        }
                    }
                }
            } catch (translateError) {
                console.error("Error translating owner message:", translateError);
                // Continue with original content if translation fails
            }
        }

        // Update messageData with translated content
        messageData.content = finalContent;

        const { data, error } = await dbClient
            .from("shop_messages")
            .insert([messageData])
            .select()
            .single();

        if (error) {
            console.error("Error creating message:", error);
            return res.status(500).json({ error: (error as any).message || 'Failed to create message' });
        }

        // If senderType is 'owner', check if it's a command for AI to handle
        if (senderType === 'owner') {
            // Get thread info
            const { data: thread } = await dbClient
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
            const { data: thread } = await dbClient
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
    } catch (e: any) {
        console.error("Error during sending message:", e);
        return res.status(500).json({ error: e.message });
    }
});

// POST /messages/thread/:threadId/mark-read-owner - Mark messages as read by owner
router.post("/thread/:threadId/mark-read-owner", async (req: Request, res: Response) => {
    try {
        const { threadId } = req.params;

        const { error } = await dbClient
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
    } catch (e: any) {
        console.error("Error during mark-read-owner:", e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /messages/owner/threads - Get all threads for owner's shop(s)
router.get("/owner/threads", async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Get shop IDs owned by this user
        const { data: shops, error: shopsError } = await dbClient
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

        const shopIds = shops.map((s: any) => s.id);

        // Get threads for owner's shops (both owner and customer types)
        const { data: threads, error: threadsError } = await dbClient
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
        const threadsWithDetails = await Promise.all(
            (Array.isArray(threads) ? threads : []).map(async (thread: any) => {
                // Get unread count from view
                const { data: unreadData } = await dbClient
                    .from("shop_owner_unread_counts")
                    .select("unread_count")
                    .eq("shop_id", thread.shop_id)
                    .eq("thread_id", thread.id)
                    .single();

                // Get last message
                const { data: lastMessage } = await dbClient
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
                    unreadCount: unreadData?.unread_count || 0,
                    lastMessageAt: lastMessage?.created_at || thread.updated_at,
                    lastMessagePreview: lastMessage?.content?.substring(0, 100) || null,
                    lastMessageFrom: lastMessage?.sender_type || null,
                };
            })
        );

        return res.json(threadsWithDetails);
    } catch (e: any) {
        console.error("Error during fetching owner threads:", e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /messages/owner/unread-summary - Get total unread count for owner
router.get("/owner/unread-summary", async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Get shop IDs owned by this user
        const { data: shops, error: shopsError } = await dbClient
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

        const shopIds = shops.map((s: any) => s.id);

        // Get unread counts from view
        const { data: unreadCounts, error: countsError } = await dbClient
            .from("shop_owner_unread_counts")
            .select("unread_count")
            .in("shop_id", shopIds);

        if (countsError) {
            console.error("Error fetching unread counts:", countsError);
            return res.status(500).json({ error: countsError.message });
        }

        const totalUnread = (Array.isArray(unreadCounts) ? unreadCounts : [])
            .reduce((sum: number, item: any) => sum + (item.unread_count || 0), 0);

        return res.json({ unreadCount: totalUnread });
    } catch (e: any) {
        console.error("Error during fetching unread summary:", e);
        return res.status(500).json({ error: e.message });
    }
});

// Legacy endpoints (keep for backward compatibility)
router.get("/", async (req: Request, res: Response) => {
    try {
        const shopId = req.query.shop_id as string;
        const bookingId = req.query.booking_id as string | undefined;

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

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching messages:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.json(Array.isArray(data) ? data : []);
    } catch (e: any) {
        console.error("Error during fetching messages:", e);
        return res.status(500).json({ error: e.message });
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const { shop_id, booking_id, sender_type, message, language_code } = req.body;

        if (!shop_id || !sender_type || !message) {
            return res.status(400).json({ error: "shop_id, sender_type, and message are required" });
        }

        const { data, error } = await dbClient
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
    } catch (e: any) {
        console.error("Error during creating message:", e);
        return res.status(500).json({ error: e.message });
    }
});

// POST /messages/customer/start-thread - Start or find thread for customer
router.post("/customer/start-thread", async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const { shopId, bookingId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!shopId) {
            return res.status(400).json({ error: "shopId is required" });
        }

        // Get customer profile
        const { data: customerProfile } = await dbClient
            .from("customer_profiles")
            .select("id")
            .eq("customer_auth_id", userId)
            .single();

        if (!customerProfile) {
            return res.status(404).json({ error: "Customer profile not found" });
        }

        // Try to find existing thread
        let query = dbClient
            .from("shop_threads")
            .select("*")
            .eq("shop_id", shopId)
            .eq("customer_id", customerProfile.id);

        if (bookingId) {
            query = query.eq("booking_id", bookingId);
        }

        const { data: existingThreads, error: findError } = await query;

        if (findError) {
            console.error("Error finding thread:", findError);
            return res.status(500).json({ error: findError.message });
        }

        // If thread exists, return it
        if (existingThreads && existingThreads.length > 0) {
            const thread = existingThreads[0];
            return res.json({
                id: thread.id,
                threadId: thread.id,
                shopId: thread.shop_id,
                bookingId: thread.booking_id,
            });
        }

        // Create new thread
        const { data: newThread, error: insertError } = await dbClient
            .from("shop_threads")
            .insert([{
                shop_id: shopId,
                booking_id: bookingId || null,
                customer_id: customerProfile.id,
            }])
            .select()
            .single();

        if (insertError) {
            console.error("Error creating thread:", insertError);
            return res.status(500).json({ error: insertError.message });
        }

        return res.json({
            id: newThread.id,
            threadId: newThread.id,
            shopId: newThread.shop_id,
            bookingId: newThread.booking_id,
        });
    } catch (e: any) {
        console.error("Error during customer start-thread:", e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /messages/booking/:bookingId/thread - Get or create thread for a booking
router.get("/booking/:bookingId/thread", async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const { bookingId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Get booking details
        const { data: booking, error: bookingError } = await dbClient
            .from("bookings")
            .select(`
                id,
                shop_id,
                customer_profile_id,
                customer_id,
                shops:shop_id (id, name, owner_user_id)
            `)
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Get customer profile
        const { data: customerProfile } = await dbClient
            .from("customer_profiles")
            .select("id, customer_auth_id")
            .eq("customer_auth_id", userId)
            .maybeSingle();

        // Verify access
        const shop = booking.shops as any;
        const isOwner = shop?.owner_user_id === userId;
        const isCustomer = customerProfile && (
            booking.customer_profile_id === customerProfile.id ||
            booking.customer_id === customerProfile.id
        );

        if (!isOwner && !isCustomer) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Try to find existing thread
        const { data: existingThread } = await dbClient
            .from("shop_threads")
            .select("*")
            .eq("shop_id", booking.shop_id)
            .eq("booking_id", bookingId)
            .maybeSingle();

        if (existingThread) {
            return res.json({
                id: existingThread.id,
                threadId: existingThread.id,
                shopId: existingThread.shop_id,
                bookingId: existingThread.booking_id,
            });
        }

        // Create new thread
        const customerId = customerProfile?.id || booking.customer_profile_id || booking.customer_id;
        const { data: newThread, error: insertError } = await dbClient
            .from("shop_threads")
            .insert([{
                shop_id: booking.shop_id,
                booking_id: bookingId,
                customer_id: customerId || null,
            }])
            .select()
            .single();

        if (insertError) {
            console.error("Error creating thread:", insertError);
            return res.status(500).json({ error: insertError.message });
        }

        return res.json({
            id: newThread.id,
            threadId: newThread.id,
            shopId: newThread.shop_id,
            bookingId: newThread.booking_id,
        });
    } catch (e: any) {
        console.error("Error during booking thread creation:", e);
        return res.status(500).json({ error: e.message });
    }
});

// PATCH /messages/thread/:threadId/takeover - Toggle owner takeover
router.patch("/thread/:threadId/takeover", async (req: Request, res: Response) => {
    try {
        const { threadId } = req.params;
        const { takenOver } = req.body;

        if (typeof takenOver !== 'boolean') {
            return res.status(400).json({ error: "takenOver must be a boolean" });
        }

        const { data, error } = await dbClient
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
    } catch (e: any) {
        console.error("Error during takeover toggle:", e);
        return res.status(500).json({ error: e.message });
    }
});

export default router;


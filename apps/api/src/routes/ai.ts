// apps/api/src/routes/ai.ts
// AI chat endpoint for booking-related conversations

import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { createBookingFromAi, getShopDetails, getServiceDetails, getStaffDetails, getShopServices, getShopStaff } from "../services/bookingService";
import { checkTimeSlotAvailability, findAvailableSlots } from "../services/availabilityService";
import { getCustomerHistory, generatePersonalizedGreeting, findOrCreateCustomer, getCustomerLanguage, updateCustomerLanguage } from "../services/customerService";
import { detectLanguage } from "../services/languageDetectionService";
import { generateMultilingualResponse } from "../services/multilingualService";
import { parseCalendarCommand, addShopHolidays, removeShopHolidays, getShopHolidays, isShopHoliday } from "../services/calendarService";
import { buildAIContext } from "../services/aiContextService";
import { bookVerifiedShopAction } from "../services/aiActionsService";

const router = Router();
const dbClient = supabaseAdmin || supabase;

// =====================================================
// GET /ai/context - SINGLE AI SOURCE OF TRUTH (MANDATORY)
// =====================================================
router.get("/context", async (req: Request, res: Response) => {
    try {
        const ctx = await buildAIContext(req);
        return res.json(ctx);
    } catch (e: any) {
        console.error("[AI] Error building AI context:", e);
        return res.status(500).json({ error: e.message || "Failed to build AI context" });
    }
});

// =====================================================
// POST /ai/actions/book - AI booking action (MANDATORY)
// =====================================================
router.post("/actions/book", async (req: Request, res: Response) => {
    try {
        const result = await bookVerifiedShopAction(req, req.body);
        if (!result.ok) {
            return res.status(result.status).json({ error: result.error, details: result.details });
        }
        return res.status(200).json(result);
    } catch (e: any) {
        console.error("[AI] Error in /ai/actions/book:", e);
        return res.status(500).json({ error: e.message || "Failed to create booking" });
    }
});

// POST /ai/chat - AI chat endpoint (legacy - uses shop_messages table)
// Supports both legacy format (source, message, shopId) and unified format (role, messages)
router.post("/chat", async (req: Request, res: Response) => {
    try {
        // Check if this is unified format (role + messages array)
        const { role, messages: messagesArray, shopId, bookingId, message, source } = req.body;
        
        // Handle unified format (role + messages array)
        if (role && messagesArray && Array.isArray(messagesArray) && messagesArray.length > 0) {
            // Get the last user message from the messages array
            const lastUserMessage = messagesArray.filter((m: any) => m.role === "user").pop();
            if (!lastUserMessage || !lastUserMessage.content?.trim()) {
                return res.status(400).json({ error: "Last message must be from user with content" });
            }
            
            const actualMessage = lastUserMessage.content.trim();
            const actualSource = role === 'customer' ? 'customer' : role === 'owner' ? 'owner' : source || 'customer';
            let actualShopId = shopId || req.body.shopContext?.shopId || null;
            
            // For customer chat without shopId, use a default shop or handle differently
            // For general customer chat (like /customer/chat), we'll use a placeholder shopId
            // This allows the chat to work but won't create shop-specific threads
            if (!actualShopId && actualSource === 'customer') {
                // Use a placeholder shopId for general customer chat
                // The chat will work but won't be linked to a specific shop
                actualShopId = '00000000-0000-0000-0000-000000000000'; // Placeholder UUID
                console.log('[AI] Customer chat without shopId - using placeholder');
            }
            
            // Use the unified format but convert to legacy format for processing
            req.body.shopId = actualShopId;
            req.body.message = actualMessage;
            req.body.source = actualSource;
        }
        
        // Now process with legacy format
        const finalShopId = req.body.shopId;
        const finalMessage = req.body.message;
        const finalSource = req.body.source;

        if (!finalShopId || !finalMessage) {
            return res.status(400).json({ error: "shopId and message are required" });
        }

        const isCustomer = finalSource === 'customer';

        // Find or create a thread for this shop/booking
        let threadId: string | null = null;
        
        if (req.body.bookingId) {
            // Try to find existing thread by bookingId
            const { data: existingThreads, error: findError } = await dbClient
                .from("shop_threads")
                .select("id")
                .eq("shop_id", finalShopId)
                .eq("booking_id", req.body.bookingId)
                .limit(1);
            
            if (!findError && existingThreads && existingThreads.length > 0) {
                threadId = existingThreads[0].id;
            }
        }
        
        if (!threadId) {
            // Try to find any thread for this shop
            const { data: shopThreads, error: findError } = await dbClient
                .from("shop_threads")
                .select("id")
                .eq("shop_id", finalShopId)
                .limit(1);
            
            if (!findError && shopThreads && shopThreads.length > 0) {
                threadId = shopThreads[0].id;
            } else {
                // Create a new thread
                const { data: newThread, error: threadError } = await dbClient
                    .from("shop_threads")
                    .insert([{
                        shop_id: finalShopId,
                        booking_id: req.body.bookingId || null,
                        customer_email: null,
                    }])
                    .select()
                    .single();
                
                if (threadError || !newThread) {
                    console.error("Error creating thread:", threadError);
                    return res.status(500).json({ error: "Failed to create message thread" });
                }
                
                threadId = newThread.id;
            }
        }

        // Load recent messages for context
        const { data: recentMessages, error: messagesError } = await dbClient
            .from("shop_messages")
            .select("*")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: false })
            .limit(10);

        if (messagesError) {
            console.error("Error fetching recent messages:", messagesError);
        }

        // Detect language using language detection service
        let languageCode = await detectLanguage(finalMessage);
        console.log(`[AI] Detected language: ${languageCode} for message: "${finalMessage.substring(0, 50)}..."`);

        // For customers: use saved preferred language, or detect from message
        if (isCustomer && threadId) {
            const { data: threadData } = await dbClient
                .from("shop_threads")
                .select("customer_email")
                .eq("id", threadId)
                .single();
            
            if (threadData?.customer_email) {
                languageCode = await getCustomerLanguage(
                    threadData.customer_email,
                    undefined,
                    finalMessage
                );
                
                // Update customer language if not set
                await updateCustomerLanguage(threadData.customer_email, languageCode);
            }
        }

        // Save customer message to shop_messages (for thread-based system)
        const { data: customerMessage, error: saveError } = await dbClient
            .from("shop_messages")
            .insert([
                {
                    thread_id: threadId,
                    sender_type: 'customer',
                    content: finalMessage,
                }
            ])
            .select()
            .single();

        if (saveError) {
            console.error("Error saving customer message:", saveError);
        }

        // Also save to customer_ai_messages for persistent history
        const customerId = req.body.customerId || req.body.customer_id || null; // Can be anonymous session ID
        try {
            await dbClient
                .from("customer_ai_messages")
                .insert([
                    {
                        customer_id: customerId,
                        shop_id: finalShopId,
                        role: 'user',
                        message: finalMessage,
                    }
                ]);
        } catch (customerMsgError) {
            console.error("Error saving to customer_ai_messages:", customerMsgError);
            // Continue even if this fails
        }

        // Check if OpenAI API key is available
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!openaiApiKey) {
            // Return a friendly stub response (multilingual)
            const stubResponse = await generateMultilingualResponse('ai_unavailable', languageCode);
            
            // Save AI response to shop_messages
            if (threadId) {
                await dbClient
                    .from("shop_messages")
                    .insert([
                        {
                            thread_id: threadId,
                            sender_type: 'ai',
                            content: stubResponse,
                        }
                    ]);
            }

            // Also save to customer_ai_messages
            const customerId = req.body.customerId || req.body.customer_id || null;
            try {
                await dbClient
                    .from("customer_ai_messages")
                    .insert([
                        {
                            customer_id: customerId,
                            shop_id: finalShopId,
                            role: 'assistant',
                            message: stubResponse,
                        }
                    ]);
            } catch (customerMsgError) {
                console.error("Error saving AI response to customer_ai_messages:", customerMsgError);
            }

            return res.json({
                response: stubResponse,
                language_code: languageCode,
            });
        }

        // Build conversation history for OpenAI
        const conversationHistory = (recentMessages || []).reverse().map((msg: any) => ({
            role: msg.sender_type === 'customer' ? 'user' : 'assistant',
            content: msg.content || msg.message, // Support both field names for backward compatibility
        }));

        // Add current message
        conversationHistory.push({
            role: 'user',
            content: finalMessage,
        });

        // Get language name for the prompt
        const languageNames: Record<string, string> = {
            'ja': 'Japanese', 'en': 'English', 'zh': 'Chinese', 'vi': 'Vietnamese',
            'pt': 'Portuguese', 'fr': 'French', 'ru': 'Russian', 'es': 'Spanish',
            'ko': 'Korean', 'th': 'Thai', 'de': 'German', 'it': 'Italian',
            'ar': 'Arabic', 'hi': 'Hindi',
        };
        const detectedLanguageName = languageNames[languageCode] || 'English';

        // STRICT AI CONTEXT BOUNDARY (legacy /ai/chat route)
        const aiContext = await buildAIContext(req);
        const currentShop = aiContext.verifiedShops.find((s) => s.shop_id === finalShopId) || null;

        if (isCustomer && !currentShop) {
            const response = await generateMultilingualResponse("no_information", languageCode);
            if (threadId) {
                await dbClient.from("shop_messages").insert([{
                    thread_id: threadId,
                    sender_type: "ai",
                    content: response,
                }]);
            }
            return res.json({ response, language_code: languageCode });
        }

        const shopName = currentShop?.name || 'Yoyaku Yo verified shop';
        const shopContext = currentShop
            ? `\n\nCURRENT SHOP (from AI context):\n- shop_id: ${currentShop.shop_id}\n- name: ${currentShop.name || ""}\n- location: ${currentShop.location || ""}\n- booking_enabled: ${currentShop.booking_enabled}\n- services: ${currentShop.services.map(s => `${s.name || s.id}`).join(", ")}`
            : '';

        const strictKnowledgeBoundary = `\n\nSTRICT AI KNOWLEDGE BOUNDARY (MANDATORY):
You are only allowed to use information provided in the AI context.
If something is not present in the context, you must say you do not know.
You may ONLY suggest or book shops listed in verifiedShops.
You may ONLY describe app features listed in app.
You MUST NOT query Supabase or invent data.\n\nAI_CONTEXT_JSON:\n${JSON.stringify(aiContext)}`;

        const systemPrompt = `You are Yoyaku Yo AI Assistant.
${shopContext}${strictKnowledgeBoundary}

CRITICAL INSTRUCTION: The user's message was detected as ${detectedLanguageName}. You MUST respond ONLY in ${detectedLanguageName}.

If asked about anything not present in AI_CONTEXT_JSON, respond: "I don't have that information."`;

        try {
            // Call OpenAI API
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...conversationHistory,
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                }),
            });

            if (!openaiResponse.ok) {
                const errorText = await openaiResponse.text();
                let errorMessage = `OpenAI API error: ${openaiResponse.status}`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = `OpenAI API error: ${openaiResponse.status} - ${errorJson.error?.message || errorText}`;
                } catch {
                    errorMessage = `OpenAI API error: ${openaiResponse.status} - ${errorText}`;
                }
                
                console.error("OpenAI API Error Details (legacy /ai/chat):", {
                    status: openaiResponse.status,
                    statusText: openaiResponse.statusText,
                    error: errorText,
                    apiKeyPresent: !!openaiApiKey,
                    apiKeyPrefix: openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'missing',
                });
                
                throw new Error(errorMessage);
            }

            const openaiData = await openaiResponse.json() as {
                choices?: Array<{
                    message?: {
                        content?: string;
                    };
                }>;
            };
            const aiResponse = openaiData.choices?.[0]?.message?.content || '';

            // Save AI response to shop_messages
            const { data: aiMessage, error: aiSaveError } = await dbClient
                .from("shop_messages")
                .insert([
                    {
                        thread_id: threadId,
                        sender_type: 'ai',
                        content: aiResponse,
                    }
                ])
                .select()
                .single();

            if (aiSaveError) {
                console.error("Error saving AI message:", aiSaveError);
            }

            // Also save to customer_ai_messages
            const customerId = req.body.customerId || req.body.customer_id || null;
            try {
                await dbClient
                    .from("customer_ai_messages")
                    .insert([
                        {
                            customer_id: customerId,
                            shop_id: finalShopId,
                            role: 'assistant',
                            message: aiResponse,
                        }
                    ]);
            } catch (customerMsgError) {
                console.error("Error saving AI response to customer_ai_messages:", customerMsgError);
            }

            // Check if AI wants to cancel or reschedule a booking
            // Simple keyword detection (can be enhanced)
            const lowerResponse = aiResponse.toLowerCase();
            const lowerMessage = finalMessage.toLowerCase();
            
            // Multilingual cancellation keyword detection
            const cancelKeywords = ['cancel', 'cancellation', 'キャンセル', '取消', '取消し', 'annuler', 'stornieren', 'cancelar'];
            if (bookingId && cancelKeywords.some(keyword => lowerResponse.includes(keyword) || lowerMessage.includes(keyword))) {
                // Update booking status to cancelled
                await dbClient
                    .from("bookings")
                    .update({ status: 'cancelled' })
                    .eq("id", bookingId);
            }

            return res.json({
                response: aiResponse,
                language_code: languageCode,
            });
        } catch (openaiError: any) {
            console.error("Error calling OpenAI:", openaiError);
            
            // Return fallback response (multilingual)
            const fallbackResponse = await generateMultilingualResponse('error_occurred', languageCode);

            // Save fallback response
            if (threadId) {
                await dbClient
                    .from("shop_messages")
                    .insert([
                        {
                            thread_id: threadId,
                            sender_type: 'ai',
                            content: fallbackResponse,
                        }
                    ]);
            }

            return res.json({
                response: fallbackResponse,
                language_code: languageCode,
            });
        }
    } catch (e: any) {
        console.error("Error during AI chat:", e);
        return res.status(500).json({ error: e.message });
    }
});

// POST /ai/chat-thread - AI chat endpoint for thread-based messages
router.post("/chat-thread", async (req: Request, res: Response) => {
    try {
        const { threadId, shopId, bookingId, message, source } = req.body;

        if (!threadId || !shopId || !message) {
            return res.status(400).json({ error: "threadId, shopId, and message are required" });
        }

        const isCustomer = source === 'customer';
        const isOwner = source === 'owner';

        // Load recent messages from thread for context
        const { data: recentMessages, error: messagesError } = await dbClient
            .from("shop_messages")
            .select("*")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: false })
            .limit(20); // Increased to get more context for booking extraction

        if (messagesError) {
            console.error("Error fetching recent messages:", messagesError);
        }

        // Get shop owner info for owner language detection
        let ownerLanguage = 'en'; // Default
        let ownerUserId: string | null = null;
        if (isOwner) {
            const { data: shop } = await dbClient
                .from("shops")
                .select("owner_user_id")
                .eq("id", shopId)
                .single();
            
            if (shop?.owner_user_id) {
                ownerUserId = shop.owner_user_id;
                const { data: owner } = await dbClient
                    .from("users")
                    .select("preferred_language")
                    .eq("id", ownerUserId)
                    .single();
                
                if (owner?.preferred_language) {
                    ownerLanguage = owner.preferred_language;
                } else {
                    // Auto-detect and save owner language on first message
                    ownerLanguage = await detectLanguage(message);
                    await dbClient
                        .from("users")
                        .update({ preferred_language: ownerLanguage })
                        .eq("id", ownerUserId);
                    console.log(`[AI] Auto-detected and saved owner language: ${ownerLanguage}`);
                }
            }
        }

        // For customers: use saved preferred language, or detect from message
        let languageCode: string;
        if (isCustomer) {
            const { data: threadData } = await dbClient
                .from("shop_threads")
                .select("customer_email")
                .eq("id", threadId)
                .single();
            
            languageCode = await getCustomerLanguage(
                threadData?.customer_email,
                undefined,
                message
            );
            
            // If customer has email, update their language if not set
            if (threadData?.customer_email && languageCode) {
                await updateCustomerLanguage(threadData.customer_email, languageCode);
            }
        } else if (isOwner) {
            languageCode = ownerLanguage;
        } else {
            // Fallback: detect from message
            languageCode = await detectLanguage(message);
        }
        
        console.log(`[AI] Using language: ${languageCode} for ${isCustomer ? 'customer' : isOwner ? 'owner' : 'user'} message: "${message.substring(0, 50)}..."`);

        // =====================================================
        // STRICT AI KNOWLEDGE BOUNDARY (MANDATORY)
        // AI must ONLY use /ai/context data (single source of truth).
        // =====================================================
        const aiContext = await buildAIContext(req);
        const currentShop = aiContext.verifiedShops.find((s) => s.shop_id === shopId) || null;

        // Customers are ONLY allowed to interact with verified shops.
        if (isCustomer && !currentShop) {
            const response = await generateMultilingualResponse("no_information", languageCode);
            await dbClient.from("shop_messages").insert([{
                thread_id: threadId,
                sender_type: "ai",
                content: response,
            }]);
            return res.json({ response, language_code: languageCode });
        }

        const shopName = currentShop?.name || "Yoyakuyo verified shop";
        const strictKnowledgeBoundary = `\n\nSTRICT AI KNOWLEDGE BOUNDARY (MANDATORY):
You are only allowed to use information provided in the AI context.
If something is not present in the context, you must say you do not know.
You may ONLY suggest or book shops listed in verifiedShops.
You may ONLY describe app features listed in app.
You MUST NOT query Supabase or invent data.\n\nAI_CONTEXT_JSON:\n${JSON.stringify(aiContext)}`;

        // Minimal shop context derived ONLY from AI context (no DB lookups here)
        const shopContext = currentShop ? `\n\nCURRENT SHOP (from AI context):
- shop_id: ${currentShop.shop_id}
- name: ${currentShop.name || ""}
- location: ${currentShop.location || ""}
- booking_enabled: ${currentShop.booking_enabled}
- services: ${currentShop.services.map(s => `${s.name || s.id}`).join(", ")}` : "";

        // Handle calendar commands for owners (before OpenAI call)
        if (isOwner) {
            const calendarCommand = await parseCalendarCommand(message, shopId, ownerLanguage);
            if (calendarCommand) {
                if (calendarCommand.action === 'list') {
                    const holidays = await getShopHolidays(shopId);
                    const holidayDates = holidays.map(h => h.date).join(', ');
                    const response = await generateMultilingualResponse(
                        'calendar_holiday_list',
                        ownerLanguage,
                        { dates: holidayDates || 'None' }
                    );
                    
                    await dbClient
                        .from("shop_messages")
                        .insert([{
                            thread_id: threadId,
                            sender_type: 'ai',
                            content: response,
                        }]);
                    
                    return res.json({ response, language_code: ownerLanguage });
                } else if (calendarCommand.action === 'add' && calendarCommand.dates.length > 0) {
                    const result = await addShopHolidays(shopId, calendarCommand.dates, calendarCommand.reason);
                    const response = await generateMultilingualResponse(
                        'calendar_holiday_added',
                        ownerLanguage,
                        { dates: calendarCommand.dates.map(d => d.toLocaleDateString()).join(', ') }
                    );
                    
                    await dbClient
                        .from("shop_messages")
                        .insert([{
                            thread_id: threadId,
                            sender_type: 'ai',
                            content: response,
                        }]);
                    
                    return res.json({ response, language_code: ownerLanguage });
                } else if (calendarCommand.action === 'remove' && calendarCommand.dates.length > 0) {
                    const result = await removeShopHolidays(shopId, calendarCommand.dates);
                    const response = await generateMultilingualResponse(
                        'calendar_holiday_removed',
                        ownerLanguage,
                        { dates: calendarCommand.dates.map(d => d.toLocaleDateString()).join(', ') }
                    );
                    
                    await dbClient
                        .from("shop_messages")
                        .insert([{
                            thread_id: threadId,
                            sender_type: 'ai',
                            content: response,
                        }]);
                    
                    return res.json({ response, language_code: ownerLanguage });
                }
            }
        }

        // Check if OpenAI API key is available
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!openaiApiKey) {
            // Return a friendly stub response (multilingual)
            const stubResponse = await generateMultilingualResponse('ai_unavailable', languageCode);
            
            // Save AI response to shop_messages
            await dbClient
                .from("shop_messages")
                .insert([{
                    thread_id: threadId,
                    sender_type: 'ai',
                    content: stubResponse,
                }]);

            return res.json({
                response: stubResponse,
                language_code: languageCode,
            });
        }

        // Check if there's already a booking for this thread
        const { data: threadData } = await dbClient
            .from("shop_threads")
            .select("booking_id, customer_email")
            .eq("id", threadId)
            .single();

        const existingBookingId = threadData?.booking_id || bookingId;

        // Services MUST come only from AI context (single source of truth).
        const availableServices = isCustomer ? (currentShop?.services || []) : [];
        const availableStaff: any[] = []; // Staff is intentionally not exposed in AI context

        // Availability is validated only via backend actions (no precomputed slot suggestions).
        const availabilityContext = '';

        // Build conversation history for OpenAI
        const conversationHistory = (recentMessages || []).reverse().map((msg: any) => ({
            role: msg.sender_type === 'customer' ? 'user' : 'assistant',
            content: msg.content,
        }));

        // Add current message
        conversationHistory.push({
            role: 'user',
            content: message,
        });

        // Check conversation history to see if name was already collected
        const conversationText = conversationHistory.map(m => m.content).join(' ');
        const hasCustomerName = /(?:my name is|i'm|i am|name is|名前は|私の名前は|me llamo|je m'appelle|ich heiße|mi chiamo)\s+([A-Za-z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u4e00-\u9fff]+)/i.test(conversationText) || 
                                /(?:what is your name|may i have your name|what should i call you|could you please tell me your name)/i.test(conversationText);
        
        const missingInfoContext = !hasCustomerName 
            ? `\n\n⚠️ CRITICAL: You have NOT asked for the customer's name yet. The customer wants to book. You MUST ask "What is your name?" RIGHT NOW as your first question. DO NOT ask about date, time, or service until you have the name.`
            : '';

        // Build context about available services and staff (multilingual)
        let servicesContext = '';
        if (availableServices.length > 0) {
            const servicesHeader = await generateMultilingualResponse('what_can_i_help', languageCode);
            servicesContext = `\n\n${servicesHeader}:\n${availableServices.map(s => `- ID: ${s.id}, ${languageCode === 'ja' ? '名前' : 'Name'}: ${s.name}`).join('\n')}`;
        }

        let staffContext = '';
        if (availableStaff.length > 0) {
            const staffHeader = await generateMultilingualResponse('what_can_i_help', languageCode);
            staffContext = `\n\n${staffHeader}:\n${availableStaff.map(s => `- ID: ${s.id}, ${languageCode === 'ja' ? '名前' : 'Name'}: ${s.first_name} ${s.last_name}`).join('\n')}`;
        }

        // Get language name for the prompt
        const languageNames: Record<string, string> = {
            'ja': 'Japanese', 'en': 'English', 'zh': 'Chinese', 'vi': 'Vietnamese',
            'pt': 'Portuguese', 'fr': 'French', 'ru': 'Russian', 'es': 'Spanish',
            'ko': 'Korean', 'th': 'Thai', 'de': 'German', 'it': 'Italian',
            'ar': 'Arabic', 'hi': 'Hindi',
        };
        const detectedLanguageName = languageNames[languageCode] || 'English';

        // Enhanced system prompt - different for owner commands vs customer
        let systemPrompt = '';
        
        if (isOwner) {
            // Owner command mode - handle cancellation/reschedule (multilingual)
            // Get customer language for owner commands
            const { data: threadForCustomerLang } = await dbClient
                .from("shop_threads")
                .select("customer_email")
                .eq("id", threadId)
                .single();
            
            const customerLangForOwner = threadForCustomerLang?.customer_email 
                ? await getCustomerLanguage(threadForCustomerLang.customer_email)
                : 'en';
            
            systemPrompt = `You are Yoyaku Yo AI Assistant. You receive instructions from shop owners to contact customers about booking cancellations or reschedules.

Owner instruction examples (owner speaks ${detectedLanguageName}):
- "Cancel booking BK-123 because we're closed"
- "Reschedule booking BK-456 to next week, reason: staff unavailable"
- "Cancel booking because customer requested it"

Your role:
1. Understand owner's instruction (booking ID, reason, action) - owner is speaking ${detectedLanguageName}
2. Contact customer in ${customerLangForOwner} politely (customer's preferred language)
3. Apologize and explain the reason in ${customerLangForOwner}
4. Offer customer options (reschedule or cancel) in ${customerLangForOwner}
5. Handle customer's response appropriately

IMPORTANT: 
- Respond to the OWNER in ${detectedLanguageName} (the owner's preferred language)
- Contact the CUSTOMER in ${customerLangForOwner} (the customer's preferred language)
- Use the contact_customer_about_booking function to send messages to customers`;
        } else {
            // Customer-facing mode: MUST follow strict AI context boundary
            systemPrompt = isCustomer
                ? `You are Yoyaku Yo AI Assistant.
${shopContext}${strictKnowledgeBoundary}${servicesContext}${availabilityContext}${missingInfoContext}

CRITICAL RESPONSE LANGUAGE: The customer's message was detected as ${detectedLanguageName}. You MUST respond ONLY in ${detectedLanguageName}.

MANDATORY RULES:
- You can ONLY use information from AI_CONTEXT_JSON.
- If something is not present in AI_CONTEXT_JSON, you MUST say: "I don't have that information."
- You may ONLY suggest or book shops listed in verifiedShops.
- You may ONLY describe app features listed in app.
- You MUST NOT query Supabase, search for shops, or invent shop names/services/features.

BOOKING RULES (MANDATORY):
- Ask for the customer's name FIRST when they want to book.
- Then collect: service (must match one of the services in AI context), date/time (future), optional staff.
- When the customer confirms, you MUST call the ai_actions_book function to create the booking.
- You MUST NOT claim a booking is confirmed unless you called ai_actions_book and it succeeded.`
                : `You are Yoyaku Yo AI Assistant.
${strictKnowledgeBoundary}

CRITICAL RESPONSE LANGUAGE: The user's message was detected as ${detectedLanguageName}. You MUST respond ONLY in ${detectedLanguageName}.

If asked about anything not present in AI_CONTEXT_JSON, respond: "I don't have that information."`;
        }

        // Define OpenAI functions for owner commands (cancel/reschedule) - multilingual descriptions
        const cancelBookingFunction = {
            name: "cancel_booking",
            description: "Cancels a booking. Contacts customer based on owner's instruction and executes cancellation if customer agrees.",
            parameters: {
                type: "object",
                properties: {
                    bookingId: {
                        type: "string",
                        description: "Booking ID to cancel (required)"
                    },
                    reason: {
                        type: "string",
                        description: "Reason for cancellation (required)"
                    },
                    customerAgreed: {
                        type: "boolean",
                        description: "Whether customer has agreed to cancellation (required)"
                    }
                },
                required: ["bookingId", "reason", "customerAgreed"]
            }
        };

        const rescheduleBookingFunction = {
            name: "reschedule_booking",
            description: "Reschedules a booking. Contacts customer based on owner's instruction and suggests new date/time.",
            parameters: {
                type: "object",
                properties: {
                    bookingId: {
                        type: "string",
                        description: "Booking ID to reschedule (required)"
                    },
                    newStartTime: {
                        type: "string",
                        description: "New start time in ISO 8601 format (required)"
                    },
                    newEndTime: {
                        type: "string",
                        description: "New end time in ISO 8601 format (required)"
                    },
                    reason: {
                        type: "string",
                        description: "Reason for rescheduling (required)"
                    },
                    customerAgreed: {
                        type: "boolean",
                        description: "Whether customer has agreed to reschedule (required)"
                    }
                },
                required: ["bookingId", "newStartTime", "newEndTime", "reason", "customerAgreed"]
            }
        };

        const contactCustomerFunction = {
            name: "contact_customer_about_booking",
            description: "Contacts customer about booking cancellation or reschedule. Apologizes, explains reason, and offers options. Message will be sent in customer's preferred language.",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["cancel", "reschedule"],
                        description: "Action to take: cancel or reschedule (required)"
                    },
                    reason: {
                        type: "string",
                        description: "Reason for the action (required)"
                    },
                    message: {
                        type: "string",
                        description: "Message to send to customer in their preferred language (required)"
                    }
                },
                required: ["action", "reason", "message"]
            }
        };

        // Define OpenAI function for booking action (MANDATORY)
        // AI MUST book only by calling this backend action (no direct DB booking).
        const bookingFunction = {
            name: "ai_actions_book",
            description: `MANDATORY: Call this function when (and only when) the customer confirms they want to book.

STRICT RULES:
- You may ONLY use shop_id values that exist in AI_CONTEXT_JSON.verifiedShops.
- You may ONLY use service_id values that exist under that shop in AI_CONTEXT_JSON.verifiedShops[].services.
- If you don't have the required IDs in AI_CONTEXT_JSON, you MUST say: "I don't have that information."`,
            parameters: {
                type: "object",
                properties: {
                    shop_id: {
                        type: "string",
                        description: "Shop ID from AI_CONTEXT_JSON.verifiedShops (required)"
                    },
                    service_id: {
                        type: "string",
                        description: "Service ID from AI_CONTEXT_JSON for that shop (required)"
                    },
                    staff_id: {
                        type: "string",
                        description: "Staff ID (optional; if not provided, any available staff may be used)"
                    },
                    start_time: {
                        type: "string",
                        description: "Start time in ISO 8601 format (required; must be in the future)"
                    },
                    end_time: {
                        type: "string",
                        description: "End time in ISO 8601 format (optional; if omitted, backend derives from service duration)"
                    },
                    customer_name: {
                        type: "string",
                        description: "Customer name explicitly provided by the customer (required)"
                    },
                    customer_email: {
                        type: "string",
                        description: "Customer email (optional; do NOT ask for it)"
                    },
                    customer_phone: {
                        type: "string",
                        description: "Customer phone (optional; do NOT ask for it)"
                    },
                    customerConfirmed: {
                        type: "boolean",
                        description: "MUST be true when customer confirms (yes/ok/confirm/etc). Only call when true."
                    }
                },
                required: ["shop_id", "service_id", "start_time", "customer_name", "customerConfirmed"]
            }
        };

        try {
            // Call OpenAI API with function calling (only for customer-facing conversations)
            const requestBody: any = {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory,
                ],
                temperature: 0.7,
                max_tokens: 500,
            };

            // Add function calling based on source
            if (isOwner && bookingId) {
                // Owner commands: add cancel/reschedule/contact functions
                requestBody.functions = [cancelBookingFunction, rescheduleBookingFunction, contactCustomerFunction];
                requestBody.function_call = "auto";
            } else if (isCustomer) {
                // Customer conversations: booking must go through backend action only
                requestBody.functions = [bookingFunction];
                requestBody.function_call = "auto";
            }

            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!openaiResponse.ok) {
                const errorText = await openaiResponse.text();
                let errorMessage = `OpenAI API error: ${openaiResponse.status}`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = `OpenAI API error: ${openaiResponse.status} - ${errorJson.error?.message || errorText}`;
                } catch {
                    errorMessage = `OpenAI API error: ${openaiResponse.status} - ${errorText}`;
                }
                
                console.error("OpenAI API Error Details (/ai/chat-thread):", {
                    status: openaiResponse.status,
                    statusText: openaiResponse.statusText,
                    error: errorText,
                    apiKeyPresent: !!openaiApiKey,
                    apiKeyPrefix: openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'missing',
                });
                
                throw new Error(errorMessage);
            }

            const openaiData = await openaiResponse.json() as {
                choices?: Array<{
                    message?: {
                        content?: string;
                        function_call?: {
                            name?: string;
                            arguments?: string;
                        };
                    };
                }>;
            };

            const choice = openaiData.choices?.[0];
            const aiMessage = choice?.message;
            let aiResponse = aiMessage?.content || '';
            let bookingCreated = false;
            let createdBookingId: string | null = null;

            // Add logging for debugging
            console.log('[AI] AI response:', aiResponse?.substring(0, 200));
            console.log('[AI] Function call:', aiMessage?.function_call ? {
                name: aiMessage.function_call.name,
                hasArgs: !!aiMessage.function_call.arguments
            } : 'None');
            console.log('[AI] Is customer:', isCustomer);
            console.log('[AI] Functions available:', isCustomer ? 'ai_actions_book' : 'none');

            // VALIDATION: Check if AI is trying to book without asking for name first
            if (isCustomer) {
                const conversationText = conversationHistory.map(m => m.content).join(' ');
                const hasCustomerName = /(?:my name is|i'm|i am|name is|名前は|私の名前は|me llamo|je m'appelle|ich heiße|mi chiamo)\s+([A-Za-z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u4e00-\u9fff]+)/i.test(conversationText);
                const bookingIntent = /(?:book|appointment|schedule|booking)/i.test(message);
                const aiClaimedBooking = /(?:successfully booked|booked you|booked in|appointment is booked|booking confirmed|I have successfully)/i.test(aiResponse);
                
                // If customer wants to book but name wasn't asked, force AI to ask for name
                if (bookingIntent && !hasCustomerName && !aiMessage?.function_call) {
                    // Override AI response to ask for name
                    aiResponse = `What is your name?`;
                    console.log('[AI] ⚠️ FORCED: AI tried to proceed without asking for name. Overriding response to ask for name.');
                }
                
                // If AI claimed it booked but didn't call the function, prevent false claims
                if (aiClaimedBooking && aiMessage?.function_call?.name !== 'ai_actions_book') {
                    // Check if we actually have all required info
                    if (!hasCustomerName) {
                        aiResponse = `What is your name?`;
                        console.log('[AI] ⚠️ FORCED: AI claimed booking without name. Overriding to ask for name.');
                    } else {
                        // Has name but didn't call function - ask for confirmation properly
                        aiResponse = await generateMultilingualResponse('please_confirm', languageCode);
                        console.log('[AI] ⚠️ FORCED: AI claimed booking but function was not called. Overriding response.');
                    }
                }
            }

            // Handle owner command functions
            if (isOwner && aiMessage?.function_call) {
                const functionName = aiMessage.function_call.name;
                const functionArgs = aiMessage.function_call.arguments ? JSON.parse(aiMessage.function_call.arguments) : {};
                
                if (functionName === 'contact_customer_about_booking') {
                    // Send message to customer in their language
                    const { data: threadForLang } = await dbClient
                        .from("shop_threads")
                        .select("customer_email")
                        .eq("id", threadId)
                        .single();
                    
                    const customerLang = threadForLang?.customer_email 
                        ? await getCustomerLanguage(threadForLang.customer_email)
                        : 'en'; // Default to English
                    
                    const customerMessage = functionArgs.message || await generateMultilingualResponse(
                        functionArgs.action === 'cancel' ? 'cancellation_message' : 'reschedule_message',
                        customerLang,
                        { 
                            action: functionArgs.action === 'cancel' ? 'cancel' : 'reschedule',
                            reason: functionArgs.reason || 'unforeseen circumstances'
                        }
                    );
                    
                    await dbClient
                        .from("shop_messages")
                        .insert([{
                            thread_id: threadId,
                            sender_type: 'ai',
                            content: customerMessage,
                            read_by_owner: true,
                            read_by_customer: false,
                        }]);
                    
                    // Response to owner in their language
                    const ownerResponse = await generateMultilingualResponse('what_can_i_help', ownerLanguage);
                    const languageNames: Record<string, string> = {
                        'ja': 'Japanese', 'en': 'English', 'zh': 'Chinese', 'vi': 'Vietnamese',
                        'pt': 'Portuguese', 'fr': 'French', 'ru': 'Russian', 'es': 'Spanish',
                        'ko': 'Korean', 'th': 'Thai', 'de': 'German', 'it': 'Italian',
                        'ar': 'Arabic', 'hi': 'Hindi',
                    };
                    const customerLangName = languageNames[customerLang] || customerLang;
                    aiResponse = `${ownerResponse} - I've contacted the customer in ${customerLangName} about the ${functionArgs.action}. Waiting for their response.`;
                } else if (functionName === 'cancel_booking' && functionArgs.customerAgreed && bookingId) {
                    // Cancel the booking
                    await dbClient
                        .from('bookings')
                        .update({ status: 'cancelled' })
                        .eq('id', bookingId);
                    
                    // Response to owner in their language
                    const ownerCancelMsg = await generateMultilingualResponse('what_can_i_help', ownerLanguage);
                    aiResponse = `${ownerCancelMsg} - Booking ${bookingId} has been cancelled. Customer has been notified.`;
                } else if (functionName === 'reschedule_booking' && functionArgs.customerAgreed && bookingId) {
                    // Reschedule the booking
                    await dbClient
                        .from('bookings')
                        .update({
                            start_time: functionArgs.newStartTime,
                            end_time: functionArgs.newEndTime,
                        })
                        .eq('id', bookingId);
                    
                    // Response to owner in their language
                    const ownerRescheduleMsg = await generateMultilingualResponse('what_can_i_help', ownerLanguage);
                    aiResponse = `${ownerRescheduleMsg} - Booking ${bookingId} has been rescheduled to ${functionArgs.newStartTime}. Customer has been notified.`;
                }
            }
            
            // Check if OpenAI wants to call the ai_actions_book function (MANDATORY booking path)
            if (aiMessage?.function_call?.name === 'ai_actions_book' && aiMessage.function_call.arguments) {
                console.log('[AI] ✅ ai_actions_book function called by AI');
                try {
                    const functionArgs = JSON.parse(aiMessage.function_call.arguments);

                    if (!functionArgs.customerConfirmed) {
                        aiResponse = await generateMultilingualResponse('please_confirm', languageCode);
                    } else {
                        const actionResult = await bookVerifiedShopAction(req, {
                            shop_id: functionArgs.shop_id || shopId,
                            service_id: functionArgs.service_id,
                            staff_id: functionArgs.staff_id || null,
                            start_time: functionArgs.start_time,
                            end_time: functionArgs.end_time || null,
                            customer_name: functionArgs.customer_name,
                            customer_email: functionArgs.customer_email || null,
                            customer_phone: functionArgs.customer_phone || null,
                            notes: `Created via AI chat-thread (${threadId})`,
                        });

                        if (actionResult.ok) {
                            bookingCreated = true;
                            createdBookingId = actionResult.booking.id;

                            // Update thread with booking_id
                            await dbClient
                                .from("shop_threads")
                                .update({ booking_id: createdBookingId })
                                .eq("id", threadId);

                            // Resolve service name from AI context for confirmation text (no DB lookups)
                            const bookedShop = aiContext.verifiedShops.find(s => s.shop_id === actionResult.booking.shop_id) || null;
                            const bookedService = bookedShop?.services.find(s => s.id === actionResult.booking.service_id) || null;

                            const startDate = new Date(actionResult.booking.start_time);
                            const endDate = new Date(actionResult.booking.end_time);
                            const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            const timeStr = `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

                            aiResponse = await generateMultilingualResponse(
                                'booking_created_details',
                                languageCode,
                                {
                                    bookingId: createdBookingId || '',
                                    serviceName: bookedService?.name || 'Service',
                                    dateTime: `${dateStr} ${timeStr}`,
                                    staffName: actionResult.booking.staff_id ? 'Assigned' : 'Not specified',
                                    customerName: functionArgs.customer_name
                                }
                            );
                        } else {
                            if (actionResult.status === 409) {
                                aiResponse = await generateMultilingualResponse('booking_creation_error', languageCode, { error: actionResult.error });
                            } else {
                                aiResponse = await generateMultilingualResponse('booking_creation_error', languageCode, { error: actionResult.error });
                            }
                        }
                    }
                } catch (parseError: any) {
                    console.error("Error handling ai_actions_book:", parseError);
                    aiResponse = await generateMultilingualResponse('error_occurred', languageCode);
                }
            }
            
            // NOTE: DB shop search is intentionally disabled.
            // The AI may only suggest shops from AI_CONTEXT_JSON.verifiedShops.

            // Final validation: If AI response claims booking was successful but function wasn't called, override it
            if (isCustomer && !bookingCreated) {
                const claimedBooking = /(?:successfully booked|booked you|booked in|appointment is booked|booking confirmed|I have successfully|Great! I have successfully)/i.test(aiResponse);
                if (claimedBooking) {
                    console.log('[AI] ⚠️ WARNING: AI claimed booking but function was not called. Overriding response.');
                    // Check if we have name
                    const conversationText = conversationHistory.map(m => m.content).join(' ');
                    const hasCustomerName = /(?:my name is|i'm|i am|name is|名前は|私の名前は|me llamo|je m'appelle|ich heiße|mi chiamo)\s+([A-Za-z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u4e00-\u9fff]+)/i.test(conversationText);
                    
                    if (!hasCustomerName) {
                        aiResponse = `What is your name?`;
                    } else {
                        aiResponse = await generateMultilingualResponse('please_confirm', languageCode) + ' ' + await generateMultilingualResponse('booking_needs_info', languageCode);
                    }
                }
            }

            // If no function call was made, use the regular AI response
            if (!aiResponse && !aiMessage?.function_call) {
                aiResponse = await generateMultilingualResponse('error_occurred', languageCode);
            }

            // Save AI response to shop_messages (with booking_id if booking was created)
            const messageData: any = {
                thread_id: threadId,
                sender_type: 'ai',
                content: aiResponse,
            };

            if (createdBookingId) {
                messageData.booking_id = createdBookingId;
            }

            const { data: aiMessageData, error: aiSaveError } = await dbClient
                .from("shop_messages")
                .insert([messageData])
                .select()
                .single();

            if (aiSaveError) {
                console.error("Error saving AI message:", aiSaveError);
            }

            // Check if AI wants to cancel or reschedule a booking (legacy support)
            if (existingBookingId && !bookingCreated) {
                const lowerResponse = aiResponse.toLowerCase();
                const lowerMessage = message.toLowerCase();
                
                // Multilingual cancellation keyword detection
                const cancelKeywords = ['cancel', 'cancellation', 'キャンセル', '取消', '取消し', 'annuler', 'stornieren', 'cancelar'];
                if (cancelKeywords.some(keyword => lowerResponse.includes(keyword) || lowerMessage.includes(keyword))) {
                    // Update booking status to cancelled
                    await dbClient
                        .from("bookings")
                        .update({ status: 'cancelled' })
                        .eq("id", existingBookingId);
                }
            }

            return res.json({
                response: aiResponse,
                language_code: languageCode,
                bookingCreated: bookingCreated,
                bookingId: createdBookingId,
            });
        } catch (openaiError: any) {
            console.error("Error calling OpenAI:", openaiError);
            
            // Return fallback response (multilingual)
            const fallbackResponse = await generateMultilingualResponse('error_occurred', languageCode);

            // Save fallback response
            await dbClient
                .from("shop_messages")
                .insert([{
                    thread_id: threadId,
                    sender_type: 'ai',
                    content: fallbackResponse,
                }]);

            return res.json({
                response: fallbackResponse,
                language_code: languageCode,
            });
        }
    } catch (e: any) {
        console.error("Error during AI chat-thread:", e);
        return res.status(500).json({ error: e.message });
    }
});

// POST /ai/translate - Translate text between Japanese and English
router.post("/translate", async (req: Request, res: Response) => {
    try {
        const { text, targetLanguage, sourceLanguage } = req.body;

        if (!text) {
            return res.status(400).json({ error: "text is required" });
        }

        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            // Fallback: return original text if no API key
            return res.json({
                translatedText: text,
                sourceLanguage: sourceLanguage || 'auto',
                targetLanguage: targetLanguage || 'en',
            });
        }

        // Auto-detect source language if not provided
        let sourceLang = sourceLanguage;
        if (!sourceLang || sourceLang === 'auto') {
            sourceLang = await detectLanguage(text);
        }

        // Use target language or default to English
        const targetLang = targetLanguage || 'en';

        const languageNames: Record<string, string> = {
            'ja': 'Japanese', 'en': 'English', 'zh': 'Chinese', 'vi': 'Vietnamese',
            'pt': 'Portuguese', 'fr': 'French', 'ru': 'Russian', 'es': 'Spanish',
            'ko': 'Korean', 'th': 'Thai', 'de': 'German', 'it': 'Italian',
            'ar': 'Arabic', 'hi': 'Hindi',
        };

        const sourceLangName = languageNames[sourceLang] || sourceLang;
        const targetLangName = languageNames[targetLang] || targetLang;

        try {
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. Maintain the tone and meaning. Only return the translated text, nothing else.`,
                        },
                        {
                            role: 'user',
                            content: text,
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: 500,
                }),
            });

            if (!openaiResponse.ok) {
                console.error("OpenAI translation error:", openaiResponse.status);
                return res.json({
                    translatedText: text,
                    sourceLanguage: sourceLanguage || 'auto',
                    targetLanguage: targetLang,
                    error: 'Translation service unavailable',
                });
            }

            const openaiData = await openaiResponse.json() as {
                choices?: Array<{
                    message?: {
                        content?: string;
                    };
                }>;
            };

            const translatedText = openaiData.choices?.[0]?.message?.content?.trim() || text;

            return res.json({
                translatedText,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
            });
        } catch (error: any) {
            console.error("Error calling OpenAI for translation:", error);
            return res.json({
                translatedText: text,
                sourceLanguage: sourceLanguage || 'auto',
                targetLanguage: targetLang,
                error: error.message,
            });
        }
    } catch (e: any) {
        console.error("Error during translation:", e);
        return res.status(500).json({ error: e.message });
    }
});

export default router;


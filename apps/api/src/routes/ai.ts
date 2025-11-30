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

const router = Router();
const dbClient = supabaseAdmin || supabase;

// POST /ai/chat - AI chat endpoint (legacy - uses shop_messages table)
router.post("/chat", async (req: Request, res: Response) => {
    try {
        const { shopId, bookingId, message, source } = req.body;

        if (!shopId || !message) {
            return res.status(400).json({ error: "shopId and message are required" });
        }

        const isCustomer = source === 'customer';

        // Find or create a thread for this shop/booking
        let threadId: string | null = null;
        
        if (bookingId) {
            // Try to find existing thread by bookingId
            const { data: existingThreads, error: findError } = await dbClient
                .from("shop_threads")
                .select("id")
                .eq("shop_id", shopId)
                .eq("booking_id", bookingId)
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
                .eq("shop_id", shopId)
                .limit(1);
            
            if (!findError && shopThreads && shopThreads.length > 0) {
                threadId = shopThreads[0].id;
            } else {
                // Create a new thread
                const { data: newThread, error: threadError } = await dbClient
                    .from("shop_threads")
                    .insert([{
                        shop_id: shopId,
                        booking_id: bookingId || null,
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
        let languageCode = await detectLanguage(message);
        console.log(`[AI] Detected language: ${languageCode} for message: "${message.substring(0, 50)}..."`);

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
                    message
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
                    content: message,
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
                        shop_id: shopId,
                        role: 'user',
                        message: message,
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
                            shop_id: shopId,
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
            content: message,
        });

        // Get language name for the prompt
        const languageNames: Record<string, string> = {
            'ja': 'Japanese', 'en': 'English', 'zh': 'Chinese', 'vi': 'Vietnamese',
            'pt': 'Portuguese', 'fr': 'French', 'ru': 'Russian', 'es': 'Spanish',
            'ko': 'Korean', 'th': 'Thai', 'de': 'German', 'it': 'Italian',
            'ar': 'Arabic', 'hi': 'Hindi',
        };
        const detectedLanguageName = languageNames[languageCode] || 'English';

        // Fetch shop details for context (legacy /ai/chat route)
        const shop = await getShopDetails(shopId);
        const shopName = shop?.name || 'our shop';
        const shopCategory = shop?.category || 'business';
        const shopDescription = shop?.description || '';
        const shopLocation = shop?.address || shop?.city || shop?.prefecture || '';

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

        // Build greeting with shop context
        const shopGreeting = shop && shopName && shopCategory
            ? `Hello 👋, welcome to ${shopName} — a ${shopCategory}! How can I help you today?`
            : 'Hello 👋, how can I help you today?';

        // System prompt - always in English with language instruction (no hard-coded Japanese)
        const systemPrompt = isCustomer
            ? `You are Yoyaku Yo AI Assistant for ${shopName}${shopCategory ? ` (a ${shopCategory})` : ''}. You provide customer-facing support for booking-related conversations: confirming appointments, suggesting available times, rescheduling, and accepting cancellations. Be friendly and helpful in your responses.${shopContext}

IMPORTANT: When greeting a new customer, use this greeting: "${shopGreeting}"

CRITICAL INSTRUCTION: The customer's message was detected as ${detectedLanguageName}. You MUST respond ONLY in ${detectedLanguageName}. Do NOT use Japanese unless the customer is speaking Japanese. Do NOT use any other language. Match the customer's language exactly: ${detectedLanguageName}.

You MUST NOT suggest prices, change prices, or show revenue. You MUST NOT discuss shop revenue, performance, or analytics.`
            : `You are Yoyaku Yo AI Assistant for ${shopName}${shopCategory ? ` (a ${shopCategory})` : ''}. You ONLY handle booking-related conversations: confirming appointments, suggesting available times, rescheduling, and accepting cancellations.${shopContext}

CRITICAL INSTRUCTION: The user's message was detected as ${detectedLanguageName}. You MUST respond ONLY in ${detectedLanguageName}. Do NOT use Japanese unless the user is speaking Japanese. Do NOT use any other language. Match the user's language exactly: ${detectedLanguageName}.

You MUST NOT suggest prices, change prices, or show revenue. You MUST NOT discuss shop revenue, performance, or analytics. If the user talks about something outside booking and scheduling, politely redirect them back to booking-related topics.`;

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
                            shop_id: shopId,
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
            const lowerMessage = message.toLowerCase();
            
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

        // Fetch shop details for context (MUST use only Supabase data - no hallucinations)
        const shop = await getShopDetails(shopId);
        const shopName = shop?.name || 'our shop';
        const shopCategory = shop?.category || 'business';
        const shopDescription = shop?.description || '';
        const shopAddress = shop?.address || '';
        const shopPhone = shop?.phone || '';
        const shopCity = shop?.city || '';
        const shopPrefecture = shop?.prefecture || '';
        const shopLocation = shopAddress || shopCity || shopPrefecture || '';
        const openingHours = shop?.opening_hours || null;

        // Get services and staff for this shop (ONLY from Supabase - no assumptions)
        const shopServices = await getShopServices(shopId);
        const shopStaff = await getShopStaff(shopId);

        // Build comprehensive shop context string (MANDATORY for every message)
        let shopContext = '';
        if (shop) {
          shopContext = `\n\nSHOP CONTEXT (MANDATORY - Include in every response):
- Shop Name: ${shopName}
- Category: ${shopCategory}`;
          if (shopDescription) {
            shopContext += `\n- Description: ${shopDescription}`;
          }
          if (shopAddress) {
            shopContext += `\n- Address: ${shopAddress}`;
          }
          if (shopCity) {
            shopContext += `\n- City: ${shopCity}`;
          }
          if (shopPrefecture) {
            shopContext += `\n- Prefecture: ${shopPrefecture}`;
          }
          if (shopPhone) {
            shopContext += `\n- Phone: ${shopPhone}`;
          }
          if (openingHours) {
            shopContext += `\n- Working Hours: ${JSON.stringify(openingHours)}`;
          }
          if (shopServices.length > 0) {
            shopContext += `\n- Services: ${shopServices.map(s => s.name).join(', ')}`;
          }
          if (shopStaff.length > 0) {
            shopContext += `\n- Staff: ${shopStaff.map(s => `${s.first_name} ${s.last_name}`).join(', ')}`;
          }
        }

        // CRITICAL: AI must ONLY use data from Supabase - no hallucinations
        const noHallucinationRule = `\n\n⚠️ CRITICAL DATA RULES:
- You MUST ONLY use shop data from Supabase database - NO assumptions, NO invented businesses
- If customer asks about other shops (e.g., "find a barber", "recommend a hair salon"), you MUST use the find_shops function to query Supabase
- If no shops found in Supabase → respond: "No available shops found in your area"
- DO NOT invent shop names, addresses, or services
- DO NOT suggest shops that don't exist in the database
- ALWAYS verify shop data exists in Supabase before mentioning it
- You are ONLY representing ${shopName} (shop ID: ${shopId}) - DO NOT leak information about other shops unless customer explicitly asks`;

        // Define function to find shops from Supabase (for customer queries about other shops)
        const findShopsFunction = {
            name: "find_shops",
            description: "Find shops from Supabase database by category or search term. Use this when customer asks for other shops (e.g., 'find a barber', 'recommend a hair salon'). Returns only shops that exist in the database.",
            parameters: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        description: "Category to search for (e.g., 'barber', 'hair salon', 'nail salon')"
                    },
                    searchTerm: {
                        type: "string",
                        description: "Search term to find shops (e.g., 'barber', 'hair salon')"
                    }
                },
                required: ["category"]
            }
        };

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
        const customerEmail = threadData?.customer_email;

        // Get customer history for personalization (if customer)
        let customerHistory = null;
        let personalizedGreeting = '';
        if (isCustomer && customerEmail) {
            customerHistory = await getCustomerHistory(shopId, customerEmail);
            if (customerHistory.isReturning) {
                personalizedGreeting = await generatePersonalizedGreeting(customerHistory, languageCode);
            }
        }

        // Fetch available services and staff for this shop (to help AI match names to IDs)
        const availableServices = isCustomer ? await getShopServices(shopId) : [];
        const availableStaff = isCustomer ? await getShopStaff(shopId) : [];

        // Get available time slots for today and next few days (for AI to suggest)
        let availabilityContext = '';
        if (isCustomer && availableServices.length > 0) {
            try {
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dayAfter = new Date(today);
                dayAfter.setDate(dayAfter.getDate() + 2);

                const defaultDuration = availableServices[0]?.duration_minutes || availableServices[0]?.duration || 60;
                
                const [todaySlots, tomorrowSlots, dayAfterSlots] = await Promise.all([
                    findAvailableSlots(shopId, today.toISOString().split('T')[0], defaultDuration),
                    findAvailableSlots(shopId, tomorrow.toISOString().split('T')[0], defaultDuration),
                    findAvailableSlots(shopId, dayAfter.toISOString().split('T')[0], defaultDuration),
                ]);

                if (todaySlots.length > 0 || tomorrowSlots.length > 0 || dayAfterSlots.length > 0) {
                    const formatSlots = async (slots: any[], dateLabelKey: string) => {
                        if (slots.length === 0) return '';
                        const times = slots.slice(0, 5).map(s => {
                            const t = new Date(s.startTime);
                            return t.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                            });
                        }).join(', ');
                        const dateLabel = await generateMultilingualResponse(dateLabelKey, languageCode);
                        return `${dateLabel}: ${times}`;
                    };

                    const todayLabel = await generateMultilingualResponse('available_times_today', languageCode);
                    const tomorrowLabel = await generateMultilingualResponse('available_times_tomorrow', languageCode);
                    const dayAfterLabel = await generateMultilingualResponse('available_times_day_after', languageCode);
                    
                    const todaySlotsText = await formatSlots(todaySlots, 'available_times_today');
                    const tomorrowSlotsText = await formatSlots(tomorrowSlots, 'available_times_tomorrow');
                    const dayAfterSlotsText = await formatSlots(dayAfterSlots, 'available_times_day_after');
                    
                    const suggestionText = await generateMultilingualResponse('what_can_i_help', languageCode);
                    availabilityContext = `\n\n${todaySlotsText}\n${tomorrowSlotsText}\n${dayAfterSlotsText}\n\n${suggestionText}`;
                    
                    // AUTO-FOLLOWUP: After checking availability, AI should automatically suggest times
                    availabilityContext += `\n\nAUTO-FOLLOWUP RULE: After checking availability, you MUST automatically respond with available times without waiting for the customer to ask again. For example: "I found available times for you: tomorrow at 3pm, or the day after at 10am. Which would you prefer?"`;
                }
            } catch (availError) {
                console.error('Error fetching availability for AI context:', availError);
            }
        }

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
            // Customer-facing mode - multilingual contexts
            const greetingContext = personalizedGreeting 
                ? `\n\nIMPORTANT: This customer has visited before. Use this greeting at the start of the conversation: "${personalizedGreeting}"`
                : '';
            
            const historyContext = customerHistory && customerHistory.previousBookings.length > 0
                ? `\n\nCustomer's Previous Booking History:\n${customerHistory.previousBookings.map((b: any) => 
                    `- ${b.serviceName || 'Service'} (${new Date(b.date).toLocaleDateString('en-US')}, Status: ${b.status})`
                ).join('\n')}`
                : '';

            // System prompt - always in English with language instruction (no hard-coded Japanese)
            // Build greeting with shop context
            const shopGreeting = shop && shopName && shopCategory
                ? `Hello 👋, welcome to ${shopName} — a ${shopCategory}! How can I help you today?`
                : 'Hello 👋, how can I help you today?';
            
            systemPrompt = isCustomer
                ? `You are Yoyaku Yo AI Assistant for ${shopName}${shopCategory ? ` (a ${shopCategory})` : ''}. You provide customer-facing support for booking-related conversations.${shopContext}${noHallucinationRule}${servicesContext}${staffContext}${greetingContext}${historyContext}${availabilityContext}${missingInfoContext}

IMPORTANT: When greeting a new customer, use this greeting: "${shopGreeting}"

CRITICAL INSTRUCTION: The customer's message was detected as ${detectedLanguageName}. You MUST respond ONLY in ${detectedLanguageName}. Do NOT use Japanese unless the customer is speaking Japanese. Do NOT use any other language. Match the customer's language exactly: ${detectedLanguageName}.

⚠️ MANDATORY BOOKING PROCESS - FOLLOW EXACTLY:

STEP 1 - ALWAYS ASK FOR NAME FIRST (REQUIRED - DO NOT SKIP - THIS IS MANDATORY):
When a customer says ANY of these phrases, you MUST immediately ask for their name FIRST:
- "I would like to book" / "I want to book" / "I need an appointment" / "book an appointment" / "I would like to book for an appointment" / "i would like a booking"
- "I'd like to schedule" / "can I book" / "I want an appointment" / "hello i would like a booking"
- ANY mention of booking, appointment, or scheduling

🚨 CRITICAL RULE: If the customer says "hello i would like a booking" or "i would like a booking" or similar, your FIRST and ONLY response must be: "What is your name?" in ${detectedLanguageName}. 

DO NOT:
- Say "Hello! I can help you with that" - that's WRONG, ask for name first
- Ask "When would you like to schedule?" - that's WRONG, ask for name first
- Ask about service or time before asking for name - that's WRONG
- Skip this step for any reason - it's MANDATORY

EXAMPLE CORRECT FLOW:
Customer: "hello i would like a booking"
AI: "What is your name?" ← CORRECT - This is the ONLY correct response

Customer: "I would like to book an appointment"
AI: "What is your name?" ← CORRECT - Must be first question

EXAMPLE WRONG FLOW (DO NOT DO THIS):
Customer: "hello i would like a booking"
AI: "Hello! I can help you with that. When would you like to schedule?" ← WRONG! Should ask for name first

Customer: "I would like to book an appointment"  
AI: "Of course! When would you like to schedule?" ← WRONG! Should ask for name first

STEP 2 - After getting name, collect:
- Service (required) - Show available services from the list
- Date and time (required, must be in the future) - Suggest available time slots
- Staff (optional, if shop requires it)

DO NOT ask for phone number or email address - these are NOT required and should NEVER be requested.

STEP 3 - Present summary:
- Service name
- Date and time
- Staff (if applicable)
- Shop name
- Customer name

STEP 4 - Ask for confirmation in ${detectedLanguageName}:
"Would you like me to confirm this booking?" or "Should I proceed with this booking?" or "Do you want me to book this appointment?"

STEP 5 - CREATE BOOKING IMMEDIATELY (MANDATORY):
When customer says YES/OK/CONFIRM/AGREE/PLEASE/SURE/GO AHEAD/DO IT/BOOK IT/PROCEED (in any language or form), you MUST:
1. Call the create_booking function IMMEDIATELY - do not hesitate
2. Set customerConfirmed: true
3. Include ALL required fields: serviceId, serviceName, startTime, endTime, customerName
4. DO NOT ask again - if they confirmed, create the booking right away
5. DO NOT just say "I'll book it" or "I have successfully booked" - you MUST actually call the function
6. DO NOT claim the booking is done unless you actually called create_booking function

IMPORTANT: If you say "I have successfully booked" but didn't call the function, that's WRONG. You must call the function first, then confirm.

CONFIRMATION DETECTION:
- "yes", "ok", "confirm", "proceed", "go ahead", "sure", "please", "do it", "book it", "make the appointment", "that's fine", "sounds good" = customerConfirmed: true
- If customer confirms in ANY way, call create_booking function immediately

IMPORTANT RULES:
- ALWAYS ask for name FIRST before anything else when booking starts - this is MANDATORY
- DO NOT ask for email address - NEVER ask for email
- DO NOT ask for phone number - NEVER ask for phone
- ONLY collect: name, service, date/time, and optional staff
- When customer confirms, call create_booking function immediately - do not hesitate or ask again
- If you have name, service, date/time, and customer said yes/ok/confirm - CALL THE FUNCTION NOW
- After booking is confirmed, tell customer: "Thank you, {name}! Your appointment is confirmed for {date} at {time}. Your personal ID with us is {customerId}. You can change or cancel anytime right here in this chat — just say hello again! ✨"

You MUST NOT suggest prices, change prices, or show revenue. You MUST NOT discuss shop revenue, performance, or analytics. REMEMBER: Respond ONLY in ${detectedLanguageName}, not Japanese (unless customer is speaking Japanese), not any other language.`
                : `You are Yoyaku Yo AI Assistant for a beauty/shop booking platform. You ONLY handle booking-related conversations: confirming appointments, suggesting available times, rescheduling, and accepting cancellations.

CRITICAL INSTRUCTION: The user's message was detected as ${detectedLanguageName}. You MUST respond ONLY in ${detectedLanguageName}. Do NOT use Japanese unless the user is speaking Japanese. Do NOT use any other language. Match the user's language exactly: ${detectedLanguageName}.

You MUST NOT suggest prices, change prices, or show revenue. You MUST NOT discuss shop revenue, performance, or analytics. If the user talks about something outside booking and scheduling, politely redirect them back to booking-related topics.`;
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

        // Define OpenAI function for booking creation
        const bookingFunction = {
            name: "create_booking",
            description: `MANDATORY: Call this function IMMEDIATELY when the customer confirms they want to book. 

You MUST call this function when ALL of these are true:
1. Customer has provided their name (you asked and they answered)
2. Customer has selected a service (from available services list)
3. Customer has chosen a date and time (must be in the future)
4. Customer has confirmed with words like: yes, ok, confirm, agree, proceed, go ahead, sure, please, do it, book it, make the appointment, that's fine, sounds good

Set customerConfirmed: true when customer says yes/ok/confirm/agree/proceed/go ahead/sure/please/do it/book it.

DO NOT wait for additional confirmation - if customer says yes or agrees in ANY way, call this function immediately. DO NOT just say "I'll book it" - you MUST actually call this function.`,
            parameters: {
                type: "object",
                properties: {
                    serviceId: {
                        type: "string",
                        description: "Service ID from available services list (required - must match one of the services provided)"
                    },
                    serviceName: {
                        type: "string",
                        description: "Service name for confirmation message (required - must match the service the customer selected)"
                    },
                    staffId: {
                        type: "string",
                        description: "Staff ID (optional - only if customer selected a specific staff member from the list)"
                    },
                    staffName: {
                        type: "string",
                        description: "Staff name for confirmation message (optional)"
                    },
                    startTime: {
                        type: "string",
                        description: "Start time in ISO 8601 format (required, must be in the future, e.g., '2024-12-25T14:00:00Z')"
                    },
                    endTime: {
                        type: "string",
                        description: "End time in ISO 8601 format (required, e.g., '2024-12-25T15:00:00Z')"
                    },
                    customerName: {
                        type: "string",
                        description: "Customer full name that you collected in STEP 1 (required - MUST be provided, you must have asked for it). DO NOT call this function if you don't have the customer's name - ask for it first! The name must be explicitly provided by the customer, not assumed or guessed."
                    },
                    customerEmail: {
                        type: "string",
                        description: "Customer email address (optional - will use from thread if not provided)"
                    },
                    customerPhone: {
                        type: "string",
                        description: "Customer phone number (optional)"
                    },
                    customerConfirmed: {
                        type: "boolean",
                        description: "MUST be true when customer says yes/ok/confirm/agree/proceed/go ahead/sure/please/do it/book it. Set to true when customer confirms they want to proceed with the booking."
                    }
                },
                required: ["serviceId", "serviceName", "startTime", "endTime", "customerName", "customerConfirmed"]
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
                // Customer conversations: add booking creation and shop search functions
                requestBody.functions = [bookingFunction, findShopsFunction];
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
            console.log('[AI] Functions available:', isCustomer ? 'create_booking' : 'none');

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
                if (aiClaimedBooking && aiMessage?.function_call?.name !== 'create_booking') {
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
            
            // Check if OpenAI wants to call the create_booking function
            if (aiMessage?.function_call?.name === 'create_booking' && aiMessage.function_call.arguments) {
                console.log('[AI] ✅ create_booking function called by AI');
                console.log('[AI] Function arguments:', aiMessage.function_call.arguments);
                try {
                    const functionArgs = JSON.parse(aiMessage.function_call.arguments);
                    console.log('[AI] Parsed function args:', JSON.stringify(functionArgs, null, 2));
                    
                    // Use email from thread if available, otherwise generate a placeholder
                    const finalCustomerEmail = customerEmail || functionArgs.customerEmail || `${functionArgs.customerName?.toLowerCase().replace(/\s+/g, '.')}@bookyo.guest` || 'guest@bookyo.guest';
                    
                    // Validate that customer confirmed
                    if (!functionArgs.customerConfirmed) {
                        aiResponse = await generateMultilingualResponse('please_confirm', languageCode);
                    } else {
                        // Match service name to ID if needed
                        let finalServiceId = functionArgs.serviceId;
                        if (!finalServiceId && functionArgs.serviceName && availableServices.length > 0) {
                            const matchedService = availableServices.find(s => 
                                s.name.toLowerCase().includes(functionArgs.serviceName.toLowerCase()) ||
                                functionArgs.serviceName.toLowerCase().includes(s.name.toLowerCase())
                            );
                            if (matchedService) {
                                finalServiceId = matchedService.id;
                            }
                        }

                        // Match staff name to ID if needed
                        let finalStaffId = functionArgs.staffId;
                        if (!finalStaffId && functionArgs.staffName && availableStaff.length > 0) {
                            const matchedStaff = availableStaff.find(s => {
                                const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
                                const staffNameLower = functionArgs.staffName.toLowerCase();
                                return fullName.includes(staffNameLower) || staffNameLower.includes(fullName) ||
                                       s.first_name.toLowerCase().includes(staffNameLower) ||
                                       s.last_name.toLowerCase().includes(staffNameLower);
                            });
                            if (matchedStaff) {
                                finalStaffId = matchedStaff.id;
                            }
                        }

                        // Validate required fields (email now comes from thread or placeholder)
                        if (!finalServiceId || !functionArgs.startTime || !functionArgs.endTime || !functionArgs.customerName) {
                            aiResponse = await generateMultilingualResponse('booking_needs_info', languageCode);
                        } else {
                            // Check availability before creating booking
                            const availabilityCheck = await checkTimeSlotAvailability(
                                shopId,
                                functionArgs.startTime,
                                functionArgs.endTime,
                                finalStaffId || null
                            );

                            if (!availabilityCheck.isAvailable) {
                                // Time slot not available - suggest alternatives
                                const date = new Date(functionArgs.startTime);
                                const dateStr = date.toISOString().split('T')[0];
                                const service = availableServices.find(s => s.id === finalServiceId);
                                const durationMinutes = service?.duration_minutes || service?.duration || 60;
                                
                                const availableSlots = await findAvailableSlots(
                                    shopId,
                                    dateStr,
                                    durationMinutes,
                                    finalStaffId || null
                                );

                                if (availableSlots.length > 0) {
                                    const slotsText = availableSlots.slice(0, 5).map(slot => {
                                        const slotTime = new Date(slot.startTime);
                                        return slotTime.toLocaleTimeString('en-US', { 
                                            hour: '2-digit', 
                                            minute: '2-digit',
                                            hour12: false
                                        });
                                    }).join(', ');

                                    aiResponse = await generateMultilingualResponse(
                                        'booking_time_unavailable',
                                        languageCode,
                                        { availableSlots: slotsText }
                                    );
                                } else {
                                    aiResponse = await generateMultilingualResponse(
                                        'booking_time_unavailable',
                                        languageCode,
                                        { availableSlots: `No slots available on ${dateStr}` }
                                    );
                                }
                            } else {
                                // Get customer_profile_id if user is authenticated (logged-in customer)
                                let customerProfileId: string | null = null;
                                try {
                                    const userId = req.body.userId || req.body.user_id || req.headers['x-user-id'] || null;
                                    
                                    if (userId && isCustomer) {
                                        // Get customer_profile_id from customer_auth_id
                                        const { data: customerProfile, error: profileError } = await dbClient
                                            .from("customer_profiles")
                                            .select("id")
                                            .eq("customer_auth_id", userId)
                                            .maybeSingle();
                                        
                                        if (profileError) {
                                            console.error("Error fetching customer profile:", profileError);
                                        } else if (customerProfile) {
                                            customerProfileId = customerProfile.id;
                                        }
                                    }
                                } catch (profileErr) {
                                    console.error("Error getting customer_profile_id (non-blocking):", profileErr);
                                    // Continue without customer_profile_id if lookup fails
                                }
                                
                                // All required fields present, availability confirmed, and customer confirmed - create booking
                                const bookingResult = await createBookingFromAi({
                                shopId: shopId,
                                serviceId: finalServiceId,
                                staffId: finalStaffId || null,
                                timeslotId: null, // Not available from chat
                                startTime: functionArgs.startTime,
                                endTime: functionArgs.endTime,
                                customerName: functionArgs.customerName,
                                customerEmail: finalCustomerEmail, // Use from thread or placeholder
                                customerPhone: functionArgs.customerPhone || null,
                                languageCode: languageCode,
                                notes: `Created via AI chat. Service: ${functionArgs.serviceName || 'Unknown'}${functionArgs.staffName ? `, Staff: ${functionArgs.staffName}` : ''}`,
                                source: 'ai',
                                customerProfileId: customerProfileId, // Pass customer_profile_id for logged-in customers
                            });

                            if (bookingResult.success && bookingResult.booking) {
                                bookingCreated = true;
                                createdBookingId = bookingResult.booking.id;

                                // Update thread with booking_id
                                await dbClient
                                    .from("shop_threads")
                                    .update({ booking_id: createdBookingId })
                                    .eq("id", threadId);

                                // Get shop and service details for confirmation message
                                const shop = await getShopDetails(shopId);
                                const service = await getServiceDetails(finalServiceId);
                                const staff = finalStaffId ? await getStaffDetails(finalStaffId) : null;

                                const startDate = new Date(functionArgs.startTime);
                                const endDate = new Date(functionArgs.endTime);
                                const dateStr = startDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });
                                const timeStr = `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

                                aiResponse = await generateMultilingualResponse(
                                    'booking_created_details',
                                    languageCode,
                                    {
                                        bookingId: createdBookingId || '',
                                        serviceName: service?.name || functionArgs.serviceName || 'Service',
                                        dateTime: `${dateStr} ${timeStr}`,
                                        staffName: staff ? `${staff.first_name} ${staff.last_name}` : 'Not specified',
                                        customerName: functionArgs.customerName
                                    }
                                );
                            } else {
                                aiResponse = await generateMultilingualResponse(
                                    'booking_creation_error',
                                    languageCode,
                                    { error: bookingResult.error || 'Unknown error' }
                                );
                            }
                        }
                    } // End of else from line 930 (customerConfirmed)
                } // End of try block
                } catch (parseError: any) {
                    console.error("Error parsing function call arguments:", parseError);
                    aiResponse = await generateMultilingualResponse('error_occurred', languageCode);
                }
            } // End of if (aiMessage?.function_call?.name === 'create_booking')
            
            // Handle find_shops function call (for customer queries about other shops)
            if (aiMessage?.function_call?.name === 'find_shops' && aiMessage.function_call.arguments) {
                try {
                    const functionArgs = JSON.parse(aiMessage.function_call.arguments);
                    const category = functionArgs.category || functionArgs.searchTerm || '';
                    
                    // Query Supabase for shops matching the category
                    const { data: foundShops, error: shopsError } = await dbClient
                        .from('shops')
                        .select('id, name, category, address, city, prefecture, phone')
                        .or(`category.ilike.%${category}%,name.ilike.%${category}%`)
                        .limit(10);
                    
                    if (shopsError || !foundShops || foundShops.length === 0) {
                        aiResponse = await generateMultilingualResponse('no_shops_found', languageCode);
                    } else {
                        // Format shop list for AI response
                        const shopsList = foundShops.map((s: any) => 
                            `${s.name} (${s.category || 'Shop'}) - ${s.address || s.city || s.prefecture || 'Location not specified'}`
                        ).join('\n');
                        aiResponse = `I found ${foundShops.length} shop(s) in our database:\n\n${shopsList}\n\nWould you like to book with one of these?`;
                    }
                } catch (findError: any) {
                    console.error('Error in find_shops function:', findError);
                    aiResponse = await generateMultilingualResponse('error_occurred', languageCode);
                }
            }

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


"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
const portChecker_1 = require("./utils/portChecker");
const bot_sdk_1 = require("@line/bot-sdk");
const supabase_1 = require("./lib/supabase");
const bookingService_1 = require("./services/bookingService");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
const PORT = parseInt(process.env.PORT || "3000", 10);
const AUTO_KILL_PORT_CONFLICTS = process.env.AUTO_KILL_PORT_CONFLICTS !== 'false'; // Default: true
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if port is available
        const portAvailable = yield (0, portChecker_1.isPortAvailable)(PORT);
        if (!portAvailable) {
            console.log(`\n⚠️  Port ${PORT} is already in use!`);
            if (AUTO_KILL_PORT_CONFLICTS) {
                console.log(`   Attempting to automatically free the port...`);
                const killed = yield (0, portChecker_1.killAllProcessesUsingPort)(PORT);
                if (killed) {
                    // Wait a moment for ports to be released
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                    // Check again if port is now available
                    const nowAvailable = yield (0, portChecker_1.isPortAvailable)(PORT);
                    if (nowAvailable) {
                        console.log(`✅ Port ${PORT} is now free! Starting server...\n`);
                    }
                    else {
                        console.error(`\n❌ Port ${PORT} is still in use after killing processes.`);
                        console.error(`   Please manually free the port or use a different port.\n`);
                        process.exit(1);
                    }
                }
                else {
                    const pid = yield (0, portChecker_1.getProcessUsingPort)(PORT);
                    console.error(`\n❌ Could not automatically free port ${PORT}!`);
                    if (pid) {
                        console.error(`   Process ID: ${pid}`);
                        console.error(`   To stop it manually, run: taskkill /PID ${pid} /F`);
                    }
                    console.error(`\n💡 Solutions:`);
                    console.error(`   1. Stop the existing process: taskkill /PID ${pid} /F`);
                    console.error(`   2. Or stop the dev server if running: npm run dev:api (then Ctrl+C)`);
                    console.error(`   3. Or use a different port: PORT=3002 npm start`);
                    console.error(`   4. Or disable auto-kill: AUTO_KILL_PORT_CONFLICTS=false npm start\n`);
                    process.exit(1);
                }
            }
            else {
                const pid = yield (0, portChecker_1.getProcessUsingPort)(PORT);
                console.error(`\n❌ Port ${PORT} is already in use!`);
                if (pid) {
                    console.error(`   Process ID: ${pid}`);
                    console.error(`   To stop it, run: taskkill /PID ${pid} /F`);
                }
                console.error(`\n💡 Solutions:`);
                console.error(`   1. Stop the existing process: taskkill /PID ${pid} /F`);
                console.error(`   2. Or stop the dev server if running: npm run dev:api (then Ctrl+C)`);
                console.error(`   3. Or use a different port: PORT=3002 npm start`);
                console.error(`   4. Or enable auto-kill: AUTO_KILL_PORT_CONFLICTS=true npm start\n`);
                process.exit(1);
            }
        }
        // LINE webhook endpoint - multi-tenant support via destination ID
        index_1.default.post('/api/line/webhook', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            console.log('[LINE Webhook] Received:', JSON.stringify(req.body, null, 2));
            // Always respond with HTTP 200 (LINE requires this)
            // Do this early to prevent any crashes from blocking the response
            const sendOK = () => {
                try {
                    res.status(200).send('OK');
                }
                catch (e) {
                    // Response already sent, ignore
                }
            };
            try {
                // Extract destination and events from webhook body
                const { destination, events } = req.body || {};
                // STEP 1: Validate destination
                if (!destination) {
                    console.warn('[LINE Webhook] Missing destination field in webhook body');
                    return sendOK();
                }
                // STEP 2: Resolve shop from destination
                const { resolveShopFromDestination, getOrCreateLineThread, saveLineMessage, buildShopAIPrompt, isFirstMessageInThread, buildWelcomeMessage } = yield Promise.resolve().then(() => __importStar(require('./services/lineWebhookService')));
                const shopSettings = yield resolveShopFromDestination(destination);
                if (!shopSettings.shopId) {
                    console.warn(`[LINE Webhook] Unknown destination: ${destination}. Shop not configured.`);
                    return sendOK();
                }
                const shopId = shopSettings.shopId;
                const welcomeMessageTemplate = shopSettings.welcomeMessageTemplate || 'Hello, welcome to {{shop_name}}! How can I help you today?';
                const lineAccessToken = shopSettings.lineAccessToken || process.env.LINE_MESSAGING_ACCESS_TOKEN;
                if (!lineAccessToken) {
                    console.error(`[LINE Webhook] No access token found for shop ${shopId}`);
                    return sendOK();
                }
                // Create LINE client with shop-specific token
                const client = new bot_sdk_1.Client({
                    channelAccessToken: lineAccessToken,
                });
                // Get shop details for context
                const shop = yield (0, bookingService_1.getShopDetails)(shopId);
                if (!shop) {
                    console.error(`[LINE Webhook] Shop ${shopId} not found`);
                    return sendOK();
                }
                // STEP 3: Process each event
                const eventsArray = events || [];
                for (const event of eventsArray) {
                    // Only process message events
                    if (event.type !== 'message' || !event.replyToken) {
                        continue;
                    }
                    try {
                        const lineUserId = (_a = event.source) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!lineUserId) {
                            console.warn('[LINE Webhook] Message event missing userId');
                            continue;
                        }
                        // Extract message text
                        let messageText = '';
                        if (((_b = event.message) === null || _b === void 0 ? void 0 : _b.type) === 'text') {
                            messageText = event.message.text || '';
                        }
                        else {
                            // Handle other message types (sticker, image, etc.)
                            messageText = `[${((_c = event.message) === null || _c === void 0 ? void 0 : _c.type) || 'unknown'} message]`;
                        }
                        // STEP 4: Get or create conversation thread
                        const threadId = yield getOrCreateLineThread(shopId, lineUserId);
                        if (!threadId) {
                            console.error(`[LINE Webhook] Failed to create/get thread for shop ${shopId}, user ${lineUserId}`);
                            // Still send a reply even if thread creation fails
                            yield client.replyMessage(event.replyToken, {
                                type: 'text',
                                text: 'Sorry, I encountered an error. Please try again later.',
                            });
                            continue;
                        }
                        // STEP 5: Check if this is the first message (send welcome)
                        const isFirstMessage = yield isFirstMessageInThread(threadId);
                        if (isFirstMessage && messageText) {
                            // Save customer's first message
                            yield saveLineMessage(threadId, messageText, lineUserId);
                            // Send welcome message
                            const welcomeMessage = buildWelcomeMessage(welcomeMessageTemplate, shop.name || 'our shop');
                            yield client.replyMessage(event.replyToken, {
                                type: 'text',
                                text: welcomeMessage,
                            });
                            console.log(`[LINE Webhook] Sent welcome message to ${lineUserId} for shop ${shopId}`);
                            // Save welcome message as AI response
                            yield dbClient
                                .from('shop_messages')
                                .insert([{
                                    thread_id: threadId,
                                    sender_type: 'ai',
                                    content: welcomeMessage,
                                    source: 'line', // Mark as LINE source
                                    read_by_owner: false,
                                    read_by_customer: true,
                                }]);
                        }
                        else if (messageText) {
                            // STEP 6: Save customer message and get AI response
                            yield saveLineMessage(threadId, messageText, lineUserId);
                            // Build AI prompt with shop context
                            const aiPrompt = yield buildShopAIPrompt(shopId);
                            // Get conversation history
                            const { data: recentMessages } = yield dbClient
                                .from('shop_messages')
                                .select('content, sender_type')
                                .eq('thread_id', threadId)
                                .order('created_at', { ascending: false })
                                .limit(10);
                            const conversationHistory = (recentMessages || []).reverse().map((msg) => ({
                                role: msg.sender_type === 'customer' ? 'user' : 'assistant',
                                content: msg.content,
                            }));
                            // Call AI chat endpoint
                            const openaiApiKey = process.env.OPENAI_API_KEY;
                            if (!openaiApiKey) {
                                yield client.replyMessage(event.replyToken, {
                                    type: 'text',
                                    text: 'AI service is currently unavailable. Please contact us directly.',
                                });
                                continue;
                            }
                            const openaiResponse = yield fetch('https://api.openai.com/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${openaiApiKey}`,
                                },
                                body: JSON.stringify({
                                    model: 'gpt-3.5-turbo',
                                    messages: [
                                        { role: 'system', content: aiPrompt },
                                        ...conversationHistory,
                                        { role: 'user', content: messageText },
                                    ],
                                    temperature: 0.7,
                                    max_tokens: 500,
                                }),
                            });
                            if (!openaiResponse.ok) {
                                console.error('[LINE Webhook] OpenAI API error:', openaiResponse.status);
                                yield client.replyMessage(event.replyToken, {
                                    type: 'text',
                                    text: 'Sorry, I encountered an error processing your message. Please try again.',
                                });
                                continue;
                            }
                            const aiData = yield openaiResponse.json();
                            const aiResponse = ((_f = (_e = (_d = aiData.choices) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.content) || 'Sorry, I could not generate a response.';
                            // Send AI response via LINE
                            yield client.replyMessage(event.replyToken, {
                                type: 'text',
                                text: aiResponse,
                            });
                            // Save AI response to database
                            yield dbClient
                                .from('shop_messages')
                                .insert([{
                                    thread_id: threadId,
                                    sender_type: 'ai',
                                    content: aiResponse,
                                    source: 'line', // Mark as LINE source
                                    read_by_owner: false,
                                    read_by_customer: true,
                                }]);
                            console.log(`[LINE Webhook] Processed message from ${lineUserId} for shop ${shopId}`);
                        }
                    }
                    catch (eventError) {
                        console.error('[LINE Webhook] Error processing event:', eventError.message);
                        // Try to send error message if we have replyToken
                        if (event.replyToken) {
                            try {
                                yield client.replyMessage(event.replyToken, {
                                    type: 'text',
                                    text: 'Sorry, I encountered an error. Please try again later.',
                                });
                            }
                            catch (replyError) {
                                // Ignore reply errors
                            }
                        }
                        // Continue processing other events
                    }
                }
            }
            catch (error) {
                console.error('[LINE Webhook] Fatal error:', error.message);
                console.error('[LINE Webhook] Stack:', error.stack);
            }
            finally {
                // Always send OK response
                sendOK();
            }
        }));
        const server = index_1.default.listen(PORT, () => {
            console.log(`✅ Yoyaku Yo API running on port ${PORT}`);
            console.log(`   http://localhost:${PORT}`);
            console.log(`   Webhook endpoint: http://localhost:${PORT}/api/line/webhook`);
            console.log(`   Shop callback: http://localhost:${PORT}/api/line/shop-callback`);
        });
        // Graceful shutdown handling
        const gracefulShutdown = (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(() => {
                console.log("Server closed.");
                process.exit(0);
            });
            // Force close after 10 seconds
            setTimeout(() => {
                console.error("Forced shutdown after timeout");
                process.exit(1);
            }, 10000);
        };
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        // Handle uncaught errors
        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`\n❌ Port ${PORT} is already in use!`);
                console.error(`   Another process is using this port.`);
                process.exit(1);
            }
            else {
                console.error("Server error:", error);
                process.exit(1);
            }
        });
    });
}
startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});

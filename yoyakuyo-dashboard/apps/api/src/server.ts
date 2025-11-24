import app from "./index";
import { isPortAvailable, getProcessUsingPort, killAllProcessesUsingPort } from "./utils/portChecker";
import { Client } from '@line/bot-sdk';
import { supabase, supabaseAdmin } from "./lib/supabase";
import { getShopDetails } from "./services/bookingService";

const dbClient = supabaseAdmin || supabase;

const PORT = parseInt(process.env.PORT || "3000", 10);
const AUTO_KILL_PORT_CONFLICTS = process.env.AUTO_KILL_PORT_CONFLICTS !== 'false'; // Default: true

async function startServer() {
  // Check if port is available
  const portAvailable = await isPortAvailable(PORT);
  
  if (!portAvailable) {
    console.log(`\n⚠️  Port ${PORT} is already in use!`);
    
    if (AUTO_KILL_PORT_CONFLICTS) {
      console.log(`   Attempting to automatically free the port...`);
      const killed = await killAllProcessesUsingPort(PORT);
      
      if (killed) {
        // Wait a moment for ports to be released
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check again if port is now available
        const nowAvailable = await isPortAvailable(PORT);
        if (nowAvailable) {
          console.log(`✅ Port ${PORT} is now free! Starting server...\n`);
        } else {
          console.error(`\n❌ Port ${PORT} is still in use after killing processes.`);
          console.error(`   Please manually free the port or use a different port.\n`);
          process.exit(1);
        }
      } else {
        const pid = await getProcessUsingPort(PORT);
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
    } else {
      const pid = await getProcessUsingPort(PORT);
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
  app.post('/api/line/webhook', async (req, res) => {
    console.log('[LINE Webhook] Received:', JSON.stringify(req.body, null, 2));
    
    // Always respond with HTTP 200 (LINE requires this)
    // Do this early to prevent any crashes from blocking the response
    const sendOK = () => {
      try {
        res.status(200).send('OK');
      } catch (e) {
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
      const { resolveShopFromDestination, getOrCreateLineThread, saveLineMessage, buildShopAIPrompt, isFirstMessageInThread, buildWelcomeMessage } = await import('./services/lineWebhookService');
      
      const shopSettings = await resolveShopFromDestination(destination);
      
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
      const client = new Client({
        channelAccessToken: lineAccessToken,
      });

      // Get shop details for context
      const shop = await getShopDetails(shopId);
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
          const lineUserId = event.source?.userId;
          if (!lineUserId) {
            console.warn('[LINE Webhook] Message event missing userId');
            continue;
          }

          // Extract message text
          let messageText = '';
          if (event.message?.type === 'text') {
            messageText = event.message.text || '';
          } else {
            // Handle other message types (sticker, image, etc.)
            messageText = `[${event.message?.type || 'unknown'} message]`;
          }

          // STEP 4: Get or create conversation thread
          const threadId = await getOrCreateLineThread(shopId, lineUserId);
          if (!threadId) {
            console.error(`[LINE Webhook] Failed to create/get thread for shop ${shopId}, user ${lineUserId}`);
            // Still send a reply even if thread creation fails
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: 'Sorry, I encountered an error. Please try again later.',
            });
            continue;
          }

          // STEP 5: Check if this is the first message (send welcome)
          const isFirstMessage = await isFirstMessageInThread(threadId);
          
          if (isFirstMessage && messageText) {
            // Save customer's first message
            await saveLineMessage(threadId, messageText, lineUserId);

            // Send welcome message
            const welcomeMessage = buildWelcomeMessage(welcomeMessageTemplate, shop.name || 'our shop');
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: welcomeMessage,
            });
            console.log(`[LINE Webhook] Sent welcome message to ${lineUserId} for shop ${shopId}`);

            // Save welcome message as AI response
            await dbClient
              .from('shop_messages')
              .insert([{
                thread_id: threadId,
                sender_type: 'ai',
                content: welcomeMessage,
                source: 'line', // Mark as LINE source
                read_by_owner: false,
                read_by_customer: true,
              }]);
          } else if (messageText) {
            // STEP 6: Save customer message and get AI response
            await saveLineMessage(threadId, messageText, lineUserId);

            // Build AI prompt with shop context
            const aiPrompt = await buildShopAIPrompt(shopId);

            // Get conversation history
            const { data: recentMessages } = await dbClient
              .from('shop_messages')
              .select('content, sender_type')
              .eq('thread_id', threadId)
              .order('created_at', { ascending: false })
              .limit(10);

            const conversationHistory = (recentMessages || []).reverse().map((msg: any) => ({
              role: msg.sender_type === 'customer' ? 'user' : 'assistant',
              content: msg.content,
            }));

            // Call AI chat endpoint
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (!openaiApiKey) {
              await client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'AI service is currently unavailable. Please contact us directly.',
              });
              continue;
            }

            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              await client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'Sorry, I encountered an error processing your message. Please try again.',
              });
              continue;
            }

            const aiData = await openaiResponse.json() as {
              choices?: Array<{
                message?: {
                  content?: string;
                };
              }>;
            };

            const aiResponse = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

            // Send AI response via LINE
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: aiResponse,
            });

            // Save AI response to database
            await dbClient
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
        } catch (eventError: any) {
          console.error('[LINE Webhook] Error processing event:', eventError.message);
          // Try to send error message if we have replyToken
          if (event.replyToken) {
            try {
              await client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'Sorry, I encountered an error. Please try again later.',
              });
            } catch (replyError) {
              // Ignore reply errors
            }
          }
          // Continue processing other events
        }
      }
    } catch (error: any) {
      console.error('[LINE Webhook] Fatal error:', error.message);
      console.error('[LINE Webhook] Stack:', error.stack);
    } finally {
      // Always send OK response
      sendOK();
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`✅ Yoyaku Yo API running on port ${PORT}`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Webhook endpoint: http://localhost:${PORT}/api/line/webhook`);
    console.log(`   Shop callback: http://localhost:${PORT}/api/line/shop-callback`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
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
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use!`);
      console.error(`   Another process is using this port.`);
      process.exit(1);
    } else {
      console.error("Server error:", error);
      process.exit(1);
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

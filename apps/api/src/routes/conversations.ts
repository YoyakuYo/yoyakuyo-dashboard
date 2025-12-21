// apps/api/src/routes/conversations.ts
// API routes for conversations (customer-owner messaging)
// Uses conversations and messages tables from unified messaging system

import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";

const router = Router();
const dbClient = supabaseAdmin || supabase;

// GET /api/conversations - Get conversations for customer
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const type = req.query.type as string; // e.g., 'customer_owner'

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get customer profile
    const { data: customerProfile, error: profileError } = await dbClient
      .from("customer_profiles")
      .select("id")
      .eq("customer_auth_id", userId)
      .maybeSingle();

    if (profileError || !customerProfile?.id) {
      // Try fallback: check if customer_profiles.id = user.id (old structure)
      const { data: profileFallback } = await dbClient
        .from("customer_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      
      if (!profileFallback?.id) {
        return res.status(404).json({ error: "Customer profile not found" });
      }

    // Get conversations for this customer
    // Note: conversations.customer_id references users(id), so we use userId (which equals customer_auth_id)
    let query = dbClient
      .from("conversations")
      .select(`
        *,
        shop:shops(id, name),
        owner:users!conversations_owner_id_fkey(id, email, full_name)
      `)
      .eq("customer_id", userId);

      if (type) {
        query = query.eq("type", type);
      }

      const { data: conversations, error: convError } = await query;

      if (convError) {
        console.error("Error fetching conversations:", convError);
        return res.status(500).json({ error: "Failed to fetch conversations" });
      }

      // Get unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (conversations || []).map(async (conv: any) => {
          const { count } = await dbClient
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_role", "customer"); // Only count unread messages from owner/ai

          return {
            ...conv,
            unread_count: count || 0,
          };
        })
      );

      return res.json({ conversations: conversationsWithUnread });
    }

    // Get conversations for this customer
    // Note: conversations.customer_id references users(id), so we use userId (which equals customer_auth_id)
    let query = dbClient
      .from("conversations")
      .select(`
        *,
        shop:shops(id, name),
        owner:users!conversations_owner_id_fkey(id, email, full_name)
      `)
      .eq("customer_id", userId);

    if (type) {
      query = query.eq("type", type);
    }

    const { data: conversations, error: convError } = await query;

    if (convError) {
      console.error("Error fetching conversations:", convError);
      return res.status(500).json({ error: "Failed to fetch conversations" });
    }

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const { count } = await dbClient
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_role", "customer"); // Only count unread messages from owner/ai

        return {
          ...conv,
          unread_count: count || 0,
        };
      })
    );

    return res.json({ conversations: conversationsWithUnread });
  } catch (error: any) {
    console.error("Error in GET /api/conversations:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/conversations - Create a new conversation
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { type, shop_id, customer_id, owner_id } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!type || !shop_id) {
      return res.status(400).json({ error: "type and shop_id are required" });
    }

    // Get customer profile
    const { data: customerProfile, error: profileError } = await dbClient
      .from("customer_profiles")
      .select("id")
      .eq("customer_auth_id", userId)
      .maybeSingle();

    if (profileError || !customerProfile?.id) {
      // Try fallback: check if customer_profiles.id = user.id (old structure)
      const { data: profileFallback } = await dbClient
        .from("customer_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      
      if (!profileFallback?.id) {
        return res.status(404).json({ error: "Customer profile not found" });
      }

      // Get owner_id from shop if not provided
      let finalOwnerId = owner_id;
      if (!finalOwnerId) {
        const { data: shop } = await dbClient
          .from("shops")
          .select("owner_user_id")
          .eq("id", shop_id)
          .single();
        
        if (!shop?.owner_user_id) {
          return res.status(404).json({ error: "Shop owner not found" });
        }
        finalOwnerId = shop.owner_user_id;
      }

      // Check if conversation already exists
      // Note: conversations.customer_id references users(id), so we use userId
      const { data: existing } = await dbClient
        .from("conversations")
        .select("id")
        .eq("type", type)
        .eq("shop_id", shop_id)
        .eq("customer_id", userId)
        .eq("owner_id", finalOwnerId)
        .maybeSingle();

      if (existing) {
        return res.json({ conversation: existing });
      }

      // Create new conversation
      // Note: conversations.customer_id references users(id), so we use userId
      const { data: conversation, error: createError } = await dbClient
        .from("conversations")
        .insert({
          type,
          shop_id,
          customer_id: userId,
          owner_id: finalOwnerId,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        return res.status(500).json({ error: "Failed to create conversation" });
      }

      return res.json({ conversation });
    }

    // Get owner_id from shop if not provided
    let finalOwnerId = owner_id;
    if (!finalOwnerId) {
      const { data: shop } = await dbClient
        .from("shops")
        .select("owner_user_id")
        .eq("id", shop_id)
        .single();
      
      if (!shop?.owner_user_id) {
        return res.status(404).json({ error: "Shop owner not found" });
      }
      finalOwnerId = shop.owner_user_id;
    }

    // Check if conversation already exists
    // Note: conversations.customer_id references users(id), so we use userId
    const { data: existing } = await dbClient
      .from("conversations")
      .select("id")
      .eq("type", type)
      .eq("shop_id", shop_id)
      .eq("customer_id", userId)
      .eq("owner_id", finalOwnerId)
      .maybeSingle();

    if (existing) {
      return res.json({ conversation: existing });
    }

    // Create new conversation
    // Note: conversations.customer_id references users(id), so we use userId
    const { data: conversation, error: createError } = await dbClient
      .from("conversations")
      .insert({
        type,
        shop_id,
        customer_id: userId,
        owner_id: finalOwnerId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating conversation:", createError);
      return res.status(500).json({ error: "Failed to create conversation" });
    }

    return res.json({ conversation });
  } catch (error: any) {
    console.error("Error in POST /api/conversations:", error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/conversations/:id - Get messages for a conversation
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify conversation exists and user has access
    const { data: conversation, error: convError } = await dbClient
      .from("conversations")
      .select(`
        *,
        shop:shops(id, name),
        owner:users!conversations_owner_id_fkey(id, email, full_name)
      `)
      .eq("id", id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Verify customer owns this conversation
    // Note: conversations.customer_id references users(id), so we compare with userId
    if (conversation.customer_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await dbClient
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email, full_name)
      `)
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }

    // Transform messages to match expected format
    const transformedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      sender_role: msg.sender_role,
      content: msg.content,
      created_at: msg.created_at,
      is_read: msg.is_read,
      sender: msg.sender,
    }));

    return res.json({ messages: transformedMessages });
  } catch (error: any) {
    console.error("Error in GET /api/conversations/:id:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/conversations/:id/messages - Send a message in a conversation
router.post("/:id/messages", async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify conversation exists and user has access
    const { data: conversation, error: convError } = await dbClient
      .from("conversations")
      .select("*")
      .eq("id", id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Verify customer owns this conversation
    // Note: conversations.customer_id references users(id), so we compare with userId
    if (conversation.customer_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create message
    const { data: message, error: messageError } = await dbClient
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: userId, // Use user.id as sender_id
        sender_role: "customer",
        content: content.trim(),
        is_read: false,
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email, full_name)
      `)
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      return res.status(500).json({ error: "Failed to send message" });
    }

    // Transform message to match expected format
    const transformedMessage = {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender_role: message.sender_role,
      content: message.content,
      created_at: message.created_at,
      is_read: message.is_read,
      sender: message.sender,
    };

    return res.json({ message: transformedMessage });
  } catch (error: any) {
    console.error("Error in POST /api/conversations/:id/messages:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;


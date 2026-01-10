import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";

const router = Router();
const dbClient = supabaseAdmin || supabase;

// =====================================================
// OWNER AI ONLY - Customer AI has been removed
// =====================================================
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages, message, role } = req.body || {};

    // Only owner role is supported
    if (role !== "owner") {
      return res.status(403).json({ 
        error: "Only owner AI assistant is available. Customer AI has been removed.",
        mode: "ERROR",
        intent: "UNKNOWN",
        response: "Only owner AI assistant is available. Customer AI has been removed.",
        shop_cards: null,
        language_code: "en",
      });
    }

    let text = "";
    let conversationHistory: Array<{ role: string; content: string }> | undefined = undefined;
    
    if (Array.isArray(messages) && messages.length > 0) {
      const lastUser = [...messages].reverse().find((m: any) => m?.role === "user" && typeof m?.content === "string");
      text = (lastUser?.content || "").trim();
      conversationHistory = messages
        .filter((m: any) => (m.role === "user" || m.role === "assistant") && typeof m?.content === "string")
        .slice(0, -1);
    } else if (typeof message === "string") {
      text = message.trim();
    }

    if (!text) {
      return res.status(400).json({ error: "message_required" });
    }

    // ==========================================================
    // OWNER MODE - Business management assistant
    // ==========================================================
    const isNewConversation = !conversationHistory || conversationHistory.length === 0;
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|こんにちは|こんばんは|おはよう|やあ)[!！。.\s]*$/i.test(text.trim());
    
    if (isGreeting && !isNewConversation) {
      return res.json({
        mode: "OWNER_AI",
        intent: "GREETING",
        response: "🤖 AI Assistant: Hi! How can I help you manage your shop today?",
        shop_cards: null,
        language_code: "en",
      });
    }
    
    if (isGreeting && isNewConversation) {
      return res.json({
        mode: "OWNER_AI",
        intent: "GREETING",
        response: "🤖 AI Assistant: Hello! I'm your business management assistant. How can I help you manage your shop today?",
        shop_cards: null,
        language_code: "en",
      });
    }

    return res.json({
      mode: "OWNER_AI",
      intent: "UNKNOWN",
      response: "🤖 AI Assistant: I'm here to help you manage your shop. You can ask me about bookings, availability, or calendar management.",
      shop_cards: null,
      language_code: "en",
    });
  } catch (e: any) {
    console.error("[OWNER_AI] unexpected:", e?.message || e);
    return res.json({
      mode: "OWNER_AI",
      intent: "UNKNOWN",
      response: "Sorry, I encountered an error. Please try again.",
      shop_cards: null,
      language_code: "en",
    });
  }
});

// Booking is forbidden in SHOP_DISCOVERY_ONLY.
router.post("/actions/book", async (_req: Request, res: Response) => {
  return res.status(403).json({ error: "booking_disabled", message: "Booking is not available in this AI mode." });
});

export default router;



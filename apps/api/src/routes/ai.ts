import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { handleShopDiscoveryOnly } from "../ai/ai";

const router = Router();
const dbClient = supabaseAdmin || supabase;

// =====================================================
// SHOP_DISCOVERY_ONLY (SINGLE MODE)
// - Stateless: each message processed independently
// - Read-only: shops/categories only
// - No booking, no identity, no DB writes, no error exposure
// =====================================================
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages, message } = req.body || {};

    let text = "";
    if (Array.isArray(messages) && messages.length > 0) {
      const lastUser = [...messages].reverse().find((m: any) => m?.role === "user" && typeof m?.content === "string");
      text = (lastUser?.content || "").trim();
    } else if (typeof message === "string") {
      text = message.trim();
    }

    if (!text) {
      return res.status(400).json({ error: "message_required" });
    }

    try {
      const out = await handleShopDiscoveryOnly(text, dbClient as any);
      return res.json({
        mode: out.mode,
        intent: out.intent,
        response: out.response,
        shop_cards: out.shop_cards,
        language_code: "en",
      });
    } catch (e: any) {
      console.error("[SHOP_DISCOVERY_ONLY] error:", e?.message || e);
      return res.json({
        mode: "SHOP_DISCOVERY_ONLY",
        intent: "UNKNOWN",
        response: "Sorry, I couldn’t load shops right now. Please try again.",
        shop_cards: null,
        language_code: "en",
      });
    }
  } catch (e: any) {
    console.error("[SHOP_DISCOVERY_ONLY] unexpected:", e?.message || e);
    return res.json({
      mode: "SHOP_DISCOVERY_ONLY",
      intent: "UNKNOWN",
      response: "Sorry, I couldn’t load shops right now. Please try again.",
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



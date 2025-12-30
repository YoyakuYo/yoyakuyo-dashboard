"use strict";
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
const ai_1 = require("../ai/ai");
const router = (0, express_1.Router)();
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// =====================================================
// SHOP_DISCOVERY_ONLY (SINGLE MODE)
// - Stateless: each message processed independently
// - Read-only: shops/categories only
// - No booking, no identity, no DB writes, no error exposure
// =====================================================
router.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { messages, message } = req.body || {};
        let text = "";
        if (Array.isArray(messages) && messages.length > 0) {
            const lastUser = [...messages].reverse().find((m) => (m === null || m === void 0 ? void 0 : m.role) === "user" && typeof (m === null || m === void 0 ? void 0 : m.content) === "string");
            text = ((lastUser === null || lastUser === void 0 ? void 0 : lastUser.content) || "").trim();
        }
        else if (typeof message === "string") {
            text = message.trim();
        }
        if (!text) {
            return res.status(400).json({ error: "message_required" });
        }
        try {
            const out = yield (0, ai_1.handleShopDiscoveryOnly)(text, dbClient);
            return res.json({
                mode: out.mode,
                intent: out.intent,
                response: out.response,
                shop_cards: out.shop_cards,
                language_code: "en",
            });
        }
        catch (e) {
            console.error("[SHOP_DISCOVERY_ONLY] error:", (e === null || e === void 0 ? void 0 : e.message) || e);
            return res.json({
                mode: "SHOP_DISCOVERY_ONLY",
                intent: "UNKNOWN",
                response: "Sorry, I couldn’t load shops right now. Please try again.",
                shop_cards: null,
                language_code: "en",
            });
        }
    }
    catch (e) {
        console.error("[SHOP_DISCOVERY_ONLY] unexpected:", (e === null || e === void 0 ? void 0 : e.message) || e);
        return res.json({
            mode: "SHOP_DISCOVERY_ONLY",
            intent: "UNKNOWN",
            response: "Sorry, I couldn’t load shops right now. Please try again.",
            shop_cards: null,
            language_code: "en",
        });
    }
}));
// Booking is forbidden in SHOP_DISCOVERY_ONLY.
router.post("/actions/book", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(403).json({ error: "booking_disabled", message: "Booking is not available in this AI mode." });
}));
exports.default = router;

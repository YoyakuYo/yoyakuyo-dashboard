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
const router = (0, express_1.Router)();
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// =====================================================
// OWNER AI ONLY - Customer AI has been removed
// =====================================================
router.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        let conversationHistory = undefined;
        if (Array.isArray(messages) && messages.length > 0) {
            const lastUser = [...messages].reverse().find((m) => (m === null || m === void 0 ? void 0 : m.role) === "user" && typeof (m === null || m === void 0 ? void 0 : m.content) === "string");
            text = ((lastUser === null || lastUser === void 0 ? void 0 : lastUser.content) || "").trim();
            conversationHistory = messages
                .filter((m) => (m.role === "user" || m.role === "assistant") && typeof (m === null || m === void 0 ? void 0 : m.content) === "string")
                .slice(0, -1);
        }
        else if (typeof message === "string") {
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
    }
    catch (e) {
        console.error("[OWNER_AI] unexpected:", (e === null || e === void 0 ? void 0 : e.message) || e);
        return res.json({
            mode: "OWNER_AI",
            intent: "UNKNOWN",
            response: "Sorry, I encountered an error. Please try again.",
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

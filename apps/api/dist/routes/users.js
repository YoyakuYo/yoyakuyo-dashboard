"use strict";
// apps/api/src/routes/users.ts
// User preferences API routes
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
const supabase_js_1 = require("@supabase/supabase-js");
const router = (0, express_1.Router)();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
// GET /users/me - Get current user's preferences
router.get("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ error: "User ID required" });
        }
        const { data, error } = yield dbClient
            .from("users")
            .select("id, name, email, preferred_language")
            .eq("id", userId)
            .single();
        if (error) {
            console.error("Error fetching user:", error);
            return res.status(500).json({ error: "Failed to fetch user" });
        }
        if (!data) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json({
            id: data.id,
            name: data.name,
            email: data.email,
            preferredLanguage: data.preferred_language || 'en',
        });
    }
    catch (e) {
        console.error("Error in GET /users/me:", e);
        return res.status(500).json({ error: e.message });
    }
}));
// PATCH /users/me/preferences - Update user preferences
router.patch("/me/preferences", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        const { preferredLanguage } = req.body;
        console.log(`[Users] Updating preferences - userId: ${userId}, language: ${preferredLanguage}`);
        if (!userId) {
            return res.status(401).json({ error: "User ID required" });
        }
        if (!preferredLanguage) {
            return res.status(400).json({ error: "preferredLanguage is required" });
        }
        // Validate language code
        const validLanguages = ['ja', 'en', 'zh', 'vi', 'pt', 'fr', 'ru', 'es', 'ko', 'th', 'de', 'it', 'ar', 'hi'];
        if (!validLanguages.includes(preferredLanguage)) {
            return res.status(400).json({ error: "Invalid language code" });
        }
        // First check if user exists
        const { data: existingUser, error: checkError } = yield dbClient
            .from("users")
            .select("id, preferred_language")
            .eq("id", userId)
            .single();
        if (checkError) {
            console.error("Error checking user existence:", JSON.stringify(checkError, null, 2));
            return res.status(404).json({
                error: "User not found",
                details: checkError.message || JSON.stringify(checkError)
            });
        }
        if (!existingUser) {
            console.error(`User ${userId} not found in users table`);
            return res.status(404).json({ error: "User not found. Please ensure you are logged in." });
        }
        console.log(`[Users] User exists, current preferred_language: ${existingUser.preferred_language}`);
        // Update user preferences
        const { data, error } = yield dbClient
            .from("users")
            .update({
            preferred_language: preferredLanguage,
        })
            .eq("id", userId)
            .select()
            .single();
        if (error) {
            console.error("Error updating user preferences:", JSON.stringify(error, null, 2));
            const errorMessage = error.message || JSON.stringify(error);
            return res.status(500).json({
                error: "Failed to update preferences",
                details: errorMessage
            });
        }
        if (!data) {
            console.error(`No data returned after update for user ${userId}`);
            return res.status(404).json({ error: "User not found after update" });
        }
        console.log(`[Users] Successfully updated preferences for user ${userId} to ${data.preferred_language}`);
        return res.json({
            id: data.id,
            preferredLanguage: data.preferred_language,
        });
    }
    catch (e) {
        console.error("Error in PATCH /users/me/preferences:", e);
        return res.status(500).json({
            error: e.message || "Internal server error",
            details: e.stack
        });
    }
}));
exports.default = router;

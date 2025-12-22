"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Only load .env file if it exists (for local development)
// In Vercel, environment variables are set in the dashboard
if (process.env.NODE_ENV !== 'production') {
    try {
        dotenv_1.default.config({
            path: path_1.default.resolve(__dirname, "../../.env")
        });
    }
    catch (error) {
        // Ignore if .env file doesn't exist
    }
}
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    console.error("⚠️ SUPABASE_URL is missing from environment variables");
    if (process.env.NODE_ENV === 'production') {
        console.error("Please set SUPABASE_URL in Vercel environment variables");
    }
    // Don't throw in production - let it fail gracefully when used
}
if (!supabaseKey) {
    console.error("⚠️ SUPABASE_ANON_KEY is missing from environment variables");
    if (process.env.NODE_ENV === 'production') {
        console.error("Please set SUPABASE_ANON_KEY in Vercel environment variables");
    }
    // Don't throw in production - let it fail gracefully when used
}
// Create Supabase clients only if we have the required environment variables
// Use placeholder values if missing to prevent immediate crash
exports.supabase = (supabaseUrl && supabaseKey)
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey)
    : (0, supabase_js_1.createClient)(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
// Service role client for admin operations (e.g., generating signed URLs)
exports.supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;

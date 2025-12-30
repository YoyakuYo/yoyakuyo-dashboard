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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const shops_1 = __importDefault(require("./routes/shops"));
const categories_1 = __importDefault(require("./routes/categories"));
const services_1 = __importDefault(require("./routes/services"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const timeslots_1 = __importDefault(require("./routes/timeslots"));
const messages_1 = __importDefault(require("./routes/messages"));
const ai_1 = __importDefault(require("./routes/ai"));
const auth_1 = __importDefault(require("./routes/auth"));
const photos_1 = __importDefault(require("./routes/photos"));
const users_1 = __importDefault(require("./routes/users"));
const customers_1 = __importDefault(require("./routes/customers"));
const owner_1 = __importDefault(require("./routes/owner"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const conversations_1 = __importDefault(require("./routes/conversations"));
const supabase_1 = require("./lib/supabase");
const path_1 = __importDefault(require("path"));
// Only load .env file if it exists (for local development)
// In Vercel, environment variables are set in the dashboard
if (process.env.NODE_ENV !== 'production') {
    try {
        dotenv_1.default.config({
            path: path_1.default.resolve(__dirname, "../.env")
        });
    }
    catch (error) {
        // Ignore if .env file doesn't exist
    }
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Increase body size limits for JSON and URL-encoded data
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.get("/", (_, res) => res.send("Yoyaku Yo API running!"));
// Health check endpoint
app.get("/health", (_, res) => res.json({ status: "ok", service: "yoyaku-yo-api" }));
// Test endpoint to verify analytics routes are loaded
app.get("/test-analytics", (_, res) => {
    const analyticsRoutes = [
        "/analytics/revenue",
        "/analytics/customers",
        "/analytics/performance",
        "/analytics/bookings",
        "/analytics/report"
    ];
    res.json({
        message: "Analytics routes test",
        routes: analyticsRoutes,
        analyticsRouterLoaded: typeof analytics_1.default !== "undefined",
        analyticsRouterType: typeof analytics_1.default,
        supabaseAdminAvailable: typeof supabase_1.supabaseAdmin !== "undefined" && supabase_1.supabaseAdmin !== null,
        timestamp: new Date().toISOString(),
        commit: process.env.RENDER_GIT_COMMIT || "unknown"
    });
});
// Debug endpoint to check database connectivity
app.get("/debug/db", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers["x-user-id"];
        console.log(`[Debug] Checking database for user: ${userId}`);
        // Check if supabaseAdmin is available
        if (!supabase_1.supabaseAdmin) {
            return res.json({
                error: "supabaseAdmin not available",
                supabase_url: process.env.SUPABASE_URL ? "set" : "missing",
                supabase_anon_key: process.env.SUPABASE_ANON_KEY ? "set" : "missing",
                supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing"
            });
        }
        // Test shops query
        const { data: shops, error: shopsError } = yield supabase_1.supabaseAdmin
            .from("shops")
            .select("id, name, owner_user_id")
            .eq("owner_user_id", userId || "test")
            .limit(5);
        // Test simple count
        const { count, error: countError } = yield supabase_1.supabaseAdmin
            .from("shops")
            .select("*", { count: 'exact', head: true });
        res.json({
            supabaseAdmin: "available",
            userId: userId,
            shopsQuery: {
                success: !shopsError,
                error: shopsError === null || shopsError === void 0 ? void 0 : shopsError.message,
                count: (shops === null || shops === void 0 ? void 0 : shops.length) || 0,
                data: shops
            },
            totalShops: count,
            countError: countError === null || countError === void 0 ? void 0 : countError.message
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Handle favicon requests to prevent 404 errors
app.get("/favicon.ico", (_, res) => {
    res.status(204).end();
});
app.use("/shops", shops_1.default);
app.use("/categories", categories_1.default);
app.use("/services", services_1.default);
app.use("/bookings", bookings_1.default);
app.use("/timeslots", timeslots_1.default);
app.use("/messages", messages_1.default);
app.use("/ai", ai_1.default);
app.use("/auth", auth_1.default);
app.use("/photos", photos_1.default);
app.use("/users", users_1.default);
app.use("/customers", customers_1.default);
app.use("/owner", owner_1.default);
app.use("/reviews", reviews_1.default);
app.use("/analytics", analytics_1.default);
console.log("✅ Analytics routes registered: /analytics/revenue, /analytics/customers, /analytics/performance, /analytics/bookings, /analytics/report");
// Mount conversations routes under /api/conversations
app.use("/api/conversations", conversations_1.default);
// Start server if this file is run directly (for Render deployment)
if (require.main === module) {
    const PORT = parseInt(process.env.PORT || "10000", 10);
    app.listen(PORT, () => {
        console.log(`✅ Yoyaku Yo API running on port ${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/health`);
        console.log(`   Test analytics: http://localhost:${PORT}/test-analytics`);
    }).on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use!`);
        }
        else {
            console.error('Server error:', error);
        }
        process.exit(1);
    });
}
exports.default = app;

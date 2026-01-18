import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import shops from "./routes/shops";
import categories from "./routes/categories";
import services from "./routes/services";
import bookings from "./routes/bookings";
import timeslots from "./routes/timeslots";
import messages from "./routes/messages";
import ai from "./routes/ai";
import auth from "./routes/auth";
import photos from "./routes/photos";
import users from "./routes/users";
import customers from "./routes/customers";
import owner from "./routes/owner";
import reviews from "./routes/reviews";
import analytics from "./routes/analytics";
import conversations from "./routes/conversations";
import { supabaseAdmin } from "./lib/supabase";
import path from "path";

// Only load .env file if it exists (for local development)
// In Vercel, environment variables are set in the dashboard
if (process.env.NODE_ENV !== 'production') {
  try {
    dotenv.config({ 
      path: path.resolve(__dirname, "../.env") 
    });
  } catch (error) {
    // Ignore if .env file doesn't exist
  }
}

const app = express();

app.use(cors());
// Increase body size limits for JSON and URL-encoded data
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
    analyticsRouterLoaded: typeof analytics !== "undefined",
    analyticsRouterType: typeof analytics,
    supabaseAdminAvailable: typeof supabaseAdmin !== "undefined" && supabaseAdmin !== null,
    timestamp: new Date().toISOString(),
    commit: process.env.RENDER_GIT_COMMIT || "unknown"
  });
});

// Debug endpoint to check database connectivity
app.get("/debug/db", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    console.log(`[Debug] Checking database for user: ${userId}`);

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.json({
        error: "supabaseAdmin not available",
        supabase_url: process.env.SUPABASE_URL ? "set" : "missing",
        supabase_anon_key: process.env.SUPABASE_ANON_KEY ? "set" : "missing",
        supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing"
      });
    }

    // Test shops query
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from("shops")
      .select("id, name, owner_user_id")
      .eq("owner_user_id", userId || "test")
      .limit(5);

    // Test simple count
    const { count, error: countError } = await supabaseAdmin
      .from("shops")
      .select("*", { count: 'exact', head: true });

    res.json({
      supabaseAdmin: "available",
      userId: userId,
      shopsQuery: {
        success: !shopsError,
        error: shopsError?.message,
        count: shops?.length || 0,
        data: shops
      },
      totalShops: count,
      countError: countError?.message
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Handle favicon requests to prevent 404 errors
app.get("/favicon.ico", (_, res) => {
  res.status(204).end();
});

app.use("/shops", shops);
app.use("/categories", categories);
app.use("/services", services);
app.use("/bookings", bookings);
app.use("/timeslots", timeslots);
app.use("/messages", messages);
app.use("/ai", ai);
app.use("/auth", auth);
app.use("/photos", photos);
app.use("/users", users);
app.use("/customers", customers);
app.use("/owner", owner);
app.use("/reviews", reviews);
app.use("/analytics", analytics);
console.log("✅ Analytics routes registered: /analytics/revenue, /analytics/customers, /analytics/performance, /analytics/bookings, /analytics/report");
// Mount conversations routes under /api/conversations
app.use("/api/conversations", conversations);

// Start server if this file is run directly (for Render deployment)
if (require.main === module) {
  const PORT = parseInt(process.env.PORT || "10000", 10);

  app.listen(PORT, () => {
    console.log(`✅ Yoyaku Yo API running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Test analytics: http://localhost:${PORT}/test-analytics`);
  }).on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use!`);
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });
}

export default app;


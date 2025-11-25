import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import shops from "./routes/shops";
import categories from "./routes/categories";
import services from "./routes/services";
import staff from "./routes/staff";
import bookings from "./routes/bookings";
import clients from "./routes/clients";
import timeslots from "./routes/timeslots";
import messages from "./routes/messages";
import ai from "./routes/ai";
import auth from "./routes/auth";
import photos from "./routes/photos";
import users from "./routes/users";
import customers from "./routes/customers";
import owner from "./routes/owner";
import calendar from "./routes/calendar";
import reviews from "./routes/reviews";
import analytics from "./routes/analytics";
import line from "./routes/line";
import qr from "./routes/qr";
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

// Handle favicon requests to prevent 404 errors
app.get("/favicon.ico", (_, res) => {
  res.status(204).end();
});

app.use("/shops", shops);
app.use("/categories", categories);
app.use("/services", services);
app.use("/staff", staff);
app.use("/bookings", bookings);
app.use("/clients", clients);
app.use("/timeslots", timeslots);
app.use("/messages", messages);
app.use("/ai", ai);
app.use("/auth", auth);
app.use("/photos", photos);
app.use("/users", users);
app.use("/customers", customers);
app.use("/owner", owner);
app.use("/calendar", calendar);
app.use("/reviews", reviews);
app.use("/analytics", analytics);
app.use("/line", line);
app.use("/qr", qr);
// Also mount LINE routes under /api/line for production/ngrok compatibility
app.use("/api/line", line);

export default app;


"use strict";
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
const staff_1 = __importDefault(require("./routes/staff"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const clients_1 = __importDefault(require("./routes/clients"));
const timeslots_1 = __importDefault(require("./routes/timeslots"));
const messages_1 = __importDefault(require("./routes/messages"));
const ai_1 = __importDefault(require("./routes/ai"));
const auth_1 = __importDefault(require("./routes/auth"));
const photos_1 = __importDefault(require("./routes/photos"));
const users_1 = __importDefault(require("./routes/users"));
const customers_1 = __importDefault(require("./routes/customers"));
const owner_1 = __importDefault(require("./routes/owner"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const line_1 = __importDefault(require("./routes/line"));
const qr_1 = __importDefault(require("./routes/qr"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "../.env")
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Increase body size limits for JSON and URL-encoded data
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.get("/", (_, res) => res.send("Yoyaku Yo API running!"));
// Handle favicon requests to prevent 404 errors
app.get("/favicon.ico", (_, res) => {
    res.status(204).end();
});
app.use("/shops", shops_1.default);
app.use("/categories", categories_1.default);
app.use("/services", services_1.default);
app.use("/staff", staff_1.default);
app.use("/bookings", bookings_1.default);
app.use("/clients", clients_1.default);
app.use("/timeslots", timeslots_1.default);
app.use("/messages", messages_1.default);
app.use("/ai", ai_1.default);
app.use("/auth", auth_1.default);
app.use("/photos", photos_1.default);
app.use("/users", users_1.default);
app.use("/customers", customers_1.default);
app.use("/owner", owner_1.default);
app.use("/calendar", calendar_1.default);
app.use("/reviews", reviews_1.default);
app.use("/analytics", analytics_1.default);
app.use("/line", line_1.default);
app.use("/qr", qr_1.default);
// Also mount LINE routes under /api/line for production/ngrok compatibility
app.use("/api/line", line_1.default);
exports.default = app;

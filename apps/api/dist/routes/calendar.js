"use strict";
// apps/api/src/routes/calendar.ts
// Google Calendar OAuth and event management routes
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
const googleCalendarService_1 = require("../services/googleCalendarService");
const router = (0, express_1.Router)();
// GET /calendar/auth-url - Get Google Calendar authorization URL
router.get('/auth-url', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }
        const authUrl = (0, googleCalendarService_1.getAuthorizationUrl)(userId);
        return res.json({ authUrl });
    }
    catch (error) {
        console.error('Error generating auth URL:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate authorization URL' });
    }
}));
// GET /calendar/callback - Handle OAuth callback
router.get('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            return res.status(400).json({ error: 'Missing code or state parameter' });
        }
        const userId = state;
        const result = yield (0, googleCalendarService_1.handleOAuthCallback)(code, userId);
        if (result.success) {
            // Redirect to success page
            const frontendUrl = process.env.FRONTEND_URL || ((_a = process.env.NEXT_PUBLIC_API_URL) === null || _a === void 0 ? void 0 : _a.replace(':3000', ':3001')) || 'http://localhost:3001';
            return res.redirect(`${frontendUrl}/my-shop?calendar=connected`);
        }
        else {
            return res.status(400).json({ error: result.error || 'Failed to complete authorization' });
        }
    }
    catch (error) {
        console.error('Error handling OAuth callback:', error);
        return res.status(500).json({ error: error.message || 'Failed to complete authorization' });
    }
}));
// POST /calendar/events - Create a calendar event
router.post('/events', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }
        const { summary, description, start, end, location, attendees } = req.body;
        if (!summary || !start || !end) {
            return res.status(400).json({ error: 'summary, start, and end are required' });
        }
        const result = yield (0, googleCalendarService_1.createCalendarEvent)(userId, {
            summary,
            description,
            start,
            end,
            location,
            attendees,
        });
        if (result.success) {
            return res.json(result);
        }
        else {
            return res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error creating calendar event:', error);
        return res.status(500).json({ error: error.message || 'Failed to create calendar event' });
    }
}));
// PATCH /calendar/events/:eventId - Update a calendar event
router.patch('/events/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        const { eventId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }
        const { summary, description, start, end, location } = req.body;
        const result = yield (0, googleCalendarService_1.updateCalendarEvent)(userId, eventId, {
            summary,
            description,
            start,
            end,
            location,
        });
        if (result.success) {
            return res.json(result);
        }
        else {
            return res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error updating calendar event:', error);
        return res.status(500).json({ error: error.message || 'Failed to update calendar event' });
    }
}));
// DELETE /calendar/events/:eventId - Delete a calendar event
router.delete('/events/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['x-user-id'];
        const { eventId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }
        const result = yield (0, googleCalendarService_1.deleteCalendarEvent)(userId, eventId);
        if (result.success) {
            return res.json(result);
        }
        else {
            return res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error deleting calendar event:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete calendar event' });
    }
}));
exports.default = router;

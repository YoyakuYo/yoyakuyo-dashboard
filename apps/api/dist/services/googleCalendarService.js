"use strict";
// apps/api/src/services/googleCalendarService.ts
// Google Calendar integration service for AI to create/update/delete events
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
exports.createCalendarEvent = createCalendarEvent;
exports.updateCalendarEvent = updateCalendarEvent;
exports.deleteCalendarEvent = deleteCalendarEvent;
exports.getAuthorizationUrl = getAuthorizationUrl;
exports.handleOAuthCallback = handleOAuthCallback;
const googleapis_1 = require("googleapis");
const supabase_1 = require("../lib/supabase");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback';
/**
 * Get OAuth2 client for Google Calendar
 */
function getOAuth2Client() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error('Google OAuth credentials not configured');
    }
    return new googleapis_1.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}
/**
 * Get stored refresh token for a user
 */
function getRefreshToken(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase_1.supabaseAdmin) {
                console.error('Supabase admin client not initialized');
                return null;
            }
            const { data, error } = yield supabase_1.supabaseAdmin
                .from('user_google_tokens')
                .select('refresh_token')
                .eq('user_id', userId)
                .single();
            if (error || !data) {
                return null;
            }
            return data.refresh_token;
        }
        catch (error) {
            console.error('Error fetching refresh token:', error);
            return null;
        }
    });
}
/**
 * Get authenticated calendar client for a user
 */
function getCalendarClient(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const refreshToken = yield getRefreshToken(userId);
        if (!refreshToken) {
            throw new Error('User has not authorized Google Calendar access');
        }
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
            refresh_token: refreshToken,
        });
        // Refresh access token if needed
        const { credentials } = yield oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        return googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
    });
}
/**
 * Create a calendar event
 */
function createCalendarEvent(userId, eventData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const calendar = yield getCalendarClient(userId);
            const event = {
                summary: eventData.summary,
                description: eventData.description || '',
                start: {
                    dateTime: eventData.start.dateTime,
                    timeZone: eventData.start.timeZone || 'Asia/Tokyo',
                },
                end: {
                    dateTime: eventData.end.dateTime,
                    timeZone: eventData.end.timeZone || 'Asia/Tokyo',
                },
                location: eventData.location,
                attendees: eventData.attendees,
            };
            const response = yield calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });
            return {
                success: true,
                eventId: response.data.id,
                event: response.data,
            };
        }
        catch (error) {
            console.error('Error creating calendar event:', error);
            return {
                success: false,
                error: error.message || 'Failed to create calendar event',
            };
        }
    });
}
/**
 * Update a calendar event
 */
function updateCalendarEvent(userId, eventId, eventData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const calendar = yield getCalendarClient(userId);
            // Get existing event
            const existingEvent = yield calendar.events.get({
                calendarId: 'primary',
                eventId: eventId,
            });
            const updatedEvent = Object.assign(Object.assign({}, existingEvent.data), { summary: eventData.summary || existingEvent.data.summary, description: eventData.description !== undefined ? eventData.description : existingEvent.data.description, start: eventData.start ? {
                    dateTime: eventData.start.dateTime,
                    timeZone: eventData.start.timeZone || 'Asia/Tokyo',
                } : existingEvent.data.start, end: eventData.end ? {
                    dateTime: eventData.end.dateTime,
                    timeZone: eventData.end.timeZone || 'Asia/Tokyo',
                } : existingEvent.data.end, location: eventData.location !== undefined ? eventData.location : existingEvent.data.location });
            const response = yield calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: updatedEvent,
            });
            return {
                success: true,
                eventId: response.data.id,
                event: response.data,
            };
        }
        catch (error) {
            console.error('Error updating calendar event:', error);
            return {
                success: false,
                error: error.message || 'Failed to update calendar event',
            };
        }
    });
}
/**
 * Delete a calendar event
 */
function deleteCalendarEvent(userId, eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const calendar = yield getCalendarClient(userId);
            yield calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
            return {
                success: true,
            };
        }
        catch (error) {
            console.error('Error deleting calendar event:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete calendar event',
            };
        }
    });
}
/**
 * Get authorization URL for Google Calendar OAuth
 */
function getAuthorizationUrl(userId) {
    const oauth2Client = getOAuth2Client();
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: userId, // Pass user ID in state for callback
        prompt: 'consent', // Force consent to get refresh token
    });
    return url;
}
/**
 * Exchange authorization code for tokens and store refresh token
 */
function handleOAuthCallback(code, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const oauth2Client = getOAuth2Client();
            const { tokens } = yield oauth2Client.getToken(code);
            if (!tokens.refresh_token) {
                return {
                    success: false,
                    error: 'No refresh token received. Please authorize again with consent.',
                };
            }
            // Store refresh token in database
            if (!supabase_1.supabaseAdmin) {
                console.error('Supabase admin client not initialized');
                return {
                    success: false,
                    error: 'Database not configured. SUPABASE_SERVICE_ROLE_KEY is required.',
                };
            }
            const { error } = yield supabase_1.supabaseAdmin
                .from('user_google_tokens')
                .upsert({
                user_id: userId,
                refresh_token: tokens.refresh_token,
                access_token: tokens.access_token,
                expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            });
            if (error) {
                console.error('Error storing Google tokens:', error);
                return {
                    success: false,
                    error: 'Failed to store authorization tokens',
                };
            }
            return {
                success: true,
            };
        }
        catch (error) {
            console.error('Error handling OAuth callback:', error);
            return {
                success: false,
                error: error.message || 'Failed to complete authorization',
            };
        }
    });
}

"use strict";
// apps/api/src/services/calendarService.ts
// Calendar/holiday management service with multilingual support
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
exports.parseCalendarCommand = parseCalendarCommand;
exports.addShopHolidays = addShopHolidays;
exports.removeShopHolidays = removeShopHolidays;
exports.getShopHolidays = getShopHolidays;
exports.isShopHoliday = isShopHoliday;
exports.updateShopHours = updateShopHours;
const supabase_1 = require("../lib/supabase");
const googleCalendarService_1 = require("./googleCalendarService");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
/**
 * Parse natural language calendar commands in any language
 * Examples:
 * - "15th and 20th off" (English)
 * - "8月10～15日休み" (Japanese)
 * - "这个月15号和20号休息" (Chinese)
 */
function parseCalendarCommand(command, shopId, ownerLanguage) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!OPENAI_API_KEY) {
            // Fallback to simple regex parsing
            return parseCalendarCommandSimple(command);
        }
        try {
            const response = yield fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a calendar command parser. Parse the user's command and extract:
1. Action: "add" (mark as holiday/off), "remove" (remove holiday), or "list" (show holidays)
2. Dates: Array of dates in YYYY-MM-DD format (use current year/month if not specified)
3. Reason: Optional reason for the holiday

Return ONLY valid JSON in this format:
{
  "action": "add" | "remove" | "list",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD", ...],
  "reason": "optional reason"
}

Examples:
- "15th and 20th off" → {"action": "add", "dates": ["2024-12-15", "2024-12-20"], "reason": "Holiday"}
- "Remove 15th" → {"action": "remove", "dates": ["2024-12-15"]}
- "Show holidays" → {"action": "list", "dates": []}
- "8月10～15日休み" → {"action": "add", "dates": ["2024-08-10", "2024-08-11", "2024-08-12", "2024-08-13", "2024-08-14", "2024-08-15"], "reason": "休み"}

Current date: ${new Date().toISOString().split('T')[0]}`,
                        },
                        {
                            role: 'user',
                            content: command,
                        },
                    ],
                    temperature: 0.1,
                    max_tokens: 500,
                    response_format: { type: 'json_object' },
                }),
            });
            if (!response.ok) {
                console.error('OpenAI calendar parsing failed:', response.status);
                return parseCalendarCommandSimple(command);
            }
            const data = yield response.json();
            const content = (_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
            if (!content) {
                return parseCalendarCommandSimple(command);
            }
            const parsed = JSON.parse(content);
            return {
                action: parsed.action,
                dates: parsed.dates.map(d => new Date(d)),
                reason: parsed.reason,
            };
        }
        catch (error) {
            console.error('Error parsing calendar command:', error);
            return parseCalendarCommandSimple(command);
        }
    });
}
/**
 * Simple regex-based fallback parser
 */
function parseCalendarCommandSimple(command) {
    const lower = command.toLowerCase();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    // Detect action
    let action = 'add';
    if (lower.includes('remove') || lower.includes('delete') || lower.includes('取消')) {
        action = 'remove';
    }
    else if (lower.includes('list') || lower.includes('show') || lower.includes('表示')) {
        action = 'list';
    }
    // Extract dates (simple pattern: "15th", "20th", etc.)
    const dateMatches = command.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/g);
    const dates = [];
    if (dateMatches) {
        for (const match of dateMatches) {
            const day = parseInt(match.replace(/\D/g, ''));
            if (day >= 1 && day <= 31) {
                const date = new Date(currentYear, currentMonth, day);
                dates.push(date);
            }
        }
    }
    return dates.length > 0 || action === 'list' ? { dates, action } : null;
}
/**
 * Add holidays to shop calendar
 */
function addShopHolidays(shopId, dates, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get shop info to find owner user ID
            const { data: shop } = yield dbClient
                .from('shops')
                .select('id, name, owner_user_id')
                .eq('id', shopId)
                .single();
            if (!shop) {
                return { success: false, added: 0, errors: ['Shop not found'] };
            }
            const holidays = dates.map(date => ({
                shop_id: shopId,
                holiday_date: date.toISOString().split('T')[0], // YYYY-MM-DD
                reason: reason || null,
            }));
            const { data, error } = yield dbClient
                .from('shop_holidays')
                .upsert(holidays, { onConflict: 'shop_id,holiday_date' })
                .select();
            if (error) {
                console.error('Error adding shop holidays:', error);
                return { success: false, added: 0, errors: [error.message] };
            }
            // Sync to Google Calendar if owner has authorized it
            if (shop.owner_user_id) {
                const errors = [];
                for (const date of dates) {
                    try {
                        const dateStr = date.toISOString().split('T')[0];
                        const eventSummary = reason
                            ? `${shop.name} - Closed: ${reason}`
                            : `${shop.name} - Closed`;
                        const calendarResult = yield (0, googleCalendarService_1.createCalendarEvent)(shop.owner_user_id, {
                            summary: eventSummary,
                            description: `Shop closed on ${dateStr}${reason ? ` - ${reason}` : ''}`,
                            start: {
                                dateTime: `${dateStr}T00:00:00`,
                                timeZone: 'Asia/Tokyo',
                            },
                            end: {
                                dateTime: `${dateStr}T23:59:59`,
                                timeZone: 'Asia/Tokyo',
                            },
                        });
                        if (!calendarResult.success) {
                            // Log error but don't fail the operation
                            console.warn(`Failed to sync holiday to Google Calendar for ${dateStr}:`, calendarResult.error);
                            errors.push(`Calendar sync failed for ${dateStr}: ${calendarResult.error || 'Unknown error'}`);
                        }
                    }
                    catch (calendarError) {
                        // Log error but don't fail the operation
                        console.warn(`Error syncing holiday to Google Calendar for ${date.toISOString().split('T')[0]}:`, calendarError);
                        errors.push(`Calendar sync error for ${date.toISOString().split('T')[0]}: ${calendarError.message || 'Unknown error'}`);
                    }
                }
                // Return success even if calendar sync had errors (non-critical)
                return { success: true, added: (data === null || data === void 0 ? void 0 : data.length) || 0, errors };
            }
            return { success: true, added: (data === null || data === void 0 ? void 0 : data.length) || 0, errors: [] };
        }
        catch (error) {
            console.error('Error adding shop holidays:', error);
            return { success: false, added: 0, errors: [error.message] };
        }
    });
}
/**
 * Remove holidays from shop calendar
 */
function removeShopHolidays(shopId, dates) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get shop info to find owner user ID
            const { data: shop } = yield dbClient
                .from('shops')
                .select('id, name, owner_user_id')
                .eq('id', shopId)
                .single();
            if (!shop) {
                return { success: false, removed: 0 };
            }
            const dateStrings = dates.map(d => d.toISOString().split('T')[0]);
            // Get holiday records before deleting to check for Google Calendar event IDs
            const { data: holidays } = yield dbClient
                .from('shop_holidays')
                .select('holiday_date, google_calendar_event_id')
                .eq('shop_id', shopId)
                .in('holiday_date', dateStrings);
            const { error } = yield dbClient
                .from('shop_holidays')
                .delete()
                .eq('shop_id', shopId)
                .in('holiday_date', dateStrings);
            if (error) {
                console.error('Error removing shop holidays:', error);
                return { success: false, removed: 0 };
            }
            // Sync to Google Calendar if owner has authorized it
            // Note: We can't easily find the event ID without storing it, so we'll skip deletion
            // In a production system, you'd store the Google Calendar event ID in shop_holidays table
            if (shop.owner_user_id && holidays && holidays.length > 0) {
                // Try to find and delete events by searching for them
                // For now, we'll just log that we should delete them
                // In production, store google_calendar_event_id in shop_holidays table
                console.log(`Note: Google Calendar events should be deleted for removed holidays, but event IDs are not stored.`);
            }
            return { success: true, removed: dates.length };
        }
        catch (error) {
            console.error('Error removing shop holidays:', error);
            return { success: false, removed: 0 };
        }
    });
}
/**
 * Get shop holidays
 */
function getShopHolidays(shopId, startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = dbClient
                .from('shop_holidays')
                .select('holiday_date, reason')
                .eq('shop_id', shopId)
                .order('holiday_date', { ascending: true });
            if (startDate) {
                query = query.gte('holiday_date', startDate.toISOString().split('T')[0]);
            }
            if (endDate) {
                query = query.lte('holiday_date', endDate.toISOString().split('T')[0]);
            }
            const { data, error } = yield query;
            if (error) {
                console.error('Error getting shop holidays:', error);
                return [];
            }
            return (data || []).map(h => ({
                date: h.holiday_date,
                reason: h.reason || undefined,
            }));
        }
        catch (error) {
            console.error('Error getting shop holidays:', error);
            return [];
        }
    });
}
/**
 * Check if a date is a holiday for a shop
 */
function isShopHoliday(shopId, date) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const { data, error } = yield dbClient
                .from('shop_holidays')
                .select('id')
                .eq('shop_id', shopId)
                .eq('holiday_date', dateStr)
                .limit(1);
            if (error) {
                console.error('Error checking shop holiday:', error);
                return false;
            }
            return ((data === null || data === void 0 ? void 0 : data.length) || 0) > 0;
        }
        catch (error) {
            console.error('Error checking shop holiday:', error);
            return false;
        }
    });
}
/**
 * Update shop operating hours
 * Supports commands like "Every Wednesday 13:00-18:00" or "Monday to Friday 9:00-18:00"
 */
function updateShopHours(shopId, hours) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get shop info to find owner user ID
            const { data: shop, error: fetchError } = yield dbClient
                .from('shops')
                .select('id, name, opening_hours, owner_user_id')
                .eq('id', shopId)
                .single();
            if (fetchError) {
                console.error('Error fetching shop:', fetchError);
                return { success: false, message: 'Shop not found' };
            }
            // Parse current hours or initialize
            let currentHours = {};
            if ((shop === null || shop === void 0 ? void 0 : shop.opening_hours) && typeof shop.opening_hours === 'object') {
                currentHours = shop.opening_hours;
            }
            // Convert day number to day name (0 = Sunday, 6 = Saturday)
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            // Handle single day or multiple days
            const hoursArray = Array.isArray(hours) ? hours : [hours];
            // Update hours for specified days
            for (const hourEntry of hoursArray) {
                if (hourEntry.day >= 0 && hourEntry.day <= 6) {
                    const dayName = dayNames[hourEntry.day];
                    if (dayName) {
                        currentHours[dayName] = {
                            start: hourEntry.start,
                            end: hourEntry.end,
                        };
                    }
                }
            }
            // Save updated hours
            const { error: updateError } = yield dbClient
                .from('shops')
                .update({ opening_hours: currentHours })
                .eq('id', shopId);
            if (updateError) {
                console.error('Error updating shop hours:', updateError);
                return { success: false, message: 'Failed to update hours' };
            }
            // Sync to Google Calendar if owner has authorized it
            // Note: Operating hours are recurring, so we don't create individual events
            // Instead, we could create a recurring event or just log the update
            // For now, we'll just log that hours were updated
            if (shop.owner_user_id) {
                console.log(`Shop hours updated for ${shop.name}. Google Calendar sync for recurring hours not yet implemented.`);
                // TODO: In the future, we could create recurring events in Google Calendar
                // representing the shop's operating hours, or update existing recurring events
            }
            const updatedDays = hoursArray
                .filter(h => h.day >= 0 && h.day <= 6)
                .map(h => dayNames[h.day])
                .join(', ');
            return {
                success: true,
                message: `Updated hours for ${updatedDays}`
            };
        }
        catch (error) {
            console.error('Error updating shop hours:', error);
            return { success: false, message: error.message };
        }
    });
}

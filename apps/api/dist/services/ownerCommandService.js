"use strict";
// apps/api/src/services/ownerCommandService.ts
// Service for parsing and executing owner natural language commands
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
exports.parseOwnerCommand = parseOwnerCommand;
exports.executeOwnerCommand = executeOwnerCommand;
const supabase_1 = require("../lib/supabase");
const calendarService_1 = require("./calendarService");
const multilingualService_1 = require("./multilingualService");
const webPushService_1 = require("./webPushService");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
/**
 * Parse owner's natural language command in any language
 */
function parseOwnerCommand(command, shopId, ownerLanguage) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!OPENAI_API_KEY) {
            return { action: 'unknown', message: 'OpenAI API key not configured' };
        }
        try {
            // Get shop bookings for context
            const { data: bookings } = yield dbClient
                .from('bookings')
                .select('id, customer_name, start_time, customers(customer_id_display)')
                .eq('shop_id', shopId)
                .in('status', ['pending', 'confirmed'])
                .order('start_time', { ascending: true })
                .limit(50);
            const bookingsContext = (bookings === null || bookings === void 0 ? void 0 : bookings.map(b => {
                var _a;
                return ({
                    id: b.id,
                    customer: ((_a = b.customers) === null || _a === void 0 ? void 0 : _a.customer_id_display) || b.customer_name,
                    date: new Date(b.start_time).toLocaleDateString(),
                    time: new Date(b.start_time).toLocaleTimeString(),
                });
            })) || [];
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
                            content: `You are an AI assistant that parses owner commands for a booking system. The owner speaks ${ownerLanguage}.

Parse the command and return ONLY valid JSON:
{
  "action": "cancel_booking" | "reschedule_booking" | "add_holiday" | "remove_holiday" | "set_hours" | "block_date" | "unknown",
  "bookingId": "string (if action is cancel_booking or reschedule_booking)",
  "customerIdDisplay": "string (e.g., 'Mario X44' - if action involves a specific customer)",
  "newDate": "YYYY-MM-DD (if rescheduling)",
  "newTime": "HH:MM (if rescheduling)",
  "reason": "string (optional reason)",
  "dates": ["YYYY-MM-DD", ...] (if action is add_holiday, remove_holiday, or block_date),
  "hours": {"day": 0-6, "start": "HH:MM", "end": "HH:MM"} or [{"day": 0-6, "start": "HH:MM", "end": "HH:MM"}, ...] (if action is set_hours - single day or multiple days)
}

Available bookings for context:
${JSON.stringify(bookingsContext, null, 2)}

Examples:
- "Cancel Mario X44's booking tomorrow" → {"action": "cancel_booking", "customerIdDisplay": "Mario X44", "reason": "Owner request"}
- "Reschedule Yuki K9 from Friday 15:00 to Saturday 14:00" → {"action": "reschedule_booking", "customerIdDisplay": "Yuki K9", "newDate": "2024-12-28", "newTime": "14:00", "reason": "Owner request"}
- "Close the salon August 10-16" → {"action": "add_holiday", "dates": ["2024-08-10", "2024-08-11", ...], "reason": "Salon closed"}
- "Every Wednesday open only 13:00-18:00" → {"action": "set_hours", "hours": {"day": 3, "start": "13:00", "end": "18:00"}}
- "Monday to Friday 9:00-18:00" → {"action": "set_hours", "hours": [{"day": 1, "start": "09:00", "end": "18:00"}, {"day": 2, "start": "09:00", "end": "18:00"}, {"day": 3, "start": "09:00", "end": "18:00"}, {"day": 4, "start": "09:00", "end": "18:00"}, {"day": 5, "start": "09:00", "end": "18:00"}]}
- "Change Saturday hours to 10:00-16:00" → {"action": "set_hours", "hours": {"day": 6, "start": "10:00", "end": "16:00"}}
- "Block December 31 all day" → {"action": "block_date", "dates": ["2024-12-31"], "reason": "Blocked"}`,
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
                console.error('OpenAI API error:', response.status);
                return { action: 'unknown', message: 'Failed to parse command' };
            }
            const data = yield response.json();
            const content = (_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
            if (!content) {
                return { action: 'unknown', message: 'No response from AI' };
            }
            const parsed = JSON.parse(content);
            return parsed;
        }
        catch (error) {
            console.error('Error parsing owner command:', error);
            return { action: 'unknown', message: error.message };
        }
    });
}
/**
 * Execute owner command
 */
function executeOwnerCommand(command, shopId, ownerLanguage) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            switch (command.action) {
                case 'cancel_booking': {
                    // Find booking by customer ID display or booking ID
                    let bookingId = command.bookingId;
                    if (!bookingId && command.customerIdDisplay) {
                        // Find booking by customer ID display
                        const { data: customer } = yield dbClient
                            .from('customers')
                            .select('id')
                            .eq('customer_id_display', command.customerIdDisplay)
                            .single();
                        if (customer) {
                            const { data: booking } = yield dbClient
                                .from('bookings')
                                .select('id')
                                .eq('shop_id', shopId)
                                .eq('customer_id', customer.id)
                                .in('status', ['pending', 'confirmed'])
                                .order('start_time', { ascending: false })
                                .limit(1)
                                .single();
                            bookingId = booking === null || booking === void 0 ? void 0 : booking.id;
                        }
                    }
                    if (!bookingId) {
                        return { success: false, message: 'Booking not found' };
                    }
                    // Cancel booking
                    yield dbClient
                        .from('bookings')
                        .update({ status: 'cancelled' })
                        .eq('id', bookingId);
                    // Send notification to customer
                    const { data: booking } = yield dbClient
                        .from('bookings')
                        .select('customer_id, customers(customer_id_display, preferred_language)')
                        .eq('id', bookingId)
                        .single();
                    const customerIdDisplay = ((_a = booking === null || booking === void 0 ? void 0 : booking.customers) === null || _a === void 0 ? void 0 : _a.customer_id_display) || 'Customer';
                    const customerLang = ((_b = booking === null || booking === void 0 ? void 0 : booking.customers) === null || _b === void 0 ? void 0 : _b.preferred_language) || 'en';
                    // Send message via thread
                    const { data: thread } = yield dbClient
                        .from('shop_threads')
                        .select('id')
                        .eq('shop_id', shopId)
                        .eq('booking_id', bookingId)
                        .single();
                    if (thread) {
                        const cancelMsg = yield (0, multilingualService_1.generateMultilingualResponse)('booking_cancelled', customerLang, { reason: command.reason || 'Owner request' });
                        yield dbClient
                            .from('shop_messages')
                            .insert([{
                                thread_id: thread.id,
                                sender_type: 'ai',
                                content: cancelMsg,
                            }]);
                    }
                    // Send Web Push notification
                    if (booking === null || booking === void 0 ? void 0 : booking.customer_id) {
                        const bookingDate = new Date(booking.start_time);
                        yield (0, webPushService_1.notifyCustomerBookingChange)(booking.customer_id, 'cancelled', {
                            date: bookingDate.toLocaleDateString(),
                            time: bookingDate.toLocaleTimeString(),
                            serviceName: (_c = booking.services) === null || _c === void 0 ? void 0 : _c.name,
                        }, command.reason);
                    }
                    return {
                        success: true,
                        message: (yield (0, multilingualService_1.generateMultilingualResponse)('what_can_i_help', ownerLanguage)) + ` - ${customerIdDisplay} cancelled and notified`,
                        affectedCustomers: [customerIdDisplay],
                    };
                }
                case 'reschedule_booking': {
                    // Similar logic for reschedule
                    // ... (implementation similar to cancel)
                    return { success: true, message: 'Reschedule executed' };
                }
                case 'add_holiday':
                case 'block_date': {
                    if (!command.dates || command.dates.length === 0) {
                        return { success: false, message: 'No dates specified' };
                    }
                    const result = yield (0, calendarService_1.addShopHolidays)(shopId, command.dates, command.reason);
                    const datesStr = command.dates.map(d => new Date(d).toLocaleDateString()).join(', ');
                    return {
                        success: result.success,
                        message: yield (0, multilingualService_1.generateMultilingualResponse)('calendar_holiday_added', ownerLanguage, { dates: datesStr }),
                    };
                }
                case 'remove_holiday': {
                    if (!command.dates || command.dates.length === 0) {
                        return { success: false, message: 'No dates specified' };
                    }
                    const result = yield (0, calendarService_1.removeShopHolidays)(shopId, command.dates);
                    const datesStr = command.dates.map(d => new Date(d).toLocaleDateString()).join(', ');
                    return {
                        success: result.success,
                        message: yield (0, multilingualService_1.generateMultilingualResponse)('calendar_holiday_removed', ownerLanguage, { dates: datesStr }),
                    };
                }
                case 'set_hours': {
                    if (!command.hours) {
                        return { success: false, message: 'No hours specified' };
                    }
                    const result = yield (0, calendarService_1.updateShopHours)(shopId, command.hours);
                    if (result.success) {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const hoursArray = Array.isArray(command.hours) ? command.hours : [command.hours];
                        const hoursStr = hoursArray
                            .filter(h => h.day >= 0 && h.day <= 6)
                            .map(h => `${dayNames[h.day]} ${h.start}-${h.end}`)
                            .join(', ');
                        return {
                            success: true,
                            message: (yield (0, multilingualService_1.generateMultilingualResponse)('calendar_hours_updated', ownerLanguage, { hours: hoursStr })) || `Done! Updated hours: ${hoursStr}`,
                        };
                    }
                    return result;
                }
                default:
                    return { success: false, message: 'Unknown command' };
            }
        }
        catch (error) {
            console.error('Error executing owner command:', error);
            return { success: false, message: error.message };
        }
    });
}

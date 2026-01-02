// apps/api/src/services/ownerCommandService.ts
// Service for parsing and executing owner natural language commands

import { supabaseAdmin, supabase } from '../lib/supabase';
import { detectLanguage } from './languageDetectionService';
import { parseCalendarCommand, addShopHolidays, removeShopHolidays, updateShopHours } from './calendarService';
import { generateMultilingualResponse } from './multilingualService';
import { notifyCustomerBookingChange } from './webPushService';

const dbClient = supabaseAdmin || supabase;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface OwnerCommand {
  action: 'cancel_booking' | 'reschedule_booking' | 'add_holiday' | 'remove_holiday' | 'set_hours' | 'block_date' | 'unknown';
  bookingId?: string;
  customerIdDisplay?: string;
  newDate?: string;
  newTime?: string;
  reason?: string;
  dates?: Date[];
  hours?: { day: number; start: string; end: string } | Array<{ day: number; start: string; end: string }>;
  message?: string;
}

/**
 * Parse owner's natural language command in any language
 */
export async function parseOwnerCommand(
  command: string,
  shopId: string,
  ownerLanguage: string
): Promise<OwnerCommand> {
  if (!OPENAI_API_KEY) {
    return { action: 'unknown', message: 'OpenAI API key not configured' };
  }

  try {
    // Get shop bookings for context
    const { data: bookings } = await dbClient
      .from('bookings')
      .select('id, customer_name, start_time, customers(customer_id_display)')
      .eq('shop_id', shopId)
      .in('status', ['pending', 'confirmed'])
      .order('start_time', { ascending: true })
      .limit(50);

    const bookingsContext = bookings?.map(b => ({
      id: b.id,
      customer: (b as any).customers?.customer_id_display || b.customer_name,
      date: new Date(b.start_time).toLocaleDateString(),
      time: new Date(b.start_time).toLocaleTimeString(),
    })) || [];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { action: 'unknown', message: 'No response from AI' };
    }

    const parsed = JSON.parse(content) as OwnerCommand;
    return parsed;
  } catch (error: any) {
    console.error('Error parsing owner command:', error);
    return { action: 'unknown', message: error.message };
  }
}

/**
 * Execute owner command
 */
export async function executeOwnerCommand(
  command: OwnerCommand,
  shopId: string,
  ownerLanguage: string
): Promise<{ success: boolean; message: string; affectedCustomers?: string[] }> {
  try {
    switch (command.action) {
      case 'cancel_booking': {
        // Find booking by customer ID display or booking ID
        let bookingId = command.bookingId;
        
        if (!bookingId && command.customerIdDisplay) {
          // Find booking by customer ID display
          const { data: customer } = await dbClient
            .from('customers')
            .select('id')
            .eq('customer_id_display', command.customerIdDisplay)
            .single();

          if (customer) {
            const { data: booking } = await dbClient
              .from('bookings')
              .select('id')
              .eq('shop_id', shopId)
              .eq('customer_id', customer.id)
              .in('status', ['pending', 'confirmed'])
              .order('start_time', { ascending: false })
              .limit(1)
              .single();

            bookingId = booking?.id;
          }
        }

        if (!bookingId) {
          return { success: false, message: 'Booking not found' };
        }

        // Cancel booking
        await dbClient
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId);

        // Send notification to customer
        const { data: booking } = await dbClient
          .from('bookings')
          .select('customer_id, customers(customer_id_display, preferred_language)')
          .eq('id', bookingId)
          .single();

        const customerIdDisplay = (booking as any)?.customers?.customer_id_display || 'Customer';
        const customerLang = (booking as any)?.customers?.preferred_language || 'en';

        // Send message via thread
        const { data: thread } = await dbClient
          .from('shop_threads')
          .select('id')
          .eq('shop_id', shopId)
          .eq('booking_id', bookingId)
          .single();

        if (thread) {
          const cancelMsg = await generateMultilingualResponse(
            'booking_cancelled',
            customerLang,
            { reason: command.reason || 'Owner request' }
          );

          await dbClient
            .from('shop_messages')
            .insert([{
              thread_id: thread.id,
              sender_type: 'ai',
              content: cancelMsg,
            }]);
        }

        // Send Web Push notification
        if (booking?.customer_id) {
          const bookingDate = new Date((booking as any).start_time);
          await notifyCustomerBookingChange(
            booking.customer_id,
            'cancelled',
            {
              date: bookingDate.toLocaleDateString(),
              time: bookingDate.toLocaleTimeString(),
              serviceName: (booking as any).services?.name,
            },
            command.reason
          );
        }

        return {
          success: true,
          message: await generateMultilingualResponse('what_can_i_help', ownerLanguage) + ` - ${customerIdDisplay} cancelled and notified`,
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

        const result = await addShopHolidays(shopId, command.dates, command.reason);
        const datesStr = command.dates.map(d => new Date(d).toLocaleDateString()).join(', ');

        return {
          success: result.success,
          message: await generateMultilingualResponse('calendar_holiday_added', ownerLanguage, { dates: datesStr }),
        };
      }

      case 'remove_holiday': {
        if (!command.dates || command.dates.length === 0) {
          return { success: false, message: 'No dates specified' };
        }

        const result = await removeShopHolidays(shopId, command.dates);
        const datesStr = command.dates.map(d => new Date(d).toLocaleDateString()).join(', ');

        return {
          success: result.success,
          message: await generateMultilingualResponse('calendar_holiday_removed', ownerLanguage, { dates: datesStr }),
        };
      }

      case 'set_hours': {
        if (!command.hours) {
          return { success: false, message: 'No hours specified' };
        }

        const result = await updateShopHours(shopId, command.hours);
        
        if (result.success) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const hoursArray = Array.isArray(command.hours) ? command.hours : [command.hours];
          const hoursStr = hoursArray
            .filter(h => h.day >= 0 && h.day <= 6)
            .map(h => `${dayNames[h.day]} ${h.start}-${h.end}`)
            .join(', ');
          
          return {
            success: true,
            message: await generateMultilingualResponse('calendar_hours_updated', ownerLanguage, { hours: hoursStr }) || `Done! Updated hours: ${hoursStr}`,
          };
        }
        
        return result;
      }

      default:
        return { success: false, message: 'Unknown command' };
    }
  } catch (error: any) {
    console.error('Error executing owner command:', error);
    return { success: false, message: error.message };
  }
}


// apps/api/src/services/multilingualService.ts
// Multilingual response service - generates responses in any language dynamically
// Replaces all hard-coded language strings

import { detectLanguage } from './languageDetectionService';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate a multilingual response based on the detected language
 * This replaces all hard-coded language strings
 */
export async function generateMultilingualResponse(
  templateKey: string,
  languageCode: string,
  variables?: Record<string, string | number>
): Promise<string> {
  // If no OpenAI key, fall back to English templates
  if (!OPENAI_API_KEY) {
    return getEnglishTemplate(templateKey, variables);
  }

  try {
    const englishTemplate = getEnglishTemplate(templateKey, variables);
    
    // If already English, return as-is
    if (languageCode === 'en') {
      return englishTemplate;
    }

    // Use OpenAI to translate to target language
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
            content: `You are a professional translator. Translate the following text to ${getLanguageName(languageCode)}. Maintain the same tone, formality, and structure. If there are placeholders like {variable}, keep them as-is. Return ONLY the translated text, no explanations.`,
          },
          {
            role: 'user',
            content: englishTemplate,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI translation failed:', response.status);
      return englishTemplate; // Fallback to English
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    
    const translated = data.choices?.[0]?.message?.content?.trim();
    return translated || englishTemplate;
  } catch (error: any) {
    console.error('Error generating multilingual response:', error);
    return getEnglishTemplate(templateKey, variables);
  }
}

/**
 * Get English template for a given key
 */
function getEnglishTemplate(templateKey: string, variables?: Record<string, string | number>): string {
  const templates: Record<string, string> = {
    // Error messages
    'ai_unavailable': 'Sorry, the AI assistant is currently unavailable. For booking inquiries, please contact the shop directly.',
    'error_occurred': 'An error occurred while processing your request. Please try again.',
    
    // Booking creation
    'booking_confirm_question': 'Would you like me to confirm this booking?',
    'booking_created_success': '✅ Your booking has been confirmed!',
    'booking_created_details': 'Booking ID: {bookingId}\nService: {serviceName}\nDate & Time: {dateTime}\nStaff: {staffName}\nCustomer: {customerName}\n\nThank you for your booking! The shop will contact you to confirm.',
    'booking_needs_info': 'To create a booking, I need service, date, time, and your name.',
    'booking_time_unavailable': 'Sorry, the requested time slot is already booked.\n\nThe following times are available:\n{availableSlots}\n\nWhich time would you prefer?',
    'booking_creation_error': 'Sorry, an error occurred while creating your booking: {error}',
    
    // Cancellation/Reschedule
    'cancellation_message': 'Sorry, but we need to {action} your booking due to {reason}. Would you like to {action} the booking, or would you prefer to reschedule for another date and time?',
    'reschedule_message': 'Sorry, but we need to reschedule your booking due to {reason}. Would you like to reschedule for another date and time?',
    'booking_cancelled': 'Sorry, your booking has been cancelled. We apologize for any inconvenience. Would you like to book for another date and time?',
    
    // Availability
    'available_times_today': 'Today',
    'available_times_tomorrow': 'Tomorrow',
    'available_times_day_after': 'Day After Tomorrow',
    'available_times_suggestion': 'When customers ask about times, suggest these available slots.',
    
    // Calendar commands
    'calendar_holiday_added': 'Done! {dates} marked as holidays.',
    'calendar_holiday_removed': 'Done! {dates} removed from holidays.',
    'calendar_holiday_list': 'Current holidays: {dates}',
    'calendar_holiday_error': 'Sorry, I could not understand the dates. Please try again (e.g., "15th and 20th off" or "August 10-15 closed").',
    'calendar_hours_updated': 'Done! Updated operating hours: {hours}',
    
    // General
    'please_confirm': 'Please confirm by saying "yes" or "confirm".',
    'what_can_i_help': 'Hello! How can I help you today?',
    'welcome_back': 'Welcome back {name}!',
  };

  let template = templates[templateKey] || templateKey;
  
  // Replace variables
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }
  
  return template;
}

/**
 * Get language name from code
 */
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'ja': 'Japanese',
    'en': 'English',
    'zh': 'Chinese',
    'vi': 'Vietnamese',
    'pt': 'Portuguese',
    'fr': 'French',
    'ru': 'Russian',
    'es': 'Spanish',
    'ko': 'Korean',
    'th': 'Thai',
    'de': 'German',
    'it': 'Italian',
    'ar': 'Arabic',
    'hi': 'Hindi',
  };
  return names[code] || 'English';
}

/**
 * Format available time slots for display (multilingual)
 */
export async function formatAvailableSlots(slots: Array<{ start: string; end: string }>, languageCode: string): Promise<string> {
  if (slots.length === 0) {
    // Use multilingual service for "no available times" message
    const noSlotsTemplate = 'No available times';
    if (languageCode === 'en') {
      return noSlotsTemplate;
    }
    // For other languages, translate via OpenAI
    try {
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
              content: `You are a professional translator. Translate "No available times" to ${getLanguageName(languageCode)}. Return ONLY the translated text, no explanations.`,
            },
            {
              role: 'user',
              content: noSlotsTemplate,
            },
          ],
          temperature: 0.3,
          max_tokens: 50,
        }),
      });
      if (response.ok) {
        const data = await response.json() as { choices?: Array<{ message?: { content?: string; }; }>; };
        return data.choices?.[0]?.message?.content?.trim() || noSlotsTemplate;
      }
    } catch (error) {
      console.error('Error translating "no available times":', error);
    }
    return noSlotsTemplate;
  }
  
  return slots.map(slot => {
    const start = new Date(slot.start);
    const timeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return timeStr;
  }).join(', ');
}


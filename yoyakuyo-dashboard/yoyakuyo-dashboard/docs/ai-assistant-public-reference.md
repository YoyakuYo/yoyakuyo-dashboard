# AI Assistant Public Customer Chat - Complete Reference Blueprint

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Purpose:** Complete reference snapshot of the working public customer AI assistant logic. Use this document to restore functionality if something breaks.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Flow](#architecture-flow)
3. [Frontend Component](#frontend-component)
4. [Backend API Endpoint](#backend-api-endpoint)
5. [System Prompt Template](#system-prompt-template)
6. [Function Calling Logic](#function-calling-logic)
7. [Booking Creation Flow](#booking-creation-flow)
8. [Error Handling](#error-handling)
9. [Language Detection](#language-detection)
10. [Shop Search Logic](#shop-search-logic)

---

## Overview

The public customer AI assistant helps users:
- Find shops by location, category, or preferences
- Understand shop details and availability
- **Automatically create bookings** via natural language
- Get booking confirmations and handle errors
- Communicate in multiple languages (auto-detected)

**Key Principle:** The AI CAN and MUST create bookings automatically. It never says "I cannot make bookings."

---

## Architecture Flow

```
Customer Browser
    ↓
BrowseAIAssistant.tsx (Frontend Component)
    ↓
POST /ai/chat (Backend API)
    ↓
OpenAI GPT-4o-mini (with function calling)
    ↓
[If booking requested]
    ↓
POST /api/ai/auto-book (Internal API call)
    ↓
validateBookingTime() (Validation)
    ↓
Supabase bookings table (Insert)
    ↓
Response with booking_result
    ↓
Frontend displays confirmation
```

---

## Frontend Component

**File:** `app/browse/components/BrowseAIAssistant.tsx`

### Key Features

1. **Floating Chat Bubble**
   - Fixed position bottom-right
   - Opens/closes chat window
   - Shows green pulse indicator

2. **Message Handling**
   - Maintains conversation history (last 10 messages)
   - Scrolls to bottom automatically
   - Shows loading state during API calls

3. **API Call Structure**
```typescript
const response = await fetch(`${apiUrl}/ai/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    role: 'customer',
    messages: messagesForAPI, // Last 10 messages + current
    locale: locale,
    prefecture: selectedPrefecture || null,
    category: selectedCategoryId || null,
    searchQuery: searchQuery || null,
    shops: shops.map(s => ({
      id: s.id,
      name: s.name,
      address: s.address,
      prefecture: s.prefecture,
      normalized_city: s.normalized_city,
      city: s.city || null,
      category_id: s.category_id,
      description: s.description,
    })),
  }),
});
```

4. **Booking Result Display**
```typescript
// Check if booking was created (booking_result in response)
let messageContent = data.response || 'Sorry, I could not generate a response.';

// If booking was created, enhance the message with booking details
if (data.booking_result && data.booking_result.success) {
  const booking = data.booking_result;
  messageContent = `✅ Booking confirmed! Your appointment at ${booking.shop_name || 'the shop'} is scheduled for ${booking.confirmed_date} at ${booking.confirmed_time}. The shop owner will confirm shortly.\n\n${messageContent}`;
} else if (data.booking_result && !data.booking_result.success) {
  // Booking failed - AI should have explained, but add context
  messageContent = `⚠️ ${messageContent}`;
}
```

---

## Backend API Endpoint

**File:** `yoyakuyo-api/src/routes/ai.ts`  
**Route:** `POST /ai/chat`

### Request Body Structure

```typescript
{
  role: 'customer' | 'owner',
  messages: Array<{
    role: 'user' | 'assistant',
    content: string
  }>,
  userId?: string,
  shopContext?: { shopId: string },
  locale?: string,
  prefecture?: string,
  category?: string,
  searchQuery?: string,
  shops?: Array<{
    id: string,
    name: string,
    address?: string,
    prefecture?: string,
    normalized_city?: string,
    city?: string,
    category_id?: string,
    description?: string,
    opening_hours?: any,
    website?: string
  }>
}
```

### Response Structure

```typescript
{
  response: string, // AI's text response
  booking_result?: {
    success: boolean,
    booking_id?: string,
    confirmed_date?: string,
    confirmed_time?: string,
    shop_name?: string,
    error?: string,
    message?: string
  }
}
```

---

## System Prompt Template

**Location:** `yoyakuyo-api/src/routes/ai.ts` (lines 193-259)

### Complete Customer System Prompt

```
You are a helpful AI assistant for Yoyaku Yo, a shop discovery and booking platform in Japan. Your goal is to help customers find shops AND help them make bookings.

CURRENT DATE AND TIME:
- Today is {currentDateStr} ({currentDateFormatted})
- Current time is {currentTimeStr}
- Tomorrow is {tomorrowDateStr}
- When converting relative dates, ALWAYS use these dates:
  * "today" = {currentDateStr}
  * "tomorrow" = {tomorrowDateStr}
  * "next week" = calculate 7 days from {currentDateStr}
- NEVER use dates from your training data - always use the current date provided above

{shopsContext}
{categoriesContext}

Current filters:
{prefecture ? `- Prefecture: ${prefecture}\n` : ""}
{category ? `- Category: ${category}\n` : ""}
{searchQuery ? `- Search: ${searchQuery}\n` : ""}
{rememberedLocation ? `- Remembered user location: ${rememberedLocation}\n` : ""}
{locationMentioned && locationMentioned !== rememberedLocation ? `- Current location query: ${locationMentioned}\n` : ""}

CRITICAL SEARCH INSTRUCTIONS:
- When a customer asks about shops in ANY location, you MUST search the AVAILABLE SHOPS list above
- Location matching is flexible: "Chofu" = "chofu shi" = "調布市" = "Chofu City"
- If you find matching shops (marked with ⭐), ALWAYS list them with their booking links
- NEVER say "I don't have shops" if matches exist in the AVAILABLE SHOPS list

CONVERSATION MEMORY:
{rememberedLocation ? `- The user previously mentioned they are in/live in: ${rememberedLocation}\n- Do NOT ask for location again unless they mention a different area\n- Use this remembered location when suggesting shops\n` : ""}

Your role:
- Help customers find shops by area, category, or preferences
- Suggest shops based on their questions
- ALWAYS help customers make bookings when they ask
- Provide booking links in format: /shops/{shop_id}
- Guide customers step-by-step through the booking process
- Answer questions about the platform
- Be friendly, helpful, and proactive
- NEVER say you cannot make bookings - you ALWAYS help with bookings
- NEVER redirect users to external websites - stay within Yoyaku Yo platform
- CRITICAL: You MUST respond in {detectedLanguage}. The user wrote in {detectedLanguage}, so you MUST respond in the same language.
- If the user writes in Japanese, respond in Japanese. If they write in English, respond in English. If they write in Korean, respond in Korean. Always match their language.

AUTOMATIC BOOKING INSTRUCTIONS (MANDATORY):
- You CAN create bookings automatically using the API endpoint: POST /api/ai/auto-book
- When a customer wants to book, you MUST:
  1. Identify the shop they're referring to (from conversation context or AVAILABLE SHOPS)
  2. Extract the requested date and time from their message (e.g., "tomorrow at 2pm", "December 25 at 10:00")
  3. Extract or ask for the customer's name
  4. Call the auto-booking API with: { shop_id, customer_name, requested_date (YYYY-MM-DD), requested_time (HH:MM), notes (optional) }
  5. If booking succeeds, confirm: "✅ Booking confirmed! Your appointment at {Shop Name} is scheduled for {date} at {time}. The shop owner will confirm shortly."
  6. If booking fails (shop closed, time unavailable, etc.), explain the issue and suggest alternative times
- NEVER say "I cannot make bookings automatically" - you CAN and MUST create bookings
- If the customer doesn't provide date/time, ask: "What date and time would you like? (e.g., 'tomorrow at 2pm' or 'December 25 at 10:00')"
- If the customer doesn't provide their name, ask: "What name should I use for the booking?"
- Always use 24-hour time format (HH:MM) for the API call
- Convert relative dates (tomorrow, next week) to actual dates (YYYY-MM-DD)
- CRITICAL: Use the CURRENT DATE AND TIME provided above to calculate relative dates accurately
- "tomorrow" = {tomorrowDateStr} (always use this exact date when user says "tomorrow")
- "today" = {currentDateStr} (always use this exact date when user says "today")
- Never guess dates - always calculate from the current date provided above

AVAILABILITY CHECKING INSTRUCTIONS:
- When a customer asks "what time are you available" or "when can I book":
  1. Check the shop's opening_hours from the AVAILABLE SHOPS list above
  2. Suggest available times based on opening hours (e.g., "The shop is open from 9:00 to 18:00, so you can book between 9:00 and 17:00")
  3. If opening_hours is not available, suggest common business hours (e.g., "Typically shops are open 9:00-18:00, would you like to try booking at 10:00, 14:00, or 16:00?")
  4. You can also test availability by trying to create a booking - if it fails, the time is unavailable
- NEVER say "I don't have real-time availability" - you CAN check opening hours and suggest times
- Always provide helpful suggestions for available times based on shop hours
- If customer asks about availability, parse the opening_hours JSON and provide specific time suggestions
```

### Shop Context Format

```
AVAILABLE SHOPS ({count} total in database):
⭐ Shop Name (ID: {id}, Location: {prefecture}, {city}) - Hours: {opening_hours JSON} - Website: {website} - Booking: /shops/{id} - {description}
- Other Shop Name (ID: {id}, Location: {prefecture}, {city}) - Hours: {opening_hours JSON} - Website: {website} - Booking: /shops/{id} - {description}

⭐ = {matchingCount} shop(s) matching location "{location}"
```

---

## Function Calling Logic

**Location:** `yoyakuyo-api/src/routes/ai.ts` (lines 422-454)

### Function Definition

```typescript
const functions = [
  {
    name: "create_booking",
    description: "Create a booking automatically for a customer at a shop. Use this when the customer wants to book an appointment.",
    parameters: {
      type: "object",
      properties: {
        shop_id: {
          type: "string",
          description: "The shop ID from the AVAILABLE SHOPS list",
        },
        customer_name: {
          type: "string",
          description: "The customer's name",
        },
        requested_date: {
          type: "string",
          description: "Date in YYYY-MM-DD format (e.g., 2024-12-25)",
        },
        requested_time: {
          type: "string",
          description: "Time in HH:MM format (24-hour, e.g., 14:00 for 2pm)",
        },
        notes: {
          type: "string",
          description: "Optional notes for the booking",
        },
      },
      required: ["shop_id", "customer_name", "requested_date", "requested_time"],
    },
  },
];
```

### Function Call Flow

1. **OpenAI receives function call request**
   ```typescript
   if (aiMessage?.function_call?.name === "create_booking") {
     const functionArgs = JSON.parse(aiMessage.function_call.arguments || "{}");
   ```

2. **Internal API call to auto-booking endpoint**
   ```typescript
   const bookingResponse = await fetch(`${baseUrl}/api/ai/auto-book`, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       shop_id: functionArgs.shop_id,
       customer_name: functionArgs.customer_name,
       requested_date: functionArgs.requested_date,
       requested_time: functionArgs.requested_time,
       notes: functionArgs.notes || null,
     }),
   });
   ```

3. **Add function result to conversation**
   ```typescript
   openaiMessages.push({
     role: "assistant",
     content: null,
     function_call: aiMessage.function_call,
   });
   openaiMessages.push({
     role: "function",
     name: "create_booking",
     content: JSON.stringify(bookingResult),
   });
   ```

4. **Get final AI response**
   - OpenAI generates a natural language response based on the booking result
   - Success: Confirms booking with details
   - Failure: Explains error and suggests alternatives

---

## Booking Creation Flow

**File:** `yoyakuyo-api/src/routes/autoBooking.ts`

### Step-by-Step Process

1. **Payload Validation**
   - Required: `shop_id`, `customer_name`, `requested_date`, `requested_time`
   - Date format: `YYYY-MM-DD` (regex: `/^\d{4}-\d{2}-\d{2}$/`)
   - Time format: `HH:MM` (regex: `/^\d{2}:\d{2}$/`)

2. **Load Shop**
   ```typescript
   const { data: shop } = await supabase
     .from("shops")
     .select("id, name, opening_hours, timezone")
     .eq("id", shop_id)
     .single();
   ```

3. **Validate Booking Time**
   - Calls `validateBookingTime(shop_id, requested_date, requested_time)`
   - Returns `{ ok: true }` or error details

4. **Convert to Timestamps**
   ```typescript
   const startTime = `${requested_date}T${requested_time}:00`;
   const endTimeDate = new Date(startTime);
   endTimeDate.setHours(endTimeDate.getHours() + 1); // Default 1 hour
   const endTime = endTimeDate.toISOString();
   ```

5. **Insert Booking**
   ```typescript
   const bookingData = {
     shop_id,
     customer_name,
     date: requested_date,
     time_slot: requested_time,
     start_time: startTime,
     end_time: endTime,
     status: 'pending',
     notes: notes || null,
     created_at: new Date().toISOString(),
     updated_at: new Date().toISOString(),
   };
   ```

6. **Return Success Response**
   ```typescript
   {
     success: true,
     booking_id: newBooking.id,
     confirmed_date: requested_date,
     confirmed_time: requested_time,
     shop_name: shop.name,
   }
   ```

---

## Error Handling

### Booking Validation Errors

**File:** `yoyakuyo-api/src/utils/bookingValidator.ts`

#### Error Types

1. **SHOP_NOT_FOUND**
   - Shop doesn't exist in database
   - Message: "Shop not found"

2. **INVALID_TIME**
   - Date/time format invalid
   - Date is in the past
   - Message: "Invalid date or time format" or "Cannot book in the past"

3. **SHOP_CLOSED**
   - Requested time is outside opening hours
   - Message: "Shop is closed on {day} at {time}"

4. **TIME_UNAVAILABLE**
   - Time slot already booked
   - Message: "Time slot {time} on {date} is already booked"

### Validation Logic

```typescript
// 1. Check shop exists
if (!shop) return { ok: false, error: 'SHOP_NOT_FOUND' };

// 2. Check date is not in past
if (requestedDate < now) return { ok: false, error: 'INVALID_TIME' };

// 3. Check opening hours
const dayOfWeek = requestedDate.getDay();
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayName = dayNames[dayOfWeek];

if (openingHours[dayName]) {
  const [openTime, closeTime] = openingHours[dayName];
  if (time < openTime || time >= closeTime) {
    return { ok: false, error: 'SHOP_CLOSED' };
  }
}

// 4. Check for conflicting bookings
const conflictingBookings = await supabase
  .from("bookings")
  .select("id, start_time, end_time, status")
  .eq("shop_id", shopId)
  .neq("status", "cancelled")
  .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

if (conflictingBookings.length > 0) {
  return { ok: false, error: 'TIME_UNAVAILABLE' };
}
```

### API Error Responses

```typescript
// Auto-booking endpoint errors
{
  success: false,
  error: 'missing_fields' | 'invalid_time' | 'shop_not_found' | 'shop_closed' | 'time_unavailable' | 'database_error',
  message: string
}
```

---

## Language Detection

**File:** `yoyakuyo-api/src/utils/detectLanguage.ts`

### Detection Method

1. **Character Pattern Matching**
   - Japanese: Hiragana, Katakana, Kanji
   - Korean: Hangul
   - Chinese: Simplified/Traditional characters
   - Thai, Arabic, Hindi, Vietnamese: Script patterns

2. **Keyword Matching** (fallback)
   - Spanish, Portuguese, Tagalog, French, German, Italian: Common words

3. **Default**
   - Returns `'en'` if no pattern matches

### Usage in AI Route

```typescript
// Auto-detect from user message
let detectedLocale: SupportedLanguage = locale || 'en';
if (!locale || locale === 'auto') {
  const detected = detectLanguage(message);
  detectedLocale = detected;
}

// System prompt includes:
// "CRITICAL: You MUST respond in {getLanguageName(detectedLocale)}"
```

### Supported Languages

- `en` - English
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `es` - Spanish
- `pt` - Portuguese
- `tl` - Tagalog
- `fr` - French
- `de` - German
- `it` - Italian
- `ru` - Russian
- `ar` - Arabic
- `hi` - Hindi
- `th` - Thai
- `vi` - Vietnamese

---

## Shop Search Logic

**File:** `yoyakuyo-api/src/utils/shopSearch.ts`

### Location Detection Patterns

```typescript
const locationPatterns = [
  /(?:in|at|near|around|from|within)\s+([^\s,\.!?]+(?:\s+[^\s,\.!?]+)?(?:\s*(?:shi|city|ward|ku|cho|machi|市|区|町|村))?)/i,
  /(?:do you have|are there|any|shops?|shop)\s+(?:in|at|near)\s+([^\s,\.!?]+(?:\s+[^\s,\.!?]+)?(?:\s*(?:shi|city|ward|ku|cho|machi|市|区|町|村))?)/i,
  /(?:live in|from|I'm in|I am in|located in)\s+([^\s,\.!?]+(?:\s+[^\s,\.!?]+)?(?:\s*(?:shi|city|ward|ku|cho|machi|市|区|町|村))?)/i,
  /^([^\s,\.!?]+(?:\s+[^\s,\.!?]+)?(?:\s*(?:shi|city|ward|ku|cho|machi|市|区|町|村))?)$/i,
];
```

### Search Function

```typescript
export function findShopsByLocation(shops: any[], locationQuery: string): any[] {
  // Normalize location query
  const normalized = locationQuery.toLowerCase().trim();
  
  // Match against:
  // - prefecture
  // - normalized_city
  // - city
  // - address
  
  return shops.filter(shop => {
    const prefecture = (shop.prefecture || '').toLowerCase();
    const normalizedCity = (shop.normalized_city || '').toLowerCase();
    const city = (shop.city || '').toLowerCase();
    const address = (shop.address || '').toLowerCase();
    
    return (
      prefecture.includes(normalized) ||
      normalizedCity.includes(normalized) ||
      city.includes(normalized) ||
      address.includes(normalized)
    );
  });
}
```

### Conversation Memory

- Location mentioned in conversation is remembered
- Used for subsequent shop suggestions
- Stored in `rememberedLocation` variable
- Passed to system prompt for context

---

## Key Implementation Details

### Date/Time Handling

1. **Current Date Calculation**
   ```typescript
   const currentDate = new Date();
   const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
   const tomorrowDate = new Date(currentDate);
   tomorrowDate.setDate(tomorrowDate.getDate() + 1);
   const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0];
   ```

2. **Relative Date Conversion**
   - "tomorrow" → Calculated from current date
   - "today" → Current date
   - "next week" → Current date + 7 days
   - **CRITICAL:** Never use training data dates

3. **Time Format**
   - Input: Natural language ("2pm", "14:00", "2 PM")
   - Output: Always `HH:MM` (24-hour format)
   - Conversion: "2pm" → "14:00"

### Opening Hours Parsing

```typescript
// Google Places format
{
  "monday": ["09:00", "18:00"],
  "tuesday": ["09:00", "18:00"],
  // ...
}

// weekday_text format
{
  "weekday_text": [
    "Monday: 9:00 AM – 6:00 PM",
    "Tuesday: 9:00 AM – 6:00 PM",
    // ...
  ]
}
```

### Shop Context Building

```typescript
shopsToShow.forEach((shop: any) => {
  const location = shop.prefecture && shop.normalized_city 
    ? `${shop.prefecture}, ${shop.normalized_city}`
    : shop.city && shop.prefecture
    ? `${shop.prefecture}, ${shop.city}`
    : shop.address || "Location unknown";
  const bookingLink = `/shops/${shop.id}`;
  const isMatch = matchingShops.length > 0 && matchingShops.some(m => m.id === shop.id);
  const openingHoursInfo = shop.opening_hours ? ` - Hours: ${JSON.stringify(shop.opening_hours)}` : "";
  const websiteInfo = shop.website ? ` - Website: ${shop.website}` : "";
  shopsContext += `${isMatch ? "⭐ " : "- "}${shop.name} (ID: ${shop.id}, Location: ${location})${openingHoursInfo}${websiteInfo} - Booking: ${bookingLink}${shop.description ? ` - ${shop.description.substring(0, 50)}` : ""}\n`;
});
```

---

## Critical Rules (DO NOT BREAK)

1. ✅ **AI CAN create bookings** - Never say "I cannot make bookings"
2. ✅ **Always match user's language** - Detect and respond in same language
3. ✅ **Use current date** - Never use training data dates for "tomorrow"
4. ✅ **Check opening hours** - Use `opening_hours` from shop context
5. ✅ **Validate before booking** - Check shop exists, time valid, no conflicts
6. ✅ **Show booking confirmations** - Display success message with details
7. ✅ **Handle errors gracefully** - Explain issues and suggest alternatives
8. ✅ **Remember location** - Use conversation history for context
9. ✅ **Flexible location matching** - "Chofu" = "chofu shi" = "調布市"
10. ✅ **Never redirect external** - Stay within Yoyaku Yo platform

---

## File Locations

### Frontend
- `app/browse/components/BrowseAIAssistant.tsx` - Main customer AI component
- `lib/utils/aiBookingClient.ts` - Shared booking helper (not currently used by customer AI)

### Backend
- `yoyakuyo-api/src/routes/ai.ts` - Unified AI endpoint (customer + owner)
- `yoyakuyo-api/src/routes/autoBooking.ts` - Automatic booking endpoint
- `yoyakuyo-api/src/utils/bookingValidator.ts` - Booking validation logic
- `yoyakuyo-api/src/utils/shopSearch.ts` - Shop location search
- `yoyakuyo-api/src/utils/detectLanguage.ts` - Language detection

### Database
- `supabase/migrations/add_auto_booking_fields.sql` - Booking fields
- `supabase/migrations/add_google_places_fields.sql` - Opening hours field

---

## Testing Checklist

When verifying the AI assistant works:

- [ ] Customer can ask "show me shops in Tokyo"
- [ ] Customer can ask "I want to book at [shop name]"
- [ ] AI extracts date/time from natural language
- [ ] AI asks for customer name if missing
- [ ] AI creates booking via function call
- [ ] Booking validation works (past dates, closed hours, conflicts)
- [ ] Success message shows booking details
- [ ] Error messages are helpful and suggest alternatives
- [ ] Language detection works (English, Japanese, Korean, etc.)
- [ ] Location memory works across conversation
- [ ] Opening hours are checked and suggested
- [ ] Current date is used for "tomorrow" calculations

---

## Restoration Guide

If the AI assistant breaks:

1. **Check this document** - Compare current code to this reference
2. **Verify system prompt** - Ensure all instructions are present
3. **Check function calling** - Verify `create_booking` function is defined
4. **Test date calculation** - Ensure current date is passed correctly
5. **Verify validation** - Check `validateBookingTime` logic
6. **Test API endpoints** - Ensure `/ai/chat` and `/api/ai/auto-book` work
7. **Check language detection** - Verify `detectLanguage` is called
8. **Test shop search** - Ensure location matching works
9. **Verify frontend** - Check `BrowseAIAssistant.tsx` message handling
10. **Check database** - Ensure all required fields exist

---

**END OF REFERENCE DOCUMENT**


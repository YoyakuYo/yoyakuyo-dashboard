# LINE Integration Plan - Complete Booking System

## Overview
This plan outlines how to integrate LINE as a full booking platform where users can:
1. Access the app through LINE
2. Search shops by category name and location
3. Book appointments with the help of an AI assistant (LINE bot)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LINE ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  LINE Login  │    │ LINE Bot     │    │ LINE Mini   │  │
│  │  (Auth)      │    │ (Messaging)  │    │ App (LIFF)  │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘          │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Your Backend  │                        │
│                    │     (API)      │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │   Database     │                        │
│                    │   (Supabase)   │                        │
│                    └────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: LINE Bot Setup (AI Assistant)

### 1.1 LINE Messaging API Configuration

**What you need:**
- LINE Developers account (https://developers.line.biz/)
- Create a Messaging API channel
- Get Channel Access Token
- Set up Webhook URL

**Environment Variables:**
```env
LINE_MESSAGING_CHANNEL_ID=your_channel_id
LINE_MESSAGING_CHANNEL_SECRET=your_channel_secret
LINE_MESSAGING_ACCESS_TOKEN=your_access_token
LINE_WEBHOOK_URL=https://your-api.com/api/line/webhook
```

### 1.2 Bot Conversation Flow

```
User: "Hello" or "こんにちは"
Bot: "Welcome! I can help you find and book appointments. 
      What would you like to do?
      - Search shops by category
      - Search shops by location
      - Book an appointment
      - View my bookings"

User: "Search hair salon in Tokyo"
Bot: [Shows shop list with quick reply buttons]
     "I found 5 hair salons in Tokyo:
     1. Salon ABC (Shibuya)
     2. Salon XYZ (Shinjuku)
     ..."

User: [Clicks on shop]
Bot: "Great! When would you like to book?
     - Today
     - Tomorrow
     - Choose date"

User: "Tomorrow at 2pm"
Bot: [Shows available time slots]
     "Available times:
     - 2:00 PM ✓
     - 2:30 PM ✓
     - 3:00 PM ✗ (unavailable)"

User: "2:00 PM"
Bot: "Perfect! Please confirm:
     Shop: Salon ABC
     Date: Tomorrow
     Time: 2:00 PM
     Service: Haircut
     
     [Confirm] [Cancel]"

User: [Clicks Confirm]
Bot: "✅ Booking confirmed! 
     Booking ID: #12345
     You'll receive a reminder 1 hour before."
```

### 1.3 AI Assistant Integration

**Use your existing AI endpoint** (`/ai`) with LINE context:

```typescript
// When user sends message to LINE bot
1. Receive message from LINE webhook
2. Extract user intent (search, book, etc.)
3. Call your AI endpoint with:
   - role: "customer"
   - context: "line_bot"
   - userId: LINE user ID
   - message: user's message
4. AI processes request and returns structured response
5. Format response as LINE messages (text, buttons, carousel)
6. Send reply to user via LINE Messaging API
```

---

## Phase 2: LINE Mini App (LIFF) - Web Interface

### 2.1 What is LINE Mini App (LIFF)?

- Web app that opens inside LINE app
- Full web functionality (React/Next.js)
- Access to LINE user profile
- Seamless experience within LINE

### 2.2 LIFF Setup

**Create LIFF App:**
1. Go to LINE Developers Console
2. Create LIFF app
3. Set URL: `https://your-frontend.com/line-app`
4. Get LIFF ID

**Frontend Integration:**
```typescript
// Install LINE LIFF SDK
npm install @line/liff

// Initialize LIFF
import liff from '@line/liff';

liff.init({ liffId: 'YOUR_LIFF_ID' })
  .then(() => {
    if (liff.isLoggedIn()) {
      // Get user profile
      const profile = await liff.getProfile();
      // Use profile.userId for authentication
    }
  });
```

### 2.3 Shop Search Interface in LIFF

**Features:**
- Category filter (dropdown/buttons)
- Location search (prefecture, city)
- Map view (optional)
- Shop cards with quick booking
- AI chat assistant (embedded)

**Page Structure:**
```
/line-app
  ├── / (Home - Search)
  ├── /shops/[id] (Shop detail)
  ├── /book/[shopId] (Booking form)
  ├── /bookings (My bookings)
  └── /chat (AI assistant)
```

---

## Phase 3: Implementation Details

### 3.1 Database Schema Updates

**Add LINE user tracking:**
```sql
-- Add to customer_profiles table
ALTER TABLE customer_profiles 
ADD COLUMN line_user_id TEXT UNIQUE,
ADD COLUMN line_display_name TEXT,
ADD COLUMN line_picture_url TEXT;

-- Create LINE conversations table
CREATE TABLE line_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  customer_profile_id UUID REFERENCES customer_profiles(id),
  conversation_state TEXT, -- 'searching', 'booking', 'completed'
  context JSONB, -- Store booking context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create LINE bookings table (link LINE bookings to regular bookings)
CREATE TABLE line_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  line_user_id TEXT NOT NULL,
  line_message_id TEXT, -- For sending updates
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 API Endpoints to Create

#### LINE Webhook Handler
```typescript
POST /api/line/webhook
- Receives LINE webhook events
- Handles text messages, postback events
- Routes to AI assistant
- Sends replies via LINE Messaging API
```

#### Shop Search for LINE
```typescript
GET /api/line/shops/search
Query params:
  - category: string
  - prefecture: string
  - city: string
  - keyword: string
Returns: Shop list formatted for LINE messages
```

#### Booking via LINE
```typescript
POST /api/line/bookings
Body:
  - line_user_id: string
  - shop_id: string
  - service_id: string
  - date: string
  - time: string
Returns: Booking confirmation
```

### 3.3 LINE Message Types to Use

1. **Text Messages** - Simple responses
2. **Quick Reply** - Action buttons
3. **Carousel** - Shop listings with images
4. **Flex Messages** - Rich cards for shop details
5. **Template Messages** - Booking confirmations

---

## Phase 4: User Flow

### 4.1 First-Time User Flow

```
1. User adds your LINE bot as friend
2. Bot sends welcome message with menu
3. User clicks "Search Shops"
4. Bot asks: "What category?" (with buttons)
5. User selects category
6. Bot asks: "Which location?" (with buttons)
7. User selects location
8. Bot shows shop list (carousel)
9. User selects shop
10. Bot shows shop details + "Book Now" button
11. User clicks "Book Now"
12. Bot guides through booking (date, time, service)
13. Bot confirms booking
14. Bot sends booking details
```

### 4.2 Returning User Flow

```
1. User opens LINE bot
2. Bot shows quick menu:
   - Search shops
   - My bookings
   - Help
3. User can continue from where they left off
```

### 4.3 LIFF App Flow

```
1. User clicks link in LINE bot or QR code
2. LIFF app opens in LINE
3. User is automatically logged in (via LINE Login)
4. User sees full web interface:
   - Search bar
   - Category filters
   - Location selector
   - Shop grid/list
5. User clicks shop → Full shop page
6. User clicks "Book Now" → Booking form
7. User completes booking
8. Returns to LINE bot with confirmation
```

---

## Phase 5: Technical Implementation Steps

### Step 1: Set Up LINE Messaging API
- [ ] Create LINE Developers account
- [ ] Create Messaging API channel
- [ ] Get Channel Access Token
- [ ] Configure webhook URL
- [ ] Test webhook connection

### Step 2: Create Webhook Handler
- [ ] Create `/api/line/webhook` endpoint
- [ ] Verify webhook signature
- [ ] Handle text messages
- [ ] Handle postback events
- [ ] Integrate with AI assistant

### Step 3: Implement Shop Search
- [ ] Create shop search endpoint for LINE
- [ ] Format results as LINE messages
- [ ] Add category filtering
- [ ] Add location filtering
- [ ] Create carousel/flex messages

### Step 4: Implement Booking Flow
- [ ] Create booking endpoint for LINE
- [ ] Implement conversation state management
- [ ] Create booking confirmation messages
- [ ] Send booking reminders via LINE

### Step 5: Set Up LINE Login
- [ ] Create LINE Login channel
- [ ] Configure redirect URI
- [ ] Implement OAuth flow
- [ ] Link LINE users to customer profiles

### Step 6: Create LIFF App
- [ ] Create LIFF app in LINE Console
- [ ] Set up LIFF SDK in frontend
- [ ] Create `/line-app` routes
- [ ] Implement shop search UI
- [ ] Implement booking UI
- [ ] Test in LINE app

### Step 7: AI Assistant Integration
- [ ] Modify AI endpoint to handle LINE context
- [ ] Format AI responses as LINE messages
- [ ] Handle booking intents
- [ ] Handle search intents
- [ ] Test conversation flow

---

## Phase 6: Message Templates

### Welcome Message
```
"👋 Welcome to Yoyaku Yo!

I'm your AI assistant. I can help you:
🔍 Search shops by category or location
📅 Book appointments
📋 View your bookings
❓ Answer questions

What would you like to do?"
[Quick Reply: Search | My Bookings | Help]
```

### Shop Search Results
```
"Found 5 shops matching your search:

[Carousel with shop cards]
- Shop name
- Location
- Rating
- [View Details] button
```

### Booking Confirmation
```
"✅ Booking Confirmed!

📅 Date: January 15, 2025
🕐 Time: 2:00 PM
🏪 Shop: Salon ABC
💇 Service: Haircut
📍 Address: Shibuya, Tokyo

Booking ID: #12345

You'll receive a reminder 1 hour before your appointment."
```

---

## Phase 7: Advanced Features

### 7.1 Rich Menu
Add persistent menu at bottom of LINE chat:
- Search Shops
- My Bookings
- Help
- Settings

### 7.2 Push Notifications
- Booking reminders
- Booking confirmations
- Booking cancellations
- New shop recommendations

### 7.3 Location Services
- Use LINE's location picker
- Show shops on map
- Get directions

### 7.4 QR Codes
- Generate QR codes for shops
- Users scan to open LIFF app
- Direct to shop page

---

## Phase 8: Testing Checklist

- [ ] Webhook receives messages correctly
- [ ] Bot responds to text messages
- [ ] Shop search returns correct results
- [ ] Booking flow works end-to-end
- [ ] LINE Login authenticates users
- [ ] LIFF app opens in LINE
- [ ] AI assistant understands intents
- [ ] Booking confirmations are sent
- [ ] Push notifications work
- [ ] Error handling works

---

## Phase 9: Deployment

### 9.1 Production Setup
1. Use production LINE channels
2. Set production webhook URL
3. Configure LIFF app with production URL
4. Set up SSL certificate
5. Test all flows in production

### 9.2 Monitoring
- Monitor webhook delivery
- Track message response times
- Monitor booking success rate
- Track user engagement

---

## Estimated Timeline

- **Phase 1-2 (Setup)**: 1-2 weeks
- **Phase 3-4 (Core Features)**: 2-3 weeks
- **Phase 5-6 (Implementation)**: 2-3 weeks
- **Phase 7 (Advanced Features)**: 1-2 weeks
- **Phase 8-9 (Testing & Deployment)**: 1 week

**Total: 7-11 weeks**

---

## Cost Considerations

1. **LINE Messaging API**: Free tier available (up to 500 messages/month)
2. **LINE Login**: Free
3. **LIFF**: Free
4. **Hosting**: Your existing infrastructure
5. **AI API**: Your existing AI costs

---

## Next Steps

1. Review this plan
2. Set up LINE Developers account
3. Create Messaging API channel
4. Start with webhook handler
5. Implement basic bot responses
6. Add shop search
7. Add booking flow
8. Create LIFF app
9. Test and deploy

---

## Questions to Consider

1. Do you want the bot to handle all bookings, or redirect to LIFF app?
2. Should users be able to manage bookings through the bot?
3. Do you want to support multiple languages in the bot?
4. Should the bot remember user preferences?
5. Do you want to add payment integration?

---

This plan provides a complete roadmap for integrating LINE as a booking platform. The implementation can be done incrementally, starting with basic bot functionality and gradually adding more features.



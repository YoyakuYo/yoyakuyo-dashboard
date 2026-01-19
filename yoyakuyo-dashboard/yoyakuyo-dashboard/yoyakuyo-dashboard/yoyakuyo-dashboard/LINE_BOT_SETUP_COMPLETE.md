# ✅ LINE Bot Setup Complete - Booking Platform Integration

## What Was Updated

### 1. Welcome Message
- **When users add your bot**, they now see:
  - Welcome message promoting the **booking platform (LIFF app)**
  - Quick reply button: **"🚀 Open Booking Platform"** (primary action)
  - Secondary buttons: "📋 My Bookings" and "💬 Chat with AI"

### 2. Rich Menu (Bottom Menu Bar)
- **Updated to prioritize LIFF app**:
  - **Left button (50% width)**: Opens booking platform (LIFF app)
  - **Middle button (25% width)**: View bookings
  - **Right button (25% width)**: Chat with AI

### 3. Smart Message Routing
- When users type "book" or booking-related keywords → **Directs to LIFF app**
- When users ask about shops → **AI responds with LIFF app button**
- Chat still available for questions and assistance

---

## Next Steps: Set Up Rich Menu

### Step 1: Call the Rich Menu Setup Endpoint

After your API is deployed, call this endpoint to create the rich menu:

```bash
POST https://yoyakuyo-api.onrender.com/api/line/rich-menu/setup
```

**Or use curl:**
```bash
curl -X POST https://yoyakuyo-api.onrender.com/api/line/rich-menu/setup
```

**Or use Postman/Thunder Client:**
- Method: POST
- URL: `https://yoyakuyo-api.onrender.com/api/line/rich-menu/setup`
- No body required

### Step 2: Upload Rich Menu Image (Optional but Recommended)

After creating the rich menu, you'll get a `richMenuId`. You can upload an image for the menu:

1. Create an image (2500x843 pixels recommended)
2. Design it with 3 sections:
   - Left: "Open Booking Platform" 
   - Middle: "My Bookings"
   - Right: "Chat with AI"
3. Upload using LINE API or LINE Developers Console

**Note:** The rich menu will work without an image, but it's better with one.

---

## How It Works Now

### User Journey:

1. **User adds bot as friend** → 
   - Sees welcome message
   - **Primary button: "Open Booking Platform"** (opens LIFF app)

2. **User taps "Open Booking Platform"** →
   - LIFF app opens in LINE
   - Full booking interface appears
   - Can search shops, book appointments, view bookings

3. **User can still chat** →
   - Type messages in chat
   - AI responds
   - If booking-related, AI suggests opening LIFF app

4. **Rich Menu (bottom bar)** →
   - Always visible
   - Quick access to booking platform, bookings, and chat

---

## Features Available

### In LIFF App (Booking Platform):
- ✅ Search shops by category, location, name
- ✅ View shop details with images
- ✅ Book appointments (full form)
- ✅ View and manage bookings
- ✅ AI chat assistant (embedded)

### In LINE Chat:
- ✅ AI assistant for questions
- ✅ Quick access to bookings
- ✅ Direct links to booking platform
- ✅ Booking confirmations via push notifications

---

## Testing

1. **Add bot as friend** → Should see welcome message with "Open Booking Platform" button
2. **Tap "Open Booking Platform"** → Should open LIFF app
3. **Type "book" in chat** → Should suggest opening booking platform
4. **Check bottom menu** → Should see rich menu (after setup)

---

## Environment Variables Required

Make sure these are set in your backend:

```env
NEXT_PUBLIC_LIFF_ID=2008541897-ysd899rb
LINE_MESSAGING_ACCESS_TOKEN=your_token
LINE_MESSAGING_CHANNEL_ID=your_channel_id
LINE_MESSAGING_CHANNEL_SECRET=your_secret
```

---

## Summary

✅ **Welcome message** → Directs users to booking platform  
✅ **Rich menu** → Quick access to booking platform (largest button)  
✅ **Smart routing** → Booking requests → LIFF app  
✅ **Chat available** → AI assistant still works for questions  
✅ **Both work together** → Users can book AND chat simultaneously  

Your LINE bot now prioritizes the booking platform while keeping chat functionality available!


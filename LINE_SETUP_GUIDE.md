# LINE Integration Setup Guide

This guide will help you set up the complete LINE booking system for Yoyaku Yo.

## Prerequisites

1. LINE Developers account: https://developers.line.biz/
2. Access to your Supabase database
3. Your API server running and accessible via HTTPS (for webhooks)

---

## Step 1: Create LINE Messaging API Channel

1. Go to https://developers.line.biz/console/
2. Create a new **Provider** (if you don't have one)
3. Create a new **Messaging API channel**
4. Note down:
   - **Channel ID** → `LINE_MESSAGING_CHANNEL_ID`
   - **Channel Secret** → `LINE_MESSAGING_CHANNEL_SECRET`
   - **Channel Access Token** → `LINE_MESSAGING_ACCESS_TOKEN`

### Configure Webhook URL

1. In your Messaging API channel settings, set:
   - **Webhook URL**: `https://your-api-domain.com/api/line/webhook`
   - **Use webhook**: Enable
2. Verify webhook (LINE will send a test request)

---

## Step 2: Create LINE Login Channel (Optional but Recommended)

1. In LINE Developers Console, create a **LINE Login channel**
2. Configure:
   - **Callback URL**: `https://your-frontend-domain.com/api/line/login/callback`
   - **Scopes**: `profile`, `openid`, `email`
3. Note down:
   - **Channel ID** → `LINE_LOGIN_CHANNEL_ID`
   - **Channel Secret** → `LINE_LOGIN_CHANNEL_SECRET`

---

## Step 3: Create LIFF App

1. In LINE Developers Console, go to your Messaging API channel
2. Navigate to **LIFF** tab
3. Click **Add** to create a new LIFF app
4. Configure:
   - **LIFF app name**: Yoyaku Yo
   - **Size**: Full
   - **Endpoint URL**: `https://your-frontend-domain.com/line-app`
   - **Scope**: `profile`, `openid`, `email`
5. Note down the **LIFF ID** → `NEXT_PUBLIC_LIFF_ID`

---

## Step 4: Environment Variables

### Backend (yoyakuyo-api)

Add to your `.env` or environment configuration:

```env
# LINE Messaging API (Required)
LINE_MESSAGING_CHANNEL_ID=your_channel_id
LINE_MESSAGING_CHANNEL_SECRET=your_channel_secret
LINE_MESSAGING_ACCESS_TOKEN=your_access_token

# LINE Login (Optional)
LINE_LOGIN_CHANNEL_ID=your_login_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_login_channel_secret
LINE_LOGIN_REDIRECT_URI=https://your-frontend-domain.com/api/line/login/callback

# API URL (for AI integration)
API_URL=https://your-api-domain.com
```

### Frontend (Next.js)

Add to your `.env.local`:

```env
# LINE LIFF
NEXT_PUBLIC_LIFF_ID=your_liff_id

# API URL
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

---

## Step 5: Run Database Migration

Run the migration to create LINE tables:

```bash
# Using Supabase CLI
supabase migration up

# Or apply manually in Supabase SQL Editor
# File: supabase/migrations/20250202_add_line_booking_system.sql
```

This creates:
- `line_conversations` table
- `line_bookings` table
- Adds `line_user_id`, `line_display_name`, `line_picture_url` to `customer_profiles`

---

## Step 6: Deploy and Test

### Backend

1. Deploy your API with the new LINE routes
2. Ensure webhook URL is accessible via HTTPS
3. Test webhook in LINE Developers Console

### Frontend

1. Deploy your Next.js app with LIFF routes
2. Test LIFF app in LINE app

---

## Step 7: Test the Integration

### Test LINE Bot

1. Add your LINE bot as a friend
2. Send a message: "Hello"
3. Bot should respond with welcome message
4. Try: "/search" or "search hair salon"
5. Try: "book appointment"

### Test LIFF App

1. Open LINE app
2. Go to your bot
3. Click any link that opens LIFF (or use QR code)
4. Should see shop search interface
5. Test booking flow

---

## Troubleshooting

### Webhook Not Receiving Events

- Check webhook URL is HTTPS
- Verify webhook is enabled in LINE Console
- Check server logs for incoming requests
- Verify signature validation is working

### LIFF App Not Loading

- Check `NEXT_PUBLIC_LIFF_ID` is set correctly
- Verify LIFF endpoint URL matches your deployment
- Check browser console for errors
- Ensure LIFF SDK is loading

### Authentication Issues

- Verify LINE Login channel is configured
- Check callback URL matches exactly
- Ensure scopes include `profile`, `openid`, `email`

---

## API Endpoints

### LINE Webhook
- `POST /api/line/webhook` - Receives LINE events

### LINE Shop Search
- `GET /api/line/shops/search?category=...&prefecture=...&keyword=...`

### LINE Booking
- `POST /api/line/bookings` - Create booking via LINE

### LINE Login
- `GET /api/line/login` - Initiate LINE Login
- `GET /api/line/login/callback` - Handle callback
- `GET /api/line/user` - Get LINE user profile

---

## Next Steps

1. Customize welcome messages
2. Add rich menu (persistent menu at bottom)
3. Implement push notifications for booking reminders
4. Add QR code generation for shops
5. Customize message templates

---

## Support

For issues, check:
- LINE Developers Documentation: https://developers.line.biz/en/docs/
- LINE Bot SDK: https://github.com/line/line-bot-sdk-nodejs


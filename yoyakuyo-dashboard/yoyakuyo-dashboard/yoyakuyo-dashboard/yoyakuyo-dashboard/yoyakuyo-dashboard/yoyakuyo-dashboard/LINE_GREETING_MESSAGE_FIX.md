# 🔧 Fix: LINE Greeting Message Issue

## Problem
When users add your LINE bot, they only see the chat interface and the greeting message from LINE Official Account Manager, not the welcome message with the "Open Booking Platform" button.

## Root Cause
The **greeting message** in LINE Official Account Manager is showing first, and it might be preventing the webhook's welcome message from appearing.

---

## Solution: Update LINE Official Account Manager Settings

### Step 1: Disable or Update Greeting Message

1. Go to [LINE Official Account Manager](https://manager.line.biz/)
2. Select your **YOYAKUYO** account
3. Go to **Settings** → **Response settings** → **Greeting message**
4. You have two options:

#### Option A: Disable Greeting Message (Recommended)
- Turn OFF "Greeting message"
- This allows the webhook's welcome message to show instead
- The webhook will send the welcome message with "Open Booking Platform" button

#### Option B: Update Greeting Message to Include LIFF Link
- Keep greeting message ON
- Update the message text to:
```
👋 Welcome to Yoyaku Yo!

📱 Open our booking platform:
https://liff.line.me/2008541897-ysd899rb

🔍 Search shops, book appointments, and more!
```
- This way users see the LIFF link immediately

---

## Step 2: Verify Webhook is Receiving Follow Events

After your API redeploys, check the logs when someone adds your bot:

1. Go to your API logs (Render/Heroku/etc.)
2. When someone adds the bot, you should see:
   ```
   📨 Received 1 LINE event(s)
   📋 Processing event type: follow
   👋 Follow event detected, calling handleFollow
   📥 Follow event received for user: [user_id]
   ✅ Welcome message sent to user: [user_id]
   ```

If you don't see these logs, the webhook might not be receiving follow events.

---

## Step 3: Test the Fix

1. **Remove the bot** from your LINE app (unfriend)
2. **Add the bot again** (scan QR code or search)
3. You should now see:
   - Welcome message with "🚀 Open Booking Platform" button
   - OR updated greeting message with LIFF link

---

## Step 4: Set Up Rich Menu (Bottom Menu Bar)

After the welcome message works, set up the rich menu:

```bash
POST https://yoyakuyo-api.onrender.com/api/line/rich-menu/setup
```

This creates a bottom menu bar with:
- **Left (50%)**: Open Booking Platform
- **Middle (25%)**: My Bookings  
- **Right (25%)**: Chat with AI

---

## Expected Result

After fixing:
- ✅ Users see welcome message with "Open Booking Platform" button
- ✅ Tapping button opens LIFF app (booking platform)
- ✅ Rich menu at bottom for quick access
- ✅ Chat still available for questions

---

## Troubleshooting

### If welcome message still doesn't show:

1. **Check webhook URL** in LINE Developers Console:
   - Should be: `https://yoyakuyo-api.onrender.com/api/line/webhook`
   - Status should be "Verified" ✅

2. **Check API logs** for errors:
   - Look for "Error handling LINE event"
   - Check if follow events are being received

3. **Test webhook manually**:
   - In LINE Developers Console → Messaging API → Webhook settings
   - Click "Verify" to test webhook

4. **Check environment variables**:
   - `NEXT_PUBLIC_LIFF_ID=2008541897-ysd899rb`
   - `LINE_MESSAGING_ACCESS_TOKEN` is set
   - `LINE_MESSAGING_CHANNEL_SECRET` is set

---

## Quick Fix Summary

**In LINE Official Account Manager:**
1. Settings → Response settings → Greeting message
2. Either **disable it** OR **update it** to include LIFF link
3. Save changes

**Then test:**
- Remove and re-add the bot
- Should see welcome message with booking platform button


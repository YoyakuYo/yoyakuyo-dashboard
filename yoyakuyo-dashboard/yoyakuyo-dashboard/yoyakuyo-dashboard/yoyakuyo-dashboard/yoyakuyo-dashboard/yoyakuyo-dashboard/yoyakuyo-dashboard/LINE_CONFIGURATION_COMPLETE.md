# ✅ LINE Configuration Complete

## Environment Variables Updated

### ✅ API_URL
**Updated to:** `https://undecresasing-shakia-unmountable.ngrok-free.dev`

This ensures all redirect URIs will use the `/api/line/` prefix automatically.

### ✅ LINE Variables Verified
All required LINE environment variables are present in `apps/api/.env`:

- ✅ `LINE_LOGIN_CHANNEL_ID` - For customer LINE login
- ✅ `LINE_LOGIN_CHANNEL_SECRET` - For customer LINE login
- ✅ `LINE_MESSAGING_CHANNEL_ID` - For shop owner LINE connection
- ✅ `LINE_MESSAGING_CHANNEL_SECRET` - For shop owner LINE connection
- ✅ `LINE_MESSAGING_ACCESS_TOKEN` - For sending messages via LINE
- ✅ `LINE_REDIRECT_URI` - Currently set to localhost (will be auto-detected based on API_URL)

## Next Steps - LINE Developers Console

You need to manually update these in LINE Developers Console:

### 1. Messaging API Channel (for shop owners)
**URL:** https://developers.line.biz/console/channel/{LINE_MESSAGING_CHANNEL_ID}/settings/messaging-api

**Update:**
- **Callback URL:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/shop-callback`
- **Webhook URL:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/webhook`

### 2. LINE Login Channel (for customers)
**URL:** https://developers.line.biz/console/channel/{LINE_LOGIN_CHANNEL_ID}/settings/line-login

**Update:**
- **Callback URL:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/callback`

## Testing

1. **Restart API Server** (if running) to load new API_URL
2. **Click "Connect LINE Account"** button in Owner Dashboard
3. **Verify:**
   - Redirects to LINE OAuth (no 400 error)
   - Returns to dashboard with success message
   - QR code appears automatically
   - QR code displays on public shop page

## Expected Redirect URIs (Auto-Generated)

With `API_URL=https://undecresasing-shakia-unmountable.ngrok-free.dev`, the code will automatically use:

- **Shop Owner Callback:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/shop-callback`
- **LINE Login Callback:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/callback`
- **Webhook:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/webhook`

These must match exactly in LINE Developers Console!


# LINE Redirect URI & QR Code Fix Summary

## ✅ Issues Fixed

### 1. Redirect URI Mismatch
**Problem:** Redirect URIs were inconsistent between localhost and production/ngrok
- Routes mounted at `/line` but production expects `/api/line`
- Webhook at `/api/line/webhook` but callbacks at `/line/...`

**Solution:**
- Added `getRedirectUri()` helper function that automatically detects environment
- Uses `/api/line/` prefix when `API_URL` is set (production/ngrok)
- Uses `/line/` prefix for localhost
- Added route alias: `app.use("/api/line", line)` for production compatibility

### 2. QR Code Generation
**Problem:** QR code might not be saved reliably after LINE connection

**Solution:**
- Added double-check and retry logic in shop-callback handler
- Ensures `shops.line_qr_code_url` is saved even if first update fails

### 3. TypeScript Errors
**Problem:** TS1308 - `await` used outside async function

**Solution:**
- All route handlers using `await` are now marked as `async`
- Fixed `/shop-auth-url` route handler

## 📋 Final Working Redirect URIs

### For Production/Ngrok (when `API_URL` is set):
```
LINE Login Callback:    ${API_URL}/api/line/callback
Shop Owner Callback:    ${API_URL}/api/line/shop-callback
Webhook:                ${API_URL}/api/line/webhook
```

### For Localhost (when `API_URL` is not set or is localhost):
```
LINE Login Callback:    http://localhost:3000/line/callback
Shop Owner Callback:    http://localhost:3000/line/shop-callback
Webhook:                http://localhost:3000/api/line/webhook
```

## 🔧 Environment Variables Required

```env
# LINE Messaging API (for shop owners - "Connect LINE Account" button)
LINE_MESSAGING_CHANNEL_ID=your_messaging_channel_id
LINE_MESSAGING_CHANNEL_SECRET=your_messaging_channel_secret
LINE_MESSAGING_ACCESS_TOKEN=your_messaging_access_token

# LINE Login (for customers)
LINE_LOGIN_CHANNEL_ID=your_login_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_login_channel_secret

# API Configuration
API_URL=https://undecresasing-shakia-unmountable.ngrok-free.dev
# OR leave unset for localhost

# Optional: Override redirect URI if needed
LINE_REDIRECT_URI=https://your-domain.com/api/line/callback
```

## 📝 LINE Developers Console Configuration

### Messaging API Channel (for shop owners):
1. **Webhook URL:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/webhook`
2. **Callback URL:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/shop-callback`

### LINE Login Channel (for customers):
1. **Callback URL:** `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/callback`

## 📁 Files Changed

1. **`apps/api/src/services/lineService.ts`**
   - Added `getRedirectUri()` helper function
   - Updated `getShopOwnerLineAuthUrl()` to use dynamic redirect URI
   - Updated `handleShopOwnerLineCallback()` to use dynamic redirect URI
   - Updated `LINE_REDIRECT_URI` to use dynamic detection

2. **`apps/api/src/routes/line.ts`**
   - Fixed: Added `async` to `/shop-auth-url` route handler (line 40)
   - Added QR code double-check and retry logic in shop-callback handler

3. **`apps/api/src/index.ts`**
   - Added route alias: `app.use("/api/line", line)` for production compatibility

## ✅ Testing Checklist

1. **Set API_URL in .env:**
   ```
   API_URL=https://undecresasing-shakia-unmountable.ngrok-free.dev
   ```

2. **Update LINE Developers Console:**
   - Messaging API → Callback URL: `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/shop-callback`
   - Messaging API → Webhook URL: `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/webhook`
   - LINE Login → Callback URL: `https://undecresasing-shakia-unmountable.ngrok-free.dev/api/line/callback`

3. **Test "Connect LINE Account" button:**
   - Click button in Owner Dashboard → Shop Settings
   - Should redirect to LINE OAuth authorization page
   - After authorization, should return to dashboard WITHOUT 400 error
   - Should show success message: "LINE account connected successfully!"

4. **Verify QR Code:**
   - Check `shops.line_qr_code_url` in Supabase database
   - QR code should display on Owner Dashboard
   - QR code should display on Public Shop Page with "Add us on LINE" label

5. **Verify Webhook:**
   - Send a test message from LINE to the connected shop
   - Webhook should receive and process the message
   - AI should respond with shop context

## 🎯 Expected Behavior

- **Before LINE Connection:** Shows "Connect LINE to enable chat & QR" button
- **After LINE Connection:** 
  - QR code displays on Owner Dashboard (downloadable)
  - QR code displays on Public Shop Page
  - "Share on LINE" button is hidden
  - LINE webhook messages map to correct shop

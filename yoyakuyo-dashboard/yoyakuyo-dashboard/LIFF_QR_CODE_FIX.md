# LIFF QR Code 404 Fix

## Problem
- QR code scanning shows 404 error
- App opens in browser instead of LINE app

## Root Cause
The QR code URL format and LIFF endpoint configuration mismatch.

## Solution Applied

### 1. Fixed QR Code URL
**Changed from:** `https://liff.line.me/{LIFF_ID}/liff`  
**Changed to:** `https://liff.line.me/{LIFF_ID}` (root path)

**File:** `app/components/landing/LineQRCodeSection.tsx`

### 2. Updated /liff Route
- Improved redirect logic to properly handle query parameters
- Redirects to `/line-app` which has proper LIFF initialization

**File:** `app/liff/page.tsx`

### 3. Enhanced /line-app Route
- Better error handling when opened in browser
- Attempts to redirect to LINE app if opened externally

**File:** `app/line-app/page.tsx`

## ⚠️ CRITICAL: LINE Developers Console Configuration

You **MUST** verify the LIFF endpoint URL in LINE Developers Console:

1. Go to: https://developers.line.biz/console/
2. Select your Messaging API channel
3. Go to **LIFF** tab
4. Check your LIFF app settings
5. **Endpoint URL MUST be:** `https://yoyakuyo-dashboard.vercel.app/line-app`

### If Endpoint URL is Wrong:
- If it's set to `/liff` → Change to `/line-app`
- If it's set to root `/` → Change to `/line-app`
- The endpoint URL must match where your LIFF app actually lives

## How LIFF URLs Work

When you configure:
- **Endpoint URL:** `https://yoyakuyo-dashboard.vercel.app/line-app`
- **LIFF ID:** `2008541897-ysd899rb`

Then:
- `https://liff.line.me/2008541897-ysd899rb` → Opens `/line-app`
- `https://liff.line.me/2008541897-ysd899rb/shops/123` → Opens `/line-app/shops/123`

## Testing

1. **Update LINE Developers Console:**
   - Verify endpoint URL is: `https://yoyakuyo-dashboard.vercel.app/line-app`
   - Save changes

2. **Generate New QR Code:**
   - The QR code should now point to: `https://liff.line.me/{LIFF_ID}`
   - Clear browser cache and reload the landing page

3. **Test QR Code:**
   - **IMPORTANT:** Use LINE app's built-in camera scanner (not a regular QR scanner)
   - Open LINE app → Tap camera icon → Scan QR code
   - Should open directly in LINE app (not browser)

## Why It Opens in Browser

If the QR code opens in a browser instead of LINE:
1. **Wrong scanner:** Using regular QR scanner instead of LINE's scanner
2. **Wrong endpoint:** LIFF endpoint URL in console doesn't match `/line-app`
3. **LIFF not configured:** LIFF app might not be properly set up in console

## Next Steps

1. ✅ Code changes are complete
2. ⚠️ **YOU MUST:** Verify/update LIFF endpoint URL in LINE Developers Console
3. ⚠️ **YOU MUST:** Test QR code using LINE app's scanner (not regular QR scanner)
4. ⚠️ **YOU MUST:** Clear cache and regenerate QR code after console changes


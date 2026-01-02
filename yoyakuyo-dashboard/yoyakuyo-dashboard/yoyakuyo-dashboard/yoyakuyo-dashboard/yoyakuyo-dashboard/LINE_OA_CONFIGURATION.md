# LINE Official Account Configuration Guide

## STEP 1: LINE OA CONFIG

### 1.1 Verify LINE Official Account Exists
1. Go to [LINE Official Account Manager](https://manager.line.biz/)
2. Verify your account is active
3. Note your **LINE Official Account ID** (format: `@xxxxx`)

### 1.2 Enable LIFF "Add Friend Option"
1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your **Messaging API** channel
3. Go to **LIFF** tab
4. Click on your LIFF app (or create one if it doesn't exist)
5. **CRITICAL SETTINGS:**
   - **Endpoint URL**: `https://yoyakuyo-dashboard.vercel.app/line-app`
   - **Scope**: `profile`, `openid`
   - **Bot link feature**: **ENABLED** ✅
   - **Add friend option**: **ENABLED** ✅ (This is critical!)

### 1.3 Require Friendship Before LIFF Access
1. In LINE Developers Console → **LIFF** tab
2. Under **Bot link feature** settings:
   - Enable **"Require friendship"** option
   - This ensures users must add the Official Account as friend before accessing LIFF

### 1.4 Environment Variables
Add to your `.env.local` (frontend):
```env
NEXT_PUBLIC_LIFF_ID=2008541897-ysd899rb
NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID=your_account_id_without_at_symbol
```

Add to your backend `.env`:
```env
LINE_MESSAGING_ACCESS_TOKEN=your_access_token
LINE_MESSAGING_CHANNEL_SECRET=your_channel_secret
```

## STEP 2: QR CODE ROLE (Onboarding Only)

### Current Implementation
- QR code now points to LINE Official Account add-friend URL
- Format: `https://line.me/R/ti/p/@ACCOUNT_ID`
- After adding friend, user can access LIFF via Rich Menu or Chat

### How It Works
1. User scans QR code
2. LINE app opens add-friend screen
3. User adds Official Account as friend
4. Welcome message appears with "Open Booking Platform" button
5. User clicks button → LIFF opens
6. **No QR needed for future access** - use Rich Menu or Chat

## STEP 3: PERMANENT ENTRY POINTS

### Rich Menu Setup
1. Call the Rich Menu setup endpoint:
   ```bash
   POST https://yoyakuyo-api.onrender.com/api/line/rich-menu/setup
   ```

2. Rich Menu buttons:
   - **Left (50%)**: Open Booking Platform (LIFF)
   - **Middle (25%)**: My Bookings (LIFF)
   - **Right (25%)**: AI Chat (LIFF)

### Chat Deep Links
- Welcome message includes "Open Booking Platform" button
- Button opens LIFF directly
- No QR code required

## STEP 4: LIFF LOGIN FLOW

### Implementation
- On LIFF load, automatically calls `liff.login()` if not logged in
- Login persists across sessions
- ID token verified server-side
- User resolved via `line_accounts` table

### Flow
1. User opens LIFF (via Rich Menu or Chat)
2. LIFF checks: `liff.isLoggedIn()`
3. If not logged in → `liff.login()` → redirects to LINE login
4. After login → returns to LIFF
5. ID token sent to server → user resolved
6. Session persists

## STEP 5: PREVENT QR-ONLY ACCESS

### For Existing Friends
- **Rich Menu**: Opens LIFF directly (no QR)
- **Chat Button**: Opens LIFF directly (no QR)
- **Deep Links**: Open LIFF directly (no QR)

### For New Users
- **QR Code**: Forces add-friend first
- After add-friend: Can use Rich Menu/Chat (no QR needed)

## STEP 6: VERIFICATION CHECKLIST

### Test Flow
1. ✅ **Add friend once** (via QR code)
2. ✅ **Close LIFF**
3. ✅ **Reopen from Rich Menu**
4. ✅ **User remains logged in**
5. ✅ **Bookings persist**

### Expected Behavior
- QR code → Add friend → Welcome message → LIFF opens
- Rich Menu → LIFF opens directly (if already friend)
- Chat button → LIFF opens directly (if already friend)
- Login persists across sessions
- No QR required for returning users

## Troubleshooting

### If QR code doesn't work:
1. Verify `NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID` is set correctly
2. Check QR code points to: `https://line.me/R/ti/p/@ACCOUNT_ID`
3. Ensure account ID doesn't include `@` symbol in env var

### If LIFF login doesn't persist:
1. Verify LIFF settings in Developers Console
2. Check "Bot link feature" is enabled
3. Ensure `liff.login()` is called properly
4. Check browser/localStorage isn't blocking cookies

### If Rich Menu doesn't open LIFF:
1. Verify Rich Menu setup endpoint was called
2. Check Rich Menu URLs use correct LIFF ID
3. Ensure Rich Menu image is uploaded (optional but recommended)


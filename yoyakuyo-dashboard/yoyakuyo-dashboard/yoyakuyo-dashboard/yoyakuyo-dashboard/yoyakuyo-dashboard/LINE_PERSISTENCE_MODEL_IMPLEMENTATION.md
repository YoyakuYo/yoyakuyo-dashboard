# LINE Persistence Model Implementation

## Overview
This document outlines the correct implementation of LINE's persistence model, fixing the misuse of LIFF as a temporary QR entry.

## Architecture

### Entry Points
1. **QR Code (Onboarding Only)**: Forces add-friend, then redirects to LIFF
2. **Rich Menu (Permanent)**: Direct LIFF access for existing friends
3. **Chat Deep Links (Permanent)**: Direct LIFF access for existing friends

### Flow
```
QR Code → Add Friend → LIFF (with onboarding flag)
Rich Menu → LIFF (direct, no onboarding)
Chat Link → LIFF (direct, no onboarding)
```

## Implementation Steps

### STEP 1: LINE OA Configuration
- Enable "Add Friend Option" in LIFF settings
- Require friendship before LIFF access
- Configure in LINE Developers Console

### STEP 2: QR Code Role
- QR code points to LINE Official Account add-friend URL
- After add-friend, redirect to LIFF with onboarding flag
- QR code is for onboarding ONLY

### STEP 3: Permanent Entry Points
- Rich Menu button opens LIFF directly
- Chat deep links open LIFF directly
- No QR required for existing friends

### STEP 4: LIFF Login Flow
- On LIFF load: Call `liff.login()` if not logged in
- Verify ID token server-side
- Resolve user via `line_accounts` table
- Persist session properly

### STEP 5: Prevent QR-Only Access
- If user is already a friend: Allow app open via rich menu/chat
- No QR required for returning users

## Files Modified
1. `app/components/landing/LineQRCodeSection.tsx` - QR code to add-friend URL
2. `app/line-app/page.tsx` - LIFF login persistence
3. `app/liff/page.tsx` - Entry point detection
4. `yoyakuyo-api/src/routes/line-rich-menu.ts` - Rich Menu URLs
5. `LINE_OA_CONFIGURATION.md` - Configuration guide


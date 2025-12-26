# Current LINE Integration State

## Summary
Your codebase has **partial LINE integration** focused on:
1. **LINE Login/Share** - Frontend components (UI only, no backend routes)
2. **Database Schema** - LINE-related tables and columns (migrations exist)
3. **LINE Bot / LIFF** - Implemented in `yoyakuyo-api` (webhook + LIFF booking/chat flows)

**Missing (in this doc’s original scope):** varies by deployment, but generally OAuth/share helpers if you want the “UI only” components to work end-to-end.

---

## ✅ What EXISTS

### 1. LINE Login/Share Components (UI Only)

#### LineLoginButton Component
**File:** `app/components/LineLoginButton.tsx`

**What it does:**
- ✅ Renders LINE login button
- ✅ Calls `/line/auth-url` endpoint (but this route doesn't exist in your API)
- ⚠️ **Missing:** Backend route to handle LINE OAuth

**Expected API Endpoint (NOT IMPLEMENTED):**
```
GET /line/auth-url
```

#### LineShareButton Component
**File:** `app/components/LineShareButton.tsx`

**What it does:**
- ✅ Renders LINE share button
- ✅ Calls `/line/share-url` endpoint (but this route doesn't exist in your API)
- ⚠️ **Missing:** Backend route to generate LINE share URLs

**Expected API Endpoint (NOT IMPLEMENTED):**
```
GET /line/share-url?shop_id=xxx&shop_name=xxx
```

---

### 2. Database Schema (Migrations)

#### Migration 1: Basic LINE Integration
**File:** `supabase/migrations/20250121000002_add_line_integration.sql`

**What it adds:**
- ✅ `shops.line_official_account_id` - LINE Official Account ID
- ✅ `shops.line_channel_access_token` - LINE Channel Access Token
- ✅ `shops.line_webhook_url` - LINE Webhook URL
- ✅ `line_user_mappings` table - Maps LINE user IDs to customer IDs
  - `id`, `customer_id`, `line_user_id`, `line_display_name`, `line_picture_url`
  - RLS policies enabled
  - Indexes created

#### Migration 2: LINE Shop Settings
**File:** `supabase/migrations/20251121180102_add_line_shop_settings.sql`

**What it adds:**
- ✅ `line_shop_settings` table - Multi-tenant LINE webhook support
  - `shop_id`, `line_destination_id`, `line_channel_secret`, `line_access_token`
  - `welcome_message_template`
  - RLS policies for shop owners
- ✅ `shop_threads.line_user_id` - For LINE conversation isolation

#### Migration 3: LINE Destination & QR Codes
**File:** `supabase/migrations/20251122000000_add_line_destination_to_shops.sql`

**What it adds:**
- ✅ `shops.line_destination_id` - LINE destination ID for QR codes
- ✅ `shops.line_qr_code_url` - Public URL to LINE QR code image
- ✅ Index for `line_destination_id` lookups

#### Migration 4: Thread Types & LINE QR
**File:** `supabase/migrations/20251121192243_add_thread_types_and_line_qr.sql`

**What it adds:**
- ✅ Thread type support (likely for LINE conversations)

---

### 4. Dependencies

**File:** `yoyakuyo-api/package.json`

**Installed:**
- ✅ `@line/bot-sdk@^10.5.0` - LINE Bot SDK (installed but not used)

**Can be used for:**
- LINE Messaging API client
- Webhook signature verification
- Sending messages via LINE Bot

---

## ❌ What's MISSING

### 1. LINE Messaging API (Bot) - NOT IMPLEMENTED

**Missing Files:**
- ❌ `yoyakuyo-api/src/routes/line.ts` - LINE API routes
- ❌ `yoyakuyo-api/src/services/lineService.ts` - LINE service functions
- ❌ `yoyakuyo-api/src/services/lineWebhookService.ts` - Webhook handler

**Missing Features:**
- ❌ Webhook endpoint (`POST /line/webhook`)
- ❌ Message handling (text, postback, etc.)
- ❌ Shop search via bot
- ❌ Booking flow via bot
- ❌ AI assistant integration with LINE bot
- ❌ Push notifications via LINE

**Required Environment Variables (NOT SET):**
```env
LINE_MESSAGING_CHANNEL_ID=your_channel_id
LINE_MESSAGING_CHANNEL_SECRET=your_channel_secret
LINE_MESSAGING_ACCESS_TOKEN=your_access_token
```

---

### 2. LINE Login Backend - NOT IMPLEMENTED

**Missing Routes:**
- ❌ `GET /line/auth-url` - Generate LINE OAuth URL
- ❌ `GET /line/callback` - Handle LINE OAuth callback
- ❌ `POST /line/link-account` - Link LINE account to customer profile

**Missing Features:**
- ❌ LINE OAuth flow
- ❌ LINE user profile retrieval
- ❌ Linking LINE users to customer_profiles
- ❌ LINE Login authentication

**Required Environment Variables (NOT SET):**
```env
LINE_LOGIN_CHANNEL_ID=your_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_channel_secret
LINE_REDIRECT_URI=https://your-api.com/line/callback
```

---

### 3. LINE Share Backend - NOT IMPLEMENTED

**Missing Route:**
- ❌ `GET /line/share-url` - Generate LINE share URL

**Missing Features:**
- ❌ LINE share URL generation
- ❌ Shop sharing via LINE

---

### 4. LINE Mini App (LIFF) - NOT IMPLEMENTED

**Missing:**
- ❌ LIFF app creation in LINE Console
- ❌ LIFF SDK integration in frontend
- ❌ `/line-app` routes in frontend
- ❌ LINE context detection
- ❌ LINE user profile in LIFF

**Required:**
- LIFF ID from LINE Console
- Frontend routes for LINE app
- LIFF SDK: `npm install @line/liff`

---

### 5. AI Assistant + LINE Bot Integration - NOT IMPLEMENTED

**Missing:**
- ❌ LINE bot conversation flow
- ❌ Shop search via LINE bot
- ❌ Booking via LINE bot
- ❌ Integration with existing `/ai/chat` endpoint
- ❌ LINE message formatting (text, buttons, carousel, flex)

---

## 📊 Implementation Status

| Feature | Status | Files | Notes |
|---------|--------|-------|-------|
| LINE Login UI | ⚠️ Partial | `LineLoginButton.tsx` | UI only, no backend |
| LINE Share UI | ⚠️ Partial | `LineShareButton.tsx` | UI only, no backend |
| Database Schema | ✅ Complete | 4 migrations | All tables/columns exist |
| LINE Bot SDK | ✅ Installed | `package.json` | Not used yet |
| LINE Messaging API | ❌ Missing | None | Need to create |
| LINE Webhook | ❌ Missing | None | Need to create |
| LINE Login Backend | ❌ Missing | None | Need to create |
| LINE Share Backend | ❌ Missing | None | Need to create |
| LINE Mini App (LIFF) | ❌ Missing | None | Need to create |
| AI + LINE Bot | ❌ Missing | None | Need to integrate |

---

## 🔧 What Needs to Be Built

### Priority 1: LINE Messaging API (Bot)
1. Create `yoyakuyo-api/src/routes/line.ts`
2. Create `yoyakuyo-api/src/services/lineService.ts`
3. Create `yoyakuyo-api/src/services/lineWebhookService.ts`
4. Implement webhook handler
5. Integrate with existing AI endpoint
6. Add shop search functionality
7. Add booking flow

### Priority 2: LINE Login Backend
1. Implement `GET /line/auth-url`
2. Implement `GET /line/callback`
3. Link LINE users to customer_profiles
4. Update frontend to use real endpoints

### Priority 3: LINE Share Backend
1. Implement `GET /line/share-url`
2. Generate LINE share URLs

### Priority 4: LINE Mini App (LIFF)
1. Create LIFF app in LINE Console
2. Install LIFF SDK
3. Create `/line-app` routes
4. Integrate with existing shop search/booking

---

## 📝 Next Steps

Based on your requirements (shop search + AI-assisted booking via LINE):

1. **Start with LINE Messaging API (Bot)**
   - This is the core feature you need
   - Allows users to search shops and book via chat
   - Integrates with your existing AI assistant

2. **Then add LINE Login**
   - Allows users to authenticate via LINE
   - Links LINE accounts to customer profiles

3. **Finally add LIFF**
   - Provides rich web interface within LINE
   - Better UX for complex interactions

---

## 🎯 Quick Start Guide

To implement the missing LINE bot functionality:

1. **Set up LINE Developers account**
   - Create Messaging API channel
   - Get Channel Access Token
   - Configure webhook URL

2. **Create backend routes**
   - Copy structure from `LINE_INTEGRATION_PLAN.md`
   - Implement webhook handler
   - Integrate with `/ai/chat` endpoint

3. **Test webhook**
   - Use ngrok for local testing
   - Verify webhook signature
   - Test message handling

4. **Add shop search**
   - Format shop results as LINE messages
   - Use carousel/flex messages for rich UI

5. **Add booking flow**
   - Guide users through booking via chat
   - Use quick reply buttons
   - Confirm bookings via LINE

---

## 📚 Reference Files

- **Plan:** `LINE_INTEGRATION_PLAN.md` - Complete implementation plan
- **Payments:** `yoyakuyo-api/src/routes/payments.ts` (lines 195-382)
- **Frontend Pay:** `app/components/payments/LinePayButton.tsx`
- **Frontend Login:** `app/components/LineLoginButton.tsx`
- **Frontend Share:** `app/components/LineShareButton.tsx`
- **Migrations:** `supabase/migrations/20250121000002_add_line_integration.sql`

---

This document shows what you have and what you need to build to complete the LINE integration for shop search and AI-assisted booking.


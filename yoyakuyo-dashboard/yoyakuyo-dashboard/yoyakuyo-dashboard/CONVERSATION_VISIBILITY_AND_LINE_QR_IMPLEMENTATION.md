# Conversation Visibility & LINE QR Code Implementation Summary

## Overview
This document summarizes the implementation of two major features:
- **A) Conversation Visibility & Roles**: Proper separation of owner and customer threads
- **B) Per-Shop Premium LINE QR Codes**: QR code generation and display for LINE integration

---

## A) CONVERSATION VISIBILITY & ROLES

### Database Changes

**Migration:** `supabase/migrations/20251121192243_add_thread_types_and_line_qr.sql`

1. **Added `thread_type` to `shop_threads` table:**
   - Type: `TEXT NOT NULL DEFAULT 'customer'`
   - Constraint: `CHECK (thread_type IN ('owner', 'customer'))`
   - Indexes: `shop_threads_thread_type_idx`, `shop_threads_shop_type_idx`
   - **Purpose**: Distinguishes between owner AI assistant conversations (internal) and customer conversations (public/LINE)

2. **Added `source` to `shop_messages` table:**
   - Type: `TEXT CHECK (source IN ('dashboard', 'public', 'line'))`
   - Index: `shop_messages_source_idx`
   - **Purpose**: Tracks where messages originated from

3. **Added `anonymous_session_id` to `shop_threads` table:**
   - Type: `TEXT`
   - Index: `shop_threads_anonymous_session_idx` (partial, WHERE anonymous_session_id IS NOT NULL)
   - **Purpose**: Identifies anonymous public visitors for thread isolation

### API Changes

#### 1. **LINE Webhook Service** (`apps/api/src/services/lineWebhookService.ts`)
   - Updated `getOrCreateLineThread()` to set `thread_type = 'customer'` for all LINE threads
   - Updated `saveLineMessage()` to set `source = 'line'` for LINE messages

#### 2. **Messages Routes** (`apps/api/src/routes/messages.ts`)
   - **`POST /messages/start-thread`**:
     - Accepts `threadType` and `anonymousSessionId` parameters
     - Defaults to `threadType = 'customer'` for public access
     - Filters existing threads by `thread_type` for security
   - **`GET /messages/thread/:threadId`**:
     - **Security**: Verifies access based on `thread_type`:
       - `thread_type = 'owner'`: Only shop owners can access
       - `thread_type = 'customer'`: Owners OR matching `anonymous_session_id`/`line_user_id`/`customer_id`
     - Returns `source` field in message objects
   - **`POST /messages/thread/:threadId/send`**:
     - Verifies thread exists and gets `thread_type` for security
     - Sets `source` field (defaults to 'dashboard')
   - **`GET /messages/owner/threads`**:
     - Returns both `thread_type = 'owner'` and `thread_type = 'customer'` threads
     - Includes `threadType` and `lineUserId` in response

#### 3. **LINE Webhook Handler** (`apps/api/src/server.ts`)
   - All LINE messages saved with `source = 'line'`
   - All LINE threads created with `thread_type = 'customer'`

### Frontend Changes

#### 1. **Public Shop Page** (`apps/dashboard/app/book/[shopId]/page.tsx`)
   - **Anonymous Session ID**:
     - Generates/retrieves `anonymous_session_id` from `localStorage` (`yoyaku_yo_anonymous_session`)
     - Passes `anonymousSessionId` when starting threads
     - Passes `anonymousSessionId` as query parameter when loading messages
   - **Thread Creation**:
     - Always uses `threadType = 'customer'` for public visitors
     - Includes `anonymousSessionId` in thread creation

#### 2. **Owner Dashboard** (`apps/dashboard/app/(owner)/assistant/page.tsx`)
   - Already loads all threads (both owner and customer types)
   - Thread list shows `threadType` information
   - Owner can view both internal AI conversations and customer conversations

### Security & Access Control

- **Public visitors**: Can only access threads where:
  - `thread_type = 'customer'`
  - `anonymous_session_id` matches their session
  - `shop_id` matches the current shop page

- **Shop owners**: Can access:
  - All `thread_type = 'owner'` threads for their shops (internal AI assistant)
  - All `thread_type = 'customer'` threads for their shops (public/LINE conversations)

- **LINE users**: Can only access:
  - `thread_type = 'customer'` threads
  - Threads where `line_user_id` matches their LINE user ID
  - Threads for the shop associated with their LINE destination

---

## B) PER-SHOP PREMIUM LINE QR CODES

### Database Changes

**Migration:** `supabase/migrations/20251121192243_add_thread_types_and_line_qr.sql`

1. **Added to `shops` table:**
   - `line_qr_image_url TEXT`: Public URL to the QR code image
   - `line_deeplink_url TEXT`: LINE deep link URL encoding `shop_id`
   - Index: `shops_line_deeplink_idx` (partial, WHERE line_deeplink_url IS NOT NULL)

### API Changes

#### 1. **QR Code Route** (`apps/api/src/routes/qr.ts`) - NEW FILE
   - **`GET /qr/shop/:shopId/line`**:
     - Verifies shop exists and user owns it (if `x-user-id` header provided)
     - Returns existing QR if already generated
     - Generates `line_deeplink_url` using:
       - `LIFF_APP_ID` environment variable (if set): `https://liff.line.me/${LIFF_APP_ID}?shop_id=${shopId}`
       - `LINE_OFFICIAL_ACCOUNT_ID` (if set): `https://line.me/R/oa/${LINE_OFFICIAL_ACCOUNT_ID}?shop_id=${shopId}`
       - Fallback: Generic LINE URL with `shop_id` parameter
     - Generates QR code image using external service (QR Server API)
     - Updates `shops` table with `line_qr_image_url` and `line_deeplink_url`
     - Returns both QR image URL and deeplink URL

#### 2. **Index Route** (`apps/api/src/index.ts`)
   - Registered `/qr` route

### Frontend Changes

#### 1. **Public Shop Page** (`apps/dashboard/app/book/[shopId]/page.tsx`)
   - **LINE QR Code Section**:
     - Loads QR code on mount via `/qr/shop/:shopId/line`
     - Displays QR code image with Japanese label "LINEで予約はこちら"
     - Shows "LINEで予約はこちら" button that opens `line_deeplink_url`
     - Positioned between booking form and chat section

#### 2. **Owner Dashboard** (`apps/dashboard/app/shops/page.tsx`)
   - **LINE QR Code Component** (`LineQrSection`):
     - Loads QR code for shop owner
     - Displays QR code image with Japanese label
     - "Copy LINE Link" button: Copies `line_deeplink_url` to clipboard
     - "Download QR Code" button: Downloads QR image
     - Added to Overview tab in shop management page

### LINE Deep Link Format

The deep link URL format encodes the `shop_id` parameter:

- **LIFF**: `https://liff.line.me/${LIFF_APP_ID}?shop_id=${shopId}`
- **Official Account**: `https://line.me/R/oa/${LINE_OFFICIAL_ACCOUNT_ID}?shop_id=${shopId}`
- **Fallback**: `https://line.me/R/ti/p/@${LINE_OFFICIAL_ACCOUNT_ID}?shop_id=${shopId}`

### Environment Variables Required

- `LIFF_APP_ID` (optional): LINE LIFF App ID
- `LINE_OFFICIAL_ACCOUNT_ID` (optional): LINE Official Account ID

---

## Testing Checklist

### A) Conversation Visibility

- [ ] Public visitor can only see their own customer thread
- [ ] Public visitor cannot see owner threads
- [ ] Public visitor cannot see other customers' threads
- [ ] Owner can see all customer threads for their shop
- [ ] Owner can see owner threads (internal AI assistant)
- [ ] LINE user can only see their own customer thread
- [ ] LINE user cannot see owner threads or other customers' threads
- [ ] Thread access is properly restricted by `thread_type` and session/user ID

### B) LINE QR Codes

- [ ] QR code generates for shop owner
- [ ] QR code displays on public shop page
- [ ] QR code displays in owner dashboard
- [ ] Deep link URL includes `shop_id` parameter
- [ ] "Copy LINE Link" button works
- [ ] "Download QR Code" button works
- [ ] QR code persists after generation (reused if exists)
- [ ] LINE webhook correctly associates users with `shop_id` from deeplink

---

## Files Modified

### Database
- `supabase/migrations/20251121192243_add_thread_types_and_line_qr.sql` (NEW)

### API
- `apps/api/src/services/lineWebhookService.ts`
- `apps/api/src/routes/messages.ts`
- `apps/api/src/server.ts`
- `apps/api/src/routes/qr.ts` (NEW)
- `apps/api/src/index.ts`

### Frontend
- `apps/dashboard/app/book/[shopId]/page.tsx`
- `apps/dashboard/app/shops/page.tsx`

---

## Next Steps

1. **Run Migration:**
   ```bash
   npx supabase db push
   # or
   npm run migrate:auto
   ```

2. **Set Environment Variables:**
   - `LIFF_APP_ID` (optional)
   - `LINE_OFFICIAL_ACCOUNT_ID` (optional)

3. **Test Features:**
   - Verify conversation visibility restrictions
   - Generate and test LINE QR codes
   - Verify deep link `shop_id` parameter is correctly handled by LINE webhook

4. **Optional Enhancements:**
   - Add premium QR code styling with canvas library (currently uses external service)
   - Add QR code regeneration option for owners
   - Add analytics tracking for QR code scans
   - Implement proper customer-user mapping for authenticated customers

---

## Notes

- The QR code generation currently uses an external service (QR Server API) as a fallback. For production, consider using a proper QR library like `qrcode` npm package with canvas for premium styling.
- The `anonymous_session_id` is stored in `localStorage` and persists across page refreshes, allowing public visitors to maintain their conversation thread.
- Owner AI assistant conversations (via `/owner/command`) are not currently saved to threads. This could be added in a future update if conversation history is needed for owner AI interactions.


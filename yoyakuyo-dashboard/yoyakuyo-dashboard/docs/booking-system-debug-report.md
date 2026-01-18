# Booking System Debug Report

## Overview
This document provides a comprehensive overview of the booking system architecture, authentication paths, notification flow, and debugging procedures.

---

## Current Booking Data Model

### Core Tables

#### `bookings`
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id),
  service_id UUID REFERENCES services(id),
  source TEXT NOT NULL CHECK (source IN ('line','web','guest')),
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','cancelled','completed','rejected')),
  booked_for TIMESTAMPTZ NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Fields:**
- `customer_id`: Canonical customer ID (references `customers.id`)
- `source`: Booking origin ('line', 'web', 'guest')
- `shop_id`: Shop where booking is made
- `status`: Current booking status

#### `customers`
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('guest','customer','owner')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Fields:**
- `id`: UUID that equals `auth.users.id` (for authenticated users) or generated UUID (for guests)
- `role`: Customer role ('guest', 'customer', 'owner')

#### `line_accounts`
```sql
CREATE TABLE line_accounts (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Fields:**
- `customer_id`: Links LINE user to canonical customer
- `line_user_id`: LINE user ID (from ID token `sub`)

#### `shop_notifications`
```sql
CREATE TABLE shop_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'new_booking' CHECK (type IN ('new_booking')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields:**
- `shop_id`: Shop that owns the notification
- `booking_id`: Related booking
- `is_read`: Badge state (false = unread, true = read)

---

## Auth Paths

### 1. LINE Users (LIFF)

**Flow:**
1. User opens LIFF app in LINE
2. `liff.init()` → `liff.login()` if not logged in
3. Get ID token: `liff.getIDToken()`
4. Verify ID token server-side: `POST /api/line/liff/verify`
5. Extract LINE `sub` from verified token
6. Resolve `customer_id` via `line_accounts`:
   ```sql
   SELECT customer_id FROM line_accounts WHERE line_user_id = :line_sub
   ```
7. If not found, call `get_or_create_customer_from_line(:line_sub)` RPC

**Booking Creation:**
- Endpoint: `POST /api/line/bookings`
- Headers: `Content-Type: application/json`
- Body: `{ line_user_id, shop_id, service_id, date, time, start_time, end_time }`
- Creates booking with `customer_id` (from line_accounts) and `source='line'`

**Booking Fetch:**
- Endpoint: `POST /api/line/liff/bookings`
- Headers: `Content-Type: application/json`, Body: `{ id_token: liff.getIDToken() }`
- Server verifies ID token → extracts `sub` → resolves `customer_id` → queries bookings

**Cancel Booking:**
- Endpoint: `POST /bookings/:id/cancel`
- Headers: `x-user-id: customer_id` OR `x-line-user-id: line_user_id` OR `x-id-token: id_token`
- Backend resolves `customer_id` and validates ownership

### 2. Web Users (Authenticated)

**Flow:**
1. User logs in via Supabase Auth (email/password)
2. `auth.users.id` = canonical user ID
3. Ensure `customers` record exists:
   ```sql
   INSERT INTO customers (id, role) 
   VALUES (:auth_user_id, 'customer')
   ON CONFLICT (id) DO NOTHING
   ```

**Booking Creation:**
- Endpoint: `POST /bookings`
- Headers: `x-user-id: auth.users.id`
- Body: `{ shop_id, service_id, date, time, start_time, end_time }`
- Creates booking with `customer_id = auth.users.id` and `source='web'`

**Booking Fetch:**
- Endpoint: `GET /bookings`
- Headers: `x-user-id: auth.users.id`
- Queries: `SELECT * FROM bookings WHERE customer_id = :user_id AND source IN ('web', 'line')`

**Cancel Booking:**
- Endpoint: `POST /bookings/:id/cancel`
- Headers: `x-user-id: auth.users.id`
- Backend validates `booking.customer_id = user_id`

### 3. Guest Users (No Account)

**Flow:**
1. No authentication required
2. User provides: name, email, phone
3. Create `customers` record with `role='guest'`:
   ```sql
   INSERT INTO customers (id, role)
   VALUES (gen_random_uuid(), 'guest')
   RETURNING id
   ```

**Booking Creation:**
- Endpoint: `POST /bookings` or `POST /shops/:id/bookings`
- Body: `{ shop_id, service_id, customer_name, customer_email, customer_phone, date, time }`
- Creates booking with `customer_id` (guest UUID) and `source='guest'`

**Booking Fetch:**
- No dashboard for guests
- Access via email link or booking confirmation token

**Cancel Booking:**
- Endpoint: `POST /bookings/:id/cancel`
- Requires booking confirmation token or email verification
- Backend validates guest ownership

---

## Notification Flow

### Badge Count Query (Single Source of Truth)

```sql
SELECT COUNT(*)
FROM shop_notifications sn
JOIN shops s ON s.id = sn.shop_id
WHERE s.owner_user_id = :owner_id
  AND sn.is_read = false;
```

**Implementation:**
- Frontend: `apps/dashboard/lib/useBookingNotifications.ts`
- Query: Uses `shop_id IN (SELECT id FROM shops WHERE owner_user_id = :owner_id)`
- Badge appears on:
  - Sidebar "Bookings" item (GLOBAL)
  - "My Shop → Bookings" tab (LOCAL)

### Notification Creation

**Automatic Trigger:**
```sql
CREATE TRIGGER trigger_create_shop_notification
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_shop_notification_on_booking();
```

**Function:**
```sql
CREATE OR REPLACE FUNCTION create_shop_notification_on_booking()
RETURNS TRIGGER
AS $$
BEGIN
    IF NEW.shop_id IS NOT NULL THEN
        INSERT INTO shop_notifications (shop_id, booking_id, type, is_read)
        VALUES (NEW.shop_id, NEW.id, 'new_booking', FALSE)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;
```

### Badge Clearing Rules

**Badge DOES NOT clear on:**
- ❌ Login
- ❌ Dashboard load
- ❌ Websocket connect
- ❌ Booking fetch

**Badge clears ONLY when:**
- ✅ Owner opens GLOBAL Bookings page (`/bookings`)
- ✅ Owner opens My Shop → Bookings tab

**Implementation:**
- `apps/dashboard/app/bookings/page.tsx`
- Skips first render to prevent auto-marking
- Uses pathname check to ensure on bookings page
- 2 second delay before marking as read

### Realtime Updates

**Subscription:**
```typescript
supabase
  .channel('shop_notifications_realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'shop_notifications',
  }, async (payload) => {
    // Reload badge count
    await reloadPendingCount();
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'shop_notifications',
  }, async (payload) => {
    // Reload badge count if is_read changed
    await reloadPendingCount();
  })
  .subscribe();
```

**Fallback:**
- If realtime fails, manual refetch every 30s (temporary)

---

## Badge Clearing Rules

### When Badge Appears
- On login → Fetch count immediately
- On realtime booking event → Refetch count
- On new booking creation → Realtime event triggers refetch

### When Badge Clears
- **ONLY** when owner explicitly opens `/bookings` page
- After 2 second delay (ensures page is loaded)
- Mark all unread notifications as read
- Refetch count (should be 0)

### When Badge Does NOT Clear
- ❌ On dashboard mount
- ❌ On login
- ❌ On websocket connect
- ❌ On booking fetch
- ❌ On any page other than `/bookings`

---

## Known Failure Modes

### 1. Badge Not Showing After Booking Creation

**Symptoms:**
- Booking created successfully
- Notification exists in database
- Badge count = 0

**Root Causes:**
- Realtime subscription not active
- Badge count query using wrong conditions
- Shop IDs not loaded yet

**Fix:**
- Verify realtime subscription is active
- Check badge count query uses correct shop IDs
- Ensure `reloadPendingCount()` is called on login

### 2. Badge Clears Too Early

**Symptoms:**
- Badge appears briefly
- Disappears before owner views bookings

**Root Causes:**
- Auto-read on dashboard mount
- Auto-read on websocket connect
- Auto-read on login

**Fix:**
- Only mark as read when owner explicitly opens `/bookings` page
- Skip first render to prevent auto-marking
- Use pathname check to ensure on bookings page

### 3. Cancel Booking Not Working (LINE Users)

**Symptoms:**
- Cancel button visible but no action
- No log line `[CANCEL] booking_id=...` appears

**Root Causes:**
- Missing ID token in request
- Frontend not sending correct headers
- Backend not resolving customer_id for LINE users

**Fix:**
- Frontend: Send `x-id-token` header with `liff.getIDToken()`
- Backend: Resolve `customer_id` via `line_accounts` if `x-line-user-id` provided
- Backend: Verify ID token if `x-id-token` provided

### 4. LINE Chat Opens Profile Instead of Chat

**Symptoms:**
- "Message Shop" button opens LINE profile page
- Requires second click to open chat

**Root Causes:**
- Using wrong deep link format: `line.me/R/ti/p/@ID`
- Should use: `line.me/R/oaMessage/{ID}`

**Fix:**
- Change deep link to: `https://line.me/R/oaMessage/{OFFICIAL_ACCOUNT_ID}`
- This opens chat directly, not profile

---

## How to Verify System Health in 5 Minutes

### Step 1: Check Badge on Login (30 seconds)
1. Log in as owner
2. Verify badge count appears in sidebar "Bookings" item
3. **Expected:** Badge shows unread count (if any bookings exist)
4. **Failure:** Badge = 0 when bookings exist → Check `shop_notifications` table

### Step 2: Create Test Booking (1 minute)
1. Create booking (LINE, web, or guest)
2. Verify notification created:
   ```sql
   SELECT * FROM shop_notifications 
   WHERE booking_id = :booking_id 
   AND is_read = false;
   ```
3. **Expected:** Notification exists with `is_read = false`
4. **Failure:** No notification → Check trigger `trigger_create_shop_notification`

### Step 3: Verify Badge Updates (30 seconds)
1. Owner logs in (or refresh dashboard)
2. Verify badge count increments
3. **Expected:** Badge count = previous count + 1
4. **Failure:** Badge doesn't update → Check realtime subscription

### Step 4: Verify Badge Persists (30 seconds)
1. Owner logs in
2. **DO NOT** open bookings page
3. Verify badge still visible after 10 seconds
4. **Expected:** Badge remains visible
5. **Failure:** Badge disappears → Check auto-read logic

### Step 5: Verify Badge Clears (30 seconds)
1. Owner opens `/bookings` page
2. Wait 3 seconds
3. Verify badge count = 0
4. Verify notifications marked as read:
   ```sql
   SELECT * FROM shop_notifications 
   WHERE shop_id IN (SELECT id FROM shops WHERE owner_user_id = :owner_id)
   AND is_read = false;
   ```
5. **Expected:** All notifications `is_read = true`, badge = 0
6. **Failure:** Badge doesn't clear → Check mark-as-read logic

### Step 6: Test Cancel Booking (1 minute)
1. Create booking as LINE user
2. Open bookings page in LINE app
3. Click "Cancel" button
4. Check server logs for: `[CANCEL] booking_id=...`
5. **Expected:** Log appears, booking status = 'cancelled'
6. **Failure:** No log → Frontend not sending request correctly

### Step 7: Test LINE Chat (30 seconds)
1. Open booking in LINE app
2. Click "Message Shop" button
3. **Expected:** LINE chat opens directly
4. **Failure:** Profile page opens → Check deep link format

---

## SQL Queries for Debugging

### Get Unread Notification Count
```sql
SELECT COUNT(*)
FROM shop_notifications sn
JOIN shops s ON s.id = sn.shop_id
WHERE s.owner_user_id = :owner_id
  AND sn.is_read = false;
```

### Get All Notifications for Owner
```sql
SELECT sn.*, b.customer_name, b.status, s.name as shop_name
FROM shop_notifications sn
JOIN shops s ON s.id = sn.shop_id
LEFT JOIN bookings b ON b.id = sn.booking_id
WHERE s.owner_user_id = :owner_id
ORDER BY sn.created_at DESC;
```

### Verify Booking Ownership
```sql
-- For LINE booking
SELECT b.*, la.customer_id, la.line_user_id
FROM bookings b
JOIN line_accounts la ON la.customer_id = b.customer_id
WHERE b.id = :booking_id
  AND b.source = 'line';

-- For Web booking
SELECT b.*
FROM bookings b
WHERE b.id = :booking_id
  AND b.customer_id = :user_id
  AND b.source = 'web';
```

### Check Notification Trigger
```sql
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_create_shop_notification';
```

---

## API Endpoints

### Bookings
- `POST /api/line/bookings` - Create LINE booking
- `POST /api/line/liff/bookings` - Fetch LINE bookings (ID token)
- `GET /bookings` - Fetch web bookings
- `POST /bookings/:id/cancel` - Cancel booking (LINE/Web/Guest)

### Notifications
- Badge count: Query `shop_notifications` table directly
- Mark as read: `UPDATE shop_notifications SET is_read = true`
- Realtime: Subscribe to `shop_notifications` table INSERT/UPDATE events

---

## Frontend Components

### Owner Dashboard
- **Sidebar:** `apps/dashboard/app/components/Sidebar.tsx`
  - Shows badge on "Bookings" item
  - Badge count from `useBookingNotifications` hook

- **Bookings Page:** `apps/dashboard/app/bookings/page.tsx`
  - Shows all bookings across all shops
  - Marks notifications as read when opened
  - Subscribes to realtime booking updates

- **Notification Hook:** `apps/dashboard/lib/useBookingNotifications.ts`
  - Fetches badge count on login
  - Subscribes to realtime updates
  - Reloads count on INSERT/UPDATE events

### LINE App
- **Bookings Page:** `app/line-app/bookings/page.tsx`
  - Fetches bookings via ID token endpoint
  - Cancel booking with LINE authentication
  - Message Shop button opens LINE chat

---

## Environment Variables

### Required
- `LINE_LOGIN_CHANNEL_ID`: LINE Login channel ID
- `LINE_LOGIN_CHANNEL_SECRET`: LINE Login channel secret
- `NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID`: LINE Official Account ID (for chat deep links)

### Optional
- `NEXT_PUBLIC_LIFF_ID`: LIFF app ID

---

## Last Updated
2025-01-XX

## Version
2.0.0


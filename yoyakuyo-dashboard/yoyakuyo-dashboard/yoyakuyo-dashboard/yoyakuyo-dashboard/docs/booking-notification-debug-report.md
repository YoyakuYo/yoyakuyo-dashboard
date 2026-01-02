# Booking & Notification System Debug Report

## Overview
This document provides a comprehensive overview of the booking and notification system, including all flows, identity management, failure modes, and verification procedures.

---

## Booking Flows

### 1. LINE Booking Flow (LIFF)

**Entry Point:**
- LIFF app: `/line-app/book/[shopId]` or `/line-app/shops/[id]`
- User must be logged into LINE app

**Identity Resolution:**
1. User opens LIFF app
2. `liff.init()` → `liff.login()` if not logged in
3. Get ID token: `liff.getIDToken()`
4. Verify ID token server-side: `POST /api/line/liff/verify`
5. Extract LINE `sub` from verified token
6. Resolve `customer_id` via `line_accounts` table:
   ```sql
   SELECT customer_id FROM line_accounts WHERE line_user_id = :line_sub
   ```
7. If not found, call `get_or_create_customer_from_line(:line_sub)` RPC function

**Booking Creation:**
- Endpoint: `POST /api/line/bookings`
- Headers: `Content-Type: application/json`
- Body: `{ line_user_id, shop_id, service_id, date, time, start_time, end_time }`
- Creates booking with:
  - `customer_id` = resolved customer_id
  - `source` = 'line'
  - `status` = 'pending'

**Booking Fetch:**
- Endpoint: `POST /api/line/liff/bookings` (ID token-based)
- Headers: `Content-Type: application/json`
- Body: `{ id_token: liff.getIDToken() }`
- Server verifies ID token → extracts `sub` → resolves `customer_id` → queries bookings
- Returns: Array of bookings with `customer_id` and `source='line'`

**Notification Creation:**
- Trigger: `trg_create_shop_notification_on_new_booking`
- Creates `shop_notification` with:
  - `shop_id` = booking.shop_id
  - `booking_id` = booking.id
  - `type` = 'new_booking'
  - `is_read` = false

---

### 2. Web User Booking Flow

**Entry Point:**
- Web app: `/book/[shopId]` or `/shops/[id]`
- User must be authenticated via Supabase Auth

**Identity Resolution:**
1. User logs in via Supabase Auth
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
- Creates booking with:
  - `customer_id` = `auth.users.id`
  - `source` = 'web'
  - `status` = 'pending'

**Booking Fetch:**
- Endpoint: `GET /bookings`
- Headers: `x-user-id: auth.users.id`
- Queries: `SELECT * FROM bookings WHERE customer_id = :user_id AND source IN ('web', 'line')`

**Notification Creation:**
- Same trigger as LINE bookings
- Creates `shop_notification` automatically

---

### 3. Guest Booking Flow

**Entry Point:**
- Web app: `/book/[shopId]` (no authentication required)
- User provides: name, email, phone

**Identity Resolution:**
1. No authentication required
2. Create `guests` record:
   ```sql
   INSERT INTO guests (full_name, email, phone)
   VALUES (:name, :email, :phone)
   RETURNING id
   ```
3. Create `customers` record with `role='guest'`:
   ```sql
   INSERT INTO customers (id, role)
   VALUES (gen_random_uuid(), 'guest')
   RETURNING id
   ```
4. Link guest to customer (if needed)

**Booking Creation:**
- Endpoint: `POST /bookings` or `POST /shops/:id/bookings`
- Body: `{ shop_id, service_id, customer_name, customer_email, customer_phone, date, time }`
- Creates booking with:
  - `customer_id` = guest customer_id (or NULL if guest_id used)
  - `source` = 'guest'
  - `status` = 'pending'
  - `guest_id` = guest.id (if using guests table)

**Booking Fetch:**
- No dashboard for guests
- Access via email link or booking confirmation token

**Notification Creation:**
- Same trigger as other bookings

---

## Identity & Auth Per Flow

### LINE Users
- **Auth Method**: LINE ID token (LIFF)
- **Identity Table**: `line_accounts`
- **Mapping**: `line_user_id` → `customer_id`
- **Canonical ID**: `customers.id` (which equals `auth.users.id`)
- **Booking Source**: `'line'`

### Web Users
- **Auth Method**: Supabase Auth (email/password)
- **Identity Table**: `auth.users` + `customers`
- **Mapping**: `auth.users.id` = `customers.id`
- **Canonical ID**: `auth.users.id`
- **Booking Source**: `'web'`

### Guests
- **Auth Method**: None
- **Identity Table**: `guests` (optional) + `customers`
- **Mapping**: `guests.id` → `customers.id` (or direct `customer_id`)
- **Canonical ID**: `customers.id` (UUID, not linked to auth.users)
- **Booking Source**: `'guest'`

---

## Known Failure Modes

### 1. LINE Booking Created But Not Visible
**Symptoms:**
- Booking created successfully
- "Failed to fetch" error in UI
- "You have no bookings yet" message

**Root Causes:**
- Using wrong endpoint (cookie-based instead of ID token)
- Identity mismatch (different `customer_id` used for create vs fetch)
- `line_accounts` entry missing
- Query using wrong `source` filter

**Fix:**
- Use `POST /api/line/liff/bookings` with ID token
- Ensure same `customer_id` used for create and fetch
- Verify `line_accounts` entry exists

### 2. Owner Badge Not Showing
**Symptoms:**
- Booking created successfully
- Notification exists in database
- Badge count = 0

**Root Causes:**
- Auto-read logic marking as read on mount/login
- Badge count query using wrong table/conditions
- Realtime subscription not working
- Badge not refreshing after notification creation

**Fix:**
- Remove auto-read on mount/login
- Ensure badge count from `shop_notifications` only
- Verify realtime subscription is active
- Force refresh on login and realtime events

### 3. Notification Badge Clears Too Early
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

### 4. Cancel Button Not Working
**Symptoms:**
- Cancel button visible but no action
- No error message shown
- Booking status not updated

**Root Causes:**
- Missing click handler
- Wrong endpoint called
- Missing ownership validation
- No error handling

**Fix:**
- Wire cancel button to `POST /bookings/:id/cancel`
- Validate ownership before canceling
- Show error messages
- Refresh bookings list after cancel

---

## Step-by-Step Verification Checklist

### LINE Booking Flow
1. ✅ Open LIFF app in LINE
2. ✅ Navigate to shop detail page
3. ✅ Select service and time slot
4. ✅ Submit booking
5. ✅ Verify booking appears in `/line-app/bookings` immediately
6. ✅ Verify no "Failed to fetch" error
7. ✅ Verify booking has correct `customer_id` and `source='line'`

### Owner Notification Badge
1. ✅ Create new booking (LINE or web)
2. ✅ Owner logs into dashboard
3. ✅ Verify badge count > 0 (without opening bookings)
4. ✅ Open `/bookings` page
5. ✅ Verify badge clears after 2 seconds
6. ✅ Verify notification marked as `is_read = true`

### Cancel Booking
1. ✅ Open bookings page (LINE or web)
2. ✅ Click "Cancel" button on pending booking
3. ✅ Confirm cancellation dialog
4. ✅ Verify booking status updated to 'cancelled'
5. ✅ Verify bookings list refreshes
6. ✅ Verify error shown if cancel fails

### View Details
1. ✅ Click "View Details" button
2. ✅ Verify booking details modal/page opens
3. ✅ Verify all booking information displayed
4. ✅ Verify works in both LIFF and web

---

## SQL Queries

### Get Bookings for LINE User
```sql
-- Step 1: Get customer_id from line_accounts
SELECT customer_id 
FROM line_accounts 
WHERE line_user_id = :line_user_id;

-- Step 2: Get bookings
SELECT b.*, 
       s.name as shop_name,
       sv.name as service_name
FROM bookings b
JOIN shops s ON s.id = b.shop_id
LEFT JOIN services sv ON sv.id = b.service_id
WHERE b.customer_id = :customer_id
  AND b.source = 'line'
ORDER BY b.created_at DESC;
```

### Get Unread Notification Count
```sql
SELECT COUNT(*)
FROM shop_notifications
WHERE shop_id IN (
  SELECT id FROM shops WHERE owner_user_id = :owner_user_id
)
AND is_read = false;
```

### Mark Notifications as Read
```sql
UPDATE shop_notifications
SET is_read = true
WHERE shop_id IN (
  SELECT id FROM shops WHERE owner_user_id = :owner_user_id
)
AND is_read = false;
```

### Verify Booking Ownership
```sql
-- For LINE booking
SELECT b.*, la.customer_id
FROM bookings b
JOIN line_accounts la ON la.customer_id = b.customer_id
WHERE b.id = :booking_id
  AND la.line_user_id = :line_user_id
  AND b.source = 'line';

-- For Web booking
SELECT b.*
FROM bookings b
WHERE b.id = :booking_id
  AND b.customer_id = :user_id
  AND b.source = 'web';
```

---

## API Endpoints

### LINE Bookings
- `POST /api/line/bookings` - Create LINE booking
- `POST /api/line/liff/bookings` - Fetch LINE bookings (ID token)
- `GET /api/line/bookings?line_user_id=:id` - Fetch LINE bookings (legacy)

### Web Bookings
- `POST /bookings` - Create web booking
- `GET /bookings` - Fetch web bookings
- `PATCH /bookings/:id/status` - Update booking status
- `POST /bookings/:id/cancel` - Cancel booking

### Notifications
- Badge count: Query `shop_notifications` table directly
- Mark as read: `UPDATE shop_notifications SET is_read = true`
- Realtime: Subscribe to `shop_notifications` table INSERT/UPDATE events

---

## Rules for Notification Badge Behavior

### Badge Count Source
- **ONLY** from `shop_notifications` table
- Query: `COUNT(*) WHERE shop_id IN (:owner_shops) AND is_read = false`
- **NO** derived state from bookings
- **NO** booking-based logic

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

## Database Schema

### customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('guest','customer','owner')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### line_accounts
```sql
CREATE TABLE line_accounts (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### bookings
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

### shop_notifications
```sql
CREATE TABLE shop_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'new_booking',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Testing Procedures

### Test LINE Booking End-to-End
1. Open LINE app → LIFF app
2. Navigate to shop → Select service → Book
3. Verify booking appears immediately
4. Check database: `bookings` table has entry with `source='line'`
5. Check database: `shop_notifications` has entry with `is_read=false`
6. Owner logs in → Badge count = 1
7. Owner opens bookings → Badge clears

### Test Owner Badge
1. Create booking (any source)
2. Owner logs in
3. Verify badge count > 0 (without opening bookings)
4. Open `/bookings` page
5. Wait 2 seconds
6. Verify badge count = 0
7. Verify `shop_notifications.is_read = true`

### Test Cancel Booking
1. Open bookings page
2. Find pending booking
3. Click "Cancel"
4. Confirm dialog
5. Verify booking status = 'cancelled'
6. Verify bookings list refreshes
7. Verify no error messages

---

## Troubleshooting

### Booking Not Appearing
1. Check `bookings` table: Does entry exist?
2. Check `customer_id`: Is it correct?
3. Check `source`: Is it 'line' for LINE bookings?
4. Check `line_accounts`: Does mapping exist?
5. Check API logs: Any errors in fetch endpoint?

### Badge Not Showing
1. Check `shop_notifications` table: Does entry exist?
2. Check `is_read`: Is it false?
3. Check `shop_id`: Does it match owner's shop?
4. Check badge count query: Is it using correct conditions?
5. Check realtime subscription: Is it active?

### Badge Clears Too Early
1. Check auto-read logic: Is it removed?
2. Check pathname check: Is it working?
3. Check first render skip: Is it implemented?
4. Check timing: Is delay sufficient?

---

## Last Updated
2025-01-XX

## Version
1.0.0


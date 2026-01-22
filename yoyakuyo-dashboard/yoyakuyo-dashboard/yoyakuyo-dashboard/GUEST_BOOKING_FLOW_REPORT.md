# Guest Booking Flow - Complete Technical Documentation

**Last Updated:** 2026-01-03  
**Purpose:** Comprehensive documentation of the guest booking system to prevent regressions and enable quick fixes.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Frontend Flow](#frontend-flow)
4. [Backend API Flow](#backend-api-flow)
5. [Email Notifications](#email-notifications)
6. [Status Updates & Rescheduling](#status-updates--rescheduling)
7. [Critical Constraints](#critical-constraints)
8. [Common Issues & Fixes](#common-issues--fixes)

---

## Overview

The guest booking system allows unauthenticated users to make bookings by providing their name and email. The system:

- Creates a guest customer record in the `customers` table with `role='guest'`
- Stores guest email and name in the `customers` table (NOT a separate `guests` table)
- Sends email notifications for booking status changes (pending, confirmed, cancelled, rescheduled)
- Creates internal messaging conversations for guest-owner communication
- Supports multi-language email notifications (Japanese, English, Chinese, Portuguese, Spanish, Korean)
- Allows guests to accept/reject rescheduled booking times via email links

**Key Principle:** Guest data is stored in the `customers` table with `role='guest'`. There is NO separate `guests` table.

---

## Database Schema

### Customers Table

```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY,
  role customer_role NOT NULL,  -- 'guest', 'web', or 'line'
  email text,                    -- REQUIRED for guests (NOT NULL constraint)
  name text,                     -- Guest name stored here
  auth_user_id uuid UNIQUE,      -- NULL for guests
  line_user_id text UNIQUE,      -- NULL for guests
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Critical Constraint for Guests:**
```sql
CONSTRAINT customer_single_identity CHECK (
  (role = 'guest' AND email IS NOT NULL AND auth_user_id IS NULL AND line_user_id IS NULL)
  OR (role = 'web' AND auth_user_id IS NOT NULL AND email IS NULL AND line_user_id IS NULL)
  OR (role = 'line' AND line_user_id IS NOT NULL AND auth_user_id IS NULL AND email IS NULL)
)
```

**What this means:**
- Guest customers MUST have:
  - `role = 'guest'`
  - `email IS NOT NULL` (required)
  - `auth_user_id IS NULL`
  - `line_user_id IS NULL`
- Guest name is stored in `customers.name`
- Guest email is stored in `customers.email`

### Bookings Table

```sql
CREATE TABLE bookings (
  id uuid PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES shops(id),
  service_id uuid NOT NULL REFERENCES services(id),
  customer_id uuid NOT NULL REFERENCES customers(id),  -- Links to customers table
  source booking_source_enum NOT NULL,                 -- 'guest', 'web', or 'line'
  channel booking_channel_enum NOT NULL,                -- MUST equal source
  status booking_status_enum NOT NULL DEFAULT 'pending',
  date date NOT NULL,                                  -- DATE column (NOT booked_for)
  start_time time NOT NULL,                           -- TIME column (NOT end_time)
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT channel_equals_source CHECK (channel = source)
);
```

**Critical Constraints:**
1. `channel` MUST equal `source` (e.g., `source='guest'` → `channel='guest'`)
2. `customer_id` is REQUIRED and must reference a valid customer
3. Schema uses `date` (DATE) and `start_time` (TIME), NOT `booked_for` (TIMESTAMPTZ) or `end_time` (TIMESTAMPTZ)
4. Columns that DO NOT exist: `customer_name`, `customer_email`, `customer_phone`, `guest_name`, `guest_email`, `notes`, `booked_for`, `end_time`

---

## Frontend Flow

### File: `app/book/[shopId]/page.tsx`

**Key Logic:**

1. **Authentication Check:**
   ```typescript
   const { user: supabaseUser } = useAuth();        // Supabase Auth
   const { user: customUser } = useCustomAuth();   // Custom JWT Auth
   const user = customUser || supabaseUser;        // Use either
   const isAuthenticated = user && !authLoading;
   ```

2. **Guest ID Management:**
   - Guest ID is stored in `localStorage` as `yoyakuyo_guest_id`
   - Generated on first visit: `guest_${Date.now()}_${random}`
   - Persisted across sessions for returning guests
   - Sent in `x-guest-id` header if available

3. **Form Fields:**
   - **Authenticated users:** Name/email fields are READ-ONLY (populated from account)
   - **Guest users:** Name/email fields are REQUIRED inputs

4. **Booking Payload:**
   ```typescript
   const bookingPayload = {
     shop_id: shopId,
     service_id: selectedService,
     date: selectedDate,                              // YYYY-MM-DD
     time_slot: `${start}-${end}`,                    // "HH:MM-HH:MM"
     start_time: startDateTime.toISOString(),         // ISO string
     end_time: endDateTime.toISOString(),             // ISO string (may be ignored)
   };
   
   // ONLY for guest users:
   if (!isAuthenticated) {
     bookingPayload.customer_name = name.trim();
     bookingPayload.customer_email = email.trim();
   }
   
   // Headers:
   headers: {
     ...(isAuthenticated && { 'x-user-id': user.id }),
     ...(!isAuthenticated && guestId && { 'x-guest-id': guestId }),
   }
   ```

5. **Success Response:**
   - If backend issues a new `guest_id`, it's saved to `localStorage`
   - Guest ID is displayed to user for future reference

---

## Backend API Flow

### File: `yoyakuyo-api/src/routes/bookings.ts`

### Endpoint: `POST /bookings`

**Customer Identity Resolution (Priority Order):**

1. **LINE Customer** (if `x-line-user-id` header present)
   - Lookup existing customer by `line_user_id`
   - Create if not exists: `role='line'`, `line_user_id=<value>`, `email=null`, `auth_user_id=null`
   - Set `source='line'`

2. **Web Customer** (if `x-user-id` header present)
   - Use `userId` as `customer_id` (customer_id === auth.users.id)
   - Ensure customer exists in `customers` table
   - Set `source='web'`

3. **Guest with Header** (if `x-guest-id` header present)
   - Use provided `guestId` as `customer_id`
   - **REQUIRE** `customer_email` in request body
   - Upsert customer: `role='guest'`, `email=customer_email`, `name=customer_name`, `auth_user_id=null`, `line_user_id=null`
   - Set `source='guest'`

4. **Guest without Header** (no authentication, no headers)
   - Generate new UUID for `customer_id`
   - **REQUIRE** `customer_email` in request body
   - Create customer: `role='guest'`, `email=customer_email`, `name=customer_name`, `auth_user_id=null`, `line_user_id=null`
   - Set `source='guest'`

**Booking Creation:**

```typescript
// Schema-compliant booking data
let bookingData = {
  shop_id,
  service_id,
  date: date,                    // DATE column
  start_time: startTimeStr,      // TIME column (HH:MM:SS format)
  status: "pending",
};

// For guest bookings:
if (source === 'guest') {
  bookingData.source = 'guest';
  bookingData.channel = 'guest';  // MUST equal source
  bookingData.customer_id = customerId;
}

// PROACTIVELY REMOVE non-existent columns
delete bookingData.booked_for;
delete bookingData.end_time;
delete bookingData.customer_name;
delete bookingData.customer_email;
delete bookingData.customer_phone;
delete bookingData.guest_name;
delete bookingData.guest_email;
delete bookingData.notes;

// Use schema fallback function
const { data, error } = await insertBookingWithSchemaFallback(adminClient, bookingData);
```

**Schema Fallback Function:**

The `insertBookingWithSchemaFallback` function handles schema mismatches:

1. Attempts insert with full data
2. If `PGRST204` error (column not found), removes problematic columns
3. Retries insert with pruned data
4. Handles `date`/`start_time` formatting for TIME columns

**Post-Creation Actions:**

1. **Owner Notification:**
   - Creates in-app notification
   - Sends push notification to owner

2. **Internal Messaging:**
   - Creates or finds conversation for booking
   - Posts system message: "✅ Booking request received. Save your Guest ID: {customerId}"

3. **Email Notification:**
   - Fetches guest email from `customers` table (NOT `guests` table)
   - Detects language from `Accept-Language` header
   - Sends multi-language email via Resend
   - Includes Guest ID in email

4. **Response:**
   ```json
   {
     "id": "booking-uuid",
     "shop_id": "...",
     "customer_id": "guest-customer-uuid",
     "guest_id": "guest-customer-uuid",  // For guest bookings
     "guest_instructions": "Save your Guest ID..."
   }
   ```

---

## Email Notifications

### File: `yoyakuyo-api/src/utils/email.ts`

### Email Sending

**Configuration:**
- `RESEND_API_KEY`: Resend API key
- `EMAIL_FROM`: Sender email (e.g., `booking@yoyakuyo.jp`)
- `EMAIL_REPLY_TO`: Reply-to email (e.g., `yoyakuyo100@gmail.com`)

**Language Detection:**
```typescript
function getLanguageFromRequest(req): SupportedLocale {
  const acceptLanguage = req.headers['accept-language'] || '';
  // Detects: ja, en, zh, pt-BR, es, ko
  // Defaults to 'ja'
}
```

### Email Types

1. **Pending (Booking Created):**
   - Subject: "Booking request received {ref}"
   - Includes Guest ID
   - Multi-language support

2. **Confirmed:**
   - Subject: "Booking confirmed {ref}"
   - Sent when owner confirms booking

3. **Cancelled:**
   - Subject: "Booking cancelled {ref}"
   - Sent when owner cancels booking

4. **Rescheduled:**
   - Subject: "Booking rescheduled {ref}"
   - Includes accept/reject links:
     - Accept: `/booking/reschedule/{bookingId}/accept`
     - Reject: `/booking/reschedule/{bookingId}/reject`
   - Shows old and new times

### Email Recipient Resolution

**For Guest Bookings:**
```typescript
// Fetch email from customers table (NOT guests table)
const { data: customerRow } = await adminClient
  .from("customers")
  .select("email")
  .eq("id", customerId)
  .eq("role", "guest")
  .maybeSingle();

const recipientEmail = customerRow?.email;
```

**CRITICAL:** Never query a `guests` table - it doesn't exist!

---

## Status Updates & Rescheduling

### Endpoint: `PATCH /bookings/:id/status`

**Flow:**
1. Fetch booking before update (includes `customer_id`, `source`, `date`, `start_time`)
2. Update booking status
3. Create customer notification (in-app)
4. Send email notification (for guests):
   - Fetch email from `customers` table
   - Use `getLanguageFromRequest(req)` for language
   - Call `buildBookingEmailText()` with appropriate status
5. Send LINE notification (if `source='line'`)
6. Send push notification to owner

### Endpoint: `PATCH /bookings/:id/reschedule`

**Flow:**
1. Validate owner access
2. Fetch booking before update
3. Update `date` and `start_time` (proactively remove `booked_for`/`end_time`)
4. Create customer notification
5. Send email notification (for guests) with accept/reject links
6. Send LINE notification (if LINE booking)
7. Handle retry logic for `PGRST204` errors

**Accept/Reject Endpoints:**

- `POST /bookings/:id/reschedule/accept`
  - Sets status to `confirmed`
  - Notifies owner

- `POST /bookings/:id/reschedule/reject`
  - Sets status to `pending`
  - Notifies owner

**Frontend Page:** `app/booking/reschedule/[bookingId]/[action]/page.tsx`
- Uses `next-intl` for translations
- Calls appropriate API endpoint
- Displays success/error message

---

## Critical Constraints

### Database Constraints

1. **`customer_single_identity`:**
   - Guest: `email IS NOT NULL`, `auth_user_id IS NULL`, `line_user_id IS NULL`
   - Web: `auth_user_id IS NOT NULL`, `email IS NULL`, `line_user_id IS NULL`
   - Line: `line_user_id IS NOT NULL`, `auth_user_id IS NULL`, `email IS NULL`

2. **`channel_equals_source`:**
   - `channel` MUST equal `source`
   - Guest booking: `source='guest'` → `channel='guest'`

3. **Foreign Keys:**
   - `bookings.customer_id` → `customers.id` (REQUIRED)

### Schema Constraints

1. **Columns that DO NOT exist:**
   - `booked_for` (use `date` instead)
   - `end_time` (use `start_time` only)
   - `customer_name`, `customer_email`, `customer_phone`
   - `guest_name`, `guest_email`
   - `notes`

2. **Date/Time Format:**
   - `date`: DATE column (YYYY-MM-DD)
   - `start_time`: TIME column (HH:MM:SS)

3. **Proactive Column Removal:**
   - Always remove non-existent columns BEFORE insert/update
   - Use `insertBookingWithSchemaFallback()` for inserts

---

## Common Issues & Fixes

### Issue: "Could not find the 'customer_email' column"

**Cause:** Trying to insert `customer_email` into `bookings` table.

**Fix:**
```typescript
// Remove before insert
delete bookingData.customer_email;

// Store in customers table instead
await adminClient.from("customers").upsert({
  id: customerId,
  role: "guest",
  email: customer_email,  // Store here
  name: customer_name,
  auth_user_id: null,
  line_user_id: null,
});
```

### Issue: "channel_equals_source constraint violation"

**Cause:** `channel` doesn't match `source`.

**Fix:**
```typescript
if (source === 'guest') {
  bookingData.channel = 'guest';  // MUST match source
}
```

### Issue: "customer_single_identity constraint violation"

**Cause:** Guest customer missing email or has `auth_user_id`/`line_user_id`.

**Fix:**
```typescript
await adminClient.from("customers").insert({
  id: customerId,
  role: "guest",
  email: customer_email,      // REQUIRED
  name: customer_name,
  auth_user_id: null,          // MUST be NULL
  line_user_id: null,         // MUST be NULL
});
```

### Issue: "relation 'guests' does not exist"

**Cause:** Code queries non-existent `guests` table.

**Fix:**
```typescript
// WRONG:
const { data } = await db.from("guests").select("*").eq("id", guestId);

// CORRECT:
const { data } = await db
  .from("customers")
  .select("*")
  .eq("id", guestId)
  .eq("role", "guest");
```

### Issue: Guest email not found for notifications

**Cause:** Not fetching from `customers` table correctly.

**Fix:**
```typescript
const { data: customerRow } = await adminClient
  .from("customers")
  .select("email")
  .eq("id", customerId)      // Use customer_id from booking
  .eq("role", "guest")        // Filter by role
  .maybeSingle();

const email = customerRow?.email;
```

### Issue: Schema mismatch (PGRST204 errors)

**Cause:** Trying to insert columns that don't exist.

**Fix:**
1. Proactively remove columns before insert:
   ```typescript
   delete bookingData.booked_for;
   delete bookingData.end_time;
   delete bookingData.customer_name;
   // etc.
   ```

2. Use `insertBookingWithSchemaFallback()` which handles retries

3. Format `start_time` as `HH:MM:SS` for TIME columns

---

## Key Files Reference

### Frontend
- `app/book/[shopId]/page.tsx` - Booking form
- `app/booking/reschedule/[bookingId]/[action]/page.tsx` - Accept/reject reschedule

### Backend
- `yoyakuyo-api/src/routes/bookings.ts` - Main booking API
- `yoyakuyo-api/src/utils/email.ts` - Email utilities

### Database
- `supabase/migrations/20260101_controlled_reset_customers_bookings.sql` - Schema definition

---

## Testing Checklist

When making changes to guest booking flow, verify:

- [ ] Guest can create booking without authentication
- [ ] Guest customer created in `customers` table with correct constraints
- [ ] Booking created with `source='guest'` and `channel='guest'`
- [ ] Guest receives email notification (pending)
- [ ] Guest receives email when booking confirmed
- [ ] Guest receives email when booking cancelled
- [ ] Guest receives email when booking rescheduled (with accept/reject links)
- [ ] Guest can accept rescheduled time via link
- [ ] Guest can reject rescheduled time via link
- [ ] Owner sees guest name (not email) in dashboard
- [ ] Internal messaging conversation created for booking
- [ ] Guest ID persisted in localStorage
- [ ] Multi-language emails work (test with different `Accept-Language` headers)
- [ ] No queries to non-existent `guests` table
- [ ] No `PGRST204` errors (schema mismatches)
- [ ] No constraint violations (`customer_single_identity`, `channel_equals_source`)

---

## Summary

The guest booking system is designed to be robust and schema-agnostic. Key principles:

1. **Single Source of Truth:** Guest data in `customers` table, not separate `guests` table
2. **Schema Flexibility:** Use `insertBookingWithSchemaFallback()` to handle schema differences
3. **Constraint Compliance:** Always satisfy `customer_single_identity` and `channel_equals_source`
4. **Email from Database:** Always fetch guest email from `customers` table, never from request body
5. **Multi-language Support:** Use `getLanguageFromRequest()` and `buildBookingEmailText()`
6. **Proactive Error Prevention:** Remove non-existent columns before insert/update

If something breaks, check:
1. Are you querying the `guests` table? (It doesn't exist - use `customers` with `role='guest'`)
2. Are you inserting columns that don't exist? (Remove `customer_email`, `guest_name`, etc.)
3. Are you satisfying database constraints? (Check `customer_single_identity`, `channel_equals_source`)
4. Are you fetching email from the right place? (`customers.email` where `role='guest'`)


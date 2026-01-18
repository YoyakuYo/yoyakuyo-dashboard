# Canonical Booking System - API Updates Required

## Overview
The booking system has been rebuilt with a canonical structure:
- **Single `customers` table** - references `auth.users(id)`
- **Single `bookings` table** - references `customers.id`
- **`line_accounts` table** - maps LINE user_id to customer_id
- **`source` field** - indicates entry method ('line', 'web', 'guest')

## Key Changes

### Old Structure (REMOVED)
- `bookings.booking_type` → Now `bookings.source`
- `bookings.user_id` → Now `bookings.customer_id`
- `bookings.line_user_id` → Removed (use `line_accounts` table)
- `bookings.guest_id` → Removed (guests are now customers with role='guest')
- `user_identities` table → Replaced by `line_accounts`
- `guests` table → Replaced by `customers` with role='guest'

### New Structure
```sql
customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('guest','customer','owner'))
)

line_accounts (
  customer_id UUID REFERENCES customers(id),
  line_user_id TEXT UNIQUE
)

bookings (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  shop_id UUID NOT NULL REFERENCES shops(id),
  source TEXT CHECK (source IN ('line','web','guest')),
  status TEXT,
  booked_for TIMESTAMPTZ,
  ...
)
```

## API Routes to Update

1. **`yoyakuyo-api/src/routes/line-booking.ts`**
   - POST `/line/bookings` - Create LINE booking
   - GET `/line/bookings` - Get LINE user bookings
   - Use `get_customer_id_from_line()` function
   - Use `get_or_create_customer_from_line()` function

2. **`yoyakuyo-api/src/routes/bookings.ts`**
   - POST `/bookings` - Create web/guest booking
   - GET `/bookings` - Get user bookings
   - Use `customer_id` directly from auth

3. **`yoyakuyo-api/src/routes/shops.ts`**
   - POST `/shops/:id/bookings` - Create booking for shop
   - Update to use `customer_id` and `source`

4. **`yoyakuyo-api/src/routes/autoBooking.ts`**
   - AI auto-booking endpoint
   - Update to use new structure

## Helper Functions Available

1. `get_customer_id_from_line(line_user_id TEXT)` → Returns customer_id
2. `get_or_create_customer_from_line(line_user_id TEXT)` → Returns customer_id (creates if needed)

## Migration Status

- ✅ Migration files created
- ⏳ API routes need updating
- ⏳ Frontend needs updating
- ⏳ Tests need updating


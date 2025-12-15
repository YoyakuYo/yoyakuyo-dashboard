# Booking System Fix - Implementation Summary

## ✅ STEP 0: Schema Audit - COMPLETE

**Findings:**
- ❌ No `booking_type` enum - Cannot distinguish booking types
- ❌ No `guests` table - Guest bookings forced to create fake users
- ❌ `user_id` is NOT NULL - Prevents proper guest bookings
- ❌ No `line_user_id` in bookings - Must join via `line_bookings` table
- ❌ Multiple ownership paths - Ambiguous and error-prone

**See `SCHEMA_AUDIT.md` for full details.**

---

## ✅ STEP 1: Migration Created

**File:** `supabase/migrations/20250222_fix_booking_ownership_system.sql`

**What it does:**
1. Creates `booking_type_enum` ('line', 'user', 'guest')
2. Creates `guests` table
3. Adds `booking_type`, `guest_id`, `line_user_id` columns to bookings
4. Makes `user_id` nullable (for guest bookings)
5. Adds DB constraints to enforce ownership rules:
   - `booking_type='line'` → `line_user_id NOT NULL`, `user_id NOT NULL`
   - `booking_type='user'` → `user_id NOT NULL`, `line_user_id IS NULL`, `guest_id IS NULL`
   - `booking_type='guest'` → `guest_id NOT NULL`, `user_id IS NULL`, `line_user_id IS NULL`
6. Migrates existing data:
   - Classifies LINE bookings (via `line_bookings` table)
   - Classifies web user bookings (have `user_id`, no `line_bookings`)
   - Creates guest records for guest bookings
   - Resolves user_id for LINE bookings via `user_identities`

---

## ⏳ STEP 2: Update Application Code

### 2.1 LINE Booking Creation (`yoyakuyo-api/src/routes/line-booking.ts`)

**Current:** Creates booking with `user_id`, then creates `line_bookings` record

**Required:**
```typescript
// After verifying ID token and getting canonical user_id:
const bookingData = {
    // ... other fields
    booking_type: 'line',
    user_id: canonicalUserId,  // From user_identities
    line_user_id: lineSub,     // From ID token
    guest_id: null
};

// Create booking
const { data: booking } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();

// Still create line_bookings record for backward compatibility (can be removed later)
```

### 2.2 Web User Booking Creation (`yoyakuyo-api/src/routes/bookings.ts`)

**Current:** Creates booking with `user_id` (from auth)

**Required:**
```typescript
const bookingData = {
    // ... other fields
    booking_type: 'user',
    user_id: userId,  // From auth.users
    line_user_id: null,
    guest_id: null
};
```

### 2.3 Guest Booking Creation (`yoyakuyo-api/src/routes/bookings.ts`)

**Current:** Creates fake user record (WRONG!)

**Required:**
```typescript
// Create guest record first
const { data: guest } = await supabase
    .from('guests')
    .insert({
        full_name: customer_name,
        email: customer_email,
        phone: customer_phone
    })
    .select()
    .single();

// Create booking
const bookingData = {
    // ... other fields
    booking_type: 'guest',
    user_id: null,
    line_user_id: null,
    guest_id: guest.id
};
```

### 2.4 LINE Dashboard Query (`yoyakuyo-api/src/routes/line-booking.ts`)

**Current:** Queries via `line_bookings` table

**Required:**
```typescript
// Query directly by line_user_id
const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_type', 'line')
    .eq('line_user_id', lineUserId)
    .order('created_at', { ascending: false });
```

### 2.5 Web User Dashboard Query (`app/customer/bookings/page.tsx`)

**Current:** Queries by `user_id`

**Required:**
```typescript
const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .in('booking_type', ['line', 'user'])  // Show both LINE and web bookings
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
```

### 2.6 Owner Dashboard Query

**Current:** Queries by `shop_id` (should already work)

**Required:**
```typescript
// Query ALL bookings for shop (all types)
const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
```

---

## ⏳ STEP 3: Remove Legacy Code

After migration is verified working:

1. **Remove `line_bookings` table** (no longer needed - `line_user_id` is in bookings)
2. **Remove guest user creation logic** (guests have their own table)
3. **Simplify queries** (no more JOINs needed)

---

## ⏳ STEP 4: Verification Checklist

- [ ] Run migration in Supabase
- [ ] Verify all existing bookings are classified correctly
- [ ] Test LINE booking creation → appears in LINE dashboard
- [ ] Test web user booking creation → appears in web dashboard
- [ ] Test guest booking creation → no user record created
- [ ] Test owner dashboard → sees all booking types
- [ ] Test notification badge → appears for all booking types
- [ ] Test notification badge → clears after viewing

---

## Migration Execution Order

1. **Run `20250222_fix_booking_ownership_system.sql`** in Supabase
2. **Update application code** (Steps 2.1-2.6)
3. **Test all flows** (Step 4)
4. **Remove legacy code** (Step 3) - Optional, can be done later

---

## Notes

- The migration is **backward compatible** - it classifies existing bookings
- `line_bookings` table is kept for now (can be removed later)
- Guest bookings no longer create fake user records
- All ownership rules are enforced by DB constraints


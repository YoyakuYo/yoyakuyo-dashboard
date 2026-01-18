# WEB Customer Booking Fix Report

## Problems Identified

1. **WEB customers were asked to enter name/email when booking** - Even though they're authenticated, the booking form required them to fill in personal information
2. **WEB customer names not showing in Users table** - Names were NULL or incorrect in the `users` table
3. **Booking API not auto-populating customer info** - The API wasn't fetching name/email from `users` table for WEB bookings

## Root Causes

1. **Missing data in `users` table**: WEB customers had entries in `customers` table but not in `users` table, or `users.full_name` was NULL
2. **API not fetching user data**: The booking creation endpoint wasn't fetching `customer_name` and `customer_email` from `users` table for WEB customers (unlike LINE customers which get it from `customer_profiles`)

## Fixes Applied

### 1. API Fix (✅ Committed)
**File**: `yoyakuyo-api/src/routes/bookings.ts`

**Change**: Added code to automatically fetch `customer_name` and `customer_email` from `users` table when creating WEB bookings:

```typescript
// Fetch name and email from users table for WEB customers
if (adminClient && customerId) {
  const { data: customer } = await adminClient
    .from('customers')
    .select('auth_user_id')
    .eq('id', customerId)
    .maybeSingle();
  
  if (customer?.auth_user_id) {
    const { data: userData } = await adminClient
      .from('users')
      .select('full_name, email')
      .eq('id', customer.auth_user_id)
      .maybeSingle();
    
    if (userData) {
      bookingData.customer_name = userData.full_name || null;
      bookingData.customer_email = userData.email || null;
    }
  }
}
```

**Result**: WEB bookings now automatically populate `customer_name` and `customer_email` from the `users` table, just like LINE customers.

### 2. Data Fix (⚠️ Needs to be run)
**File**: `fix_web_customer_names.sql`

**What it does**:
- Creates `users` table entries for WEB customers that don't have them
- Updates existing `users` entries with NULL `full_name` using:
  - `auth.users` metadata (name, full_name, display_name)
  - Or formats email as a proper name

**Status**: SQL script created but needs to be run in Supabase SQL Editor

## Next Steps

1. **Run the SQL fix**: Execute `fix_web_customer_names.sql` in Supabase SQL Editor to populate missing names
2. **Restart API server**: The API changes are committed, but server needs restart/redeploy
3. **Test booking flow**: Verify that authenticated WEB customers no longer need to enter name/email

## Expected Behavior After Fix

- ✅ Authenticated WEB customers: Name and email auto-filled from `users` table
- ✅ Authenticated LINE customers: Name auto-filled from `customer_profiles.line_display_name` (already working)
- ✅ Guest customers: Still required to enter name and email (correct behavior)
- ✅ Users table: Shows correct names for all WEB customers

## Files Changed

1. `yoyakuyo-api/src/routes/bookings.ts` - Added auto-fetch of user data for WEB bookings
2. `fix_web_customer_names.sql` - SQL script to populate missing names (needs to be run)


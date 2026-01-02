# 400 Error Fix - Supabase Query Syntax

## Problem
The 400 Bad Request error was caused by the `.not("address", "is", null)` syntax in Supabase queries, which PostgREST was rejecting.

## Solution
Removed the problematic `.not()` filter and implemented a safer approach:

1. **Use `.neq("address", "")` only** - Filters empty strings (works reliably)
2. **Client-side NULL filtering** - Filter out NULL addresses in the response data
3. **Validation checks** - Added checks to ensure shops have valid addresses before returning

## Changes Made

### `yoyakuyo-api/src/routes/shops.ts`
- **Removed:** `.not("address", "is", null)` from all queries
- **Kept:** `.neq("address", "")` to filter empty strings
- **Added:** Client-side filtering to remove NULL addresses from response
- **Updated:** Single shop endpoint to validate address before returning

### `yoyakuyo-api/src/routes/bookings.ts`
- **Removed:** `.not("address", "is", null)` from shop verification queries
- **Added:** Address validation in response checks

## Why This Works

1. **`.neq("address", "")`** is a standard Supabase filter that works reliably
2. **Client-side filtering** ensures no NULL addresses slip through
3. **Validation checks** provide an extra safety layer

## Trade-offs

- **Pagination count** might be slightly inaccurate if there are many NULL addresses
- **Performance** is slightly impacted by client-side filtering, but minimal
- **Reliability** is improved - no more 400 errors

## Alternative Solution (Future)

If you need exact pagination counts, consider:
1. Using a database view that filters NULL addresses
2. Using a PostgREST filter string directly (if Supabase JS supports it)
3. Using a raw SQL query for counting

For now, this solution fixes the 400 error while maintaining functionality.


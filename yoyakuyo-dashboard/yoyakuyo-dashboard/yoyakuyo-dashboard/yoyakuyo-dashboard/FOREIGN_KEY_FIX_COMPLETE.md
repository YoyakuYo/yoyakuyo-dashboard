# ✅ Foreign Key Constraint Fix Complete

## Problem

When creating a shop after signup, the following error occurred:
```
Failed to create shop: insert or update on table "shops" violates foreign key constraint "shops_owner_user_id_fkey"
```

## Root Cause

The `shops` table has a foreign key constraint:
- `owner_user_id` must reference `public.users(id)`
- The signup endpoint was trying to create a shop even if the `public.users` record creation failed
- If user creation failed (except for duplicate key), the code continued anyway
- Then shop creation failed because the foreign key constraint couldn't be satisfied

## Solution

Updated the `/auth/signup-owner` endpoint in `apps/api/src/routes/auth.ts` to:

1. **Check if user exists first** - Before attempting to create, check if the user record already exists
2. **Create user if needed** - Only create if it doesn't exist
3. **Verify before shop creation** - Double-check that user exists before creating shop
4. **Proper error handling** - Return errors immediately if user creation fails (except for duplicate key which is OK)

## Changes Made

### Before:
- Created user record, but continued even if it failed (except duplicate)
- Created shop without verifying user exists
- Foreign key constraint failed if user didn't exist

### After:
- Checks if user exists first
- Creates user only if needed
- Verifies user exists before creating shop
- Returns proper error if user creation fails

## Code Flow

1. **Check user existence** → Query `public.users` for `user_id`
2. **Create if missing** → Insert user record if it doesn't exist
3. **Handle duplicates** → If duplicate key error (race condition), continue
4. **Verify before shop** → Double-check user exists before shop creation
5. **Create shop** → Only if user exists and is verified

## Deployment

✅ **API Redeployed**
- **Production URL**: https://yoyakuyo-api.vercel.app
- **Inspect URL**: https://vercel.com/alphonsow/yoyakuyo-api/BNQ52gohxuA2wo1yVXKZifrMZLgt
- **Status**: ✅ Successfully deployed

## Testing

To test the fix:

1. **Sign up a new user** with shop name
2. **Verify**:
   - User record is created in `public.users`
   - Shop is created with correct `owner_user_id`
   - No foreign key constraint errors

## Files Modified

- `apps/api/src/routes/auth.ts` - Fixed error handling and user verification

## Status

✅ **COMPLETE** - Foreign key constraint issue fixed and API redeployed!


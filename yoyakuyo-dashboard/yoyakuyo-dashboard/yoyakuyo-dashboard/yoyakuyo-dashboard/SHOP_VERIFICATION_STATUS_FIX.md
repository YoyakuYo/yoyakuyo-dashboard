# Shop Verification Status Mismatch Fix

## Problem
- Staff dashboard shows shop as "approved"
- Owner dashboard shows shop as "unverified"
- Mismatch between what staff sees and what owner sees

## Root Cause
1. **Timing Issue**: `loadShopVerificationStatus()` was being called in `loadData()` with `if (shop)`, but `shop` is a state variable that isn't updated until after `loadShop()` completes and React re-renders. So the check `if (shop)` was always false during initial load.

2. **Status Field Check**: The API returns both `status` (mapped from `verification_status`) and `verification_status`. The frontend was checking both, but the timing issue prevented it from running.

## Fix Applied

### 1. Fixed Timing Issue
- Removed `loadShopVerificationStatus()` call from `loadData()`
- Added `useEffect` hook that watches for `shop?.id` changes
- This ensures verification status is loaded after shop is loaded

```typescript
// Load verification status when shop is available
useEffect(() => {
  if (shop?.id && user?.id) {
    loadShopVerificationStatus();
  }
}, [shop?.id, user?.id]);
```

### 2. Improved Status Check Logic
- Check `owner_verification` table directly (source of truth)
- If shop is loaded, find verification for that specific shop
- If shop not loaded yet, check for any approved verification
- Check both `status` and `verification_status` fields
- Added console logging for debugging

### 3. Fallback Logic
- If no verification found, check shop data directly
- Check both `is_verified` and `verification_status` on shop
- Default to 'unverified' if nothing found

## Verification Flow

1. **Staff Approves Claim**:
   - `POST /api/staff/claims/:id/approve`
   - Updates `owner_verification.verification_status = 'approved'`
   - Updates `shops.verification_status = 'approved'`
   - Updates `shops.is_verified = true`

2. **Owner Dashboard Loads**:
   - Calls `GET /api/owner/claims/my`
   - Returns verifications with `status: verification_status`
   - Frontend checks for `status === 'approved'`
   - Sets `shopVerificationStatus = 'verified'`

3. **UI Updates**:
   - Shows "Shop Verified" message
   - Shows green status card
   - Links to shop management

## Files Changed
- `app/owner/dashboard/page.tsx`
  - Fixed `loadData()` to remove premature status check
  - Added `useEffect` to load status after shop loads
  - Improved `loadShopVerificationStatus()` logic
  - Added debug logging

## Testing
After this fix, the owner dashboard should:
1. ✅ Show "Shop Verified" when staff approves
2. ✅ Show "Claim Under Review" when status is pending
3. ✅ Show "Get Started" when no verification exists
4. ✅ Update status automatically when shop loads

## Next Steps
1. Test the fix in production
2. Check browser console for debug logs
3. Verify API response includes `status: 'approved'`
4. Remove console.log statements after verification


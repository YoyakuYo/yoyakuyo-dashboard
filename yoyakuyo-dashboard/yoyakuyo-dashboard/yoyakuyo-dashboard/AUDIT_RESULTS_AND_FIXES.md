# ✅ AUDIT RESULTS AND FIXES

**Date:** 2025-01-23  
**Status:** Issues Identified and Fixed

---

## 🔍 ISSUES FOUND

### Issue #1: `owner_auth_id` Foreign Key Constraint ❌

**Problem:**
- Migration `20250129_separate_owner_customer_auth.sql` creates FK: `owner_auth_id → owners(id)`
- But API code sets `owner_auth_id = user_id` where `user_id` comes from `auth.users.id`
- This causes FK violation because `auth.users.id` ≠ `owners.id`

**Evidence:**
- User data shows: `owner_auth_id: "61720e75-ffcb-4f9a-87e1-1d2b4d462f75"` (same as `id`)
- This ID is from `public.users.id`, not from `owners.id`
- FK constraint expects `owner_auth_id` to reference `owners(id)`

**Fix:**
- Drop FK constraint (owner_auth_id is optional reference field)
- Make `owner_auth_id` nullable
- **File:** `FIX_DATABASE_CONSTRAINTS.sql`

---

### Issue #2: Shop Creation Missing `claim_status` ❌

**Problem:**
- Shops table has CHECK constraint: `check_claim_status_unclaimed`
- Constraint requires: If `owner_user_id` is NOT NULL, `claim_status` cannot be 'unclaimed'
- Default `claim_status` is 'unclaimed'
- API only sets `name` and `owner_user_id`, causing constraint violation

**Evidence:**
- Migration `20250108010000_fix_claim_status_constraint.sql` creates constraint:
  ```sql
  CHECK (
    claim_status != 'unclaimed' OR 
    COALESCE(owner_user_id, owner_id) IS NULL
  );
  ```
- Migration `20250108000000_create_owner_verification_system.sql` sets default:
  ```sql
  claim_status TEXT NOT NULL DEFAULT 'unclaimed'
  ```

**Fix:**
- Update API to set `claim_status = 'pending'` when creating shop with `owner_user_id`
- **File:** `yoyakuyo-api/src/routes/auth.ts:283`

---

## ✅ FIXES APPLIED

### Fix #1: Database Constraint Fix
**File:** `FIX_DATABASE_CONSTRAINTS.sql`

**Changes:**
1. Drops FK constraint `users_owner_auth_id_fkey` (if it references `owners.id`)
2. Makes `owner_auth_id` nullable (allows NULL for customers)

**Status:** ✅ Ready to execute

---

### Fix #2: API Route Fix
**File:** `yoyakuyo-api/src/routes/auth.ts`

**Changes:**
```typescript
// BEFORE:
.insert([{
  name: shop_name,
  owner_user_id: user_id,
}])

// AFTER:
.insert([{
  name: shop_name,
  owner_user_id: user_id,
  claim_status: 'pending', // Required by CHECK constraint
}])
```

**Status:** ✅ Applied

---

## 📋 EXECUTION STEPS

### Step 1: Run Database Fix
```sql
-- Execute in Supabase SQL Editor:
-- File: FIX_DATABASE_CONSTRAINTS.sql
```

### Step 2: Verify API Fix
```bash
# Check file: yoyakuyo-api/src/routes/auth.ts:283
# Should now include: claim_status: 'pending'
```

### Step 3: Test Account Creation
1. Create new owner account
2. Verify user is created in `public.users`
3. Verify shop is created with `claim_status = 'pending'`

---

## 🎯 EXPECTED RESULTS

### After Fix #1 (Database):
- ✅ `owner_auth_id` FK constraint removed
- ✅ `owner_auth_id` is nullable
- ✅ User creation no longer fails due to FK violation

### After Fix #2 (API):
- ✅ Shop creation includes `claim_status = 'pending'`
- ✅ Shop creation no longer fails due to CHECK constraint violation

---

## ⚠️ NOTES

1. **owner_auth_id FK:**
   - FK was pointing to wrong table (`owners.id` instead of `auth.users.id`)
   - Dropping FK is safe - `owner_auth_id` is optional reference field
   - Code can continue setting `owner_auth_id = user_id` (from `auth.users.id`)

2. **claim_status:**
   - When shop is created with `owner_user_id`, it must have `claim_status != 'unclaimed'`
   - Setting to `'pending'` is correct - indicates claim is in progress
   - Later, when verification is approved, trigger will update to `'approved'`

---

## ✅ VERIFICATION

Run these queries to verify fixes:

```sql
-- Check owner_auth_id FK is removed
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%owner_auth_id%';
-- Should return 0 rows

-- Check claim_status constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.shops'::regclass
  AND contype = 'c'
  AND conname LIKE '%claim_status%';
-- Should show check_claim_status_unclaimed constraint

-- Test shop creation (should work now)
-- INSERT INTO shops (name, owner_user_id, claim_status) 
-- VALUES ('Test Shop', 'user-id-here', 'pending');
```

---

**END OF REPORT**


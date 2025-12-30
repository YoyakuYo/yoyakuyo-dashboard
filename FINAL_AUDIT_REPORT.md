# FULL DATABASE + BACKEND AUDIT REPORT

**Date:** 2025-01-23  
**Purpose:** Identify blocking issues for account creation and shop claiming  
**Status:** ⏳ AWAITING DATABASE QUERY RESULTS

---

## EXECUTIVE SUMMARY

This audit identifies the root causes of:
- ❌ User account creation failures
- ❌ Owner profile creation failures  
- ❌ Shop claim failures

**Critical Finding:** Cannot complete audit without running database queries.

---

## PHASE 1 — ENVIRONMENT VERIFICATION

**Status:** ⏳ **REQUIRES MANUAL VERIFICATION**

### Required Actions:
1. ✅ **Backend (Render):** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
2. ✅ **Frontend (Vercel):** Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. ✅ **Match Check:** Ensure `SUPABASE_URL` (Render) = `NEXT_PUBLIC_SUPABASE_URL` (Vercel)
4. ✅ **Key Check:** Ensure keys match their respective projects

**See:** `PHASE_1_ENV_VERIFICATION_REPORT.md` for detailed checklist

---

## PHASE 2 — AUTH ↔ USERS TABLE LINK

**Status:** ⏳ **AWAITING SQL QUERY RESULTS**

### Required SQL:
```sql
-- Run this in Supabase SQL Editor:
SELECT u.id, u.email, u.owner_auth_id, a.id AS auth_id, a.email AS auth_email
FROM public.users u
LEFT JOIN auth.users a ON u.owner_auth_id = a.id;
```

### Expected Issues:
- ❓ NULL `owner_auth_id` values
- ❓ Broken FK links (owner_auth_id points to non-existent auth.users.id)
- ❓ Email mismatches

**See:** `DATABASE_AUDIT_QUERIES.sql` → "PHASE 2" section

---

## PHASE 3 — BROKEN CONSTRAINT REMOVAL

**Status:** ⏳ **PENDING PHASE 2 RESULTS**

### Action Required:
- If FK is broken → Generate SQL to drop/recreate constraint
- If FK is valid → No action needed

**SQL Template (if needed):**
```sql
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_owner_auth_id_fkey;
```

---

## PHASE 4 — SHOP CLAIM CONSTRAINT DEBUG

**Status:** ⏳ **AWAITING SQL QUERY RESULTS**

### Required SQL:
```sql
-- Run this in Supabase SQL Editor:
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'shops';
```

### Expected Issues:
- ❓ CHECK constraint requiring `claimed_at` when `owner_user_id` is set
- ❓ CHECK constraint requiring `claim_status` when `owner_user_id` is set
- ❓ CHECK constraint requiring `owner_id` when `owner_user_id` is set

**See:** `DATABASE_AUDIT_QUERIES.sql` → "PHASE 4" section

---

## PHASE 5 — API INSERT TRACE

**Status:** ✅ **COMPLETE**

### Issues Found:

#### 🔴 Issue #1: User Creation - `owner_auth_id` FK
- **Route:** `POST /auth/signup-owner`
- **File:** `yoyakuyo-api/src/routes/auth.ts:242`
- **Problem:** Sets `owner_auth_id = user_id` without verifying FK exists
- **Fix:** Verify `user_id` exists in `auth.users` OR drop FK if not needed

#### 🔴 Issue #2: Shop Creation - Missing Required Columns
- **Route:** `POST /auth/signup-owner` (shop creation)
- **File:** `yoyakuyo-api/src/routes/auth.ts:279-288`
- **Problem:** Only sets `name` and `owner_user_id`, may be missing:
  - `owner_id`
  - `claimed_at`
  - `claim_status`
  - `verification_status`
- **Fix:** Add required columns based on CHECK constraint analysis

**See:** `PHASE_5_API_TRACE_REPORT.md` for full details

---

## PHASE 6 — REQUIRED OUTPUTS

### ✅ Generated Files:

1. **`DATABASE_AUDIT_QUERIES.sql`**
   - SQL queries to diagnose database issues
   - Run in Supabase SQL Editor
   - Returns constraint definitions and FK status

2. **`PHASE_1_ENV_VERIFICATION_REPORT.md`**
   - Environment variable verification checklist
   - Manual steps required

3. **`PHASE_5_API_TRACE_REPORT.md`**
   - Complete API route analysis
   - Column → value mapping
   - Identified issues

4. **`FINAL_AUDIT_REPORT.md`** (this file)
   - Executive summary
   - Status of all phases

### ⏳ Pending Files (after SQL results):

5. **`FIX_DATABASE_CONSTRAINTS.sql`** (to be generated)
   - Only contains REQUIRED fixes
   - Production-safe
   - No data loss

---

## NEXT STEPS

### Immediate Actions:

1. **Run Database Queries:**
   ```bash
   # Open Supabase Dashboard → SQL Editor
   # Copy/paste queries from DATABASE_AUDIT_QUERIES.sql
   # Run each section
   # Report results
   ```

2. **Verify Environment Variables:**
   ```bash
   # Check Render Dashboard → Environment
   # Check Vercel Dashboard → Environment Variables
   # Compare values
   # Report any mismatches
   ```

3. **Report Results:**
   - Share SQL query results
   - Share environment variable status
   - This will enable generation of final fix SQL

---

## BLOCKING ISSUES SUMMARY

### Currently Identified (from code analysis):

1. **User Insert:** `owner_auth_id` FK may be broken
2. **Shop Insert:** Missing required columns (to be confirmed by SQL)

### To Be Confirmed (requires SQL results):

1. **FK Constraint Status:** Is `users.owner_auth_id` → `auth.users.id` valid?
2. **Shop CHECK Constraints:** Which columns are required?
3. **Environment Variables:** Are they set and matching?

---

## ⚠️ CRITICAL: DO NOT PROCEED WITHOUT SQL RESULTS

**This audit cannot be completed without:**
- Database constraint definitions
- Foreign key status
- Environment variable verification

**All fixes will be generated AFTER receiving SQL query results.**

---

## RULES FOLLOWED

✅ **DO NOT assume anything** - All findings based on code analysis  
✅ **DO NOT reuse old logic** - Fresh analysis of current code  
✅ **DO NOT touch Stripe/payments** - Excluded from audit  
✅ **DO NOT change schemas** - Only fixing broken constraints  
✅ **DO NOT drop tables** - No destructive operations  
✅ **ONLY fix blocking issues** - Focused on account creation and shop claiming

---

**END OF REPORT**

**Status:** ⏳ **AWAITING DATABASE QUERY RESULTS AND ENVIRONMENT VERIFICATION**


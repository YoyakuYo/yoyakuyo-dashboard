# SYSTEMATIC FIX PLAN - Canonical Customer System

## INTENTION (DO NOT CHANGE)

- ONE single `customers` table
- THREE customer types via role/source:
  1. LINE customers (identified by `line_user_id` via `line_accounts`)
  2. WEB customers (identified by `auth_user_id` = `customers.id`)
  3. GUEST customers (identified by `guest_session_id` or equivalent)
- ALL existing bookings MUST remain and be linked correctly
- NO DATA LOSS allowed

---

## STEP 1: AUDIT CURRENT SCHEMA

**Run these SQL queries in Supabase SQL Editor to understand current state:**

```sql
-- ============================================
-- PART 1: Inspect customers table structure
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- ============================================
-- PART 2: Inspect bookings table structure
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- ============================================
-- PART 3: Check for customer_profiles table
-- ============================================
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'customer_profiles'
) AS customer_profiles_exists;

-- If exists, get its structure:
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_profiles'
ORDER BY ordinal_position;

-- ============================================
-- PART 4: Check for line_accounts table
-- ============================================
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'line_accounts'
) AS line_accounts_exists;

-- If exists, get its structure:
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'line_accounts'
ORDER BY ordinal_position;

-- ============================================
-- PART 5: Check current booking references
-- ============================================
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'bookings'
  AND (ccu.table_name = 'customers' OR ccu.table_name = 'customer_profiles');

-- ============================================
-- PART 6: Sample data inspection
-- ============================================
-- Check how LINE bookings are currently stored
SELECT 
    'LINE bookings sample' as category,
    b.id,
    b.customer_id,
    b.customer_profile_id,
    b.user_id,
    b.source,
    la.line_user_id,
    COUNT(*) OVER() as total_count
FROM bookings b
LEFT JOIN line_accounts la ON la.customer_id = b.customer_id
WHERE b.source = 'line' OR la.line_user_id IS NOT NULL
LIMIT 5;

-- Check how WEB bookings are currently stored
SELECT 
    'WEB bookings sample' as category,
    b.id,
    b.customer_id,
    b.customer_profile_id,
    b.user_id,
    b.source,
    cp.customer_auth_id,
    COUNT(*) OVER() as total_count
FROM bookings b
LEFT JOIN customer_profiles cp ON cp.id = b.customer_profile_id
WHERE b.source = 'web' OR b.user_id IS NOT NULL
LIMIT 5;

-- Check how GUEST bookings are currently stored
SELECT 
    'GUEST bookings sample' as category,
    b.id,
    b.customer_id,
    b.customer_profile_id,
    b.user_id,
    b.source,
    COUNT(*) OVER() as total_count
FROM bookings b
WHERE b.source = 'guest' 
   OR (b.customer_id IS NULL AND b.customer_profile_id IS NULL AND b.user_id IS NULL)
LIMIT 5;

-- ============================================
-- PART 7: Count bookings by reference type
-- ============================================
SELECT 
    'Total bookings' as metric,
    COUNT(*) as count
FROM bookings
UNION ALL
SELECT 
    'Bookings with customer_id',
    COUNT(*)
FROM bookings
WHERE customer_id IS NOT NULL
UNION ALL
SELECT 
    'Bookings with customer_profile_id',
    COUNT(*)
FROM bookings
WHERE customer_profile_id IS NOT NULL
UNION ALL
SELECT 
    'Bookings with user_id',
    COUNT(*)
FROM bookings
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
    'Bookings with source=line',
    COUNT(*)
FROM bookings
WHERE source = 'line'
UNION ALL
SELECT 
    'Bookings with source=web',
    COUNT(*)
FROM bookings
WHERE source = 'web'
UNION ALL
SELECT 
    'Bookings with source=guest',
    COUNT(*)
FROM bookings
WHERE source = 'guest';
```

**After running these queries, provide the results so we can create the correct migration.**

---

## STEP 2: DEFINE CANONICAL CUSTOMER ID

**Canonical identifier:** `customers.id` (UUID)

**Customer type identification:**
- **LINE:** `customers.id` → `line_accounts.customer_id` → `line_accounts.line_user_id`
- **WEB:** `customers.id` = `auth.users.id` (for authenticated web users)
- **GUEST:** `customers.id` = generated UUID (for guest sessions)

**Bookings reference:** `bookings.customer_id` → `customers.id` (NOT NULL after migration)

---

## STEP 3: NON-DESTRUCTIVE MIGRATION (SQL PROVIDED - DO NOT RUN YET)

**Migration will be created after Step 1 audit results are provided.**

The migration will:
1. Ensure `customers` table has correct structure
2. Add `bookings.customer_id` if missing (nullable initially)
3. Backfill `bookings.customer_id` from existing data:
   - WEB: Match via `user_id` or `customer_profile_id.customer_auth_id`
   - LINE: Match via `line_accounts.line_user_id`
   - GUEST: Create guest customer records
4. Verify no bookings are lost
5. Add NOT NULL constraint
6. Add foreign key constraint

---

## STEP 4: FRONTEND REALTIME FIX

**Current problem:** Realtime only works after navigation

**Fix:** Subscribe using `bookings.customer_id` directly, not auth state

**Pseudo-code:**
```typescript
// Get canonical customer_id
const customerId = await getCanonicalCustomerId(userId); // Resolves LINE/WEB/GUEST

// Subscribe to bookings changes
const channel = supabase
  .channel('customer-bookings')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookings',
    filter: `customer_id=eq.${customerId}`
  }, (payload) => {
    // Handle booking updates
  })
  .subscribe();
```

---

## STEP 5: REALTIME DEBUGGING

Add temporary logs:
- Channel name
- Filter used
- Bound customer_id
- Postgres changes payload

---

## STEP 6: FINAL DELIVERABLES

Will provide:
1. Full SQL migration script
2. Verification queries
3. Explanation of why LINE worked with NULL but WEB didn't
4. Exact frontend subscription logic

---

**NEXT ACTION:** Run the audit queries from Step 1 and provide the results.


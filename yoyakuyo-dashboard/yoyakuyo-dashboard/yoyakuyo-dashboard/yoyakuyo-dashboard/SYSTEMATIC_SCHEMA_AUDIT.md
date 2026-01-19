# SYSTEMATIC SCHEMA AUDIT

## STEP 1: AUDIT CURRENT SCHEMA

### Task: Inspect actual database schema

**SQL Queries to Run (DO NOT RUN YET - FOR INSPECTION ONLY):**

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
-- See what columns bookings uses to reference customers
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

**Expected Output Format:**

After running these queries, provide:
1. Complete column list for `customers` table
2. Complete column list for `bookings` table
3. Whether `customer_profiles` exists and its structure
4. Whether `line_accounts` exists and its structure
5. Foreign key relationships from `bookings`
6. Sample data showing how each customer type is currently stored
7. Counts of bookings by reference type

**This will tell us:**
- Which columns identify LINE customers (line_user_id? line_accounts?)
- Which columns identify WEB customers (user_id? customer_auth_id? customer_profile_id?)
- Which columns identify GUEST customers (guest_session_id? NULL?)
- How bookings currently reference customers
- What needs to be migrated


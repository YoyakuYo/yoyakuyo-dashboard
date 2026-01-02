# 🔍 Supabase Schema Verification Report
## Comparison: Expected Schema vs. Migrations

**Generated:** 2024-11-23  
**Scope:** `apps/api/src` and `apps/dashboard` authentication & signup flows

---

## 📋 EXECUTIVE SUMMARY

### ✅ **CRITICAL FINDINGS**

1. **NO `shop_owner` TABLE EXISTS** - Code does NOT reference this table
   - ✅ **CORRECT**: Ownership is via `shops.owner_user_id` → `public.users(id)`
   - ✅ **VERIFIED**: All code uses `shops.owner_user_id` directly
   - **No table name mismatch** - No code references `shop_owner` or `shop_owners`

2. **`users` TABLE SCHEMA** - ✅ Matches expectations
   - Required columns: `id`, `name`, `email`, `preferred_language`, `created_at`, `updated_at`
   - Required constraint: `users_email_unique` (UNIQUE on email)
   - Required FK: `id` → `auth.users(id) ON DELETE CASCADE`
   - **Code references**: `apps/api/src/routes/auth.ts`, `apps/api/src/routes/users.ts`

3. **`shops` TABLE SCHEMA** - ✅ Matches expectations
   - Required columns: `id`, `name`, `owner_user_id`, `claim_status`, `claimed_at`, `email`, `address`, `phone`, `created_at`, `updated_at`
   - Required FK: `owner_user_id` → `public.users(id) ON DELETE SET NULL`
   - **Code references**: `apps/api/src/routes/auth.ts` (line 204), `apps/api/src/routes/shops.ts`

4. **RLS POLICIES** - ⚠️ **VERIFICATION NEEDED IN DATABASE**
   - `users` table: INSERT policy exists (from `20251123000000_fix_users_table_rls_and_constraints.sql`)
   - `shops` table: INSERT policy exists (from `20251122000001_fix_shops_insert_rls_policy.sql`)
   - **Action**: Run verification SQL queries below to confirm policies are active

### 🎯 **SCHEMA MISMATCH SUMMARY**

| Issue Type | Count | Status |
|-----------|-------|--------|
| Table name mismatches | **0** | ✅ None found |
| Missing tables | **0** | ✅ All exist in migrations |
| Missing columns | **0** | ✅ All exist in migrations |
| Missing foreign keys | **0** | ✅ All exist in migrations |
| Missing constraints | **0** | ✅ All exist in migrations |
| Missing RLS policies | **0** | ⚠️ Verify in database |
| Code referencing wrong tables | **0** | ✅ All correct |

---

## 📊 DETAILED TABLE ANALYSIS

### 1. `public.users` TABLE

#### ✅ **Expected Schema (from code)**
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraints
CONSTRAINT users_email_unique UNIQUE (email);

-- Indexes
CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_preferred_language_idx ON public.users(preferred_language);

-- RLS Policies
POLICY "Users can read own record" FOR SELECT USING (auth.uid() = id);
POLICY "Users can insert own record" FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
POLICY "Users can update own record" FOR UPDATE USING (auth.uid() = id);
```

#### ✅ **Migration Files**
- `create_users_table.sql` - Creates base table
- `add_owner_preferred_language.sql` - Adds `preferred_language` column
- `20251123000000_fix_users_table_rls_and_constraints.sql` - Adds INSERT policy and unique constraint

#### ✅ **Code References**
- `apps/api/src/routes/auth.ts` (lines 35, 53, 66, 78, 103, 117, 137, 156, 180, 226)
- `apps/api/src/routes/users.ts` (lines 22, 72, 94)
- `apps/api/src/routes/ai.ts` (lines 369, 380)

#### ✅ **STATUS: MATCHES EXPECTATIONS**

---

### 2. `shops` TABLE

#### ✅ **Expected Schema (from code)**
```sql
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    claim_status TEXT DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'pending', 'approved', 'rejected')),
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Additional fields from migrations
    city VARCHAR(255),
    country VARCHAR(255),
    zip_code VARCHAR(20),
    description TEXT,
    language_code VARCHAR(10),
    -- ... (many more fields from various migrations)
);

-- Indexes
CREATE INDEX shops_owner_user_id_idx ON shops(owner_user_id);
CREATE INDEX shops_claim_status_idx ON shops(claim_status);
```

#### ✅ **Migration Files**
- `schema.sql` - Base table
- `add_shop_ownership_fields.sql` - Adds `owner_user_id`, `claim_status`, `claimed_at`
- `fix_shops_schema_complete.sql` - Adds `city`, `country`, `zip_code`, `description`, `language_code`, `created_at`, `updated_at`
- `20251122000001_fix_shops_insert_rls_policy.sql` - Adds INSERT RLS policy

#### ✅ **Code References**
- `apps/api/src/routes/auth.ts` (line 204) - Creates shop with `owner_user_id`
- `apps/api/src/routes/shops.ts` (multiple lines)
- All shop-related endpoints

#### ✅ **STATUS: MATCHES EXPECTATIONS**

---

### 3. `shop_threads` TABLE

#### ✅ **Expected Schema (from code)**
```sql
CREATE TABLE shop_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    customer_email TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    line_user_id VARCHAR(255),
    owner_taken_over BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ✅ **Migration Files**
- `20251121183413_create_shop_threads_and_messages.sql` - Creates table

#### ✅ **Code References**
- `apps/api/src/routes/ai.ts` (lines 33, 47, 57, 94, 392, 578, 702, 1091, 1268)
- `apps/api/src/routes/messages.ts` (lines 25, 42, 86, 124, 224, 245, 331, 365, 456, 635)
- `apps/api/src/routes/owner.ts` (lines 42, 53, 291, 303)
- `apps/api/src/services/lineWebhookService.ts` (lines 57, 73)

#### ✅ **STATUS: MATCHES EXPECTATIONS**

---

### 4. `shop_messages` TABLE

#### ✅ **Expected Schema (from code)**
```sql
CREATE TABLE shop_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES shop_threads(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'owner', 'ai')),
    content TEXT NOT NULL,
    sender_id TEXT,
    read_by_owner BOOLEAN DEFAULT FALSE,
    read_by_customer BOOLEAN DEFAULT FALSE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ✅ **Migration Files**
- `20251121183413_create_shop_threads_and_messages.sql` - Creates table

#### ✅ **Code References**
- `apps/api/src/routes/ai.ts` (lines 77, 113, 138, 268, 311, 346, 508, 525, 542, 563, 1110, 1376, 1415)
- `apps/api/src/routes/messages.ts` (lines 178, 274, 317, 410, 480)
- `apps/api/src/routes/owner.ts` (lines 77, 107, 234)
- `apps/api/src/services/lineWebhookService.ts` (lines 107, 177)

#### ✅ **STATUS: MATCHES EXPECTATIONS**

---

### 5. `messages` TABLE (Legacy)

#### ⚠️ **Expected Schema (from code)**
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL,
    message TEXT NOT NULL,
    language_code TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ✅ **Migration Files**
- `20251121183414_create_legacy_messages_table.sql` - Creates table

#### ⚠️ **Code References**
- `apps/api/src/routes/messages.ts` (lines 567, 599) - **LEGACY ENDPOINTS ONLY**

#### ⚠️ **STATUS: EXISTS BUT LEGACY**
- **Note**: This table is only used in legacy endpoints. New code uses `shop_messages`.

---

### 6. `shop_owner_unread_counts` VIEW

#### ✅ **Expected Schema (from code)**
```sql
CREATE VIEW shop_owner_unread_counts AS
SELECT * FROM get_shop_owner_unread_counts();

-- Function returns:
-- shop_id UUID
-- thread_id UUID
-- unread_count BIGINT
```

#### ✅ **Migration Files**
- `20251121183413_create_shop_threads_and_messages.sql` - Creates view and function

#### ✅ **Code References**
- `apps/api/src/routes/messages.ts` (lines 472, 537)

#### ✅ **STATUS: MATCHES EXPECTATIONS**

---

## 🔗 FOREIGN KEY RELATIONSHIPS

### ✅ **Verified Relationships**

1. **`users.id` → `auth.users(id)`**
   - Migration: `create_users_table.sql` line 6
   - Constraint: `ON DELETE CASCADE`
   - ✅ **VERIFIED**

2. **`shops.owner_user_id` → `public.users(id)`**
   - Migration: `add_shop_ownership_fields.sql` line 6
   - Constraint: `ON DELETE SET NULL`
   - ✅ **VERIFIED**

3. **`shop_threads.shop_id` → `shops(id)`**
   - Migration: `20251121183413_create_shop_threads_and_messages.sql` line 9
   - Constraint: `ON DELETE CASCADE`
   - ✅ **VERIFIED**

4. **`shop_messages.thread_id` → `shop_threads(id)`**
   - Migration: `20251121183413_create_shop_threads_and_messages.sql` line 53
   - Constraint: `ON DELETE CASCADE`
   - ✅ **VERIFIED**

---

## 🔒 RLS POLICIES & CONSTRAINTS

### ✅ **`users` Table Policies**

| Policy Name | Operation | Status | Migration |
|------------|-----------|--------|-----------|
| "Users can read own record" | SELECT | ✅ Expected | `create_users_table.sql` |
| "Users can insert own record" | INSERT | ✅ Expected | `20251123000000_fix_users_table_rls_and_constraints.sql` |
| "Users can update own record" | UPDATE | ✅ Expected | `create_users_table.sql` |

### ✅ **`shops` Table Policies**

| Policy Name | Operation | Status | Migration |
|------------|-----------|--------|-----------|
| "Allow authenticated users to insert shop for themselves" | INSERT | ✅ Expected | `20251122000001_fix_shops_insert_rls_policy.sql` |

### ✅ **Constraints**

| Table | Constraint | Type | Status |
|-------|-----------|------|--------|
| `users` | `users_email_unique` | UNIQUE(email) | ✅ Expected |
| `users` | `users_pkey` | PRIMARY KEY(id) | ✅ Expected |
| `shops` | `shops_owner_user_id_fkey` | FK to `users(id)` | ✅ Expected |

---

## ❌ **POTENTIAL ISSUES TO VERIFY**

### 1. ⚠️ **Email Confirmation Requirement**

**Issue**: Login may fail if email confirmation is required in Supabase Auth settings.

**Code Location**: 
- `apps/dashboard/app/page.tsx` (lines 235-253)
- `apps/dashboard/app/public/page.tsx` (lines 226-244)

**Expected Behavior**:
- If `email_confirmed_at IS NULL` in `auth.users`, sign-in will fail
- Code handles this by showing error message

**SQL Verification Needed**:
```sql
-- Check if email confirmation is required
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    pu.id AS public_user_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email_confirmed_at IS NULL
  AND pu.id IS NOT NULL;
```

**Fix**: Ensure Supabase Auth settings allow unconfirmed users OR ensure email confirmation is sent and completed.

---

### 2. ⚠️ **Missing `preferred_language` Column**

**Potential Issue**: If migration `add_owner_preferred_language.sql` was not run, `preferred_language` column may be missing.

**Code References**:
- `apps/api/src/routes/users.ts` (lines 23, 40, 73, 90, 96, 116, 119)
- `apps/api/src/routes/ai.ts` (lines 370, 374, 381)

**SQL Verification**:
```sql
-- Check if column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'preferred_language';
```

**Fix**: Run migration `add_owner_preferred_language.sql` if column is missing.

---

### 3. ⚠️ **RLS Policy Verification**

**Potential Issue**: RLS policies may not be active if migrations were not run in order.

**SQL Verification**:
```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'shops');

-- Check policies exist
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'shops')
ORDER BY tablename, policyname;
```

---

## 📝 **MIGRATION CHECKLIST**

### ✅ **Required Migrations (in order)**

1. ✅ `create_users_table.sql` - Base users table
2. ✅ `add_owner_preferred_language.sql` - Add `preferred_language` column
3. ✅ `20251123000000_fix_users_table_rls_and_constraints.sql` - Add INSERT policy and unique constraint
4. ✅ `add_shop_ownership_fields.sql` - Add `owner_user_id` to shops
5. ✅ `fix_shops_schema_complete.sql` - Add missing shop columns
6. ✅ `20251122000001_fix_shops_insert_rls_policy.sql` - Add shops INSERT policy
7. ✅ `20251121183413_create_shop_threads_and_messages.sql` - Create thread/message tables
8. ✅ `20251121183414_create_legacy_messages_table.sql` - Create legacy messages table

---

## 🔍 **VERIFICATION SQL QUERIES**

Run these queries in Supabase SQL Editor to verify schema:

### 1. Verify `users` table structure
```sql
-- Check users table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Check users table constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

-- Check users table policies
SELECT 
    policyname,
    cmd AS operation,
    roles,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';
```

### 2. Verify `shops` table structure
```sql
-- Check shops table columns (especially owner_user_id)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shops'
  AND column_name IN ('id', 'name', 'owner_user_id', 'claim_status', 'claimed_at', 'email', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Check shops foreign key to users
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.shops'::regclass
  AND contype = 'f'
  AND conname LIKE '%owner_user_id%';
```

### 3. Verify foreign key relationships
```sql
-- Check all foreign keys involving users and shops
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.table_name = 'users' OR tc.table_name = 'users' OR tc.table_name = 'shops')
ORDER BY tc.table_name, kcu.column_name;
```

### 4. Verify data integrity
```sql
-- Check for orphaned users (auth.users without public.users)
SELECT 
    au.id AS auth_user_id,
    au.email,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- Check for orphaned shops (shops with invalid owner_user_id)
SELECT 
    s.id AS shop_id,
    s.name,
    s.owner_user_id,
    s.claim_status,
    CASE 
        WHEN pu.id IS NULL THEN 'MISSING USER'
        WHEN au.id IS NULL THEN 'ORPHANED USER'
        ELSE 'OK'
    END AS status
FROM shops s
LEFT JOIN public.users pu ON s.owner_user_id = pu.id
LEFT JOIN auth.users au ON pu.id = au.id
WHERE s.owner_user_id IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 10;
```

---

## ✅ **FINAL VERDICT**

### **NO CRITICAL SCHEMA MISMATCHES FOUND**

All expected tables, columns, and relationships exist in migrations:
- ✅ `users` table with correct schema
- ✅ `shops` table with `owner_user_id` FK
- ✅ `shop_threads` and `shop_messages` tables
- ✅ Required RLS policies
- ✅ Required constraints (UNIQUE email, FKs)

### **ACTION ITEMS**

1. **Run verification SQL queries** above to confirm actual database state
2. **Check Supabase Auth settings** - Email confirmation requirement
3. **Verify all migrations have been applied** in correct order
4. **Test login/signup flow** after verification

---

## 📋 **MIGRATION EXECUTION ORDER**

If you need to apply migrations manually, use this order:

```bash
# 1. Base tables
create_users_table.sql
add_owner_preferred_language.sql
20251123000000_fix_users_table_rls_and_constraints.sql

# 2. Shop ownership
add_shop_ownership_fields.sql
fix_shops_schema_complete.sql
20251122000001_fix_shops_insert_rls_policy.sql

# 3. Messaging system
20251121183413_create_shop_threads_and_messages.sql
20251121183414_create_legacy_messages_table.sql
```

---

**END OF REPORT**


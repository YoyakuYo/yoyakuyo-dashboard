# PHASE 5 — API INSERT TRACE REPORT

## Route 1: User Creation (`POST /auth/signup-owner`)

**File:** `yoyakuyo-api/src/routes/auth.ts:188-312`

### SQL Being Executed:
```sql
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    owner_auth_id,
    account_status
) VALUES (
    :user_id,        -- From req.body.user_id (auth.users.id)
    :email,          -- From req.body.email
    :name,           -- From req.body.name
    'owner',         -- Hardcoded
    :user_id,        -- Same as id (for owners)
    'active'         -- Hardcoded
);
```

### Column → Value Map:
| Column | Source | Value | Notes |
|--------|--------|-------|-------|
| `id` | `req.body.user_id` | UUID from auth.users | ✅ Required |
| `email` | `req.body.email` | String | ✅ Required |
| `full_name` | `req.body.name` | String | ✅ Required |
| `role` | Hardcoded | `'owner'` | ✅ Required |
| `owner_auth_id` | `req.body.user_id` | UUID (same as id) | ⚠️ **POTENTIAL ISSUE** |
| `account_status` | Hardcoded | `'active'` | ✅ Required |

### ⚠️ POTENTIAL ISSUE: `owner_auth_id` Foreign Key
- **Current Logic:** Sets `owner_auth_id = user_id` (same as `id`)
- **Expected:** `owner_auth_id` should reference `auth.users.id`
- **Problem:** If `user_id` doesn't exist in `auth.users`, FK constraint will fail
- **Fix Required:** Verify `user_id` exists in `auth.users` before insert

---

## Route 2: Owner Profile Creation (`POST /api/owner/claims/start`)

**File:** `yoyakuyo-api/src/routes/owner-claims.ts:48-74`

### SQL Being Executed:
```sql
INSERT INTO public.owner_profiles (
    id,
    full_name,
    created_at
) VALUES (
    :userId,              -- From req.headers['x-user-id']
    '',                   -- Empty string (updated later)
    :now                  -- Current timestamp
)
ON CONFLICT (id) DO UPDATE SET ...;
```

### Column → Value Map:
| Column | Source | Value | Notes |
|--------|--------|-------|-------|
| `id` | `req.headers['x-user-id']` | UUID | ✅ Required |
| `full_name` | Hardcoded | `''` | ⚠️ Empty string |
| `created_at` | `new Date().toISOString()` | Timestamp | ✅ Required |

### ✅ Status: No issues detected

---

## Route 3: Shop Creation (`POST /auth/signup-owner` - Shop Creation)

**File:** `yoyakuyo-api/src/routes/auth.ts:276-300`

### SQL Being Executed:
```sql
INSERT INTO public.shops (
    name,
    owner_user_id
) VALUES (
    :shop_name,      -- From req.body.shop_name
    :user_id         -- From req.body.user_id
);
```

### Column → Value Map:
| Column | Source | Value | Notes |
|--------|--------|-------|-------|
| `name` | `req.body.shop_name` | String | ✅ Required |
| `owner_user_id` | `req.body.user_id` | UUID | ✅ Required |
| `owner_id` | **NOT SET** | NULL | ⚠️ **MISSING?** |
| `claimed_at` | **NOT SET** | NULL | ⚠️ **MISSING?** |
| `claim_status` | **NOT SET** | NULL | ⚠️ **MISSING?** |
| `verification_status` | **NOT SET** | NULL | ⚠️ **MISSING?** |

### ⚠️ POTENTIAL ISSUES:
1. **Missing `owner_id`:** May be required by CHECK constraint
2. **Missing `claimed_at`:** May be required by CHECK constraint
3. **Missing `claim_status`:** May be required by CHECK constraint
4. **Missing `verification_status`:** May be required by CHECK constraint

### 🔍 REQUIRES DATABASE SCHEMA CHECK:
- Run `DATABASE_AUDIT_QUERIES.sql` → "PHASE 4 — SHOP CLAIM CONSTRAINT DEBUG"
- Identify which columns are required by CHECK constraints
- Update this route to include required columns

---

## Route 4: Owner Verification Creation (`POST /api/owner/claims/start`)

**File:** `yoyakuyo-api/src/routes/owner-claims.ts:94-121`

### SQL Being Executed:
```sql
INSERT INTO public.owner_verification (
    user_id,
    shop_id,
    verification_status,
    full_name,
    date_of_birth,
    nationality,
    country_of_residence,
    address_line1,
    city,
    prefecture,
    phone_number,
    email,
    role_in_business,
    position_title,
    since_when
) VALUES (
    :userId,              -- From req.headers['x-user-id']
    :shop_id,             -- From req.body.shop_id
    'draft',              -- Hardcoded
    '',                   -- Empty (updated in step1)
    '1900-01-01',         -- Default date
    '',                   -- Empty (updated in step1)
    '',                   -- Empty (updated in step1)
    '',                   -- Empty (updated in step1)
    '',                   -- Empty (updated in step1)
    '',                   -- Empty (updated in step1)
    '',                   -- Empty (updated in step1)
    '',                   -- Empty (updated in step1)
    'Owner',              -- Default
    '',                   -- Empty (updated in step1)
    '1900-01-01'          -- Default date
);
```

### Column → Value Map:
| Column | Source | Value | Notes |
|--------|--------|-------|-------|
| `user_id` | `req.headers['x-user-id']` | UUID | ✅ Required |
| `shop_id` | `req.body.shop_id` | UUID | ✅ Required |
| `verification_status` | Hardcoded | `'draft'` | ✅ Required |
| All other fields | Defaults | Empty strings/dates | ✅ Updated in step1 |

### ✅ Status: No issues detected

---

## Summary of Issues Found

### 🔴 CRITICAL ISSUES:

1. **User Creation - `owner_auth_id` FK:**
   - **Location:** `auth.ts:242`
   - **Issue:** Sets `owner_auth_id = user_id` without verifying FK exists
   - **Fix:** Verify `user_id` exists in `auth.users` before insert, OR drop FK constraint if not needed

2. **Shop Creation - Missing Required Columns:**
   - **Location:** `auth.ts:279-288`
   - **Issue:** Only sets `name` and `owner_user_id`, may be missing required columns
   - **Fix:** Check database constraints, add required columns

### ⚠️ WARNINGS:

1. **Owner Profile - Empty `full_name`:**
   - **Location:** `owner-claims.ts:61`
   - **Issue:** Creates profile with empty `full_name`
   - **Status:** Acceptable (updated later in step1)

---

## Next Steps

1. **Run `DATABASE_AUDIT_QUERIES.sql`** to identify:
   - Exact CHECK constraints on `shops` table
   - Foreign key constraints on `users.owner_auth_id`
   - Required columns for shop creation

2. **Generate fix SQL** based on constraint analysis

3. **Update API routes** to include all required columns


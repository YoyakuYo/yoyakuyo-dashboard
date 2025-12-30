# Customer Architecture Explanation

## ✅ CORRECT DESIGN: Single `customers` Table

You should **keep ONE `customers` table** for all three customer types. This is the correct design pattern.

## Current Architecture

### 1. `customers` Table (Single Source of Truth)
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('guest','customer','owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose:** Stores ALL customers regardless of type
- **LINE customers**: Have `role='customer'` and linked via `line_accounts`
- **Web customers**: Have `role='customer'` and `id` = their `auth.users.id`
- **Guest customers**: Have `role='guest'` and `id` = generated `auth.users.id`

### 2. `line_accounts` Table (Mapping Table)
```sql
CREATE TABLE line_accounts (
  customer_id UUID NOT NULL REFERENCES customers(id),
  line_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose:** Maps LINE user ID → customer ID
- Links LINE users (who don't have traditional login) to the canonical customer system
- This is a **mapping table**, not a separate customer table

### 3. `bookings` Table (Uses `source` Field)
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  source TEXT NOT NULL CHECK (source IN ('line','web','guest')),
  ...
);
```

**Purpose:** All bookings reference `customers.id`, with `source` indicating entry method

## Why This Design is Correct

### ✅ Benefits of Single Table:
1. **Unified queries**: One query works for all customer types
2. **Consistent relationships**: All bookings reference `customers.id`
3. **Simpler joins**: No need to join multiple customer tables
4. **Single source of truth**: Customer data in one place

### ❌ Problems with Separate Tables:
1. **Complex queries**: Need UNION or multiple queries
2. **Inconsistent relationships**: Different foreign keys for each type
3. **Data duplication**: Same customer info in multiple places
4. **Harder to maintain**: Changes need to be applied to multiple tables

## About `line_users` Table

I created `line_users` for Supabase Realtime JWT generation, but it might be **redundant**.

### Option 1: Use `customers.id` Directly (Recommended)
- LINE users already have `customers.id` (created by backend)
- `customers.id` references `auth.users.id`
- We can use `customers.id` as the JWT `sub` claim
- **No need for `line_users` table**

### Option 2: Keep `line_users` (If needed)
- Only if `customers.id` cannot be used for JWT
- Would need to link `line_users.id` → `customers.id` via `line_accounts`

## Recommendation

**Keep your current architecture:**
- ✅ One `customers` table
- ✅ `line_accounts` for LINE user mapping
- ✅ `source` field in `bookings` to distinguish entry method
- ❌ Remove `line_users` table (use `customers.id` for JWT instead)

## Migration Path

If you want to simplify and remove `line_users`:

1. Update backend JWT generation to use `customers.id` directly
2. Update RLS policies to use `customers.id` instead of `line_users.id`
3. Drop `line_users` table

The key insight: **Customer type (LINE/web/guest) is an attribute, not a separate entity.**


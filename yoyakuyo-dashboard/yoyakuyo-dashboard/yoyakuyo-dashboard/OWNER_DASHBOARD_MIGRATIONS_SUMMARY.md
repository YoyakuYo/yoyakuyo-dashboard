# OWNER DASHBOARD MIGRATIONS SUMMARY

## ✅ MIGRATIONS CREATED

Three migration files have been created to fix all missing tables in the owner dashboard:

### 1. Services Table
**File:** `supabase/migrations/20250105050000_create_services_table.sql`

**Table:** `services`
- Used by: `/shops` page (Services tab), `/bookings` page, API routes
- Columns:
  - `id` (UUID, primary key)
  - `shop_id` (UUID, foreign key to shops)
  - `name` (TEXT, required)
  - `description` (TEXT, nullable)
  - `price` (DECIMAL(10,2), required)
  - `duration_minutes` (INTEGER, nullable)
  - `is_active` (BOOLEAN, default TRUE)
  - `created_at`, `updated_at` (timestamps)

**Features:**
- ✅ RLS policies (public read active, owners full control)
- ✅ Indexes for performance
- ✅ Auto-update trigger for `updated_at`
- ✅ Foreign key constraint with CASCADE delete

---

### 2. Staff Table
**File:** `supabase/migrations/20250105060000_create_staff_table.sql`

**Table:** `staff`
- Used by: `/shops` page (Staff tab), API routes
- Columns:
  - `id` (UUID, primary key)
  - `shop_id` (UUID, foreign key to shops)
  - `first_name` (TEXT, required)
  - `last_name` (TEXT, nullable)
  - `phone` (TEXT, nullable)
  - `email` (TEXT, nullable)
  - `role` (TEXT, nullable)
  - `is_active` (BOOLEAN, default TRUE)
  - `created_at`, `updated_at` (timestamps)

**Features:**
- ✅ RLS policies (public read active, owners full control)
- ✅ Indexes for performance
- ✅ Auto-update trigger for `updated_at`
- ✅ Foreign key constraint with CASCADE delete

---

### 3. Subscriptions Table
**File:** `supabase/migrations/20250105070000_create_subscriptions_table.sql`

**Table:** `subscriptions`
- Used by: `/owner/subscription` page, subscription API routes
- Columns:
  - `id` (UUID, primary key)
  - `shop_id` (UUID, foreign key to shops)
  - `user_id` (UUID, foreign key to users)
  - `plan` (TEXT: 'basic', 'premium', 'enterprise')
  - `status` (TEXT: 'active', 'canceled', 'past_due', etc.)
  - `stripe_subscription_id` (TEXT, unique, nullable)
  - `stripe_customer_id` (TEXT, nullable)
  - `current_period_start`, `current_period_end` (TIMESTAMPTZ, nullable)
  - `cancel_at_period_end` (BOOLEAN, default FALSE)
  - `canceled_at`, `trial_start`, `trial_end` (TIMESTAMPTZ, nullable)
  - `metadata` (JSONB, default '{}')
  - `created_at`, `updated_at` (timestamps)

**Features:**
- ✅ RLS policies (owners can manage their subscriptions)
- ✅ Indexes for performance
- ✅ Auto-update trigger for `updated_at`
- ✅ Foreign key constraints with CASCADE delete
- ✅ Check constraints for plan and status values

---

## 📋 EXECUTION ORDER

Run these migrations in Supabase SQL Editor in this exact order:

1. **First:** `20250105050000_create_services_table.sql`
2. **Second:** `20250105060000_create_staff_table.sql`
3. **Third:** `20250105070000_create_subscriptions_table.sql`

---

## ✅ VERIFICATION QUERIES

After running all migrations, verify tables exist:

```sql
-- Check if services table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'services'
) AS services_exists;

-- Check if staff table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'staff'
) AS staff_exists;

-- Check if subscriptions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
) AS subscriptions_exists;
```

All three should return `true`.

---

## 🎯 IMPACT

After running these migrations:

✅ **My Shop** (`/shops`) - Services and Staff tabs will work
✅ **Bookings** (`/bookings`) - Service names will display correctly
✅ **Subscription** (`/owner/subscription`) - Subscription management will work

All owner dashboard sections will now have their required database tables!


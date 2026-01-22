# SCHEMA AUDIT - Booking System

## STEP 0: Current Schema Analysis

### 1. BOOKINGS TABLE (Current State)

Based on migrations, the `bookings` table currently has:

**Core Columns:**
- `id` (UUID, PK)
- `shop_id` (UUID, FK -> shops)
- `service_id` (UUID, FK -> services)
- `customer_id` (UUID, FK -> customers) - **LEGACY, may be nullable**
- `customer_profile_id` (UUID, FK -> customer_profiles) - **May be nullable**
- `user_id` (UUID, FK -> users.id) - **NOT NULL (enforced by migration)**
- `staff_id` (UUID, FK -> staff) - **Nullable**

**Booking Details:**
- `start_time` (TIMESTAMP)
- `end_time` (TIMESTAMP)
- `date` (DATE)
- `time_slot` (TEXT)
- `status` (ENUM: 'pending', 'confirmed', 'rejected', 'cancelled', 'completed')
- `notes` (TEXT)

**Customer Info (Denormalized):**
- `customer_name` (TEXT)
- `customer_email` (TEXT)
- `customer_phone` (TEXT)

**Timestamps:**
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**PROBLEMS IDENTIFIED:**
1. ❌ **NO `booking_type` enum** - Cannot distinguish LINE/user/guest
2. ❌ **NO `guest_id` column** - Guests cannot be properly tracked
3. ❌ **NO `line_user_id` column in bookings** - Must join via `line_bookings` table
4. ❌ **Multiple ownership paths** - `user_id`, `customer_id`, `customer_profile_id` all exist
5. ❌ **`user_id` is NOT NULL** - Forces guest bookings to create fake users
6. ❌ **Ambiguous ownership** - Cannot determine booking type from booking row alone

### 2. USERS TABLE

**Columns:**
- `id` (UUID, PK)
- `name` (VARCHAR(255)) - **Nullable**
- `email` (VARCHAR(255)) - **Unique, nullable**
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**PROBLEMS:**
- Used for both LINE users AND web authenticated users
- No distinction between user types
- Guest bookings are forced to create user records (wrong!)

### 3. USER_IDENTITIES TABLE

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id, NOT NULL)
- `provider` (TEXT, CHECK IN ('line'))
- `provider_user_id` (TEXT, NOT NULL) - LINE 'sub'
- `created_at` (TIMESTAMPTZ)
- **UNIQUE(provider, provider_user_id)**

**STATUS:** ✅ This is correct for LINE user mapping

### 4. LINE_BOOKINGS TABLE

**Columns:**
- `id` (UUID, PK)
- `booking_id` (UUID, FK -> bookings.id, CASCADE)
- `line_user_id` (TEXT, NOT NULL) - LINE 'sub'
- `line_message_id` (TEXT) - For LINE updates
- `created_at` (TIMESTAMPTZ)

**PROBLEMS:**
- ❌ **Separate table** - Requires JOIN to get LINE bookings
- ❌ **No direct link** - Cannot query bookings by `line_user_id` directly
- ❌ **Redundant** - Should be in bookings table directly

### 5. GUESTS TABLE

**STATUS:** ❌ **DOES NOT EXIST**

**REQUIRED:**
- `id` (UUID, PK)
- `full_name` (TEXT, NOT NULL)
- `phone` (TEXT)
- `email` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 6. SHOP_NOTIFICATIONS TABLE

**Columns:**
- `id` (UUID, PK)
- `shop_id` (UUID, FK -> shops.id, NOT NULL)
- `booking_id` (UUID, FK -> bookings.id)
- `type` (TEXT, CHECK IN ('new_booking'), DEFAULT 'new_booking')
- `is_read` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ)

**STATUS:** ✅ This is correct

### 7. CUSTOMER_PROFILES TABLE

**Columns (from migrations):**
- `id` (UUID, PK)
- `customer_auth_id` (UUID, FK -> users.id) - **Nullable**
- `line_user_id` (TEXT, UNIQUE) - **Nullable**
- `line_display_name` (TEXT)
- `line_picture_url` (TEXT)
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)

**PROBLEMS:**
- ❌ **Mixed purpose** - Used for both LINE and web users
- ❌ **Ambiguous** - Cannot determine if user is LINE or web from this table alone

---

## ROOT CAUSE ANALYSIS

### Problem 1: No Booking Type Distinction
- Cannot tell if booking is from LINE, web user, or guest
- Must join multiple tables to determine ownership
- Queries are complex and error-prone

### Problem 2: Guest Bookings Forced to Create Users
- `user_id NOT NULL` constraint forces guest bookings to create fake user records
- Guests should NOT have user records
- Creates orphaned user records

### Problem 3: Multiple Ownership Paths
- `user_id` (for LINE/web users)
- `customer_id` (legacy)
- `customer_profile_id` (legacy)
- `line_bookings.line_user_id` (for LINE)
- No single source of truth

### Problem 4: LINE Bookings Require JOIN
- Must join `line_bookings` to get LINE user info
- Cannot query bookings directly by `line_user_id`
- Inefficient and error-prone

---

## REQUIRED FIXES

### 1. Add `booking_type` ENUM
```sql
CREATE TYPE booking_type_enum AS ENUM ('line', 'user', 'guest');
```

### 2. Add `guest_id` column to bookings
```sql
ALTER TABLE bookings ADD COLUMN guest_id UUID REFERENCES guests(id);
```

### 3. Add `line_user_id` directly to bookings
```sql
ALTER TABLE bookings ADD COLUMN line_user_id TEXT;
```

### 4. Make `user_id` nullable
```sql
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;
```

### 5. Create `guests` table
```sql
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Add DB constraints to enforce ownership rules
```sql
-- booking_type='line' → line_user_id NOT NULL, user_id NOT NULL
-- booking_type='user' → user_id NOT NULL
-- booking_type='guest' → guest_id NOT NULL
-- EXACTLY ONE ownership path per booking
```

---

## NEXT STEPS

1. ✅ Schema audit complete
2. ⏳ Create migration to add booking_type enum
3. ⏳ Create guests table
4. ⏳ Add columns to bookings table
5. ⏳ Add DB constraints
6. ⏳ Migrate existing data
7. ⏳ Update application code
8. ⏳ Verify all flows work


# Database Audit Report - YoyakuYo (Bookyo)

## Tables Referenced in Code

### Core Tables (Exist in Migrations)
- ✅ `shops` - Core shop table
- ✅ `categories` - Shop categories
- ✅ `services` - Services offered by shops
- ✅ `staff` - Staff members
- ✅ `bookings` - Booking records
- ✅ `customers` - Customer records
- ✅ `users` - Owner user accounts
- ✅ `availability` - Staff availability/timeslots
- ✅ `shop_holidays` - Holiday/unavailable dates
- ✅ `shop_photos` - Shop photos (logo, cover, gallery)
- ✅ `reviews` - Customer reviews
- ✅ `line_user_mappings` - LINE user to customer mapping
- ✅ `line_shop_settings` - LINE shop configuration (NEW)
- ✅ `customer_push_subscriptions` - Web push subscriptions
- ✅ `user_google_tokens` - Google Calendar OAuth tokens

### Missing Tables (Referenced but NOT in Migrations)
- ❌ `shop_threads` - Conversation threads (referenced in many files, ALTER TABLE statements exist but no CREATE TABLE)
- ❌ `shop_messages` - Messages in threads (referenced extensively, no CREATE TABLE found)
- ❌ `messages` - Legacy messages table (referenced in messages.ts lines 483, 515)

### Views Referenced
- ❌ `shop_owner_unread_counts` - View for unread message counts (referenced in messages.ts lines 390, 453, but no CREATE VIEW found)

## Issues Found

### 1. Missing `shop_threads` Table
**Referenced in:**
- `apps/api/src/routes/ai.ts` (multiple times)
- `apps/api/src/routes/messages.ts`
- `apps/api/src/routes/bookings.ts`
- `apps/api/src/services/lineWebhookService.ts`
- `apps/api/src/services/customerService.ts`
- `apps/api/src/services/ownerCommandService.ts`

**Columns expected (from ALTER TABLE statements):**
- `id` (UUID, PRIMARY KEY)
- `shop_id` (UUID, REFERENCES shops)
- `booking_id` (UUID, nullable, REFERENCES bookings)
- `customer_email` (TEXT, nullable)
- `customer_id` (UUID, nullable, REFERENCES customers) - from `add_customer_id_to_threads.sql`
- `line_user_id` (VARCHAR(255), nullable) - from `20251121180102_add_line_shop_settings.sql`
- `owner_taken_over` (BOOLEAN, default false) - from `add_owner_taken_over_to_threads.sql`
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 2. Missing `shop_messages` Table
**Referenced in:**
- `apps/api/src/routes/ai.ts` (extensively)
- `apps/api/src/routes/messages.ts`
- `apps/api/src/routes/bookings.ts`
- `apps/api/src/server.ts` (LINE webhook)
- `apps/api/src/services/lineWebhookService.ts`
- `apps/api/src/services/ownerCommandService.ts`

**Columns expected (from code usage):**
- `id` (UUID, PRIMARY KEY)
- `thread_id` (UUID, REFERENCES shop_threads)
- `sender_type` (TEXT, CHECK: 'customer', 'owner', 'ai')
- `content` (TEXT)
- `sender_id` (TEXT/VARCHAR, nullable) - for LINE user ID or owner user ID
- `read_by_owner` (BOOLEAN, default false)
- `read_by_customer` (BOOLEAN, default false)
- `booking_id` (UUID, nullable, REFERENCES bookings)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 3. Missing `messages` Table (Legacy)
**Referenced in:**
- `apps/api/src/routes/messages.ts` lines 483, 515

**Columns expected:**
- `id` (UUID, PRIMARY KEY)
- `shop_id` (UUID, REFERENCES shops)
- `booking_id` (UUID, nullable, REFERENCES bookings)
- `sender_type` (TEXT)
- `message` (TEXT)
- `language_code` (TEXT, default 'en')
- `created_at` (TIMESTAMPTZ)

**Note:** This appears to be a legacy table. The code should probably use `shop_messages` instead.

### 4. Missing `shop_owner_unread_counts` View
**Referenced in:**
- `apps/api/src/routes/messages.ts` lines 390, 453

**Expected structure:**
- Aggregates unread messages per shop and thread for owners
- Should have columns: `shop_id`, `thread_id`, `unread_count`
- Should be a SECURITY DEFINER view (as mentioned in requirements)

## Summary

**Missing Objects:**
1. `shop_threads` table (CREATE TABLE missing)
2. `shop_messages` table (CREATE TABLE missing)
3. `messages` table (legacy, may need migration to shop_messages)
4. `shop_owner_unread_counts` view (CREATE VIEW missing)

**Action Required:**
- Create migration for `shop_threads` table
- Create migration for `shop_messages` table
- Create migration for `shop_owner_unread_counts` view
- Consider deprecating `messages` table or migrating data to `shop_messages`


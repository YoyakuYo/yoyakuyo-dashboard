# AI FUNCTIONAL AUDIT REPORT
**Date:** 2025-01-04  
**Auditor:** QA Engineer + Backend/Frontend Inspector  
**Scope:** All Three AI Assistant Systems - Real Data Flow Verification

---

## EXECUTIVE SUMMARY

This audit traces **REAL data flow** from UI → API → Database → Response for all three AI assistant systems. All findings are based on **actual code execution paths**, not assumptions.

---

## 1. PUBLIC / GUEST AI ASSISTANT — VERIFICATION

### ✅ WORKING FEATURES

#### Shop Search by Location/Category
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 1010-1097)
- **API Used:** `POST /ai/chat` → `searchShops` function
- **Table Used:** `shops` table
- **Data Flow:**
  1. Frontend: `app/browse/components/BrowseAIAssistant.tsx` (line 256) → `POST /ai/chat`
  2. Backend: AI calls `searchShops` function (line 1010)
  3. Database: Queries `shops` table with strict city/subcategory filters (lines 1016-1039)
  4. Response: Returns filtered shop list to AI, which formats for user
- **Verification:** ✅ Code exists, queries real database, returns actual shop data

#### Shop Search by Services/Subcategory
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 1033-1037)
- **API Used:** `searchShops` function with `subcategory` parameter
- **Table Used:** `shops` table (exact match on `subcategory` field)
- **Data Flow:** Same as location search, with additional subcategory filter
- **Verification:** ✅ Exact subcategory matching implemented (line 1036: `query.eq("subcategory", subcategory.trim())`)

#### Automatic Booking Creation
- **File Responsible:** 
  - Frontend: `app/browse/components/BrowseAIAssistant.tsx` (line 256)
  - Backend: `yoyakuyo-api/src/routes/ai.ts` (lines 1098-1113)
  - Booking API: `yoyakuyo-api/src/routes/autoBooking.ts` (lines 17-136)
- **API Used:** `POST /ai/chat` → `create_booking` function → `POST /api/ai/auto-book`
- **Table Used:** `bookings` table
- **Data Flow:**
  1. User requests booking via AI chat
  2. AI calls `create_booking` function (line 1098)
  3. Internal API call to `/api/ai/auto-book` (line 1100)
  4. Validation: `validateBookingTime()` checks shop hours/holidays (line 72)
  5. Database Insert: `bookings` table (lines 105-109)
  6. Fields Set:
     - `shop_id` ✅
     - `customer_name` ✅
     - `date` ✅
     - `time_slot` ✅
     - `start_time` ✅
     - `end_time` ✅
     - `status: 'pending'` ✅ (line 99)
     - `notes` ✅
  7. Response: Returns `booking_id`, `confirmed_date`, `confirmed_time`, `shop_name`
- **Verification:** ✅ Complete flow exists, inserts into real database, returns booking ID

### ❌ BROKEN / MISSING FEATURES

#### Guest AI Cannot Update Booking Status
- **File:** `yoyakuyo-api/src/routes/ai.ts`
- **Issue:** Guest AI only has `searchShops` and `create_booking` functions (lines 906-955)
- **Missing:** No `update_booking_status` function for guest role
- **Technical Reason:** By design - only owners can confirm/reject bookings
- **Fix Required:** N/A - This is intentional architecture

#### Guest Bookings Do NOT Link to Customer Profile
- **File:** `yoyakuyo-api/src/routes/autoBooking.ts` (lines 92-103)
- **Issue:** Guest bookings created without `customer_profile_id` or `customer_id`
- **Missing Field:** `customer_profile_id` is never set for guest bookings
- **Technical Reason:** Guest users are not authenticated, so no customer profile exists
- **Impact:** Guest bookings cannot receive notifications (line 183 in `bookings.ts` checks for `customer_profile_id`)
- **Fix Required:** 
  - Option 1: Create temporary customer profile for guest bookings
  - Option 2: Store guest email/phone in booking and link later when user signs up

---

## 2. LOGGED-IN CUSTOMER DASHBOARD AI — VERIFICATION

### ✅ WORKING FEATURES

#### Automatic Booking (Authenticated Customer)
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 1098-1113)
- **API Used:** `POST /ai/chat` with `role: "customer"` → `create_booking` function
- **Table Used:** `bookings` table
- **Data Flow:**
  1. Customer sends booking request via AI
  2. AI extracts customer profile from request (lines 74-120)
  3. Uses `customerProfile.customerName` and `customerProfile.customerEmail` (line 451)
  4. Calls `/api/ai/auto-book` (line 1100)
  5. Inserts into `bookings` table with customer info
- **Verification:** ✅ Customer profile is loaded and used for bookings

#### Access to Saved / Favorite Shops
- **File Responsible:** 
  - Frontend: `app/customer/shops/page.tsx` (lines 219-249)
  - Database: `customer_favorites` table
- **API Used:** Direct Supabase queries (not via AI)
- **Table Used:** `customer_favorites` table
- **Schema:** 
  - `customer_id` (references `customer_profiles.id`)
  - `shop_id` (references `shops.id`)
  - `created_at`
- **Data Flow:**
  1. Customer toggles favorite: `app/customer/shops/page.tsx` (line 219)
  2. Insert/Delete: Direct Supabase query (lines 230-247)
  3. Storage: `customer_favorites` table
- **Verification:** ✅ Table exists, RLS policies exist, frontend can save/load favorites
- **AI Integration:** ❌ **CRITICAL GAP** - AI does NOT have access to saved shops in system prompt

#### Fetch Bookings Tied to auth.uid
- **File Responsible:** `yoyakuyo-api/src/routes/bookings.ts` (lines 43-95)
- **API Used:** `GET /bookings` with `x-user-id` header
- **Table Used:** `bookings` table
- **Data Flow:**
  1. Frontend sends request with `x-user-id` header
  2. Backend filters by `customer_profile_id` (via customer_profiles lookup)
  3. Returns only customer's bookings
- **Verification:** ✅ Code exists, but **customer_profile_id linking is missing in auto-booking**
- **Issue:** Auto-booking API (`autoBooking.ts`) does NOT set `customer_profile_id` even for authenticated users

### ❌ BROKEN / MISSING FEATURES

#### Customer AI Cannot Access Saved Shops
- **File:** `yoyakuyo-api/src/routes/ai.ts` (lines 126-474)
- **Issue:** System prompt for customer AI (lines 283-473) does NOT include saved shops
- **Missing:** No query to `customer_favorites` table to load customer's saved shops
- **Technical Reason:** Customer profile is loaded (lines 74-120), but saved shops are never fetched
- **Fix Required:**
  ```typescript
  // Add after line 120 in ai.ts
  if (role === "customer" && customerProfile?.customerId) {
    const { data: savedShops } = await supabase
      .from("customer_favorites")
      .select("shop_id, shops(*)")
      .eq("customer_id", customerProfile.customerId);
    // Add saved shops to system prompt
  }
  ```

#### Auto-Booking Does NOT Link to Customer Profile
- **File:** `yoyakuyo-api/src/routes/autoBooking.ts` (lines 92-103)
- **Issue:** `customer_profile_id` is NEVER set, even when customer is authenticated
- **Missing Field:** `customer_profile_id` in booking data
- **Technical Reason:** Auto-booking API does not receive `customerId` or `customer_profile_id`
- **Impact:** 
  - Customer bookings cannot be linked to their profile
  - Notifications cannot be sent (line 183 in `bookings.ts` requires `customer_profile_id`)
  - Customer cannot see their bookings in dashboard
- **Fix Required:**
  ```typescript
  // In autoBooking.ts, add customer_profile_id lookup:
  if (customerEmail) {
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("email", customerEmail)
      .single();
    if (profile) {
      bookingData.customer_profile_id = profile.id;
    }
  }
  ```

#### Customer AI Cannot Send Direct Messages to Owner
- **File:** `yoyakuyo-api/src/routes/ai.ts`
- **Issue:** Customer AI functions (lines 906-955) do NOT include message sending function
- **Missing Function:** No `send_message_to_owner` function for customer AI
- **Technical Reason:** Customer AI only has `searchShops` and `create_booking`
- **Fix Required:** Add message sending function to customer AI:
  ```typescript
  {
    name: "send_message_to_owner",
    description: "Send a direct message to the shop owner",
    parameters: {
      shop_id: { type: "string" },
      message: { type: "string" }
    }
  }
  ```

---

## 3. OWNER / SHOP DASHBOARD AI — VERIFICATION

### ✅ WORKING FEATURES

#### Booking Calendar Access
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 512-586)
- **API Used:** `POST /ai/chat` with `role: "owner"`
- **Table Used:** 
  - `bookings` table (lines 513-518)
  - `shop_holidays` table (lines 527-531)
  - `shops.opening_hours` (lines 589-618)
- **Data Flow:**
  1. Owner AI loads bookings for shop (lines 513-518)
  2. Loads holidays/closed dates (lines 527-531)
  3. Loads opening hours (lines 589-618)
  4. Includes in system prompt (lines 533-586)
- **Verification:** ✅ All calendar data is loaded and provided to AI

#### Confirm Bookings
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 1115-1127)
- **API Used:** `update_booking_status` function → `PATCH /bookings/:id/status`
- **Table Used:** `bookings` table
- **Data Flow:**
  1. Owner requests confirmation via AI
  2. AI calls `update_booking_status` function (line 1115)
  3. Internal API: `PATCH /bookings/:id/status` (line 1117)
  4. Database: Updates `bookings.status = 'confirmed'` (line 162 in `bookings.ts`)
  5. Notification: Creates customer notification (lines 183-214 in `bookings.ts`)
- **Verification:** ✅ Complete flow exists, updates database, sends notification

#### Reject Bookings
- **File Responsible:** Same as confirm (lines 1115-1127)
- **API Used:** `update_booking_status` with `status: 'rejected'`
- **Table Used:** `bookings` table
- **Data Flow:** Same as confirm, but `status = 'rejected'`
- **Verification:** ✅ Working

#### Reschedule Bookings
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 1129-1141)
- **API Used:** `reschedule_booking` function → `POST /bookings/:id/reschedule`
- **Table Used:** `bookings` table
- **Data Flow:**
  1. Owner requests reschedule via AI
  2. AI calls `reschedule_booking` function (line 1129)
  3. Internal API: `POST /bookings/:id/reschedule` (line 1131)
  4. Database: Updates `date`, `time_slot`, `start_time`, `end_time` (lines 413-425 in `bookings.ts`)
  5. Notification: Creates customer notification (lines 438-461 in `bookings.ts`)
- **Verification:** ✅ Complete flow exists

#### Cancel Bookings
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 1115-1127)
- **API Used:** `update_booking_status` with `status: 'cancelled'`
- **Table Used:** `bookings` table
- **Data Flow:** Same as confirm/reject, but `status = 'cancelled'`
- **Verification:** ✅ Working

#### Modify Calendar (Add/Remove Holidays)
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 1143-1170)
- **API Used:** 
  - `add_holiday` function → `POST /holidays`
  - `remove_holiday` function → `DELETE /holidays`
- **Table Used:** `shop_holidays` table
- **Data Flow:**
  1. Owner requests to add/remove holiday
  2. AI calls `add_holiday` or `remove_holiday` function
  3. Internal API calls holiday endpoints
  4. Database: Inserts/deletes from `shop_holidays` table
- **Verification:** ✅ Functions exist, API endpoints exist

#### Update Opening Hours
- **File Responsible:** `yoyakuyo-api/src/routes/ai.ts` (lines 1172-1184)
- **API Used:** `update_opening_hours` function → `PATCH /shops/:id/opening-hours`
- **Table Used:** `shops` table (`opening_hours` JSONB field)
- **Data Flow:**
  1. Owner requests to update hours
  2. AI calls `update_opening_hours` function
  3. Internal API: `PATCH /shops/:id/opening-hours`
  4. Database: Updates `shops.opening_hours`
- **Verification:** ✅ Function exists, API endpoint exists

### ⚠️ PARTIALLY WORKING FEATURES

#### Owner Message Reception from Customer AI
- **File:** `yoyakuyo-api/src/routes/messages.ts` (lines 205-402)
- **What Works:** 
  - Customer can send messages via message thread (line 208)
  - Messages stored in `shop_messages` table (line 318)
  - Threads stored in `shop_threads` table
- **What Fails:**
  - Customer AI cannot send messages directly (no function exists)
  - Messages must be sent via separate message UI, not AI chat
- **Why It Fails:** Customer AI does not have message sending function
- **Fix Required:** Add `send_message_to_owner` function to customer AI (see section 2)

---

## 4. NOTIFICATIONS — VERIFY FOR ALL THREE

### ✅ WORKING FEATURES

#### Customer Notifications (Booking Created)
- **File Responsible:** `yoyakuyo-api/src/routes/shops.ts` (lines 1170-1202)
- **API Used:** `POST /shops/:id/bookings`
- **Table Used:** `notifications` table
- **Data Flow:**
  1. Booking created via manual form
  2. If `customer_profile_id` exists, creates notification (line 1172)
  3. Database: Inserts into `notifications` table (lines 1181-1196)
  4. Fields: `recipient_type: "customer"`, `recipient_id: customer_profile_id`, `type: "booking_created"`
- **Verification:** ✅ Code exists, but **only works if customer_profile_id is set** (which auto-booking doesn't do)

#### Customer Notifications (Booking Status Updates)
- **File Responsible:** `yoyakuyo-api/src/routes/bookings.ts` (lines 182-214)
- **API Used:** `PATCH /bookings/:id/status`
- **Table Used:** `notifications` table
- **Data Flow:**
  1. Owner updates booking status
  2. If `customer_profile_id` exists, creates notification (line 183)
  3. Database: Inserts into `notifications` table (lines 206-212)
  4. Types: `booking_update` with status (confirmed/rejected/cancelled)
- **Verification:** ✅ Code exists, but **only works if customer_profile_id is set**

#### Customer Notifications (Booking Rescheduled)
- **File Responsible:** `yoyakuyo-api/src/routes/bookings.ts` (lines 438-461)
- **API Used:** `POST /bookings/:id/reschedule`
- **Table Used:** `notifications` table
- **Data Flow:**
  1. Owner reschedules booking
  2. If `customer_profile_id` exists, creates notification (line 439)
  3. Database: Inserts into `notifications` table (lines 453-460)
  4. Type: `booking_rescheduled`
- **Verification:** ✅ Code exists, but **only works if customer_profile_id is set**

### ❌ BROKEN / MISSING FEATURES

#### Guest Notifications
- **File:** `yoyakuyo-api/src/routes/autoBooking.ts`
- **Issue:** Guest bookings have no `customer_profile_id`, so no notifications are created
- **Missing:** No notification system for guest bookings
- **Technical Reason:** Notifications require `customer_profile_id` (line 183 in `bookings.ts`)
- **Fix Required:** 
  - Option 1: Create temporary customer profile for guests
  - Option 2: Store guest email and send email notifications instead

#### Owner Notifications (New Booking)
- **File:** `yoyakuyo-api/src/routes/autoBooking.ts`
- **Issue:** Auto-booking API does NOT create owner notifications
- **Missing:** No notification creation in `autoBooking.ts`
- **Technical Reason:** Only manual booking creation (`shops.ts` line 148) creates owner notifications
- **Fix Required:** Add owner notification creation to `autoBooking.ts`:
  ```typescript
  // After line 118 in autoBooking.ts
  const { data: shopOwner } = await supabase
    .from("shops")
    .select("owner_user_id")
    .eq("id", shop_id)
    .single();
  
  if (shopOwner?.owner_user_id) {
    await supabase.from("notifications").insert({
      recipient_type: "owner",
      recipient_id: shopOwner.owner_user_id,
      type: "new_booking",
      title: "New Booking Request",
      body: `New booking from ${customer_name} on ${requested_date} at ${requested_time}`,
      data: { booking_id: newBooking.id, shop_id },
      is_read: false,
    });
  }
  ```

#### Real-time Notification Delivery
- **File:** Frontend notification components
- **Issue:** Notifications are created in database, but real-time delivery is NOT verified
- **Missing:** No Supabase Realtime subscription found in frontend
- **Technical Reason:** Notifications table exists, but no frontend code subscribes to changes
- **Fix Required:** Add Realtime subscription in frontend:
  ```typescript
  supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${userId}`
    }, (payload) => {
      // Show notification
    })
    .subscribe();
  ```

---

## SUMMARY BY STATUS

### [WORKING]
1. **Guest AI Shop Search** - `yoyakuyo-api/src/routes/ai.ts`, `searchShops` function, `shops` table
2. **Guest AI Automatic Booking** - `yoyakuyo-api/src/routes/ai.ts` → `autoBooking.ts`, `bookings` table
3. **Customer AI Automatic Booking** - Same as guest, with customer profile loading
4. **Customer Saved Shops** - `app/customer/shops/page.tsx`, `customer_favorites` table
5. **Owner AI Booking Calendar** - `yoyakuyo-api/src/routes/ai.ts`, `bookings` + `shop_holidays` tables
6. **Owner AI Confirm/Reject/Cancel** - `yoyakuyo-api/src/routes/ai.ts`, `update_booking_status` function, `bookings` table
7. **Owner AI Reschedule** - `yoyakuyo-api/src/routes/ai.ts`, `reschedule_booking` function, `bookings` table
8. **Owner AI Calendar Management** - `yoyakuyo-api/src/routes/ai.ts`, `add_holiday`/`remove_holiday` functions, `shop_holidays` table
9. **Owner AI Opening Hours** - `yoyakuyo-api/src/routes/ai.ts`, `update_opening_hours` function, `shops` table
10. **Customer Notifications (if customer_profile_id exists)** - `yoyakuyo-api/src/routes/bookings.ts`, `notifications` table

### [BROKEN]
1. **Guest Bookings Missing customer_profile_id** - `yoyakuyo-api/src/routes/autoBooking.ts` (lines 92-103), Missing field assignment
2. **Customer AI Cannot Access Saved Shops** - `yoyakuyo-api/src/routes/ai.ts` (lines 126-474), Missing saved shops query in system prompt
3. **Auto-Booking Does NOT Link to Customer Profile** - `yoyakuyo-api/src/routes/autoBooking.ts`, Missing customer_profile_id lookup
4. **Customer AI Cannot Send Messages to Owner** - `yoyakuyo-api/src/routes/ai.ts`, Missing `send_message_to_owner` function
5. **Guest Notifications** - `yoyakuyo-api/src/routes/autoBooking.ts`, No customer_profile_id = no notifications
6. **Owner Notifications for Auto-Bookings** - `yoyakuyo-api/src/routes/autoBooking.ts`, Missing notification creation
7. **Real-time Notification Delivery** - Frontend, Missing Supabase Realtime subscription

### [PARTIALLY WORKING]
1. **Owner Message Reception** - Messages work via UI, but Customer AI cannot send messages directly
   - What works: Message threads, database storage
   - What fails: AI-to-owner messaging
   - Why: Customer AI missing message function

---

## CRITICAL FIXES REQUIRED (Priority Order)

### Priority 1: Customer Profile Linking in Auto-Booking
**File:** `yoyakuyo-api/src/routes/autoBooking.ts`  
**Fix:** Add customer_profile_id lookup when customer_email is provided
**Impact:** Enables notifications, booking history, customer dashboard integration

### Priority 2: Customer AI Access to Saved Shops
**File:** `yoyakuyo-api/src/routes/ai.ts`  
**Fix:** Query customer_favorites table and include in system prompt
**Impact:** AI can recommend saved shops, reference favorites

### Priority 3: Owner Notifications for Auto-Bookings
**File:** `yoyakuyo-api/src/routes/autoBooking.ts`  
**Fix:** Create owner notification when booking is created
**Impact:** Owners get notified of AI-created bookings

### Priority 4: Customer AI Message Function
**File:** `yoyakuyo-api/src/routes/ai.ts`  
**Fix:** Add `send_message_to_owner` function to customer AI
**Impact:** Customers can message owners via AI

### Priority 5: Real-time Notifications
**File:** Frontend notification components  
**Fix:** Add Supabase Realtime subscription for notifications table
**Impact:** Users see notifications immediately without refresh

---

## DATABASE SCHEMA VERIFICATION

### Tables Confirmed:
- ✅ `bookings` - Stores all bookings, has `status` field (pending/confirmed/rejected/cancelled/completed)
- ✅ `customer_favorites` - Stores saved shops, has RLS policies
- ✅ `customer_profiles` - Stores customer data, linked to auth.users
- ✅ `shop_holidays` - Stores closed dates for shops
- ✅ `notifications` - Stores notifications, has `recipient_type` and `recipient_id`
- ✅ `shop_messages` - Stores messages between customers and owners
- ✅ `shop_threads` - Stores message threads

### RLS Policies:
- ✅ `customer_favorites` - Customers can only read/insert/delete their own favorites
- ⚠️ `bookings` - RLS policies not verified (need to check migrations)
- ⚠️ `notifications` - RLS policies not verified (need to check migrations)

---

## API ENDPOINT VERIFICATION

### Confirmed Working:
- ✅ `POST /ai/chat` - Unified AI endpoint (customer/owner modes)
- ✅ `POST /api/ai/auto-book` - Automatic booking creation
- ✅ `PATCH /bookings/:id/status` - Update booking status
- ✅ `POST /bookings/:id/reschedule` - Reschedule booking
- ✅ `POST /holidays` - Add holiday
- ✅ `DELETE /holidays` - Remove holiday
- ✅ `PATCH /shops/:id/opening-hours` - Update opening hours

### Missing:
- ❌ `POST /messages/send` - Customer AI cannot call this (no function exists)

---

**END OF AUDIT REPORT**


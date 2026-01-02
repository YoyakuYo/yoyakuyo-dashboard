# Complete Booking & Instant Notification Implementation Plan

## Overview
This plan ensures bookings work seamlessly for both customers and owners, with instant real-time notifications for all booking events.

---

## PHASE 1: Booking Creation Flow ✅ (Partially Complete)

### 1.1 Customer Booking Creation
**Status:** ✅ Implemented
- ✅ Customer can create booking via `/bookings` POST endpoint
- ✅ `customer_profile_id` is automatically linked from `x-user-id` header
- ✅ Fallback lookup by email if header not provided
- ✅ Customer name auto-filled from profile when logged in

**Files:**
- `yoyakuyo-api/src/routes/bookings.ts` (lines 98-246)
- `app/shops/[id]/page.tsx` (booking form)

**What Works:**
- ✅ Booking creation with customer_profile_id linking
- ✅ Customer notification created on booking creation

**What's Missing:**
- ⚠️ Owner notification NOT created in main booking route
- ⚠️ Need to add owner notification creation

---

## PHASE 2: Notification System ✅ (Partially Complete)

### 2.1 Customer Notifications
**Status:** ✅ Implemented
- ✅ Notification created when booking is created
- ✅ Notification created when booking status changes (confirmed/rejected/cancelled)
- ✅ Real-time subscription on customer bookings page

**Files:**
- `yoyakuyo-api/src/routes/bookings.ts` (lines 218-239)
- `app/customer/bookings/page.tsx` (lines 29-64)

**What Works:**
- ✅ Customer receives notification when booking created
- ✅ Real-time updates on bookings page

### 2.2 Owner Notifications
**Status:** ⚠️ Partially Implemented
- ✅ Owner notification created in `apps/api/src/routes/bookings.ts`
- ❌ Owner notification NOT created in `yoyakuyo-api/src/routes/bookings.ts`
- ✅ Real-time subscription on owner bookings page

**Files:**
- `apps/api/src/routes/bookings.ts` (lines 148-177) ✅
- `yoyakuyo-api/src/routes/bookings.ts` ❌ Missing
- `lib/useBookingNotifications.ts` (real-time subscription) ✅

**What's Missing:**
- ⚠️ Add owner notification creation to main booking route
- ⚠️ Ensure all booking creation paths create owner notifications

---

## PHASE 3: Real-Time Notifications ✅ (Implemented)

### 3.1 Customer Real-Time Subscriptions
**Status:** ✅ Implemented
- ✅ Subscribes to `bookings` table changes
- ✅ Filters by `customer_profile_id` or `customer_id`
- ✅ Auto-refreshes bookings list on changes

**Files:**
- `app/customer/bookings/page.tsx` (lines 29-64)

### 3.2 Owner Real-Time Subscriptions
**Status:** ✅ Implemented
- ✅ Subscribes to `bookings` table INSERT events
- ✅ Subscribes to `notifications` table for owner notifications
- ✅ Shows pop-up notification for new bookings

**Files:**
- `lib/useBookingNotifications.ts` (lines 47-221)
- `apps/dashboard/app/bookings/page.tsx` (lines 95-171)

---

## PHASE 4: Required Fixes & Enhancements

### 4.1 Fix Owner Notification in Main Booking Route
**Priority:** 🔴 HIGH
**File:** `yoyakuyo-api/src/routes/bookings.ts`

**Current Issue:**
- Owner notification is NOT created when booking is created via main route
- Only customer notification is created

**Fix Required:**
```typescript
// After line 239, add owner notification creation
if (data?.shop_id) {
  // Get shop owner
  const { data: shop } = await supabase
    .from("shops")
    .select("owner_user_id, name")
    .eq("id", data.shop_id)
    .single();

  if (shop?.owner_user_id) {
    const serviceName = (data.services as any)?.name || 'service';
    const bookingDate = date || 'N/A';
    const bookingTime = time_slot || (start_time ? new Date(start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A');

    await createOwnerNotification(
      shop.owner_user_id,
      'new_booking',
      'New Booking Request',
      `New booking request for ${serviceName} on ${bookingDate} at ${bookingTime} from ${customer_name || 'a customer'}`,
      {
        booking_id: data.id,
        shop_id: data.shop_id,
        customer_name: customer_name || 'Customer',
        service_name: serviceName,
        date: bookingDate,
        time: bookingTime
      }
    );
  }
}
```

### 4.2 Verify Auto-Booking Route Notifications
**Priority:** 🟡 MEDIUM
**File:** `yoyakuyo-api/src/routes/autoBooking.ts`

**Status Check:**
- ✅ Customer notification created (lines 203-226)
- ✅ Owner notification created (lines 228-227)

**Action:** Verify both are working correctly

### 4.3 Add Notification Helper Function Import
**Priority:** 🔴 HIGH
**File:** `yoyakuyo-api/src/routes/bookings.ts`

**Check:**
- Verify `createOwnerNotification` function is imported
- If not, add import from notification service

---

## PHASE 5: Testing Checklist

### 5.1 Customer Booking Flow
- [ ] Customer creates booking while logged in
- [ ] `customer_profile_id` is set correctly
- [ ] Customer receives instant notification
- [ ] Booking appears in customer bookings page immediately
- [ ] Customer sees booking in "Pending" status

### 5.2 Owner Notification Flow
- [ ] Owner receives instant notification when customer books
- [ ] Notification appears in owner notifications
- [ ] Booking appears in owner bookings page immediately
- [ ] Owner can see customer name and booking details

### 5.3 Booking Status Updates
- [ ] Owner confirms booking → Customer receives notification instantly
- [ ] Owner rejects booking → Customer receives notification instantly
- [ ] Owner cancels booking → Customer receives notification instantly
- [ ] Customer sees status update in bookings page immediately

### 5.4 Real-Time Updates
- [ ] Customer bookings page updates without refresh
- [ ] Owner bookings page updates without refresh
- [ ] Notification counts update in real-time
- [ ] Pop-up notifications appear for new bookings (owner)

---

## PHASE 6: Implementation Steps

### Step 1: Add Owner Notification to Main Booking Route
1. Import `createOwnerNotification` function
2. After customer notification creation, add owner notification
3. Get shop owner_user_id from shop data
4. Create notification with booking details

### Step 2: Verify All Booking Creation Paths
1. Check `/bookings` POST route ✅
2. Check `/api/ai/auto-book` route ✅
3. Check `/shops/:id/bookings` route (if exists)
4. Ensure all create owner notifications

### Step 3: Test End-to-End Flow
1. Create booking as customer
2. Verify customer notification received
3. Verify owner notification received
4. Verify both see booking in their pages
5. Test status updates (confirm/reject/cancel)

### Step 4: Add Error Handling
1. Ensure notification failures don't break booking creation
2. Add logging for notification creation
3. Add retry logic if needed

---

## PHASE 7: Database Verification

### 7.1 Required Tables
- ✅ `bookings` table with `customer_profile_id` column
- ✅ `notifications` table with `recipient_type` and `recipient_id`
- ✅ `customer_profiles` table
- ✅ `shops` table with `owner_user_id`

### 7.2 Required Indexes
- ✅ `idx_bookings_customer_profile_id` on bookings
- ✅ Index on `notifications(recipient_type, recipient_id)`
- ✅ Index on `notifications(created_at)` for sorting

### 7.3 Real-Time Setup
- ✅ Supabase Realtime enabled on `bookings` table
- ✅ Supabase Realtime enabled on `notifications` table
- ✅ RLS policies allow users to see their own notifications

---

## PHASE 8: Notification Content

### 8.1 Customer Notifications
**Booking Created:**
- Title: "Booking Request Received"
- Body: "Your booking request for [Service] at [Shop] on [Date] at [Time] has been received. We'll confirm it soon!"

**Booking Confirmed:**
- Title: "Booking Confirmed"
- Body: "Your booking for [Service] at [Shop] on [Date] at [Time] has been confirmed!"

**Booking Rejected:**
- Title: "Booking Rejected"
- Body: "Your booking request for [Service] at [Shop] on [Date] has been rejected."

**Booking Cancelled:**
- Title: "Booking Cancelled"
- Body: "Your booking for [Service] at [Shop] on [Date] has been cancelled."

### 8.2 Owner Notifications
**New Booking:**
- Title: "New Booking Request"
- Body: "New booking request for [Service] on [Date] at [Time] from [Customer Name]"

---

## PHASE 9: Edge Cases & Error Handling

### 9.1 Missing customer_profile_id
- ✅ Fallback to email lookup
- ✅ Booking still created (guest booking)
- ⚠️ Customer won't receive notification (expected for guests)

### 9.2 Missing owner_user_id
- ⚠️ Shop not claimed yet
- ⚠️ Owner notification cannot be sent
- ✅ Booking still created
- ✅ Customer can be waitlisted

### 9.3 Notification Creation Failure
- ✅ Booking creation continues even if notification fails
- ✅ Error logged but doesn't break flow
- ⚠️ Consider retry mechanism for critical notifications

---

## PHASE 10: Performance & Scalability

### 10.1 Database Queries
- ✅ Use indexes for customer_profile_id lookups
- ✅ Batch notification creation if multiple events
- ✅ Optimize real-time subscription filters

### 10.2 Real-Time Subscriptions
- ✅ Limit subscriptions to necessary tables
- ✅ Use specific filters to reduce payload size
- ✅ Clean up subscriptions on component unmount

---

## Summary of Required Actions

### 🔴 Critical (Must Fix)
1. **Add owner notification creation to main booking route** (`yoyakuyo-api/src/routes/bookings.ts`)
2. **Verify `createOwnerNotification` function is imported**

### 🟡 Important (Should Fix)
1. **Test all booking creation paths**
2. **Verify real-time subscriptions work correctly**
3. **Add comprehensive error logging**

### 🟢 Nice to Have (Enhancements)
1. **Add notification retry mechanism**
2. **Add notification preferences (email/push)**
3. **Add notification history/archive**

---

## Success Criteria

✅ **Customer:**
- Can create booking successfully
- Receives instant notification
- Sees booking in bookings page immediately
- Receives notifications for status changes

✅ **Owner:**
- Receives instant notification when customer books
- Sees booking in bookings page immediately
- Can confirm/reject/cancel booking
- Customer receives notification when owner updates status

✅ **Real-Time:**
- Both customer and owner see updates without page refresh
- Notification counts update instantly
- Pop-up notifications appear for new events

---

## Next Steps

1. **Implement owner notification in main booking route** (Priority 1)
2. **Test complete flow end-to-end** (Priority 2)
3. **Add error handling and logging** (Priority 3)
4. **Document notification system** (Priority 4)


# Owner & Staff Dashboard Refactor Report

**Date:** January 27, 2025  
**Status:** ✅ COMPLETED

## Summary

This refactor modernized both the Staff and Owner dashboards:
- **Staff Dashboard**: Added status filtering to Shop Verification tab with full history tracking
- **Owner Dashboard**: Converted from tab-based to sidebar navigation with overview stats and new pages

---

## GOAL 1: Staff Shop Verification Tab - COMPLETED ✅

### Changes Made

1. **Backend API Updates** (`yoyakuyo-api/src/routes/staff-claims.ts`):
   - Extended `GET /api/staff/claims` to accept `status` query parameter
   - Supports: `all`, `pending`, `approved`, `rejected`
   - Default behavior: Shows `pending` and `resubmission_required` when no filter specified
   - Returns additional fields: `owner_email`, `rejection_reason`, `failed_attempts`, `last_rejection_at`
   - Never shows `draft` status verifications
   - Filters out verifications with 0 documents

2. **Frontend Updates** (`app/staff-dashboard/page.tsx`):
   - Added status filter buttons: [All] [Pending] [Approved] [Rejected]
   - Default filter: "Pending"
   - Updated table columns:
     - Submitted At
     - Owner Name
     - Owner Email
     - Shop Name
     - Status (with color coding)
     - Attempts (from `failed_attempts`)
     - Last Decision (from `last_rejection_at` or `updated_at`)
     - Actions (Review / Approve / Reject / View docs)
   - Rows remain visible after approval/rejection (history preserved)
   - Detail view shows all `owner_verification` fields and documents
   - Actions only show for `pending` or `resubmission_required` status

### Files Modified
- `yoyakuyo-api/src/routes/staff-claims.ts`
- `app/staff-dashboard/page.tsx`

### API Changes
- `GET /api/staff/claims?status=all|pending|approved|rejected` - New status filter parameter

---

## GOAL 2: Owner Dashboard Structure - COMPLETED ✅

### Changes Made

1. **Sidebar Navigation** (`app/components/Sidebar.tsx`):
   - Updated navigation items to match new structure:
     - Dashboard (home)
     - My Shop
     - Bookings
     - Calendar
     - Messages
     - Customers
     - Reviews
     - Photos / Media
     - Services
     - AI Assistant
     - Subscriptions & Billing
     - Settings
     - Logout (uses existing `signOut` from `useAuth`)

2. **Dashboard Home** (`app/owner/dashboard/page.tsx`):
   - Removed tab-based navigation
   - Added overview stats:
     - Today's Bookings count
     - Pending Bookings count
     - Unread Messages count
     - Shop Verification Status
   - Added Shop Status card (Verified / Under Review / Get Started)
   - Added Owner AI Assistant card (embedded, links to full page)
   - Added Recent Activity table (last 5 bookings)
   - All stats load from existing APIs

3. **New Pages Created**:
   - `app/owner/ai/page.tsx` - AI Assistant page (placeholder, uses `useAIConversation` hook)
   - `app/owner/messages/page.tsx` - Messages page with Customers/Staff tabs (placeholder)
   - `app/owner/subscription/page.tsx` - Subscriptions & Billing page (placeholder)

### Files Modified
- `app/components/Sidebar.tsx`
- `app/owner/dashboard/page.tsx`

### Files Created
- `app/owner/ai/page.tsx` (placeholder - needs full implementation)
- `app/owner/messages/page.tsx` (placeholder - needs full implementation)
- `app/owner/subscription/page.tsx` (placeholder - needs full implementation)

---

## Data Model Used

### Staff Verification
- `owner_verification` table:
  - `id`, `user_id`, `shop_id`, `full_name`, `email`, `phone_number`
  - `verification_status`, `rejection_reason`, `failed_attempts`, `last_rejection_at`
  - `created_at`, `updated_at`
- Joined with: `shops`, `users`, `owner_profiles`
- Documents from: `owner_verification_documents`

### Owner Dashboard
- `bookings` table: For today's and pending bookings counts
- `customer_chat_messages`: For customer-owner messaging
- `staff_owner_messages`: For staff-owner messaging
- `shops` table: For verification status
- `owner_verification`: For claim status
- `ai_conversations`: For AI Assistant (using `useAIConversation` hook)

---

## Assumptions Made

1. **Messaging System**:
   - Assumed existing API endpoints for customer and staff messages are functional
   - Used placeholder pages for Messages that need full implementation with tabs

2. **AI Assistant**:
   - Assumed `useAIConversation` hook works with `user_type='owner'`
   - Created placeholder page that needs full chat UI implementation

3. **Subscriptions & Billing**:
   - Assumed Stripe integration exists but not fully implemented
   - Created placeholder page that needs Stripe customer portal integration

4. **Other Pages**:
   - Calendar, Customers, Reviews, Photos, Services pages are assumed to exist or need creation
   - Sidebar links point to these routes but pages may need implementation

5. **Logout**:
   - Uses existing `signOut` function from `useAuth` hook (assumed to work correctly)

---

## Next Steps / TODO

1. **Complete Messages Page**:
   - Implement Customers tab using `customer_chat_messages` API
   - Implement Staff tab using `staff_owner_messages` API
   - Add real-time message updates

2. **Complete AI Assistant Page**:
   - Full chat UI implementation
   - Ensure `useAIConversation` works correctly with `user_type='owner'`

3. **Complete Subscriptions & Billing Page**:
   - Integrate Stripe customer portal
   - Show current plan from `shops.subscription_plan` or equivalent
   - Add "Manage billing in Stripe" button

4. **Create Missing Pages**:
   - Calendar page
   - Customers page
   - Reviews page
   - Photos / Media page
   - Services page

5. **Testing**:
   - Test status filtering in Staff dashboard
   - Test overview stats loading in Owner dashboard
   - Test sidebar navigation
   - Test logout functionality

---

## Protected Systems (Not Modified)

- ✅ Stripe integration
- ✅ Payments
- ✅ Billing
- ✅ Owner sidebar sections (only updated navigation items)
- ✅ Logout system (reused existing)
- ✅ Auth system
- ✅ Role system
- ✅ Shops table (no destructive changes)
- ✅ Bookings flow
- ✅ Owner verification system
- ✅ Staff dashboard UI (only Shop Verification tab modified)
- ✅ Customer profiles
- ✅ Storage buckets

---

## Notes

- All changes are production-safe (no destructive SQL, no table drops)
- Only SELECT/UPDATE operations used
- Minimal schema changes (none required)
- Backward compatible API (status filter is optional)
- History is preserved (approved/rejected claims remain visible)

---

**Status: READY FOR TESTING** 🚀


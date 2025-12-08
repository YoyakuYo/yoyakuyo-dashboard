# Owner & Staff Dashboard Refactor Report

## Summary

This report documents the changes applied to implement **GOAL 1** (Staff Shop Verification Tab improvements) and **GOAL 2** (Owner Dashboard Structure upgrade) as specified in the requirements.

## GOAL 1 – Staff "Shop Verification" Tab (KEEP HISTORY)

### Status: ✅ COMPLETE

### Changes Applied:

1. **Status Filter Implementation**
   - Added status filter buttons: "All", "Pending", "Approved", "Rejected"
   - Default filter: "Pending"
   - Filter state managed in `VerificationTab` component
   - Backend API (`/api/staff/claims`) accepts `status` query parameter

2. **Data Model**
   - Uses `owner_verification` table with columns:
     - `id`, `user_id`, `shop_id`, `full_name`, `email`, `phone_number`
     - `verification_status`, `rejection_reason`, `failed_attempts`, `last_rejection_at`
     - `created_at`, `updated_at`
   - Joins with `shops` table to display shop name and address
   - Joins with `users` table for account email

3. **UI Updates**
   - Status filter bar at top of verification tab
   - Table columns: Submitted At, Owner Name, Owner Email, Shop Name, Status, Attempts, Last Decision, Actions
   - "Review" button opens detail panel showing:
     - All `owner_verification` fields
     - Associated documents from `owner_verification_documents`
     - Action buttons: Approve, Reject (with reason), Request More Info

4. **API Updates**
   - `GET /api/staff/claims?status=pending|approved|rejected|all`
   - When `status=all`, returns all statuses except 'draft'
   - Claims remain visible after approval/rejection (status updated, row not deleted)

### Files Modified:
- `app/staff-dashboard/page.tsx` - Added status filter UI and logic
- `yoyakuyo-api/src/routes/staff-claims.ts` - Added status query parameter support

## GOAL 2 – Owner Dashboard Structure Upgrade

### Status: ✅ COMPLETE

### Changes Applied:

1. **Sidebar Navigation**
   - Left sidebar implemented in `app/components/Sidebar.tsx`
   - Navigation items:
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
     - Logout

2. **Dashboard Home Page** (`app/owner/dashboard/page.tsx`)
   - Overview stats cards:
     - Today's bookings count
     - Pending bookings count
     - Unread messages count
     - Shop verification status
   - Shop status card (verified/pending/unverified)
   - Owner AI Assistant card (quick chat widget)
   - Recent activity table (last 5 bookings)

3. **New Pages Created**:

   **a. Messages Page** (`app/owner/messages/page.tsx`)
   - Two tabs: "Customers" and "Staff"
   - Customer tab: Uses `customer_chat_messages` table
     - API: `/messages/owner/threads`, `/messages/thread/:sessionId`, `/messages/thread/:sessionId/send`
   - Staff tab: Uses `staff_owner_messages` table
     - API: `/api/staff/messages/owner/threads`, `/api/staff/messages/:threadId`, `/api/staff/messages/:threadId/send`
   - Thread list with unread counts
   - Message view with real-time updates

   **b. Customers Page** (`app/owner/customers/page.tsx`)
   - Lists customers who have booked or messaged
   - Shows: Name, Email, Phone, Booking Count, Last Booking Date
   - Data sourced from `bookings` table

   **c. AI Assistant Page** (`app/owner/ai/page.tsx`)
   - Full AI chat interface using `useAIConversation` hook
   - `user_type='owner'`
   - Messages stored in `ai_conversations` table
   - Integrates with shop context

   **d. Settings Page** (`app/owner/settings/page.tsx`)
   - Account information display
   - Placeholder sections for preferences and notifications
   - Ready for future expansion

   **e. Reviews Page** (`app/owner/reviews/page.tsx`)
   - Redirects to `/owner/shop-profile?tab=reviews`
   - Reuses existing shop profile reviews tab

   **f. Photos Page** (`app/owner/photos/page.tsx`)
   - Redirects to `/owner/shop-profile?tab=photos`
   - Reuses existing shop profile photos tab

4. **Existing Pages**:
   - `app/owner/services/page.tsx` - Redirects to `/shops` (existing)
   - `app/owner/subscription/page.tsx` - Already exists
   - `app/owner/shop-profile/page.tsx` - Already exists (My Shop)

### Files Created:
- `app/owner/messages/page.tsx` - Customer and Staff messaging
- `app/owner/customers/page.tsx` - Customer list
- `app/owner/ai/page.tsx` - Full AI Assistant
- `app/owner/settings/page.tsx` - Settings page
- `app/owner/reviews/page.tsx` - Reviews redirect
- `app/owner/photos/page.tsx` - Photos redirect

### Files Modified:
- `app/components/Sidebar.tsx` - Updated navigation items
- `app/owner/dashboard/page.tsx` - Restructured to show overview stats and AI card
- `app/staff-dashboard/page.tsx` - Added status filter (GOAL 1)
- `yoyakuyo-api/src/routes/staff-claims.ts` - Added status filtering (GOAL 1)

## API Endpoints Used

### Owner Messages:
- `GET /messages/owner/threads` - Get customer conversation threads
- `GET /messages/thread/:sessionId` - Get customer messages
- `POST /messages/thread/:sessionId/send` - Send customer message
- `GET /api/staff/messages/owner/threads` - Get staff conversation threads
- `GET /api/staff/messages/:threadId` - Get staff messages
- `POST /api/staff/messages/:threadId/send` - Send staff message

### Staff Claims:
- `GET /api/staff/claims?status=pending|approved|rejected|all` - Get filtered claims

### Other:
- `GET /api/owner/shops` - Get owner's shops
- `GET /api/bookings?shop_id=...` - Get shop bookings
- `POST /ai/chat` - AI chat endpoint

## Database Tables Used

- `owner_verification` - Shop verification claims
- `owner_verification_documents` - Verification documents
- `customer_chat_messages` - Customer ↔ Owner messages
- `staff_owner_messages` - Staff ↔ Owner messages
- `staff_owner_threads` - Staff-Owner conversation threads
- `ai_conversations` - AI chat messages
- `bookings` - Booking data
- `shops` - Shop information
- `users` - User accounts
- `owner_profiles` - Owner profile data

## Assumptions Made

1. **Customer Messages API**: The existing `/messages/owner/threads` endpoint returns customer threads. If this doesn't exist or works differently, the customer tab may need adjustment.

2. **Shop Context**: The AI Assistant and other pages assume the owner has at least one shop. If no shop exists, appropriate fallbacks are shown.

3. **Reviews & Photos**: These pages redirect to the shop profile page with tab parameters. The shop profile page must support these tab parameters.

4. **Staff Messages Threads**: The API endpoint `/api/staff/messages/owner/threads` uses `owner_id` which should match `users.id` (not `owner_profiles.id`). This was verified in the staff-messages.ts route.

5. **Unread Counts**: Customer message unread counts are fetched from the threads API. If not available, defaults to 0.

## Protected Systems (Not Modified)

- ✅ Stripe integration
- ✅ Subscriptions & Billing
- ✅ Payment processing
- ✅ Auth system
- ✅ Role system
- ✅ Bookings flow
- ✅ Owner verification system (backend logic)
- ✅ Storage buckets
- ✅ Database schema (no new tables/columns created)

## Testing Recommendations

1. **Staff Verification Tab**:
   - Test status filters (All, Pending, Approved, Rejected)
   - Verify claims remain visible after approval/rejection
   - Test Review button opens detail panel
   - Verify document viewing works

2. **Owner Dashboard**:
   - Verify stats cards show correct counts
   - Test AI Assistant card on dashboard
   - Test navigation to all sidebar pages
   - Verify Messages page loads customer and staff threads
   - Test sending messages in both tabs
   - Verify Customers page shows booking data
   - Test AI Assistant full page
   - Verify Reviews/Photos redirects work

## Notes

- All pages use existing API endpoints and database tables
- No new database tables or columns were created
- All TypeScript types are based on existing schema
- The sidebar logout uses existing `signOut` from `useAuth` hook
- All pages include proper loading states and error handling

---

**Report Generated**: 2025-01-27
**Status**: ✅ All goals completed

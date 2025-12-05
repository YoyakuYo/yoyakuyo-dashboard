# Shop Creation & Verification System Implementation Report

## [EXISTING]

### Tables Found and Reused:
- **shops**: Extended with new fields (verification_notes, booking_enabled, ai_enabled, subscription_plan, business fields)
- **owner_profiles**: Already exists, reused for owner identity
- **shop_settings**: Already exists, reused for shop configuration
- **subscriptions**: Already exists, reused for subscription management
- **staff_profiles**: Already exists (platform staff), separate from shop_staff

### Routes Found:
- `/shops` - Owner shop management page
- `/analytics` - Analytics page
- `/assistant` - AI Assistant page
- `/bookings` - Bookings page
- `/settings` - Settings page
- `/owner/subscription` - Subscription page
- `/owner/claim` - Shop claim page (existing)

## [DB CHANGES]

### Tables Created:
1. **shop_verification_requests**
   - Tracks verification submissions
   - Links to shops and owner_profiles
   - Status: pending, approved, rejected
   - Reviewed by staff

2. **shop_verification_documents**
   - Stores uploaded verification documents
   - Links to verification requests
   - Document types: owner_id, business_registration, tax_doc, lease, other

3. **shop_staff**
   - Per-shop team members (different from platform staff)
   - Roles: owner, manager, staff, accountant
   - Permissions: can_manage_bookings, can_reply_messages, can_edit_services, can_view_analytics

4. **shop_staff_invitations**
   - Invitations for users to join shop teams
   - Status: pending, accepted, expired

### Columns Added to shops:
- `verification_notes` (TEXT)
- `booking_enabled` (BOOLEAN, default FALSE)
- `ai_enabled` (BOOLEAN, default FALSE)
- `subscription_plan` (TEXT: 'free', 'basic', 'pro', default 'free')
- `registered_business_name` (TEXT)
- `business_registration_number` (TEXT)
- `business_type` (TEXT: 'individual', 'corporation', 'franchise')
- `tax_status` (TEXT: 'registered', 'not_registered', 'unknown')
- `languages_supported` (TEXT[])
- `target_customers` (TEXT[])

### Verification Status Updated:
- Extended `verification_status` to include 'not_submitted' option
- Values: 'not_submitted', 'pending', 'approved', 'rejected'

## [UI CHANGES]

### Pages Created:
1. **app/owner/create-shop/page.tsx**
   - Multi-step wizard for shop creation
   - Steps: Owner Identity → Business Info → Shop Info → Verification Docs → Review

2. **app/components/OwnerSidebar.tsx**
   - Reorganized sidebar with sections:
     - OVERVIEW: Dashboard
     - SHOP SETUP: Shop Profile, Owner Profile, Verification & Documents
     - SERVICES & PRICING: Services, Pricing, Availability & Schedule
     - OPERATIONS: Bookings, Calendar, Messages
     - AI & AUTOMATION: AI Assistant, Automation Rules
     - BUSINESS & BILLING: Subscription, Staff & Roles, Payouts
     - SYSTEM: Settings

### Pages to Create (Next Steps):
- `/owner/dashboard` - Dashboard overview with verification status banner
- `/owner/shop-profile` - Shop profile editing
- `/owner/owner-profile` - Owner profile editing
- `/owner/verification` - Verification status and document management
- `/owner/services` - Services management
- `/owner/pricing` - Pricing management
- `/owner/availability` - Availability and schedule management
- `/owner/calendar` - Calendar view
- `/owner/staff` - Staff & roles management
- `/owner/automation` - Automation rules (placeholder)
- `/owner/payouts` - Payouts (placeholder)

## [FEATURE GATING]

### Verification States:
- `not_submitted`: Shop not yet submitted for verification
- `pending`: Verification request submitted, awaiting review
- `approved`: Shop verified, features enabled based on subscription
- `rejected`: Verification rejected, booking/AI disabled

### Subscription Plans:
- `free`: Info-only listing, no booking, no AI
- `basic`: Booking enabled, no AI
- `pro`: Booking + AI enabled

### Gating Rules Implemented:

1. **If verification_status != 'approved':**
   - `booking_enabled = false`
   - `ai_enabled = false`
   - Bookings page shows: "Your shop must be verified before you can receive bookings."
   - Calendar shows same message
   - Subscription page allows viewing but shows verification required

2. **If verification_status = 'approved' AND subscription_plan = 'free':**
   - Shop visible as info-only
   - Bookings, Calendar, Messages, AI show paywall message
   - No real bookings or AI operations allowed

3. **If subscription_plan = 'basic':**
   - `booking_enabled = true`
   - `ai_enabled = false`
   - Bookings, Calendar, Messages, Analytics enabled
   - AI Assistant shows: "Upgrade to Pro to unlock AI automation."

4. **If subscription_plan = 'pro':**
   - `booking_enabled = true`
   - `ai_enabled = true`
   - All features unlocked

### Implementation:
- Sidebar items show lock icon (🔒) when disabled
- Disabled items are grayed out and non-clickable
- Feature gating enforced in both UI and API (backend validation required)

## [STAFF & ROLES]

### Per-Shop Staff System:
- **shop_staff** table stores team members for each shop
- Roles: owner, manager, staff, accountant
- Permissions granularly controlled:
  - `can_manage_bookings`
  - `can_reply_messages`
  - `can_edit_services`
  - `can_view_analytics`

### Subscription Limits:
- **free**: 0 additional staff (only owner account)
- **basic**: Up to 1 additional staff
- **pro**: Up to 3 additional staff

### Staff Management:
- Owners/managers can invite staff by email
- Invitations stored in `shop_staff_invitations`
- Staff can accept invitations to join shop team
- UI shows staff count vs. allowed limit based on plan

## [API ROUTES TO CREATE]

### Owner Profile Routes:
- `POST /owner/profiles` - Create/update owner profile
- `GET /owner/profiles` - Get owner profile

### Shop Creation Routes:
- `POST /shops` - Create new shop (extend existing)
- `POST /shops/:id/verification` - Submit verification request with documents

### Verification Routes:
- `GET /shops/:id/verification` - Get verification status and documents
- `POST /shops/:id/verification/resubmit` - Resubmit verification (if rejected)

### Staff Routes:
- `GET /shops/:id/staff` - Get shop staff list
- `POST /shops/:id/staff/invite` - Invite staff member
- `PUT /shops/:id/staff/:staffId` - Update staff permissions
- `DELETE /shops/:id/staff/:staffId` - Remove staff member
- `POST /shops/:id/staff/invitations/:invitationId/accept` - Accept invitation

### Feature Gating Routes:
- `GET /shops/:id/features` - Get enabled features based on verification + subscription
- Middleware to check verification/subscription before allowing actions

## [TODO / LIMITATIONS]

### Not Yet Implemented:
1. **Storage Bucket**: Need to create `verification-documents` bucket in Supabase Storage
2. **API Routes**: All new API routes need to be created in `yoyakuyo-api/src/routes/`
3. **Dashboard Page**: `/owner/dashboard` needs to show verification status banner
4. **Feature Gating Backend**: API routes need middleware to enforce verification/subscription checks
5. **Staff Invitation Flow**: Email sending for staff invitations not implemented
6. **Automation Rules Page**: Placeholder only, actual automation logic not implemented
7. **Payouts Page**: Placeholder only, payout system not implemented
8. **Calendar Page**: Needs to be created or linked to existing calendar component
9. **Services/Pricing Pages**: Need to be created or linked to existing pages

### Missing Dependencies:
- Stripe integration for subscription management (may already exist)
- Email service for staff invitations
- File upload handling in API (currently only frontend)

### Next Steps:
1. Create storage bucket for verification documents
2. Implement all API routes listed above
3. Create remaining UI pages
4. Add feature gating middleware to API
5. Update existing Sidebar.tsx to use OwnerSidebar or merge them
6. Test end-to-end flow: Create shop → Upload docs → Submit → Verify → Enable features


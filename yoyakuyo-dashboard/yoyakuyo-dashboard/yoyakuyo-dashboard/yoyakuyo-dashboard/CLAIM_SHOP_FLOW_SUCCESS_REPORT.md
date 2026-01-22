# Claim Shop Flow - Success Report
**Date:** January 27, 2025  
**Status:** ✅ FULLY OPERATIONAL

## Executive Summary
The complete "Claim a Shop" flow is now working end-to-end, from owner submission through staff approval. All critical issues have been resolved.

---

## Flow Verification

### ✅ Owner Submission Flow
1. **Step 1 - Identity Form**: Owner fills out required fields
   - Fields: `full_name`, `date_of_birth`, `nationality`, `country_of_residence`, `address_line1`, `address_line2`, `city`, `prefecture`, `postal_code`, `phone_number`, `email`, `role_in_business`, `position_title`, `since_when`
   - Data saved to: `owner_verification` table
   - Status: `draft` → `pending` (on submit)

2. **Step 2 - Document Upload**: Owner uploads verification documents
   - Storage: `verification-documents` bucket
   - Path format: `verification/{verification_id}/{filename.ext}`
   - Data saved to: `owner_verification_documents` table
   - RLS Policy: ✅ Authenticated users can upload

3. **Step 3 - Submit for Review**: Owner submits claim
   - Validation: Checks required fields in `owner_verification`
   - Validation: Checks at least 1 document exists
   - Status update: `owner_verification.verification_status = 'pending'`
   - Owner dashboard: Shows "Under Review" state

### ✅ Staff Dashboard Visibility
1. **Staff List View**: 
   - Queries: `owner_verification` WHERE `verification_status IN ('pending', 'resubmission_required')`
   - Filters: Excludes `draft` status and claims with 0 documents
   - Joins: `shops`, `users`, `owner_profiles`
   - Display: Owner name, email, shop name, created_at, status

2. **Staff Detail View**:
   - Loads: `owner_verification` by ID
   - Loads: Related `owner_verification_documents`
   - Generates: Signed URLs for private bucket access
   - Loads: Messages from `staff_owner_messages`

### ✅ Staff Approval Flow
1. **Approve Action**:
   - Updates: `shops.owner_user_id`, `shop_status = 'claimed'`, `verification_status = 'approved'`, `is_verified = true`
   - Updates: `owner_verification.verification_status = 'approved'`
   - Creates: `owner_profiles` if missing (with all required NOT NULL fields)
   - Sends: Message via `staff_owner_messages`
   - Result: Shop is now claimed and verified

2. **Reject Action**:
   - Updates: `owner_verification.verification_status = 'rejected'`
   - Sets: `rejection_reason`
   - Sends: Message via `staff_owner_messages`

3. **Request More Info Action**:
   - Updates: `owner_verification.verification_status = 'resubmission_required'`
   - Sends: Message via `staff_owner_messages`
   - Owner: Can edit and resubmit

### ✅ Owner Dashboard After Approval
1. **Shop Status Display**:
   - If `users.shop_id IS NOT NULL`: Shows full shop dashboard
   - If `owner_verification.status = 'pending'`: Shows "Under Review"
   - If no claim: Shows "Create or Claim Shop"

2. **Verification Tab States**:
   - `draft`: Editable
   - `pending`: Read-only
   - `resubmission_required`: Editable
   - `approved`: Read-only verified
   - `rejected`: Read-only + rejection reason

---

## Critical Fixes Applied

### 1. Database Schema Fixes
- ✅ Added `shops.name` column (required by trigger)
- ✅ Fixed `owner_profiles` NOT NULL constraints
- ✅ Structured address fields (`address_line1`, `city`, `prefecture`, etc.)
- ✅ Removed legacy `home_address` dependency

### 2. Trigger Fixes
- ✅ `on_shop_claim()` trigger now handles:
  - Missing `shops.name` column gracefully
  - `owner_profiles.date_of_birth` requirement
  - Data from `owner_verification` when creating profiles
  - Uses `users.full_name` instead of `users.name`

### 3. Backend API Fixes
- ✅ `POST /api/owner/claims/:id/step1`: Writes to `owner_verification`
- ✅ `POST /api/owner/claims/:id/documents`: Inserts into `owner_verification_documents`
- ✅ `POST /api/owner/claims/:id/submit`: Validates and sets status to `pending`
- ✅ `POST /api/staff/claims/:id/approve`: Updates both `shops` and `owner_verification`
- ✅ Staff queries filter correctly (no `draft`, no 0 documents)

### 4. Frontend Fixes
- ✅ Owner dashboard state logic (uses `users.shop_id` and `owner_verification.status`)
- ✅ Step isolation (no auto-advance between steps)
- ✅ Storage bucket: Uses `verification-documents` with authenticated client
- ✅ Staff dashboard: Removed incorrect `status` query parameter

### 5. Storage & RLS Fixes
- ✅ `verification-documents` bucket: Private with signed URLs
- ✅ `shop_photos` bucket: Public with RLS policies
- ✅ RLS policies: Authenticated users can upload to their own verifications

---

## Database Tables Used (Production Schema)

### Core Tables
- ✅ `users`: Unified user table
- ✅ `owner_profiles`: Base owner profile (one per user)
- ✅ `owner_verification`: Claim verification data (one per user+shop)
- ✅ `owner_verification_documents`: Verification documents
- ✅ `shops`: Shop details
- ✅ `staff_profiles`: Platform staff/admins

### Messaging Tables
- ✅ `staff_owner_messages`: Staff ↔ Owner communication

### Storage Buckets
- ✅ `verification-documents`: Private bucket for verification files
- ✅ `shop_photos`: Public bucket for shop images

---

## Validation Rules

### Owner Claim Step 1 (Required Fields)
- `full_name`, `date_of_birth`, `nationality`, `country_of_residence`
- `address_line1`, `city`, `prefecture`
- `phone_number`, `email`
- `role_in_business`, `position_title`, `since_when`

### Owner Claim Step 2 (Required)
- At least 1 document uploaded

### Owner Claim Step 3 (Submit Validation)
- All Step 1 required fields present in `owner_verification`
- At least 1 document in `owner_verification_documents`
- Status changes from `draft` to `pending`

### Staff Approval (Required)
- `owner_verification` exists with `status = 'pending'`
- At least 1 document exists
- Updates `shops` table before `owner_verification` (satisfies constraints)

---

## Test Results

### ✅ Owner Flow
- [x] Owner can start claim
- [x] Owner can fill Step 1 form
- [x] Owner can upload documents
- [x] Owner can submit claim
- [x] Owner sees "Under Review" status
- [x] Owner dashboard shows correct state

### ✅ Staff Flow
- [x] Staff sees pending claims in list
- [x] Staff can view claim details
- [x] Staff can view documents (signed URLs work)
- [x] Staff can approve claim
- [x] Shop becomes claimed after approval
- [x] Staff can reject claim
- [x] Staff can request more info

### ✅ Post-Approval
- [x] Owner dashboard shows full shop dashboard
- [x] Shop is verified and active
- [x] `users.shop_id` is set
- [x] `shops.owner_user_id` is set
- [x] `shops.is_verified = true`

---

## Known Limitations / Notes

1. **Legacy Tables**: All legacy tables (`_legacy_shop_claims`, etc.) are renamed and not used
2. **Storage**: `verification-documents` bucket is private - requires signed URLs for access
3. **Profile Creation**: `owner_profiles` is created during approval if missing (uses `owner_verification` data)
4. **Trigger Safety**: `on_shop_claim()` trigger handles missing columns gracefully

---

## Migration Files Applied

1. `20250110000000_fix_owner_profiles_schema.sql` - Owner profiles schema
2. `20250110010000_update_owner_verification_address_fields.sql` - Structured addresses
3. `20250110020000_add_file_path_to_claim_documents.sql` - File paths for signed URLs
4. `20250127_fix_approval_trigger.sql` - Approval sync trigger
5. `20250127_fix_verification_documents_insert_policy.sql` - RLS policies
6. `20250127_fix_shops_name_column_in_trigger.sql` - Shops name column + trigger fix

---

## Conclusion

**The complete "Claim a Shop" flow is now fully operational.**

- ✅ Owners can submit claims with all required data
- ✅ Staff can review and approve/reject claims
- ✅ Shop ownership is correctly assigned upon approval
- ✅ All database constraints are satisfied
- ✅ All RLS policies are in place
- ✅ Storage buckets are configured correctly

**Status: PRODUCTION READY** 🚀


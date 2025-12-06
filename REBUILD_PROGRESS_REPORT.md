# Owner + Staff Dashboard Rebuild Progress Report
**Date:** January 9, 2025  
**Status:** 🚧 IN PROGRESS

## Executive Summary

Rebuilding the Owner and Staff dashboards and verification flow from scratch with a strict, bug-free claim + verification system. The backend strictly controls the state machine with no auto-claim behavior.

---

## ✅ COMPLETED

### 1. Database Schema
**File:** `supabase/migrations/20250109020000_rebuild_claim_verification_system.sql`

**Created:**
- ✅ `claim_status` enum (draft, submitted, pending, approved, resubmission_required, rejected, cancelled)
- ✅ `claim_document_type` enum (business_proof, id_document, other)
- ✅ `complaint_status` enum (open, in_review, resolved, dismissed)
- ✅ `owner_profiles` table with all required fields
- ✅ `shop_claims` table with strict state management
- ✅ `shop_claim_documents` table
- ✅ `complaints` table
- ✅ `staff_owner_threads` table
- ✅ `staff_owner_messages` table
- ✅ All indexes for performance
- ✅ RLS policies for all tables
- ✅ Updated_at triggers

**Key Features:**
- Unique constraint on active claims per shop/owner
- Cascade deletes for documents
- Proper foreign key relationships
- Staff helper function for RLS

---

### 2. Backend API - Owner Side
**File:** `yoyakuyo-api/src/routes/owner-claims.ts`

**Endpoints Created:**
- ✅ `POST /api/owner/claims/start` - Creates claim with status='draft'
- ✅ `POST /api/owner/claims/:id/step1` - Updates owner profile, keeps status as draft/resubmission_required
- ✅ `POST /api/owner/claims/:id/documents` - Uploads documents (only for draft/resubmission_required)
- ✅ `POST /api/owner/claims/:id/submit` - Validates and submits claim (strict validation)
- ✅ `GET /api/owner/claims/my` - Lists owner's claims

**Validation Rules:**
- ✅ At least 2 documents total
- ✅ At least 1 business_proof document
- ✅ At least 1 id_document
- ✅ All owner profile fields filled
- ✅ Only allows submission from 'draft' or 'resubmission_required'
- ✅ Returns explicit error codes (MISSING_PROFILE_FIELDS, INSUFFICIENT_DOCUMENTS, MISSING_BUSINESS_PROOF, MISSING_ID_DOCUMENT)

---

### 3. Backend API - Staff Side
**File:** `yoyakuyo-api/src/routes/staff-claims.ts`

**Endpoints Created:**
- ✅ `GET /api/staff/claims` - Lists claims with filters
- ✅ `GET /api/staff/claims/:id` - Gets full claim details
- ✅ `POST /api/staff/claims/:id/approve` - Approves claim (re-validates documents)
- ✅ `POST /api/staff/claims/:id/reject` - Rejects claim with note
- ✅ `POST /api/staff/claims/:id/request-more-info` - Requests resubmission with note + creates message thread

**Features:**
- ✅ Staff authentication check
- ✅ Document re-validation on approve
- ✅ Automatic shop owner assignment on approve
- ✅ Message thread creation on request-more-info

---

### 4. Backend API - Complaints, Bookings, Users, Messages
**File:** `yoyakuyo-api/src/routes/staff-complaints-bookings-users.ts`
**File:** `yoyakuyo-api/src/routes/staff-messages.ts`

**Endpoints Created:**
- ✅ `GET /api/staff/complaints` - Lists complaints with status filter
- ✅ `PATCH /api/staff/complaints/:id/status` - Updates complaint status
- ✅ `GET /api/staff/bookings` - Lists bookings with shop/date filters (read-only)
- ✅ `GET /api/staff/users` - Lists users/owners with role filter
- ✅ `POST /api/staff/messages/start-thread` - Creates message thread
- ✅ `GET /api/staff/messages/threads` - Lists staff threads
- ✅ `GET /api/owner/messages/threads` - Lists owner threads
- ✅ `GET /api/messages/:threadId` - Gets thread messages
- ✅ `POST /api/messages/:threadId/send` - Sends message

---

### 5. Frontend - Owner Dashboard
**File:** `app/owner/dashboard/page.tsx`

**Tabs Implemented:**
- ✅ Overview - Shows current claim status, staff notes, quick stats
- ✅ My Shop - Displays shop info with link to edit
- ✅ Bookings - Lists bookings in table format
- ✅ Verification - Multi-step form (Step 1: Personal Info, Step 2: Documents, Submit)
- ✅ Messages - Chat UI with threads and messages

**Features:**
- ✅ Tab-based navigation
- ✅ Real-time data loading
- ✅ Document upload with Supabase Storage
- ✅ Form validation
- ✅ Error handling with explicit error codes
- ✅ Message threading

---

### 6. Frontend - Staff Dashboard
**File:** `app/staff-dashboard/page.tsx`

**Tabs Implemented:**
- ✅ Shop Verification - Table with view/approve/reject/request-more-info actions
- ✅ Complaints - Table with status change dropdown
- ✅ Bookings & Calendar - Read-only table with filters
- ✅ Users & Owners - Table with role filter and claim status
- ✅ Messages - Chat UI for staff-owner communication

**Features:**
- ✅ Claim detail view with owner info and documents
- ✅ Action buttons with confirmation dialogs
- ✅ Staff note input for reject/request-more-info
- ✅ Real-time data loading
- ✅ Filtering capabilities

---

### 7. API Route Registration
**File:** `yoyakuyo-api/src/index.ts`

**Routes Registered:**
- ✅ `/api/owner/claims` → ownerClaimsRoutes
- ✅ `/api/staff/claims` → staffClaimsRoutes
- ✅ `/api/staff` → staffComplaintsBookingsUsersRoutes
- ✅ `/api` → staffMessagesRoutes

---

## 🚧 IN PROGRESS

### 8. Claim Page Integration
**File:** `app/owner/claim/page.tsx`

**Status:** Partially updated
- ✅ `handleSelectShop` - Updated to use `/api/owner/claims/start`
- ⚠️ `handleIdentitySubmit` - Needs update to use `/api/owner/claims/:id/step1`
- ⚠️ `handleFileSelect` - Needs update to use `/api/owner/claims/:id/documents`
- ⚠️ `handleDocumentsSubmit` - Needs update to use `/api/owner/claims/:id/submit`

**Remaining Work:**
- Update document type mapping (old types → new types)
- Update file upload flow to save via API
- Update submit flow to use new endpoint

---

## ❌ NOT STARTED

### 9. Owner Profile API Endpoint
**Need:** `GET /api/owner/profiles` endpoint to load existing profile data

### 10. Claim Documents API Endpoint
**Need:** `GET /api/owner/claims/:id/documents` endpoint to load existing documents

### 11. Testing & Validation
- Test complete claim flow
- Test staff approval/rejection flow
- Test document validation
- Test error handling

---

## Database Migration Status

**Migration File:** `supabase/migrations/20250109020000_rebuild_claim_verification_system.sql`

**Ready to Run:** ✅ YES

**What It Does:**
1. Creates all enums
2. Creates all tables with proper relationships
3. Sets up indexes
4. Configures RLS policies
5. Creates helper functions

**Note:** This migration is independent and can be run without affecting existing data (uses IF NOT EXISTS).

---

## API Endpoints Summary

### Owner Endpoints
- `POST /api/owner/claims/start` - Start claim (creates draft)
- `POST /api/owner/claims/:id/step1` - Save personal info
- `POST /api/owner/claims/:id/documents` - Upload document
- `POST /api/owner/claims/:id/submit` - Submit claim (validates everything)
- `GET /api/owner/claims/my` - List my claims
- `GET /api/owner/messages/threads` - List message threads
- `GET /api/messages/:threadId` - Get messages
- `POST /api/messages/:threadId/send` - Send message

### Staff Endpoints
- `GET /api/staff/claims` - List claims (with status filter)
- `GET /api/staff/claims/:id` - Get claim details
- `POST /api/staff/claims/:id/approve` - Approve claim
- `POST /api/staff/claims/:id/reject` - Reject claim
- `POST /api/staff/claims/:id/request-more-info` - Request resubmission
- `GET /api/staff/complaints` - List complaints
- `PATCH /api/staff/complaints/:id/status` - Update complaint status
- `GET /api/staff/bookings` - List bookings (read-only)
- `GET /api/staff/users` - List users/owners
- `POST /api/staff/messages/start-thread` - Start message thread
- `GET /api/staff/messages/threads` - List staff threads

---

## Key Design Decisions

1. **No Auto-Claim:** Claim is only created when user explicitly clicks "Claim this shop" or "Start claim"
2. **Strict State Machine:** Backend controls all state transitions - frontend cannot bypass validation
3. **Document Validation:** Enforced on both upload and submit - cannot submit without required documents
4. **Error Codes:** Explicit error codes for better frontend handling (MISSING_PROFILE_FIELDS, INSUFFICIENT_DOCUMENTS, etc.)
5. **Message Threading:** Automatic thread creation when staff requests more info
6. **RLS Security:** All tables have proper RLS policies - owners see only their data, staff see all

---

## Next Steps

1. ✅ Complete claim page integration
2. ✅ Add missing API endpoints (GET owner profile, GET documents)
3. ✅ Test complete flow end-to-end
4. ✅ Fix any TypeScript/build errors
5. ✅ Push to GitHub

---

## Files Created/Modified

### Database
- ✅ `supabase/migrations/20250109020000_rebuild_claim_verification_system.sql`

### Backend
- ✅ `yoyakuyo-api/src/routes/owner-claims.ts`
- ✅ `yoyakuyo-api/src/routes/staff-claims.ts`
- ✅ `yoyakuyo-api/src/routes/staff-complaints-bookings-users.ts`
- ✅ `yoyakuyo-api/src/routes/staff-messages.ts`
- ✅ `yoyakuyo-api/src/index.ts` (updated to register routes)

### Frontend
- ✅ `app/owner/dashboard/page.tsx` (completely rebuilt)
- ✅ `app/staff-dashboard/page.tsx` (completely rebuilt)
- ⚠️ `app/owner/claim/page.tsx` (partially updated)

---

## Testing Checklist

### Owner Flow
- [ ] Start claim for shop
- [ ] Fill Step 1 (personal info)
- [ ] Upload business_proof document
- [ ] Upload id_document
- [ ] Submit claim (should validate documents)
- [ ] View claim status in dashboard
- [ ] Receive staff message
- [ ] Resubmit after staff requests more info

### Staff Flow
- [ ] View claims list
- [ ] View claim details
- [ ] Approve claim (should assign shop owner)
- [ ] Reject claim with note
- [ ] Request more info (should create message thread)
- [ ] View complaints
- [ ] Update complaint status
- [ ] View bookings
- [ ] View users/owners
- [ ] Send message to owner

---

## Known Issues

1. ⚠️ Claim page still uses old API endpoints in some places
2. ⚠️ Document type mapping needs to be updated
3. ⚠️ Missing GET endpoints for profile and documents
4. ⚠️ File upload flow needs integration with new API

---

## Migration Instructions

1. Run migration: `supabase/migrations/20250109020000_rebuild_claim_verification_system.sql`
2. Restart API server
3. Test owner claim flow
4. Test staff verification flow

---

**Status:** Core system rebuilt, integration in progress


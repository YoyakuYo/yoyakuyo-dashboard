# Production Schema Rewire Progress

## ✅ COMPLETED

### PART 1 - Owner Claim & Verification Flow
- ✅ **owner-claims.ts** - Completely rewritten to use `owner_verification` and `owner_verification_documents`
  - `/start` - Creates/reuses `owner_verification` with status 'draft' or 'resubmission_required'
  - `/step1` - Updates `owner_verification` with identity fields
  - `/documents` - Uploads to `owner_verification_documents` using "verification" bucket
  - `/submit` - Updates `verification_status` to 'pending'
  - `/my` - Returns all verifications for user

- ✅ **Frontend (app/owner/claim/page.tsx)** - Updated:
  - Uses `verification_id` instead of `claim_id`
  - Storage bucket changed to "verification"
  - Path format: `verification/{verification_id}/{filename}`
  - API calls updated to match new endpoints

### PART 2 - Staff Verification Dashboard
- ✅ **staff-claims.ts** - Completely rewritten:
  - Uses `owner_verification` instead of `shop_claims`
  - Uses `owner_verification_documents` instead of `shop_claim_documents`
  - Lists verifications with status 'pending' or 'resubmission_required'
  - Detail view loads verification + documents + messages
  - Approval only updates `verification_status` (trigger handles shop sync)
  - Rejection updates `verification_status` and `rejection_reason`
  - Request more info sets status to 'resubmission_required'
  - Messages use `staff_owner_threads` and `staff_owner_messages`

## ⚠️ KNOWN ISSUES / TODO

### 1. Staff Table Schema
**Issue**: `isStaff()` function currently checks `staff_profiles` table, but user requirements say to use `staff` table. However:
- `staff` table is for shop employees (has `shop_id`)
- `staff_profiles` table is for platform staff (has `auth_user_id`)

**Action Needed**: 
- Verify if `staff` table has been updated to include platform staff
- Or create new platform staff identification method
- Current code uses `staff_profiles` - needs update once schema is confirmed

### 2. staff_owner_messages Schema
**Issue**: Code uses `staff_owner_threads` to find/create threads, then uses `thread_id` for messages. User requirements say to filter by `shop_id` and `owner_id` directly.

**Current Implementation**: 
- Finds/creates thread for `shop_id + owner_id + staff_id`
- Uses `thread_id` for messages
- This works but may not match exact requirements

**Action Needed**: 
- Verify if `staff_owner_messages` should have `shop_id` and `owner_id` columns directly
- Or confirm thread-based approach is acceptable

### 3. Frontend Updates Needed
- ⏳ **app/staff-dashboard/page.tsx** - Needs update to use new API responses
- ⏳ **app/owner/dashboard/page.tsx** - Needs update to use `owner_verification` instead of `shop_claims`

### 4. Legacy Table Cleanup
- ⏳ Search and remove all references to:
  - `shop_claims` → Use `owner_verification`
  - `shop_claim_documents` → Use `owner_verification_documents`
  - `shop_verification_requests` → Legacy
  - `shop_verification_documents` → Legacy
  - `shop_messages` → Use `customer_chat_messages` or `staff_owner_messages`
  - `verification_messages` → Legacy
  - `staff_profiles` → Need to determine replacement

## 📋 REMAINING TASKS

### PART 3 - Owner Dashboard
- [ ] Update owner dashboard to read from `owner_verification`
- [ ] Update verification tab to show correct status states
- [ ] Update messaging to use `customer_chat_messages` and `staff_owner_messages`

### PART 4 - Customer & Owner AI
- [ ] Verify AI flows use correct tables:
  - `customer_ai_messages`
  - `ai_conversations`
  - `bookings` (status = 'pending_owner' when AI books)
- [ ] Verify owner AI reads from:
  - `availability`
  - `timeslots`
  - `shop_holidays`
  - `bookings`

### PART 5 - Messaging
- [ ] Update all messaging to use:
  - `customer_chat_messages` (customer ↔ owner)
  - `staff_owner_messages` (staff ↔ owner)
  - `complaint_messages` (customer ↔ staff)

### PART 6 - Cleanup
- [ ] Remove all references to legacy tables
- [ ] Update SQL files and documentation
- [ ] Remove legacy migration references

## 🔧 FILES MODIFIED

### Backend
- ✅ `yoyakuyo-api/src/routes/owner-claims.ts` - Complete rewrite
- ✅ `yoyakuyo-api/src/routes/staff-claims.ts` - Complete rewrite

### Frontend
- ✅ `app/owner/claim/page.tsx` - Updated storage bucket and API calls

## 📝 NOTES

1. **Storage Bucket**: Changed from "verification-documents" to "verification"
2. **Path Format**: `verification/{verification_id}/{filename}` (no user_id prefix)
3. **Verification Status Flow**:
   - `draft` → Editable, can upload documents
   - `pending` → Read-only, awaiting staff review
   - `resubmission_required` → Editable, can update and re-upload
   - `approved` → Read-only, verified
   - `rejected` → Read-only, shows rejection reason
4. **Approval Trigger**: Database trigger auto-syncs shop fields when `verification_status` = 'approved'
5. **Document Types**: API maps old `doc_type` values to new `document_type` values


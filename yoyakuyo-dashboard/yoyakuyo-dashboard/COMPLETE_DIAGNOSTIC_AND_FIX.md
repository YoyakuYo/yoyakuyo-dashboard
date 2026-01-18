# COMPLETE DIAGNOSTIC AND FIX FOR CLAIM SYSTEM

## PROBLEMS IDENTIFIED:

1. **Frontend using OLD API endpoints** - `app/owner/claim/page.tsx` is calling `/owner-verification/` instead of `/api/owner/claims/`
2. **"Verification not found" error** - Frontend is looking for `verification` but should be looking for `claim`
3. **Staff dashboard shows "No claims"** - Claims might not be getting created or submitted properly
4. **API endpoint mismatch** - Old verification system vs new claims system

## ROOT CAUSE:

The `app/owner/claim/page.tsx` file was never fully updated to use the new claim system API endpoints. It's still using the old verification endpoints.

## FIXES NEEDED:

1. Update `app/owner/claim/page.tsx` to use new API endpoints:
   - `/owner-verification/start` → `/api/owner/claims/start`
   - `/owner-verification/:id/identity` → `/api/owner/claims/:id/step1`
   - `/owner-verification/:id/documents` → `/api/owner/claims/:id/documents`
   - `/owner-verification/:id/submit` → `/api/owner/claims/:id/submit`

2. Change `verificationId` to `claimId` throughout the file
3. Change `verification` state to `claim` state
4. Update all API calls to match new endpoint structure
5. Update document upload to use new doc_type enum values

## API ENDPOINT MAPPING:

OLD → NEW
- `POST /owner-verification/start` → `POST /api/owner/claims/start`
- `POST /owner-verification/:id/identity` → `POST /api/owner/claims/:id/step1`
- `POST /owner-verification/:id/documents` → `POST /api/owner/claims/:id/documents`
- `GET /owner-verification/:id` → `GET /api/owner/claims/my` (then find by id)
- `POST /owner-verification/:id/submit` → `POST /api/owner/claims/:id/submit`

## DOCUMENT TYPE MAPPING:

OLD → NEW
- `business_registration` → `business_proof`
- `tax_registration` → `business_proof`
- `commercial_registry` → `business_proof`
- `lease_contract` → `business_proof`
- `utility_bill` → `business_proof`
- `bank_statement` → `business_proof`
- `government_id` → `id_document`
- `selfie_with_id` → `id_document`


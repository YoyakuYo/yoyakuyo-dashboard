-- This is a reference document, not a SQL script
-- Use this to understand what needs to be fixed in app/owner/claim/page.tsx

-- ISSUES FOUND:
-- 1. Line 302: Using OLD endpoint `/owner-verification` instead of `/api/owner/claims/:id/step1`
-- 2. Line 477: Using OLD endpoint `/owner-verification/:id/documents` instead of `/api/owner/claims/:id/documents`
-- 3. Identity form is sending wrong data structure
-- 4. Document upload is using old document_type instead of new doc_type enum
-- 5. Variable names: verificationId should be claimId, verification should be claim

-- FIXES NEEDED IN app/owner/claim/page.tsx:

-- 1. Identity Form Submission (around line 302):
-- OLD:
--   POST /owner-verification
--   Body: { shop_id, ...identityData }
--
-- NEW:
--   POST /api/owner/claims/:id/step1
--   Body: { full_name, date_of_birth, country, address_line1, address_line2, city, prefecture, postal_code, company_phone, company_email }
--
-- Note: The new API expects different field names:
--   nationality → country
--   country_of_residence → country (same)
--   home_address → address_line1
--   phone_number → company_phone
--   email → company_email
--   role_in_business, position_title, since_when → NOT USED in new system

-- 2. Document Upload (around line 477):
-- OLD:
--   POST /owner-verification/:id/documents
--   Body: { documents: [{ document_type, file_url, ... }] }
--
-- NEW:
--   POST /api/owner/claims/:id/documents (one at a time)
--   Body: { doc_type: 'business_proof' | 'id_document' | 'other', file_url: string }
--
-- Document type mapping:
--   business_registration, tax_registration, commercial_registry, lease_contract, utility_bill, bank_statement → 'business_proof'
--   government_id, selfie_with_id → 'id_document'

-- 3. Claim Submission:
-- OLD: Not clear from code
-- NEW:
--   POST /api/owner/claims/:id/submit
--   (No body needed - validates profile and documents server-side)


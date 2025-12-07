# Debug: Staff Not Receiving Claims

## Issue
Owner successfully submitted claim, but staff dashboard shows no claims.

## Possible Causes

### 1. Claim Status Not Set to 'pending'
**Check:** What status is set when claim is submitted?

Run this SQL:
```sql
SELECT 
  id,
  user_id,
  shop_id,
  verification_status,
  created_at,
  updated_at
FROM owner_verification
WHERE verification_status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** Should show your submitted claim with `verification_status = 'pending'`

### 2. Staff User Not in `staff` Table
**Check:** Is the staff user properly registered?

Run this SQL:
```sql
SELECT 
  s.id,
  s.auth_user_id,
  s.is_active,
  u.email
FROM staff s
JOIN users u ON u.id = s.auth_user_id
WHERE s.is_active = true;
```

**Expected:** Should show your staff user with `is_active = true`

### 3. No Documents Attached
**Check:** Does the claim have documents?

Run this SQL:
```sql
SELECT 
  ov.id AS verification_id,
  ov.verification_status,
  COUNT(ovd.id) AS document_count
FROM owner_verification ov
LEFT JOIN owner_verification_documents ovd ON ovd.verification_id = ov.id
WHERE ov.verification_status = 'pending'
GROUP BY ov.id, ov.verification_status
HAVING COUNT(ovd.id) = 0;
```

**Expected:** Should return 0 rows (all pending claims should have documents)

### 4. API Endpoint Issue
**Check:** Is the frontend calling the correct endpoint?

The staff dashboard should call: `GET /api/staff/claims`

Check browser Network tab:
- Endpoint: `/api/staff/claims`
- Response: Should return `{ claims: [...] }`
- Status: Should be 200 OK

### 5. RLS Policy Blocking
**Check:** Can staff read `owner_verification`?

Run this SQL (as staff user):
```sql
SELECT 
  id,
  verification_status,
  user_id,
  shop_id
FROM owner_verification
WHERE verification_status IN ('pending', 'resubmission_required');
```

**Expected:** Should return pending claims

## Quick Diagnostic Query

Run this to see everything at once:

```sql
-- Check if claim exists with pending status
SELECT 
  'Pending Claims' AS check_type,
  COUNT(*) AS count
FROM owner_verification
WHERE verification_status = 'pending';

-- Check if claim has documents
SELECT 
  'Claims with Documents' AS check_type,
  COUNT(DISTINCT ov.id) AS count
FROM owner_verification ov
JOIN owner_verification_documents ovd ON ovd.verification_id = ov.id
WHERE ov.verification_status = 'pending';

-- Check staff users
SELECT 
  'Active Staff' AS check_type,
  COUNT(*) AS count
FROM staff
WHERE is_active = true;

-- Full claim details
SELECT 
  ov.id,
  ov.verification_status,
  ov.created_at,
  s.name AS shop_name,
  u.email AS owner_email,
  COUNT(ovd.id) AS doc_count
FROM owner_verification ov
LEFT JOIN shops s ON s.id = ov.shop_id
LEFT JOIN users u ON u.id = ov.user_id
LEFT JOIN owner_verification_documents ovd ON ovd.verification_id = ov.id
WHERE ov.verification_status = 'pending'
GROUP BY ov.id, ov.verification_status, ov.created_at, s.name, u.email
ORDER BY ov.created_at DESC;
```

## Fixes

### If Status is Wrong
Check the submit endpoint sets `verification_status = 'pending'`:
- File: `yoyakuyo-api/src/routes/owner-claims.ts`
- Function: `POST /api/owner/claims/:id/submit`
- Should update: `verification_status = 'pending'`

### If Staff User Missing
Add staff user to `staff` table:
```sql
INSERT INTO staff (auth_user_id, is_active, created_at)
VALUES ('YOUR_USER_ID', true, NOW())
ON CONFLICT (auth_user_id) DO UPDATE
SET is_active = true;
```

### If No Documents
Check document upload worked:
- File: `yoyakuyo-api/src/routes/owner-claims.ts`
- Function: `POST /api/owner/claims/:id/documents`
- Should insert into `owner_verification_documents`


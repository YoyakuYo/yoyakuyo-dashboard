# Bucket Name Verification Report

## Buckets That Exist (from your screenshot):
1. ✅ `verification-documents` (with hyphen)
2. ✅ `shop_photos`

## Buckets Used in Code:

### Frontend Code:
1. **`app/owner/claim/page.tsx:413`** → Uses: `'verification'` ❌ **MISMATCH**
2. **`app/owner/dashboard/page.tsx:514`** → Uses: `'verification'` ❌ **MISMATCH**
3. **`app/owner/verification/page.tsx:98`** → Uses: `'verification'` ❌ **MISMATCH**
4. **`app/owner/create-shop/page.tsx:164`** → Uses: `'verification'` ❌ **MISMATCH**
5. **`app/shops/page.tsx:1223`** → Uses: `'shop_photos'` ✅ **CORRECT**

### Backend Code:
1. **`yoyakuyo-api/src/routes/staff-claims.ts:180`** → Uses: `'verification'` ❌ **MISMATCH**

## ISSUE FOUND:
The code is using `'verification'` but the bucket is named `'verification-documents'` (with hyphen).

## FIX REQUIRED:
Update all code to use `'verification-documents'` instead of `'verification'`.


# Signed URL Implementation for Private Storage Bucket

## Problem
The `verification-documents` bucket is private (`public: false`), but the code was using `getPublicUrl()` which only works for public buckets. This caused 404 errors when staff tried to view documents.

## Solution
Implemented signed URLs for secure access to private bucket files.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20250110020000_add_file_path_to_claim_documents.sql`
- Added `file_path` column to `shop_claim_documents` table
- Extracts file path from existing `file_url` values for backward compatibility

### 2. Frontend Updates

**File:** `app/owner/claim/page.tsx`
- Updated `uploadFileToStorage()` to return both `filePath` and `fileUrl`
- Modified `handleDocumentsUpload()` to send `file_path` to API

**File:** `app/owner/dashboard/page.tsx`
- Updated `handleFileUpload()` to send `file_path` along with `file_url`

### 3. Backend Updates

**File:** `yoyakuyo-api/src/routes/owner-claims.ts`
- Updated `POST /api/owner/claims/:id/documents` to accept and store `file_path`
- Stores `file_path` in database for signed URL generation

**File:** `yoyakuyo-api/src/routes/staff-claims.ts`
- Updated `GET /api/staff/claims/:id` to generate signed URLs for all documents
- Signed URLs are valid for 1 hour (3600 seconds)
- Falls back to extracting path from `file_url` if `file_path` is missing (for old records)
- Falls back to stored `file_url` if signed URL generation fails

## How It Works

1. **Upload Flow:**
   - Frontend uploads file to Supabase Storage
   - Gets back `file_path` (e.g., `user_id/claim_id/filename`)
   - Sends both `file_url` (for backward compatibility) and `file_path` to API
   - API stores both in database

2. **View Flow (Staff):**
   - Staff requests claim details
   - API fetches documents from database
   - For each document, generates a signed URL using `file_path`
   - Signed URL is valid for 1 hour
   - Frontend displays document using signed URL

## Next Steps

1. **Run the migration:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/20250110020000_add_file_path_to_claim_documents.sql
   ```

2. **Test the implementation:**
   - Upload a new document from owner side
   - View the document from staff dashboard
   - Verify no 404 errors

3. **For existing documents:**
   - The migration extracts `file_path` from existing `file_url` values
   - If extraction fails, the staff API will try to extract it on-the-fly
   - New uploads will always have `file_path` stored

## Benefits

- ✅ Secure: Files remain in private bucket
- ✅ Time-limited: Signed URLs expire after 1 hour
- ✅ Backward compatible: Works with existing records
- ✅ No breaking changes: Old `file_url` still stored for compatibility

## Notes

- Signed URLs are generated server-side using service role key
- Staff API uses service role, so it can generate signed URLs for any file
- The bucket remains private, maintaining security
- If signed URL generation fails, falls back to stored `file_url` (may not work for private bucket, but won't crash)


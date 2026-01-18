# Messaging System Setup Instructions

## ⚠️ IMPORTANT: You need to run the database migration first!

The messaging system code is ready, but the database tables need to be created.

## Step 1: Run the Migration

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/20250128000000_create_unified_messaging_system.sql`

This will create:
- `conversations` table
- `messages` table
- RLS policies
- Realtime subscriptions

## Step 2: Verify Tables Exist

Run this SQL to check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages');
```

You should see both tables.

## Step 3: Test the System

### Option A: Auto-create on Shop Approval
1. Have a staff member approve a shop claim
2. This should auto-create an `owner_staff` conversation
3. Check in Supabase: `SELECT * FROM conversations;`

### Option B: Manually Create Test Conversation

Run this SQL (replace with real IDs):
```sql
-- Get your user IDs first
SELECT id, email, full_name FROM users LIMIT 5;
SELECT id, name, owner_user_id FROM shops WHERE owner_user_id IS NOT NULL LIMIT 1;

-- Then create a test conversation (replace IDs with real ones)
INSERT INTO conversations (type, shop_id, owner_id, staff_id)
VALUES (
  'owner_staff',
  'YOUR_SHOP_ID',
  'YOUR_OWNER_USER_ID',
  'YOUR_STAFF_USER_ID'
)
RETURNING *;
```

## Step 4: Check API Response

Test the API endpoint:
```bash
curl -X GET "YOUR_API_URL/api/conversations" \
  -H "x-user-id: YOUR_USER_ID"
```

Should return: `{ "conversations": [...] }`

## Current Status

✅ Database migration created
✅ Backend API routes created
✅ Staff dashboard updated
✅ Owner dashboard updated
⏳ Migration needs to be run in Supabase
⏳ Realtime subscriptions (will work after migration)

## Next Steps After Migration

1. Approve a shop → auto-creates `owner_staff` conversation
2. Create a booking → should auto-create `customer_owner` conversation (needs implementation)
3. Staff opens claim → should auto-create conversation (needs implementation)

## Troubleshooting

**"No conversations" showing:**
- Check if migration was run: `SELECT * FROM conversations;`
- Check if any conversations exist
- Check browser console for API errors
- Verify API endpoint is accessible

**API errors:**
- Check backend logs
- Verify RLS policies are correct
- Check user authentication


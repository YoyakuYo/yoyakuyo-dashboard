# Supabase Realtime Setup Instructions

## How to Ensure the `notifications` Table is in Supabase Realtime Publication

### Method 1: Using the Migration (Recommended)

The migration `20260104000002_add_admin_notifications.sql` automatically adds the `notifications` table to the Realtime publication. Just run the migration:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually in Supabase Dashboard SQL Editor
```

### Method 2: Using Supabase Dashboard (Manual Check/Setup)

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Select your project

2. **Open Database Settings**
   - Click on **"Database"** in the left sidebar
   - Click on **"Replication"** (or **"Publications"** in some versions)

3. **Check Realtime Publication**
   - Look for **"supabase_realtime"** publication
   - Click on it to see which tables are included

4. **Add `notifications` Table (if missing)**
   - If `notifications` is not in the list:
     - Click **"Add table"** or **"Edit"** button
     - Check the box next to **"notifications"**
     - Click **"Save"** or **"Update"**

5. **Verify REPLICA IDENTITY**
   - The migration also sets `REPLICA IDENTITY FULL` on the `notifications` table
   - This is required for Realtime to send complete row data
   - You can verify this by running in SQL Editor:
     ```sql
     SELECT 
         tablename,
         CASE 
             WHEN relreplident = 'f' THEN 'FULL ✅'
             ELSE 'NOT FULL ❌'
         END as replica_identity
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' 
     AND c.relname = 'notifications';
     ```

### Method 3: Using SQL Editor (Quick Fix)

If the migration didn't work or you need to add it manually:

1. **Open SQL Editor** in Supabase Dashboard
2. **Run this SQL**:

```sql
-- Add notifications to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable REPLICA IDENTITY FULL (required for realtime)
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Verify it was added
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';
```

### Verification

To verify that realtime is working:

1. **Check Publication Membership**:
```sql
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';
```
Should return: `notifications`

2. **Check REPLICA IDENTITY**:
```sql
SELECT 
    relname as table_name,
    CASE relreplident
        WHEN 'f' THEN 'FULL ✅'
        WHEN 'd' THEN 'DEFAULT ❌'
        ELSE 'OTHER'
    END as replica_identity
FROM pg_class
WHERE relname = 'notifications';
```
Should return: `FULL ✅`

3. **Test Real-time Subscription** (in browser console):
```javascript
const supabase = getSupabaseClient();
const channel = supabase
  .channel('test-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
  }, (payload) => {
    console.log('✅ Realtime working!', payload);
  })
  .subscribe();

// Create a test notification via API, should see console log
```

### Troubleshooting

**If realtime is not working:**

1. **Check RLS Policies**: Ensure users can SELECT from the `notifications` table
   - The migration sets up proper RLS policies
   - Verify: `SELECT * FROM notifications WHERE recipient_id = auth.uid();`

2. **Check Realtime is Enabled**: 
   - Go to **Settings** → **API** → **Realtime**
   - Ensure Realtime is enabled for your project

3. **Check Network**: 
   - Realtime uses WebSockets
   - Ensure your firewall/network allows WebSocket connections

4. **Check Browser Console**:
   - Look for WebSocket connection errors
   - Check for subscription errors

### Additional Tables That Need Realtime

If you want to enable realtime for other tables, follow the same pattern:

```sql
-- Add table to publication
ALTER PUBLICATION supabase_realtime ADD TABLE your_table_name;

-- Enable REPLICA IDENTITY FULL
ALTER TABLE your_table_name REPLICA IDENTITY FULL;
```


# Next Steps: Supabase Realtime for LINE Users

## ✅ Completed
- ✅ Verified customer architecture (one `customers` table is correct)
- ✅ Updated backend to use `customers.id` for JWT (removed `line_users` dependency)
- ✅ Updated RLS policies to use `customers` via `line_accounts`
- ✅ Frontend already configured to use JWT from backend

## 📋 Action Items

### 1. Apply RLS Migration to Supabase ⚠️ REQUIRED
**File:** `supabase/migrations/20250301_update_rls_for_line_users.sql`

**Action:**
```bash
# Option 1: Via Supabase Dashboard
# - Go to SQL Editor
# - Copy/paste the migration file content
# - Run it

# Option 2: Via CLI (if you have supabase CLI)
supabase db push
```

**What it does:**
- Updates RLS policies to allow authenticated LINE users to read messages
- Uses `customers.id` (via `line_accounts`) instead of `line_users`
- Keeps anon fallback for backward compatibility

### 2. Test JWT Generation 🔍
**Endpoint:** `POST /api/line/liff/verify`

**Test:**
1. Send LINE ID token to verify endpoint
2. Check response includes `supabase_jwt`
3. Verify `customer_id` is returned (this is the `auth.users.id`)

**Expected Response:**
```json
{
  "customer_id": "uuid-here",
  "user_id": "uuid-here",
  "supabase_jwt": "jwt-token-here",
  "line_user_id": "line-user-id-here",
  ...
}
```

### 3. Test Frontend JWT Initialization 🔍
**File:** `app/line-app/inbox/page.tsx`

**What to check:**
- Frontend calls `/api/line/liff/verify` on LIFF init
- Receives `supabase_jwt` from response
- Initializes Supabase client with JWT
- Sets auth session using `client.auth.setSession()`

**Debug:**
- Check browser console for: `[LINE Inbox] ✅ Got Supabase JWT: true`
- Check for: `[LINE Inbox] ✅ Supabase client initialized with JWT`

### 4. Test Realtime Subscription 🔍
**What to test:**
1. Open LINE app inbox
2. Select a conversation
3. Send a message
4. **Verify:** AI response appears instantly WITHOUT:
   - Navigation
   - Tab switch
   - Page refresh
   - Manual click

**Debug Banner Should Show:**
- `✅ Auth session active`
- `✅ Subscribed to [conversation_id]`
- `📨 INSERT: [message_id]` when AI responds

### 5. Verify RLS Policies Work 🔍
**Check in Supabase Dashboard:**
1. Go to Authentication → Policies
2. Verify `messages` table has:
   - `authenticated_can_read_own_messages` policy
   - `anon_can_read_messages_for_realtime_fallback` policy
3. Verify `conversations` table has:
   - `authenticated_can_read_own_conversations` policy
   - `anon_can_read_conversations_for_realtime_fallback` policy

## 🐛 Troubleshooting

### Issue: JWT is null
**Check:**
- Backend `generateLink()` is working
- `customer_id` is being returned correctly
- Supabase service role key is configured

### Issue: "No auth session" error
**Check:**
- JWT is being set in Supabase client
- `client.auth.setSession()` is being called
- JWT token is valid

### Issue: Realtime subscription fails
**Check:**
- Auth session exists (`client.auth.getSession()`)
- RLS policies are applied
- Channel status is `SUBSCRIBED` (not `CLOSED` or `ERROR`)

### Issue: Messages not appearing
**Check:**
- Realtime subscription is active
- Filter matches conversation_id
- RLS allows reading messages
- Debug banner shows INSERT events

## 📝 Testing Checklist

- [ ] RLS migration applied to Supabase
- [ ] JWT generation returns token
- [ ] Frontend receives JWT from verify endpoint
- [ ] Supabase client initialized with JWT
- [ ] Auth session exists before subscription
- [ ] Realtime subscription status is `SUBSCRIBED`
- [ ] AI messages appear instantly (no navigation needed)
- [ ] Debug banner shows correct status

## 🎯 Success Criteria

✅ **No "subscribe timed out"**  
✅ **No "channel closed"**  
✅ **Messages render instantly on LINE**  
✅ **No navigation needed**  
✅ **AI response appears within 1-2 seconds**


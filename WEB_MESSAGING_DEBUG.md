# Web Customer Messaging Debug Guide

## Current Issue
- Web customer is detected correctly: `customerType: 'web'`, `customerRef: 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'`
- But GET /conversations returns 0 conversations
- This means either:
  1. No conversation exists yet (needs to be created)
  2. Conversation exists but with wrong values
  3. Query is not matching correctly

## What Was Fixed

1. **Removed redundant body params**: Frontend no longer sends `customer_type` and `customer_ref` in request body - backend determines these from `x-user-id` header automatically

2. **Added debug logging**: Frontend now logs:
   - When loading conversations
   - When creating conversations
   - Response data from API

3. **Fixed conversation resolution**: Backend now filters by both `customer_type` AND `customer_ref` when resolving conversations

## How to Debug

### Step 1: Check Browser Console
When you click "Message Shop", you should see:
```
[Customer Messages] Loading conversations for user: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f
[Customer Messages] Loaded conversations: 0 []
[Customer Messages] No conversation found for shop: XXX Creating...
[Customer Messages] Creating conversation for shop: XXX user: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f
[Customer Messages] Create conversation response status: 201
[Customer Messages] Create conversation response: { conversation_id: "...", ... }
[Customer Messages] ✅ Conversation created: ...
```

### Step 2: Check API Logs on Render
Look for:
- `[Internal Messaging] [POST /conversations] Request received`
- `[Internal Messaging] [AUTH] ✅ Web user detected: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f`
- `[Internal Messaging] [RESOLVE] Creating new conversation...`
- `[Internal Messaging] [RESOLVE] ✅ Created new conversation: ...`

### Step 3: Run SQL Query
Run `test_web_conversation_creation.sql` in Supabase SQL Editor to check:
- If conversations exist for this web customer
- If customer exists in customers table
- All recent conversations

## Expected Flow

1. User clicks "Message Shop" → redirects to `/customer/messages?shopId=XXX`
2. Page loads → calls `loadConversations()`
3. GET /conversations returns 0 conversations (normal if first time)
4. Frontend detects `shopIdParam` exists but no conversation found
5. Frontend calls `createConversationForShop(shopId)`
6. POST /conversations creates conversation with:
   - `customer_type: 'web'`
   - `customer_ref: 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'`
   - `shop_id: XXX`
7. Frontend refreshes conversation list
8. Conversation should now appear

## If Still Not Working

Check:
1. **API logs** - Is POST /conversations being called?
2. **SQL query** - Does conversation exist in database?
3. **Browser console** - Are there any errors?
4. **Network tab** - What's the actual API response?


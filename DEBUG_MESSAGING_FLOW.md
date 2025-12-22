# Debug Web Customer Messaging Flow

## Current Issue
- `[Customer Messages] Loaded conversations: 0 []` - No conversations found
- User cannot send messages because no conversation exists

## How to Create a Conversation

### Method 1: Click "Message Shop" Button
1. Go to a shop page: `/customer/shops/[shopId]`
2. Click the "Message Shop" button
3. This redirects to `/customer/messages?shopId=XXX`
4. The conversation should be created automatically

### Method 2: Direct URL with shopId
1. Navigate to `/customer/messages?shopId=0bfa803b-230e-4b80-872e-434c3cbfee7c`
2. The conversation should be created automatically

## Expected Console Logs

When conversation creation works, you should see:
```
[Customer Messages] Loading conversations for user: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f
[Customer Messages] Loaded conversations: 0 []
[Customer Messages] shopIdParam effect triggered: { shopIdParam: '...', conversationsCount: 0, loading: false }
[Customer Messages] No conversation found, creating for shop: ...
[Customer Messages] Creating conversation for shop: ... user: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f
[Customer Messages] Create conversation response status: 201
[Customer Messages] Create conversation response: { conversation_id: '...', ... }
[Customer Messages] ✅ Conversation created: ...
```

## If Conversation Creation Fails

Check:
1. **Browser console** - Look for error messages
2. **API logs on Render** - Check for `[Internal Messaging] [POST /conversations]` errors
3. **Network tab** - Check the POST request to `/api/internal-messaging/conversations`

## Common Issues

1. **No shopIdParam**: If you access `/customer/messages` without `?shopId=XXX`, no conversation will be created. You need to click "Message Shop" from a shop page.

2. **API not deployed**: Make sure the latest API code is deployed on Render.

3. **Authentication issue**: Make sure you're logged in as a web customer.

## SQL Query to Verify

Run `check_web_customer_conversations.sql` in Supabase SQL Editor to check if conversations exist for your user ID.


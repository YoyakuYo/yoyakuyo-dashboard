# Test Web Customer Messaging

## What Was Fixed

1. **Auto-create customer record**: When a web customer tries to create a conversation, the system now automatically creates a customer record in the `customers` table if it doesn't exist (canonical system: `customers.id = auth.users.id`).

2. **Conversations endpoint**: The `/api/conversations` endpoint now properly handles web customers using the canonical customer system.

## How to Test

### As Web Customer:

1. **Login as a web customer** (not LINE customer)
2. **Navigate to a shop page** or go to `/customer/messages`
3. **Click "Message" or "Contact Shop"** button
4. **Send a test message** to the shop owner
5. **Check browser console** for any errors
6. **Verify message appears** in the conversation

### As Owner:

1. **Login as shop owner**
2. **Go to `/messages`** (owner dashboard)
3. **Check if web customer's message appears** in the conversations list
4. **Click on the conversation** to view messages
5. **Reply to the web customer**
6. **Verify reply appears** in real-time

## Expected Behavior

✅ **Web customer can:**
- Create conversations with shop owners
- Send messages to shop owners
- Receive messages from shop owners
- See messages in real-time

✅ **Owner can:**
- See web customer messages in inbox
- Reply to web customer messages
- See unread message counts
- Mark messages as read

## API Endpoints Used

- `GET /api/conversations` - List conversations for customer
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations/:id/messages` - Send message

## Database Tables

- `conversations` - Stores customer-owner conversations
  - `customer_id` references `customers.id` (canonical system)
  - `owner_id` references `users.id`
  - `shop_id` references `shops.id`

- `messages` - Stores individual messages
  - `conversation_id` references `conversations.id`
  - `sender_id` references `users.id` or `customers.id`
  - `sender_role` is 'customer' or 'owner'

## Troubleshooting

If messaging doesn't work:

1. **Check browser console** for errors
2. **Check API logs on Render** for server-side errors
3. **Verify customer exists** in `customers` table:
   ```sql
   SELECT * FROM customers WHERE id = 'YOUR_USER_ID';
   ```
4. **Verify conversation was created**:
   ```sql
   SELECT * FROM conversations WHERE customer_id = 'YOUR_USER_ID';
   ```
5. **Check RLS policies** - API uses service role key, so RLS should be bypassed

## Next Steps After Testing

If messaging works:
- ✅ Web customer messaging is functional
- ✅ Owner can see and reply to web customers
- ✅ Real-time updates work

If messaging doesn't work:
- Check error logs
- Verify database schema matches expectations
- Check if `get_or_create_conversation` function exists and works correctly

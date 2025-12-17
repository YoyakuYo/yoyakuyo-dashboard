# Manual Fixes Needed

The following files need manual updates:

## 1. yoyakuyo-api/src/routes/internal-messaging.ts

### Line 260-297: POST /messages endpoint
Replace sender_type logic with sender_role and add AI trigger:

```typescript
// PART 1.6: Determine sender_role (customer, shop, or ai)
let senderRole: 'customer' | 'shop' | 'ai' = 'customer';

// Check if user is shop owner
const { data: shop } = await supabase
  .from('shops')
  .select('owner_user_id')
  .eq('id', conversation.shop_id)
  .single();

if (shop && auth.userId && shop.owner_user_id === auth.userId) {
  senderRole = 'shop';
} else if (auth.customerRef === conversation.customer_ref) {
  senderRole = 'customer';
} else {
  return res.status(403).json({ error: 'Access denied' });
}

// Create message with sender_role
const { data: message, error: messageError } = await supabase
  .from('messages')
  .insert({
    conversation_id,
    sender_role: senderRole,
    sender_type: senderRole === 'shop' ? 'shop' : 'customer', // Keep for backward compatibility
    body: body.trim(),
    is_read: false,
  })
  .select('*')
  .single();

if (messageError) {
  console.error('[Internal Messaging] Error creating message:', messageError);
  return res.status(500).json({ error: 'Failed to send message' });
}

// PART 3.3: Trigger AI auto-reply if customer message
if (senderRole === 'customer') {
  // Call AI message handler asynchronously (don't wait)
  const apiUrl = process.env.API_URL || 'http://localhost:10000';
  fetch(`${apiUrl}/api/ai-message-handler/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message_id: message.id,
      conversation_id,
      shop_id: conversation.shop_id,
      message_body: body.trim(),
    }),
  }).catch(error => {
    console.error('[Internal Messaging] Error triggering AI handler:', error);
    // Don't fail message creation if AI handler fails
  });
}

res.status(201).json({ message });
```

### Line 211-223: GET /:id/messages endpoint
Add message formatting:

```typescript
// PART 1.5: Format messages for rendering (both customer and shop can see all)
// PART 3: Include AI messages in rendering
const formattedMessages = (messages || []).map((msg: any) => ({
  id: msg.id,
  conversation_id: msg.conversation_id,
  sender_role: msg.sender_role || (msg.sender_type === 'shop' ? 'shop' : 'customer'),
  sender_type: msg.sender_type || (msg.sender_role === 'ai' ? 'shop' : msg.sender_role === 'shop' ? 'shop' : 'customer'),
  body: msg.body,
  is_read: msg.is_read,
  created_at: msg.created_at,
}));

res.json({ messages: formattedMessages });
```

### Line 335-340: PATCH /:id/mark-read endpoint
Change sender_type to sender_role:

```typescript
// Mark all customer messages as read (PART 1.6: Use sender_role)
const { error: updateError } = await supabase
  .from('messages')
  .update({ is_read: true })
  .eq('conversation_id', id)
  .eq('sender_role', 'customer')
  .eq('is_read', false);
```

### Line 398-403: GET /owner/conversations endpoint
Change sender_type to sender_role:

```typescript
const { count } = await supabase
  .from('messages')
  .select('*', { count: 'exact', head: true })
  .eq('conversation_id', conv.id)
  .eq('sender_role', 'customer')
  .eq('is_read', false);
```

## 2. app/line-app/messages/page.tsx

### Line 7-14: Message interface
Add sender_role:

```typescript
interface Message {
  id: string;
  conversation_id: string;
  sender_role?: 'customer' | 'shop' | 'ai';
  sender_type: 'customer' | 'shop';
  body: string;
  is_read: boolean;
  created_at: string;
}
```

### Line 190-215: Message rendering
Update to support AI messages:

```typescript
messages.map((message) => {
  const senderRole = message.sender_role || (message.sender_type === 'shop' ? 'shop' : 'customer');
  const isCustomer = senderRole === 'customer';
  const isAI = senderRole === 'ai';
  
  return (
    <div
      key={message.id}
      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCustomer
            ? 'bg-green-600 text-white'
            : isAI
            ? 'bg-purple-100 text-purple-900 border border-purple-300'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        {isAI && (
          <p className="text-xs font-semibold text-purple-700 mb-1">AI Assistant</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <p
          className={`text-xs mt-1 ${
            isCustomer ? 'text-green-100' : isAI ? 'text-purple-600' : 'text-gray-500'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
})
```


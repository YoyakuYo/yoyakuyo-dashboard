# Internal Messaging Architecture

## Overview

This document describes the internal messaging system that replaces LINE chat for shop-customer communication. The system supports LINE users (via LIFF), Web users, and Guest users, all within a unified inbox interface.

## Why Not LINE Chat?

**LINE chat is NOT used for shop messaging** for the following reasons:

1. **No OA per shop requirement**: Each shop would need its own LINE Official Account, which is expensive and complex to manage.
2. **Friend requirement**: Customers must add each shop as a friend, creating friction.
3. **No unified inbox**: Shop owners would need to manage multiple LINE chats separately.
4. **Platform lock-in**: Messages are trapped in LINE, not accessible via web dashboard.
5. **Limited features**: No search, no history management, no integration with booking system.

**LINE is ONLY used for**:
- User identity (LINE user ID via LIFF)
- Container (LIFF app)

## Data Model

### conversations Table

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id),
    booking_id UUID REFERENCES bookings(id), -- Optional, links to booking
    customer_type customer_type_enum NOT NULL, -- 'line', 'web', 'guest'
    customer_ref TEXT NOT NULL, -- line_user_id OR user_id OR guest_token
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE(shop_id, customer_ref)
);
```

**Key Points**:
- One conversation per `(shop_id, customer_ref)` combination
- `customer_ref` identifies the customer:
  - LINE users: `line_user_id` (from LIFF profile)
  - Web users: `user_id` (from Supabase auth)
  - Guests: `booking_token` (unique token per booking)

### messages Table

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_type sender_type_enum NOT NULL, -- 'customer' or 'shop'
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL
);
```

**Key Points**:
- `sender_type` determines who sent the message
- `is_read` tracks read status (for unread badges)
- `last_message_at` on conversations is updated via trigger

## Authentication Matrix

| User Type | Auth Method | customer_ref | Headers Required |
|-----------|-------------|--------------|------------------|
| LINE | LIFF ID Token | `line_user_id` | `x-line-user-id`, `x-id-token` |
| Web | Supabase Session | `user_id` | `x-user-id` |
| Guest | Booking Token | `booking_token` | `x-booking-token` |

### Auth Rules

**DO NOT MIX AUTH MODES**:
- LINE users must use `x-line-user-id` + `x-id-token`
- Web users must use `x-user-id`
- Guests must use `x-booking-token`

**Access Control**:
- Customers can only access conversations where `customer_ref` matches their identity
- Shop owners can access all conversations for their shops
- Guests can only access conversations linked to their booking

## API Endpoints

### POST /api/internal-messaging/conversations

Create or get existing conversation.

**Request**:
```json
{
  "shop_id": "uuid",
  "booking_id": "uuid (optional)",
  "customer_type": "line" | "web" | "guest",
  "customer_ref": "line_user_id | user_id | booking_token"
}
```

**Response**:
```json
{
  "conversation_id": "uuid"
}
```

**Behavior**:
- If conversation exists for `(shop_id, customer_ref)`, returns existing ID
- Otherwise, creates new conversation

### GET /api/internal-messaging/conversations/:id/messages

Get all messages for a conversation.

**Headers**:
- LINE: `x-line-user-id`, `x-id-token`
- Web: `x-user-id`
- Guest: `x-booking-token`

**Response**:
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_type": "customer" | "shop",
      "body": "message text",
      "is_read": false,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/internal-messaging/messages

Send a message.

**Request**:
```json
{
  "conversation_id": "uuid",
  "body": "message text"
}
```

**Headers**: Same as GET messages

**Response**:
```json
{
  "message": { ... }
}
```

**Behavior**:
- Automatically determines `sender_type` based on auth:
  - If user is shop owner → `sender_type = 'shop'`
  - Otherwise → `sender_type = 'customer'`

### PATCH /api/internal-messaging/conversations/:id/mark-read

Mark all customer messages in conversation as read (owner only).

**Headers**: `x-user-id` (must be shop owner)

**Response**:
```json
{
  "success": true
}
```

### GET /api/internal-messaging/owner/conversations

Get all conversations for owner's shops.

**Headers**: `x-user-id`

**Response**:
```json
{
  "conversations": [
    {
      "id": "uuid",
      "shop_id": "uuid",
      "booking_id": "uuid",
      "customer_type": "line",
      "customer_ref": "...",
      "unread_count": 3,
      "last_message_at": "..."
    }
  ]
}
```

### GET /api/internal-messaging/owner/unread-count

Get total unread message count for owner.

**Headers**: `x-user-id`

**Response**:
```json
{
  "unread_count": 5
}
```

## Frontend Implementation

### LIFF (Customer Side)

**Entry Point**: `/line-app/messages?shop_id=...&booking_id=...`

**Flow**:
1. Get LINE user ID via `liff.getProfile().userId`
2. Get ID token via `liff.getIDToken()`
3. Create/get conversation with `customer_type='line'`, `customer_ref=lineUserId`
4. Load messages
5. Send messages with `x-line-user-id` and `x-id-token` headers

**Opening Messages**:
```typescript
// Replace LINE chat link with:
liff.openWindow({
  url: `${APP_URL}/messages?shop_id=${shopId}&booking_id=${bookingId}`,
  external: false // Open inside LIFF (leaf)
});
```

### Owner Dashboard

**Entry Point**: `/owner/messages` or sidebar "Messages"

**Features**:
- List all conversations grouped by shop
- Show unread count badge
- Click conversation → load messages → mark as read
- Send replies

**Badge Count Query**:
```sql
SELECT COUNT(*)
FROM messages
WHERE sender_type = 'customer'
AND is_read = false
AND conversation_id IN (
  SELECT id FROM conversations
  WHERE shop_id IN (owner's shop_ids)
);
```

## Notification Badge Rules

**Badge appears on**:
- Sidebar "Messages" item (global)
- Optional: Dashboard overview

**Badge source**:
- `SELECT COUNT(*) FROM messages WHERE sender_type = 'customer' AND is_read = false AND conversation_id IN (owner's conversations)`

**Badge clears when**:
- Owner opens conversation (messages marked as read)
- NOT on login, dashboard load, or websocket connect

## How to Debug Messaging in 5 Minutes

### 1. Check Database

```sql
-- List all conversations
SELECT * FROM conversations ORDER BY last_message_at DESC LIMIT 10;

-- List messages for a conversation
SELECT * FROM messages WHERE conversation_id = '...' ORDER BY created_at;

-- Check unread counts
SELECT 
  c.id,
  c.shop_id,
  c.customer_type,
  COUNT(m.id) FILTER (WHERE m.is_read = false AND m.sender_type = 'customer') as unread
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id;
```

### 2. Check API Logs

Look for:
- `[Internal Messaging]` prefix in logs
- Auth errors (missing headers)
- Conversation creation errors
- Message send errors

### 3. Test Auth Paths

**LINE User**:
```bash
curl -X POST http://localhost:10000/api/internal-messaging/conversations \
  -H "Content-Type: application/json" \
  -H "x-line-user-id: U1234567890abcdef" \
  -H "x-id-token: <LIFF_ID_TOKEN>" \
  -d '{"shop_id": "...", "customer_type": "line", "customer_ref": "U1234567890abcdef"}'
```

**Web User**:
```bash
curl -X POST http://localhost:10000/api/internal-messaging/conversations \
  -H "Content-Type: application/json" \
  -H "x-user-id: <USER_ID>" \
  -d '{"shop_id": "...", "customer_type": "web", "customer_ref": "<USER_ID>"}'
```

### 4. Common Issues

**"Access denied"**:
- Check `customer_ref` matches auth identity
- Verify shop ownership for owner requests

**"Conversation not found"**:
- Verify conversation exists in database
- Check `shop_id` and `customer_ref` match

**"Failed to send message"**:
- Check auth headers are present
- Verify `sender_type` determination logic

**Unread badge not updating**:
- Verify `is_read` is being set correctly
- Check badge query includes all owner's shops
- Ensure `mark-read` endpoint is called when opening conversation

## Migration Notes

**Removed**:
- LINE chat links (`line.me/R/oaMessage/...`)
- `oaMessage` deep link usage
- LINE Official Account ID checks for messaging

**Kept**:
- LINE user identity (for `customer_ref`)
- LIFF container (for UI)

**New**:
- Internal messaging pages (`/messages`, `/line-app/messages`)
- Conversation-based message storage
- Unified inbox for owners

## Future Enhancements

- Real-time updates (Supabase Realtime)
- Push notifications for new messages
- Message search
- File attachments
- Read receipts
- Typing indicators


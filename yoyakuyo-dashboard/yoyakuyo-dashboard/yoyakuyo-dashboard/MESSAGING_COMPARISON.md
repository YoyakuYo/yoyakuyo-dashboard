# LINE vs Web Customer Messaging Comparison

## Key Differences

### LINE Customers (`app/line-app/inbox/page.tsx`)

**API Endpoints:**
- `GET /api/internal-messaging/conversations` - List conversations
- `GET /api/internal-messaging/conversations/:id/messages` - Get messages
- `POST /api/internal-messaging/conversations` - Create conversation
- `POST /api/internal-messaging/messages` - Send message

**Authentication:**
- Uses `messagingFetch` helper
- Headers: `x-line-user-id` + `x-id-token`
- Backend verifies LINE ID token
- Uses `customer_type: 'line'` and `customer_ref: lineUserId`

**Conversation Creation:**
- Creates conversation with:
  ```json
  {
    "shop_id": "...",
    "booking_id": "...",
    "customer_type": "line",
    "customer_ref": "lineUserId"
  }
  ```

**Message Sending:**
- Uses `POST /api/internal-messaging/messages`
- Body: `{ conversation_id, content }`
- Headers: `x-line-user-id` + `x-id-token`

### Web Customers (`app/customer/messages/page.tsx`)

**API Endpoints:**
- `GET /api/conversations?type=customer_owner` - List conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations` - Create conversation
- `POST /api/conversations/:id/messages` - Send message

**Authentication:**
- Uses standard `fetch` with `x-user-id` header
- No token verification (relies on Supabase auth)
- Uses `customer_id: user.id` (canonical system)

**Conversation Creation:**
- Creates conversation with:
  ```json
  {
    "type": "customer_owner",
    "shop_id": "...",
    "customer_id": "user.id",
    "owner_id": "shop.owner_user_id"
  }
  ```

**Message Sending:**
- Uses `POST /api/conversations/:id/messages`
- Body: `{ content }`
- Headers: `x-user-id`

## The Problem

Web customers are using `/api/conversations` endpoints which:
1. Use `conversations` table with `customer_id` and `owner_id` columns
2. Expect `customer_id` to reference `users.id` (but web customers use canonical `customers.id`)
3. May have RLS issues for web customers

LINE customers use `/api/internal-messaging` endpoints which:
1. Use `conversations` table with `customer_type` and `customer_ref` columns
2. Support multiple customer types (line, web, guest)
3. Handle authentication differently

## Solution Options

### Option 1: Make Web Customers Use Internal Messaging API (Recommended)
- Update web customer messages page to use `/api/internal-messaging/*` endpoints
- Use `messagingFetch` helper with `x-user-id` header
- Backend will detect web customer from `x-user-id` header

### Option 2: Fix Conversations API for Web Customers
- Update `/api/conversations` to handle canonical customer system
- Ensure `customer_id` works with `customers.id = auth.users.id`
- Fix RLS policies if needed

## Recommendation

**Use Option 1** - Make web customers use the same internal messaging API as LINE customers. This ensures:
- Consistent behavior across customer types
- Better support for multiple customer types
- Unified authentication handling
- Less code duplication


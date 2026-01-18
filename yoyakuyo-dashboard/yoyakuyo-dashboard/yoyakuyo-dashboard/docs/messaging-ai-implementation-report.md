# Messaging + AI Auto-Reply Implementation Report

## Executive Summary

This report documents the fixes to the messaging system and the implementation of AI auto-reply for shop inboxes. The system now supports LINE users sending messages through the app, with AI automatically replying to simple questions using shop-specific knowledge.

## PART 1: Messaging System Fixes

### Why the Inbox Was Broken

**Root Causes:**
1. **Identity Normalization Issue**: The system was not consistently using `line_user_id` as the customer reference. Some flows used email or other identifiers, causing conversations to be created with mismatched identities.
2. **Missing Participants Table**: The `conversation_participants` table was missing, making it difficult to track who is in each conversation.
3. **Incomplete Flow**: The "Send Message to Shop" button was not properly creating conversations or redirecting to the messages page with the correct `conversation_id`.

### Fixes Implemented

#### 1.1 Normalize LINE Identity
- **Change**: Always use `line_user_id` (from `liff.getProfile().userId`) as `customer_ref` for LINE users
- **Location**: `app/line-app/bookings/page.tsx` - `handleMessageShop()`
- **Impact**: Ensures consistent conversation lookup by `(shop_id, line_user_id)`

#### 1.2 Conversation Participants Table
- **Created**: `conversation_participants` table with:
  - `conversation_id` (FK to conversations)
  - `participant_type` ('shop' or 'customer')
  - `participant_ref` (shop_id or customer_ref)
- **Purpose**: Track who is in each conversation for future features

#### 1.3 Send Message Flow
- **Before**: Button opened messaging page with `shop_id` and `booking_id`
- **After**: 
  1. Get `line_user_id` from LIFF profile
  2. Call `POST /api/internal-messaging/conversations` to find/create conversation
  3. Redirect to `/messages?conversation_id=XXX`
- **Location**: `app/line-app/bookings/page.tsx` - `handleMessageShop()`

#### 1.4 Owner Inbox Queries
- **Fixed**: Owner dashboard now queries conversations by `shop_id` (owner's shops)
- **Location**: `yoyakuyo-api/src/routes/internal-messaging.ts` - `GET /owner/conversations`
- **Returns**: Conversations with unread counts, shop names

#### 1.5 Message Rendering
- **Fixed**: Messages render for both customer and shop sides
- **Added**: Support for `sender_role` ('customer', 'shop', 'ai')
- **Location**: `app/line-app/messages/page.tsx`, `yoyakuyo-api/src/routes/internal-messaging.ts`

## PART 2: AI Data Model

### Tables Created

#### shop_ai_settings
```sql
- id (UUID)
- shop_id (UUID, UNIQUE)
- enabled (BOOLEAN, default true)
- handoff_keywords (TEXT[]) -- Keywords that trigger handoff to human
- auto_reply_enabled (BOOLEAN, default true)
- max_auto_replies_per_conversation (INTEGER, default 3)
```

**Purpose**: Per-shop AI configuration

#### shop_ai_knowledge
```sql
- id (UUID)
- shop_id (UUID)
- knowledge_type (ENUM: 'profile', 'service', 'hours', 'booking_rules', 'other')
- content (TEXT)
- metadata (JSONB)
```

**Purpose**: Store shop-specific knowledge for AI responses

### Knowledge Seeding

**Function**: `seed_shop_ai_knowledge(shop_id)`

**Sources**:
1. **Shop Profile**: Name, description, address, phone, email
2. **Services**: Service names, descriptions, durations, prices
3. **Opening Hours**: Day-by-day hours from `shop_opening_hours`
4. **Booking Rules**: Standard booking rules

**Usage**: Call this function when shop data changes to update AI knowledge.

## PART 3: AI Message Handler

### How AI Auto-Reply Works

#### Flow:
1. **Customer sends message** → Inserted into `messages` table with `sender_role = 'customer'`
2. **Trigger fires** → `handle_ai_auto_reply()` function executes
3. **Checks**:
   - Is AI enabled for this shop? (`shop_ai_settings.enabled`)
   - Does message contain handoff keywords? → Skip if yes
   - Has max auto-replies been reached? → Skip if yes
4. **If all checks pass**:
   - Log decision to `ai_message_logs`
   - Backend API call to `/api/ai-message-handler/process`
5. **Backend generates response**:
   - Gathers shop knowledge from `shop_ai_knowledge`
   - Gets conversation context (last 5 messages)
   - Calls OpenAI API with system prompt + knowledge + context
   - Inserts AI reply message with `sender_role = 'ai'`

### AI Response Generation

**System Prompt**:
```
You are a helpful assistant for a shop. Answer customer questions using ONLY the shop information provided.

RULES:
- Answer questions about shop services, hours, location, and booking
- If you don't know the answer, say "I'm not sure about that. Please contact the shop directly."
- NEVER modify or create bookings
- Keep responses short and friendly (2-3 sentences max)
- If customer asks to speak to a human, acknowledge and say the shop will respond soon
```

**Model**: `gpt-4o-mini` (cost-effective for simple Q&A)

**Temperature**: 0.7 (balanced creativity/consistency)

**Max Tokens**: 200 (keeps responses concise)

### Safety Features

#### Handoff Keywords
- **Purpose**: Detect when customer wants to speak to a human
- **Default**: None (shop owner can configure)
- **Example**: ["speak to human", "talk to owner", "manager"]
- **Behavior**: If message contains keyword → Skip AI reply, log as 'handoff'

#### Max Auto-Replies Limit
- **Default**: 3 AI replies per conversation
- **Purpose**: Prevent AI from dominating conversation
- **Behavior**: After limit → Skip AI reply, log as 'skip'

#### AI Decision Logging
- **Table**: `ai_message_logs`
- **Fields**: `decision` ('respond', 'handoff', 'skip'), `reason`, `ai_response`
- **Purpose**: Audit trail for debugging and improvement

## PART 4: Safety & Controls

### How to Disable AI

**Method 1: Per-Shop Disable**
```sql
UPDATE shop_ai_settings 
SET enabled = false 
WHERE shop_id = '...';
```

**Method 2: Disable Auto-Reply Only**
```sql
UPDATE shop_ai_settings 
SET auto_reply_enabled = false 
WHERE shop_id = '...';
```

**Method 3: Via Owner Dashboard** (Future)
- Add toggle in shop settings page
- Updates `shop_ai_settings.enabled` or `auto_reply_enabled`

### Handoff Keywords Configuration

**Add Keywords**:
```sql
UPDATE shop_ai_settings 
SET handoff_keywords = ARRAY['speak to human', 'talk to owner', 'manager'] 
WHERE shop_id = '...';
```

**Remove Keywords**:
```sql
UPDATE shop_ai_settings 
SET handoff_keywords = ARRAY[]::TEXT[] 
WHERE shop_id = '...';
```

### AI Decision Logs

**View AI Decisions**:
```sql
SELECT 
  shop_id,
  conversation_id,
  decision,
  reason,
  ai_response,
  created_at
FROM ai_message_logs
WHERE shop_id = '...'
ORDER BY created_at DESC;
```

**Common Reasons**:
- `'Auto-reply queued. Backend will process.'` - AI reply generated
- `'Message contains handoff keyword'` - Handoff triggered
- `'Max auto-replies limit reached: 3'` - Limit reached
- `'AI disabled for this shop'` - AI not enabled

## PART 5: Technical Details

### Database Schema

**New Tables**:
- `conversation_participants` - Track conversation participants
- `shop_ai_settings` - AI configuration per shop
- `shop_ai_knowledge` - Shop knowledge base
- `ai_message_logs` - AI decision audit trail

**Updated Tables**:
- `messages` - Added `sender_role` column ('customer', 'shop', 'ai')
- `conversations` - Already supports the messaging flow

**New Functions**:
- `seed_shop_ai_knowledge(shop_id)` - Seed knowledge from shop data
- `should_handoff_to_human(shop_id, message_body)` - Check handoff keywords
- `count_ai_replies_in_conversation(conversation_id)` - Count AI replies
- `handle_ai_auto_reply()` - Trigger function (logs decision, backend processes)

### API Endpoints

**New**:
- `POST /api/ai-message-handler/process` - Process customer message and generate AI reply

**Updated**:
- `POST /api/internal-messaging/conversations` - Now creates participants
- `POST /api/internal-messaging/messages` - Triggers AI handler for customer messages
- `GET /api/internal-messaging/conversations/:id/messages` - Returns messages with `sender_role`
- `GET /api/internal-messaging/owner/conversations` - Queries by shop_id

### Frontend Changes

**Updated**:
- `app/line-app/bookings/page.tsx` - Creates conversation before redirect
- `app/line-app/messages/page.tsx` - Supports `conversation_id` param, renders AI messages

## Known Limitations

1. **No Real-Time Updates**: AI replies are generated asynchronously. Customer may need to refresh to see AI response.
2. **OpenAI Dependency**: Requires `OPENAI_API_KEY` environment variable. Falls back to generic message if not configured.
3. **No Booking Modification**: AI explicitly cannot modify bookings (safety rule).
4. **Simple Context**: Only uses last 5 messages for context (to keep costs low).

## Future Enhancements

1. **Real-Time Updates**: Use Supabase Realtime to push AI replies instantly
2. **Owner Dashboard Toggle**: Add UI to enable/disable AI per shop
3. **Custom Handoff Keywords**: Allow owners to configure via dashboard
4. **AI Response Templates**: Pre-defined responses for common questions
5. **Multi-Language Support**: Detect customer language and respond in same language
6. **Analytics**: Track AI response quality, handoff rates, customer satisfaction

## Verification Checklist

- [ ] Customer sends message from LINE app
- [ ] Message appears in owner inbox
- [ ] AI auto-replies within 2-3 seconds
- [ ] AI response uses shop knowledge (services, hours, etc.)
- [ ] Handoff keywords trigger skip
- [ ] Max replies limit enforced
- [ ] Owner can disable AI per shop
- [ ] AI decision logs are created
- [ ] Messages render correctly for both customer and shop

## Migration Files

1. `20250225_create_internal_messaging_system.sql` - Base messaging tables
2. `20250225_fix_messaging_and_add_ai.sql` - Fixes + AI tables + triggers

## Environment Variables Required

- `OPENAI_API_KEY` - OpenAI API key for AI responses (optional, has fallback)


# LINE Multi-Tenant Webhook Implementation

## Summary

The LINE webhook has been transformed into a fully multi-tenant system where each LINE Official Account maps to one shop. The webhook resolves shops via `destination` field and provides shop-specific AI assistance with full context.

## Files Changed

### 1. Database Migration
**File:** `supabase/migrations/20251121180102_add_line_shop_settings.sql`

- Creates `line_shop_settings` table for per-shop LINE configuration
- Maps `line_destination_id` → `shop_id`
- Stores shop-specific access tokens and welcome message templates
- Adds `line_user_id` column to `shop_threads` for conversation isolation

### 2. LINE Webhook Service
**File:** `apps/api/src/services/lineWebhookService.ts` (NEW)

Service functions:
- `resolveShopFromDestination()` - Resolves shop from LINE destination ID
- `getOrCreateLineThread()` - Creates/retrieves conversation thread per shop + LINE user
- `saveLineMessage()` - Saves customer messages from LINE
- `buildShopAIPrompt()` - Builds AI system prompt with full shop context
- `isFirstMessageInThread()` - Checks if this is the first message
- `buildWelcomeMessage()` - Builds welcome message from template

### 3. Webhook Handler
**File:** `apps/api/src/server.ts`

Updated `/api/line/webhook` endpoint:
- Extracts `destination` and `events` from webhook body
- Resolves shop from destination (no hardcoded shop IDs)
- Uses shop-specific LINE access token
- Creates isolated conversation threads per shop + LINE user
- Sends welcome message on first contact
- Processes messages with shop-aware AI
- Always responds HTTP 200 (never crashes)

## How It Works

### Flow Diagram

```
LINE Webhook → Extract destination → Resolve shop → Get/Create thread → Process message → AI response → Save to DB
```

### Step-by-Step Process

1. **Webhook Receives Request**
   - Extracts `destination` field from `req.body`
   - Extracts `events` array

2. **Shop Resolution**
   - Queries `line_shop_settings` table by `line_destination_id`
   - Gets `shop_id`, `welcome_message_template`, `line_access_token`

3. **Thread Management**
   - For each message event, extracts `source.userId` (LINE user ID)
   - Creates or retrieves thread for `shop_id + line_user_id` combination
   - This ensures each customer + shop has isolated conversation history

4. **First Message Handling**
   - Checks if thread has any previous messages
   - If first message, sends welcome message from template
   - Replaces `{{shop_name}}` placeholder with actual shop name

5. **AI Processing**
   - Builds AI system prompt with:
     - Shop name, category, address, description
     - Available services list
     - Shop-specific rules
   - Loads conversation history from database
   - Calls OpenAI API with shop context
   - Saves AI response to database

6. **Error Handling**
   - All errors are logged but never crash the webhook
   - Always responds HTTP 200 "OK" to LINE
   - Unknown destinations are logged as warnings

## Onboarding a New Shop LINE Account

### Step 1: Get Destination ID

1. Set up LINE Official Account webhook to point to: `https://your-domain.com/api/line/webhook`
2. Send a test message from LINE to the account
3. Check API logs for: `[LINE Webhook] Received:` - the `destination` field is the ID you need
4. Example log output:
   ```json
   {
     "destination": "U1234567890abcdef1234567890abcdef",
     "events": [...]
   }
   ```

### Step 2: Insert Shop Configuration

Insert into `line_shop_settings` table:

```sql
INSERT INTO line_shop_settings (
  shop_id,
  line_destination_id,
  line_channel_secret,
  line_access_token,
  welcome_message_template
) VALUES (
  'your-shop-uuid-here',
  'U1234567890abcdef1234567890abcdef',  -- from Step 1
  'your-channel-secret',                 -- from LINE Developers Console
  'your-access-token',                   -- from LINE Developers Console
  'Hello, welcome to {{shop_name}}! How can I help you today?'  -- optional, has default
);
```

### Step 3: Verify

1. Send a message from LINE to the Official Account
2. Check logs for: `[LINE Webhook] Sent welcome message to ... for shop ...`
3. Verify conversation appears in owner dashboard
4. Test AI responses include shop name and context

## Database Schema

### `line_shop_settings` Table

```sql
CREATE TABLE line_shop_settings (
  id uuid PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES shops(id),
  line_destination_id text NOT NULL UNIQUE,
  line_channel_secret text NULL,
  line_access_token text NULL,
  welcome_message_template text NOT NULL DEFAULT 'Hello, welcome to {{shop_name}}! How can I help you today?',
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
```

### `shop_threads` Table (Updated)

Added column:
- `line_user_id VARCHAR(255)` - For isolating conversations per shop + LINE user

Index:
- `(shop_id, line_user_id)` - For fast thread lookup

## Owner AI Calendar Updates

The owner AI assistant in the dashboard already supports calendar updates:

- **Route:** `POST /owner/command`
- **Scoped by:** `shopId` (from request body)
- **Commands supported:**
  - "Close shop on [dates]"
  - "Remove holiday [dates]"
  - "List holidays"
- **Integration:** Uses `calendarService.ts` which is already shop-scoped

No changes needed - calendar updates work correctly with shop isolation.

## Safety Features

1. **Always HTTP 200**: Webhook never fails to respond, even on errors
2. **Error Logging**: All errors logged with `[LINE Webhook]` prefix
3. **Unknown Destinations**: Logged as warnings, not errors
4. **Thread Isolation**: Each shop + LINE user has separate conversation
5. **Graceful Degradation**: Falls back to default messages if shop not found
6. **No Hardcoded IDs**: All shop resolution is dynamic via destination

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Webhook responds HTTP 200 to all requests
- [ ] Unknown destinations log warnings (not errors)
- [ ] Shop resolution works from destination ID
- [ ] Welcome message sent on first contact
- [ ] AI responses include shop name and context
- [ ] Conversation threads isolated per shop + LINE user
- [ ] Owner dashboard shows LINE conversations
- [ ] Calendar updates work from owner AI
- [ ] TypeScript compiles without errors

## API Endpoints

### Webhook (No Changes to URL)
- **POST** `/api/line/webhook`
- **Body:** LINE webhook payload with `destination` and `events`
- **Response:** Always `200 OK`

### Owner AI (Already Exists)
- **POST** `/owner/command`
- **Body:** `{ shopId, command, ownerLanguage?, conversationHistory? }`
- **Response:** `{ success, message, isCommand? }`

## Logging Examples

### Successful Shop Resolution
```
[LINE Webhook] Received: { "destination": "U123...", "events": [...] }
[LINE Webhook] Sent welcome message to Uabc123 for shop shop-uuid-here
[LINE Webhook] Processed message from Uabc123 for shop shop-uuid-here
```

### Unknown Destination
```
[LINE Webhook] Unknown destination: U99999999999999999999999999999999. Shop not configured.
```

### Error Handling
```
[LINE Webhook] Error processing event: [error message]
[LINE Webhook] Fatal error: [error message]
```

## Next Steps

1. Run migration: `npx supabase db push` or `npm run migrate:auto`
2. Onboard first shop using the steps above
3. Monitor logs for any issues
4. Test end-to-end flow with real LINE messages

## Notes

- The webhook uses dynamic import for `lineWebhookService` to avoid circular dependencies
- Shop-specific access tokens take precedence over global `LINE_MESSAGING_ACCESS_TOKEN`
- Welcome message template supports `{{shop_name}}` placeholder
- All conversation history is preserved in `shop_messages` table
- Owner can view and respond to LINE conversations in dashboard


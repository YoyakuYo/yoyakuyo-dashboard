# Owner AI Assistant Thread Persistence Implementation

## Overview
This document summarizes the implementation of thread persistence for the owner AI assistant, ensuring all owner conversations are saved and can be reloaded.

---

## Changes Made

### 1. API Route Updates

#### `apps/api/src/routes/owner.ts`

**Added:**
- **`GET /owner/thread`**: New endpoint to get or create owner thread for a shop
  - Verifies shop ownership
  - Finds existing owner thread (`thread_type = 'owner'`)
  - Creates new owner thread if none exists
  - Returns `threadId`

**Updated:**
- **`POST /owner/command`**: Now creates/uses owner threads and saves messages
  - Accepts optional `threadId` parameter
  - Creates or gets owner thread if `threadId` not provided
  - Saves owner message to `shop_messages` with:
    - `sender_type = 'owner'`
    - `source = 'dashboard'`
    - `thread_type = 'owner'` (via thread)
  - Saves AI response to `shop_messages` with:
    - `sender_type = 'ai'`
    - `source = 'dashboard'`
  - Returns `threadId` in response

### 2. Frontend Component Updates

#### `apps/dashboard/app/components/OwnerPowerBot.tsx`

**Added:**
- `threadId` state to track owner thread
- `loadingThread` state for initial load
- `subscriptionRef` for real-time subscription cleanup
- `loadThreadMessages()` function to load conversation history
- Real-time subscription to `shop_messages` table for live updates
- Auto-load messages when chat opens

**Updated:**
- `useEffect` for shop loading now also:
  - Gets/creates owner thread via `/owner/command`
  - Loads thread messages on mount
- `handleSend()` now:
  - Includes `threadId` in request to `/owner/command`
  - Uses optimistic UI updates (replaced by real messages via real-time)
  - Handles errors by removing optimistic messages

**Real-time Features:**
- Subscribes to `shop_messages` INSERT events for the owner thread
- Automatically adds new messages to UI
- Prevents duplicate messages
- Cleans up subscription on unmount or thread change

---

## Database Schema

Uses existing tables:
- `shop_threads`: Stores owner threads with `thread_type = 'owner'`
- `shop_messages`: Stores all messages with `source = 'dashboard'`

---

## Flow

### Initial Load
1. Component mounts → Loads shop ID
2. Gets/creates owner thread via `GET /owner/thread`
3. Loads thread messages via `GET /messages/thread/:threadId`
4. Subscribes to real-time updates

### Sending Message
1. User types message → Optimistic UI update
2. Sends to `POST /owner/command` with `threadId`
3. API saves owner message to `shop_messages`
4. API processes command/chat → Gets AI response
5. API saves AI response to `shop_messages`
6. Real-time subscription picks up both messages
7. UI updates with real messages (replaces optimistic ones)

### Real-time Updates
- Supabase real-time subscription listens for `INSERT` on `shop_messages`
- Filters by `thread_id = owner_thread_id`
- Adds new messages to UI automatically
- Prevents duplicates by checking message ID

---

## Security

- Owner thread access is restricted:
  - Only shop owners can access their threads
  - Verified via `owner_user_id` check in API
  - `thread_type = 'owner'` ensures separation from customer threads

---

## Benefits

1. **Persistence**: All owner conversations are saved and can be reloaded
2. **Real-time**: Messages appear instantly via Supabase real-time
3. **Separation**: Owner threads are completely separate from customer threads
4. **History**: Full conversation history available across sessions
5. **Backward Compatible**: Works even if thread creation fails (graceful degradation)

---

## Testing Checklist

- [ ] Owner thread is created on first use
- [ ] Owner messages are saved to database
- [ ] AI responses are saved to database
- [ ] Messages load on component mount
- [ ] Messages load when chat opens
- [ ] Real-time updates work (messages appear instantly)
- [ ] No duplicate messages appear
- [ ] Conversation history persists across page refreshes
- [ ] Only shop owner can access their thread
- [ ] Owner threads are separate from customer threads

---

## Files Modified

- `apps/api/src/routes/owner.ts`
- `apps/dashboard/app/components/OwnerPowerBot.tsx`

---

## Next Steps

1. Test the implementation with real usage
2. Verify real-time subscriptions work correctly
3. Monitor for any performance issues with large conversation histories
4. Consider adding pagination for very long conversations


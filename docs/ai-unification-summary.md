# AI Assistant Unification Summary

## Overview
Unified all AI assistant functionality into a single backend endpoint with two modes (customer/owner), and consolidated frontend components to show only one AI bubble per page type.

## Files Modified

### Backend (yoyakuyo-api)
1. **`yoyakuyo-api/src/routes/ai.ts`** (NEW)
   - Unified AI endpoint at `/ai/chat`
   - Accepts `role: "customer" | "owner"` in request body
   - Builds role-specific system prompts
   - Customer mode: Helps find shops, provides booking links, stays within Yoyaku Yo
   - Owner mode: Personal assistant, greets owner, can read bookings/schedule

2. **`yoyakuyo-api/src/index.ts`**
   - Registered new `/ai` route

### Frontend (yoyakuyo-dashboard)

#### Customer/Public AI
3. **`app/browse/components/BrowseAIAssistant.tsx`**
   - Updated to use unified `/ai/chat` endpoint with `role: "customer"`
   - Now receives context via React Context instead of direct props

4. **`app/components/BrowseAIContext.tsx`** (NEW)
   - React Context to share browse page state (shops, filters) with global AI bubble
   - Allows browse page to update global bubble's context

5. **`app/components/PublicLayoutWrapper.tsx`**
   - Mounts global `BrowseAIAssistant` bubble for ALL public pages
   - Wraps children with `BrowseAIProvider` for context sharing

6. **`app/browse/page.tsx`**
   - Removed direct `BrowseAIAssistant` component (now global)
   - Updates global bubble context via `useBrowseAIContext()`

7. **`app/shops/[id]/page.tsx`**
   - Removed inline "AI Chat Widget" block (lines 738-784)
   - Removed chat-related state: `chatMessages`, `chatInput`, `chatLoading`
   - Removed `handleChatSubmit` function
   - Removed chat messages loading useEffect

8. **`app/book/[shopId]/page.tsx`**
   - Removed "Chat with AI Assistant" block (lines 517-627)
   - Removed chat-related state and functions

#### Owner AI
9. **`app/components/OwnerAIChat.tsx`** (NEW)
   - Shared AI chat component for owners
   - Supports both bubble mode and full-page mode
   - Uses React Context (`OwnerAIChatProvider`) to share conversation state
   - Calls unified `/ai/chat` endpoint with `role: "owner"`

10. **`app/components/DashboardLayout.tsx`**
    - Wraps owner routes with `OwnerAIChatProvider`
    - Mounts `OwnerAIChat` bubble (replaces `OwnerPowerBot`)
    - Bubble appears on all owner dashboard pages

11. **`app/assistant/page.tsx`**
    - Uses `OwnerAIChat` in full-page mode
    - Shares same conversation state as bubble via `OwnerAIChatProvider`

## Where AI Bubbles Are Mounted

### Public/Customer Bubble
- **Location**: `app/components/PublicLayoutWrapper.tsx`
- **Appears on**: All public pages (landing, browse, shop detail, booking pages)
- **Context**: Receives browse page context (shops, filters) via `BrowseAIContext`
- **Endpoint**: `/ai/chat` with `role: "customer"`

### Owner Bubble
- **Location**: `app/components/DashboardLayout.tsx`
- **Appears on**: All owner dashboard pages (My Shop, Analytics, Bookings, Settings, AI Assistant page)
- **Context**: Shares conversation state with full-page AI Assistant via `OwnerAIChatProvider`
- **Endpoint**: `/ai/chat` with `role: "owner"`

## Unified AI Endpoint

**URL**: `POST /ai/chat`

**Request Body**:
```json
{
  "role": "customer" | "owner",
  "messages": [
    { "role": "user" | "assistant", "content": "..." }
  ],
  "userId": "string | null",  // Required for owner mode
  "shopContext": { "shopId": "..." },  // Optional, for owner mode
  "locale": "en" | "ja" | "ko" | "zh",  // Optional
  "prefecture": "string | null",  // Optional, for customer mode
  "category": "string | null",  // Optional, for customer mode
  "searchQuery": "string | null",  // Optional, for customer mode
  "shops": [...]  // Optional, for customer mode
}
```

**Response**:
```json
{
  "response": "AI response text",
  "locale": "en"
}
```

## Conversation State Sharing

### Owner AI
- **Bubble and full-page share conversation**: Yes
- **Mechanism**: `OwnerAIChatProvider` React Context
- **Storage**: Messages saved to `owner_ai_messages` table in database
- **Behavior**: If owner chats in bubble, then opens full-page, they see the same conversation (and vice versa)

### Customer AI
- **Conversation persistence**: Uses local state (component-level)
- **Cross-page persistence**: Not implemented (each page load starts fresh)
- **Future enhancement**: Could use localStorage or session storage for cross-page persistence

## Removed Components/UI

1. ✅ Inline "AI Chat Widget" from shop detail page (`app/shops/[id]/page.tsx`)
2. ✅ "Chat with AI Assistant" block from booking page (`app/book/[shopId]/page.tsx`)
3. ✅ Direct `BrowseAIAssistant` from browse page (now global)
4. ✅ `OwnerPowerBot` component (replaced by `OwnerAIChat`)

## Remaining "AI Assistant" Text

The following are **intentionally kept** (as per requirements):
- Sidebar menu item: "AI Assistant" (OK - navigation label)
- AI Assistant page heading: "AI Assistant" (OK - page title)
- Bubble headers: "AI Assistant" (OK - component label)

All duplicate "Chat with AI assistant" text blocks have been removed.

## System Prompts

### Customer Mode
- Role: Yoyaku Yo Customer Assistant
- Must help find shops by area/category/location
- Must provide booking links (`/shops/{shop_id}`)
- Never say "cannot make bookings"
- Never redirect to external sites
- Uses conversation memory for location preferences

### Owner Mode
- Role: Yoyaku Yo Owner Assistant (personal assistant)
- Greets owner politely ("Good morning, what can I do for you today?")
- Can read and discuss bookings/schedule
- Structure prepared for future calendar/hours modification (TODOs added)
- Never talks as if user is a customer

## Testing Checklist

- [ ] Public bubble appears on landing page
- [ ] Public bubble appears on browse page
- [ ] Public bubble appears on shop detail page
- [ ] Public bubble appears on booking page
- [ ] Public bubble uses customer mode and provides booking links
- [ ] Owner bubble appears on all dashboard pages
- [ ] Owner AI page shows same conversation as bubble
- [ ] No duplicate "Chat with AI assistant" blocks remain
- [ ] Shop detail page has no inline chat widget
- [ ] Booking page has no inline chat widget


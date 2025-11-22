# Bookyo Product Behavior Implementation Summary

## Overview
This document summarizes all changes made to implement the new public/private structure, AI assistant, booking system, and category management features.

---

## 1. Public vs Private Structure

### Public Side (No Login Required)

#### Landing Page (`/` or `/(public)/page.tsx`)
- **Location**: `apps/dashboard/app/(public)/page.tsx`
- **Features**:
  - Language selector (English/Japanese) with localStorage persistence
  - Links to browse shops and owner login
  - Clean, modern design with gradient background
- **Language Storage**: Uses `localStorage.setItem('bookyo_language', 'en' | 'ja')`

#### Public Shops Page (`/public/shops`)
- **Location**: `apps/dashboard/app/public/shops/page.tsx`
- **Features**:
  - Category tiles/buttons: Barber Shop, Hair Salon, General Salon, Nail Salon, Eyelashes, Spa & Massage, Other
  - Search bar with debounced server-side filtering
  - Paginated shop list (12 per page)
  - Category counts displayed on buttons
  - Server-side filtering by `shops.category` field and search query
  - Responsive grid layout with shop cards

#### Public Shop Detail Page (`/public/shops/[id]`)
- **Location**: `apps/dashboard/app/public/shops/[id]/page.tsx`
- **Current State**: Basic shop details, services, staff display
- **TODO**: Add booking form and chat widget (see remaining work below)

### Private Side (Owners Only, After Login)

#### Dashboard Layout
- **Sidebar**: Simplified to show only:
  - "My Shop" (`/my-shop`)
  - "AI Assistant" (`/assistant`)
  - "Logout"
- **Location**: `apps/dashboard/app/components/Sidebar.tsx`

#### My Shop Page (`/my-shop`)
- **Location**: `apps/dashboard/app/my-shop/page.tsx`
- **Features**:
  - **If user owns a shop**:
    - Tabbed interface: Overview, Services, Staff, Bookings, Photos
    - Edit shop info (name, address, phone, email, website, category, language_code)
    - View services, staff, bookings for their shop
    - Photo gallery placeholder
  - **If user doesn't own a shop**:
    - "Create New Shop" option with form
    - "Claim Existing Shop" option (placeholder for future enhancement)
  - All data filtered by `owner_user_id = current user id`

#### Root Page (`/`)
- **Location**: `apps/dashboard/app/page.tsx`
- **Behavior**: Redirects authenticated users to `/my-shop`, unauthenticated to `/(public)`

---

## 2. Categories and Search Behavior

### API Updates

#### GET /shops
- **Location**: `apps/api/src/routes/shops.ts`
- **New Query Params**:
  - `category`: Filter by `shops.category` field (e.g., 'barber_shop', 'hair_salon')
  - `search`: Server-side search by shop name (case-insensitive)
- **Batch Fetching**: Handles 2800+ shops using `.range()` to overcome Supabase 1000-row limit

#### GET /categories/public-stats
- **Location**: `apps/api/src/routes/categories.ts`
- **Returns**: Shop counts per category label
- **Format**: `{ "Barber Shop": 350, "Hair Salon": 200, "all": 2800, ... }`
- **Category Mapping**:
  - `barber_shop` → "Barber Shop"
  - `hair_salon` → "Hair Salon"
  - `general_salon` → "General Salon"
  - `nail_salon` → "Nail Salon"
  - `eyelashes` → "Eyelashes"
  - `spa_massage` → "Spa & Massage"
  - `other` → "Other"

### Frontend
- **Public Shops Page**: Server-side filtering with debounced search (500ms delay)
- **Category Filtering**: Combined with search query for efficient filtering
- **URL State**: Search and category filters reflected in URL query params

---

## 3. Public Booking + Availability + Messages

### Booking Creation
- **API**: `POST /bookings` (already supports customer info)
- **Location**: `apps/api/src/routes/bookings.ts`
- **Customer Fields Supported**:
  - `customer_name` (or `first_name` + `last_name`)
  - `customer_email`
  - `customer_phone`
  - `status` (default: 'pending')
  - `language_code` (inferred from message or UI)

### Messages API
- **Location**: `apps/api/src/routes/messages.ts`
- **Endpoints**:
  - `GET /messages?shop_id=...&booking_id=...` - Get messages for a shop/booking
  - `POST /messages` - Create a new message
- **Message Fields**:
  - `shop_id` (required)
  - `booking_id` (optional)
  - `sender_type`: 'customer' | 'ai' | 'owner'
  - `message` (required)
  - `language_code` (default: 'en')

### AI Chat Endpoint
- **Location**: `apps/api/src/routes/ai.ts`
- **Endpoint**: `POST /ai/chat`
- **Request Body**:
  ```json
  {
    "shopId": "uuid",
    "bookingId": "uuid (optional)",
    "message": "Customer message"
  }
  ```
- **Response**:
  ```json
  {
    "response": "AI reply text",
    "language_code": "en" | "ja"
  }
  ```
- **Features**:
  - Language detection (Japanese vs English)
  - Loads recent conversation history (last 10 messages)
  - Calls OpenAI API (if `OPENAI_API_KEY` is set) or returns stub response
  - System prompt enforces booking-only conversations, no pricing/revenue
  - Auto-cancels bookings when AI detects cancellation intent
  - Saves both customer and AI messages to `messages` table

---

## 4. AI Assistant Behavior

### Backend API
- **System Prompt** (English):
  > "You are Bookyo AI Assistant for a beauty/shop booking platform. You ONLY handle booking-related conversations: confirming appointments, suggesting available times, rescheduling, and accepting cancellations. You MUST NOT suggest prices, change prices, or show revenue. You MUST NOT discuss shop revenue, performance, or analytics. Always respond in the same language as the user (Japanese or English). If the user talks about something outside booking and scheduling, politely redirect them back to booking-related topics."

- **System Prompt** (Japanese):
  > Similar content in Japanese, emphasizing booking-only conversations and no pricing/revenue discussion.

### Owner Dashboard AI Assistant Page
- **Location**: `apps/dashboard/app/(owner)/assistant/page.tsx`
- **Features**:
  - Thread-based conversation UI with sidebar list of all customer conversations
  - Integrates with `/messages/owner/threads` to load all threads for owner's shops
  - Shows unread message counts per thread
  - Real-time message updates via Supabase subscriptions
  - Loads messages from `/messages/thread/:threadId` endpoint
  - Owner can send replies via `/messages/thread/:threadId/send` endpoint
  - Auto-marks messages as read when thread is opened
  - Displays customer email, booking ID, and message previews
  - Clean chat interface with message timestamps

---

## 5. Navigation and Visibility Rules

### Public Navbar
- **Visible to**: Everyone
- **Components**:
  - Logo / "Bookyo" (links to `/`)
  - "Shops" (links to `/public/shops`)
  - "Login" (links to `/login`)
  - Language selector (EN/JA toggle)

### Private Sidebar
- **Visible to**: Authenticated shop owners only
- **Components**:
  - "My Shop" (`/my-shop`)
  - "AI Assistant" (`/assistant`)
  - User email
  - "Logout" button

### Removed from Navigation
- Generic "Shops" list (owners manage via "My Shop")
- Generic "Staff" list (owners manage via "My Shop")
- Generic "Services" list (owners manage via "My Shop")
- Generic "Bookings" list (owners view via "My Shop")
- Generic "Timeslots" list (owners view via "My Shop")

---

## 6. API Endpoints Summary

### New Endpoints
1. **POST /ai/chat** - AI chat endpoint for booking conversations
2. **GET /messages** - Get messages for a shop/booking
3. **POST /messages** - Create a new message
4. **GET /categories/public-stats** - Get shop counts by category field

### Updated Endpoints
1. **GET /shops** - Added `category` query param for filtering by `shops.category` field
2. **POST /bookings** - Already supports `customer_name`, `customer_email`, `customer_phone`, `status`, `language_code`

---

## 7. Frontend Routes Summary

### New Routes
1. `/(public)/page.tsx` - Public landing page with language selector
2. `/my-shop/page.tsx` - Owner shop management page

### Updated Routes
1. `/public/shops/page.tsx` - Added categories, server-side search, pagination
2. `/app/page.tsx` - Redirects based on auth status
3. `/app/components/Sidebar.tsx` - Simplified to My Shop and AI Assistant only

### Existing Routes (Unchanged)
- `/login` - Authentication
- `/register` - Registration
- `/assistant` - AI Assistant (✅ fully integrated with messages API)
- `/public/shops/[id]` - Shop detail (needs booking form and chat widget)

---

## 8. Environment Variables

### Required
- `OPENAI_API_KEY` (optional) - For AI chat functionality. If not set, returns friendly stub response.
- `NEXT_PUBLIC_API_URL` - API base URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional) - For map previews on shop detail pages

### Existing
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for API)

---

## 9. Manual Steps Required

### Database Schema
The following fields should already exist in your database (as mentioned in the requirements):
- **shops**: `owner_user_id`, `category`, `subcategory`, `logo_url`, `cover_photo_url`, `language_code`, `claim_status`, `claimed_at`
- **services**: `description`, `duration_minutes`, `is_active`
- **staff**: `role`, `is_active`
- **bookings**: `customer_name`, `customer_email`, `customer_phone`, `status`, `notes`, `language_code`
- **timeslots**: `service_id`, `status`
- **messages**: Table for storing chat messages (with `shop_id`, `booking_id`, `sender_type`, `message`, `language_code`)

### Supabase Storage
1. **Create `shop-media` bucket**:
   - Go to Supabase Dashboard → Storage
   - Create bucket named `shop-media`
   - Set to **public** (or configure RLS policies for public read access)
   - This bucket will store shop logos, cover photos, and gallery photos

### RLS Policies
Ensure RLS policies allow:
- Public read access to shops (for public pages)
- Owners to read/write their own shop data
- Public read access to services, staff for a shop
- Owners to read messages for their shops

---

## 10. Remaining Work / TODOs

### High Priority
1. **Public Shop Detail Page** (`/public/shops/[id]/page.tsx`):
   - Add booking form (service selection, date/time picker, customer info)
   - Add chat widget (integrate with `POST /ai/chat`)
   - Show availability/timeslots for selected date
   - Display shop photos from `shop_photos` table

2. **Assistant Page** (`/assistant/page.tsx`): ✅ **COMPLETED**
   - ✅ Integrated with `/messages` API to show shop-specific conversations
   - ✅ Shows conversation threads for owner's shop(s)
   - ✅ Owner can reply manually as 'owner' sender_type
   - ✅ Real-time message updates via Supabase subscriptions
   - ✅ Unread message counts and thread management

3. **My Shop Page** (`/my-shop/page.tsx`):
   - Complete Services tab: Full CRUD for services
   - Complete Staff tab: Full CRUD for staff
   - Complete Photos tab: Upload/delete photos, gallery view
   - Add logo/cover photo upload (Supabase Storage integration)

### Medium Priority
4. **Claim Shop Flow**:
   - Add search functionality to find existing shops
   - Implement shop claiming with search and selection UI

5. **Photo Upload**:
   - Supabase Storage integration for logo/cover/gallery photos
   - Upload URL generation endpoint (`POST /shops/:id/upload-url`)

### Low Priority
6. **Language i18n**:
   - Replace hardcoded text with i18n library
   - Use `localStorage.getItem('bookyo_language')` to set UI language

---

## 11. Testing Checklist

- [ ] Public landing page loads and language selector works
- [ ] Public shops page shows all shops with categories
- [ ] Category filtering works on public shops page
- [ ] Search works on public shops page (server-side)
- [ ] Public shop detail page shows shop info, services, staff
- [ ] Booking creation works with customer info
- [ ] AI chat endpoint responds (with or without OpenAI key)
- [ ] Messages are saved to database
- [ ] Owner can log in and see "My Shop" page
- [ ] Owner can create a new shop
- [ ] Owner can edit their shop info
- [ ] Owner can view bookings for their shop
- [ ] Sidebar only shows "My Shop" and "AI Assistant"
- [ ] Root page redirects correctly based on auth status

---

## 12. Notes

- All existing API routes remain functional and are not deleted
- Database table names and columns are not changed (only new fields added as per requirements)
- Styling is consistent with existing Tailwind CSS design
- The AI system prompt strictly enforces "no pricing suggestions" and "no revenue visibility"
- Category system supports both `category_id` (foreign key) and `category` (direct field) for flexibility

---

## Summary

**Completed:**
- ✅ Public landing page with language selector
- ✅ Public shops page with categories and search
- ✅ API updates for category filtering and stats
- ✅ AI chat endpoint with OpenAI integration
- ✅ Messages API routes (thread-based system)
- ✅ Assistant page with full messages API integration
- ✅ Simplified sidebar navigation
- ✅ My Shop page (create/claim/manage)
- ✅ Root page redirects

**Remaining:**
- ⏳ Public shop detail page: booking form + chat widget
- ✅ Assistant page: integrate with messages API (COMPLETED)
- ⏳ My Shop page: complete Services/Staff/Photos tabs
- ⏳ Photo upload functionality (Supabase Storage)
- ⏳ Claim shop search functionality

All core infrastructure is in place. The remaining work is primarily UI completion and integration work.


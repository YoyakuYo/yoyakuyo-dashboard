# Unified Messaging System Implementation

## Status: IN PROGRESS

### Completed:
1. ✅ Database migration created (`20250128000000_create_unified_messaging_system.sql`)
2. ✅ Backend API routes created (`yoyakuyo-api/src/routes/conversations.ts`)
3. ✅ Routes registered in `yoyakuyo-api/src/index.ts`
4. ✅ Auto-create conversation on shop approval

### In Progress:
5. ⏳ Update Staff dashboard Messages tab
6. ⏳ Update Owner dashboard Messages tab
7. ⏳ Update Customer chat
8. ⏳ Implement realtime subscriptions
9. ⏳ Remove mock data

### Database Schema:
- `conversations` table with types: `customer_owner`, `owner_staff`, `staff_customer`
- `messages` table with sender_role: `customer`, `owner`, `staff`
- RLS policies for all three user types
- Realtime enabled on both tables

### API Endpoints:
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations` - Create conversation
- `POST /api/conversations/:id/messages` - Send message
- `PATCH /api/conversations/:id/messages/:messageId/read` - Mark as read

### Next Steps:
1. Update Staff dashboard to use `/api/conversations`
2. Update Owner dashboard to use `/api/conversations`
3. Update Customer chat to use `/api/conversations`
4. Add Supabase realtime subscriptions
5. Remove all mock/fake data


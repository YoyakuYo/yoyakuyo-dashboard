# Shop Staff Table Explanation

## What is `shop_staff`?

The `shop_staff` table is used to store **team members who work at individual shops**. This is different from:
- **Platform staff** (`staff_profiles`) - Platform administrators who review claims, handle complaints, etc.
- **Shop owners** (`owner_profiles`) - The business owners who own/claim shops

## Purpose

`shop_staff` allows shop owners to:
1. **Add team members** to their shop (managers, employees, accountants, etc.)
2. **Assign roles** to team members (owner, manager, staff, accountant)
3. **Set permissions** for what each team member can do
4. **Manage staff** who can handle bookings, reply to messages, edit services, etc.

## Intended Structure (Based on Documentation)

According to `SHOP_CREATION_AND_VERIFICATION_IMPLEMENTATION.md`, the table should have:

### Columns:
- `id` (UUID) - Primary key
- `shop_id` (UUID) - References `shops(id)`
- `user_id` (UUID) - References `users(id)` or `owner_profiles(id)` (the person's account)
- `role` (TEXT) - One of: `owner`, `manager`, `staff`, `accountant`
- `first_name` (TEXT)
- `last_name` (TEXT)
- `phone` (TEXT, nullable)
- `email` (TEXT, nullable)
- `is_active` (BOOLEAN) - Whether the staff member is currently active
- **Permissions:**
  - `can_manage_bookings` (BOOLEAN)
  - `can_reply_messages` (BOOLEAN)
  - `can_edit_services` (BOOLEAN)
  - `can_view_analytics` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Current Status

### ✅ What Exists:
- The table name `shop_staff` is referenced in the code
- API endpoint: `GET /shops/:id/staff` queries `shop_staff` table
- Frontend displays staff information on shop pages

### ⚠️ What's Missing:
- **No migration found** that actually creates the `shop_staff` table with the full structure
- The table may exist with a simpler structure (just basic fields like `first_name`, `last_name`, `phone`, `email`)
- Staff management features are currently **disabled** in the frontend

## Use Cases

1. **Multi-user Shop Management**
   - Shop owner adds a manager to help run the shop
   - Manager can handle bookings, reply to customer messages
   - Owner retains full control

2. **Role-based Access**
   - Accountant can view analytics but not edit services
   - Staff can manage bookings but not change shop settings
   - Manager has broader permissions than regular staff

3. **Staff Assignment to Bookings**
   - When customers book, they can select which staff member
   - Each staff member can have their own availability schedule
   - Bookings are linked to specific staff members

## Related Tables

- **`shop_staff_invitations`** - For inviting users to join shop teams
- **`bookings`** - Has `staff_id` field to link bookings to staff members
- **`availability`** - Could store each staff member's working hours

## Current Implementation

The code currently:
1. Fetches staff from `shop_staff` table via `/shops/:id/staff` endpoint
2. Displays staff on shop detail pages
3. **Staff management (create/update/delete) is disabled** in the frontend

## Recommendation

If you want to use `shop_staff`:
1. **Create a migration** to ensure the table exists with the proper structure
2. **Re-enable staff management** in the frontend (currently disabled)
3. **Add permissions system** if you want role-based access control
4. **Link to bookings** so customers can select staff members

If you **don't need** staff management:
- The table can remain as-is for displaying basic staff info
- Or you can remove it entirely if not needed


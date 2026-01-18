# Problem Report: WEB Customer Misclassified as LINE Customer

## Critical Issue Identified

**Customer ID**: `78fea290-ef9a-43c8-96d6-90460c04efe5`

### The Problem

This customer is **incorrectly classified** in the database:

1. **Wrong Role**: Customer has `role: "web"` in `customers` table, but:
   - Email is `line_Uf5741397f874c9a5822578e506f0cb47@line.user` (LINE email pattern)
   - Has `line_user_id: "Uf5741397f874c9a5822578e506f0cb47"` in auth metadata
   - `full_name` is set to LINE user ID: `Uf5741397f874c9a5822578e506f0cb47`

2. **Should be LINE Customer**: This is clearly a LINE customer, not a WEB customer

3. **Wrong Data in users table**: 
   - LINE customers should NOT have entries in `users` table
   - The `users` table entry has LINE email and LINE user ID as name

### Root Cause

- Customer was created/registered as LINE user
- But `customers.role` was set to `"web"` instead of `"line"`
- A `users` table entry was created (which shouldn't exist for LINE customers)
- The name was populated with LINE user ID instead of proper name

### Impact

- Shows up in WEB customers list (wrong)
- Name displays as LINE user ID (wrong)
- Booking system treats them as WEB customer (wrong)
- Should be treated as LINE customer and get name from `customer_profiles.line_display_name`

### Solution Required

1. **Fix customer role**: Change `customers.role` from `"web"` to `"line"`
2. **Remove users table entry**: LINE customers shouldn't be in `users` table
3. **Get name from customer_profiles**: Should use `customer_profiles.line_display_name` (which is "Alpha" as we saw earlier)


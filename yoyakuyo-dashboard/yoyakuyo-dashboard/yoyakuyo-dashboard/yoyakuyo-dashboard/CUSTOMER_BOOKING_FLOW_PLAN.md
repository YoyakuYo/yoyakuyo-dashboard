# Complete Customer Booking Flow - How It Works

## Overview
This document explains the complete flow of how customer bookings work, from authentication to viewing bookings, and how all the pieces fit together.

---

## Table of Contents
1. [Customer Authentication Flow](#1-customer-authentication-flow)
2. [Customer Profile System](#2-customer-profile-system)
3. [Booking Creation Flow](#3-booking-creation-flow)
4. [Booking Viewing Flow](#4-booking-viewing-flow)
5. [Notification Flow](#5-notification-flow)
6. [Database Relationships](#6-database-relationships)
7. [Troubleshooting Guide](#7-troubleshooting-guide)

---

## 1. Customer Authentication Flow

### Step 1: Customer Signs Up/Logs In
```
Customer → Frontend (useCustomAuth) → API (/auth-customers/login)
```

**What Happens:**
1. Customer enters email/password on frontend
2. Frontend calls `/auth-customers/login` API endpoint
3. API validates credentials against `customers` table
4. API creates a session and returns:
   - `customer.id` (from `customers` table)
   - `customer.email`
   - `customer.name`
   - Session token

**Result:**
- `user.id` = `customers.id` (e.g., `35f87d4d-b5c1-4e11-8684-c9c0be9cd433`)
- User object stored in localStorage
- User is now "logged in"

### Step 2: Customer Profile Lookup/Creation
```
Frontend → Check customer_profiles table → Create if missing
```

**What Happens:**
- When customer visits any customer page (bookings, notifications, favorites):
  1. Frontend gets `user.id` (which is `customers.id`)
  2. Looks up `customer_profiles` where `customer_auth_id = user.id`
  3. **If not found**: Auto-creates `customer_profile` with:
     - `customer_auth_id` = `user.id` (links to `customers.id`)
     - `email` = `user.email`
     - `name` = `user.name` or derived from email
  4. **If found**: Uses existing profile

**Result:**
- `customer_profile.id` is now available
- This ID is used for all customer-related operations

---

## 2. Customer Profile System

### Database Structure

```
customers (Auth Table)
├── id (UUID) - Primary key, used as user.id
├── email
├── name
├── password_hash
└── created_at

customer_profiles (Profile Table)
├── id (UUID) - Primary key, used for bookings/notifications
├── customer_auth_id (UUID) - Foreign key → customers.id
├── email
├── name
├── phone
└── created_at
```

### Key Relationships
- `customers.id` = Authentication ID (what `user.id` contains)
- `customer_profiles.customer_auth_id` = Links to `customers.id`
- `customer_profiles.id` = Used for bookings, notifications, favorites

### Why Two Tables?
- **`customers`**: Authentication only (login credentials)
- **`customer_profiles`**: Extended profile data (bookings, preferences, etc.)
- Separation allows: Multiple profiles per customer (if needed), better data organization

---

## 3. Booking Creation Flow

### Scenario A: Customer Books While Logged In

```
Customer → Shop Page → Fill Booking Form → Submit
```

**Step-by-Step:**

1. **Frontend (app/shops/[id]/page.tsx)**
   - Customer selects service, date, time
   - Frontend checks if `user` exists (logged in)
   - If logged in:
     - Sends `x-user-id` header = `user.id` (which is `customers.id`)
     - Sends `customer_email` = `user.email`
     - Sends `customer_name` = `user.name` or from profile

2. **Backend (yoyakuyo-api/src/routes/bookings.ts)**
   - Receives booking request with `x-user-id` header
   - **Lookup Method 1**: Find `customer_profile` where `customer_auth_id = user.id`
     ```sql
     SELECT id FROM customer_profiles 
     WHERE customer_auth_id = '35f87d4d-b5c1-4e11-8684-c9c0be9cd433'
     ```
   - **Lookup Method 2** (Fallback): Find by email
     ```sql
     SELECT id FROM customer_profiles 
     WHERE email = 'yayakuyodemo@gmail.com'
     ```
   - **Lookup Method 3** (Fallback): Check if `user.id` is directly `customer_profiles.id`
   
3. **Create Booking**
   - If `customer_profile_id` found: Set `customer_profile_id` in booking
   - If not found: Create booking without `customer_profile_id` (guest booking)
   - Booking created with:
     - `shop_id`
     - `service_id`
     - `customer_name`
     - `customer_email`
     - `customer_profile_id` (if found) ✅
     - `status` = 'pending'

4. **Create Notifications**
   - **Customer Notification**: If `customer_profile_id` exists
     - Recipient: `customer_profile_id`
     - Type: 'booking_created'
     - Message: "Your booking request has been received"
   - **Owner Notification**: If shop has owner
     - Recipient: `shop.owner_user_id`
     - Type: 'new_booking'
     - Message: "New booking request from [customer_name]"

### Scenario B: Guest Booking (Not Logged In)

**What Happens:**
1. Customer fills booking form without logging in
2. Frontend doesn't send `x-user-id` header
3. Backend creates booking with:
   - `customer_name` (from form)
   - `customer_email` (from form)
   - `customer_profile_id` = NULL (no profile linked)
4. Booking is created as "guest booking"
5. Customer can later create account and bookings can be linked via email

---

## 4. Booking Viewing Flow

### Customer Views Their Bookings

```
Customer → /customer/bookings → Frontend loads bookings
```

**Step-by-Step:**

1. **Frontend (app/customer/bookings/page.tsx)**
   - Gets `user.id` from `useCustomAuth()`
   - Looks up `customer_profile` where `customer_auth_id = user.id`
   - **If profile not found**: Auto-creates it (as explained in Section 1)

2. **Query Bookings**
   - **Query 1**: By `customer_profile_id`
     ```sql
     SELECT * FROM bookings 
     WHERE customer_profile_id = 'profile-uuid'
     ```
   - **Query 2**: By `customer_id` (legacy/fallback)
     ```sql
     SELECT * FROM bookings 
     WHERE customer_id = 'customer-uuid'
     ```
   - Combine and deduplicate results

3. **Display Bookings**
   - Show all bookings linked to customer profile
   - Filter by status (pending, confirmed, cancelled)
   - Real-time updates via Supabase Realtime subscription

---

## 5. Notification Flow

### Customer Receives Notifications

**When Notifications Are Created:**
1. **Booking Created**: When customer creates booking
2. **Booking Confirmed**: When owner confirms booking
3. **Booking Rejected**: When owner rejects booking
4. **Booking Cancelled**: When booking is cancelled

**How It Works:**

1. **Notification Creation (Backend)**
   ```typescript
   await createCustomerNotification(
     customerProfileId,  // customer_profiles.id
     'booking_created',
     'Booking Request Received',
     'Your booking request has been received...',
     { booking_id, status, shop_name, date, time }
   );
   ```

2. **Notification Storage**
   - Stored in `notifications` table:
     - `recipient_type` = 'customer'
     - `recipient_id` = `customer_profiles.id` (NOT `customers.id`)
     - `type` = 'booking_created'
     - `is_read` = false

3. **Notification Display (Frontend)**
   - Customer visits `/customer/notifications`
   - Frontend gets `customer_profile.id`
   - Queries notifications:
     ```sql
     SELECT * FROM notifications 
     WHERE recipient_type = 'customer' 
     AND recipient_id = 'customer_profile.id'
     ```

4. **Real-Time Updates**
   - Supabase Realtime subscription listens for new notifications
   - When new notification created → Frontend updates automatically
   - Notification count updates in real-time

---

## 6. Database Relationships

### Complete Relationship Map

```
┌─────────────────┐
│   customers     │ (Auth Table)
│   id (PK)       │──┐
│   email         │  │
│   name          │  │
│   password_hash │  │
└─────────────────┘  │
                     │ customer_auth_id (FK)
                     │
┌─────────────────┐  │
│customer_profiles│  │
│   id (PK)       │◄─┘
│customer_auth_id │
│   email         │
│   name          │
└─────────────────┘
         │
         │ customer_profile_id (FK)
         │
┌─────────────────┐
│    bookings     │
│   id (PK)       │
│customer_profile_id│
│customer_email   │
│customer_name    │
│   shop_id       │
│   service_id    │
│   status        │
└─────────────────┘
         │
         │ booking_id (in notification data)
         │
┌─────────────────┐
│ notifications   │
│   id (PK)       │
│recipient_type   │ ('customer')
│recipient_id     │ (customer_profiles.id)
│   type          │ ('booking_created')
│   is_read       │
└─────────────────┘
```

### Key Foreign Keys

1. **customer_profiles.customer_auth_id** → `customers.id`
   - Links profile to auth account
   - Used to find profile from `user.id`

2. **bookings.customer_profile_id** → `customer_profiles.id`
   - Links booking to customer profile
   - Used to show customer their bookings

3. **notifications.recipient_id** → `customer_profiles.id` (when recipient_type = 'customer')
   - Links notification to customer profile
   - Used to show customer their notifications

---

## 7. Troubleshooting Guide

### Problem: "Customer profile not found for user"

**Cause:**
- `customer_profiles` table doesn't have a record with `customer_auth_id = user.id`

**Solution:**
- ✅ **FIXED**: Pages now auto-create profile if missing
- Manual fix: Run SQL to create profile:
  ```sql
  INSERT INTO customer_profiles (customer_auth_id, email, name)
  SELECT id, email, name FROM customers WHERE id = 'user-id-here';
  ```

### Problem: Bookings not showing in customer dashboard

**Possible Causes:**
1. `customer_profile_id` is NULL in bookings table
2. `customer_profile_id` doesn't match customer's profile ID
3. Customer profile doesn't exist

**Solution:**
1. Check if customer profile exists:
   ```sql
   SELECT * FROM customer_profiles 
   WHERE customer_auth_id = 'user-id';
   ```
2. Check bookings:
   ```sql
   SELECT * FROM bookings 
   WHERE customer_profile_id = 'profile-id';
   ```
3. Run backfill script: `backfill_booking_customer_profiles.sql`

### Problem: Notifications not showing

**Possible Causes:**
1. `recipient_id` in notifications doesn't match `customer_profiles.id`
2. `recipient_type` is not 'customer'
3. Customer profile doesn't exist

**Solution:**
1. Check notifications:
   ```sql
   SELECT * FROM notifications 
   WHERE recipient_type = 'customer' 
   AND recipient_id = 'profile-id';
   ```
2. Verify customer profile exists
3. Check notification creation code uses `customer_profiles.id`

### Problem: Bookings created but customer_profile_id is NULL

**Possible Causes:**
1. `x-user-id` header not sent from frontend
2. Lookup failed (customer_auth_id mismatch)
3. Customer profile doesn't exist

**Solution:**
1. Check server logs for lookup messages
2. Verify `x-user-id` header is sent (check Network tab)
3. Verify `customer_auth_id` matches `user.id`:
   ```sql
   SELECT * FROM customer_profiles 
   WHERE customer_auth_id = 'user-id-from-header';
   ```
4. Run backfill script to link existing bookings

---

## 8. Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER BOOKING FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   Customer Login
   ↓
   user.id = customers.id
   ↓
   Check customer_profiles WHERE customer_auth_id = user.id
   ↓
   [If not found] → Auto-create customer_profile
   ↓
   customer_profile.id available

2. BOOKING CREATION
   Customer fills booking form
   ↓
   Frontend sends: x-user-id header = user.id
   ↓
   Backend receives booking request
   ↓
   Lookup customer_profile WHERE customer_auth_id = x-user-id
   ↓
   [If found] → Set customer_profile_id in booking
   [If not found] → Try email lookup
   [If still not found] → Create booking without profile_id
   ↓
   Booking created with customer_profile_id (if found)
   ↓
   Create customer notification (if profile_id exists)
   ↓
   Create owner notification

3. VIEWING BOOKINGS
   Customer visits /customer/bookings
   ↓
   Get customer_profile WHERE customer_auth_id = user.id
   ↓
   Query bookings WHERE customer_profile_id = profile.id
   ↓
   Display bookings to customer
   ↓
   Real-time subscription for updates

4. NOTIFICATIONS
   Booking status changes
   ↓
   Create notification WHERE recipient_id = customer_profile.id
   ↓
   Customer sees notification in /customer/notifications
   ↓
   Real-time subscription for new notifications
```

---

## 9. Best Practices

### ✅ DO:
- Always check if `customer_profile` exists before using it
- Auto-create profile if missing (now implemented)
- Use `customer_profiles.id` for all customer-related operations
- Send `x-user-id` header from frontend when user is logged in
- Use email fallback if `customer_auth_id` lookup fails
- Log all lookup attempts for debugging

### ❌ DON'T:
- Don't use `customers.id` directly for bookings/notifications
- Don't assume `customer_profile` exists
- Don't create bookings without trying to link profile
- Don't forget to handle guest bookings (no profile)

---

## 10. Testing Checklist

### Test Scenarios:

1. **New Customer Signs Up**
   - [ ] Customer can sign up
   - [ ] Customer profile is created automatically
   - [ ] Customer can create booking
   - [ ] Booking has `customer_profile_id` set
   - [ ] Customer sees booking in dashboard

2. **Existing Customer Logs In**
   - [ ] Customer can log in
   - [ ] Customer profile is found (not recreated)
   - [ ] Customer can create booking
   - [ ] Booking is linked to existing profile

3. **Guest Booking**
   - [ ] Guest can create booking without login
   - [ ] Booking created with `customer_profile_id = NULL`
   - [ ] Guest can later create account
   - [ ] Existing bookings can be linked via email

4. **Notifications**
   - [ ] Customer receives notification when booking created
   - [ ] Customer receives notification when booking confirmed
   - [ ] Notifications appear in real-time
   - [ ] Notification count updates automatically

5. **Viewing Bookings**
   - [ ] Customer sees all their bookings
   - [ ] Bookings filter by status works
   - [ ] Real-time updates work
   - [ ] Bookings from before profile creation are visible (if linked)

---

## Summary

**The Flow Works Like This:**

1. **Customer logs in** → `user.id` = `customers.id`
2. **Profile lookup/creation** → `customer_profiles.customer_auth_id` = `customers.id`
3. **Booking creation** → `bookings.customer_profile_id` = `customer_profiles.id`
4. **Viewing bookings** → Query by `customer_profile_id`
5. **Notifications** → `notifications.recipient_id` = `customer_profiles.id`

**Key Point:** 
- `user.id` (from frontend) = `customers.id` (auth table)
- `customer_profiles.customer_auth_id` links to `customers.id`
- `customer_profiles.id` is used for everything else (bookings, notifications, favorites)

This separation allows the system to work with both authenticated customers and guest bookings, while maintaining a clean data structure.


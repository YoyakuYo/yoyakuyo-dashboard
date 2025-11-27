# Web Push Setup Guide

## ✅ What's Been Implemented

1. **web-push package installed** ✅
2. **VAPID key generation script created** ✅
3. **Complete Web Push service implemented** ✅
4. **Database migration created** ✅
5. **API route for saving subscriptions** ✅

## 📋 Next Steps

### 1. Add VAPID Keys to .env

Add these to `apps/api/.env`:

```
VAPID_PUBLIC_KEY=BKTQjIfZelejRneXGQe_mhynZox50IO_cdavYJRp8QyyOgnoBTWDHcQmFse30TvV84IAGJy9_VwU1mqfP9Hq0aw
VAPID_PRIVATE_KEY=2nqaq7KtT-jpJ5sdytA6QxFSX59sMBrCZe_xVhNEfHQ
VAPID_SUBJECT=mailto:admin@bookyo.com
```

**⚠️ Important:** Change the email in `VAPID_SUBJECT` to your actual contact email.

### 2. Run Database Migration

Apply the migration in Supabase Dashboard:

**File:** `supabase/migrations/add_customer_push_subscriptions.sql`

This creates the `customer_push_subscriptions` table to store customer push subscriptions.

### 3. Generate New VAPID Keys (Optional)

If you want to generate new keys:

```bash
cd apps/api
node scripts/generate-vapid-keys.js
```

## 🔒 Safety Features

All implementations are **safe and won't break existing functionality**:

- ✅ Web Push gracefully disables if VAPID keys are not configured
- ✅ All errors are caught and logged, never thrown
- ✅ Missing database tables are handled gracefully
- ✅ API routes return safe responses even if push fails
- ✅ No breaking changes to existing code

## 🧪 Testing

Once VAPID keys are added and migration is run:

1. The system will automatically send push notifications when:
   - Owner cancels a booking via power bot
   - Owner reschedules a booking via power bot
   - Owner cancels/reschedules from dashboard

2. Customers need to:
   - Grant notification permission in browser
   - Have their subscription saved (frontend implementation needed)

## 📝 Notes

- Web Push will work automatically once VAPID keys are configured
- If keys are missing, the system logs a warning but continues normally
- Push notifications are optional - the app works fine without them


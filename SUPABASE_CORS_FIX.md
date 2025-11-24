# Fix Supabase CORS Error

## Problem
You're getting a CORS error when trying to authenticate from `https://yoyakuyo-dashboard.vercel.app`:
```
Access to fetch at 'https://neguwrjykwnfhdlwktpd.supabase.co/auth/v1/token?grant_type=password' 
from origin 'https://yoyakuyo-dashboard.vercel.app' has been blocked by CORS policy
```

## Solution: Configure Supabase Authentication URLs

You need to add your Vercel domain to Supabase's allowed URLs. Follow these steps:

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `neguwrjykwnfhdlwktpd`

### Step 2: Configure Authentication Settings
1. Navigate to **Authentication** → **URL Configuration** (or **Settings** → **Authentication**)
2. Find the **Site URL** field
3. Set it to: `https://yoyakuyo-dashboard.vercel.app`

### Step 3: Add Redirect URLs
In the **Redirect URLs** section, add these URLs (one per line):
```
https://yoyakuyo-dashboard.vercel.app
https://yoyakuyo-dashboard.vercel.app/login
https://yoyakuyo-dashboard.vercel.app/reset-password
http://localhost:3001
http://localhost:3001/login
http://localhost:3001/reset-password
```

### Step 4: Save and Wait
- Click **Save**
- Wait 1-2 minutes for changes to propagate
- Try logging in again

## Alternative: If URL Configuration Doesn't Work

If the above doesn't work, try these additional steps:

### Check API Settings
1. Go to **Settings** → **API**
2. Look for **CORS** or **Allowed Origins** settings
3. Add: `https://yoyakuyo-dashboard.vercel.app`

### Verify Environment Variables
Make sure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://neguwrjykwnfhdlwktpd.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)

## Why This Happens
Supabase restricts which domains can make authentication requests for security. By default, it only allows requests from the configured Site URL. When you deploy to a new domain (Vercel), you need to explicitly allow it.

## Testing
After making changes:
1. Wait 1-2 minutes
2. Clear your browser cache
3. Try logging in again
4. Check browser console for any remaining errors


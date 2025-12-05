# CORS Fix Instructions

## Issue
CORS errors blocking requests from `https://yoyakuyo-dashboard.vercel.app` to:
1. Supabase Auth: `neguwrjykwnfhdlwktpd.supabase.co`
2. API: `yoyakuyo-api.onrender.com`

## Fix 1: Supabase CORS Configuration (REQUIRED)

### Steps:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `neguwrjykwnfhdlwktpd`
3. Navigate to **Settings** → **API**
4. Scroll down to **CORS Configuration**
5. Add the following URL to the **Allowed Origins** list:
   ```
   https://yoyakuyo-dashboard.vercel.app
   ```
6. Also add (for preview deployments):
   ```
   https://*.vercel.app
   ```
7. Click **Save**

### Alternative: Use Supabase CLI
```bash
supabase projects update neguwrjykwnfhdlwktpd \
  --allowed-origins "https://yoyakuyo-dashboard.vercel.app,https://*.vercel.app"
```

## Fix 2: API CORS (Already Configured)

The API CORS is already configured in `yoyakuyo-api/src/index.ts` to allow:
- `https://yoyakuyo-dashboard.vercel.app`
- All `*.vercel.app` domains

### If API still has CORS issues:
1. **Restart the Render service:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Find your `yoyakuyo-api` service
   - Click **Manual Deploy** → **Deploy latest commit**

2. **Check API logs:**
   - In Render dashboard, check logs for CORS-related messages
   - Look for: `✅ CORS allowed for Vercel origin` or `❌ CORS blocked origin`

## Fix 3: Verify Environment Variables

### On Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Ensure these are set:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://neguwrjykwnfhdlwktpd.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
   - `NEXT_PUBLIC_API_URL` = `https://yoyakuyo-api.onrender.com`

### On Render (API):
1. Go to Render Dashboard → Your Service → Environment
2. Ensure:
   - `FRONTEND_URL` = `https://yoyakuyo-dashboard.vercel.app`
   - `NODE_ENV` = `production`

## Testing

After applying fixes:

1. **Clear browser cache** or use incognito mode
2. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check browser console** - CORS errors should be gone
4. **Test authentication** - login should work
5. **Test API calls** - categories, shops should load

## Common Issues

### Issue: "No 'Access-Control-Allow-Origin' header"
- **Cause:** Supabase CORS not configured
- **Fix:** Add Vercel URL to Supabase allowed origins (Fix 1)

### Issue: "Preflight request doesn't pass"
- **Cause:** OPTIONS request not handled properly
- **Fix:** API CORS middleware should handle this (already configured)

### Issue: API works locally but not on Vercel
- **Cause:** Environment variables not set on Vercel
- **Fix:** Verify all env vars are set (Fix 3)

## Verification Queries

After fixes, test these endpoints:

```bash
# Test API CORS
curl -H "Origin: https://yoyakuyo-dashboard.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://yoyakuyo-api.onrender.com/health \
     -v

# Should return: Access-Control-Allow-Origin: https://yoyakuyo-dashboard.vercel.app
```


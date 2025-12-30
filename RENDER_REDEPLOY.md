# How to Redeploy API on Render

## ✅ Yes, You Should Redeploy!

We've fixed several critical issues:
- ✅ Removed duplicate `/favorites` route
- ✅ Fixed route ordering (`/bookings` now before parameterized routes)
- ✅ Fixed TypeScript compilation errors
- ✅ All code pushed to GitHub

## Option 1: Manual Redeploy (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Find your API service** (likely named `yoyaku-yo-api` or `yoyakuyo-api`)
3. **Click on the service** to open it
4. **Click "Manual Deploy"** button (top right)
5. **Select "Deploy latest commit"** or choose the latest commit from `main` branch
6. **Wait for deployment** (usually 2-5 minutes)

## Option 2: Auto-Deploy (If Enabled)

If auto-deploy is enabled, Render should automatically redeploy when you push to `main` branch. However, you can:

1. **Check if auto-deploy is enabled**:
   - Go to your service → Settings → Build & Deploy
   - Look for "Auto-Deploy" setting

2. **If auto-deploy is ON**: 
   - It should already be deploying (check the "Events" tab)
   - If not, use Option 1 (Manual Deploy)

3. **If auto-deploy is OFF**:
   - Use Option 1 (Manual Deploy)
   - Or enable auto-deploy in Settings

## Option 3: Clear Build Cache & Redeploy

If deployment fails or you want a fresh build:

1. Go to your service → Settings → Build & Deploy
2. Click "Clear build cache"
3. Then use Option 1 (Manual Deploy)

## Verify Deployment

After redeploying, check:

1. **Build Logs**: Should show successful TypeScript compilation
2. **Runtime Logs**: Should show `✅ Yoyaku Yo API running on port 10000`
3. **Test Endpoint**: 
   ```bash
   curl https://yoyakuyo-api.onrender.com
   ```
   Should return: `Yoyaku Yo API running!`

4. **Test Bookings Endpoint**:
   ```bash
   curl https://yoyakuyo-api.onrender.com/customers/bookings/health
   ```
   Should return: `{"status":"ok","message":"Bookings endpoint is available"}`

## Common Issues

### Build Fails with TypeScript Errors
- Check build logs for specific errors
- Most errors should be fixed, but some in `subscriptions.ts` may remain (non-critical)
- The API should still start even with those warnings

### Service Won't Start
- Check runtime logs for errors
- Verify environment variables are set correctly
- Check that `PORT` is set (Render uses port 10000 by default)

### 404 on `/customers/bookings`
- Wait a few minutes after deployment (Render can be slow)
- Check that the route is in the build logs
- Verify the service is actually running (check runtime logs)

## Quick Checklist

- [ ] Code pushed to GitHub (`main` branch)
- [ ] Manual deploy triggered in Render
- [ ] Build completed successfully
- [ ] Service is running (green status)
- [ ] Test endpoint works: `https://yoyakuyo-api.onrender.com`
- [ ] Test bookings health: `https://yoyakuyo-api.onrender.com/customers/bookings/health`

## Expected Build Command

Render should run:
```bash
cd apps/api && npm install && npm run build
```

## Expected Start Command

Render should run:
```bash
cd apps/api && npm start
```

The server will use `PORT` environment variable (defaults to 10000 on Render).


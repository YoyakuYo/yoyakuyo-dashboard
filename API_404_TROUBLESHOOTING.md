# API 404 Error Troubleshooting Guide

## Problem
Getting `404 (Not Found)` errors for:
- `https://yoyakuyo-api.onrender.com/customers/bookings`
- `https://yoyakuyo-api.onrender.com/customers/favorites`

## Solution Steps

### 1. Check if API is Running
Test these endpoints in your browser or with curl:

```bash
# General health check
curl https://yoyakuyo-api.onrender.com/health

# Should return: {"status":"ok","service":"yoyaku-yo-api"}

# Test customers router
curl https://yoyakuyo-api.onrender.com/customers/test

# Should return: {"status":"ok","message":"Customers router is working",...}
```

### 2. Redeploy API on Render

1. Go to https://dashboard.render.com
2. Find your `yoyaku-yo-api` service
3. Click on it to open the service dashboard
4. Click **"Manual Deploy"** → **"Deploy latest commit"**
5. Wait 2-5 minutes for deployment to complete
6. Check the **"Logs"** tab to see if deployment was successful

### 3. Verify Deployment

After redeploying, check the logs for:
- ✅ `Yoyaku Yo API running on port 10000`
- ✅ No TypeScript compilation errors
- ✅ No startup errors

### 4. Test Endpoints Again

After redeployment, test:
```bash
# Health check
curl https://yoyakuyo-api.onrender.com/health

# Customers test
curl https://yoyakuyo-api.onrender.com/customers/test

# Bookings health check
curl https://yoyakuyo-api.onrender.com/customers/bookings/health
```

### 5. Check Render Environment Variables

Make sure these are set in Render:
- `NODE_ENV=production`
- `PORT=10000`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- All other required env vars

### 6. Check Build Configuration

Verify `render.yaml` has correct paths:
```yaml
buildCommand: cd apps/api && npm install && npm run build
startCommand: cd apps/api && npm start
```

## If Still Getting 404

1. **Check Render Logs** - Look for routing errors or startup failures
2. **Verify Route Registration** - Routes should be in `apps/api/src/index.ts`:
   ```typescript
   app.use("/customers", customers);
   ```
3. **Check Build Output** - Ensure `dist/` folder contains compiled JavaScript
4. **Restart Service** - In Render dashboard, click "Restart" button

## Diagnostic Endpoints Added

The following test endpoints have been added to help diagnose:

- `GET /health` - General API health check
- `GET /customers/test` - Verify customers router is working
- `GET /customers/bookings/health` - Verify bookings endpoint is accessible

Use these to verify routing is working before testing the actual endpoints.


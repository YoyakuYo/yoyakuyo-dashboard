# Diagnose 404 Error for /customers/bookings

## Current Status
- Route is correctly defined in code: `router.get('/bookings', ...)`
- Route is before parameterized routes (correct order)
- Router is exported: `export default router;`
- Router is mounted: `app.use("/customers", customers);`
- Render was deployed 1 minute ago
- Still getting 404 error

## Immediate Checks

### 1. Check Render Build Logs
Go to Render Dashboard → Your API Service → Logs → Build Logs

Look for:
- ✅ "Build successful" message
- ✅ TypeScript compilation completed
- ❌ Any TypeScript errors
- ❌ "Cannot find module" errors
- ❌ Build failures

### 2. Check Render Runtime Logs
Go to Render Dashboard → Your API Service → Logs → Runtime Logs

Look for:
- Route registration messages
- "Server started" messages
- Any errors during startup
- "Cannot GET" errors

### 3. Test These Endpoints (in browser or curl)

```bash
# 1. Health check (should work)
curl https://yoyakuyo-api.onrender.com/health

# 2. Customers test (should work if router is mounted)
curl https://yoyakuyo-api.onrender.com/customers/test

# 3. Bookings health (should work if route exists)
curl https://yoyakuyo-api.onrender.com/customers/bookings/health

# 4. Bookings endpoint (should return 401, not 404)
curl https://yoyakuyo-api.onrender.com/customers/bookings
```

### 4. Verify Service Status
- Check if service shows "Live" status
- Check if service restarted after deployment
- Check service uptime

## Possible Causes

1. **Build Failed Silently**
   - TypeScript compilation error
   - Missing dependencies
   - Check build logs

2. **Service Didn't Restart**
   - Old code still running
   - Manual restart needed

3. **Route Not Registered**
   - Syntax error preventing route registration
   - Check runtime logs for errors

4. **Caching Issue**
   - Browser/CDN caching old 404
   - Try incognito mode or clear cache

## Quick Fixes to Try

1. **Force Restart Service**:
   - Render Dashboard → Your Service → Manual Deploy → Deploy latest commit
   - Or click "Restart" button

2. **Check if dist/server.js exists**:
   - If build failed, `dist/server.js` might not exist
   - Check build logs

3. **Verify Route in Compiled Code**:
   - The route should be in `apps/api/dist/routes/customers.js`
   - Check if file exists and contains the route

4. **Test Locally**:
   ```bash
   cd apps/api
   npm run build
   npm start
   # Then test: curl http://localhost:PORT/customers/bookings
   ```

## Next Steps

1. Check Render build logs for errors
2. Check Render runtime logs for route registration
3. Test `/customers/test` endpoint (should work)
4. If `/customers/test` works but `/customers/bookings` doesn't, there's a route-specific issue
5. If both fail, the router isn't being mounted correctly


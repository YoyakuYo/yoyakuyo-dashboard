# Test API Endpoints After Deployment

## Test These Endpoints (in order):

1. **Health Check** (should work):
   ```
   GET https://yoyakuyo-api.onrender.com/health
   ```
   Expected: `{ status: "ok", service: "yoyaku-yo-api" }`

2. **Customers Router Test** (should work):
   ```
   GET https://yoyakuyo-api.onrender.com/customers/test
   ```
   Expected: `{ status: "ok", message: "Customers router is working", ... }`

3. **Bookings Health Check** (should work):
   ```
   GET https://yoyakuyo-api.onrender.com/customers/bookings/health
   ```
   Expected: `{ status: "ok", message: "Bookings endpoint is available" }`

4. **Bookings Endpoint** (should return 401 without auth):
   ```
   GET https://yoyakuyo-api.onrender.com/customers/bookings
   ```
   Expected: `401 Unauthorized` (not 404!)

## If Still Getting 404:

1. **Check Render Logs**:
   - Go to Render Dashboard → Your API Service → Logs
   - Look for:
     - Build errors
     - Route registration messages
     - "Cannot GET /customers/bookings" errors
     - Any TypeScript compilation errors

2. **Check if Route is Registered**:
   - Look for console logs showing route registration
   - Check if there are any middleware errors

3. **Verify Build Succeeded**:
   - Check Render build logs for TypeScript compilation
   - Ensure `npm run build` completed successfully

4. **Check API is Running**:
   - Verify the service shows "Live" status on Render
   - Check if the service restarted after deployment

## Common Issues:

- **Route not exported**: Check `export default router;` at end of file
- **Route order**: Parameterized routes catching requests (but `/bookings` is before `/:id` routes, so should be fine)
- **Build failed**: TypeScript errors preventing deployment
- **Service not restarted**: Old code still running


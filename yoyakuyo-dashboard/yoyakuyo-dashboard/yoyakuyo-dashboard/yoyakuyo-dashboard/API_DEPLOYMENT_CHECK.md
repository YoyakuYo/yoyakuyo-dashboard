# API Deployment Check for /customers/bookings Endpoint

## Issue
Frontend is getting `404 (Not Found)` when calling `https://yoyakuyo-api.onrender.com/customers/bookings`

## Root Cause
The API on Render hasn't been redeployed with the latest code that includes the `/customers/bookings` endpoint.

## Solution: Redeploy API on Render

### Step 1: Verify Route Exists in Code
The route is correctly defined in `apps/api/src/routes/customers.ts`:
- Route: `GET /customers/bookings`
- Mounted at: `/customers` in `apps/api/src/index.ts`
- Full path: `https://yoyakuyo-api.onrender.com/customers/bookings`

### Step 2: Redeploy on Render
1. Go to Render Dashboard: https://dashboard.render.com
2. Find your API service (`yoyakuyo-api`)
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete (check logs)

### Step 3: Verify Deployment
After deployment, test these endpoints:

```bash
# Health check
curl https://yoyakuyo-api.onrender.com/health

# Test customers router
curl https://yoyakuyo-api.onrender.com/customers/test

# Test bookings endpoint (should return 401 without auth)
curl https://yoyakuyo-api.onrender.com/customers/bookings
```

### Step 4: Check API Logs
If still 404, check Render logs for:
- Route registration errors
- Build errors
- Runtime errors

## Expected Behavior After Deployment

1. **Health Check**: `GET /health` → `{ status: "ok" }`
2. **Test Endpoint**: `GET /customers/test` → `{ status: "ok", message: "Customers router is working" }`
3. **Bookings Endpoint**: 
   - Without `x-user-id` header → `401 Unauthorized`
   - With valid `x-user-id` header → `200 OK` with bookings array

## Current Route Definition

```typescript
// apps/api/src/routes/customers.ts
router.get('/bookings', async (req: Request, res: Response) => {
  // ... implementation
});
```

Mounted in `apps/api/src/index.ts`:
```typescript
app.use("/customers", customers);
```

Full endpoint: `GET /customers/bookings`

## Troubleshooting

If 404 persists after redeployment:

1. **Check Render build logs** - Ensure TypeScript compilation succeeded
2. **Check Render runtime logs** - Look for route registration messages
3. **Verify environment variables** - Ensure all required env vars are set
4. **Test locally** - Run `npm run dev` in `apps/api` and test `http://localhost:PORT/customers/bookings`


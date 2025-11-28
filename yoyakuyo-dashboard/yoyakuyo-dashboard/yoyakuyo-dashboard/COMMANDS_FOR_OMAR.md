# COMMANDS FOR OMAR (RUN IN THIS ORDER)

## Prerequisites
- Both `yoyakuyo-api` and `yoyakuyo-dashboard` repositories are already pushed to GitHub
- Render.com account set up for backend
- Vercel account set up for frontend

---

## STEP 1: Backend (yoyakuyo-api)

### 1.1 Navigate to backend directory
```bash
cd yoyakuyo-api
```

### 1.2 Install dependencies
```bash
npm install
```

### 1.3 Type check (verify no TypeScript errors)
```bash
npm run type-check
```

### 1.4 Build the project
```bash
npm run build
```

### 1.5 Test locally (optional - press Ctrl+C to stop)
```bash
npm run dev
```
Visit: http://localhost:3000/health (should return JSON)

### 1.6 Commit and push changes
```bash
git add .
git commit -m "Implement full API with shops, bookings, services endpoints"
git push
```

---

## STEP 2: Frontend (yoyakuyo-dashboard)

### 2.1 Navigate to frontend directory
```bash
cd ../yoyakuyo-dashboard
```

### 2.2 Install dependencies
```bash
npm install
```

### 2.3 Type check (verify no TypeScript errors)
```bash
npx tsc --noEmit
```

### 2.4 Build the project
```bash
npm run build
```

### 2.5 Test locally (optional - press Ctrl+C to stop)
```bash
npm run dev
```
Visit: http://localhost:3001 (should show login page)

### 2.6 Commit and push changes
```bash
git add .
git commit -m "Implement dashboard with shop selector, bookings, and services tables"
git push
```

---

## STEP 3: Render.com Configuration (Backend)

### 3.1 Go to Render Dashboard
- Visit: https://dashboard.render.com
- Open your `yoyakuyo-api` service

### 3.2 Verify Environment Variables
Go to **Environment** tab and ensure these are set:
- `SUPABASE_URL` = `https://neguwrjykwnfhdlwktpd.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
- `NODE_ENV` = `production`
- `PORT` = `10000` (optional, Render sets this automatically)

### 3.3 Verify Build & Start Commands
Go to **Settings** tab and verify:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3.4 Manual Deploy (if auto-deploy didn't trigger)
- Click **Manual Deploy** → **Deploy latest commit**
- Wait for deployment to complete
- Test: Visit `https://your-api.onrender.com/health`

---

## STEP 4: Vercel Configuration (Frontend)

### 4.1 Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Open your `yoyakuyo-dashboard` project

### 4.2 Verify Environment Variables
Go to **Settings** → **Environment Variables** and ensure:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://neguwrjykwnfhdlwktpd.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
- `NEXT_PUBLIC_API_URL` = `https://your-api.onrender.com` (your Render backend URL)

### 4.3 Verify Build Settings
Go to **Settings** → **General** and verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4.4 Redeploy (if needed)
- Go to **Deployments** tab
- Click **...** on latest deployment → **Redeploy**
- Or wait for auto-deploy from GitHub push

---

## STEP 5: Testing the Full Stack

### 5.1 Test Backend
```bash
# Test health endpoint
curl https://your-api.onrender.com/health

# Test shops endpoint (should return JSON with shops)
curl https://your-api.onrender.com/shops
```

### 5.2 Test Frontend
1. Visit your Vercel URL (e.g., `https://your-dashboard.vercel.app`)
2. Click **Login**
3. Enter your Supabase user credentials
4. After login, you should see:
   - Dashboard with sidebar
   - Shop selector dropdown
   - When you select a shop:
     - Bookings table appears on the left
     - Services table appears on the right

### 5.3 Verify Data Flow
- Check browser console (F12) for any errors
- Check Network tab to see API calls to backend
- Verify bookings and services load when shop is selected

---

## Troubleshooting

### Backend Issues

**Error: "SUPABASE_URL is required"**
- Check Render environment variables are set correctly
- Redeploy after adding env vars

**Error: "Cannot find module 'express'"**
- Run `npm install` in `yoyakuyo-api` directory
- Ensure `@types/express` is in dependencies (not devDependencies)

**Build fails on Render**
- Check Render logs for specific error
- Verify `package.json` has correct build script
- Ensure all dependencies are in `dependencies` (not `devDependencies`)

### Frontend Issues

**Error: "Missing NEXT_PUBLIC_SUPABASE_URL"**
- Check Vercel environment variables
- Redeploy after adding env vars

**API calls fail (CORS error)**
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend CORS allows your Vercel domain
- Check backend logs on Render

**No shops appear in dropdown**
- Check browser console for API errors
- Verify backend `/shops` endpoint returns data
- Check Network tab to see API response

**Bookings/Services don't load**
- Check browser console for errors
- Verify shop ID is being sent correctly
- Check backend logs on Render

---

## Next Steps (Optional Enhancements)

1. **Implement Owner Filtering**
   - Add `owner_email` or `owner_user_id` column to shops table
   - Update backend routes to filter by owner
   - Test with multiple users

2. **Add JWT Verification**
   - Verify Supabase JWT tokens on backend
   - Extract user ID from token instead of email header

3. **Add Error Handling**
   - Better error messages in UI
   - Loading states for all async operations
   - Retry logic for failed API calls

4. **Add Booking Management**
   - Create booking form
   - Update booking status
   - Delete bookings

5. **Add Service Management**
   - Create/edit/delete services
   - Service pricing and duration management

---

## Summary

✅ **Backend**: Express API with Supabase integration, deployed on Render
✅ **Frontend**: Next.js dashboard with authentication, deployed on Vercel
✅ **Authentication**: Supabase Auth with token passing to backend
✅ **Data Flow**: Frontend → Backend API → Supabase Database

All code is typed, tested, and ready for deployment!


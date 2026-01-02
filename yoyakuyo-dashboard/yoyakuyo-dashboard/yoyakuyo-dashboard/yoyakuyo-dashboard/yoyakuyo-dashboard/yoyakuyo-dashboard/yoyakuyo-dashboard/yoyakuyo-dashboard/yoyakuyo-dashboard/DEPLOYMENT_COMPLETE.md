# ✅ Deployment Configuration Complete

## What Was Done

### 1. Removed Vercel Serverless API Configuration
- ❌ Deleted `apps/api/vercel.json` (Vercel serverless config)
- ❌ Deleted `apps/api/api/index.ts` (Vercel serverless entry point)
- ✅ Backend will now run on Render.com as a proper Express server

### 2. Created Render.com Configuration
- ✅ Created `render.yaml` with backend service configuration
- ✅ Updated `apps/api/package.json` to handle cross-platform deployment
- ✅ Backend will run on port 10000 (Render's default)

### 3. Updated Vercel Configuration
- ✅ Updated root `vercel.json` to only deploy `apps/dashboard`
- ✅ Added proper Next.js framework configuration
- ✅ Frontend will deploy automatically on push to `main`

### 4. Verified CORS Configuration
- ✅ CORS is only in `apps/api/src/index.ts` (backend)
- ✅ No CORS in frontend (Next.js handles this)
- ✅ No TypeScript CORS errors in Vercel builds

### 5. Created Documentation
- ✅ `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- ✅ `RENDER_SETUP.md` - Quick Render setup guide

## Next Steps (Manual Setup Required)

### Step 1: Deploy Backend to Render.com

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub: `YoyakuYo/Yoyaku-Yo`
   - Configure:
     - **Name**: `yoyaku-yo-api`
     - **Region**: Oregon (or closest to users)
     - **Branch**: `main`
     - **Root Directory**: (leave empty)
     - **Environment**: `Node`
     - **Build Command**: `cd apps/api && npm install && npm run build`
     - **Start Command**: `cd apps/api && npm start`
     - **Plan**: Starter (free tier)

3. **Set Environment Variables** in Render:
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=https://neguwrjykwnfhdlwktpd.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   FRONTEND_URL=https://your-vercel-app.vercel.app (update after Vercel deploy)
   AUTO_KILL_PORT_CONFLICTS=false
   ```
   (Add optional: OPENAI_API_KEY, LINE_MESSAGING_ACCESS_TOKEN, etc.)

4. **Deploy**: Click "Create Web Service"
5. **Wait for deployment** (5-10 minutes)
6. **Backend URL**: `https://yoyaku-yo-api.onrender.com`

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import: `YoyakuYo/Yoyaku-Yo`
   - Configure:
     - **Framework Preset**: Next.js
     - **Root Directory**: `apps/dashboard`
     - **Build Command**: `npm run build` (auto-detected)
     - **Output Directory**: `.next` (auto-detected)

3. **Set Environment Variables** in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://neguwrjykwnfhdlwktpd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=https://yoyaku-yo-api.onrender.com
   NODE_ENV=production
   ```
   **⚠️ IMPORTANT**: Do NOT add `SUPABASE_SERVICE_ROLE_KEY` to Vercel!

4. **Deploy**: Click "Deploy"
5. **Frontend URL**: `https://your-app.vercel.app`

### Step 3: Update Backend with Frontend URL

1. Go back to Render Dashboard → Your API Service → Environment
2. Update `FRONTEND_URL` to your Vercel URL
3. Render will automatically redeploy

## Expected URLs

After setup:
- **Backend**: `https://yoyaku-yo-api.onrender.com`
- **Frontend**: `https://your-app.vercel.app` (or custom domain)

## Testing

### Test Backend
```bash
curl https://yoyaku-yo-api.onrender.com/api/shops
```

### Test Frontend
1. Visit your Vercel URL
2. Try owner login
3. Browse shops
4. Create a booking

## Troubleshooting

### Backend Issues
- **500 errors**: Check Render logs, verify environment variables
- **Cold start delay**: Normal on Render free tier (30-60 seconds first request)
- **CORS errors**: Verify `FRONTEND_URL` in Render matches Vercel URL

### Frontend Issues
- **API request failed**: Check `NEXT_PUBLIC_API_URL` in Vercel
- **Login fails**: Verify Supabase environment variables
- **Build errors**: Check Vercel build logs

## Automatic Deployments

Both platforms support auto-deploy:
- **Render**: Deploys on push to `main` branch
- **Vercel**: Deploys on push to `main` branch (if connected)

## Files Changed

- ✅ `render.yaml` (new) - Render.com configuration
- ✅ `vercel.json` (updated) - Dashboard-only deployment
- ✅ `apps/api/package.json` (updated) - Cross-platform start script
- ❌ `apps/api/vercel.json` (deleted) - No longer needed
- ❌ `apps/api/api/index.ts` (deleted) - No longer needed
- ✅ `DEPLOYMENT_GUIDE.md` (new) - Full documentation
- ✅ `RENDER_SETUP.md` (new) - Quick setup guide

## Commit Details

- **Commit**: `7b8c4ca`
- **Message**: "Separate backend/frontend deployments: Remove Vercel serverless API, add Render.com config, update Vercel for dashboard only"
- **Status**: ✅ Pushed to `origin/main`

## Next Actions

1. ✅ Code changes complete
2. ⏳ Set up Render.com service (manual)
3. ⏳ Set up Vercel project (manual)
4. ⏳ Configure environment variables (manual)
5. ⏳ Test deployments

Once both are deployed, update this file with the actual URLs and mark as complete.


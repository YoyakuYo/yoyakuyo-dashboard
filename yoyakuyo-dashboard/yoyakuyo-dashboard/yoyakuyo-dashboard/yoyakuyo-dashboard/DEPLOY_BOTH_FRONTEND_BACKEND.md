# Deploy Both Frontend & Backend

## 🚀 Deployment Instructions

### Backend (Render)

#### Option 1: Auto-Deploy (if connected to GitHub)
1. **Check if auto-deploy is enabled:**
   - Go to **Render Dashboard** → Your API service
   - Check **Settings** → **Auto-Deploy** should be enabled
   - If enabled, Render should automatically deploy when you push to `main` branch

2. **Verify deployment:**
   - Go to **Deploys** tab
   - Look for latest deploy triggered by your recent push
   - Status should show "Live" when complete

#### Option 2: Manual Deploy
1. Go to **Render Dashboard** → Your API service
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Wait 2-5 minutes for deployment to complete
5. Check **Logs** tab to verify deployment succeeded

#### Verify Backend Deployment
- Check **Logs** tab for: `Server running on port...`
- Verify the commit hash matches your latest push
- Test API endpoint: `https://your-api.onrender.com/health` (if available)

---

### Frontend (Vercel)

#### Option 1: Auto-Deploy (if connected to GitHub)
1. **Check if auto-deploy is enabled:**
   - Go to **Vercel Dashboard** → Your project
   - Check **Settings** → **Git** → **Production Branch** should be `main`
   - If enabled, Vercel should automatically deploy when you push to `main` branch

2. **Verify deployment:**
   - Go to **Deployments** tab
   - Look for latest deployment triggered by your recent push
   - Status should show "Ready" when complete

#### Option 2: Manual Deploy
1. Go to **Vercel Dashboard** → Your project
2. Click **"Deployments"** tab
3. Click **"..."** (three dots) on latest deployment
4. Select **"Redeploy"** → **"Use existing Build Cache"** (optional)
5. Wait 2-5 minutes for deployment to complete

#### Verify Frontend Deployment
- Check deployment status shows "Ready"
- Visit your production URL to verify site loads
- Check browser console for any errors

---

## 📋 Deployment Checklist

### Before Deploying
- [x] ✅ Backend code fixed (removed `file_url` from insert)
- [x] ✅ Frontend code fixed (uses authenticated Supabase client)
- [x] ✅ All changes committed and pushed to GitHub
- [x] ✅ Database schema verified (table has correct columns)

### After Backend Deployment
- [ ] Backend logs show "Server running"
- [ ] API responds to health check (if available)
- [ ] No errors in Render logs

### After Frontend Deployment
- [ ] Frontend builds successfully
- [ ] Site loads without errors
- [ ] No console errors in browser

### Final Test
- [ ] Try uploading a verification document
- [ ] Verify upload succeeds
- [ ] Check document appears in database

---

## 🔍 Troubleshooting

### Backend Not Deploying
- Check Render Dashboard → **Events** tab for errors
- Verify GitHub connection is active
- Check if build is failing (see **Logs** tab)

### Frontend Not Deploying
- Check Vercel Dashboard → **Deployments** tab for errors
- Verify GitHub connection is active
- Check build logs for errors

### Still Getting `file_url` Error After Deployment
1. **Verify backend is actually deployed:**
   - Check Render logs for latest commit hash
   - Compare with your GitHub commit hash

2. **Refresh PostgREST schema cache:**
   - Supabase Dashboard → **API** → **Settings**
   - Click **"Reload Schema"**
   - Wait 30 seconds

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

## 🎯 Quick Deploy Commands (if using CLI)

### Backend (Render CLI - if installed)
```bash
# Not typically used - Render auto-deploys from GitHub
# But you can trigger via Render Dashboard
```

### Frontend (Vercel CLI - if installed)
```bash
cd /path/to/frontend
vercel --prod
```

---

## 📝 Notes

- **Backend**: Usually auto-deploys from GitHub on Render
- **Frontend**: Usually auto-deploys from GitHub on Vercel
- **Deployment time**: 2-5 minutes each
- **Total time**: ~5-10 minutes for both

---

## ✅ Success Indicators

### Backend
- ✅ Render shows "Live" status
- ✅ Logs show "Server running on port..."
- ✅ API responds to requests

### Frontend
- ✅ Vercel shows "Ready" status
- ✅ Site loads without errors
- ✅ No console errors

### Combined
- ✅ Document upload works
- ✅ No `file_url` column errors
- ✅ No RLS policy violations


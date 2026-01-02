# 🚀 DEPLOYMENT COMMANDS

**Date:** 2025-01-23  
**Note:** Always run frontend and backend commands separately

---

## 📦 FRONTEND DEPLOYMENT (Vercel)

### Step 1: Navigate to frontend directory
```bash
cd yoyakuyo-dashboard
```

### Step 2: Stage frontend changes
```bash
git add lib/supabase.ts app/login/page.tsx app/dashboard/page.tsx lib/useAuth.tsx
```

### Step 3: Commit frontend changes
```bash
git commit -m "Fix login: improve Supabase client initialization and standardize usage"
```

### Step 4: Push to repository
```bash
git push origin main
```

**Note:** Vercel will automatically deploy when you push to main branch.

---

## 🔧 BACKEND DEPLOYMENT (Render)

### Step 1: Navigate to backend directory
```bash
cd yoyakuyo-api
```

### Step 2: Stage backend changes (if any)
```bash
git add src/index.ts
```

### Step 3: Commit backend changes
```bash
git commit -m "Verify CORS configuration for Vercel frontend"
```

### Step 4: Push to repository
```bash
git push origin main
```

**Note:** Render will automatically deploy when you push to main branch.

---

## ✅ VERIFICATION AFTER DEPLOYMENT

### Frontend (Vercel)
1. Go to Vercel Dashboard → Your Project
2. Check latest deployment status
3. Verify environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`

### Backend (Render)
1. Go to Render Dashboard → Your Service
2. Check latest deployment status
3. Verify environment variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL` (optional)

---

## 🧪 TEST AFTER DEPLOYMENT

1. **Test Login:**
   - Go to `https://yoyakuyo-dashboard.vercel.app/login`
   - Try logging in with `omar.sowbarca45@gmail.com`
   - Check browser console for errors

2. **Check Browser Console:**
   - Should see "✅ Supabase client initialized successfully" (in dev mode)
   - No "No API key found" errors
   - No placeholder client warnings

3. **Verify Session:**
   - Login should redirect to dashboard
   - Refresh page, should stay logged in
   - Logout should clear session

---

## 📝 REMEMBER

**Always run frontend and backend commands separately!**

- Frontend commands: `cd yoyakuyo-dashboard` first
- Backend commands: `cd yoyakuyo-api` first
- Never mix frontend and backend in same commit/push

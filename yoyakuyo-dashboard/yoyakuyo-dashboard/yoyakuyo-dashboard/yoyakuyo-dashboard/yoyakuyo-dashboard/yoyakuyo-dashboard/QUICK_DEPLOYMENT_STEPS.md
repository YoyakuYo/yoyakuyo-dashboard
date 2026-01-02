# 🚀 Quick Deployment Steps

## ✅ Completed Automatically

1. ✅ Git repository initialized
2. ✅ `.gitignore` configured
3. ✅ `vercel.json` configured with correct settings
4. ✅ Initial commit created

---

## 📋 Manual Steps Required

### Step 1: Create GitHub Repository (5 minutes)

1. Go to https://github.com/new
2. Repository name: `yoyaku-yo`
3. Description: "AI-powered booking assistant for salons in Japan"
4. Visibility: **Private** (recommended)
5. **DO NOT** check "Initialize with README"
6. Click **"Create repository"**

### Step 2: Push to GitHub

Run these commands in your terminal:

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/yoyaku-yo.git

# Push to GitHub
git push -u origin main
```

### Step 3: Connect to Vercel (5 minutes)

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository (`yoyaku-yo`)
5. Click **"Import"**

### Step 4: Configure Vercel Settings

**IMPORTANT**: Set Root Directory manually!

1. In Vercel project settings, go to **"Settings"** → **"General"**
2. Scroll to **"Root Directory"**
3. Click **"Edit"**
4. Enter: `apps/dashboard`
5. Click **"Save"**

Verify these settings:
- ✅ Framework Preset: `Next.js`
- ✅ Root Directory: `apps/dashboard`
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `.next`

### Step 5: Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

#### For Production, Preview, and Development:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app
```

#### For Production Only:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these values:**
- Check `apps/dashboard/.env.local` for Supabase values
- Check `apps/api/.env` for API values

### Step 6: Deploy

1. After adding environment variables, go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger automatic deployment

---

## 🎉 After Deployment

Your production URL will be:
- `https://yoyaku-yo.vercel.app` (or your custom domain)

**Verify:**
- ✅ Production URL is accessible
- ✅ Login works
- ✅ Supabase connection works
- ✅ API calls work

---

## 📚 Full Documentation

See `DEPLOYMENT_SETUP.md` for detailed instructions and troubleshooting.


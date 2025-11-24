# Yoyaku Yo - Automated Deployment Setup Guide

This guide will help you set up automated deployments for the Yoyaku Yo project using GitHub and Vercel.

---

## ✅ Step 1: Git Repository Initialized

The Git repository has been initialized. Next steps:

### 1.1 Add all files to Git

```bash
git add .
```

### 1.2 Create initial commit

```bash
git commit -m "Initial commit: Yoyaku Yo monorepo setup"
```

---

## 📦 Step 2: Create GitHub Repository

### 2.1 Create a new repository on GitHub

1. Go to [GitHub](https://github.com/new)
2. Repository name: `yoyaku-yo` (or your preferred name)
3. Description: "AI-powered booking assistant for salons in Japan"
4. Visibility: **Private** (recommended) or **Public**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### 2.2 Connect local repository to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/yoyaku-yo.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## 🚀 Step 3: Connect to Vercel

### 3.1 Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository (`yoyaku-yo`)
5. Click **"Import"**

### 3.2 Configure Project Settings

Vercel should auto-detect Next.js, but verify these settings:

- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/dashboard` ⚠️ **IMPORTANT: Set this manually**
- **Build Command**: `npm run build` (auto-detected, but verify)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

**To set Root Directory:**
1. In Vercel project settings, go to **"Settings"** → **"General"**
2. Scroll to **"Root Directory"**
3. Click **"Edit"**
4. Enter: `apps/dashboard`
5. Click **"Save"**

---

## 🔐 Step 4: Environment Variables

### 4.1 Required Environment Variables

Add these in Vercel → **Settings** → **Environment Variables**:

#### For **Production**, **Preview**, and **Development**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app
```

#### For **Production Only**:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4.2 How to Add Environment Variables in Vercel

1. Go to your project in Vercel
2. Click **"Settings"** → **"Environment Variables"**
3. For each variable:
   - Click **"Add New"**
   - Enter the **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the **Value** (from your `.env.local` file)
   - Select environments: **Production**, **Preview**, **Development** (or just **Production** for service role key)
   - Click **"Save"**

### 4.3 Get Your Environment Variable Values

Check your local `.env.local` files:
- `apps/dashboard/.env.local` - Contains dashboard environment variables
- `apps/api/.env` - Contains API environment variables

**Important**: Make sure `NEXT_PUBLIC_API_URL` points to your deployed API URL (if you have a separate API deployment) or use a relative path.

---

## 🎯 Step 5: Deploy

### 5.1 Automatic Deployment

Once connected to GitHub, Vercel will automatically deploy:
- **Every push to `main` branch** → Production deployment
- **Every push to other branches** → Preview deployment
- **Every pull request** → Preview deployment

### 5.2 Manual Deployment

To trigger a deployment manually:

1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Or push a new commit to trigger automatic deployment

### 5.3 First Deployment

After setting up:
1. Push your code to GitHub (if not already done)
2. Vercel will automatically detect the push and start building
3. Monitor the deployment in Vercel Dashboard
4. Once complete, you'll get a production URL (e.g., `https://yoyaku-yo.vercel.app`)

---

## 📋 Verification Checklist

After deployment, verify:

- [ ] ✅ Git repository initialized and pushed to GitHub
- [ ] ✅ Vercel project connected to GitHub repository
- [ ] ✅ Root directory set to `apps/dashboard`
- [ ] ✅ All environment variables added to Vercel
- [ ] ✅ Production deployment successful
- [ ] ✅ Production URL accessible
- [ ] ✅ Login functionality works on production
- [ ] ✅ Supabase connection works on production

---

## 🔧 Troubleshooting

### Build Fails

**Issue**: Build command fails
**Solution**: 
- Check Root Directory is set to `apps/dashboard`
- Verify `package.json` exists in `apps/dashboard`
- Check build logs in Vercel for specific errors

### Environment Variables Not Working

**Issue**: App works locally but not in production
**Solution**:
- Verify all `NEXT_PUBLIC_*` variables are set in Vercel
- Check that variables are set for **Production** environment
- Redeploy after adding new environment variables

### API URL Issues

**Issue**: API calls fail in production
**Solution**:
- Set `NEXT_PUBLIC_API_URL` to your production API URL
- If API is on Vercel, use the Vercel deployment URL
- Ensure CORS is configured correctly in your API

---

## 📝 Next Steps After Deployment

1. **Update API URL**: If your API is deployed separately, update `NEXT_PUBLIC_API_URL` in Vercel
2. **Configure Custom Domain**: Add your custom domain in Vercel → Settings → Domains
3. **Set up Monitoring**: Enable Vercel Analytics and Error Tracking
4. **Configure Webhooks**: Set up webhooks for CI/CD if needed

---

## 🎉 Success!

Once deployment completes, you'll have:
- ✅ Automated deployments on every push
- ✅ Preview deployments for pull requests
- ✅ Production URL (e.g., `https://yoyaku-yo.vercel.app`)
- ✅ Environment variables securely stored in Vercel

Your production URL will be shown in the Vercel Dashboard after the first successful deployment.


# YoyakuYo Full-Stack Setup Instructions

## Project Structure

```
root/
├── yoyakuyo-api/              # Backend API (Express + TypeScript + Supabase)
│   ├── src/
│   │   ├── index.ts          # Express app entry point
│   │   ├── lib/
│   │   │   └── supabase.ts  # Supabase client (Service Role Key)
│   │   └── routes/
│   │       ├── health.ts     # GET /health
│   │       ├── shops.ts     # GET /shops
│   │       ├── bookings.ts  # GET, POST /bookings
│   │       └── services.ts  # GET /services
│   ├── package.json
│   ├── tsconfig.json
│   ├── .gitignore
│   ├── .env.example
│   └── README.md
│
└── yoyakuyo-dashboard/        # Frontend Dashboard (Next.js + TypeScript + Supabase)
    ├── app/
    │   ├── page.tsx          # Home: "Salon Dashboard"
    │   ├── login/
    │   │   └── page.tsx      # Login placeholder
    │   └── layout.tsx
    ├── lib/
    │   └── supabase.ts       # Supabase client (ANON_KEY)
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── .gitignore
    ├── .env.example
    └── README.md
```

---

## Commands for Omar to Run Manually (in order)

### Step 1: Install Backend Dependencies

```bash
cd yoyakuyo-api
npm install
```

This will install:
- express
- @supabase/supabase-js
- cors
- dotenv
- TypeScript and type definitions

### Step 2: Create Backend Environment File

```bash
cd yoyakuyo-api
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
NODE_ENV=development
```

### Step 3: Test Backend Build

```bash
cd yoyakuyo-api
npm run build
```

This should compile TypeScript to JavaScript in the `dist/` folder.

### Step 4: Test Backend Locally (Optional)

```bash
cd yoyakuyo-api
npm run dev
```

The API should start on `http://localhost:3000`. Test with:
- `curl http://localhost:3000/health` (should return `{"status":"ok","message":"API running"}`)

Press `Ctrl+C` to stop the server.

### Step 5: Install Frontend Dependencies

```bash
cd yoyakuyo-dashboard
npm install
```

This will install:
- next
- react
- react-dom
- @supabase/supabase-js
- TypeScript and type definitions

### Step 6: Create Frontend Environment File

```bash
cd yoyakuyo-dashboard
cp .env.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 7: Test Frontend Build

```bash
cd yoyakuyo-dashboard
npm run build
```

This should build the Next.js application successfully.

### Step 8: Test Frontend Locally (Optional)

```bash
cd yoyakuyo-dashboard
npm run dev
```

The app should start on `http://localhost:3000`. Visit:
- `http://localhost:3000` - Should show "Salon Dashboard"
- `http://localhost:3000/login` - Should show login form

Press `Ctrl+C` to stop the server.

### Step 9: Initialize Git for Backend

```bash
cd yoyakuyo-api
git init
git add .
git commit -m "Initial commit: Backend API setup"
```

### Step 10: Initialize Git for Frontend

```bash
cd yoyakuyo-dashboard
git init
git add .
git commit -m "Initial commit: Frontend Dashboard setup"
```

### Step 11: Create GitHub Repositories (Manual)

1. Go to https://github.com/new
2. Create repository: `yoyakuyo-api`
3. Create repository: `yoyakuyo-dashboard`

### Step 12: Push Backend to GitHub

```bash
cd yoyakuyo-api
git remote add origin https://github.com/YOUR_USERNAME/yoyakuyo-api.git
git branch -M main
git push -u origin main
```

### Step 13: Push Frontend to GitHub

```bash
cd yoyakuyo-dashboard
git remote add origin https://github.com/YOUR_USERNAME/yoyakuyo-dashboard.git
git branch -M main
git push -u origin main
```

---

## Deployment Commands

### Backend Deployment to Render.com

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub and select `yoyakuyo-api` repository
4. Configure:
   - **Name**: `yoyakuyo-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter (free)
5. Set Environment Variables:
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Service Role Key
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
6. Click "Create Web Service"

### Frontend Deployment to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import `yoyakuyo-dashboard` repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (project root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
5. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your ANON Key
   - `NEXT_PUBLIC_API_URL` = Your Render backend URL (e.g., `https://yoyakuyo-api.onrender.com`)
6. Click "Deploy"

---

## Environment Variables Summary

### Backend (yoyakuyo-api)

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (server-side only) | Yes |
| `SUPABASE_ANON_KEY` | ANON Key (optional, if needed) | No |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

### Frontend (yoyakuyo-dashboard)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ANON Key (safe for client) | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

⚠️ **CRITICAL**: Never put `SUPABASE_SERVICE_ROLE_KEY` in the frontend!

---

## Verification Checklist

After running all commands, verify:

### Backend
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts server on port 3000
- [ ] `GET /health` returns `{"status":"ok","message":"API running"}`
- [ ] `.env` file exists with correct Supabase credentials
- [ ] Git repository initialized and committed

### Frontend
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts app on port 3000
- [ ] Home page shows "Salon Dashboard"
- [ ] Login page renders correctly
- [ ] `.env.local` file exists with correct Supabase credentials
- [ ] Git repository initialized and committed

---

## Troubleshooting

### Backend Issues

**Error: "SUPABASE_URL is required"**
- Solution: Create `.env` file from `.env.example` and add your Supabase URL

**Error: "Cannot find module"**
- Solution: Run `npm install` in `yoyakuyo-api/` directory

**Port already in use**
- Solution: Change `PORT` in `.env` to a different port (e.g., 3001)

### Frontend Issues

**Error: "Missing NEXT_PUBLIC_SUPABASE_URL"**
- Solution: Create `.env.local` file from `.env.example` and add your Supabase credentials

**Build fails**
- Solution: Check that all dependencies are installed with `npm install`

**TypeScript errors**
- Solution: Run `npm run type-check` (if available) or check `tsconfig.json`

---

## Next Steps

1. ✅ Complete all setup commands above
2. ✅ Test both projects locally
3. ✅ Push to GitHub
4. ⏳ Deploy backend to Render.com
5. ⏳ Deploy frontend to Vercel
6. ⏳ Update frontend `NEXT_PUBLIC_API_URL` with Render backend URL
7. ⏳ Test end-to-end functionality

---

## Support

If you encounter issues:
1. Check the README.md files in each project
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check Supabase project settings and database tables exist


# New Full-Stack Architecture Plan for YoyakuYo

## Overview

Create two separate, independent projects:
1. **yoyakuyo-api** - Backend API (Node.js + Express + Supabase)
2. **yoyakuyo-dashboard** - Frontend Dashboard (Next.js + Supabase Client)

## Project Structure

```
root/
├── yoyakuyo-api/          # Backend API project
│   ├── src/
│   │   ├── index.ts       # Express app entry point
│   │   ├── routes/         # API routes
│   │   │   ├── shops.ts
│   │   │   ├── bookings.ts
│   │   │   ├── services.ts
│   │   │   └── health.ts
│   │   └── lib/
│   │       └── supabase.ts # Supabase client (Service Role)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .gitignore
│   └── README.md
│
└── yoyakuyo-dashboard/    # Frontend Dashboard project
    ├── app/
    │   ├── page.tsx        # Home screen "Salon Dashboard"
    │   ├── login/
    │   │   └── page.tsx    # Login/auth placeholder
    │   └── layout.tsx
    ├── lib/
    │   └── supabase.ts     # Supabase client (ANON_KEY)
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    ├── .env.example
    ├── .gitignore
    └── README.md
```

---

## 1️⃣ Backend API (yoyakuyo-api)

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Service Role Key (server-side only)

### Required Endpoints

#### `/health` (GET)
- Returns: `{ status: "ok", message: "API running" }`
- Purpose: Health check endpoint

#### `/shops` (GET)
- Returns: List of shops from Supabase
- Uses: Supabase Service Role client

#### `/bookings` (GET, POST)
- GET: Fetch bookings
- POST: Create new booking
- Uses: Supabase Service Role client

#### `/services` (GET)
- Returns: List of services
- Uses: Supabase Service Role client

### File Structure

```
yoyakuyo-api/
├── src/
│   ├── index.ts                    # Main Express app
│   ├── routes/
│   │   ├── health.ts               # /health endpoint
│   │   ├── shops.ts                # /shops endpoints
│   │   ├── bookings.ts             # /bookings endpoints
│   │   └── services.ts             # /services endpoints
│   └── lib/
│       └── supabase.ts             # Supabase admin client
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

### Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.81.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.19",
    "@types/node": "^20",
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1"
  }
}
```

### Environment Variables (.env.example)

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Key Features
- ✅ Express server with TypeScript
- ✅ CORS enabled
- ✅ Supabase Service Role client (bypasses RLS)
- ✅ Health check endpoint
- ✅ RESTful API endpoints
- ✅ Environment variable configuration
- ✅ TypeScript compilation

---

## 2️⃣ Frontend Dashboard (yoyakuyo-dashboard)

### Technology Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (optional)
- **Database**: Supabase Client (ANON_KEY only)
- **Authentication**: Supabase Auth (client-side)

### Required Pages

#### Home Screen (`/`)
- Title: "Salon Dashboard"
- Welcome message
- Basic dashboard layout

#### Login/Auth Placeholder (`/login`)
- Login form placeholder
- Supabase Auth integration (ready for implementation)

### File Structure

```
yoyakuyo-dashboard/
├── app/
│   ├── page.tsx                    # Home: "Salon Dashboard"
│   ├── login/
│   │   └── page.tsx                # Login placeholder
│   └── layout.tsx                  # Root layout
├── lib/
│   └── supabase.ts                 # Supabase client (ANON_KEY)
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

### Dependencies

```json
{
  "dependencies": {
    "next": "latest",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.81.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
```

### Environment Variables (.env.example)

```env
# Supabase Configuration (Client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Key Features
- ✅ Next.js App Router
- ✅ TypeScript
- ✅ Supabase client (ANON_KEY only)
- ✅ Home dashboard screen
- ✅ Login placeholder page
- ✅ Environment variable configuration

---

## Implementation Steps

### Phase 1: Backend API Setup

1. **Create project directory**
   ```bash
   mkdir yoyakuyo-api
   cd yoyakuyo-api
   ```

2. **Initialize npm and install dependencies**
   ```bash
   npm init -y
   npm install express @supabase/supabase-js cors dotenv
   npm install -D @types/express @types/cors @types/node typescript ts-node
   ```

3. **Create TypeScript configuration**
   - `tsconfig.json` with proper compiler options

4. **Create source files**
   - `src/index.ts` - Express app setup
   - `src/lib/supabase.ts` - Supabase admin client
   - `src/routes/health.ts` - Health endpoint
   - `src/routes/shops.ts` - Shops endpoints
   - `src/routes/bookings.ts` - Bookings endpoints
   - `src/routes/services.ts` - Services endpoints

5. **Create configuration files**
   - `.env.example` - Environment template
   - `.gitignore` - Git ignore rules
   - `README.md` - Documentation

6. **Test locally**
   ```bash
   npm run dev
   curl http://localhost:3000/health
   ```

### Phase 2: Frontend Dashboard Setup

1. **Create Next.js project**
   ```bash
   npx create-next-app@latest yoyakuyo-dashboard --typescript --app --no-tailwind
   cd yoyakuyo-dashboard
   ```

2. **Install Supabase client**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Create source files**
   - `app/page.tsx` - Home dashboard screen
   - `app/login/page.tsx` - Login placeholder
   - `lib/supabase.ts` - Supabase client setup

4. **Create configuration files**
   - `.env.example` - Environment template
   - `README.md` - Documentation

5. **Test locally**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

### Phase 3: Git Initialization

1. **Initialize git for backend**
   ```bash
   cd yoyakuyo-api
   git init
   git add .
   git commit -m "Initial commit: Backend API setup"
   ```

2. **Initialize git for frontend**
   ```bash
   cd yoyakuyo-dashboard
   git init
   git add .
   git commit -m "Initial commit: Frontend Dashboard setup"
   ```

3. **Create GitHub repositories** (manual step)
   - Create `yoyakuyo-api` repository
   - Create `yoyakuyo-dashboard` repository
   - Push code to respective repositories

### Phase 4: Documentation

1. **Backend README.md**
   - Project description
   - Setup instructions
   - Environment variables
   - Local development
   - Render.com deployment guide

2. **Frontend README.md**
   - Project description
   - Setup instructions
   - Environment variables
   - Local development
   - Vercel deployment guide

---

## Security Considerations

### Backend (yoyakuyo-api)
- ✅ **ONLY** use `SUPABASE_SERVICE_ROLE_KEY` (never expose to client)
- ✅ Server-side only environment variables
- ✅ CORS configured for frontend domain
- ✅ No client-side Supabase keys

### Frontend (yoyakuyo-dashboard)
- ✅ **ONLY** use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for client)
- ✅ **NEVER** include `SUPABASE_SERVICE_ROLE_KEY` in frontend
- ✅ Client-side Supabase client for auth and queries
- ✅ API calls to backend for admin operations

---

## Deployment Targets

### Backend: Render.com
- **Service Type**: Web Service
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js
- **Port**: 10000 (Render default)

### Frontend: Vercel
- **Framework**: Next.js
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Root Directory**: `.` (project root)

---

## Testing Checklist

### Backend API
- [ ] `/health` returns `{ status: "ok", message: "API running" }`
- [ ] `/shops` returns shops from Supabase
- [ ] `/bookings` GET returns bookings
- [ ] `/bookings` POST creates booking
- [ ] `/services` returns services
- [ ] TypeScript compiles without errors
- [ ] Server starts on port 3000 locally

### Frontend Dashboard
- [ ] Home page shows "Salon Dashboard"
- [ ] Login page renders correctly
- [ ] Supabase client initializes
- [ ] Next.js builds successfully
- [ ] No TypeScript errors
- [ ] App runs on port 3000 locally

---

## Next Steps After Implementation

1. ✅ Both projects build and run locally
2. ✅ Git repositories initialized
3. ⏳ Create GitHub repositories
4. ⏳ Push code to GitHub
5. ⏳ Deploy backend to Render.com
6. ⏳ Deploy frontend to Vercel
7. ⏳ Configure environment variables
8. ⏳ Test end-to-end functionality

---

## Notes

- **No auto-deployment**: Git repos initialized but not connected to deployment platforms yet
- **Separate projects**: Each project is independent with its own git repository
- **Clean architecture**: Simple, focused structure for easy maintenance
- **Production-ready**: Includes all necessary configuration for deployment


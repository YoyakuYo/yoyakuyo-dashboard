# YoyakuYo Dashboard

Frontend dashboard for the YoyakuYo booking application built with Next.js, TypeScript, and Supabase.

## Features

- ✅ Next.js App Router
- ✅ TypeScript for type safety
- ✅ Supabase client integration (ANON_KEY only)
- ✅ Home dashboard screen
- ✅ Login/auth placeholder page

## Pages

- `/` - Home screen showing "Salon Dashboard"
- `/login` - Login/auth placeholder page

## Setup

### Prerequisites

- Node.js 18+ installed
- Supabase project with authentication enabled

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd yoyakuyo-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

## Environment Variables

| Variable | Description | Required |
|-----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase ANON Key (safe for client-side) | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

⚠️ **IMPORTANT**: Only use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the frontend. Never include `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

## Deployment to Vercel

1. **Create a new project** on Vercel
2. **Import your GitHub repository**
3. **Configure the project:**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (project root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Set Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase ANON Key
   - `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://yoyakuyo-api.onrender.com`)

5. **Deploy**: Click "Deploy"

Your dashboard will be available at: `https://your-project.vercel.app`

## Security Notes

✅ **Safe**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to use in client-side code. It respects Row Level Security (RLS) policies.

❌ **Never**: Do not include `SUPABASE_SERVICE_ROLE_KEY` in frontend code. This key bypasses RLS and should only be used in server-side code (backend API).

## License

ISC

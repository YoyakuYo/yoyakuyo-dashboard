# Yoyaku Yo - Booking Management System

A full-stack booking management system built with Express.js, Next.js, and Supabase.

## Tech Stack

- **Backend API**: Express.js + TypeScript
- **Frontend Dashboard**: Next.js 13+ (App Router) + React + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Package Management**: npm workspaces (monorepo)

## Project Structure

```
yoyaku-yo/
├── apps/
│   ├── api/              # Express.js API server
│   │   └── src/
│   │       ├── routes/   # API route handlers
│   │       ├── lib/      # Utilities (Supabase client)
│   │       └── types.ts  # TypeScript types
│   └── dashboard/        # Next.js dashboard application
│       └── app/          # Next.js app directory
├── packages/
│   ├── shared/           # Shared TypeScript types
│   └── ui/               # Shared UI components
└── supabase/
    └── schema.sql        # Database schema
```

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

#### API Server (`apps/api/.env`)

Create `apps/api/.env` with the following variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3000

# Google Calendar OAuth (optional - for calendar integration)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
FRONTEND_URL=http://localhost:3001
```

You can copy `apps/api/.env.example` and fill in your values.

**For Google Calendar setup instructions, see `GOOGLE_CALENDAR_SETUP.md`**

#### Dashboard (`apps/dashboard/.env.local`)

The dashboard uses the following environment variable (already configured):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Set Up Database

Run the SQL schema in your Supabase project:

```bash
# Copy the contents of supabase/schema.sql and run it in your Supabase SQL editor
```

The schema includes tables for:
- `shops` - Business locations
- `services` - Services offered by shops
- `customers` - Customer information
- `staff` - Staff members
- `bookings` - Appointment bookings
- `availability` - Staff availability schedules
- `line_accounts` - LINE bot account associations

### 4. Run Development Servers

#### Start API Server

```bash
npm run dev:api
```

The API will run on `http://localhost:3000`

**Note:** Port conflicts are automatically handled!
- Running `npm start` automatically kills any existing Node.js process on port 3000 before starting
- The server also detects port conflicts and shows helpful error messages if needed
- No manual intervention required - just run `npm start` and it works!

#### Start Dashboard

**For Development:**
```bash
npm run dev:dashboard
```

**For Production:**
```bash
cd apps/dashboard
npm run build  # Build first
npm start      # Then start
```

The dashboard will run on `http://localhost:3001`

**Note:** The `npm start` command now automatically checks if a production build exists and provides helpful error messages if you need to build first.

## Available Scripts

### Root Level

- `npm run dev:api` - Start API development server
- `npm run dev:dashboard` - Start dashboard development server
- `npm run build:api` - Build API for production
- `npm run build:dashboard` - Build dashboard for production
- `npm run build` - Build both applications

### API (`apps/api`)

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server (automatically kills any Node.js process on port 3000 first)
- `npm run kill-port` - Manually kill any Node.js process using port 3000

### Dashboard (`apps/dashboard`)

- `npm run dev` - Start Next.js development server on port 3001
- `npm run build` - Build for production (required before `npm start`)
- `npm start` - Start production server on port 3001 (checks for build first)
- `npm run start:dev` - Alias for `npm run dev`
- `npm run lint` - Run ESLint

## API Endpoints

### Shops
- `GET /shops` - List all shops
- `POST /shops` - Create a shop
- `GET /shops/:id` - Get shop details with services and staff
- `GET /shops/:shopId/services` - Get services for a shop
- `POST /shops/:shopId/services` - Create a service for a shop
- `GET /shops/:shopId/staff` - Get staff for a shop
- `POST /shops/:shopId/staff` - Create staff member for a shop
- `GET /shops/:shopId/availability?date=YYYY-MM-DD` - Get availability for a date

### Services
- `GET /services` - List all services
- `POST /services` - Create a service
- `GET /services/:id` - Get a service

### Staff
- `GET /staff` - List all staff
- `POST /staff` - Create a staff member
- `GET /staff/:id` - Get a staff member

### Bookings
- `GET /bookings` - List all bookings
- `POST /bookings` - Create a booking (automatically creates/finds customer)
- `GET /bookings/:id` - Get a booking

### Clients (Customers)
- `GET /clients` - List all customers
- `POST /clients` - Create a customer
- `GET /clients/:id` - Get a customer

### Timeslots (Availability)
- `GET /timeslots` - List all availability records
- `POST /timeslots` - Create availability record
- `GET /timeslots/:id` - Get an availability record

## Features

- **Shop Management**: Create and manage multiple business locations
- **Service Management**: Define services with pricing and duration
- **Staff Management**: Add staff members to shops
- **Availability Scheduling**: Set staff availability by day of week
- **Booking System**: Create bookings with automatic customer management
- **Dashboard UI**: Admin interface for managing all resources
- **Public Booking**: Customer-facing booking interface

## Development Notes

- The API uses snake_case for database fields (matching PostgreSQL convention)
- The dashboard uses environment variables for API URL configuration
- Customer creation is automatic when creating bookings with customer info
- All routes include proper error handling and validation

## License

ISC


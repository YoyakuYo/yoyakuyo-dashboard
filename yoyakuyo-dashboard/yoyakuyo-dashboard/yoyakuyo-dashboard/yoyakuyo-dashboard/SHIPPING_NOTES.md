# Shipping Notes - Bookyo Project

This document identifies which folders/files are **source code** (required) and which are **build artifacts/caches** (safe to delete before shipping).

## ✅ REQUIRED - Source Code & Configuration (DO NOT DELETE)

### Root Level
- `package.json` - Root workspace configuration
- `apps/` - All application source code
- `packages/` - Shared packages (if any)
- `.continue/` - Continue AI configuration (if exists)
- `README.md` - Project documentation
- `SHIPPING_NOTES.md` - This file

### apps/dashboard/ (Next.js Frontend)
**Required Source Files:**
- `app/` - Next.js App Router source code (ALL files)
- `lib/` - Library utilities (supabaseClient.ts, useAuth.tsx, etc.)
- `messages/` - Translation files (en.json, ja.json)
- `components/` - Shared React components
- `middleware.ts` - Next.js middleware
- `i18n.ts` - Internationalization configuration
- `next.config.js` - Next.js configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `scripts/` - Build and utility scripts
- `.env.local` or `.env.example` - Environment variable templates

### apps/api/ (Express.js Backend)
**Required Source Files:**
- `src/` - TypeScript source code (ALL files)
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration
- `scripts/` - Utility scripts
- `.env` or `.env.example` - Environment variable templates

## 🗑️ SAFE TO DELETE - Build Artifacts & Caches

### apps/dashboard/
- `.next/` - Next.js build output and cache
- `node_modules/` - npm dependencies (can be reinstalled with `npm install`)
- `dist/` - Distribution build output (if exists)
- `.turbo/` - Turborepo cache (if exists)
- `tsconfig.tsbuildinfo` - TypeScript incremental build info
- `.env.local` - Local environment variables (contains secrets - DO NOT SHIP)

### apps/api/
- `dist/` - Compiled JavaScript output (can be rebuilt with `npm run build`)
- `node_modules/` - npm dependencies (can be reinstalled with `npm install`)

### Root Level
- `node_modules/` - Root workspace dependencies (can be reinstalled)
- `.git/` - Git history (optional - buyer may want this)

## 📋 Pre-Shipping Checklist

Before handing over the project to a buyer:

1. ✅ Delete all `node_modules/` folders
2. ✅ Delete all `.next/` folders
3. ✅ Delete all `dist/` folders (apps/api/dist, apps/dashboard/dist if exists)
4. ✅ Delete `.turbo/` if exists
5. ✅ Delete `tsconfig.tsbuildinfo` files
6. ✅ Delete `.env.local` files (they contain secrets)
7. ✅ Create `.env.example` files with placeholder values
8. ✅ Ensure all source code in `apps/` is present
9. ✅ Ensure `package.json` files are present
10. ✅ Ensure configuration files (tsconfig.json, next.config.js, etc.) are present

## 🚀 Buyer Setup Instructions

After receiving the project, the buyer should:

1. Run `npm install` in the root directory (installs all workspace dependencies)
2. Copy `.env.example` to `.env.local` in `apps/dashboard/` and fill in values
3. Copy `.env.example` to `.env` in `apps/api/` and fill in values
4. Run `npm run build` to build both applications
5. Run `npm run dev:dashboard` and `npm run dev:api` to start development servers

## 📁 Project Structure Summary

```
bookyo/
├── apps/
│   ├── api/              ✅ Source code (src/, package.json, tsconfig.json)
│   │   └── dist/          🗑️ Delete before shipping
│   └── dashboard/         ✅ Source code (app/, lib/, messages/, etc.)
│       └── .next/         🗑️ Delete before shipping
├── packages/              ✅ Shared packages (if any)
├── package.json           ✅ Root workspace config
└── SHIPPING_NOTES.md      ✅ This file
```

## ⚠️ Important Notes

- **Never ship `.env.local` or `.env` files** - they contain API keys and secrets
- **Always provide `.env.example` files** with placeholder values
- **All source code in `apps/` must be included** - this is the actual project
- **Build artifacts can be regenerated** - buyer will run `npm install` and `npm run build`


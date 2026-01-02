# Supabase Migration Guide

## Overview

This project uses **raw SQL migrations** stored in `supabase/migrations/`. The Supabase CLI is configured to automatically manage schema changes.

## System Detection

✅ **Migration System**: Raw SQL migrations (no ORM detected)
- Location: `supabase/migrations/*.sql`
- No Prisma, Drizzle, or other ORM found
- Direct Supabase JS client usage

## Setup Instructions

### 1. Install Supabase CLI

The CLI is installed via `npx` (no global installation needed).

### 2. Login to Supabase

```bash
npm run supabase:login
```

This will prompt you for an access token. Get it from: https://supabase.com/dashboard/account/tokens

### 3. Link to Your Project

```bash
npm run supabase:link
```

You'll need:
- Project reference ID (from Supabase dashboard)
- Database password (if prompted)

### 4. Pull Current Schema

Before making changes, always pull the current schema:

```bash
npm run supabase:pull
```

This ensures your local schema matches Supabase.

## Migration Workflow

### Automatic Migration (Recommended)

```bash
npm run migrate:auto
```

This script:
1. ✅ Pulls current schema from Supabase
2. ✅ Detects schema changes
3. ✅ Generates migration file
4. ✅ Pushes migration to Supabase

### Manual Migration Steps

1. **Check existing schema:**
   ```bash
   npm run migrate:check
   ```

2. **Generate migration:**
   ```bash
   npm run supabase:diff
   ```

3. **Review the generated migration** in `supabase/migrations/`

4. **Push to Supabase:**
   ```bash
   npm run supabase:push
   ```

## Important Rules

### ✅ DO:
- Always run `supabase:pull` before creating migrations
- Only create migrations for NEW changes
- Check if tables/columns exist before creating them
- Use `IF NOT EXISTS` in SQL when appropriate

### ❌ DON'T:
- Create migrations for existing tables/columns
- Recreate constraints that already exist
- Skip schema checking before migrations
- Apply migrations without reviewing them first

## Migration File Naming

Migrations are automatically named:
- Format: `auto_migration_YYYYMMDD_HHMMSS.sql`
- Example: `auto_migration_20241119_133045.sql`

## Schema Sync

If migrations get out of sync:

1. Pull current schema:
   ```bash
   npm run supabase:pull
   ```

2. Review differences:
   ```bash
   npm run supabase:diff
   ```

3. Apply only new changes:
   ```bash
   npm run supabase:push
   ```

## Available Scripts

- `npm run supabase:login` - Login to Supabase CLI
- `npm run supabase:link` - Link to your Supabase project
- `npm run supabase:pull` - Pull current schema from Supabase
- `npm run supabase:push` - Push migrations to Supabase
- `npm run supabase:diff` - Generate diff migration
- `npm run supabase:status` - Check migration status
- `npm run migrate:check` - Check schema before migrating
- `npm run migrate:safe` - Safe migration with checks
- `npm run migrate:auto` - Automatic migration (recommended)

## Troubleshooting

### "Not logged in" error
```bash
npm run supabase:login
```

### "Project not linked" error
```bash
npm run supabase:link
```

### "Migration conflicts" error
1. Pull current schema: `npm run supabase:pull`
2. Review differences: `npm run supabase:diff`
3. Resolve conflicts manually
4. Push: `npm run supabase:push`

## Next Steps

1. ✅ Run `npm run supabase:login` (you'll need the token)
2. ✅ Run `npm run supabase:link` (you'll need project ID)
3. ✅ Run `npm run supabase:pull` to sync local schema
4. ✅ Use `npm run migrate:auto` for future schema changes


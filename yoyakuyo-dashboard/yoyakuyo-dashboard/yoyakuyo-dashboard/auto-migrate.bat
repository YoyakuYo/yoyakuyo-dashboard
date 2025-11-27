@echo off
REM Auto-migration script for Supabase (Windows)
REM This script generates migrations from schema changes and pushes them to Supabase

setlocal enabledelayedexpansion

echo 🔄 Starting auto-migration process...

REM Step 1: Pull current schema from Supabase to ensure we're in sync
echo 📥 Step 1: Pulling current schema from Supabase...
call npx supabase db pull
if errorlevel 1 (
    echo ❌ Failed to pull schema. Make sure you're logged in and linked to your project.
    echo 💡 Run: npx supabase login
    echo 💡 Then: npx supabase link
    exit /b 1
)

REM Step 2: Generate migration from differences
echo 🔍 Step 2: Detecting schema changes...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c%%a%%b
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do set mytime=%%a%%b
set mytime=!mytime: =0!
set MIGRATION_NAME=auto_migration_%mydate%_%mytime%

REM Generate diff migration
call npx supabase db diff -f "%MIGRATION_NAME%" --local
if errorlevel 1 (
    echo ⚠️  No schema changes detected or diff generation failed.
    echo ✅ Database is up-to-date!
    exit /b 0
)

REM Find the most recent migration file with this name
set MIGRATION_FILE=
for /f "delims=" %%f in ('dir /b /o-d supabase\migrations\*%MIGRATION_NAME%*.sql 2^>nul') do (
    set MIGRATION_FILE=supabase\migrations\%%f
    goto :found
)
:found

if not exist "%MIGRATION_FILE%" (
    echo ✅ No schema changes detected. Database is up-to-date!
    exit /b 0
)

echo ✅ Migration generated: %MIGRATION_FILE%

REM Step 3: Review the migration (optional)
echo 📋 Step 3: Generated migration preview:
echo ---
powershell -Command "Get-Content '%MIGRATION_FILE%' -Head 20"
echo ---
echo.

REM Step 4: Push migration to Supabase
echo 🚀 Step 4: Pushing migration to Supabase...
call npx supabase db push
if errorlevel 1 (
    echo ❌ Failed to push migration. Please review the migration file: %MIGRATION_FILE%
    exit /b 1
)

echo ✅ Migration successfully applied to Supabase!
echo 📝 Migration file: %MIGRATION_FILE%

endlocal


#!/bin/bash
# Auto-migration script for Supabase
# This script generates migrations from schema changes and pushes them to Supabase

set -e  # Exit on error

echo "🔄 Starting auto-migration process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pull current schema from Supabase to ensure we're in sync
echo -e "${YELLOW}📥 Step 1: Pulling current schema from Supabase...${NC}"
npx supabase db pull || {
    echo -e "${RED}❌ Failed to pull schema. Make sure you're logged in and linked to your project.${NC}"
    echo -e "${YELLOW}💡 Run: npx supabase login${NC}"
    echo -e "${YELLOW}💡 Then: npx supabase link${NC}"
    exit 1
}

# Step 2: Generate migration from differences
echo -e "${YELLOW}🔍 Step 2: Detecting schema changes...${NC}"
MIGRATION_NAME="auto_migration_$(date +%Y%m%d_%H%M%S)"

# Generate diff migration
npx supabase db diff -f "$MIGRATION_NAME" --local || {
    echo -e "${YELLOW}⚠️  No schema changes detected or diff generation failed.${NC}"
    echo -e "${GREEN}✅ Database is up-to-date!${NC}"
    exit 0
}

# Check if migration file was created
MIGRATION_FILE="supabase/migrations/$(ls -t supabase/migrations | grep "$MIGRATION_NAME" | head -1)"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${GREEN}✅ No schema changes detected. Database is up-to-date!${NC}"
    exit 0
fi

echo -e "${GREEN}✅ Migration generated: $MIGRATION_FILE${NC}"

# Step 3: Review the migration (optional - can be automated)
echo -e "${YELLOW}📋 Step 3: Generated migration preview:${NC}"
echo "---"
head -20 "$MIGRATION_FILE"
echo "---"
echo ""

# Step 4: Push migration to Supabase
echo -e "${YELLOW}🚀 Step 4: Pushing migration to Supabase...${NC}"
npx supabase db push || {
    echo -e "${RED}❌ Failed to push migration. Please review the migration file: $MIGRATION_FILE${NC}"
    exit 1
}

echo -e "${GREEN}✅ Migration successfully applied to Supabase!${NC}"
echo -e "${GREEN}📝 Migration file: $MIGRATION_FILE${NC}"


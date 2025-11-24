// scripts/auto-migrate-wrapper.js
// Wrapper script that Cursor can call automatically when schema changes are detected
// This ensures migrations are always created safely

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🤖 Auto-Migration Wrapper\n');
console.log('This script is called automatically when schema changes are detected.\n');

// Step 1: Pre-check - Pull current schema
console.log('📥 Step 1: Syncing with Supabase schema...');
try {
  execSync('npx supabase db pull', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..')
  });
} catch (error) {
  console.error('\n❌ Failed to pull schema. Please ensure:');
  console.error('   1. You are logged in: npm run supabase:login');
  console.error('   2. Project is linked: npm run supabase:link\n');
  process.exit(1);
}

// Step 2: Generate diff
console.log('\n🔍 Step 2: Detecting schema changes...');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const migrationName = `auto_migration_${timestamp}`;

try {
  execSync(`npx supabase db diff -f "${migrationName}" --local`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..')
  });
} catch (error) {
  console.log('\n✅ No schema changes detected. Database is up-to-date!');
  process.exit(0);
}

// Step 3: Find generated migration
const MIGRATIONS_DIR = path.join(__dirname, '../../supabase/migrations');
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.includes(migrationName) && f.endsWith('.sql'))
  .sort()
  .reverse();

if (migrationFiles.length === 0) {
  console.log('\n✅ No changes detected. Database is up-to-date!');
  process.exit(0);
}

const migrationFile = path.join(MIGRATIONS_DIR, migrationFiles[0]);
console.log(`\n📝 Generated migration: ${migrationFiles[0]}`);

// Step 4: Preview (first 25 lines)
console.log('\n📋 Migration preview:');
console.log('─'.repeat(60));
const content = fs.readFileSync(migrationFile, 'utf8');
const preview = content.split('\n').slice(0, 25).join('\n');
console.log(preview);
if (content.split('\n').length > 25) {
  console.log(`\n... (${content.split('\n').length - 25} more lines)`);
}
console.log('─'.repeat(60));

// Step 5: Push migration
console.log('\n🚀 Step 3: Pushing migration to Supabase...');
try {
  execSync('npx supabase db push', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..')
  });
  console.log('\n✅ Migration successfully applied!');
  console.log(`📝 Migration file: ${migrationFiles[0]}\n`);
} catch (error) {
  console.error('\n❌ Failed to push migration.');
  console.error(`💡 Review the migration file: ${migrationFiles[0]}`);
  console.error('💡 You may need to resolve conflicts manually.\n');
  process.exit(1);
}

